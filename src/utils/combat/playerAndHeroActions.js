import { getSkillMeta, getPlayerCritProfile } from './combatFormulas';
import { executeSingleHeroAction } from './heroActionExecutor';
import { PLAYER_SKILL_HANDLERS } from './playerSkillHandlers';

export { executeSingleHeroAction };

export function validateAndConsumePlayerSkill({
  actionInput,
  currentPlayer,
  currentBuffs
}) {
  if (actionInput.type !== 'skill' || !actionInput.skill) {
    return { valid: true };
  }

  const sk = actionInput.skill;
  const skIdx = actionInput.skillIdx;
  const skLvl = currentPlayer.skillLevels?.[skIdx] || 0;
  const { unlockLevel, reqPrevSkillLevel, cooldown } = getSkillMeta(sk, skIdx);

  if ((currentPlayer.level || 1) < unlockLevel) {
    return {
      valid: false,
      abortResult: {
        outcome: 'ABORTED',
        logs: [{ text: `🔒 技能【${sk.name}】需主角達到 Lv.${unlockLevel} 方可施展！`, type: 'sys' }]
      }
    };
  }
  if (skIdx > 0 && reqPrevSkillLevel > 0 && (currentPlayer.skillLevels?.[skIdx - 1] || 0) < reqPrevSkillLevel) {
    return {
      valid: false,
      abortResult: {
        outcome: 'ABORTED',
        logs: [{ text: `🔒 需先將前一招修煉至 Lv.${reqPrevSkillLevel}，方可領悟施展【${sk.name}】！`, type: 'sys' }]
      }
    };
  }
  if (skLvl <= 0) {
    return {
      valid: false,
      abortResult: {
        outcome: 'ABORTED',
        logs: [{ text: `🔒 技能【${sk.name}】尚未學習（Lv.0），請先至「技能樹」配點學習！`, type: 'sys' }]
      }
    };
  }
  const activeCd = currentBuffs.skillCooldowns?.[skIdx] || 0;
  if (activeCd > 0) {
    return {
      valid: false,
      abortResult: {
        outcome: 'ABORTED',
        logs: [{ text: `⏳ 技能【${sk.name}】冷卻調息中，尚需 ${activeCd} 回合方可再次施放！`, type: 'sys' }]
      }
    };
  }

  let hasResource = true;
  if (sk.costType === 'rage' && currentPlayer.rage < sk.cost) hasResource = false;
  if (sk.costType === 'mp' && currentPlayer.mp < sk.cost) hasResource = false;
  if (sk.costType === 'ammo' && currentPlayer.ammo < sk.cost) hasResource = false;

  if (!hasResource) {
    return {
      valid: false,
      abortResult: {
        outcome: 'ABORTED',
        logs: [{ text: `⚠️ 資源不足，無法發動【${sk.name}】！`, type: 'sys' }]
      }
    };
  }

  if (sk.costType === 'rage') currentPlayer.rage -= sk.cost;
  if (sk.costType === 'mp') currentPlayer.mp -= sk.cost;
  if (sk.costType === 'ammo') currentPlayer.ammo -= sk.cost;
  if (cooldown > 0) {
    currentBuffs.skillCooldowns[skIdx] = cooldown + 1;
  }

  return { valid: true };
}

export function executePlayerAction({
  actionInput,
  currentMonsters,
  currentPlayer,
  currentRoster,
  activeHeroInstanceIds,
  selectedTargetIndex,
  currentBuffs,
  currentHeroBuffs,
  playerTotalMaxHp,
  playerTotalMaxMp,
  playerTotalAtk,
  playerTotalSpeed,
  isFengShui,
  getHeroRowIdx,
  logs,
  recordMonsterHit,
  recordAllyHeal
}) {
  if (currentPlayer.hp <= 0) return currentRoster;

  const isArtisan = currentPlayer.job === '巧匠';
  const innateIgnoreDef = isArtisan ? 0.15 : 0;

  const windAtkMult = currentBuffs?.windBuffTurns > 0 ? (1 + (currentBuffs.windAtkPct || 0)) : 1.0;
  const windSpeedAdd = currentBuffs?.windBuffTurns > 0 ? (currentBuffs.windSpeedBonus || 0) : 0;
  const windCritAdd = currentBuffs?.windBuffTurns > 0 ? (currentBuffs.windCritPct || 0) : 0;

  const effectivePlayerAtk = Math.floor(playerTotalAtk * windAtkMult);
  const effectivePlayerSpeed = playerTotalSpeed + windSpeedAdd;

  const { critRate: baseCritRate, critDamage: playerCritDmg } = getPlayerCritProfile(currentPlayer);
  const playerCritRate = Math.min(0.85, baseCritRate + windCritAdd);

  let targetIdx = selectedTargetIndex;
  if (!currentMonsters[targetIdx] || currentMonsters[targetIdx].hp <= 0) {
    targetIdx = currentMonsters.findIndex(m => m.hp > 0);
    if (targetIdx === -1) return currentRoster;
  }

  if (actionInput.type !== 'skill' || !actionInput.skill) {
    return currentRoster;
  }

  const sk = actionInput.skill;
  const skIdx = actionInput.skillIdx;
  const skLvl = Math.max(1, currentPlayer.skillLevels?.[skIdx] || 1);
  const skStats = sk.getStatsAtLevel ? sk.getStatsAtLevel(skLvl) : { mult: 1.0 };

  const handler = PLAYER_SKILL_HANDLERS[sk.id];
  if (!handler) return currentRoster;

  return handler({
    sk, skIdx, skLvl, skStats,
    targetIdx, innateIgnoreDef,
    effectivePlayerAtk, effectivePlayerSpeed,
    playerCritRate, playerCritDmg,
    currentMonsters, currentPlayer, updatedRoster: currentRoster,
    activeHeroInstanceIds, currentBuffs, currentHeroBuffs,
    playerTotalMaxHp, playerTotalMaxMp,
    isFengShui, getHeroRowIdx,
    logs, recordMonsterHit, recordAllyHeal
  });
}
