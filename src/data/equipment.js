export const EQUIP_SLOTS = [
  { key: 'weapon', label: '主手武器', icon: '⚔️' },
  { key: 'offhand', label: '副手防具/法器', icon: '🛡️' },
  { key: 'helmet', label: '頭冠', icon: '🪖' },
  { key: 'armor', label: '戰甲/道袍', icon: '🥋' },
  { key: 'shoes', label: '戰靴', icon: '👢' },
  { key: 'accessory', label: '飾品/佩玉', icon: '📿' }
];

export const EQUIP_TIER_META = {
  1: {
    tier: 1,
    tag: 'T1 凡鐵',
    badgeStyle: 'bg-slate-800 text-slate-200 border-slate-600',
    baseSell: 45
  },
  2: {
    tier: 2,
    tag: 'T2 精鋼',
    badgeStyle: 'bg-emerald-950 text-emerald-300 border-emerald-700',
    baseSell: 110
  },
  3: {
    tier: 3,
    tag: 'T3 玄鐵',
    badgeStyle: 'bg-sky-950 text-sky-300 border-sky-700',
    baseSell: 240
  },
  4: {
    tier: 4,
    tag: 'T4 靈寶',
    badgeStyle: 'bg-purple-950 text-purple-300 border-purple-700',
    baseSell: 480
  },
  5: {
    tier: 5,
    tag: 'T5 仙器',
    badgeStyle: 'bg-amber-950 text-amber-300 border-amber-500',
    baseSell: 950
  }
};

export const GEMS_DB = [
  { id: 'gem_ruby', name: '赤炎紅寶石 (+15攻)', atk: 15, def: 0, hp: 0, mp: 0, speed: 0 },
  { id: 'gem_sapphire', name: '滄海藍寶石 (+30內)', atk: 0, def: 0, hp: 0, mp: 30, speed: 0 },
  { id: 'gem_emerald', name: '青木翡翠 (+80血)', atk: 0, def: 0, hp: 80, mp: 0, speed: 0 },
  { id: 'gem_topaz', name: '玄武黃玉 (+10防)', atk: 0, def: 10, hp: 0, mp: 0, speed: 0 }
];

const ALL_JOBS = ['猛將', '巧匠', '術士', '藥師', '風水師'];

// 五大職業專屬 Tier 1 新手武器（創角開局直接裝備）
export const STARTER_WEAPONS_BY_JOB = {
  '猛將': {
    id: 'start_w_warrior',
    name: '粗鐵重劍',
    type: 'weapon',
    tier: 1,
    atk: 12,
    hp: 20,
    allowedJobs: ['猛將'],
    sockets: [],
    desc: '【T1 凡鐵】猛將入門重劍（攻擊 +12，生命 +20）'
  },
  '巧匠': {
    id: 'start_w_artisan',
    name: '獵戶木弓',
    type: 'weapon',
    tier: 1,
    atk: 12,
    speed: 2,
    allowedJobs: ['巧匠'],
    sockets: [],
    desc: '【T1 凡鐵】巧匠入門長弓（攻擊 +12，速度 +2）'
  },
  '術士': {
    id: 'start_w_warlock',
    name: '桃木法杖',
    type: 'weapon',
    tier: 1,
    atk: 13,
    mp: 20,
    allowedJobs: ['術士'],
    sockets: [],
    desc: '【T1 凡鐵】術士入門法杖（攻擊 +13，最大MP +20）'
  },
  '藥師': {
    id: 'start_w_apothecary',
    name: '採藥短刃',
    type: 'weapon',
    tier: 1,
    atk: 11,
    hp: 15,
    mp: 15,
    allowedJobs: ['藥師'],
    sockets: [],
    desc: '【T1 凡鐵】藥師入門短刃（攻擊 +11，生命 +15，MP +15）'
  },
  '風水師': {
    id: 'start_w_fengshui',
    name: '青銅羅盤劍',
    type: 'weapon',
    tier: 1,
    atk: 11,
    speed: 2,
    mp: 15,
    allowedJobs: ['風水師'],
    sockets: [],
    desc: '【T1 凡鐵】風水師入門法劍（攻擊 +11，速度 +2，MP +15）'
  }
};

