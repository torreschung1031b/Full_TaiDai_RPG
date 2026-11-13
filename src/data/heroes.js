import { ELEMENTS } from './constants';

export const HERO_TEMPLATES = [
  // ==================== Tier 1：江湖新秀（5位） ====================
  {
    baseId: 'h_t1_warrior',
    name: '鐵牛',
    icon: '🪓',
    tier: 1,
    heroClass: '猛將',
    element: '土',
    desc: '天生神力的莊稼漢，手持開山大斧，皮糙肉厚擅長前排抗傷。',
    traitName: '蠻牛筋骨',
    traitDesc: '最大生命 +12%、防禦 +10%、攻擊吸血 8%',
    traitBonus: { hpPct: 0.12, defPct: 0.10, lifestealPct: 0.08 },
    signatureSkill: {
      name: '開山裂地斧',
      icon: '🪓',
      target: 'single',
      mult: 1.65,
      effect: 'armorBreak',
      effectTurns: 2,
      desc: '重劈單體造成 1.65x 傷害並破甲 2 回合'
    },
    stats: { str: 6, con: 7, int: 2, agi: 3 }
  },
  {
    baseId: 'h_t1_artisan',
    name: '林小羽',
    icon: '🏹',
    tier: 1,
    heroClass: '巧匠',
    element: '木',
    desc: '山林獵戶出身的少年射手，身法矯健，擅長連珠箭術與陷阱。',
    traitName: '林間疾影',
    traitDesc: '速度 +12%、暴擊率 +8%、追擊連擊率 +15%',
    traitBonus: { speedPct: 0.12, skillChance: 0.05, critRate: 0.08, doubleHitPct: 0.15 },
    signatureSkill: {
      name: '連珠穿雲箭',
      icon: '🏹',
      target: 'single',
      mult: 1.70,
      ignoreDefPct: 0.25,
      desc: '射出穿甲冷箭造成 1.70x 傷害（無視 25% 防禦）'
    },
    stats: { str: 5, con: 3, int: 3, agi: 7 }
  },
  {
    baseId: 'h_t1_warlock',
    name: '沈青書',
    icon: '📜',
    tier: 1,
    heroClass: '術士',
    element: '火',
    desc: '遊歷四方的落第書生，偶得殘卷道法，能以硃砂符籙引動五行真火。',
    traitName: '丹心符火',
    traitDesc: '攻擊 +10%、五行增傷 +12%、暴擊率 +6%',
    traitBonus: { atkPct: 0.10, elemDmgPct: 0.12, critRate: 0.06 },
    signatureSkill: {
      name: '硃砂離火符',
      icon: '🔥',
      target: 'single',
      mult: 1.75,
      effect: 'burn',
      effectTurns: 2,
      desc: '引燃符籙造成 1.75x 法傷並附加灼燒 2 回合'
    },
    stats: { str: 2, con: 3, int: 8, agi: 5 }
  },
  {
    baseId: 'h_t1_pharmacist',
    name: '蘇芷若',
    icon: '🌿',
    tier: 1,
    heroClass: '藥師',
    element: '水',
    desc: '藥王谷外門弟子，隨身攜帶百草藥囊，仁心仁術守護同門。',
    traitName: '甘露清心',
    traitDesc: '最大生命 +10%、技發率 +8%、行動後自動治療傷員',
    traitBonus: { hpPct: 0.10, skillChance: 0.08, autoHealPct: 0.35 },
    signatureSkill: {
      name: '百草回春露',
      icon: '🌿',
      target: 'heal',
      mult: 1.35,
      desc: '揮灑靈藥甘露，為全隊恢復 1.35x 攻擊力氣血'
    },
    stats: { str: 2, con: 5, int: 7, agi: 4 }
  },
  {
    baseId: 'h_t1_fengshui',
    name: '周半仙',
    icon: '🧭',
    tier: 1,
    heroClass: '風水師',
    element: '金',
    desc: '走街串巷的算命先生，雖愛吹噓卻真懂幾分奇門遁甲與趨吉避凶。',
    traitName: '趨吉避凶',
    traitDesc: '速度 +10%、防禦 +8%、施放絕學附加全隊護盾',
    traitBonus: { speedPct: 0.10, defPct: 0.08, skillChance: 0.06, shieldOnSkillPct: 0.45 },
    signatureSkill: {
      name: '奇門護身咒',
      icon: '🧭',
      target: 'single',
      mult: 1.55,
      effect: 'weaken',
      effectTurns: 2,
      desc: '擾亂敵方氣運造成 1.55x 傷害並虛弱 2 回合'
    },
    stats: { str: 2, con: 4, int: 6, agi: 6 }
  },

  // ==================== Tier 2：名門弟子（5位） ====================
  {
    baseId: 'h_t2_warrior',
    name: '趙鐵衣',
    icon: '🛡️',
    tier: 2,
    heroClass: '猛將',
    element: '金',
    desc: '鎮遠鏢局總鏢頭之子，修習《金鐘罩》外功，刀槍難傷。',
    traitName: '金鐘護體',
    traitDesc: '防禦 +16%、最大生命 +10%、絕學附加全隊護盾',
    traitBonus: { defPct: 0.16, hpPct: 0.10, shieldOnSkillPct: 0.55 },
    signatureSkill: {
      name: '金鐘震嶽擊',
      icon: '🛡️',
      target: 'single',
      mult: 1.85,
      effect: 'weaken',
      effectTurns: 2,
      desc: '震盪金鐘重擊 1.85x 傷害，削弱敵攻 2 回合'
    },
    stats: { str: 8, con: 10, int: 3, agi: 4 }
  },
  {
    baseId: 'h_t2_artisan',
    name: '唐靈兒',
    icon: '🗡️',
    tier: 2,
    heroClass: '巧匠',
    element: '木',
    desc: '蜀中唐門旁系天才少女，精通暴雨機括與淬毒暗器。',
    traitName: '唐門機括',
    traitDesc: '攻擊 +12%、速度 +12%、暴擊率 +10%、追擊率 +15%',
    traitBonus: { atkPct: 0.12, speedPct: 0.12, critRate: 0.10, doubleHitPct: 0.15 },
    signatureSkill: {
      name: '孔雀淬毒翎',
      icon: '🗡️',
      target: 'aoe',
      mult: 1.15,
      effect: 'poison',
      effectTurns: 3,
      desc: '散射暗器橫掃全場 1.15x 傷害並疊加劇毒'
    },
    stats: { str: 7, con: 4, int: 4, agi: 10 }
  },
  {
    baseId: 'h_t2_warlock',
    name: '白玉京',
    icon: '❄️',
    tier: 2,
    heroClass: '術士',
    element: '水',
    desc: '崑崙派真傳弟子，御劍乘風，擅長玄冰法訣凍結敵軍經脈。',
    traitName: '冰心玉壺',
    traitDesc: '攻擊 +14%、技發率 +8%、無視防禦 15%',
    traitBonus: { atkPct: 0.14, skillChance: 0.08, ignoreDefPct: 0.15 },
    signatureSkill: {
      name: '崑崙玄冰劍陣',
      icon: '❄️',
      target: 'aoe',
      mult: 1.25,
      effect: 'vuln',
      effectTurns: 2,
      desc: '萬千冰劍貫穿全場 1.25x 法傷並附加易傷 2 回合'
    },
    stats: { str: 3, con: 5, int: 11, agi: 6 }
  },
  {
    baseId: 'h_t2_pharmacist',
    name: '葉清霜',
    icon: '🧪',
    tier: 2,
    heroClass: '藥師',
    element: '木',
    desc: '苗疆五仙教叛出聖女，既通起死回生之術，亦擅施放五毒瘴氣。',
    traitName: '毒醫雙絕',
    traitDesc: '攻擊 +10%、生命 +12%、行動後自動治療隊友',
    traitBonus: { atkPct: 0.10, hpPct: 0.12, skillChance: 0.08, autoHealPct: 0.45 },
    signatureSkill: {
      name: '五仙蠱靈術',
      icon: '🧪',
      target: 'single',
      mult: 1.80,
      effect: 'poison',
      effectTurns: 3,
      healTeamRatio: 0.70,
      desc: '施放蠱毒造成 1.80x 傷害並轉化靈氣治療全隊'
    },
    stats: { str: 3, con: 6, int: 10, agi: 6 }
  },
  {
    baseId: 'h_t2_fengshui',
    name: '陳玄機',
    icon: '☯️',
    tier: 2,
    heroClass: '風水師',
    element: '土',
    desc: '終南山觀星閣弟子，手持八陣羅盤，擅長布局困敵與調度先機。',
    traitName: '觀星測勢',
    traitDesc: '速度 +14%、技發率 +10%、絕學附加全隊護盾',
    traitBonus: { speedPct: 0.14, skillChance: 0.10, shieldOnSkillPct: 0.60 },
    signatureSkill: {
      name: '八陣困龍局',
      icon: '☯️',
      target: 'aoe',
      mult: 1.20,
      effect: 'armorBreak',
      effectTurns: 2,
      desc: '引動地脈鎮壓全場 1.20x 傷害並破甲 2 回合'
    },
    stats: { str: 3, con: 6, int: 8, agi: 8 }
  },

  // ==================== Tier 3：武林豪傑（5位） ====================
  {
    baseId: 'h_t3_warrior',
    name: '蕭破軍',
    icon: '⚔️',
    tier: 3,
    heroClass: '猛將',
    element: '火',
    desc: '北境邊軍先鋒大將，一桿丈八赤焰長槍橫掃千軍，勢不可擋。',
    traitName: '破軍烈焰',
    traitDesc: '攻擊 +16%、生命 +14%、吸血 12%、暴傷 +25%',
    traitBonus: { atkPct: 0.16, hpPct: 0.14, lifestealPct: 0.12, critDmg: 0.25 },
    signatureSkill: {
      name: '赤焰橫掃千軍',
      icon: '⚔️',
      target: 'aoe',
      mult: 1.40,
      effect: 'burn',
      effectTurns: 2,
      desc: '揮舞烈焰長槍橫掃全場 1.40x 傷害並點燃灼燒'
    },
    stats: { str: 13, con: 12, int: 4, agi: 6 }
  },
  {
    baseId: 'h_t3_artisan',
    name: '公輸巧',
    icon: '⚙️',
    tier: 3,
    heroClass: '巧匠',
    element: '金',
    desc: '魯班門當代巧手宗師，身背連發神火連弩，箭無虛發。',
    traitName: '神機百煉',
    traitDesc: '攻擊 +15%、速度 +15%、無視防禦 20%、追擊率 +20%',
    traitBonus: { atkPct: 0.15, speedPct: 0.15, skillChance: 0.08, ignoreDefPct: 0.20, doubleHitPct: 0.20 },
    signatureSkill: {
      name: '神火連弩齊射',
      icon: '⚙️',
      target: 'single',
      mult: 2.25,
      ignoreDefPct: 0.35,
      desc: '機關連弩暴雨傾瀉造成 2.25x 破甲重擊'
    },
    stats: { str: 10, con: 6, int: 5, agi: 14 }
  },
  {
    baseId: 'h_t3_warlock',
    name: '慕容紫煙',
    icon: '🔮',
    tier: 3,
    heroClass: '術士',
    element: '火',
    desc: '姑蘇慕容世家奇女子，精通《斗轉星移》與九天雷火法術。',
    traitName: '星移法脈',
    traitDesc: '攻擊 +18%、五行增傷 +18%、暴擊率 +12%',
    traitBonus: { atkPct: 0.18, elemDmgPct: 0.18, critRate: 0.12 },
    signatureSkill: {
      name: '九天紫電雷火',
      icon: '🔮',
      target: 'aoe',
      mult: 1.50,
      effect: 'vuln',
      effectTurns: 2,
      desc: '引落天雷紫火轟擊全場 1.50x 法傷並附加易傷'
    },
    stats: { str: 4, con: 6, int: 16, agi: 9 }
  },
  {
    baseId: 'h_t3_pharmacist',
    name: '華青囊',
    icon: '💊',
    tier: 3,
    heroClass: '藥師',
    element: '水',
    desc: '懸壺濟世的神醫傳人，銀針渡厄，九轉靈丹可挽狂瀾於既倒。',
    traitName: '青囊妙手',
    traitDesc: '生命 +18%、防禦 +12%、行動後自動治療全隊傷員',
    traitBonus: { hpPct: 0.18, defPct: 0.12, skillChance: 0.10, autoHealPct: 0.60 },
    signatureSkill: {
      name: '九轉還陽聖手',
      icon: '💊',
      target: 'heal',
      mult: 1.75,
      shieldRatio: 0.50,
      desc: '施展神醫秘法為全隊恢復 1.75x 氣血並附加護盾'
    },
    stats: { str: 4, con: 9, int: 14, agi: 8 }
  },
  {
    baseId: 'h_t3_fengshui',
    name: '諸葛明',
    icon: '🪭',
    tier: 3,
    heroClass: '風水師',
    element: '木',
    desc: '臥龍崗隱世軍師，羽扇綸巾之間借東風、布八陣，算無遺策。',
    traitName: '借風布陣',
    traitDesc: '速度 +16%、攻擊 +10%、技發率 +12%、施法附護盾',
    traitBonus: { speedPct: 0.16, atkPct: 0.10, skillChance: 0.12, shieldOnSkillPct: 0.70 },
    signatureSkill: {
      name: '八卦東風烈火陣',
      icon: '🪭',
      target: 'aoe',
      mult: 1.45,
      effect: 'burn',
      effectTurns: 3,
      desc: '借東風助火勢席捲全場 1.45x 法傷並灼燒 3 回合'
    },
    stats: { str: 4, con: 7, int: 13, agi: 11 }
  },

  // ==================== Tier 4：一代宗師・三國＆西遊群英（15位） ====================
  {
    baseId: 'h_t4_warrior',
    name: '嶽擎天',
    icon: '🦁',
    tier: 4,
    heroClass: '猛將',
    element: '土',
    desc: '鎮國武穆元帥，不動如山、動如雷震，一人一槍可擋百萬雄師。',
    traitName: '撼山岳家軍',
    traitDesc: '生命 +22%、防禦 +20%、攻擊 +12%、施法附全隊護盾',
    traitBonus: { hpPct: 0.22, defPct: 0.20, atkPct: 0.12, shieldOnSkillPct: 0.85 },
    signatureSkill: {
      name: '怒髮衝冠・滿江紅',
      icon: '🦁',
      target: 'aoe',
      mult: 1.65,
      effect: 'weaken',
      effectTurns: 2,
      desc: '武穆軍魂震懾全場 1.65x 傷害並大幅虛弱敵軍'
    },
    stats: { str: 16, con: 18, int: 5, agi: 8 }
  },
  {
    baseId: 'h_t4_guanyu',
    name: '關雲長・武聖',
    icon: '🐉',
    faction: 'three_kingdoms',
    tier: 4,
    heroClass: '猛將',
    element: '木',
    desc: '美髯長鬚、丹鳳臥蠶，手持青龍偃月刀過五關斬六將的忠義武聖。',
    traitName: '單刀赴會',
    traitDesc: '攻擊 +22%、生命 +18%、暴擊率 +15%、暴傷 +35%',
    traitBonus: { atkPct: 0.22, hpPct: 0.18, defPct: 0.14, critRate: 0.15, critDmg: 0.35 },
    signatureSkill: {
      name: '青龍偃月・拖刀斬',
      icon: '🐉',
      target: 'single',
      mult: 2.75,
      ignoreDefPct: 0.40,
      effect: 'armorBreak',
      effectTurns: 3,
      desc: '武聖全力一刀劈出 2.75x 毀滅重擊並徹底破甲'
    },
    stats: { str: 19, con: 16, int: 6, agi: 9 }
  },
  {
    baseId: 'h_t4_zhangfei',
    name: '張翼德・萬人敵',
    icon: '🐯',
    faction: 'three_kingdoms',
    tier: 4,
    heroClass: '猛將',
    element: '火',
    desc: '豹頭環眼、燕頷虎鬚，丈八蛇矛在手，當陽橋一聲怒吼嚇退曹軍百萬！',
    traitName: '咆哮長坂坡',
    traitDesc: '攻擊 +23%、生命 +20%、吸血 15%、追擊連擊率 +20%',
    traitBonus: { atkPct: 0.23, hpPct: 0.20, speedPct: 0.12, lifestealPct: 0.15, doubleHitPct: 0.20 },
    signatureSkill: {
      name: '當陽橋・萬人敵怒吼',
      icon: '🐯',
      target: 'aoe',
      mult: 1.70,
      effect: 'weaken',
      effectTurns: 3,
      desc: '震天怒吼伴隨蛇矛橫掃全場 1.70x 傷害並震懾敵軍'
    },
    stats: { str: 20, con: 17, int: 4, agi: 9 }
  },
  {
    baseId: 'h_t4_zhaoyun',
    name: '趙子龍・常勝將軍',
    icon: '🐎',
    faction: 'three_kingdoms',
    tier: 4,
    heroClass: '猛將',
    element: '金',
    desc: '白馬銀槍常山趙子龍，長坂坡七進七出如入無人之境，一身是膽！',
    traitName: '七進七出龍膽魂',
    traitDesc: '攻擊 +21%、速度 +21%、追擊連擊率 +30%、暴擊率 +12%',
    traitBonus: { atkPct: 0.21, speedPct: 0.21, defPct: 0.14, doubleHitPct: 0.30, critRate: 0.12 },
    signatureSkill: {
      name: '七進七出・百鳥朝鳳',
      icon: '🐎',
      target: 'single',
      mult: 2.60,
      ignoreDefPct: 0.35,
      effect: 'bleed',
      effectTurns: 3,
      desc: '銀槍化作漫天槍影突刺 2.60x 傷害並撕裂流血'
    },
    stats: { str: 18, con: 15, int: 6, agi: 14 }
  },
  {
    baseId: 'h_t4_bajie',
    name: '豬八戒・天蓬元帥',
    icon: '🐗',
    faction: 'journey_west',
    tier: 4,
    heroClass: '猛將',
    element: '水',
    desc: '昔日執掌天河八萬水軍的天蓬元帥，倒打一耙九齒釘耙力大無窮。',
    traitName: '天河水軍甲',
    traitDesc: '生命 +25%、防禦 +18%、攻擊吸血 18%',
    traitBonus: { hpPct: 0.25, defPct: 0.18, atkPct: 0.12, lifestealPct: 0.18 },
    signatureSkill: {
      name: '九齒釘耙・倒打一耙',
      icon: '🐗',
      target: 'single',
      mult: 2.45,
      effect: 'armorBreak',
      effectTurns: 2,
      desc: '天蓬神力猛築敵首造成 2.45x 傷害並破甲'
    },
    stats: { str: 17, con: 20, int: 5, agi: 7 }
  },
  {
    baseId: 'h_t4_wujing',
    name: '沙悟淨・捲簾大將',
    icon: '📿',
    faction: 'journey_west',
    tier: 4,
    heroClass: '猛將',
    element: '土',
    desc: '昔日凌霄殿捲簾大將軍，月牙降妖寶杖沉穩如山，護衛師父步步西行。',
    traitName: '流沙降妖寶杖',
    traitDesc: '生命 +24%、防禦 +22%、絕學附加全隊護盾',
    traitBonus: { hpPct: 0.24, defPct: 0.22, atkPct: 0.12, shieldOnSkillPct: 0.90 },
    signatureSkill: {
      name: '降妖寶杖・流沙護體',
      icon: '📿',
      target: 'aoe',
      mult: 1.55,
      effect: 'weaken',
      effectTurns: 2,
      desc: '捲起流沙風暴橫掃全場 1.55x 傷害並削弱敵攻'
    },
    stats: { str: 16, con: 21, int: 6, agi: 8 }
  },
  {
    baseId: 'h_t4_artisan',
    name: '李尋歡・神機',
    icon: '🎯',
    tier: 4,
    heroClass: '巧匠',
    element: '金',
    desc: '例不虛發的小李飛刀傳人，結合天工機關術，出刀快若驚鴻。',
    traitName: '例不虛發',
    traitDesc: '攻擊 +20%、速度 +20%、暴擊率 +22%、暴傷 +45%',
    traitBonus: { atkPct: 0.20, speedPct: 0.20, skillChance: 0.10, critRate: 0.22, critDmg: 0.45 },
    signatureSkill: {
      name: '小李飛刀・例不虛發',
      icon: '🎯',
      target: 'single',
      mult: 2.85,
      ignoreDefPct: 0.50,
      desc: '寒光一閃直取咽喉，造成 2.85x 無視 50% 防禦必殺'
    },
    stats: { str: 13, con: 8, int: 7, agi: 19 }
  },
  {
    baseId: 'h_t4_huangyueying',
    name: '黃月英・木牛',
    icon: '⚙️',
    faction: 'three_kingdoms',
    tier: 4,
    heroClass: '巧匠',
    element: '土',
    desc: '荊州才女，上通天文下察地理，造木牛流馬、諸葛連弩名震天下。',
    traitName: '木牛流馬陣',
    traitDesc: '速度 +20%、防禦 +16%、追擊連擊率 +25%、施法附護盾',
    traitBonus: { speedPct: 0.20, defPct: 0.16, skillChance: 0.12, doubleHitPct: 0.25, shieldOnSkillPct: 0.75 },
    signatureSkill: {
      name: '諸葛連弩・萬箭齊發',
      icon: '⚙️',
      target: 'aoe',
      mult: 1.65,
      effect: 'vuln',
      effectTurns: 2,
      desc: '機關連弩齊射全場造成 1.65x 傷害並附加易傷'
    },
    stats: { str: 11, con: 10, int: 12, agi: 17 }
  },
  {
    baseId: 'h_t4_warlock',
    name: '南宮離火',
    icon: '🔥',
    tier: 4,
    heroClass: '術士',
    element: '火',
    desc: '焚天谷大長老，修成三昧真火道體，舉手投足間赤地千里。',
    traitName: '三昧真火體',
    traitDesc: '攻擊 +24%、五行增傷 +22%、無視防禦 20%',
    traitBonus: { atkPct: 0.24, elemDmgPct: 0.22, ignoreDefPct: 0.20 },
    signatureSkill: {
      name: '焚天三昧真火海',
      icon: '🔥',
      target: 'aoe',
      mult: 1.80,
      effect: 'burn',
      effectTurns: 3,
      desc: '召喚三昧真火焚燒全場 1.80x 法傷並持續灼燒'
    },
    stats: { str: 5, con: 8, int: 22, agi: 12 }
  },
  {
    baseId: 'h_t4_simayi',
    name: '司馬仲達・冢虎',
    icon: '🐺',
    faction: 'three_kingdoms',
    tier: 4,
    heroClass: '術士',
    element: '水',
    desc: '隱忍深沉的魏晉權謀宗師，鷹視狼顧之間掌控生死陰陽詭道。',
    traitName: '狼顧鬼謀',
    traitDesc: '攻擊 +23%、速度 +15%、五行增傷 +18%、吸血 12%',
    traitBonus: { atkPct: 0.23, speedPct: 0.15, elemDmgPct: 0.18, lifestealPct: 0.12 },
    signatureSkill: {
      name: '冢虎狼顧・幽冥吞噬',
      icon: '🐺',
      target: 'aoe',
      mult: 1.75,
      effect: 'weaken',
      effectTurns: 3,
      desc: '陰陽鬼謀吞噬全場 1.75x 法傷並大幅削弱敵攻'
    },
    stats: { str: 5, con: 9, int: 21, agi: 14 }
  },
  {
    baseId: 'h_t4_baigujing',
    name: '白骨夫人・千面妖姬',
    icon: '💀',
    faction: 'journey_west',
    tier: 4,
    heroClass: '術士',
    element: '水',
    desc: '白虎嶺千年白骨精化形，善使畫皮幻術與九陰白骨爪迷惑眾生。',
    traitName: '三變幻形詭術',
    traitDesc: '攻擊 +24%、速度 +18%、吸血 18%、暴擊率 +12%',
    traitBonus: { atkPct: 0.24, speedPct: 0.18, skillChance: 0.12, lifestealPct: 0.18, critRate: 0.12 },
    signatureSkill: {
      name: '九陰白骨奪魂爪',
      icon: '💀',
      target: 'single',
      mult: 2.65,
      effect: 'poison',
      effectTurns: 3,
      desc: '千面妖爪撕裂敵魂 2.65x 傷害並劇毒侵蝕 3 回合'
    },
    stats: { str: 5, con: 8, int: 22, agi: 16 }
  },
  {
    baseId: 'h_t4_pharmacist',
    name: '扁素問',
    icon: '🪷',
    tier: 4,
    heroClass: '藥師',
    element: '木',
    desc: '醫聖傳人，著《素問靈樞訣》，一念生白骨、一念散百毒。',
    traitName: '靈樞聖手',
    traitDesc: '生命 +22%、攻擊 +14%、行動後自動治療全隊傷員',
    traitBonus: { hpPct: 0.22, atkPct: 0.14, skillChance: 0.12, autoHealPct: 0.75 },
    signatureSkill: {
      name: '素問靈樞・生白骨',
      icon: '🪷',
      target: 'heal',
      mult: 2.15,
      shieldRatio: 0.65,
      desc: '醫聖神針活死人肉白骨，全隊回血 2.15x 並附護盾'
    },
    stats: { str: 5, con: 12, int: 19, agi: 11 }
  },
  {
    baseId: 'h_t4_huatuo',
    name: '華佗・五禽仙',
    icon: '🩺',
    faction: 'three_kingdoms',
    tier: 4,
    heroClass: '藥師',
    element: '木',
    desc: '東漢末年神醫，創五禽戲強身健體，施麻沸散刮骨療毒如履平地。',
    traitName: '五禽長生戲',
    traitDesc: '生命 +24%、防禦 +14%、行動後自動治療全隊傷員',
    traitBonus: { hpPct: 0.24, defPct: 0.14, skillChance: 0.12, autoHealPct: 0.80 },
    signatureSkill: {
      name: '青囊五禽・刮骨神療',
      icon: '🩺',
      target: 'heal',
      mult: 2.25,
      shieldRatio: 0.70,
      desc: '施展青囊絕學為全隊恢復 2.25x 氣血並凝聚護體真氣'
    },
    stats: { str: 6, con: 14, int: 18, agi: 11 }
  },
  {
    baseId: 'h_t4_fengshui',
    name: '袁天罡',
    icon: '🌌',
    tier: 4,
    heroClass: '風水師',
    element: '水',
    desc: '推背圖秘傳大宗師，夜觀天象逆轉乾坤，掌控全場行動先機。',
    traitName: '推背天機',
    traitDesc: '速度 +22%、防禦 +14%、技發率 +14%、施法附護盾',
    traitBonus: { speedPct: 0.22, defPct: 0.14, skillChance: 0.14, shieldOnSkillPct: 0.90 },
    signatureSkill: {
      name: '推背天機・星宿鎮壓',
      icon: '🌌',
      target: 'aoe',
      mult: 1.70,
      effect: 'vuln',
      effectTurns: 3,
      desc: '引動周天星宿鎮壓全場 1.70x 法傷並附加易傷 3 回合'
    },
    stats: { str: 5, con: 10, int: 17, agi: 15 }
  },
  {
    baseId: 'h_t4_zhouyu',
    name: '周公瑾・美周郎',
    icon: '🎶',
    faction: 'three_kingdoms',
    tier: 4,
    heroClass: '風水師',
    element: '火',
    desc: '曲有誤周郎顧！談笑間檣櫓灰飛煙滅的江東水軍大都督。',
    traitName: '赤壁火攻連環計',
    traitDesc: '攻擊 +18%、速度 +20%、五行增傷 +20%、暴擊率 +12%',
    traitBonus: { atkPct: 0.18, speedPct: 0.20, elemDmgPct: 0.20, critRate: 0.12 },
    signatureSkill: {
      name: '火燒赤壁・檣櫓灰飛',
      icon: '🎶',
      target: 'aoe',
      mult: 1.80,
      effect: 'burn',
      effectTurns: 3,
      desc: '琴音起火勢連環，席捲全場 1.80x 法傷並烈焰灼燒'
    },
    stats: { str: 6, con: 10, int: 19, agi: 16 }
  },

  // ==================== Tier 5：天外仙俠・神話與無雙巔峰（15位） ====================
  {
    baseId: 'h_t5_warrior',
    name: '項霸王・武魂',
    icon: '👑',
    tier: 5,
    heroClass: '猛將',
    element: '火',
    desc: '力拔山兮氣蓋世的西楚戰神殘魂降世，重瞳所視之處神魔辟易。',
    traitName: '蓋世霸王魂',
    traitDesc: '攻擊 +28%、生命 +25%、防禦 +18%、吸血 18%、暴傷 +40%',
    traitBonus: { atkPct: 0.28, hpPct: 0.25, defPct: 0.18, lifestealPct: 0.18, critDmg: 0.40 },
    signatureSkill: {
      name: '力拔山兮・霸王破陣',
      icon: '👑',
      target: 'aoe',
      mult: 2.05,
      effect: 'armorBreak',
      effectTurns: 3,
      desc: '西楚戰神全力橫掃全場 2.05x 毀滅傷害並粉碎護甲'
    },
    stats: { str: 24, con: 22, int: 6, agi: 12 }
  },
  {
    baseId: 'h_t5_wukong',
    name: '孫悟空・齊天大聖',
    icon: '🐒',
    faction: 'journey_west',
    tier: 5,
    heroClass: '猛將',
    element: '火',
    desc: '花果山天生石猴，大鬧天宮的鬥戰勝佛，如意金箍棒重一萬三千五百斤！',
    traitName: '火眼金睛七十二變',
    traitDesc: '攻擊 +30%、速度 +25%、暴擊率 +20%、追擊連擊率 +35%',
    traitBonus: { atkPct: 0.30, speedPct: 0.25, hpPct: 0.20, critRate: 0.20, doubleHitPct: 0.35 },
    signatureSkill: {
      name: '如意金箍・大鬧天宮',
      icon: '🐒',
      target: 'aoe',
      mult: 2.15,
      ignoreDefPct: 0.35,
      effect: 'vuln',
      effectTurns: 3,
      desc: '金箍棒化作擎天巨柱橫掃全場 2.15x 破甲神威'
    },
    stats: { str: 25, con: 19, int: 8, agi: 18 }
  },
  {
    baseId: 'h_t5_lubu',
    name: '呂奉先・鬼神無雙',
    icon: '🔱',
    faction: 'three_kingdoms',
    tier: 5,
    heroClass: '猛將',
    element: '金',
    desc: '人中呂布、馬中赤兔！手持方天畫戟縱橫三國，天下英雄莫敢撄鋒。',
    traitName: '天下無雙戟',
    traitDesc: '攻擊 +32%、生命 +22%、無視防禦 25%、暴傷 +50%',
    traitBonus: { atkPct: 0.32, hpPct: 0.22, speedPct: 0.18, ignoreDefPct: 0.25, critDmg: 0.50 },
    signatureSkill: {
      name: '鬼神無雙・方天亂舞',
      icon: '🔱',
      target: 'single',
      mult: 3.35,
      ignoreDefPct: 0.50,
      effect: 'bleed',
      effectTurns: 3,
      desc: '鬼神降臨狂戟連斬造成 3.35x 毀天滅地必殺重擊'
    },
    stats: { str: 27, con: 20, int: 4, agi: 15 }
  },
  {
    baseId: 'h_t5_nezha',
    name: '哪吒・三壇海會大神',
    icon: '🔥',
    faction: 'journey_west',
    tier: 5,
    heroClass: '猛將',
    element: '火',
    desc: '腳踏風火輪、手持火尖槍與乾坤圈，蓮花化身的降魔先鋒大神！',
    traitName: '三頭六臂風火輪',
    traitDesc: '攻擊 +31%、速度 +28%、追擊連擊率 +40%、暴擊率 +15%',
    traitBonus: { atkPct: 0.31, speedPct: 0.28, hpPct: 0.18, doubleHitPct: 0.40, critRate: 0.15 },
    signatureSkill: {
      name: '三頭六臂・火尖乾坤擊',
      icon: '🔥',
      target: 'aoe',
      mult: 2.00,
      effect: 'burn',
      effectTurns: 3,
      desc: '腳踏風火輪祭出乾坤圈與火尖槍，焚滅全場 2.00x 傷害'
    },
    stats: { str: 24, con: 18, int: 9, agi: 21 }
  },
  {
    baseId: 'h_t5_bullking',
    name: '牛魔王・平天大聖',
    icon: '🐂',
    faction: 'journey_west',
    tier: 5,
    heroClass: '猛將',
    element: '土',
    desc: '翠雲山芭蕉洞主、七大聖之首平天大聖，現出白牛真身力撼天地！',
    traitName: '混鐵棍鎮海神力',
    traitDesc: '生命 +32%、防禦 +26%、攻擊 +22%、絕學附加巨額護盾',
    traitBonus: { hpPct: 0.32, defPct: 0.26, atkPct: 0.22, shieldOnSkillPct: 1.25 },
    signatureSkill: {
      name: '平天真身・撼地神牛衝',
      icon: '🐂',
      target: 'aoe',
      mult: 1.95,
      effect: 'weaken',
      effectTurns: 3,
      desc: '白牛真身衝撞全場造成 1.95x 傷害並大幅震懾敵軍'
    },
    stats: { str: 24, con: 26, int: 6, agi: 12 }
  },
  {
    baseId: 'h_t5_artisan',
    name: '墨子・天工',
    icon: '🐉',
    tier: 5,
    heroClass: '巧匠',
    element: '金',
    desc: '機關術之祖，駕馭青銅機關神龍與天外隕鐵連弩，兼愛非攻鎮世間。',
    traitName: '非攻天工甲',
    traitDesc: '攻擊 +25%、速度 +26%、無視防禦 30%、施法附護盾',
    traitBonus: { atkPct: 0.25, speedPct: 0.26, skillChance: 0.14, ignoreDefPct: 0.30, shieldOnSkillPct: 1.10 },
    signatureSkill: {
      name: '青銅神龍・非攻天罰',
      icon: '🐉',
      target: 'aoe',
      mult: 2.05,
      ignoreDefPct: 0.35,
      effect: 'armorBreak',
      effectTurns: 3,
      desc: '駕馭機關神龍轟擊全場 2.05x 穿甲神雷並破甲'
    },
    stats: { str: 17, con: 12, int: 10, agi: 25 }
  },
  {
    baseId: 'h_t5_erlang',
    name: '二郎顯聖真君',
    icon: '👁️',
    faction: 'journey_west',
    tier: 5,
    heroClass: '巧匠',
    element: '金',
    desc: '灌江口清源妙道真君，額生神目辨識萬妖，三尖兩刃刀與哮天犬所向披靡。',
    traitName: '天眼三尖兩刃',
    traitDesc: '攻擊 +28%、速度 +26%、暴擊率 +24%、暴傷 +45%',
    traitBonus: { atkPct: 0.28, speedPct: 0.26, skillChance: 0.14, critRate: 0.24, critDmg: 0.45 },
    signatureSkill: {
      name: '天眼破妄・三尖神斬',
      icon: '👁️',
      target: 'single',
      mult: 3.25,
      ignoreDefPct: 0.45,
      effect: 'vuln',
      effectTurns: 3,
      desc: '神目鎖定弱點配合哮天犬撲殺，造成 3.25x 破甲重創'
    },
    stats: { str: 20, con: 14, int: 10, agi: 24 }
  },
  {
    baseId: 'h_t5_warlock',
    name: '張道陵・天師',
    icon: '⚡',
    tier: 5,
    heroClass: '術士',
    element: '金',
    desc: '龍虎山初代天師，執掌三五斬邪雌雄劍與五雷正法，誅滅萬邪。',
    traitName: '五雷天師印',
    traitDesc: '攻擊 +30%、五行增傷 +26%、暴擊率 +18%',
    traitBonus: { atkPct: 0.30, elemDmgPct: 0.26, skillChance: 0.12, critRate: 0.18 },
    signatureSkill: {
      name: '龍虎五雷正法・天誅',
      icon: '⚡',
      target: 'aoe',
      mult: 2.15,
      effect: 'armorBreak',
      effectTurns: 3,
      desc: '祭出天師印召五雷正法轟擊全場 2.15x 法傷並破防'
    },
    stats: { str: 7, con: 11, int: 28, agi: 18 }
  },
  {
    baseId: 'h_t5_taishang',
    name: '太上老君・道德天尊',
    icon: '☯️',
    faction: 'journey_west',
    tier: 5,
    heroClass: '術士',
    element: '火',
    desc: '兜率宮開天闢地之祖，手執金剛琢與芭蕉扇，八卦爐六丁神火煉化萬物。',
    traitName: '八卦爐紫金丹火',
    traitDesc: '攻擊 +32%、五行增傷 +28%、無視防禦 30%',
    traitBonus: { atkPct: 0.32, elemDmgPct: 0.28, skillChance: 0.14, ignoreDefPct: 0.30 },
    signatureSkill: {
      name: '八卦爐・六丁神火煉世',
      icon: '☯️',
      target: 'aoe',
      mult: 2.25,
      effect: 'burn',
      effectTurns: 3,
      desc: '傾瀉八卦爐紫金丹火煉化全場 2.25x 無視防禦神火'
    },
    stats: { str: 6, con: 14, int: 30, agi: 17 }
  },
  {
    baseId: 'h_t5_pharmacist',
    name: '神農・百草仙',
    icon: '🌺',
    tier: 5,
    heroClass: '藥師',
    element: '木',
    desc: '嘗遍百草的上古藥仙化身，赭鞭一揮萬物復甦，毒瘴亦化作靈泉。',
    traitName: '赭鞭神農鼎',
    traitDesc: '生命 +28%、攻擊 +20%、行動後自動治療全隊傷員',
    traitBonus: { hpPct: 0.28, atkPct: 0.20, skillChance: 0.16, autoHealPct: 1.00 },
    signatureSkill: {
      name: '神農百草鼎・萬物復甦',
      icon: '🌺',
      target: 'heal',
      mult: 2.65,
      shieldRatio: 0.85,
      desc: '催動神農鼎遍灑仙露，全隊恢復 2.65x 氣血並獲強效護盾'
    },
    stats: { str: 7, con: 16, int: 25, agi: 16 }
  },
  {
    baseId: 'h_t5_sanzang',
    name: '唐三藏・旃檀功德佛',
    icon: '🪷',
    faction: 'journey_west',
    tier: 5,
    heroClass: '藥師',
    element: '金',
    desc: '金蟬子轉世西行求取真經，九環錫杖與錦襴袈裟庇佑眾生百邪不侵。',
    traitName: '緊箍梵音渡厄',
    traitDesc: '生命 +26%、防禦 +22%、行動後自動療傷、絕學附護盾',
    traitBonus: { hpPct: 0.26, defPct: 0.22, skillChance: 0.18, autoHealPct: 0.90, shieldOnSkillPct: 1.00 },
    signatureSkill: {
      name: '錦襴佛光・緊箍渡厄咒',
      icon: '🪷',
      target: 'heal',
      mult: 2.50,
      shieldRatio: 1.00,
      desc: '誦念大乘真經普照佛光，全隊回血 2.50x 並獲金身護盾'
    },
    stats: { str: 5, con: 18, int: 26, agi: 15 }
  },
  {
    baseId: 'h_t5_guanyin',
    name: '觀世音・大慈大悲菩薩',
    icon: '🏺',
    faction: 'journey_west',
    tier: 5,
    heroClass: '藥師',
    element: '水',
    desc: '南海普陀山落伽聖境尊者，手持羊脂玉淨瓶與楊柳枝，甘露遍灑三界！',
    traitName: '玉淨瓶楊柳甘露',
    traitDesc: '生命 +28%、防禦 +24%、行動後自動療傷、絕學附巨盾',
    traitBonus: { hpPct: 0.28, defPct: 0.24, skillChance: 0.20, autoHealPct: 1.15, shieldOnSkillPct: 1.10 },
    signatureSkill: {
      name: '玉淨瓶・楊柳甘露普渡',
      icon: '🏺',
      target: 'heal',
      mult: 2.85,
      shieldRatio: 1.10,
      desc: '楊柳枝揮灑三界甘露，全隊大幅恢復 2.85x 氣血並獲慈悲護盾'
    },
    stats: { str: 5, con: 19, int: 28, agi: 17 }
  },
  {
    baseId: 'h_t5_fengshui',
    name: '鬼谷子・縱橫',
    icon: '🌀',
    tier: 5,
    heroClass: '風水師',
    element: '水',
    desc: '雲夢山鬼谷仙師，一怒而諸侯懼，安居而天下熄，洞察陰陽兩界法則。',
    traitName: '捭闔陰陽道',
    traitDesc: '速度 +28%、攻擊 +18%、防禦 +18%、施法附全隊護盾',
    traitBonus: { speedPct: 0.28, atkPct: 0.18, defPct: 0.18, skillChance: 0.16, shieldOnSkillPct: 1.15 },
    signatureSkill: {
      name: '縱橫捭闔・陰陽逆轉陣',
      icon: '🌀',
      target: 'aoe',
      mult: 2.05,
      effect: 'weaken',
      effectTurns: 3,
      desc: '顛倒陰陽兩儀困殺全場 2.05x 法傷並大幅削弱敵軍'
    },
    stats: { str: 7, con: 14, int: 23, agi: 20 }
  },
  {
    baseId: 'h_t5_kongming',
    name: '諸葛孔明・臥龍仙師',
    icon: '🪶',
    faction: 'three_kingdoms',
    tier: 5,
    heroClass: '風水師',
    element: '木',
    desc: '功蓋三分國、名成八陣圖！羽扇輕搖借東風、點七星燈逆轉天命。',
    traitName: '七星續命八卦陣',
    traitDesc: '速度 +28%、攻擊 +20%、五行增傷 +22%、行動後自動療傷',
    traitBonus: { speedPct: 0.28, atkPct: 0.20, elemDmgPct: 0.22, skillChance: 0.16, autoHealPct: 0.85 },
    signatureSkill: {
      name: '七星續命・八陣神雷火',
      icon: '🪶',
      target: 'aoe',
      mult: 2.15,
      effect: 'burn',
      effectTurns: 3,
      desc: '演繹八陣圖借東風引神雷，轟擊全場 2.15x 法傷並灼燒'
    },
    stats: { str: 6, con: 14, int: 26, agi: 20 }
  },
  {
    baseId: 'h_t5_caocao',
    name: '曹孟德・魏武帝',
    icon: '🗡️',
    faction: 'three_kingdoms',
    tier: 5,
    heroClass: '風水師',
    element: '水',
    desc: '治世之能臣、亂世之奸雄！橫槊賦詩臨碣石，佩倚天青釭雙劍號令天下。',
    traitName: '挾天子青釭霸業',
    traitDesc: '攻擊 +24%、防禦 +20%、速度 +24%、吸血 16%、暴擊率 +16%',
    traitBonus: { atkPct: 0.24, defPct: 0.20, speedPct: 0.24, skillChance: 0.14, lifestealPct: 0.16, critRate: 0.16 },
    signatureSkill: {
      name: '倚天青釭・天下歸心斬',
      icon: '🗡️',
      target: 'aoe',
      mult: 2.10,
      ignoreDefPct: 0.30,
      effect: 'armorBreak',
      effectTurns: 3,
      desc: '雙劍齊出號令天下，橫掃全場 2.10x 破甲劍氣'
    },
    stats: { str: 14, con: 16, int: 24, agi: 18 }
  }
];

