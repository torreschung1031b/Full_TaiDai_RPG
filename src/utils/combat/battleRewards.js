import { MAX_LEVEL } from '../../data/constants';
import { SKILL_CARDS_DB, createSkillCardInstance } from '../../data/skillCards';
import { HERO_TEMPLATES, instantiateHero } from '../../data/heroes';
import { rollEquipmentFromTierRange } from '../../data/equipment';
import {
  DEMON_TOWERS,
  normalizeTowerProgress,
  calculateTowerFloorRewards
} from '../../data/towers';
import {
  getRandomElement,
  getMaxExpForLevel,
  calculateHeroEffectiveStats,
  normalizeHero
} from '../statCalculator';
import {
  getAverageMonsterLevel,
  getLevelDiffExpMultiplier,
  getWildDropRates,
  rollWildDropStar
} from './combatFormulas';

function pObjExpAfterGain(p, gain) {
  return p.level >= MAX_LEVEL ? 0 : p.exp + gain;
}

/**
 * 依指定星級區間抽取英雄模板並實例化
 */
function rollHeroFromStarRange(minStar = 1, maxStar = 3) {
  const candidates = HERO_TEMPLATES.filter(t => {
    const tier = t.tier || 1;
    return tier >= minStar && tier <= maxStar;
  });
  const pool = candidates.length > 0
    ? candidates
    : HERO_TEMPLATES.filter(t => (t.tier || 1) <= maxStar);
  const finalPool = pool.length > 0 ? pool : HERO_TEMPLATES;
  const picked = finalPool[Math.floor(Math.random() * finalPool.length)];
  return normalizeHero(instantiateHero(picked, true, null, getRandomElement));
}

/**
 * 依指定星級區間抽取技能卡並實例化（自動補齊 tier 標記以相容舊資料）
 */
function rollSkillCardFromStarRange(minStar = 1, maxStar = 3) {
  const candidates = SKILL_CARDS_DB.filter(c => {
    const tier = c.tier || 1;
    return tier >= minStar && tier <= maxStar;
  });
  const pool = candidates.length > 0
    ? candidates
    : SKILL_CARDS_DB.filter(c => (c.tier || 1) <= maxStar);
  const finalPool = pool.length > 0 ? pool : SKILL_CARDS_DB;
  const picked = finalPool[Math.floor(Math.random() * finalPool.length)];
  const instance = createSkillCardInstance(picked);
  if (!instance.tier) {
    instance.tier = Math.min(maxStar, Math.max(minStar, picked.tier || minStar));
  }
  return instance;
}

/**
 * 計算英雄獲得經驗值與升級屬性成長（經驗值需求與主角 100% 同步）
 */
export function processHeroExpGain(hero, expGained, isFengShui, getHeroRowIdx) {
  let currentHero = normalizeHero(hero);
  if (currentHero.level >= MAX_LEVEL || expGained <= 0) {
    if (currentHero.level >= MAX_LEVEL) {
      return { updatedHero: { ...currentHero, level: MAX_LEVEL, exp: 0 }, upgradedMsgs: [] };
    }
    return { updatedHero: currentHero, upgradedMsgs: [] };
  }

  currentHero.exp += expGained;
  const upgradedMsgs = [];

  while (currentHero.level < MAX_LEVEL && currentHero.exp >= currentHero.maxExp) {
    currentHero.exp -= currentHero.maxExp;
    currentHero.level += 1;
    currentHero.maxExp = getMaxExpForLevel(currentHero.level);

    const tierPtsMap = { 1: 4, 2: 6, 3: 8, 4: 11, 5: 15 };
    const fusionLevel = Math.min(5, currentHero.fusionLevel || 0);
    const pts = (tierPtsMap[currentHero.tier] || 4) + fusionLevel;

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
    const fusionStatMult = 1 + (fusionLevel * 0.15);
    currentHero.maxHp = Math.floor((140 + (tier * 50) + (currentHero.stats.con * 18)) * fusionStatMult);
    currentHero.atk = Math.floor((18 + (tier * 12) + (currentHero.stats.str * 3.2) + (currentHero.stats.int * 2.2)) * fusionStatMult);
    currentHero.def = Math.floor((6 + (tier * 4) + (currentHero.stats.con * 1.2)) * fusionStatMult);
    currentHero.speed = Math.floor((10 + (tier * 2) + (currentHero.stats.agi * 2)) * fusionStatMult);

    const { effectiveMaxHp } = calculateHeroEffectiveStats(
      currentHero,
      isFengShui,
      null,
      getHeroRowIdx(currentHero.instanceId)
    );
    currentHero.hp = Math.min(effectiveMaxHp, currentHero.hp + Math.floor(effectiveMaxHp * 0.45));

    const starSuffix = fusionLevel > 0 ? ` ★+${fusionLevel}` : '';
    upgradedMsgs.push(
      `🎉 英雄【${currentHero.name}${starSuffix}】升至 Lv.${currentHero.level}（全屬性 +${pts} 點）${currentHero.level === MAX_LEVEL ? ' (已達滿級上限!)' : ''}！`
    );
  }

  if (currentHero.level >= MAX_LEVEL) {
    currentHero.level = MAX_LEVEL;
    currentHero.exp = 0;
  }

  return { updatedHero: currentHero, upgradedMsgs };
}

