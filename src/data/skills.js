// ==========================================
// 1. 五大職業與二轉專精設定 (JOBS & ADVANCEMENTS)
// ==========================================
export const JOBS_CONFIG = {
  '猛將': {
    title: '猛將',
    icon: '⚔️',
    resourceType: 'rage',
    baseHp: 260, baseMp: 0, baseAtk: 38, baseDef: 14, baseSpeed: 10,
    desc: '物理近戰霸主。嚴格禁止法術！戰鬥中透過攻擊與受擊累積【怒氣 (0-100)】釋放毀滅重擊。',
    advancements: [
      { id: 'berserker', name: '狂戰士', desc: '極致物理爆發！血量越低攻擊力越高，解鎖【血怒斬】。' },
      { id: 'guardian', name: '鎮國鐵衛', desc: '鋼鐵神盾！大幅提升護甲與生命，為英雄抵擋傷害。' }
    ]
  },
  '巧匠': {
    title: '巧匠',
    icon: '🏹',
    resourceType: 'ammo',
    baseHp: 180, baseMp: 50, baseAtk: 32, baseDef: 8, baseSpeed: 18,
    desc: '靈巧暗器與弩箭大師。消耗【暗器彈藥】釋放高暴擊穿刺與毒蛛陷阱。',
    advancements: [
      { id: 'sniper', name: '神射手', desc: '無視防禦與高額暴擊！解鎖【萬箭貫日】。' },
      { id: 'trapper', name: '機關師', desc: '各種麻痺與減速陷阱控場，削弱全場敵怪。' }
    ]
  },
  '術士': {
    title: '術士',
    icon: '🔥',
    resourceType: 'incantation',
    baseHp: 140, baseMp: 170, baseAtk: 40, baseDef: 5, baseSpeed: 12,
    desc: '純粹五行元素法師。消耗 MP 釋法，持續疊加【法術咒印】廣域爆發。',
    advancements: [
      { id: 'elementalist', name: '元素使', desc: '毀天滅地廣域法術，五行爆發傷害增加 35%。' },
      { id: 'yin_yang', name: '陰陽師', desc: '擅長詛咒、冰封與封印敵方行動。' }
    ]
  },
  '藥師': {
    title: '藥師',
    icon: '🌿',
    resourceType: 'mp',
    baseHp: 170, baseMp: 130, baseAtk: 24, baseDef: 9, baseSpeed: 11,
    desc: '懸壺濟世醫者。擁有隊伍強效治療、金鐘護盾與萬毒噬心 DoT。',
    advancements: [
      { id: 'saint_healer', name: '聖醫', desc: '大範圍強效治療、護盾與自動恢復。' },
      { id: 'poison_doctor', name: '毒醫', desc: '將劇毒傷害轉化為全隊自我治療。' }
    ]
  },
  '風水師': {
    title: '風水師',
    icon: '☯️',
    resourceType: 'mp',
    baseHp: 180, baseMp: 110, baseAtk: 30, baseDef: 9, baseSpeed: 14,
    desc: '操縱天地奇門遁甲與五行印記大師。能標記陣法印記引爆全場。',
    advancements: [
      { id: 'formation_master', name: '陣法宗師', desc: '陣法增益效果提升 100%，大幅強化團隊。' },
      { id: 'summoner', name: '召喚師', desc: '召喚太古石傀與風水靈獸協同打擊。' }
    ]
  }
};

