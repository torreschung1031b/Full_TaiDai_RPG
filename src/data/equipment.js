export const GEMS_DB = [
  { id: 'gem_ruby', name: '赤炎紅寶石', atk: 15, def: 0, hp: 0, mp: 0, speed: 0, desc: '攻擊力 +15' },
  { id: 'gem_sapphire', name: '滄海藍寶石', atk: 0, def: 0, hp: 0, mp: 30, speed: 0, desc: '最大內力 +30' },
  { id: 'gem_emerald', name: '青木翡翠', atk: 0, def: 0, hp: 80, mp: 0, speed: 0, desc: '最大生命 +80' },
  { id: 'gem_topaz', name: '玄武黃玉', atk: 0, def: 10, hp: 0, mp: 0, speed: 0, desc: '防禦力 +10' }
];

export const REFORGE_AFFIX_POOL = [
  { id: 'aff_atk_pct', name: '霸王神力', desc: '全攻擊力 +8%', atkPct: 0.08 },
  { id: 'aff_def_pct', name: '金剛不壞', desc: '全防禦力 +10%', defPct: 0.10 },
  { id: 'aff_hp_pct', name: '龍血護體', desc: '最大生命 +10%', hpPct: 0.10 },
  { id: 'aff_mp_pct', name: '太虛靈源', desc: '最大內力 +15%', mpPct: 0.15 },
  { id: 'aff_spd_flat', name: '神行無影', desc: '行動速度 +8', speed: 8 },
  { id: 'aff_atk_flat', name: '鋒芒畢露', desc: '基礎攻擊 +24', atk: 24 },
  { id: 'aff_hybrid', name: '文武雙全', desc: '攻擊 +14・防禦 +12・速度 +4', atk: 14, def: 12, speed: 4 },
  { id: 'aff_guardian', name: '玄武鎮嶽', desc: '生命 +130・防禦 +16', hp: 130, def: 16 }
];

export function rollRandomReforgeAffix(excludeId = null) {
  const pool = excludeId
    ? REFORGE_AFFIX_POOL.filter(a => a.id !== excludeId)
    : REFORGE_AFFIX_POOL;
  const source = pool.length > 0 ? pool : REFORGE_AFFIX_POOL;
  return { ...source[Math.floor(Math.random() * source.length)] };
}

export const SET_EFFECTS_CONFIG = {
  set_xuantie: {
    id: 'set_xuantie',
    name: '玄鐵戰神套',
    maxPieces: 2,
    bonuses: [
      { pieces: 2, desc: '攻擊 +8%・防禦 +8%', atkPct: 0.08, defPct: 0.08 }
    ]
  },
  set_liuxing: {
    id: 'set_liuxing',
    name: '流星追月套',
    maxPieces: 2,
    bonuses: [
      { pieces: 2, desc: '攻擊 +10%・速度 +8', atkPct: 0.10, speed: 8 }
    ]
  },
  set_tianshi: {
    id: 'set_tianshi',
    name: '天師道韻套',
    maxPieces: 2,
    bonuses: [
      { pieces: 2, desc: '法攻 +8%・內力 +15%', atkPct: 0.08, mpPct: 0.15 }
    ]
  },
  set_longyin: {
    id: 'set_longyin',
    name: '真龍降世套',
    maxPieces: 4,
    bonuses: [
      { pieces: 2, desc: '攻擊 +12%・生命 +12%', atkPct: 0.12, hpPct: 0.12 },
      { pieces: 4, desc: '攻擊再 +10%・防禦 +10%', atkPct: 0.10, defPct: 0.10 }
    ]
  },
  set_taiji: {
    id: 'set_taiji',
    name: '太極混元套',
    maxPieces: 4,
    bonuses: [
      { pieces: 2, desc: '攻擊 +10%・內力 +20%', atkPct: 0.10, mpPct: 0.20 },
      { pieces: 4, desc: '防禦 +15%・速度 +12', defPct: 0.15, speed: 12 }
    ]
  },
  set_xiandi: {
    id: 'set_xiandi',
    name: '太古仙帝套',
    maxPieces: 4,
    bonuses: [
      { pieces: 2, desc: '全攻 +15%・生命 +15%', atkPct: 0.15, hpPct: 0.15 },
      { pieces: 4, desc: '全攻再 +15%・防禦 +20%・速度 +15', atkPct: 0.15, defPct: 0.20, speed: 15 }
    ]
  }
};

