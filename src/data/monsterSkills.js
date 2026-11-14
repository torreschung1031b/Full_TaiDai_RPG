import { ELEMENTS } from './constants';

export const MONSTER_SKILLS_DB = {
  // 1. 破甲重擊（適合前排集火）
  crush_armor: {
    id: 'crush_armor',
    name: '裂甲重擊',
    icon: '🪓',
    type: 'single_debuff',
    mult: 1.32,
    cd: 3,
    debuff: 'armorBreak',
    debuffTurns: 2,
    aiRole: 'bruiser',
    desc: '猛擊單體造成 1.32x 傷害並附帶破甲（降防 20%）。'
  },

  // 2. 切後排／斬殺突襲
  shadow_ambush: {
    id: 'shadow_ambush',
    name: '暗影襲殺',
    icon: '🗡️',
    type: 'snipe_lowest',
    mult: 1.28,
    cd: 3,
    debuff: 'bleed',
    debuffTurns: 2,
    aiRole: 'assassin',
    desc: '無視前排站位，直接突襲我方氣血最低者並造成流血。'
  },

  // 3. 有限範圍法術（最多波及 2~3 人）
  妖火焚陣: {
    id: 'demon_fire_aoe',
    name: '幽冥妖火',
    icon: '🔥',
    type: 'aoe_limited',
    maxTargets: 2,
    mult: 0.85,
    cd: 3,
    debuff: 'weaken',
    debuffTurns: 2,
    aiRole: 'caster',
    desc: '噴吐妖火波及我方最多 2 名角色，造成法傷並附加虛弱（降攻 20%）。'
  },

  // 4. 菁英自我狂暴與回血
  blood_frenzy: {
    id: 'blood_frenzy',
    name: '妖血狂暴',
    icon: '💢',
    type: 'self_buff',
    healPct: 0.14,
    atkBoostPct: 0.25,
    cd: 4,
    aiRole: 'elite',
    desc: '血量低於 60% 時激發妖血，恢復 14% 氣血並永久提升 25% 攻擊力。'
  },

  // 5. 妖王 BOSS 專屬：蓄力大招（可被玩家開盾／虛弱／致盲反制）
  boss_cataclysm: {
    id: 'boss_cataclysm',
    name: '滅世妖雷劫',
    icon: '⛈️',
    type: 'boss_charge_aoe',
    maxTargets: 3,
    mult: 1.38,
    cd: 4,
    aiRole: 'boss',
    desc: '蓄力 1 回合後引爆天雷，重創我方最多 3 名成員！'
  }
};

/**
 * 依怪物名稱／階級自動配置 1~2 個契合的怪物技能
 */
export function assignMonsterSkills(monster) {
  const name = monster.name || '';
  const skills = [];

  if (monster.isBoss) {
    skills.push({ ...MONSTER_SKILLS_DB.boss_cataclysm, currentCd: 1 });
    skills.push({ ...MONSTER_SKILLS_DB.crush_armor, currentCd: 0 });
    return skills;
  }

  if (/狼|豹|影|刺|蛛|蝠|盜|賊|狐/.test(name)) {
    skills.push({ ...MONSTER_SKILLS_DB.shadow_ambush, currentCd: 1 });
  } else if (/巫|妖|靈|鬼|道|法|魅|精/.test(name)) {
    skills.push({ ...MONSTER_SKILLS_DB.妖火焚陣, currentCd: 1 });
  } else {
    skills.push({ ...MONSTER_SKILLS_DB.crush_armor, currentCd: 1 });
  }

  if (monster.isElite) {
    skills.push({ ...MONSTER_SKILLS_DB.blood_frenzy, currentCd: 0 });
  }

  return skills;
}

/**
 * 智能目標選擇 AI：綜合站位權重、殘血收割、切治療後排、五行剋制與嘲諷
 */
