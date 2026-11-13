import React from 'react';
import { Trophy, Skull, Sparkles, Coffee, AlertTriangle, Swords } from 'lucide-react';
import { enrichEquipmentMeta } from '../data/equipment';

export default function BattleResultModals({
  victorySummary,
  setVictorySummary,
  defeatSummary,
  setDefeatSummary,
  handleRestInn
}) {
  if (!victorySummary && !defeatSummary) return null;

  const isSweep = Boolean(victorySummary?.isSweep);
  const isSweepDefeated = Boolean(isSweep && victorySummary?.isDefeated);

  const skillCardsList = victorySummary
    ? (victorySummary.droppedSkillCards || (victorySummary.droppedSkillCard ? [victorySummary.droppedSkillCard] : []))
    : [];
  const heroesList = victorySummary
    ? (victorySummary.droppedHeroes || (victorySummary.droppedHero ? [victorySummary.droppedHero] : []))
    : [];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      {/* 勝利 / 掃蕩結算彈窗 */}
      {victorySummary && (
        <div
          className={`bg-slate-900 border rounded-3xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-4 animate-fade-in ${
            isSweepDefeated ? 'border-rose-500/75' : 'border-amber-500/60'
          }`}
        >
          <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
            {isSweepDefeated ? (
              <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0" />
            ) : (
              <Trophy className="w-6 h-6 text-amber-400 shrink-0" />
            )}
            <div>
              <h3
                className={`font-extrabold text-lg ${
                  isSweepDefeated ? 'text-rose-400' : 'text-amber-400'
                }`}
              >
                {isSweepDefeated
                  ? `⚠️ 快速掃蕩中途戰敗（完成 ${victorySummary.completedBattles ?? 0}/${victorySummary.requestedBattles ?? 3} 場）`
                  : isSweep
                    ? `⚡ 快速掃蕩大捷（完成 ${victorySummary.completedBattles ?? 0}/${victorySummary.requestedBattles ?? 3} 場）`
                    : '🎉 戰鬥大捷・戰利品結算'}
              </h3>
              <p className="text-xs text-slate-400">
                {isSweepDefeated
                  ? `隊伍於第 ${victorySummary.failedBattleIndex || (victorySummary.completedBattles || 0) + 1} 場力竭重傷中止掃蕩，已結算先前勝場戰利品`
                  : '所有戰利品已自動收入背包與名冊'}
              </p>
            </div>
          </div>

          {/* 基礎資源獎勵 */}
          <div className="grid grid-cols-3 gap-2.5 text-center font-mono">
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
              <div className="text-[11px] text-slate-400">💰 獲得金幣</div>
              <div className="text-base font-black text-amber-300 mt-0.5">+{victorySummary.gold}</div>
            </div>
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
              <div className="text-[11px] text-slate-400">✨ 獲得經驗</div>
              <div className="text-base font-black text-emerald-300 mt-0.5">+{victorySummary.exp}</div>
            </div>
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
              <div className="text-[11px] text-slate-400">💎 精鍊石</div>
              <div className="text-base font-black text-cyan-300 mt-0.5">+{victorySummary.stones}</div>
            </div>
          </div>

          {/* 逐場實戰模擬戰報（僅快速掃蕩顯示） */}
          {isSweep && victorySummary.battleReports?.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                <Swords className="w-3.5 h-3.5" />
                <span>逐場實戰模擬戰報：</span>
              </div>
              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                {victorySummary.battleReports.map((rep, idx) => {
                  const isWin = rep.result === 'VICTORY' || rep.win === true;
                  return (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-xl border text-xs space-y-1 ${
                        isWin
                          ? 'bg-slate-950/90 border-slate-800'
                          : 'bg-rose-950/40 border-rose-700/80'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 font-bold">
                        <span className={isWin ? 'text-emerald-300' : 'text-rose-300'}>
                          第 {rep.battleIndex || idx + 1} 場・{isWin ? '✅ 勝出' : '☠️ 戰敗中止'}
                          {rep.rounds ? `（${rep.rounds} 回合）` : ''}
                        </span>
                        {typeof rep.playerHpAfter === 'number' && (
                          <span className="text-[11px] font-mono text-slate-400">
                            少俠剩餘 HP：{rep.playerHpAfter}
                          </span>
                        )}
                      </div>

                      {rep.summary && (
                        <div className="text-[11px] text-slate-300 leading-relaxed">{rep.summary}</div>
                      )}

                      {rep.fallenHeroes?.length > 0 && (
                        <div className="text-[11px] text-rose-300 font-bold">
                          💔 陣亡重傷：{rep.fallenHeroes.join('、')}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 掉落裝備列表（附 Tier 1~5 階級色標） */}
          {victorySummary.droppedEquipments?.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-amber-300">
                ⚔️ 獲得神兵裝備（{victorySummary.droppedEquipments.length} 件）：
              </div>
              {victorySummary.droppedEquipments.map((rawEq, idx) => {
                const eq = enrichEquipmentMeta(rawEq);
                const isHighTier = eq.tier >= 4;
                return (
                  <div
                    key={eq.uid || idx}
                    className={`p-3 rounded-2xl border text-xs space-y-1 ${
                      eq.tier === 5
                        ? 'bg-amber-950/35 border-amber-400/80 shadow-md shadow-amber-900/30'
                        : eq.tier === 4
                          ? 'bg-purple-950/35 border-purple-400/80'
                          : 'bg-slate-950 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap font-bold text-amber-200">
                        <span className={`text-[10px] px-2 py-0.5 rounded border font-bold ${eq.tierBadgeStyle}`}>
                          {eq.tierTag}
                        </span>
                        <span>{eq.name} (+{eq.refineLevel || 0})</span>
                        {isHighTier && <span className="text-[10px] text-amber-300">✨稀有掉落</span>}
                      </div>
                      <span className="text-[10px] bg-slate-900 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
                        {eq.equipTag}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">{eq.desc}</div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 掉落技能卡（支援單張與掃蕩多張） */}
          {skillCardsList.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-purple-300">
                🃏 獲得技能卡（{skillCardsList.length} 張）：
              </div>
              {skillCardsList.map((card, idx) => (
                <div
                  key={card.uid || idx}
                  className="bg-purple-950/30 border border-purple-500/50 rounded-2xl p-3 text-xs space-y-1"
                >
                  <div className="font-bold text-purple-300 flex items-center justify-between gap-2">
                    <span>{card.icon} {card.name}</span>
                    <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded text-slate-300 shrink-0">
                      {card.type === 'active' ? '主動卡' : '被動卡'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300">{card.desc}</div>
                </div>
              ))}
            </div>
          )}

          {/* 招降加入英雄（支援單人與掃蕩多人） */}
          {heroesList.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-emerald-300">
                👥 江湖豪傑慕名投效（{heroesList.length} 位）：
              </div>
              {heroesList.map((hero, idx) => (
                <div
                  key={hero.instanceId || idx}
                  className="bg-emerald-950/35 border border-emerald-500/60 rounded-2xl p-3 text-xs flex items-center justify-between"
                >
                  <span className="font-bold text-emerald-300">
                    {hero.icon} 【Tier {hero.tier}】{hero.name}（{hero.heroClass}）已加入英雄名冊
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* 升級與鎮魔塔突破訊息 */}
          {victorySummary.msgs?.length > 0 && (
            <div className="bg-amber-950/30 border border-amber-600/50 rounded-2xl p-3 space-y-1 text-xs text-amber-200 font-bold">
              {victorySummary.msgs.map((msg, i) => (
                <div key={i} className="flex items-start gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>{msg}</span>
                </div>
              ))}
            </div>
          )}

          {/* 底部按鈕（掃蕩戰敗時提供一鍵客棧休養） */}
          <div className="flex gap-2.5 pt-1">
            {isSweepDefeated && handleRestInn && (
              <button
                onClick={() => {
                  handleRestInn();
                  setVictorySummary(null);
                }}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-lg transition-all"
              >
                <Coffee className="w-4 h-4" />
                <span>立即客棧滿血休養</span>
              </button>
            )}
            <button
              onClick={() => setVictorySummary(null)}
              className={`${
                isSweepDefeated && handleRestInn ? 'px-5' : 'w-full'
              } py-3 bg-amber-600 hover:bg-amber-500 text-slate-950 font-black rounded-2xl text-sm shadow-lg transition-all`}
            >
              收下戰利品並繼續
            </button>
          </div>
        </div>
      )}

      {/* 戰敗結算彈窗 */}
      {defeatSummary && (
        <div className="bg-slate-900 border border-rose-600/70 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
            <Skull className="w-6 h-6 text-rose-400 shrink-0" />
            <div>
              <h3 className="font-extrabold text-rose-400 text-lg">☠️ 戰鬥失利・重傷撤退</h3>
              <p className="text-xs text-slate-400">少俠已退回安全營地，建議立即前往客棧休養</p>
            </div>
          </div>

          <div className="bg-rose-950/40 border border-rose-800/70 rounded-2xl p-4 text-xs space-y-1.5 font-mono">
            <div className="text-rose-300 font-bold">
              📉 戰敗經驗懲罰：-{defeatSummary.expLost} EXP
            </div>
            <div className="text-slate-300">
              目前經驗進度：{defeatSummary.remainingExp} / {defeatSummary.maxExp}
            </div>
          </div>

          {defeatSummary.casualties?.length > 0 && (
            <div className="bg-slate-950 border border-rose-900/70 rounded-2xl p-3 space-y-1.5 text-xs text-rose-300">
              <div className="font-bold">💔 本場重傷瀕死英雄紀錄：</div>
              {defeatSummary.casualties.map((c, idx) => (
                <div key={idx} className="text-[11px] leading-relaxed">{c}</div>
              ))}
            </div>
          )}

          <div className="flex gap-2.5 pt-1">
            {handleRestInn && (
              <button
                onClick={() => {
                  handleRestInn();
                  setDefeatSummary(null);
                }}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-lg"
              >
                <Coffee className="w-4 h-4" />
                <span>立即客棧滿血休養</span>
              </button>
            )}
            <button
              onClick={() => setDefeatSummary(null)}
              className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-2xl text-xs sm:text-sm"
            >
              返回營地
            </button>
          </div>
        </div>
      )}
    </div>
  );
}