const TIER_META = {
  1: {
    tag: '[T1 凡鐵]',
    badgeStyle: 'bg-slate-800 text-slate-200 border-slate-600',
    sockets: 0,
    baseSell: 45
  },
  2: {
    tag: '[T2 精鋼]',
    badgeStyle: 'bg-emerald-950 text-emerald-300 border-emerald-600/80',
    sockets: 1,
    baseSell: 110
  },
  3: {
    tag: '[T3 玄鐵]',
    badgeStyle: 'bg-sky-950 text-sky-300 border-sky-500/80',
    sockets: 1,
    baseSell: 240
  },
  4: {
    tag: '[T4 靈寶]',
    badgeStyle: 'bg-purple-950 text-purple-300 border-purple-500/80',
    sockets: 2,
    baseSell: 520
  },
  5: {
    tag: '[T5 仙器]',
    badgeStyle: 'bg-amber-950 text-amber-300 border-amber-400',
    sockets: 2,
    baseSell: 1100
  }
};

const ALL_JOBS = ['猛將', '巧匠', '術士', '藥師', '風水師'];
const PHYSICAL_JOBS = ['猛將', '巧匠'];
const MAGIC_JOBS = ['術士', '藥師', '風水師'];

export const STARTER_WEAPONS_BY_JOB = {
  '猛將': {
    id: 'wp_starter_warrior',
    name: '精鐵斬馬刀',
    type: 'weapon',
    tier: 1,
    allowedJobs: ['猛將'],
    atk: 16,
    def: 2,
    hp: 20,
    mp: 0,
    speed: 0,
    sockets: []
  },
  '巧匠': {
    id: 'wp_starter_artisan',
    name: '烏木連發弩',
    type: 'weapon',
    tier: 1,
    allowedJobs: ['巧匠'],
    atk: 15,
    def: 0,
    hp: 0,
    mp: 0,
    speed: 3,
    sockets: []
  },
  '術士': {
    id: 'wp_starter_warlock',
    name: '青竹五行幡',
    type: 'weapon',
    tier: 1,
    allowedJobs: ['術士'],
    atk: 17,
    def: 0,
    hp: 0,
    mp: 20,
    speed: 1,
    sockets: []
  },
  '藥師': {
    id: 'wp_starter_pharmacist',
    name: '百草懸壺杖',
    type: 'weapon',
    tier: 1,
    allowedJobs: ['藥師'],
    atk: 14,
    def: 1,
    hp: 25,
    mp: 20,
    speed: 1,
    sockets: []
  },
  '風水師': {
    id: 'wp_starter_fengshui',
    name: '八卦羅盤鏡',
    type: 'weapon',
    tier: 1,
    allowedJobs: ['風水師'],
    atk: 14,
    def: 2,
    hp: 15,
    mp: 20,
    speed: 2,
    sockets: []
  }
};

