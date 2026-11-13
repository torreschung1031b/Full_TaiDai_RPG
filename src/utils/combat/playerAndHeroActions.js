import {
  calculateHeroEffectiveStats,
  pickUpToNMonsterIndices
} from '../statCalculator';
import {
  getMonsterSpeed,
  getSpeedAdvantage,
  getSkillMeta,
  getPlayerCritProfile,
  getHeroCritProfile,
  calculateDamageToMonster
} from './combatFormulas';

export function validateAndConsumePlayerSkill({
  actionInput,
  currentPlayer,
  currentBuffs
}) {
  if (actionInput.type !== 'skill' || !actionInput.skill) {
    return { valid: true };
  }

  const sk = actionInput.skill;
  const skIdx = actionInput.skillIdx;
  const skLvl = currentPlayer.skillLevels?.[skIdx] || 0;
  const { unlockLevel, reqPrevSkillLevel, cooldown } = getSkillMeta(sk, skIdx);

  if ((currentPlayer.level || 1) < unlockLevel) {
    return {
      valid: false,
      abortResult: {
        outcome: 'ABORTED',
        logs: [{ text: `🔒 技能【${sk.name}】需主角達到 Lv.${unlockLevel} 方可施展！`, type: 'sys' }]
      }
    };
  }
  if (skIdx > 0 && reqPrevSkillLevel > 0 && (currentPlayer.skillLevels?.[skIdx - 1] || 0) < reqPrevSkillLevel) {
    return {
      valid: false,
      abortResult: {
        outcome: 'ABORTED',
        logs: [{ text: `🔒 需先將前一招修煉至 Lv.${reqPrevSkillLevel}，方可領悟施展【${sk.name}】！`, type: 'sys' }]
      }
    };
  }
  if (skLvl <= 0) {
    return {
      valid: false,
      abortResult: {
        outcome: 'ABORTED',
        logs: [{ text: `🔒 技能【${sk.name}】尚未學習（Lv.0），請先至「技能樹」配點學習！`, type: 'sys' }]
      }
    };
  }
  const activeCd = currentBuffs.skillCooldowns?.[skIdx] || 0;
  if (activeCd > 0) {
    return {
      valid: false,
      abortResult: {
        outcome: 'ABORTED',
        logs: [{ text: `⏳ 技能【${sk.name}】冷卻調息中，尚需 ${activeCd} 回合方可再次施放！`, type: 'sys' }]
      }
    };
  }

  let hasResource = true;
  if (sk.costType === 'rage' && currentPlayer.rage < sk.cost) hasResource = false;
  if (sk.costType === 'mp' && currentPlayer.mp < sk.cost) hasResource = false;
  if (sk.costType === 'ammo' && currentPlayer.ammo < sk.cost) hasResource = false;

  if (!hasResource) {
    return {
      valid: false,
      abortResult: {
        outcome: 'ABORTED',
        logs: [{ text: `⚠️ 資源不足，無法發動【${sk.name}】！`, type: 'sys' }]
      }
    };
  }

  if (sk.costType === 'rage') currentPlayer.rage -= sk.cost;
  if (sk.costType === 'mp') currentPlayer.mp -= sk.cost;
  if (sk.costType === 'ammo') currentPlayer.ammo -= sk.cost;
  if (cooldown > 0) {
    currentBuffs.skillCooldowns[skIdx] = cooldown + 1;
  }

  return { valid: true };
}

