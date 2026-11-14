import { getRowPositionBuffs } from '../formationHelper';
import {
  getElementMultiplier,
  calculateHeroEffectiveStats,
  applyHeroDeathStatPenalty
} from '../statCalculator';
import { getMonsterSpeed, getSpeedAdvantage } from './combatFormulas';
import {
  assignMonsterSkills,
  selectMonsterSmartTarget,
  decideMonsterAction
} from '../../data/monsterSkills';

function buildAllyCandidates(updatedPlayer, updatedRoster, activeHeroInstanceIds, playerRowBuff, getHeroRowIdx, isFengShui, heroBattleBuffs, playerTotalMaxHp) {
  const candidates = [];

  const playerRow = playerRowBuff?.label?.includes('前')
    ? 0
    : playerRowBuff?.label?.includes('後')
      ? 2
      : 1;

  if (updatedPlayer.hp > 0) {
    candidates.push({
      id: 'PLAYER',
      name: updatedPlayer.name,
      isPlayer: true,
      rowIdx: playerRow,
      hp: updatedPlayer.hp,
      maxHp: playerTotalMaxHp || updatedPlayer.maxHp || 200,
      element: updatedPlayer.element,
      heroClass: updatedPlayer.job,
      isTank: updatedPlayer.job === '猛將'
    });
  }

  updatedRoster.forEach(h => {
    if (!activeHeroInstanceIds.includes(h.instanceId) || h.hp <= 0) return;
    const hRow = Math.min(2, Math.max(0, getHeroRowIdx(h.instanceId)));
    const { effectiveMaxHp } = calculateHeroEffectiveStats(
      h,
      isFengShui,
      heroBattleBuffs[h.instanceId],
      hRow
    );
    candidates.push({
      id: h.instanceId,
      name: h.name,
      isPlayer: false,
      heroId: h.instanceId,
      rowIdx: hRow,
      hp: h.hp,
      maxHp: effectiveMaxHp,
      element: h.element,
      heroClass: h.heroClass,
      isTank: h.heroClass === '猛將'
    });
  });

  return candidates;
}

