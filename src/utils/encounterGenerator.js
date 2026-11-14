import { ZONES } from '../data/constants';
import { DEMON_TOWERS, getTowerFloorMonsterLevel } from '../data/towers';
import { assignMonsterSkills } from '../data/monsterSkills';
import { getRandomElement } from './statCalculator';
import { calculateMonsterLevel } from './combat/combatFormulas';

function createBaseMonsterDebuffs() {
  return {
    chargingSkill: null,
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

function attachMonsterSkills(monsterObj) {
  monsterObj.skills = assignMonsterSkills(monsterObj);
  return monsterObj;
}

/**
 * 計算多英雄隊伍動態體質縮放
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
  const minCount = Math.min(4, Math.max(2, Math.ceil(safeMembers * 0.8)));
  const maxCount = Math.min(6, Math.max(3, safeMembers + 1));
  const count = minCount + Math.floor(Math.random() * (maxCount - minCount + 1));

  const zone = ZONES[zoneIdx] || ZONES[0];
  const zoneScale = 1 + (zoneIdx * 0.28) + (Math.pow(zoneIdx, 1.35) * 0.08);
  const partyScale = getPartyScaling(safeMembers);

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const list = [];

  for (let i = 0; i < count; i++) {
    const template = zone.monsters[Math.floor(Math.random() * zone.monsters.length)];
    const randElem = getRandomElement();
    const isElite = Math.random() < (0.22 + zoneIdx * 0.03);
    const mLevel = calculateMonsterLevel(zoneIdx, isElite, false);
    const eliteHpMult = isElite ? 1.45 : 1.0;
    const eliteAtkMult = isElite ? 1.22 : 1.0;
    const eliteDefMult = isElite ? 1.25 : 1.0;
    const eliteRewardMult = isElite ? 1.45 : 1.0;

    const finalMaxHp = Math.floor(template.hp * 1.55 * zoneScale * partyScale.hpMult * eliteHpMult);
    const finalAtk = Math.floor(template.atk * 1.35 * zoneScale * partyScale.atkMult * eliteAtkMult);
    const finalDef = Math.floor(template.def * 1.40 * zoneScale * partyScale.defMult * eliteDefMult);

    list.push(attachMonsterSkills({
      id: `m_${Date.now()}_${i}`,
      isElite,
      level: mLevel,
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
    }));
  }

  return { zoneName: zone.name, list };
}

/**
 * 依五大挑戰塔特性微調守塔敵群體質與元素偏好（所有塔層 exp 均為 0）
 */
function getTowerArchetypeProfile(towerType = 'equip') {
  if (towerType === 'gold') {
    return { hpBias: 1.05, defBias: 1.22, atkBias: 0.95, spdBias: 0.95, elems: ['土', '金'] };
  }
  if (towerType === 'refine') {
    return { hpBias: 0.98, defBias: 1.00, atkBias: 1.18, spdBias: 1.05, elems: ['火', '金'] };
  }
  if (towerType === 'hero') {
    return { hpBias: 1.08, defBias: 1.08, atkBias: 1.08, spdBias: 1.08, elems: ['木', '火', '土'] };
  }
  if (towerType === 'skill') {
    return { hpBias: 0.95, defBias: 0.95, atkBias: 1.12, spdBias: 1.22, elems: ['水', '木'] };
  }
  return { hpBias: 1.18, defBias: 1.12, atkBias: 1.05, spdBias: 1.00, elems: ['金', '火', '土'] };
}

export function buildTowerEncounter(floor, totalCombatants = 1, towerType = 'equip') {
  const safeFloor = Math.max(1, floor);
  const isBossFloor = safeFloor % 5 === 0;
  const tierBracket = Math.floor((safeFloor - 1) / 5);
  const towerMeta = DEMON_TOWERS[towerType] || DEMON_TOWERS.equip;
  const profile = getTowerArchetypeProfile(towerMeta.id);
  const displayLevel = getTowerFloorMonsterLevel(safeFloor);

  const bracketBoost = Math.pow(1.16, tierBracket);
  const hpScale = 1.45 * (1 + (safeFloor - 1) * 0.30) * bracketBoost * profile.hpBias;
  const atkScale = 1.25 * (1 + (safeFloor - 1) * 0.23) * Math.pow(1.10, tierBracket) * profile.atkBias;
  const defScale = 1.28 * (1 + (safeFloor - 1) * 0.20) * Math.pow(1.12, tierBracket) * profile.defBias;

  const partyScale = getPartyScaling(totalCombatants);
  const baseZone = ZONES[Math.min(ZONES.length - 1, tierBracket)];
  const basePool = baseZone.monsters;
  const list = [];

  const pickTowerElem = () => profile.elems[Math.floor(Math.random() * profile.elems.length)] || getRandomElement();

  if (isBossFloor) {
    const bossTemplate = basePool[basePool.length - 1];
    const bossElem = pickTowerElem();
    const bossMaxHp = Math.floor(bossTemplate.hp * hpScale * 3.1 * partyScale.hpMult);

    list.push(attachMonsterSkills({
      id: `tower_boss_${Date.now()}`,
      isBoss: true,
      level: displayLevel + 2,
      name: `${towerMeta.shortName}${safeFloor}層首領・${towerMeta.enemyArchetype}`,
      element: bossElem,
      originalElement: bossElem,
      maxHp: bossMaxHp,
      hp: bossMaxHp,
      atk: Math.floor(bossTemplate.atk * atkScale * 1.55 * partyScale.atkMult),
      def: Math.floor(bossTemplate.def * defScale * 1.48 * partyScale.defMult),
      speed: Math.floor((15 + (safeFloor * 1.4)) * profile.spdBias),
      exp: 0,
      gold: 0,
      ...createBaseMonsterDebuffs()
    }));

    for (let i = 0; i < 2; i++) {
      const guardTpl = basePool[i % basePool.length];
      const guardElem = pickTowerElem();
      const guardMaxHp = Math.floor(guardTpl.hp * hpScale * 1.45 * partyScale.hpMult);

      list.push(attachMonsterSkills({
        id: `tower_guard_${Date.now()}_${i}`,
        isElite: true,
        level: displayLevel,
        name: `${towerMeta.shortName}護法 ${i === 0 ? '左使' : '右使'}`,
        element: guardElem,
        originalElement: guardElem,
        maxHp: guardMaxHp,
        hp: guardMaxHp,
        atk: Math.floor(guardTpl.atk * atkScale * 1.18 * partyScale.atkMult),
        def: Math.floor(guardTpl.def * defScale * 1.18 * partyScale.defMult),
        speed: Math.floor((13 + (safeFloor * 1.2)) * profile.spdBias),
        exp: 0,
        gold: 0,
        ...createBaseMonsterDebuffs()
      }));
    }
  } else {
    const guardCount = Math.min(5, 3 + Math.floor(safeFloor / 6));
    const alphabet = '甲乙丙丁戊';
    for (let i = 0; i < guardCount; i++) {
      const tpl = basePool[i % basePool.length];
      const elem = pickTowerElem();
      const guardMaxHp = Math.floor(tpl.hp * hpScale * 1.15 * partyScale.hpMult);

      list.push(attachMonsterSkills({
        id: `tower_m_${Date.now()}_${i}`,
        level: displayLevel,
        name: `${towerMeta.shortName}${safeFloor}層・${towerMeta.enemyArchetype}${alphabet[i] || ''}`,
        element: elem,
        originalElement: elem,
        maxHp: guardMaxHp,
        hp: guardMaxHp,
        atk: Math.floor(tpl.atk * atkScale * partyScale.atkMult),
        def: Math.floor(tpl.def * defScale * partyScale.defMult),
        speed: Math.floor((11 + (safeFloor * 1.15) + i) * profile.spdBias),
        exp: 0,
        gold: 0,
        ...createBaseMonsterDebuffs()
      }));
    }
  }

  return { isBossFloor, towerMeta, list };
}
