/**
 * 《天外 Online》鎮魔五塔（Five Pagodas of Demon Suppression）配置與獎勵規則
 * 所有挑戰塔均不提供經驗值（0 EXP），專精產出高階資源與 4-5 星裝備/英雄/技能卡
 */

export const DEMON_TOWERS = {
  gold: {
    id: 'gold',
    name: '聚寶金窟塔',
    shortName: '金幣塔',
    icon: '💰',
    themeColor: 'amber',
    elementHint: '土 / 金系守衛（高防重甲）',
    specialty: '海量金幣（隨層數指數成長）',
    milestoneDesc: '每 5 層首通額外獲贈【招財金錠禮包】巨額金幣',
    enemyArchetype: '機關金甲衛'
  },
  refine: {
    id: 'refine',
    name: '淬火煉器塔',
    shortName: '煉器塔',
    icon: '🔮',
    themeColor: 'purple',
    elementHint: '火 / 金系傀儡（高爆發灼燒）',
    specialty: '大量精鍊石 ＋ 裝備防爆符',
    milestoneDesc: '每 5 層首領必掉防爆符；每 10 層首通必得高級防爆符 ×2',
    enemyArchetype: '烈焰煉器傀儡'
  },
  hero: {
    id: 'hero',
    name: '英靈點將塔',
    shortName: '英雄塔',
    icon: '👑',
    themeColor: 'emerald',
    elementHint: '歷代名將幻影（完整陣法連攜）',
    specialty: '2★～5★ 英雄名將卡',
    milestoneDesc: '11層起出 4★；每 10 層首通必掉【5★ 傳說名將】',
    enemyArchetype: '英靈殿戰魂'
  },
  skill: {
    id: 'skill',
    name: '藏經萬象塔',
    shortName: '技能塔',
    icon: '📜',
    themeColor: 'cyan',
    elementHint: '術士與風水師幻象（高閃避多控制）',
    specialty: '2★～5★ 主動／被動技能秘笈卡',
    milestoneDesc: '11層起出 4★；每 10 層首通必掉【5★ 絕世秘笈】',
    enemyArchetype: '藏經閣守陣人'
  },
  equip: {
    id: 'equip',
    name: '神兵鍛造塔',
    shortName: '裝備塔',
    icon: '⚔️',
    themeColor: 'rose',
    elementHint: '巨型妖王與重甲魔將（高血高抗）',
    specialty: '2★～5★ 神兵利器與護甲',
    milestoneDesc: '11層起出 4★；每 10 層首通必掉【5★ 仙品神兵】',
    enemyArchetype: '鎮獄妖王'
  }
};

export const TOWER_TYPE_LIST = ['gold', 'refine', 'hero', 'skill', 'equip'];

export const DEFAULT_TOWER_PROGRESS = {
  gold: 1,
  refine: 1,
  hero: 1,
  skill: 1,
  equip: 1
};

/**
 * 舊存檔遷移與標準化：將舊版單一 towerFloor 平滑遷移至五塔進度
 */
export function normalizeTowerProgress(player) {
  const legacyFloor = Math.max(1, Number(player?.towerFloor || player?.highestTowerFloor || 1));
  const raw = player?.towerProgress || {};
  return {
    gold: Math.max(1, Number(raw.gold || legacyFloor)),
    refine: Math.max(1, Number(raw.refine || legacyFloor)),
    hero: Math.max(1, Number(raw.hero || legacyFloor)),
    skill: Math.max(1, Number(raw.skill || legacyFloor)),
    equip: Math.max(1, Number(raw.equip || legacyFloor))
  };
}

/**
 * 依層數推算該層建議怪物等級（僅用於屬性縮放，塔內戰鬥一律不給經驗）
 */
export function getTowerFloorMonsterLevel(floor = 1) {
  return Math.max(1, Math.floor(2 + (floor - 1) * 1.5));
}

/**
 * 依層數決定塔內掉落星級區間（11層起開放 4★，每 10 層首通保底 5★）
 */
export function getTowerDropStarRange(floor = 1, isFirstClear = true) {
  const isTenMilestone = floor % 10 === 0;
  const isFiveBoss = floor % 5 === 0;

  if (!isFirstClear) {
    // 已通關層數重複挑戰：僅產出 2-3 星基礎肥料
    return { minStar: 2, maxStar: 3, guaranteedFiveStar: false };
  }

  if (isTenMilestone) {
    return { minStar: 5, maxStar: 5, guaranteedFiveStar: true };
  }
  if (floor >= 26) {
    return { minStar: isFiveBoss ? 4 : 3, maxStar: 5, guaranteedFiveStar: false };
  }
  if (floor >= 11) {
    return { minStar: isFiveBoss ? 4 : 3, maxStar: 4, guaranteedFiveStar: false };
  }
  return { minStar: 2, maxStar: isFiveBoss ? 4 : 3, guaranteedFiveStar: false };
}

/**
 * 計算指定塔層通關獎勵參數
 */
export function calculateTowerFloorRewards({ towerType = 'gold', floor = 1, isFirstClear = true }) {
  const f = Math.max(1, Number(floor) || 1);
  const repeatMult = isFirstClear ? 1.0 : 0.38;
  const isFiveBoss = f % 5 === 0;
  const isTenMilestone = f % 10 === 0;

  let gold = Math.floor((40 + f * 18) * repeatMult);
  let refineStones = 0;
  let antiExplodeScrolls = 0; // 防爆符數量

  if (towerType === 'gold') {
    const baseGold = 180 + (f * 75) + Math.floor(Math.pow(f, 1.35) * 28);
    const milestoneBonus = isFirstClear && isFiveBoss ? Math.floor(baseGold * 1.25) : 0;
    gold = Math.floor((baseGold + milestoneBonus) * repeatMult);
  } else if (towerType === 'refine') {
    const baseStones = 2 + Math.floor(f / 3) + (isFiveBoss ? 3 : 0);
    refineStones = Math.max(1, Math.floor(baseStones * repeatMult));
    if (isFirstClear) {
      if (isTenMilestone) antiExplodeScrolls = 2;
      else if (isFiveBoss) antiExplodeScrolls = 1;
      else if (f >= 8 && Math.random() < 0.25) antiExplodeScrolls = 1;
    }
  } else {
    // 英雄塔 / 技能塔 / 裝備塔：附帶少量精鍊石
    if (isFirstClear && isFiveBoss) {
      refineStones = 1 + Math.floor(f / 10);
    }
  }

  const starRule = getTowerDropStarRange(f, isFirstClear);

  return {
    gold,
    refineStones,
    antiExplodeScrolls,
    ...starRule
  };
}
