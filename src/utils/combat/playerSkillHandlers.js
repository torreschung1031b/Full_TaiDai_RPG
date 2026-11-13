import { calculateHeroEffectiveStats, pickUpToNMonsterIndices } from '../statCalculator';
import { getMonsterSpeed, getSpeedAdvantage, calculateDamageToMonster } from './combatFormulas';

function trySpeedFollowUp({
  targetM, effectivePlayerAtk, effectivePlayerSpeed, element,
  critRate, critDamage, extraOpts = {}, followLabel, logs, recordMonsterHit
}) {
  if (!targetM || targetM.hp <= 0) return;
  const { doubleStrikeRate } = getSpeedAdvantage(effectivePlayerSpeed, getMonsterSpeed(targetM));
  if (doubleStrikeRate > 0 && Math.random() < doubleStrikeRate) {
    const { dmg, isCrit } = calculateDamageToMonster(effectivePlayerAtk * 0.50, targetM, element, {
      ...extraOpts,
      critRate,
      critDamage
    });
    targetM.hp = Math.max(0, targetM.hp - dmg);
    recordMonsterHit(targetM.id, dmg, isCrit);
    logs.push({
      text: `⚡ ${followLabel}追擊【${targetM.name}】再造成 ${dmg} 點傷害！`,
      type: 'player',
      dmgRole: isCrit ? 'player_crit' : 'player_normal'
    });
  }
}

function healAllActiveAllies({
  healVal, currentPlayer, updatedRoster, activeHeroInstanceIds,
  playerTotalMaxHp, isFengShui, currentHeroBuffs, getHeroRowIdx, recordAllyHeal
}) {
  currentPlayer.hp = Math.min(playerTotalMaxHp, currentPlayer.hp + healVal);
  recordAllyHeal('PLAYER', healVal);
  return updatedRoster.map(ally => {
    if (!activeHeroInstanceIds.includes(ally.instanceId) || ally.hp <= 0) return ally;
    const { effectiveMaxHp } = calculateHeroEffectiveStats(
      ally, isFengShui, currentHeroBuffs[ally.instanceId], getHeroRowIdx(ally.instanceId)
    );
    recordAllyHeal(ally.instanceId, healVal);
    return { ...ally, hp: Math.min(effectiveMaxHp, ally.hp + healVal) };
  });
}

