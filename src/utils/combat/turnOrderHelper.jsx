import React from 'react';
import { ELEMENTS } from '../../data/constants';
import { calculateHeroEffectiveStats } from '../statCalculator';
import { getMonsterSpeed } from './combatFormulas';

/**
 * 統一計算本回合全場存活單位的「速度先手行動序列」
 * 供 CombatTab 預覽列與 combatRoundResolver 結算共用，確保順序 100% 一致
 */
export function buildTurnOrderQueue({
  player,
  playerTotalSpeed = 12,
  heroRoster = [],
  activeHeroInstanceIds = [],
  monsters = [],
  combatBuffs = {},
  heroBattleBuffs = {},
  isFengShui = false,
  getHeroRowIdx = () => 1
}) {
  const windSpeedAdd = (combatBuffs?.windBuffTurns || 0) > 0 ? (combatBuffs.windSpeedBonus || 0) : 0;
  const turnQueue = [];

  if (player && player.hp > 0) {
    turnQueue.push({
      uid: 'PLAYER',
      type: 'PLAYER',
      label: player.name || '少俠',
      icon: '🧑',
      element: player.element || '火',
      speed: Math.max(1, Math.floor(playerTotalSpeed + windSpeedAdd)),
      priority: 3,
      isCharging: false
    });
  }

  heroRoster.forEach(h => {
    if (activeHeroInstanceIds.includes(h.instanceId) && h.hp > 0) {
      const hRow = getHeroRowIdx(h.instanceId);
      const { effectiveSpeed } = calculateHeroEffectiveStats(
        h,
        isFengShui,
        heroBattleBuffs[h.instanceId],
        hRow
      );
      turnQueue.push({
        uid: h.instanceId,
        type: 'HERO',
        instanceId: h.instanceId,
        label: h.name,
        icon: h.icon || '⚔️',
        element: h.element || '金',
        speed: Math.max(1, Math.floor(effectiveSpeed + windSpeedAdd)),
        priority: 2,
        isCharging: false
      });
    }
  });

  monsters.forEach(m => {
    if (m && m.hp > 0) {
      turnQueue.push({
        uid: m.id,
        type: 'MONSTER',
        monsterId: m.id,
        label: m.name,
        icon: m.isBoss ? '👑' : m.isElite ? '🔥' : '👹',
        element: m.element || '土',
        speed: Math.max(1, Math.floor(getMonsterSpeed(m))),
        priority: 1,
        isCharging: Boolean(m.chargingSkill)
      });
    }
  });

  turnQueue.sort((a, b) => (b.speed - a.speed) || (b.priority - a.priority));
  return turnQueue;
}

/**
 * 戰鬥畫面上方「本回合行動序預覽列」
 */
export default function TurnOrderBar({ turnOrderQueue = [], turnCount = 1 }) {
  if (!Array.isArray(turnOrderQueue) || turnOrderQueue.length === 0) return null;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 space-y-2">
      <div className="flex items-center justify-between text-[11px]">
        <span className="font-extrabold text-cyan-300 flex items-center gap-1.5">
          <span>⚡ 第 {turnCount} 回合・速度行動序（快 → 慢）</span>
        </span>
        <span className="text-slate-400">同速時少俠 › 名將 › 敵怪</span>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {turnOrderQueue.map((unit, idx) => {
          const isPlayer = unit.type === 'PLAYER';
          const isHero = unit.type === 'HERO';
          const isMonster = unit.type === 'MONSTER';

          const cardStyle = isPlayer
            ? 'bg-amber-950/60 border-amber-400/80 text-amber-200'
            : isHero
              ? 'bg-cyan-950/50 border-cyan-500/70 text-cyan-200'
              : unit.isCharging
                ? 'bg-rose-950/80 border-rose-400 text-rose-200 ring-1 ring-rose-500/70'
                : 'bg-rose-950/35 border-rose-800/70 text-rose-300';

          return (
            <React.Fragment key={unit.uid}>
              <div
                className={`shrink-0 px-2.5 py-1.5 rounded-xl border text-xs flex items-center gap-1.5 transition-all ${cardStyle}`}
                title={`${unit.label}（速度 ${unit.speed}）`}
              >
                <span className="text-[10px] font-mono font-black px-1 rounded bg-slate-950/80 text-slate-300">
                  #{idx + 1}
                </span>
                <span>{unit.icon}</span>
                <span className="font-bold max-w-[84px] truncate">{unit.label}</span>
                <span className="text-[10px] font-mono opacity-80">
                  {ELEMENTS[unit.element]?.icon || ''} 速{unit.speed}
                </span>
                {isMonster && unit.isCharging && (
                  <span className="text-[9px] bg-rose-600 text-white px-1 rounded font-black animate-pulse">
                    蓄力
                  </span>
                )}
              </div>

              {idx < turnOrderQueue.length - 1 && (
                <span className="text-slate-600 text-xs font-bold shrink-0">›</span>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
