import { ZONES } from '../../data/constants';
import { getRandomElement, normalizeHero } from '../statCalculator';
import { getSkillMeta } from './combatFormulas';
import { resolveCombatRound } from './combatRoundResolver';

/**
 * 自動戰鬥 AI 決策：從第 4 招往第 1 招挑選冷卻完畢且資源足夠的技能，第 1 招即為基礎循環技
 */
export function pickBestAutoCombatAction(
  player,
  classSkills = [],
  combatBuffs = {},
  activeHeroInstanceIds = [],
  heroRoster = []
) {
  const cds = combatBuffs?.skillCooldowns || {};

  for (let idx = classSkills.length - 1; idx >= 0; idx--) {
    const sk = classSkills[idx];
    if (!sk) continue;

    const skLvl = player.skillLevels?.[idx] || 0;
    const { unlockLevel, reqPrevSkillLevel } = getSkillMeta(sk, idx);
    if ((player.level || 1) < unlockLevel || skLvl <= 0) continue;
    if (idx > 0 && reqPrevSkillLevel > 0 && (player.skillLevels?.[idx - 1] || 0) < reqPrevSkillLevel) continue;
    if ((cds[idx] || 0) > 0) continue;

    if (sk.costType === 'rage' && (player.rage || 0) < sk.cost) continue;
    if (sk.costType === 'mp' && (player.mp || 0) < sk.cost) continue;
    if (sk.costType === 'ammo' && (player.ammo || 0) < sk.cost) continue;

    if (sk.id === 'w_s2' && (combatBuffs.guardTurns || 0) > 0) continue;
    if (sk.id === 'f_s2' && (combatBuffs.windBuffTurns || 0) > 0) continue;
    if (sk.id === 'f_s3' && (combatBuffs.baguaTurns || 0) > 0) continue;
    if (sk.id === 'f_s4' && (combatBuffs.tianjiTurns || 0) > 0) continue;

    return { type: 'skill', skill: sk, skillIdx: idx };
  }

  return classSkills[0]
    ? { type: 'skill', skill: classSkills[0], skillIdx: 0 }
    : { type: 'attack' };
}

