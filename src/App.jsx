import React, { useState, useEffect, useRef } from 'react';
import GameUI from './GameUI';

import { 
  TIER_CONFIG, 
  HERO_TEMPLATES, 
  instantiateHero 
} from './data/heroes';

import { 
  EQUIP_SLOTS,
  GEMS_DB,
  ITEM_DROP_POOL, 
  calculateEquipmentBonus 
} from './data/equipment';

export const MAX_LEVEL = 30;
export const MAX_SKILL_LEVEL = 10;

// ==========================================
// 1. 五大職業設定與專屬本命天賦
// ==========================================
export const CLASS_CONFIGS = {
  '猛將': {
    title: '猛將',
    icon: '⚔️',
    baseHp: 320,
    baseMp: 60,
    baseAtk: 36,
    baseDef: 18,
    baseSpeed: 10,
    resourceType: 'rage',
    desc: '前排鐵壁坦護，普攻與受擊快速攢怒，擅長嘲諷吸怪與護盾反傷，保護英雄不陣亡。',
    passiveName: '【鐵血護衛】',
    passiveDesc: '大幅吸引敵軍仇恨（極低英雄波及率），常駐物理減傷 +15%。'
  },
  '巧匠': {
    title: '巧匠',
    icon: '🏹',
    baseHp: 240,
    baseMp: 80,
    baseAtk: 42,
    baseDef: 11,
    baseSpeed: 18,
    resourceType: 'ammo',
    desc: '高機動暗器專家，每場開戰預設滿彈 (12/12)，前兩回合爆發極高，最多同時掃射 3 隻敵怪。',
    passiveName: '【連環機巧】',
    passiveDesc: '全職最高速度，攻擊無視敵方 20% 防禦；彈藥 > 6 時普攻觸發「二連射」。'
  },
  '術士': {
    title: '術士',
    icon: '🔮',
    baseHp: 210,
    baseMp: 140,
    baseAtk: 45,
    baseDef: 9,
    baseSpeed: 13,
    resourceType: 'mp',
    desc: '五行法術大宗師，唯一具備 5 隻大範圍清場與強制轉屬能力，觸發五行相剋額外回藍。',
    passiveName: '【五行靈體】',
    passiveDesc: '五行相剋傷害倍率提升至 2.0x（原 1.5x），被剋制減傷放寬為 0.9x，相剋回 15 MP。'
  },
  '藥師': {
    title: '藥師',
    icon: '🌿',
    baseHp: 250,
    baseMp: 130,
    baseAtk: 35,
    baseDef: 12,
    baseSpeed: 14,
    resourceType: 'mp',
    desc: '五毒與還魂專家（無回血技能），擅長單體及 3 隻範圍下毒削弱敵攻 20%，並可戰場復活英雄。',
    passiveName: '【五毒百草】',
    passiveDesc: '劇毒持續 3 回合（每回合無視防禦真傷且降低目標 20% 攻擊力），每回合自動回藍。'
  },
  '風水師': {
    title: '風水師',
    icon: '☯️',
    baseHp: 245,
    baseMp: 135,
    baseAtk: 30,
    baseDef: 13,
    baseSpeed: 15,
    resourceType: 'mp',
    desc: '純輔助戰術指揮官（無強力攻擊技能），唯一可變換陣法並使其效果翻倍，專精驅動英雄技能卡。',
    passiveName: '【奇門陣眼】',
    passiveDesc: '全遊戲唯一可切換陣法且陣法增益 2 倍強化；全體登場英雄主動技能卡觸發率 +15%。'
  }
};

// ==========================================
// 2. 五大職業三招核心技能（Lv.0 未學習 ~ Lv.10 滿級）
// ==========================================
export const CLASS_SKILLS_DB = {
  '猛將': [
    {
      id: 'w_s1',
      name: '金剛怒吼',
      cost: 25,
      costType: 'rage',
      targetBadge: '全場嘲諷 / 零傷害',
      desc: '無傷害純輔助；強制嘲諷全場敵怪 2 回合（100% 鎖定少俠），並為自身附加最大生命護盾。',
      getStatsAtLevel: (lvl) => {
        const effLvl = Math.max(1, lvl);
        return {
          shieldPct: +(0.25 + (effLvl - 1) * 0.03).toFixed(2)
        };
      },
      formatPreview: (lvl) => {
        const { shieldPct } = CLASS_SKILLS_DB['猛將'][0].getStatsAtLevel(lvl);
        return `全場嘲諷 2 回合，獲得 ${Math.round(shieldPct * 100)}% 最大生命護盾`;
      }
    },
    {
      id: 'w_s2',
      name: '裂地破甲斬',
      cost: 30,
      costType: 'rage',
      targetBadge: '單體攻擊',
      desc: '重劈單體目標造成物理傷害，並附加「破甲」狀態 2 回合，大幅降低目標防禦力。',
      getStatsAtLevel: (lvl) => {
        const effLvl = Math.max(1, lvl);
        return {
          mult: +(1.70 + (effLvl - 1) * 0.10).toFixed(2),
          breakPct: +(0.35 + (effLvl - 1) * 0.02).toFixed(2)
        };
      },
      formatPreview: (lvl) => {
        const { mult, breakPct } = CLASS_SKILLS_DB['猛將'][1].getStatsAtLevel(lvl);
        return `單體 ${mult.toFixed(2)}x 物理傷害，破甲降防 ${Math.round(breakPct * 100)}% (2回合)`;
      }
    },
    {
      id: 'w_s3',
      name: '不動明王架勢',
      cost: 60,
      costType: 'rage',
      targetBadge: '單體＋反傷',
      desc: '重擊單體目標，並進入「反震」架勢 2 回合（自身減傷 40%，且反彈高額所受傷害）。',
      getStatsAtLevel: (lvl) => {
        const effLvl = Math.max(1, lvl);
        return {
          mult: +(2.20 + (effLvl - 1) * 0.10).toFixed(2),
          reflectPct: +(0.50 + (effLvl - 1) * 0.03).toFixed(2)
        };
      },
      formatPreview: (lvl) => {
        const { mult, reflectPct } = CLASS_SKILLS_DB['猛將'][2].getStatsAtLevel(lvl);
        return `單體 ${mult.toFixed(2)}x 物理傷害，減傷 40% 並反彈 ${Math.round(reflectPct * 100)}% 傷害 (2回合)`;
      }
    }
  ],
  '巧匠': [
    {
      id: 'a_s1',
      name: '穿雲追魂箭',
      cost: 3,
      costType: 'ammo',
      targetBadge: '單體狙擊',
      desc: '狙擊單體目標，無視 50% 防禦力；若目標處於滿血狀態，必定觸發 1.5x 致命暴擊！',
      getStatsAtLevel: (lvl) => {
        const effLvl = Math.max(1, lvl);
        return {
          mult: +(2.40 + (effLvl - 1) * 0.12).toFixed(2)
        };
      },
      formatPreview: (lvl) => {
        const { mult } = CLASS_SKILLS_DB['巧匠'][0].getStatsAtLevel(lvl);
        return `單體 ${mult.toFixed(2)}x 物理傷害（無視 50% 防禦，滿血必暴擊 1.5x）`;
      }
    },
    {
      id: 'a_s2',
      name: '連珠散射',
      cost: 4,
      costType: 'ammo',
      targetBadge: '範圍最多 3 隻',
      desc: '對主目標及隨機相鄰共最多 3 隻敵怪發射連珠箭雨，造成物理穿透傷害。',
      getStatsAtLevel: (lvl) => {
        const effLvl = Math.max(1, lvl);
        return {
          mult: +(1.50 + (effLvl - 1) * 0.10).toFixed(2)
        };
      },
      formatPreview: (lvl) => {
        const { mult } = CLASS_SKILLS_DB['巧匠'][1].getStatsAtLevel(lvl);
        return `最多 3 隻敵怪各造成 ${mult.toFixed(2)}x 物理穿透傷害`;
      }
    },
    {
      id: 'a_s3',
      name: '天羅地網陣',
      cost: 5,
      costType: 'ammo',
      targetBadge: '範圍最多 3 隻',
      desc: '對最多 3 隻敵怪佈下機關陷阱，造成傷害並附加「束縛致盲」2 回合，大幅降低敵方命中率。',
      getStatsAtLevel: (lvl) => {
        const effLvl = Math.max(1, lvl);
        return {
          mult: +(1.30 + (effLvl - 1) * 0.09).toFixed(2),
          blindPct: +(0.45 + (effLvl - 1) * 0.02).toFixed(2)
        };
      },
      formatPreview: (lvl) => {
        const { mult, blindPct } = CLASS_SKILLS_DB['巧匠'][2].getStatsAtLevel(lvl);
        return `最多 3 隻敵怪 ${mult.toFixed(2)}x 傷害，敵軍命中 -${Math.round(blindPct * 100)}% (2回合)`;
      }
    }
  ],
  '術士': [
    {
      id: 'm_s1',
      name: '本命靈訣',
      cost: 20,
      costType: 'mp',
      targetBadge: '單體法術',
      desc: '引動本命五行靈力轟擊單體；若觸發五行相剋，立即返還 15 MP。',
      getStatsAtLevel: (lvl) => {
        const effLvl = Math.max(1, lvl);
        return {
          mult: +(2.30 + (effLvl - 1) * 0.12).toFixed(2)
        };
      },
      formatPreview: (lvl) => {
        const { mult } = CLASS_SKILLS_DB['術士'][0].getStatsAtLevel(lvl);
        return `單體 ${mult.toFixed(2)}x 五行法傷（觸發相剋返還 15 MP）`;
      }
    },
    {
      id: 'm_s2',
      name: '五行逆轉大陣',
      cost: 35,
      costType: 'mp',
      targetBadge: '大範圍最多 5 隻',
      desc: '轟擊最多 5 隻敵怪，並強制將其五行屬性逆轉為「被少俠本命剋制」的屬性（持續 2 回合）！',
      getStatsAtLevel: (lvl) => {
        const effLvl = Math.max(1, lvl);
        return {
          mult: +(1.30 + (effLvl - 1) * 0.09).toFixed(2)
        };
      },
      formatPreview: (lvl) => {
        const { mult } = CLASS_SKILLS_DB['術士'][1].getStatsAtLevel(lvl);
        return `最多 5 隻敵怪 ${mult.toFixed(2)}x 法傷，強制轉為被剋屬性 (2回合)`;
      }
    },
    {
      id: 'm_s3',
      name: '九天焚世咒',
      cost: 60,
      costType: 'mp',
      targetBadge: '大範圍最多 5 隻',
      desc: '召喚九天劫火轟炸最多 5 隻敵怪，造成毀滅性五行法傷並附加「灼燒」2 回合。',
      getStatsAtLevel: (lvl) => {
        const effLvl = Math.max(1, lvl);
        return {
          mult: +(2.60 + (effLvl - 1) * 0.13).toFixed(2)
        };
      },
      formatPreview: (lvl) => {
        const { mult } = CLASS_SKILLS_DB['術士'][2].getStatsAtLevel(lvl);
        return `最多 5 隻敵怪 ${mult.toFixed(2)}x 五行法傷，附加灼燒 (2回合)`;
      }
    }
  ],
  '藥師': [
    {
      id: 'p_s1',
      name: '穿心腐骨散',
      cost: 20,
      costType: 'mp',
      targetBadge: '單體劇毒',
      desc: '對單體敵怪施放劇毒（持續 3 回合，每回合造成無視防禦真傷且削弱目標 20% 攻擊力，可疊加 2 層）。',
      getStatsAtLevel: (lvl) => {
        const effLvl = Math.max(1, lvl);
        return {
          mult: +(1.50 + (effLvl - 1) * 0.09).toFixed(2),
          poisonPct: +(0.08 + (effLvl - 1) * 0.005).toFixed(3)
        };
      },
      formatPreview: (lvl) => {
        const { mult, poisonPct } = CLASS_SKILLS_DB['藥師'][0].getStatsAtLevel(lvl);
        return `單體 ${mult.toFixed(2)}x 毒傷，中毒 3 回合（每回合 ${(poisonPct * 100).toFixed(1)}% 真傷＋降攻 20%）`;
      }
    },
    {
      id: 'p_s2',
      name: '五毒瘴氣',
      cost: 25,
      costType: 'mp',
      targetBadge: '範圍最多 3 隻劇毒',
      desc: '向最多 3 隻敵怪噴灑五毒瘴氣，造成毒傷並全部附加「中毒」3 回合（每回合真傷＋削弱 20% 攻擊力）。',
      getStatsAtLevel: (lvl) => {
        const effLvl = Math.max(1, lvl);
        return {
          mult: +(1.10 + (effLvl - 1) * 0.08).toFixed(2),
          poisonPct: +(0.08 + (effLvl - 1) * 0.005).toFixed(3)
        };
      },
      formatPreview: (lvl) => {
        const { mult, poisonPct } = CLASS_SKILLS_DB['藥師'][1].getStatsAtLevel(lvl);
        return `最多 3 隻敵怪 ${mult.toFixed(2)}x 毒傷，群體中毒 3 回合（每回合 ${(poisonPct * 100).toFixed(1)}% 真傷＋降攻 20%）`;
      }
    },
    {
      id: 'p_s3',
      name: '九轉還魂丹',
      cost: 50,
      costType: 'mp',
      targetBadge: '戰場復活英雄',
      desc: '無回血效果；在戰鬥中復活 1 位已陣亡（HP 歸 0）的登場英雄重返戰場，並賦予「藥力激發」2 回合。',
      getStatsAtLevel: (lvl) => {
        const effLvl = Math.max(1, lvl);
        return {
          reviveHpPct: +(0.50 + (effLvl - 1) * 0.05).toFixed(2),
          atkBuffPct: +(0.25 + (effLvl - 1) * 0.02).toFixed(2)
        };
      },
      formatPreview: (lvl) => {
        const { reviveHpPct, atkBuffPct } = CLASS_SKILLS_DB['藥師'][2].getStatsAtLevel(lvl);
        return `無回血；復活 1 位陣亡英雄恢復 ${Math.round(reviveHpPct * 100)}% HP，攻擊 +${Math.round(atkBuffPct * 100)}% (2回合)`;
      }
    }
  ],
  '風水師': [
    {
      id: 'f_s1',
      name: '乾坤借法',
      cost: 25,
      costType: 'mp',
      targetBadge: '英雄驅動 / 零傷害',
      desc: '零傷害純輔助；令 1 位存活的登場英雄立即額外行動 1 次，且 100% 必定觸發其主動技能卡！',
      getStatsAtLevel: (lvl) => {
        const effLvl = Math.max(1, lvl);
        return {
          bonusDmgPct: +((effLvl - 1) * 0.05).toFixed(2)
        };
      },
      formatPreview: (lvl) => {
        const { bonusDmgPct } = CLASS_SKILLS_DB['風水師'][0].getStatsAtLevel(lvl);
        return `零傷害輔助；令 1 位英雄立即必發主動技能卡（該次傷害 +${Math.round(bonusDmgPct * 100)}%）`;
      }
    },
    {
      id: 'f_s2',
      name: '八卦護身結界',
      cost: 35,
      costType: 'mp',
      targetBadge: '全隊減傷 / 零傷害',
      desc: '零傷害純輔助；展開八卦陣圖保護全隊 2 回合，大幅降低全隊所受傷害並反彈傷害。',
      getStatsAtLevel: (lvl) => {
        const effLvl = Math.max(1, lvl);
        return {
          reducePct: +(0.35 + (effLvl - 1) * 0.02).toFixed(2),
          reflectPct: +(0.25 + (effLvl - 1) * 0.02).toFixed(2)
        };
      },
      formatPreview: (lvl) => {
        const { reducePct, reflectPct } = CLASS_SKILLS_DB['風水師'][1].getStatsAtLevel(lvl);
        return `零傷害輔助；全隊承傷 -${Math.round(reducePct * 100)}%，反彈 ${Math.round(reflectPct * 100)}% 傷害 (2回合)`;
      }
    },
    {
      id: 'f_s3',
      name: '奇門天象變',
      cost: 45,
      costType: 'mp',
      targetBadge: '弱法傷＋全場易傷',
      desc: '僅造成微弱五行法傷，但為全場敵怪附加「易傷」2 回合，大幅放大全隊所有傷害！',
      getStatsAtLevel: (lvl) => {
        const effLvl = Math.max(1, lvl);
        return {
          mult: +(0.60 + (effLvl - 1) * 0.06).toFixed(2),
          vulnPct: +(0.35 + (effLvl - 1) * 0.02).toFixed(2)
        };
      },
      formatPreview: (lvl) => {
        const { mult, vulnPct } = CLASS_SKILLS_DB['風水師'][2].getStatsAtLevel(lvl);
        return `全場 ${mult.toFixed(2)}x 弱法傷，附加全場易傷 +${Math.round(vulnPct * 100)}% (2回合)`;
      }
    }
  ]
};

