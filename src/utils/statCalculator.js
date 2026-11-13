import { ELEMENTS, MAX_LEVEL } from '../data/constants';
import { HERO_TEMPLATES } from '../data/heroes';
import { getRowPositionBuffs } from './formationHelper';

export function getRandomElement() {
  const keys = Object.keys(ELEMENTS);
  return keys[Math.floor(Math.random() * keys.length)];
}

/**
 * 統一經驗值曲線（主角與所有英雄共用，起始 100，每級 ×1.45）
 */
export function getMaxExpForLevel(level = 1) {
  let req = 100;
  const safeLvl = Math.max(1, Math.floor(level));
  for (let i = 1; i < safeLvl; i++) {
    req = Math.floor(req * 1.8);
  }
  return req;
}

/**
 * 計算五行生剋傷害倍率
 * - 剋制：一般 1.30x / 術士 1.45x
 * - 被剋：0.75x
 */
export function getElementMultiplier(attElem, defElem, isWarlock = false) {
  if (!attElem || !defElem || !ELEMENTS[attElem] || !ELEMENTS[defElem]) return 1.0;
  if (ELEMENTS[attElem].counters === defElem) {
    return isWarlock ? 1.45 : 1.30;
  }
  if (ELEMENTS[defElem].counters === attElem) {
    return 0.75;
  }
  return 1.0;
}

/**
 * 規範化並自動補齊舊存檔英雄欄位（包含最新實裝的本命天賦 traitBonus 與同步經驗曲線）
 */
export function normalizeHero(hero) {
  if (!hero) return hero;
  const tpl = HERO_TEMPLATES.find(t => t.baseId === hero.baseId);
  const level = Math.min(MAX_LEVEL, Math.max(1, hero.level || 1));
  const stats = {
    str: hero.stats?.str ?? tpl?.stats?.str ?? 4,
    con: hero.stats?.con ?? tpl?.stats?.con ?? 4,
    int: hero.stats?.int ?? tpl?.stats?.int ?? 2,
    agi: hero.stats?.agi ?? tpl?.stats?.agi ?? 2
  };
  const tier = hero.tier || tpl?.tier || 1;
  const fusionLevel = Math.min(5, Math.max(0, hero.fusionLevel || 0));
  const fusionMult = 1 + (fusionLevel * 0.15);

  const fallbackMaxHp = Math.floor((140 + (tier * 50) + (stats.con * 18)) * fusionMult);
  const fallbackAtk = Math.floor((18 + (tier * 12) + (stats.str * 3.2) + (stats.int * 2.2)) * fusionMult);
  const fallbackDef = Math.floor((6 + (tier * 4) + (stats.con * 1.2)) * fusionMult);
  const fallbackSpeed = Math.floor((10 + (tier * 2) + (stats.agi * 2)) * fusionMult);

  return {
    ...hero,
    icon: hero.icon || tpl?.icon || '🧑',
    tier,
    heroClass: hero.heroClass || tpl?.heroClass || '猛將',
    desc: hero.desc || tpl?.desc || '',
    traitName: hero.traitName || tpl?.traitName || '江湖歷練',
    traitDesc: hero.traitDesc || tpl?.traitDesc || '全屬性穩步成長',
    traitBonus: hero.traitBonus || tpl?.traitBonus || {},
    level,
    exp: level >= MAX_LEVEL ? 0 : (hero.exp || 0),
    maxExp: getMaxExpForLevel(level),
    fusionLevel,
    stats,
    maxHp: hero.maxHp || fallbackMaxHp,
    hp: typeof hero.hp === 'number' ? hero.hp : (hero.maxHp || fallbackMaxHp),
    atk: hero.atk || fallbackAtk,
    def: hero.def || fallbackDef,
    speed: hero.speed || fallbackSpeed,
    activeSkillSlots: Array.isArray(hero.activeSkillSlots) ? hero.activeSkillSlots : [],
    passiveSkillSlots: Array.isArray(hero.passiveSkillSlots) ? hero.passiveSkillSlots : []
  };
}

/**
 * 計算英雄最終有效戰鬥屬性（整合本命天賦、1.5x 被動卡、前後排站位與戰鬥臨時增益）
 */
