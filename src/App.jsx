import React, { useState, useEffect, useRef, useCallback } from 'react';
import GameUI from './GameUI';

import { ZONES } from './data/constants';
import { CLASS_CONFIGS } from './data/classes';
import { FORMATIONS_CONFIG } from './data/formations';
import { SKILL_CARDS_DB, createSkillCardInstance } from './data/skillCards';
import { HERO_TEMPLATES, instantiateHero } from './data/heroes';
import { STARTER_WEAPONS_BY_JOB, calculateEquipmentBonus } from './data/equipment';
import { calculateCodexBonus } from './components/SecondaryTabs';

import { getRowPositionBuffs, syncFormationSlots } from './utils/formationHelper';
import { getRandomElement, normalizeHero } from './utils/statCalculator';
import { getPlayerStatScaling } from './utils/combatEngine';
import { MAX_HERO_FUSION, mergeHeroIntoTarget } from './utils/heroFusionHelper';

import { useSaveSystem } from './hooks/useSaveSystem';
import { useRosterAndFormation } from './hooks/useRosterAndFormation';
import { useInventoryAndShop } from './hooks/useInventoryAndShop';
import { useCombatManager } from './hooks/useCombatManager';

export { MAX_HERO_FUSION };

const INITIAL_PLAYER = {
  name: "太古少俠",
  job: "猛將",
  advancement: null,
  element: "金",
  level: 1,
  exp: 0,
  maxExp: 100,
  hp: 320, maxHp: 320,
  mp: 60, maxMp: 60,
  rage: 0, ammo: 12, maxAmmo: 12,
  atk: 36, def: 18, speed: 10,
  gold: 300, refineStones: 4,
  statPoints: 5, sp: 1, tp: 2,
  stats: { str: 10, con: 10, int: 10, agi: 10 },
  skillLevels: { 0: 0, 1: 0, 2: 0 },
  equipped: { weapon: null, offhand: null, helmet: null, armor: null, shoes: null, accessory: null }
};

/**
 * 自動掃描並合併重複的同名英雄（未達 ★+5 時自動突破升星）
 */
function autoFuseDuplicateHeroes(rawRoster, deployedIds = []) {
  const groups = {};
  rawRoster.forEach(h => {
    if (!groups[h.baseId]) groups[h.baseId] = [];
    groups[h.baseId].push(h);
  });

  const consumedIds = new Set();
  const upgradedMap = {};
  const recoveredCards = [];
  const fusionLogs = [];

  Object.values(groups).forEach(group => {
    if (group.length < 2) return;

    // 優先保留已出戰、星級最高、等級最高的本尊
    const sorted = [...group].sort((a, b) => {
      const aDep = deployedIds.includes(a.instanceId) ? 1 : 0;
      const bDep = deployedIds.includes(b.instanceId) ? 1 : 0;
      return (
        bDep - aDep ||
        (b.fusionLevel || 0) - (a.fusionLevel || 0) ||
        (b.level || 1) - (a.level || 1)
      );
    });

    let mainHero = sorted[0];
    let didFuseThisHero = false;

    for (let i = 1; i < sorted.length; i++) {
      const curFusion = Math.min(MAX_HERO_FUSION, mainHero.fusionLevel || 0);
      if (curFusion >= MAX_HERO_FUSION) break;

      const matHero = sorted[i];
      const nextFusion = curFusion + 1;
      mainHero = mergeHeroIntoTarget(mainHero, matHero, nextFusion);
      consumedIds.add(matHero.instanceId);
      didFuseThisHero = true;

      recoveredCards.push(
        ...(matHero.activeSkillSlots || []),
        ...(matHero.passiveSkillSlots || [])
      );

      const milestoneHint = nextFusion === 3
        ? '【覺醒：護主靈罡】'
        : nextFusion === 5
          ? '【覺醒：無雙連攜】'
          : '';
      fusionLogs.push(
        `🌟 獲得重複英雄【${mainHero.name}】，自動同名突破至 ★+${nextFusion}（全屬性 +${nextFusion * 15}%）${milestoneHint}！`
      );
    }

    if (didFuseThisHero) {
      upgradedMap[mainHero.instanceId] = mainHero;
    }
  });

  if (consumedIds.size === 0) {
    return { roster: rawRoster, consumedIds, recoveredCards, fusionLogs };
  }

  const nextRoster = rawRoster
    .filter(h => !consumedIds.has(h.instanceId))
    .map(h => upgradedMap[h.instanceId] || h);

  return { roster: nextRoster, consumedIds, recoveredCards, fusionLogs };
}

