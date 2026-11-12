import { MAX_LEVEL, ELEMENTS } from '../data/constants';
import { SKILL_CARDS_DB, createSkillCardInstance } from '../data/skillCards';
import { HERO_TEMPLATES, instantiateHero } from '../data/heroes';
import { rollEquipmentFromTierRange } from '../data/equipment';
import { getRowPositionBuffs } from './formationHelper';
import {
  getRandomElement,
  getElementMultiplier,
  calculateHeroEffectiveStats,
  normalizeHero,
  applyHeroDeathStatPenalty,
  pickUpToNMonsterIndices
} from './statCalculator';

/**
 * 計算主角暴擊率與暴擊倍率
 */
export function getPlayerCritProfile(player) {
  const agi = player.stats?.agi || 10;
  const jobBonus = player.job === '巧匠' ? 0.10 : player.job === '風水師' ? 0.05 : 0;
  const critRate = Math.min(0.65, 0.10 + (agi * 0.004) + jobBonus);
  const critDamage = player.job === '巧匠' ? 1.75 : 1.65;
  return { critRate, critDamage };
}

/**
 * 計算英雄暴擊率與暴擊倍率
 */
export function getHeroCritProfile(hero) {
  const agi = hero.stats?.agi || 4;
  const jobBonus = hero.heroClass === '巧匠' ? 0.08 : 0;
  const critRate = Math.min(0.60, 0.08 + (agi * 0.0035) + jobBonus);
  const critDamage = 1.60;
  return { critRate, critDamage };
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

    const tierPtsMap = { 1: 2, 2: 3, 3: 5, 4: 7, 5: 10 };
    const pts = tierPtsMap[currentHero.tier] || 2;

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
    currentHero.maxHp = 130 + (tier * 45) + (currentHero.stats.con * 16);
    currentHero.atk = 16 + (tier * 11) + (currentHero.stats.str * 3) + (currentHero.stats.int * 2);
    currentHero.def = 5 + (tier * 4) + (currentHero.stats.con * 1);
    currentHero.speed = 10 + (tier * 2) + (currentHero.stats.agi * 2);

    const { effectiveMaxHp } = calculateHeroEffectiveStats(
      currentHero,
      isFengShui,
      null,
      getHeroRowIdx(currentHero.instanceId)
    );
    // 升級恢復 40% 最大生命（保留地城消耗難度）
    currentHero.hp = Math.min(effectiveMaxHp, currentHero.hp + Math.floor(effectiveMaxHp * 0.40));

    upgradedMsgs.push(
      `🎉 英雄【${currentHero.name}】升至 Lv.${currentHero.level}${currentHero.level === MAX_LEVEL ? ' (已達滿級上限!)' : ''}！`
    );
  }

  if (currentHero.level >= MAX_LEVEL) {
    currentHero.level = MAX_LEVEL;
    currentHero.exp = 0;
  }

  return { updatedHero: currentHero, upgradedMsgs };
}

/**
 * 計算我方對單體怪物造成的最終傷害（支援自然暴擊與必暴判定）
 */
export function calculateDamageToMonster(rawAtk, monster, attElem, options = {}) {
  const {
    ignoreDefPct = 0,
    isWarlock = false,
    extraElemPct = 0,
    critRate = 0.10,
    critDamage = 1.60,
    forceCrit = false
  } = options;

  const isCrit = forceCrit || (Math.random() < critRate);
  const appliedCritMult = isCrit ? critDamage : 1.0;

  const totalIgnoreDef = Math.min(
    0.95,
    ignoreDefPct + (monster.armorBreakTurns > 0 ? (monster.armorBreakPct || 0) : 0)
  );
  const effectiveMonsterDef = Math.floor(monster.def * (1 - totalIgnoreDef));

  let em = getElementMultiplier(attElem, monster.element, isWarlock);
  if (em > 1.0 && extraElemPct > 0) em += extraElemPct;

  const vulnMult = monster.vulnTurns > 0 ? (1 + (monster.vulnPct || 0)) : 1.0;
  const baseDmg = Math.max(5, Math.floor((rawAtk * appliedCritMult - effectiveMonsterDef) * em * vulnMult));
  return { dmg: baseDmg, isCounter: em > 1.0, isCrit };
}

/**
 * 結算敵方怪群行動回合（強化難度：敵方暴擊、首領橫掃、依仇恨點名英雄）
 */