export const ITEM_DROP_POOL = [
  // ================= Tier 1：凡鐵（入門） =================
  { id: 't1_helm', name: '麻布頭巾', type: 'helmet', tier: 1, def: 4, hp: 30, allowedJobs: ALL_JOBS, sockets: [], desc: '【T1 凡鐵】防禦 +4，生命 +30' },
  { id: 't1_armor', name: '粗布短衫', type: 'armor', tier: 1, def: 6, hp: 45, allowedJobs: ALL_JOBS, sockets: [], desc: '【T1 凡鐵】防禦 +6，生命 +45' },
  { id: 't1_shoes', name: '草編行旅鞋', type: 'shoes', tier: 1, def: 3, speed: 3, allowedJobs: ALL_JOBS, sockets: [], desc: '【T1 凡鐵】防禦 +3，速度 +3' },
  { id: 't1_acc', name: '平安紅繩結', type: 'accessory', tier: 1, atk: 5, hp: 25, allowedJobs: ALL_JOBS, sockets: [], desc: '【T1 凡鐵】攻擊 +5，生命 +25' },
  { id: 't1_off', name: '木製圓盾', type: 'offhand', tier: 1, def: 7, hp: 35, allowedJobs: ['猛將', '藥師', '風水師'], sockets: [], desc: '【T1 凡鐵】防禦 +7，生命 +35' },

  // ================= Tier 2：精鋼（進階） =================
  { id: 't2_w_war', name: '百煉精鋼刀', type: 'weapon', tier: 2, atk: 28, hp: 50, allowedJobs: ['猛將'], sockets: [null], desc: '【T2 精鋼】攻擊 +28，生命 +50（1孔）' },
  { id: 't2_w_art', name: '穿楊硬木弩', type: 'weapon', tier: 2, atk: 27, speed: 5, allowedJobs: ['巧匠'], sockets: [null], desc: '【T2 精鋼】攻擊 +27，速度 +5（1孔）' },
  { id: 't2_w_mag', name: '翠竹靈紋杖', type: 'weapon', tier: 2, atk: 30, mp: 45, allowedJobs: ['術士', '藥師', '風水師'], sockets: [null], desc: '【T2 精鋼】攻擊 +30，最大MP +45（1孔）' },
  { id: 't2_off', name: '精鋼護手盾', type: 'offhand', tier: 2, def: 15, hp: 80, allowedJobs: ['猛將', '巧匠'], sockets: [null], desc: '【T2 精鋼】防禦 +15，生命 +80（1孔）' },
  { id: 't2_off_mag', name: '八卦青銅鏡', type: 'offhand', tier: 2, atk: 12, mp: 40, def: 8, allowedJobs: ['術士', '藥師', '風水師'], sockets: [null], desc: '【T2 精鋼】攻擊 +12，防禦 +8，MP +40（1孔）' },
  { id: 't2_helm', name: '鐵葉護額冠', type: 'helmet', tier: 2, def: 11, hp: 75, allowedJobs: ALL_JOBS, sockets: [null], desc: '【T2 精鋼】防禦 +11，生命 +75（1孔）' },
  { id: 't2_armor', name: '熟皮鎖子甲', type: 'armor', tier: 2, def: 16, hp: 110, allowedJobs: ALL_JOBS, sockets: [null], desc: '【T2 精鋼】防禦 +16，生命 +110（1孔）' },
  { id: 't2_shoes', name: '疾風快步靴', type: 'shoes', tier: 2, def: 8, speed: 7, allowedJobs: ALL_JOBS, sockets: [null], desc: '【T2 精鋼】防禦 +8，速度 +7（1孔）' },
  { id: 't2_acc', name: '清心白玉佩', type: 'accessory', tier: 2, atk: 14, mp: 35, speed: 3, allowedJobs: ALL_JOBS, sockets: [null], desc: '【T2 精鋼】攻擊 +14，MP +35，速度 +3（1孔）' },

  // ================= Tier 3：玄鐵（名器） =================
  { id: 't3_w_war', name: '玄鐵破軍戟', type: 'weapon', tier: 3, atk: 55, def: 12, hp: 120, setId: 'huben', allowedJobs: ['猛將'], sockets: [null, null], desc: '【T3 玄鐵・虎賁】攻擊 +55，防禦 +12，生命 +120（2孔）' },
  { id: 't3_w_art', name: '追星連珠弓', type: 'weapon', tier: 3, atk: 54, speed: 11, setId: 'zhuifeng', allowedJobs: ['巧匠'], sockets: [null, null], desc: '【T3 玄鐵・追風】攻擊 +54，速度 +11（2孔）' },
  { id: 't3_w_mag', name: '紫電天師幡', type: 'weapon', tier: 3, atk: 58, mp: 90, setId: 'tianji', allowedJobs: ['術士', '風水師'], sockets: [null, null], desc: '【T3 玄鐵・天機】攻擊 +58，最大MP +90（2孔）' },
  { id: 't3_w_apo', name: '百草神農鼎', type: 'weapon', tier: 3, atk: 50, hp: 140, mp: 80, setId: 'tianji', allowedJobs: ['藥師'], sockets: [null, null], desc: '【T3 玄鐵・天機】攻擊 +50，生命 +140，MP +80（2孔）' },
  { id: 't3_off', name: '玄鐵獅頭盾', type: 'offhand', tier: 3, def: 30, hp: 180, setId: 'huben', allowedJobs: ['猛將'], sockets: [null], desc: '【T3 玄鐵・虎賁】防禦 +30，生命 +180（1孔）' },
  { id: 't3_off_all', name: '天機星象盤', type: 'offhand', tier: 3, atk: 24, mp: 75, speed: 6, setId: 'tianji', allowedJobs: ['巧匠', '術士', '藥師', '風水師'], sockets: [null], desc: '【T3 玄鐵・天機】攻擊 +24，MP +75，速度 +6（1孔）' },
  { id: 't3_helm', name: '玄鐵龍鱗盔', type: 'helmet', tier: 3, def: 22, hp: 160, setId: 'huben', allowedJobs: ALL_JOBS, sockets: [null], desc: '【T3 玄鐵・虎賁】防禦 +22，生命 +160（1孔）' },
  { id: 't3_armor', name: '流雲玄鐵戰袍', type: 'armor', tier: 3, def: 32, hp: 230, setId: 'zhuifeng', allowedJobs: ALL_JOBS, sockets: [null, null], desc: '【T3 玄鐵・追風】防禦 +32，生命 +230（2孔）' },
  { id: 't3_shoes', name: '踏雪無痕靴', type: 'shoes', tier: 3, def: 16, speed: 14, setId: 'zhuifeng', allowedJobs: ALL_JOBS, sockets: [null], desc: '【T3 玄鐵・追風】防禦 +16，速度 +14（1孔）' },
  { id: 't3_acc', name: '龍血玲瓏玉', type: 'accessory', tier: 3, atk: 28, hp: 110, mp: 60, allowedJobs: ALL_JOBS, sockets: [null], desc: '【T3 玄鐵】攻擊 +28，生命 +110，MP +60（1孔）' },

  // ================= Tier 4：靈寶（神兵） =================
  { id: 't4_w_war', name: '赤霄屠龍重劍', type: 'weapon', tier: 4, atk: 95, def: 22, hp: 240, setId: 'huben', allowedJobs: ['猛將'], sockets: [null, null], desc: '【T4 靈寶・虎賁】攻擊 +95，防禦 +22，生命 +240（2孔）' },
  { id: 't4_w_art', name: '落日神羿長弓', type: 'weapon', tier: 4, atk: 92, speed: 18, setId: 'zhuifeng', allowedJobs: ['巧匠'], sockets: [null, null], desc: '【T4 靈寶・追風】攻擊 +92，速度 +18（2孔）' },
  { id: 't4_w_mag', name: '太乙混元法杖', type: 'weapon', tier: 4, atk: 98, mp: 150, setId: 'tianji', allowedJobs: ['術士', '藥師', '風水師'], sockets: [null, null], desc: '【T4 靈寶・天機】攻擊 +98，最大MP +150（2孔）' },
  { id: 't4_armor', name: '紫金麒麟寶甲', type: 'armor', tier: 4, def: 56, hp: 420, setId: 'huben', allowedJobs: ALL_JOBS, sockets: [null, null], desc: '【T4 靈寶・虎賁】防禦 +56，生命 +420（2孔）' },
  { id: 't4_helm', name: '通天紫金冠', type: 'helmet', tier: 4, def: 38, hp: 280, mp: 90, setId: 'tianji', allowedJobs: ALL_JOBS, sockets: [null, null], desc: '【T4 靈寶・天機】防禦 +38，生命 +280，MP +90（2孔）' },
  { id: 't4_shoes', name: '御風九霄履', type: 'shoes', tier: 4, def: 28, speed: 22, hp: 180, setId: 'zhuifeng', allowedJobs: ALL_JOBS, sockets: [null, null], desc: '【T4 靈寶・追風】防禦 +28，速度 +22，生命 +180（2孔）' },
  { id: 't4_acc', name: '九竅玲瓏心佩', type: 'accessory', tier: 4, atk: 48, def: 20, hp: 200, mp: 100, allowedJobs: ALL_JOBS, sockets: [null, null], desc: '【T4 靈寶】攻擊 +48，防禦 +20，生命 +200，MP +100（2孔）' },

  // ================= Tier 5：仙器（傳奇） =================
  { id: 't5_w_war', name: '軒轅開天聖劍', type: 'weapon', tier: 5, atk: 155, def: 40, hp: 450, setId: 'xianqi', allowedJobs: ['猛將'], sockets: [null, null], desc: '【T5 仙器・太古】攻擊 +155，防禦 +40，生命 +450（2孔）' },
  { id: 't5_w_art', name: '射日九烏神弓', type: 'weapon', tier: 5, atk: 150, speed: 30, hp: 280, setId: 'xianqi', allowedJobs: ['巧匠'], sockets: [null, null], desc: '【T5 仙器・太古】攻擊 +150，速度 +30，生命 +280（2孔）' },
  { id: 't5_w_mag', name: '混沌造化玉如意', type: 'weapon', tier: 5, atk: 160, mp: 260, hp: 300, setId: 'xianqi', allowedJobs: ['術士', '藥師', '風水師'], sockets: [null, null], desc: '【T5 仙器・太古】攻擊 +160，最大MP +260，生命 +300（2孔）' },
  { id: 't5_armor', name: '九天玄女仙衣', type: 'armor', tier: 5, def: 90, hp: 720, mp: 180, setId: 'xianqi', allowedJobs: ALL_JOBS, sockets: [null, null], desc: '【T5 仙器・太古】防禦 +90，生命 +720，MP +180（2孔）' },
  { id: 't5_acc', name: '河圖洛書仙璽', type: 'accessory', tier: 5, atk: 80, def: 35, hp: 360, mp: 180, speed: 15, setId: 'xianqi', allowedJobs: ALL_JOBS, sockets: [null, null], desc: '【T5 仙器・太古】攻+80，防+35，血+360，MP+180，速+15（2孔）' }
];

