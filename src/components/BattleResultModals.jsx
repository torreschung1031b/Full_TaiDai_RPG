import React from 'react';
import { Trophy, Skull, Sparkles, Coffee } from 'lucide-react';
import { enrichEquipmentMeta } from '../data/equipment';

export default function BattleResultModals({
  victorySummary,
  setVictorySummary,
  defeatSummary,
  setDefeatSummary,
  handleRestInn
}) {
  if (!victorySummary && !defeatSummary) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      {/* 勝利結算彈窗 */}
      {victorySummary && (
        <div className="bg-slate-900 border border-amber-500/60 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 animate-fade-in">
          <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
            <Trophy className="w-6 h-6 text-amber-400 shrink-0" />
            <div>
              <h3 className="font-extrabold text-amber-400 text-lg">🎉 戰鬥大捷・戰利品結算</h3>
              <p className="text-xs text-slate-400">所有戰利品已自動收入背包與名冊</p>
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

          {/* 掉落裝備列表（附 Tier 1~5 階級色標） */}
          {victorySummary.droppedEquipments?.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-amber-300">⚔️ 獲得神兵裝備：</div>
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

          {/* 掉落技能卡 */}
          {victorySummary.droppedSkillCard && (
            <div className="bg-purple-950/30 border border-purple-500/50 rounded-2xl p-3 text-xs space-y-1">
              <div className="font-bold text-purple-300 flex items-center justify-between">
                <span>🃏 獲得技能卡：{victorySummary.droppedSkillCard.icon} {victorySummary.droppedSkillCard.name}</span>
                <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded text-slate-300">
                  {victorySummary.droppedSkillCard.type === 'active' ? '主動卡' : '被動卡'}
                </span>
              </div>
              <div className="text-[11px] text-slate-300">{victorySummary.droppedSkillCard.desc}</div>
            </div>
          )}

          {/* 招降加入英雄 */}
          {victorySummary.droppedHero && (
            <div className="bg-emerald-950/35 border border-emerald-500/60 rounded-2xl p-3 text-xs flex items-center justify-between">
              <span className="font-bold text-emerald-300">
                👥 江湖豪傑慕名投效：{victorySummary.droppedHero.icon} 【Tier {victorySummary.droppedHero.tier}】{victorySummary.droppedHero.name}（{victorySummary.droppedHero.heroClass}）
              </span>
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

          <button
            onClick={() => setVictorySummary(null)}
            className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-slate-950 font-black rounded-2xl text-sm shadow-lg transition-all"
          >
            收下戰利品並繼續
          </button>
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