export const EQUIPMENT_TEMPLATES = [
  // Tier 1 凡鐵
  { id: 'eq_t1_armor', name: '粗布護身甲', type: 'armor', tier: 1, allowedJobs: ALL_JOBS, atk: 0, def: 7, hp: 45, mp: 0, speed: 0 },
  { id: 'eq_t1_helm', name: '青布武士巾', type: 'helmet', tier: 1, allowedJobs: ALL_JOBS, atk: 2, def: 4, hp: 25, mp: 10, speed: 0 },
  { id: 'eq_t1_shoes', name: '草編疾行履', type: 'shoes', tier: 1, allowedJobs: ALL_JOBS, atk: 0, def: 3, hp: 15, mp: 0, speed: 3 },
  { id: 'eq_t1_acc', name: '銅製護心鏡', type: 'accessory', tier: 1, allowedJobs: ALL_JOBS, atk: 4, def: 3, hp: 20, mp: 10, speed: 1 },

  // Tier 2 精鋼（重甲僅限物理系）
  { id: 'eq_t2_wp_w', name: '百煉破軍槍', type: 'weapon', tier: 2, allowedJobs: ['猛將'], atk: 34, def: 4, hp: 45, mp: 0, speed: 1 },
  { id: 'eq_t2_wp_a', name: '穿楊精鋼弓', type: 'weapon', tier: 2, allowedJobs: ['巧匠'], atk: 32, def: 0, hp: 15, mp: 0, speed: 6 },
  { id: 'eq_t2_wp_m', name: '紫電桃木劍', type: 'weapon', tier: 2, allowedJobs: MAGIC_JOBS, atk: 33, def: 0, hp: 15, mp: 40, speed: 2 },
  { id: 'eq_t2_offhand', name: '玄鐵圓盾', type: 'offhand', tier: 2, allowedJobs: ['猛將', '風水師'], atk: 0, def: 15, hp: 85, mp: 0, speed: 0 },
  { id: 'eq_t2_armor', name: '鎖子連環鎧', type: 'armor', tier: 2, allowedJobs: PHYSICAL_JOBS, atk: 0, def: 16, hp: 95, mp: 15, speed: 0 },
  { id: 'eq_t2_robe_m', name: '雲紋青絲道袍', type: 'armor', tier: 2, allowedJobs: MAGIC_JOBS, atk: 6, def: 11, hp: 70, mp: 45, speed: 2 },
  { id: 'eq_t2_shoes', name: '踏雪無痕靴', type: 'shoes', tier: 2, allowedJobs: ALL_JOBS, atk: 4, def: 6, hp: 35, mp: 10, speed: 6 },

  // Tier 3 玄鐵（重甲禁法系，法系專屬道韻法袍）
  { id: 'eq_t3_wp_w', name: '玄鐵重鋒戟', type: 'weapon', tier: 3, allowedJobs: ['猛將'], atk: 62, def: 8, hp: 90, mp: 0, speed: 2, setId: 'set_xuantie', setName: '玄鐵戰神套' },
  { id: 'eq_t3_wp_a', name: '追星連珠神弩', type: 'weapon', tier: 3, allowedJobs: ['巧匠'], atk: 58, def: 2, hp: 40, mp: 0, speed: 11, setId: 'set_liuxing', setName: '流星追月套' },
  { id: 'eq_t3_wp_m', name: '天師鎮魂法杖', type: 'weapon', tier: 3, allowedJobs: MAGIC_JOBS, atk: 60, def: 3, hp: 45, mp: 80, speed: 4, setId: 'set_tianshi', setName: '天師道韻套' },
  { id: 'eq_t3_armor', name: '玄鐵重鱗甲', type: 'armor', tier: 3, allowedJobs: PHYSICAL_JOBS, atk: 5, def: 28, hp: 180, mp: 30, speed: 1, setId: 'set_xuantie', setName: '玄鐵戰神套' },
  { id: 'eq_t3_helm', name: '星冠道法帽', type: 'helmet', tier: 3, allowedJobs: MAGIC_JOBS, atk: 12, def: 14, hp: 85, mp: 55, speed: 3, setId: 'set_tianshi', setName: '天師道韻套' },
  { id: 'eq_t3_acc', name: '玲瓏七竅玉佩', type: 'accessory', tier: 3, allowedJobs: ALL_JOBS, atk: 18, def: 10, hp: 70, mp: 45, speed: 6, setId: 'set_liuxing', setName: '流星追月套' },

  // Tier 4 靈寶（重鎧限物理系，太極法袍限法系）
  { id: 'eq_t4_wp_w', name: '龍吟霸王斬', type: 'weapon', tier: 4, allowedJobs: ['猛將'], atk: 105, def: 15, hp: 160, mp: 0, speed: 4, setId: 'set_longyin', setName: '真龍降世套' },
  { id: 'eq_t4_wp_a', name: '射日落星神弓', type: 'weapon', tier: 4, allowedJobs: ['巧匠'], atk: 98, def: 5, hp: 80, mp: 0, speed: 18, setId: 'set_longyin', setName: '真龍降世套' },
  { id: 'eq_t4_wp_m', name: '太極陰陽靈寶幡', type: 'weapon', tier: 4, allowedJobs: MAGIC_JOBS, atk: 102, def: 8, hp: 90, mp: 140, speed: 7, setId: 'set_taiji', setName: '太極混元套' },
  { id: 'eq_t4_armor', name: '紫金麒麟重鎧', type: 'armor', tier: 4, allowedJobs: PHYSICAL_JOBS, atk: 14, def: 48, hp: 320, mp: 60, speed: 3, setId: 'set_longyin', setName: '真龍降世套' },
  { id: 'eq_t4_robe_m', name: '太極八卦紫霄袍', type: 'armor', tier: 4, allowedJobs: MAGIC_JOBS, atk: 24, def: 32, hp: 230, mp: 130, speed: 5, setId: 'set_taiji', setName: '太極混元套' },
  { id: 'eq_t4_offhand', name: '河圖洛書寶鑑', type: 'offhand', tier: 4, allowedJobs: ['術士', '藥師', '風水師', '巧匠'], atk: 28, def: 24, hp: 140, mp: 110, speed: 6, setId: 'set_taiji', setName: '太極混元套' },
  { id: 'eq_t4_shoes', name: '御風凌雲仙履', type: 'shoes', tier: 4, allowedJobs: ALL_JOBS, atk: 16, def: 20, hp: 120, mp: 45, speed: 14, setId: 'set_taiji', setName: '太極混元套' },

  // Tier 5 仙器
  { id: 'eq_t5_wp_w', name: '盤古開天戰斧', type: 'weapon', tier: 5, allowedJobs: ['猛將'], atk: 175, def: 28, hp: 280, mp: 0, speed: 7, setId: 'set_xiandi', setName: '太古仙帝套' },
  { id: 'eq_t5_wp_a', name: '后羿誅仙神機弩', type: 'weapon', tier: 5, allowedJobs: ['巧匠'], atk: 165, def: 12, hp: 150, mp: 0, speed: 28, setId: 'set_xiandi', setName: '太古仙帝套' },
  { id: 'eq_t5_wp_m', name: '混沌造化玉牒杖', type: 'weapon', tier: 5, allowedJobs: MAGIC_JOBS, atk: 170, def: 16, hp: 170, mp: 240, speed: 12, setId: 'set_xiandi', setName: '太古仙帝套' },
  { id: 'eq_t5_armor', name: '九天玄女仙蠶衣', type: 'armor', tier: 5, allowedJobs: ALL_JOBS, atk: 30, def: 82, hp: 540, mp: 120, speed: 6, setId: 'set_xiandi', setName: '太古仙帝套' },
  { id: 'eq_t5_acc', name: '東皇太一混沌鐘', type: 'accessory', tier: 5, allowedJobs: ALL_JOBS, atk: 55, def: 42, hp: 260, mp: 150, speed: 15, setId: 'set_xiandi', setName: '太古仙帝套' }
];

