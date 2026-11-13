import { getElementMultiplier } from '../statCalculator';

/**
 * 取得怪物有效速度（相容舊存檔無 speed 欄位之怪物）
 */
export function getMonsterSpeed(m) {
  if (!m) return 10;
  if (typeof m.speed === 'number' && m.speed > 0) return m.speed;
  return Math.max(6, Math.floor(8 + ((m.atk || 10) * 0.14)));
}

/**
 * 計算速度差帶來的閃避率與普攻連擊率
 * - 每領先 5 點速度：+1.5% 閃避率（上限 25%）、+2% 連擊率（上限 30%）
 */
export function getSpeedAdvantage(actorSpeed = 10, targetSpeed = 10) {
  const diff = Math.max(0, actorSpeed - targetSpeed);
  const steps = Math.floor(diff / 5);
  const evasionRate = Math.min(0.25, steps * 0.015);
  const doubleStrikeRate = Math.min(0.30, steps * 0.02);
  return { diff, evasionRate, doubleStrikeRate };
}

/**
 * 取得各歷練區域解鎖「快速掃蕩」所需等級
 */
export function getZoneSweepReqLevel(zoneIdx = 0) {
  return (zoneIdx * 4) + 3;
}

/**
 * 依據主角職業回傳屬性成長係數與主屬性公式
 */
export function getPlayerStatScaling(job) {
  if (job === '猛將') {
    return {
      conHp: 24,
      conDef: 2,
      primaryLabel: '力量 (STR × 3.2)',
      calcStatAtk: (stats) => Math.floor((stats?.str || 0) * 3.2)
    };
  }
  if (job === '巧匠') {
    return {
      conHp: 16,
      conDef: 1,
      primaryLabel: '敏捷 (AGI × 2.2) ＋ 力量 (STR × 1.6)',
      calcStatAtk: (stats) => Math.floor(((stats?.agi || 0) * 2.2) + ((stats?.str || 0) * 1.6))
    };
  }
  if (job === '術士') {
    return {
      conHp: 16,
      conDef: 1,
      primaryLabel: '智力 (INT × 3.5)',
      calcStatAtk: (stats) => Math.floor((stats?.int || 0) * 3.5)
    };
  }
  return {
    conHp: 16,
    conDef: 1,
    primaryLabel: '智力 (INT × 3.2)',
    calcStatAtk: (stats) => Math.floor((stats?.int || 0) * 3.2)
  };
}

/**
 * 取得技能的解鎖等級門檻與冷卻回合數（CD）
 */
export function getSkillMeta(skill, skillIdx) {
  const unlockLevel = skill?.unlockLevel ?? (skillIdx === 0 ? 1 : skillIdx * 5);
  const cooldown = skill?.cd ?? (skillIdx === 0 ? 0 : skillIdx === 1 ? 2 : 4);
  return { unlockLevel, cooldown };
}

/**
 * 計算主角暴擊率與暴擊倍率
 */
export function getPlayerCritProfile(player) {
  const agi = player.stats?.agi || 10;
  const jobBonus = player.job === '巧匠' ? 0.10 : player.job === '風水師' ? 0.05 : 0;
  const critRate = Math.min(0.65, 0.10 + (agi * 0.004) + jobBonus);
  const critDamage = player.job === '巧匠' ? 1.75 : 1.65;
  return { critRate, critDamage };
}

/**
 * 計算英雄暴擊率與暴擊倍率（含同名合成星級加成）
 */
export function getHeroCritProfile(hero) {
  const agi = hero.stats?.agi || 4;
  const fusionLevel = Math.min(5, hero.fusionLevel || 0);
  const jobBonus = hero.heroClass === '巧匠' ? 0.08 : 0;
  const critRate = Math.min(0.65, 0.08 + (agi * 0.0035) + jobBonus + (fusionLevel * 0.02));
  const critDamage = 1.60 + (fusionLevel * 0.04);
  return { critRate, critDamage };
}

/**
 * 計算我方對單體怪物造成的最終傷害
 */
export function calculateDamageToMonster(rawAtk, monster, attElem, options = {}) {
  const {
    ignoreDefPct = 0,
    isWarlock = false,
    extraElemPct = 0,
    critRate = 0.10,
    critDamage = 1.60,
    forceCrit = false
  } = options;

  const isCrit = forceCrit || (Math.random() < critRate);
  const appliedCritMult = isCrit ? critDamage : 1.0;

  const totalIgnoreDef = Math.min(
    0.95,
    ignoreDefPct + (monster.armorBreakTurns > 0 ? (monster.armorBreakPct || 0) : 0)
  );
  const effectiveMonsterDef = Math.floor(monster.def * (1 - totalIgnoreDef));

  let em = getElementMultiplier(attElem, monster.element, isWarlock);
  if (em > 1.0 && extraElemPct > 0) em += extraElemPct;

  const vulnMult = monster.vulnTurns > 0 ? (1 + (monster.vulnPct || 0)) : 1.0;
  const baseDmg = Math.max(5, Math.floor((rawAtk * appliedCritMult - effectiveMonsterDef) * em * vulnMult));
  return { dmg: baseDmg, isCounter: em > 1.0, isCrit };
}
