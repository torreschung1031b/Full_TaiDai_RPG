import { calculateHeroEffectiveStats } from '../statCalculator';
import {
  getMonsterSpeed,
  getSpeedAdvantage,
  getHeroCritProfile,
  calculateDamageToMonster
} from './combatFormulas';

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
  if (aliveTargets.length === 0) return updatedRoster;
  const validTarget = aliveTargets[Math.floor(Math.random() * aliveTargets.length)];

  const hRow = getHeroRowIdx(h.instanceId);
  const { effectiveAtk, effectiveSpeed, elemDmgPct, skillChance } = calculateHeroEffectiveStats(
    h,
    isFengShui,
    currentHeroBuffs[h.instanceId],
    hRow
  );

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

  const checkStatusSynergy = (targetM) => {
    const hasDot = (targetM.burnTurns > 0) || (targetM.bleedTurns > 0) || (targetM.poisonTurns > 0);
    const isPhysHero = ['猛將', '巧匠'].includes(h.heroClass);
    const vulnCritBonus = (isPhysHero && targetM.vulnTurns > 0) ? 0.15 : 0;
    return { synergyMult: hasDot ? 1.25 : 1.0, hasDot, vulnCritBonus };
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
          ally, isFengShui, currentHeroBuffs[ally.instanceId], getHeroRowIdx(ally.instanceId)
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
        finalHeroAtk * 0.50, validTarget, h.element,
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
