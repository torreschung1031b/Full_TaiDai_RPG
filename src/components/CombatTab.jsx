import React from 'react';
import { ScrollText, Compass, HelpCircle, Zap } from 'lucide-react';
import { ELEMENTS, ZONES } from '../data/constants';
import { calculateHeroEffectiveStats, getElementMultiplier } from '../utils/statCalculator';
import { getPlayerCritProfile, getSkillMeta, getZoneSweepReqLevel } from '../utils/combatEngine';

const ROW_LABELS = ['🛡️前排', '⚡中排', '✨後排'];

export default function CombatTab({
  isInCombat,
  activeTowerFloor,
  currentZoneIndex,
  handleSelectZone,
  spawnEncounter,
  handleSweepZone,
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
  lastRoundHits,
  chatEndRef
}) {
  const playerRowIdx = getHeroRowIdx('PLAYER');
  const playerRowLabel = ROW_LABELS[playerRowIdx] || '⚡中排';
  const playerHpPct = Math.max(0, Math.min(100, (player.hp / (playerTotalMaxHp || 1)) * 100));
  const playerElem = ELEMENTS[player.element];
  const { critRate: playerCritRate } = getPlayerCritProfile(player);

  const sweepReqLevel = getZoneSweepReqLevel(currentZoneIndex);
  const isSweepLevelUnlocked = (player.level || 1) >= sweepReqLevel;
  const isSweepHpReady = (player.hp || 0) > 1;

  const getLogBaseStyle = (log) => {
    const txt = log.text || '';
    if (log.type === 'danger' || /戰敗|陣亡|重傷|氣血耗盡/.test(txt)) {
      return 'text-rose-300 font-bold bg-rose-950/30 px-2 py-1 rounded-lg border-l-2 border-rose-500';
    }
    if (log.dmgRole === 'player_crit') {
      return 'text-amber-100 bg-amber-950/35 px-2 py-1 rounded-lg border-l-2 border-amber-400';
    }
    if (log.dmgRole === 'monster_crit') {
      return 'text-rose-100 bg-rose-950/45 px-2 py-1 rounded-lg border-l-2 border-rose-500';
    }
    if (/首領|大捷|升級|通關/.test(txt)) {
      return 'text-amber-300 font-bold';
    }
    if (/獲得|掉落|招募|技能卡/.test(txt)) {
      return 'text-purple-300 font-semibold';
    }
    return 'text-slate-300';
  };

  /**
   * 智慧高亮日誌中的特殊數字，並依「是否暴擊」與「敵我類型」切換色彩
   */
  const renderHighlightedLog = (log) => {
    const text = log.text || '';
    const isPlayerCrit = log.dmgRole === 'player_crit' || (log.type !== 'monster' && text.includes('暴擊'));
    const isMonsterCrit = log.dmgRole === 'monster_crit' || (log.type === 'monster' && text.includes('暴擊'));

    const parts = text.split(/(\+\d+|\d+(?:\.\d+)?%|\d+(?:\.\d+)?x|\d+)/g);

    return parts.map((part, i) => {
      if (!part) return null;

      if (/^\d+(?:\.\d+)?(%|x)$/.test(part)) {
        return (
          <span key={i} className="text-amber-300 font-extrabold underline decoration-amber-500/50 mx-0.5">
            {part}
          </span>
        );
      }

      if (/^\+\d+$/.test(part)) {
        const nextStr = parts[i + 1] || '';
        const isResource = /MP|怒|彈/.test(nextStr);
        return (
          <span
            key={i}
            className={`font-black px-1 py-0.2 rounded mx-0.5 ${
              isResource
                ? 'text-cyan-200 bg-cyan-950/80 border border-cyan-600/60'
                : 'text-emerald-200 bg-emerald-950/80 border border-emerald-500/60'
            }`}
          >
            {part}
          </span>
        );
      }

      if (/^\d+$/.test(part)) {
        const prevStr = parts[i - 1] || '';
        const nextStr = parts[i + 1] || '';
        const isDamageNumber = /造成|受到|吸收了|反彈|累計造成/.test(prevStr) || /點傷害|點重創|點打擊|點法傷|點毀滅|點毒傷|點重擊|點無視|點護盾/.test(nextStr);

        if (isDamageNumber) {
          if (isPlayerCrit) {
            return (
              <span
                key={i}
                className="inline-flex items-center gap-0.5 bg-gradient-to-r from-amber-500/35 to-orange-500/35 text-amber-200 border border-amber-400 px-1.5 py-0.2 rounded-md font-black text-[13px] shadow-sm mx-0.5"
              >
                💥{part}
              </span>
            );
          }
          if (isMonsterCrit) {
            return (
              <span
                key={i}
                className="inline-flex items-center gap-0.5 bg-rose-600/45 text-rose-100 border border-rose-400 px-1.5 py-0.2 rounded-md font-black text-[13px] shadow-sm mx-0.5"
              >
                💢{part}
              </span>
            );
          }
          if (log.dmgRole === 'monster_normal' || log.type === 'monster') {
            return (
              <span
                key={i}
                className="text-rose-400 bg-rose-950/60 border border-rose-800/70 px-1.5 py-0.2 rounded font-black text-[13px] mx-0.5"
              >
                {part}
              </span>
            );
          }
          if (log.dmgRole === 'dot_poison') {
            return (
              <span
                key={i}
                className="text-purple-200 bg-purple-950/70 border border-purple-600/70 px-1.5 py-0.2 rounded font-black text-[13px] mx-0.5"
              >
                ☠️{part}
              </span>
            );
          }
          if (log.dmgRole === 'dot_burn') {
            return (
              <span
                key={i}
                className="text-orange-200 bg-orange-950/70 border border-orange-600/70 px-1.5 py-0.2 rounded font-black text-[13px] mx-0.5"
              >
                🔥{part}
              </span>
            );
          }
          if (log.dmgRole === 'shield') {
            return (
              <span
                key={i}
                className="text-sky-200 bg-sky-950/70 border border-sky-500/70 px-1.5 py-0.2 rounded font-black text-[13px] mx-0.5"
              >
                🛡️{part}
              </span>
            );
          }
          return (
            <span
              key={i}
              className="text-cyan-200 bg-cyan-950/60 border border-cyan-700/70 px-1.5 py-0.2 rounded font-black text-[13px] mx-0.5"
            >
              {part}
            </span>
          );
        }

        return (
          <span key={i} className="text-slate-100 font-bold">
            {part}
          </span>
        );
      }

      return <span key={i}>{part}</span>;
    });
  };

  const playerHit = lastRoundHits?.allies?.['PLAYER'];

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
                    !activeTowerFloor && currentZoneIndex === zIdx ? 'bg-amber-600 text-white shadow' : 'bg-slate-950/60 text-slate-400 border border-slate-800'
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

          {/* 鎮魔塔層數橫幅 */}
          {isInCombat && activeTowerFloor && (
            <div className={`mb-3 px-3.5 py-2 rounded-2xl border text-xs font-extrabold flex items-center justify-between ${
              activeTowerFloor % 5 === 0
                ? 'bg-rose-950/70 border-rose-500 text-amber-300'
                : 'bg-indigo-950/70 border-indigo-500/70 text-indigo-200'
            }`}>
              <span>
                {activeTowerFloor % 5 === 0
                  ? `🔥 鎮魔塔第 ${activeTowerFloor} 層・鎮守首領討伐戰！`
                  : `🗼 鎮魔塔第 ${activeTowerFloor} 層・守衛試煉戰`}
              </span>
              <span className="text-[11px] font-mono">
                {activeTowerFloor % 5 === 0 ? '勝出必掉高階神裝＋技能卡' : '勝出推進樓層'}
              </span>
            </div>
          )}

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
              <div className="pt-2 flex flex-wrap justify-center gap-3">
                <button
                  onClick={handleRestInn}
                  className="px-4 py-2.5 bg-indigo-700 hover:bg-indigo-600 text-white rounded-xl font-bold text-xs shadow transition-all"
                >
                  ☕ 客棧休息恢復滿血
                </button>
                <button
                  onClick={() => spawnEncounter(currentZoneIndex)}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-slate-950 rounded-xl font-black text-xs shadow-lg transition-all"
                >
                  🔍 立即主動搜敵
                </button>
                {handleSweepZone && (
                  <button
                    disabled={!isSweepLevelUnlocked || !isSweepHpReady}
                    onClick={() => handleSweepZone(3)}
                    title={
                      !isSweepLevelUnlocked
                        ? `需少俠達到 Lv.${sweepReqLevel} 解鎖此區域快速掃蕩`
                        : !isSweepHpReady
                          ? '少俠重傷瀕死，請先休養再掃蕩'
                          : '連續自動掃蕩 3 場並承受真實戰損（戰敗即中止）'
                    }
                    className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 disabled:bg-slate-800 disabled:text-slate-500 disabled:border disabled:border-slate-700 disabled:cursor-not-allowed text-white rounded-xl font-bold text-xs shadow transition-all flex items-center gap-1.5"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>
                      {!isSweepLevelUnlocked
                        ? `🔒 掃蕩需 Lv.${sweepReqLevel}`
                        : !isSweepHpReady
                          ? '⚠️ 氣血過低無法掃蕩'
                          : '⚡ 快速掃蕩 ×3'}
                    </span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5 max-h-72 overflow-y-auto p-1">
              {monsters.map((m, idx) => {
                const isDead = m.hp <= 0;
                const isSelected = selectedTargetIndex === idx && !isDead;
                const elemInfo = ELEMENTS[m.element];
                const elemMult = getElementMultiplier ? getElementMultiplier(player.element, m.element) : 1;
                const mHit = lastRoundHits?.monsters?.[m.id];
                const mHpPct = Math.max(0, Math.min(100, (m.hp / (m.maxHp || 1)) * 100));

                return (
                  <div
                    key={m.id}
                    onClick={() => !isDead && setSelectedTargetIndex(idx)}
                    className={`p-3 rounded-2xl border text-center cursor-pointer transition-all shadow-md space-y-1 relative ${
                      isDead
                        ? 'opacity-35 bg-slate-950 border-slate-800'
                        : isSelected
                          ? 'border-amber-400 bg-amber-950/40 ring-2 ring-amber-400/60 scale-[1.03]'
                          : m.isBoss
                            ? 'border-rose-500/80 bg-rose-950/30 hover:border-rose-400'
                            : m.isElite
                              ? 'border-purple-500/70 bg-purple-950/20 hover:border-purple-400'
                              : 'border-slate-800/80 bg-slate-950/60 hover:border-slate-700'
                    }`}
                  >
                    {mHit && mHit.dmg > 0 && (
                      <div className="flex justify-center">
                        <span
                          className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-full border shadow ${
                            mHit.isCrit
                              ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 border-amber-200 animate-pulse'
                              : 'bg-cyan-950/90 text-cyan-200 border-cyan-500/70'
                          }`}
                        >
                          {mHit.isCrit ? `💥 -${mHit.dmg} 暴擊` : `-${mHit.dmg}`}
                        </span>
                      </div>
                    )}

                    <div className="text-xs font-bold truncate text-slate-200">
                      {m.isBoss ? `👑 ${m.name}` : m.name}
                    </div>
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

                    <div
                      className={`text-[11px] font-mono font-black ${
                        isDead
                          ? 'text-slate-600'
                          : mHpPct <= 25
                            ? 'text-rose-400 animate-pulse'
                            : mHpPct <= 60
                              ? 'text-amber-300'
                              : 'text-emerald-300'
                      }`}
                    >
                      HP {m.hp}/{m.maxHp}
                    </div>

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
                {playerElem?.icon}攻{playerTotalAtk} • 暴{Math.round(playerCritRate * 100)}%
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

              {isInCombat && playerHit && (playerHit.dmg > 0 || playerHit.heal > 0) && (
                <div className="flex flex-wrap gap-1 mt-1 font-mono text-[10px] font-black">
                  {playerHit.dmg > 0 && (
                    <span
                      className={`px-1.5 py-0.2 rounded border ${
                        playerHit.isCrit
                          ? 'bg-rose-600/50 text-rose-100 border-rose-400 animate-pulse'
                          : 'bg-rose-950/80 text-rose-300 border-rose-800'
                      }`}
                    >
                      {playerHit.isCrit ? `💢-${playerHit.dmg} 遭暴擊` : `-${playerHit.dmg}`}
                    </span>
                  )}
                  {playerHit.heal > 0 && (
                    <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-700 px-1.5 py-0.2 rounded">
                      +{playerHit.heal}
                    </span>
                  )}
                </div>
              )}

              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden mt-1.5 border border-slate-800">
                <div className="bg-amber-400 h-full transition-all" style={{ width: `${playerHpPct}%` }} />
              </div>
              <div className="text-[10px] text-right font-mono font-bold text-amber-200 mt-0.5">
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
              const hHit = lastRoundHits?.allies?.[h.instanceId];

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

                  {isInCombat && hHit && (hHit.dmg > 0 || hHit.heal > 0) && (
                    <div className="flex flex-wrap gap-1 mt-1 font-mono text-[10px] font-black">
                      {hHit.dmg > 0 && (
                        <span
                          className={`px-1.5 py-0.2 rounded border ${
                            hHit.isCrit
                              ? 'bg-rose-600/50 text-rose-100 border-rose-400 animate-pulse'
                              : 'bg-rose-950/80 text-rose-300 border-rose-800'
                          }`}
                        >
                          {hHit.isCrit ? `💢-${hHit.dmg} 遭暴擊` : `-${hHit.dmg}`}
                        </span>
                      )}
                      {hHit.heal > 0 && (
                        <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-700 px-1.5 py-0.2 rounded">
                          +{hHit.heal}
                        </span>
                      )}
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

        {/* 戰鬥指令列（4 欄：普通攻擊 ＋ 3 招職業技能含冷卻與等級限制） */}
        <div className="pt-3 border-t border-slate-800/80 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <button
              disabled={!isInCombat}
              onClick={() => handleExecuteRound({ type: 'attack' })}
              className="bg-rose-700 hover:bg-rose-600 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white py-3 px-2 rounded-2xl font-bold text-xs sm:text-sm shadow-lg transition-all active:scale-95 text-center"
            >
              <div>{['術士', '藥師', '風水師'].includes(player.job) ? '靈訣普攻' : '普通攻擊'}</div>
              <div className="text-[10px] opacity-80 mt-0.5">
                {player.job === '猛將' ? '+25怒氣' : player.job === '巧匠' ? (player.ammo > 6 ? '二連射 +4彈' : '+4彈藥') : '+20MP'}
              </div>
            </button>

            {classSkills.map((sk, sIdx) => {
              const skLvl = player.skillLevels?.[sIdx] || 0;
              const { unlockLevel, cooldown } = getSkillMeta(sk, sIdx);
              const isLevelLocked = (player.level || 1) < unlockLevel;
              const isUnlearned = skLvl <= 0;
              const cdRemaining = combatBuffs?.skillCooldowns?.[sIdx] || 0;
              const isOnCooldown = cdRemaining > 0;

              let canAfford = !isLevelLocked && !isUnlearned && !isOnCooldown;
              if (sk.costType === 'rage' && player.rage < sk.cost) canAfford = false;
              if (sk.costType === 'mp' && player.mp < sk.cost) canAfford = false;
              if (sk.costType === 'ammo' && player.ammo < sk.cost) canAfford = false;

              const costLabel = sk.costType === 'rage' ? `${sk.cost}怒` : sk.costType === 'ammo' ? `${sk.cost}彈` : `${sk.cost}MP`;
              const isDisabled = !isInCombat || isLevelLocked || isUnlearned || isOnCooldown;

              return (
                <button
                  key={sk.id}
                  disabled={isDisabled}
                  onClick={() => handleExecuteRound({ type: 'skill', skill: sk, skillIdx: sIdx })}
                  className={`py-3 px-2 rounded-2xl font-bold text-xs sm:text-sm shadow-lg transition-all active:scale-95 text-center disabled:cursor-not-allowed ${
                    isOnCooldown && isInCombat
                      ? 'bg-amber-950/50 text-amber-300/80 border border-amber-700/60'
                      : canAfford && isInCombat
                        ? 'bg-cyan-700 hover:bg-cyan-600 text-white'
                        : 'bg-slate-800 text-slate-500 opacity-65'
                  }`}
                >
                  <div className="truncate">
                    {isLevelLocked
                      ? `🔒 ${sk.name}`
                      : isUnlearned
                        ? `🔒 ${sk.name}`
                        : isOnCooldown
                          ? `⏳ ${sk.name}`
                          : `${sk.name} (Lv.${skLvl})`}
                  </div>
                  <div className="text-[10px] opacity-85 mt-0.5 font-mono">
                    {isLevelLocked
                      ? `需 Lv.${unlockLevel} 解鎖`
                      : isUnlearned
                        ? '未學習 (Lv.0)'
                        : isOnCooldown
                          ? `冷卻中 (剩 ${cdRemaining} 回合)`
                          : `消耗 ${costLabel}${cooldown > 0 ? ` • CD${cooldown}` : ''}`}
                  </div>
                </button>
              );
            })}
          </div>

          {isInCombat && (
            <div className="flex justify-end">
              <button
                onClick={handleFleeCombat}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-bold transition-all"
              >
                🏃 撤退逃跑 (65% 成功脫離)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 實時戰況日誌 */}
      <div className="lg:col-span-4 bg-slate-900/80 border border-slate-800/80 rounded-3xl p-5 flex flex-col shadow-2xl backdrop-blur">
        <div className="border-b border-slate-800/80 pb-2.5 mb-3 space-y-1.5">
          <h3 className="font-extrabold text-amber-400 text-sm flex items-center gap-1.5">
            <ScrollText className="w-4 h-4" />
            <span>實時戰況日誌</span>
          </h3>
          <div className="flex flex-wrap gap-1.5 text-[10px] font-mono">
            <span className="bg-amber-500/25 text-amber-200 border border-amber-400/70 px-1.5 py-0.2 rounded font-bold">
              💥我方暴擊
            </span>
            <span className="bg-cyan-950 text-cyan-200 border border-cyan-700 px-1.5 py-0.2 rounded font-bold">
              我方普傷
            </span>
            <span className="bg-rose-600/40 text-rose-100 border border-rose-400 px-1.5 py-0.2 rounded font-bold">
              💢敵方暴擊
            </span>
            <span className="bg-emerald-950 text-emerald-200 border border-emerald-600 px-1.5 py-0.2 rounded font-bold">
              +治療
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 text-xs font-mono max-h-[480px] p-1">
          {combatLogs.map(log => (
            <div
              key={log.id}
              className={`leading-relaxed border-b border-slate-800/40 pb-1.5 ${getLogBaseStyle(log)}`}
            >
              {renderHighlightedLog(log)}
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
      </div>
    </div>
  );
}