export default function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [creationData, setCreationData] = useState({
    name: "太古少俠",
    gender: "male",
    job: "猛將",
    element: "金",
    selectedStarterHero: null
  });
  const [starterHeroCandidates, setStarterHeroCandidates] = useState([]);

  const [player, setPlayer] = useState(INITIAL_PLAYER);
  const [heroRoster, setHeroRosterRaw] = useState([]);
  const [activeHeroInstanceIds, setActiveHeroInstanceIds] = useState([]);
  const [currentFormation, setCurrentFormation] = useState('none');
  const [formationSlots, setFormationSlots] = useState({ 0: 'PLAYER', 2: null, 4: null, 6: null, 8: null });
  const [equipmentInventory, setEquipmentInventory] = useState([]);
  const [skillCardsInventory, setSkillCardsInventory] = useState(() => [
    createSkillCardInstance(SKILL_CARDS_DB[0]),
    createSkillCardInstance(SKILL_CARDS_DB[2]),
    createSkillCardInstance(SKILL_CARDS_DB[6])
  ]);
  const [towerFloor, setTowerFloor] = useState(1);
  const [towerBestFloor, setTowerBestFloor] = useState(1);

  const [activeTab, setActiveTab] = useState('combat');
  const [combatLogs, setCombatLogs] = useState([]);
  const [turnCount, setTurnCount] = useState(1);

  const chatEndRef = useRef(null);
  const isFengShui = player.job === '風水師';

  // 包裝 setHeroRoster：每次名冊變動（包含市集抽卡、戰利品掉落等）自動合併同名分身突破
  const setHeroRoster = useCallback((updater) => {
    setHeroRosterRaw(prev => {
      const nextRaw = typeof updater === 'function' ? updater(prev) : updater;
      if (!Array.isArray(nextRaw)) return nextRaw;

      const { roster, consumedIds, recoveredCards, fusionLogs } = autoFuseDuplicateHeroes(
        nextRaw,
        activeHeroInstanceIds
      );

      if (consumedIds.size > 0) {
        if (recoveredCards.length > 0) {
          setTimeout(() => {
            setSkillCardsInventory(cardsPrev => [...cardsPrev, ...recoveredCards]);
          }, 0);
        }
        if (fusionLogs.length > 0) {
          setTimeout(() => {
            setCombatLogs(logsPrev => [
              ...logsPrev,
              ...fusionLogs.map((text, idx) => ({
                id: Date.now() + Math.random() + idx * 0.001,
                turn: turnCount,
                text,
                type: 'sys'
              }))
            ]);
          }, 0);
        }
      }

      return roster;
    });
  }, [activeHeroInstanceIds, turnCount]);

  // 初始化開局可選夥伴候選名單
  useEffect(() => {
    const t1s = HERO_TEMPLATES.filter(t => t.tier === 1);
    const cands = t1s.map(t => ({
      ...normalizeHero(instantiateHero(t, true, null, getRandomElement)),
      fusionLevel: 0
    }));
    setStarterHeroCandidates(cands);
    setCreationData(prev => ({ ...prev, selectedStarterHero: cands[0] }));
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [combatLogs]);

  // 衍生屬性計算
  const activeHeroes = activeHeroInstanceIds
    .map(id => heroRoster.find(h => h.instanceId === id))
    .filter(Boolean);

  const { bonus: equipBonus, setAtkPct, setHpPct, setMpPct, setDefPct } = calculateEquipmentBonus(player.equipped);
  const codexBonus = calculateCodexBonus(heroRoster);
  const effectiveFormationKey = isFengShui ? currentFormation : 'none';
  const syncedSlots = syncFormationSlots(effectiveFormationKey, formationSlots, activeHeroInstanceIds);
  const playerGridIdx = Number(Object.keys(syncedSlots).find(k => syncedSlots[k] === 'PLAYER') ?? 0);
  const playerRowBuff = getRowPositionBuffs(playerGridIdx);

  const getHeroRowIdx = useCallback((heroInstanceId) => {
    const foundKey = Object.keys(syncedSlots).find(k => syncedSlots[k] === heroInstanceId);
    return foundKey !== undefined ? Math.floor(Number(foundKey) / 3) : 1;
  }, [syncedSlots]);

  const rawFormBonus = FORMATIONS_CONFIG[effectiveFormationKey]?.bonus || {};
  const formMultiplier = isFengShui ? 2 : 1;
  const statScaling = getPlayerStatScaling(player.job);

  const playerTotalMaxHp = Math.floor((player.maxHp + (player.stats.con * statScaling.conHp) + equipBonus.hp) * (1 + setHpPct + ((rawFormBonus.hpPct || 0) * formMultiplier) + codexBonus.hpPct));
  const playerTotalMaxMp = Math.floor((player.maxMp + (player.stats.int * 10) + equipBonus.mp) * (1 + setMpPct));
  const playerTotalAtk = Math.floor((player.atk + statScaling.calcStatAtk(player.stats) + equipBonus.atk) * (1 + setAtkPct + ((rawFormBonus.atkPct || 0) * formMultiplier) + codexBonus.atkPct));
  const playerTotalDef = Math.floor((player.def + (player.stats.con * statScaling.conDef) + equipBonus.def) * (1 + (setDefPct || 0) + ((rawFormBonus.defPct || 0) * formMultiplier) + codexBonus.defPct));
  const playerTotalSpeed = Math.floor((player.speed + (player.stats.agi * 1) + equipBonus.speed) * (1 + ((rawFormBonus.speedPct || 0) * formMultiplier) + (playerRowBuff.speedPct || 0) + codexBonus.speedPct));

  const addLog = useCallback((text, type = 'info') => {
    setCombatLogs(prev => [...prev, { id: Date.now() + Math.random(), turn: turnCount, text, type }]);
  }, [turnCount]);

  const appendBatchLogs = useCallback((entries = []) => {
    if (!entries.length) return;
    setCombatLogs(prev => [
      ...prev,
      ...entries.map((entry, i) => ({
        id: Date.now() + Math.random() + i * 0.001,
        turn: turnCount,
        text: entry.text,
        type: entry.type || 'info',
        dmgRole: entry.dmgRole || null
      }))
    ]);
  }, [turnCount]);

  // 1. 戰鬥與推圖管理 Hook
  const combat = useCombatManager({
    gameStarted,
    player,
    setPlayer,
    heroRoster,
    setHeroRoster,
    activeHeroInstanceIds,
    activeHeroes,
    isFengShui,
    getHeroRowIdx,
    playerTotalMaxHp,
    playerTotalMaxMp,
    playerTotalAtk,
    playerTotalDef,
    playerTotalSpeed,
    playerRowBuff,
    rawFormBonus,
    formMultiplier,
    setEquipmentInventory,
    setSkillCardsInventory,
    towerFloor,
    setTowerFloor,
    setTowerBestFloor,
    setActiveTab,
    turnCount,
    setTurnCount,
    addLog,
    appendBatchLogs
  });

  // 2. 存檔與讀檔管理 Hook
  const saveSystem = useSaveSystem({
    initialPlayer: INITIAL_PLAYER,
    gameStarted,
    setGameStarted,
    isInCombat: combat.isInCombat,
    player,
    setPlayer,
    heroRoster,
    setHeroRoster,
    activeHeroInstanceIds,
    setActiveHeroInstanceIds,
    currentFormation,
    setCurrentFormation,
    formationSlots,
    setFormationSlots,
    syncedSlots,
    equipmentInventory,
    setEquipmentInventory,
    skillCardsInventory,
    setSkillCardsInventory,
    towerFloor,
    setTowerFloor,
    towerBestFloor,
    setTowerBestFloor,
    setActiveTowerFloor: combat.setActiveTowerFloor,
    setMonsters: combat.setMonsters,
    resetCombatStates: combat.resetCombatStates,
    setAutoBattle: combat.setAutoBattle
  });

  // 3. 英雄名冊、合成、技能卡與陣法管理 Hook
  const roster = useRosterAndFormation({
    isInCombat: combat.isInCombat,
    player,
    heroRoster,
    setHeroRoster,
    activeHeroInstanceIds,
    setActiveHeroInstanceIds,
    activeHeroes,
    effectiveFormationKey,
    setCurrentFormation,
    setFormationSlots,
    setSkillCardsInventory,
    addLog
  });

  // 4. 裝備背包、鐵匠鋪與江湖市集管理 Hook
  const inventory = useInventoryAndShop({
    isInCombat: combat.isInCombat,
    isFengShui,
    player,
    setPlayer,
    playerTotalMaxHp,
    playerTotalMaxMp,
    equipmentInventory,
    setEquipmentInventory,
    setSkillCardsInventory,
    setHeroRoster,
    getHeroRowIdx,
    addLog
  });

  const handleStartGame = () => {
    const jobConfig = CLASS_CONFIGS[creationData.job];
    const starterHero = { ...normalizeHero(creationData.selectedStarterHero), fusionLevel: 0 };
    const starterWeaponTemplate = STARTER_WEAPONS_BY_JOB[creationData.job];
    const starterWeapon = starterWeaponTemplate
      ? { ...starterWeaponTemplate, refineLevel: 0, uid: `eq_starter_${Date.now()}` }
      : null;

    const newPlayer = {
      ...INITIAL_PLAYER,
      name: creationData.name || "太古少俠",
      job: creationData.job,
      element: creationData.element,
      maxHp: jobConfig.baseHp, hp: jobConfig.baseHp,
      maxMp: jobConfig.baseMp, mp: jobConfig.baseMp,
      atk: jobConfig.baseAtk, def: jobConfig.baseDef, speed: jobConfig.baseSpeed,
      equipped: {
        weapon: starterWeapon,
        offhand: null,
        helmet: null,
        armor: null,
        shoes: null,
        accessory: null
      }
    };

    setPlayer(newPlayer);
    setEquipmentInventory([]);
    setHeroRosterRaw([starterHero]);
    setActiveHeroInstanceIds([starterHero.instanceId]);
    setCurrentFormation('none');
    setFormationSlots(syncFormationSlots('none', {}, [starterHero.instanceId]));
    setTowerFloor(1);
    setTowerBestFloor(1);
    combat.setActiveTowerFloor(null);
    combat.setAutoTower(false);
    combat.setMonsters([]);
    combat.setLastRoundHits({ monsters: {}, allies: {} });
    setGameStarted(true);
    setCombatLogs([
      {
        id: 1,
        turn: 1,
        type: 'sys',
        text: `📜 少俠【${newPlayer.name}】（${newPlayer.job} • ${newPlayer.element}本命）手持新手武器【${starterWeapon?.name || '長劍'}】踏入《天外 Online》！開局獲贈 1 點 SP，可先前往「✨ 技能樹」學習首招技能！`
      }
    ]);
  };

  return (
    <GameUI
      gameStarted={gameStarted}
      isInCombat={combat.isInCombat}
      activeTowerFloor={combat.activeTowerFloor}
      autoBattle={combat.autoBattle}
      handleToggleAutoBattle={combat.handleToggleAutoBattle}
      autoTower={combat.autoTower}
      handleToggleAutoTower={combat.handleToggleAutoTower}
      creationData={creationData}
      setCreationData={setCreationData}
      starterHeroCandidates={starterHeroCandidates}
      handleStartGame={handleStartGame}
      player={player}
      setPlayer={setPlayer}
      playerTotalMaxHp={playerTotalMaxHp}
      playerTotalMaxMp={playerTotalMaxMp}
      playerTotalAtk={playerTotalAtk}
      playerTotalDef={playerTotalDef}
      playerTotalSpeed={playerTotalSpeed}
      activeHeroes={activeHeroes}
      activeHeroInstanceIds={activeHeroInstanceIds}
      heroRoster={heroRoster}
      setHeroRoster={setHeroRoster}
      handleToggleDeployHero={roster.handleToggleDeployHero}
      handleFuseHero={roster.handleFuseHero}
      handleFuseAllHeroes={roster.handleFuseAllHeroes}
      fusionFeedback={roster.fusionFeedback}
      MAX_HERO_FUSION={MAX_HERO_FUSION}
      handleReleaseHero={roster.handleReleaseHero}
      handleEquipSkillCard={roster.handleEquipSkillCard}
      handleUnequipSkillCard={roster.handleUnequipSkillCard}
      handleRestInn={combat.handleRestInn}
      handleEquipItem={inventory.handleEquipItem}
      handleUnequipItem={inventory.handleUnequipItem}
      handleSellEquipment={inventory.handleSellEquipment}
      handleBulkSellUnusableEquipment={inventory.handleBulkSellUnusableEquipment}
      handleSelectFormation={roster.handleSelectFormation}
      formationSlots={syncedSlots}
      handleSwapFormationSlots={roster.handleSwapFormationSlots}
      handleSelectZone={combat.handleSelectZone}
      handleSweepZone={combat.handleSweepZone}
      handleFleeCombat={combat.handleFleeCombat}
      monsters={combat.monsters}
      selectedTargetIndex={combat.selectedTargetIndex}
      setSelectedTargetIndex={combat.setSelectedTargetIndex}
      combatLogs={combatLogs}
      lastRoundHits={combat.lastRoundHits}
      combatBuffs={combat.combatBuffs}
      heroBattleBuffs={combat.heroBattleBuffs}
      turnCount={turnCount}
      combatPhase={combat.combatPhase}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      currentZoneIndex={combat.currentZoneIndex}
      spawnEncounter={combat.spawnEncounter}
      handleExecuteRound={combat.handleExecuteRound}
      equipmentInventory={equipmentInventory}
      setEquipmentInventory={setEquipmentInventory}
      skillCardsInventory={skillCardsInventory}
      setSkillCardsInventory={setSkillCardsInventory}
      forgeFeedback={inventory.forgeFeedback}
      handleRefineEquipment={inventory.handleRefineEquipment}
      handleSocketGem={inventory.handleSocketGem}
      shopLastReward={inventory.shopLastReward}
      handleShopPurchase={inventory.handleShopPurchase}
      currentFormation={effectiveFormationKey}
      towerFloor={towerFloor}
      towerBestFloor={towerBestFloor}
      handleStartTowerChallenge={combat.handleStartTowerChallenge}
      jsonSaveText={saveSystem.jsonSaveText}
      setJsonSaveText={saveSystem.setJsonSaveText}
      saveLoadStatus={saveSystem.saveLoadStatus}
      handleExportSave={saveSystem.handleExportSave}
      handleImportSave={saveSystem.handleImportSave}
      handleResetSave={saveSystem.handleResetSave}
      victorySummary={combat.victorySummary}
      setVictorySummary={combat.setVictorySummary}
      defeatSummary={combat.defeatSummary}
      setDefeatSummary={combat.setDefeatSummary}
      chatEndRef={chatEndRef}
    />
  );
}
