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

export const TIER_SKILL_CHANCE = {
  1: 0.15,
  2: 0.25,
  3: 0.35,
  4: 0.50,
  5: 0.70
};

export function createSkillCardInstance(template) {
  return {
    ...template,
    uid: `sc_${template.id}_${Date.now()}_${Math.floor(Math.random() * 100000)}`
  };
}