// ==========================================
// 3. 英雄技能卡資料庫 (含職業限制與分類)
// ==========================================
export const SKILL_CARDS_DB = [
  { id: 'sc_a1', name: '烈焰斬', type: 'active', category: 'physical', allowedJobs: ['猛將', '巧匠'], target: 'single', mult: 2.2, desc: '【物理】發動火焰重擊單體敵人，造成 2.2x 物理傷害。', icon: '🔥' },
  { id: 'sc_a2', name: '萬箭齊發', type: 'active', category: 'physical', allowedJobs: ['巧匠', '猛將'], target: 'aoe', mult: 1.5, desc: '【物理】散射箭雨橫掃全場，造成 1.5x 廣域物理打擊。', icon: '🏹' },
  { id: 'sc_a3', name: '九天雷劫', type: 'active', category: 'magic', allowedJobs: ['術士', '風水師'], target: 'single', mult: 3.0, desc: '【法術】引九天雷霆轟擊單體，爆發 3.0x 雷霆法傷。', icon: '⚡' },
  { id: 'sc_a4', name: '奇門遁甲', type: 'active', category: 'magic', allowedJobs: ['術士', '風水師'], target: 'aoe', mult: 2.0, desc: '【法術】召喚遁甲大陣，造成全場 2.0x 五行法傷。', icon: '☯️' },
  { id: 'sc_a5', name: '神農妙手', type: 'active', category: 'heal', allowedJobs: ['藥師', '風水師'], target: 'heal', mult: 1.8, desc: '【治療】施展回春妙術，為少俠與全隊恢復 1.8x 生命值。', icon: '🌿' },
  { id: 'sc_a6', name: '天羅地網', type: 'active', category: 'trap', allowedJobs: ['巧匠', '風水師'], target: 'aoe', mult: 1.6, desc: '【陷阱】佈下機關毒網，對全體敵怪造成 1.6x 穿刺傷。', icon: '🕸️' },
  { id: 'sc_p1', name: '鋼筋鐵骨', type: 'passive', category: 'universal', allowedJobs: ['猛將', '巧匠', '術士', '藥師', '風水師'], bonus: { defPct: 0.15, hpPct: 0.10 }, desc: '【通用】常駐護甲 +15%、生命上限 +10%。', icon: '🛡️' },
  { id: 'sc_p2', name: '怒火中燒', type: 'passive', category: 'physical', allowedJobs: ['猛將', '巧匠'], bonus: { atkPct: 0.18 }, desc: '【物理】戰意沸騰，常駐攻擊力 +18%。', icon: '⚔️' },
  { id: 'sc_p3', name: '五行貫通', type: 'passive', category: 'magic', allowedJobs: ['術士', '藥師', '風水師'], bonus: { atkPct: 0.15, elemDmgPct: 0.20 }, desc: '【法術】常駐攻擊力 +15%，五行相剋傷害額外 +20%。', icon: '🔮' },
  { id: 'sc_p4', name: '神行百變', type: 'passive', category: 'universal', allowedJobs: ['猛將', '巧匠', '術士', '藥師', '風水師'], bonus: { speedPct: 0.20 }, desc: '【通用】身輕如燕，常駐速度 +20%。', icon: '💨' }
];

export function createSkillCardInstance(template) {
  return {
    ...template,
    uid: `sc_${template.id}_${Date.now()}_${Math.floor(Math.random() * 100000)}`
  };
}

export const TIER_SKILL_CHANCE = {
  1: 0.15,
  2: 0.25,
  3: 0.35,
  4: 0.50,
  5: 0.70
};

export function calculateHeroEffectiveStats(hero, isFengShuiLeader = false, heroSurgeBuff = null) {
  const passives = hero.passiveSkillSlots || [];
  let atkPct = heroSurgeBuff?.surgeTurns > 0 ? (heroSurgeBuff.surgeAtkPct || 0) : 0;
  let defPct = 0;
  let hpPct = 0;
  let speedPct = 0;
  let elemDmgPct = 0;

  passives.forEach(card => {
    if (card && card.bonus) {
      atkPct += card.bonus.atkPct || 0;
      defPct += card.bonus.defPct || 0;
      hpPct += card.bonus.hpPct || 0;
      speedPct += card.bonus.speedPct || 0;
      elemDmgPct += card.bonus.elemDmgPct || 0;
    }
  });

  const baseMaxHp = hero.maxHp || 150;
  const baseAtk = hero.atk || 20;
  const baseDef = hero.def || 8;
  const baseSpeed = hero.speed || 10;
  const baseChance = TIER_SKILL_CHANCE[hero.tier] || 0.15;

  return {
    effectiveMaxHp: Math.floor(baseMaxHp * (1 + hpPct)),
    effectiveAtk: Math.floor(baseAtk * (1 + atkPct)),
    effectiveDef: Math.floor(baseDef * (1 + defPct)),
    effectiveSpeed: Math.floor(baseSpeed * (1 + speedPct)),
    elemDmgPct,
    skillChance: Math.min(1.0, baseChance + (isFengShuiLeader ? 0.15 : 0))
  };
}

function normalizeHero(h) {
  const clampedLevel = Math.min(MAX_LEVEL, Math.max(1, h.level || 1));
  return {
    ...h,
    level: clampedLevel,
    def: h.def ?? (5 + ((h.tier || 1) * 4) + ((h.stats?.con || 2) * 1)),
    speed: h.speed ?? (10 + ((h.tier || 1) * 2) + ((h.stats?.agi || 2) * 2)),
    maxExp: h.maxExp || 100,
    rage: h.rage ?? 0,
    ammo: h.ammo ?? 6,
    maxAmmo: h.maxAmmo ?? 6,
    mp: h.mp ?? 50,
    maxMp: h.maxMp ?? 100,
    statLossTotal: h.statLossTotal ?? 0,
    activeSkillSlots: Array.isArray(h.activeSkillSlots) ? h.activeSkillSlots : [],
    passiveSkillSlots: Array.isArray(h.passiveSkillSlots) ? h.passiveSkillSlots : [],
    stats: h.stats || { str: 4, con: 4, int: 2, agi: 2 }
  };
}

function applyHeroDeathStatPenalty(hero) {
  const totalRoll = Math.floor(Math.random() * 5) + 1;
  const statKeys = ['str', 'con', 'int', 'agi'];
  const statLabels = { str: '力量', con: '體質', int: '智慧', agi: '敏捷' };
  const newStats = { ...(hero.stats || { str: 4, con: 4, int: 2, agi: 2 }) };
  const deducted = { str: 0, con: 0, int: 0, agi: 0 };

  for (let i = 0; i < totalRoll; i++) {
    const reducible = statKeys.filter(k => (newStats[k] || 1) > 1);
    if (reducible.length === 0) break;
    const chosen = reducible[Math.floor(Math.random() * reducible.length)];
    newStats[chosen] -= 1;
    deducted[chosen] += 1;
  }

  const actualLoss = Object.values(deducted).reduce((a, b) => a + b, 0);
  const tier = hero.tier || 1;
  const newMaxHp = 130 + (tier * 45) + (newStats.con * 16);
  const newAtk = 16 + (tier * 11) + (newStats.str * 3) + (newStats.int * 2);
  const newDef = 5 + (tier * 4) + (newStats.con * 1);
  const newSpeed = 10 + (tier * 2) + (newStats.agi * 2);

  const breakdownParts = statKeys
    .filter(k => deducted[k] > 0)
    .map(k => `${statLabels[k]} -${deducted[k]}`);

  const updatedHero = {
    ...hero,
    stats: newStats,
    maxHp: newMaxHp,
    atk: newAtk,
    def: newDef,
    speed: newSpeed,
    statLossTotal: (hero.statLossTotal || 0) + actualLoss
  };

  return {
    updatedHero,
    actualLoss,
    breakdownText: breakdownParts.length > 0 ? breakdownParts.join('、') : '屬性已達下限未再扣除'
  };
}

