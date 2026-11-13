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

export function resolveCombatRound({
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
  playerTotalSpeed = 12,
  playerRowBuff,
  rawFormBonus,
  formMultiplier,
  currentZoneIndex,
  activeTowerFloor,
  isFengShui,
  getHeroRowIdx
}) {
  const roundNum = (combatBuffs?.roundCount || 0) + 1;
  const logs = [];
  let currentMonsters = monsters.map(m => ({ ...m }));
  const currentPlayer = { ...player };
  let currentRoster = heroRoster.map(h => normalizeHero(h));
  const currentBuffs = {
    ...combatBuffs,
    roundCount: roundNum,
    skillCooldowns: { 0: 0, 1: 0, 2: 0, 3: 0, ...(combatBuffs?.skillCooldowns || {}) }
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
    currentBuffs
  });
  if (!skillValidation.valid) {
    return skillValidation.abortResult;
  }

  // 插入本回合明確分隔標題
  logs.push({
    text: `第 ${roundNum} 回合交鋒`,
    roundNum,
    type: 'round_divider'
  });

  // 1. 建構本回合「速度先手行動序列」
  const windSpeedAdd = currentBuffs.windBuffTurns > 0 ? (currentBuffs.windSpeedBonus || 0) : 0;
  const turnQueue = [
    { type: 'PLAYER', label: currentPlayer.name, speed: playerTotalSpeed + windSpeedAdd, priority: 3 }
  ];

  currentRoster.forEach(h => {
    if (activeHeroInstanceIds.includes(h.instanceId) && h.hp > 0) {
      const hRow = getHeroRowIdx(h.instanceId);
      const { effectiveSpeed } = calculateHeroEffectiveStats(h, isFengShui, currentHeroBuffs[h.instanceId], hRow);
      turnQueue.push({
        type: 'HERO',
        instanceId: h.instanceId,
        label: h.name,
        speed: effectiveSpeed + windSpeedAdd,
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

  // 2. 依速度序列結算行動
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
        currentBuffs,
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
          playerTotalSpeed: playerTotalSpeed + windSpeedAdd,
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

  // 3. 回合末持續負面傷害與緩回結算階段
  const endPhaseLogs = [];
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
      endPhaseLogs.push({
        text: `☠️ 【${updatedM.name}】劇毒發作，受到 ${poisonDmg} 點無視防禦真傷！`,
        type: 'player',
        dmgRole: 'dot_poison',
        isSubEvent: true
      });
    }

    if (updatedM.hp > 0 && updatedM.burnTurns > 0) {
      const burnDmg = updatedM.burnDmg || 15;
      updatedM.hp = Math.max(0, updatedM.hp - burnDmg);
      recordMonsterHit(updatedM.id, burnDmg, false);
      endPhaseLogs.push({
        text: `🔥 【${updatedM.name}】受到灼燒持續法傷 ${burnDmg} 點！`,
        type: 'player',
        dmgRole: 'dot_burn',
        isSubEvent: true
      });
    }

    if (updatedM.hp > 0 && updatedM.bleedTurns > 0) {
      const bleedDmg = updatedM.bleedDmg || 15;
      updatedM.hp = Math.max(0, updatedM.hp - bleedDmg);
      recordMonsterHit(updatedM.id, bleedDmg, false);
      endPhaseLogs.push({
        text: `🩸 【${updatedM.name}】傷口撕裂流血，受到 ${bleedDmg} 點持續物理傷害！`,
        type: 'player',
        dmgRole: 'dot_burn',
        isSubEvent: true
      });
    }

    return updatedM;
  });

  if (currentBuffs.teamRegenTurns > 0 && (currentBuffs.teamRegenVal || 0) > 0) {
    const rVal = currentBuffs.teamRegenVal;
    currentPlayer.hp = Math.min(playerTotalMaxHp, currentPlayer.hp + rVal);
    recordAllyHeal('PLAYER', rVal);
    currentRoster = currentRoster.map(ally => {
      if (!activeHeroInstanceIds.includes(ally.instanceId) || ally.hp <= 0) return ally;
      const { effectiveMaxHp } = calculateHeroEffectiveStats(
        ally,
        isFengShui,
        currentHeroBuffs[ally.instanceId],
        getHeroRowIdx(ally.instanceId)
      );
      recordAllyHeal(ally.instanceId, rVal);
      return { ...ally, hp: Math.min(effectiveMaxHp, ally.hp + rVal) };
    });
    endPhaseLogs.push({
      text: `🌱 生機流轉，我方全體自動恢復 +${rVal} HP！`,
      type: 'sys',
      dmgRole: 'heal',
      isSubEvent: true
    });
  }

  if (endPhaseLogs.length > 0) {
    logs.push({
      text: `第 ${roundNum} 回合末狀態結算`,
      type: 'phase_divider'
    });
    logs.push(...endPhaseLogs);
  }

  if (currentMonsters.every(m => m.hp <= 0)) {
    logs.push({ text: `🎉 敵軍在持續傷害中全數倒下！戰鬥勝利！`, type: 'sys' });
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

  // 4. 回合末狀態遞減、4 招冷卻倒數
  const tickedMonsters = currentMonsters.map(m => {
    const nextPoison = Math.max(0, (m.poisonTurns || 0) - 1);
    return {
      ...m,
      armorBreakTurns: Math.max(0, (m.armorBreakTurns || 0) - 1),
      weakenTurns: Math.max(0, (m.weakenTurns || 0) - 1),
      blindTurns: Math.max(0, (m.blindTurns || 0) - 1),
      burnTurns: Math.max(0, (m.burnTurns || 0) - 1),
      bleedTurns: Math.max(0, (m.bleedTurns || 0) - 1),
      poisonTurns: nextPoison,
      poisonStacks: nextPoison === 0 ? 0 : m.poisonStacks,
      vulnTurns: Math.max(0, (m.vulnTurns || 0) - 1)
    };
  });

  const prevCds = currentBuffs.skillCooldowns || { 0: 0, 1: 0, 2: 0, 3: 0 };
  const tickedCooldowns = {
    0: Math.max(0, (prevCds[0] || 0) - 1),
    1: Math.max(0, (prevCds[1] || 0) - 1),
    2: Math.max(0, (prevCds[2] || 0) - 1),
    3: Math.max(0, (prevCds[3] || 0) - 1)
  };

  const tickedBuffs = {
    ...currentBuffs,
    tauntTurns: Math.max(0, (currentBuffs.tauntTurns || 0) - 1),
    guardTurns: Math.max(0, (currentBuffs.guardTurns || 0) - 1),
    baguaTurns: Math.max(0, (currentBuffs.baguaTurns || 0) - 1),
    windBuffTurns: Math.max(0, (currentBuffs.windBuffTurns || 0) - 1),
    tianjiTurns: Math.max(0, (currentBuffs.tianjiTurns || 0) - 1),
    teamRegenTurns: Math.max(0, (currentBuffs.teamRegenTurns || 0) - 1),
    skillCooldowns: tickedCooldowns
  };

  const tickedHeroBuffs = {};
  Object.keys(currentHeroBuffs).forEach(hId => {
    const nextTurns = Math.max(0, (currentHeroBuffs[hId]?.surgeTurns || 0) - 1);
    if (nextTurns > 0) {
      tickedHeroBuffs[hId] = { ...currentHeroBuffs[hId], surgeTurns: nextTurns };
    }
  });

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