const REFINE_STEP_INCREMENTS = [0.10, 0.13, 0.16, 0.19, 0.22, 0.26, 0.30, 0.35, 0.40, 0.45];

export function getNextRefineIncrementPct(currentLevel = 0) {
  const lvl = Math.max(0, Math.floor(currentLevel || 0));
  return lvl < REFINE_STEP_INCREMENTS.length ? REFINE_STEP_INCREMENTS[lvl] : 0.50;
}

export function getCumulativeRefineBonusPct(refineLevel = 0) {
  const lvl = Math.max(0, Math.floor(refineLevel || 0));
  let total = 0;
  for (let i = 0; i < lvl; i++) {
    total += i < REFINE_STEP_INCREMENTS.length ? REFINE_STEP_INCREMENTS[i] : 0.50;
  }
  return Number(total.toFixed(4));
}

export function getRefineSuccessRate(currentLevel = 0) {
  const lvl = Math.max(0, Math.floor(currentLevel || 0));
  return Math.max(0.20, Number((0.90 - lvl * 0.08).toFixed(2)));
}

function extractRawBaseStats(item) {
  const src = item?.stats || item || {};
  return {
    atk: Number(src.atk || 0),
    def: Number(src.def || 0),
    hp: Number(src.hp || 0),
    mp: Number(src.mp || 0),
    speed: Number(src.speed || 0)
  };
}

function extractGemStats(sockets = []) {
  const totals = { atk: 0, def: 0, hp: 0, mp: 0, speed: 0 };
  (sockets || []).forEach(gem => {
    if (!gem) return;
    if (gem.stat && typeof gem.val === 'number') {
      totals[gem.stat] = (totals[gem.stat] || 0) + gem.val;
    } else {
      totals.atk += Number(gem.atk || 0);
      totals.def += Number(gem.def || 0);
      totals.hp += Number(gem.hp || 0);
      totals.mp += Number(gem.mp || 0);
      totals.speed += Number(gem.speed || 0);
    }
  });
  return totals;
}

