import { assignMonsterSkills } from '../data/monsterSkills';

// 在每個 monster 物件建立後補上：
const monsterObj = {
  // ...原本的 id, name, hp, atk, def 等欄位
  chargingSkill: null,
  ...createBaseMonsterDebuffs()
};
monsterObj.skills = assignMonsterSkills(monsterObj);
import { ZONES } from '../data/constants';
import { getRandomElement } from './statCalculator';

function createBaseMonsterDebuffs() {
  return {
    armorBreakTurns: 0, armorBreakPct: 0,
    weakenTurns: 0, weakenPct: 0,
    blindTurns: 0, blindPct: 0,
    elemShiftTurns: 0,
    burnTurns: 0, burnDmg: 0,
    bleedTurns: 0, bleedDmg: 0,
    poisonTurns: 0, poisonPct: 0, poisonStacks: 0,
    vulnTurns: 0, vulnPct: 0
  };
}

/**
 * 計算多英雄隊伍動態體質縮放（隊伍人數越多，單隻怪物越耐打，獎勵也同步提升）
 * - 1人：HP 1.00x / DEF 1.00x / ATK 1.00x
 * - 3人：HP 1.50x / DEF 1.16x / ATK 1.08x
 * - 5人：HP 2.00x / DEF 1.32x / ATK 1.16x
 */
function getPartyScaling(totalCombatants = 1) {
  const extraMembers = Math.max(0, Math.min(5, totalCombatants) - 1);
  return {
    hpMult: 1 + extraMembers * 0.25,
    defMult: 1 + extraMembers * 0.08,
    atkMult: 1 + extraMembers * 0.04,
    rewardMult: 1 + extraMembers * 0.15
  };
}

export function buildZoneEncounter(zoneIdx, totalCombatants = 1) {
  const safeMembers = Math.max(1, Math.min(5, totalCombatants));
  // 怪群數量合理收斂在 2 ~ 6 隻（避免 5 人隊生出 14 隻怪導致 UI 擁擠或拖沓）
  const minCount = Math.min(4, Math.max(2, Math.ceil(safeMembers * 0.8)));
  const maxCount = Math.min(6, Math.max(3, safeMembers + 1));
  const count = minCount + Math.floor(Math.random() * (maxCount - minCount + 1));

  const zone = ZONES[zoneIdx] || ZONES[0];
  // 區域難度加入微幅階梯成長，避免高階地圖被高星英雄秒殺
  const zoneScale = 1 + (zoneIdx * 0.28) + (Math.pow(zoneIdx, 1.35) * 0.08);
  const partyScale = getPartyScaling(safeMembers);

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const list = [];

  for (let i = 0; i < count; i++) {
    const template = zone.monsters[Math.floor(Math.random() * zone.monsters.length)];
    const randElem = getRandomElement();
    const isElite = Math.random() < (0.22 + zoneIdx * 0.03);
    const eliteHpMult = isElite ? 1.45 : 1.0;
    const eliteAtkMult = isElite ? 1.22 : 1.0;
    const eliteDefMult = isElite ? 1.25 : 1.0;
    const eliteRewardMult = isElite ? 1.45 : 1.0;

    const finalMaxHp = Math.floor(template.hp * 1.55 * zoneScale * partyScale.hpMult * eliteHpMult);
    const finalAtk = Math.floor(template.atk * 1.35 * zoneScale * partyScale.atkMult * eliteAtkMult);
    const finalDef = Math.floor(template.def * 1.40 * zoneScale * partyScale.defMult * eliteDefMult);

    list.push({
      id: `m_${Date.now()}_${i}`,
      isElite,
      name: `${isElite ? '🔥精英・' : ''}${template.name} ${alphabet[i] || i + 1}`,
      element: randElem,
      originalElement: randElem,
      maxHp: finalMaxHp,
      hp: finalMaxHp,
      atk: finalAtk,
      def: finalDef,
      speed: Math.floor((10 + (zoneIdx * 4.5) + Math.floor(Math.random() * 4)) * (isElite ? 1.15 : 1.0)),
      exp: Math.floor(template.exp * eliteRewardMult * partyScale.rewardMult),
      gold: Math.floor(template.gold * eliteRewardMult * partyScale.rewardMult),
      ...createBaseMonsterDebuffs()
    });
  }

  return { zoneName: zone.name, list };
}

