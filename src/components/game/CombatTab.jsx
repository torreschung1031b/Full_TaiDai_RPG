import React, { useState, useMemo } from 'react';
import { Castle, LogOut, Search, Zap, Bot, FastForward } from 'lucide-react';
import { ZONES, ELEMENTS } from '../../data/constants';
import { FORMATIONS_CONFIG } from '../../data/formations';
import { calculateHeroEffectiveStats } from '../../utils/statCalculator';
import { getSkillMeta, getZoneSweepReqLevel, getMonsterSpeed, getSpeedAdvantage } from '../../utils/combatEngine';

const MONSTER_DEBUFFS = [
  { key: 'armorBreakTurns', label: '破甲', cls: 'bg-amber-950 text-amber-300 border-amber-700' },
  { key: 'weakenTurns', label: '虛弱', cls: 'bg-indigo-950 text-indigo-300 border-indigo-700' },
  { key: 'burnTurns', label: '灼燒', cls: 'bg-orange-950 text-orange-300 border-orange-700' },
  { key: 'bleedTurns', label: '流血', cls: 'bg-rose-950 text-rose-300 border-rose-700' },
  { key: 'blindTurns', label: '致盲', cls: 'bg-purple-950 text-purple-300 border-purple-700' },
  { key: 'vulnTurns', label: '易傷', cls: 'bg-cyan-950 text-cyan-300 border-cyan-700' }
];

const SPEED_BTN_STYLES = {
  3: 'bg-amber-500/25 border-amber-400 text-amber-300',
  2: 'bg-emerald-500/20 border-emerald-400 text-emerald-300',
  1: 'bg-slate-950 border-slate-700 text-slate-300 hover:border-slate-500'
};