export function computeSingleEquipmentStats(item) {
  if (!item) {
    return {
      baseStats: { atk: 0, def: 0, hp: 0, mp: 0, speed: 0 },
      refineBonusStats: { atk: 0, def: 0, hp: 0, mp: 0, speed: 0 },
      gemStats: { atk: 0, def: 0, hp: 0, mp: 0, speed: 0 },
      totalStats: { atk: 0, def: 0, hp: 0, mp: 0, speed: 0 },
      refinePct: 0
    };
  }

  const baseStats = extractRawBaseStats(item);
  const refineLevel = Math.max(0, item.refineLevel || 0);
  const refinePct = getCumulativeRefineBonusPct(refineLevel);
  const mult = 1 + refinePct;

  const refinedStats = {
    atk: baseStats.atk > 0 ? Math.floor(baseStats.atk * mult) : 0,
    def: baseStats.def > 0 ? Math.floor(baseStats.def * mult) : 0,
    hp: baseStats.hp > 0 ? Math.floor(baseStats.hp * mult) : 0,
    mp: baseStats.mp > 0 ? Math.floor(baseStats.mp * mult) : 0,
    speed: baseStats.speed > 0 ? Math.floor(baseStats.speed * mult) : 0
  };

  const refineBonusStats = {
    atk: Math.max(0, refinedStats.atk - baseStats.atk),
    def: Math.max(0, refinedStats.def - baseStats.def),
    hp: Math.max(0, refinedStats.hp - baseStats.hp),
    mp: Math.max(0, refinedStats.mp - baseStats.mp),
    speed: Math.max(0, refinedStats.speed - baseStats.speed)
  };

  const gemStats = extractGemStats(item.sockets);

  // 洗鍊副詞條固定加成
  const affix = item.reforgeAffix || {};
  const affixFlat = {
    atk: Number(affix.atk || 0),
    def: Number(affix.def || 0),
    hp: Number(affix.hp || 0),
    mp: Number(affix.mp || 0),
    speed: Number(affix.speed || 0)
  };

  const totalStats = {
    atk: refinedStats.atk + gemStats.atk + affixFlat.atk,
    def: refinedStats.def + gemStats.def + affixFlat.def,
    hp: refinedStats.hp + gemStats.hp + affixFlat.hp,
    mp: refinedStats.mp + gemStats.mp + affixFlat.mp,
    speed: refinedStats.speed + gemStats.speed + affixFlat.speed
  };

  return {
    baseStats,
    refineBonusStats,
    gemStats,
    totalStats,
    refinePct
  };
}

export function enrichEquipmentMeta(item) {
  if (!item) return null;
  const tier = Math.min(5, Math.max(1, item.tier || 1));
  const tMeta = TIER_META[tier] || TIER_META[1];
  const allowedJobs = Array.isArray(item.allowedJobs) && item.allowedJobs.length > 0
    ? item.allowedJobs
    : ALL_JOBS;

  const equipTag = allowedJobs.length >= ALL_JOBS.length
    ? '全職業通用'
    : allowedJobs.length === 2 && allowedJobs.includes('猛將') && allowedJobs.includes('巧匠')
      ? '限物理系（猛將/巧匠）'
      : allowedJobs.length === 3 && allowedJobs.includes('術士') && allowedJobs.includes('藥師')
        ? '限法術系（術/藥/風）'
        : `限：${allowedJobs.join('、')}`;

  const refineLevel = Math.max(0, item.refineLevel || 0);
  const {
    baseStats,
    refineBonusStats,
    gemStats,
    totalStats,
    refinePct
  } = computeSingleEquipmentStats(item);

  const statLabels = [
    { key: 'atk', label: '攻擊' },
    { key: 'def', label: '防禦' },
    { key: 'hp', label: '生命' },
    { key: 'mp', label: '內力' },
    { key: 'speed', label: '速度' }
  ];

  const statParts = [];
  statLabels.forEach(({ key, label }) => {
    const total = totalStats[key];
    if (total > 0) {
      const refAdd = refineBonusStats[key];
      const gemAdd = gemStats[key];
      const subNotes = [];
      if (refAdd > 0) subNotes.push(`+${refAdd}精鍊`);
      if (gemAdd > 0) subNotes.push(`+${gemAdd}寶石`);
      statParts.push(
        subNotes.length > 0
          ? `${label} +${total} (${subNotes.join('、')})`
          : `${label} +${total}`
      );
    }
  });

  if (item.setName) {
    statParts.push(`套裝【${item.setName}】`);
  }

  const sellPrice = tMeta.baseSell + (refineLevel * 45);

  return {
    ...item,
    tier,
    refineLevel,
    allowedJobs,
    equipTag,
    tierTag: tMeta.tag,
    tierBadgeStyle: tMeta.badgeStyle,
    sellPrice,
    refinePct,
    baseStats,
    refineBonusStats,
    gemStats,
    effectiveStats: totalStats,
    desc: statParts.length > 0 ? statParts.join(' • ') : (item.desc || '基礎防具')
  };
}

