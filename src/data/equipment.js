// ==========================================
// 1. 6大裝備部位定義 (EQUIPMENT SLOTS)
// ==========================================
export const EQUIP_SLOTS = [
  { key: 'weapon', label: '主手武器', icon: '⚔️' },
  { key: 'offhand', label: '副手護盾', icon: '🛡️' },
  { key: 'helmet', label: '頭盔防具', icon: '🪖' },
  { key: 'armor', label: '胸甲戰袍', icon: '👕' },
  { key: 'shoes', label: '鞋子戰靴', icon: '👟' },
  { key: 'accessory', label: '飾品寶戒', icon: '💍' }
];

// ==========================================
// 2. 套裝效果資料庫 (EQUIPMENT SETS)
// ==========================================
export const EQUIP_SETS_DB = {
  'set_qinglong': {
    name: '【青龍猛將套裝】',
    bonus2: { atkPct: 0.15 },
    bonus4: { atkPct: 0.25, hpPct: 0.20 },
    bonus6: { atkPct: 0.40, hpPct: 0.30, critPct: 0.15 },
    desc: '2件: 物攻+15% | 4件: 物攻+25%, HP+20% | 6件: 物攻+40%, HP+30%, 暴擊+15%'
  },
  'set_zhuque': {
    name: '【朱雀法皇套裝】',
    bonus2: { mpPct: 0.20 },
    bonus4: { mpPct: 0.35, elemDmgPct: 0.20 },
    bonus6: { mpPct: 0.50, elemDmgPct: 0.40, speedPct: 0.20 },
    desc: '2件: MP+20% | 4件: MP+35%, 法傷+20% | 6件: MP+50%, 法傷+40%, 速度+20%'
  },
  'set_xuanwu': {
    name: '【玄武鐵衛套裝】',
    bonus2: { defPct: 0.20 },
    bonus4: { defPct: 0.35, hpPct: 0.25 },
    bonus6: { defPct: 0.60, hpPct: 0.40, blockPct: 0.20 },
    desc: '2件: 護甲+20% | 4件: 護甲+35%, HP+25% | 6件: 護甲+60%, HP+40%, 格擋+20%'
  }
};

// ==========================================
// 3. 寶石資料庫 (GEMS DATABASE)
// ==========================================
export const GEMS_DB = [
  { 
    id: 'gem_ruby', 
    name: '紅寶石 (生命)', 
    bonusText: 'HP +150', 
    bonus: { hp: 150 }, 
    color: 'text-red-400 bg-red-950 border-red-500' 
  },
  { 
    id: 'gem_topaz', 
    name: '黃寶石 (力量)', 
    bonusText: '物攻 +20', 
    bonus: { atk: 20 }, 
    color: 'text-amber-400 bg-amber-950 border-amber-500' 
  },
  { 
    id: 'gem_sapphire', 
    name: '藍寶石 (智慧)', 
    bonusText: 'MP +80 & 法攻 +12', 
    bonus: { mp: 80, atk: 12 }, 
    color: 'text-cyan-400 bg-cyan-950 border-cyan-500' 
  },
  { 
    id: 'gem_emerald', 
    name: '綠寶石 (敏捷)', 
    bonusText: '速度 +15', 
    bonus: { speed: 15 }, 
    color: 'text-emerald-400 bg-emerald-950 border-emerald-500' 
  }
];

