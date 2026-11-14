import React from 'react';
import { ELEMENTS } from '../../data/constants';
import { calculateHeroEffectiveStats } from '../statCalculator';
import { getMonsterSpeed } from './combatFormulas';

/**
 * 計算全場存活單位的本回合行動序列（依實際速度由高到低排序）
 * 畫面預覽列與回合結算 engine 共用此函式，確保順序完全一致
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
  const queue = [];
  const windSpeedAdd = (combatBuffs?.windBuffTurns || 0) > 0 ? (combatBuffs.windSpeedBonus || 0) : 0;

  // 1. 少俠（主角）
  if (player && player.hp > 0) {
    queue.push({
      uid: 'PLAYER',
      side: 'player',
      type: 'PLAYER',
      name: player.name || '少俠',
      icon: '🧑',
      element: player.element || '火',
      speed: Math.max(1, Math.floor(playerTotalSpeed + windSpeedAdd)),
      isCharging: false
    });
  }

  // 2. 出戰存活名將
  heroRoster.forEach(h => {
    if (!activeHeroInstanceIds.includes(h.instanceId) || h.hp <= 0) return;
    const hRow = getHeroRowIdx(h.instanceId);
    const { effectiveSpeed } = calculateHeroEffectiveStats(
      h,
      isFengShui,
      heroBattleBuffs[h.instanceId],
      hRow
    );
    queue.push({
      uid: h.instanceId,
      side: 'hero',
      type: 'HERO',
      heroId: h.instanceId,
      name: h.name,
      icon: h.icon || '⚔️',
      element: h.element || '金',
      speed: Math.max(1, Math.floor(effectiveSpeed + windSpeedAdd)),
      isCharging: false
    });
  });

  // 3. 存活敵怪
  monsters.forEach(m => {
    if (!m || m.hp <= 0) return;
    const mSpeed = getMonsterSpeed(m);
    queue.push({
      uid: m.id,
      side: 'monster',
      type: 'MONSTER',
      monsterId: m.id,
      name: m.name,
      icon: m.isBoss ? '👑' : m.isElite ? '🔥' : '👹',
      element: m.element || '土',
      speed: Math.max(1, Math.floor(mSpeed)),
      isBoss: Boolean(m.isBoss),
      isCharging: Boolean(m.chargingSkill)
    });
  });

  // 同速優先級：少俠(0) > 我方名將(1) > 怪物(2)
  const typePriority = { PLAYER: 0, HERO: 1, MONSTER: 2 };

  queue.sort((a, b) => {
    if (b.speed !== a.speed) return b.speed - a.speed;
    return (typePriority[a.type] ?? 9) - (typePriority[b.type] ?? 9);
  });

  return queue;
}

/**
 * 戰鬥畫面上方「本回合行動序預覽列」UI 元件
 */
export default function TurnOrderBar({ turnOrderQueue = [], turnCount = 1 }) {
  if (!Array.isArray(turnOrderQueue) || turnOrderQueue.length === 0) return null;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 space-y-2">
      <div className="flex items-center justify-between text-[11px]">
        <span className="font-extrabold text-cyan-300 flex items-center gap-1.5">
          <span>⚡ 第 {turnCount} 回合・速度行動序（快 → 慢）</span>
        </span>
        <span className="text-slate-400">同速時我方優先出手</span>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {turnOrderQueue.map((unit, idx) => {
          const isPlayer = unit.side === 'player';
          const isHero = unit.side === 'hero';
          const isMonster = unit.side === 'monster';

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
                title={`${unit.name}（速度 ${unit.speed}）`}
              >
                <span className="text-[10px] font-mono font-black px-1 rounded bg-slate-950/80 text-slate-300">
                  #{idx + 1}
                </span>
                <span>{unit.icon}</span>
                <span className="font-bold max-w-[84px] truncate">{unit.name}</span>
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
