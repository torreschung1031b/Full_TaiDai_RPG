import { getElementMultiplier } from '../statCalculator';

export function getMonsterSpeed(m) {
  if (!m) return 10;
  if (typeof m.speed === 'number' && m.speed > 0) return m.speed;
  return Math.max(6, Math.floor(8 + ((m.atk || 10) * 0.14)));
}

export function getSpeedAdvantage(actorSpeed = 10, targetSpeed = 10) {
  const diff = Math.max(0, actorSpeed - targetSpeed);
  const steps = Math.floor(diff / 5);
  const evasionRate = Math.min(0.25, steps * 0.015);
  const doubleStrikeRate = Math.min(0.30, steps * 0.02);
  return { diff, evasionRate, doubleStrikeRate };
}

export function getZoneSweepReqLevel(zoneIdx = 0) {
  return (zoneIdx * 4) + 3;
}

/**
 * 計算野外怪物等級：依歷練區域索引與階級（普通/精英/首領）推算
 */
export function calculateMonsterLevel(zoneIndex = 0, isElite = false, isBoss = false) {
  const z = Math.max(0, Number(zoneIndex) || 0);
  const base = 1 + (z * 6) + Math.floor(Math.random() * 3);
  const rankBonus = isBoss ? 4 : isElite ? 2 : 0;
  return Math.max(1, base + rankBonus);
}

/**
 * 取得怪群平均等級（用於等級差經驗衰減與掉落品質計算）
 */
export function getAverageMonsterLevel(monsters = [], fallbackZoneIndex = 0) {
  if (!Array.isArray(monsters) || monsters.length === 0) {
    return 2 + (Math.max(0, fallbackZoneIndex) * 6);
  }
  const sum = monsters.reduce((acc, m) => {
    const lv = typeof m.level === 'number' && m.level > 0
      ? m.level
      : calculateMonsterLevel(fallbackZoneIndex, Boolean(m.isElite), Boolean(m.isBoss));
    return acc + lv;
  }, 0);
  return Math.max(1, Math.round(sum / monsters.length));
}

/**
 * 等級差經驗衰減曲線（少俠與每位出戰英雄獨立計算）
 * deltaLevel = unitLevel - monsterAvgLevel
 */
export function getLevelDiffExpMultiplier(unitLevel = 1, monsterAvgLevel = 1) {
  const delta = (Number(unitLevel) || 1) - (Number(monsterAvgLevel) || 1);

  if (delta <= -3) {
    return { multiplier: 1.15, delta, label: '🔥 越級激勵 115%' };
  }
  if (delta <= 2) {
    return { multiplier: 1.0, delta, label: '✨ 適齡滿額 100%' };
  }
  if (delta <= 4) {
    return { multiplier: 0.75, delta, label: '📉 等級壓制 75%' };
  }
  if (delta <= 6) {
    return { multiplier: 0.45, delta, label: '📉 等級壓制 45%' };
  }
  if (delta <= 9) {
    return { multiplier: 0.20, delta, label: '⚠️ 嚴重壓制 20%' };
  }
  return { multiplier: 0.05, delta, label: '🚫 碾壓衰減 5%' };
}

/**
 * 野外搜敵與快速掃蕩掉落觸發機率（隨怪物平均等級提升）
 */
export function getWildDropRates(monsterAvgLevel = 1) {
  const lv = Math.max(1, Number(monsterAvgLevel) || 1);
  return {
    equipRate: Math.min(0.55, 0.22 + (lv * 0.008)),
    skillRate: Math.min(0.35, 0.10 + (lv * 0.006)),
    heroRate: Math.min(0.25, 0.06 + (lv * 0.0045)),
    stoneRate: Math.min(0.35, 0.15 + (lv * 0.004))
  };
}

/**
 * 野外搜敵與快速掃蕩星級抽取（嚴格限定 1★～3★，隨怪物等級提高 2★/3★ 權重）
 */
export function rollWildDropStar(monsterAvgLevel = 1) {
  const lv = Math.max(1, Number(monsterAvgLevel) || 1);
  let w1 = 85;
  let w2 = 15;
  let w3 = 0;

  if (lv >= 36) {
    w1 = 10; w2 = 40; w3 = 50;
  } else if (lv >= 25) {
    w1 = 20; w2 = 45; w3 = 35;
  } else if (lv >= 15) {
    w1 = 35; w2 = 45; w3 = 20;
  } else if (lv >= 7) {
    w1 = 60; w2 = 32; w3 = 8;
  }

  const roll = Math.random() * 100;
  if (roll < w1) return 1;
  if (roll < w1 + w2) return 2;
  return 3;
}

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
 * 取得技能的等級門檻、前置技能 Lv.5 門檻與冷卻回合數（CD）
 */
export function getSkillMeta(skill, skillIdx) {
  const defaultUnlock = skillIdx <= 1 ? 1 : skillIdx === 2 ? 5 : 10;
  const defaultPrevReq = skillIdx <= 1 ? 0 : 5;
  const defaultCd = skillIdx === 0 ? 0 : skillIdx === 1 ? 2 : skillIdx === 2 ? 3 : 4;

  const unlockLevel = skill?.unlockLevel ?? defaultUnlock;
  const reqPrevSkillLevel = skill?.reqPrevSkillLevel ?? defaultPrevReq;
  const cooldown = skill?.cd ?? defaultCd;
  return { unlockLevel, reqPrevSkillLevel, cooldown };
}

export function getPlayerCritProfile(player) {
  const agi = player.stats?.agi || 10;
  const jobBonus = player.job === '巧匠' ? 0.10 : player.job === '風水師' ? 0.05 : 0;
  const critRate = Math.min(0.65, 0.10 + (agi * 0.004) + jobBonus);
  const critDamage = player.job === '巧匠' ? 1.75 : 1.65;
  return { critRate, critDamage };
}

export function getHeroCritProfile(hero) {
  const agi = hero.stats?.agi || 4;
  const fusionLevel = Math.min(5, hero.fusionLevel || 0);
  const jobBonus = hero.heroClass === '巧匠' ? 0.08 : 0;
  const critRate = Math.min(0.65, 0.08 + (agi * 0.0035) + jobBonus + (fusionLevel * 0.02));
  const critDamage = 1.60 + (fusionLevel * 0.04);
  return { critRate, critDamage };
}

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
