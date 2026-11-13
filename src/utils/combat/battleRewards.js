import { MAX_LEVEL } from '../../data/constants';
import { SKILL_CARDS_DB, createSkillCardInstance } from '../../data/skillCards';
import { HERO_TEMPLATES, instantiateHero } from '../../data/heroes';
import { rollEquipmentFromTierRange } from '../../data/equipment';
import {
  getRandomElement,
  calculateHeroEffectiveStats,
  normalizeHero
} from '../statCalculator';

function pObjExpAfterGain(p, gain) {
  return p.level >= MAX_LEVEL ? 0 : p.exp + gain;
}

/**
 * 計算英雄獲得經驗值與升級屬性成長
 */
export function processHeroExpGain(hero, expGained, isFengShui, getHeroRowIdx) {
  let currentHero = normalizeHero(hero);
  if (currentHero.level >= MAX_LEVEL) {
    return { updatedHero: { ...currentHero, level: MAX_LEVEL, exp: 0 }, upgradedMsgs: [] };
  }

  currentHero.exp += expGained;
  const upgradedMsgs = [];

  while (currentHero.level < MAX_LEVEL && currentHero.exp >= currentHero.maxExp) {
    currentHero.exp -= currentHero.maxExp;
    currentHero.level += 1;
    currentHero.maxExp = Math.floor(100 * Math.pow(currentHero.level, 1.3));

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
 * 結算戰鬥勝利戰利品、分階裝備掉落與鎮魔塔推進
 */
export function resolveBattleVictory({
  player,
  defeatedMonsters,
  currentRoster,
  activeHeroInstanceIds,
  currentZoneIndex,
  activeTowerFloor,
  isFengShui,
  getHeroRowIdx
}) {
  let totalGold = 0;
  let totalExp = 0;
  let droppedStones = 0;
  const droppedEquipments = [];
  const msgs = [];

  defeatedMonsters.forEach(m => {
    totalGold += m.gold;
    totalExp += m.exp;
    if (Math.random() < 0.25) droppedStones += 1;
  });

  let droppedHero = null;
  if (Math.random() < 0.18) {
    const candidates = HERO_TEMPLATES.filter(t => t.tier <= Math.min(5, currentZoneIndex + 2));
    const picked = candidates[Math.floor(Math.random() * candidates.length)];
    droppedHero = normalizeHero(instantiateHero(picked, true, null, getRandomElement));
  }

  let droppedSkillCard = null;

  if (activeTowerFloor && activeTowerFloor > 0) {
    const isBossFloor = activeTowerFloor % 5 === 0;
    if (isBossFloor) {
      const bossStones = 2 + Math.floor(activeTowerFloor / 5);
      droppedStones += bossStones;
      const minT = activeTowerFloor >= 20 ? 4 : activeTowerFloor >= 15 ? 4 : 3;
      const maxT = activeTowerFloor >= 20 ? 5 : activeTowerFloor >= 10 ? 4 : 3;
      droppedEquipments.push(rollEquipmentFromTierRange(minT, maxT, 'eq_tower_boss'));

      const cardTemplate = SKILL_CARDS_DB[Math.floor(Math.random() * SKILL_CARDS_DB.length)];
      droppedSkillCard = createSkillCardInstance(cardTemplate);
      msgs.push(`🗼 討伐【鎮魔塔第 ${activeTowerFloor} 層鎮守首領】大捷！額外獲贈 +${bossStones} 顆精鍊石與首領神兵！`);
    } else {
      msgs.push(`🗼 成功突破【鎮魔塔第 ${activeTowerFloor} 層】，解鎖第 ${activeTowerFloor + 1} 層挑戰！`);
      if (Math.random() < 0.35) {
        const minT = activeTowerFloor >= 16 ? 3 : activeTowerFloor >= 6 ? 2 : 1;
        const maxT = activeTowerFloor >= 16 ? 5 : activeTowerFloor >= 11 ? 4 : activeTowerFloor >= 6 ? 3 : 2;
        droppedEquipments.push(rollEquipmentFromTierRange(minT, maxT, 'eq_tower'));
      }
      if (Math.random() < 0.40) {
        const cardTemplate = SKILL_CARDS_DB[Math.floor(Math.random() * SKILL_CARDS_DB.length)];
        droppedSkillCard = createSkillCardInstance(cardTemplate);
      }
    }
  } else {
    if (Math.random() < 0.18) {
      const zoneTierRanges = [
        [1, 2],
        [2, 3],
        [2, 4],
        [3, 4]
      ];
      const [minT, maxT] = zoneTierRanges[currentZoneIndex] || [1, 3];
      droppedEquipments.push(rollEquipmentFromTierRange(minT, maxT, 'eq_wild'));
    }

    if (Math.random() < 0.25) {
      const cardTemplate = SKILL_CARDS_DB[Math.floor(Math.random() * SKILL_CARDS_DB.length)];
      droppedSkillCard = createSkillCardInstance(cardTemplate);
    }
  }

  const mergedRoster = droppedHero ? [...currentRoster, droppedHero] : [...currentRoster];

  const finalRoster = mergedRoster.map(hero => {
    if (!activeHeroInstanceIds.includes(hero.instanceId)) return hero;
    const { updatedHero, upgradedMsgs } = processHeroExpGain(hero, totalExp, isFengShui, getHeroRowIdx);
    if (upgradedMsgs.length > 0) msgs.push(...upgradedMsgs);
    return updatedHero;
  });

  const newPlayer = {
    ...player,
    gold: player.gold + totalGold,
    refineStones: player.refineStones + droppedStones,
    exp: pObjExpAfterGain(player, totalExp)
  };

  while (newPlayer.level < MAX_LEVEL && newPlayer.exp >= newPlayer.maxExp) {
    newPlayer.exp -= newPlayer.maxExp;
    newPlayer.level += 1;
    newPlayer.maxExp = Math.floor(newPlayer.maxExp * 1.45);
    newPlayer.maxHp += 45;
    newPlayer.maxMp += 30;
    newPlayer.hp = Math.min(newPlayer.maxHp, newPlayer.hp + Math.floor(newPlayer.maxHp * 0.45));
    newPlayer.mp = Math.min(newPlayer.maxMp, newPlayer.mp + Math.floor(newPlayer.maxMp * 0.45));
    newPlayer.statPoints += 8;
    const spGain = newPlayer.level % 5 === 0 ? 2 : 1;
    newPlayer.sp += spGain;
    newPlayer.tp += 1;
    const unlockNotice = newPlayer.level === 5
      ? '（解鎖第 2 招職業技能學習權限！）'
      : newPlayer.level === 10
        ? '（解鎖第 3 招終極職業技能學習權限！）'
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
    clearedTowerFloor: activeTowerFloor || null,
    victorySummary: {
      gold: totalGold,
      exp: totalExp,
      stones: droppedStones,
      droppedEquipments,
      droppedHero,
      droppedSkillCard,
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