/**
 * 結算戰鬥勝利戰利品（區分：鎮魔五塔 0 經驗專精掉落 vs 野外/掃蕩 1-3 星掉落＋等級差經驗衰減）
 */
export function resolveBattleVictory({
  player,
  defeatedMonsters,
  currentRoster,
  activeHeroInstanceIds,
  currentZoneIndex,
  activeTower,
  activeTowerFloor,
  isFengShui,
  getHeroRowIdx
}) {
  // 向下相容舊版 activeTowerFloor 參數
  const resolvedTower = activeTower && activeTower.floor > 0
    ? activeTower
    : activeTowerFloor && activeTowerFloor > 0
      ? { type: 'equip', floor: activeTowerFloor }
      : null;

  let totalGold = 0;
  let baseMonsterExp = 0;
  let droppedStones = 0;
  let droppedAntiExplode = 0;
  const droppedEquipments = [];
  let droppedHero = null;
  let droppedSkillCard = null;
  const msgs = [];

  const monsterAvgLevel = getAverageMonsterLevel(defeatedMonsters, currentZoneIndex);

  defeatedMonsters.forEach(m => {
    totalGold += m.gold || 0;
    baseMonsterExp += m.exp || 0;
  });

  // =========================================================================
  // 分支 A：鎮魔五塔挑戰（一律 0 經驗值，依塔別產出對應專精高階資源）
  // =========================================================================
  let playerExpGained = 0;
  let playerExpRateLabel = '🗼 鎮魔塔不提供經驗值';
  let updatedTowerProgress = normalizeTowerProgress(player);
  let isTowerFirstClear = false;

  if (resolvedTower) {
    const towerMeta = DEMON_TOWERS[resolvedTower.type] || DEMON_TOWERS.equip;
    const floor = resolvedTower.floor;
    const highestCleared = updatedTowerProgress[towerMeta.id] || 1;
    isTowerFirstClear = floor >= highestCleared;

    const towerReward = calculateTowerFloorRewards({
      towerType: towerMeta.id,
      floor,
      isFirstClear: isTowerFirstClear
    });

    totalGold = towerReward.gold;
    droppedStones = towerReward.refineStones;
    droppedAntiExplode = towerReward.antiExplodeScrolls;
    playerExpGained = 0;

    if (towerMeta.id === 'hero') {
      const dropChance = isTowerFirstClear ? (floor % 5 === 0 ? 1.0 : 0.65) : 0.35;
      if (Math.random() < dropChance) {
        droppedHero = rollHeroFromStarRange(towerReward.minStar, towerReward.maxStar);
      }
    } else if (towerMeta.id === 'skill') {
      const dropChance = isTowerFirstClear ? (floor % 5 === 0 ? 1.0 : 0.70) : 0.35;
      if (Math.random() < dropChance) {
        droppedSkillCard = rollSkillCardFromStarRange(towerReward.minStar, towerReward.maxStar);
      }
    } else if (towerMeta.id === 'equip') {
      const dropChance = isTowerFirstClear ? (floor % 5 === 0 ? 1.0 : 0.70) : 0.35;
      if (Math.random() < dropChance) {
        droppedEquipments.push(
          rollEquipmentFromTierRange(towerReward.minStar, towerReward.maxStar, `eq_tower_${floor}`)
        );
      }
    }

    if (isTowerFirstClear) {
      updatedTowerProgress = {
        ...updatedTowerProgress,
        [towerMeta.id]: floor + 1
      };
      msgs.push(
        `${towerMeta.icon} 首通【${towerMeta.name} 第 ${floor} 層】！解鎖第 ${floor + 1} 層挑戰（鎮魔塔不獲得經驗值）。`
      );
      if (droppedAntiExplode > 0) {
        msgs.push(`🛡️ 獲得稀世珍寶【裝備防爆符】×${droppedAntiExplode}！`);
      }
    } else {
      msgs.push(
        `${towerMeta.icon} 重複通關【${towerMeta.name} 第 ${floor} 層】（已通關層數領取 38% 基礎駐守收益，無經驗值）。`
      );
    }
  } else {
    // =========================================================================
    // 分支 B：普通野外搜敵（套用等級差經驗衰減 + 僅掉落 1-3 星裝備/技能卡/英雄）
    // =========================================================================
    const rates = getWildDropRates(monsterAvgLevel);

    if (Math.random() < rates.stoneRate) {
      droppedStones += 1;
    }

    if (Math.random() < rates.equipRate) {
      const star = rollWildDropStar(monsterAvgLevel);
      droppedEquipments.push(rollEquipmentFromTierRange(star, star, 'eq_wild'));
    }

    if (Math.random() < rates.skillRate) {
      const star = rollWildDropStar(monsterAvgLevel);
      droppedSkillCard = rollSkillCardFromStarRange(star, star);
    }

    if (Math.random() < rates.heroRate) {
      const star = rollWildDropStar(monsterAvgLevel);
      droppedHero = rollHeroFromStarRange(star, star);
    }

    const playerScale = getLevelDiffExpMultiplier(player.level || 1, monsterAvgLevel);
    playerExpGained = Math.max(1, Math.round(baseMonsterExp * playerScale.multiplier));
    playerExpRateLabel = `怪群均等 Lv.${monsterAvgLevel}・${playerScale.label}`;
  }

  // 合併新招降英雄，並為「存活的出戰英雄」獨立計算等級差經驗（鎮魔塔時 exp = 0）
  const mergedRoster = droppedHero ? [...currentRoster, droppedHero] : [...currentRoster];
  const heroExpDetails = [];

  const finalRoster = mergedRoster.map(hero => {
    if (!activeHeroInstanceIds.includes(hero.instanceId)) return hero;
    if (resolvedTower || hero.hp <= 0) return hero;

    const hScale = getLevelDiffExpMultiplier(hero.level || 1, monsterAvgLevel);
    const hExp = Math.max(1, Math.round(baseMonsterExp * hScale.multiplier));
    heroExpDetails.push({
      instanceId: hero.instanceId,
      name: hero.name,
      expGained: hExp,
      label: hScale.label
    });

    const { updatedHero, upgradedMsgs } = processHeroExpGain(hero, hExp, isFengShui, getHeroRowIdx);
    if (upgradedMsgs.length > 0) msgs.push(...upgradedMsgs);
    return updatedHero;
  });

  // 結算少俠屬性與升級
  const newPlayer = {
    ...player,
    gold: player.gold + totalGold,
    refineStones: (player.refineStones || 0) + droppedStones,
    antiExplodeScrolls: (player.antiExplodeScrolls || 0) + droppedAntiExplode,
    towerProgress: updatedTowerProgress,
    exp: pObjExpAfterGain(player, playerExpGained),
    maxExp: getMaxExpForLevel(player.level)
  };

  while (newPlayer.level < MAX_LEVEL && newPlayer.exp >= newPlayer.maxExp) {
    newPlayer.exp -= newPlayer.maxExp;
    newPlayer.level += 1;
    newPlayer.maxExp = getMaxExpForLevel(newPlayer.level);
    newPlayer.maxHp += 45;
    newPlayer.maxMp += 30;
    newPlayer.hp = Math.min(newPlayer.maxHp, newPlayer.hp + Math.floor(newPlayer.maxHp * 0.45));
    newPlayer.mp = Math.min(newPlayer.maxMp, newPlayer.mp + Math.floor(newPlayer.maxMp * 0.45));
    newPlayer.statPoints += 8;
    const spGain = newPlayer.level % 5 === 0 ? 2 : 1;
    newPlayer.sp += spGain;
    newPlayer.tp += 1;
    const unlockNotice = newPlayer.level === 5
      ? '（解鎖第 3 招職業進階絕學學習權限！）'
      : newPlayer.level === 10
        ? '（解鎖第 4 招職業終極奧義學習權限！）'
        : '';
    msgs.push(
      `🎉 少俠升級至 Level ${newPlayer.level}${newPlayer.level === MAX_LEVEL ? ' (已達滿級上限!)' : ''}！獲得 8 點自由屬性點與 ${spGain} 點 SP${unlockNotice}！`
    );
  }

  if (newPlayer.level >= MAX_LEVEL) {
    newPlayer.level = MAX_LEVEL;
    newPlayer.exp = 0;
  }

  return {
    newPlayer,
    finalRoster,
    droppedEquipments,
    droppedSkillCard,
    clearedTower: resolvedTower,
    clearedTowerFloor: resolvedTower?.floor || null,
    victorySummary: {
      gold: totalGold,
      exp: playerExpGained,
      baseExp: baseMonsterExp,
      monsterAvgLevel,
      expRateLabel: playerExpRateLabel,
      heroExpDetails,
      stones: droppedStones,
      antiExplodeScrolls: droppedAntiExplode,
      droppedEquipments,
      droppedHero,
      droppedSkillCard,
      isTowerBattle: Boolean(resolvedTower),
      towerType: resolvedTower?.type || null,
      towerFloor: resolvedTower?.floor || null,
      isTowerFirstClear,
      msgs
    }
  };
}

/**
 * 結算戰敗經驗懲罰與重傷摘要
 */
export function resolveBattleDefeat({ player, finalRoster, casualtiesSummary = [] }) {
  const expLoss = Math.floor(player.maxExp * 0.30);
  const actualExpLost = Math.min(player.exp, expLoss);
  const remainingExp = Math.max(0, player.exp - expLoss);

  const defeatedPlayer = {
    ...player,
    hp: 1,
    exp: remainingExp
  };

  return {
    defeatedPlayer,
    finalRoster,
    defeatLog: {
      text: `☠️ 戰鬥失敗！少俠損失了 ${actualExpLost} 點經驗值（退回安全營地，請立即前往客棧休養）。`,
      type: 'danger'
    },
    defeatSummary: {
      expLost: actualExpLost,
      remainingExp,
      maxExp: player.maxExp,
      casualties: casualtiesSummary
    }
  };
}
