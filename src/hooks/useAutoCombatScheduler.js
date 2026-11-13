import { useEffect, useRef } from 'react';
import { CLASS_CONFIGS } from '../data/classes';
import { pickBestAutoCombatAction } from '../utils/combatEngine';

export function useAutoCombatScheduler({
  gameStarted,
  autoBattle,
  setAutoBattle,
  autoTower,
  setAutoTower,
  activeTowerFloor,
  isInCombat,
  combatPhase,
  turnCount,
  victorySummary,
  setVictorySummary,
  defeatSummary,
  player,
  combatBuffs,
  activeHeroInstanceIds,
  heroRoster,
  currentZoneIndex,
  speedMeta,
  handleExecuteRound,
  spawnEncounter,
  handleStartTowerChallenge,
  addLog
}) {
  const latestRef = useRef({
    player,
    combatBuffs,
    activeHeroInstanceIds,
    heroRoster,
    handleExecuteRound,
    spawnEncounter,
    handleStartTowerChallenge,
    currentZoneIndex,
    addLog
  });

  useEffect(() => {
    latestRef.current = {
      player,
      combatBuffs,
      activeHeroInstanceIds,
      heroRoster,
      handleExecuteRound,
      spawnEncounter,
      handleStartTowerChallenge,
      currentZoneIndex,
      addLog
    };
  });

  // 1. 戰鬥中自動出招排程
  useEffect(() => {
    if (!gameStarted || !autoBattle || !isInCombat || combatPhase !== 'PLAYER_SELECT') return;

    const timer = setTimeout(() => {
      const latest = latestRef.current;
      const classSkills = CLASS_CONFIGS[latest.player.job]?.skills || [];
      const nextAction = pickBestAutoCombatAction(
        latest.player,
        classSkills,
        latest.combatBuffs,
        latest.activeHeroInstanceIds,
        latest.heroRoster
      );
      latest.handleExecuteRound(nextAction);
    }, speedMeta.roundMs);

    return () => clearTimeout(timer);
  }, [gameStarted, autoBattle, isInCombat, combatPhase, turnCount, speedMeta.roundMs]);

  // 2. 野外自動連戰搜敵排程
  useEffect(() => {
    if (!gameStarted || !autoBattle || autoTower || activeTowerFloor || isInCombat || combatPhase !== 'PLAYER_SELECT') {
      return;
    }
    if (defeatSummary) {
      setAutoBattle(false);
      return;
    }
    if (victorySummary?.isSweep) return;

    if (player.hp <= 1) {
      setAutoBattle(false);
      addLog('⚠️ 少俠氣血過低，已自動停止野外連戰，請先客棧休養！', 'danger');
      return;
    }

    const delay = victorySummary ? speedMeta.summaryMs : speedMeta.roundMs;
    const timer = setTimeout(() => {
      if (victorySummary) setVictorySummary(null);
      latestRef.current.spawnEncounter(latestRef.current.currentZoneIndex);
    }, delay);

    return () => clearTimeout(timer);
  }, [
    gameStarted, autoBattle, autoTower, activeTowerFloor, isInCombat,
    combatPhase, victorySummary, defeatSummary, player.hp,
    speedMeta.summaryMs, speedMeta.roundMs, setAutoBattle, setVictorySummary, addLog
  ]);

  // 3. 自動爬塔排程
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
      latestRef.current.handleStartTowerChallenge();
    }, speedMeta.summaryMs);

    return () => clearTimeout(timer);
  }, [
    gameStarted, autoTower, isInCombat, combatPhase,
    victorySummary, defeatSummary, player.hp,
    speedMeta.summaryMs, setAutoTower, setVictorySummary, addLog
  ]);
}
