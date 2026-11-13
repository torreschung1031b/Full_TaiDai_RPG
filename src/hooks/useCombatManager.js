import { useEffect, useCallback } from 'react';
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
  isInCombat,
  isFengShui,
  player,
  setPlayer,
  heroRoster,
  setHeroRoster,
  activeHeroes,
  activeHeroInstanceIds,
  playerTotalMaxHp,
  playerTotalMaxMp,
  playerTotalAtk,
  playerTotalDef,
  playerTotalSpeed,
  playerRowBuff,
  rawFormBonus,
  formMultiplier,
  getHeroRowIdx,
  currentZoneIndex,
  setCurrentZoneIndex,
  monsters,
  setMonsters,
  selectedTargetIndex,
  setSelectedTargetIndex,
  turnCount,
  setTurnCount,
  combatPhase,
  setCombatPhase,
  autoBattle,
  setAutoBattle,
  combatBuffs,
  setCombatBuffs,
  heroBattleBuffs,
  setHeroBattleBuffs,
  battleDownedHeroIds,
  setBattleDownedHeroIds,
  setLastRoundHits,
  setVictorySummary,
  setDefeatSummary,
  towerFloor,
  setTowerFloor,
  setTowerBestFloor,
  activeTowerFloor,
  setActiveTowerFloor,
  setEquipmentInventory,
  setSkillCardsInventory,
  setActiveTab,
  resetCombatStates,
  addLog,
  appendBatchLogs
}) {
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
        `⚡ 快速掃蕩【${ZONES[currentZoneIndex]?.name}】完成 ${completedBattles}/${sweepCount} 場！累計獲得 +${gold} 金幣、+${exp} 經驗${stones > 0 ? `、+${stones} 
