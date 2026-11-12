import { MAX_LEVEL, ELEMENTS, ELEMENT_KEYS } from '../data/constants';
import { TIER_SKILL_CHANCE } from '../data/skillCards';
import { getRowPositionBuffs } from './formationHelper';

export function getRandomElement() {
  return ELEMENT_KEYS[Math.floor(Math.random() * ELEMENT_KEYS.length)];
}

export function getElementMultiplier(attElem, defElem, isWarlockAttacker = false) {
  if (!attElem || !defElem || !ELEMENTS[attElem]) return 1.0;
  if (ELEMENTS[attElem].counters === defElem) return isWarlockAttacker ? 2.0 : 1.5;
  if (ELEMENTS[defElem] && ELEMENTS[defElem].counters === attElem) return isWarlockAttacker ? 0.9 : 0.75;
  return 1.0;
}

export function calculateHeroEffectiveStats(hero, isFengShuiLeader = false, heroSurgeBuff = null, rowIdx = 1) {
  const passives = hero.passiveSkillSlots || [];
  const rowBuff = getRowPositionBuffs(rowIdx * 3);
  let atkPct = heroSurgeBuff?.surgeTurns > 0 ? (heroSurgeBuff.surgeAtkPct || 0) : 0;
  let defPct = 0;
  let hpPct = 0;
  let speedPct = rowBuff.speedPct || 0;
  let elemDmgPct = 0;

  passives.forEach(card => {
    if (card && card.bonus) {
      atkPct += card.bonus.atkPct || 0;
      defPct += card.bonus.defPct || 0;
      hpPct += card.bonus.hpPct || 0;
      speedPct += card.bonus.speedPct || 0;
      elemDmgPct += card.bonus.elemDmgPct || 0;
    }
  });

  const baseMaxHp = hero.maxHp || 150;
  const baseAtk = hero.atk || 20;
  const baseDef = hero.def || 8;
  const baseSpeed = hero.speed || 10;
  const baseChance = TIER_SKILL_CHANCE[hero.tier] || 0.15;

  return {
    effectiveMaxHp: Math.floor(baseMaxHp * (1 + hpPct)),
    effectiveAtk: Math.floor(baseAtk * (1 + atkPct)),
    effectiveDef: Math.floor(baseDef * (1 + defPct)),
    effectiveSpeed: Math.floor(baseSpeed * (1 + speedPct)),
    elemDmgPct,
    skillChance: Math.min(1.0, baseChance + (isFengShuiLeader ? 0.15 : 0) + (rowBuff.critSkillPct || 0))
  };
}

export function normalizeHero(h) {
  const clampedLevel = Math.min(MAX_LEVEL, Math.max(1, h.level || 1));
  return {
    ...h,
    level: clampedLevel,
    def: h.def ?? (5 + ((h.tier || 1) * 4) + ((h.stats?.con || 2) * 1)),
    speed: h.speed ?? (10 + ((h.tier || 1) * 2) + ((h.stats?.agi || 2) * 2)),
    maxExp: h.maxExp || 100,
    rage: h.rage ?? 0,
    ammo: h.ammo ?? 6,
    maxAmmo: h.maxAmmo ?? 6,
    mp: h.mp ?? 50,
    maxMp: h.maxMp ?? 100,
    statLossTotal: h.statLossTotal ?? 0,
    activeSkillSlots: Array.isArray(h.activeSkillSlots) ? h.activeSkillSlots : [],
    passiveSkillSlots: Array.isArray(h.passiveSkillSlots) ? h.passiveSkillSlots : [],
    stats: h.stats || { str: 4, con: 4, int: 2, agi: 2 }
  };
}

