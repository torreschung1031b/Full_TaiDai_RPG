import { ELEMENTS } from './constants';

export const MONSTER_SKILLS_DB = {
  crush_armor: {
    id: 'crush_armor',
    name: '裂甲重擊',
    icon: '🪓',
    type: 'single_debuff',
    mult: 1.32,
    cd: 3,
    debuff: 'armorBreak',
    debuffTurns: 2,
    desc: '猛擊單體造成 1.32x 傷害並附帶破甲（降防 20%）。'
  },
  shadow_ambush: {
    id: 'shadow_ambush',
    name: '暗影襲殺',
    icon: '🗡️',
    type: 'snipe_lowest',
    mult: 1.28,
    cd: 3,
    debuff: 'bleed',
    debuffTurns: 2,
    desc: '無視前排站位，直接突襲我方氣血最低者並造成流血。'
  },
  demon_fire_aoe: {
    id: 'demon_fire_aoe',
    name: '幽冥妖火',
    icon: '🔥',
    type: 'aoe_limited',
    maxTargets: 2,
    mult: 0.85,
    cd: 3,
    debuff: 'weaken',
    debuffTurns: 2,
    desc: '噴吐妖火波及我方最多 2 名角色，造成法傷並附加虛弱。'
  },
  blood_frenzy: {
    id: 'blood_frenzy',
    name: '妖血狂暴',
    icon: '💢',
    type: 'self_buff',
    healPct: 0.14,
    atkBoostPct: 0.22,
    cd: 4,
    desc: '血量低於 60% 時激發妖血，恢復 14% 氣血並提升攻擊力。'
  },
  boss_cataclysm: {
    id: 'boss_cataclysm',
    name: '滅世妖雷劫',
    icon: '⛈️',
    type: 'boss_charge_aoe',
    maxTargets: 3,
    mult: 1.38,
    cd: 4,
    desc: '蓄力 1 回合後引爆天雷，重創我方最多 3 名成員！'
  }
};

export function assignMonsterSkills(monster) {
  const name = monster?.name || '';
  const skills = [];

  if (monster?.isBoss) {
    skills.push({ ...MONSTER_SKILLS_DB.boss_cataclysm, currentCd: 1 });
    skills.push({ ...MONSTER_SKILLS_DB.crush_armor, currentCd: 0 });
    return skills;
  }

  if (/狼|豹|影|刺|蛛|蝠|盜|賊|狐|猴|猿/.test(name)) {
    skills.push({ ...MONSTER_SKILLS_DB.shadow_ambush, currentCd: 1 });
  } else if (/巫|妖|靈|鬼|道|法|魅|精|仙|魔/.test(name)) {
    skills.push({ ...MONSTER_SKILLS_DB.demon_fire_aoe, currentCd: 1 });
  } else {
    skills.push({ ...MONSTER_SKILLS_DB.crush_armor, currentCd: 1 });
  }

  if (monster?.isElite) {
    skills.push({ ...MONSTER_SKILLS_DB.blood_frenzy, currentCd: 0 });
  }

  return skills;
}

export function selectMonsterSmartTarget({
  monster,
  candidates,
  combatBuffs,
  forceLowestHp = false
}) {
  if (!candidates || candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0];

  if (forceLowestHp) {
    const sorted = [...candidates].sort(
      (a, b) => (a.hp / Math.max(1, a.maxHp)) - (b.hp / Math.max(1, b.maxHp))
    );
    return sorted[0];
  }

  if ((combatBuffs?.tauntTurns || 0) > 0) {
    const playerCandidate = candidates.find(c => c.isPlayer);
    const ignoreTaunt = (monster.isBoss || monster.isElite) && Math.random() < 0.20;
    if (playerCandidate && !ignoreTaunt) {
      return playerCandidate;
    }
  }

  const rowBaseWeights = { 0: 65, 1: 25, 2: 10 };

  const weighted = candidates.map(target => {
    let weight = rowBaseWeights[target.rowIdx] ?? 25;
    if (target.isTank) weight *= 1.35;

    const hpRatio = target.hp / Math.max(1, target.maxHp);
    if (hpRatio <= 0.35) {
      weight += monster.isBoss || monster.isElite ? 85 : 55;
    } else if (hpRatio <= 0.55) {
      weight += 25;
    }

    if ((monster.isBoss || monster.isElite) && ['藥師', '風水師'].includes(target.heroClass)) {
      weight += 40;
    }

    if (ELEMENTS[monster.element]?.counters === target.element) {
      weight += 35;
    }

    return { target, weight: Math.max(5, weight) };
  });

  const totalWeight = weighted.reduce((sum, item) => sum + item.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const item of weighted) {
    roll -= item.weight;
    if (roll <= 0) return item.target;
  }
  return weighted[0].target;
}

export function decideMonsterAction(monster) {
  if (monster.chargingSkill) {
    return { actionType: 'RELEASE_CHARGED', skill: monster.chargingSkill };
  }

  const skills = monster.skills || [];
  const availableSkills = skills.filter(s => (s.currentCd || 0) <= 0);
  if (availableSkills.length === 0) {
    return { actionType: 'BASIC_ATTACK' };
  }

  const hpRatio = monster.hp / Math.max(1, monster.maxHp);

  const selfBuffSkill = availableSkills.find(s => s.type === 'self_buff');
  if (selfBuffSkill && hpRatio < 0.60 && Math.random() < 0.85) {
    return { actionType: 'USE_SKILL', skill: selfBuffSkill };
  }

  const chargeSkill = availableSkills.find(s => s.type === 'boss_charge_aoe');
  if (chargeSkill && Math.random() < 0.65) {
    return { actionType: 'START_CHARGE', skill: chargeSkill };
  }

  const attackSkills = availableSkills.filter(
    s => s.type !== 'self_buff' && s.type !== 'boss_charge_aoe'
  );
  const castChance = monster.isBoss || monster.isElite ? 0.65 : 0.45;
  if (attackSkills.length > 0 && Math.random() < castChance) {
    const picked = attackSkills[Math.floor(Math.random() * attackSkills.length)];
    return { actionType: 'USE_SKILL', skill: picked };
  }

  return { actionType: 'BASIC_ATTACK' };
}