export function buildTowerEncounter(floor, totalCombatants = 1) {
  const safeFloor = Math.max(1, floor);
  const isBossFloor = safeFloor % 5 === 0;
  const tierBracket = Math.floor((safeFloor - 1) / 5);

  // 線性成長 + 每 5 層境界躍升（確保 10 層以上能抗衡高星英雄陣容）
  const bracketBoost = Math.pow(1.16, tierBracket);
  const hpScale = 1.45 * (1 + (safeFloor - 1) * 0.30) * bracketBoost;
  const atkScale = 1.25 * (1 + (safeFloor - 1) * 0.23) * Math.pow(1.10, tierBracket);
  const defScale = 1.28 * (1 + (safeFloor - 1) * 0.20) * Math.pow(1.12, tierBracket);
  const rewardScale = (1 + (safeFloor - 1) * 0.25) * Math.pow(1.12, tierBracket);

  const partyScale = getPartyScaling(totalCombatants);
  const baseZone = ZONES[Math.min(ZONES.length - 1, tierBracket)];
  const basePool = baseZone.monsters;
  const list = [];

  if (isBossFloor) {
    const bossTemplate = basePool[basePool.length - 1];
    const bossElem = getRandomElement();
    const bossMaxHp = Math.floor(bossTemplate.hp * hpScale * 3.1 * partyScale.hpMult);

    list.push({
      id: `tower_boss_${Date.now()}`,
      isBoss: true,
      name: `第${safeFloor}層鎮守妖王・${bossTemplate.name}`,
      element: bossElem,
      originalElement: bossElem,
      maxHp: bossMaxHp,
      hp: bossMaxHp,
      atk: Math.floor(bossTemplate.atk * atkScale * 1.55 * partyScale.atkMult),
      def: Math.floor(bossTemplate.def * defScale * 1.48 * partyScale.defMult),
      speed: Math.floor(15 + (safeFloor * 1.4)),
      exp: Math.floor(bossTemplate.exp * rewardScale * 2.6 * partyScale.rewardMult),
      gold: Math.floor(bossTemplate.gold * rewardScale * 2.6 * partyScale.rewardMult),
      ...createBaseMonsterDebuffs()
    });

    for (let i = 0; i < 2; i++) {
      const guardTpl = basePool[i % basePool.length];
      const guardElem = getRandomElement();
      const guardMaxHp = Math.floor(guardTpl.hp * hpScale * 1.45 * partyScale.hpMult);

      list.push({
        id: `tower_guard_${Date.now()}_${i}`,
        isElite: true,
        name: `妖王護法 ${i === 0 ? '左使' : '右使'}`,
        element: guardElem,
        originalElement: guardElem,
        maxHp: guardMaxHp,
        hp: guardMaxHp,
        atk: Math.floor(guardTpl.atk * atkScale * 1.18 * partyScale.atkMult),
        def: Math.floor(guardTpl.def * defScale * 1.18 * partyScale.defMult),
        speed: Math.floor(13 + (safeFloor * 1.2)),
        exp: Math.floor(guardTpl.exp * rewardScale * partyScale.rewardMult),
        gold: Math.floor(guardTpl.gold * rewardScale * partyScale.rewardMult),
        ...createBaseMonsterDebuffs()
      });
    }
  } else {
    const guardCount = Math.min(5, 3 + Math.floor(safeFloor / 6));
    const alphabet = '甲乙丙丁戊';
    for (let i = 0; i < guardCount; i++) {
      const tpl = basePool[i % basePool.length];
      const elem = getRandomElement();
      const guardMaxHp = Math.floor(tpl.hp * hpScale * 1.15 * partyScale.hpMult);

      list.push({
        id: `tower_m_${Date.now()}_${i}`,
        name: `${safeFloor}層守衛・${tpl.name}${alphabet[i] || ''}`,
        element: elem,
        originalElement: elem,
        maxHp: guardMaxHp,
        hp: guardMaxHp,
        atk: Math.floor(tpl.atk * atkScale * partyScale.atkMult),
        def: Math.floor(tpl.def * defScale * partyScale.defMult),
        speed: Math.floor(11 + (safeFloor * 1.15) + i),
        exp: Math.floor(tpl.exp * rewardScale * partyScale.rewardMult),
        gold: Math.floor(tpl.gold * rewardScale * partyScale.rewardMult),
        ...createBaseMonsterDebuffs()
      });
    }
  }

  return { isBossFloor, list };
}
