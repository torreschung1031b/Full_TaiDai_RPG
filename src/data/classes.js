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
        return { shieldPct: +(0.25 + (effLvl - 1) * 0.03).toFixed(2) };
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
        return { mult: +(2.40 + (effLvl - 1) * 0.12).toFixed(2) };
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
        return { mult: +(1.50 + (effLvl - 1) * 0.10).toFixed(2) };
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
        return { mult: +(2.30 + (effLvl - 1) * 0.12).toFixed(2) };
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
        return { mult: +(1.30 + (effLvl - 1) * 0.09).toFixed(2) };
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
        return { mult: +(2.60 + (effLvl - 1) * 0.13).toFixed(2) };
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
        return { bonusDmgPct: +((effLvl - 1) * 0.05).toFixed(2) };
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
