// ==========================================
// 1. FIVE TIERS CONFIG (5階層英雄設定)
// ==========================================
export const TIER_CONFIG = {
  1: { 
    name: '無名雜兵', 
    badge: 'Tier 1', 
    color: 'border-slate-600 bg-slate-900 text-slate-300', 
    tagColor: 'bg-slate-700 text-slate-200', 
    pointPool: 10 
  },
  2: { 
    name: '鄉野豪傑', 
    badge: 'Tier 2', 
    color: 'border-emerald-600/80 bg-emerald-950/40 text-emerald-300', 
    tagColor: 'bg-emerald-800 text-emerald-100', 
    pointPool: 22 
  },
  3: { 
    name: '名城猛將', 
    badge: 'Tier 3', 
    color: 'border-blue-600/80 bg-blue-950/40 text-blue-300', 
    tagColor: 'bg-blue-800 text-blue-100', 
    pointPool: 38 
  },
  4: { 
    name: '無雙英豪', 
    badge: 'Tier 4', 
    color: 'border-purple-600/80 bg-purple-950/40 text-purple-300', 
    tagColor: 'bg-purple-800 text-purple-100', 
    pointPool: 60 
  },
  5: { 
    name: '神話天仙', 
    badge: 'Tier 5', 
    color: 'border-amber-400 bg-amber-950/60 text-amber-300 ring-2 ring-amber-400/40 shadow-amber-500/20 shadow-lg', 
    tagColor: 'bg-gradient-to-r from-amber-500 to-red-500 text-slate-950 font-black', 
    pointPool: 90 
  }
};

// ==========================================
// 2. HERO CLASS GROWTH WEIGHTS (職業成長配點權重)
// ==========================================
export const HERO_CLASS_GROWTH_WEIGHTS = {
  '猛將': { str: 0.50, con: 0.40, int: 0.00, agi: 0.10 },
  '術士': { str: 0.00, con: 0.20, int: 0.60, agi: 0.20 },
  '藥師': { str: 0.00, con: 0.35, int: 0.50, agi: 0.15 },
  '巧匠': { str: 0.30, con: 0.20, int: 0.00, agi: 0.50 },
  '風水師': { str: 0.00, con: 0.20, int: 0.45, agi: 0.35 }
};

// ==========================================
// 3. INNATE SKILLS DATABASE (英雄天生絕學庫)
// ==========================================
export const INNATE_SKILLS_DB = {
  't2_liaohua': { name: '先鋒破陣槍', type: 'active', damageMultiplier: 2.0, desc: '【天生絕學】先鋒槍刺穿敵陣，造成 2.0x 物理傷。' },
  't2_panfeng': { name: '無雙巨斧斬', type: 'active', damageMultiplier: 2.2, desc: '【天生絕學】劈山巨斧重擊，造成 2.2x 重傷。' },
  't3_weiyan': { name: '狂骨烈焰斬', type: 'active', damageMultiplier: 2.6, desc: '【天生絕學】狂暴猛擊，造成 2.6x 烈焰傷。' },
  't4_guanyu': { name: '青龍偃月斬', type: 'active', damageMultiplier: 3.4, desc: '【天生絕學】武聖青龍出海，造成 3.4x 毀滅斬殺！' },
  't4_zhuge': { name: '臥龍八陣圖', type: 'active', damageMultiplier: 2.4, desc: '【天生絕學】掌八卦雷陣，全體敵怪 2.4x 法傷。' },
  't4_zhaoyun': { name: '七進七出', type: 'active', damageMultiplier: 3.0, desc: '【天生絕學】子龍槍如驚雷，造成 3.0x 貫穿傷。' },
  't4_huatuo': { name: '青囊妙手', type: 'active', damageMultiplier: 2.8, desc: '【天生絕學】神醫回春妙手，全隊恢復 2.8x HP。' },
  't5_wukong': { name: '大鬧天宮', type: 'active', damageMultiplier: 3.8, desc: '【天生絕學】美猴王金箍棒全場 3.8x 掃蕩爆發！' },
  't5_nezha': { name: '三頭六臂', type: 'active', damageMultiplier: 3.6, desc: '【天生絕學】乾坤圈與火尖槍全體爆發 3.6x 火焰法傷！' }
};

