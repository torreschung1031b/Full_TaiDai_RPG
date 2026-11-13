import { MAX_LEVEL } from '../data/constants';

export const MAX_HERO_FUSION = 5;

export function mergeHeroIntoTarget(targetHero, materialHero, nextFusion) {
  const mergedLevel = Math.min(MAX_LEVEL, Math.max(targetHero.level || 1, materialHero.level || 1));
  const mergedMaxExp = Math.floor(100 * Math.pow(mergedLevel, 1.3));
  const absorbedExp = Math.floor((materialHero.exp || 0) * 0.5) + 50;
  const mergedExp = mergedLevel >= MAX_LEVEL
    ? 0
    : Math.min(mergedMaxExp - 1, (targetHero.exp || 0) + absorbedExp);

  const tStats = targetHero.stats || { str: 4, con: 4, int: 2, agi: 2 };
  const mStats = materialHero.stats || { str: 4, con: 4, int: 2, agi: 2 };
  const primaryBonus = targetHero.heroClass === '猛將'
    ? { str: 2, con: 1, int: 0, agi: 0 }
    : targetHero.heroClass === '巧匠'
      ? { str: 1, con: 0, int: 0, agi: 2 }
      : { str: 0, con: 1, int: 2, agi: 0 };

  const mergedStats = {
    str: Math.max(tStats.str, mStats.str) + primaryBonus.str,
    con: Math.max(tStats.con, mStats.con) + primaryBonus.con,
    int: Math.max(tStats.int, mStats.int) + primaryBonus.int,
    agi: Math.max(tStats.agi, mStats.agi) + primaryBonus.agi
  };

  const tier = targetHero.tier || 1;
  const fusionStatMult = 1 + (nextFusion * 0.15);
  const newMaxHp = Math.floor((140 + (tier * 50) + (mergedStats.con * 18)) * fusionStatMult);
  const newAtk = Math.floor((18 + (tier * 12) + (mergedStats.str * 3.2) + (mergedStats.int * 2.2)) * fusionStatMult);
  const newDef = Math.floor((6 + (tier * 4) + (mergedStats.con * 1.2)) * fusionStatMult);
  const newSpeed = Math.floor((10 + (tier * 2) + (mergedStats.agi * 2)) * fusionStatMult);

  return {
    ...targetHero,
    level: mergedLevel,
    exp: mergedExp,
    maxExp: mergedMaxExp,
    fusionLevel: nextFusion,
    stats: mergedStats,
    maxHp: newMaxHp,
    hp: newMaxHp,
    atk: newAtk,
    def: newDef,
    speed: newSpeed
  };
}