const ELEMENTS = {
  '金': { name: '金', counters: '木' },
  '木': { name: '木', counters: '土' },
  '水': { name: '水', counters: '火' },
  '火': { name: '火', counters: '金' },
  '土': { name: '土', counters: '水' }
};

const ELEMENT_KEYS = ['金', '木', '水', '火', '土'];

function getRandomElement() {
  return ELEMENT_KEYS[Math.floor(Math.random() * ELEMENT_KEYS.length)];
}

function getElementMultiplier(attElem, defElem, isWarlockAttacker = false) {
  if (!attElem || !defElem || !ELEMENTS[attElem]) return 1.0;
  if (ELEMENTS[attElem].counters === defElem) return isWarlockAttacker ? 2.0 : 1.5;
  if (ELEMENTS[defElem] && ELEMENTS[defElem].counters === attElem) return isWarlockAttacker ? 0.9 : 0.75;
  return 1.0;
}

export const FORMATIONS_CONFIG = {
  'none': { name: '無陣法', desc: '標準自由站位，無額外陣法增益。', icon: '⚪', bonus: {} },
  'tianfu': { name: '天覆陣', desc: '天罡護體！全隊護甲 +20%，受到傷害 -10%。', icon: '🛡️', bonus: { defPct: 0.20, damageTakenPct: -0.10 } },
  'dizai': { name: '地載陣', desc: '厚德載物！全隊生命上限 +15%，格擋率 +15%。', icon: '🏔️', bonus: { hpPct: 0.15, blockPct: 0.15 } },
  'bagua': { name: '八卦陣', desc: '陰陽迴轉！五行法術傷害 +15%，速度 +15%。', icon: '☯️', bonus: { elemDmgPct: 0.15, speedPct: 0.15 } },
  'fengshi': { name: '鋒矢陣', desc: '如箭離弦！全隊物理攻擊 +25%，暴擊率 +10%。', icon: '🏹', bonus: { atkPct: 0.25, critPct: 0.10 } }
};

const ZONES = [
  { id: 'z1', name: '新手竹林 (Lvl.1-4)', monsters: [{ name: '竹林野兔', hp: 80, atk: 16, def: 3, exp: 35, gold: 25 }, { name: '青竹小蛇', hp: 100, atk: 20, def: 5, exp: 45, gold: 30 }] },
  { id: 'z2', name: '黑山寨 (Lvl.5-9)', monsters: [{ name: '黃巾刀客', hp: 220, atk: 36, def: 9, exp: 90, gold: 70 }, { name: '黑山狼妖', hp: 280, atk: 45, def: 12, exp: 120, gold: 95 }] },
  { id: 'z3', name: '火雲洞 (Lvl.10-14)', monsters: [{ name: '赤焰火蝠', hp: 550, atk: 68, def: 16, exp: 200, gold: 170 }, { name: '火雲洞主', hp: 980, atk: 92, def: 22, exp: 360, gold: 320 }] },
  { id: 'z4', name: '蓬萊仙島 (Lvl.15+)', monsters: [{ name: '仙境靈鹿', hp: 1350, atk: 110, def: 30, exp: 500, gold: 420 }, { name: '守護仙童', hp: 1800, atk: 135, def: 38, exp: 650, gold: 550 }] }
];

const LOCAL_STORAGE_KEY = 'MYSTINA_RPG_SAVE_V3';

// 隨機挑選最多 maxCount 隻存活怪物（優先包含主目標 primaryIdx）
function pickUpToNMonsterIndices(monsterList, primaryIdx, maxCount) {
  const aliveIndices = monsterList
    .map((m, idx) => (m.hp > 0 ? idx : -1))
    .filter(idx => idx !== -1);
  if (aliveIndices.length === 0) return [];

  const chosen = [];
  if (aliveIndices.includes(primaryIdx)) {
    chosen.push(primaryIdx);
  } else {
    chosen.push(aliveIndices[0]);
  }

  const remaining = aliveIndices.filter(idx => !chosen.includes(idx));
  while (chosen.length < maxCount && remaining.length > 0) {
    const randPos = Math.floor(Math.random() * remaining.length);
    chosen.push(remaining[randPos]);
    remaining.splice(randPos, 1);
  }
  return chosen;
}

