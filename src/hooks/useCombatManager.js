import { useState, useCallback, useRef } from 'react';
import { ZONES } from '../data/constants';
import { CLASS_CONFIGS } from '../data/classes';
import { calculateHeroEffectiveStats } from '../utils/statCalculator';
import {
  resolveCombatRound,
  resolveFleeCombat,
  simulateZoneSweep,
  getZoneSweepReqLevel
} from '../utils/combatEngine';
import { buildZoneEncounter, buildTowerEncounter } from '../utils/encounterGenerator';
import { useAutoCombatScheduler } from './useAutoCombatScheduler';
import {
  createInitialBattleStats,
  accumulateStatsFromRoundLogs
} from '../components/combat/BattleMvpPanel';

const SPEED_CONFIG = {
  1: { roundMs: 450, summaryMs: 3000, label: '1x 正常' },
  2: { roundMs: 220, summaryMs: 1600, label: '2x 疾速' },
  3: { roundMs: 110, summaryMs: 900, label: '3x 極速' }
};

const INITIAL_COMBAT_BUFFS = {
  shield: 0,
  tauntTurns: 0,
  reflectTurns: 0,
  reflectPct: 0,
  baguaTurns: 0,
  baguaReducePct: 0,
  baguaReflectPct: 0,
  skillCooldowns: { 0: 0, 1: 0, 2: 0 }
};

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
  const [battleSpeed, setBattleSpeed] = useState(1);
  const [victorySummary, setVictorySummary] = useState(null);
  const [defeatSummary, setDefeatSummary] = useState(null);

  const [combatBuffs, setCombatBuffs] = useState(INITIAL_COMBAT_BUFFS);
  const [heroBattleBuffs, setHeroBattleBuffs] = useState({});
  const [battleDownedHeroIds, setBattleDownedHeroIds] = useState([]);

  // 追蹤單場戰鬥 MVP 數據統計（不觸發額外重渲染）
  const battleStatsRef = useRef(null);

  const isInCombat = monsters.some(m => m.hp > 0);
  const speedMeta = SPEED_CONFIG[battleSpeed] || SPEED_CONFIG[1];

  const handleCycleBattleSpeed = useCallback(() => {
    setBattleSpeed(prev => (prev === 1 ? 2 : prev === 2 ? 3 : 1));
  }, []);

  const resetCombatStates = useCallback((initialShield = 0) => {
    setCombatBuffs({ ...INITIAL_COMBAT_BUFFS, shield: initialShield, skillCooldowns: { 0: 0, 1: 0, 2: 0 } });
    setHeroBattleBuffs({});
    setBattleDownedHeroIds([]);
    setLastRoundHits({ monsters: {}, allies: {} });
  }, []);

  const applyOpeningAwakeningAndResources = useCallback((deployedHeroes, logAmmo = false) => {
    const awakenedList = deployedHeroes.filter(h => h.hp > 0 && (h.fusionLevel || 0) >= 3);
    let openingShield = 0;
    awakenedList.forEach(h => {
      const { effectiveMaxHp } = calculateHeroEffectiveStats(h, isFengShui, null, getHeroRowIdx(h.instanceId));
      openingShield += Math.floor(effectiveMaxHp * 0.15);
    });

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

    if (logAmmo && player.job === '巧匠') {
      addLog(`🏹 【連環機巧】巧匠開戰前裝填完畢，機關彈藥補滿至 12/12！`, 'sys');
    }
    if (awakenCount > 0) {
      addLog(
        `🌟 【★+3 護主靈罡覺醒】${awakenedList.map(h => h.name).join('、')} 激發護體真氣，開戰提供 +${openingShield} 點護盾並補充少俠初始真元！`,
        'sys'
      );
    }
    return openingShield;
  }, [isFengShui, getHeroRowIdx, setPlayer, playerTotalMaxMp, player.job, addLog]);

  const handleToggleAutoBattle = useCallback(() => {
    setAutoBattle(prev => {
      const next = !prev;
      if (next) {
        setDefeatSummary(null);
        setCombatPhase('PLAYER_SELECT');
      } else {
        setAutoTower(false);
      }
      addLog(
        next
          ? '🤖 已開啟【智能自動戰鬥】：AI 將自動搜敵並釋放冷卻完畢的技能與普攻（隨時可點擊關閉接管）！'
          : '🖐️ 已停止【智能自動戰鬥】，切換為手動操作！',
        'sys'
      );
      return next;
    });
  }, [addLog]);

  const handleToggleAutoTower = useCallback(() => {
    setAutoTower(prev => {
      const next = !prev;
      setAutoBattle(next);
      if (next) {
        setDefeatSummary(null);
        setCombatPhase('PLAYER_SELECT');
      }
      addLog(
        next
          ? '🗼 已開啟【自動爬塔】：通關後結算畫面停留並持續挑戰下一層（戰敗或手動關閉時停止）！'
          : '🖐️ 已停止【自動爬塔】，已切換為手動操作！',
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
    const { zoneName, list } = buildZoneEncounter(zoneIdx, 1 + deployed.length);
    const openingShield = applyOpeningAwakeningAndResources(deployed, true);

    battleStatsRef.current = createInitialBattleStats(player, deployed);
    resetCombatStates(openingShield);
    setActiveTowerFloor(null);
    setMonsters(list);
    setSelectedTargetIndex(0);
    setTurnCount(1);
    setCombatPhase('PLAYER_SELECT');
    addLog(`⚔️ 【${zoneName}】主動搜敵遭遇 ${list.length} 隻敵怪！戰鬥開始${autoBattle ? '（🤖 自動戰鬥託管中）' : ''}！`, 'sys');
    return list;
  }, [isInCombat, player, activeHeroes, applyOpeningAwakeningAndResources, resetCombatStates, setTurnCount, autoBattle, addLog]);

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
    const { isBossFloor, list } = buildTowerEncounter(floor, 1 + activeHeroes.length);
    const openingShield = applyOpeningAwakeningAndResources(activeHeroes, false);

    battleStatsRef.current = createInitialBattleStats(player, activeHeroes);
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
  }, [isInCombat, player, towerFloor, activeHeroes, applyOpeningAwakeningAndResources, resetCombatStates, setTurnCount, setActiveTab, addLog]);

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

    const res = simulateZoneSweep({
      player,
      currentRoster: heroRoster,
      activeHeroInstanceIds,
      currentZoneIndex,
      sweepCount,
      isFengShui,
      getHeroRowIdx,
      classSkills: CLASS_CONFIGS[player.job]?.skills || [],
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
    if (res.allDroppedEquipments?.length > 0) setEquipmentInventory(prev => [...prev, ...res.allDroppedEquipments]);
    if (res.allDroppedSkillCards?.length > 0) setSkillCardsInventory(prev => [...prev, ...res.allDroppedSkillCards]);

    const { completedBattles = 0, gold = 0, exp = 0, stones = 0 } = res.sweepSummary;
    setVictorySummary(res.sweepSummary);
    addLog(
      res.isDefeated
        ? `☠️ 快速掃蕩【${ZONES[currentZoneIndex]?.name}】中途戰敗（僅完成 ${completedBattles}/${sweepCount} 場）！隊伍力竭重傷被迫中止，累計獲得 +${gold} 金幣、+${exp} 經驗${stones > 0 ? `、+${stones} 精鍊石` : ''}。`
        : `⚡ 快速掃蕩【${ZONES[currentZoneIndex]?.name}】完成 ${completedBattles}/${sweepCount} 場！累計獲得 +${gold} 金幣、+${exp} 經驗${stones > 0 ? `、+${stones} 精鍊石` : ''}！`,
      res.isDefeated ? 'danger' : 'sys'
    );
  };

  const finalizeCombatExit = useCallback((wasTower, summary, isVictory) => {
    const finalStats = battleStatsRef.current ? { ...battleStatsRef.current } : null;
    battleStatsRef.current = null;

    setMonsters([]);
    setActiveTowerFloor(null);
    resetCombatStates();
    setCombatPhase('PLAYER_SELECT');
    if (isVictory) {
      setVictorySummary(summary ? { ...summary, battleStats: summary.battleStats || finalStats } : null);
    } else {
      setDefeatSummary(summary ? { ...summary, battleStats: summary.battleStats || finalStats } : null);
    }
    if (wasTower) setActiveTab('tower');
  }, [resetCombatStates, setActiveTab]);

  const handleFleeCombat = () => {
    if (!isInCombat) return;
    setAutoBattle(false);
    setAutoTower(false);
    const wasTower = Boolean(activeTowerFloor);
    const res = resolveFleeCombat({
      monsters, player, heroRoster, activeHeroInstanceIds, battleDownedHeroIds,
      combatBuffs, heroBattleBuffs, playerTotalDef, playerTotalSpeed,
      playerRowBuff, rawFormBonus, formMultiplier, isFengShui, getHeroRowIdx
    });

    if (battleStatsRef.current) {
      accumulateStatsFromRoundLogs(battleStatsRef.current, res.logs, monsters, res.updatedMonsters || monsters);
    }
    appendBatchLogs(res.logs);

    if (res.outcome === 'ESCAPED') {
      finalizeCombatExit(wasTower, null, true);
      setVictorySummary(null);
      return;
    }

    if (res.outcome === 'DEFEAT') {
      setPlayer(res.defeatedPlayer);
      setHeroRoster(res.finalRoster);
      finalizeCombatExit(wasTower, res.defeatSummary, false);
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

    // 若因讀檔直接進入戰鬥中而未建立統計物件，自動補齊
    if (!battleStatsRef.current) {
      battleStatsRef.current = createInitialBattleStats(player, activeHeroes);
    }

    setCombatPhase('EXECUTING');
    const res = resolveCombatRound({
      actionInput, monsters, player, heroRoster, activeHeroInstanceIds,
      selectedTargetIndex, combatBuffs, heroBattleBuffs, battleDownedHeroIds,
      playerTotalMaxHp, playerTotalMaxMp, playerTotalAtk, playerTotalDef,
      playerTotalSpeed, playerRowBuff, rawFormBonus, formMultiplier,
      currentZoneIndex, activeTowerFloor, isFengShui, getHeroRowIdx
    });

    const nextMonsters = res.outcome === 'VICTORY' ? [] : (res.tickedMonsters || monsters);
    accumulateStatsFromRoundLogs(battleStatsRef.current, res.logs, monsters, nextMonsters);
    appendBatchLogs(res.logs);

    if (res.outcome === 'ABORTED') {
      setCombatPhase('PLAYER_SELECT');
      return;
    }

    if (res.outcome === 'VICTORY') {
      setPlayer(res.newPlayer);
      setHeroRoster(res.finalRoster);
      if (res.droppedEquipments?.length > 0) setEquipmentInventory(prev => [...prev, ...res.droppedEquipments]);
      if (res.droppedSkillCard) setSkillCardsInventory(prev => [...prev, res.droppedSkillCard]);

      if (res.clearedTowerFloor) {
        const nextFloor = res.clearedTowerFloor + 1;
        setTowerFloor(nextFloor);
        setTowerBestFloor(prev => Math.max(prev, nextFloor));
        finalizeCombatExit(true, { ...res.victorySummary, isTowerVictory: true, clearedFloor: res.clearedTowerFloor }, true);
      } else {
        finalizeCombatExit(false, res.victorySummary, true);
      }
      return;
    }

    if (res.outcome === 'DEFEAT') {
      setAutoBattle(false);
      setAutoTower(false);
      setPlayer(res.defeatedPlayer);
      setHeroRoster(res.finalRoster);
      finalizeCombatExit(Boolean(activeTowerFloor), res.defeatSummary, false);
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
    isInCombat, addLog, monsters, player, activeHeroes, heroRoster, activeHeroInstanceIds,
    selectedTargetIndex, combatBuffs, heroBattleBuffs, battleDownedHeroIds,
    playerTotalMaxHp, playerTotalMaxMp, playerTotalAtk, playerTotalDef,
    playerTotalSpeed, playerRowBuff, rawFormBonus, formMultiplier,
    currentZoneIndex, activeTowerFloor, isFengShui, getHeroRowIdx,
    appendBatchLogs, setPlayer, setHeroRoster, setEquipmentInventory,
    setSkillCardsInventory, setTowerFloor, setTowerBestFloor,
    finalizeCombatExit, setTurnCount
  ]);

  useAutoCombatScheduler({
    gameStarted, autoBattle, setAutoBattle, autoTower, setAutoTower,
    activeTowerFloor, isInCombat, combatPhase, turnCount,
    victorySummary, setVictorySummary, defeatSummary,
    player, combatBuffs, activeHeroInstanceIds, heroRoster,
    currentZoneIndex, speedMeta, handleExecuteRound,
    spawnEncounter, handleStartTowerChallenge, addLog
  });

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
    isInCombat, currentZoneIndex, activeTowerFloor, setActiveTowerFloor,
    monsters, setMonsters, selectedTargetIndex, setSelectedTargetIndex,
    lastRoundHits, setLastRoundHits, combatPhase,
    autoBattle, setAutoBattle, autoTower, setAutoTower,
    battleSpeed, handleCycleBattleSpeed, handleToggleAutoTower,
    victorySummary, setVictorySummary, defeatSummary, setDefeatSummary,
    combatBuffs, heroBattleBuffs, resetCombatStates,
    handleToggleAutoBattle, handleSelectZone, spawnEncounter,
    handleSweepZone, handleStartTowerChallenge, handleFleeCombat,
    handleExecuteRound, handleRestInn
  };
}