/**
 * 補齊裝備階級、職業限制標籤與賣出價格（兼容舊存檔無 tier 欄位的裝備）
 */
export function enrichEquipmentMeta(item) {
  if (!item) return null;
  const inferredTier = item.tier || (
    (item.atk || 0) >= 130 || (item.def || 0) >= 80 ? 5 :
    (item.atk || 0) >= 80 || (item.def || 0) >= 45 ? 4 :
    (item.atk || 0) >= 45 || (item.def || 0) >= 20 ? 3 :
    (item.atk || 0) >= 20 || (item.def || 0) >= 10 ? 2 : 1
  );
  const tierMeta = EQUIP_TIER_META[inferredTier] || EQUIP_TIER_META[1];
  const allowedJobs = Array.isArray(item.allowedJobs) && item.allowedJobs.length > 0
    ? item.allowedJobs
    : ALL_JOBS;
  const equipTag = allowedJobs.length >= 5 ? '全職業通用' : `限：${allowedJobs.join('、')}`;
  const refineBonusSell = (item.refineLevel || 0) * 60;

  return {
    ...item,
    tier: inferredTier,
    tierTag: tierMeta.tag,
    tierBadgeStyle: tierMeta.badgeStyle,
    allowedJobs,
    equipTag,
    sellPrice: tierMeta.baseSell + refineBonusSell
  };
}

