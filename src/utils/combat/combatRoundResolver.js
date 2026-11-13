import {
  calculateHeroEffectiveStats,
  normalizeHero
} from '../statCalculator';
import { getMonsterSpeed } from './combatFormulas';
import {
  resolveBattleVictory,
  resolveBattleDefeat
} from './battleRewards';
import {
  executeSingleMonsterTurn,
  executeMonsterAttacks
} from './monsterTurnResolver';
import {
  validateAndConsumePlayerSkill,
  executeSingleHeroAction,
  executePlayerAction
} from './playerAndHeroActions';

/**
 * 結算撤退逃跑（65% 成功脫離，35% 失敗遭追擊）
 */
export function resolveFleeCombat(context) {
  if (Math.random() < 0.65) {
    return {
      outcome: 'ESCAPED',
      logs: [{ text: `🏃 少俠施展輕功順利擺脫敵群，返回安全營地（整備功能已解鎖）！`, type: 'sys' }]
    };
  }

  const logs = [{ text: `⚠️ 撤退失敗！敵軍封鎖退路並趁勢發動追擊！`, type: 'danger' }];
  const atkRes = executeMonsterAttacks(context);
  logs.push(...atkRes.logs);

  if (atkRes.updatedPlayer.hp <= 0) {
    const defeatRes = resolveBattleDefeat({
      player: atkRes.updatedPlayer,
      finalRoster: atkRes.updatedRoster,
      casualtiesSummary: atkRes.casualtiesSummary
    });
    logs.push(defeatRes.defeatLog);
    return {
      outcome: 'DEFEAT',
      logs,
      ...defeatRes
    };
  }

  return {
    outcome: 'CONTINUE',
    logs,
    updatedPlayer: atkRes.updatedPlayer,
    updatedMonsters: atkRes.updatedMonsters,
    updatedRoster: atkRes.updatedRoster,
    updatedDownedIds: atkRes.updatedDownedIds,
    updatedBuffs: atkRes.updatedBuffs,
    lastRoundHits: {
      monsters: atkRes.monsterHits,
      allies: atkRes.allyHits
    }
  };
}

/**
 * 完整單回合戰鬥推進純函數（支援速度先手行動排序、速度閃避／連擊與 ★+5 技能卡連發）
 */