function pickMultipleAllyTargets(candidates, primaryTarget, maxCount = 2) {
  if (candidates.length <= maxCount) return candidates;
  const picked = [];
  if (primaryTarget) picked.push(primaryTarget);
  const rest = candidates.filter(c => c.id !== primaryTarget?.id);
  while (picked.length < maxCount && rest.length > 0) {
    const idx = Math.floor(Math.random() * rest.length);
    picked.push(rest[idx]);
    rest.splice(idx, 1);
  }
  return picked;
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
  recordAllyHit,
  playerTotalMaxHp
}) {
  const logs = [];
  if (!m || m.hp <= 0 || updatedPlayer.hp <= 0) {
    return { updatedRoster, logs };
  }

  // 自動補齊舊存檔怪物的技能列表與冷卻倒數
  if (!Array.isArray(m.skills)) {
    m.skills = assignMonsterSkills(m);
  }
  m.skills.forEach(sk => {
    if ((sk.currentCd || 0) > 0) sk.currentCd -= 1;
  });

  // 致盲判定（若正在蓄力大招時被致盲揮空，蓄力也會被打斷！）
  if (m.blindTurns > 0 && Math.random() < (m.blindPct || 0.40)) {
    const interruptedText = m.chargingSkill ? `，【${m.chargingSkill.name}】蓄力被打斷` : '';
    m.chargingSkill = null;
    logs.push({
      text: `🌫️ 【${m.name}】受迷霧致盲影響，攻擊揮空失誤${interruptedText}！`,
      type: 'sys'
    });
    return { updatedRoster, logs };
  }

  const mSpeed = getMonsterSpeed(m);
  const poisonAtkMult = m.poisonTurns > 0 ? 0.80 : 1.0;
  const weakenAtkMult = m.weakenTurns > 0 ? (1 - (m.weakenPct || 0.20)) : 1.0;
  const effectiveMonsterAtk = Math.floor(m.atk * poisonAtkMult * weakenAtkMult);
  const monsterCritChance = m.isBoss ? 0.22 : m.isElite ? 0.16 : 0.10;
  const isCrit = Math.random() < monsterCritChance;

  const setSkillCooldown = (skillId, cdTurns) => {
    const targetSk = (m.skills || []).find(s => s.id === skillId);
    if (targetSk) targetSk.currentCd = cdTurns || 3;
  };

  const applyDebuffToPlayer = (debuffType, turns = 2) => {
    if (!debuffType) return '';
    if (debuffType === 'armorBreak') {
      updatedBuffs.playerArmorBreakTurns = Math.max(updatedBuffs.playerArmorBreakTurns || 0, turns);
      return `【破甲${turns}T】`;
    }
    if (debuffType === 'weaken') {
      updatedBuffs.playerWeakenTurns = Math.max(updatedBuffs.playerWeakenTurns || 0, turns);
      return `【虛弱${turns}T】`;
    }
    if (debuffType === 'bleed') {
      updatedBuffs.playerBleedTurns = Math.max(updatedBuffs.playerBleedTurns || 0, turns);
      return `【流血${turns}T】`;
    }
    return '';
  };

  const applyDamageToPlayer = (
    scaleMult = 1.0,
    isHitCrit = false,
    labelPrefix = '',
    overrideRawDmg = null,
    debuffType = null,
    debuffTurns = 2
  ) => {
    if (overrideRawDmg === null) {
      const { evasionRate } = getSpeedAdvantage(playerTotalSpeed, mSpeed);
      if (evasionRate > 0 && Math.random() < evasionRate) {
        logs.push({
          text: `💨 身法如電！少俠憑藉速度優勢閃避了【${m.name}】${labelPrefix}的攻擊！`,
          type: 'sys'
        });
        return;
      }
    }

    const critMult = isHitCrit ? 1.50 : 1.0;
    const em = getElementMultiplier(m.element, updatedPlayer.element, false);
    const effectivePDef = (updatedBuffs.playerArmorBreakTurns || 0) > 0
      ? Math.floor(playerTotalDef * 0.80)
      : playerTotalDef;

    let rawDmg = overrideRawDmg !== null
      ? overrideRawDmg
      : Math.max(4, Math.floor((effectiveMonsterAtk * scaleMult * critMult - effectivePDef) * em));

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
        text: `🛡️ 護盾為少俠吸收了 ${absorbed} 點傷害（剩餘護盾: ${updatedBuffs.shield}）`,
        type: 'sys',
        dmgRole: 'shield',
        isSubEvent: true
      });
    }

    updatedPlayer.hp = Math.max(0, updatedPlayer.hp - hpDmg);
    recordAllyHit('PLAYER', hpDmg, isHitCrit);
    const debuffTag = applyDebuffToPlayer(debuffType, debuffTurns);

    logs.push({
      text: `${isHitCrit ? '💢敵方暴擊！' : '👹 '}【${m.name}】${labelPrefix}襲擊${playerRowBuff.label}少俠，造成 ${hpDmg} 點傷害${debuffTag}！`,
      type: 'monster',
      dmgRole: isHitCrit ? 'monster_crit' : 'monster_normal'
    });

    if (updatedBuffs.baguaTurns > 0 && (updatedBuffs.baguaReflectPct || 0) > 0 && rawDmg > 0) {
      const reflectDmg = Math.max(1, Math.floor(rawDmg * updatedBuffs.baguaReflectPct));
      m.hp = Math.max(0, m.hp - reflectDmg);
      recordMonsterHit(m.id, reflectDmg, false);
      logs.push({
        text: `🔄 八卦結界反震將 ${reflectDmg} 點傷害反彈給【${m.name}】`,
        type: 'player',
        dmgRole: 'dot_burn',
        isSubEvent: true
      });
    }

    if (updatedPlayer.job === '猛將') {
      updatedPlayer.rage = Math.min(100, (updatedPlayer.rage || 0) + 18);
    }
  };

  const applyDamageToHero = (
    targetHeroId,
    scaleMult = 0.92,
    isHitCrit = false,
    labelPrefix = '',
    debuffType = null,
    debuffTurns = 2
  ) => {
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

      const critMult = isHitCrit ? 1.48 : 1.0;
      const em = getElementMultiplier(m.element, h.element, false);
      let hDmg = Math.max(
        4,
        Math.floor(((effectiveMonsterAtk * scaleMult * critMult) - Math.floor(effectiveDef * 0.65)) * em)
      );

      if (hRowBuff.physReducePct > 0) {
        hDmg = Math.max(1, Math.floor(hDmg * (1 - hRowBuff.physReducePct)));
      }
      if (updatedBuffs.baguaTurns > 0) {
        hDmg = Math.max(1, Math.floor(hDmg * (1 - (updatedBuffs.baguaReducePct || 0))));
      }

      // 護盾也能保護英雄抵擋部分爆發傷害
      if (updatedBuffs.shield > 0 && hDmg > 0) {
        const absorbed = Math.min(updatedBuffs.shield, hDmg);
        updatedBuffs.shield -= absorbed;
        hDmg -= absorbed;
        logs.push({
          text: `🛡️ 護盾為【${h.name}】抵擋了 ${absorbed} 點傷害（剩餘護盾: ${updatedBuffs.shield}）`,
          type: 'sys',
          dmgRole: 'shield',
          isSubEvent: true
        });
      }

      // 猛將【鐵壁援護】替英雄分擔傷害
      if (updatedPlayer.job === '猛將' && updatedBuffs.guardTurns > 0 && updatedPlayer.hp > 0 && hDmg > 0) {
        const sharePct = updatedBuffs.guardSharePct || 0.50;
        const sharedDmg = Math.max(1, Math.floor(hDmg * sharePct));
        hDmg = Math.max(1, hDmg - sharedDmg);
        logs.push({
          text: `🛡️ 猛將【鐵壁援護】挺身而出，替【${h.name}】分擔了 ${sharedDmg} 點傷害`,
          type: 'sys',
          dmgRole: 'shield',
          isSubEvent: true
        });
        applyDamageToPlayer(1.0, false, '（援護分擔）', sharedDmg);
      }

      const newHp = Math.max(0, h.hp - hDmg);
      recordAllyHit(h.instanceId, hDmg, isHitCrit);
      const debuffTag = debuffType
        ? (debuffType === 'armorBreak' ? `【破甲${debuffTurns}T】` : debuffType === 'bleed' ? `【流血${debuffTurns}T】` : `【虛弱${debuffTurns}T】`)
        : '';

      logs.push({
        text: `${isHitCrit ? '💢敵方暴擊！' : '👹 '}【${m.name}】${labelPrefix}重擊${hRowBuff.label}英雄【${h.name}】，造成 ${hDmg} 點傷害${debuffTag}！`,
        type: 'monster',
        dmgRole: isHitCrit ? 'monster_crit' : 'monster_normal'
      });

      if (newHp === 0) {
        if (!updatedDownedIds.includes(h.instanceId)) {
          updatedDownedIds.push(h.instanceId);
          const { updatedHero, actualLoss, breakdownText } = applyHeroDeathStatPenalty({ ...h, hp: 0 });
          const penaltyMsg = `💔 ${hRowBuff.label}英雄【${h.name}】HP 歸零重傷瀕死！永久扣除 ${actualLoss} 點屬性（${breakdownText}）`;
          logs.push({ text: penaltyMsg, type: 'danger', isSubEvent: true });
          casualtiesSummary.push(penaltyMsg);
          return updatedHero;
        } else {
          logs.push({ text: `💀 英雄【${h.name}】再次倒下`, type: 'sys', isSubEvent: true });
          return { ...h, hp: 0 };
        }
      }
      return { ...h, hp: newHp };
    });
  };

  // ==================== 智能 AI 行動決策 ====================
  const candidates = buildAllyCandidates(
    updatedPlayer,
    updatedRoster,
    activeHeroInstanceIds,
    playerRowBuff,
    getHeroRowIdx,
    isFengShui,
    heroBattleBuffs,
    playerTotalMaxHp
  );

  const decision = decideMonsterAction(m);

  if (decision.actionType === 'START_CHARGE') {
    m.chargingSkill = decision.skill;
    setSkillCooldown(decision.skill.id, decision.skill.cd);
    logs.push({
      text: `⚠️ 【${m.name}】周身妖氣暴漲，正在蓄力【${decision.skill.name}】（下回合爆發，快開護盾或致盲反制）！`,
      type: 'danger'
    });
  } else if (decision.actionType === 'RELEASE_CHARGED' || decision.actionType === 'USE_SKILL') {
    const sk = decision.skill;
    if (decision.actionType === 'RELEASE_CHARGED') {
      m.chargingSkill = null;
    } else {
      setSkillCooldown(sk.id, sk.cd);
    }

    if (sk.type === 'self_buff') {
      const healAmt = Math.max(15, Math.floor(m.maxHp * (sk.healPct || 0.14)));
      const atkAdd = Math.max(3, Math.floor(m.atk * (sk.atkBoostPct || 0.22)));
      m.hp = Math.min(m.maxHp, m.hp + healAmt);
      m.atk += atkAdd;
      logs.push({
        text: `${sk.icon} 【${m.name}】發動【${sk.name}】，恢復 +${healAmt} 氣血並提升攻擊力 +${atkAdd}！`,
        type: 'monster',
        dmgRole: 'monster_normal'
      });
    } else if (sk.type === 'aoe_limited' || sk.type === 'boss_charge_aoe') {
      const primary = selectMonsterSmartTarget({
        monster: m,
        candidates,
        combatBuffs: updatedBuffs,
        forceLowestHp: false
      });
      const hitList = pickMultipleAllyTargets(candidates, primary, sk.maxTargets || 2);
      const skillBanner = decision.actionType === 'RELEASE_CHARGED'
        ? `爆發蓄力絕招【${sk.name}】`
        : `施展【${sk.name}】`;

      logs.push({
        text: `${sk.icon} 【${m.name}】${skillBanner}，鎖定我方 ${hitList.length} 名成員發動範圍轟擊！`,
        type: 'monster',
        dmgRole: 'monster_crit'
      });

      hitList.forEach(target => {
        if (target.isPlayer) {
          applyDamageToPlayer(sk.mult || 0.85, isCrit, `【${sk.name}】`, null, sk.debuff, sk.debuffTurns);
        } else {
          applyDamageToHero(target.heroId, (sk.mult || 0.85) * 0.92, isCrit, `【${sk.name}】`, sk.debuff, sk.debuffTurns);
        }
      });
    } else {
      // single_debuff 或 snipe_lowest
      const chosen = selectMonsterSmartTarget({
        monster: m,
        candidates,
        combatBuffs: updatedBuffs,
        forceLowestHp: sk.type === 'snipe_lowest'
      });

      if (chosen) {
        const tagLabel = `${sk.icon}施展【${sk.name}】`;
        if (chosen.isPlayer) {
          applyDamageToPlayer(sk.mult || 1.28, isCrit, tagLabel, null, sk.debuff, sk.debuffTurns);
        } else {
          applyDamageToHero(chosen.heroId, (sk.mult || 1.28) * 0.92, isCrit, tagLabel, sk.debuff, sk.debuffTurns);
        }
      }
    }
  } else {
    // 智能普通攻擊（會優先補刀殘血、切輔助或打五行剋制）
    const chosen = selectMonsterSmartTarget({
      monster: m,
      candidates,
      combatBuffs: updatedBuffs,
      forceLowestHp: false
    });

    if (chosen) {
      if (chosen.isPlayer) {
        applyDamageToPlayer(1.0, isCrit);
      } else {
        applyDamageToHero(chosen.heroId, 0.92, isCrit);
      }
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
  getHeroRowIdx,
  playerTotalMaxHp
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
      recordAllyHit,
      playerTotalMaxHp
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