export function executeSingleHeroAction({
  hInstanceId,
  forceSkill = false,
  extraBonusMult = 0,
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
}) {
  let updatedRoster = currentRoster;
  const h = updatedRoster.find(item => item.instanceId === hInstanceId);
  if (!h || !activeHeroInstanceIds.includes(h.instanceId) || h.hp <= 0) {
    return updatedRoster;
  }

  const aliveTargets = currentMonsters.filter(m => m.hp > 0);
  if (aliveTargets.length === 0) {
    return updatedRoster;
  }
  const validTarget = aliveTargets[Math.floor(Math.random() * aliveTargets.length)];

  const hRow = getHeroRowIdx(h.instanceId);
  const { effectiveAtk, effectiveSpeed, elemDmgPct, skillChance } = calculateHeroEffectiveStats(
    h,
    isFengShui,
    currentHeroBuffs[h.instanceId],
    hRow
  );

  // 風水師 Buff 加成（疾風祝禱 + 天機催靈大陣）
  const windAtkMult = currentBuffs?.windBuffTurns > 0 ? (1 + (currentBuffs.windAtkPct || 0)) : 1.0;
  const windSpeedAdd = currentBuffs?.windBuffTurns > 0 ? (currentBuffs.windSpeedBonus || 0) : 0;
  const windCritAdd = currentBuffs?.windBuffTurns > 0 ? (currentBuffs.windCritPct || 0) : 0;
  const tianjiSkillBoost = currentBuffs?.tianjiTurns > 0 ? (currentBuffs.tianjiSkillBoostPct || 0.35) : 0;
  const tianjiDmgMult = currentBuffs?.tianjiTurns > 0 ? (1 + (currentBuffs.tianjiDmgBoostPct || 0.20)) : 1.0;

  const finalHeroAtk = Math.floor(effectiveAtk * windAtkMult * tianjiDmgMult);
  const finalHeroSpeed = effectiveSpeed + windSpeedAdd;

  const { critRate: baseHCritRate, critDamage: hCritDmg } = getHeroCritProfile(h);
  const hCritRate = Math.min(0.85, baseHCritRate + windCritAdd);

  const activeCards = h.activeSkillSlots || [];
  const fusionLevel = Math.min(5, h.fusionLevel || 0);
  const dualCardBonusChance = activeCards.length >= 2 ? 0.10 : 0;
  const boostedSkillChance = Math.min(
    0.95,
    Math.max(skillChance, 0.42) + dualCardBonusChance + (fusionLevel * 0.04) + tianjiSkillBoost
  );
  const shouldCastSkill = activeCards.length > 0 && (forceSkill || Math.random() < boostedSkillChance);

  // 檢查目標是否處於異常狀態（觸發狀態共鳴增傷）
  const checkStatusSynergy = (targetM) => {
    const hasDot = (targetM.burnTurns > 0) || (targetM.bleedTurns > 0) || (targetM.poisonTurns > 0);
    const isPhysHero = ['猛將', '巧匠'].includes(h.heroClass);
    const vulnCritBonus = (isPhysHero && targetM.vulnTurns > 0) ? 0.15 : 0;
    return {
      synergyMult: hasDot ? 1.25 : 1.0,
      hasDot,
      vulnCritBonus
    };
  };

  const castHeroSkillCard = (cardToCast, echoPowerMult = 1.0, isEchoCast = false) => {
    const cardPowerScale = (1.35 + (fusionLevel * 0.12) + (activeCards.length >= 2 ? 0.15 : 0)) * echoPowerMult;
    const mult = (cardToCast.mult || 1.8) * cardPowerScale * (1 + extraBonusMult);
    const starBadge = fusionLevel > 0 ? `★+${fusionLevel}` : '';
    const prefixTag = isEchoCast ? '【★+5 無雙連攜二連發】' : (tianjiSkillBoost > 0 ? '【🌌天機催靈】' : '');

    if (cardToCast.target === 'aoe') {
      let totalAoeDmg = 0;
      let anyAoeCrit = false;
      currentMonsters.forEach(m => {
        if (m.hp > 0) {
          const { synergyMult, vulnCritBonus } = checkStatusSynergy(m);
          const { dmg, isCrit } = calculateDamageToMonster(finalHeroAtk * mult * synergyMult, m, h.element, {
            extraElemPct: elemDmgPct,
            critRate: Math.min(0.90, hCritRate + vulnCritBonus),
            critDamage: hCritDmg
          });
          m.hp = Math.max(0, m.hp - dmg);
          recordMonsterHit(m.id, dmg, isCrit);
          totalAoeDmg += dmg;
          if (isCrit) anyAoeCrit = true;
        }
      });
      logs.push({
        text: `${anyAoeCrit ? '💥暴擊！' : '✨ '}${prefixTag}【Tier ${h.tier}${starBadge}】英雄【${h.name}】施展技能卡【${cardToCast.name}】，橫掃全場造成 ${totalAoeDmg} 點傷害！`,
        type: 'hero',
        dmgRole: anyAoeCrit ? 'player_crit' : 'player_normal'
      });
    } else if (cardToCast.target === 'heal') {
      const healVal = Math.floor(finalHeroAtk * mult);
      currentPlayer.hp = Math.min(playerTotalMaxHp, currentPlayer.hp + healVal);
      recordAllyHeal('PLAYER', healVal);
      updatedRoster = updatedRoster.map(ally => {
        if (!activeHeroInstanceIds.includes(ally.instanceId) || ally.hp <= 0) return ally;
        const { effectiveMaxHp } = calculateHeroEffectiveStats(
          ally,
          isFengShui,
          currentHeroBuffs[ally.instanceId],
          getHeroRowIdx(ally.instanceId)
        );
        recordAllyHeal(ally.instanceId, healVal);
        return { ...ally, hp: Math.min(effectiveMaxHp, ally.hp + healVal) };
      });
      logs.push({
        text: `🌿 ${prefixTag}【Tier ${h.tier}${starBadge}】英雄【${h.name}】施展技能卡【${cardToCast.name}】，全隊恢復 +${healVal} HP！`,
        type: 'hero',
        dmgRole: 'heal'
      });
    } else {
      const curAlive = currentMonsters.filter(m => m.hp > 0);
      const stTarget = validTarget.hp > 0 ? validTarget : curAlive[0];
      if (stTarget) {
        const { synergyMult, hasDot, vulnCritBonus } = checkStatusSynergy(stTarget);
        const { dmg, isCrit } = calculateDamageToMonster(finalHeroAtk * mult * synergyMult, stTarget, h.element, {
          ignoreDefPct: 0.25,
          extraElemPct: elemDmgPct,
          critRate: Math.min(0.90, hCritRate + 0.15 + vulnCritBonus),
          critDamage: hCritDmg
        });
        stTarget.hp = Math.max(0, stTarget.hp - dmg);
        recordMonsterHit(stTarget.id, dmg, isCrit);
        logs.push({
          text: `${isCrit ? '💥暴擊！' : '⚡ '}${prefixTag}【Tier ${h.tier}${starBadge}】英雄【${h.name}】爆發技能卡【${cardToCast.name}】${hasDot ? '(狀態共鳴+25%)' : ''}，重創【${stTarget.name}】造成 ${dmg} 點傷害！`,
          type: 'hero',
          dmgRole: isCrit ? 'player_crit' : 'player_normal'
        });
      }
    }
  };

  if (shouldCastSkill) {
    const cardToCast = activeCards[Math.floor(Math.random() * activeCards.length)];
    castHeroSkillCard(cardToCast, 1.0, false);

    if (fusionLevel >= 5 && currentMonsters.some(m => m.hp > 0) && Math.random() < 0.25) {
      castHeroSkillCard(cardToCast, 0.65, true);
    }
  } else {
    const { synergyMult, hasDot, vulnCritBonus } = checkStatusSynergy(validTarget);
    const { dmg, isCrit } = calculateDamageToMonster(finalHeroAtk * synergyMult, validTarget, h.element, {
      extraElemPct: elemDmgPct,
      critRate: Math.min(0.90, hCritRate + vulnCritBonus),
      critDamage: hCritDmg
    });
    validTarget.hp = Math.max(0, validTarget.hp - dmg);
    recordMonsterHit(validTarget.id, dmg, isCrit);
    logs.push({
      text: `${isCrit ? '💥暴擊！' : '💥 '}英雄【${h.name}】攻擊【${validTarget.name}】${hasDot ? '(狀態共鳴+25%)' : ''}，造成 ${dmg} 點傷害！`,
      type: 'hero',
      dmgRole: isCrit ? 'player_crit' : 'player_normal'
    });

    const targetSpeed = getMonsterSpeed(validTarget);
    const { doubleStrikeRate } = getSpeedAdvantage(finalHeroSpeed, targetSpeed);
    if (validTarget.hp > 0 && doubleStrikeRate > 0 && Math.random() < doubleStrikeRate) {
      const { dmg: followDmg, isCrit: followCrit } = calculateDamageToMonster(
        finalHeroAtk * 0.50,
        validTarget,
        h.element,
        { extraElemPct: elemDmgPct, critRate: hCritRate, critDamage: hCritDmg }
      );
      validTarget.hp = Math.max(0, validTarget.hp - followDmg);
      recordMonsterHit(validTarget.id, followDmg, followCrit);
      logs.push({
        text: `⚡ 疾速連擊！英雄【${h.name}】追擊【${validTarget.name}】再造成 ${followDmg} 點傷害！`,
        type: 'hero',
        dmgRole: followCrit ? 'player_crit' : 'player_normal'
      });
    }
  }

  return updatedRoster;
}

