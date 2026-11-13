import { ZONES } from '../data/constants';
import { getRandomElement } from './statCalculator';

function createBaseMonsterDebuffs() {
  return {
    armorBreakTurns: 0, armorBreakPct: 0,
    blindTurns: 0, blindPct: 0,
    elemShiftTurns: 0,
    burnTurns: 0, burnDmg: 0,
    poisonTurns: 0, poisonPct: 0, poisonStacks: 0,
    vulnTurns: 0, vulnPct: 0
  };
}

export function buildZoneEncounter(zoneIdx, totalCombatants) {
  const count = Math.floor(Math.random() * (totalCombatants * 2)) + Math.max(2, totalCombatants);
  const zone = ZONES[zoneIdx];
  const zoneScale = 1 + (zoneIdx * 0.22);
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const list = [];

  for (let i = 0; i < count; i++) {
    const template = zone.monsters[Math.floor(Math.random() * zone.monsters.length)];
    const randElem = getRandomElement();
    const isElite = Math.random() < 0.25;
    const eliteHpMult = isElite ? 1.35 : 1.0;
    const eliteAtkMult = isElite ? 1.20 : 1.0;
    const eliteDefMult = isElite ? 1.20 : 1.0;
    const eliteRewardMult = isElite ? 1.40 : 1.0;

    list.push({
      id: `m_${Date.now()}_${i}`,
      isElite,
      name: `${isElite ? '🔥精英・' : ''}${template.name} ${alphabet[i] || i + 1}`,
      element: randElem,
      originalElement: randElem,
      maxHp: Math.floor(template.hp * 1.45 * zoneScale * eliteHpMult),
      hp: Math.floor(template.hp * 1.45 * zoneScale * eliteHpMult),
      atk: Math.floor(template.atk * 1.32 * zoneScale * eliteAtkMult),
      def: Math.floor(template.def * 1.35 * zoneScale * eliteDefMult),
      speed: Math.floor((9 + (zoneIdx * 4) + Math.floor(Math.random() * 4)) * (isElite ? 1.15 : 1.0)),
      exp: Math.floor(template.exp * eliteRewardMult),
      gold: Math.floor(template.gold * eliteRewardMult),
      ...createBaseMonsterDebuffs()
    });
  }

  return { zoneName: zone.name, list };
}

export function buildTowerEncounter(floor) {
  const isBossFloor = floor % 5 === 0;
  const hpScale = 1.25 * (1 + (floor - 1) * 0.28);
  const atkScale = 1.20 * (1 + (floor - 1) * 0.22);
  const defScale = 1.20 * (1 + (floor - 1) * 0.18);
  const rewardScale = 1 + (floor - 1) * 0.22;

  const baseZone = ZONES[Math.min(ZONES.length - 1, Math.floor((floor - 1) / 5))];
  const basePool = baseZone.monsters;
  const list = [];

  if (isBossFloor) {
    const bossTemplate = basePool[basePool.length - 1];
    const bossElem = getRandomElement();
    list.push({
      id: `tower_boss_${Date.now()}`,
      isBoss: true,
      name: `第${floor}層鎮守妖王・${bossTemplate.name}`,
      element: bossElem,
      originalElement: bossElem,
      maxHp: Math.floor(bossTemplate.hp * hpScale * 2.6),
      hp: Math.floor(bossTemplate.hp * hpScale * 2.6),
      atk: Math.floor(bossTemplate.atk * atkScale * 1.55),
      def: Math.floor(bossTemplate.def * defScale * 1.4),
      speed: Math.floor(14 + (floor * 1.3)),
      exp: Math.floor(bossTemplate.exp * rewardScale * 2.5),
      gold: Math.floor(bossTemplate.gold * rewardScale * 2.5),
      ...createBaseMonsterDebuffs()
    });

    for (let i = 0; i < 2; i++) {
      const guardTpl = basePool[i % basePool.length];
      const guardElem = getRandomElement();
      list.push({
        id: `tower_guard_${Date.now()}_${i}`,
        isElite: true,
        name: `妖王護法 ${i === 0 ? '左使' : '右使'}`,
        element: guardElem,
        originalElement: guardElem,
        maxHp: Math.floor(guardTpl.hp * hpScale * 1.25),
        hp: Math.floor(guardTpl.hp * hpScale * 1.25),
        atk: Math.floor(guardTpl.atk * atkScale * 1.15),
        def: Math.floor(guardTpl.def * defScale * 1.1),
        speed: Math.floor(12 + (floor * 1.15)),
        exp: Math.floor(guardTpl.exp * rewardScale),
        gold: Math.floor(guardTpl.gold * rewardScale),
        ...createBaseMonsterDebuffs()
      });
    }
  } else {
    const guardCount = Math.min(6, 3 + Math.floor(floor / 5));
    const alphabet = '甲乙丙丁戊己';
    for (let i = 0; i < guardCount; i++) {
      const tpl = basePool[i % basePool.length];
      const elem = getRandomElement();
      list.push({
        id: `tower_m_${Date.now()}_${i}`,
        name: `${floor}層守衛・${tpl.name}${alphabet[i] || ''}`,
        element: elem,
        originalElement: elem,
        maxHp: Math.floor(tpl.hp * hpScale),
        hp: Math.floor(tpl.hp * hpScale),
        atk: Math.floor(tpl.atk * atkScale),
        def: Math.floor(tpl.def * defScale),
        speed: Math.floor(10 + (floor * 1.1) + i),
        exp: Math.floor(tpl.exp * rewardScale),
        gold: Math.floor(tpl.gold * rewardScale),
        ...createBaseMonsterDebuffs()
      });
    }
  }

  return { isBossFloor, list };
}
