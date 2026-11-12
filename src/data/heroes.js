import { MAX_LEVEL, ELEMENTS } from './constants';

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
    traitDesc: '最大生命 +12%、防禦 +10%',
    traitBonus: { hpPct: 0.12, defPct: 0.10 },
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
    traitDesc: '速度 +12%、技能發動率 +5%',
    traitBonus: { speedPct: 0.12, skillChance: 0.05 },
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
    traitDesc: '攻擊 +10%、五行剋制增傷 +10%',
    traitBonus: { atkPct: 0.10, elemDmgPct: 0.10 },
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
    traitDesc: '最大生命 +10%、技能發動率 +6%',
    traitBonus: { hpPct: 0.10, skillChance: 0.06 },
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
    traitDesc: '速度 +10%、防禦 +8%、技能發動率 +5%',
    traitBonus: { speedPct: 0.10, defPct: 0.08, skillChance: 0.05 },
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
    traitDesc: '防禦 +16%、最大生命 +10%',
    traitBonus: { defPct: 0.16, hpPct: 0.10 },
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
    traitDesc: '攻擊 +12%、速度 +12%',
    traitBonus: { atkPct: 0.12, speedPct: 0.12 },
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
    traitDesc: '攻擊 +14%、技能發動率 +6%',
    traitBonus: { atkPct: 0.14, skillChance: 0.06 },
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
    traitDesc: '攻擊 +10%、最大生命 +12%、技能發動率 +6%',
    traitBonus: { atkPct: 0.10, hpPct: 0.12, skillChance: 0.06 },
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
    traitDesc: '速度 +14%、技能發動率 +8%',
    traitBonus: { speedPct: 0.14, skillChance: 0.08 },
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
    traitDesc: '攻擊 +16%、最大生命 +14%',
    traitBonus: { atkPct: 0.16, hpPct: 0.14 },
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
    traitDesc: '攻擊 +15%、速度 +15%、技能發動率 +6%',
    traitBonus: { atkPct: 0.15, speedPct: 0.15, skillChance: 0.06 },
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
    traitDesc: '攻擊 +18%、五行剋制增傷 +15%',
    traitBonus: { atkPct: 0.18, elemDmgPct: 0.15 },
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
    traitDesc: '最大生命 +18%、防禦 +12%、技能發動率 +8%',
    traitBonus: { hpPct: 0.18, defPct: 0.12, skillChance: 0.08 },
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
    traitDesc: '速度 +16%、攻擊 +10%、技能發動率 +10%',
    traitBonus: { speedPct: 0.16, atkPct: 0.10, skillChance: 0.10 },
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
    traitDesc: '最大生命 +22%、防禦 +20%、攻擊 +12%',
    traitBonus: { hpPct: 0.22, defPct: 0.20, atkPct: 0.12 },
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
    traitDesc: '攻擊 +22%、最大生命 +18%、防禦 +14%',
    traitBonus: { atkPct: 0.22, hpPct: 0.18, defPct: 0.14 },
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
    traitDesc: '攻擊 +23%、最大生命 +20%、速度 +12%',
    traitBonus: { atkPct: 0.23, hpPct: 0.20, speedPct: 0.12 },
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
    traitDesc: '攻擊 +21%、速度 +21%、防禦 +14%',
    traitBonus: { atkPct: 0.21, speedPct: 0.21, defPct: 0.14 },
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
    traitDesc: '最大生命 +25%、防禦 +18%、攻擊 +12%',
    traitBonus: { hpPct: 0.25, defPct: 0.18, atkPct: 0.12 },
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
    traitDesc: '最大生命 +24%、防禦 +22%、攻擊 +12%',
    traitBonus: { hpPct: 0.24, defPct: 0.22, atkPct: 0.12 },
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
    traitDesc: '攻擊 +20%、速度 +20%、技能發動率 +8%',
    traitBonus: { atkPct: 0.20, speedPct: 0.20, skillChance: 0.08 },
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
    traitDesc: '速度 +20%、防禦 +16%、技能發動率 +10%',
    traitBonus: { speedPct: 0.20, defPct: 0.16, skillChance: 0.10 },
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
    traitDesc: '攻擊 +24%、五行剋制增傷 +20%',
    traitBonus: { atkPct: 0.24, elemDmgPct: 0.20 },
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
    traitDesc: '攻擊 +23%、速度 +15%、五行剋制增傷 +15%',
    traitBonus: { atkPct: 0.23, speedPct: 0.15, elemDmgPct: 0.15 },
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
    traitDesc: '攻擊 +24%、速度 +18%、技能發動率 +10%',
    traitBonus: { atkPct: 0.24, speedPct: 0.18, skillChance: 0.10 },
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
    traitDesc: '最大生命 +22%、攻擊 +14%、技能發動率 +10%',
    traitBonus: { hpPct: 0.22, atkPct: 0.14, skillChance: 0.10 },
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
    traitDesc: '最大生命 +24%、防禦 +14%、技能發動率 +10%',
    traitBonus: { hpPct: 0.24, defPct: 0.14, skillChance: 0.10 },
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
    traitDesc: '速度 +22%、防禦 +14%、技能發動率 +12%',
    traitBonus: { speedPct: 0.22, defPct: 0.14, skillChance: 0.12 },
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
    traitDesc: '攻擊 +18%、速度 +20%、五行增傷 +18%',
    traitBonus: { atkPct: 0.18, speedPct: 0.20, elemDmgPct: 0.18 },
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
    traitDesc: '攻擊 +28%、最大生命 +25%、防禦 +18%',
    traitBonus: { atkPct: 0.28, hpPct: 0.25, defPct: 0.18 },
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
    traitDesc: '攻擊 +30%、速度 +25%、最大生命 +20%',
    traitBonus: { atkPct: 0.30, speedPct: 0.25, hpPct: 0.20 },
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
    traitDesc: '攻擊 +32%、最大生命 +22%、速度 +18%',
    traitBonus: { atkPct: 0.32, hpPct: 0.22, speedPct: 0.18 },
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
    traitDesc: '攻擊 +31%、速度 +28%、最大生命 +18%',
    traitBonus: { atkPct: 0.31, speedPct: 0.28, hpPct: 0.18 },
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
    traitDesc: '最大生命 +32%、防禦 +26%、攻擊 +22%',
    traitBonus: { hpPct: 0.32, defPct: 0.26, atkPct: 0.22 },
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
    traitDesc: '攻擊 +25%、速度 +26%、技能發動率 +12%',
    traitBonus: { atkPct: 0.25, speedPct: 0.26, skillChance: 0.12 },
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
    traitDesc: '攻擊 +28%、速度 +26%、技能發動率 +12%',
    traitBonus: { atkPct: 0.28, speedPct: 0.26, skillChance: 0.12 },
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
    traitDesc: '攻擊 +30%、五行剋制增傷 +25%、技能發動率 +10%',
    traitBonus: { atkPct: 0.30, elemDmgPct: 0.25, skillChance: 0.10 },
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
    traitDesc: '攻擊 +32%、五行增傷 +26%、技能發動率 +12%',
    traitBonus: { atkPct: 0.32, elemDmgPct: 0.26, skillChance: 0.12 },
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
    traitDesc: '最大生命 +28%、攻擊 +20%、技能發動率 +14%',
    traitBonus: { hpPct: 0.28, atkPct: 0.20, skillChance: 0.14 },
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
    traitDesc: '最大生命 +26%、防禦 +22%、技能發動率 +16%',
    traitBonus: { hpPct: 0.26, defPct: 0.22, skillChance: 0.16 },
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
    traitDesc: '最大生命 +28%、防禦 +24%、技能發動率 +18%',
    traitBonus: { hpPct: 0.28, defPct: 0.24, skillChance: 0.18 },
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
    traitDesc: '速度 +28%、攻擊 +18%、防禦 +18%、技能發動率 +15%',
    traitBonus: { speedPct: 0.28, atkPct: 0.18, defPct: 0.18, skillChance: 0.15 },
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
    traitDesc: '速度 +28%、攻擊 +20%、五行增傷 +20%、技發率 +15%',
    traitBonus: { speedPct: 0.28, atkPct: 0.20, elemDmgPct: 0.20, skillChance: 0.15 },
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
    traitDesc: '攻擊 +24%、防禦 +20%、速度 +24%、技發率 +12%',
    traitBonus: { atkPct: 0.24, defPct: 0.20, speedPct: 0.24, skillChance: 0.12 },
    stats: { str: 14, con: 16, int: 24, agi: 18 }
  }
];

