import React from 'react';
import { ScrollText, Compass, HelpCircle } from 'lucide-react';
import { ELEMENTS, ZONES } from '../data/constants';
import { calculateHeroEffectiveStats } from '../utils/statCalculator';

export default function CombatTab({
  isInCombat,
  currentZoneIndex,
  handleSelectZone,
  spawnEncounter,
  setHelpModalTab,
  combatBuffs,
  classInfo,
  player,
  handleRestInn,
  monsters,
  selectedTargetIndex,
  setSelectedTargetIndex,
  activeHeroes,
  heroBattleBuffs,
  isFengShui,
  getHeroRowIdx,
  classSkills,
  handleExecuteRound,
  handleFleeCombat,
  combatLogs,
  chatEndRef
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-8 bg-slate-900/80 border border-slate-800/80 rounded-3xl p-5 sm:p-6 flex flex-col justify-between shadow-2xl backdrop-blur space-y-5">
        <div>
          <div className="flex flex-wrap justify-between items-center gap-2 mb-4 pb-3 border-b border-slate-800/60">
            <div className="flex gap-2 overflow-x-auto">
              {ZONES.map((zone, zIdx) => (
                <button
                  key={zone.id}
                  disabled={isInCombat}
                  onClick={() => handleSelectZone(zIdx)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    currentZoneIndex === zIdx ? 'bg-amber-600 text-white shadow' : 'bg-slate-950/60 text-slate-400 border border-slate-800'
                  }`}
                >
                  {zone.name}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setHelpModalTab('combat')}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl transition-colors"
                title="查看戰鬥與狀態說明"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
              <button
                disabled={isInCombat}
                onClick={() => spawnEncounter(currentZoneIndex)}
                className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
              >
                <Compass className="w-4 h-4" />
                <span>{isInCombat ? '交鋒進行中...' : '🔍 尋找怪群 (主動搜敵)'}</span>
              </button>
            </div>
          </div>

          {isInCombat && (combatBuffs?.tauntTurns > 0 || combatBuffs?.reflectTurns > 0 || combatBuffs?.baguaTurns > 0 || combatBuffs?.shield > 0) && (
            <div className="flex flex-wrap gap-1.5 mb-3 text-[11px] font-bold">
              {combatBuffs.shield > 0 && (
                <span className="bg-sky-950 text-sky-300 border border-sky-700 px-2.5 py-0.5 rounded-full">
                  🛡️ 護盾: {combatBuffs.shield}
                </span>
              )}
              {combatBuffs.tauntTurns > 0 && (
                <span className="bg-amber-950 text-amber-300 border border-amber-700 px-2.5 py-0.5 rounded-full">
                  📢 全場嘲諷 ({combatBuffs.tauntTurns}回合)
                </span>
              )}
              {combatBuffs.reflectTurns > 0 && (
                <span className="bg-rose-950 text-rose-300 border border-rose-700 px-2.5 py-0.5 rounded-full">
                  🔄 明王反震 {Math.round(combatBuffs.reflectPct * 100)}% ({combatBuffs.reflectTurns}回合)
                </span>
              )}
              {combatBuffs.baguaTurns > 0 && (
                <span className="bg-emerald-950 text-emerald-300 border border-emerald-700 px-2.5 py-0.5 rounded-full">
                  ☯️ 八卦結界 -{Math.round(combatBuffs.baguaReducePct * 100)}%傷 ({combatBuffs.baguaTurns}回合)
                </span>
              )}
            </div>
          )}

          {!isInCombat ? (
            <div className="bg-slate-950/70 border border-dashed border-slate-700/80 rounded-2xl p-8 text-center space-y-3">
              <div className="text-2xl">🏕️</div>
              <div className="text-sm font-bold text-amber-300">
                目前位於【{ZONES[currentZoneIndex].name}】安全營地
              </div>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                本命天賦：<span className="text-emerald-400 font-bold">{classInfo.passiveName}</span> {classInfo.passiveDesc}
              </p>
              {Object.values(player.skillLevels || {}).every(v => v === 0) && (
                <div className="text-xs text-amber-300 font-bold bg-amber-950/40 border border-amber-700/50 rounded-xl py-2 px-3 max-w-md mx-auto">
                  💡 提示：你目前擁有 {player.sp} 點 SP，可先點擊上方「✨ 技能樹」學習首招職業技能！
                </div>
              )}
              <div className="pt-2 flex justify-center gap-3">
                <button
                  onClick={handleRestInn}
                  className="px-4 py-2.5 bg-indigo-700 hover:bg-indigo-600 text-white rounded-xl font-bold text-xs shadow"
                >
                  ☕ 客棧休息恢復滿血
                </button>
                <button
                  onClick={() => spawnEncounter(currentZoneIndex)}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-slate-950 rounded-xl font-black text-xs shadow-lg"
                >
                  🔍 立即主動搜敵
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5 max-h-64 overflow-y-auto p-1">
              {monsters.map((m, idx) => {
                const isDead = m.hp <= 0;
                const isSelected = selectedTargetIndex === idx && !isDead;
                const elemInfo = ELEMENTS[m.element];
                return (
                  <div
                    key={m.id}
                    onClick={() => !isDead && setSelectedTargetIndex(idx)}
                    className={`p-3 rounded-2xl border text-center cursor-pointer transition-all shadow-md space-y-1 ${
                      isDead ? 'opacity-30 bg-slate-950 border-slate-800' : isSelected ? 'border-amber-400 bg-amber-950/40 ring-2 ring-amber-400/60 scale-105' : 'border-slate-800/80 bg-slate-950/60 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold truncate text-slate-200">{m.name}</div>
                    <div className={`text-[10px] ${elemInfo?.color.split(' ')[0]} font-bold`}>
                      {elemInfo?.icon} {m.element} {m.elemShiftTurns > 0 ? `(轉${m.elemShiftTurns})` : ''}
                    </div>
                    <div className="text-[10px] text-rose-400 font-mono">HP {m.hp}</div>
                    {!isDead && (
                      <div className="flex flex-wrap justify-center gap-1 pt-0.5 text-[9px] font-bold">
                        {m.poisonTurns > 0 && (
                          <span className="bg-emerald-950 text-emerald-300 px-1 rounded border border-emerald-700">
                            ☠️毒{m.poisonStacks}({m.poisonTurns})
                          </span>
                        )}
                        {m.armorBreakTurns > 0 && (
                          <span className="bg-amber-950 text-amber-300 px-1 rounded border border-amber-700">
                            💔破甲({m.armorBreakTurns})
                          </span>
                        )}
                        {m.blindTurns > 0 && (
                          <span className="bg-purple-950 text-purple-300 px-1 rounded border border-purple-700">
                            🕸️盲({m.blindTurns})
                          </span>
                        )}
                        {m.vulnTurns > 0 && (
                          <span className="bg-rose-950 text-rose-300 px-1 rounded border border-rose-700">
                            🎯易傷({m.vulnTurns})
                          </span>
                        )}
                        {m.burnTurns > 0 && (
                          <span className="bg-orange-950 text-orange-300 px-1 rounded border border-orange-700">
                            🔥灼({m.burnTurns})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3.5 space-y-2.5