export function applyHeroDeathStatPenalty(hero) {
  const totalRoll = Math.floor(Math.random() * 5) + 1;
  const statKeys = ['str', 'con', 'int', 'agi'];
  const statLabels = { str: '力量', con: '體質', int: '智慧', agi: '敏捷' };
  const newStats = { ...(hero.stats || { str: 4, con: 4, int: 2, agi: 2 }) };
  const deducted = { str: 0, con: 0, int: 0, agi: 0 };

  for (let i = 0; i < totalRoll; i++) {
    const reducible = statKeys.filter(k => (newStats[k] || 1) > 1);
    if (reducible.length === 0) break;
    const chosen = reducible[Math.floor(Math.random() * reducible.length)];
    newStats[chosen] -= 1;
    deducted[chosen] += 1;
  }

  const actualLoss = Object.values(deducted).reduce((a, b) => a + b, 0);
  const tier = hero.tier || 1;
  const newMaxHp = 130 + (tier * 45) + (newStats.con * 16);
  const newAtk = 16 + (tier * 11) + (newStats.str * 3) + (newStats.int * 2);
  const newDef = 5 + (tier * 4) + (newStats.con * 1);
  const newSpeed = 10 + (tier * 2) + (newStats.agi * 2);

  const breakdownParts = statKeys
    .filter(k => deducted[k] > 0)
    .map(k => `${statLabels[k]} -${deducted[k]}`);

  const updatedHero = {
    ...hero,
    stats: newStats,
    maxHp: newMaxHp,
    atk: newAtk,
    def: newDef,
    speed: newSpeed,
    statLossTotal: (hero.statLossTotal || 0) + actualLoss
  };

  return {
    updatedHero,
    actualLoss,
    breakdownText: breakdownParts.length > 0 ? breakdownParts.join('、') : '屬性已達下限未再扣除'
  };
}

// 裝備職業限制（術士等法系不可穿重裝）與賣出價格計算
export function enrichEquipmentMeta(item) {
  if (!item) return null;
  const name = item.name || '';
  const type = item.type || 'armor';
  let equipTag = item.equipTag || '';
  let allowedJobs = item.allowedJobs || null;

  if (!allowedJobs) {
    if (type === 'accessory') {
      equipTag = '飾品 • 全職通用';
      allowedJobs = ['猛將', '巧匠', '術士', '藥師', '風水師'];
    } else if (/木|竹|新手|布衣|麻|草鞋/.test(name)) {
      equipTag = '新手輕便 • 全職通用';
      allowedJobs = ['猛將', '巧匠', '術士', '藥師', '風水師'];
    } else if (type === 'weapon' || type === 'offhand') {
      if (/杖|符|扇|羅盤|拂塵|書|珠|法|靈|藥|葫蘆|鼎/.test(name)) {
        equipTag = '法器 • 術士/藥師/風水師';
        allowedJobs = ['術士', '藥師', '風水師'];
      } else if (/弓|弩|箭|針|鏢|匕|刺|機關|爪/.test(name)) {
        equipTag = '弓弩暗器 • 巧匠/猛將';
        allowedJobs = ['巧匠', '猛將'];
      } else if (/重|斧|錘|戟|盾|巨|霸王/.test(name)) {
        equipTag = '重兵 • 限猛將';
        allowedJobs = ['猛將'];
      } else {
        equipTag = '兵刃 • 猛將/巧匠';
        allowedJobs = ['猛將', '巧匠'];
      }
    } else {
      if (/重|鐵|鋼|鎧|鎖子|戰|虎|玄鐵|金剛/.test(name) || (item.def || 0) >= 12) {
        equipTag = '重裝 • 限猛將';
        allowedJobs = ['猛將'];
      } else if (/袍|道|法|靈|仙|紗|綢|羽|儒|鶴/.test(name) || (item.mp || 0) >= 15) {
        equipTag = '法袍 • 術士/藥師/風水師';
        allowedJobs = ['術士', '藥師', '風水師'];
      } else {
        equipTag = '輕裝 • 猛將/巧匠';
        allowedJobs = ['猛將', '巧匠'];
      }
    }
  }

  const basePrice = item.sellPrice || (
    (item.atk || 0) * 4 +
    (item.def || 0) * 5 +
    (item.hp || 0) * 1 +
    (item.mp || 0) * 1 +
    45
  );
  const sellPrice = Math.max(25, basePrice + (item.refineLevel || 0) * 60);

  return { ...item, equipTag, allowedJobs, sellPrice };
}

export function pickUpToNMonsterIndices(monsterList, primaryIdx, maxCount) {
  const aliveIndices = monsterList
    .map((m, idx) => (m.hp > 0 ? idx : -1))
    .filter(idx => idx !== -1);
  if (aliveIndices.length === 0) return [];

  const chosen = [];
  if (aliveIndices.includes(primaryIdx)) {
    chosen.push(primaryIdx);
  } else {
    chosen.push(aliveIndices[0]);
  }

  const remaining = aliveIndices.filter(idx => !chosen.includes(idx));
  while (chosen.length < maxCount && remaining.length > 0) {
    const randPos = Math.floor(Math.random() * remaining.length);
    chosen.push(remaining[randPos]);
    remaining.splice(randPos, 1);
  }
  return chosen;
}
