import { getRowPositionBuffs } from '../formationHelper';
import {
  getElementMultiplier,
  calculateHeroEffectiveStats,
  applyHeroDeathStatPenalty
} from '../statCalculator';
import { getMonsterSpeed, getSpeedAdvantage } from './combatFormulas';

function pickTargetByRowPriority(updatedPlayer, aliveHeroes, playerRowBuff, getHeroRowIdx) {
  const rowsMap = { 0: [], 1: [], 2: [] };

  const playerRow = playerRowBuff?.label?.includes('前')
    ? 0
    : playerRowBuff?.label?.includes('後')
      ? 2
      : 1;

  if (updatedPlayer.hp > 0) {
    rowsMap[playerRow].push({
      type: 'PLAYER',
      weight: updatedPlayer.job === '猛將' ? 1.5 : 1.0
    });
  }

  aliveHeroes.forEach(h => {
    const hRow = Math.min(2, Math.max(0, getHeroRowIdx(h.instanceId)));
    rowsMap[hRow].push({
      type: 'HERO',
      heroId: h.instanceId,
      weight: h.heroClass === '猛將' ? 1.4 : 1.0
    });
  });

  const hasFront = rowsMap[0].length > 0;
  const hasMid = rowsMap[1].length > 0;
  const hasBack = rowsMap[2].length > 0;

  let rowWeights = [];
  if (hasFront && hasMid && hasBack) {
    rowWeights = [{ row: 0, weight: 65 }, { row: 1, weight: 25 }, { row: 2, weight: 10 }];
  } else if (hasFront && hasMid) {
    rowWeights = [{ row: 0, weight: 72 }, { row: 1, weight: 28 }];
  } else if (hasFront && hasBack) {
    rowWeights = [{ row: 0, weight: 85 }, { row: 2, weight: 15 }];
  } else if (hasMid && hasBack) {
    rowWeights = [{ row: 1, weight: 75 }, { row: 2, weight: 25 }];
  } else if (hasFront) {
    rowWeights = [{ row: 0, weight: 100 }];
  } else if (hasMid) {
    rowWeights = [{ row: 1, weight: 100 }];
  } else {
    rowWeights = [{ row: 2, weight: 100 }];
  }

  const totalRowWeight = rowWeights.reduce((acc, r) => acc + r.weight, 0);
  let rowRoll = Math.random() * totalRowWeight;
  let chosenRow = rowWeights[0].row;
  for (const rw of rowWeights) {
    rowRoll -= rw.weight;
    if (rowRoll <= 0) {
      chosenRow = rw.row;
      break;
    }
  }

  const rowCandidates = rowsMap[chosenRow];
  if (!rowCandidates || rowCandidates.length === 0) {
    return { type: 'PLAYER' };
  }

  const totalUnitWeight = rowCandidates.reduce((acc, c) => acc + c.weight, 0);
  let unitRoll = Math.random() * totalUnitWeight;
  for (const cand of rowCandidates) {
    unitRoll -= cand.weight;
    if (unitRoll <= 0) {
      return cand;
    }
  }

  return rowCandidates[0];
}