/**
 * 依指定 Tier 區間隨機抽取並生成一件實例化裝備
 */
export function rollEquipmentFromTierRange(minTier = 1, maxTier = 5, uidPrefix = 'eq') {
  const candidates = ITEM_DROP_POOL.filter(i => i.tier >= minTier && i.tier <= maxTier);
  const pool = candidates.length > 0 ? candidates : ITEM_DROP_POOL;
  const template = pool[Math.floor(Math.random() * pool.length)];
  return {
    ...template,
    sockets: Array.isArray(template.sockets) ? [...template.sockets] : [],
    refineLevel: 0,
    uid: `${uidPrefix}_${Date.now()}_${Math.random()}`
  };
}

/**
 * 計算身上六大部位裝備總加成（含精鍊倍率、寶石鑲嵌與套裝共鳴）
 */
export function calculateEquipmentBonus(equipped = {}) {
  const bonus = { atk: 0, def: 0, hp: 0, mp: 0, speed: 0 };
  const setCounts = {};

  Object.values(equipped).forEach(item => {
    if (!item) return;
    const refineMult = 1 + ((item.refineLevel || 0) * 0.15);
    bonus.atk += Math.floor((item.atk || 0) * refineMult);
    bonus.def += Math.floor((item.def || 0) * refineMult);
    bonus.hp += Math.floor((item.hp || 0) * refineMult);
    bonus.mp += Math.floor((item.mp || 0) * refineMult);
    bonus.speed += Math.floor((item.speed || 0) * refineMult);

    if (Array.isArray(item.sockets)) {
      item.sockets.forEach(gem => {
        if (!gem) return;
        bonus.atk += gem.atk || 0;
        bonus.def += gem.def || 0;
        bonus.hp += gem.hp || 0;
        bonus.mp += gem.mp || 0;
        bonus.speed += gem.speed || 0;
      });
    }

    if (item.setId) {
      setCounts[item.setId] = (setCounts[item.setId] || 0) + 1;
    }
  });

  let setAtkPct = 0;
  let setHpPct = 0;
  let setMpPct = 0;
  let setDefPct = 0;

  if ((setCounts.huben || 0) >= 2) { setHpPct += 0.10; setDefPct += 0.08; }
  if ((setCounts.zhuifeng || 0) >= 2) { setAtkPct += 0.08; }
  if ((setCounts.tianji || 0) >= 2) { setAtkPct += 0.08; setMpPct += 0.12; }
  if ((setCounts.xianqi || 0) >= 2) { setAtkPct += 0.15; setHpPct += 0.15; setDefPct += 0.12; }

  return { bonus, setAtkPct, setHpPct, setMpPct, setDefPct };
}
