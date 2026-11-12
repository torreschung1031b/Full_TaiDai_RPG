import React from 'react';
import { HelpCircle, X } from 'lucide-react';
import { CLASS_CONFIGS } from '../data/classes';

export default function HelpGuideModal({ helpModalTab, setHelpModalTab }) {
  if (!helpModalTab) return null;

  return (
    <div
      onClick={() => setHelpModalTab(null)}
      className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-w-2xl w-full bg-slate-900 border-2 border-amber-500/70 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl max-h-[85vh] flex flex-col"
      >
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-black text-amber-300">《天外 Online》江湖指南</h3>
          </div>
          <button
            onClick={() => setHelpModalTab(null)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 border-b border-slate-800/80">
          {[
            { id: 'combat', label: '⚔️ 戰鬥與懲罰' },
            { id: 'formation', label: '📐 陣形與站位' },
            { id: 'classes', label: '🎭 五大職業' },
            { id: 'heroes', label: '👥 英雄與戰損' },
            { id: 'equip', label: '🛡️ 裝備與賣出' },
            { id: 'elements', label: '☯️ 五行與狀態' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setHelpModalTab(t.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all ${
                helpModalTab === t.id
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 text-xs text-slate-300 leading-relaxed pr-1">
          {helpModalTab === 'combat' && (
            <>
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1.5">
                <div className="font-bold text-amber-300">1. 主動搜敵與戰鬥鎖定機制</div>
                <p>• 切換地圖後處於「安全營地」，需點擊 <span className="text-amber-300 font-bold">「🔍 尋找怪群」</span> 才會觸發戰鬥。</p>
                <p>• 一旦進入 <span className="text-rose-400 font-bold">「⚔️ 交鋒中」</span>，系統將鎖定更換裝備、調整陣容與站位、切換陣法及回客棧休息。</p>
              </div>
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1.5">
                <div className="font-bold text-rose-400">2. 撤退與戰敗懲罰</div>
                <p>• 戰鬥中可點擊「🏃 撤退逃跑」，有 <span className="text-emerald-400 font-bold">70%</span> 機率脫離戰場；失敗則敵軍會趁勢追擊一輪。</p>
                <p>• 若少俠 HP 歸 0 戰敗，將損失當前升級所需經驗的 <span className="text-rose-400 font-bold">30%</span>（最低扣至 0、不掉等級），並以 1 HP 退回安全營地。</p>
              </div>
            </>
          )}

          {helpModalTab === 'formation' && (
            <>
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1.5">
                <div className="font-bold text-amber-300">1. 3×3 九宮格站位與換位操作</div>
                <p>• 在「👥 英雄隊伍」上方的九宮格陣盤中，可自由調整 <span className="text-amber-300 font-bold">👑 主角</span> 與最多 <span className="text-emerald-300 font-bold">4 位登場英雄</span> 的位置。</p>
                <p>• 點擊任一亮起陣位（亮起金框）後，再點擊另一個有效陣位（含空陣位），即可互換站位。</p>
              </div>
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1.5">
                <div className="font-bold text-cyan-300">2. 前排／中排／後排戰術差異與風水師特權</div>
                <p>• <span className="text-sky-300 font-bold">前排</span>：受擊仇恨最高 (~60%)，物理減傷 <span className="text-emerald-400">+10%</span>，適合坦職幫隊友擋刀。</p>
                <p>• <span className="text-amber-300 font-bold">中排</span>：受擊仇恨中等 (~25%)，行動速度 <span className="text-emerald-400">+10%</span>。</p>
                <p>• <span className="text-purple-300 font-bold">後排</span>：受擊仇恨最低 (~15%)，暴擊與英雄主動技能卡觸發率 <span className="text-emerald-400">+8%</span>。</p>
                <p>• 全遊戲僅 <span className="text-amber-300 font-bold">「☯️ 風水師」</span> 可變換特殊陣法，且所有陣法增益效果 <span className="text-emerald-400 font-bold">2 倍強化</span>。</p>
              </div>
            </>
          )}

          {helpModalTab === 'classes' && (
            <div className="space-y-2">
              {Object.keys(CLASS_CONFIGS).map(k => {
                const c = CLASS_CONFIGS[k];
                return (
                  <div key={k} className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                    <div className="font-bold text-amber-300">{c.icon} {c.title} — <span className="text-emerald-400">{c.passiveName}</span></div>
                    <p className="text-slate-300 mt-0.5">{c.desc}</p>
                    <p className="text-slate-400 text-[11px] mt-0.5">天賦：{c.passiveDesc}</p>
                  </div>
                );
              })}
            </div>
          )}

          {helpModalTab === 'heroes' && (
            <>
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1.5">
                <div className="font-bold text-amber-300">1. 等級上限 Lv.30 與技能樹規則</div>
                <p>• 主角與英雄等級上限皆為 <span className="text-amber-300 font-bold">Lv.30</span>。</p>
                <p>• 主角 3 招技能創角時為 <span className="text-rose-400 font-bold">Lv.0（未學習）</span>，開局贈送 1 SP，升至 Lv.30 共 30 SP 剛好可將三招全點滿至 Lv.10。</p>
              </div>
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1.5">
                <div className="font-bold text-rose-400">2. 英雄陣亡永久扣屬性與技能卡限制</div>
                <p>• 英雄在單場戰鬥 <span className="text-rose-400 font-bold">首次 HP 歸 0</span> 時，會永久隨機扣除 <span className="text-rose-400 font-bold">1–5 點</span> 四維屬性（可透過猛將嘲諷、前排坦護或藥師【九轉還魂丹】復活應對）。</p>
                <p>• 技能卡需符合英雄職業限制，主動／被動槽各 2 格，不可裝備重複同名卡。</p>
              </div>
            </>
          )}

          {helpModalTab === 'equip' && (
            <>
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1.5">
                <div className="font-bold text-amber-300">1. 裝備職業穿戴限制</div>
                <p>• 裝備依材質與兵器分為 <span className="text-sky-300 font-bold">重裝（限猛將）</span>、<span className="text-emerald-300 font-bold">輕裝（猛將/巧匠）</span>、<span className="text-purple-300 font-bold">法袍與法器（術士/藥師/風水師）</span> 及全職通用飾品。</p>
                <p>• 法系職業（如術士）無法穿戴重甲或重兵。</p>
              </div>
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1.5">
                <div className="font-bold text-cyan-300">2. 穿脫轉移與多餘裝備賣出</div>
                <p>• 點擊「裝備上身」後，裝備會從背包移至身上裝備欄（原部位舊裝備自動退回背包）；點擊「📤 除下」則將裝備放回背包。</p>
                <p>• 背包中多餘的裝備可點擊「💰 賣出」換取金幣（含精鍊等級加價），或使用「🧹 一鍵賣出非本職裝備」快速清理白板異職裝備。</p>
              </div>
            </>
          )}

          {helpModalTab === 'elements' && (
            <>
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1.5">
                <div className="font-bold text-amber-300">1. 五行相剋循環</div>
                <p>• <span className="text-amber-300 font-bold">金 ➔ 木 ➔ 土 ➔ 水 ➔ 火 ➔ 金</span></p>
                <p>• 一般職業剋制造成 <span className="text-emerald-400 font-bold">1.5x</span> 傷害（被剋 0.75x）；<span className="text-purple-300 font-bold">術士</span> 擁有【五行靈體】，剋制倍率高達 <span className="text-emerald-400 font-bold">2.0x</span>（被剋放寬為 0.9x）且相剋額外回 15 MP。</p>
              </div>
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                <div className="font-bold text-cyan-300">2. 戰鬥異常與增益圖示</div>
                <p>• <span className="text-emerald-300 font-bold">☠️ 中毒</span>：每回合損失最大生命無視防禦真傷（最高 2 層），且<span className="text-amber-300 font-bold">攻擊力降低 20%</span>。</p>
                <p>• <span className="text-amber-300 font-bold">💔 破甲</span>：大幅降低防禦力 ｜ <span className="text-purple-300 font-bold">🕸️ 致盲</span>：攻擊命中率大幅下降。</p>
                <p>• <span className="text-rose-300 font-bold">🎯 易傷</span>：承受全傷害加深 ｜ <span className="text-orange-300 font-bold">🔥 灼燒</span>：每回合持續火傷。</p>
                <p>• <span className="text-amber-300 font-bold">📢 嘲諷</span>：敵軍 100% 鎖定猛將 ｜ <span className="text-rose-300 font-bold">🔄 反震</span>：減傷並反彈傷害。</p>
              </div>
            </>
          )}
        </div>

        <button
          onClick={() => setHelpModalTab(null)}
          className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs sm:text-sm"
        >
          我已了解，返回遊戲
        </button>
      </div>
    </div>
  );
}
