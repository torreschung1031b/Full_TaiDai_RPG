// ==========================================
// 1. 五大職業與二轉專精設定 (JOBS & ADVANCEMENTS)
// ==========================================
export const JOBS_CONFIG = {
  '猛將': {
    title: '猛將',
    icon: '⚔️',
    resourceType: 'rage',
    baseHp: 260, baseMp: 0, baseAtk: 36, baseDef: 15, baseSpeed: 10,
    desc: '前排鐵壁與護衛先鋒。嚴禁法術！透過破軍斬與受擊累積【怒氣 (0-100)】，為隊友分擔傷害並吸血續航。',
    advancements: [
      { id: 'berserker', name: '狂戰士', desc: '血量越低物理爆發越高，強化嗜血狂襲回復量。' },
      { id: 'guardian', name: '鎮國鐵衛', desc: '鋼鐵神盾！大幅提升護甲與援護減傷能力。' }
    ]
  },
  '巧匠': {
    title: '巧匠',
    icon: '🏹',
    resourceType: 'ammo',
    baseHp: 180, baseMp: 50, baseAtk: 32, baseDef: 8, baseSpeed: 18,
    desc: '物理輸出與陷阱大師。消耗【暗器彈藥】施放撕裂流血、全場易傷與萬箭貫日爆發。',
    advancements: [
      { id: 'sniper', name: '神射手', desc: '無視防禦與高額暴擊！強化萬箭貫日穿透力。' },
      { id: 'trapper', name: '機關師', desc: '強化破甲蒺藜易傷幅度，配合英雄打出極限輸出。' }
    ]
  },
  '術士': {
    title: '術士',
    icon: '🔥',
    resourceType: 'incantation',
    baseHp: 145, baseMp: 170, baseAtk: 38, baseDef: 5, baseSpeed: 12,
    desc: '五行元素法術核心。施放業火灼燒、太陰致盲控場與九天雷劫全場法術轟炸。',
    advancements: [
      { id: 'elementalist', name: '元素使', desc: '五行相剋爆發傷害額外提升 35%。' },
      { id: 'yin_yang', name: '陰陽師', desc: '強化太陰迷霧致盲與業火灼燒持續壓制。' }
    ]
  },
  '藥師': {
    title: '藥師',
    icon: '🌿',
    resourceType: 'mp',
    baseHp: 175, baseMp: 135, baseAtk: 25, baseDef: 9, baseSpeed: 11,
    desc: '懸壺濟世醫者。精通單體急救強回血、五毒瘴氣下毒以及全體甘霖緩回。',
    advancements: [
      { id: 'saint_healer', name: '聖醫', desc: '大幅強化單體急救與全體甘霖治療量。' },
      { id: 'poison_doctor', name: '毒醫', desc: '強化五毒散腐蝕劇毒與回藍續航。' }
    ]
  },
  '風水師': {
    title: '風水師',
    icon: '☯️',
    resourceType: 'mp',
    baseHp: 180, baseMp: 120, baseAtk: 28, baseDef: 10, baseSpeed: 14,
    desc: '奇門遁甲軍師。專精為全隊與英雄加持攻速暴擊、八卦守護結界，並以天機大陣大幅催升英雄技能發動率！',
    advancements: [
      { id: 'formation_master', name: '陣法宗師', desc: '陣法增益效果提升 100%，全隊屬性暴漲。' },
      { id: 'summoner', name: '天機真人', desc: '天機催靈期間英雄主動技發動率再額外提高。' }
    ]
  }
};

