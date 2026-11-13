import { ELEMENTS } from '../../data/constants';
import { calculateHeroEffectiveStats, normalizeHero } from '../statCalculator';
import {
  getMonsterSpeed,
  getSpeedAdvantage,
  getHeroCritProfile,
  calculateDamageToMonster
} from './combatFormulas';

function selectSmartTarget(aliveTargets, heroElement) {
  if (aliveTargets.length <= 1) return aliveTargets[0];

  const scored = aliveTargets.map(m => {
    let score = Math.random() * 25;
    // 優先集火低血量殘血目標
    const hpRatio = m.hp / Math.max(1, m.maxHp);
    if (hpRatio <= 0.30) score += 45;
    else if (hpRatio <= 0.55) score += 20;

    // 優先鎖定被自身五行剋制的目標
    if (ELEMENTS[heroElement]?.counters === m.element) score += 35;
    // 優先追擊帶有負面狀態的目標
    if (m.armorBreakTurns > 0 || m.vulnTurns > 0 || m.burnTurns > 0 || m.poisonTurns > 0) {
      score += 18;
    }
    return { monster: m, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0].monster;
}

function applySignatureDebuff(monster, skill, heroAtk) {
  if (!skill?.effect || !monster || monster.hp <= 0) return '';
  const turns = skill.effectTurns || 2;

  switch (skill.effect) {
    case 'armorBreak':
      monster.armorBreakTurns = Math.max(monster.armorBreakTurns || 0, turns);
      monster.armorBreakPct = Math.max(monster.armorBreakPct || 0, 0.30);
      return `【破甲${turns}T】`;
    case 'weaken':
      monster.weakenTurns = Math.max(monster.weakenTurns || 0, turns);
      monster.weakenPct = Math.max(monster.weakenPct || 0, 0.25);
      return `【虛弱${turns}T】`;
    case 'vuln':
      monster.vulnTurns = Math.max(monster.vulnTurns || 0, turns);
      monster.vulnPct = Math.max(monster.vulnPct || 0, 0.25);
      return `【易傷${turns}T】`;
    case 'burn':
      monster.burnTurns = Math.max(monster.burnTurns || 0, turns);
      monster.burnDmg = Math.max(monster.burnDmg || 0, Math.floor(heroAtk * 0.35));
      return `【灼燒${turns}T】`;
    case 'bleed':
      monster.bleedTurns = Math.max(monster.bleedTurns || 0, turns);
      monster.bleedDmg = Math.max(monster.bleedDmg || 0, Math.floor(heroAtk * 0.35));
      return `【流血${turns}T】`;
    case 'poison':
      monster.poisonTurns = Math.max(monster.poisonTurns || 0, turns);
      monster.poisonStacks = Math.min(5, (monster.poisonStacks || 0) + 1);
      monster.poisonPct = Math.max(monster.poisonPct || 0, 0.08);
      return `【劇毒×${monster.poisonStacks}】`;
    default:
      return '';
  }
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
  isFengShui,
  getHeroRowIdx,
  logs,
  recordMonsterHit,
  recordAllyHeal
}) {
  let updatedRoster = currentRoster;
  const rawHero = updatedRoster.find(item => item.instanceId === hInstanceId);
  if (!rawHero || !activeHeroInstanceIds.includes(rawHero.instanceId) || rawHero.hp <= 0) {
    return updatedRoster;
  }

  const h = normalizeHero(rawHero);
  const aliveTargets = currentMonsters.filter(m => m.hp > 0);
  if (aliveTargets.length === 0) return updatedRoster;

  const validTarget = selectSmartTarget(aliveTargets, h.element);

  const hRow = getHeroRowIdx(h.instanceId);
  const {
    effectiveMaxHp: selfMaxHp,
    effectiveAtk,
    effectiveSpeed,
    elemDmgPct,
    skillChance,
    lifestealPct,
    critRateBonus,
    critDmgBonus,
    ignoreDefPct: innateIgnoreDef,
    doubleHitPct,
    autoHealPct,
    shieldOnSkillPct
  } = calculateHeroEffectiveStats(
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

  const { critRate: baseHCritRate, critDamage: baseHCritDmg } = getHeroCritProfile(h);
  const hCritRate = Math.min(0.90, baseHCritRate + windCritAdd + critRateBonus);
  const hCritDmg = baseHCritDmg + critDmgBonus;

  // 組合可用技能池：固有本命絕學 + 已裝備主動技能卡
  const skillPool = [];
  if (h.signatureSkill) {
    skillPool.push({ ...h.signatureSkill, isSignature: true });
  }
  (h.activeSkillSlots || []).forEach(card => {
    skillPool.push({ ...card, isSignature: false });
  });

  // 偵測我方是否有人處於危急血線（低於 65%），提升治療類絕學觸發率
  const playerHpRatio = currentPlayer.hp / Math.max(1, playerTotalMaxHp);
  const anyAllyLow = playerHpRatio < 0.65 || updatedRoster.some(ally => {
    if (!activeHeroInstanceIds.includes(ally.instanceId) || ally.hp <= 0) return false;
    const { effectiveMaxHp } = calculateHeroEffectiveStats(ally, isFengShui, currentHeroBuffs[ally.instanceId], getHeroRowIdx(ally.instanceId));
    return (ally.hp / Math.max(1, effectiveMaxHp)) < 0.65;
  });

  const fusionLevel = Math.min(5, h.fusionLevel || 0);
  const dualCardBonusChance = (h.activeSkillSlots || []).length >= 2 ? 0.10 : 0;
  const emergencyHealBoost = (anyAllyLow && skillPool.some(s => s.target === 'heal')) ? 0.22 : 0;
  const boostedSkillChance = Math.min(
    0.95,
    Math.max(skillChance, 0.48) + dualCardBonusChance + (fusionLevel * 0.04) + tianjiSkillBoost + emergencyHealBoost
  );

  const shouldCastSkill = skillPool.length > 0 && (forceSkill || Math.random() < boostedSkillChance);

  const checkStatusSynergy = (targetM) => {
    const hasDot = (targetM.burnTurns > 0) || (targetM.bleedTurns > 0) || (targetM.poisonTurns > 0);
    const isPhysHero = ['猛將', '巧匠'].includes(h.heroClass);
    const vulnCritBonus = (isPhysHero && targetM.vulnTurns > 0) ? 0.15 : 0;
    return { synergyMult: hasDot ? 1.25 : 1.0, hasDot, vulnCritBonus };
  };

  let totalDealtDamageThisTurn = 0;

  const healAllAllies = (healVal) => {
    if (healVal <= 0) return;
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
  };

  const castHeroSkill = (skillToCast, echoPowerMult = 1.0, isEchoCast = false) => {
    const fusionScale = 1 + (fusionLevel * 0.12);
    const cardBonusScale = skillToCast.isSignature ? 1.0 : (1.20 + ((h.activeSkillSlots || []).length >= 2 ? 0.12 : 0));
    const mult = (skillToCast.mult || 1.7) * fusionScale * cardBonusScale * echoPowerMult * (1 + extraBonusMult);
    const starBadge = fusionLevel > 0 ? `★+${fusionLevel}` : '';
    const prefixTag = isEchoCast ? '【★+5 無雙連攜二連發】' : (tianjiSkillBoost > 0 ? '【🌌天機催靈】' : '');
    const skillLabel = skillToCast.isSignature ? `本命絕學【${skillToCast.name}】` : `技能卡【${skillToCast.name}】`;
    const combinedIgnoreDef = Math.min(0.85, innateIgnoreDef + (skillToCast.ignoreDefPct || 0));

    if (skillToCast.target === 'aoe') {
      let totalAoeDmg = 0;
      let anyAoeCrit = false;
      const appliedTags = new Set();

      currentMonsters.forEach(m => {
        if (m.hp > 0) {
          const { synergyMult, vulnCritBonus } = checkStatusSynergy(m);
          const { dmg, isCrit } = calculateDamageToMonster(finalHeroAtk * mult * synergyMult, m, h.element, {
            ignoreDefPct: combinedIgnoreDef,
            extraElemPct: elemDmgPct,
            critRate: Math.min(0.95, hCritRate + vulnCritBonus),
            critDamage: hCritDmg
          });
          m.hp = Math.max(0, m.hp - dmg);
          recordMonsterHit(m.id, dmg, isCrit);
          totalAoeDmg += dmg;
          totalDealtDamageThisTurn += dmg;
          if (isCrit) anyAoeCrit = true;

          const effTag = applySignatureDebuff(m, skillToCast, finalHeroAtk);
          if (effTag) appliedTags.add(effTag);
        }
      });

      const effStr = appliedTags.size > 0 ? ` 附加${[...appliedTags].join('')}` : '';
      logs.push({
        text: `${anyAoeCrit ? '💥暴擊！' : (skillToCast.icon || '✨') + ' '}${prefixTag}【T${h.tier}${starBadge}】${h.name}施展${skillLabel}，橫掃全場造成 ${totalAoeDmg} 點傷害${effStr}！`,
        type: 'hero',
        dmgRole: anyAoeCrit ? 'player_crit' : 'player_normal'
      });
    } else if (skillToCast.target === 'heal') {
      const healVal = Math.floor(finalHeroAtk * mult);
      healAllAllies(healVal);

      let shieldText = '';
      if (skillToCast.shieldRatio > 0 && currentBuffs) {
        const addShield = Math.floor(finalHeroAtk * skillToCast.shieldRatio * fusionScale);
        currentBuffs.shield = (currentBuffs.shield || 0) + addShield;
        shieldText = `並凝聚 +${addShield} 點護體靈罡`;
      }

      logs.push({
        text: `${skillToCast.icon || '🌿'} ${prefixTag}【T${h.tier}${starBadge}】${h.name}施展${skillLabel}，全隊恢復 +${healVal} HP${shieldText}！`,
        type: 'hero',
        dmgRole: 'heal'
      });
    } else {
      const curAlive = currentMonsters.filter(m => m.hp > 0);
      const stTarget = validTarget.hp > 0 ? validTarget : curAlive[0];
      if (stTarget) {
        const { synergyMult, hasDot, vulnCritBonus } = checkStatusSynergy(stTarget);
        const { dmg, isCrit } = calculateDamageToMonster(finalHeroAtk * mult * synergyMult, stTarget, h.element, {
          ignoreDefPct: Math.min(0.85, combinedIgnoreDef + 0.15),
          extraElemPct: elemDmgPct,
          critRate: Math.min(0.95, hCritRate + 0.12 + vulnCritBonus),
          critDamage: hCritDmg
        });
        stTarget.hp = Math.max(0, stTarget.hp - dmg);
        recordMonsterHit(stTarget.id, dmg, isCrit);
        totalDealtDamageThisTurn += dmg;

        const effTag = applySignatureDebuff(stTarget, skillToCast, finalHeroAtk);
        let hybridHealText = '';
        if (skillToCast.healTeamRatio > 0) {
          const hVal = Math.floor(finalHeroAtk * skillToCast.healTeamRatio * fusionScale);
          healAllAllies(hVal);
          hybridHealText = `，同時療癒全隊 +${hVal} HP`;
        }

        logs.push({
          text: `${isCrit ? '💥暴擊！' : (skillToCast.icon || '⚡') + ' '}${prefixTag}【T${h.tier}${starBadge}】${h.name}爆發${skillLabel}${hasDot ? '(狀態共鳴+25%)' : ''}，重創【${stTarget.name}】造成 ${dmg} 點傷害${effTag}${hybridHealText}！`,
          type: 'hero',
          dmgRole: isCrit ? 'player_crit' : 'player_normal'
        });
      }
    }

    // 本命天賦：施放絕學時附加護盾（僅首發觸發）
    if (!isEchoCast && shieldOnSkillPct > 0 && currentBuffs) {
      const traitShield = Math.floor(finalHeroAtk * shieldOnSkillPct);
      if (traitShield > 0) {
        currentBuffs.shield = (currentBuffs.shield || 0) + traitShield;
        logs.push({
          text: `🛡️ 【${h.traitName}】護脈真氣激發，全隊獲得 +${traitShield} 點護盾！`,
          type: 'sys',
          dmgRole: 'shield'
        });
      }
    }
  };

  if (shouldCastSkill) {
    // 優先選擇治療技能（若隊伍危急）
    const healSkills = skillPool.filter(s => s.target === 'heal');
    const chosenSkill = (anyAllyLow && healSkills.length > 0 && Math.random() < 0.75)
      ? healSkills[Math.floor(Math.random() * healSkills.length)]
      : skillPool[Math.floor(Math.random() * skillPool.length)];

    castHeroSkill(chosenSkill, 1.0, false);

    if (fusionLevel >= 5 && currentMonsters.some(m => m.hp > 0) && Math.random() < 0.25) {
      castHeroSkill(chosenSkill, 0.65, true);
    }
  } else {
    const { synergyMult, hasDot, vulnCritBonus } = checkStatusSynergy(validTarget);
    const { dmg, isCrit } = calculateDamageToMonster(finalHeroAtk * synergyMult, validTarget, h.element, {
      ignoreDefPct: innateIgnoreDef,
      extraElemPct: elemDmgPct,
      critRate: Math.min(0.92, hCritRate + vulnCritBonus),
      critDamage: hCritDmg
    });
    validTarget.hp = Math.max(0, validTarget.hp - dmg);
    recordMonsterHit(validTarget.id, dmg, isCrit);
    totalDealtDamageThisTurn += dmg;

    logs.push({
      text: `${isCrit ? '💥暴擊！' : '💥 '}英雄【${h.name}】攻擊【${validTarget.name}】${hasDot ? '(狀態共鳴+25%)' : ''}，造成 ${dmg} 點傷害！`,
      type: 'hero',
      dmgRole: isCrit ? 'player_crit' : 'player_normal'
    });

    // 速度連擊 + 本命天賦追擊連擊率疊加
    const targetSpeed = getMonsterSpeed(validTarget);
    const { doubleStrikeRate } = getSpeedAdvantage(finalHeroSpeed, targetSpeed);
    const totalFollowChance = Math.min(0.85, doubleStrikeRate + doubleHitPct);

    if (validTarget.hp > 0 && totalFollowChance > 0 && Math.random() < totalFollowChance) {
      const { dmg: followDmg, isCrit: followCrit } = calculateDamageToMonster(
        finalHeroAtk * 0.58,
        validTarget,
        h.element,
        {
          ignoreDefPct: innateIgnoreDef,
          extraElemPct: elemDmgPct,
          critRate: hCritRate,
          critDamage: hCritDmg
        }
      );
      validTarget.hp = Math.max(0, validTarget.hp - followDmg);
      recordMonsterHit(validTarget.id, followDmg, followCrit);
      totalDealtDamageThisTurn += followDmg;

      logs.push({
        text: `⚡ 疾速追擊！英雄【${h.name}】連環出招再對【${validTarget.name}】造成 ${followDmg} 點傷害！`,
        type: 'hero',
        dmgRole: followCrit ? 'player_crit' : 'player_normal'
      });
    }
  }

  // 本命天賦：攻擊吸血回血
  if (lifestealPct > 0 && totalDealtDamageThisTurn > 0) {
    const drainHp = Math.max(1, Math.floor(totalDealtDamageThisTurn * lifestealPct));
    updatedRoster = updatedRoster.map(ally => {
      if (ally.instanceId !== h.instanceId) return ally;
      const nextHp = Math.min(selfMaxHp, ally.hp + drainHp);
      if (nextHp > ally.hp) {
        recordAllyHeal(h.instanceId, nextHp - ally.hp);
      }
      return { ...ally, hp: nextHp };
    });
  }

  // 本命天賦：行動後自動療傷（治療目前血量比例最低的隊友）
  if (autoHealPct > 0) {
    const mendVal = Math.max(8, Math.floor(finalHeroAtk * autoHealPct));
    let lowestTarget = { id: 'PLAYER', ratio: currentPlayer.hp / Math.max(1, playerTotalMaxHp) };

    updatedRoster.forEach(ally => {
      if (!activeHeroInstanceIds.includes(ally.instanceId) || ally.hp <= 0) return;
      const { effectiveMaxHp } = calculateHeroEffectiveStats(
        ally, isFengShui, currentHeroBuffs[ally.instanceId], getHeroRowIdx(ally.instanceId)
      );
      const r = ally.hp / Math.max(1, effectiveMaxHp);
      if (r < lowestTarget.ratio) {
        lowestTarget = { id: ally.instanceId, ratio: r };
      }
    });

    if (lowestTarget.ratio < 0.98) {
      if (lowestTarget.id === 'PLAYER') {
        currentPlayer.hp = Math.min(playerTotalMaxHp, currentPlayer.hp + mendVal);
        recordAllyHeal('PLAYER', mendVal);
        logs.push({
          text: `💚 【${h.traitName}】靈藥餘韻自動為少俠恢復 +${mendVal} HP！`,
          type: 'hero',
          dmgRole: 'heal'
        });
      } else {
        let healedName = '';
        updatedRoster = updatedRoster.map(ally => {
          if (ally.instanceId !== lowestTarget.id) return ally;
          const { effectiveMaxHp } = calculateHeroEffectiveStats(
            ally, isFengShui, currentHeroBuffs[ally.instanceId], getHeroRowIdx(ally.instanceId)
          );
          healedName = ally.name;
          recordAllyHeal(ally.instanceId, mendVal);
          return { ...ally, hp: Math.min(effectiveMaxHp, ally.hp + mendVal) };
        });
        if (healedName) {
          logs.push({
            text: `💚 【${h.traitName}】靈藥餘韻自動為【${healedName}】恢復 +${mendVal} HP！`,
            type: 'hero',
            dmgRole: 'heal'
          });
        }
      }
    }
  }

  return updatedRoster;
}