/**
 * 依據模板建立英雄實例（相容 4 參數呼叫）
 */
export function instantiateHero(template, randomElem = true, forcedElem = null, elemGenerator = null) {
  const tier = template.tier || 1;
  const elemKeys = Object.keys(ELEMENTS);
  const chosenElement = forcedElem
    || (randomElem
      ? (typeof elemGenerator === 'function'
        ? elemGenerator()
        : elemKeys[Math.floor(Math.random() * elemKeys.length)])
      : (template.element || '金'));

  const stats = {
    str: template.stats?.str || 4,
    con: template.stats?.con || 4,
    int: template.stats?.int || 2,
    agi: template.stats?.agi || 2
  };

  const maxHp = Math.floor(140 + (tier * 50) + (stats.con * 18));
  const atk = Math.floor(18 + (tier * 12) + (stats.str * 3.2) + (stats.int * 2.2));
  const def = Math.floor(6 + (tier * 4) + (stats.con * 1.2));
  const speed = Math.floor(10 + (tier * 2) + (stats.agi * 2));

  return {
    instanceId: `hero_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    baseId: template.baseId,
    name: template.name,
    icon: template.icon || '🧑',
    faction: template.faction || null,
    tier,
    heroClass: template.heroClass || '猛將',
    element: chosenElement,
    desc: template.desc || '',
    traitName: template.traitName || '江湖歷練',
    traitDesc: template.traitDesc || '全屬性小幅提升',
    traitBonus: template.traitBonus || {},
    signatureSkill: template.signatureSkill || null,
    level: 1,
    exp: 0,
    maxExp: 100,
    fusionLevel: 0,
    stats,
    maxHp,
    hp: maxHp,
    atk,
    def,
    speed,
    fatigue: 0,
    rage: 0,
    ammo: 6,
    maxAmmo: 6,
    mp: 100,
    maxMp: 100,
    activeSkillSlots: [],
    passiveSkillSlots: []
  };
}

/**
 * 計算目前出戰英雄陣容的「五行、三國、西遊與名將羈絆光環」
 */
export function computeTeamSynergy(deployedHeroes = []) {
  const activeList = (deployedHeroes || []).filter(Boolean);
  const auras = [];
  const totalBonus = {
    atkPct: 0,
    defPct: 0,
    hpPct: 0,
    speedPct: 0,
    skillChance: 0
  };

  if (activeList.length === 0) {
    return { auras, totalBonus };
  }

  // 1. 計算五行分布
  const elemCounts = {};
  activeList.forEach(h => {
    const el = h.element || '金';
    elemCounts[el] = (elemCounts[el] || 0) + 1;
  });

  const uniqueElems = Object.keys(elemCounts).length;
  const maxSameElem = Math.max(...Object.values(elemCounts));

  if (uniqueElems >= 3) {
    auras.push({
      id: 'synergy_rainbow',
      name: `☯️ 五行相生陣（${uniqueElems}種五行）`,
      desc: '全隊攻防 +8%、速度 +6%',
      bonus: { atkPct: 0.08, defPct: 0.08, speedPct: 0.06 }
    });
    totalBonus.atkPct += 0.08;
    totalBonus.defPct += 0.08;
    totalBonus.speedPct += 0.06;
  }

  if (maxSameElem >= 2) {
    const domElem = Object.keys(elemCounts).find(k => elemCounts[k] === maxSameElem);
    auras.push({
      id: 'synergy_mono',
      name: `🔥 同氣連枝陣（${maxSameElem}名${domElem}屬性）`,
      desc: '全隊攻擊 +10%、技能發動率 +5%',
      bonus: { atkPct: 0.10, skillChance: 0.05 }
    });
    totalBonus.atkPct += 0.10;
    totalBonus.skillChance += 0.05;
  }

  // 2. 三國群英陣營羈絆
  const tkCount = activeList.filter(h => {
    const tpl = HERO_TEMPLATES.find(t => t.baseId === h.baseId);
    return (h.faction || tpl?.faction) === 'three_kingdoms';
  }).length;
  if (tkCount >= 2) {
    auras.push({
      id: 'synergy_three_kingdoms',
      name: `⚔️ 三國群英譜（${tkCount}位三國名將）`,
      desc: '全隊攻擊 +12%、防禦 +10%',
      bonus: { atkPct: 0.12, defPct: 0.10 }
    });
    totalBonus.atkPct += 0.12;
    totalBonus.defPct += 0.10;
  }

  // 3. 西遊取經陣營羈絆
  const jwCount = activeList.filter(h => {
    const tpl = HERO_TEMPLATES.find(t => t.baseId === h.baseId);
    return (h.faction || tpl?.faction) === 'journey_west';
  }).length;
  if (jwCount >= 2) {
    auras.push({
      id: 'synergy_journey_west',
      name: `🐒 西遊取經人（${jwCount}位西遊仙佛）`,
      desc: '全隊最大生命 +14%、技能發動率 +8%',
      bonus: { hpPct: 0.14, skillChance: 0.08 }
    });
    totalBonus.hpPct += 0.14;
    totalBonus.skillChance += 0.08;
  }

  // 4. 高階名將共鳴（Tier 4 以上）
  const highTierCount = activeList.filter(h => (h.tier || 1) >= 4).length;
  if (highTierCount >= 2) {
    auras.push({
      id: 'synergy_legend',
      name: `👑 宗師雲集（${highTierCount}位高階宗師）`,
      desc: '全隊最大生命 +12%、速度 +8%',
      bonus: { hpPct: 0.12, speedPct: 0.08 }
    });
    totalBonus.hpPct += 0.12;
    totalBonus.speedPct += 0.08;
  }

  return { auras, totalBonus };
}
