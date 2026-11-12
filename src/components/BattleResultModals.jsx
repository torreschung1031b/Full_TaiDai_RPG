import React from 'react';

export default function BattleResultModals({
  victorySummary,
  setVictorySummary,
  defeatSummary,
  setDefeatSummary,
  handleRestInn
}) {
  return (
    <>
      {/* 戰鬥勝利結算 Modal */}
      {victorySummary && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border-2 border-amber-500 rounded-2xl p-6 space-y-4 shadow-2xl text-center">
            <h3 className="text-xl font-black text-amber-400">🏆 戰鬥大捷！</h3>
            <div className="bg-slate-950 p-4 rounded-xl text-xs font-mono space-y-1.5 text-slate-300 border border-slate-800 text-left">
              <div>💰 金幣獲得: +{victorySummary.gold}</div>
              <div>✨ 經驗值獲得: +{victorySummary.exp} EXP</div>
              <div>💎 精鍊石掉落: +{victorySummary.stones}</div>
              {victorySummary.droppedEquipments && victorySummary.droppedEquipments.length > 0 && (
                <div className="text-amber-300 font-bold mt-1">
                  🛡️ 獲得裝備: {victorySummary.droppedEquipments.map(e => e.name).join(', ')}
                </div>
              )}
              {victorySummary.droppedHero && (
                <div className="text-emerald-300 font-bold mt-1">
                  👥 獲得新英雄：【{victorySummary.droppedHero.name}】({victorySummary.droppedHero.heroClass} • {victorySummary.droppedHero.element}屬性)！
                </div>
              )}
              {victorySummary.droppedSkillCard && (
                <div className="text-purple-300 font-bold mt-1">
                  🃏 獲得技能卡：【{victorySummary.droppedSkillCard.name}】！
                </div>
              )}
            </div>
            {victorySummary.msgs && victorySummary.msgs.map((m, i) => (
              <div key={i} className="text-xs text-amber-300 font-bold">{m}</div>
            ))}
            <button
              onClick={() => setVictorySummary(null)}
              className="w-full py-3 bg-amber-500 text-slate-950 font-black rounded-xl text-sm hover:bg-amber-400"
            >
              返回安全營地整備
            </button>
          </div>
        </div>
      )}

      {/* 戰敗結算 Modal */}
      {defeatSummary && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border-2 border-rose-600 rounded-2xl p-6 space-y-4 shadow-2xl text-center">
            <h3 className="text-xl font-black text-rose-400">☠️ 勝敗乃兵家常事 • 戰敗重傷</h3>
            <p className="text-xs text-slate-400">
              少俠氣血耗盡不敵退卻，僅存 1 點氣血逃回安全營地。
            </p>
            <div className="bg-slate-950 p-4 rounded-xl text-xs font-mono space-y-2 text-left border border-rose-900/60">
              <div className="text-rose-400 font-bold">
                📉 經驗值懲罰：-{defeatSummary.expLost} EXP（剩餘 {defeatSummary.remainingExp} / {defeatSummary.maxExp}）
              </div>
              {defeatSummary.casualties && defeatSummary.casualties.length > 0 && (
                <div className="pt-2 border-t border-slate-800 space-y-1">
                  <div className="text-amber-300 font-bold">⚠️ 本場陣亡英雄永久屬性減損：</div>
                  {defeatSummary.casualties.map((c, i) => (
                    <div key={i} className="text-rose-300 leading-relaxed">{c}</div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setDefeatSummary(null);
                  handleRestInn();
                }}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl text-xs sm:text-sm"
              >
                ☕ 立即回客棧休養
              </button>
              <button
                onClick={() => setDefeatSummary(null)}
                className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs sm:text-sm"
              >
                返回營地
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