/**
 * 取得目前全身穿戴裝備的套裝共鳴進度（供裝備頁、角色面板顯性化渲染）
 */
export function getActiveSetBonuses(equipped = {}) {
  const setCounts = {};
  Object.values(equipped || {}).forEach(item => {
    if (item?.setId) {
      setCounts[item.setId] = (setCounts[item.setId] || 0) + 1;
    }
  });

  const activeSets = [];
  Object.entries(setCounts).forEach(([setId, count]) => {
    const cfg = SET_EFFECTS_CONFIG[setId];
    if (!cfg) return;
    const tiers = cfg.bonuses.map(b => ({
      ...b,
      unlocked: count >= b.pieces
    }));
    activeSets.push({
      setId,
      name: cfg.name,
      count,
      maxPieces: cfg.maxPieces,
      tiers,
      hasAnyUnlocked: tiers.some(t => t.unlocked)
    });
  });

  return activeSets;
}

export function calculateEquipmentBonus(equipped = {}) {
  const bonus = { atk: 0, def: 0, hp: 0, mp: 0, speed: 0 };
  const setCounts = {};
  let setAtkPct = 0;
  let setHpPct = 0;
  let setMpPct = 0;
  let setDefPct = 0;

  Object.values(equipped || {}).forEach(item => {
    if (!item) return;
    const { totalStats } = computeSingleEquipmentStats(item);
    bonus.atk += totalStats.atk;
    bonus.def += totalStats.def;
    bonus.hp += totalStats.hp;
    bonus.mp += totalStats.mp;
    bonus.speed += totalStats.speed;

    // 洗鍊百分比詞條
    if (item.reforgeAffix) {
      setAtkPct += Number(item.reforgeAffix.atkPct || 0);
      setDefPct += Number(item.reforgeAffix.defPct || 0);
      setHpPct += Number(item.reforgeAffix.hpPct || 0);
      setMpPct += Number(item.reforgeAffix.mpPct || 0);
    }

    if (item.setId) {
      setCounts[item.setId] = (setCounts[item.setId] || 0) + 1;
    }
  });

  Object.entries(setCounts).forEach(([setId, count]) => {
    const cfg = SET_EFFECTS_CONFIG[setId];
    if (!cfg) return;
    cfg.bonuses.forEach(b => {
      if (count >= b.pieces) {
        setAtkPct += Number(b.atkPct || 0);
        setDefPct += Number(b.defPct || 0);
        setHpPct += Number(b.hpPct || 0);
        setMpPct += Number(b.mpPct || 0);
        bonus.speed += Number(b.speed || 0);
      }
    });
  });

  return { bonus, setAtkPct, setHpPct, setMpPct, setDefPct };
}

export function rollEquipmentFromTierRange(minTier = 1, maxTier = 5, uidPrefix = 'eq') {
  const clampedMin = Math.max(1, Math.min(5, minTier));
  const clampedMax = Math.max(clampedMin, Math.min(5, maxTier));
  const pool = EQUIPMENT_TEMPLATES.filter(e => e.tier >= clampedMin && e.tier <= clampedMax);
  const source = pool.length > 0 ? pool : EQUIPMENT_TEMPLATES;
  const template = source[Math.floor(Math.random() * source.length)];

  const socketCount =
    template.tier >= 4
      ? 2
      : template.tier === 3
        ? (Math.random() < 0.5 ? 2 : 1)
        : template.tier === 2
          ? 1
          : 0;

  return {
    ...template,
    uid: `${uidPrefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    refineLevel: 0,
    sockets: Array(socketCount).fill(null),
    reforgeAffix: null
  };
}
