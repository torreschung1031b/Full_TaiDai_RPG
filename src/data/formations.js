export const FORMATIONS_CONFIG = {
  'none': { name: '無陣法', desc: '標準五人陣（前2中1後2），全職業通用。', icon: '⚪', bonus: {} },
  'tianfu': { name: '天覆陣', desc: '天罡護體！全隊護甲 +20%，受到傷害 -10%。', icon: '🛡️', bonus: { defPct: 0.20, damageTakenPct: -0.10 } },
  'dizai': { name: '地載陣', desc: '厚德載物！全隊生命上限 +15%，格擋率 +15%。', icon: '🏔️', bonus: { hpPct: 0.15, blockPct: 0.15 } },
  'bagua': { name: '八卦陣', desc: '陰陽迴轉！五行法術傷害 +15%，速度 +15%。', icon: '☯️', bonus: { elemDmgPct: 0.15, speedPct: 0.15 } },
  'fengshi': { name: '鋒矢陣', desc: '如箭離弦！全隊物理攻擊 +25%，暴擊率 +10%。', icon: '🏹', bonus: { atkPct: 0.25, critPct: 0.10 } }
};

// 3x3 九宮格索引：0,1,2=前排 | 3,4,5=中排 | 6,7,8=後排（每種陣法開放 5 個有效陣位）
export const FORMATION_GRID_SLOTS = {
  'none': [0, 2, 4, 6, 8],
  'tianfu': [0, 1, 2, 6, 8],
  'dizai': [1, 3, 5, 6, 8],
  'bagua': [1, 3, 4, 5, 7],
  'fengshi': [1, 4, 6, 7, 8]
};
