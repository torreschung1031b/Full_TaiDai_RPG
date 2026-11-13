import { ELEMENTS } from '../../data/constants';
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

/**
 * 預先檢驗主角技能合法性並扣除資源與設置冷卻
 */
export function validateAndConsumePlayerSkill({
  actionInput,
  currentPlayer,
  currentRoster,
  activeHeroInstanceIds,
  currentBuffs
}) {
  if (actionInput.type !== 'skill' || !actionInput.skill) {
    return { valid: true };
  }

  const sk = actionInput.skill;
  const skIdx = actionInput.skillIdx;
  const skLvl = currentPlayer.skillLevels[skIdx] || 0;
  const { unlockLevel, cooldown } = getSkillMeta(sk, skIdx);

  if ((currentPlayer.level || 1) < unlockLevel) {
    return {
      valid: false,
      abortResult: {
        outcome: 'ABORTED',
        logs: [{ text: `🔒 技能【${sk.name}】需主角達到 Lv.${unlockLevel} 方可施展！`, type: 'sys' }]
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
  const activeCd = currentBuffs.skillCooldowns[skIdx] || 0;
  if (activeCd > 0) {
    return {
      valid: false,
      abortResult: {
        outcome: 'ABORTED',
        logs: [{ text: `⏳ 技能【${sk.name}】冷卻調息中，尚需 ${activeCd} 回合方可再次施放！`, type: 'sys' }]
      }
    };
  }
  if (sk.id === 'p_s3') {
    const deadDeployed = currentRoster.filter(h => activeHeroInstanceIds.includes(h.instanceId) && h.hp <= 0);
    if (deadDeployed.length === 0) {
      return {
        valid: false,
        abortResult: {
          outcome: 'ABORTED',
          logs: [{ text: `⚠️ 目前沒有已陣亡的登場英雄，無需施放【九轉還魂丹】（未消耗真元）！`, type: 'sys' }]
        }
      };
    }
  }
  if (sk.id === 'f_s1') {
    const aliveDeployed = currentRoster.filter(h => activeHeroInstanceIds.includes(h.instanceId) && h.hp > 0);
    if (aliveDeployed.length === 0) {
      return {
        valid: false,
        abortResult: {
          outcome: 'ABORTED',
          logs: [{ text: `⚠️ 目前沒有存活的登場英雄可供借法（未消耗真元）！`, type: 'sys' }]
        }
      };
    }
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

/**
 * 執行單一英雄行動（支援 ★+5 技能卡連發與速度連擊）
 */
export function executeSingleHeroAction({
  hInstanceId,
  forceSkill = false,
  extraBonusMult = 0,
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
  const { critRate: hCritRate, critDamage: hCritDmg } = getHeroCritProfile(h);
  const activeCards = h.activeSkillSlots || [];
  const fusionLevel = Math.min(5, h.fusionLevel || 0);
  const dualCardBonusChance = activeCards.length >= 2 ? 0.10 : 0;
  const boostedSkillChance = Math.min(
    0.85,
    Math.max(skillChance, 0.45) + dualCardBonusChance + (fusionLevel * 0.04)
  );
  const shouldCastSkill = activeCards.length > 0 && (forceSkill || Math.random() < boostedSkillChance);

  const castHeroSkillCard = (cardToCast, echoPowerMult = 1.0, isEchoCast = false) => {
    const cardPowerScale = (1.35 + (fusionLevel * 0.12) + (activeCards.length >= 2 ? 0.15 : 0)) * echoPowerMult;
    const mult = (cardToCast.mult || 1.8) * cardPowerScale * (1 + extraBonusMult);
    const starBadge = fusionLevel > 0 ? `★+${fusionLevel}` : '';
    const prefixTag = isEchoCast ? '【★+5 無雙連攜二連發】' : (forceSkill ? '【乾坤借法連動】' : '');

    if (cardToCast.target === 'aoe') {
      let totalAoeDmg = 0;
      let anyAoeCrit = false;
      currentMonsters.forEach(m => {
        if (m.hp > 0) {
          const { dmg, isCrit } = calculateDamageToMonster(effectiveAtk * mult, m, h.element, {
            extraElemPct: elemDmgPct,
            critRate: hCritRate,
            critDamage: hCritDmg
          });
          m.hp = Math.max(0, m.hp - dmg);
          recordMonsterHit(m.id, dmg, isCrit);
          m.armorBreakTurns = Math.max(m.armorBreakTurns || 0, 1);
          m.armorBreakPct = Math.max(m.armorBreakPct || 0, 0.15);
          totalAoeDmg += dmg;
          if (isCrit) anyAoeCrit = true;
        }
      });
      logs.push({
        text: `${anyAoeCrit ? '💥暴擊！' : '✨ '}${prefixTag}【Tier ${h.tier}${starBadge}】英雄【${h.name}】觸發強化技能卡【${cardToCast.name}】，橫掃全場累計造成 ${totalAoeDmg} 點傷害並破甲 15%！`,
        type: 'hero',
        dmgRole: anyAoeCrit ? 'player_crit' : 'player_normal'
      });
    } else if (cardToCast.target === 'heal') {
      const healVal = Math.floor(effectiveAtk * mult);
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

      if (currentPlayer.job === '猛將') {
        currentPlayer.rage = Math.min(100, currentPlayer.rage + 10);
      } else if (currentPlayer.job === '巧匠') {
        currentPlayer.ammo = Math.min(currentPlayer.maxAmmo, currentPlayer.ammo + 2);
      } else {
        currentPlayer.mp = Math.min(playerTotalMaxMp, currentPlayer.mp + 10);
      }
      logs.push({
        text: `🌿 ${prefixTag}【Tier ${h.tier}${starBadge}】英雄【${h.name}】施展強化技能卡【${cardToCast.name}】，全隊恢復 +${healVal} HP 並為少俠補充真元資源！`,
        type: 'hero',
        dmgRole: 'heal'
      });
    } else {
      const curAlive = currentMonsters.filter(m => m.hp > 0);
      const stTarget = validTarget.hp > 0 ? validTarget : curAlive[0];
      if (stTarget) {
        const { dmg, isCrit } = calculateDamageToMonster(effectiveAtk * mult, stTarget, h.element, {
          ignoreDefPct: 0.25,
          extraElemPct: elemDmgPct,
          critRate: Math.min(0.85, hCritRate + 0.20),
          critDamage: hCritDmg
        });
        stTarget.hp = Math.max(0, stTarget.hp - dmg);
        recordMonsterHit(stTarget.id, dmg, isCrit);
        logs.push({
          text: `${isCrit ? '💥暴擊！' : '⚡ '}${prefixTag}【Tier ${h.tier}${starBadge}】英雄【${h.name}】爆發強化技能卡【${cardToCast.name}】，穿甲重創【${stTarget.name}】造成 ${dmg} 點傷害！`,
          type: 'hero',
          dmgRole: isCrit ? 'player_crit' : 'player_normal'
        });
      }
    }
  };

  if (shouldCastSkill) {
    const cardToCast = activeCards[Math.floor(Math.random() * activeCards.length)];
    castHeroSkillCard(cardToCast, 1.0, false);

    // ★+5 覺醒【無雙連攜】：25% 機率以 65% 威力追加施放一次
    if (fusionLevel >= 5 && currentMonsters.some(m => m.hp > 0) && Math.random() < 0.25) {
      castHeroSkillCard(cardToCast, 0.65, true);
    }
  } else {
    const bonusMult = forceSkill ? (1 + extraBonusMult) : 1.0;
    const { dmg, isCrit } = calculateDamageToMonster(effectiveAtk * bonusMult, validTarget, h.element, {
      extraElemPct: elemDmgPct,
      critRate: hCritRate,
      critDamage: hCritDmg
    });
    validTarget.hp = Math.max(0, validTarget.hp - dmg);
    recordMonsterHit(validTarget.id, dmg, isCrit);
    logs.push({
      text: `${isCrit ? '💥暴擊！' : '💥 '}${forceSkill ? '【乾坤借法連動】' : ''}英雄【${h.name}】攻擊【${validTarget.name}】，造成 ${dmg} 點打擊！`,
      type: 'hero',
      dmgRole: isCrit ? 'player_crit' : 'player_normal'
    });

    // 速度優勢普攻連擊追擊
    const targetSpeed = getMonsterSpeed(validTarget);
    const { doubleStrikeRate } = getSpeedAdvantage(effectiveSpeed, targetSpeed);
    if (validTarget.hp > 0 && doubleStrikeRate > 0 && Math.random() < doubleStrikeRate) {
      const { dmg: followDmg, isCrit: followCrit } = calculateDamageToMonster(
        effectiveAtk * bonusMult * 0.50,
        validTarget,
        h.element,
        { extraElemPct: elemDmgPct, critRate: hCritRate, critDamage: hCritDmg }
      );
      validTarget.hp = Math.max(0, validTarget.hp - followDmg);
      recordMonsterHit(validTarget.id, followDmg, followCrit);
      logs.push({
        text: `⚡ 疾速連擊！英雄【${h.name}】憑藉速度優勢（${effectiveSpeed} vs ${targetSpeed}）追加追擊，對【${validTarget.name}】再造成 ${followDmg} 點傷害！`,
        type: 'hero',
        dmgRole: followCrit ? 'player_crit' : 'player_normal'
      });
    }
  }

  updatedRoster = updatedRoster.map(item => {
    if (item.instanceId !== hInstanceId) return item;
    let updatedRage = item.rage || 0;
    let updatedAmmo = item.ammo || 6;
    let updatedMp = item.mp || 50;
    if (item.heroClass === '猛將') updatedRage = Math.min(100, updatedRage + 20);
    else if (item.heroClass === '巧匠') updatedAmmo = Math.min(item.maxAmmo || 6, updatedAmmo + 2);
    else updatedMp = Math.min(item.maxMp || 100, updatedMp + 15);
    return { ...item, rage: updatedRage, ammo: updatedAmmo, mp: updatedMp };
  });

  return updatedRoster;
}

/**
 * 執行主角行動（普通攻擊或施放職業／通用技能）
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
  const isMagicClass = ['術士', '藥師', '風水師'].includes(currentPlayer.job);
  const innateIgnoreDef = isArtisan ? 0.20 : 0;
  const { critRate: playerCritRate, critDamage: playerCritDmg } = getPlayerCritProfile(currentPlayer);

  let targetIdx = selectedTargetIndex;
  if (!currentMonsters[targetIdx] || currentMonsters[targetIdx].hp <= 0) {
    targetIdx = currentMonsters.findIndex(m => m.hp > 0);
    if (targetIdx === -1) return updatedRoster;
  }

  if (actionInput.type === 'attack') {
    const targetM = currentMonsters[targetIdx];
    if (!targetM || targetM.hp <= 0) return updatedRoster;

    const hits = isArtisan && currentPlayer.ammo > 6 ? 2 : 1;
    const attackLabel = isMagicClass ? '靈訣普攻' : isArtisan ? '連弩射擊' : '普通攻擊';

    for (let hIdx = 0; hIdx < hits; hIdx++) {
      if (targetM.hp <= 0) break;
      const { dmg, isCounter, isCrit } = calculateDamageToMonster(playerTotalAtk, targetM, currentPlayer.element, {
        ignoreDefPct: innateIgnoreDef,
        isWarlock,
        critRate: playerCritRate,
        critDamage: playerCritDmg
      });
      targetM.hp = Math.max(0, targetM.hp - dmg);
      recordMonsterHit(targetM.id, dmg, isCrit);

      logs.push({
        text: `${isCrit ? '💥暴擊！' : '🗡️ '}${hits === 2 ? `【連環二連射 第${hIdx + 1}箭】` : attackLabel}對【${targetM.name}】造成 ${dmg} 點傷害！`,
        type: 'player',
        dmgRole: isCrit ? 'player_crit' : 'player_normal'
      });
      if (isWarlock && isCounter) {
        currentPlayer.mp = Math.min(playerTotalMaxMp, currentPlayer.mp + 15);
        logs.push({ text: `🔮 【五行靈體】觸發相剋，額外回復 +15 MP！`, type: 'sys' });
      }
    }

    // 速度優勢普攻連擊追擊
    const mSpeed = getMonsterSpeed(targetM);
    const { doubleStrikeRate } = getSpeedAdvantage(playerTotalSpeed, mSpeed);
    if (targetM.hp > 0 && doubleStrikeRate > 0 && Math.random() < doubleStrikeRate) {
      const { dmg: followDmg, isCrit: followCrit } = calculateDamageToMonster(
        playerTotalAtk * 0.50,
        targetM,
        currentPlayer.element,
        { ignoreDefPct: innateIgnoreDef, isWarlock, critRate: playerCritRate, critDamage: playerCritDmg }
      );
      targetM.hp = Math.max(0, targetM.hp - followDmg);
      recordMonsterHit(targetM.id, followDmg, followCrit);
      logs.push({
        text: `⚡ 疾速連擊！少俠憑藉速度優勢（${playerTotalSpeed} vs ${mSpeed}）迅捷追擊，對【${targetM.name}】追加 ${followDmg} 點傷害！`,
        type: 'player',
        dmgRole: followCrit ? 'player_crit' : 'player_normal'
      });
    }

    if (currentPlayer.job === '猛將') {
      currentPlayer.rage = Math.min(100, currentPlayer.rage + 25);
      logs.push({ text: `🔥 猛將普攻攢怒 +25（目前怒氣: ${currentPlayer.rage}/100）`, type: 'sys' });
    } else if (currentPlayer.job === '巧匠') {
      currentPlayer.ammo = Math.min(currentPlayer.maxAmmo, currentPlayer.ammo + 4);
      logs.push({ text: `🏹 巧匠填裝彈藥 +4（目前彈藥: ${currentPlayer.ammo}/${currentPlayer.maxAmmo}）`, type: 'sys' });
    } else {
      currentPlayer.mp = Math.min(playerTotalMaxMp, currentPlayer.mp + 20);
      logs.push({ text: `💧 調息凝神恢復 +20 MP（目前: ${currentPlayer.mp}/${playerTotalMaxMp}）`, type: 'sys' });
    }
  } else if (actionInput.type === 'skill' && actionInput.skill) {
    const sk = actionInput.skill;
    const skIdx = actionInput.skillIdx;
    const skLvl = currentPlayer.skillLevels[skIdx] || 0;
    const skStats = sk.getStatsAtLevel(skLvl);

    if (sk.id === 'w_s1') {
      const conShieldBonus = currentPlayer.job === '猛將' ? Math.floor((currentPlayer.stats?.con || 0) * 3) : 0;
      const shieldGain = Math.floor(playerTotalMaxHp * skStats.shieldPct) + conShieldBonus;
      currentBuffs.shield += shieldGain;
      currentBuffs.tauntTurns = 2;
      logs.push({
        text: `🛡️ 猛將施展【金剛怒吼 (Lv.${skLvl})】，嘲諷全場敵怪 2 回合，並獲得 +${shieldGain} 點重裝護盾！`,
        type: 'player',
        dmgRole: 'shield'
      });
    } else if (sk.id === 'w_s2') {
      const targetM = currentMonsters[targetIdx];
      if (targetM) {
        const { dmg, isCrit } = calculateDamageToMonster(playerTotalAtk * skStats.mult, targetM, currentPlayer.element, {
          critRate: playerCritRate,
          critDamage: playerCritDmg
        });
        targetM.hp = Math.max(0, targetM.hp - dmg);
        recordMonsterHit(targetM.id, dmg, isCrit);
        targetM.armorBreakTurns = 2;
        targetM.armorBreakPct = skStats.breakPct;
        logs.push({
          text: `${isCrit ? '💥暴擊！' : '⚔️ '}猛將施展【裂地破甲斬 (Lv.${skLvl})】，對【${targetM.name}】造成 ${dmg} 點傷害並破甲降防 ${Math.round(skStats.breakPct * 100)}% (2回合)！`,
          type: 'player',
          dmgRole: isCrit ? 'player_crit' : 'player_normal'
        });
      }
    } else if (sk.id === 'w_s3') {
      const targetM = currentMonsters[targetIdx];
      if (targetM) {
        const { dmg, isCrit } = calculateDamageToMonster(playerTotalAtk * skStats.mult, targetM, currentPlayer.element, {
          critRate: playerCritRate,
          critDamage: playerCritDmg
        });
        targetM.hp = Math.max(0, targetM.hp - dmg);
        recordMonsterHit(targetM.id, dmg, isCrit);
        currentBuffs.reflectTurns = 2;
        currentBuffs.reflectPct = skStats.reflectPct;
        logs.push({
          text: `${isCrit ? '💥暴擊！' : '🔥 '}猛將施展【不動明王架勢 (Lv.${skLvl})】，對【${targetM.name}】造成 ${dmg} 點重擊，進入減傷 40%＋反彈 ${Math.round(skStats.reflectPct * 100)}% 狀態！`,
          type: 'player',
          dmgRole: isCrit ? 'player_crit' : 'player_normal'
        });
      }
    } else if (sk.id === 'a_s1') {
      const targetM = currentMonsters[targetIdx];
      if (targetM) {
        const isFullHp = targetM.hp === targetM.maxHp;
        const { dmg, isCrit } = calculateDamageToMonster(playerTotalAtk * skStats.mult, targetM, currentPlayer.element, {
          ignoreDefPct: 0.50,
          critRate: playerCritRate,
          critDamage: isFullHp ? 1.85 : playerCritDmg,
          forceCrit: isFullHp
        });
        targetM.hp = Math.max(0, targetM.hp - dmg);
        recordMonsterHit(targetM.id, dmg, isCrit);
        logs.push({
          text: `${isCrit ? '💥暴擊！' : '🎯 '}巧匠施展【穿雲追魂箭 (Lv.${skLvl})】${isFullHp ? '滿血狙殺！' : ''}對【${targetM.name}】造成 ${dmg} 點無視半甲重傷！`,
          type: 'player',
          dmgRole: isCrit ? 'player_crit' : 'player_normal'
        });
      }
    } else if (sk.id === 'a_s2') {
      const hitIndices = pickUpToNMonsterIndices(currentMonsters, targetIdx, 3);
      hitIndices.forEach(mIdx => {
        const m = currentMonsters[mIdx];
        const { dmg, isCrit } = calculateDamageToMonster(playerTotalAtk * skStats.mult, m, currentPlayer.element, {
          ignoreDefPct: innateIgnoreDef,
          critRate: playerCritRate,
          critDamage: playerCritDmg
        });
        m.hp = Math.max(0, m.hp - dmg);
        recordMonsterHit(m.id, dmg, isCrit);
        logs.push({
          text: `${isCrit ? '💥暴擊！' : '🏹 '}巧匠施展【連珠散射 (Lv.${skLvl})】，貫穿【${m.name}】造成 ${dmg} 點傷害！`,
          type: 'player',
          dmgRole: isCrit ? 'player_crit' : 'player_normal'
        });
      });
    } else if (sk.id === 'a_s3') {
      const hitIndices = pickUpToNMonsterIndices(currentMonsters, targetIdx, 3);
      hitIndices.forEach(mIdx => {
        const m = currentMonsters[mIdx];
        const { dmg, isCrit } = calculateDamageToMonster(playerTotalAtk * skStats.mult, m, currentPlayer.element, {
          ignoreDefPct: innateIgnoreDef,
          critRate: playerCritRate,
          critDamage: playerCritDmg
        });
        m.hp = Math.max(0, m.hp - dmg);
        recordMonsterHit(m.id, dmg, isCrit);
        m.blindTurns = 2;
        m.blindPct = skStats.blindPct;
        logs.push({
          text: `${isCrit ? '💥暴擊！' : '🕸️ '}巧匠施展【天羅地網陣 (Lv.${skLvl})】，對【${m.name}】造成 ${dmg} 點傷害並致盲 -${Math.round(skStats.blindPct * 100)}% 命中！`,
          type: 'player',
          dmgRole: isCrit ? 'player_crit' : 'player_normal'
        });
      });
    } else if (sk.id === 'm_s1') {
      const targetM = currentMonsters[targetIdx];
      if (targetM) {
        const { dmg, isCounter, isCrit } = calculateDamageToMonster(playerTotalAtk * skStats.mult, targetM, currentPlayer.element, {
          isWarlock: true,
          critRate: playerCritRate,
          critDamage: playerCritDmg
        });
        targetM.hp = Math.max(0, targetM.hp - dmg);
        recordMonsterHit(targetM.id, dmg, isCrit);
        logs.push({
          text: `${isCrit ? '💥暴擊！' : '🔮 '}術士施展【本命靈訣 (Lv.${skLvl})】，轟擊【${targetM.name}】造成 ${dmg} 點五行法傷！`,
          type: 'player',
          dmgRole: isCrit ? 'player_crit' : 'player_normal'
        });
        if (isCounter) {
          currentPlayer.mp = Math.min(playerTotalMaxMp, currentPlayer.mp + 15);
          logs.push({ text: `✨ 【五行靈體】相剋共鳴，返還 +15 MP！`, type: 'sys' });
        }
      }
    } else if (sk.id === 'm_s2') {
      const counteredElem = ELEMENTS[currentPlayer.element]?.counters || '木';
      const hitIndices = pickUpToNMonsterIndices(currentMonsters, targetIdx, 5);
      let anyCountered = false;
      hitIndices.forEach(mIdx => {
        const m = currentMonsters[mIdx];
        const { dmg, isCounter, isCrit } = calculateDamageToMonster(playerTotalAtk * skStats.mult, m, currentPlayer.element, {
          isWarlock: true,
          critRate: playerCritRate,
          critDamage: playerCritDmg
        });
        if (isCounter) anyCountered = true;
        m.hp = Math.max(0, m.hp - dmg);
        recordMonsterHit(m.id, dmg, isCrit);
        m.element = counteredElem;
        m.elemShiftTurns = 2;
        logs.push({
          text: `${isCrit ? '💥暴擊！' : '☯️ '}術士【五行逆轉大陣 (Lv.${skLvl})】轟擊【${m.name}】造成 ${dmg} 點傷害並轉化為【${counteredElem}】屬性！`,
          type: 'player',
          dmgRole: isCrit ? 'player_crit' : 'player_normal'
        });
      });
      if (anyCountered) {
        currentPlayer.mp = Math.min(playerTotalMaxMp, currentPlayer.mp + 15);
        logs.push({ text: `✨ 【五行靈體】相剋共鳴，返還 +15 MP！`, type: 'sys' });
      }
    } else if (sk.id === 'm_s3') {
      const hitIndices = pickUpToNMonsterIndices(currentMonsters, targetIdx, 5);
      let anyCountered = false;
      hitIndices.forEach(mIdx => {
        const m = currentMonsters[mIdx];
        const { dmg, isCounter, isCrit } = calculateDamageToMonster(playerTotalAtk * skStats.mult, m, currentPlayer.element, {
          isWarlock: true,
          critRate: playerCritRate,
          critDamage: playerCritDmg
        });
        if (isCounter) anyCountered = true;
        m.hp = Math.max(0, m.hp - dmg);
        recordMonsterHit(m.id, dmg, isCrit);
        m.burnTurns = 2;
        m.burnDmg = Math.max(10, Math.floor(playerTotalAtk * 0.45));
        logs.push({
          text: `${isCrit ? '💥暴擊！' : '🔥 '}術士【九天焚世咒 (Lv.${skLvl})】天劫轟炸【${m.name}】造成 ${dmg} 點毀滅法傷並附加灼燒！`,
          type: 'player',
          dmgRole: isCrit ? 'player_crit' : 'player_normal'
        });
      });
      if (anyCountered) {
        currentPlayer.mp = Math.min(playerTotalMaxMp, currentPlayer.mp + 15);
        logs.push({ text: `✨ 【五行靈體】相剋共鳴，返還 +15 MP！`, type: 'sys' });
      }
    } else if (sk.id === 'p_s1') {
      const targetM = currentMonsters[targetIdx];
      if (targetM) {
        const { dmg, isCrit } = calculateDamageToMonster(playerTotalAtk * skStats.mult, targetM, currentPlayer.element, {
          critRate: playerCritRate,
          critDamage: playerCritDmg
        });
        targetM.hp = Math.max(0, targetM.hp - dmg);
        recordMonsterHit(targetM.id, dmg, isCrit);
        targetM.poisonTurns = 3;
        targetM.poisonPct = skStats.poisonPct;
        targetM.poisonStacks = Math.min(2, (targetM.poisonStacks || 0) + 1);
        logs.push({
          text: `${isCrit ? '💥暴擊！' : '🧪 '}藥師施展【穿心腐骨散 (Lv.${skLvl})】，對【${targetM.name}】造成 ${dmg} 點毒傷並附加中毒（${targetM.poisonStacks}層毒傷＋削弱 20% 攻擊力）！`,
          type: 'player',
          dmgRole: isCrit ? 'player_crit' : 'player_normal'
        });
      }
    } else if (sk.id === 'p_s2') {
      const hitIndices = pickUpToNMonsterIndices(currentMonsters, targetIdx, 3);
      hitIndices.forEach(mIdx => {
        const m = currentMonsters[mIdx];
        const { dmg, isCrit } = calculateDamageToMonster(playerTotalAtk * skStats.mult, m, currentPlayer.element, {
          critRate: playerCritRate,
          critDamage: playerCritDmg
        });
        m.hp = Math.max(0, m.hp - dmg);
        recordMonsterHit(m.id, dmg, isCrit);
        m.poisonTurns = 3;
        m.poisonPct = skStats.poisonPct;
        m.poisonStacks = Math.min(2, (m.poisonStacks || 0) + 1);
        logs.push({
          text: `${isCrit ? '💥暴擊！' : '☠️ '}藥師施展【五毒瘴氣 (Lv.${skLvl})】，毒霧籠罩【${m.name}】造成 ${dmg} 點傷害並使其陷入中毒！`,
          type: 'player',
          dmgRole: isCrit ? 'player_crit' : 'player_normal'
        });
      });
    } else if (sk.id === 'p_s3') {
      const deadHeroes = updatedRoster.filter(h => activeHeroInstanceIds.includes(h.instanceId) && h.hp <= 0);
      const targetHero = deadHeroes[0];
      if (targetHero) {
        const { effectiveMaxHp } = calculateHeroEffectiveStats(
          targetHero,
          isFengShui,
          null,
          getHeroRowIdx(targetHero.instanceId)
        );
        const intHealBonus = Math.floor((currentPlayer.stats?.int || 0) * 3);
        const revivedHp = Math.max(1, Math.floor(effectiveMaxHp * skStats.reviveHpPct) + intHealBonus);
        updatedRoster = updatedRoster.map(h => (h.instanceId === targetHero.instanceId ? { ...h, hp: Math.min(effectiveMaxHp, revivedHp) } : h));
        recordAllyHeal(targetHero.instanceId, revivedHp);
        currentHeroBuffs[targetHero.instanceId] = {
          surgeTurns: 2,
          surgeAtkPct: skStats.atkBuffPct
        };
        logs.push({
          text: `💊 藥師餵服【九轉還魂丹 (Lv.${skLvl})】，成功復活英雄【${targetHero.name}】（恢復 +${revivedHp} HP）並激發攻擊力 +${Math.round(skStats.atkBuffPct * 100)}%！`,
          type: 'player',
          dmgRole: 'heal'
        });
      }
    } else if (sk.id === 'f_s1') {
      const aliveHeroes = updatedRoster.filter(h => activeHeroInstanceIds.includes(h.instanceId) && h.hp > 0);
      const chosenHero = aliveHeroes[Math.floor(Math.random() * aliveHeroes.length)];
      if (chosenHero) {
        const intBonusPct = ((currentPlayer.stats?.int || 0) * 0.005);
        logs.push({
          text: `☯️ 風水師施展【乾坤借法 (Lv.${skLvl})】，引動天地靈氣令英雄【${chosenHero.name}】立即額外爆發主動技能！`,
          type: 'player'
        });
        updatedRoster = executeSingleHeroAction({
          hInstanceId: chosenHero.instanceId,
          forceSkill: true,
          extraBonusMult: skStats.bonusDmgPct + intBonusPct,
          currentMonsters,
          currentPlayer,
          currentRoster: updatedRoster,
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
      }
    } else if (sk.id === 'f_s2') {
      currentBuffs.baguaTurns = 2;
      currentBuffs.baguaReducePct = skStats.reducePct;
      currentBuffs.baguaReflectPct = skStats.reflectPct;
      logs.push({
        text: `🔯 風水師展開【八卦護身結界 (Lv.${skLvl})】，全隊 2 回合承傷 -${Math.round(skStats.reducePct * 100)}% 並反彈 ${Math.round(skStats.reflectPct * 100)}% 傷害！`,
        type: 'player',
        dmgRole: 'shield'
      });
    } else if (sk.id === 'f_s3') {
      currentMonsters.forEach(m => {
        if (m.hp > 0) {
          const { dmg, isCrit } = calculateDamageToMonster(playerTotalAtk * skStats.mult, m, currentPlayer.element, {
            critRate: playerCritRate,
            critDamage: playerCritDmg
          });
          m.hp = Math.max(0, m.hp - dmg);
          recordMonsterHit(m.id, dmg, isCrit);
          m.vulnTurns = 2;
          m.vulnPct = skStats.vulnPct;
        }
      });
      logs.push({
        text: `🌌 風水師施展【奇門天象變 (Lv.${skLvl})】，引動星象震盪並使全場敵怪陷入「易傷 +${Math.round(skStats.vulnPct * 100)}%」(2回合)！`,
        type: 'player'
      });
    } else {
      if (sk.type === 'heal') {
        const healVal = Math.max(15, Math.floor(playerTotalAtk * skStats.mult));
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
          text: `🌿 少俠施展【${sk.name} (Lv.${skLvl})】，全隊恢復 +${healVal} HP！`,
          type: 'player',
          dmgRole: 'heal'
        });
      } else if (sk.type === 'shield') {
        const shieldGain = Math.max(20, Math.floor(playerTotalMaxHp * 0.25 * (skStats.mult / 1.5)));
        currentBuffs.shield += shieldGain;
        logs.push({
          text: `🛡️ 少俠施展【${sk.name} (Lv.${skLvl})】，獲得 +${shieldGain} 點護盾！`,
          type: 'player',
          dmgRole: 'shield'
        });
      } else if (sk.type === 'aoe') {
        currentMonsters.forEach(m => {
          if (m.hp > 0) {
            const { dmg, isCrit } = calculateDamageToMonster(playerTotalAtk * skStats.mult, m, currentPlayer.element, {
              ignoreDefPct: innateIgnoreDef,
              isWarlock,
              critRate: playerCritRate,
              critDamage: playerCritDmg
            });
            m.hp = Math.max(0, m.hp - dmg);
            recordMonsterHit(m.id, dmg, isCrit);
            logs.push({
              text: `${isCrit ? '💥暴擊！' : '✨ '}少俠施展【${sk.name} (Lv.${skLvl})】，橫掃【${m.name}】造成 ${dmg} 點傷害！`,
              type: 'player',
              dmgRole: isCrit ? 'player_crit' : 'player_normal'
            });
          }
        });
      } else {
        const targetM = currentMonsters[targetIdx];
        if (targetM) {
          const { dmg, isCrit } = calculateDamageToMonster(playerTotalAtk * skStats.mult, targetM, currentPlayer.element, {
            ignoreDefPct: innateIgnoreDef,
            isWarlock,
            critRate: playerCritRate,
            critDamage: playerCritDmg
          });
          targetM.hp = Math.max(0, targetM.hp - dmg);
          recordMonsterHit(targetM.id, dmg, isCrit);
          logs.push({
            text: `${isCrit ? '💥暴擊！' : '⚔️ '}少俠施展【${sk.name} (Lv.${skLvl})】，對【${targetM.name}】造成 ${dmg} 點傷害！`,
            type: 'player',
            dmgRole: isCrit ? 'player_crit' : 'player_normal'
          });
        }
      }
    }
  }

  return updatedRoster;
}