// ==========================================
// 4. HERO TEMPLATES (英雄卡片模板庫 - 隨時在此增加新卡)
// ==========================================
export const HERO_TEMPLATES = [
  // Tier 1 雜兵 (起步 3 選 1 英雄)
  { id_base: 't1_warrior', name: '鄉勇勇士', title: '民兵志願軍', tier: 1, heroClass: '猛將', icon: '🧑‍🌾', desc: '地方鄉勇志願軍。' },
  { id_base: 't1_mage', name: '巡邏丁卒', title: '山林丁卒', tier: 1, heroClass: '巧匠', icon: '🪓', desc: '山林巡邏隊員。' },
  { id_base: 't1_healer', name: '采藥童子', title: '草醫學徒', tier: 1, heroClass: '藥師', icon: '🌱', desc: '山間採藥學徒。' },
  
  // Tier 2 豪傑
  { id_base: 't2_liaohua', name: '廖化', title: '蜀漢先鋒', tier: 2, heroClass: '猛將', icon: '🛡️', desc: '「蜀中無大將，廖化作先鋒。」' },
  { id_base: 't2_panfeng', name: '潘鳳', title: '無雙上將', tier: 2, heroClass: '猛將', icon: '🪓', desc: '手提百斤巨斧之豪傑。' },
  
  // Tier 3 名將
  { id_base: 't3_weiyan', name: '魏延', title: '長沙狂骨', tier: 3, heroClass: '猛將', icon: '🗡️', desc: '勇冠三軍之狂傲名將。' },
  
  // Tier 4 英豪
  { id_base: 't4_guanyu', name: '關羽', title: '美髯武聖', tier: 4, heroClass: '猛將', icon: '🧔', desc: '威震華夏，青龍刀出無人能擋！' },
  { id_base: 't4_zhuge', name: '諸葛亮', title: '臥龍先生', tier: 4, heroClass: '術士', icon: '🪶', desc: '借東風掌八陣圖之絕代謀聖。' },
  { id_base: 't4_zhaoyun', name: '趙雲', title: '常山趙子龍', tier: 4, heroClass: '巧匠', icon: '⚡', desc: '七進七出長坂坡，槍如驚雷。' },
  { id_base: 't4_huatuo', name: '華佗', title: '神醫青囊', tier: 4, heroClass: '藥師', icon: '💊', desc: '青囊妙手回春拯救蒼生。' },
  
  // Tier 5 神話
  { id_base: 't5_wukong', name: '齊天大聖', title: '美猴王孫悟空', tier: 5, heroClass: '猛將', icon: '🐒', desc: '大鬧天宮，金箍棒力掃千軍萬馬！' },
  { id_base: 't5_nezha', name: '中壇元帥', title: '蓮花化身哪吒', tier: 5, heroClass: '術士', icon: '🔥', desc: '腳踏風火輪，三頭六臂鎮壓三界邪祟！' }
];

// ==========================================
// 5. HERO INSTANTIATION FUNCTION (實體化生成英雄)
// ==========================================
export function instantiateHero(template, randomElem = true, overrideElem = null, getRandomElementFn = null) {
  const tier = template.tier || 1;
  const tierInfo = TIER_CONFIG[tier];
  const classInfo = HERO_CLASS_GROWTH_WEIGHTS[template.heroClass] || HERO_CLASS_GROWTH_WEIGHTS['猛將'];
  
  const totalPoints = tierInfo.pointPool;
  let str = 2 + Math.floor((totalPoints * classInfo.str));
  let con = 2 + Math.floor((totalPoints * classInfo.con));
  let int = 2 + Math.floor((totalPoints * classInfo.int));
  let agi = 2 + Math.floor((totalPoints * classInfo.agi));

  const maxHp = 130 + (tier * 45) + (con * 16);
  const atk = 16 + (tier * 11) + (str * 3) + (int * 2);
  const def = 5 + (tier * 4) + (con * 1);
  const speed = 10 + (tier * 2) + (agi * 2);

  const instanceId = `${template.id_base}_${Date.now()}_${Math.floor(Math.random()*1000)}`;
  const innateSkill = tier >= 2 ? (INNATE_SKILLS_DB[template.id_base] || null) : null;
  
  // 隨機或指定五行屬性 (預設：金)
  let assignedElement = '金';
  if (overrideElem) {
    assignedElement = overrideElem;
  } else if (randomElem && getRandomElementFn) {
    assignedElement = getRandomElementFn();
  }

  return {
    instanceId,
    baseId: template.id_base,
    name: template.name,
    title: template.title,
    tier,
    heroClass: template.heroClass,
    element: assignedElement,
    level: 1,
    exp: 0,
    maxExp: 100,
    hp: maxHp,
    maxHp: maxHp,
    atk,
    def,
    speed,
    fatigue: 0,
    stats: { str, con, int, agi },
    innateSkill,
    icon: template.icon,
    desc: template.desc
  };
}