export function executeSingleMonsterTurn({
  m,
  updatedPlayer,
  updatedRoster,
  activeHeroInstanceIds,
  updatedDownedIds,
  updatedBuffs,
  heroBattleBuffs,
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
}) {
  const logs = [];
  if (!m || m.hp <= 0 || updatedPlayer.hp <= 0) {
    return { updatedRoster, logs };
  }

  if (m.blindTurns > 0 && Math.random() < (m.blindPct || 0)) {
    logs.push({ text: `🌫️ 【${m.name}】受迷霧致盲影響，攻擊揮空失誤！`, type: 'sys' });
    return { updatedRoster, logs };
  }

  const mSpeed = getMonsterSpeed(m);
  const poisonAtkMult = m.poisonTurns > 0 ? 0.80 : 1.0;
  const weakenAtkMult = m.weakenTurns > 0 ? (1 - (m.weakenPct || 0.15)) : 1.0;
  const effectiveMonsterAtk = Math.floor(m.atk * poisonAtkMult * weakenAtkMult);
  const monsterCritChance = m.isBoss ? 0.25 : m.isElite ? 0.18 : 0.12;
  const isCrit = Math.random() < monsterCritChance;

  const applyDamageToPlayer = (isHitCrit, labelPrefix = '', overrideRawDmg = null) => {
    if (overrideRawDmg === null) {
      const { evasionRate } = getSpeedAdvantage(playerTotalSpeed, mSpeed);
      if (evasionRate > 0 && Math.random() < evasionRate) {
        logs.push({
          text: `💨 身法如電！少俠憑藉速度優勢（${playerTotalSpeed} vs ${mSpeed}）閃避了【${m.name}】${labelPrefix}的攻擊！`,
          type: 'sys'
        });
        return;
      }
    }

    const critMult = isHitCrit ? 1.55 : 1.0;
    const em = getElementMultiplier(m.element, updatedPlayer.element, false);
    let rawDmg = overrideRawDmg !== null
      ? overrideRawDmg
      : Math.max(4, Math.floor((effectiveMonsterAtk * critMult - playerTotalDef) * em));

    if (playerRowBuff.physReducePct > 0) {
      rawDmg = Math.max(1, Math.floor(rawDmg * (1 - playerRowBuff.physReducePct)));
    }
    if (updatedPlayer.job === '猛將') {
      rawDmg = Math.max(1, Math.floor(rawDmg * 0.85));
    }
    if (updatedBuffs.guardTurns > 0) {
      rawDmg = Math.max(1, Math.floor(rawDmg * (1 - (updatedBuffs.guardReducePct || 0.25))));
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
      logs.push({
        text: `🛡️ 護盾為少俠吸收了 ${absorbed} 點傷害（剩餘護盾: ${updatedBuffs.shield}）！`,
        type: 'sys',
        dmgRole: 'shield'
      });
    }

    updatedPlayer.hp = Math.max(0, updatedPlayer.hp - hpDmg);
    recordAllyHit('PLAYER', hpDmg, isHitCrit);

    logs.push({
      text: `${isHitCrit ? '💢敵方暴擊！' : '👹 '}【${m.name}】${labelPrefix}襲擊${playerRowBuff.label}少俠，造成 ${hpDmg} 點傷害！`,
      type: 'monster',
      dmgRole: isHitCrit ? 'monster_crit' : 'monster_normal'
    });

    if (updatedBuffs.baguaTurns > 0 && (updatedBuffs.baguaReflectPct || 0) > 0 && rawDmg > 0) {
      const reflectDmg = Math.max(1, Math.floor(rawDmg * updatedBuffs.baguaReflectPct));
      m.hp = Math.max(0, m.hp - reflectDmg);
      recordMonsterHit(m.id, reflectDmg, false);
      logs.push({
        text: `🔄 八卦結界反震將 ${reflectDmg} 點傷害反彈給【${m.name}】！`,
        type: 'player',
        dmgRole: 'dot_burn'
      });
    }

    if (updatedPlayer.job === '猛將') {
      updatedPlayer.rage = Math.min(100, (updatedPlayer.rage || 0) + 18);
    }
  };

  const applyDamageToHero = (targetHeroId, scaleMult, isHitCrit, labelPrefix = '') => {
    updatedRoster = updatedRoster.map(h => {
      if (h.instanceId !== targetHeroId || h.hp <= 0) return h;
      const hRow = getHeroRowIdx(h.instanceId);
      const hRowBuff = getRowPositionBuffs(hRow * 3);
      const { effectiveDef, effectiveSpeed } = calculateHeroEffectiveStats(
        h,
        isFengShui,
        heroBattleBuffs[h.instanceId],
        hRow
      );

      const { evasionRate } = getSpeedAdvantage(effectiveSpeed, mSpeed);
      if (evasionRate > 0 && Math.random() < evasionRate) {
        logs.push({
          text: `💨 疾風閃影！英雄【${h.name}】憑藉速度優勢閃避了【${m.name}】${labelPrefix}的攻擊！`,
          type: 'sys'
        });
        return h;
      }

      const critMult = isHitCrit ? 1.50 : 1.0;
      let hDmg = Math.max(4, Math.floor((effectiveMonsterAtk * scaleMult * critMult) - Math.floor(effectiveDef * 0.65)));
      if (hRowBuff.physReducePct > 0) {
        hDmg = Math.max(1, Math.floor(hDmg * (1 - hRowBuff.physReducePct)));
      }
      if (updatedBuffs.baguaTurns > 0) {
        hDmg = Math.max(1, Math.floor(hDmg * (1 - (updatedBuffs.baguaReducePct || 0))));
      }

      // 猛將【鐵壁援護】替英雄分擔傷害
      if (updatedPlayer.job === '猛將' && updatedBuffs.guardTurns > 0 && updatedPlayer.hp > 0) {
        const sharePct = updatedBuffs.guardSharePct || 0.50;
        const sharedDmg = Math.max(1, Math.floor(hDmg * sharePct));
        hDmg = Math.max(1, hDmg - sharedDmg);
        logs.push({
          text: `🛡️ 猛將【鐵壁援護】挺身而出，替英雄【${h.name}】分擔了 ${sharedDmg} 點傷害！`,
          type: 'sys',
          dmgRole: 'shield'
        });
        applyDamageToPlayer(false, '（援護分擔）', sharedDmg);
      }

      const newHp = Math.max(0, h.hp - hDmg);
      recordAllyHit(h.instanceId, hDmg, isHitCrit);

      logs.push({
        text: `${isHitCrit ? '💢敵方暴擊！' : '👹 '}【${m.name}】${labelPrefix}重擊${hRowBuff.label}英雄【${h.name}】，造成 ${hDmg} 點傷害！`,
        type: 'monster',
        dmgRole: isHitCrit ? 'monster_crit' : 'monster_normal'
      });

      if (newHp === 0) {
        if (!updatedDownedIds.includes(h.instanceId)) {
          updatedDownedIds.push(h.instanceId);
          const { updatedHero, actualLoss, breakdownText } = applyHeroDeathStatPenalty({ ...h, hp: 0 });
          const penaltyMsg = `💔 ${hRowBuff.label}英雄【${h.name}】HP 歸零重傷瀕死！永久扣除 ${actualLoss} 點屬性（${breakdownText}）！`;
          logs.push({ text: penaltyMsg, type: 'danger' });
          casualtiesSummary.push(penaltyMsg);
          return updatedHero;
        } else {
          logs.push({ text: `💀 英雄【${h.name}】再次倒下！`, type: 'sys' });
          return { ...h, hp: 0 };
        }
      }
      return { ...h, hp: newHp };
    });
  };

  if (m.isBoss && Math.random() < 0.35) {
    applyDamageToPlayer(isCrit, '施展【狂暴橫掃】');
    const aliveHeroes = updatedRoster.filter(h => activeHeroInstanceIds.includes(h.instanceId) && h.hp > 0);
    aliveHeroes.slice(0, 2).forEach(h => {
      applyDamageToHero(h.instanceId, 0.75, false, '【狂暴橫掃】餘波');
    });
  } else if (updatedBuffs.tauntTurns > 0) {
    applyDamageToPlayer(isCrit);
  } else {
    const aliveHeroes = updatedRoster.filter(h => activeHeroInstanceIds.includes(h.instanceId) && h.hp > 0);
    const chosen = pickTargetByRowPriority(updatedPlayer, aliveHeroes, playerRowBuff, getHeroRowIdx);

    if (chosen.type === 'PLAYER') {
      applyDamageToPlayer(isCrit);
    } else {
      applyDamageToHero(chosen.heroId, 0.92, isCrit);
    }
  }

  if (updatedPlayer.hp <= 0) {
    logs.push({ text: `💀 少俠氣血歸零，不敵倒下！`, type: 'danger' });
  }

  return { updatedRoster, logs };
}

