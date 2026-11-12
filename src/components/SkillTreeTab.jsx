import React from 'react';
import { HelpCircle } from 'lucide-react';
import { MAX_LEVEL, MAX_SKILL_LEVEL } from '../data/constants';

export default function SkillTreeTab({
  player,
  setPlayer,
  classSkills,
  setHelpModalTab
}) {
  return (
    <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur space-y-5 max-w-4xl mx-auto">
      <div className="flex flex-wrap justify-between items-center gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <div>
            <h2 className="font-extrabold text-amber-400 text-lg">
              ✨ {player.job}專屬技能樹（Lv.0 未學習 ～ Lv.{MAX_SKILL_LEVEL} 滿級）
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              角色最高 Lv.{MAX_LEVEL}，共可獲得 30 點 SP 完整修滿全部三招技能！
            </p>
          </div>
          <button
            onClick={() => setHelpModalTab('heroes')}
            className="text-slate-400 hover:text-amber-300 transition-colors"
            title="查看技能配點與上限規則"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
        <span className="text-xs bg-amber-500/20 text-amber-300 font-mono font-bold px-3.5 py-1.5 rounded-full border border-amber-500/40">
          可用技能點 (SP): {player.sp}
        </span>
      </div>

      <div className="space-y-4">
        {classSkills.map((sk, idx) => {
          const lvl = player.skillLevels[idx] || 0;
          const isUnlearned = lvl === 0;
          const isMax = lvl >= MAX_SKILL_LEVEL;
          const costLabel = sk.costType === 'rage' ? `${sk.cost} 怒氣` : sk.costType === 'ammo' ? `${sk.cost} 彈藥` : `${sk.cost} MP`;

          return (
            <div key={sk.id} className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex flex-wrap justify-between items-start gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-amber-300 text-base">{sk.name}</span>
                    <span className="text-[11px] bg-slate-800 text-cyan-300 px-2.5 py-0.5 rounded-full font-bold">
                      {sk.targetBadge}
                    </span>
                    <span className="text-[11px] bg-slate-900 text-slate-400 border border-slate-700 px-2 py-0.5 rounded-full font-mono">
                      消耗: {costLabel}
                    </span>
                    {isUnlearned ? (
                      <span className="text-[11px] bg-rose-950 text-rose-300 border border-rose-800 px-2.5 py-0.5 rounded-full font-bold">
                        🔒 未學習 (Lv.0/{MAX_SKILL_LEVEL})
                      </span>
                    ) : isMax ? (
                      <span className="text-[11px] bg-amber-950 text-amber-300 border border-amber-600 px-2.5 py-0.5 rounded-full font-bold">
                        👑 已達滿級 (Lv.{MAX_SKILL_LEVEL}/{MAX_SKILL_LEVEL})
                      </span>
                    ) : (
                      <span className="text-[11px] bg-emerald-950 text-emerald-300 border border-emerald-700 px-2.5 py-0.5 rounded-full font-mono font-bold">
                        Lv.{lvl} / {MAX_SKILL_LEVEL}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{sk.desc}</p>
                </div>

                <button
                  onClick={() => {
                    if (player.sp > 0 && lvl < MAX_SKILL_LEVEL) {
                      setPlayer(p => ({ ...p, sp: p.sp - 1, skillLevels: { ...p.skillLevels, [idx]: lvl + 1 } }));
                    }
                  }}
                  disabled={player.sp <= 0 || isMax}
                  className={`px-4 py-2.5 font-bold text-xs rounded-xl shrink-0 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                    isUnlearned
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg'
                      : 'bg-amber-600 hover:bg-amber-500 text-white shadow'
                  }`}
                >
                  {isMax ? '👑 已達滿級' : isUnlearned ? '✨ 學習技能 (1 SP)' : '⬆️ 技能升級 (1 SP)'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-2 border-t border-slate-800/80 text-xs">
                <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                  <div className="text-[10px] font-bold text-slate-400 mb-1">
                    {isUnlearned ? '📌 當前狀態' : `📌 當前等級效果 (Lv.${lvl})`}
                  </div>
                  <div className={isUnlearned ? 'text-slate-500 italic' : 'text-slate-200 font-semibold'}>
                    {isUnlearned ? '尚未學習此技能（戰鬥中無法施放）' : sk.formatPreview(lvl)}
                  </div>
                </div>

                <div className="bg-indigo-950/30 p-3 rounded-xl border border-indigo-800/50">
                  <div className="text-[10px] font-bold text-indigo-300 mb-1">
                    {isMax
                      ? '🏆 滿級巔峰狀態'
                      : isUnlearned
                        ? '✨ 學習後解鎖基礎效果 (Lv.0 → Lv.1)'
                        : `⬆️ 下一級升級強化預覽 (Lv.${lvl} → Lv.${lvl + 1})`}
                  </div>
                  <div className="text-amber-300 font-semibold">
                    {isMax ? '此技能已修練至最高境界！' : sk.formatPreview(lvl + 1)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