export function selectMonsterSmartTarget({
  monster,
  candidates, // [{ id, name, rowIdx, hp, maxHp, element, heroClass, isPlayer }]
  combatBuffs,
  forceLowestHp = false
}) {
  if (!candidates || candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0];

  // 若技能強制切血量最低者（如暗影襲殺）
  if (forceLowestHp) {
    const sortedByHp = [...candidates].sort(
      (a, b) => (a.hp / Math.max(1, a.maxHp)) - (b.hp / Math.max(1, b.maxHp))
    );
    return sortedByHp[0];
  }

  // 嘲諷檢查：一般怪 100% 吃嘲諷；菁英／妖王有 20% 機率識破並自由選目標
  if ((combatBuffs?.tauntTurns || 0) > 0) {
    const playerCandidate = candidates.find(c => c.isPlayer);
    const ignoreTaunt = (monster.isBoss || monster.isElite) && Math.random() < 0.20;
    if (playerCandidate && !ignoreTaunt) {
      return playerCandidate;
    }
  }

  // 基礎站位權重：前排(0)=60, 中排(1)=25, 後排(2)=15
  const rowBaseWeights = { 0: 60, 1: 25, 2: 15 };

  const weighted = candidates.map(target => {
    let weight = rowBaseWeights[target.rowIdx] ?? 25;
    const hpRatio = target.hp / Math.max(1, target.maxHp);

    // 1. 殘血收割本能：血量 < 35% 大幅提高集火權重
    if (hpRatio <= 0.35) {
      weight += monster.isBoss || monster.isElite ? 85 : 55;
    } else if (hpRatio <= 0.55) {
      weight += 25;
    }

    // 2. 菁英／妖王切輔助仇恨：優先針對藥師與風水師
    if ((monster.isBoss || monster.isElite) && ['藥師', '風水師'].includes(target.heroClass)) {
      weight += 40;
    }

    // 3. 五行剋制本能：優先打被自己屬性剋制的目標
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

/**
 * 怪物回合 AI 決策：決定本回合是要「釋放蓄力大招」、「開始蓄力」、「施放技能」還是「普通攻擊」
 */
export function decideMonsterAction(monster) {
  // 1. 若上一回合已進入蓄力狀態，本回合必定釋放大招！
  if (monster.chargingSkill) {
    const readySkill = monster.chargingSkill;
    return { actionType: 'RELEASE_CHARGED', skill: readySkill };
  }

  const skills = monster.skills || [];
  const availableSkills = skills.filter(s => (s.currentCd || 0) <= 0);
  if (availableSkills.length === 0) {
    return { actionType: 'BASIC_ATTACK' };
  }

  const hpRatio = monster.hp / Math.max(1, monster.maxHp);

  // 2. 優先檢查自我狂暴回血技能（血量低於 60% 時 85% 機率立即使用）
  const selfBuffSkill = availableSkills.find(s => s.type === 'self_buff');
  if (selfBuffSkill && hpRatio < 0.60 && Math.random() < 0.85) {
    return { actionType: 'USE_SKILL', skill: selfBuffSkill };
  }

  // 3. 妖王蓄力大招（65% 機率進入蓄力預警狀態）
  const chargeSkill = availableSkills.find(s => s.type === 'boss_charge_aoe');
  if (chargeSkill && Math.random() < 0.65) {
    return { actionType: 'START_CHARGE', skill: chargeSkill };
  }

  // 4. 一般攻擊／控制技能（普通怪 45% 機率施放，菁英／妖王 65% 機率施放）
  const attackSkills = availableSkills.filter(s => s.type !== 'self_buff' && s.type !== 'boss_charge_aoe');
  const castChance = monster.isBoss || monster.isElite ? 0.65 : 0.45;
  if (attackSkills.length > 0 && Math.random() < castChance) {
    const picked = attackSkills[Math.floor(Math.random() * attackSkills.length)];
    return { actionType: 'USE_SKILL', skill: picked };
  }

  return { actionType: 'BASIC_ATTACK' };
}