export function instantiateHero(template, randomElem = true, forcedElem = null, elemGenerator = null) {
  const tier = template.tier || 1;
  const elemKeys = Object.keys(ELEMENTS);
  const chosenElement = forcedElem
    || (randomElem
      ? (typeof elemGenerator === 'function' ? elemGenerator() : elemKeys[Math.floor(Math.random() * elemKeys.length)])
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
    level: 1,
    exp: 0,
    maxExp: Math.floor(100 * Math.pow(1, 1.3)),
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

export function computeTeamSynergy(deployedHeroes = []) {
  const activeList = (deployedHeroes || []).filter(Boolean);
  const auras = [];
  const totalBonus = { atkPct: 0, defPct: 0, hpPct: 0, speedPct: 0, skillChance: 0 };
  if (activeList.length === 0) return { auras, totalBonus };

  const elemCounts = {};
  activeList.forEach(h => {
    const el = h.element || '金';
    elemCounts[el] = (elemCounts[el] || 0) + 1;
  });

  const uniqueElems = Object.keys(elemCounts).length;
  const maxSameElem = Math.max(...Object.values(elemCounts));

  if (uniqueElems >= 3) {
    auras.push({ id: 'synergy_rainbow', name: `☯️ 五行相生陣（${uniqueElems}種五行）`, desc: '全隊攻防 +8%、速度 +6%', bonus: { atkPct: 0.08, defPct: 0.08, speedPct: 0.06 } });
    totalBonus.atkPct += 0.08; totalBonus.defPct += 0.08; totalBonus.speedPct += 0.06;
  }
  if (maxSameElem >= 2) {
    const domElem = Object.keys(elemCounts).find(k => elemCounts[k] === maxSameElem);
    auras.push({ id: 'synergy_mono', name: `🔥 同氣連枝陣（${maxSameElem}名${domElem}屬性）`, desc: '全隊攻擊 +10%、技能發動率 +5%', bonus: { atkPct: 0.10, skillChance: 0.05 } });
    totalBonus.atkPct += 0.10; totalBonus.skillChance += 0.05;
  }

  const tkCount = activeList.filter(h => (h.faction || HERO_TEMPLATES.find(t => t.baseId === h.baseId)?.faction) === 'three_kingdoms').length;
  if (tkCount >= 2) {
    auras.push({ id: 'synergy_three_kingdoms', name: `⚔️ 三國群英譜（${tkCount}位三國名將）`, desc: '全隊攻擊 +12%、防禦 +10%', bonus: { atkPct: 0.12, defPct: 0.10 } });
    totalBonus.atkPct += 0.12; totalBonus.defPct += 0.10;
  }

  const jwCount = activeList.filter(h => (h.faction || HERO_TEMPLATES.find(t => t.baseId === h.baseId)?.faction) === 'journey_west').length;
  if (jwCount >= 2) {
    auras.push({ id: 'synergy_journey_west', name: `🐒 西遊取經人（${jwCount}位西遊仙佛）`, desc: '全隊最大生命 +14%、技能發動率 +8%', bonus: { hpPct: 0.14, skillChance: 0.08 } });
    totalBonus.hpPct += 0.14; totalBonus.skillChance += 0.08;
  }

  const highTierCount = activeList.filter(h => (h.tier || 1) >= 4).length;
  if (highTierCount >= 2) {
    auras.push({ id: 'synergy_legend', name: `👑 宗師雲集（${highTierCount}位高階宗師）`, desc: '全隊最大生命 +12%、速度 +8%', bonus: { hpPct: 0.12, speedPct: 0.08 } });
    totalBonus.hpPct += 0.12; totalBonus.speedPct += 0.08;
  }

  return { auras, totalBonus };
}