// ==========================================
// 4. 裝備掉落與範本庫 (ITEM DROP POOL)
// ==========================================
export const ITEM_DROP_POOL = [
  // 武器 (weapon)
  { id: 'eq_w1', name: '精鋼長劍', type: 'weapon', setKey: 'set_qinglong', bonus: { atk: 22 }, rarity: 'common', sockets: [null, null], desc: '普通精鋼兵刃。' },
  { id: 'eq_w2', name: '青龍偃月刀', type: 'weapon', setKey: 'set_qinglong', bonus: { atk: 58, hp: 130 }, rarity: 'epic', sockets: [null, null], desc: '散發青龍寒氣的神兵。' },
  { id: 'eq_w3', name: '朱雀羽扇', type: 'weapon', setKey: 'set_zhuque', bonus: { atk: 45, mp: 120 }, rarity: 'epic', sockets: [null, null], desc: '附帶熾熱火靈力的法扇。' },

  // 副手 (offhand)
  { id: 'eq_o1', name: '藤木盾', type: 'offhand', setKey: 'set_qinglong', bonus: { def: 14, hp: 90 }, rarity: 'common', sockets: [null], desc: '防護盾牌。' },
  { id: 'eq_o2', name: '玄武鐵壁盾', type: 'offhand', setKey: 'set_xuanwu', bonus: { def: 42, hp: 200 }, rarity: 'epic', sockets: [null, null], desc: '如玄武般堅不可摧的神盾。' },

  // 頭盔 (helmet)
  { id: 'eq_h1', name: '紫金盔', type: 'helmet', setKey: 'set_qinglong', bonus: { def: 16, hp: 110 }, rarity: 'rare', sockets: [null], desc: '堅固頭盔。' },
  { id: 'eq_h2', name: '鳳凰羽冠', type: 'helmet', setKey: 'set_zhuque', bonus: { def: 20, mp: 140 }, rarity: 'rare', sockets: [null], desc: '編織鳳羽的精緻頭冠。' },

  // 胸甲 (armor)
  { id: 'eq_a1', name: '朱雀法袍', type: 'armor', setKey: 'set_zhuque', bonus: { def: 22, mp: 160 }, rarity: 'epic', sockets: [null, null], desc: '織入朱雀羽毛的神法袍。' },
  { id: 'eq_a2', name: '青龍戰甲', type: 'armor', setKey: 'set_qinglong', bonus: { def: 35, hp: 180 }, rarity: 'epic', sockets: [null, null], desc: '雕刻青龍紋路的重型戰甲。' },

  // 鞋子 (shoes)
  { id: 'eq_s1', name: '疾風靴', type: 'shoes', setKey: 'set_zhuque', bonus: { speed: 16, def: 9 }, rarity: 'rare', sockets: [null], desc: '輕靈皮靴。' },
  { id: 'eq_s2', name: '追風戰靴', type: 'shoes', setKey: 'set_qinglong', bonus: { speed: 25, atk: 15 }, rarity: 'rare', sockets: [null], desc: '提升移動速度與刺殺爆發力。' },

  // 飾品 (accessory)
  { id: 'eq_r1', name: '乾坤戒', type: 'accessory', setKey: 'set_zhuque', bonus: { speed: 14, atk: 20, mp: 100 }, rarity: 'rare', sockets: [null, null], desc: '仙氣戒指。' },
  { id: 'eq_r2', name: '龍威玉佩', type: 'accessory', setKey: 'set_qinglong', bonus: { atk: 30, hp: 150 }, rarity: 'epic', sockets: [null, null], desc: '蘊含龍威之佩飾。' }
];

// ==========================================
// 5. 裝備加成與套裝計算函式 (HELPERS)
// ==========================================
/**
 * 計算角色當前穿戴所有裝備的屬性加成與套裝加成
 * @param {Object} equipped - 玩家目前的裝備物件 { weapon: item, armor: item, ... }
 */
export function calculateEquipmentBonus(equipped) {
  let bonus = { atk: 0, def: 0, hp: 0, mp: 0, speed: 0 };
  let setCounts = {};

  Object.values(equipped).forEach(item => {
    if (item) {
      // 每精鍊 +1 級，基礎屬性提升 15%
      const mult = 1 + ((item.refineLevel || 0) * 0.15);
      
      if (item.bonus.atk) bonus.atk += Math.floor(item.bonus.atk * mult);
      if (item.bonus.def) bonus.def += Math.floor(item.bonus.def * mult);
      if (item.bonus.hp) bonus.hp += Math.floor(item.bonus.hp * mult);
      if (item.bonus.mp) bonus.mp += Math.floor(item.bonus.mp * mult);
      if (item.bonus.speed) bonus.speed += Math.floor(item.bonus.speed * mult);

      // 寶石插槽屬性累加
      if (item.sockets) {
        item.sockets.forEach(gem => {
          if (gem && gem.bonus) {
            if (gem.bonus.atk) bonus.atk += gem.bonus.atk;
            if (gem.bonus.hp) bonus.hp += gem.bonus.hp;
            if (gem.bonus.mp) bonus.mp += gem.bonus.mp;
            if (gem.bonus.def) bonus.def += gem.bonus.def;
            if (gem.bonus.speed) bonus.speed += gem.bonus.speed;
          }
        });
      }

      // 統計套裝數量
      if (item.setKey) {
        setCounts[item.setKey] = (setCounts[item.setKey] || 0) + 1;
      }
    }
  });

  // 計算套裝%數百分比加成
  let setAtkPct = 0, setHpPct = 0, setMpPct = 0, setDefPct = 0;
  Object.keys(setCounts).forEach(sKey => {
    const count = setCounts[sKey];
    const setDef = EQUIP_SETS_DB[sKey];
    if (setDef) {
      if (count >= 2) {
        if (setDef.bonus2.atkPct) setAtkPct += setDef.bonus2.atkPct;
        if (setDef.bonus2.mpPct) setMpPct += setDef.bonus2.mpPct;
        if (setDef.bonus2.defPct) setDefPct += setDef.bonus2.defPct;
      }
      if (count >= 4) {
        if (setDef.bonus4.hpPct) setHpPct += setDef.bonus4.hpPct;
        if (setDef.bonus4.atkPct) setAtkPct += setDef.bonus4.atkPct;
        if (setDef.bonus4.defPct) setDefPct += setDef.bonus4.defPct;
      }
      if (count >= 6) {
        if (setDef.bonus6.atkPct) setAtkPct += setDef.bonus6.atkPct;
        if (setDef.bonus6.mpPct) setMpPct += setDef.bonus6.mpPct;
        if (setDef.bonus6.defPct) setDefPct += setDef.bonus6.defPct;
      }
    }
  });

  return { bonus, setAtkPct, setHpPct, setMpPct, setDefPct };
}
