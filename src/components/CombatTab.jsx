import React from 'react';
import { ScrollText, Compass, HelpCircle } from 'lucide-react';
import { ELEMENTS, ZONES } from '../data/constants';
import { calculateHeroEffectiveStats, getElementMultiplier } from '../utils/statCalculator';

const ROW_LABELS = ['🛡️前排', '⚡中排', '✨後排'];

export default function CombatTab({
  isInCombat,
  currentZoneIndex,
  handleSelectZone,
  spawnEncounter,
  setHelpModalTab,
  combatBuffs,
  classInfo,
  player,
  playerTotalMaxHp,
  playerTotalMaxMp,
  playerTotalAtk,
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
  const playerRowIdx = getHeroRowIdx('PLAYER');
  const playerRowLabel = ROW_LABELS[playerRowIdx] || '⚡中排';
  const playerHpPct = Math.max(0, Math.min(100, (player.hp / (playerTotalMaxHp || 1)) * 100));
  const playerElem = ELEMENTS[player.element];

  const getLogStyle = (log) => {
    const txt = log.text || '';
    if (log.type === 'danger' || /戰敗|陣亡|重傷|氣血耗盡/.test(txt)) {
      return 'text-rose-400 font-bold';
    }
    if (/暴擊|全軍合擊|奧義|大捷|升級/.test(txt)) {
      return 'text-amber-300 font-bold';
    }
    if (/恢復|治療|回血|護盾|藥力/.test(txt)) {
      return 'text-emerald-300';
    }
    if (/獲得|掉落|招募|技能卡/.test(txt)) {
      return 'text-purple-300 font-semibold';
    }
    return 'text-slate-300';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-8 bg-slate-900/80 border border-slate-800/80 rounded-3xl p-5 sm:p-6 flex flex-col justify-between shadow-2xl backdrop-blur space-y-5">
        <div>
          {/* 區域切換與主動搜敵列 */}
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

          {/* 我方全局戰鬥增益條 */}
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

          {/* 營地畫面 / 敵方怪群列表 */}
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
                const elemMult = getElementMultiplier ? getElementMultiplier(player.element, m.element) : 1;

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
                    {!isDead && elemMult !== 1 && (
                      <div>
                        <span
                          className={`inline-block text-[9px] px-1.5 py-0.2 rounded font-bold border ${
                            elemMult > 1
                              ? 'bg-emerald-950/90 text-emerald-300 border-emerald-700/70'
                              : 'bg-rose-950/90 text-rose-300 border-rose-700/70'
                          }`}
                        >
                          {elemMult > 1 ? `⚔️ 克制 ${elemMult}x` : `🛡️ 被剋 ${elemMult}x`}
                        </span>
                      </div>
                    )}
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

        {/* 我方 5 人出戰陣容（主角 + 最多 4 位英雄） */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3.5 space-y-2.5">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-emerald-400">
              🛡️ 我方出戰陣容（👑 主角 ＋ {activeHeroes.length}/4 位英雄）
            </span>
            <button
              disabled={isInCombat}
              onClick={handleRestInn}
              className="px-2.5 py-1 bg-indigo-900/60 hover:bg-indigo-800 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-indigo-200 border border-indigo-700/60 rounded-lg text-[11px] font-bold"
            >
              {isInCombat ? '🔒 戰鬥中鎖定' : '☕ 客棧全隊恢復'}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {/* 👑 主角戰況卡片 */}
            <div
              className={`p-2.5 rounded-xl border text-xs ${
                player.hp <= 0
                  ? 'bg-red-950/40 border-red-700'
                  : 'bg-amber-950/30 border-amber-500/80 shadow-md'
              }`}
            >
              <div className="flex justify-between items-center font-bold text-amber-300 gap-1">
                <span className="truncate">👑 {player.name}</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-200 px-1.5 py-0.5 rounded shrink-0">
                  {playerRowLabel}
                </span>
              </div>
              <div className="text-[10px] text-slate-300 font-mono mt-0.5 truncate">
                Lv.{player.level} {player.job} • {playerElem?.icon}攻{playerTotalAtk}
              </div>
              <div className="text-[10px] font-mono mt-0.5 text-cyan-300">
                {player.job === '猛將'
                  ? `🔥 怒氣 ${player.rage}/100`
                  : player.job === '巧匠'
                    ? `🏹 彈藥 ${player.ammo}/${player.maxAmmo}`
                    : `💧 內力 ${player.mp}/${playerTotalMaxMp}`}
                {combatBuffs?.shield > 0 && (
                  <span className="text-sky-300 ml-1">🛡️+{combatBuffs.shield}</span>
                )}
              </div>
              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden mt-1.5 border border-slate-800">
                <div className="bg-amber-400 h-full transition-all" style={{ width: `${playerHpPct}%` }} />
              </div>
              <div className="text-[10px] text-right font-mono text-amber-200 mt-0.5">
                {player.hp <= 0 ? (
                  <span className="text-rose-400 font-bold">☠️ 氣血耗盡</span>
                ) : (
                  `${player.hp}/${playerTotalMaxHp}`
                )}
              </div>
            </div>

            {/* 🛡️ 出戰英雄卡片 */}
            {activeHeroes.map(h => {
              const hBuff = heroBattleBuffs?.[h.instanceId];
              const hRowIdx = getHeroRowIdx(h.instanceId);
              const { effectiveMaxHp, effectiveAtk, skillChance } = calculateHeroEffectiveStats(h, isFengShui, hBuff, hRowIdx);
              const hpPct = Math.max(0, Math.min(100, (h.hp / effectiveMaxHp) * 100));
              return (
                <div
                  key={h.instanceId}
                  className={`p-2.5 rounded-xl border text-xs ${
                    h.hp <= 0 ? 'bg-red-950/30 border-red-800/70 opacity-80' : 'bg-slate-900 border-slate-800'
                  }`}
                >
                  <div className="flex justify-between items-center font-bold text-emerald-300 gap-1">
                    <span className="truncate">{h.icon} {h.name}</span>
                    <span className="text-[10px] text-slate-400 shrink-0">{ROW_LABELS[hRowIdx] || '⚡中排'}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    Lv.{h.level} • 攻{effectiveAtk} • 技{Math.round(skillChance * 100)}%
                  </div>
                  {hBuff?.surgeTurns > 0 && (
                    <div className="text-[9px] text-emerald-300 font-bold mt-0.5">
                      💊 藥力激發 ({hBuff.surgeTurns}回合)
                    </div>
                  )}
                  <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden mt-1.5 border border-slate-800">
                    <div className="bg-emerald-500 h-full transition-all" style={{ width: `${hpPct}%` }} />
                  </div>
                  <div className="text-[10px] text-right font-mono text-slate-300 mt-0.5">
                    {h.hp <= 0 ? <span className="text-rose-400 font-bold">☠️ 陣亡重傷</span> : `${h.hp}/${effectiveMaxHp}`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 戰鬥指令列 */}
        <div className="pt-3 border-t border-slate-800/80 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <button
              disabled={!isInCombat}
              onClick={() => handleExecuteRound({ type: 'attack' }, false)}
              className="bg-rose-700 hover:bg-rose-600 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white py-3 px-2 rounded-2xl font-bold text-xs sm:text-sm shadow-lg transition-all active:scale-95 text-center"
            >
              <div>普通攻擊</div>
              <div className="text-[10px] opacity-80 mt-0.5">
                {player.job === '猛將' ? '+25怒氣' : player.job === '巧匠' ? (player.ammo > 6 ? '二連射 +4彈' : '+4彈藥') : '+20MP'}
              </div>
            </button>

            {classSkills.map((sk, sIdx) => {
              const skLvl = player.skillLevels[sIdx] || 0;
              const isUnlearned = skLvl <= 0;
              let canAfford = !isUnlearned;
              if (sk.costType === 'rage' && player.rage < sk.cost) canAfford = false;
              if (sk.costType === 'mp' && player.mp < sk.cost) canAfford = false;
              if (sk.costType === 'ammo' && player.ammo < sk.cost) canAfford = false;

              const costLabel = sk.costType === 'rage' ? `${sk.cost}怒` : sk.costType === 'ammo' ? `${sk.cost}彈` : `${sk.cost}MP`;

              return (
                <button
                  key={sk.id}
                  disabled={!isInCombat || isUnlearned}
                  onClick={() => handleExecuteRound({ type: 'skill', skill: sk, skillIdx: sIdx }, false)}
                  className={`py-3 px-2 rounded-2xl font-bold text-xs sm:text-sm shadow-lg transition-all active:scale-95 text-center disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed ${
                    canAfford && isInCombat ? 'bg-cyan-700 hover:bg-cyan-600 text-white' : 'bg-slate-800 text-slate-500 opacity-60'
                  }`}
                >
                  <div className="truncate">
                    {isUnlearned ? `🔒 ${sk.name}` : `${sk.name} (Lv.${skLvl})`}
                  </div>
                  <div className="text-[10px] opacity-80 mt-0.5 font-mono">
                    {isUnlearned ? '未學習 (Lv.0)' : `消耗 ${costLabel}`}
                  </div>
                </button>
              );
            })}

            <button
              disabled={!isInCombat}
              onClick={() => handleExecuteRound({ type: 'attack' }, true)}
              className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-slate-950 font-black py-3 px-2 rounded-2xl text-xs sm:text-sm shadow-lg transition-all active:scale-95 text-center"
            >
              <div>⚡ 全軍合擊</div>
              <div className="text-[10px] opacity-80 mt-0.5">主僕集火奧義</div>
            </button>
          </div>

          {isInCombat && (
            <div className="flex justify-end">
              <button
                onClick={handleFleeCombat}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-bold transition-all"
              >
                🏃 撤退逃跑 (70% 成功脫離)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 實時戰況日誌 */}
      <div className="lg:col-span-4 bg-slate-900/80 border border-slate-800/80 rounded-3xl p-5 flex flex-col shadow-2xl backdrop-blur">
        <h3 className="font-extrabold text-amber-400 mb-3 border-b border-slate-800/80 pb-2 text-sm flex items-center gap-1.5">
          <ScrollText className="w-4 h-4" />
          <span>實時戰況日誌</span>
        </h3>
        <div className="flex-1 overflow-y-auto space-y-2 text-xs font-mono max-h-[480px] p-1">
          {combatLogs.map(log => (
            <div
              key={log.id}
              className={`leading-relaxed border-b border-slate-800/40 pb-1.5 ${getLogStyle(log)}`}
            >
              {log.text}
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
      </div>
    </div>
  );
}