// ==========================================
// 2. 主角全職業技能資料庫 (PROTAGONIST SKILLS DB)
// ==========================================
export const PROTAGONIST_SKILLS_DB = {
  '猛將': [
    { 
      id: 'm_heavy_slash', 
      name: '破甲重擊', 
      type: 'single', 
      costType: 'rage', 
      cost: 20, 
      baseMult: 2.0, 
      desc: '【物理】消耗 20 怒氣，造成 2.0x 物理破甲打擊。' 
    },
    { 
      id: 'm_cleave', 
      name: '震地狂波', 
      type: 'aoe', 
      costType: 'rage', 
      cost: 40, 
      baseMult: 1.4, 
      desc: '【物理】消耗 40 怒氣，對全體敵怪造成 1.4x 物理打擊。' 
    },
    { 
      id: 'm_blood_rage', 
      name: '血怒屠戮', 
      type: 'single', 
      costType: 'rage', 
      cost: 60, 
      baseMult: 3.2, 
      desc: '【物理】消耗 60 怒氣，造成 3.2x 極限物理斬殺！' 
    }
  ],

  '巧匠': [
    { 
      id: 'q_rapid_shot', 
      name: '連環飛針', 
      type: 'single', 
      costType: 'ammo', 
      cost: 2, 
      baseMult: 1.8, 
      desc: '【暗器】消耗 2 彈藥，發射飛針造成 1.8x 穿刺打擊。' 
    },
    { 
      id: 'q_spider_trap', 
      name: '毒蛛陷阱', 
      type: 'aoe', 
      costType: 'ammo', 
      cost: 3, 
      baseMult: 1.3, 
      desc: '【陷阱】消耗 3 彈藥，鋪設毒蛛陣全體造成 1.3x 毒傷。' 
    },
    { 
      id: 'q_arrow_storm', 
      name: '萬箭貫日', 
      type: 'aoe', 
      costType: 'ammo', 
      cost: 5, 
      baseMult: 2.2, 
      desc: '【貫穿】消耗 5 彈藥，散射箭雨造成 2.2x 貫穿打擊。' 
    }
  ],

  '術士': [
    { 
      id: 's_fireball', 
      name: '疾火爆裂', 
      type: 'single', 
      costType: 'mp', 
      cost: 15, 
      baseMult: 2.2, 
      desc: '【法術】消耗 15 MP，造成 2.2x 爆發法傷並獲得 1 層咒印。' 
    },
    { 
      id: 's_frost_nova', 
      name: '冰封千里', 
      type: 'aoe', 
      costType: 'mp', 
      cost: 28, 
      baseMult: 1.5, 
      desc: '【法術】消耗 28 MP，全體造成 1.5x 冰霜法傷。' 
    },
    { 
      id: 's_thunder', 
      name: '九天雷劫', 
      type: 'single', 
      costType: 'mp', 
      cost: 35, 
      baseMult: 3.5, 
      desc: '【法術】消耗 35 MP，引發天雷造成 3.5x 爆發法傷。' 
    }
  ],

  '藥師': [
    { 
      id: 'y_heal', 
      name: '神農百草', 
      type: 'heal', 
      costType: 'mp', 
      cost: 18, 
      baseMult: 2.0, 
      desc: '【醫術】消耗 18 MP，全隊恢復 2.0x HP。' 
    },
    { 
      id: 'y_shield', 
      name: '金鐘護體', 
      type: 'shield', 
      costType: 'mp', 
      cost: 22, 
      baseMult: 1.5, 
      desc: '【防護】消耗 22 MP，張開金鐘罩吸收傷害。' 
    },
    { 
      id: 'y_poison', 
      name: '萬毒噬心', 
      type: 'single', 
      costType: 'mp', 
      cost: 25, 
      baseMult: 2.6, 
      desc: '【毒術】消耗 25 MP，注入劇毒造成 2.6x 毒傷。' 
    }
  ],

  '風水師': [
    { 
      id: 'f_mark', 
      name: '風水印記', 
      type: 'single', 
      costType: 'mp', 
      cost: 14, 
      baseMult: 1.9, 
      desc: '【風水】消耗 14 MP，打入印記造成 1.9x 元素打擊。' 
    },
    { 
      id: 'f_break', 
      name: '五行破陣', 
      type: 'aoe', 
      costType: 'mp', 
      cost: 26, 
      baseMult: 1.6, 
      desc: '【風水】消耗 26 MP，引爆全場造成 1.6x 元素傷害。' 
    },
    { 
      id: 'f_qimen', 
      name: '奇門遁甲', 
      type: 'aoe', 
      costType: 'mp', 
      cost: 38, 
      baseMult: 2.2, 
      desc: '【風水】消耗 38 MP，召喚遁甲大陣爆發 2.2x 傷害。' 
    }
  ]
};

// ==========================================
// 3. 技能傷害計算輔助函式 (HELPER)
// ==========================================
/**
 * 計算升級後的技能最終傷害/效果倍率
 * @param {Object} skill - 技能物件
 * @param {number} level - 目前技能等級 (1~5)
 */
export function getSkillMultiplier(skill, level = 1) {
  if (!skill) return 1.0;
  // 每升一級，基礎倍率提升 +0.3
  return skill.baseMult + ((level - 1) * 0.3);
}
