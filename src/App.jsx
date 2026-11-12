import React, { useState, useEffect, useRef } from 'react';
import GameUI from './GameUI';

import { MAX_LEVEL, MAX_SKILL_LEVEL, LOCAL_STORAGE_KEY, ELEMENTS, ZONES } from './data/constants';
import { CLASS_CONFIGS } from './data/classes';
import { FORMATIONS_CONFIG } from './data/formations';
import { SKILL_CARDS_DB, createSkillCardInstance } from './data/skillCards';
import { HERO_TEMPLATES, instantiateHero } from './data/heroes';
import { ITEM_DROP_POOL, calculateEquipmentBonus } from './data/equipment';

import { getRowPositionBuffs, syncFormationSlots } from './utils/formationHelper';
import {
  getRandomElement,
  getElementMultiplier,
  calculateHeroEffectiveStats,
  normalizeHero,
  applyHeroDeathStatPenalty,
  enrichEquipmentMeta,
  pickUpToNMonsterIndices
} from './utils/statCalculator';

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

  const [player, setPlayer] = useState({
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
  });

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

  useEffect(() => {
    const t1s = HERO_TEMPLATES.filter(t => t.tier === 1);
    const cands = t1s.map(t => normalizeHero(instantiateHero(t, true, null, getRandomElement)));
    setStarterHeroCandidates(cands);
    setCreationData(prev => ({ ...prev, selectedStarterHero: cands[0] }));

    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.player) {
          const loadedP = {
            ...parsed.player,
            level: Math.min(MAX_LEVEL, parsed.player.level || 1),
            maxAmmo: parsed.player.job === '巧匠' ? 12 : (parsed.player.maxAmmo || 12),
            skillLevels: {
              0: Math.min(MAX_SKILL_LEVEL, parsed.player.skillLevels?.[0] ?? 0),
              1: Math.min(MAX_SKILL_LEVEL, parsed.player.skillLevels?.[1] ?? 0),
              2: Math.min(MAX_SKILL_LEVEL, parsed.player.skillLevels?.[2] ?? 0)
            }
          };
          const loadedForm = loadedP.job === '風水師' ? (parsed.currentFormation || 'none') : 'none';
          const loadedActiveIds = parsed.activeHeroInstanceIds || [];
          setPlayer(loadedP);
          setHeroRoster((parsed.heroRoster || []).map(normalizeHero));
          setActiveHeroInstanceIds(loadedActiveIds);
          setCurrentFormation(loadedForm);
          setFormationSlots(syncFormationSlots(loadedForm, parsed.formationSlots || {}, loadedActiveIds));
          setEquipmentInventory(parsed.equipmentInventory || []);
          if (parsed.skillCardsInventory) {
            setSkillCardsInventory(parsed.skillCardsInventory);
          }
          setTowerFloor(parsed.towerFloor || 1);
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
        const saveData = {
          player,
          heroRoster,
          activeHeroInstanceIds,
          currentFormation,
          formationSlots,
          equipmentInventory,
          skillCardsInventory,
          towerFloor
        };
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

  const playerTotalMaxHp = Math.floor((player.maxHp + (player.stats.con * 16) + equipBonus.hp) * (1 + setHpPct + ((rawFormBonus.hpPct || 0) * formMultiplier)));
  const playerTotalMaxMp = Math.floor((player.maxMp + (player.stats.int * 10) + equipBonus.mp) * (1 + setMpPct));
  const playerTotalAtk = Math.floor((player.atk + (player.stats.str * 3) + equipBonus.atk) * (1 + setAtkPct + ((rawFormBonus.atkPct || 0) * formMultiplier)));
  const playerTotalDef = Math.floor((player.def + (player.stats.con * 1) + equipBonus.def) * (1 + (setDefPct || 0) + ((rawFormBonus.defPct || 0) * formMultiplier)));
  const playerTotalSpeed = Math.floor((player.speed + (player.stats.agi * 1) + equipBonus.speed) * (1 + ((rawFormBonus.speedPct || 0) * formMultiplier) + (playerRowBuff.speedPct || 0)));

  const addLog = (text, type = 'info') => {
    setCombatLogs(prev => [...prev, { id: Date.now() + Math.random(), turn: turnCount, text, type }]);
  };

  const handleStartGame = () => {
    const jobConfig = CLASS_CONFIGS[creationData.job];
    const starterHero = normalizeHero(creationData.selectedStarterHero);

    const newPlayer = {
      ...player,
      name: creationData.name || "太古少俠",
      job: creationData.job,
      element: creationData.element,
      level: 1,
      exp: 0,
      maxExp: 100,
      maxHp: jobConfig.baseHp, hp: jobConfig.baseHp,
      maxMp: jobConfig.baseMp, mp: jobConfig.baseMp,
      rage: 0,
      ammo: 12,
      maxAmmo: 12,
      atk: jobConfig.baseAtk, def: jobConfig.baseDef, speed: jobConfig.baseSpeed,
      statPoints: 5,
      sp: 1,
      skillLevels: { 0: 0, 1: 0, 2: 0 }
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
    let list = [];
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
        armorBreakTurns: 0,
        armorBreakPct: 0,
        blindTurns: 0,
        blindPct: 0,
        elemShiftTurns: 0,
        burnTurns: 0,
        burnDmg: 0,
        poisonTurns: 0,
        poisonPct: 0,
        poisonStacks: 0,
        vulnTurns: 0,
        vulnPct: 0
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
      } else {
        return { ...h, passiveSkillSlots: [...(h.passiveSkillSlots || []), card] };
      }
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
      } else {
        return { ...h, passiveSkillSlots: (h.passiveSkillSlots || []).filter(c => c.uid !== card.uid) };
      }
    }));

    setSkillCardsInventory(prev => [...prev, card]);
    addLog(`📤 已拆下技能卡【${card.name}】，卡片已放回背包。`, 'sys');
  };

  const processHeroExpGain = (hero, expGained) => {
    let currentHero = normalizeHero(hero);
    if (currentHero.level >= MAX_LEVEL) {
      return { updatedHero: { ...currentHero, level: MAX_LEVEL, exp: 0 }, upgradedMsgs: [] };
    }

    currentHero.exp += expGained;
    let upgradedMsgs = [];

    while (currentHero.level < MAX_LEVEL && currentHero.exp >= currentHero.maxExp) {
      currentHero.exp -= currentHero.maxExp;
      currentHero.level += 1;
      currentHero.maxExp = Math.floor(100 * Math.pow(currentHero.level, 1.3));

      const tierPtsMap = { 1: 2, 2: 3, 3: 5, 4: 7, 5: 10 };
      const pts = tierPtsMap[currentHero.tier] || 2;

      const weightsMap = {
        '猛將': { str: 0.30, con: 0.50, int: 0.00, agi: 0.20 },
        '巧匠': { str: 0.30, con: 0.20, int: 0.00, agi: 0.50 },
        '術士': { str: 0.00, con: 0.20, int: 0.60, agi: 0.20 },
        '藥師': { str: 0.00, con: 0.40, int: 0.40, agi: 0.20 },
        '風水師': { str: 0.00, con: 0.30, int: 0.30, agi: 0.40 }
      };
      const w = weightsMap[currentHero.heroClass] || weightsMap['猛將'];

      const addStr = Math.round(pts * w.str);
      const addCon = Math.round(pts * w.con);
      const addInt = Math.round(pts * w.int);
      const addAgi = pts - (addStr + addCon + addInt);

      const oldStats = currentHero.stats || { str: 4, con: 4, int: 2, agi: 2 };
      currentHero.stats = {
        str: oldStats.str + addStr,
        con: oldStats.con + addCon,
        int: oldStats.int + addInt,
        agi: oldStats.agi + addAgi
      };

      const tier = currentHero.tier || 1;
      currentHero.maxHp = 130 + (tier * 45) + (currentHero.stats.con * 16);
      currentHero.atk = 16 + (tier * 11) + (currentHero.stats.str * 3) + (currentHero.stats.int * 2);
      currentHero.def = 5 + (tier * 4) + (currentHero.stats.con * 1);
      currentHero.speed = 10 + (tier * 2) + (currentHero.stats.agi * 2);

      const { effectiveMaxHp } = calculateHeroEffectiveStats(currentHero, isFengShui, null, getHeroRowIdx(currentHero.instanceId));
      currentHero.hp = effectiveMaxHp;

      upgradedMsgs.push(`🎉 英雄【${currentHero.name}】升至 Lv.${currentHero.level}${currentHero.level === MAX_LEVEL ? ' (已達滿級上限!)' : ''}！`);
    }

    if (currentHero.level >= MAX_LEVEL) {
      currentHero.level = MAX_LEVEL;
      currentHero.exp = 0;
    }

    return { updatedHero: currentHero, upgradedMsgs };
  };

  const calculateDamageToMonster = (rawAtk, monster, attElem, options = {}) => {
    const {
      ignoreDefPct = 0,
      isWarlock = false,
      extraElemPct = 0,
      critMult = 1.0
    } = options;

    const totalIgnoreDef = Math.min(0.95, ignoreDefPct + (monster.armorBreakTurns > 0 ? (monster.armorBreakPct || 0) : 0));
    const effectiveMonsterDef = Math.floor(monster.def * (1 - totalIgnoreDef));

    let em = getElementMultiplier(attElem, monster.element, isWarlock);
    if (em > 1.0 && extraElemPct > 0) em += extraElemPct;

    const vulnMult = monster.vulnTurns > 0 ? (1 + (monster.vulnPct || 0)) : 1.0;
    const baseDmg = Math.max(5, Math.floor((rawAtk * critMult - effectiveMonsterDef) * em * vulnMult));
    return { dmg: baseDmg, isCounter: em > 1.0 };
  };

  const executeMonsterAttacks = (currentMonsters, pObj, rosterArr, downedIdsArr, buffsObj, hBuffsObj) => {
    let updatedPlayer = { ...pObj };
    let updatedMonsters = currentMonsters.map(m => ({ ...m }));
    let updatedRoster = [...rosterArr];
    let updatedDownedIds = [...downedIdsArr];
    let updatedBuffs = { ...buffsObj };
    let casualtiesSummary = [];

    for (let idx = 0; idx < updatedMonsters.length; idx++) {
      const m = updatedMonsters[idx];
      if (m.hp <= 0) continue;
      if (updatedPlayer.hp <= 0) break;

      if (m.blindTurns > 0 && Math.random() < (m.blindPct || 0)) {
        addLog(`🕸️ 【${m.name}】受天羅地網束縛致盲，攻擊揮空失誤！`, 'sys');
        continue;
      }

      const poisonAtkMult = m.poisonTurns > 0 ? 0.80 : 1.0;
      const effectiveMonsterAtk = Math.floor(m.atk * poisonAtkMult);

      const em = getElementMultiplier(m.element, updatedPlayer.element, false);
      let rawDmg = Math.max(3, Math.floor((effectiveMonsterAtk - playerTotalDef) * em));

      if (playerRowBuff.physReducePct > 0) {
        rawDmg = Math.max(1, Math.floor(rawDmg * (1 - playerRowBuff.physReducePct)));
      }
      if (updatedPlayer.job === '猛將') {
        rawDmg = Math.max(1, Math.floor(rawDmg * 0.85));
      }
      if (updatedBuffs.reflectTurns > 0) {
        rawDmg = Math.max(1, Math.floor(rawDmg * 0.60));
      }
      if (updatedBuffs.baguaTurns > 0) {
        rawDmg = Math.max(1, Math.floor(rawDmg * (1 - (updatedBuffs.baguaReducePct || 0))));
      }
      if (rawFormBonus.damageTakenPct) {
        rawDmg = Math.max(1, Math.floor(rawDmg * (1 + rawFormBonus.damageTakenPct * formMultiplier)));
      }

      let hpDmg = rawDmg;
      if (updatedBuffs.shield > 0) {
        const absorbed = Math.min(updatedBuffs.shield, hpDmg);
        updatedBuffs.shield -= absorbed;
        hpDmg -= absorbed;
        addLog(`🛡️ 護盾為少俠吸收了 ${absorbed} 點傷害（剩餘護盾: ${updatedBuffs.shield}）！`, 'sys');
      }

      updatedPlayer.hp = Math.max(0, updatedPlayer.hp - hpDmg);
      addLog(
        `👹 【${m.name}】${m.poisonTurns > 0 ? '(中毒減攻20%)' : ''}襲擊${playerRowBuff.label}少俠，造成 ${hpDmg} 點傷害！`,
        'monster'
      );

      let totalReflectPct = 0;
      if (updatedBuffs.reflectTurns > 0) totalReflectPct += updatedBuffs.reflectPct || 0;
      if (updatedBuffs.baguaTurns > 0) totalReflectPct += updatedBuffs.baguaReflectPct || 0;

      if (totalReflectPct > 0 && rawDmg > 0) {
        const reflectDmg = Math.max(1, Math.floor(rawDmg * totalReflectPct));
        updatedMonsters[idx].hp = Math.max(0, updatedMonsters[idx].hp - reflectDmg);
        addLog(`🔄 護體反震將 ${reflectDmg} 點傷害反彈給【${m.name}】！`, 'player');
      }

      if (updatedPlayer.job === '猛將') {
        updatedPlayer.rage = Math.min(100, updatedPlayer.rage + 20);
      }

      if (updatedPlayer.hp <= 0) {
        addLog(`💀 少俠氣血歸零，不敵倒下！`, 'danger');
        break;
      }

      if (updatedBuffs.tauntTurns <= 0) {
        updatedRoster = updatedRoster.map(h => {
          if (!activeHeroInstanceIds.includes(h.instanceId) || h.hp <= 0) return h;
          const hRow = getHeroRowIdx(h.instanceId);
          const hRowBuff = getRowPositionBuffs(hRow * 3);

          const baseSplash = updatedPlayer.job === '猛將' ? 0.14 : 0.35;
          const rowRatio = hRowBuff.aggroWeight / Math.max(15, playerRowBuff.aggroWeight);
          const finalSplashChance = Math.min(0.75, Math.max(0.08, baseSplash * rowRatio));

          if (Math.random() < finalSplashChance) {
            const { effectiveDef } = calculateHeroEffectiveStats(h, isFengShui, hBuffsObj[h.instanceId], hRow);
            let hDmg = Math.max(2, Math.floor(effectiveMonsterAtk * 0.65) - Math.floor(effectiveDef * 0.5));
            if (hRowBuff.physReducePct > 0) {
              hDmg = Math.max(1, Math.floor(hDmg * (1 - hRowBuff.physReducePct)));
            }
            if (updatedBuffs.baguaTurns > 0) {
              hDmg = Math.max(1, Math.floor(hDmg * (1 - (updatedBuffs.baguaReducePct || 0))));
            }
            const newHp = Math.max(0, h.hp - hDmg);

            if (newHp === 0) {
              if (!updatedDownedIds.includes(h.instanceId)) {
                updatedDownedIds.push(h.instanceId);
                const { updatedHero, actualLoss, breakdownText } = applyHeroDeathStatPenalty({ ...h, hp: 0 });
                const penaltyMsg = `💔 ${hRowBuff.label}英雄【${h.name}】HP 歸零重傷瀕死！永久扣除 ${actualLoss} 點屬性（${breakdownText}）！`;
                addLog(penaltyMsg, 'danger');
                casualtiesSummary.push(penaltyMsg);
                return updatedHero;
              } else {
                addLog(`💀 英雄【${h.name}】再次倒下！`, 'sys');
                return { ...h, hp: 0 };
              }
            }
            return { ...h, hp: newHp };
          }
          return h;
        });
      }
    }

    return { updatedPlayer, updatedMonsters, updatedRoster, updatedDownedIds, updatedBuffs, casualtiesSummary };
  };

  const handleBattleDefeat = (pObj, finalRoster, casualtiesSummary = []) => {
    const expLoss = Math.floor(pObj.maxExp * 0.30);
    const actualExpLost = Math.min(pObj.exp, expLoss);
    const remainingExp = Math.max(0, pObj.exp - expLoss);

    const defeatedPlayer = {
      ...pObj,
      hp: 1,
      exp: remainingExp
    };

    setPlayer(defeatedPlayer);
    setHeroRoster(finalRoster);
    setMonsters([]);
    resetCombatStates();
    setCombatPhase('PLAYER_SELECT');

    addLog(`☠️ 戰鬥失敗！少俠損失了 ${actualExpLost} 點經驗值（退回安全營地，請立即前往客棧休養）。`, 'danger');

    setDefeatSummary({
      expLost: actualExpLost,
      remainingExp,
      maxExp: pObj.maxExp,
      casualties: casualtiesSummary
    });
  };

  const handleFleeCombat = () => {
    if (!isInCombat) return;
    if (Math.random() < 0.70) {
      addLog(`🏃 少俠施展輕功順利擺脫敵群，返回安全營地（整備功能已解鎖）！`, 'sys');
      setMonsters([]);
      resetCombatStates();
      setCombatPhase('PLAYER_SELECT');
    } else {
      addLog(`⚠️ 撤退失敗！敵軍封鎖退路並趁勢發動追擊！`, 'danger');
      const { updatedPlayer, updatedMonsters, updatedRoster, updatedDownedIds, updatedBuffs, casualtiesSummary } = executeMonsterAttacks(
        monsters,
        player,
        heroRoster,
        battleDownedHeroIds,
        combatBuffs,
        heroBattleBuffs
      );
      setPlayer(updatedPlayer);
      setMonsters(updatedMonsters);
      setHeroRoster(updatedRoster);
      setBattleDownedHeroIds(updatedDownedIds);
      setCombatBuffs(updatedBuffs);

      if (updatedPlayer.hp <= 0) {
        handleBattleDefeat(updatedPlayer, updatedRoster, casualtiesSummary);
        return;
      }
      setTurnCount(prev => prev + 1);
      setCombatPhase('PLAYER_SELECT');
    }
  };

  const handleExecuteRound = (actionInput = { type: 'attack' }, isFusionUltimate = false) => {
    if (!isInCombat) {
      addLog(`⚠️ 當前沒有敵人，請先點擊「🔍 尋找怪群」主動搜敵！`, 'sys');
      return;
    }

    setCombatPhase('EXECUTING');
    let currentMonsters = monsters.map(m => ({ ...m }));
    let currentPlayer = { ...player };
    let currentRoster = heroRoster.map(h => normalizeHero(h));
    let currentBuffs = { ...combatBuffs };
    let currentHeroBuffs = { ...heroBattleBuffs };

    let targetIdx = selectedTargetIndex;
    if (!currentMonsters[targetIdx] || currentMonsters[targetIdx].hp <= 0) {
      targetIdx = currentMonsters.findIndex(m => m.hp > 0);
      if (targetIdx === -1) targetIdx = 0;
    }

    const isWarlock = currentPlayer.job === '術士';
    const isArtisan = currentPlayer.job === '巧匠';
    const innateIgnoreDef = isArtisan ? 0.20 : 0;

    let forcedHeroAction = null;

    if (isFusionUltimate) {
      const targetM = currentMonsters[targetIdx];
      if (targetM) {
        let teamAtk = playerTotalAtk;
        activeHeroes.forEach(h => {
          if (h.hp > 0) {
            const { effectiveAtk } = calculateHeroEffectiveStats(h, isFengShui, currentHeroBuffs[h.instanceId], getHeroRowIdx(h.instanceId));
            teamAtk += effectiveAtk;
          }
        });
        const { dmg } = calculateDamageToMonster(teamAtk * 2.5, targetM, currentPlayer.element, {
          ignoreDefPct: innateIgnoreDef,
          isWarlock
        });
        targetM.hp = Math.max(0, targetM.hp - dmg);
        addLog(`✨ 發動【主僕合擊奧義】，全軍集火對【${targetM.name}】爆發 ${dmg} 點巨額打擊！`, 'player');
      }
      if (currentPlayer.job === '猛將') currentPlayer.rage = 0;
      else if (currentPlayer.job === '巧匠') currentPlayer.ammo = Math.max(0, currentPlayer.ammo - 4);
      else currentPlayer.mp = Math.max(0, currentPlayer.mp - 40);
    } else if (actionInput.type === 'attack' && currentMonsters[targetIdx]) {
      const targetM = currentMonsters[targetIdx];
      const hits = isArtisan && currentPlayer.ammo > 6 ? 2 : 1;

      for (let hIdx = 0; hIdx < hits; hIdx++) {
        if (targetM.hp <= 0) break;
        const { dmg, isCounter } = calculateDamageToMonster(playerTotalAtk, targetM, currentPlayer.element, {
          ignoreDefPct: innateIgnoreDef,
          isWarlock
        });
        targetM.hp = Math.max(0, targetM.hp - dmg);
        addLog(
          `🗡️ ${hits === 2 ? `【連環二連射 第${hIdx + 1}箭】` : '普通攻擊'}對【${targetM.name}】造成 ${dmg} 點傷害！`,
          'player'
        );
        if (isWarlock && isCounter) {
          currentPlayer.mp = Math.min(playerTotalMaxMp, currentPlayer.mp + 15);
          addLog(`🔮 【五行靈體】觸發相剋，額外回復 +15 MP！`, 'sys');
        }
      }

      if (currentPlayer.job === '猛將') {
        currentPlayer.rage = Math.min(100, currentPlayer.rage + 25);
        addLog(`🔥 猛將普攻攢怒 +25（目前怒氣: ${currentPlayer.rage}/100）`, 'sys');
      } else if (currentPlayer.job === '巧匠') {
        currentPlayer.ammo = Math.min(currentPlayer.maxAmmo, currentPlayer.ammo + 4);
        addLog(`🏹 巧匠填裝彈藥 +4（目前彈藥: ${currentPlayer.ammo}/${currentPlayer.maxAmmo}）`, 'sys');
      } else {
        currentPlayer.mp = Math.min(playerTotalMaxMp, currentPlayer.mp + 20);
        addLog(`💧 調息凝神恢復 +20 MP（目前: ${currentPlayer.mp}/${playerTotalMaxMp}）`, 'sys');
      }
    } else if (actionInput.type === 'skill' && actionInput.skill) {
      const sk = actionInput.skill;
      const skLvl = currentPlayer.skillLevels[actionInput.skillIdx] || 0;

      if (skLvl <= 0) {
        addLog(`🔒 技能【${sk.name}】尚未學習（Lv.0），請先至「技能樹」配點學習！`, 'sys');
        setCombatPhase('PLAYER_SELECT');
        return;
      }

      if (sk.id === 'p_s3') {
        const deadDeployed = currentRoster.filter(h => activeHeroInstanceIds.includes(h.instanceId) && h.hp <= 0);
        if (deadDeployed.length === 0) {
          addLog(`⚠️ 目前沒有已陣亡的登場英雄，無需施放【九轉還魂丹】（未消耗真元）！`, 'sys');
          setCombatPhase('PLAYER_SELECT');
          return;
        }
      }

      if (sk.id === 'f_s1') {
        const aliveDeployed = currentRoster.filter(h => activeHeroInstanceIds.includes(h.instanceId) && h.hp > 0);
        if (aliveDeployed.length === 0) {
          addLog(`⚠️ 目前沒有存活的登場英雄可供借法（未消耗真元）！`, 'sys');
          setCombatPhase('PLAYER_SELECT');
          return;
        }
      }

      let hasResource = true;
      if (sk.costType === 'rage' && currentPlayer.rage < sk.cost) hasResource = false;
      if (sk.costType === 'mp' && currentPlayer.mp < sk.cost) hasResource = false;
      if (sk.costType === 'ammo' && currentPlayer.ammo < sk.cost) hasResource = false;

      if (!hasResource) {
        addLog(`⚠️ 資源不足，無法發動【${sk.name}】！`, 'sys');
        setCombatPhase('PLAYER_SELECT');
        return;
      }

      if (sk.costType === 'rage') currentPlayer.rage -= sk.cost;
      if (sk.costType === 'mp') currentPlayer.mp -= sk.cost;
      if (sk.costType === 'ammo') currentPlayer.ammo -= sk.cost;

      const skStats = sk.getStatsAtLevel(skLvl);

      if (sk.id === 'w_s1') {
        const shieldGain = Math.floor(playerTotalMaxHp * skStats.shieldPct);
        currentBuffs.shield += shieldGain;
        currentBuffs.tauntTurns = 2;
        addLog(`🛡️ 猛將施展【金剛怒吼 (Lv.${skLvl})】，嘲諷全場敵怪 2 回合，並獲得 ${shieldGain} 點護盾！`, 'player');
      } else if (sk.id === 'w_s2') {
        const targetM = currentMonsters[targetIdx];
        if (targetM) {
          const { dmg } = calculateDamageToMonster(playerTotalAtk * skStats.mult, targetM, currentPlayer.element);
          targetM.hp = Math.max(0, targetM.hp - dmg);
          targetM.armorBreakTurns = 2;
          targetM.armorBreakPct = skStats.breakPct;
          addLog(`⚔️ 猛將施展【裂地破甲斬 (Lv.${skLvl})】，對【${targetM.name}】造成 ${dmg} 點傷害並破甲降防 ${Math.round(skStats.breakPct * 100)}% (2回合)！`, 'player');
        }
      } else if (sk.id === 'w_s3') {
        const targetM = currentMonsters[targetIdx];
        if (targetM) {
          const { dmg } = calculateDamageToMonster(playerTotalAtk * skStats.mult, targetM, currentPlayer.element);
          targetM.hp = Math.max(0, targetM.hp - dmg);
          currentBuffs.reflectTurns = 2;
          currentBuffs.reflectPct = skStats.reflectPct;
          addLog(`🔥 猛將施展【不動明王架勢 (Lv.${skLvl})】，對【${targetM.name}】造成 ${dmg} 點重擊，進入減傷 40%＋反彈 ${Math.round(skStats.reflectPct * 100)}% 狀態！`, 'player');
        }
      } else if (sk.id === 'a_s1') {
        const targetM = currentMonsters[targetIdx];
        if (targetM) {
          const isFullHp = targetM.hp === targetM.maxHp;
          const critMult = isFullHp ? 1.5 : 1.0;
          const { dmg } = calculateDamageToMonster(playerTotalAtk * skStats.mult, targetM, currentPlayer.element, {
            ignoreDefPct: 0.50,
            critMult
          });
          targetM.hp = Math.max(0, targetM.hp - dmg);
          addLog(`🎯 巧匠施展【穿雲追魂箭 (Lv.${skLvl})】${isFullHp ? '💥滿血必暴擊！' : ''}對【${targetM.name}】造成 ${dmg} 點無視半甲重傷！`, 'player');
        }
      } else if (sk.id === 'a_s2') {
        const hitIndices = pickUpToNMonsterIndices(currentMonsters, targetIdx, 3);
        hitIndices.forEach(mIdx => {
          const m = currentMonsters[mIdx];
          const { dmg } = calculateDamageToMonster(playerTotalAtk * skStats.mult, m, currentPlayer.element, {
            ignoreDefPct: innateIgnoreDef
          });
          m.hp = Math.max(0, m.hp - dmg);
          addLog(`🏹 巧匠施展【連珠散射 (Lv.${skLvl})】，貫穿【${m.name}】造成 ${dmg} 點傷害！`, 'player');
        });
      } else if (sk.id === 'a_s3') {
        const hitIndices = pickUpToNMonsterIndices(currentMonsters, targetIdx, 3);
        hitIndices.forEach(mIdx => {
          const m = currentMonsters[mIdx];
          const { dmg } = calculateDamageToMonster(playerTotalAtk * skStats.mult, m, currentPlayer.element, {
            ignoreDefPct: innateIgnoreDef
          });
          m.hp = Math.max(0, m.hp - dmg);
          m.blindTurns = 2;
          m.blindPct = skStats.blindPct;
          addLog(`🕸️ 巧匠施展【天羅地網陣 (Lv.${skLvl})】，對【${m.name}】造成 ${dmg} 點傷害並致盲 -${Math.round(skStats.blindPct * 100)}% 命中！`, 'player');
        });
      } else if (sk.id === 'm_s1') {
        const targetM = currentMonsters[targetIdx];
        if (targetM) {
          const { dmg, isCounter } = calculateDamageToMonster(playerTotalAtk * skStats.mult, targetM, currentPlayer.element, {
            isWarlock: true
          });
          targetM.hp = Math.max(0, targetM.hp - dmg);
          addLog(`🔮 術士施展【本命靈訣 (Lv.${skLvl})】，轟擊【${targetM.name}】造成 ${dmg} 點五行法傷！`, 'player');
          if (isCounter) {
            currentPlayer.mp = Math.min(playerTotalMaxMp, currentPlayer.mp + 15);
            addLog(`✨ 【五行靈體】相剋共鳴，返還 +15 MP！`, 'sys');
          }
        }
      } else if (sk.id === 'm_s2') {
        const counteredElem = ELEMENTS[currentPlayer.element]?.counters || '木';
        const hitIndices = pickUpToNMonsterIndices(currentMonsters, targetIdx, 5);
        let anyCountered = false;
        hitIndices.forEach(mIdx => {
          const m = currentMonsters[mIdx];
          const { dmg, isCounter } = calculateDamageToMonster(playerTotalAtk * skStats.mult, m, currentPlayer.element, {
            isWarlock: true
          });
          if (isCounter) anyCountered = true;
          m.hp = Math.max(0, m.hp - dmg);
          m.element = counteredElem;
          m.elemShiftTurns = 2;
          addLog(`☯️ 術士【五行逆轉大陣 (Lv.${skLvl})】轟擊【${m.name}】(${dmg}傷) 並將其轉化為【${counteredElem}】屬性！`, 'player');
        });
        if (anyCountered) {
          currentPlayer.mp = Math.min(playerTotalMaxMp, currentPlayer.mp + 15);
          addLog(`✨ 【五行靈體】相剋共鳴，返還 +15 MP！`, 'sys');
        }
      } else if (sk.id === 'm_s3') {
        const hitIndices = pickUpToNMonsterIndices(currentMonsters, targetIdx, 5);
        let anyCountered = false;
        hitIndices.forEach(mIdx => {
          const m = currentMonsters[mIdx];
          const { dmg, isCounter } = calculateDamageToMonster(playerTotalAtk * skStats.mult, m, currentPlayer.element, {
            isWarlock: true
          });
          if (isCounter) anyCountered = true;
          m.hp = Math.max(0, m.hp - dmg);
          m.burnTurns = 2;
          m.burnDmg = Math.max(10, Math.floor(playerTotalAtk * 0.45));
          addLog(`🔥 術士【九天焚世咒 (Lv.${skLvl})】天劫轟炸【${m.name}】造成 ${dmg} 點毀滅法傷並附加灼燒！`, 'player');
        });
        if (anyCountered) {
          currentPlayer.mp = Math.min(playerTotalMaxMp, currentPlayer.mp + 15);
          addLog(`✨ 【五行靈體】相剋共鳴，返還 +15 MP！`, 'sys');
        }
      } else if (sk.id === 'p_s1') {
        const targetM = currentMonsters[targetIdx];
        if (targetM) {
          const { dmg } = calculateDamageToMonster(playerTotalAtk * skStats.mult, targetM, currentPlayer.element);
          targetM.hp = Math.max(0, targetM.hp - dmg);
          targetM.poisonTurns = 3;
          targetM.poisonPct = skStats.poisonPct;
          targetM.poisonStacks = Math.min(2, (targetM.poisonStacks || 0) + 1);
          addLog(`🧪 藥師施展【穿心腐骨散 (Lv.${skLvl})】，對【${targetM.name}】造成 ${dmg} 點毒傷並附加中毒（${targetM.poisonStacks}層毒傷＋削弱 20% 攻擊力）！`, 'player');
        }
      } else if (sk.id === 'p_s2') {
        const hitIndices = pickUpToNMonsterIndices(currentMonsters, targetIdx, 3);
        hitIndices.forEach(mIdx => {
          const m = currentMonsters[mIdx];
          const { dmg } = calculateDamageToMonster(playerTotalAtk * skStats.mult, m, currentPlayer.element);
          m.hp = Math.max(0, m.hp - dmg);
          m.poisonTurns = 3;
          m.poisonPct = skStats.poisonPct;
          m.poisonStacks = Math.min(2, (m.poisonStacks || 0) + 1);
          addLog(`☠️ 藥師施展【五毒瘴氣 (Lv.${skLvl})】，毒霧籠罩【${m.name}】(${dmg}傷) 並使其陷入中毒（削弱 20% 攻擊力）！`, 'player');
        });
      } else if (sk.id === 'p_s3') {
        const deadHeroes = currentRoster.filter(h => activeHeroInstanceIds.includes(h.instanceId) && h.hp <= 0);
        const targetHero = deadHeroes[0];
        if (targetHero) {
          const { effectiveMaxHp } = calculateHeroEffectiveStats(targetHero, isFengShui, null, getHeroRowIdx(targetHero.instanceId));
          const revivedHp = Math.max(1, Math.floor(effectiveMaxHp * skStats.reviveHpPct));
          currentRoster = currentRoster.map(h => h.instanceId === targetHero.instanceId ? { ...h, hp: revivedHp } : h);
          currentHeroBuffs[targetHero.instanceId] = {
            surgeTurns: 2,
            surgeAtkPct: skStats.atkBuffPct
          };
          addLog(`💊 藥師餵服【九轉還魂丹 (Lv.${skLvl})】，成功復活英雄【${targetHero.name}】（恢復 ${revivedHp} HP）並激發攻擊力 +${Math.round(skStats.atkBuffPct * 100)}%！`, 'player');
        }
      } else if (sk.id === 'f_s1') {
        const aliveHeroes = currentRoster.filter(h => activeHeroInstanceIds.includes(h.instanceId) && h.hp > 0);
        const chosenHero = aliveHeroes[Math.floor(Math.random() * aliveHeroes.length)];
        if (chosenHero) {
          forcedHeroAction = {
            heroInstanceId: chosenHero.instanceId,
            bonusDmgPct: skStats.bonusDmgPct
          };
          addLog(`☯️ 風水師施展【乾坤借法 (Lv.${skLvl})】，引動天地靈氣令英雄【${chosenHero.name}】立即額外爆發主動技能！`, 'player');
        }
      } else if (sk.id === 'f_s2') {
        currentBuffs.baguaTurns = 2;
        currentBuffs.baguaReducePct = skStats.reducePct;
        currentBuffs.baguaReflectPct = skStats.reflectPct;
        addLog(`🔯 風水師展開【八卦護身結界 (Lv.${skLvl})】，全隊 2 回合承傷 -${Math.round(skStats.reducePct * 100)}% 並反彈 ${Math.round(skStats.reflectPct * 100)}% 傷害！`, 'player');
      } else if (sk.id === 'f_s3') {
        currentMonsters.forEach(m => {
          if (m.hp > 0) {
            const { dmg } = calculateDamageToMonster(playerTotalAtk * skStats.mult, m, currentPlayer.element);
            m.hp = Math.max(0, m.hp - dmg);
            m.vulnTurns = 2;
            m.vulnPct = skStats.vulnPct;
          }
        });
        addLog(`🌌 風水師施展【奇門天象變 (Lv.${skLvl})】，造成微弱法傷並使全場敵怪陷入「易傷 +${Math.round(skStats.vulnPct * 100)}%」(2回合)！`, 'player');
      }
    }

    let teamHealFromHeroes = 0;

    const executeSingleHeroTurn = (h, forceSkill = false, extraBonusMult = 0) => {
      if (!activeHeroInstanceIds.includes(h.instanceId) || h.hp <= 0) return h;
      const aliveTargets = currentMonsters.filter(m => m.hp > 0);
      if (aliveTargets.length === 0) return h;
      const validTarget = aliveTargets[Math.floor(Math.random() * aliveTargets.length)];

      const hRow = getHeroRowIdx(h.instanceId);
      const { effectiveAtk, elemDmgPct, skillChance } = calculateHeroEffectiveStats(
        h,
        isFengShui,
        currentHeroBuffs[h.instanceId],
        hRow
      );
      const activeCards = h.activeSkillSlots || [];
      const shouldCastSkill = activeCards.length > 0 && (forceSkill || Math.random() < skillChance);

      if (shouldCastSkill) {
        const cardToCast = activeCards[Math.floor(Math.random() * activeCards.length)];
        const mult = (cardToCast.mult || 1.8) * (1 + extraBonusMult);

        if (cardToCast.target === 'aoe') {
          currentMonsters.forEach(m => {
            if (m.hp > 0) {
              const { dmg } = calculateDamageToMonster(effectiveAtk * mult, m, h.element, { extraElemPct: elemDmgPct });
              m.hp = Math.max(0, m.hp - dmg);
            }
          });
          addLog(`✨ ${forceSkill ? '【乾坤借法連動】' : ''}【Tier ${h.tier}】英雄【${h.name}】觸發技能卡【${cardToCast.name}】，橫掃全場造成廣域打擊！`, 'hero');
        } else if (cardToCast.target === 'heal') {
          const healVal = Math.floor(effectiveAtk * mult);
          teamHealFromHeroes += healVal;
          addLog(`🌿 ${forceSkill ? '【乾坤借法連動】' : ''}【Tier ${h.tier}】英雄【${h.name}】施展【${cardToCast.name}】，為全隊恢復 +${healVal} HP！`, 'hero');
        } else {
          const { dmg } = calculateDamageToMonster(effectiveAtk * mult, validTarget, h.element, { extraElemPct: elemDmgPct });
          validTarget.hp = Math.max(0, validTarget.hp - dmg);
          addLog(`⚡ ${forceSkill ? '【乾坤借法連動】' : ''}【Tier ${h.tier}】英雄【${h.name}】爆發技能卡【${cardToCast.name}】，對【${validTarget.name}】造成 ${dmg} 點重創！`, 'hero');
        }
      } else {
        const bonusMult = forceSkill ? (1 + extraBonusMult) : 1.0;
        const { dmg } = calculateDamageToMonster(effectiveAtk * bonusMult, validTarget, h.element, { extraElemPct: elemDmgPct });
        validTarget.hp = Math.max(0, validTarget.hp - dmg);
        addLog(`💥 ${forceSkill ? '【乾坤借法連動】' : ''}英雄【${h.name}】攻擊【${validTarget.name}】，造成 ${dmg} 點打擊！`, 'hero');
      }

      let updatedRage = h.rage || 0;
      let updatedAmmo = h.ammo || 6;
      let updatedMp = h.mp || 50;
      if (h.heroClass === '猛將') updatedRage = Math.min(100, updatedRage + 20);
      else if (h.heroClass === '巧匠') updatedAmmo = Math.min(h.maxAmmo || 6, updatedAmmo + 2);
      else updatedMp = Math.min(h.maxMp || 100, updatedMp + 15);

      return { ...h, rage: updatedRage, ammo: updatedAmmo, mp: updatedMp };
    };

    currentRoster = currentRoster.map(h => executeSingleHeroTurn(h, false, 0));

    if (forcedHeroAction) {
      currentRoster = currentRoster.map(h =>
        h.instanceId === forcedHeroAction.heroInstanceId
          ? executeSingleHeroTurn(h, true, forcedHeroAction.bonusDmgPct)
          : h
      );
    }

    if (teamHealFromHeroes > 0) {
      currentPlayer.hp = Math.min(playerTotalMaxHp, currentPlayer.hp + teamHealFromHeroes);
      currentRoster = currentRoster.map(h => {
        if (!activeHeroInstanceIds.includes(h.instanceId) || h.hp <= 0) return h;
        const { effectiveMaxHp } = calculateHeroEffectiveStats(h, isFengShui, currentHeroBuffs[h.instanceId], getHeroRowIdx(h.instanceId));
        return { ...h, hp: Math.min(effectiveMaxHp, h.hp + teamHealFromHeroes) };
      });
    }

    if (currentMonsters.every(m => m.hp <= 0)) {
      addLog(`🎉 敵方全數殲滅！戰鬥勝利（整備功能已解鎖）！`, 'sys');
      handleBattleVictory(currentPlayer, currentMonsters, currentRoster);
      return;
    }

    let anyPoisonedAlive = false;
    currentMonsters = currentMonsters.map(m => {
      if (m.hp <= 0) return m;
      let updatedM = { ...m };

      if (updatedM.poisonTurns > 0) {
        const poisonDmg = Math.max(1, Math.floor(updatedM.maxHp * (updatedM.poisonPct || 0.08) * (updatedM.poisonStacks || 1)));
        updatedM.hp = Math.max(0, updatedM.hp - poisonDmg);
        addLog(`☠️ 【${updatedM.name}】劇毒發作，受到 ${poisonDmg} 點無視防禦真傷（攻擊力持續 -20%）！`, 'player');
        if (updatedM.hp > 0) anyPoisonedAlive = true;
      }

      if (updatedM.hp > 0 && updatedM.burnTurns > 0) {
        const burnDmg = updatedM.burnDmg || 15;
        updatedM.hp = Math.max(0, updatedM.hp - burnDmg);
        addLog(`🔥 【${updatedM.name}】受到灼燒持續傷害 ${burnDmg} 點！`, 'player');
      }

      return updatedM;
    });

    if (currentMonsters.every(m => m.hp <= 0)) {
      addLog(`🎉 敵軍在劇毒與烈焰中全數倒下！戰鬥勝利（整備功能已解鎖）！`, 'sys');
      handleBattleVictory(currentPlayer, currentMonsters, currentRoster);
      return;
    }

    const { updatedPlayer, updatedMonsters, updatedRoster, updatedDownedIds, updatedBuffs, casualtiesSummary } = executeMonsterAttacks(
      currentMonsters,
      currentPlayer,
      currentRoster,
      battleDownedHeroIds,
      currentBuffs,
      currentHeroBuffs
    );

    setBattleDownedHeroIds(updatedDownedIds);

    if (updatedPlayer.hp <= 0) {
      handleBattleDefeat(updatedPlayer, updatedRoster, casualtiesSummary);
      return;
    }

    if (updatedMonsters.every(m => m.hp <= 0)) {
      addLog(`🎉 敵軍在反震護體下全數覆滅！戰鬥勝利（整備功能已解鎖）！`, 'sys');
      handleBattleVictory(updatedPlayer, updatedMonsters, updatedRoster);
      return;
    }

    const tickedMonsters = updatedMonsters.map(m => {
      const nextElemShift = Math.max(0, (m.elemShiftTurns || 0) - 1);
      const nextPoison = Math.max(0, (m.poisonTurns || 0) - 1);
      return {
        ...m,
        armorBreakTurns: Math.max(0, (m.armorBreakTurns || 0) - 1),
        blindTurns: Math.max(0, (m.blindTurns || 0) - 1),
        elemShiftTurns: nextElemShift,
        element: nextElemShift === 0 ? (m.originalElement || m.element) : m.element,
        burnTurns: Math.max(0, (m.burnTurns || 0) - 1),
        poisonTurns: nextPoison,
        poisonStacks: nextPoison === 0 ? 0 : m.poisonStacks,
        vulnTurns: Math.max(0, (m.vulnTurns || 0) - 1)
      };
    });

    const tickedBuffs = {
      ...updatedBuffs,
      tauntTurns: Math.max(0, (updatedBuffs.tauntTurns || 0) - 1),
      reflectTurns: Math.max(0, (updatedBuffs.reflectTurns || 0) - 1),
      baguaTurns: Math.max(0, (updatedBuffs.baguaTurns || 0) - 1)
    };

    const tickedHeroBuffs = {};
    Object.keys(currentHeroBuffs).forEach(hId => {
      const nextTurns = Math.max(0, (currentHeroBuffs[hId]?.surgeTurns || 0) - 1);
      if (nextTurns > 0) {
        tickedHeroBuffs[hId] = { ...currentHeroBuffs[hId], surgeTurns: nextTurns };
      }
    });

    if (updatedPlayer.job === '藥師') {
      const regenMp = 10 + (anyPoisonedAlive ? 8 : 0);
      updatedPlayer.mp = Math.min(playerTotalMaxMp, updatedPlayer.mp + regenMp);
    }

    setMonsters(tickedMonsters);
    setPlayer(updatedPlayer);
    setHeroRoster(updatedRoster);
    setCombatBuffs(tickedBuffs);
    setHeroBattleBuffs(tickedHeroBuffs);
    setTurnCount(prev => prev + 1);
    setCombatPhase('PLAYER_SELECT');
  };

  const handleBattleVictory = (pObj, defeatedMonsters, currentRoster) => {
    let totalGold = 0, totalExp = 0, droppedStones = 0;
    let droppedEquipments = [];

    defeatedMonsters.forEach(m => {
      totalGold += m.gold;
      totalExp += m.exp;
      if (Math.random() < 0.45) droppedStones += 1;
      if (Math.random() < 0.35) {
        const template = ITEM_DROP_POOL[Math.floor(Math.random() * ITEM_DROP_POOL.length)];
        droppedEquipments.push({ ...template, refineLevel: 0, uid: `eq_${Date.now()}_${Math.random()}` });
      }
    });

    let droppedHero = null;
    if (Math.random() < 0.30) {
      const candidates = HERO_TEMPLATES.filter(t => t.tier <= Math.min(5, currentZoneIndex + 2));
      const picked = candidates[Math.floor(Math.random() * candidates.length)];
      droppedHero = normalizeHero(instantiateHero(picked, true, null, getRandomElement));
    }

    let droppedSkillCard = null;
    if (Math.random() < 0.35) {
      const cardTemplate = SKILL_CARDS_DB[Math.floor(Math.random() * SKILL_CARDS_DB.length)];
      droppedSkillCard = createSkillCardInstance(cardTemplate);
      setSkillCardsInventory(prev => [...prev, droppedSkillCard]);
    }

    let mergedRoster = [...currentRoster];
    if (droppedHero) {
      mergedRoster.push(droppedHero);
    }

    let msgs = [];
    const finalRoster = mergedRoster.map(hero => {
      if (!activeHeroInstanceIds.includes(hero.instanceId)) return hero;
      const { updatedHero, upgradedMsgs } = processHeroExpGain(hero, totalExp);
      if (upgradedMsgs.length > 0) msgs.push(...upgradedMsgs);
      return updatedHero;
    });

    let newPlayer = {
      ...pObj,
      gold: pObj.gold + totalGold,
      refineStones: pObj.refineStones + droppedStones,
      exp: pObj.level >= MAX_LEVEL ? 0 : pObj.exp + totalExp
    };

    while (newPlayer.level < MAX_LEVEL && newPlayer.exp >= newPlayer.maxExp) {
      newPlayer.exp -= newPlayer.maxExp;
      newPlayer.level += 1;
      newPlayer.maxExp = Math.floor(newPlayer.maxExp * 1.45);
      newPlayer.maxHp += 30;
      newPlayer.maxMp += 20;
      newPlayer.hp = newPlayer.maxHp;
      newPlayer.mp = newPlayer.maxMp;
      newPlayer.statPoints += 5;
      newPlayer.sp += 1;
      newPlayer.tp += 1;
      msgs.push(`🎉 少俠升級至 Level ${newPlayer.level}${newPlayer.level === MAX_LEVEL ? ' (已達滿級上限!)' : ''}！獲得 5 點屬性點與 1 點 SP！`);
    }

    if (newPlayer.level >= MAX_LEVEL) {
      newPlayer.level = MAX_LEVEL;
      newPlayer.exp = 0;
    }

    setPlayer(newPlayer);
    setHeroRoster(finalRoster);
    setMonsters([]);
    resetCombatStates();
    setCombatPhase('PLAYER_SELECT');

    if (droppedEquipments.length > 0) {
      setEquipmentInventory(prev => [...prev, ...droppedEquipments]);
    }

    setVictorySummary({
      gold: totalGold,
      exp: totalExp,
      stones: droppedStones,
      droppedEquipments,
      droppedHero,
      droppedSkillCard,
      msgs
    });
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
    let newSockets = [...(item.sockets || [null])];
    newSockets[socketIdx] = gem;
    const updated = { ...item, sockets: newSockets };

    setEquipmentInventory(prev => prev.map(i => i.uid === item.uid ? updated : i));
    if (player.equipped[item.type]?.uid === item.uid) {
      setPlayer(p => ({ ...p, equipped: { ...p.equipped, [item.type]: updated } }));
    }
  };

  const handleExportSave = () => {
    const jsonStr = JSON.stringify({
      player,
      heroRoster,
      activeHeroInstanceIds,
      currentFormation,
      formationSlots: syncedSlots,
      equipmentInventory,
      skillCardsInventory,
      towerFloor
    }, null, 2);
    setJsonSaveText(jsonStr);
    setSaveLoadStatus('存檔 JSON 匯出成功！');
  };

  const handleImportSave = () => {
    if (isInCombat) {
      setSaveLoadStatus('🔒 戰鬥中無法讀取存檔！');
      return;
    }
    try {
      const parsed = JSON.parse(jsonSaveText);
      if (parsed && parsed.player) {
        const loadedP = {
          ...parsed.player,
          level: Math.min(MAX_LEVEL, parsed.player.level || 1)
        };
        const loadedForm = loadedP.job === '風水師' ? (parsed.currentFormation || 'none') : 'none';
        const loadedActiveIds = parsed.activeHeroInstanceIds || [];
        setPlayer(loadedP);
        setHeroRoster((parsed.heroRoster || []).map(normalizeHero));
        setActiveHeroInstanceIds(loadedActiveIds);
        setCurrentFormation(loadedForm);
        setFormationSlots(syncFormationSlots(loadedForm, parsed.formationSlots || {}, loadedActiveIds));
        setEquipmentInventory(parsed.equipmentInventory || []);
        setSkillCardsInventory(parsed.skillCardsInventory || []);
        setTowerFloor(parsed.towerFloor || 1);
        setMonsters([]);
        resetCombatStates();
        setGameStarted(true);
        setSaveLoadStatus('✅ 成功匯入遊戲進度！');
      }
    } catch (e) {
      setSaveLoadStatus('❌ 匯入失敗，請確認 JSON 格式。');
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