export function calculateHeroEffectiveStats(hero, isFengShui = false, battleBuff = null, rowIdx = 1, teamAuraBonus = null) {
  const h = normalizeHero(hero);
  const rowBuff = getRowPositionBuffs(rowIdx * 3);

  let atkPct = (rowBuff.atkPct || 0) + (teamAuraBonus?.atkPct || 0);
  let defPct = (rowBuff.defPct || 0) + (teamAuraBonus?.defPct || 0);
  let hpPct = (teamAuraBonus?.hpPct || 0);
  let speedPct = (rowBuff.speedPct || 0) + (teamAuraBonus?.speedPct || 0);
  let skillChance = 0.30 + ((h.tier || 1) * 0.03) + (teamAuraBonus?.skillChance || 0);
  let elemDmgPct = 0;

  // 1. 英雄專屬本命天賦
  const tb = h.traitBonus || {};
  atkPct += tb.atkPct || 0;
  defPct += tb.defPct || 0;
  hpPct += tb.hpPct || 0;
  speedPct += tb.speedPct || 0;
  skillChance += tb.skillChance || 0;
  elemDmgPct += tb.elemDmgPct || 0;

  // 2. 被動技能卡（全部享受 1.5 倍強化）
  const PASSIVE_MULT = 1.5;
  (h.passiveSkillSlots || []).forEach(card => {
    const b = card?.bonus || {};
    atkPct += (b.atkPct || 0) * PASSIVE_MULT;
    defPct += (b.defPct || 0) * PASSIVE_MULT;
    hpPct += (b.hpPct || 0) * PASSIVE_MULT;
    speedPct += (b.speedPct || 0) * PASSIVE_MULT;
    skillChance += (b.skillChance || 0) * PASSIVE_MULT;
    elemDmgPct += (b.elemDmgPct || 0) * PASSIVE_MULT;
  });

  // 3. 戰鬥臨時激發增益（如九轉還魂丹）
  if (battleBuff?.surgeTurns > 0) {
    atkPct += battleBuff.surgeAtkPct || 0.25;
  }

  // 風水師帶隊陣位靈氣微幅增幅
  if (isFengShui) {
    atkPct += 0.05;
    defPct += 0.05;
  }

  const effectiveMaxHp = Math.max(10, Math.floor((h.maxHp || 150) * (1 + hpPct)));
  const effectiveAtk = Math.max(5, Math.floor((h.atk || 20) * (1 + atkPct)));
  const effectiveDef = Math.max(1, Math.floor((h.def || 8) * (1 + defPct)));
  const effectiveSpeed = Math.max(5, Math.floor((h.speed || 10) * (1 + speedPct)));

  return {
    effectiveMaxHp,
    effectiveAtk,
    effectiveDef,
    effectiveSpeed,
    elemDmgPct,
    skillChance: Math.min(0.85, skillChance)
  };
}

/**
 * 英雄重傷瀕死時永久屬性懲罰
 */
export function applyHeroDeathStatPenalty(hero) {
  const h = normalizeHero(hero);
  const keys = ['str', 'con', 'int', 'agi'];
  const losses = [];
  const nextStats = { ...h.stats };
  let actualLoss = 0;

  for (let i = 0; i < 2; i++) {
    const avail = keys.filter(k => nextStats[k] > 1);
    if (avail.length === 0) break;
    const picked = avail[Math.floor(Math.random() * avail.length)];
    nextStats[picked] -= 1;
    actualLoss += 1;
    losses.push(picked.toUpperCase());
  }

  const tier = h.tier || 1;
  const fusionMult = 1 + ((h.fusionLevel || 0) * 0.15);
  const newMaxHp = Math.floor((140 + (tier * 50) + (nextStats.con * 18)) * fusionMult);
  const newAtk = Math.floor((18 + (tier * 12) + (nextStats.str * 3.2) + (nextStats.int * 2.2)) * fusionMult);
  const newDef = Math.floor((6 + (tier * 4) + (nextStats.con * 1.2)) * fusionMult);
  const newSpeed = Math.floor((10 + (tier * 2) + (nextStats.agi * 2)) * fusionMult);

  return {
    updatedHero: {
      ...h,
      hp: 0,
      stats: nextStats,
      maxHp: newMaxHp,
      atk: newAtk,
      def: newDef,
      speed: newSpeed
    },
    actualLoss,
    breakdownText: losses.length > 0 ? losses.map(l => `${l}-1`).join(', ') : '已達屬性下限'
  };
}

/**
 * 從存活怪物中挑選最多 N 個目標索引（優先包含主鎖定目標）
 */
export function pickUpToNMonsterIndices(monsters = [], primaryIdx = 0, maxCount = 3) {
  const aliveIndices = [];
  monsters.forEach((m, idx) => {
    if (m && m.hp > 0) aliveIndices.push(idx);
  });
  if (aliveIndices.length <= maxCount) return aliveIndices;

  const picked = [];
  if (aliveIndices.includes(primaryIdx)) {
    picked.push(primaryIdx);
  }
  const rest = aliveIndices.filter(i => i !== primaryIdx);
  while (picked.length < maxCount && rest.length > 0) {
    const rIdx = Math.floor(Math.random() * rest.length);
    picked.push(rest[rIdx]);
    rest.splice(rIdx, 1);
  }
  return picked;
}
