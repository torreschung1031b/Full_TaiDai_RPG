/**
 * 《泰太 Online》戰鬥核心計算引擎統一匯出入口（Barrel Export）
 * 對外保持 100% 既有具名匯出介面相容，內部職責已拆分至 src/utils/combat/ 各純函式模組。
 */

export {
  getMonsterSpeed,
  getSpeedAdvantage,
  getZoneSweepReqLevel,
  getPlayerStatScaling,
  getSkillMeta,
  getPlayerCritProfile,
  getHeroCritProfile,
  calculateDamageToMonster
} from './combat/combatFormulas';

export {
  processHeroExpGain,
  resolveBattleVictory,
  resolveBattleDefeat
} from './combat/battleRewards';

export {
  executeMonsterAttacks
} from './combat/monsterTurnResolver';

export {
  resolveCombatRound,
  resolveFleeCombat
} from './combat/combatRoundResolver';

export {
  pickBestAutoCombatAction,
  simulateZoneSweep
} from './combat/autoCombatAndSweep';
