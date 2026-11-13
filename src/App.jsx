import React, { useState, useEffect, useRef } from 'react';
import GameUI from './GameUI';

import { MAX_LEVEL, MAX_SKILL_LEVEL, LOCAL_STORAGE_KEY, ZONES } from './data/constants';
import { CLASS_CONFIGS } from './data/classes';
import { FORMATIONS_CONFIG } from './data/formations';
import { SKILL_CARDS_DB, createSkillCardInstance } from './data/skillCards';
import { HERO_TEMPLATES, instantiateHero } from './data/heroes';
import {
  STARTER_WEAPONS_BY_JOB,
  calculateEquipmentBonus,
  enrichEquipmentMeta,
  rollEquipmentFromTierRange,
  getRefineSuccessRate,
  getCumulativeRefineBonusPct
} from './data/equipment';
import { calculateCodexBonus } from './components/SecondaryTabs';

import { getRowPositionBuffs, syncFormationSlots } from './utils/formationHelper';
import {
  getRandomElement,
  calculateHeroEffectiveStats,
  normalizeHero
} from './utils/statCalculator';
import {
  CURRENT_SAVE_VERSION,
  buildExportSaveData,
  migrateAndValidateSave
} from './utils/saveHelper';
import {
  getPlayerStatScaling,
  resolveCombatRound,
  resolveFleeCombat,
  pickBestAutoCombatAction,
  simulateZoneSweep,
  getZoneSweepReqLevel
} from './utils/combatEngine';

export const MAX_HERO_FUSION = 5;

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