export default function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [creationData, setCreationData] = useState({
    name: "太古少俠",
    gender: "male",
    job: "猛將",
    element: "金",
    selectedStarterHero: null
  });
  const [starterHeroCandidates, setStarterHeroCandidates] = useState([]);

  const [player, setPlayer] = useState({
    name: "太古少俠",
    job: "猛將",
    advancement: null,
    element: "金",
    level: 1,
    exp: 0,
    maxExp: 100,
    hp: 320, maxHp: 320,
    mp: 60, maxMp: 60,
    rage: 0, ammo: 12, maxAmmo: 12,
    atk: 36, def: 18, speed: 10,
    gold: 600, refineStones: 10,
    statPoints: 5, sp: 1, tp: 2,
    stats: { str: 10, con: 10, int: 10, agi: 10 },
    skillLevels: { 0: 0, 1: 0, 2: 0 },
    equipped: { weapon: null, offhand: null, helmet: null, armor: null, shoes: null, accessory: null }
  });

  const [heroRoster, setHeroRoster] = useState([]);
  const [activeHeroInstanceIds, setActiveHeroInstanceIds] = useState([]);
  const [currentFormation, setCurrentFormation] = useState('none');
  const [equipmentInventory, setEquipmentInventory] = useState(
    ITEM_DROP_POOL.slice(0, 3).map((item, idx) => ({ ...item, refineLevel: 0, uid: `eq_init_${idx}` }))
  );
  const [skillCardsInventory, setSkillCardsInventory] = useState(() => [
    createSkillCardInstance(SKILL_CARDS_DB[0]),
    createSkillCardInstance(SKILL_CARDS_DB[2]),
    createSkillCardInstance(SKILL_CARDS_DB[6])
  ]);
  const [towerFloor, setTowerFloor] = useState(1);

  const [activeTab, setActiveTab] = useState('combat');
  const [currentZoneIndex, setCurrentZoneIndex] = useState(0);
  const [monsters, setMonsters] = useState([]);
  const [selectedTargetIndex, setSelectedTargetIndex] = useState(0);
  const [combatLogs, setCombatLogs] = useState([]);
  const [turnCount, setTurnCount] = useState(1);
  const [combatPhase, setCombatPhase] = useState('PLAYER_SELECT');
  const [victorySummary, setVictorySummary] = useState(null);
  const [defeatSummary, setDefeatSummary] = useState(null);

  // 戰鬥狀態增益（護盾、嘲諷、反震、八卦結界）與英雄戰場增益
  const [combatBuffs, setCombatBuffs] = useState({
    shield: 0,
    tauntTurns: 0,
    reflectTurns: 0,
    reflectPct: 0,
    baguaTurns: 0,
    baguaReducePct: 0,
    baguaReflectPct: 0
  });
  const [heroBattleBuffs, setHeroBattleBuffs] = useState({});
  const [battleDownedHeroIds, setBattleDownedHeroIds] = useState([]);

  const [jsonSaveText, setJsonSaveText] = useState('');
  const [saveLoadStatus, setSaveLoadStatus] = useState('');

  const chatEndRef = useRef(null);
  const isInCombat = monsters.some(m => m.hp > 0);
  const isFengShui = player.job === '風水師';

  useEffect(() => {
    const t1s = HERO_TEMPLATES.filter(t => t.tier === 1);
    const cands = t1s.map(t => normalizeHero(instantiateHero(t, true, null, getRandomElement)));
    setStarterHeroCandidates(cands);
    setCreationData(prev => ({ ...prev, selectedStarterHero: cands[0] }));

    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.player) {
          const loadedP = {
            ...parsed.player,
            level: Math.min(MAX_LEVEL, parsed.player.level || 1),
            maxAmmo: parsed.player.job === '巧匠' ? 12 : (parsed.player.maxAmmo || 12),
            skillLevels: {
              0: Math.min(MAX_SKILL_LEVEL, parsed.player.skillLevels?.[0] ?? 0),
              1: Math.min(MAX_SKILL_LEVEL, parsed.player.skillLevels?.[1] ?? 0),
              2: Math.min(MAX_SKILL_LEVEL, parsed.player.skillLevels?.[2] ?? 0)
            }
          };
          setPlayer(loadedP);
          setHeroRoster((parsed.heroRoster || []).map(normalizeHero));
          setActiveHeroInstanceIds(parsed.activeHeroInstanceIds || []);
          setCurrentFormation(loadedP.job === '風水師' ? (parsed.currentFormation || 'none') : 'none');
          setEquipmentInventory(parsed.equipmentInventory || []);
          if (parsed.skillCardsInventory) {
            setSkillCardsInventory(parsed.skillCardsInventory);
          }
          setTowerFloor(parsed.towerFloor || 1);
          setGameStarted(true);
        }
      }
    } catch (e) {
      console.warn('自動載入存檔失敗', e);
    }
  }, []);

  useEffect(() => {
    if (gameStarted) {
      try {
        const saveData = { 
          player, 
          heroRoster, 
          activeHeroInstanceIds, 
          currentFormation, 
          equipmentInventory, 
          skillCardsInventory,
          towerFloor 
        };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(saveData));
      } catch (e) {
        console.warn('自動存檔失敗', e);
      }
    }
  }, [player, heroRoster, activeHeroInstanceIds, currentFormation, equipmentInventory, skillCardsInventory, towerFloor, gameStarted]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [combatLogs]);

  const activeHeroes = activeHeroInstanceIds
    .map(id => heroRoster.find(h => h.instanceId === id))
    .filter(Boolean);

  const { bonus: equipBonus, setAtkPct, setHpPct, setMpPct, setDefPct } = calculateEquipmentBonus(player.equipped);
  const effectiveFormationKey = isFengShui ? currentFormation : 'none';
  const rawFormBonus = FORMATIONS_CONFIG[effectiveFormationKey]?.bonus || {};
  // 【奇門陣眼】風水師啟動陣法時增益效果 2 倍強化
  const formMultiplier = isFengShui ? 2 : 1;

  const playerTotalMaxHp = Math.floor((player.maxHp + (player.stats.con * 16) + equipBonus.hp) * (1 + setHpPct + ((rawFormBonus.hpPct || 0) * formMultiplier)));
  const playerTotalMaxMp = Math.floor((player.maxMp + (player.stats.int * 10) + equipBonus.mp) * (1 + setMpPct));
  const playerTotalAtk = Math.floor((player.atk + (player.stats.str * 3) + equipBonus.atk) * (1 + setAtkPct + ((rawFormBonus.atkPct || 0) * formMultiplier)));
  const playerTotalDef = Math.floor((player.def + (player.stats.con * 1) + equipBonus.def) * (1 + (setDefPct || 0) + ((rawFormBonus.defPct || 0) * formMultiplier)));
  const playerTotalSpeed = Math.floor((player.speed + (player.stats.agi * 1) + equipBonus.speed) * (1 + ((rawFormBonus.speedPct || 0) * formMultiplier)));

  const addLog = (text, type = 'info') => {
    setCombatLogs(prev => [...prev, { id: Date.now() + Math.random(), turn: turnCount, text, type }]);
  };

  // 創角開始：技能皆從 Lv.0 起步，開局贈送 1 SP 讓玩家選擇首招學習技能
  const handleStartGame = () => {
    const jobConfig = CLASS_CONFIGS[creationData.job];
    const starterHero = normalizeHero(creationData.selectedStarterHero);

    const newPlayer = {
      ...player,
      name: creationData.name || "太古少俠",
      job: creationData.job,
      element: creationData.element,
      level: 1,
      exp: 0,
      maxExp: 100,
      maxHp: jobConfig.baseHp, hp: jobConfig.baseHp,
      maxMp: jobConfig.baseMp, mp: jobConfig.baseMp,
      rage: 0,
      ammo: 12,
      maxAmmo: 12,
      atk: jobConfig.baseAtk, def: jobConfig.baseDef, speed: jobConfig.baseSpeed,
      statPoints: 5,
      sp: 1,
      skillLevels: { 0: 0, 1: 0, 2: 0 }
    };

    setPlayer(newPlayer);
    setHeroRoster([starterHero]);
    setActiveHeroInstanceIds([starterHero.instanceId]);
    setCurrentFormation('none');
    setMonsters([]);
    setGameStarted(true);
    setCombatLogs([
      { id: 1, turn: 1, type: 'sys', text: `📜 少俠【${newPlayer.name}】（${newPlayer.job} • ${newPlayer.element}本命）踏入《天外 Online》！開局獲贈 1 點 SP，可先前往「✨ 技能樹」學習首招技能！` }
    ]);
  };

  const handleSelectZone = (zoneIdx) => {
    if (isInCombat) {
      addLog(`🔒 戰鬥中無法切換地圖！`, 'sys');
      return;
    }
    setCurrentZoneIndex(zoneIdx);
    setMonsters([]);
    addLog(`🗺️ 已前往【${ZONES[zoneIdx].name}】安全營地，請點擊「🔍 尋找怪群」主動搜敵！`, 'sys');
  };

  const resetCombatStates = () => {
    setCombatBuffs({
      shield: 0,
      tauntTurns: 0,
      reflectTurns: 0,
      reflectPct: 0,
      baguaTurns: 0,
      baguaReducePct: 0,
      baguaReflectPct: 0
    });
    setHeroBattleBuffs({});
    setBattleDownedHeroIds([]);
  };

  // 主動搜敵進入戰鬥（巧匠每場開戰預設滿彈 12/12）
  const spawnEncounter = (zoneIdx, customActiveHeroes = null) => {
    if (isInCombat) {
      addLog(`⚠️ 當前已在戰鬥中，請先擊敗敵軍或嘗試撤退！`, 'sys');
      return [];
    }
    if (player.hp <= 0) {
      addLog(`⚠️ 少俠氣血耗盡，請先前往客棧休息恢復再搜敵！`, 'danger');
      return [];
    }

    const deployed = customActiveHeroes !== null ? customActiveHeroes : activeHeroes;
    const totalCombatants = 1 + deployed.length;
    const count = Math.floor(Math.random() * (totalCombatants * 2)) + totalCombatants;

    const zone = ZONES[zoneIdx];
    let list = [];
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    for (let i = 0; i < count; i++) {
      const template = zone.monsters[Math.floor(Math.random() * zone.monsters.length)];
      const randElem = getRandomElement();
      list.push({
        id: `m_${Date.now()}_${i}`,
        name: `${template.name} ${alphabet[i] || i + 1}`,
        element: randElem,
        originalElement: randElem,
        maxHp: template.hp, hp: template.hp,
        atk: template.atk, def: template.def,
        exp: template.exp, gold: template.gold,
        // 敵怪減益狀態
        armorBreakTurns: 0,
        armorBreakPct: 0,
        blindTurns: 0,
        blindPct: 0,
        elemShiftTurns: 0,
        burnTurns: 0,
        burnDmg: 0,
        poisonTurns: 0,
        poisonPct: 0,
        poisonStacks: 0,
        vulnTurns: 0,
        vulnPct: 0
      });
    }

    if (player.job === '巧匠') {
      setPlayer(prev => ({ ...prev, ammo: 12, maxAmmo: 12 }));
      addLog(`🏹 【連環機巧】巧匠開戰前裝填完畢，機關彈藥補滿至 12/12！`, 'sys');
    } else if (player.job === '猛將') {
      setPlayer(prev => ({ ...prev, rage: 0 }));
    }

    resetCombatStates();
    setMonsters(list);
    setSelectedTargetIndex(0);
    setTurnCount(1);
    setCombatPhase('PLAYER_SELECT');
    addLog(`⚔️ 【${zone.name}】主動搜敵遭遇 ${list.length} 隻敵怪！戰鬥開始（整備功能已鎖定）！`, 'sys');
    return list;
  };

  const handleToggleDeployHero = (hero) => {
    if (isInCombat) {
      addLog(`🔒 戰鬥進行中，無法調整出戰陣容！`, 'sys');
      return;
    }
    if (activeHeroInstanceIds.includes(hero.instanceId)) {
      setActiveHeroInstanceIds(prev => prev.filter(id => id !== hero.instanceId));
      addLog(`🛡️ 英雄【${hero.name}】卸下登場，返回客棧休養。`, 'sys');
    } else {
      if (activeHeroInstanceIds.length >= 4) {
        addLog(`⚠️ 最多同時派遣 4 位英雄登場！`, 'sys');
        return;
      }
      if (activeHeroes.some(h => h.baseId === hero.baseId)) {
        addLog(`⚠️ 同名英雄【${hero.name}】不可重複登場！`, 'sys');
        return;
      }
      setActiveHeroInstanceIds(prev => [...prev, hero.instanceId]);
      addLog(`⚔️ 英雄【${hero.name}】加入出戰陣容！`, 'sys');
    }
  };

  const handleReleaseHero = (hero) => {
    if (isInCombat) {
      addLog(`🔒 戰鬥進行中，無法放走英雄！`, 'sys');
      return;
    }
    const returnedCards = [
      ...(hero.activeSkillSlots || []),
      ...(hero.passiveSkillSlots || [])
    ];
    if (returnedCards.length > 0) {
      setSkillCardsInventory(prev => [...prev, ...returnedCards]);
    }
    if (activeHeroInstanceIds.includes(hero.instanceId)) {
      setActiveHeroInstanceIds(prev => prev.filter(id => id !== hero.instanceId));
    }
    setHeroRoster(prev => prev.filter(h => h.instanceId !== hero.instanceId));
    addLog(`👋 已放走英雄【${hero.name}】${returnedCards.length > 0 ? `（自動收回 ${returnedCards.length} 張技能卡）` : ''}。`, 'sys');
  };

  const handleEquipSkillCard = (heroInstanceId, card) => {
    if (isInCombat) {
      addLog(`🔒 戰鬥進行中，無法更換技能卡！`, 'sys');
      return;
    }
    const targetHero = heroRoster.find(h => h.instanceId === heroInstanceId);
    if (!targetHero) return;

    if (!card.allowedJobs.includes(targetHero.heroClass)) {
      addLog(`⚠️ 職業不符！【${targetHero.heroClass}】無法裝備【${card.name}】！`, 'sys');
      return;
    }

    const allEquipped = [
      ...(targetHero.activeSkillSlots || []),
      ...(targetHero.passiveSkillSlots || [])
    ];
    if (allEquipped.some(c => c.id === card.id || c.name === card.name)) {
      addLog(`⚠️ 英雄【${targetHero.name}】已裝備相同的技能卡【${card.name}】！`, 'sys');
      return;
    }

    const targetSlots = card.type === 'active' 
      ? (targetHero.activeSkillSlots || []) 
      : (targetHero.passiveSkillSlots || []);
    if (targetSlots.length >= 2) {
      addLog(`⚠️ 英雄【${targetHero.name}】的${card.type === 'active' ? '主動' : '被動'}技能槽已滿！`, 'sys');
      return;
    }

    setSkillCardsInventory(prev => prev.filter(c => c.uid !== card.uid));
    setHeroRoster(prev => prev.map(h => {
      if (h.instanceId !== heroInstanceId) return h;
      if (card.type === 'active') {
        return { ...h, activeSkillSlots: [...(h.activeSkillSlots || []), card] };
      } else {
        return { ...h, passiveSkillSlots: [...(h.passiveSkillSlots || []), card] };
      }
    }));

    addLog(`🔮 英雄【${targetHero.name}】成功裝備技能卡【${card.name}】！`, 'sys');
  };

  const handleUnequipSkillCard = (heroInstanceId, card) => {
    if (isInCombat) {
      addLog(`🔒 戰鬥進行中，無法拆下技能卡！`, 'sys');
      return;
    }
    setHeroRoster(prev => prev.map(h => {
      if (h.instanceId !== heroInstanceId) return h;
      if (card.type === 'active') {
        return { ...h, activeSkillSlots: (h.activeSkillSlots || []).filter(c => c.uid !== card.uid) };
      } else {
        return { ...h, passiveSkillSlots: (h.passiveSkillSlots || []).filter(c => c.uid !== card.uid) };
      }
    }));

    setSkillCardsInventory(prev => [...prev, card]);
    addLog(`📤 已拆下技能卡【${card.name}】，卡片已放回背包。`, 'sys');
  };

  // 英雄升級邏輯（最高等級上限 Lv.30）
  const processHeroExpGain = (hero, expGained) => {
    let currentHero = normalizeHero(hero);
    if (currentHero.level >= MAX_LEVEL) {
      return { updatedHero: { ...currentHero, level: MAX_LEVEL, exp: 0 }, upgradedMsgs: [] };
    }

    currentHero.exp += expGained;
    let upgradedMsgs = [];

    while (currentHero.level < MAX_LEVEL && currentHero.exp >= currentHero.maxExp) {
      currentHero.exp -= currentHero.maxExp;
      currentHero.level += 1;
      currentHero.maxExp = Math.floor(100 * Math.pow(currentHero.level, 1.3));

      const tierPtsMap = { 1: 2, 2: 3, 3: 5, 4: 7, 5: 10 };
      const pts = tierPtsMap[currentHero.tier] || 2;

      const weightsMap = {
        '猛將': { str: 0.30, con: 0.50, int: 0.00, agi: 0.20 },
        '巧匠': { str: 0.30, con: 0.20, int: 0.00, agi: 0.50 },
        '術士': { str: 0.00, con: 0.20, int: 0.60, agi: 0.20 },
        '藥師': { str: 0.00, con: 0.40, int: 0.40, agi: 0.20 },
        '風水師': { str: 0.00, con: 0.30, int: 0.30, agi: 0.40 }
      };
      const w = weightsMap[currentHero.heroClass] || weightsMap['猛將'];

      const addStr = Math.round(pts * w.str);
      const addCon = Math.round(pts * w.con);
      const addInt = Math.round(pts * w.int);
      const addAgi = pts - (addStr + addCon + addInt);

      const oldStats = currentHero.stats || { str: 4, con: 4, int: 2, agi: 2 };
      currentHero.stats = {
        str: oldStats.str + addStr,
        con: oldStats.con + addCon,
        int: oldStats.int + addInt,
        agi: oldStats.agi + addAgi
      };

      const tier = currentHero.tier || 1;
      currentHero.maxHp = 130 + (tier * 45) + (currentHero.stats.con * 16);
      currentHero.atk = 16 + (tier * 11) + (currentHero.stats.str * 3) + (currentHero.stats.int * 2);
      currentHero.def = 5 + (tier * 4) + (currentHero.stats.con * 1);
      currentHero.speed = 10 + (tier * 2) + (currentHero.stats.agi * 2);

      const { effectiveMaxHp } = calculateHeroEffectiveStats(currentHero, isFengShui);
      currentHero.hp = effectiveMaxHp;

      upgradedMsgs.push(`🎉 英雄【${currentHero.name}】升至 Lv.${currentHero.level}${currentHero.level === MAX_LEVEL ? ' (已達滿級上限!)' : ''}！`);
    }

    if (currentHero.level >= MAX_LEVEL) {
      currentHero.level = MAX_LEVEL;
      currentHero.exp = 0;
    }

    return { updatedHero: currentHero, upgradedMsgs };
  };

  // 計算對怪物造成的最終傷害（含巧匠無視防禦、破甲、術士五行2.0x、風水易傷）
  const calculateDamageToMonster = (rawAtk, monster, attElem, options = {}) => {
    const {
      ignoreDefPct = 0,
      isWarlock = false,
      extraElemPct = 0,
      critMult = 1.0
    } = options;

    const totalIgnoreDef = Math.min(0.95, ignoreDefPct + (monster.armorBreakTurns > 0 ? (monster.armorBreakPct || 0) : 0));
    const effectiveMonsterDef = Math.floor(monster.def * (1 - totalIgnoreDef));

    let em = getElementMultiplier(attElem, monster.element, isWarlock);
    if (em > 1.0 && extraElemPct > 0) em += extraElemPct;

    const vulnMult = monster.vulnTurns > 0 ? (1 + (monster.vulnPct || 0)) : 1.0;
    const baseDmg = Math.max(5, Math.floor((rawAtk * critMult - effectiveMonsterDef) * em * vulnMult));
    return { dmg: baseDmg, isCounter: em > 1.0 };
  };

  // 執行存活怪物反擊（含致盲閃避、中毒減攻20%、猛將嘲諷護盾反傷、風水八卦結界、英雄陣亡扣屬性）
  const executeMonsterAttacks = (currentMonsters, pObj, rosterArr, downedIdsArr, buffsObj, hBuffsObj) => {
    let updatedPlayer = { ...pObj };
    let updatedMonsters = currentMonsters.map(m => ({ ...m }));
    let updatedRoster = [...rosterArr];
    let updatedDownedIds = [...downedIdsArr];
    let updatedBuffs = { ...buffsObj };
    let casualtiesSummary = [];

    for (let idx = 0; idx < updatedMonsters.length; idx++) {
      const m = updatedMonsters[idx];
      if (m.hp <= 0) continue;
      if (updatedPlayer.hp <= 0) break;

      // 1. 檢查致盲失誤
      if (m.blindTurns > 0 && Math.random() < (m.blindPct || 0)) {
        addLog(`🕸️ 【${m.name}】受天羅地網束縛致盲，攻擊揮空失誤！`, 'sys');
        continue;
      }

      // 2. 計算怪物實際攻擊力（中毒狀態降低 20% 攻擊力）
      const poisonAtkMult = m.poisonTurns > 0 ? 0.80 : 1.0;
      const effectiveMonsterAtk = Math.floor(m.atk * poisonAtkMult);

      const em = getElementMultiplier(m.element, updatedPlayer.element, false);
      let rawDmg = Math.max(3, Math.floor((effectiveMonsterAtk - playerTotalDef) * em));

      // 猛將【鐵血護衛】常駐物理減傷 +15%
      if (updatedPlayer.job === '猛將') {
        rawDmg = Math.max(1, Math.floor(rawDmg * 0.85));
      }
      // 猛將【不動明王架勢】自身減傷 40%
      if (updatedBuffs.reflectTurns > 0) {
        rawDmg = Math.max(1, Math.floor(rawDmg * 0.60));
      }
      // 風水師【八卦護身結界】全隊減傷
      if (updatedBuffs.baguaTurns > 0) {
        rawDmg = Math.max(1, Math.floor(rawDmg * (1 - (updatedBuffs.baguaReducePct || 0))));
      }
      // 陣法減傷
      if (rawFormBonus.damageTakenPct) {
        rawDmg = Math.max(1, Math.floor(rawDmg * (1 + rawFormBonus.damageTakenPct * formMultiplier)));
      }

      // 3. 護盾優先吸收傷害
      let hpDmg = rawDmg;
      if (updatedBuffs.shield > 0) {
        const absorbed = Math.min(updatedBuffs.shield, hpDmg);
        updatedBuffs.shield -= absorbed;
        hpDmg -= absorbed;
        addLog(`🛡️ 護盾為少俠吸收了 ${absorbed} 點傷害（剩餘護盾: ${updatedBuffs.shield}）！`, 'sys');
      }

      updatedPlayer.hp = Math.max(0, updatedPlayer.hp - hpDmg);
      addLog(
        `👹 【${m.name}】${m.poisonTurns > 0 ? '(中毒減攻20%)' : ''}襲擊少俠，造成 ${hpDmg} 點傷害！`,
        'monster'
      );

      // 4. 反傷結算（猛將反震 + 風水八卦反彈）
      let totalReflectPct = 0;
      if (updatedBuffs.reflectTurns > 0) totalReflectPct += updatedBuffs.reflectPct || 0;
      if (updatedBuffs.baguaTurns > 0) totalReflectPct += updatedBuffs.baguaReflectPct || 0;

      if (totalReflectPct > 0 && rawDmg > 0) {
        const reflectDmg = Math.max(1, Math.floor(rawDmg * totalReflectPct));
        updatedMonsters[idx].hp = Math.max(0, updatedMonsters[idx].hp - reflectDmg);
        addLog(`🔄 護體反震將 ${reflectDmg} 點傷害反彈給【${m.name}】！`, 'player');
      }

      // 猛將受擊快速攢怒 (+20)
      if (updatedPlayer.job === '猛將') {
        updatedPlayer.rage = Math.min(100, updatedPlayer.rage + 20);
      }

      if (updatedPlayer.hp <= 0) {
        addLog(`💀 少俠氣血歸零，不敵倒下！`, 'danger');
        break;
      }

      // 5. 怪物波及登場英雄（若猛將開啟嘲諷則 0% 波及；猛將平時僅 10% 波及；其他職業 38% 波及）
      const splashChance = updatedBuffs.tauntTurns > 0
        ? 0
        : updatedPlayer.job === '猛將'
          ? 0.10
          : 0.38;

      if (splashChance > 0) {
        updatedRoster = updatedRoster.map(h => {
          if (!activeHeroInstanceIds.includes(h.instanceId) || h.hp <= 0) return h;
          if (Math.random() < splashChance) {
            const { effectiveDef } = calculateHeroEffectiveStats(h, isFengShui, hBuffsObj[h.instanceId]);
            let hDmg = Math.max(2, Math.floor(effectiveMonsterAtk * 0.65) - Math.floor(effectiveDef * 0.5));
            if (updatedBuffs.baguaTurns > 0) {
              hDmg = Math.max(1, Math.floor(hDmg * (1 - (updatedBuffs.baguaReducePct || 0))));
            }
            const newHp = Math.max(0, h.hp - hDmg);

            if (newHp === 0) {
              if (!updatedDownedIds.includes(h.instanceId)) {
                updatedDownedIds.push(h.instanceId);
                const { updatedHero, actualLoss, breakdownText } = applyHeroDeathStatPenalty({ ...h, hp: 0 });
                const penaltyMsg = `💔 英雄【${h.name}】HP 歸零重傷瀕死！永久扣除 ${actualLoss} 點屬性（${breakdownText}）！`;
                addLog(penaltyMsg, 'danger');
                casualtiesSummary.push(penaltyMsg);
                return updatedHero;
              } else {
                addLog(`💀 英雄【${h.name}】再次倒下！`, 'sys');
                return { ...h, hp: 0 };
              }
            }
            return { ...h, hp: newHp };
          }
          return h;
        });
      }
    }

    return { updatedPlayer, updatedMonsters, updatedRoster, updatedDownedIds, updatedBuffs, casualtiesSummary };
  };

  // 主角戰敗處理（扣 30% 當前等級升級所需經驗，最低扣至 0、不掉級，退回安全狀態）
  const handleBattleDefeat = (pObj, finalRoster, casualtiesSummary = []) => {
    const expLoss = Math.floor(pObj.maxExp * 0.30);
    const actualExpLost = Math.min(pObj.exp, expLoss);
    const remainingExp = Math.max(0, pObj.exp - expLoss);

    const defeatedPlayer = {
      ...pObj,
      hp: 1,
      exp: remainingExp
    };

    setPlayer(defeatedPlayer);
    setHeroRoster(finalRoster);
    setMonsters([]);
    resetCombatStates();
    setCombatPhase('PLAYER_SELECT');

    addLog(`☠️ 戰鬥失敗！少俠損失了 ${actualExpLost} 點經驗值（退回安全營地，請立即前往客棧休養）。`, 'danger');

    setDefeatSummary({
      expLost: actualExpLost,
      remainingExp,
      maxExp: pObj.maxExp,
      casualties: casualtiesSummary
    });
  };

  // 撤退逃跑（70% 成功率）
  const handleFleeCombat = () => {
    if (!isInCombat) return;
    if (Math.random() < 0.70) {
      addLog(`🏃 少俠施展輕功順利擺脫敵群，返回安全營地（整備功能已解鎖）！`, 'sys');
      setMonsters([]);
      resetCombatStates();
      setCombatPhase('PLAYER_SELECT');
    } else {
      addLog(`⚠️ 撤退失敗！敵軍封鎖退路並趁勢發動追擊！`, 'danger');
      const { updatedPlayer, updatedMonsters, updatedRoster, updatedDownedIds, updatedBuffs, casualtiesSummary } = executeMonsterAttacks(
        monsters,
        player,
        heroRoster,
        battleDownedHeroIds,
        combatBuffs,
        heroBattleBuffs
      );
      setPlayer(updatedPlayer);
      setMonsters(updatedMonsters);
      setHeroRoster(updatedRoster);
      setBattleDownedHeroIds(updatedDownedIds);
      setCombatBuffs(updatedBuffs);

      if (updatedPlayer.hp <= 0) {
        handleBattleDefeat(updatedPlayer, updatedRoster, casualtiesSummary);
        return;
      }
      setTurnCount(prev => prev + 1);
      setCombatPhase('PLAYER_SELECT');
    }
  };

  // 核心回合處理
  const handleExecuteRound = (actionInput = { type: 'attack' }, isFusionUltimate = false) => {
    if (!isInCombat) {
      addLog(`⚠️ 當前沒有敵人，請先點擊「🔍 尋找怪群」主動搜敵！`, 'sys');
      return;
    }

    setCombatPhase('EXECUTING');
    let currentMonsters = monsters.map(m => ({ ...m }));
    let currentPlayer = { ...player };
    let currentRoster = heroRoster.map(h => normalizeHero(h));
    let currentBuffs = { ...combatBuffs };
    let currentHeroBuffs = { ...heroBattleBuffs };

    let targetIdx = selectedTargetIndex;
    if (!currentMonsters[targetIdx] || currentMonsters[targetIdx].hp <= 0) {
      targetIdx = currentMonsters.findIndex(m => m.hp > 0);
      if (targetIdx === -1) targetIdx = 0;
    }

    const isWarlock = currentPlayer.job === '術士';
    const isArtisan = currentPlayer.job === '巧匠';
    const innateIgnoreDef = isArtisan ? 0.20 : 0;

    // 協助執行指定英雄額外行動一次（供風水師【乾坤借法】呼叫）
    let forcedHeroAction = null;

    // 1. 主僕合擊奧義（集中轟擊單一目標，嚴格遵守只有術士/巧匠/藥師毒霧有範圍技）
    if (isFusionUltimate) {
      const targetM = currentMonsters[targetIdx];
      if (targetM) {
        let teamAtk = playerTotalAtk;
        activeHeroes.forEach(h => {
          if (h.hp > 0) {
            const { effectiveAtk } = calculateHeroEffectiveStats(h, isFengShui, currentHeroBuffs[h.instanceId]);
            teamAtk += effectiveAtk;
          }
        });
        const { dmg } = calculateDamageToMonster(teamAtk * 2.5, targetM, currentPlayer.element, {
          ignoreDefPct: innateIgnoreDef,
          isWarlock
        });
        targetM.hp = Math.max(0, targetM.hp - dmg);
        addLog(`✨ 發動【主僕合擊奧義】，全軍集火對【${targetM.name}】爆發 ${dmg} 點巨額打擊！`, 'player');
      }
      if (currentPlayer.job === '猛將') currentPlayer.rage = 0;
      else if (currentPlayer.job === '巧匠') currentPlayer.ammo = Math.max(0, currentPlayer.ammo - 4);
      else currentPlayer.mp = Math.max(0, currentPlayer.mp - 40);
    }
    // 2. 普通攻擊
    else if (actionInput.type === 'attack' && currentMonsters[targetIdx]) {
      const targetM = currentMonsters[targetIdx];
      // 巧匠天賦：彈藥 > 6 時普攻觸發二連射
      const hits = isArtisan && currentPlayer.ammo > 6 ? 2 : 1;

      for (let hIdx = 0; hIdx < hits; hIdx++) {
        if (targetM.hp <= 0) break;
        const { dmg, isCounter } = calculateDamageToMonster(playerTotalAtk, targetM, currentPlayer.element, {
          ignoreDefPct: innateIgnoreDef,
          isWarlock
        });
        targetM.hp = Math.max(0, targetM.hp - dmg);
        addLog(
          `🗡️ ${hits === 2 ? `【連環二連射 第${hIdx + 1}箭】` : '普通攻擊'}對【${targetM.name}】造成 ${dmg} 點傷害！`,
          'player'
        );
        if (isWarlock && isCounter) {
          currentPlayer.mp = Math.min(playerTotalMaxMp, currentPlayer.mp + 15);
          addLog(`🔮 【五行靈體】觸發相剋，額外回復 +15 MP！`, 'sys');
        }
      }

      if (currentPlayer.job === '猛將') {
        currentPlayer.rage = Math.min(100, currentPlayer.rage + 25);
        addLog(`🔥 猛將普攻攢怒 +25（目前怒氣: ${currentPlayer.rage}/100）`, 'sys');
      } else if (currentPlayer.job === '巧匠') {
        currentPlayer.ammo = Math.min(currentPlayer.maxAmmo, currentPlayer.ammo + 4);
        addLog(`🏹 巧匠填裝彈藥 +4（目前彈藥: ${currentPlayer.ammo}/${currentPlayer.maxAmmo}）`, 'sys');
      } else {
        currentPlayer.mp = Math.min(playerTotalMaxMp, currentPlayer.mp + 20);
        addLog(`💧 調息凝神恢復 +20 MP（目前: ${currentPlayer.mp}/${playerTotalMaxMp}）`, 'sys');
      }
    }
    // 3. 釋放主角職業專屬技能
    else if (actionInput.type === 'skill' && actionInput.skill) {
      const sk = actionInput.skill;
      const skLvl = currentPlayer.skillLevels[actionInput.skillIdx] || 0;

      if (skLvl <= 0) {
        addLog(`🔒 技能【${sk.name}】尚未學習（Lv.0），請先至「技能樹」配點學習！`, 'sys');
        setCombatPhase('PLAYER_SELECT');
        return;
      }

      // 特殊前置檢查：藥師【九轉還魂丹】必須場上有陣亡的登場英雄
      if (sk.id === 'p_s3') {
        const deadDeployed = currentRoster.filter(h => activeHeroInstanceIds.includes(h.instanceId) && h.hp <= 0);
        if (deadDeployed.length === 0) {
          addLog(`⚠️ 目前沒有已陣亡的登場英雄，無需施放【九轉還魂丹】（未消耗真元）！`, 'sys');
          setCombatPhase('PLAYER_SELECT');
          return;
        }
      }

      // 特殊前置檢查：風水師【乾坤借法】必須場上有存活的登場英雄
      if (sk.id === 'f_s1') {
        const aliveDeployed = currentRoster.filter(h => activeHeroInstanceIds.includes(h.instanceId) && h.hp > 0);
        if (aliveDeployed.length === 0) {
          addLog(`⚠️ 目前沒有存活的登場英雄可供借法（未消耗真元）！`, 'sys');
          setCombatPhase('PLAYER_SELECT');
          return;
        }
      }

      let hasResource = true;
      if (sk.costType === 'rage' && currentPlayer.rage < sk.cost) hasResource = false;
      if (sk.costType === 'mp' && currentPlayer.mp < sk.cost) hasResource = false;
      if (sk.costType === 'ammo' && currentPlayer.ammo < sk.cost) hasResource = false;

      if (!hasResource) {
        addLog(`⚠️ 資源不足，無法發動【${sk.name}】！`, 'sys');
        setCombatPhase('PLAYER_SELECT');
        return;
      }

      if (sk.costType === 'rage') currentPlayer.rage -= sk.cost;
      if (sk.costType === 'mp') currentPlayer.mp -= sk.cost;
      if (sk.costType === 'ammo') currentPlayer.ammo -= sk.cost;

      const skStats = sk.getStatsAtLevel(skLvl);

      // --- ⚔️ 猛將技能實作 ---
      if (sk.id === 'w_s1') {
        const shieldGain = Math.floor(playerTotalMaxHp * skStats.shieldPct);
        currentBuffs.shield += shieldGain;
        currentBuffs.tauntTurns = 2;
        addLog(`🛡️ 猛將施展【金剛怒吼 (Lv.${skLvl})】，嘲諷全場敵怪 2 回合，並獲得 ${shieldGain} 點護盾！`, 'player');
      } else if (sk.id === 'w_s2') {
        const targetM = currentMonsters[targetIdx];
        if (targetM) {
          const { dmg } = calculateDamageToMonster(playerTotalAtk * skStats.mult, targetM, currentPlayer.element);
          targetM.hp = Math.max(0, targetM.hp - dmg);
          targetM.armorBreakTurns = 2;
          targetM.armorBreakPct = skStats.breakPct;
          addLog(`⚔️ 猛將施展【裂地破甲斬 (Lv.${skLvl})】，對【${targetM.name}】造成 ${dmg} 點傷害並破甲降防 ${Math.round(skStats.breakPct * 100)}% (2回合)！`, 'player');
        }
      } else if (sk.id === 'w_s3') {
        const targetM = currentMonsters[targetIdx];
        if (targetM) {
          const { dmg } = calculateDamageToMonster(playerTotalAtk * skStats.mult, targetM, currentPlayer.element);
          targetM.hp = Math.max(0, targetM.hp - dmg);
          currentBuffs.reflectTurns = 2;
          currentBuffs.reflectPct = skStats.reflectPct;
          addLog(`🔥 猛將施展【不動明王架勢 (Lv.${skLvl})】，對【${targetM.name}】造成 ${dmg} 點重擊，進入減傷 40%＋反彈 ${Math.round(skStats.reflectPct * 100)}% 狀態！`, 'player');
        }
      }
      // --- 🏹 巧匠技能實作（單體 / 最多 3 隻） ---
      else if (sk.id === 'a_s1') {
        const targetM = currentMonsters[targetIdx];
        if (targetM) {
          const isFullHp = targetM.hp === targetM.maxHp;
          const critMult = isFullHp ? 1.5 : 1.0;
          const { dmg } = calculateDamageToMonster(playerTotalAtk * skStats.mult, targetM, currentPlayer.element, {
            ignoreDefPct: 0.50,
            critMult
          });
          targetM.hp = Math.max(0, targetM.hp - dmg);
          addLog(`🎯 巧匠施展【穿雲追魂箭 (Lv.${skLvl})】${isFullHp ? '💥滿血必暴擊！' : ''}對【${targetM.name}】造成 ${dmg} 點無視半甲重傷！`, 'player');
        }
      } else if (sk.id === 'a_s2') {
        const hitIndices = pickUpToNMonsterIndices(currentMonsters, targetIdx, 3);
        hitIndices.forEach(mIdx => {
          const m = currentMonsters[mIdx];
          const { dmg } = calculateDamageToMonster(playerTotalAtk * skStats.mult, m, currentPlayer.element, {
            ignoreDefPct: innateIgnoreDef
          });
          m.hp = Math.max(0, m.hp - dmg);
          addLog(`🏹 巧匠施展【連珠散射 (Lv.${skLvl})】，貫穿【${m.name}】造成 ${dmg} 點傷害！`, 'player');
        });
      } else if (sk.id === 'a_s3') {
        const hitIndices = pickUpToNMonsterIndices(currentMonsters, targetIdx, 3);
        hitIndices.forEach(mIdx => {
          const m = currentMonsters[mIdx];
          const { dmg } = calculateDamageToMonster(playerTotalAtk * skStats.mult, m, currentPlayer.element, {
            ignoreDefPct: innateIgnoreDef
          });
          m.hp = Math.max(0, m.hp - dmg);
          m.blindTurns = 2;
          m.blindPct = skStats.blindPct;
          addLog(`🕸️ 巧匠施展【天羅地網陣 (Lv.${skLvl})】，對【${m.name}】造成 ${dmg} 點傷害並致盲 -${Math.round(skStats.blindPct * 100)}% 命中！`, 'player');
        });
      }
      // --- 🔮 術士技能實作（單體 / 最多 5 隻大範圍） ---
      else if (sk.id === 'm_s1') {
        const targetM = currentMonsters[targetIdx];
        if (targetM) {
          const { dmg, isCounter } = calculateDamageToMonster(playerTotalAtk * skStats.mult, targetM, currentPlayer.element, {
            isWarlock: true
          });
          targetM.hp = Math.max(0, targetM.hp - dmg);
          addLog(`🔮 術士施展【本命靈訣 (Lv.${skLvl})】，轟擊【${targetM.name}】造成 ${dmg} 點五行法傷！`, 'player');
          if (isCounter) {
            currentPlayer.mp = Math.min(playerTotalMaxMp, currentPlayer.mp + 15);
            addLog(`✨ 【五行靈體】相剋共鳴，返還 +15 MP！`, 'sys');
          }
        }
      } else if (sk.id === 'm_s2') {
        const counteredElem = ELEMENTS[currentPlayer.element]?.counters || '木';
        const hitIndices = pickUpToNMonsterIndices(currentMonsters, targetIdx, 5);
        let anyCountered = false;
        hitIndices.forEach(mIdx => {
          const m = currentMonsters[mIdx];
          const { dmg, isCounter } = calculateDamageToMonster(playerTotalAtk * skStats.mult, m, currentPlayer.element, {
            isWarlock: true
          });
          if (isCounter) anyCountered = true;
          m.hp = Math.max(0, m.hp - dmg);
          m.element = counteredElem;
          m.elemShiftTurns = 2;
          addLog(`☯️ 術士【五行逆轉大陣 (Lv.${skLvl})】轟擊【${m.name}】(${dmg}傷) 並將其轉化為【${counteredElem}】屬性！`, 'player');
        });
        if (anyCountered) {
          currentPlayer.mp = Math.min(playerTotalMaxMp, currentPlayer.mp + 15);
          addLog(`✨ 【五行靈體】相剋共鳴，返還 +15 MP！`, 'sys');
        }
      } else if (sk.id === 'm_s3') {
        const hitIndices = pickUpToNMonsterIndices(currentMonsters, targetIdx, 5);
        let anyCountered = false;
        hitIndices.forEach(mIdx => {
          const m = currentMonsters[mIdx];
          const { dmg, isCounter } = calculateDamageToMonster(playerTotalAtk * skStats.mult, m, currentPlayer.element, {
            isWarlock: true
          });
          if (isCounter) anyCountered = true;
          m.hp = Math.max(0, m.hp - dmg);
          m.burnTurns = 2;
          m.burnDmg = Math.max(10, Math.floor(playerTotalAtk * 0.45));
          addLog(`🔥 術士【九天焚世咒 (Lv.${skLvl})】天劫轟炸【${m.name}】造成 ${dmg} 點毀滅法傷並附加灼燒！`, 'player');
        });
        if (anyCountered) {
          currentPlayer.mp = Math.min(playerTotalMaxMp, currentPlayer.mp + 15);
          addLog(`✨ 【五行靈體】相剋共鳴，返還 +15 MP！`, 'sys');
        }
      }
      // --- 🌿 藥師技能實作（無回血，單體毒 / 最多 3 隻毒＋削弱20%攻 / 戰場復活） ---
      else if (sk.id === 'p_s1') {
        const targetM = currentMonsters[targetIdx];
        if (targetM) {
          const { dmg } = calculateDamageToMonster(playerTotalAtk * skStats.mult, targetM, currentPlayer.element);
          targetM.hp = Math.max(0, targetM.hp - dmg);
          targetM.poisonTurns = 3;
          targetM.poisonPct = skStats.poisonPct;
          targetM.poisonStacks = Math.min(2, (targetM.poisonStacks || 0) + 1);
          addLog(`🧪 藥師施展【穿心腐骨散 (Lv.${skLvl})】，對【${targetM.name}】造成 ${dmg} 點毒傷並附加中毒（${targetM.poisonStacks}層毒傷＋削弱 20% 攻擊力）！`, 'player');
        }
      } else if (sk.id === 'p_s2') {
        const hitIndices = pickUpToNMonsterIndices(currentMonsters, targetIdx, 3);
        hitIndices.forEach(mIdx => {
          const m = currentMonsters[mIdx];
          const { dmg } = calculateDamageToMonster(playerTotalAtk * skStats.mult, m, currentPlayer.element);
          m.hp = Math.max(0, m.hp - dmg);
          m.poisonTurns = 3;
          m.poisonPct = skStats.poisonPct;
          m.poisonStacks = Math.min(2, (m.poisonStacks || 0) + 1);
          addLog(`☠️ 藥師施展【五毒瘴氣 (Lv.${skLvl})】，毒霧籠罩【${m.name}】(${dmg}傷) 並使其陷入中毒（削弱 20% 攻擊力）！`, 'player');
        });
      } else if (sk.id === 'p_s3') {
        const deadHeroes = currentRoster.filter(h => activeHeroInstanceIds.includes(h.instanceId) && h.hp <= 0);
        const targetHero = deadHeroes[0];
        if (targetHero) {
          const { effectiveMaxHp } = calculateHeroEffectiveStats(targetHero, isFengShui);
          const revivedHp = Math.max(1, Math.floor(effectiveMaxHp * skStats.reviveHpPct));
          currentRoster = currentRoster.map(h => h.instanceId === targetHero.instanceId ? { ...h, hp: revivedHp } : h);
          currentHeroBuffs[targetHero.instanceId] = {
            surgeTurns: 2,
            surgeAtkPct: skStats.atkBuffPct
          };
          addLog(`💊 藥師餵服【九轉還魂丹 (Lv.${skLvl})】，成功復活英雄【${targetHero.name}】（恢復 ${revivedHp} HP）並激發攻擊力 +${Math.round(skStats.atkBuffPct * 100)}%！`, 'player');
        }
      }
      // --- ☯️ 風水師技能實作（純輔助驅動英雄卡 / 全隊結界 / 弱攻全場易傷） ---
      else if (sk.id === 'f_s1') {
        const aliveHeroes = currentRoster.filter(h => activeHeroInstanceIds.includes(h.instanceId) && h.hp > 0);
        const chosenHero = aliveHeroes[Math.floor(Math.random() * aliveHeroes.length)];
        if (chosenHero) {
          forcedHeroAction = {
            heroInstanceId: chosenHero.instanceId,
            bonusDmgPct: skStats.bonusDmgPct
          };
          addLog(`☯️ 風水師施展【乾坤借法 (Lv.${skLvl})】，引動天地靈氣令英雄【${chosenHero.name}】立即額外爆發主動技能！`, 'player');
        }
      } else if (sk.id === 'f_s2') {
        currentBuffs.baguaTurns = 2;
        currentBuffs.baguaReducePct = skStats.reducePct;
        currentBuffs.baguaReflectPct = skStats.reflectPct;
        addLog(`🔯 風水師展開【八卦護身結界 (Lv.${skLvl})】，全隊 2 回合承傷 -${Math.round(skStats.reducePct * 100)}% 並反彈 ${Math.round(skStats.reflectPct * 100)}% 傷害！`, 'player');
      } else if (sk.id === 'f_s3') {
        currentMonsters.forEach(m => {
          if (m.hp > 0) {
            const { dmg } = calculateDamageToMonster(playerTotalAtk * skStats.mult, m, currentPlayer.element);
            m.hp = Math.max(0, m.hp - dmg);
            m.vulnTurns = 2;
            m.vulnPct = skStats.vulnPct;
          }
        });
        addLog(`🌌 風水師施展【奇門天象變 (Lv.${skLvl})】，造成微弱法傷並使全場敵怪陷入「易傷 +${Math.round(skStats.vulnPct * 100)}%」(2回合)！`, 'player');
      }
    }

    // 4. 登場英雄聯動打擊（含風水師【奇門陣眼】+15% 技能觸發率與【乾坤借法】額外行動）
    let teamHealFromHeroes = 0;

    const executeSingleHeroTurn = (h, forceSkill = false, extraBonusMult = 0) => {
      if (!activeHeroInstanceIds.includes(h.instanceId) || h.hp <= 0) return h;
      const aliveTargets = currentMonsters.filter(m => m.hp > 0);
      if (aliveTargets.length === 0) return h;
      const validTarget = aliveTargets[Math.floor(Math.random() * aliveTargets.length)];

      const { effectiveAtk, elemDmgPct, skillChance } = calculateHeroEffectiveStats(
        h,
        isFengShui,
        currentHeroBuffs[h.instanceId]
      );
      const activeCards = h.activeSkillSlots || [];
      const shouldCastSkill = activeCards.length > 0 && (forceSkill || Math.random() < skillChance);

      if (shouldCastSkill) {
        const cardToCast = activeCards[Math.floor(Math.random() * activeCards.length)];
        const mult = (cardToCast.mult || 1.8) * (1 + extraBonusMult);

        if (cardToCast.target === 'aoe') {
          currentMonsters.forEach(m => {
            if (m.hp > 0) {
              const { dmg } = calculateDamageToMonster(effectiveAtk * mult, m, h.element, { extraElemPct: elemDmgPct });
              m.hp = Math.max(0, m.hp - dmg);
            }
          });
          addLog(`✨ ${forceSkill ? '【乾坤借法連動】' : ''}【Tier ${h.tier}】英雄【${h.name}】觸發技能卡【${cardToCast.name}】，橫掃全場造成廣域打擊！`, 'hero');
        } else if (cardToCast.target === 'heal') {
          const healVal = Math.floor(effectiveAtk * mult);
          teamHealFromHeroes += healVal;
          addLog(`🌿 ${forceSkill ? '【乾坤借法連動】' : ''}【Tier ${h.tier}】英雄【${h.name}】施展【${cardToCast.name}】，為全隊恢復 +${healVal} HP！`, 'hero');
        } else {
          const { dmg } = calculateDamageToMonster(effectiveAtk * mult, validTarget, h.element, { extraElemPct: elemDmgPct });
          validTarget.hp = Math.max(0, validTarget.hp - dmg);
          addLog(`⚡ ${forceSkill ? '【乾坤借法連動】' : ''}【Tier ${h.tier}】英雄【${h.name}】爆發技能卡【${cardToCast.name}】，對【${validTarget.name}】造成 ${dmg} 點重創！`, 'hero');
        }
      } else {
        const bonusMult = forceSkill ? (1 + extraBonusMult) : 1.0;
        const { dmg } = calculateDamageToMonster(effectiveAtk * bonusMult, validTarget, h.element, { extraElemPct: elemDmgPct });
        validTarget.hp = Math.max(0, validTarget.hp - dmg);
        addLog(`💥 ${forceSkill ? '【乾坤借法連動】' : ''}英雄【${h.name}】攻擊【${validTarget.name}】，造成 ${dmg} 點打擊！`, 'hero');
      }

      let updatedRage = h.rage || 0;
      let updatedAmmo = h.ammo || 6;
      let updatedMp = h.mp || 50;
      if (h.heroClass === '猛將') updatedRage = Math.min(100, updatedRage + 20);
      else if (h.heroClass === '巧匠') updatedAmmo = Math.min(h.maxAmmo || 6, updatedAmmo + 2);
      else updatedMp = Math.min(h.maxMp || 100, updatedMp + 15);

      return { ...h, rage: updatedRage, ammo: updatedAmmo, mp: updatedMp };
    };

    currentRoster = currentRoster.map(h => executeSingleHeroTurn(h, false, 0));

    // 若風水師施展了【乾坤借法】，指定英雄立即再執行一次必發技能行動
    if (forcedHeroAction) {
      currentRoster = currentRoster.map(h =>
        h.instanceId === forcedHeroAction.heroInstanceId
          ? executeSingleHeroTurn(h, true, forcedHeroAction.bonusDmgPct)
          : h
      );
    }

    if (teamHealFromHeroes > 0) {
      currentPlayer.hp = Math.min(playerTotalMaxHp, currentPlayer.hp + teamHealFromHeroes);
      currentRoster = currentRoster.map(h => {
        if (!activeHeroInstanceIds.includes(h.instanceId) || h.hp <= 0) return h;
        const { effectiveMaxHp } = calculateHeroEffectiveStats(h, isFengShui, currentHeroBuffs[h.instanceId]);
        return { ...h, hp: Math.min(effectiveMaxHp, h.hp + teamHealFromHeroes) };
      });
    }

    // 檢查是否全滅
    if (currentMonsters.every(m => m.hp <= 0)) {
      addLog(`🎉 敵方全數殲滅！戰鬥勝利（整備功能已解鎖）！`, 'sys');
      handleBattleVictory(currentPlayer, currentMonsters, currentRoster);
      return;
    }

    // 5. 敵方回合前結算【中毒】與【灼燒】持續真實傷害
    let anyPoisonedAlive = false;
    currentMonsters = currentMonsters.map(m => {
      if (m.hp <= 0) return m;
      let updatedM = { ...m };

      if (updatedM.poisonTurns > 0) {
        const poisonDmg = Math.max(1, Math.floor(updatedM.maxHp * (updatedM.poisonPct || 0.08) * (updatedM.poisonStacks || 1)));
        updatedM.hp = Math.max(0, updatedM.hp - poisonDmg);
        addLog(`☠️ 【${updatedM.name}】劇毒發作，受到 ${poisonDmg} 點無視防禦真傷（攻擊力持續 -20%）！`, 'player');
        if (updatedM.hp > 0) anyPoisonedAlive = true;
      }

      if (updatedM.hp > 0 && updatedM.burnTurns > 0) {
        const burnDmg = updatedM.burnDmg || 15;
        updatedM.hp = Math.max(0, updatedM.hp - burnDmg);
        addLog(`🔥 【${updatedM.name}】受到灼燒持續傷害 ${burnDmg} 點！`, 'player');
      }

      return updatedM;
    });

    // 若毒傷／灼燒直接跳死全部敵怪
    if (currentMonsters.every(m => m.hp <= 0)) {
      addLog(`🎉 敵軍在劇毒與烈焰中全數倒下！戰鬥勝利（整備功能已解鎖）！`, 'sys');
      handleBattleVictory(currentPlayer, currentMonsters, currentRoster);
      return;
    }

    // 6. 存活怪物反擊
    const { updatedPlayer, updatedMonsters, updatedRoster, updatedDownedIds, updatedBuffs, casualtiesSummary } = executeMonsterAttacks(
      currentMonsters,
      currentPlayer,
      currentRoster,
      battleDownedHeroIds,
      currentBuffs,
      currentHeroBuffs
    );

    setBattleDownedHeroIds(updatedDownedIds);

    if (updatedPlayer.hp <= 0) {
      handleBattleDefeat(updatedPlayer, updatedRoster, casualtiesSummary);
      return;
    }

    // 再次檢查反傷是否彈死最後一隻怪物
    if (updatedMonsters.every(m => m.hp <= 0)) {
      addLog(`🎉 敵軍在反震護體下全數覆滅！戰鬥勝利（整備功能已解鎖）！`, 'sys');
      handleBattleVictory(updatedPlayer, updatedMonsters, updatedRoster);
      return;
    }

    // 7. 回合結束：遞減敵我雙方 Buff/Debuff 回合數，並結算藥師被動回藍
    const tickedMonsters = updatedMonsters.map(m => {
      const nextElemShift = Math.max(0, (m.elemShiftTurns || 0) - 1);
      const nextPoison = Math.max(0, (m.poisonTurns || 0) - 1);
      return {
        ...m,
        armorBreakTurns: Math.max(0, (m.armorBreakTurns || 0) - 1),
        blindTurns: Math.max(0, (m.blindTurns || 0) - 1),
        elemShiftTurns: nextElemShift,
        element: nextElemShift === 0 ? (m.originalElement || m.element) : m.element,
        burnTurns: Math.max(0, (m.burnTurns || 0) - 1),
        poisonTurns: nextPoison,
        poisonStacks: nextPoison === 0 ? 0 : m.poisonStacks,
        vulnTurns: Math.max(0, (m.vulnTurns || 0) - 1)
      };
    });

    const tickedBuffs = {
      ...updatedBuffs,
      tauntTurns: Math.max(0, (updatedBuffs.tauntTurns || 0) - 1),
      reflectTurns: Math.max(0, (updatedBuffs.reflectTurns || 0) - 1),
      baguaTurns: Math.max(0, (updatedBuffs.baguaTurns || 0) - 1)
    };

    const tickedHeroBuffs = {};
    Object.keys(currentHeroBuffs).forEach(hId => {
      const nextTurns = Math.max(0, (currentHeroBuffs[hId]?.surgeTurns || 0) - 1);
      if (nextTurns > 0) {
        tickedHeroBuffs[hId] = { ...currentHeroBuffs[hId], surgeTurns: nextTurns };
      }
    });

    // 藥師【五毒百草】每回合自動回藍 +10 MP，場上有中毒敵怪額外 +8 MP
    if (updatedPlayer.job === '藥師') {
      const regenMp = 10 + (anyPoisonedAlive ? 8 : 0);
      updatedPlayer.mp = Math.min(playerTotalMaxMp, updatedPlayer.mp + regenMp);
    }

    setMonsters(tickedMonsters);
    setPlayer(updatedPlayer);
    setHeroRoster(updatedRoster);
    setCombatBuffs(tickedBuffs);
    setHeroBattleBuffs(tickedHeroBuffs);
    setTurnCount(prev => prev + 1);
    setCombatPhase('PLAYER_SELECT');
  };

  // 戰鬥勝利結算（Lv.30 上限封頂）
  const handleBattleVictory = (pObj, defeatedMonsters, currentRoster) => {
    let totalGold = 0, totalExp = 0, droppedStones = 0;
    let droppedEquipments = [];

    defeatedMonsters.forEach(m => {
      totalGold += m.gold;
      totalExp += m.exp;
      if (Math.random() < 0.45) droppedStones += 1;
      if (Math.random() < 0.35) {
        const template = ITEM_DROP_POOL[Math.floor(Math.random() * ITEM_DROP_POOL.length)];
        droppedEquipments.push({ ...template, refineLevel: 0, uid: `eq_${Date.now()}_${Math.random()}` });
      }
    });

    let droppedHero = null;
    if (Math.random() < 0.30) {
      const candidates = HERO_TEMPLATES.filter(t => t.tier <= Math.min(5, currentZoneIndex + 2));
      const picked = candidates[Math.floor(Math.random() * candidates.length)];
      droppedHero = normalizeHero(instantiateHero(picked, true, null, getRandomElement));
    }

    let droppedSkillCard = null;
    if (Math.random() < 0.35) {
      const cardTemplate = SKILL_CARDS_DB[Math.floor(Math.random() * SKILL_CARDS_DB.length)];
      droppedSkillCard = createSkillCardInstance(cardTemplate);
      setSkillCardsInventory(prev => [...prev, droppedSkillCard]);
    }

    let mergedRoster = [...currentRoster];
    if (droppedHero) {
      mergedRoster.push(droppedHero);
    }

    let msgs = [];
    const finalRoster = mergedRoster.map(hero => {
      if (!activeHeroInstanceIds.includes(hero.instanceId)) return hero;
      const { updatedHero, upgradedMsgs } = processHeroExpGain(hero, totalExp);
      if (upgradedMsgs.length > 0) msgs.push(...upgradedMsgs);
      return updatedHero;
    });

    let newPlayer = {
      ...pObj,
      gold: pObj.gold + totalGold,
      refineStones: pObj.refineStones + droppedStones,
      exp: pObj.level >= MAX_LEVEL ? 0 : pObj.exp + totalExp
    };

    while (newPlayer.level < MAX_LEVEL && newPlayer.exp >= newPlayer.maxExp) {
      newPlayer.exp -= newPlayer.maxExp;
      newPlayer.level += 1;
      newPlayer.maxExp = Math.floor(newPlayer.maxExp * 1.45);
      newPlayer.maxHp += 30;
      newPlayer.maxMp += 20;
      newPlayer.hp = newPlayer.maxHp;
      newPlayer.mp = newPlayer.maxMp;
      newPlayer.statPoints += 5;
      newPlayer.sp += 1;
      newPlayer.tp += 1;
      msgs.push(`🎉 少俠升級至 Level ${newPlayer.level}${newPlayer.level === MAX_LEVEL ? ' (已達滿級上限!)' : ''}！獲得 5 點屬性點與 1 點 SP！`);
    }

    if (newPlayer.level >= MAX_LEVEL) {
      newPlayer.level = MAX_LEVEL;
      newPlayer.exp = 0;
    }

    setPlayer(newPlayer);
    setHeroRoster(finalRoster);
    setMonsters([]);
    resetCombatStates();
    setCombatPhase('PLAYER_SELECT');

    if (droppedEquipments.length > 0) {
      setEquipmentInventory(prev => [...prev, ...droppedEquipments]);
    }

    setVictorySummary({
      gold: totalGold,
      exp: totalExp,
      stones: droppedStones,
      droppedEquipments,
      droppedHero,
      droppedSkillCard,
      msgs
    });
  };

  const handleRestInn = () => {
    if (isInCombat) {
      addLog(`🔒 戰鬥進行中，無法返回客棧休息！`, 'sys');
      return;
    }
    setPlayer(prev => ({
      ...prev,
      hp: playerTotalMaxHp,
      mp: playerTotalMaxMp,
      rage: 0,
      ammo: prev.maxAmmo
    }));
    setHeroRoster(prev => prev.map(h => {
      const { effectiveMaxHp } = calculateHeroEffectiveStats(h, isFengShui);
      return {
        ...h,
        hp: effectiveMaxHp,
        fatigue: 0,
        rage: 0,
        ammo: h.maxAmmo || 6,
        mp: h.maxMp || 100
      };
    }));
    addLog(`🏨 客棧休養完成，全隊生命、資源恢復滿值！`, 'sys');
  };

  const handleEquipItem = (item) => {
    if (isInCombat) {
      addLog(`🔒 戰鬥進行中，無法更換裝備！`, 'sys');
      return;
    }
    setPlayer(p => ({ ...p, equipped: { ...p.equipped, [item.type]: item } }));
    addLog(`🛡️ 少俠已裝備【${item.name}】。`, 'sys');
  };

  // 切換陣法（限定只有風水師才可轉陣）
  const handleSelectFormation = (fKey) => {
    if (player.job !== '風水師') {
      addLog(`🔒 僅限「風水師」職業可變換陣法！`, 'sys');
      return;
    }
    if (isInCombat) {
      addLog(`🔒 戰鬥進行中，無法變換陣法！`, 'sys');
      return;
    }
    setCurrentFormation(fKey);
    addLog(`☯️ 風水師施展【奇門陣眼】，切換為【${FORMATIONS_CONFIG[fKey].name}】（陣法增益 2 倍強化）！`, 'sys');
  };

  const handleRefineEquipment = (item) => {
    if (isInCombat) {
      addLog(`🔒 戰鬥進行中，無法進行鐵匠精鍊！`, 'sys');
      return;
    }
    const level = item.refineLevel || 0;
    if (player.gold < (level + 1) * 120 || player.refineStones < 1) return;
    const isSuccess = Math.random() < (level < 4 ? 1.0 : 0.65);
    setPlayer(p => ({ ...p, gold: p.gold - (level + 1) * 120, refineStones: p.refineStones - 1 }));
    const nextLevel = isSuccess ? level + 1 : Math.max(0, level - 1);
    const updated = { ...item, refineLevel: nextLevel };

    setEquipmentInventory(prev => prev.map(i => i.uid === item.uid ? updated : i));
    if (player.equipped[item.type]?.uid === item.uid) {
      setPlayer(p => ({ ...p, equipped: { ...p.equipped, [item.type]: updated } }));
    }
  };

  const handleSocketGem = (item, gem, socketIdx) => {
    if (isInCombat) {
      addLog(`🔒 戰鬥進行中，無法鑲嵌寶石！`, 'sys');
      return;
    }
    let newSockets = [...(item.sockets || [null])];
    newSockets[socketIdx] = gem;
    const updated = { ...item, sockets: newSockets };

    setEquipmentInventory(prev => prev.map(i => i.uid === item.uid ? updated : i));
    if (player.equipped[item.type]?.uid === item.uid) {
      setPlayer(p => ({ ...p, equipped: { ...p.equipped, [item.type]: updated } }));
    }
  };

  const handleExportSave = () => {
    const jsonStr = JSON.stringify({ 
      player, 
      heroRoster, 
      activeHeroInstanceIds, 
      currentFormation, 
      equipmentInventory, 
      skillCardsInventory,
      towerFloor 
    }, null, 2);
    setJsonSaveText(jsonStr);
    setSaveLoadStatus('存檔 JSON 匯出成功！');
  };

  const handleImportSave = () => {
    if (isInCombat) {
      setSaveLoadStatus('🔒 戰鬥中無法讀取存檔！');
      return;
    }
    try {
      const parsed = JSON.parse(jsonSaveText);
      if (parsed && parsed.player) {
        const loadedP = {
          ...parsed.player,
          level: Math.min(MAX_LEVEL, parsed.player.level || 1)
        };
        setPlayer(loadedP);
        setHeroRoster((parsed.heroRoster || []).map(normalizeHero));
        setActiveHeroInstanceIds(parsed.activeHeroInstanceIds || []);
        setCurrentFormation(loadedP.job === '風水師' ? (parsed.currentFormation || 'none') : 'none');
        setEquipmentInventory(parsed.equipmentInventory || []);
        setSkillCardsInventory(parsed.skillCardsInventory || []);
        setTowerFloor(parsed.towerFloor || 1);
        setMonsters([]);
        resetCombatStates();
        setGameStarted(true);
        setSaveLoadStatus('✅ 成功匯入遊戲進度！');
      }
    } catch (e) {
      setSaveLoadStatus('❌ 匯入失敗，請確認 JSON 格式。');
    }
  };

  const handleResetSave = () => {
    if (window.confirm("確定要重置所有遊戲紀錄嗎？")) {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      window.location.reload();
    }
  };

  return (
    <GameUI
      gameStarted={gameStarted}
      isInCombat={isInCombat}
      creationData={creationData}
      setCreationData={setCreationData}
      starterHeroCandidates={starterHeroCandidates}
      handleStartGame={handleStartGame}
      player={player}
      setPlayer={setPlayer}
      playerTotalMaxHp={playerTotalMaxHp}
      playerTotalMaxMp={playerTotalMaxMp}
      playerTotalAtk={playerTotalAtk}
      playerTotalDef={playerTotalDef}
      playerTotalSpeed={playerTotalSpeed}
      activeHeroes={activeHeroes}
      activeHeroInstanceIds={activeHeroInstanceIds}
      heroRoster={heroRoster}
      setHeroRoster={setHeroRoster}
      handleToggleDeployHero={handleToggleDeployHero}
      handleReleaseHero={handleReleaseHero}
      handleEquipSkillCard={handleEquipSkillCard}
      handleUnequipSkillCard={handleUnequipSkillCard}
      handleRestInn={handleRestInn}
      handleEquipItem={handleEquipItem}
      handleSelectFormation={handleSelectFormation}
      handleSelectZone={handleSelectZone}
      handleFleeCombat={handleFleeCombat}
      monsters={monsters}
      selectedTargetIndex={selectedTargetIndex}
      setSelectedTargetIndex={setSelectedTargetIndex}
      combatLogs={combatLogs}
      combatBuffs={combatBuffs}
      heroBattleBuffs={heroBattleBuffs}
      turnCount={turnCount}
      combatPhase={combatPhase}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      currentZoneIndex={currentZoneIndex}
      spawnEncounter={spawnEncounter}
      handleExecuteRound={handleExecuteRound}
      equipmentInventory={equipmentInventory}
      setEquipmentInventory={setEquipmentInventory}
      skillCardsInventory={skillCardsInventory}
      setSkillCardsInventory={setSkillCardsInventory}
      handleRefineEquipment={handleRefineEquipment}
      handleSocketGem={handleSocketGem}
      currentFormation={effectiveFormationKey}
      towerFloor={towerFloor}
      setTowerFloor={setTowerFloor}
      jsonSaveText={jsonSaveText}
      setJsonSaveText={setJsonSaveText}
      saveLoadStatus={saveLoadStatus}
      handleExportSave={handleExportSave}
      handleImportSave={handleImportSave}
      handleResetSave={handleResetSave}
      victorySummary={victorySummary}
      setVictorySummary={setVictorySummary}
      defeatSummary={defeatSummary}
      setDefeatSummary={setDefeatSummary}
      chatEndRef={chatEndRef}
    />
  );
}
