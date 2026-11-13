export const SKILL_CARD_RARITIES = {
  1: {
    label: '良品',
    badgeClass: 'bg-emerald-950/70 text-emerald-300 border-emerald-600/70',
    textClass: 'text-emerald-300'
  },
  2: {
    label: '上品',
    badgeClass: 'bg-cyan-950/70 text-cyan-300 border-cyan-500/70',
    textClass: 'text-cyan-300'
  },
  3: {
    label: '絕品',
    badgeClass: 'bg-purple-950/70 text-purple-300 border-purple-500/70',
    textClass: 'text-purple-300'
  },
  4: {
    label: '仙品',
    badgeClass: 'bg-amber-950/80 text-amber-200 border-amber-400/90',
    textClass: 'text-amber-300'
  }
};

export const SKILL_CARDS_DB = [
  // ==================== 主動技能卡（20 張，收斂係數 + 限制群攻目標上限） ====================
  // --- 良品 (Rarity 1) ---
  {
    id: 'sc_act_slash',
    name: '開山裂石斬',
    type: 'active',
    rarity: 1,
    target: 'single',
    mult: 1.25,
    debuff: 'armorBreak',
    allowedJobs: ['猛將'],
    desc: '【猛將專屬】單體 1.25x 猛擊並破甲降防（2回合）。'
  },
  {
    id: 'sc_act_arrow',
    name: '追風連珠箭',
    type: 'active',
    rarity: 1,
    target: 'single',
    mult: 1.28,
    ignoreDefPct: 0.20,
    debuff: 'bleed',
    allowedJobs: ['巧匠'],
    desc: '【巧匠專屬】單體 1.28x 穿甲射擊（無視 20% 防禦）並造成流血。'
  },
  {
    id: 'sc_act_ice_bolt',
    name: '玄冰凝霜訣',
    type: 'active',
    rarity: 1,
    target: 'single',
    mult: 1.32,
    debuff: 'vuln',
    allowedJobs: ['術士'],
    desc: '【術士專屬】凝聚寒冰法球轟擊單體 1.32x 法傷並附加易傷。'
  },
  {
    id: 'sc_act_fireball',
    name: '赤炎符咒訣',
    type: 'active',
    rarity: 1,
    target: 'aoe',
    maxTargets: 2,
    mult: 0.85,
    debuff: 'burn',
    allowedJobs: ['術士', '風水師'],
    desc: '【法陣專屬】轟擊最多 2 名敵軍造成 0.85x 法傷並附加灼燒。'
  },
  {
    id: 'sc_act_mend',
    name: '回春甘露訣',
    type: 'active',
    rarity: 1,
    target: 'heal',
    mult: 0.95,
    allowedJobs: ['藥師'],
    desc: '【藥師專屬】全隊恢復 0.95x 氣血，濟世懸壺。'
  },

  // --- 上品 (Rarity 2) ---
  {
    id: 'sc_act_whirlwind',
    name: '橫掃千軍槍',
    type: 'active',
    rarity: 2,
    target: 'aoe',
    maxTargets: 2,
    mult: 0.96,
    debuff: 'armorBreak',
    allowedJobs: ['猛將'],
    desc: '【猛將專屬】橫掃最多 2 名敵軍造成 0.96x 傷害並破甲降防。'
  },
  {
    id: 'sc_act_rain_needle',
    name: '暴雨梨花針',
    type: 'active',
    rarity: 2,
    target: 'aoe',
    maxTargets: 2,
    mult: 0.92,
    debuff: 'blind',
    allowedJobs: ['巧匠'],
    desc: '【巧匠專屬】暗器齊發最多 2 名敵軍造成 0.92x 傷害並致盲。'
  },
  {
    id: 'sc_act_poison_mist',
    name: '萬蠱噬心瘴',
    type: 'active',
    rarity: 2,
    target: 'aoe',
    maxTargets: 2,
    mult: 0.88,
    debuff: 'poison',
    allowedJobs: ['藥師', '巧匠'],
    desc: '【毒醫／暗器】侵襲最多 2 名敵軍造成 0.88x 毒傷並疊加劇毒。'
  },
  {
    id: 'sc_act_silver_needle',
    name: '青囊銀針渡厄',
    type: 'active',
    rarity: 2,
    target: 'heal_single',
    mult: 1.65,
    shieldPct: 0.10,
    allowedJobs: ['藥師'],
    desc: '【藥師專屬】精準急救血量最低隊友恢復 1.65x 氣血並附帶護盾。'
  },
  {
    id: 'sc_act_bagua_light',
    name: '紫氣東來護體陣',
    type: 'active',
    rarity: 2,
    target: 'aoe',
    maxTargets: 2,
    mult: 0.85,
    debuff: 'weaken',
    shieldPct: 0.15,
    allowedJobs: ['風水師'],
    desc: '【風水師專屬】壓制最多 2 名敵軍造成 0.85x 傷害與虛弱，並展開 15% 全隊護盾。'
  },

  // --- 絕品 (Rarity 3) ---
  {
    id: 'sc_act_roar_earth',
    name: '虎嘯山河戰吼',
    type: 'active',
    rarity: 3,
    target: 'aoe',
    maxTargets: 3,
    mult: 1.08,
    debuff: 'weaken',
    shieldPct: 0.12,
    allowedJobs: ['猛將'],
    desc: '【猛將絕學】震懾最多 3 名敵軍造成 1.08x 傷害、虛弱敵軍並凝聚護盾。'
  },
  {
    id: 'sc_act_blood_blade',
    name: '修羅嗜血斬',
    type: 'active',
    rarity: 3,
    target: 'single',
    mult: 1.62,
    debuff: 'bleed',
    lifestealPct: 0.25,
    allowedJobs: ['猛將', '巧匠'],
    desc: '【物理專屬】單體 1.62x 狂暴重創、撕裂流血，並將 25% 傷害轉為自身生命。'
  },
  {
    id: 'sc_act_thousand_blades',
    name: '天羅地網千機引',
    type: 'active',
    rarity: 3,
    target: 'aoe',
    maxTargets: 3,
    mult: 1.05,
    ignoreDefPct: 0.22,
    debuff: 'bleed',
    allowedJobs: ['巧匠'],
    desc: '【巧匠絕學】機關利刃襲擊最多 3 名敵軍造成 1.05x 穿甲傷害並附加流血。'
  },
  {
    id: 'sc_act_ice_spear',
    name: '九幽玄冰刺',
    type: 'active',
    rarity: 3,
    target: 'single',
    mult: 1.68,
    ignoreDefPct: 0.30,
    debuff: 'vuln',
    allowedJobs: ['術士'],
    desc: '【術士專屬】單體 1.68x 極寒法刺（無視 30% 防禦）並附加易傷 +25%。'
  },
  {
    id: 'sc_act_lotus_regen',
    name: '百花玉露生機陣',
    type: 'active',
    rarity: 3,
    target: 'heal',
    mult: 1.15,
    teamRegenTurns: 2,
    allowedJobs: ['藥師'],
    desc: '【藥師絕學】全隊恢復 1.15x 氣血，並賦予全隊 2 回合持續生機緩回。'
  },
  {
    id: 'sc_act_qimen_star',
    name: '奇門北斗落星陣',
    type: 'active',
    rarity: 3,
    target: 'aoe',
    maxTargets: 3,
    mult: 1.06,
    debuff: 'vuln',
    shieldPct: 0.12,
    allowedJobs: ['風水師', '術士'],
    desc: '【法陣專屬】引星辰轟擊最多 3 名敵軍造成 1.06x 法傷，並附加易傷。'
  },

  // --- 仙品 (Rarity 4) ---
  {
    id: 'sc_act_sky_sword',
    name: '天外飛仙劍訣',
    type: 'active',
    rarity: 4,
    target: 'single',
    mult: 1.95,
    ignoreDefPct: 0.38,
    debuff: 'bleed',
    allowedJobs: ['猛將', '巧匠'],
    desc: '【物理仙品】單體 1.95x 毀滅劍氣，無視 38% 防禦並造成重創流血！'
  },
  {
    id: 'sc_act_execute_arrow',
    name: '奪命連環十三箭',
    type: 'active',
    rarity: 4,
    target: 'single',
    mult: 1.82,
    ignoreDefPct: 0.32,
    executeBonusPct: 0.30,
    allowedJobs: ['巧匠'],
    desc: '【巧匠仙品】連射十三箭造成 1.82x 穿甲重創，對血量低於 45% 目標額外增傷 30%！'
  },
  {
    id: 'sc_act_five_thunder',
    name: '九霄五雷正法',
    type: 'active',
    rarity: 4,
    target: 'aoe',
    maxTargets: 3,
    mult: 1.22,
    debuff: 'burn',
    allowedJobs: ['術士', '風水師'],
    desc: '【法陣仙品】天雷轟頂最多 3 名敵軍造成 1.22x 法傷，附加烈焰灼燒！'
  },
  {
    id: 'sc_act_immortal_dew',
    name: '太上九轉仙露',
    type: 'active',
    rarity: 4,
    target: 'heal',
    mult: 1.42,
    shieldPct: 0.18,
    allowedJobs: ['藥師'],
    desc: '【藥師仙品】全隊大幅回血 1.42x 並展開 18% 生命金剛護盾！'
  },

  // ==================== 被動心法卡（16 張，數值收斂並統一套用 1.2x 強化） ====================
  // --- 良品 (Rarity 1) ---
  {
    id: 'sc_pas_iron_skin',
    name: '銅皮鐵骨功',
    type: 'passive',
    rarity: 1,
    allowedJobs: ['猛將', '藥師', '風水師'],
    bonus: { defPct: 0.10, hpPct: 0.06 },
    desc: '基礎防禦 +10%、生命 +6%'
  },
  {
    id: 'sc_pas_swift_step',
    name: '草上飛身法',
    type: 'passive',
    rarity: 1,
    allowedJobs: ['巧匠', '風水師', '術士'],
    bonus: { speedPct: 0.10, atkPct: 0.05 },
    desc: '基礎速度 +10%、攻擊 +5%'
  },
  {
    id: 'sc_pas_keen_focus',
    name: '凝神破綻訣',
    type: 'passive',
    rarity: 1,
    allowedJobs: ['猛將', '巧匠', '術士'],
    bonus: { critRate: 0.06, atkPct: 0.05 },
    desc: '暴擊率 +6%、基礎攻擊 +5%'
  },

  // --- 上品 (Rarity 2) ---
  {
    id: 'sc_pas_tiger_might',
    name: '伏虎降龍勁',
    type: 'passive',
    rarity: 2,
    allowedJobs: ['猛將', '巧匠'],
    bonus: { atkPct: 0.11, hpPct: 0.06 },
    desc: '基礎攻擊 +11%、生命 +6%'
  },
  {
    id: 'sc_pas_spirit_eye',
    name: '通靈慧眼訣',
    type: 'passive',
    rarity: 2,
    allowedJobs: ['術士', '藥師', '風水師'],
    bonus: { skillChance: 0.07, atkPct: 0.07 },
    desc: '主動技能發動率 +7%、攻擊 +7%'
  },
  {
    id: 'sc_pas_herb_sutra',
    name: '百草長生經',
    type: 'passive',
    rarity: 2,
    allowedJobs: ['藥師', '猛將'],
    bonus: { hpPct: 0.13, defPct: 0.08 },
    desc: '基礎最大生命 +13%、防禦 +8%'
  },
  {
    id: 'sc_pas_armor_pierce',
    name: '透骨穿心勁',
    type: 'passive',
    rarity: 2,
    allowedJobs: ['巧匠', '猛將'],
    bonus: { ignoreDefPct: 0.10, critDmg: 0.15 },
    desc: '無視敵方防禦 +10%、暴擊傷害 +15%'
  },

  // --- 絕品 (Rarity 3) ---
  {
    id: 'sc_pas_five_elem',
    name: '五行相生心經',
    type: 'passive',
    rarity: 3,
    allowedJobs: ['術士', '風水師'],
    bonus: { elemDmgPct: 0.12, atkPct: 0.10, skillChance: 0.05 },
    desc: '五行剋制增傷 +12%、攻擊 +10%、技發率 +5%'
  },
  {
    id: 'sc_pas_shadow_step',
    name: '神行百變無影步',
    type: 'passive',
    rarity: 3,
    allowedJobs: ['巧匠', '風水師'],
    bonus: { speedPct: 0.15, doubleHitPct: 0.11 },
    desc: '基礎速度 +15%、額外追擊連擊率 +11%'
  },
  {
    id: 'sc_pas_vajra_body',
    name: '金剛不壞神功',
    type: 'passive',
    rarity: 3,
    allowedJobs: ['猛將'],
    bonus: { defPct: 0.16, hpPct: 0.14 },
    desc: '基礎防禦 +16%、最大生命 +14%'
  },
  {
    id: 'sc_pas_blood_sutra',
    name: '嗜血魔刀經',
    type: 'passive',
    rarity: 3,
    allowedJobs: ['猛將', '巧匠'],
    bonus: { atkPct: 0.11, lifestealPct: 0.08 },
    desc: '基礎攻擊 +11%、全攻擊吸血 +8%'
  },
  {
    id: 'sc_pas_mercy_lotus',
    name: '妙手回春真訣',
    type: 'passive',
    rarity: 3,
    allowedJobs: ['藥師'],
    bonus: { hpPct: 0.14, skillChance: 0.08, autoHealPct: 0.24 },
    desc: '【藥師專屬】生命 +14%、技發率 +8%、行動後自動治療傷員'
  },

  // --- 仙品 (Rarity 4) ---
  {
    id: 'sc_pas_yijin_sutra',
    name: '達摩易筋洗髓經',
    type: 'passive',
    rarity: 4,
    allowedJobs: ['猛將', '巧匠', '術士', '藥師', '風水師'],
    bonus: { atkPct: 0.12, defPct: 0.12, hpPct: 0.12, speedPct: 0.10 },
    desc: '【全職仙品】攻、防、血各 +12%、速度 +10%'
  },
  {
    id: 'sc_pas_hetu_luoshu',
    name: '河圖洛書天機錄',
    type: 'passive',
    rarity: 4,
    allowedJobs: ['術士', '藥師', '風水師'],
    bonus: { atkPct: 0.15, skillChance: 0.10, elemDmgPct: 0.12 },
    desc: '【仙品心法】攻擊 +15%、技發率 +10%、五行增傷 +12%'
  },
  {
    id: 'sc_pas_killing_intent',
    name: '天煞孤星破軍訣',
    type: 'passive',
    rarity: 4,
    allowedJobs: ['猛將', '巧匠'],
    bonus: { critRate: 0.11, critDmg: 0.28, ignoreDefPct: 0.12 },
    desc: '【物理仙品】暴擊率 +11%、暴擊傷害 +28%、無視防禦 +12%'
  },
  {
    id: 'sc_pas_qimen_bagua',
    name: '奇門遁甲八陣圖',
    type: 'passive',
    rarity: 4,
    allowedJobs: ['風水師'],
    bonus: { speedPct: 0.15, defPct: 0.13, shieldOnSkillPct: 0.35 },
    desc: '【風水仙品】速度 +15%、防禦 +13%、施放絕學時附加全隊護盾'
  }
];

export function getSkillCardRarityMeta(rarity = 1) {
  return SKILL_CARD_RARITIES[rarity] || SKILL_CARD_RARITIES[1];
}

export function createSkillCardInstance(template) {
  return {
    ...template,
    rarity: template.rarity || 1,
    uid: `card_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  };
}

/**
 * 依品階範圍加權隨機抽取技能卡
 */
export function rollWeightedSkillCard(minRarity = 1, maxRarity = 4) {
  const weightsMap = { 1: 48, 2: 30, 3: 15, 4: 7 };
  const pool = SKILL_CARDS_DB.filter(
    c => (c.rarity || 1) >= minRarity && (c.rarity || 1) <= maxRarity
  );
  const candidates = pool.length > 0 ? pool : SKILL_CARDS_DB;

  const totalWeight = candidates.reduce((sum, c) => sum + (weightsMap[c.rarity || 1] || 10), 0);
  let roll = Math.random() * totalWeight;
  let picked = candidates[0];
  for (const card of candidates) {
    roll -= weightsMap[card.rarity || 1] || 10;
    if (roll <= 0) {
      picked = card;
      break;
    }
  }
  return createSkillCardInstance(picked);
}