export function executeMonsterAttacks({
  monsters,
  player,
  heroRoster,
  activeHeroInstanceIds,
  battleDownedHeroIds,
  combatBuffs,
  heroBattleBuffs,
  playerTotalDef,
  playerTotalSpeed = 12,
  playerRowBuff,
  rawFormBonus,
  formMultiplier,
  isFengShui,
  getHeroRowIdx
}) {
  const logs = [];
  const updatedPlayer = { ...player };
  const updatedMonsters = monsters.map(m => ({ ...m }));
  let updatedRoster = [...heroRoster];
  const updatedDownedIds = [...battleDownedHeroIds];
  const updatedBuffs = { ...combatBuffs };
  const casualtiesSummary = [];

  const monsterHits = {};
  const allyHits = {};
  const recordAllyHit = (id, dmg, isCrit) => {
    if (!allyHits[id]) allyHits[id] = { dmg: 0, isCrit: false };
    allyHits[id].dmg += dmg;
    if (isCrit) allyHits[id].isCrit = true;
  };
  const recordMonsterHit = (id, dmg, isCrit) => {
    if (!monsterHits[id]) monsterHits[id] = { dmg: 0, isCrit: false };
    monsterHits[id].dmg += dmg;
    if (isCrit) monsterHits[id].isCrit = true;
  };

  for (let idx = 0; idx < updatedMonsters.length; idx++) {
    const m = updatedMonsters[idx];
    if (m.hp <= 0 || updatedPlayer.hp <= 0) continue;
    const step = executeSingleMonsterTurn({
      m,
      updatedPlayer,
      updatedRoster,
      activeHeroInstanceIds,
      updatedDownedIds,
      updatedBuffs,
      heroBattleBuffs,
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
    updatedRoster = step.updatedRoster;
    logs.push(...step.logs);
    if (updatedPlayer.hp <= 0) break;
  }

  return {
    updatedPlayer,
    updatedMonsters,
    updatedRoster,
    updatedDownedIds,
    updatedBuffs,
    casualtiesSummary,
    monsterHits,
    allyHits,
    logs
  };
}
