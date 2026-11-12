import React, { useState, useEffect, useRef } from 'react';
import GameUI from './GameUI';

import { MAX_LEVEL, MAX_SKILL_LEVEL, LOCAL_STORAGE_KEY, ZONES } from './data/constants';
import { CLASS_CONFIGS } from './data/classes';
import { FORMATIONS_CONFIG } from './data/formations';
import { SKILL_CARDS_DB, createSkillCardInstance } from './data/skillCards';
import { HERO_TEMPLATES, instantiateHero } from './data/heroes';
import { ITEM_DROP_POOL, calculateEquipmentBonus } from './data/equipment';
import { calculateCodexBonus } from './components/SecondaryTabs';

import { getRowPositionBuffs, syncFormationSlots } from './utils/formationHelper';
import {
  getRandomElement,
  calculateHeroEffectiveStats,
  normalizeHero,
  enrichEquipmentMeta
} from './utils/statCalculator';
import {
  CURRENT_SAVE_VERSION,
  buildExportSaveData,
  migrateAndValidateSave
} from './utils/saveHelper';
import {
  resolveCombatRound,
  resolveFleeCombat
} from './utils/combatEngine';

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
  gold: 600, refineStones: 10,
  statPoints: 5, sp: 1, tp: 2,
  stats: { str: 10, con: 10, int: 10, agi: 10 },
  skillLevels: { 0: 0, 1: 0, 2: 0 },
  equipped: { weapon: null, offhand: null, helmet: null, armor: null, shoes: null, accessory: null }
};

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
  const [equipmentInventory, setEquipmentInventory] = useState(
    ITEM_DROP_POOL.slice(0, 3).map((item, idx) => ({ ...item, refineLevel: 0, uid: `eq_init_${idx}` }))
  );
  const [skillCardsInventory, setSkillCardsInventory] = useState(() => [
    createSkillCardInstance(SKILL_CARDS_DB[0]),
    createSkillCardInstance(SKILL_CARDS_DB[2]),
    createSkillCardInstance(SKILL_CARDS_DB[6])
  ]);
  const [towerFloor, setTowerFloor] = useState(1);

  const [activeTab, setActiveTab] = useState('combat');
  const [currentZoneIndex, setCurrentZoneIndex] = useState(0);
  const [monsters, setMonsters] = useState([]);
  const [selectedTargetIndex, setSelectedTargetIndex] = useState(0);
  const [combatLogs, setCombatLogs] = useState([]);
  const [turnCount, setTurnCount] = useState(1);
  const [combatPhase, setCombatPhase] = useState('PLAYER_SELECT');
  const [victorySummary, setVictorySummary] = useState(null);
  const [defeatSummary, setDefeatSummary] = useState(null);
  const [shopLastReward, setShopLastReward] = useState('');

  const [combatBuffs, setCombatBuffs] = useState({
    shield: 0,
    tauntTurns: 0,
    reflectTurns: 0,
    reflectPct: 0,
    baguaTurns: 0,
    baguaReducePct: 0,
    baguaReflectPct: 0
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

    setPlayer(loadedP);
    setHeroRoster((migratedData.heroRoster || []).map(normalizeHero));
    setActiveHeroInstanceIds(loadedActiveIds);
    setCurrentFormation(loadedForm);
    setFormationSlots(syncFormationSlots(loadedForm, migratedData.formationSlots || {}, loadedActiveIds));
    setEquipmentInventory(migratedData.equipmentInventory || []);
    setSkillCardsInventory(migratedData.skillCardsInventory || []);
    setTowerFloor(migratedData.towerFloor || 1);
  };

  useEffect(() => {
    const t1s = HERO_TEMPLATES.filter(t => t.tier === 1);
    const cands = t1s.map(t => normalizeHero(instantiateHero(t, true, null, getRandomElement)));
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
          towerFloor
        });
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(saveData));
      } catch (e) {
        console.warn('自動存檔失敗', e);
      }
    }
  }, [player, heroRoster, activeHeroInstanceIds, currentFormation, formationSlots, equipmentInventory, skillCardsInventory, towerFloor, gameStarted]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [combatLogs]);

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

  const playerTotalMaxHp = Math.floor((player.maxHp + (player.stats.con * 16) + equipBonus.hp) * (1 + setHpPct + ((rawFormBonus.hpPct || 0) * formMultiplier) + codexBonus.hpPct));
  const playerTotalMaxMp = Math.floor((player.maxMp + (player.stats.int * 10) + equipBonus.mp) * (1 + setMpPct));
  const playerTotalAtk = Math.floor((player.atk + (player.stats.str * 3) + equipBonus.atk) * (1 + setAtkPct + ((rawFormBonus.atkPct || 0) * formMultiplier) + codexBonus.atkPct));
  const playerTotalDef = Math.floor((player.def + (player.stats.con * 1) + equipBonus.def) * (1 + (setDefPct || 0) + ((rawFormBonus.defPct || 0) * formMultiplier) + codexBonus.defPct));
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
        type: entry.type || 'info'
      }))
    ]);
  };

  const handleStartGame = () => {
    const jobConfig = CLASS_CONFIGS[creationData.job];
    const starterHero = normalizeHero(creationData.selectedStarterHero);

    const newPlayer = {
      ...INITIAL_PLAYER,
      name: creationData.name || "太古少俠",
      job: creationData.job,
      element: creationData.element,
      maxHp: jobConfig.baseHp, hp: jobConfig.baseHp,
      maxMp: jobConfig.baseMp, mp: jobConfig.baseMp,
      atk: jobConfig.baseAtk, def: jobConfig.baseDef, speed: jobConfig.baseSpeed
    };

    setPlayer(newPlayer);
    setHeroRoster([starterHero]);
    setActiveHeroInstanceIds([starterHero.instanceId]);
    setCurrentFormation('none');
    setFormationSlots(syncFormationSlots('none', {}, [starterHero.instanceId]));
    setMonsters([]);
    setGameStarted(true);
    setCombatLogs([
      { id: 1, turn: 1, type: 'sys', text: `📜 少俠【${newPlayer.name}】（${newPlayer.job} • ${newPlayer.element}本命）踏入《天外 Online》！開局獲贈 1 點 SP，可先前往「✨ 技能樹」學習首招技能！` }
    ]);
  };

  const handleSelectZone = (zoneIdx) => {
    if (isInCombat) {
      addLog(`🔒 戰鬥中無法切換地圖！`, 'sys');
      return;
    }
    setCurrentZoneIndex(zoneIdx);
    setMonsters([]);
    addLog(`🗺️ 已前往【${ZONES[zoneIdx].name}】安全營地，請點擊「🔍 尋找怪群」主動搜敵！`, 'sys');
  };

  const resetCombatStates = () => {
    setCombatBuffs({
      shield: 0,
      tauntTurns: 0,
      reflectTurns: 0,
      reflectPct: 0,
      baguaTurns: 0,
      baguaReducePct: 0,
      baguaReflectPct: 0
    });
    setHeroBattleBuffs({});
    setBattleDownedHeroIds([]);
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
    const count = Math.floor(Math.random() * (totalCombatants * 2)) + totalCombatants;

    const zone = ZONES[zoneIdx];
    const list = [];
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    for (let i = 0; i < count; i++) {
      const template = zone.monsters[Math.floor(Math.random() * zone.monsters.length)];
      const randElem = getRandomElement();
      list.push({
        id: `m_${Date.now()}_${i}`,
        name: `${template.name} ${alphabet[i] || i + 1}`,
        element: randElem,
        originalElement: randElem,
        maxHp: template.hp, hp: template.hp,
        atk: template.atk, def: template.def,
        exp: template.exp, gold: template.gold,
        armorBreakTurns: 0, armorBreakPct: 0,
        blindTurns: 0, blindPct: 0,
        elemShiftTurns: 0,
        burnTurns: 0, burnDmg: 0,
        poisonTurns: 0, poisonPct: 0, poisonStacks: 0,
        vulnTurns: 0, vulnPct: 0
      });
    }

    if (player.job === '巧匠') {
      setPlayer(prev => ({ ...prev, ammo: 12, maxAmmo: 12 }));
      addLog(`🏹 【連環機巧】巧匠開戰前裝填完畢，機關彈藥補滿至 12/12！`, 'sys');
    } else if (player.job === '猛將') {
      setPlayer(prev => ({ ...prev, rage: 0 }));
    }

    resetCombatStates();
    setMonsters(list);
    setSelectedTargetIndex(0);
    setTurnCount(1);
    setCombatPhase('PLAYER_SELECT');
    addLog(`⚔️ 【${zone.name}】主動搜敵遭遇 ${list.length} 隻敵怪！戰鬥開始（整備功能已鎖定）！`, 'sys');
    return list;
  };

  const handleFleeCombat = () => {
    if (!isInCombat) return;
    const res = resolveFleeCombat({
      monsters,
      player,
      heroRoster,
      activeHeroInstanceIds,
      battleDownedHeroIds,
      combatBuffs,
      heroBattleBuffs,
      playerTotalDef,
      playerRowBuff,
      rawFormBonus,
      formMultiplier,
      isFengShui,
      getHeroRowIdx
    });

    appendBatchLogs(res.logs);

    if (res.outcome === 'ESCAPED') {
      setMonsters([]);
      resetCombatStates();
      setCombatPhase('PLAYER_SELECT');
      return;
    }

    if (res.outcome === 'DEFEAT') {
      setPlayer(res.defeatedPlayer);
      setHeroRoster(res.finalRoster);
      setMonsters([]);
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
    setTurnCount(prev => prev + 1);
    setCombatPhase('PLAYER_SELECT');
  };

  const handleExecuteRound = (actionInput = { type: 'attack' }, isFusionUltimate = false) => {
    if (!isInCombat) {
      addLog(`⚠️ 當前沒有敵人，請先點擊「🔍 尋找怪群」主動搜敵！`, 'sys');
      return;
    }

    setCombatPhase('EXECUTING');
    const res = resolveCombatRound({
      actionInput,
      isFusionUltimate,
      monsters,
      player,
      heroRoster,
      activeHeroes,
      activeHeroInstanceIds,
      selectedTargetIndex,
      combatBuffs,
      heroBattleBuffs,
      battleDownedHeroIds,
      playerTotalMaxHp,
      playerTotalMaxMp,
      playerTotalAtk,
      playerTotalDef,
      playerRowBuff,
      rawFormBonus,
      formMultiplier,
      currentZoneIndex,
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
      setVictorySummary(res.victorySummary);
      return;
    }

    if (res.outcome === 'DEFEAT') {
      setPlayer(res.defeatedPlayer);
      setHeroRoster(res.finalRoster);
      setMonsters([]);
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
        addLog(`⚠️ 同名英雄【${hero.name}】不可重複登場！`, 'sys');
        return;
      }
      const nextIds = [...activeHeroInstanceIds, hero.instanceId];
      setActiveHeroInstanceIds(nextIds);
      setFormationSlots(prev => syncFormationSlots(effectiveFormationKey, prev, nextIds));
      addLog(`⚔️ 英雄【${hero.name}】加入出戰陣容！`, 'sys');
    }
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
      addLog(`⚠️ 職業不符！【${targetHero.heroClass}】無法裝備【${card.name}】！`, 'sys');
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

    addLog(`🔮 英雄【${targetHero.name}】成功裝備技能卡【${card.name}】！`, 'sys');
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
    } else if (shopItem.id === 'equip_box') {
      const template = ITEM_DROP_POOL[Math.floor(Math.random() * ITEM_DROP_POOL.length)];
      const bonusRefine = Math.random() < 0.25 ? 1 : 0;
      const newEquip = { ...template, refineLevel: bonusRefine, uid: `eq_shop_${Date.now()}_${Math.random()}` };
      setPlayer(p => ({ ...p, gold: p.gold - shopItem.price }));
      setEquipmentInventory(prev => [...prev, newEquip]);
      rewardMsg = `🎁 開啟江湖神兵寶箱，獲得【${newEquip.name} (+${bonusRefine})】！`;
    } else if (shopItem.id === 'hero_scroll_normal' || shopItem.id === 'hero_scroll_rare') {
      const pool = shopItem.id === 'hero_scroll_rare'
        ? HERO_TEMPLATES.filter(t => t.tier >= 3 && t.tier <= 5)
        : HERO_TEMPLATES.filter(t => t.tier >= 1 && t.tier <= 3);
      const picked = pool[Math.floor(Math.random() * pool.length)];
      const recruitedHero = normalizeHero(instantiateHero(picked, true, null, getRandomElement));
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
    addLog(`🛡️ 少俠已裝備【${item.name}】${prevEquipped ? `（原【${prevEquipped.name}】已退回背包）` : ''}。`, 'sys');
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
    addLog(`💰 已賣出【${item.name}】，獲得 +${meta.sellPrice} 金幣！`, 'sys');
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
    if (player.gold < (level + 1) * 120 || player.refineStones < 1) return;
    const isSuccess = Math.random() < (level < 4 ? 1.0 : 0.65);
    setPlayer(p => ({ ...p, gold: p.gold - (level + 1) * 120, refineStones: p.refineStones - 1 }));
    const nextLevel = isSuccess ? level + 1 : Math.max(0, level - 1);
    const updated = { ...item, refineLevel: nextLevel };

    setEquipmentInventory(prev => prev.map(i => i.uid === item.uid ? updated : i));
    if (player.equipped[item.type]?.uid === item.uid) {
      setPlayer(p => ({ ...p, equipped: { ...p.equipped, [item.type]: updated } }));
    }
  };

  const handleSocketGem = (item, gem, socketIdx) => {
    if (isInCombat) {
      addLog(`🔒 戰鬥進行中，無法鑲嵌寶石！`, 'sys');
      return;
    }
    const newSockets = [...(item.sockets || [null])];
    newSockets[socketIdx] = gem;
    const updated = { ...item, sockets: newSockets };

    setEquipmentInventory(prev => prev.map(i => i.uid === item.uid ? updated : i));
    if (player.equipped[item.type]?.uid === item.uid) {
      setPlayer(p => ({ ...p, equipped: { ...p.equipped, [item.type]: updated } }));
    }
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
      towerFloor
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
      handleFleeCombat={handleFleeCombat}
      monsters={monsters}
      selectedTargetIndex={selectedTargetIndex}
      setSelectedTargetIndex={setSelectedTargetIndex}
      combatLogs={combatLogs}
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
      handleRefineEquipment={handleRefineEquipment}
      handleSocketGem={handleSocketGem}
      shopLastReward={shopLastReward}
      handleShopPurchase={handleShopPurchase}
      currentFormation={effectiveFormationKey}
      towerFloor={towerFloor}
      setTowerFloor={setTowerFloor}
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