function mergeHeroIntoTarget(targetHero, materialHero, nextFusion) {
  const mergedLevel = Math.min(MAX_LEVEL, Math.max(targetHero.level || 1, materialHero.level || 1));
  const mergedMaxExp = Math.floor(100 * Math.pow(mergedLevel, 1.3));
  const absorbedExp = Math.floor((materialHero.exp || 0) * 0.5) + 50;
  const mergedExp = mergedLevel >= MAX_LEVEL
    ? 0
    : Math.min(mergedMaxExp - 1, (targetHero.exp || 0) + absorbedExp);

  const tStats = targetHero.stats || { str: 4, con: 4, int: 2, agi: 2 };
  const mStats = materialHero.stats || { str: 4, con: 4, int: 2, agi: 2 };
  const primaryBonus = targetHero.heroClass === '猛將'
    ? { str: 2, con: 1, int: 0, agi: 0 }
    : targetHero.heroClass === '巧匠'
      ? { str: 1, con: 0, int: 0, agi: 2 }
      : { str: 0, con: 1, int: 2, agi: 0 };

  const mergedStats = {
    str: Math.max(tStats.str, mStats.str) + primaryBonus.str,
    con: Math.max(tStats.con, mStats.con) + primaryBonus.con,
    int: Math.max(tStats.int, mStats.int) + primaryBonus.int,
    agi: Math.max(tStats.agi, mStats.agi) + primaryBonus.agi
  };

  const tier = targetHero.tier || 1;
  const fusionStatMult = 1 + (nextFusion * 0.15);
  const newMaxHp = Math.floor((140 + (tier * 50) + (mergedStats.con * 18)) * fusionStatMult);
  const newAtk = Math.floor((18 + (tier * 12) + (mergedStats.str * 3.2) + (mergedStats.int * 2.2)) * fusionStatMult);
  const newDef = Math.floor((6 + (tier * 4) + (mergedStats.con * 1.2)) * fusionStatMult);
  const newSpeed = Math.floor((10 + (tier * 2) + (mergedStats.agi * 2)) * fusionStatMult);

  return {
    ...targetHero,
    level: mergedLevel,
    exp: mergedExp,
    maxExp: mergedMaxExp,
    fusionLevel: nextFusion,
    stats: mergedStats,
    maxHp: newMaxHp,
    hp: newMaxHp,
    atk: newAtk,
    def: newDef,
    speed: newSpeed
  };
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
  const [heroRoster, setHeroRoster] = useState([]);
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
  const [activeTowerFloor, setActiveTowerFloor] = useState(null);

  const [activeTab, setActiveTab] = useState('combat');
  const [currentZoneIndex, setCurrentZoneIndex] = useState(0);
  const [monsters, setMonsters] = useState([]);
  const [selectedTargetIndex, setSelectedTargetIndex] = useState(0);
  const [combatLogs, setCombatLogs] = useState([]);
  const [lastRoundHits, setLastRoundHits] = useState({ monsters: {}, allies: {} });
  const [turnCount, setTurnCount] = useState(1);
  const [combatPhase, setCombatPhase] = useState('PLAYER_SELECT');
  const [autoBattle, setAutoBattle] = useState(false);
  const [victorySummary, setVictorySummary] = useState(null);
  const [defeatSummary, setDefeatSummary] = useState(null);
  const [shopLastReward, setShopLastReward] = useState('');
  const [forgeFeedback, setForgeFeedback] = useState(null);
  const [fusionFeedback, setFusionFeedback] = useState(null);

  const [combatBuffs, setCombatBuffs] = useState({
    shield: 0,
    tauntTurns: 0,
    reflectTurns: 0,
    reflectPct: 0,
    baguaTurns: 0,
    baguaReducePct: 0,
    baguaReflectPct: 0,
    skillCooldowns: { 0: 0, 1: 0, 2: 0 }
  });
  const [heroBattleBuffs, setHeroBattleBuffs] = useState({});
  const [battleDownedHeroIds, setBattleDownedHeroIds] = useState([]);

  const [jsonSaveText, setJsonSaveText] = useState('');
  const [saveLoadStatus, setSaveLoadStatus] = useState('');

  const chatEndRef = useRef(null);
  const isInCombat = monsters.some(m => m.hp > 0);
  const isFengShui = player.job === '風水師';

  const applyMigratedSaveState = (migratedData) => {
    const rawP = migratedData.player;
    const loadedP = {
      ...rawP,
      level: Math.min(MAX_LEVEL, rawP.level || 1),
      maxAmmo: rawP.job === '巧匠' ? 12 : (rawP.maxAmmo || 12),
      skillLevels: {
        0: Math.min(MAX_SKILL_LEVEL, rawP.skillLevels?.[0] ?? 0),
        1: Math.min(MAX_SKILL_LEVEL, rawP.skillLevels?.[1] ?? 0),
        2: Math.min(MAX_SKILL_LEVEL, rawP.skillLevels?.[2] ?? 0)
      }
    };
    const loadedForm = loadedP.job === '風水師' ? (migratedData.currentFormation || 'none') : 'none';
    const loadedActiveIds = migratedData.activeHeroInstanceIds || [];
    const loadedFloor = Math.max(1, migratedData.towerFloor || 1);

    setPlayer(loadedP);
    setHeroRoster((migratedData.heroRoster || []).map(h => ({
      ...normalizeHero(h),
      fusionLevel: Math.min(MAX_HERO_FUSION, Math.max(0, h.fusionLevel || 0))
    })));
    setActiveHeroInstanceIds(loadedActiveIds);
    setCurrentFormation(loadedForm);
    setFormationSlots(syncFormationSlots(loadedForm, migratedData.formationSlots || {}, loadedActiveIds));
    setEquipmentInventory(migratedData.equipmentInventory || []);
    setSkillCardsInventory(migratedData.skillCardsInventory || []);
    setTowerFloor(loadedFloor);
    setTowerBestFloor(Math.max(loadedFloor, migratedData.towerBestFloor || loadedFloor));
    setActiveTowerFloor(null);
  };

  useEffect(() => {
    const t1s = HERO_TEMPLATES.filter(t => t.tier === 1);
    const cands = t1s.map(t => ({
      ...normalizeHero(instantiateHero(t, true, null, getRandomElement)),
      fusionLevel: 0
    }));
    setStarterHeroCandidates(cands);
    setCreationData(prev => ({ ...prev, selectedStarterHero: cands[0] }));

    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const res = migrateAndValidateSave(parsed, { player: INITIAL_PLAYER });
        if (res.ok && res.data) {
          applyMigratedSaveState(res.data);
          setGameStarted(true);
        }
      }
    } catch (e) {
      console.warn('自動載入存檔失敗', e);
    }
  }, []);

  useEffect(() => {
    if (gameStarted) {
      try {
        const saveData = buildExportSaveData({
          player,
          heroRoster,
          activeHeroInstanceIds,
          currentFormation,
          formationSlots,
          equipmentInventory,
          skillCardsInventory,
          towerFloor,
          towerBestFloor
        });
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(saveData));
      } catch (e) {
        console.warn('自動存檔失敗', e);
      }
    }
  }, [player, heroRoster, activeHeroInstanceIds, currentFormation, formationSlots, equipmentInventory, skillCardsInventory, towerFloor, towerBestFloor, gameStarted]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [combatLogs]);

  // 🤖 自動戰鬥排程
  useEffect(() => {
    if (!gameStarted || !autoBattle || !isInCombat || combatPhase !== 'PLAYER_SELECT') return;
    const timer = setTimeout(() => {
      const classSkills = CLASS_CONFIGS[player.job]?.skills || [];
      const nextAction = pickBestAutoCombatAction(
        player,
        classSkills,
        combatBuffs,
        activeHeroInstanceIds,
        heroRoster
      );
      handleExecuteRound(nextAction);
    }, 450);

    return () => clearTimeout(timer);
  });

  const activeHeroes = activeHeroInstanceIds
    .map(id => heroRoster.find(h => h.instanceId === id))
    .filter(Boolean);

  const { bonus: equipBonus, setAtkPct, setHpPct, setMpPct, setDefPct } = calculateEquipmentBonus(player.equipped);
  const codexBonus = calculateCodexBonus(heroRoster);
  const effectiveFormationKey = isFengShui ? currentFormation : 'none';
  const syncedSlots = syncFormationSlots(effectiveFormationKey, formationSlots, activeHeroInstanceIds);
  const playerGridIdx = Number(Object.keys(syncedSlots).find(k => syncedSlots[k] === 'PLAYER') ?? 0);
  const playerRowBuff = getRowPositionBuffs(playerGridIdx);

  const getHeroRowIdx = (heroInstanceId) => {
    const foundKey = Object.keys(syncedSlots).find(k => syncedSlots[k] === heroInstanceId);
    return foundKey !== undefined ? Math.floor(Number(foundKey) / 3) : 1;
  };

  const rawFormBonus = FORMATIONS_CONFIG[effectiveFormationKey]?.bonus || {};
  const formMultiplier = isFengShui ? 2 : 1;
  const statScaling = getPlayerStatScaling(player.job);

  const playerTotalMaxHp = Math.floor((player.maxHp + (player.stats.con * statScaling.conHp) + equipBonus.hp) * (1 + setHpPct + ((rawFormBonus.hpPct || 0) * formMultiplier) + codexBonus.hpPct));
  const playerTotalMaxMp = Math.floor((player.maxMp + (player.stats.int * 10) + equipBonus.mp) * (1 + setMpPct));
  const playerTotalAtk = Math.floor((player.atk + statScaling.calcStatAtk(player.stats) + equipBonus.atk) * (1 + setAtkPct + ((rawFormBonus.atkPct || 0) * formMultiplier) + codexBonus.atkPct));
  const playerTotalDef = Math.floor((player.def + (player.stats.con * statScaling.conDef) + equipBonus.def) * (1 + (setDefPct || 0) + ((rawFormBonus.defPct || 0) * formMultiplier) + codexBonus.defPct));
  const playerTotalSpeed = Math.floor((player.speed + (player.stats.agi * 1) + equipBonus.speed) * (1 + ((rawFormBonus.speedPct || 0) * formMultiplier) + (playerRowBuff.speedPct || 0) + codexBonus.speedPct));

  const addLog = (text, type = 'info') => {
    setCombatLogs(prev => [...prev, { id: Date.now() + Math.random(), turn: turnCount, text, type }]);
  };

  const appendBatchLogs = (entries = []) => {
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
  };

  const handleToggleAutoBattle = () => {
    setAutoBattle(prev => {
      const next = !prev;
      addLog(
        next
          ? '🤖 已開啟【智能自動戰鬥】：AI 將自動釋放冷卻完畢的技能與普攻（隨時可點擊關閉接管）！'
          : '🖐️ 已關閉【智能自動戰鬥】，切換為手動戰術操作！',
        'sys'
      );
      return next;
    });
  };

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
    setHeroRoster([starterHero]);
    setActiveHeroInstanceIds([starterHero.instanceId]);
    setCurrentFormation('none');
    setFormationSlots(syncFormationSlots('none', {}, [starterHero.instanceId]));
    setTowerFloor(1);
    setTowerBestFloor(1);
    setActiveTowerFloor(null);
    setMonsters([]);
    setLastRoundHits({ monsters: {}, allies: {} });
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

  const handleSelectZone = (zoneIdx) => {
    if (isInCombat) {
      addLog(`🔒 戰鬥中無法切換地圖！`, 'sys');
      return;
    }
    setCurrentZoneIndex(zoneIdx);
    setActiveTowerFloor(null);
    setMonsters([]);
    setLastRoundHits({ monsters: {}, allies: {} });
    addLog(`🗺️ 已前往【${ZONES[zoneIdx].name}】安全營地，請點擊「🔍 尋找怪群」或「⚡ 快速掃蕩」！`, 'sys');
  };

  /**
   * 計算出戰 ★+3 覺醒英雄帶來的開戰護盾與真元加成
   */
  const computeOpeningAwakeningBonus = (deployedHeroes) => {
    const awakenedList = deployedHeroes.filter(h => h.hp > 0 && (h.fusionLevel || 0) >= 3);
    let openingShield = 0;
    awakenedList.forEach(h => {
      const { effectiveMaxHp } = calculateHeroEffectiveStats(
        h,
        isFengShui,
        null,
        getHeroRowIdx(h.instanceId)
      );
      openingShield += Math.floor(effectiveMaxHp * 0.15);
    });
    return { awakenedList, openingShield };
  };

  const resetCombatStates = (initialShield = 0) => {
    setCombatBuffs({
      shield: initialShield,
      tauntTurns: 0,
      reflectTurns: 0,
      reflectPct: 0,
      baguaTurns: 0,
      baguaReducePct: 0,
      baguaReflectPct: 0,
      skillCooldowns: { 0: 0, 1: 0, 2: 0 }
    });
    setHeroBattleBuffs({});
    setBattleDownedHeroIds([]);
    setLastRoundHits({ monsters: {}, allies: {} });
  };

  const spawnEncounter = (zoneIdx, customActiveHeroes = null) => {
    if (isInCombat) {
      addLog(`⚠️ 當前已在戰鬥中，請先擊敗敵軍或嘗試撤退！`, 'sys');
      return [];
    }
    if (player.hp <= 0) {
      addLog(`⚠️ 少俠氣血耗盡，請先前往客棧休息恢復再搜敵！`, 'danger');
      return [];
    }

    const deployed = customActiveHeroes !== null ? customActiveHeroes : activeHeroes;
    const totalCombatants = 1 + deployed.length;
    const count = Math.floor(Math.random() * (totalCombatants * 2)) + Math.max(2, totalCombatants);

    const zone = ZONES[zoneIdx];
    const zoneScale = 1 + (zoneIdx * 0.22);
    const list = [];
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    for (let i = 0; i < count; i++) {
      const template = zone.monsters[Math.floor(Math.random() * zone.monsters.length)];
      const randElem = getRandomElement();
      const isElite = Math.random() < 0.25;
      const eliteHpMult = isElite ? 1.35 : 1.0;
      const eliteAtkMult = isElite ? 1.20 : 1.0;
      const eliteDefMult = isElite ? 1.20 : 1.0;
      const eliteRewardMult = isElite ? 1.40 : 1.0;

      const scaledHp = Math.floor(template.hp * 1.45 * zoneScale * eliteHpMult);
      const scaledAtk = Math.floor(template.atk * 1.32 * zoneScale * eliteAtkMult);
      const scaledDef = Math.floor(template.def * 1.35 * zoneScale * eliteDefMult);
      const scaledSpeed = Math.floor((9 + (zoneIdx * 4) + Math.floor(Math.random() * 4)) * (isElite ? 1.15 : 1.0));

      list.push({
        id: `m_${Date.now()}_${i}`,
        isElite,
        name: `${isElite ? '🔥精英・' : ''}${template.name} ${alphabet[i] || i + 1}`,
        element: randElem,
        originalElement: randElem,
        maxHp: scaledHp,
        hp: scaledHp,
        atk: scaledAtk,
        def: scaledDef,
        speed: scaledSpeed,
        exp: Math.floor(template.exp * eliteRewardMult),
        gold: Math.floor(template.gold * eliteRewardMult),
        armorBreakTurns: 0, armorBreakPct: 0,
        blindTurns: 0, blindPct: 0,
        elemShiftTurns: 0,
        burnTurns: 0, burnDmg: 0,
        poisonTurns: 0, poisonPct: 0, poisonStacks: 0,
        vulnTurns: 0, vulnPct: 0
      });
    }

    const { awakenedList, openingShield } = computeOpeningAwakeningBonus(deployed);
    const awakenCount = awakenedList.length;

    setPlayer(prev => ({
      ...prev,
      ammo: prev.job === '巧匠' ? 12 : prev.ammo,
      maxAmmo: prev.job === '巧匠' ? 12 : prev.maxAmmo,
      rage: prev.job === '猛將' ? Math.min(100, awakenCount * 15) : prev.rage,
      mp: ['術士', '藥師', '風水師'].includes(prev.job)
        ? Math.min(playerTotalMaxMp, prev.mp + (awakenCount * 20))
        : prev.mp
    }));

    if (player.job === '巧匠') {
      addLog(`🏹 【連環機巧】巧匠開戰前裝填完畢，機關彈藥補滿至 12/12！`, 'sys');
    }
    if (awakenCount > 0) {
      addLog(
        `🌟 【★+3 護主靈罡覺醒】${awakenedList.map(h => h.name).join('、')} 激發護體真氣，開戰提供 +${openingShield} 點護盾並補充少俠初始真元！`,
        'sys'
      );
    }

    resetCombatStates(openingShield);
    setActiveTowerFloor(null);
    setMonsters(list);
    setSelectedTargetIndex(0);
    setTurnCount(1);
    setCombatPhase('PLAYER_SELECT');
    addLog(`⚔️ 【${zone.name}】主動搜敵遭遇 ${list.length} 隻敵怪！戰鬥開始${autoBattle ? '（🤖 自動戰鬥託管中）' : ''}！`, 'sys');
    return list;
  };

  const handleSweepZone = (sweepCount = 3) => {
    if (isInCombat) {
      addLog(`🔒 戰鬥進行中，無法進行快速掃蕩！`, 'sys');
      return;
    }
    if (player.hp <= 1) {
      addLog(`⚠️ 少俠重傷瀕死（氣血 ≤ 1），請先前往客棧休養恢復再進行掃蕩！`, 'danger');
      return;
    }

    const reqLvl = getZoneSweepReqLevel(currentZoneIndex);
    if ((player.level || 1) < reqLvl) {
      addLog(`🔒 【${ZONES[currentZoneIndex]?.name}】需少俠達到 Lv.${reqLvl} 方可解鎖快速掃蕩！`, 'sys');
      return;
    }

    const classSkills = CLASS_CONFIGS[player.job]?.skills || [];
    const res = simulateZoneSweep({
      player,
      currentRoster: heroRoster,
      activeHeroInstanceIds,
      currentZoneIndex,
      sweepCount,
      isFengShui,
      getHeroRowIdx,
      classSkills,
      playerTotalMaxHp,
      playerTotalMaxMp,
      playerTotalAtk,
      playerTotalDef,
      playerTotalSpeed,
      playerRowBuff,
      rawFormBonus,
      formMultiplier
    });

    setPlayer(res.newPlayer);
    setHeroRoster(res.finalRoster);
    if (res.allDroppedEquipments?.length > 0) {
      setEquipmentInventory(prev => [...prev, ...res.allDroppedEquipments]);
    }
    if (res.allDroppedSkillCards?.length > 0) {
      setSkillCardsInventory(prev => [...prev, ...res.allDroppedSkillCards]);
    }

    const { completedBattles = 0, gold = 0, exp = 0, stones = 0 } = res.sweepSummary;

    if (res.isDefeated) {
      setVictorySummary(res.sweepSummary);
      addLog(
        `☠️ 快速掃蕩【${ZONES[currentZoneIndex]?.name}】中途戰敗（僅完成 ${completedBattles}/${sweepCount} 場）！隊伍力竭重傷被迫中止，累計獲得 +${gold} 金幣、+${exp} 經驗${stones > 0 ? `、+${stones} 精鍊石` : ''}。`,
        'danger'
      );
    } else {
      setVictorySummary(res.sweepSummary);
      addLog(
        `⚡ 快速掃蕩【${ZONES[currentZoneIndex]?.name}】完成 ${completedBattles}/${sweepCount} 場！累計獲得 +${gold} 金幣、+${exp} 經驗${stones > 0 ? `、+${stones} 精鍊石` : ''}！`,
        'sys'
      );
    }
  };

  const handleStartTowerChallenge = () => {
    if (isInCombat) {
      addLog(`⚠️ 當前已在戰鬥中，無法開啟新的鎮魔塔挑戰！`, 'sys');
      return;
    }
    if (player.hp <= 0) {
      addLog(`⚠️ 少俠氣血耗盡，請先前往客棧休息恢復再挑戰鎮魔塔！`, 'danger');
      return;
    }

    const floor = towerFloor;
    const isBossFloor = floor % 5 === 0;
    const hpScale = 1.25 * (1 + (floor - 1) * 0.28);
    const atkScale = 1.20 * (1 + (floor - 1) * 0.22);
    const defScale = 1.20 * (1 + (floor - 1) * 0.18);
    const rewardScale = 1 + (floor - 1) * 0.22;

    const baseZone = ZONES[Math.min(ZONES.length - 1, Math.floor((floor - 1) / 5))];
    const basePool = baseZone.monsters;
    const list = [];

    if (isBossFloor) {
      const bossTemplate = basePool[basePool.length - 1];
      const bossElem = getRandomElement();
      list.push({
        id: `tower_boss_${Date.now()}`,
        isBoss: true,
        name: `第${floor}層鎮守妖王・${bossTemplate.name}`,
        element: bossElem,
        originalElement: bossElem,
        maxHp: Math.floor(bossTemplate.hp * hpScale * 2.6),
        hp: Math.floor(bossTemplate.hp * hpScale * 2.6),
        atk: Math.floor(bossTemplate.atk * atkScale * 1.55),
        def: Math.floor(bossTemplate.def * defScale * 1.4),
        speed: Math.floor(14 + (floor * 1.3)),
        exp: Math.floor(bossTemplate.exp * rewardScale * 2.5),
        gold: Math.floor(bossTemplate.gold * rewardScale * 2.5),
        armorBreakTurns: 0, armorBreakPct: 0,
        blindTurns: 0, blindPct: 0,
        elemShiftTurns: 0,
        burnTurns: 0, burnDmg: 0,
        poisonTurns: 0, poisonPct: 0, poisonStacks: 0,
        vulnTurns: 0, vulnPct: 0
      });

      for (let i = 0; i < 2; i++) {
        const guardTpl = basePool[i % basePool.length];
        const guardElem = getRandomElement();
        list.push({
          id: `tower_guard_${Date.now()}_${i}`,
          isElite: true,
          name: `妖王護法 ${i === 0 ? '左使' : '右使'}`,
          element: guardElem,
          originalElement: guardElem,
          maxHp: Math.floor(guardTpl.hp * hpScale * 1.25),
          hp: Math.floor(guardTpl.hp * hpScale * 1.25),
          atk: Math.floor(guardTpl.atk * atkScale * 1.15),
          def: Math.floor(guardTpl.def * defScale * 1.1),
          speed: Math.floor(12 + (floor * 1.15)),
          exp: Math.floor(guardTpl.exp * rewardScale),
          gold: Math.floor(guardTpl.gold * rewardScale),
          armorBreakTurns: 0, armorBreakPct: 0,
          blindTurns: 0, blindPct: 0,
          elemShiftTurns: 0,
          burnTurns: 0, burnDmg: 0,
          poisonTurns: 0, poisonPct: 0, poisonStacks: 0,
          vulnTurns: 0, vulnPct: 0
        });
      }
    } else {
      const guardCount = Math.min(6, 3 + Math.floor(floor / 5));
      const alphabet = '甲乙丙丁戊己';
      for (let i = 0; i < guardCount; i++) {
        const tpl = basePool[i % basePool.length];
        const elem = getRandomElement();
        list.push({
          id: `tower_m_${Date.now()}_${i}`,
          name: `${floor}層守衛・${tpl.name}${alphabet[i] || ''}`,
          element: elem,
          originalElement: elem,
          maxHp: Math.floor(tpl.hp * hpScale),
          hp: Math.floor(tpl.hp * hpScale),
          atk: Math.floor(tpl.atk * atkScale),
          def: Math.floor(tpl.def * defScale),
          speed: Math.floor(10 + (floor * 1.1) + i),
          exp: Math.floor(tpl.exp * rewardScale),
          gold: Math.floor(tpl.gold * rewardScale),
          armorBreakTurns: 0, armorBreakPct: 0,
          blindTurns: 0, blindPct: 0,
          elemShiftTurns: 0,
          burnTurns: 0, burnDmg: 0,
          poisonTurns: 0, poisonPct: 0, poisonStacks: 0,
          vulnTurns: 0, vulnPct: 0
        });
      }
    }

    const { awakenedList, openingShield } = computeOpeningAwakeningBonus(activeHeroes);
    const awakenCount = awakenedList.length;

    setPlayer(prev => ({
      ...prev,
      ammo: prev.job === '巧匠' ? 12 : prev.ammo,
      maxAmmo: prev.job === '巧匠' ? 12 : prev.maxAmmo,
      rage: prev.job === '猛將' ? Math.min(100, awakenCount * 15) : prev.rage,
      mp: ['術士', '藥師', '風水師'].includes(prev.job)
        ? Math.min(playerTotalMaxMp, prev.mp + (awakenCount * 20))
        : prev.mp
    }));

    if (awakenCount > 0) {
      addLog(
        `🌟 【★+3 護主靈罡覺醒】${awakenedList.map(h => h.name).join('、')} 激發護體真氣，開戰提供 +${openingShield} 點護盾！`,
        'sys'
      );
    }

    resetCombatStates(openingShield);
    setActiveTowerFloor(floor);
    setMonsters(list);
    setSelectedTargetIndex(0);
    setTurnCount(1);
    setCombatPhase('PLAYER_SELECT');
    setActiveTab('combat');
    addLog(
      isBossFloor
        ? `🔥 踏入【鎮魔塔第 ${floor} 層】，鎮守妖王首領現身！擊敗首領必得高階神裝！`
        : `🗼 踏入【鎮魔塔第 ${floor} 層】，迎戰 ${list.length} 名鎮塔守衛！`,
      'sys'
    );
  };

  const handleFleeCombat = () => {
    if (!isInCombat) return;
    setAutoBattle(false);
    const res = resolveFleeCombat({
      monsters,
      player,
      heroRoster,
      activeHeroInstanceIds,
      battleDownedHeroIds,
      combatBuffs,
      heroBattleBuffs,
      playerTotalDef,
      playerTotalSpeed,
      playerRowBuff,
      rawFormBonus,
      formMultiplier,
      isFengShui,
      getHeroRowIdx
    });

    appendBatchLogs(res.logs);

    if (res.outcome === 'ESCAPED') {
      setMonsters([]);
      setActiveTowerFloor(null);
      resetCombatStates();
      setCombatPhase('PLAYER_SELECT');
      return;
    }

    if (res.outcome === 'DEFEAT') {
      setPlayer(res.defeatedPlayer);
      setHeroRoster(res.finalRoster);
      setMonsters([]);
      setActiveTowerFloor(null);
      resetCombatStates();
      setCombatPhase('PLAYER_SELECT');
      setDefeatSummary(res.defeatSummary);
      return;
    }

    setPlayer(res.updatedPlayer);
    setMonsters(res.updatedMonsters);
    setHeroRoster(res.updatedRoster);
    setBattleDownedHeroIds(res.updatedDownedIds);
    setCombatBuffs(res.updatedBuffs);
    setLastRoundHits(res.lastRoundHits || { monsters: {}, allies: {} });
    setTurnCount(prev => prev + 1);
    setCombatPhase('PLAYER_SELECT');
  };

  const handleExecuteRound = (actionInput = { type: 'attack' }) => {
    if (!isInCombat) {
      addLog(`⚠️ 當前沒有敵人，請先點擊「🔍 尋找怪群」主動搜敵！`, 'sys');
      return;
    }

    setCombatPhase('EXECUTING');
    const res = resolveCombatRound({
      actionInput,
      monsters,
      player,
      heroRoster,
      activeHeroInstanceIds,
      selectedTargetIndex,
      combatBuffs,
      heroBattleBuffs,
      battleDownedHeroIds,
      playerTotalMaxHp,
      playerTotalMaxMp,
      playerTotalAtk,
      playerTotalDef,
      playerTotalSpeed,
      playerRowBuff,
      rawFormBonus,
      formMultiplier,
      currentZoneIndex,
      activeTowerFloor,
      isFengShui,
      getHeroRowIdx
    });

    appendBatchLogs(res.logs);

    if (res.outcome === 'ABORTED') {
      setCombatPhase('PLAYER_SELECT');
      return;
    }

    if (res.outcome === 'VICTORY') {
      setPlayer(res.newPlayer);
      setHeroRoster(res.finalRoster);
      setMonsters([]);
      resetCombatStates();
      setCombatPhase('PLAYER_SELECT');
      if (res.droppedEquipments?.length > 0) {
        setEquipmentInventory(prev => [...prev, ...res.droppedEquipments]);
      }
      if (res.droppedSkillCard) {
        setSkillCardsInventory(prev => [...prev, res.droppedSkillCard]);
      }
      if (res.clearedTowerFloor) {
        const nextFloor = res.clearedTowerFloor + 1;
        setTowerFloor(nextFloor);
        setTowerBestFloor(prev => Math.max(prev, nextFloor));
        setActiveTowerFloor(null);
      }
      setVictorySummary(res.victorySummary);
      return;
    }

    if (res.outcome === 'DEFEAT') {
      setAutoBattle(false);
      setPlayer(res.defeatedPlayer);
      setHeroRoster(res.finalRoster);
      setMonsters([]);
      setActiveTowerFloor(null);
      resetCombatStates();
      setCombatPhase('PLAYER_SELECT');
      setDefeatSummary(res.defeatSummary);
      return;
    }

    setMonsters(res.tickedMonsters);
    setPlayer(res.updatedPlayer);
    setHeroRoster(res.updatedRoster);
    setBattleDownedHeroIds(res.updatedDownedIds);
    setCombatBuffs(res.tickedBuffs);
    setHeroBattleBuffs(res.tickedHeroBuffs);
    setLastRoundHits(res.lastRoundHits || { monsters: {}, allies: {} });
    setTurnCount(prev => prev + 1);
    setCombatPhase('PLAYER_SELECT');
  };

  const handleToggleDeployHero = (hero) => {
    if (isInCombat) {
      addLog(`🔒 戰鬥進行中，無法調整出戰陣容！`, 'sys');
      return;
    }
    if (activeHeroInstanceIds.includes(hero.instanceId)) {
      const nextIds = activeHeroInstanceIds.filter(id => id !== hero.instanceId);
      setActiveHeroInstanceIds(nextIds);
      setFormationSlots(prev => syncFormationSlots(effectiveFormationKey, prev, nextIds));
      addLog(`🛡️ 英雄【${hero.name}】卸下登場，返回客棧休養。`, 'sys');
    } else {
      if (activeHeroInstanceIds.length >= 4) {
        addLog(`⚠️ 最多同時派遣 4 位英雄登場！`, 'sys');
        return;
      }
      if (activeHeroes.some(h => h.baseId === hero.baseId)) {
        addLog(`⚠️ 同名英雄【${hero.name}】不可重複登場（可進行同名合成升星）！`, 'sys');
        return;
      }
      const nextIds = [...activeHeroInstanceIds, hero.instanceId];
      setActiveHeroInstanceIds(nextIds);
      setFormationSlots(prev => syncFormationSlots(effectiveFormationKey, prev, nextIds));
      addLog(`⚔️ 英雄【${hero.name}】加入出戰陣容！`, 'sys');
    }
  };

  const handleFuseHero = (targetInstanceId, materialInstanceId = null) => {
    if (isInCombat) {
      addLog(`🔒 戰鬥進行中，無法進行英雄合成！`, 'sys');
      return;
    }

    const targetHero = heroRoster.find(h => h.instanceId === targetInstanceId);
    if (!targetHero) return;

    const currentFusion = Math.min(MAX_HERO_FUSION, targetHero.fusionLevel || 0);
    if (currentFusion >= MAX_HERO_FUSION) {
      const msg = `⚠️ 英雄【${targetHero.name}】已達最高突破星級（★+${MAX_HERO_FUSION}）！`;
      setFusionFeedback({ type: 'danger', text: msg });
      addLog(msg, 'sys');
      return;
    }

    const duplicates = heroRoster.filter(
      h => h.baseId === targetHero.baseId && h.instanceId !== targetHero.instanceId
    );
    if (duplicates.length === 0) {
      const msg = `⚠️ 名冊中沒有多餘的同名英雄【${targetHero.name}】可供合成！`;
      setFusionFeedback({ type: 'danger', text: msg });
      addLog(msg, 'sys');
      return;
    }

    let materialHero = materialInstanceId
      ? duplicates.find(d => d.instanceId === materialInstanceId)
      : null;
    if (!materialHero) {
      const sorted = [...duplicates].sort((a, b) => {
        const aDep = activeHeroInstanceIds.includes(a.instanceId) ? 1 : 0;
        const bDep = activeHeroInstanceIds.includes(b.instanceId) ? 1 : 0;
        return aDep - bDep || (a.level || 1) - (b.level || 1);
      });
      materialHero = sorted[0];
    }

    const nextFusion = currentFusion + 1;
    const upgradedTarget = mergeHeroIntoTarget(targetHero, materialHero, nextFusion);

    const recoveredCards = [
      ...(materialHero.activeSkillSlots || []),
      ...(materialHero.passiveSkillSlots || [])
    ];
    if (recoveredCards.length > 0) {
      setSkillCardsInventory(prev => [...prev, ...recoveredCards]);
    }

    const nextRoster = heroRoster
      .filter(h => h.instanceId !== materialHero.instanceId)
      .map(h => (h.instanceId === targetHero.instanceId ? upgradedTarget : h));
    setHeroRoster(nextRoster);

    if (activeHeroInstanceIds.includes(materialHero.instanceId)) {
      const nextActiveIds = activeHeroInstanceIds.filter(id => id !== materialHero.instanceId);
      setActiveHeroInstanceIds(nextActiveIds);
      setFormationSlots(prev => syncFormationSlots(effectiveFormationKey, prev, nextActiveIds));
    }

    const milestoneHint = nextFusion === 3
      ? '【解鎖 ★+3 覺醒：護主靈罡（開戰護盾＋真元補給）】'
      : nextFusion === 5
        ? '【解鎖 ★+5 覺醒：無雙連攜（25% 機率技能卡二連發）】'
        : '';

    const successMsg = `🌟 同名合成成功！【${targetHero.name}】突破至 ★+${nextFusion}（全基礎屬性 +${nextFusion * 15}%、主屬性 +3、技能卡威力 +${nextFusion * 12}%）${milestoneHint}${recoveredCards.length > 0 ? `，並收回素材身上 ${recoveredCards.length} 張技能卡` : ''}！`;
    setFusionFeedback({ type: 'success', text: successMsg });
    addLog(successMsg, 'sys');
  };

  const handleFuseAllHeroes = () => {
    if (isInCombat) {
      addLog(`🔒 戰鬥進行中，無法進行一鍵合成！`, 'sys');
      return;
    }

    const groups = {};
    heroRoster.forEach(h => {
      if (!groups[h.baseId]) groups[h.baseId] = [];
      groups[h.baseId].push(h);
    });

    const consumedIds = new Set();
    const updatedMap = {};
    const recoveredCards = [];
    let fusionOps = 0;

    Object.values(groups).forEach(group => {
      if (group.length < 2) return;

      const sorted = [...group].sort((a, b) => {
        const aDep = activeHeroInstanceIds.includes(a.instanceId) ? 1 : 0;
        const bDep = activeHeroInstanceIds.includes(b.instanceId) ? 1 : 0;
        return (
          bDep - aDep ||
          (b.fusionLevel || 0) - (a.fusionLevel || 0) ||
          (b.level || 1) - (a.level || 1)
        );
      });

      let mainHero = sorted[0];
      for (let i = 1; i < sorted.length; i++) {
        const curFusion = Math.min(MAX_HERO_FUSION, mainHero.fusionLevel || 0);
        if (curFusion >= MAX_HERO_FUSION) break;

        const matHero = sorted[i];
        mainHero = mergeHeroIntoTarget(mainHero, matHero, curFusion + 1);
        consumedIds.add(matHero.instanceId);
        fusionOps += 1;

        recoveredCards.push(
          ...(matHero.activeSkillSlots || []),
          ...(matHero.passiveSkillSlots || [])
        );
      }

      if (mainHero.instanceId !== sorted[0].instanceId || fusionOps > 0) {
        updatedMap[mainHero.instanceId] = mainHero;
      }
    });

    if (fusionOps === 0) {
      const msg = `ℹ️ 目前沒有可進行同名合成的英雄（需持有重複分身且未達 ★+${MAX_HERO_FUSION}）。`;
      setFusionFeedback({ type: 'danger', text: msg });
      addLog(msg, 'sys');
      return;
    }

    if (recoveredCards.length > 0) {
      setSkillCardsInventory(prev => [...prev, ...recoveredCards]);
    }

    const nextRoster = heroRoster
      .filter(h => !consumedIds.has(h.instanceId))
      .map(h => updatedMap[h.instanceId] || h);
    setHeroRoster(nextRoster);

    const nextActiveIds = activeHeroInstanceIds.filter(id => !consumedIds.has(id));
    if (nextActiveIds.length !== activeHeroInstanceIds.length) {
      setActiveHeroInstanceIds(nextActiveIds);
      setFormationSlots(prev => syncFormationSlots(effectiveFormationKey, prev, nextActiveIds));
    }

    const summaryMsg = `✨ 一鍵同名合成完成！共執行 ${fusionOps} 次星級突破${recoveredCards.length > 0 ? `，並安全收回 ${recoveredCards.length} 張素材技能卡` : ''}！`;
    setFusionFeedback({ type: 'success', text: summaryMsg });
    addLog(summaryMsg, 'sys');
  };

  const handleSwapFormationSlots = (slotA, slotB) => {
    if (isInCombat) {
      addLog(`🔒 戰鬥進行中，無法調整站位！`, 'sys');
      return;
    }
    if (slotA === slotB) return;
    setFormationSlots(prev => {
      const base = syncFormationSlots(effectiveFormationKey, prev, activeHeroInstanceIds);
      if (!(slotA in base) || !(slotB in base)) return base;
      const temp = base[slotA];
      base[slotA] = base[slotB];
      base[slotB] = temp;
      return { ...base };
    });
    addLog(`📐 已調整隊伍戰術站位！`, 'sys');
  };

  const handleReleaseHero = (hero) => {
    if (isInCombat) {
      addLog(`🔒 戰鬥進行中，無法放走英雄！`, 'sys');
      return;
    }
    const returnedCards = [
      ...(hero.activeSkillSlots || []),
      ...(hero.passiveSkillSlots || [])
    ];
    if (returnedCards.length > 0) {
      setSkillCardsInventory(prev => [...prev, ...returnedCards]);
    }
    if (activeHeroInstanceIds.includes(hero.instanceId)) {
      const nextIds = activeHeroInstanceIds.filter(id => id !== hero.instanceId);
      setActiveHeroInstanceIds(nextIds);
      setFormationSlots(prev => syncFormationSlots(effectiveFormationKey, prev, nextIds));
    }
    setHeroRoster(prev => prev.filter(h => h.instanceId !== hero.instanceId));
    addLog(`👋 已放走英雄【${hero.name}】${returnedCards.length > 0 ? `（自動收回 ${returnedCards.length} 張技能卡）` : ''}。`, 'sys');
  };

  const handleEquipSkillCard = (heroInstanceId, card) => {
    if (isInCombat) {
      addLog(`🔒 戰鬥進行中，無法更換技能卡！`, 'sys');
      return;
    }
    const targetHero = heroRoster.find(h => h.instanceId === heroInstanceId);
    if (!targetHero) return;

    if (!card.allowedJobs.includes(targetHero.heroClass)) {
      addLog(`⚠️ 職業不符！【${targetHero.heroClass}】無法裝備【${card.name}】！`, 'danger');
      return;
    }

    const allEquipped = [
      ...(targetHero.activeSkillSlots || []),
      ...(targetHero.passiveSkillSlots || [])
    ];
    if (allEquipped.some(c => c.id === card.id || c.name === card.name)) {
      addLog(`⚠️ 英雄【${targetHero.name}】已裝備相同的技能卡【${card.name}】！`, 'sys');
      return;
    }

    const targetSlots = card.type === 'active'
      ? (targetHero.activeSkillSlots || [])
      : (targetHero.passiveSkillSlots || []);
    if (targetSlots.length >= 2) {
      addLog(`⚠️ 英雄【${targetHero.name}】的${card.type === 'active' ? '主動' : '被動'}技能槽已滿！`, 'sys');
      return;
    }

    setSkillCardsInventory(prev => prev.filter(c => c.uid !== card.uid));
    setHeroRoster(prev => prev.map(h => {
      if (h.instanceId !== heroInstanceId) return h;
      if (card.type === 'active') {
        return { ...h, activeSkillSlots: [...(h.activeSkillSlots || []), card] };
      }
      return { ...h, passiveSkillSlots: [...(h.passiveSkillSlots || []), card] };
    }));

    addLog(`🔮 英雄【${targetHero.name}】成功裝備強化技能卡【${card.name}】！`, 'sys');
  };

  const handleUnequipSkillCard = (heroInstanceId, card) => {
    if (isInCombat) {
      addLog(`🔒 戰鬥進行中，無法拆下技能卡！`, 'sys');
      return;
    }
    setHeroRoster(prev => prev.map(h => {
      if (h.instanceId !== heroInstanceId) return h;
      if (card.type === 'active') {
        return { ...h, activeSkillSlots: (h.activeSkillSlots || []).filter(c => c.uid !== card.uid) };
      }
      return { ...h, passiveSkillSlots: (h.passiveSkillSlots || []).filter(c => c.uid !== card.uid) };
    }));

    setSkillCardsInventory(prev => [...prev, card]);
    addLog(`📤 已拆下技能卡【${card.name}】，卡片已放回背包。`, 'sys');
  };

  const handleRestInn = () => {
    if (isInCombat) {
      addLog(`🔒 戰鬥進行中，無法返回客棧休息！`, 'sys');
      return;
    }
    setPlayer(prev => ({
      ...prev,
      hp: playerTotalMaxHp,
      mp: playerTotalMaxMp,
      rage: 0,
      ammo: prev.maxAmmo
    }));
    setHeroRoster(prev => prev.map(h => {
      const { effectiveMaxHp } = calculateHeroEffectiveStats(h, isFengShui, null, getHeroRowIdx(h.instanceId));
      return {
        ...h,
        hp: effectiveMaxHp,
        fatigue: 0,
        rage: 0,
        ammo: h.maxAmmo || 6,
        mp: h.maxMp || 100
      };
    }));
    addLog(`🏨 客棧休養完成，全隊生命、資源恢復滿值！`, 'sys');
  };

  const handleShopPurchase = (shopItem) => {
    if (isInCombat) {
      addLog(`🔒 戰鬥進行中，行腳商暫停交易！`, 'sys');
      return;
    }
    if (player.gold < shopItem.price) {
      addLog(`⚠️ 金幣不足，無法購買【${shopItem.name}】！`, 'sys');
      return;
    }

    let rewardMsg = '';

    if (shopItem.id === 'stone_1') {
      setPlayer(p => ({ ...p, gold: p.gold - shopItem.price, refineStones: p.refineStones + 1 }));
      rewardMsg = `💎 成功購入【精鍊石 ×1】，目前持有 ${player.refineStones + 1} 顆！`;
    } else if (shopItem.id === 'stone_5') {
      setPlayer(p => ({ ...p, gold: p.gold - shopItem.price, refineStones: p.refineStones + 5 }));
      rewardMsg = `💠 成功購入【五連精鍊石禮盒 ×5】，目前持有 ${player.refineStones + 5} 顆！`;
    } else if (shopItem.id === 'ration_full') {
      setPlayer(p => ({
        ...p,
        gold: p.gold - shopItem.price,
        hp: playerTotalMaxHp,
        mp: playerTotalMaxMp,
        rage: 0,
        ammo: p.maxAmmo
      }));
      setHeroRoster(prev => prev.map(h => {
        const { effectiveMaxHp } = calculateHeroEffectiveStats(h, isFengShui, null, getHeroRowIdx(h.instanceId));
        return { ...h, hp: effectiveMaxHp, fatigue: 0, rage: 0, ammo: h.maxAmmo || 6, mp: h.maxMp || 100 };
      }));
      rewardMsg = `🍙 服用【行軍大還丹禮包】，全隊生命與資源已恢復至 100% 巔峰狀態！`;
    } else if (shopItem.id === 'skill_box') {
      const template = SKILL_CARDS_DB[Math.floor(Math.random() * SKILL_CARDS_DB.length)];
      const newCard = createSkillCardInstance(template);
      setPlayer(p => ({ ...p, gold: p.gold - shopItem.price }));
      setSkillCardsInventory(prev => [...prev, newCard]);
      rewardMsg = `🃏 開啟秘傳技能卡盲盒，獲得【${newCard.name}】（適用：${newCard.allowedJobs.join('、')}）！`;
    } else if (shopItem.id === 'equip_box_mid' || shopItem.id === 'equip_box_high') {
      const isHigh = shopItem.id === 'equip_box_high';
      const rolled = rollEquipmentFromTierRange(isHigh ? 3 : 1, isHigh ? 5 : 3, 'eq_shop');
      const bonusRefine = Math.random() < (isHigh ? 0.30 : 0.25) ? 1 : 0;
      const newEquip = { ...rolled, refineLevel: bonusRefine };
      const meta = enrichEquipmentMeta(newEquip);
      setPlayer(p => ({ ...p, gold: p.gold - shopItem.price }));
      setEquipmentInventory(prev => [...prev, newEquip]);
      rewardMsg = `🎁 開啟${isHigh ? '天工神兵匣' : '江湖兵器箱'}，獲得【${meta.tierTag}・${newEquip.name} (+${bonusRefine})】！`;
    } else if (shopItem.id === 'hero_scroll_normal' || shopItem.id === 'hero_scroll_rare') {
      const pool = shopItem.id === 'hero_scroll_rare'
        ? HERO_TEMPLATES.filter(t => t.tier >= 3 && t.tier <= 5)
        : HERO_TEMPLATES.filter(t => t.tier >= 1 && t.tier <= 3);
      const picked = pool[Math.floor(Math.random() * pool.length)];
      const recruitedHero = {
        ...normalizeHero(instantiateHero(picked, true, null, getRandomElement)),
        fusionLevel: 0
      };
      setPlayer(p => ({ ...p, gold: p.gold - shopItem.price }));
      setHeroRoster(prev => [...prev, recruitedHero]);
      rewardMsg = `👥 招募成功！【Tier ${recruitedHero.tier}】${recruitedHero.heroClass}【${recruitedHero.name}】（${recruitedHero.element}屬性）正式加入名冊！`;
    }

    if (rewardMsg) {
      setShopLastReward(rewardMsg);
      addLog(`🏮 [江湖市集] ${rewardMsg}`, 'sys');
    }
  };

  const handleEquipItem = (item) => {
    if (isInCombat) {
      addLog(`🔒 戰鬥進行中，無法更換裝備！`, 'sys');
      return;
    }
    const meta = enrichEquipmentMeta(item);
    if (!meta.allowedJobs.includes(player.job)) {
      addLog(`🔒 職業不符！【${player.job}】無法穿戴【${item.name}】（${meta.equipTag}）！`, 'danger');
      return;
    }

    const prevEquipped = player.equipped[item.type];
    setEquipmentInventory(prev => {
      const filtered = prev.filter(i => i.uid !== item.uid);
      return prevEquipped ? [...filtered, prevEquipped] : filtered;
    });
    setPlayer(p => ({ ...p, equipped: { ...p.equipped, [item.type]: item } }));
    addLog(`🛡️ 少俠已裝備【${meta.tierTag}・${item.name}】${prevEquipped ? `（原【${prevEquipped.name}】已退回背包）` : ''}。`, 'sys');
  };

  const handleUnequipItem = (slotKey) => {
    if (isInCombat) {
      addLog(`🔒 戰鬥進行中，無法除下裝備！`, 'sys');
      return;
    }
    const currentItem = player.equipped[slotKey];
    if (!currentItem) return;

    setPlayer(p => ({ ...p, equipped: { ...p.equipped, [slotKey]: null } }));
    setEquipmentInventory(prev => [...prev, currentItem]);
    addLog(`📤 已除下【${currentItem.name}】，裝備已放回背包。`, 'sys');
  };

  const handleSellEquipment = (item) => {
    if (isInCombat) {
      addLog(`🔒 戰鬥進行中，無法賣出裝備！`, 'sys');
      return;
    }
    const meta = enrichEquipmentMeta(item);
    setEquipmentInventory(prev => prev.filter(i => i.uid !== item.uid));
    setPlayer(p => ({ ...p, gold: p.gold + meta.sellPrice }));
    addLog(`💰 已賣出【${meta.tierTag}・${item.name}】，獲得 +${meta.sellPrice} 金幣！`, 'sys');
  };

  const handleBulkSellUnusableEquipment = () => {
    if (isInCombat) {
      addLog(`🔒 戰鬥進行中，無法賣出裝備！`, 'sys');
      return;
    }
    let totalGold = 0;
    let soldCount = 0;
    const kept = [];

    equipmentInventory.forEach(item => {
      const meta = enrichEquipmentMeta(item);
      const isUnusable = !meta.allowedJobs.includes(player.job);
      const isClean = (item.refineLevel || 0) === 0 && !(item.sockets || []).some(Boolean);
      if (isUnusable && isClean) {
        totalGold += meta.sellPrice;
        soldCount += 1;
      } else {
        kept.push(item);
      }
    });

    if (soldCount === 0) {
      addLog(`ℹ️ 背包中沒有可一鍵清理的非本職白板裝備。`, 'sys');
      return;
    }

    setEquipmentInventory(kept);
    setPlayer(p => ({ ...p, gold: p.gold + totalGold }));
    addLog(`🧹 一鍵清理完成！共賣出 ${soldCount} 件非本職裝備，獲得 +${totalGold} 金幣！`, 'sys');
  };

  const handleSelectFormation = (fKey) => {
    if (player.job !== '風水師') {
      addLog(`🔒 僅限「風水師」職業可變換陣法！`, 'sys');
      return;
    }
    if (isInCombat) {
      addLog(`🔒 戰鬥進行中，無法變換陣法！`, 'sys');
      return;
    }
    setCurrentFormation(fKey);
    setFormationSlots(prev => syncFormationSlots(fKey, prev, activeHeroInstanceIds));
    addLog(`☯️ 風水師施展【奇門陣眼】，切換為【${FORMATIONS_CONFIG[fKey].name}】（陣法增益 2 倍強化）！`, 'sys');
  };

  const handleRefineEquipment = (item) => {
    if (isInCombat) {
      addLog(`🔒 戰鬥進行中，無法進行鐵匠精鍊！`, 'sys');
      return;
    }
    const level = item.refineLevel || 0;
    const goldCost = (level + 1) * 120;
    if (player.gold < goldCost || player.refineStones < 1) {
      setForgeFeedback({ type: 'danger', text: `⚠️ 金幣或精鍊石不足，無法強化【${item.name}】！` });
      return;
    }

    const successRate = getRefineSuccessRate(level);
    const isSuccess = Math.random() < successRate;
    setPlayer(p => ({ ...p, gold: p.gold - goldCost, refineStones: p.refineStones - 1 }));
    const nextLevel = isSuccess ? level + 1 : Math.max(0, level - 1);
    const updated = { ...item, refineLevel: nextLevel };

    setEquipmentInventory(prev => prev.map(i => i.uid === item.uid ? updated : i));
    if (player.equipped[item.type]?.uid === item.uid) {
      setPlayer(p => ({ ...p, equipped: { ...p.equipped, [item.type]: updated } }));
    }

    const nextBonusPct = Math.round(getCumulativeRefineBonusPct(nextLevel) * 100);
    const msg = isSuccess
      ? `🔨 精鍊成功！【${item.name}】強化至 +${nextLevel}（基礎屬性累計額外 +${nextBonusPct}%）！`
      : `💥 精鍊失敗（成功率 ${Math.round(successRate * 100)}%）！【${item.name}】靈氣震盪，精鍊等級為 +${nextLevel}（基礎屬性累計 +${nextBonusPct}%）！`;
    setForgeFeedback({ type: isSuccess ? 'success' : 'danger', text: msg });
    addLog(msg, isSuccess ? 'sys' : 'danger');
  };

  const handleSocketGem = (item, gem, socketIdx) => {
    if (isInCombat) {
      addLog(`🔒 戰鬥進行中，無法鑲嵌寶石！`, 'sys');
      return;
    }
    const socketCost = 100;
    if (player.gold < socketCost) {
      setForgeFeedback({ type: 'danger', text: `⚠️ 金幣不足（需 100 金幣），無法鑲嵌寶石！` });
      return;
    }

    const prevGem = item.sockets?.[socketIdx];
    const newSockets = [...(item.sockets || [null])];
    newSockets[socketIdx] = gem;
    const updated = { ...item, sockets: newSockets };

    setPlayer(p => ({ ...p, gold: p.gold - socketCost }));
    setEquipmentInventory(prev => prev.map(i => i.uid === item.uid ? updated : i));
    if (player.equipped[item.type]?.uid === item.uid) {
      setPlayer(p => ({ ...p, equipped: { ...p.equipped, [item.type]: updated } }));
    }

    const msg = prevGem
      ? `💎 已花費 100 金幣將【${item.name}】第 ${socketIdx + 1} 孔的【${prevGem.name}】替換為【${gem.name}】！`
      : `💎 已花費 100 金幣為【${item.name}】第 ${socketIdx + 1} 孔鑲嵌【${gem.name}】！`;
    setForgeFeedback({ type: 'success', text: msg });
    addLog(msg, 'sys');
  };

  const handleExportSave = () => {
    const exportPayload = buildExportSaveData({
      player,
      heroRoster,
      activeHeroInstanceIds,
      currentFormation,
      formationSlots: syncedSlots,
      equipmentInventory,
      skillCardsInventory,
      towerFloor,
      towerBestFloor
    });
    setJsonSaveText(JSON.stringify(exportPayload, null, 2));
    setSaveLoadStatus(`✅ 存檔 JSON 匯出成功（版本 v${CURRENT_SAVE_VERSION}）！`);
  };

  const handleImportSave = () => {
    if (isInCombat) {
      setSaveLoadStatus('🔒 戰鬥中無法讀取存檔！');
      return;
    }
    try {
      const parsed = JSON.parse(jsonSaveText);
      const res = migrateAndValidateSave(parsed, { player: INITIAL_PLAYER });
      if (!res.ok) {
        setSaveLoadStatus(`❌ ${res.error}`);
        return;
      }
      applyMigratedSaveState(res.data);
      setMonsters([]);
      resetCombatStates();
      setAutoBattle(false);
      setGameStarted(true);
      const migrateHint = res.migratedFrom < CURRENT_SAVE_VERSION
        ? `（已自動從 v${res.migratedFrom} 遷移至 v${CURRENT_SAVE_VERSION}）`
        : '';
      setSaveLoadStatus(`✅ 成功匯入遊戲進度${migrateHint}！`);
    } catch (e) {
      setSaveLoadStatus('❌ 匯入失敗，請確認 JSON 格式是否正確。');
    }
  };

  const handleResetSave = () => {
    if (window.confirm("確定要重置所有遊戲紀錄嗎？")) {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      window.location.reload();
    }
  };

  return (
    <GameUI
      gameStarted={gameStarted}
      isInCombat={isInCombat}
      activeTowerFloor={activeTowerFloor}
      autoBattle={autoBattle}
      handleToggleAutoBattle={handleToggleAutoBattle}
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
      handleToggleDeployHero={handleToggleDeployHero}
      handleFuseHero={handleFuseHero}
      handleFuseAllHeroes={handleFuseAllHeroes}
      fusionFeedback={fusionFeedback}
      MAX_HERO_FUSION={MAX_HERO_FUSION}
      handleReleaseHero={handleReleaseHero}
      handleEquipSkillCard={handleEquipSkillCard}
      handleUnequipSkillCard={handleUnequipSkillCard}
      handleRestInn={handleRestInn}
      handleEquipItem={handleEquipItem}
      handleUnequipItem={handleUnequipItem}
      handleSellEquipment={handleSellEquipment}
      handleBulkSellUnusableEquipment={handleBulkSellUnusableEquipment}
      handleSelectFormation={handleSelectFormation}
      formationSlots={syncedSlots}
      handleSwapFormationSlots={handleSwapFormationSlots}
      handleSelectZone={handleSelectZone}
      handleSweepZone={handleSweepZone}
      handleFleeCombat={handleFleeCombat}
      monsters={monsters}
      selectedTargetIndex={selectedTargetIndex}
      setSelectedTargetIndex={setSelectedTargetIndex}
      combatLogs={combatLogs}
      lastRoundHits={lastRoundHits}
      combatBuffs={combatBuffs}
      heroBattleBuffs={heroBattleBuffs}
      turnCount={turnCount}
      combatPhase={combatPhase}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      currentZoneIndex={currentZoneIndex}
      spawnEncounter={spawnEncounter}
      handleExecuteRound={handleExecuteRound}
      equipmentInventory={equipmentInventory}
      setEquipmentInventory={setEquipmentInventory}
      skillCardsInventory={skillCardsInventory}
      setSkillCardsInventory={setSkillCardsInventory}
      forgeFeedback={forgeFeedback}
      handleRefineEquipment={handleRefineEquipment}
      handleSocketGem={handleSocketGem}
      shopLastReward={shopLastReward}
      handleShopPurchase={handleShopPurchase}
      currentFormation={effectiveFormationKey}
      towerFloor={towerFloor}
      towerBestFloor={towerBestFloor}
      handleStartTowerChallenge={handleStartTowerChallenge}
      jsonSaveText={jsonSaveText}
      setJsonSaveText={setJsonSaveText}
      saveLoadStatus={saveLoadStatus}
      handleExportSave={handleExportSave}
      handleImportSave={handleImportSave}
      handleResetSave={handleResetSave}
      victorySummary={victorySummary}
      setVictorySummary={setVictorySummary}
      defeatSummary={defeatSummary}
      setDefeatSummary={setDefeatSummary}
      chatEndRef={chatEndRef}
    />
  );
}