export const PLAYER_SKILL_HANDLERS = {
  // ==================== 【猛將】4 招 ====================
  w_s1: (ctx) => {
    const targetM = ctx.currentMonsters[ctx.targetIdx];
    if (!targetM) return ctx.updatedRoster;
    const { dmg, isCrit } = calculateDamageToMonster(ctx.effectivePlayerAtk * ctx.skStats.mult, targetM, ctx.currentPlayer.element, {
      critRate: ctx.playerCritRate, critDamage: ctx.playerCritDmg
    });
    targetM.hp = Math.max(0, targetM.hp - dmg);
    ctx.recordMonsterHit(targetM.id, dmg, isCrit);
    const gainRage = ctx.skStats.rageGain || 25;
    ctx.currentPlayer.rage = Math.min(100, (ctx.currentPlayer.rage || 0) + gainRage);
    ctx.logs.push({
      text: `${isCrit ? '💥暴擊！' : '⚔️ '}猛將施展【${ctx.sk.name} (Lv.${ctx.skLvl})】劈斬【${targetM.name}】造成 ${dmg} 點物理傷害，並累積 +${gainRage} 怒氣（目前 ${ctx.currentPlayer.rage}/100）！`,
      type: 'player', dmgRole: isCrit ? 'player_crit' : 'player_normal'
    });
    trySpeedFollowUp({
      targetM, effectivePlayerAtk: ctx.effectivePlayerAtk, effectivePlayerSpeed: ctx.effectivePlayerSpeed,
      element: ctx.currentPlayer.element, critRate: ctx.playerCritRate, critDamage: ctx.playerCritDmg,
      followLabel: '疾速連斬！猛將', logs: ctx.logs, recordMonsterHit: ctx.recordMonsterHit
    });
    return ctx.updatedRoster;
  },

  w_s2: (ctx) => {
    const conShieldBonus = Math.floor((ctx.currentPlayer.stats?.con || 10) * 3);
    const shieldGain = Math.floor(ctx.playerTotalMaxHp * (ctx.skStats.shieldPct || 0.22)) + conShieldBonus;
    ctx.currentBuffs.shield = (ctx.currentBuffs.shield || 0) + shieldGain;
    ctx.currentBuffs.guardTurns = 2;
    ctx.currentBuffs.guardSharePct = ctx.skStats.guardSharePct || 0.50;
    ctx.currentBuffs.guardReducePct = ctx.skStats.dmgReducePct || 0.25;
    ctx.currentBuffs.tauntTurns = 2;
    ctx.logs.push({
      text: `🛡️ 猛將施展【${ctx.sk.name} (Lv.${ctx.skLvl})】，為全隊張開 +${shieldGain} 點護盾，並開啟 2 回合援護姿態（減傷 ${Math.round(ctx.currentBuffs.guardReducePct * 100)}%、替隊友分擔 ${Math.round(ctx.currentBuffs.guardSharePct * 100)}% 所受傷害）！`,
      type: 'player', dmgRole: 'shield'
    });
    return ctx.updatedRoster;
  },

  w_s3: (ctx) => {
    const targetM = ctx.currentMonsters[ctx.targetIdx];
    if (!targetM) return ctx.updatedRoster;
    const { dmg, isCrit } = calculateDamageToMonster(ctx.effectivePlayerAtk * ctx.skStats.mult, targetM, ctx.currentPlayer.element, {
      critRate: ctx.playerCritRate, critDamage: ctx.playerCritDmg
    });
    targetM.hp = Math.max(0, targetM.hp - dmg);
    ctx.recordMonsterHit(targetM.id, dmg, isCrit);
    const healAmt = Math.max(10, Math.floor(dmg * (ctx.skStats.lifestealPct || 0.45)));
    ctx.currentPlayer.hp = Math.min(ctx.playerTotalMaxHp, ctx.currentPlayer.hp + healAmt);
    ctx.recordAllyHeal('PLAYER', healAmt);
    ctx.logs.push({
      text: `${isCrit ? '💥暴擊！' : '🩸 '}猛將施展【${ctx.sk.name} (Lv.${ctx.skLvl})】，重創【${targetM.name}】造成 ${dmg} 點傷害，並吸取氣血恢復 +${healAmt} HP！`,
      type: 'player', dmgRole: isCrit ? 'player_crit' : 'player_normal'
    });
    return ctx.updatedRoster;
  },

  w_s4: (ctx) => {
    const hitIndices = pickUpToNMonsterIndices(ctx.currentMonsters, ctx.targetIdx, 5);
    hitIndices.forEach(mIdx => {
      const m = ctx.currentMonsters[mIdx];
      const { dmg, isCrit } = calculateDamageToMonster(ctx.effectivePlayerAtk * ctx.skStats.mult, m, ctx.currentPlayer.element, {
        critRate: ctx.playerCritRate, critDamage: ctx.playerCritDmg
      });
      m.hp = Math.max(0, m.hp - dmg);
      ctx.recordMonsterHit(m.id, dmg, isCrit);
      m.armorBreakTurns = 2;
      m.armorBreakPct = ctx.skStats.breakPct || 0.20;
      m.weakenTurns = 2;
      m.weakenPct = ctx.skStats.weakenPct || 0.15;
    });
    ctx.logs.push({
      text: `🌋 猛將施展【${ctx.sk.name} (Lv.${ctx.skLvl})】橫掃 ${hitIndices.length} 名敵怪，使其全體陷入破甲降防與虛弱降攻 (2回合)！`,
      type: 'player', dmgRole: 'player_normal'
    });
    return ctx.updatedRoster;
  },

  // ==================== 【巧匠】4 招 ====================
  a_s1: (ctx) => {
    const targetM = ctx.currentMonsters[ctx.targetIdx];
    if (!targetM) return ctx.updatedRoster;
    const { dmg, isCrit } = calculateDamageToMonster(ctx.effectivePlayerAtk * ctx.skStats.mult, targetM, ctx.currentPlayer.element, {
      ignoreDefPct: ctx.innateIgnoreDef, critRate: ctx.playerCritRate, critDamage: ctx.playerCritDmg
    });
    targetM.hp = Math.max(0, targetM.hp - dmg);
    ctx.recordMonsterHit(targetM.id, dmg, isCrit);
    const gainAmmo = ctx.skStats.ammoGain || 2;
    ctx.currentPlayer.ammo = Math.min(ctx.currentPlayer.maxAmmo, (ctx.currentPlayer.ammo || 0) + gainAmmo);
    ctx.logs.push({
      text: `${isCrit ? '💥暴擊！' : '🏹 '}巧匠施展【${ctx.sk.name} (Lv.${ctx.skLvl})】射擊【${targetM.name}】造成 ${dmg} 點物理傷害，並裝填 +${gainAmmo} 彈藥（目前 ${ctx.currentPlayer.ammo}/${ctx.currentPlayer.maxAmmo}）！`,
      type: 'player', dmgRole: isCrit ? 'player_crit' : 'player_normal'
    });
    trySpeedFollowUp({
      targetM, effectivePlayerAtk: ctx.effectivePlayerAtk, effectivePlayerSpeed: ctx.effectivePlayerSpeed,
      element: ctx.currentPlayer.element, critRate: ctx.playerCritRate, critDamage: ctx.playerCritDmg,
      extraOpts: { ignoreDefPct: ctx.innateIgnoreDef }, followLabel: '疾風連射！巧匠',
      logs: ctx.logs, recordMonsterHit: ctx.recordMonsterHit
    });
    return ctx.updatedRoster;
  },

  a_s2: (ctx) => {
    const hitIndices = pickUpToNMonsterIndices(ctx.currentMonsters, ctx.targetIdx, 3);
    const bleedDmg = Math.max(8, Math.floor(ctx.effectivePlayerAtk * (ctx.skStats.bleedMult || 0.40)));
    hitIndices.forEach(mIdx => {
      const m = ctx.currentMonsters[mIdx];
      const { dmg, isCrit } = calculateDamageToMonster(ctx.effectivePlayerAtk * ctx.skStats.mult, m, ctx.currentPlayer.element, {
        ignoreDefPct: ctx.innateIgnoreDef, critRate: ctx.playerCritRate, critDamage: ctx.playerCritDmg
      });
      m.hp = Math.max(0, m.hp - dmg);
      ctx.recordMonsterHit(m.id, dmg, isCrit);
      m.bleedTurns = 2;
      m.bleedDmg = Math.max(m.bleedDmg || 0, bleedDmg);
    });
    ctx.logs.push({
      text: `🩸 巧匠施展【${ctx.sk.name} (Lv.${ctx.skLvl})】，箭雨割裂 ${hitIndices.length} 名敵怪並附加不可疊加「流血」（每回合 ${bleedDmg} 點流血傷害，持續 2 回合）！`,
      type: 'player', dmgRole: 'player_normal'
    });
    return ctx.updatedRoster;
  },

  a_s3: (ctx) => {
    const hitIndices = pickUpToNMonsterIndices(ctx.currentMonsters, ctx.targetIdx, 5);
    const vulnPct = ctx.skStats.vulnPct || 0.24;
    hitIndices.forEach(mIdx => {
      const m = ctx.currentMonsters[mIdx];
      m.vulnTurns = 2;
      m.vulnPct = Math.max(m.vulnPct || 0, vulnPct);
    });
    ctx.logs.push({
      text: `🎯 巧匠施展【${ctx.sk.name} (Lv.${ctx.skLvl})】，為最多 ${hitIndices.length} 名敵怪純施加不可疊加「易傷 +${Math.round(vulnPct * 100)}%」（2 回合內全隊對其傷害大幅提升）！`,
      type: 'player', dmgRole: 'sys'
    });
    return ctx.updatedRoster;
  },

  a_s4: (ctx) => {
    const hitIndices = pickUpToNMonsterIndices(ctx.currentMonsters, ctx.targetIdx, 5);
    let totalDmg = 0;
    let anyCrit = false;
    hitIndices.forEach(mIdx => {
      const m = ctx.currentMonsters[mIdx];
      const { dmg, isCrit } = calculateDamageToMonster(ctx.effectivePlayerAtk * ctx.skStats.mult, m, ctx.currentPlayer.element, {
        ignoreDefPct: ctx.skStats.ignoreDefPct || 0.35, critRate: ctx.playerCritRate, critDamage: ctx.playerCritDmg
      });
      m.hp = Math.max(0, m.hp - dmg);
      ctx.recordMonsterHit(m.id, dmg, isCrit);
      totalDmg += dmg;
      if (isCrit) anyCrit = true;
    });
    ctx.logs.push({
      text: `${anyCrit ? '💥暴擊！' : '☄️ '}巧匠施展【${ctx.sk.name} (Lv.${ctx.skLvl})】，萬箭齊發貫穿 ${hitIndices.length} 名敵怪，累計造成 ${totalDmg} 點穿甲爆發傷害！`,
      type: 'player', dmgRole: anyCrit ? 'player_crit' : 'player_normal'
    });
    return ctx.updatedRoster;
  },

  // ==================== 【術士】4 招 ====================
  m_s1: (ctx) => {
    const targetM = ctx.currentMonsters[ctx.targetIdx];
    if (!targetM) return ctx.updatedRoster;
    const { dmg, isCounter, isCrit } = calculateDamageToMonster(ctx.effectivePlayerAtk * ctx.skStats.mult, targetM, ctx.currentPlayer.element, {
      isWarlock: true, critRate: ctx.playerCritRate, critDamage: ctx.playerCritDmg
    });
    targetM.hp = Math.max(0, targetM.hp - dmg);
    ctx.recordMonsterHit(targetM.id, dmg, isCrit);
    const gainMp = (ctx.skStats.mpGain || 12) + (isCounter ? 10 : 0);
    ctx.currentPlayer.mp = Math.min(ctx.playerTotalMaxMp, (ctx.currentPlayer.mp || 0) + gainMp);
    ctx.logs.push({
      text: `${isCrit ? '💥暴擊！' : '🔮 '}術士施展【${ctx.sk.name} (Lv.${ctx.skLvl})】轟擊【${targetM.name}】造成 ${dmg} 點五行法傷，並回復 +${gainMp} MP${isCounter ? '（含五行相剋共鳴）' : ''}！`,
      type: 'player', dmgRole: isCrit ? 'player_crit' : 'player_normal'
    });
    trySpeedFollowUp({
      targetM, effectivePlayerAtk: ctx.effectivePlayerAtk, effectivePlayerSpeed: ctx.effectivePlayerSpeed,
      element: ctx.currentPlayer.element, critRate: ctx.playerCritRate, critDamage: ctx.playerCritDmg,
      extraOpts: { isWarlock: true }, followLabel: '靈訣連發！術士',
      logs: ctx.logs, recordMonsterHit: ctx.recordMonsterHit
    });
    return ctx.updatedRoster;
  },

  m_s2: (ctx) => {
    const hitIndices = pickUpToNMonsterIndices(ctx.currentMonsters, ctx.targetIdx, 3);
    const burnDmg = Math.max(10, Math.floor(ctx.effectivePlayerAtk * (ctx.skStats.burnMult || 0.42)));
    hitIndices.forEach(mIdx => {
      const m = ctx.currentMonsters[mIdx];
      const { dmg, isCrit } = calculateDamageToMonster(ctx.effectivePlayerAtk * ctx.skStats.mult, m, ctx.currentPlayer.element, {
        isWarlock: true, critRate: ctx.playerCritRate, critDamage: ctx.playerCritDmg
      });
      m.hp = Math.max(0, m.hp - dmg);
      ctx.recordMonsterHit(m.id, dmg, isCrit);
      m.burnTurns = 2;
      m.burnDmg = Math.max(m.burnDmg || 0, burnDmg);
    });
    ctx.logs.push({
      text: `🔥 術士施展【${ctx.sk.name} (Lv.${ctx.skLvl})】，業火灼燒 ${hitIndices.length} 名敵怪並附加不可疊加「灼燒」（每回合 ${burnDmg} 點烈焰法傷，持續 2 回合）！`,
      type: 'player', dmgRole: 'player_normal'
    });
    return ctx.updatedRoster;
  },

  m_s3: (ctx) => {
    const hitIndices = pickUpToNMonsterIndices(ctx.currentMonsters, ctx.targetIdx, 5);
    const blindPct = ctx.skStats.blindPct || 0.32;
    hitIndices.forEach(mIdx => {
      const m = ctx.currentMonsters[mIdx];
      m.blindTurns = 2;
      m.blindPct = Math.max(m.blindPct || 0, blindPct);
    });
    ctx.logs.push({
      text: `🌫️ 術士施展【${ctx.sk.name} (Lv.${ctx.skLvl})】，召喚迷霧為最多 ${hitIndices.length} 名敵怪純施加不可疊加「致盲 -${Math.round(blindPct * 100)}% 命中」（2 回合）！`,
      type: 'player', dmgRole: 'sys'
    });
    return ctx.updatedRoster;
  },

  m_s4: (ctx) => {
    const hitIndices = pickUpToNMonsterIndices(ctx.currentMonsters, ctx.targetIdx, 5);
    let totalDmg = 0;
    let anyCrit = false;
    hitIndices.forEach(mIdx => {
      const m = ctx.currentMonsters[mIdx];
      const { dmg, isCrit } = calculateDamageToMonster(ctx.effectivePlayerAtk * ctx.skStats.mult, m, ctx.currentPlayer.element, {
        isWarlock: true, critRate: ctx.playerCritRate, critDamage: ctx.playerCritDmg
      });
      m.hp = Math.max(0, m.hp - dmg);
      ctx.recordMonsterHit(m.id, dmg, isCrit);
      totalDmg += dmg;
      if (isCrit) anyCrit = true;
    });
    ctx.logs.push({
      text: `${anyCrit ? '💥暴擊！' : '⚡ '}術士施展【${ctx.sk.name} (Lv.${ctx.skLvl})】，引動九天神雷劈擊 ${hitIndices.length} 名敵怪，累計造成 ${totalDmg} 點毀滅法傷！`,
      type: 'player', dmgRole: anyCrit ? 'player_crit' : 'player_normal'
    });
    return ctx.updatedRoster;
  },

  // ==================== 【藥師】4 招 ====================
  p_s1: (ctx) => {
    const targetM = ctx.currentMonsters[ctx.targetIdx];
    if (!targetM) return ctx.updatedRoster;
    const { dmg, isCrit } = calculateDamageToMonster(ctx.effectivePlayerAtk * ctx.skStats.mult, targetM, ctx.currentPlayer.element, {
      critRate: ctx.playerCritRate, critDamage: ctx.playerCritDmg
    });
    targetM.hp = Math.max(0, targetM.hp - dmg);
    ctx.recordMonsterHit(targetM.id, dmg, isCrit);
    const gainMp = ctx.skStats.mpGain || 12;
    ctx.currentPlayer.mp = Math.min(ctx.playerTotalMaxMp, (ctx.currentPlayer.mp || 0) + gainMp);
    ctx.logs.push({
      text: `${isCrit ? '💥暴擊！' : '🌿 '}藥師施展【${ctx.sk.name} (Lv.${ctx.skLvl})】刺擊【${targetM.name}】造成 ${dmg} 點法傷，並回復 +${gainMp} MP！`,
      type: 'player', dmgRole: isCrit ? 'player_crit' : 'player_normal'
    });
    return ctx.updatedRoster;
  },

  p_s2: (ctx) => {
    const intHealBonus = Math.floor((ctx.currentPlayer.stats?.int || 10) * 3.5);
    const healVal = Math.max(35, Math.floor(ctx.effectivePlayerAtk * ctx.skStats.mult) + intHealBonus);

    let lowestUnit = { type: 'PLAYER', ratio: ctx.currentPlayer.hp / Math.max(1, ctx.playerTotalMaxHp), name: ctx.currentPlayer.name };
    ctx.updatedRoster.forEach(ally => {
      if (!ctx.activeHeroInstanceIds.includes(ally.instanceId) || ally.hp <= 0) return;
      const { effectiveMaxHp } = calculateHeroEffectiveStats(
        ally, ctx.isFengShui, ctx.currentHeroBuffs[ally.instanceId], ctx.getHeroRowIdx(ally.instanceId)
      );
      const ratio = ally.hp / Math.max(1, effectiveMaxHp);
      if (ratio < lowestUnit.ratio) {
        lowestUnit = { type: 'HERO', instanceId: ally.instanceId, ratio, name: ally.name };
      }
    });

    if (lowestUnit.type === 'PLAYER') {
      ctx.currentPlayer.hp = Math.min(ctx.playerTotalMaxHp, ctx.currentPlayer.hp + healVal);
      ctx.recordAllyHeal('PLAYER', healVal);
    } else {
      ctx.updatedRoster = ctx.updatedRoster.map(ally => {
        if (ally.instanceId !== lowestUnit.instanceId) return ally;
        const { effectiveMaxHp } = calculateHeroEffectiveStats(
          ally, ctx.isFengShui, ctx.currentHeroBuffs[ally.instanceId], ctx.getHeroRowIdx(ally.instanceId)
        );
        ctx.recordAllyHeal(ally.instanceId, healVal);
        return { ...ally, hp: Math.min(effectiveMaxHp, ally.hp + healVal) };
      });
    }

    ctx.logs.push({
      text: `💖 藥師施展【${ctx.sk.name} (Lv.${ctx.skLvl})】，精準急救氣血最低的【${lowestUnit.name}】，強力恢復 +${healVal} HP！`,
      type: 'player', dmgRole: 'heal'
    });
    return ctx.updatedRoster;
  },

  p_s3: (ctx) => {
    const hitIndices = pickUpToNMonsterIndices(ctx.currentMonsters, ctx.targetIdx, 3);
    hitIndices.forEach(mIdx => {
      const m = ctx.currentMonsters[mIdx];
      const { dmg, isCrit } = calculateDamageToMonster(ctx.effectivePlayerAtk * ctx.skStats.mult, m, ctx.currentPlayer.element, {
        critRate: ctx.playerCritRate, critDamage: ctx.playerCritDmg
      });
      m.hp = Math.max(0, m.hp - dmg);
      ctx.recordMonsterHit(m.id, dmg, isCrit);
      m.poisonTurns = 3;
      m.poisonPct = ctx.skStats.poisonPct || 0.08;
      m.poisonStacks = Math.min(2, (m.poisonStacks || 0) + 1);
    });
    ctx.logs.push({
      text: `☠️ 藥師施展【${ctx.sk.name} (Lv.${ctx.skLvl})】，毒霧籠罩 ${hitIndices.length} 名敵怪並注入劇毒（持續 3 回合百分比真傷＋削弱 20% 攻擊力）！`,
      type: 'player', dmgRole: 'player_normal'
    });
    return ctx.updatedRoster;
  },

  p_s4: (ctx) => {
    const intBonus = Math.floor((ctx.currentPlayer.stats?.int || 10) * 1.5);
    const healVal = Math.max(20, Math.floor(ctx.effectivePlayerAtk * ctx.skStats.mult) + intBonus);
    const regenVal = Math.max(12, Math.floor(ctx.effectivePlayerAtk * (ctx.skStats.regenMult || 0.45)));

    ctx.updatedRoster = healAllActiveAllies({
      healVal, currentPlayer: ctx.currentPlayer, updatedRoster: ctx.updatedRoster,
      activeHeroInstanceIds: ctx.activeHeroInstanceIds, playerTotalMaxHp: ctx.playerTotalMaxHp,
      isFengShui: ctx.isFengShui, currentHeroBuffs: ctx.currentHeroBuffs,
      getHeroRowIdx: ctx.getHeroRowIdx, recordAllyHeal: ctx.recordAllyHeal
    });
    ctx.currentBuffs.teamRegenTurns = 2;
    ctx.currentBuffs.teamRegenVal = regenVal;

    ctx.logs.push({
      text: `🌧️ 藥師施展【${ctx.sk.name} (Lv.${ctx.skLvl})】，降下甘霖為全隊恢復 +${healVal} HP，並附加 2 回合「生機」（每回合全隊自動回復 +${regenVal} HP）！`,
      type: 'player', dmgRole: 'heal'
    });
    return ctx.updatedRoster;
  },

  // ==================== 【風水師】4 招 ====================
  f_s1: (ctx) => {
    const targetM = ctx.currentMonsters[ctx.targetIdx];
    if (!targetM) return ctx.updatedRoster;
    const { dmg, isCrit } = calculateDamageToMonster(ctx.effectivePlayerAtk * ctx.skStats.mult, targetM, ctx.currentPlayer.element, {
      critRate: ctx.playerCritRate, critDamage: ctx.playerCritDmg
    });
    targetM.hp = Math.max(0, targetM.hp - dmg);
    ctx.recordMonsterHit(targetM.id, dmg, isCrit);
    const gainMp = ctx.skStats.mpGain || 12;
    ctx.currentPlayer.mp = Math.min(ctx.playerTotalMaxMp, (ctx.currentPlayer.mp || 0) + gainMp);
    ctx.logs.push({
      text: `${isCrit ? '💥暴擊！' : '🧿 '}風水師施展【${ctx.sk.name} (Lv.${ctx.skLvl})】符擊【${targetM.name}】造成 ${dmg} 點法傷，並回復 +${gainMp} MP！`,
      type: 'player', dmgRole: isCrit ? 'player_crit' : 'player_normal'
    });
    return ctx.updatedRoster;
  },

  f_s2: (ctx) => {
    ctx.currentBuffs.windBuffTurns = 2;
    ctx.currentBuffs.windAtkPct = ctx.skStats.atkBuffPct || 0.18;
    ctx.currentBuffs.windSpeedBonus = ctx.skStats.speedBonus || 12;
    ctx.currentBuffs.windCritPct = ctx.skStats.critBonusPct || 0.10;
    ctx.logs.push({
      text: `🌪️ 風水師施展【${ctx.sk.name} (Lv.${ctx.skLvl})】，為全隊加持 2 回合「神行奮進」：全體攻擊 +${Math.round(ctx.currentBuffs.windAtkPct * 100)}%、速度 +${ctx.currentBuffs.windSpeedBonus}、暴擊率 +${Math.round(ctx.currentBuffs.windCritPct * 100)}%！`,
      type: 'player', dmgRole: 'shield'
    });
    return ctx.updatedRoster;
  },

  f_s3: (ctx) => {
    ctx.currentBuffs.baguaTurns = 2;
    ctx.currentBuffs.baguaReducePct = ctx.skStats.reducePct || 0.25;
    ctx.currentBuffs.baguaReflectPct = ctx.skStats.reflectPct || 0.20;
    ctx.currentBuffs.teamRegenTurns = Math.max(ctx.currentBuffs.teamRegenTurns || 0, 2);
    ctx.currentBuffs.teamRegenVal = Math.max(ctx.currentBuffs.teamRegenVal || 0, Math.max(15, Math.floor(ctx.effectivePlayerAtk * 0.40)));
    ctx.logs.push({
      text: `🔯 風水師展開【${ctx.sk.name} (Lv.${ctx.skLvl})】，全隊 2 回合承傷 -${Math.round(ctx.currentBuffs.baguaReducePct * 100)}%、反彈 ${Math.round(ctx.currentBuffs.baguaReflectPct * 100)}% 傷害並每回合自動回血！`,
      type: 'player', dmgRole: 'shield'
    });
    return ctx.updatedRoster;
  },

  f_s4: (ctx) => {
    ctx.currentBuffs.tianjiTurns = 3;
    ctx.currentBuffs.tianjiSkillBoostPct = ctx.skStats.heroSkillBoostPct || 0.35;
    ctx.currentBuffs.tianjiDmgBoostPct = ctx.skStats.heroDmgBoostPct || 0.20;
    ctx.logs.push({
      text: `🌌 風水師開啟終極奧義【${ctx.sk.name} (Lv.${ctx.skLvl})】！3 回合內全體英雄主動技能發動率大幅提升 +${Math.round(ctx.currentBuffs.tianjiSkillBoostPct * 100)}% 且全傷害 +${Math.round(ctx.currentBuffs.tianjiDmgBoostPct * 100)}%！`,
      type: 'player', dmgRole: 'shield'
    });
    return ctx.updatedRoster;
  }
};
