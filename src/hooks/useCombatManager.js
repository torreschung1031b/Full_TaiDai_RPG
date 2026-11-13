import { useState, useEffect, useCallback } from 'react';
import { ZONES } from '../data/constants';
import { CLASS_CONFIGS } from '../data/classes';
import {
  getRandomElement,
  calculateHeroEffectiveStats
} from '../utils/statCalculator';
import {
  resolveCombatRound,
  resolveFleeCombat,
  pickBestAutoCombatAction,
  simulateZoneSweep,
  getZoneSweepReqLevel
} from '../utils/combatEngine';

export function useCombatManager({
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
}) {
  const [currentZoneIndex, setCurrentZoneIndex] = useState(0);
  const [activeTowerFloor, setActiveTowerFloor] = useState(null);
  const [monsters, setMonsters] = useState([]);
  const [selectedTargetIndex, setSelectedTargetIndex] = useState(0);
  const [lastRoundHits, setLastRoundHits] = useState({ monsters: {}, allies: {} });
  const [combatPhase, setCombatPhase] = useState('PLAYER_SELECT');
  const [autoBattle, setAutoBattle] = useState(false);
  const [autoTower, setAutoTower] = useState(false);
  const [victorySummary, setVictorySummary] = useState(null);
  const [defeatSummary, setDefeatSummary] = useState(null);

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

  const isInCombat = monsters.some(m => m.hp > 0);

  const resetCombatStates = useCallback((initialShield = 0) => {
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
  }, []);

  const computeOpeningAwakeningBonus = useCallback((deployedHeroes) => {
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
  }, [isFengShui, getHeroRowIdx]);

  const handleToggleAutoBattle = () => {
    setAutoBattle(prev => {
      const next = !prev;
      if (next) {
        setDefeatSummary(null);
      }
      addLog(
        next
          ? '🤖 已開啟【智能自動戰鬥】：AI 將自動搜敵並釋放冷卻完畢的技能與普攻（隨時可點擊關閉接管）！'
          : '🖐️ 已關閉【智能自動戰鬥】，切換為手動戰術操作！',
        'sys'
      );
      return next;
    });
  };

  const handleToggleAutoTower = useCallback(() => {
    setAutoTower(prev => {
      const next = !prev;
      if (next) {
        setAutoBattle(true);
        setDefeatSummary(null);
      }
      addLog(
        next
          ? '🗼 已開啟【自動爬塔】：通關後將自動結算並持續挑戰下一層（戰敗或手動關閉時停止）！'
          : '🖐️ 已關閉【自動爬塔】，通關本層後將停留在鎮魔塔畫面！',
        'sys'
      );
      return next;
    });
  }, [addLog]);

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

  const spawnEncounter = useCallback((zoneIdx, customActiveHeroes = null) => {
    if (isInCombat) {
      addLog(`⚠️ 當前已在戰鬥中，請先擊敗敵軍或嘗試撤退！`, 'sys');
      return [];
    }
    if (player.hp <= 0) {
      setAutoBattle(false);
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
  }, [
    isInCombat,
    addLog,
    player.hp,
    player.job,
    activeHeroes,
    computeOpeningAwakeningBonus,
    setPlayer,
    playerTotalMaxMp,
    resetCombatStates,
    setTurnCount,
    autoBattle
  ]);

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

  const handleStartTowerChallenge = useCallback(() => {
    if (isInCombat) {
      addLog(`⚠️ 當前已在戰鬥中，無法開啟新的鎮魔塔挑戰！`, 'sys');
      return;
    }
    if (player.hp <= 0) {
      setAutoTower(false);
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
  }, [
    isInCombat,
    player.hp,
    towerFloor,
    computeOpeningAwakeningBonus,
    activeHeroes,
    setPlayer,
    playerTotalMaxMp,
    addLog,
    resetCombatStates,
    setTurnCount,
    setActiveTab
  ]);

  const handleFleeCombat = () => {
    if (!isInCombat) return;
    setAutoBattle(false);
    setAutoTower(false);
    const wasTower = Boolean(activeTowerFloor);
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
      if (wasTower) setActiveTab('tower');
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
      if (wasTower) setActiveTab('tower');
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

  const handleExecuteRound = useCallback((actionInput = { type: 'attack' }) => {
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
        setActiveTab('tower');
        setVictorySummary({
          ...res.victorySummary,
          isTowerVictory: true,
          clearedFloor: res.clearedTowerFloor
        });
      } else {
        setVictorySummary(res.victorySummary);
      }
      return;
    }

    if (res.outcome === 'DEFEAT') {
      const wasTower = Boolean(activeTowerFloor);
      setAutoBattle(false);
      setAutoTower(false);
      setPlayer(res.defeatedPlayer);
      setHeroRoster(res.finalRoster);
      setMonsters([]);
      setActiveTowerFloor(null);
      resetCombatStates();
      setCombatPhase('PLAYER_SELECT');
      setDefeatSummary(res.defeatSummary);
      if (wasTower) setActiveTab('tower');
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
  }, [
    isInCombat,
    addLog,
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
    getHeroRowIdx,
    appendBatchLogs,
    setPlayer,
    setHeroRoster,
    resetCombatStates,
    setEquipmentInventory,
    setSkillCardsInventory,
    setTowerFloor,
    setTowerBestFloor,
    setActiveTab,
    setTurnCount
  ]);

  // 🤖 1. 戰鬥中自動出招排程
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
  }, [
    gameStarted,
    autoBattle,
    isInCombat,
    combatPhase,
    player,
    combatBuffs,
    activeHeroInstanceIds,
    heroRoster,
    handleExecuteRound
  ]);

  // 🤖 2. 野外自動連戰搜敵排程（營地開啟自動戰鬥，或野外勝利後自動下一場）
  useEffect(() => {
    if (!gameStarted || !autoBattle || autoTower || activeTowerFloor || isInCombat || combatPhase !== 'PLAYER_SELECT') {
      return;
    }
    if (defeatSummary) {
      setAutoBattle(false);
      return;
    }
    // 掃蕩結算不自動觸發連戰
    if (victorySummary?.isSweep) return;

    if (player.hp <= 1) {
      setAutoBattle(false);
      addLog('⚠️ 少俠氣血過低，已自動停止野外連戰，請先客棧休養！', 'danger');
      return;
    }

    const delay = victorySummary ? 1200 : 400;
    const timer = setTimeout(() => {
      if (victorySummary) setVictorySummary(null);
      spawnEncounter(currentZoneIndex);
    }, delay);

    return () => clearTimeout(timer);
  }, [
    gameStarted,
    autoBattle,
    autoTower,
    activeTowerFloor,
    isInCombat,
    combatPhase,
    victorySummary,
    defeatSummary,
    player.hp,
    currentZoneIndex,
    addLog,
    spawnEncounter
  ]);

  // 🗼 3. 自動爬塔排程（通關後短暫顯示結算，隨即自動進入下一層）
  useEffect(() => {
    if (!gameStarted || !autoTower || isInCombat || combatPhase !== 'PLAYER_SELECT') return;
    if (defeatSummary) {
      setAutoTower(false);
      return;
    }
    if (!victorySummary?.isTowerVictory) return;

    if (player.hp <= 0) {
      setAutoTower(false);
      addLog('⚠️ 少俠氣血耗盡，已自動停止爬塔！', 'danger');
      return;
    }

    const timer = setTimeout(() => {
      setVictorySummary(null);
      handleStartTowerChallenge();
    }, 1200);

    return () => clearTimeout(timer);
  }, [
    gameStarted,
    autoTower,
    isInCombat,
    combatPhase,
    victorySummary,
    defeatSummary,
    player.hp,
    addLog,
    handleStartTowerChallenge
  ]);

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

  return {
    isInCombat,
    currentZoneIndex,
    activeTowerFloor,
    setActiveTowerFloor,
    monsters,
    setMonsters,
    selectedTargetIndex,
    setSelectedTargetIndex,
    lastRoundHits,
    setLastRoundHits,
    combatPhase,
    autoBattle,
    setAutoBattle,
    autoTower,
    setAutoTower,
    handleToggleAutoTower,
    victorySummary,
    setVictorySummary,
    defeatSummary,
    setDefeatSummary,
    combatBuffs,
    heroBattleBuffs,
    resetCombatStates,
    handleToggleAutoBattle,
    handleSelectZone,
    spawnEncounter,
    handleSweepZone,
    handleStartTowerChallenge,
    handleFleeCombat,
    handleExecuteRound,
    handleRestInn
  };
}