/**
 * 執行主角行動（全職業 4 招制技能，第 1 招即為吃主屬性係數的基礎循環技）
 */
export function executePlayerAction({
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
}) {
  let updatedRoster = currentRoster;
  if (currentPlayer.hp <= 0) return updatedRoster;

  const isWarlock = currentPlayer.job === '術士';
  const isArtisan = currentPlayer.job === '巧匠';
  const innateIgnoreDef = isArtisan ? 0.15 : 0;

  const windAtkMult = currentBuffs?.windBuffTurns > 0 ? (1 + (currentBuffs.windAtkPct || 0)) : 1.0;
  const windSpeedAdd = currentBuffs?.windBuffTurns > 0 ? (currentBuffs.windSpeedBonus || 0) : 0;
  const windCritAdd = currentBuffs?.windBuffTurns > 0 ? (currentBuffs.windCritPct || 0) : 0;

  const effectivePlayerAtk = Math.floor(playerTotalAtk * windAtkMult);
  const effectivePlayerSpeed = playerTotalSpeed + windSpeedAdd;

  const { critRate: baseCritRate, critDamage: playerCritDmg } = getPlayerCritProfile(currentPlayer);
  const playerCritRate = Math.min(0.85, baseCritRate + windCritAdd);

  let targetIdx = selectedTargetIndex;
  if (!currentMonsters[targetIdx] || currentMonsters[targetIdx].hp <= 0) {
    targetIdx = currentMonsters.findIndex(m => m.hp > 0);
    if (targetIdx === -1) return updatedRoster;
  }

  if (actionInput.type !== 'skill' || !actionInput.skill) {
    return updatedRoster;
  }

  const sk = actionInput.skill;
  const skIdx = actionInput.skillIdx;
  const skLvl = Math.max(1, currentPlayer.skillLevels?.[skIdx] || 1);
  const skStats = sk.getStatsAtLevel ? sk.getStatsAtLevel(skLvl) : { mult: 1.0 };

  // ==================== 【猛將】4 招 ====================
  if (sk.id === 'w_s1') {
    const targetM = currentMonsters[targetIdx];
    if (targetM) {
      const { dmg, isCrit } = calculateDamageToMonster(effectivePlayerAtk * skStats.mult, targetM, currentPlayer.element, {
        critRate: playerCritRate,
        critDamage: playerCritDmg
      });
      targetM.hp = Math.max(0, targetM.hp - dmg);
      recordMonsterHit(targetM.id, dmg, isCrit);
      const gainRage = skStats.rageGain || 25;
      currentPlayer.rage = Math.min(100, (currentPlayer.rage || 0) + gainRage);
      logs.push({
        text: `${isCrit ? '💥暴擊！' : '⚔️ '}猛將施展【${sk.name} (Lv.${skLvl})】劈斬【${targetM.name}】造成 ${dmg} 點物理傷害，並累積 +${gainRage} 怒氣（目前 ${currentPlayer.rage}/100）！`,
        type: 'player',
        dmgRole: isCrit ? 'player_crit' : 'player_normal'
      });

      const mSpeed = getMonsterSpeed(targetM);
      const { doubleStrikeRate } = getSpeedAdvantage(effectivePlayerSpeed, mSpeed);
      if (targetM.hp > 0 && doubleStrikeRate > 0 && Math.random() < doubleStrikeRate) {
        const { dmg: followDmg, isCrit: followCrit } = calculateDamageToMonster(effectivePlayerAtk * 0.50, targetM, currentPlayer.element, {
          critRate: playerCritRate,
          critDamage: playerCritDmg
        });
        targetM.hp = Math.max(0, targetM.hp - followDmg);
        recordMonsterHit(targetM.id, followDmg, followCrit);
        logs.push({
          text: `⚡ 疾速連斬！猛將追擊【${targetM.name}】再造成 ${followDmg} 點傷害！`,
          type: 'player',
          dmgRole: followCrit ? 'player_crit' : 'player_normal'
        });
      }
    }
  } else if (sk.id === 'w_s2') {
    const conShieldBonus = Math.floor((currentPlayer.stats?.con || 10) * 3);
    const shieldGain = Math.floor(playerTotalMaxHp * (skStats.shieldPct || 0.22)) + conShieldBonus;
    currentBuffs.shield = (currentBuffs.shield || 0) + shieldGain;
    currentBuffs.guardTurns = 2;
    currentBuffs.guardSharePct = skStats.guardSharePct || 0.50;
    currentBuffs.guardReducePct = skStats.dmgReducePct || 0.25;
    currentBuffs.tauntTurns = 2;
    logs.push({
      text: `🛡️ 猛將施展【${sk.name} (Lv.${skLvl})】，為全隊張開 +${shieldGain} 點護盾，並開啟 2 回合援護姿態（減傷 ${Math.round(currentBuffs.guardReducePct * 100)}%、替隊友分擔 ${Math.round(currentBuffs.guardSharePct * 100)}% 所受傷害）！`,
      type: 'player',
      dmgRole: 'shield'
    });
  } else if (sk.id === 'w_s3') {
    const targetM = currentMonsters[targetIdx];
    if (targetM) {
      const { dmg, isCrit } = calculateDamageToMonster(effectivePlayerAtk * skStats.mult, targetM, currentPlayer.element, {
        critRate: playerCritRate,
        critDamage: playerCritDmg
      });
      targetM.hp = Math.max(0, targetM.hp - dmg);
      recordMonsterHit(targetM.id, dmg, isCrit);
      const healAmt = Math.max(10, Math.floor(dmg * (skStats.lifestealPct || 0.45)));
      currentPlayer.hp = Math.min(playerTotalMaxHp, currentPlayer.hp + healAmt);
      recordAllyHeal('PLAYER', healAmt);
      logs.push({
        text: `${isCrit ? '💥暴擊！' : '🩸 '}猛將施展【${sk.name} (Lv.${skLvl})】，重創【${targetM.name}】造成 ${dmg} 點傷害，並吸取氣血恢復 +${healAmt} HP！`,
        type: 'player',
        dmgRole: isCrit ? 'player_crit' : 'player_normal'
      });
    }
  } else if (sk.id === 'w_s4') {
    const hitIndices = pickUpToNMonsterIndices(currentMonsters, targetIdx, 5);
    hitIndices.forEach(mIdx => {
      const m = currentMonsters[mIdx];
      const { dmg, isCrit } = calculateDamageToMonster(effectivePlayerAtk * skStats.mult, m, currentPlayer.element, {
        critRate: playerCritRate,
        critDamage: playerCritDmg
      });
      m.hp = Math.max(0, m.hp - dmg);
      recordMonsterHit(m.id, dmg, isCrit);
      m.armorBreakTurns = 2;
      m.armorBreakPct = skStats.breakPct || 0.20;
      m.weakenTurns = 2;
      m.weakenPct = skStats.weakenPct || 0.15;
    });
    logs.push({
      text: `🌋 猛將施展【${sk.name} (Lv.${skLvl})】橫掃 ${hitIndices.length} 名敵怪，使其全體陷入破甲降防與虛弱降攻 (2回合)！`,
      type: 'player',
      dmgRole: 'player_normal'
    });
  }

  // ==================== 【巧匠】4 招 ====================
  else if (sk.id === 'a_s1') {
    const targetM = currentMonsters[targetIdx];
    if (targetM) {
      const { dmg, isCrit } = calculateDamageToMonster(effectivePlayerAtk * skStats.mult, targetM, currentPlayer.element, {
        ignoreDefPct: innateIgnoreDef,
        critRate: playerCritRate,
        critDamage: playerCritDmg
      });
      targetM.hp = Math.max(0, targetM.hp - dmg);
      recordMonsterHit(targetM.id, dmg, isCrit);
      const gainAmmo = skStats.ammoGain || 2;
      currentPlayer.ammo = Math.min(currentPlayer.maxAmmo, (currentPlayer.ammo || 0) + gainAmmo);
      logs.push({
        text: `${isCrit ? '💥暴擊！' : '🏹 '}巧匠施展【${sk.name} (Lv.${skLvl})】射擊【${targetM.name}】造成 ${dmg} 點物理傷害，並裝填 +${gainAmmo} 彈藥（目前 ${currentPlayer.ammo}/${currentPlayer.maxAmmo}）！`,
        type: 'player',
        dmgRole: isCrit ? 'player_crit' : 'player_normal'
      });

      const mSpeed = getMonsterSpeed(targetM);
      const { doubleStrikeRate } = getSpeedAdvantage(effectivePlayerSpeed, mSpeed);
      if (targetM.hp > 0 && doubleStrikeRate > 0 && Math.random() < doubleStrikeRate) {
        const { dmg: followDmg, isCrit: followCrit } = calculateDamageToMonster(effectivePlayerAtk * 0.50, targetM, currentPlayer.element, {
          ignoreDefPct: innateIgnoreDef,
          critRate: playerCritRate,
          critDamage: playerCritDmg
        });
        targetM.hp = Math.max(0, targetM.hp - followDmg);
        recordMonsterHit(targetM.id, followDmg, followCrit);
        logs.push({
          text: `⚡ 疾風連射！巧匠追擊【${targetM.name}】再造成 ${followDmg} 點傷害！`,
          type: 'player',
          dmgRole: followCrit ? 'player_crit' : 'player_normal'
        });
      }
    }
  } else if (sk.id === 'a_s2') {
    const hitIndices = pickUpToNMonsterIndices(currentMonsters, targetIdx, 3);
    const bleedDmg = Math.max(8, Math.floor(effectivePlayerAtk * (skStats.bleedMult || 0.40)));
    hitIndices.forEach(mIdx => {
      const m = currentMonsters[mIdx];
      const { dmg, isCrit } = calculateDamageToMonster(effectivePlayerAtk * skStats.mult, m, currentPlayer.element, {
        ignoreDefPct: innateIgnoreDef,
        critRate: playerCritRate,
        critDamage: playerCritDmg
      });
      m.hp = Math.max(0, m.hp - dmg);
      recordMonsterHit(m.id, dmg, isCrit);
      // 不可疊加流血（刷新持續回合與最高傷害）
      m.bleedTurns = 2;
      m.bleedDmg = Math.max(m.bleedDmg || 0, bleedDmg);
    });
    logs.push({
      text: `🩸 巧匠施展【${sk.name} (Lv.${skLvl})】，箭雨割裂 ${hitIndices.length} 名敵怪並附加不可疊加「流血」（每回合 ${bleedDmg} 點流血傷害，持續 2 回合）！`,
      type: 'player',
      dmgRole: 'player_normal'
    });
  } else if (sk.id === 'a_s3') {
    const hitIndices = pickUpToNMonsterIndices(currentMonsters, targetIdx, 5);
    const vulnPct = skStats.vulnPct || 0.24;
    hitIndices.forEach(mIdx => {
      const m = currentMonsters[mIdx];
      // 不可疊加易傷（刷新持續回合與最高比例）
      m.vulnTurns = 2;
      m.vulnPct = Math.max(m.vulnPct || 0, vulnPct);
    });
    logs.push({
      text: `🎯 巧匠施展【${sk.name} (Lv.${skLvl})】，為最多 ${hitIndices.length} 名敵怪純施加不可疊加「易傷 +${Math.round(vulnPct * 100)}%」（2 回合內全隊對其傷害大幅提升）！`,
      type: 'player',
      dmgRole: 'sys'
    });
  } else if (sk.id === 'a_s4') {
    const hitIndices = pickUpToNMonsterIndices(currentMonsters, targetIdx, 5);
    let totalDmg = 0;
    let anyCrit = false;
    hitIndices.forEach(mIdx => {
      const m = currentMonsters[mIdx];
      const { dmg, isCrit } = calculateDamageToMonster(effectivePlayerAtk * skStats.mult, m, currentPlayer.element, {
        ignoreDefPct: skStats.ignoreDefPct || 0.35,
        critRate: playerCritRate,
        critDamage: playerCritDmg
      });
      m.hp = Math.max(0, m.hp - dmg);
      recordMonsterHit(m.id, dmg, isCrit);
      totalDmg += dmg;
      if (isCrit) anyCrit = true;
    });
    logs.push({
      text: `${anyCrit ? '💥暴擊！' : '☄️ '}巧匠施展【${sk.name} (Lv.${skLvl})】，萬箭齊發貫穿 ${hitIndices.length} 名敵怪，累計造成 ${totalDmg} 點穿甲爆發傷害！`,
      type: 'player',
      dmgRole: anyCrit ? 'player_crit' : 'player_normal'
    });
  }

  // ==================== 【術士】4 招 ====================
  else if (sk.id === 'm_s1') {
    const targetM = currentMonsters[targetIdx];
    if (targetM) {
      const { dmg, isCounter, isCrit } = calculateDamageToMonster(effectivePlayerAtk * skStats.mult, targetM, currentPlayer.element, {
        isWarlock: true,
        critRate: playerCritRate,
        critDamage: playerCritDmg
      });
      targetM.hp = Math.max(0, targetM.hp - dmg);
      recordMonsterHit(targetM.id, dmg, isCrit);
      const gainMp = (skStats.mpGain || 12) + (isCounter ? 10 : 0);
      currentPlayer.mp = Math.min(playerTotalMaxMp, (currentPlayer.mp || 0) + gainMp);
      logs.push({
        text: `${isCrit ? '💥暴擊！' : '🔮 '}術士施展【${sk.name} (Lv.${skLvl})】轟擊【${targetM.name}】造成 ${dmg} 點五行法傷，並回復 +${gainMp} MP${isCounter ? '（含五行相剋共鳴）' : ''}！`,
        type: 'player',
        dmgRole: isCrit ? 'player_crit' : 'player_normal'
      });

      const mSpeed = getMonsterSpeed(targetM);
      const { doubleStrikeRate } = getSpeedAdvantage(effectivePlayerSpeed, mSpeed);
      if (targetM.hp > 0 && doubleStrikeRate > 0 && Math.random() < doubleStrikeRate) {
        const { dmg: followDmg, isCrit: followCrit } = calculateDamageToMonster(effectivePlayerAtk * 0.50, targetM, currentPlayer.element, {
          isWarlock: true,
          critRate: playerCritRate,
          critDamage: playerCritDmg
        });
        targetM.hp = Math.max(0, targetM.hp - followDmg);
        recordMonsterHit(targetM.id, followDmg, followCrit);
        logs.push({
          text: `⚡ 靈訣連發！術士追擊【${targetM.name}】再造成 ${followDmg} 點法傷！`,
          type: 'player',
          dmgRole: followCrit ? 'player_crit' : 'player_normal'
        });
      }
    }
  } else if (sk.id === 'm_s2') {
    const hitIndices = pickUpToNMonsterIndices(currentMonsters, targetIdx, 3);
    const burnDmg = Math.max(10, Math.floor(effectivePlayerAtk * (skStats.burnMult || 0.42)));
    hitIndices.forEach(mIdx => {
      const m = currentMonsters[mIdx];
      const { dmg, isCrit } = calculateDamageToMonster(effectivePlayerAtk * skStats.mult, m, currentPlayer.element, {
        isWarlock: true,
        critRate: playerCritRate,
        critDamage: playerCritDmg
      });
      m.hp = Math.max(0, m.hp - dmg);
      recordMonsterHit(m.id, dmg, isCrit);
      // 不可疊加灼燒
      m.burnTurns = 2;
      m.burnDmg = Math.max(m.burnDmg || 0, burnDmg);
    });
    logs.push({
      text: `🔥 術士施展【${sk.name} (Lv.${skLvl})】，業火灼燒 ${hitIndices.length} 名敵怪並附加不可疊加「灼燒」（每回合 ${burnDmg} 點烈焰法傷，持續 2 回合）！`,
      type: 'player',
      dmgRole: 'player_normal'
    });
  } else if (sk.id === 'm_s3') {
    const hitIndices = pickUpToNMonsterIndices(currentMonsters, targetIdx, 5);
    const blindPct = skStats.blindPct || 0.32;
    hitIndices.forEach(mIdx => {
      const m = currentMonsters[mIdx];
      // 不可疊加致盲
      m.blindTurns = 2;
      m.blindPct = Math.max(m.blindPct || 0, blindPct);
    });
    logs.push({
      text: `🌫️ 術士施展【${sk.name} (Lv.${skLvl})】，召喚迷霧為最多 ${hitIndices.length} 名敵怪純施加不可疊加「致盲 -${Math.round(blindPct * 100)}% 命中」（2 回合）！`,
      type: 'player',
      dmgRole: 'sys'
    });
  } else if (sk.id === 'm_s4') {
    const hitIndices = pickUpToNMonsterIndices(currentMonsters, targetIdx, 5);
    let totalDmg = 0;
    let anyCrit = false;
    hitIndices.forEach(mIdx => {
      const m = currentMonsters[mIdx];
      const { dmg, isCrit } = calculateDamageToMonster(effectivePlayerAtk * skStats.mult, m, currentPlayer.element, {
        isWarlock: true,
        critRate: playerCritRate,
        critDamage: playerCritDmg
      });
      m.hp = Math.max(0, m.hp - dmg);
      recordMonsterHit(m.id, dmg, isCrit);
      totalDmg += dmg;
      if (isCrit) anyCrit = true;
    });
    logs.push({
      text: `${anyCrit ? '💥暴擊！' : '⚡ '}術士施展【${sk.name} (Lv.${skLvl})】，引動九天神雷劈擊 ${hitIndices.length} 名敵怪，累計造成 ${totalDmg} 點毀滅法傷！`,
      type: 'player',
      dmgRole: anyCrit ? 'player_crit' : 'player_normal'
    });
  }

  // ==================== 【藥師】4 招 ====================
  else if (sk.id === 'p_s1') {
    const targetM = currentMonsters[targetIdx];
    if (targetM) {
      const { dmg, isCrit } = calculateDamageToMonster(effectivePlayerAtk * skStats.mult, targetM, currentPlayer.element, {
        critRate: playerCritRate,
        critDamage: playerCritDmg
      });
      targetM.hp = Math.max(0, targetM.hp - dmg);
      recordMonsterHit(targetM.id, dmg, isCrit);
      const gainMp = skStats.mpGain || 12;
      currentPlayer.mp = Math.min(playerTotalMaxMp, (currentPlayer.mp || 0) + gainMp);
      logs.push({
        text: `${isCrit ? '💥暴擊！' : '🌿 '}藥師施展【${sk.name} (Lv.${skLvl})】刺擊【${targetM.name}】造成 ${dmg} 點法傷，並回復 +${gainMp} MP！`,
        type: 'player',
        dmgRole: isCrit ? 'player_crit' : 'player_normal'
      });
    }
  } else if (sk.id === 'p_s2') {
    // 鎖定我方當前氣血比例最低的 1 名角色進行單體強回血
    const intHealBonus = Math.floor((currentPlayer.stats?.int || 10) * 3.5);
    const healVal = Math.max(35, Math.floor(effectivePlayerAtk * skStats.mult) + intHealBonus);

    let lowestUnit = { type: 'PLAYER', ratio: currentPlayer.hp / Math.max(1, playerTotalMaxHp), name: currentPlayer.name };
    updatedRoster.forEach(ally => {
      if (!activeHeroInstanceIds.includes(ally.instanceId) || ally.hp <= 0) return;
      const { effectiveMaxHp } = calculateHeroEffectiveStats(
        ally,
        isFengShui,
        currentHeroBuffs[ally.instanceId],
        getHeroRowIdx(ally.instanceId)
      );
      const ratio = ally.hp / Math.max(1, effectiveMaxHp);
      if (ratio < lowestUnit.ratio) {
        lowestUnit = { type: 'HERO', instanceId: ally.instanceId, ratio, name: ally.name };
      }
    });

    if (lowestUnit.type === 'PLAYER') {
      currentPlayer.hp = Math.min(playerTotalMaxHp, currentPlayer.hp + healVal);
      recordAllyHeal('PLAYER', healVal);
    } else {
      updatedRoster = updatedRoster.map(ally => {
        if (ally.instanceId !== lowestUnit.instanceId) return ally;
        const { effectiveMaxHp } = calculateHeroEffectiveStats(
          ally,
          isFengShui,
          currentHeroBuffs[ally.instanceId],
          getHeroRowIdx(ally.instanceId)
        );
        recordAllyHeal(ally.instanceId, healVal);
        return { ...ally, hp: Math.min(effectiveMaxHp, ally.hp + healVal) };
      });
    }

    logs.push({
      text: `💖 藥師施展【${sk.name} (Lv.${skLvl})】，精準急救氣血最低的【${lowestUnit.name}】，強力恢復 +${healVal} HP！`,
      type: 'player',
      dmgRole: 'heal'
    });
  } else if (sk.id === 'p_s3') {
    const hitIndices = pickUpToNMonsterIndices(currentMonsters, targetIdx, 3);
    hitIndices.forEach(mIdx => {
      const m = currentMonsters[mIdx];
      const { dmg, isCrit } = calculateDamageToMonster(effectivePlayerAtk * skStats.mult, m, currentPlayer.element, {
        critRate: playerCritRate,
        critDamage: playerCritDmg
      });
      m.hp = Math.max(0, m.hp - dmg);
      recordMonsterHit(m.id, dmg, isCrit);
      m.poisonTurns = 3;
      m.poisonPct = skStats.poisonPct || 0.08;
      m.poisonStacks = Math.min(2, (m.poisonStacks || 0) + 1);
    });
    logs.push({
      text: `☠️ 藥師施展【${sk.name} (Lv.${skLvl})】，毒霧籠罩 ${hitIndices.length} 名敵怪並注入劇毒（持續 3 回合百分比真傷＋削弱 20% 攻擊力）！`,
      type: 'player',
      dmgRole: 'player_normal'
    });
  } else if (sk.id === 'p_s4') {
    const intBonus = Math.floor((currentPlayer.stats?.int || 10) * 1.5);
    const healVal = Math.max(20, Math.floor(effectivePlayerAtk * skStats.mult) + intBonus);
    const regenVal = Math.max(12, Math.floor(effectivePlayerAtk * (skStats.regenMult || 0.45)));

    currentPlayer.hp = Math.min(playerTotalMaxHp, currentPlayer.hp + healVal);
    recordAllyHeal('PLAYER', healVal);
    updatedRoster = updatedRoster.map(ally => {
      if (!activeHeroInstanceIds.includes(ally.instanceId) || ally.hp <= 0) return ally;
      const { effectiveMaxHp } = calculateHeroEffectiveStats(
        ally,
        isFengShui,
        currentHeroBuffs[ally.instanceId],
        getHeroRowIdx(ally.instanceId)
      );
      recordAllyHeal(ally.instanceId, healVal);
      return { ...ally, hp: Math.min(effectiveMaxHp, ally.hp + healVal) };
    });

    currentBuffs.teamRegenTurns = 2;
    currentBuffs.teamRegenVal = regenVal;

    logs.push({
      text: `🌧️ 藥師施展【${sk.name} (Lv.${skLvl})】，降下甘霖為全隊恢復 +${healVal} HP，並附加 2 回合「生機」（每回合全隊自動回復 +${regenVal} HP）！`,
      type: 'player',
      dmgRole: 'heal'
    });
  }

  // ==================== 【風水師】4 招（3、4 技已對調） ====================
  else if (sk.id === 'f_s1') {
    const targetM = currentMonsters[targetIdx];
    if (targetM) {
      const { dmg, isCrit } = calculateDamageToMonster(effectivePlayerAtk * skStats.mult, targetM, currentPlayer.element, {
        critRate: playerCritRate,
        critDamage: playerCritDmg
      });
      targetM.hp = Math.max(0, targetM.hp - dmg);
      recordMonsterHit(targetM.id, dmg, isCrit);
      const gainMp = skStats.mpGain || 12;
      currentPlayer.mp = Math.min(playerTotalMaxMp, (currentPlayer.mp || 0) + gainMp);
      logs.push({
        text: `${isCrit ? '💥暴擊！' : '🧿 '}風水師施展【${sk.name} (Lv.${skLvl})】符擊【${targetM.name}】造成 ${dmg} 點法傷，並回復 +${gainMp} MP！`,
        type: 'player',
        dmgRole: isCrit ? 'player_crit' : 'player_normal'
      });
    }
  } else if (sk.id === 'f_s2') {
    currentBuffs.windBuffTurns = 2;
    currentBuffs.windAtkPct = skStats.atkBuffPct || 0.18;
    currentBuffs.windSpeedBonus = skStats.speedBonus || 12;
    currentBuffs.windCritPct = skStats.critBonusPct || 0.10;
    logs.push({
      text: `🌪️ 風水師施展【${sk.name} (Lv.${skLvl})】，為全隊加持 2 回合「神行奮進」：全體攻擊 +${Math.round(currentBuffs.windAtkPct * 100)}%、速度 +${currentBuffs.windSpeedBonus}、暴擊率 +${Math.round(currentBuffs.windCritPct * 100)}%！`,
      type: 'player',
      dmgRole: 'shield'
    });
  } else if (sk.id === 'f_s3') {
    currentBuffs.baguaTurns = 2;
    currentBuffs.baguaReducePct = skStats.reducePct || 0.25;
    currentBuffs.baguaReflectPct = skStats.reflectPct || 0.20;
    currentBuffs.teamRegenTurns = Math.max(currentBuffs.teamRegenTurns || 0, 2);
    currentBuffs.teamRegenVal = Math.max(currentBuffs.teamRegenVal || 0, Math.max(15, Math.floor(effectivePlayerAtk * 0.40)));
    logs.push({
      text: `🔯 風水師展開【${sk.name} (Lv.${skLvl})】，全隊 2 回合承傷 -${Math.round(currentBuffs.baguaReducePct * 100)}%、反彈 ${Math.round(currentBuffs.baguaReflectPct * 100)}% 傷害並每回合自動回血！`,
      type: 'player',
      dmgRole: 'shield'
    });
  } else if (sk.id === 'f_s4') {
    currentBuffs.tianjiTurns = 3;
    currentBuffs.tianjiSkillBoostPct = skStats.heroSkillBoostPct || 0.35;
    currentBuffs.tianjiDmgBoostPct = skStats.heroDmgBoostPct || 0.20;
    logs.push({
      text: `🌌 風水師開啟終極奧義【${sk.name} (Lv.${skLvl})】！3 回合內全體英雄主動技能發動率大幅提升 +${Math.round(currentBuffs.tianjiSkillBoostPct * 100)}% 且全傷害 +${Math.round(currentBuffs.tianjiDmgBoostPct * 100)}%！`,
      type: 'player',
      dmgRole: 'shield'
    });
  }

  return updatedRoster;
}