export function simulateZoneSweep({
  player,
  currentRoster,
  activeHeroInstanceIds,
  currentZoneIndex,
  sweepCount = 3,
  isFengShui,
  getHeroRowIdx,
  classSkills = [],
  playerTotalMaxHp,
  playerTotalMaxMp,
  playerTotalAtk,
  playerTotalDef,
  playerTotalSpeed = 12,
  playerRowBuff = { label: '中排', physReducePct: 0 },
  rawFormBonus = {},
  formMultiplier = 1.0
}) {
  const zone = ZONES[currentZoneIndex] || ZONES[0];
  const zoneScale = 1 + (currentZoneIndex * 0.22);
  const totalCombatants = 1 + activeHeroInstanceIds.length;

  let simPlayer = { ...player };
  let simRoster = currentRoster.map(h => normalizeHero(h));
  let sumGold = 0;
  let sumExp = 0;
  let sumStones = 0;
  let completedBattles = 0;
  let isDefeated = false;
  let defeatSummary = null;

  const allDroppedEquipments = [];
  const allDroppedSkillCards = [];
  const allDroppedHeroes = [];
  const allMsgs = [];

  for (let s = 0; s < sweepCount; s++) {
    if (simPlayer.hp <= 0) break;

    const count = Math.floor(Math.random() * (totalCombatants * 2)) + Math.max(2, totalCombatants);
    let monsters = [];
    for (let i = 0; i < count; i++) {
      const template = zone.monsters[Math.floor(Math.random() * zone.monsters.length)];
      const isElite = Math.random() < 0.25;
      const eliteStatMult = isElite ? 1.35 : 1.0;
      const eliteRewardMult = isElite ? 1.40 : 1.0;
      const elem = template.element || getRandomElement();

      const mHp = Math.floor((template.hp || 100) * zoneScale * eliteStatMult);
      const mAtk = Math.floor((template.atk || 15) * zoneScale * eliteStatMult);
      const mDef = Math.floor((template.def || 5) * zoneScale * eliteStatMult);

      monsters.push({
        id: `sweep_m_${s}_${i}_${Math.random().toString(36).slice(2, 7)}`,
        name: `${isElite ? '【菁英】' : ''}${template.name}`,
        isElite,
        isBoss: false,
        element: elem,
        originalElement: elem,
        hp: mHp,
        maxHp: mHp,
        atk: mAtk,
        def: mDef,
        speed: template.speed ? Math.floor(template.speed * (isElite ? 1.1 : 1.0)) : undefined,
        exp: Math.floor(template.exp * eliteRewardMult * (1 + currentZoneIndex * 0.1)),
        gold: Math.floor(template.gold * eliteRewardMult * zoneScale)
      });
    }

    let combatBuffs = { shield: 0, tauntTurns: 0, guardTurns: 0, baguaTurns: 0, skillCooldowns: { 0: 0, 1: 0, 2: 0, 3: 0 } };
    let heroBattleBuffs = {};
    let battleDownedHeroIds = [];
    let battleOutcome = 'CONTINUE';
    let roundCount = 0;
    const MAX_ROUNDS = 50;

    const handleRoundResult = (res) => {
      if (res.outcome === 'CONTINUE') {
        monsters = res.tickedMonsters;
        simPlayer = res.updatedPlayer;
        simRoster = res.updatedRoster;
        battleDownedHeroIds = res.updatedDownedIds;
        combatBuffs = res.tickedBuffs;
        heroBattleBuffs = res.tickedHeroBuffs;
      } else if (res.outcome === 'VICTORY') {
        simPlayer = res.newPlayer;
        simRoster = res.finalRoster;
        completedBattles++;
        sumGold += res.victorySummary.gold;
        sumExp += res.victorySummary.exp;
        sumStones += res.victorySummary.stones;
        allMsgs.push(`⚔️ 第 ${s + 1} 場掃蕩勝利（耗時 ${roundCount} 回合，剩餘 HP: ${simPlayer.hp}/${playerTotalMaxHp || simPlayer.maxHp}）`);
        if (res.droppedEquipments?.length > 0) allDroppedEquipments.push(...res.droppedEquipments);
        if (res.droppedSkillCard) allDroppedSkillCards.push(res.droppedSkillCard);
        if (res.victorySummary.droppedHero) allDroppedHeroes.push(res.victorySummary.droppedHero);
        if (res.victorySummary.msgs?.length > 0) allMsgs.push(...res.victorySummary.msgs);
      } else if (res.outcome === 'DEFEAT') {
        simPlayer = res.defeatedPlayer;
        simRoster = res.finalRoster;
        isDefeated = true;
        defeatSummary = res.defeatSummary;
        allMsgs.push(`☠️ 第 ${s + 1} 場掃蕩戰敗（第 ${roundCount} 回合不敵倒下），後續掃蕩已強制中止！`);
        if (res.defeatSummary?.casualties?.length > 0) {
          allMsgs.push(...res.defeatSummary.casualties);
        }
      }
    };

    while (battleOutcome === 'CONTINUE' && roundCount < MAX_ROUNDS) {
      roundCount++;

      const aiAction = pickBestAutoCombatAction(
        simPlayer,
        classSkills,
        combatBuffs,
        activeHeroInstanceIds,
        simRoster
      );

      const targetIdx = monsters.findIndex(m => m.hp > 0);
      const roundArgs = {
        actionInput: aiAction,
        monsters,
        player: simPlayer,
        heroRoster: simRoster,
        activeHeroInstanceIds,
        selectedTargetIndex: targetIdx === -1 ? 0 : targetIdx,
        combatBuffs,
        heroBattleBuffs,
        battleDownedHeroIds,
        playerTotalMaxHp: playerTotalMaxHp || simPlayer.maxHp,
        playerTotalMaxMp: playerTotalMaxMp || simPlayer.maxMp,
        playerTotalAtk: playerTotalAtk || Math.floor((simPlayer.stats?.str || 10) * 3),
        playerTotalDef: playerTotalDef || Math.floor((simPlayer.stats?.con || 10) * 1.5),
        playerTotalSpeed,
        playerRowBuff,
        rawFormBonus,
        formMultiplier,
        currentZoneIndex,
        activeTowerFloor: null,
        isFengShui,
        getHeroRowIdx
      };

      const roundRes = resolveCombatRound(roundArgs);

      if (roundRes.outcome === 'ABORTED') {
        const fallbackAction = classSkills[0]
          ? { type: 'skill', skill: classSkills[0], skillIdx: 0 }
          : { type: 'attack' };
        const fallbackRes = resolveCombatRound({
          ...roundArgs,
          actionInput: fallbackAction
        });
        battleOutcome = fallbackRes.outcome;
        handleRoundResult(fallbackRes);
      } else {
        battleOutcome = roundRes.outcome;
        handleRoundResult(roundRes);
      }
    }

    if (battleOutcome === 'CONTINUE' && roundCount >= MAX_ROUNDS) {
      allMsgs.push(`⏳ 第 ${s + 1} 場掃蕩激戰超過 ${MAX_ROUNDS} 回合未分勝負，隊伍力竭撤退中止掃蕩！`);
      break;
    }

    if (isDefeated) {
      break;
    }
  }

  return {
    newPlayer: simPlayer,
    finalRoster: simRoster,
    allDroppedEquipments,
    allDroppedSkillCards,
    isDefeated,
    defeatSummary,
    sweepSummary: {
      isSweep: true,
      sweepCount,
      completedBattles,
      isDefeated,
      defeatSummary,
      zoneName: zone.name,
      gold: sumGold,
      exp: sumExp,
      stones: sumStones,
      droppedEquipments: allDroppedEquipments,
      droppedSkillCards: allDroppedSkillCards,
      droppedHeroes: allDroppedHeroes,
      droppedSkillCard: allDroppedSkillCards[0] || null,
      droppedHero: allDroppedHeroes[0] || null,
      msgs: allMsgs
    }
  };
}