export function CombatTab({
  player,
  isInCombat,
  isFengShui,
  isWarlock,
  activeTowerFloor,
  currentZoneIndex,
  handleSelectZone,
  spawnEncounter,
  handleSweepZone,
  autoBattle,
  handleToggleAutoBattle,
  autoTower,
  handleToggleAutoTower,
  battleSpeed,
  handleCycleBattleSpeed,
  handleRestInn,
  handleFleeCombat,
  monsters,
  selectedTargetIndex,
  setSelectedTargetIndex,
  lastRoundHits,
  turnCount,
  playerTotalMaxHp,
  playerTotalAtk,
  playerTotalDef,
  playerTotalSpeed,
  currentFormation,
  formationSlots,
  handleSwapFormationSlots,
  heroRoster,
  heroBattleBuffs,
  combatBuffs,
  combatPhase,
  currentClassSkills,
  handleExecuteRound,
  combatLogs,
  chatEndRef
}) {
  const [selectedSlotForSwap, setSelectedSlotForSwap] = useState(null);
  const [logFilter, setLogFilter] = useState('all');

  const sweepReqLevel = getZoneSweepReqLevel(currentZoneIndex);
  const isSweepLevelUnlocked = (player.level || 1) >= sweepReqLevel;
  const isSweepHpReady = (player.hp || 0) > 1;
  const canSweepCurrentZone = isSweepLevelUnlocked && isSweepHpReady;
  const activeFormationMeta = FORMATIONS_CONFIG[currentFormation] || FORMATIONS_CONFIG['none'];

  const filteredCombatLogs = useMemo(() => {
    if (logFilter === 'all') return combatLogs;
    if (logFilter === 'combat') {
      return combatLogs.filter(
        l => l.dmgRole || l.text?.includes('暴擊') || l.text?.includes('連攜') || l.text?.includes('剋制')
      );
    }
    return combatLogs.filter(l => l.type === 'sys' || l.type === 'danger');
  }, [combatLogs, logFilter]);

  const handleSlotClick = (slotIdx) => {
    if (isInCombat) return;
    if (!Object.prototype.hasOwnProperty.call(formationSlots || {}, slotIdx)) return;

    if (selectedSlotForSwap === null) {
      setSelectedSlotForSwap(slotIdx);
    } else if (selectedSlotForSwap === slotIdx) {
      setSelectedSlotForSwap(null);
    } else {
      handleSwapFormationSlots(selectedSlotForSwap, slotIdx);
      setSelectedSlotForSwap(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      <div className="lg:col-span-7 space-y-4">
        {/* 區域選擇與戰場控制欄 */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-extrabold text-amber-400">
              {activeTowerFloor ? `🗼 鎮魔塔第 ${activeTowerFloor} 層戰場` : `🗺️ 歷練區域：${ZONES[currentZoneIndex]?.name}`}
            </span>
            <div className="flex gap-1.5 flex-wrap">
              {ZONES.map((z, idx) => (
                <button
                  key={z.name}
                  disabled={isInCombat}
                  onClick={() => handleSelectZone(idx)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all disabled:opacity-40 ${
                    !activeTowerFloor && currentZoneIndex === idx
                      ? 'bg-amber-600 border-amber-400 text-slate-950 font-black'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  {z.name}
                </button>
              ))}
            </div>
          </div>

          {!isInCombat ? (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => spawnEncounter(currentZoneIndex)}
                className="flex-1 min-w-[150px] py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-lg transition-all"
              >
                <Search className="w-4 h-4" />
                <span>🔍 尋找怪群</span>
              </button>

              <button
                disabled={!canSweepCurrentZone}
                onClick={() => handleSweepZone(3)}
                className="py-3 px-3.5 rounded-2xl bg-gradient-to-r from-purple-700 to-indigo-600 hover:from-purple-600 hover:to-indigo-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-black text-xs flex items-center justify-center gap-1.5 shadow transition-all"
              >
                <Zap className="w-4 h-4" />
                <span>
                  {!isSweepLevelUnlocked ? `🔒 掃蕩 (Lv.${sweepReqLevel})` : !isSweepHpReady ? '⚠️ 氣血過低' : '⚡ 快速掃蕩 ×3'}
                </span>
              </button>

              <button
                onClick={handleToggleAutoBattle}
                className={`py-3 px-3.5 rounded-2xl font-black text-xs flex items-center justify-center gap-1.5 border transition-all ${
                  autoBattle ? 'bg-cyan-600 border-cyan-300 text-slate-950 shadow-lg shadow-cyan-500/20' : 'bg-slate-950 border-slate-700 text-slate-300 hover:border-cyan-500'
                }`}
              >
                <Bot className="w-4 h-4" />
                <span>{autoBattle ? '🤖 自動戰鬥：開' : '🤖 自動戰鬥：關'}</span>
              </button>

              {handleCycleBattleSpeed && (
                <button
                  type="button"
                  onClick={handleCycleBattleSpeed}
                  className={`py-3 px-3 rounded-2xl font-mono font-black text-xs flex items-center gap-1 border transition-all ${SPEED_BTN_STYLES[battleSpeed] || SPEED_BTN_STYLES[1]}`}
                >
                  <FastForward className="w-3.5 h-3.5" />
                  <span>{battleSpeed}x</span>
                </button>
              )}

              <button onClick={handleRestInn} className="py-3 px-3.5 rounded-2xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs shadow transition-all">
                🏨 客棧回滿
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-950/90 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs">
              <span className="text-slate-300">護盾：<strong className="text-cyan-300">{combatBuffs.shield || 0}</strong> • 速度先手制</span>
              <div className="flex items-center gap-2 flex-wrap">
                {handleCycleBattleSpeed && (
                  <button
                    type="button"
                    onClick={handleCycleBattleSpeed}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-mono font-black border transition-all ${SPEED_BTN_STYLES[battleSpeed] || SPEED_BTN_STYLES[1]}`}
                  >
                    <FastForward className="w-3.5 h-3.5" />
                    <span>{battleSpeed}x</span>
                  </button>
                )}

                {activeTowerFloor && (
                  <button
                    onClick={handleToggleAutoTower}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-black border transition-all ${
                      autoTower ? 'bg-amber-500 border-amber-300 text-slate-950' : 'bg-slate-900 border-slate-700 text-amber-300 hover:border-amber-500'
                    }`}
                  >
                    <Castle className="w-3.5 h-3.5" />
                    <span>{autoTower ? '🗼 自動爬塔：開' : '🗼 自動爬塔：關'}</span>
                  </button>
                )}

                <button
                  onClick={handleToggleAutoBattle}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-black border transition-all ${
                    autoBattle ? 'bg-cyan-500 border-cyan-300 text-slate-950 animate-pulse' : 'bg-slate-900 border-slate-700 text-cyan-300 hover:border-cyan-500'
                  }`}
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span>{autoBattle ? '🤖 自動託管中 (點擊接管)' : '🤖 開啟自動戰鬥'}</span>
                </button>

                <button onClick={handleFleeCombat} className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-900/80 hover:bg-rose-800 text-rose-200 font-bold border border-rose-700 transition-all">
                  <LogOut className="w-3.5 h-3.5" />
                  <span>撤退 (65%)</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 敵方怪群區 */}
        {isInCombat && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-extrabold text-rose-400">👹 敵方陣容（點擊鎖定主目標）</span>
              <span className="text-[11px] text-slate-400">
                少俠五行：<strong className="text-amber-300">{ELEMENTS[player.element]?.icon}{player.element}</strong>（剋 {ELEMENTS[player.element]?.counters}）
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {monsters.map((m, idx) => {
                const dead = m.hp <= 0;
                const isTarget = selectedTargetIndex === idx && !dead;
                const hpPct = Math.max(0, Math.min(100, Math.round((m.hp / Math.max(1, m.maxHp)) * 100)));
                const hitInfo = lastRoundHits?.monsters?.[m.id];
                const mSpeed = getMonsterSpeed(m);
                const { doubleStrikeRate } = getSpeedAdvantage(playerTotalSpeed, mSpeed);
                const isCounteredByPlayer = ELEMENTS[player.element]?.counters === m.element;
                const countersPlayer = ELEMENTS[m.element]?.counters === player.element;

                return (
                  <div
                    key={m.id}
                    onClick={() => !dead && setSelectedTargetIndex(idx)}
                    className={`p-3 rounded-2xl border transition-all relative overflow-visible ${
                      dead ? 'bg-slate-950/40 border-slate-900 opacity-40' : isTarget ? 'bg-rose-950/30 border-amber-400 ring-1 ring-amber-400 cursor-pointer' : 'bg-slate-950 border-slate-800 hover:border-slate-600 cursor-pointer'
                    }`}
                  >
                    {hitInfo?.dmg > 0 && (
                      <div
                        key={`${m.id}_t${turnCount}_${hitInfo.dmg}`}
                        className={`pointer-events-none absolute -top-3 right-3 z-20 px-2 py-0.5 rounded-lg font-mono font-black shadow-lg animate-float-dmg ${
                          hitInfo.isCrit ? 'text-sm bg-amber-500 text-slate-950 border border-amber-200' : 'text-xs bg-cyan-950/95 text-cyan-200 border border-cyan-500'
                        }`}
                      >
                        {hitInfo.isCrit ? `💥 暴擊 -${hitInfo.dmg}!` : `-${hitInfo.dmg}`}
                      </div>
                    )}

                    <div className="flex justify-between items-center gap-1.5 text-xs font-bold">
                      <span className="text-slate-100 truncate">{isTarget ? '🎯 ' : ''}{m.name}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        {!dead && isCounteredByPlayer && (
                          <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-600 px-1.5 py-0.2 rounded font-black">
                            🔥 剋制 ({isWarlock ? '1.45x' : '1.3x'})
                          </span>
                        )}
                        {!dead && countersPlayer && (
                          <span className="text-[10px] bg-rose-950 text-rose-300 border border-rose-700 px-1.5 py-0.2 rounded font-bold">
                            ⚠️ 被剋 (0.75x)
                          </span>
                        )}
                        <span className="text-[11px] font-mono text-amber-300">{ELEMENTS[m.element]?.icon}{m.element}</span>
                      </div>
                    </div>

                    <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden mt-2 border border-slate-800">
                      <div className="bg-rose-500 h-full transition-all" style={{ width: `${hpPct}%` }} />
                    </div>

                    <div className="flex justify-between items-center text-[11px] font-mono text-slate-400 mt-1">
                      <span>HP {m.hp}/{m.maxHp}</span>
                      <span>攻 {m.atk} / 防 {m.def} / 速 <strong className={playerTotalSpeed > mSpeed ? 'text-emerald-300' : 'text-slate-300'}>{mSpeed}</strong></span>
                    </div>

                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {!dead && doubleStrikeRate > 0 && (
                        <span className="text-[10px] bg-cyan-950/70 text-cyan-300 border border-cyan-800 px-1.5 rounded font-mono">
                          ⚡ 連擊 +{Math.round(doubleStrikeRate * 100)}%
                        </span>
                      )}
                      {m.poisonTurns > 0 && (
                        <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-700 px-1.5 rounded">
                          劇毒×{m.poisonStacks || 1} ({m.poisonTurns}T)
                        </span>
                      )}
                      {MONSTER_DEBUFFS.map(d => m[d.key] > 0 && (
                        <span key={d.key} className={`text-[10px] border px-1.5 rounded ${d.cls}`}>{d.label} {m[d.key]}T</span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 我方九宮陣法與排位狀態 */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 space-y-2.5">
          <div className="flex flex-wrap justify-between items-center gap-1.5 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-extrabold text-emerald-400">🛡️ 我方戰術站位</span>
              <span className="text-[11px] bg-slate-950 border border-slate-700 text-amber-300 px-2 py-0.5 rounded-full font-bold">
                {activeFormationMeta.icon} {activeFormationMeta.name}（5 陣眼）
              </span>
            </div>
            {!isInCombat && (
              <span className="text-[11px] text-slate-400">
                {selectedSlotForSwap !== null ? '✨ 請點擊另一處亮起陣眼互換位置' : '點擊亮起陣眼可互換角色站位'}
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2].map(rowIdx => {
              const rowNames = ['🛡️ 前排 (60%受擊)', '⚡ 中排 (25%受擊)', '✨ 後排 (15%受擊)'];
              return (
                <div key={rowIdx} className="space-y-1.5">
                  <div className="text-[10px] text-center font-bold text-slate-400 bg-slate-950 py-1 rounded-lg border border-slate-800">{rowNames[rowIdx]}</div>
                  {[0, 1, 2].map(colIdx => {
                    const slotIdx = rowIdx * 3 + colIdx;
                    const isAvailableSlot = Object.prototype.hasOwnProperty.call(formationSlots || {}, slotIdx);
                    const occupant = isAvailableSlot ? formationSlots[slotIdx] : undefined;
                    const isSelectedSwap = selectedSlotForSwap === slotIdx;

                    if (!isAvailableSlot) {
                      return (
                        <div key={slotIdx} className="p-2 rounded-xl border border-dashed border-slate-800/40 bg-slate-950/25 text-[10px] text-center h-[54px] flex flex-col items-center justify-center text-slate-600/80 select-none cursor-not-allowed">
                          <span>🚫 非陣眼位</span>
                        </div>
                      );
                    }

                    if (occupant === 'PLAYER') {
                      const allyHit = lastRoundHits?.allies?.PLAYER;
                      return (
                        <div
                          key={slotIdx}
                          onClick={() => handleSlotClick(slotIdx)}
                          className={`relative p-2 rounded-xl border text-xs h-[54px] flex flex-col justify-center transition-all ${!isInCombat ? 'cursor-pointer hover:border-amber-400' : ''} ${isSelectedSwap ? 'bg-amber-900/50 border-amber-300 ring-1 ring-amber-300' : 'bg-amber-950/30 border-amber-500/60'}`}
                        >
                          {allyHit?.dmg > 0 && (
                            <span key={`player_t${turnCount}_${allyHit.dmg}`} className="pointer-events-none absolute -top-2.5 right-1.5 z-20 px-1.5 py-0.2 rounded bg-rose-600 text-white font-mono font-black text-[10px] shadow animate-float-dmg">
                              -{allyHit.dmg}
                            </span>
                          )}
                          <div className="font-black text-amber-300 truncate">👑 {player.name}</div>
                          <div className="flex items-center justify-between text-[10px] font-mono text-rose-300">
                            <span>HP {player.hp}/{playerTotalMaxHp}</span>
                          </div>
                        </div>
                      );
                    }

                    const hero = occupant ? heroRoster.find(h => h.instanceId === occupant) : null;
                    if (hero) {
                      const { effectiveMaxHp } = calculateHeroEffectiveStats(hero, isFengShui, heroBattleBuffs[hero.instanceId], rowIdx);
                      const allyHit = lastRoundHits?.allies?.[hero.instanceId];
                      return (
                        <div
                          key={slotIdx}
                          onClick={() => handleSlotClick(slotIdx)}
                          className={`relative p-2 rounded-xl border text-xs h-[54px] flex flex-col justify-center transition-all ${!isInCombat ? 'cursor-pointer hover:border-emerald-400' : ''} ${isSelectedSwap ? 'bg-amber-900/50 border-amber-300 ring-1 ring-amber-300' : hero.hp <= 0 ? 'bg-slate-950/50 border-rose-900/60 opacity-50' : 'bg-slate-950 border-slate-700'}`}
                        >
                          {allyHit?.dmg > 0 && (
                            <span key={`${hero.instanceId}_t${turnCount}_${allyHit.dmg}`} className="pointer-events-none absolute -top-2.5 right-1.5 z-20 px-1.5 py-0.2 rounded bg-rose-600 text-white font-mono font-black text-[10px] shadow animate-float-dmg">
                              -{allyHit.dmg}
                            </span>
                          )}
                          <div className="font-bold text-emerald-300 truncate">{hero.name} {hero.fusionLevel > 0 ? `★+${hero.fusionLevel}` : ''}</div>
                          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                            <span>HP {hero.hp}/{effectiveMaxHp}</span>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={slotIdx}
                        onClick={() => handleSlotClick(slotIdx)}
                        className={`p-2 rounded-xl border border-dashed text-[10px] text-center h-[54px] flex flex-col items-center justify-center transition-all ${!isInCombat ? 'cursor-pointer hover:border-emerald-400/70 hover:text-emerald-300' : ''} ${isSelectedSwap ? 'border-amber-400 bg-amber-950/30 text-amber-300 ring-1 ring-amber-400' : 'border-emerald-800/60 bg-emerald-950/10 text-emerald-400/80'}`}
                      >
                        <span>✨ 可駐守空位</span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* 戰鬥指令操作欄 */}
        {isInCombat && (
          <div className="bg-slate-900/90 border border-amber-500/40 rounded-3xl p-4 space-y-2.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-extrabold text-amber-300">⚔️ 選擇本回合行動指令</span>
              {autoBattle && <span className="text-[11px] font-bold text-cyan-300">🤖 自動戰鬥運作中（{battleSpeed}x 速 • 點上方按鈕可隨時接管）</span>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {currentClassSkills.map((sk, idx) => {
                const skLvl = player.skillLevels?.[idx] || 0;
                const { unlockLevel, reqPrevSkillLevel } = getSkillMeta(sk, idx);
                const prevLvl = idx > 0 ? (player.skillLevels?.[idx - 1] || 0) : 99;
                const cdLeft = combatBuffs.skillCooldowns?.[idx] || 0;
                const lockedByLvl = player.level < unlockLevel;
                const lockedByPrev = idx > 0 && reqPrevSkillLevel > 0 && prevLvl < reqPrevSkillLevel;
                const notLearned = skLvl <= 0;
                const onCd = cdLeft > 0;
                const costLabel = sk.cost === 0 ? '無消耗' : sk.costType === 'rage' ? `${sk.cost}怒` : sk.costType === 'ammo' ? `${sk.cost}彈` : `${sk.cost}MP`;

                return (
                  <button
                    key={sk.id}
                    disabled={combatPhase !== 'PLAYER_SELECT' || lockedByLvl || lockedByPrev || notLearned || onCd}
                    onClick={() => handleExecuteRound({ type: 'skill', skill: sk, skillIdx: idx })}
                    className={`p-3 rounded-2xl border text-left transition-all disabled:bg-slate-950 disabled:border-slate-800 disabled:opacity-45 ${
                      idx === 0 ? 'bg-slate-800/90 hover:bg-slate-700 border-slate-600' : 'bg-amber-950/40 hover:bg-amber-900/50 border-amber-600/60'
                    }`}
                  >
                    <div className="flex justify-between items-center text-xs font-extrabold text-amber-300">
                      <span>{sk.icon || '✨'} {sk.name} {skLvl > 0 ? `(Lv.${skLvl})` : ''}</span>
                      <span className="font-mono text-[11px] text-cyan-300">
                        {lockedByLvl ? `🔒 Lv.${unlockLevel}解鎖` : lockedByPrev ? `🔒 需前置Lv.${reqPrevSkillLevel}` : notLearned ? '未領悟' : onCd ? `⏳ CD ${cdLeft}T` : costLabel}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-300 mt-0.5 line-clamp-1">{sk.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 右側即時戰報日誌 */}
      <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-3xl p-4 flex flex-col h-[560px]">
        <div className="border-b border-slate-800 pb-2.5 mb-2.5 space-y-2">
          <div className="text-xs font-extrabold text-amber-400 flex justify-between items-center">
            <span>📜 即時江湖戰報</span>
            <span className="text-[11px] font-mono text-slate-400">總攻 {playerTotalAtk} • 總防 {playerTotalDef} • 速 {playerTotalSpeed}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px]">
            {[
              { id: 'all', label: `全部 (${combatLogs.length})` },
              { id: 'combat', label: '💥 傷害暴擊' },
              { id: 'sys', label: '🎁 系統與掉落' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setLogFilter(tab.id)}
                className={`px-2.5 py-0.5 rounded-full font-bold border transition-all ${
                  logFilter === tab.id ? 'bg-amber-500 text-slate-950 border-amber-300' : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 text-xs leading-relaxed">
          {filteredCombatLogs.map(log => {
            let style = 'text-slate-300 bg-slate-950/60 border-slate-800/70';
            let badge = null;

            if (log.dmgRole === 'player_crit') {
              style = 'text-amber-200 bg-amber-500/20 border-amber-400 font-bold';
              badge = '💥 暴擊';
            } else if (log.dmgRole === 'player_normal') {
              style = 'text-cyan-200 bg-cyan-950/50 border-cyan-800/70';
            } else if (log.dmgRole === 'monster_crit') {
              style = 'text-rose-100 bg-rose-600/35 border-rose-400 font-bold';
              badge = '⚠️ 敵暴擊';
            } else if (log.dmgRole === 'monster_normal') {
              style = 'text-rose-300 bg-rose-950/40 border-rose-900/70';
            } else if (log.dmgRole === 'heal' || log.dmgRole === 'shield') {
              style = 'text-emerald-200 bg-emerald-950/50 border-emerald-700/70';
              badge = '💚 護療';
            } else if (log.type === 'danger') {
              style = 'text-rose-300 bg-rose-950/60 border-rose-700 font-bold';
            } else if (log.type === 'sys') {
              style = 'text-amber-300/90 bg-slate-950/90 border-slate-800';
            }

            if (!badge && log.text?.includes('無雙連攜')) badge = '🔥 無雙連攜';
            else if (!badge && log.text?.includes('狀態共鳴')) badge = '✨ 共鳴';
            else if (!badge && log.text?.includes('五行剋制')) badge = '☯️ 剋制';

            return (
              <div key={log.id} className={`px-3 py-1.5 rounded-xl border ${style}`}>
                <span className="text-[10px] font-mono text-slate-500 mr-1.5">[T{log.turn}]</span>
                {badge && (
                  <span className="inline-block text-[10px] font-black px-1.5 py-0.2 mr-1.5 rounded bg-slate-950/80 border border-current">{badge}</span>
                )}
                <span>{log.text}</span>
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>
      </div>
    </div>
  );
}