export function resolveCombatRound({
  actionInput = { type: 'attack' },
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
  playerTotalSpeed = 12,
  playerRowBuff,
  rawFormBonus,
  formMultiplier,
  currentZoneIndex,
  activeTowerFloor,
  isFengShui,
  getHeroRowIdx
}) {
  const logs = [];
  let currentMonsters = monsters.map(m => ({ ...m }));
  const currentPlayer = { ...player };
  let currentRoster = heroRoster.map(h => normalizeHero(h));
  const currentBuffs = {
    ...combatBuffs,
    skillCooldowns: { 0: 0, 1: 0, 2: 0, ...(combatBuffs?.skillCooldowns || {}) }
  };
  const currentHeroBuffs = { ...heroBattleBuffs };
  const updatedDownedIds = [...battleDownedHeroIds];
  const casualtiesSummary = [];

  const monsterHits = {};
  const allyHits = {};
  const recordMonsterHit = (id, dmg, isCrit) => {
    if (!monsterHits[id]) monsterHits[id] = { dmg: 0, isCrit: false };
    monsterHits[id].dmg += dmg;
    if (isCrit) monsterHits[id].isCrit = true;
  };
  const recordAllyHit = (id, dmg, isCrit) => {
    if (!allyHits[id]) allyHits[id] = { dmg: 0, isCrit: false, heal: 0 };
    allyHits[id].dmg += dmg;
    if (isCrit) allyHits[id].isCrit = true;
  };
  const recordAllyHeal = (id, heal) => {
    if (!allyHits[id]) allyHits[id] = { dmg: 0, isCrit: false, heal: 0 };
    allyHits[id].heal = (allyHits[id].heal || 0) + heal;
  };

  // 0. 預先檢驗主角技能合法性與扣除消耗
  const skillValidation = validateAndConsumePlayerSkill({
    actionInput,
    currentPlayer,
    currentRoster,
    activeHeroInstanceIds,
    currentBuffs
  });
  if (!skillValidation.valid) {
    return skillValidation.abortResult;
  }

  // 1. 建構本回合「速度先手行動序列」並由高至低排序
  const turnQueue = [
    { type: 'PLAYER', label: currentPlayer.name, speed: playerTotalSpeed, priority: 3 }
  ];

  currentRoster.forEach(h => {
    if (activeHeroInstanceIds.includes(h.instanceId) && h.hp > 0) {
      const hRow = getHeroRowIdx(h.instanceId);
      const { effectiveSpeed } = calculateHeroEffectiveStats(h, isFengShui, currentHeroBuffs[h.instanceId], hRow);
      turnQueue.push({
        type: 'HERO',
        instanceId: h.instanceId,
        label: h.name,
        speed: effectiveSpeed,
        priority: 2
      });
    }
  });

  currentMonsters.forEach(m => {
    if (m.hp > 0) {
      turnQueue.push({
        type: 'MONSTER',
        monsterId: m.id,
        label: m.name,
        speed: getMonsterSpeed(m),
        priority: 1
      });
    }
  });

  turnQueue.sort((a, b) => (b.speed - a.speed) || (b.priority - a.priority));

  const orderPreview = turnQueue
    .slice(0, 6)
    .map(u => `${u.label}(${u.speed})`)
    .join(' ＞ ');
  logs.push({
    text: `⚡ 【速度先手序列】${orderPreview}${turnQueue.length > 6 ? ' ...' : ''}`,
    type: 'sys'
  });

  // 2. 依速度序列逐一結算所有單位行動
  for (const actor of turnQueue) {
    if (currentMonsters.every(m => m.hp <= 0) || currentPlayer.hp <= 0) break;

    if (actor.type === 'PLAYER') {
      currentRoster = executePlayerAction({
        actionInput,
        currentMonsters,
        currentPlayer,
        currentRoster,
        activeHeroInstanceIds,
        selectedTargetIndex,
        currentBuffs,
        currentHeroBuffs,
        playerTotalMaxHp,
        playerTotalMaxMp,
        playerTotalAtk,
        playerTotalSpeed,
        isFengShui,
        getHeroRowIdx,
        logs,
        recordMonsterHit,
        recordAllyHeal
      });
    } else if (actor.type === 'HERO') {
      currentRoster = executeSingleHeroAction({
        hInstanceId: actor.instanceId,
        forceSkill: false,
        extraBonusMult: 0,
        currentMonsters,
        currentPlayer,
        currentRoster,
        activeHeroInstanceIds,
        currentHeroBuffs,
        playerTotalMaxHp,
        playerTotalMaxMp,
        isFengShui,
        getHeroRowIdx,
        logs,
        recordMonsterHit,
        recordAllyHeal
      });
    } else if (actor.type === 'MONSTER') {
      const m = currentMonsters.find(item => item.id === actor.monsterId);
      if (m && m.hp > 0) {
        const step = executeSingleMonsterTurn({
          m,
          updatedPlayer: currentPlayer,
          updatedRoster: currentRoster,
          activeHeroInstanceIds,
          updatedDownedIds,
          updatedBuffs: currentBuffs,
          heroBattleBuffs: currentHeroBuffs,
          playerTotalDef,
          playerTotalSpeed,
          playerRowBuff,
          rawFormBonus,
          formMultiplier,
          isFengShui,
          getHeroRowIdx,
          casualtiesSummary,
          recordMonsterHit,
          recordAllyHit
        });
        currentRoster = step.updatedRoster;
        logs.push(...step.logs);
      }
    }
  }

  // 檢查是否於行動序列中勝負已分
  if (currentPlayer.hp <= 0) {
    const defeatRes = resolveBattleDefeat({
      player: currentPlayer,
      finalRoster: currentRoster,
      casualtiesSummary
    });
    logs.push(defeatRes.defeatLog);
    return {
      outcome: 'DEFEAT',
      logs,
      updatedDownedIds,
      ...defeatRes
    };
  }

  if (currentMonsters.every(m => m.hp <= 0)) {
    logs.push({ text: `🎉 敵方全數殲滅！戰鬥勝利（整備功能已解鎖）！`, type: 'sys' });
    const vicRes = resolveBattleVictory({
      player: currentPlayer,
      defeatedMonsters: currentMonsters,
      currentRoster,
      activeHeroInstanceIds,
      currentZoneIndex,
      activeTowerFloor,
      isFengShui,
      getHeroRowIdx
    });
    return { outcome: 'VICTORY', logs, ...vicRes };
  }

  // 3. 回合末持續負面傷害階段（劇毒、灼燒）
  let anyPoisonedAlive = false;
  currentMonsters = currentMonsters.map(m => {
    if (m.hp <= 0) return m;
    const updatedM = { ...m };

    if (updatedM.poisonTurns > 0) {
      const poisonDmg = Math.max(
        1,
        Math.floor(updatedM.maxHp * (updatedM.poisonPct || 0.08) * (updatedM.poisonStacks || 1))
      );
      updatedM.hp = Math.max(0, updatedM.hp - poisonDmg);
      recordMonsterHit(updatedM.id, poisonDmg, false);
      logs.push({
        text: `☠️ 【${updatedM.name}】劇毒發作，受到 ${poisonDmg} 點無視防禦真傷（攻擊力持續 -20%）！`,
        type: 'player',
        dmgRole: 'dot_poison'
      });
      if (updatedM.hp > 0) anyPoisonedAlive = true;
    }

    if (updatedM.hp > 0 && updatedM.burnTurns > 0) {
      const burnDmg = updatedM.burnDmg || 15;
      updatedM.hp = Math.max(0, updatedM.hp - burnDmg);
      recordMonsterHit(updatedM.id, burnDmg, false);
      logs.push({
        text: `🔥 【${updatedM.name}】受到灼燒持續傷害 ${burnDmg} 點！`,
        type: 'player',
        dmgRole: 'dot_burn'
      });
    }

    return updatedM;
  });

  if (currentMonsters.every(m => m.hp <= 0)) {
    logs.push({ text: `🎉 敵軍在劇毒與烈焰中全數倒下！戰鬥勝利（整備功能已解鎖）！`, type: 'sys' });
    const vicRes = resolveBattleVictory({
      player: currentPlayer,
      defeatedMonsters: currentMonsters,
      currentRoster,
      activeHeroInstanceIds,
      currentZoneIndex,
      activeTowerFloor,
      isFengShui,
      getHeroRowIdx
    });
    return { outcome: 'VICTORY', logs, ...vicRes };
  }

  // 4. 回合末狀態遞減、技能冷卻倒數與藥師回藍
  const tickedMonsters = currentMonsters.map(m => {
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

  const prevCds = currentBuffs.skillCooldowns || { 0: 0, 1: 0, 2: 0 };
  const tickedCooldowns = {
    0: Math.max(0, (prevCds[0] || 0) - 1),
    1: Math.max(0, (prevCds[1] || 0) - 1),
    2: Math.max(0, (prevCds[2] || 0) - 1)
  };

  const tickedBuffs = {
    ...currentBuffs,
    tauntTurns: Math.max(0, (currentBuffs.tauntTurns || 0) - 1),
    reflectTurns: Math.max(0, (currentBuffs.reflectTurns || 0) - 1),
    baguaTurns: Math.max(0, (currentBuffs.baguaTurns || 0) - 1),
    skillCooldowns: tickedCooldowns
  };

  const tickedHeroBuffs = {};
  Object.keys(currentHeroBuffs).forEach(hId => {
    const nextTurns = Math.max(0, (currentHeroBuffs[hId]?.surgeTurns || 0) - 1);
    if (nextTurns > 0) {
      tickedHeroBuffs[hId] = { ...currentHeroBuffs[hId], surgeTurns: nextTurns };
    }
  });

  if (currentPlayer.job === '藥師') {
    const regenMp = 10 + (anyPoisonedAlive ? 8 : 0);
    currentPlayer.mp = Math.min(playerTotalMaxMp, currentPlayer.mp + regenMp);
  }

  return {
    outcome: 'CONTINUE',
    logs,
    tickedMonsters,
    updatedPlayer: currentPlayer,
    updatedRoster: currentRoster,
    updatedDownedIds,
    tickedBuffs,
    tickedHeroBuffs,
    lastRoundHits: {
      monsters: monsterHits,
      allies: allyHits
    }
  };
}