export function executeMonsterAttacks({
  monsters,
  player,
  heroRoster,
  activeHeroInstanceIds,
  battleDownedHeroIds,
  combatBuffs,
  heroBattleBuffs,
  playerTotalDef,
  playerRowBuff,
  rawFormBonus,
  formMultiplier,
  isFengShui,
  getHeroRowIdx
}) {
  const logs = [];
  const updatedPlayer = { ...player };
  const updatedMonsters = monsters.map(m => ({ ...m }));
  let updatedRoster = [...heroRoster];
  const updatedDownedIds = [...battleDownedHeroIds];
  const updatedBuffs = { ...combatBuffs };
  const casualtiesSummary = [];

  const monsterHits = {};
  const allyHits = {};
  const recordAllyHit = (id, dmg, isCrit) => {
    if (!allyHits[id]) allyHits[id] = { dmg: 0, isCrit: false };
    allyHits[id].dmg += dmg;
    if (isCrit) allyHits[id].isCrit = true;
  };
  const recordMonsterHit = (id, dmg, isCrit) => {
    if (!monsterHits[id]) monsterHits[id] = { dmg: 0, isCrit: false };
    monsterHits[id].dmg += dmg;
    if (isCrit) monsterHits[id].isCrit = true;
  };

  const applyDamageToPlayer = (m, effectiveMonsterAtk, isCrit, labelPrefix = '') => {
    const critMult = isCrit ? 1.55 : 1.0;
    const em = getElementMultiplier(m.element, updatedPlayer.element, false);
    let rawDmg = Math.max(4, Math.floor((effectiveMonsterAtk * critMult - playerTotalDef) * em));

    if (playerRowBuff.physReducePct > 0) {
      rawDmg = Math.max(1, Math.floor(rawDmg * (1 - playerRowBuff.physReducePct)));
    }
    if (updatedPlayer.job === '猛將') {
      rawDmg = Math.max(1, Math.floor(rawDmg * 0.85));
    }
    if (updatedBuffs.reflectTurns > 0) {
      rawDmg = Math.max(1, Math.floor(rawDmg * 0.60));
    }
    if (updatedBuffs.baguaTurns > 0) {
      rawDmg = Math.max(1, Math.floor(rawDmg * (1 - (updatedBuffs.baguaReducePct || 0))));
    }
    if (rawFormBonus.damageTakenPct) {
      rawDmg = Math.max(1, Math.floor(rawDmg * (1 + rawFormBonus.damageTakenPct * formMultiplier)));
    }

    let hpDmg = rawDmg;
    if (updatedBuffs.shield > 0) {
      const absorbed = Math.min(updatedBuffs.shield, hpDmg);
      updatedBuffs.shield -= absorbed;
      hpDmg -= absorbed;
      logs.push({
        text: `🛡️ 護盾為少俠吸收了 ${absorbed} 點傷害（剩餘護盾: ${updatedBuffs.shield}）！`,
        type: 'sys',
        dmgRole: 'shield'
      });
    }

    updatedPlayer.hp = Math.max(0, updatedPlayer.hp - hpDmg);
    recordAllyHit('PLAYER', hpDmg, isCrit);

    logs.push({
      text: `${isCrit ? '💢敵方暴擊！' : '👹 '}【${m.name}】${labelPrefix}${m.poisonTurns > 0 ? '(中毒減攻20%)' : ''}襲擊${playerRowBuff.label}少俠，造成 ${hpDmg} 點傷害！`,
      type: 'monster',
      dmgRole: isCrit ? 'monster_crit' : 'monster_normal'
    });

    let totalReflectPct = 0;
    if (updatedBuffs.reflectTurns > 0) totalReflectPct += updatedBuffs.reflectPct || 0;
    if (updatedBuffs.baguaTurns > 0) totalReflectPct += updatedBuffs.baguaReflectPct || 0;

    if (totalReflectPct > 0 && rawDmg > 0) {
      const reflectDmg = Math.max(1, Math.floor(rawDmg * totalReflectPct));
      m.hp = Math.max(0, m.hp - reflectDmg);
      recordMonsterHit(m.id, reflectDmg, false);
      logs.push({
        text: `🔄 護體反震將 ${reflectDmg} 點傷害反彈給【${m.name}】！`,
        type: 'player',
        dmgRole: 'dot_burn'
      });
    }

    if (updatedPlayer.job === '猛將') {
      updatedPlayer.rage = Math.min(100, updatedPlayer.rage + 20);
    }
  };

  const applyDamageToHero = (m, targetHeroId, effectiveMonsterAtk, scaleMult, isCrit, labelPrefix = '') => {
    updatedRoster = updatedRoster.map(h => {
      if (h.instanceId !== targetHeroId || h.hp <= 0) return h;
      const hRow = getHeroRowIdx(h.instanceId);
      const hRowBuff = getRowPositionBuffs(hRow * 3);
      const { effectiveDef } = calculateHeroEffectiveStats(h, isFengShui, heroBattleBuffs[h.instanceId], hRow);
      const critMult = isCrit ? 1.50 : 1.0;

      let hDmg = Math.max(4, Math.floor((effectiveMonsterAtk * scaleMult * critMult) - Math.floor(effectiveDef * 0.65)));
      if (hRowBuff.physReducePct > 0) {
        hDmg = Math.max(1, Math.floor(hDmg * (1 - hRowBuff.physReducePct)));
      }
      if (updatedBuffs.baguaTurns > 0) {
        hDmg = Math.max(1, Math.floor(hDmg * (1 - (updatedBuffs.baguaReducePct || 0))));
      }

      const newHp = Math.max(0, h.hp - hDmg);
      recordAllyHit(h.instanceId, hDmg, isCrit);

      logs.push({
        text: `${isCrit ? '💢敵方暴擊！' : '👹 '}【${m.name}】${labelPrefix}重擊${hRowBuff.label}英雄【${h.name}】，造成 ${hDmg} 點傷害！`,
        type: 'monster',
        dmgRole: isCrit ? 'monster_crit' : 'monster_normal'
      });

      if (newHp === 0) {
        if (!updatedDownedIds.includes(h.instanceId)) {
          updatedDownedIds.push(h.instanceId);
          const { updatedHero, actualLoss, breakdownText } = applyHeroDeathStatPenalty({ ...h, hp: 0 });
          const penaltyMsg = `💔 ${hRowBuff.label}英雄【${h.name}】HP 歸零重傷瀕死！永久扣除 ${actualLoss} 點屬性（${breakdownText}）！`;
          logs.push({ text: penaltyMsg, type: 'danger' });
          casualtiesSummary.push(penaltyMsg);
          return updatedHero;
        } else {
          logs.push({ text: `💀 英雄【${h.name}】再次倒下！`, type: 'sys' });
          return { ...h, hp: 0 };
        }
      }
      return { ...h, hp: newHp };
    });
  };

  for (let idx = 0; idx < updatedMonsters.length; idx++) {
    const m = updatedMonsters[idx];
    if (m.hp <= 0) continue;
    if (updatedPlayer.hp <= 0) break;

    if (m.blindTurns > 0 && Math.random() < (m.blindPct || 0)) {
      logs.push({ text: `🕸️ 【${m.name}】受天羅地網束縛致盲，攻擊揮空失誤！`, type: 'sys' });
      continue;
    }

    const poisonAtkMult = m.poisonTurns > 0 ? 0.80 : 1.0;
    const effectiveMonsterAtk = Math.floor(m.atk * poisonAtkMult);
    const monsterCritChance = m.isBoss ? 0.25 : m.isElite ? 0.18 : 0.12;
    const isCrit = Math.random() < monsterCritChance;

    // 妖王首領 35% 機率施展「狂暴橫掃」（同時攻擊主角＋最多 2 位存活英雄）
    if (m.isBoss && Math.random() < 0.35) {
      applyDamageToPlayer(m, effectiveMonsterAtk, isCrit, '施展【狂暴橫掃】');
      const aliveHeroes = updatedRoster.filter(h => activeHeroInstanceIds.includes(h.instanceId) && h.hp > 0);
      aliveHeroes.slice(0, 2).forEach(h => {
        applyDamageToHero(m, h.instanceId, effectiveMonsterAtk, 0.75, false, '【狂暴橫掃】餘波');
      });
    } else if (updatedBuffs.tauntTurns > 0) {
      // 嘲諷期間強制攻擊主角
      applyDamageToPlayer(m, effectiveMonsterAtk, isCrit);
    } else {
      // 依前後排仇恨權重選擇目標（主角或存活英雄）
      const aliveHeroes = updatedRoster.filter(h => activeHeroInstanceIds.includes(h.instanceId) && h.hp > 0);
      const candidates = [
        { type: 'PLAYER', weight: Math.max(20, playerRowBuff.aggroWeight * (updatedPlayer.job === '猛將' ? 1.4 : 1.0)) },
        ...aliveHeroes.map(h => {
          const hRow = getHeroRowIdx(h.instanceId);
          const hRowBuff = getRowPositionBuffs(hRow * 3);
          return { type: 'HERO', heroId: h.instanceId, weight: Math.max(15, hRowBuff.aggroWeight) };
        })
      ];

      const totalWeight = candidates.reduce((acc, c) => acc + c.weight, 0);
      let roll = Math.random() * totalWeight;
      let chosen = candidates[0];
      for (const c of candidates) {
        roll -= c.weight;
        if (roll <= 0) {
          chosen = c;
          break;
        }
      }

      if (chosen.type === 'PLAYER') {
        applyDamageToPlayer(m, effectiveMonsterAtk, isCrit);
      } else {
        applyDamageToHero(m, chosen.heroId, effectiveMonsterAtk, 0.92, isCrit);
      }
    }

    if (updatedPlayer.hp <= 0) {
      logs.push({ text: `💀 少俠氣血歸零，不敵倒下！`, type: 'danger' });
      break;
    }
  }

  return {
    updatedPlayer,
    updatedMonsters,
    updatedRoster,
    updatedDownedIds,
    updatedBuffs,
    casualtiesSummary,
    monsterHits,
    allyHits,
    logs
  };
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
    newPlayer.maxHp += 30;
    newPlayer.maxMp += 20;
    // 升級恢復 35% 最大生命與內力（維持冒險消耗感）
    newPlayer.hp = Math.min(newPlayer.maxHp, newPlayer.hp + Math.floor(newPlayer.maxHp * 0.35));
    newPlayer.mp = Math.min(newPlayer.maxMp, newPlayer.mp + Math.floor(newPlayer.maxMp * 0.35));
    newPlayer.statPoints += 5;
    newPlayer.sp += 1;
    newPlayer.tp += 1;
    msgs.push(
      `🎉 少俠升級至 Level ${newPlayer.level}${newPlayer.level === MAX_LEVEL ? ' (已達滿級上限!)' : ''}！獲得 5 點屬性點與 1 點 SP！`
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

function pObjExpAfterGain(p, gain) {
  return p.level >= MAX_LEVEL ? 0 : p.exp + gain;
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

/**
 * 結算撤退逃跑（65% 成功脫離，35% 失敗遭追擊）
 */
export function resolveFleeCombat(context) {
  if (Math.random() < 0.65) {
    return {
      outcome: 'ESCAPED',
      logs: [{ text: `🏃 少俠施展輕功順利擺脫敵群，返回安全營地（整備功能已解鎖）！`, type: 'sys' }]
    };
  }

  const logs = [{ text: `⚠️ 撤退失敗！敵軍封鎖退路並趁勢發動追擊！`, type: 'danger' }];
  const atkRes = executeMonsterAttacks(context);
  logs.push(...atkRes.logs);

  if (atkRes.updatedPlayer.hp <= 0) {
    const defeatRes = resolveBattleDefeat({
      player: atkRes.updatedPlayer,
      finalRoster: atkRes.updatedRoster,
      casualtiesSummary: atkRes.casualtiesSummary
    });
    logs.push(defeatRes.defeatLog);
    return {
      outcome: 'DEFEAT',
      logs,
      ...defeatRes
    };
  }

  return {
    outcome: 'CONTINUE',
    logs,
    updatedPlayer: atkRes.updatedPlayer,
    updatedMonsters: atkRes.updatedMonsters,
    updatedRoster: atkRes.updatedRoster,
    updatedDownedIds: atkRes.updatedDownedIds,
    updatedBuffs: atkRes.updatedBuffs,
    lastRoundHits: {
      monsters: atkRes.monsterHits,
      allies: atkRes.allyHits
    }
  };
}

/**
 * 完整單回合戰鬥推進純函數（支援全職業暴擊與傷害類型標記）
 */
export function resolveCombatRound({
  actionInput = { type: 'attack' },
  monsters,
  player,
  heroRoster,
  activeHeroInstanceIds,
  selectedTargetIndex,
  combatBuffs,
  heroBattleBuffs,
  battleDownedHeroIds,
  playerTotalMaxHp,
  playerTotalMaxMp,
  playerTotalAtk,
  playerTotalDef,
  playerRowBuff,
  rawFormBonus,
  formMultiplier,
  currentZoneIndex,
  activeTowerFloor,
  isFengShui,
  getHeroRowIdx
}) {
  const logs = [];
  let currentMonsters = monsters.map(m => ({ ...m }));
  const currentPlayer = { ...player };
  let currentRoster = heroRoster.map(h => normalizeHero(h));
  const currentBuffs = { ...combatBuffs };
  const currentHeroBuffs = { ...heroBattleBuffs };

  const monsterHits = {};
  const allyHits = {};
  const recordMonsterHit = (id, dmg, isCrit) => {
    if (!monsterHits[id]) monsterHits[id] = { dmg: 0, isCrit: false };
    monsterHits[id].dmg += dmg;
    if (isCrit) monsterHits[id].isCrit = true;
  };
  const recordAllyHeal = (id, heal) => {
    if (!allyHits[id]) allyHits[id] = { dmg: 0, isCrit: false, heal: 0 };
    allyHits[id].heal = (allyHits[id].heal || 0) + heal;
  };

  let targetIdx = selectedTargetIndex;
  if (!currentMonsters[targetIdx] || currentMonsters[targetIdx].hp <= 0) {
    targetIdx = currentMonsters.findIndex(m => m.hp > 0);
    if (targetIdx === -1) targetIdx = 0;
  }

  const isWarlock = currentPlayer.job === '術士';
  const isArtisan = currentPlayer.job === '巧匠';
  const innateIgnoreDef = isArtisan ? 0.20 : 0;
  const { critRate: playerCritRate, critDamage: playerCritDmg } = getPlayerCritProfile(currentPlayer);

  let forcedHeroAction = null;

  // 1. 主角行動階段
  if (actionInput.type === 'attack' && currentMonsters[targetIdx]) {
    const targetM = currentMonsters[targetIdx];
    const hits = isArtisan && currentPlayer.ammo > 6 ? 2 : 1;

    for (let hIdx = 0; hIdx < hits; hIdx++) {
      if (targetM.hp <= 0) break;
      const { dmg, isCounter, isCrit } = calculateDamageToMonster(playerTotalAtk, targetM, currentPlayer.element, {
        ignoreDefPct: innateIgnoreDef,
        isWarlock,
        critRate: playerCritRate,
        critDamage: playerCritDmg
      });
      targetM.hp = Math.max(0, targetM.hp - dmg);
      recordMonsterHit(targetM.id, dmg, isCrit);

      logs.push({
        text: `${isCrit ? '💥暴擊！' : '🗡️ '}${hits === 2 ? `【連環二連射 第${hIdx + 1}箭】` : '普通攻擊'}對【${targetM.name}】造成 ${dmg} 點傷害！`,
        type: 'player',
        dmgRole: isCrit ? 'player_crit' : 'player_normal'
      });
      if (isWarlock && isCounter) {
        currentPlayer.mp = Math.min(playerTotalMaxMp, currentPlayer.mp + 15);
        logs.push({ text: `🔮 【五行靈體】觸發相剋，額外回復 +15 MP！`, type: 'sys' });
      }
    }

    if (currentPlayer.job === '猛將') {
      currentPlayer.rage = Math.min(100, currentPlayer.rage + 25);
      logs.push({ text: `🔥 猛將普攻攢怒 +25（目前怒氣: ${currentPlayer.rage}/100）`, type: 'sys' });
    } else if (currentPlayer.job === '巧匠') {
      currentPlayer.ammo = Math.min(currentPlayer.maxAmmo, currentPlayer.ammo + 4);
      logs.push({ text: `🏹 巧匠填裝彈藥 +4（目前彈藥: ${currentPlayer.ammo}/${currentPlayer.maxAmmo}）`, type: 'sys' });
    } else {
      currentPlayer.mp = Math.min(playerTotalMaxMp, currentPlayer.mp + 20);
      logs.push({ text: `💧 調息凝神恢復 +20 MP（目前: ${currentPlayer.mp}/${playerTotalMaxMp}）`, type: 'sys' });
    }
  } else if (actionInput.type === 'skill' && actionInput.skill) {
    const sk = actionInput.skill;
    const skLvl = currentPlayer.skillLevels[actionInput.skillIdx] || 0;

    if (skLvl <= 0) {
      return {
        outcome: 'ABORTED',
        logs: [{ text: `🔒 技能【${sk.name}】尚未學習（Lv.0），請先至「技能樹」配點學習！`, type: 'sys' }]
      };
    }

    if (sk.id === 'p_s3') {
      const deadDeployed = currentRoster.filter(h => activeHeroInstanceIds.includes(h.instanceId) && h.hp <= 0);
      if (deadDeployed.length === 0) {
        return {
          outcome: 'ABORTED',
          logs: [{ text: `⚠️ 目前沒有已陣亡的登場英雄，無需施放【九轉還魂丹】（未消耗真元）！`, type: 'sys' }]
        };
      }
    }

    if (sk.id === 'f_s1') {
      const aliveDeployed = currentRoster.filter(h => activeHeroInstanceIds.includes(h.instanceId) && h.hp > 0);
      if (aliveDeployed.length === 0) {
        return {
          outcome: 'ABORTED',
          logs: [{ text: `⚠️ 目前沒有存活的登場英雄可供借法（未消耗真元）！`, type: 'sys' }]
        };
      }
    }

    let hasResource = true;
    if (sk.costType === 'rage' && currentPlayer.rage < sk.cost) hasResource = false;
    if (sk.costType === 'mp' && currentPlayer.mp < sk.cost) hasResource = false;
    if (sk.costType === 'ammo' && currentPlayer.ammo < sk.cost) hasResource = false;

    if (!hasResource) {
      return {
        outcome: 'ABORTED',
        logs: [{ text: `⚠️ 資源不足，無法發動【${sk.name}】！`, type: 'sys' }]
      };
    }

    if (sk.costType === 'rage') currentPlayer.rage -= sk.cost;
    if (sk.costType === 'mp') currentPlayer.mp -= sk.cost;
    if (sk.costType === 'ammo') currentPlayer.ammo -= sk.cost;

    const skStats = sk.getStatsAtLevel(skLvl);

    if (sk.id === 'w_s1') {
      const shieldGain = Math.floor(playerTotalMaxHp * skStats.shieldPct);
      currentBuffs.shield += shieldGain;
      currentBuffs.tauntTurns = 2;
      logs.push({
        text: `🛡️ 猛將施展【金剛怒吼 (Lv.${skLvl})】，嘲諷全場敵怪 2 回合，並獲得 +${shieldGain} 點護盾！`,
        type: 'player',
        dmgRole: 'shield'
      });
    } else if (sk.id === 'w_s2') {
      const targetM = currentMonsters[targetIdx];
      if (targetM) {
        const { dmg, isCrit } = calculateDamageToMonster(playerTotalAtk * skStats.mult, targetM, currentPlayer.element, {
          critRate: playerCritRate,
          critDamage: playerCritDmg
        });
        targetM.hp = Math.max(0, targetM.hp - dmg);
        recordMonsterHit(targetM.id, dmg, isCrit);
        targetM.armorBreakTurns = 2;
        targetM.armorBreakPct = skStats.breakPct;
        logs.push({
          text: `${isCrit ? '💥暴擊！' : '⚔️ '}猛將施展【裂地破甲斬 (Lv.${skLvl})】，對【${targetM.name}】造成 ${dmg} 點傷害並破甲降防 ${Math.round(skStats.breakPct * 100)}% (2回合)！`,
          type: 'player',
          dmgRole: isCrit ? 'player_crit' : 'player_normal'
        });
      }
    } else if (sk.id === 'w_s3') {
      const targetM = currentMonsters[targetIdx];
      if (targetM) {
        const { dmg, isCrit } = calculateDamageToMonster(playerTotalAtk * skStats.mult, targetM, currentPlayer.element, {
          critRate: playerCritRate,
          critDamage: playerCritDmg
        });
        targetM.hp = Math.max(0, targetM.hp - dmg);
        recordMonsterHit(targetM.id, dmg, isCrit);
        currentBuffs.reflectTurns = 2;
        currentBuffs.reflectPct = skStats.reflectPct;
        logs.push({
          text: `${isCrit ? '💥暴擊！' : '🔥 '}猛將施展【不動明王架勢 (Lv.${skLvl})】，對【${targetM.name}】造成 ${dmg} 點重擊，進入減傷 40%＋反彈 ${Math.round(skStats.reflectPct * 100)}% 狀態！`,
          type: 'player',
          dmgRole: isCrit ? 'player_crit' : 'player_normal'
        });
      }
    } else if (sk.id === 'a_s1') {
      const targetM = currentMonsters[targetIdx];
      if (targetM) {
        const isFullHp = targetM.hp === targetM.maxHp;
        const { dmg, isCrit } = calculateDamageToMonster(playerTotalAtk * skStats.mult, targetM, currentPlayer.element, {
          ignoreDefPct: 0.50,
          critRate: playerCritRate,
          critDamage: isFullHp ? 1.85 : playerCritDmg,
          forceCrit: isFullHp
        });
        targetM.hp = Math.max(0, targetM.hp - dmg);
        recordMonsterHit(targetM.id, dmg, isCrit);
        logs.push({
          text: `${isCrit ? '💥暴擊！' : '🎯 '}巧匠施展【穿雲追魂箭 (Lv.${skLvl})】${isFullHp ? '滿血狙殺！' : ''}對【${targetM.name}】造成 ${dmg} 點無視半甲重傷！`,
          type: 'player',
          dmgRole: isCrit ? 'player_crit' : 'player_normal'
        });
      }
    } else if (sk.id === 'a_s2') {
      const hitIndices = pickUpToNMonsterIndices(currentMonsters, targetIdx, 3);
      hitIndices.forEach(mIdx => {
        const m = currentMonsters[mIdx];
        const { dmg, isCrit } = calculateDamageToMonster(playerTotalAtk * skStats.mult, m, currentPlayer.element, {
          ignoreDefPct: innateIgnoreDef,
          critRate: playerCritRate,
          critDamage: playerCritDmg
        });
        m.hp = Math.max(0, m.hp - dmg);
        recordMonsterHit(m.id, dmg, isCrit);
        logs.push({
          text: `${isCrit ? '💥暴擊！' : '🏹 '}巧匠施展【連珠散射 (Lv.${skLvl})】，貫穿【${m.name}】造成 ${dmg} 點傷害！`,
          type: 'player',
          dmgRole: isCrit ? 'player_crit' : 'player_normal'
        });
      });
    } else if (sk.id === 'a_s3') {
      const hitIndices = pickUpToNMonsterIndices(currentMonsters, targetIdx, 3);
      hitIndices.forEach(mIdx => {
        const m = currentMonsters[mIdx];
        const { dmg, isCrit } = calculateDamageToMonster(playerTotalAtk * skStats.mult, m, currentPlayer.element, {
          ignoreDefPct: innateIgnoreDef,
          critRate: playerCritRate,
          critDamage: playerCritDmg
        });
        m.hp = Math.max(0, m.hp - dmg);
        recordMonsterHit(m.id, dmg, isCrit);
        m.blindTurns = 2;
        m.blindPct = skStats.blindPct;
        logs.push({
          text: `${isCrit ? '💥暴擊！' : '🕸️ '}巧匠施展【天羅地網陣 (Lv.${skLvl})】，對【${m.name}】造成 ${dmg} 點傷害並致盲 -${Math.round(skStats.blindPct * 100)}% 命中！`,
          type: 'player',
          dmgRole: isCrit ? 'player_crit' : 'player_normal'
        });
      });
    } else if (sk.id === 'm_s1') {
      const targetM = currentMonsters[targetIdx];
      if (targetM) {
        const { dmg, isCounter, isCrit } = calculateDamageToMonster(playerTotalAtk * skStats.mult, targetM, currentPlayer.element, {
          isWarlock: true,
          critRate: playerCritRate,
          critDamage: playerCritDmg
        });
        targetM.hp = Math.max(0, targetM.hp - dmg);
        recordMonsterHit(targetM.id, dmg, isCrit);
        logs.push({
          text: `${isCrit ? '💥暴擊！' : '🔮 '}術士施展【本命靈訣 (Lv.${skLvl})】，轟擊【${targetM.name}】造成 ${dmg} 點五行法傷！`,
          type: 'player',
          dmgRole: isCrit ? 'player_crit' : 'player_normal'
        });
        if (isCounter) {
          currentPlayer.mp = Math.min(playerTotalMaxMp, currentPlayer.mp + 15);
          logs.push({ text: `✨ 【五行靈體】相剋共鳴，返還 +15 MP！`, type: 'sys' });
        }
      }
    } else if (sk.id === 'm_s2') {
      const counteredElem = ELEMENTS[currentPlayer.element]?.counters || '木';
      const hitIndices = pickUpToNMonsterIndices(currentMonsters, targetIdx, 5);
      let anyCountered = false;
      hitIndices.forEach(mIdx => {
        const m = currentMonsters[mIdx];
        const { dmg, isCounter, isCrit } = calculateDamageToMonster(playerTotalAtk * skStats.mult, m, currentPlayer.element, {
          isWarlock: true,
          critRate: playerCritRate,
          critDamage: playerCritDmg
        });
        if (isCounter) anyCountered = true;
        m.hp = Math.max(0, m.hp - dmg);
        recordMonsterHit(m.id, dmg, isCrit);
        m.element = counteredElem;
        m.elemShiftTurns = 2;
        logs.push({
          text: `${isCrit ? '💥暴擊！' : '☯️ '}術士【五行逆轉大陣 (Lv.${skLvl})】轟擊【${m.name}】造成 ${dmg} 點傷害並轉化為【${counteredElem}】屬性！`,
          type: 'player',
          dmgRole: isCrit ? 'player_crit' : 'player_normal'
        });
      });
      if (anyCountered) {
        currentPlayer.mp = Math.min(playerTotalMaxMp, currentPlayer.mp + 15);
        logs.push({ text: `✨ 【五行靈體】相剋共鳴，返還 +15 MP！`, type: 'sys' });
      }
    } else if (sk.id === 'm_s3') {
      const hitIndices = pickUpToNMonsterIndices(currentMonsters, targetIdx, 5);
      let anyCountered = false;
      hitIndices.forEach(mIdx => {
        const m = currentMonsters[mIdx];
        const { dmg, isCounter, isCrit } = calculateDamageToMonster(playerTotalAtk * skStats.mult, m, currentPlayer.element, {
          isWarlock: true,
          critRate: playerCritRate,
          critDamage: playerCritDmg
        });
        if (isCounter) anyCountered = true;
        m.hp = Math.max(0, m.hp - dmg);
        recordMonsterHit(m.id, dmg, isCrit);
        m.burnTurns = 2;
        m.burnDmg = Math.max(10, Math.floor(playerTotalAtk * 0.45));
        logs.push({
          text: `${isCrit ? '💥暴擊！' : '🔥 '}術士【九天焚世咒 (Lv.${skLvl})】天劫轟炸【${m.name}】造成 ${dmg} 點毀滅法傷並附加灼燒！`,
          type: 'player',
          dmgRole: isCrit ? 'player_crit' : 'player_normal'
        });
      });
      if (anyCountered) {
        currentPlayer.mp = Math.min(playerTotalMaxMp, currentPlayer.mp + 15);
        logs.push({ text: `✨ 【五行靈體】相剋共鳴，返還 +15 MP！`, type: 'sys' });
      }
    } else if (sk.id === 'p_s1') {
      const targetM = currentMonsters[targetIdx];
      if (targetM) {
        const { dmg, isCrit } = calculateDamageToMonster(playerTotalAtk * skStats.mult, targetM, currentPlayer.element, {
          critRate: playerCritRate,
          critDamage: playerCritDmg
        });
        targetM.hp = Math.max(0, targetM.hp - dmg);
        recordMonsterHit(targetM.id, dmg, isCrit);
        targetM.poisonTurns = 3;
        targetM.poisonPct = skStats.poisonPct;
        targetM.poisonStacks = Math.min(2, (targetM.poisonStacks || 0) + 1);
        logs.push({
          text: `${isCrit ? '💥暴擊！' : '🧪 '}藥師施展【穿心腐骨散 (Lv.${skLvl})】，對【${targetM.name}】造成 ${dmg} 點毒傷並附加中毒（${targetM.poisonStacks}層毒傷＋削弱 20% 攻擊力）！`,
          type: 'player',
          dmgRole: isCrit ? 'player_crit' : 'player_normal'
        });
      }
    } else if (sk.id === 'p_s2') {
      const hitIndices = pickUpToNMonsterIndices(currentMonsters, targetIdx, 3);
      hitIndices.forEach(mIdx => {
        const m = currentMonsters[mIdx];
        const { dmg, isCrit } = calculateDamageToMonster(playerTotalAtk * skStats.mult, m, currentPlayer.element, {
          critRate: playerCritRate,
          critDamage: playerCritDmg
        });
        m.hp = Math.max(0, m.hp - dmg);
        recordMonsterHit(m.id, dmg, isCrit);
        m.poisonTurns = 3;
        m.poisonPct = skStats.poisonPct;
        m.poisonStacks = Math.min(2, (m.poisonStacks || 0) + 1);
        logs.push({
          text: `${isCrit ? '💥暴擊！' : '☠️ '}藥師施展【五毒瘴氣 (Lv.${skLvl})】，毒霧籠罩【${m.name}】造成 ${dmg} 點傷害並使其陷入中毒！`,
          type: 'player',
          dmgRole: isCrit ? 'player_crit' : 'player_normal'
        });
      });
    } else if (sk.id === 'p_s3') {
      const deadHeroes = currentRoster.filter(h => activeHeroInstanceIds.includes(h.instanceId) && h.hp <= 0);
      const targetHero = deadHeroes[0];
      if (targetHero) {
        const { effectiveMaxHp } = calculateHeroEffectiveStats(
          targetHero,
          isFengShui,
          null,
          getHeroRowIdx(targetHero.instanceId)
        );
        const revivedHp = Math.max(1, Math.floor(effectiveMaxHp * skStats.reviveHpPct));
        currentRoster = currentRoster.map(h => (h.instanceId === targetHero.instanceId ? { ...h, hp: revivedHp } : h));
        recordAllyHeal(targetHero.instanceId, revivedHp);
        currentHeroBuffs[targetHero.instanceId] = {
          surgeTurns: 2,
          surgeAtkPct: skStats.atkBuffPct
        };
        logs.push({
          text: `💊 藥師餵服【九轉還魂丹 (Lv.${skLvl})】，成功復活英雄【${targetHero.name}】（恢復 +${revivedHp} HP）並激發攻擊力 +${Math.round(skStats.atkBuffPct * 100)}%！`,
          type: 'player',
          dmgRole: 'heal'
        });
      }
    } else if (sk.id === 'f_s1') {
      const aliveHeroes = currentRoster.filter(h => activeHeroInstanceIds.includes(h.instanceId) && h.hp > 0);
      const chosenHero = aliveHeroes[Math.floor(Math.random() * aliveHeroes.length)];
      if (chosenHero) {
        forcedHeroAction = {
          heroInstanceId: chosenHero.instanceId,
          bonusDmgPct: skStats.bonusDmgPct
        };
        logs.push({
          text: `☯️ 風水師施展【乾坤借法 (Lv.${skLvl})】，引動天地靈氣令英雄【${chosenHero.name}】立即額外爆發主動技能！`,
          type: 'player'
        });
      }
    } else if (sk.id === 'f_s2') {
      currentBuffs.baguaTurns = 2;
      currentBuffs.baguaReducePct = skStats.reducePct;
      currentBuffs.baguaReflectPct = skStats.reflectPct;
      logs.push({
        text: `🔯 風水師展開【八卦護身結界 (Lv.${skLvl})】，全隊 2 回合承傷 -${Math.round(skStats.reducePct * 100)}% 並反彈 ${Math.round(skStats.reflectPct * 100)}% 傷害！`,
        type: 'player',
        dmgRole: 'shield'
      });
    } else if (sk.id === 'f_s3') {
      currentMonsters.forEach(m => {
        if (m.hp > 0) {
          const { dmg, isCrit } = calculateDamageToMonster(playerTotalAtk * skStats.mult, m, currentPlayer.element, {
            critRate: playerCritRate,
            critDamage: playerCritDmg
          });
          m.hp = Math.max(0, m.hp - dmg);
          recordMonsterHit(m.id, dmg, isCrit);
          m.vulnTurns = 2;
          m.vulnPct = skStats.vulnPct;
        }
      });
      logs.push({
        text: `🌌 風水師施展【奇門天象變 (Lv.${skLvl})】，引動星象震盪並使全場敵怪陷入「易傷 +${Math.round(skStats.vulnPct * 100)}%」(2回合)！`,
        type: 'player'
      });
    }
  }

  // 2. 出戰英雄行動階段
  let teamHealFromHeroes = 0;

  const executeSingleHeroTurn = (h, forceSkill = false, extraBonusMult = 0) => {
    if (!activeHeroInstanceIds.includes(h.instanceId) || h.hp <= 0) return h;
    const aliveTargets = currentMonsters.filter(m => m.hp > 0);
    if (aliveTargets.length === 0) return h;
    const validTarget = aliveTargets[Math.floor(Math.random() * aliveTargets.length)];

    const hRow = getHeroRowIdx(h.instanceId);
    const { effectiveAtk, elemDmgPct, skillChance } = calculateHeroEffectiveStats(
      h,
      isFengShui,
      currentHeroBuffs[h.instanceId],
      hRow
    );
    const { critRate: hCritRate, critDamage: hCritDmg } = getHeroCritProfile(h);
    const activeCards = h.activeSkillSlots || [];
    const shouldCastSkill = activeCards.length > 0 && (forceSkill || Math.random() < skillChance);

    if (shouldCastSkill) {
      const cardToCast = activeCards[Math.floor(Math.random() * activeCards.length)];
      const mult = (cardToCast.mult || 1.8) * (1 + extraBonusMult);

      if (cardToCast.target === 'aoe') {
        let totalAoeDmg = 0;
        let anyAoeCrit = false;
        currentMonsters.forEach(m => {
          if (m.hp > 0) {
            const { dmg, isCrit } = calculateDamageToMonster(effectiveAtk * mult, m, h.element, {
              extraElemPct: elemDmgPct,
              critRate: hCritRate,
              critDamage: hCritDmg
            });
            m.hp = Math.max(0, m.hp - dmg);
            recordMonsterHit(m.id, dmg, isCrit);
            totalAoeDmg += dmg;
            if (isCrit) anyAoeCrit = true;
          }
        });
        logs.push({
          text: `${anyAoeCrit ? '💥暴擊！' : '✨ '}${forceSkill ? '【乾坤借法連動】' : ''}【Tier ${h.tier}】英雄【${h.name}】觸發技能卡【${cardToCast.name}】，橫掃全場累計造成 ${totalAoeDmg} 點傷害！`,
          type: 'hero',
          dmgRole: anyAoeCrit ? 'player_crit' : 'player_normal'
        });
      } else if (cardToCast.target === 'heal') {
        const healVal = Math.floor(effectiveAtk * mult);
        teamHealFromHeroes += healVal;
        logs.push({
          text: `🌿 ${forceSkill ? '【乾坤借法連動】' : ''}【Tier ${h.tier}】英雄【${h.name}】施展【${cardToCast.name}】，為全隊恢復 +${healVal} HP！`,
          type: 'hero',
          dmgRole: 'heal'
        });
      } else {
        const { dmg, isCrit } = calculateDamageToMonster(effectiveAtk * mult, validTarget, h.element, {
          extraElemPct: elemDmgPct,
          critRate: hCritRate,
          critDamage: hCritDmg
        });
        validTarget.hp = Math.max(0, validTarget.hp - dmg);
        recordMonsterHit(validTarget.id, dmg, isCrit);
        logs.push({
          text: `${isCrit ? '💥暴擊！' : '⚡ '}${forceSkill ? '【乾坤借法連動】' : ''}【Tier ${h.tier}】英雄【${h.name}】爆發技能卡【${cardToCast.name}】，對【${validTarget.name}】造成 ${dmg} 點重創！`,
          type: 'hero',
          dmgRole: isCrit ? 'player_crit' : 'player_normal'
        });
      }
    } else {
      const bonusMult = forceSkill ? (1 + extraBonusMult) : 1.0;
      const { dmg, isCrit } = calculateDamageToMonster(effectiveAtk * bonusMult, validTarget, h.element, {
        extraElemPct: elemDmgPct,
        critRate: hCritRate,
        critDamage: hCritDmg
      });
      validTarget.hp = Math.max(0, validTarget.hp - dmg);
      recordMonsterHit(validTarget.id, dmg, isCrit);
      logs.push({
        text: `${isCrit ? '💥暴擊！' : '💥 '}${forceSkill ? '【乾坤借法連動】' : ''}英雄【${h.name}】攻擊【${validTarget.name}】，造成 ${dmg} 點打擊！`,
        type: 'hero',
        dmgRole: isCrit ? 'player_crit' : 'player_normal'
      });
    }

    let updatedRage = h.rage || 0;
    let updatedAmmo = h.ammo || 6;
    let updatedMp = h.mp || 50;
    if (h.heroClass === '猛將') updatedRage = Math.min(100, updatedRage + 20);
    else if (h.heroClass === '巧匠') updatedAmmo = Math.min(h.maxAmmo || 6, updatedAmmo + 2);
    else updatedMp = Math.min(h.maxMp || 100, updatedMp + 15);

    return { ...h, rage: updatedRage, ammo: updatedAmmo, mp: updatedMp };
  };

  currentRoster = currentRoster.map(h => executeSingleHeroTurn(h, false, 0));

  if (forcedHeroAction) {
    currentRoster = currentRoster.map(h =>
      h.instanceId === forcedHeroAction.heroInstanceId
        ? executeSingleHeroTurn(h, true, forcedHeroAction.bonusDmgPct)
        : h
    );
  }

  if (teamHealFromHeroes > 0) {
    currentPlayer.hp = Math.min(playerTotalMaxHp, currentPlayer.hp + teamHealFromHeroes);
    recordAllyHeal('PLAYER', teamHealFromHeroes);
    currentRoster = currentRoster.map(h => {
      if (!activeHeroInstanceIds.includes(h.instanceId) || h.hp <= 0) return h;
      const { effectiveMaxHp } = calculateHeroEffectiveStats(
        h,
        isFengShui,
        currentHeroBuffs[h.instanceId],
        getHeroRowIdx(h.instanceId)
      );
      recordAllyHeal(h.instanceId, teamHealFromHeroes);
      return { ...h, hp: Math.min(effectiveMaxHp, h.hp + teamHealFromHeroes) };
    });
  }

  // 勝利檢查 1
  if (currentMonsters.every(m => m.hp <= 0)) {
    logs.push({ text: `🎉 敵方全數殲滅！戰鬥勝利（整備功能已解鎖）！`, type: 'sys' });
    const vicRes = resolveBattleVictory({
      player: currentPlayer,
      defeatedMonsters: currentMonsters,
      currentRoster,
      activeHeroInstanceIds,
      currentZoneIndex,
      activeTowerFloor,
      isFengShui,
      getHeroRowIdx
    });
    return { outcome: 'VICTORY', logs, ...vicRes };
  }

  // 3. 持續負面傷害階段
  let anyPoisonedAlive = false;
  currentMonsters = currentMonsters.map(m => {
    if (m.hp <= 0) return m;
    const updatedM = { ...m };

    if (updatedM.poisonTurns > 0) {
      const poisonDmg = Math.max(
        1,
        Math.floor(updatedM.maxHp * (updatedM.poisonPct || 0.08) * (updatedM.poisonStacks || 1))
      );
      updatedM.hp = Math.max(0, updatedM.hp - poisonDmg);
      recordMonsterHit(updatedM.id, poisonDmg, false);
      logs.push({
        text: `☠️ 【${updatedM.name}】劇毒發作，受到 ${poisonDmg} 點無視防禦真傷（攻擊力持續 -20%）！`,
        type: 'player',
        dmgRole: 'dot_poison'
      });
      if (updatedM.hp > 0) anyPoisonedAlive = true;
    }

    if (updatedM.hp > 0 && updatedM.burnTurns > 0) {
      const burnDmg = updatedM.burnDmg || 15;
      updatedM.hp = Math.max(0, updatedM.hp - burnDmg);
      recordMonsterHit(updatedM.id, burnDmg, false);
      logs.push({
        text: `🔥 【${updatedM.name}】受到灼燒持續傷害 ${burnDmg} 點！`,
        type: 'player',
        dmgRole: 'dot_burn'
      });
    }

    return updatedM;
  });

  // 勝利檢查 2
  if (currentMonsters.every(m => m.hp <= 0)) {
    logs.push({ text: `🎉 敵軍在劇毒與烈焰中全數倒下！戰鬥勝利（整備功能已解鎖）！`, type: 'sys' });
    const vicRes = resolveBattleVictory({
      player: currentPlayer,
      defeatedMonsters: currentMonsters,
      currentRoster,
      activeHeroInstanceIds,
      currentZoneIndex,
      activeTowerFloor,
      isFengShui,
      getHeroRowIdx
    });
    return { outcome: 'VICTORY', logs, ...vicRes };
  }

  // 4. 敵方怪群反擊階段
  const atkRes = executeMonsterAttacks({
    monsters: currentMonsters,
    player: currentPlayer,
    heroRoster: currentRoster,
    activeHeroInstanceIds,
    battleDownedHeroIds,
    combatBuffs: currentBuffs,
    heroBattleBuffs: currentHeroBuffs,
    playerTotalDef,
    playerRowBuff,
    rawFormBonus,
    formMultiplier,
    isFengShui,
    getHeroRowIdx
  });
  logs.push(...atkRes.logs);

  // 合併本回合怪物受擊紀錄
  Object.keys(atkRes.monsterHits || {}).forEach(mId => {
    const h = atkRes.monsterHits[mId];
    recordMonsterHit(mId, h.dmg, h.isCrit);
  });
  Object.keys(atkRes.allyHits || {}).forEach(aId => {
    const h = atkRes.allyHits[aId];
    if (!allyHits[aId]) allyHits[aId] = { dmg: 0, isCrit: false, heal: 0 };
    allyHits[aId].dmg += h.dmg;
    if (h.isCrit) allyHits[aId].isCrit = true;
  });

  if (atkRes.updatedPlayer.hp <= 0) {
    const defeatRes = resolveBattleDefeat({
      player: atkRes.updatedPlayer,
      finalRoster: atkRes.updatedRoster,
      casualtiesSummary: atkRes.casualtiesSummary
    });
    logs.push(defeatRes.defeatLog);
    return {
      outcome: 'DEFEAT',
      logs,
      updatedDownedIds: atkRes.updatedDownedIds,
      ...defeatRes
    };
  }

  // 勝利檢查 3
  if (atkRes.updatedMonsters.every(m => m.hp <= 0)) {
    logs.push({ text: `🎉 敵軍在反震護體下全數覆滅！戰鬥勝利（整備功能已解鎖）！`, type: 'sys' });
    const vicRes = resolveBattleVictory({
      player: atkRes.updatedPlayer,
      defeatedMonsters: atkRes.updatedMonsters,
      currentRoster: atkRes.updatedRoster,
      activeHeroInstanceIds,
      currentZoneIndex,
      activeTowerFloor,
      isFengShui,
      getHeroRowIdx
    });
    return {
      outcome: 'VICTORY',
      logs,
      updatedDownedIds: atkRes.updatedDownedIds,
      ...vicRes
    };
  }

  // 5. 回合末狀態遞減與藥師回藍
  const tickedMonsters = atkRes.updatedMonsters.map(m => {
    const nextElemShift = Math.max(0, (m.elemShiftTurns || 0) - 1);
    const nextPoison = Math.max(0, (m.poisonTurns || 0) - 1);
    return {
      ...m,
      armorBreakTurns: Math.max(0, (m.armorBreakTurns || 0) - 1),
      blindTurns: Math.max(0, (m.blindTurns || 0) - 1),
      elemShiftTurns: nextElemShift,
      element: nextElemShift === 0 ? (m.originalElement || m.element) : m.element,
      burnTurns: Math.max(0, (m.burnTurns || 0) - 1),
      poisonTurns: nextPoison,
      poisonStacks: nextPoison === 0 ? 0 : m.poisonStacks,
      vulnTurns: Math.max(0, (m.vulnTurns || 0) - 1)
    };
  });

  const tickedBuffs = {
    ...atkRes.updatedBuffs,
    tauntTurns: Math.max(0, (atkRes.updatedBuffs.tauntTurns || 0) - 1),
    reflectTurns: Math.max(0, (atkRes.updatedBuffs.reflectTurns || 0) - 1),
    baguaTurns: Math.max(0, (atkRes.updatedBuffs.baguaTurns || 0) - 1)
  };

  const tickedHeroBuffs = {};
  Object.keys(currentHeroBuffs).forEach(hId => {
    const nextTurns = Math.max(0, (currentHeroBuffs[hId]?.surgeTurns || 0) - 1);
    if (nextTurns > 0) {
      tickedHeroBuffs[hId] = { ...currentHeroBuffs[hId], surgeTurns: nextTurns };
    }
  });

  if (atkRes.updatedPlayer.job === '藥師') {
    const regenMp = 10 + (anyPoisonedAlive ? 8 : 0);
    atkRes.updatedPlayer.mp = Math.min(playerTotalMaxMp, atkRes.updatedPlayer.mp + regenMp);
  }

  return {
    outcome: 'CONTINUE',
    logs,
    tickedMonsters,
    updatedPlayer: atkRes.updatedPlayer,
    updatedRoster: atkRes.updatedRoster,
    updatedDownedIds: atkRes.updatedDownedIds,
    tickedBuffs,
    tickedHeroBuffs,
    lastRoundHits: {
      monsters: monsterHits,
      allies: allyHits
    }
  };
}