// ==========================================
// 2. 主角全職業 4 招技能資料庫 (PROTAGONIST SKILLS DB)
// - 第 1 招：CD 0 基礎循環技（取代無係數普攻，1級自動習得）
// - 第 2 招：CD 2 戰術核心技（1級自動習得）
// - 第 3 招：CD 3 進階戰術技（需主角 Lv.5 ＋ 第2招達 Lv.5）
// - 第 4 招：CD 4 終極奧義技（需主角 Lv.10 ＋ 第3招達 Lv.5）
// ==========================================
export const PROTAGONIST_SKILLS_DB = {
  '猛將': [
    {
      id: 'w_s1',
      icon: '⚔️',
      name: '破軍斬',
      type: 'single',
      costType: 'rage',
      cost: 0,
      baseMult: 1.0,
      cd: 0,
      unlockLevel: 1,
      reqPrevSkillLevel: 0,
      getStatsAtLevel: (lvl = 1) => ({
        mult: Number((1.0 + (lvl - 1) * 0.14).toFixed(2)),
        rageGain: 25 + Math.floor((lvl - 1) * 2)
      }),
      desc: '【基礎・CD 0】揮動重兵劈斬單體敵怪（吃力量係數），並累積 +25 以上怒氣。'
    },
    {
      id: 'w_s2',
      icon: '🛡️',
      name: '鐵壁援護',
      type: 'shield',
      costType: 'rage',
      cost: 20,
      baseMult: 1.0,
      cd: 2,
      unlockLevel: 1,
      reqPrevSkillLevel: 0,
      getStatsAtLevel: (lvl = 1) => ({
        shieldPct: Number((0.22 + (lvl - 1) * 0.035).toFixed(3)),
        guardSharePct: Math.min(0.75, Number((0.50 + (lvl - 1) * 0.03).toFixed(2))),
        dmgReducePct: Math.min(0.45, Number((0.25 + (lvl - 1) * 0.02).toFixed(2)))
      }),
      desc: '【保護・CD 2】消耗 20 怒氣，張開全隊護盾並開啟 2 回合「援護姿態」：自身減傷並替隊友分擔 50%+ 所受傷害。'
    },
    {
      id: 'w_s3',
      icon: '🩸',
      name: '嗜血狂襲',
      type: 'single',
      costType: 'rage',
      cost: 35,
      baseMult: 1.45,
      cd: 3,
      unlockLevel: 5,
      reqPrevSkillLevel: 5,
      getStatsAtLevel: (lvl = 1) => ({
        mult: Number((1.45 + (lvl - 1) * 0.18).toFixed(2)),
        lifestealPct: Math.min(0.80, Number((0.45 + (lvl - 1) * 0.04).toFixed(2)))
      }),
      desc: '【吸血・CD 3】消耗 35 怒氣，單體 1.45x 重擊並將 45%+ 傷害轉化為自身氣血恢復。'
    },
    {
      id: 'w_s4',
      icon: '🌋',
      name: '霸王震嶽',
      type: 'aoe',
      costType: 'rage',
      cost: 55,
      baseMult: 1.25,
      cd: 4,
      unlockLevel: 10,
      reqPrevSkillLevel: 5,
      getStatsAtLevel: (lvl = 1) => ({
        mult: Number((1.25 + (lvl - 1) * 0.15).toFixed(2)),
        breakPct: Math.min(0.45, Number((0.20 + (lvl - 1) * 0.03).toFixed(2))),
        weakenPct: Math.min(0.35, Number((0.15 + (lvl - 1) * 0.02).toFixed(2)))
      }),
      desc: '【群控・CD 4】消耗 55 怒氣，震擊最多 5 名敵怪（1.25x 物理），附加 2 回合破甲降防與虛弱降攻。'
    }
  ],

  '巧匠': [
    {
      id: 'a_s1',
      icon: '🏹',
      name: '疾風連弩',
      type: 'single',
      costType: 'ammo',
      cost: 0,
      baseMult: 1.0,
      cd: 0,
      unlockLevel: 1,
      reqPrevSkillLevel: 0,
      getStatsAtLevel: (lvl = 1) => ({
        mult: Number((1.0 + (lvl - 1) * 0.14).toFixed(2)),
        ammoGain: lvl >= 5 ? 3 : 2
      }),
      desc: '【基礎・CD 0】射出穿甲弩箭攻擊單體（吃敏力係數），並裝填 +2 枚暗器彈藥（Lv.5 起 +3 枚）。'
    },
    {
      id: 'a_s2',
      icon: '🩸',
      name: '撕裂箭雨',
      type: 'aoe',
      costType: 'ammo',
      cost: 2,
      baseMult: 0.75,
      cd: 2,
      unlockLevel: 1,
      reqPrevSkillLevel: 0,
      getStatsAtLevel: (lvl = 1) => ({
        mult: Number((0.75 + (lvl - 1) * 0.10).toFixed(2)),
        bleedMult: Number((0.40 + (lvl - 1) * 0.06).toFixed(2))
      }),
      desc: '【流血・CD 2】消耗 2 彈藥，低係數(0.75x)散射最多 3 名敵怪，附加不可疊加「流血」(2回合持續物理流血)。'
    },
    {
      id: 'a_s3',
      icon: '🎯',
      name: '破甲蒺藜',
      type: 'debuff',
      costType: 'ammo',
      cost: 3,
      baseMult: 0,
      cd: 3,
      unlockLevel: 5,
      reqPrevSkillLevel: 5,
      getStatsAtLevel: (lvl = 1) => ({
        vulnPct: Math.min(0.55, Number((0.24 + (lvl - 1) * 0.035).toFixed(3)))
      }),
      desc: '【純狀態・CD 3】消耗 3 彈藥，向最多 5 名敵怪撒下破甲蒺藜，純施加不可疊加「易傷 +24%+」(2回合全隊增傷)。'
    },
    {
      id: 'a_s4',
      icon: '☄️',
      name: '萬箭貫日',
      type: 'aoe',
      costType: 'ammo',
      cost: 5,
      baseMult: 1.75,
      cd: 4,
      unlockLevel: 10,
      reqPrevSkillLevel: 5,
      getStatsAtLevel: (lvl = 1) => ({
        mult: Number((1.75 + (lvl - 1) * 0.22).toFixed(2)),
        ignoreDefPct: 0.35
      }),
      desc: '【終極群攻・CD 4】消耗 5 彈藥，齊射箭雨轟擊最多 5 名敵怪（1.75x 穿甲 35% 物理爆發）。'
    }
  ],

  '術士': [
    {
      id: 'm_s1',
      icon: '🔮',
      name: '五行靈彈',
      type: 'single',
      costType: 'mp',
      cost: 0,
      baseMult: 1.0,
      cd: 0,
      unlockLevel: 1,
      reqPrevSkillLevel: 0,
      getStatsAtLevel: (lvl = 1) => ({
        mult: Number((1.0 + (lvl - 1) * 0.14).toFixed(2)),
        mpGain: 12 + (lvl - 1) * 2
      }),
      desc: '【基礎・CD 0】凝聚本命五行靈力轟擊單體（吃智力係數），並回復 +12 以上真元 MP。'
    },
    {
      id: 'm_s2',
      icon: '🔥',
      name: '業火焚身',
      type: 'aoe',
      costType: 'mp',
      cost: 18,
      baseMult: 0.75,
      cd: 2,
      unlockLevel: 1,
      reqPrevSkillLevel: 0,
      getStatsAtLevel: (lvl = 1) => ({
        mult: Number((0.75 + (lvl - 1) * 0.10).toFixed(2)),
        burnMult: Number((0.42 + (lvl - 1) * 0.06).toFixed(2))
      }),
      desc: '【灼燒・CD 2】消耗 18 MP，低係數(0.75x)烈焰波及最多 3 名敵怪，附加不可疊加「灼燒」(2回合持續法術火傷)。'
    },
    {
      id: 'm_s3',
      icon: '🌫️',
      name: '太陰迷霧',
      type: 'debuff',
      costType: 'mp',
      cost: 24,
      baseMult: 0,
      cd: 3,
      unlockLevel: 5,
      reqPrevSkillLevel: 5,
      getStatsAtLevel: (lvl = 1) => ({
        blindPct: Math.min(0.65, Number((0.32 + (lvl - 1) * 0.04).toFixed(2)))
      }),
      desc: '【純狀態・CD 3】消耗 24 MP，召喚太陰黑霧籠罩最多 5 名敵怪，純施加不可疊加「致盲 -32%+ 命中」(2回合)。'
    },
    {
      id: 'm_s4',
      icon: '⚡',
      name: '九天雷劫',
      type: 'aoe',
      costType: 'mp',
      cost: 36,
      baseMult: 1.80,
      cd: 4,
      unlockLevel: 10,
      reqPrevSkillLevel: 5,
      getStatsAtLevel: (lvl = 1) => ({
        mult: Number((1.80 + (lvl - 1) * 0.22).toFixed(2))
      }),
      desc: '【終極群攻・CD 4】消耗 36 MP，引動九天神雷劈擊最多 5 名敵怪（1.80x 毀滅五行法傷）。'
    }
  ],

  '藥師': [
    {
      id: 'p_s1',
      icon: '🌿',
      name: '百草針',
      type: 'single',
      costType: 'mp',
      cost: 0,
      baseMult: 1.0,
      cd: 0,
      unlockLevel: 1,
      reqPrevSkillLevel: 0,
      getStatsAtLevel: (lvl = 1) => ({
        mult: Number((1.0 + (lvl - 1) * 0.13).toFixed(2)),
        mpGain: 12 + (lvl - 1) * 2
      }),
      desc: '【基礎・CD 0】射出藥王銀針攻擊單體（吃智力係數），並回復 +12 以上真元 MP。'
    },
    {
      id: 'p_s2',
      icon: '💖',
      name: '妙手回春',
      type: 'heal_single',
      costType: 'mp',
      cost: 18,
      baseMult: 2.35,
      cd: 2,
      unlockLevel: 1,
      reqPrevSkillLevel: 0,
      getStatsAtLevel: (lvl = 1) => ({
        mult: Number((2.35 + (lvl - 1) * 0.28).toFixed(2))
      }),
      desc: '【單體強回血・CD 2】消耗 18 MP，鎖定我方氣血比例最低的 1 名角色進行高額治療(2.35x)並清除負面狀態！'
    },
    {
      id: 'p_s3',
      icon: '☠️',
      name: '五毒散',
      type: 'aoe',
      costType: 'mp',
      cost: 24,
      baseMult: 0.80,
      cd: 3,
      unlockLevel: 5,
      reqPrevSkillLevel: 5,
      getStatsAtLevel: (lvl = 1) => ({
        mult: Number((0.80 + (lvl - 1) * 0.10).toFixed(2)),
        poisonPct: Number((0.08 + (lvl - 1) * 0.015).toFixed(3))
      }),
      desc: '【下毒・CD 3】消耗 24 MP，撒出毒霧波及最多 3 名敵怪（0.80x），注入劇毒（3回合百分比真傷並削弱 20% 攻擊）。'
    },
    {
      id: 'p_s4',
      icon: '🌧️',
      name: '普渡甘霖',
      type: 'heal',
      costType: 'mp',
      cost: 34,
      baseMult: 1.05,
      cd: 4,
      unlockLevel: 10,
      reqPrevSkillLevel: 5,
      getStatsAtLevel: (lvl = 1) => ({
        mult: Number((1.05 + (lvl - 1) * 0.14).toFixed(2)),
        regenMult: Number((0.45 + (lvl - 1) * 0.06).toFixed(2))
      }),
      desc: '【全體少回血・CD 4】消耗 34 MP，降下甘霖為全隊溫和治療(1.05x)，並附加 2 回合「生機」每回合自動回血。'
    }
  ],

  '風水師': [
    {
      id: 'f_s1',
      icon: '🧿',
      name: '八卦符擊',
      type: 'single',
      costType: 'mp',
      cost: 0,
      baseMult: 1.0,
      cd: 0,
      unlockLevel: 1,
      reqPrevSkillLevel: 0,
      getStatsAtLevel: (lvl = 1) => ({
        mult: Number((1.0 + (lvl - 1) * 0.13).toFixed(2)),
        mpGain: 12 + (lvl - 1) * 2
      }),
      desc: '【基礎・CD 0】祭出五行靈符打擊單體（吃智力係數），並回復 +12 以上真元 MP。'
    },
    {
      id: 'f_s2',
      icon: '🌪️',
      name: '疾風祝禱',
      type: 'buff',
      costType: 'mp',
      cost: 18,
      baseMult: 0,
      cd: 2,
      unlockLevel: 1,
      reqPrevSkillLevel: 0,
      getStatsAtLevel: (lvl = 1) => ({
        atkBuffPct: Number((0.18 + (lvl - 1) * 0.025).toFixed(3)),
        speedBonus: 12 + (lvl - 1) * 2,
        critBonusPct: Number((0.10 + (lvl - 1) * 0.015).toFixed(3))
      }),
      desc: '【全隊強攻狀態・CD 2】消耗 18 MP，加持全隊 2 回合「神行奮進」：全隊攻擊 +18%+、速度 +12、暴擊率 +10%+！'
    },
    {
      id: 'f_s3',
      icon: '🔯',
      name: '乾坤八卦陣',
      type: 'shield',
      costType: 'mp',
      cost: 26,
      baseMult: 0,
      cd: 3,
      unlockLevel: 5,
      reqPrevSkillLevel: 5,
      getStatsAtLevel: (lvl = 1) => ({
        reducePct: Math.min(0.48, Number((0.25 + (lvl - 1) * 0.025).toFixed(3))),
        reflectPct: Number((0.20 + (lvl - 1) * 0.03).toFixed(2))
      }),
      desc: '【全隊守護結界・CD 3】消耗 26 MP，展開 2 回合八卦護陣，全隊承傷 -25%+、反彈傷害並每回合自動微幅回血。'
    },
    {
      id: 'f_s4',
      icon: '🌌',
      name: '天機催靈大陣',
      type: 'buff',
      costType: 'mp',
      cost: 34,
      baseMult: 0,
      cd: 4,
      unlockLevel: 10,
      reqPrevSkillLevel: 5,
      getStatsAtLevel: (lvl = 1) => ({
        heroSkillBoostPct: Math.min(0.55, Number((0.35 + (lvl - 1) * 0.025).toFixed(3))),
        heroDmgBoostPct: Number((0.20 + (lvl - 1) * 0.03).toFixed(2))
      }),
      desc: '【催靈英雄奧義・CD 4】消耗 34 MP，開啟 3 回合「天機加持」，全體英雄主動技能發動率大幅提升 +35%+ 且傷害 +20%+！'
    }
  ]
};

export function getSkillMultiplier(skill, level = 1) {
  if (!skill) return 1.0;
  return Number((skill.baseMult + ((level - 1) * 0.15)).toFixed(2));
}
