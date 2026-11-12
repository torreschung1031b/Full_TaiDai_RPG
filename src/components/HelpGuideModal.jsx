import React from 'react';
import { X, BookOpen } from 'lucide-react';

const GUIDE_TABS = [
  { id: 'combat', label: '⚔️ 戰鬥與暴擊色彩' },
  { id: 'equip', label: '🛡️ 裝備五階與鍛造' },
  { id: 'elements', label: '☯️ 五行與陣法站位' },
  { id: 'heroes', label: '👥 英雄與技能卡' },
  { id: 'tower', label: '🗼 鎮魔塔與圖鑑' }
];

export default function HelpGuideModal({ helpModalTab, setHelpModalTab }) {
  if (!helpModalTab) return null;

  const activeGuide = GUIDE_TABS.some(t => t.id === helpModalTab) ? helpModalTab : 'combat';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-amber-500/50 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* 標題列 */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <h3 className="font-extrabold text-amber-400 text-base sm:text-lg">📜 《天外 Online》江湖指南</h3>
          </div>
          <button
            onClick={() => setHelpModalTab(null)}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-800 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 分頁標籤 */}
        <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex gap-1.5 overflow-x-auto shrink-0">
          {GUIDE_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setHelpModalTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeGuide === tab.id
                  ? 'bg-amber-600 text-slate-950 font-black shadow'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 內容區 */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
          {activeGuide === 'combat' && (
            <>
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="font-bold text-amber-300">1. 回合指令與資源循環</div>
                <p>
                  每回合可選擇<strong>「普通攻擊」</strong>（積攢職業資源：猛將 +25怒氣、巧匠 +4彈藥、其餘職業 +20MP）或施放 <strong>3 招職業技能</strong>（需先在「✨ 技能樹」消耗 SP 學習）。
                </p>
                <p className="text-slate-400 text-xs">
                  • 野外遭遇戰有 <strong>25% 機率出現「🔥精英」變異怪</strong>；若戰況危急可點擊「撤退逃跑」（65% 機率脫離戰場）。
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="font-bold text-amber-300">2. 戰鬥數值高亮與暴擊色彩圖例</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                  <div className="bg-amber-500/20 border border-amber-400 text-amber-200 px-3 py-1.5 rounded-lg font-bold">
                    💥 琥珀金框：我方暴擊傷害
                  </div>
                  <div className="bg-cyan-950 border border-cyan-700 text-cyan-200 px-3 py-1.5 rounded-lg font-bold">
                    亮青色數字：我方普通傷害
                  </div>
                  <div className="bg-rose-600/40 border border-rose-400 text-rose-100 px-3 py-1.5 rounded-lg font-bold">
                    💢 深紅警報框：敵方暴擊傷害
                  </div>
                  <div className="bg-rose-950 border border-rose-800 text-rose-300 px-3 py-1.5 rounded-lg font-bold">
                    玫紅色數字：敵方普通傷害
                  </div>
                  <div className="bg-emerald-950 border border-emerald-600 text-emerald-200 px-3 py-1.5 rounded-lg font-bold">
                    +翡翠綠數字：氣血治療與資源回復
                  </div>
                  <div className="bg-sky-950 border border-sky-500 text-sky-200 px-3 py-1.5 rounded-lg font-bold">
                    🛡️天藍色數字：護盾吸收傷害
                  </div>
                </div>
              </div>
            </>
          )}

          {activeGuide === 'equip' && (
            <>
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="font-bold text-amber-300">1. 裝備五階（Tier 1 ～ Tier 5）與職業限制</div>
                <ul className="space-y-1.5 text-xs">
                  <li>• <span className="text-slate-200 font-bold">[T1 凡鐵]</span>：創角時配發的職業專屬新手武器與入門防具（0 寶石孔）。</li>
                  <li>• <span className="text-emerald-300 font-bold">[T2 精鋼]</span>：初階～中階野外地圖掉落，附帶 1 個寶石孔。</li>
                  <li>• <span className="text-sky-300 font-bold">[T3 玄鐵]</span>：進階地圖與鎮魔塔產出，附帶 1～2 孔與套裝共鳴。</li>
                  <li>• <span className="text-purple-300 font-bold">[T4 靈寶]</span>：高難度地圖與鎮魔塔首領產出，標配 2 個寶石孔。</li>
                  <li>• <span className="text-amber-300 font-bold">[T5 仙器]</span>：版本頂級神裝，僅限鎮魔塔第 20 層以上首領或天工神兵匣獲得。</li>
                </ul>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="font-bold text-amber-300">2. 鐵匠精鍊與四象寶石鑲嵌</div>
                <p className="text-xs">
                  • <strong>精鍊強化</strong>：每級提升基礎屬性 <strong>+15%</strong>。<strong>+0 至 +3 成功率 100%</strong>；<strong>+4 起成功率 65%，失敗精鍊等級倒扣 1 級</strong>。
                </p>
                <p className="text-xs">
                  • <strong>四種寶石</strong>：每孔花費 100 金幣可自由鑲嵌或替換：<strong>赤炎紅寶石 (+15攻)</strong>、<strong>滄海藍寶石 (+30內)</strong>、<strong>青木翡翠 (+80血)</strong>、<strong>玄武黃玉 (+10防)</strong>。
                </p>
              </div>
            </>
          )}

          {activeGuide === 'elements' && (
            <>
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="font-bold text-amber-300">1. 五行生剋倍率</div>
                <p className="text-xs">
                  相剋循環：<strong>金 ➔ 木 ➔ 土 ➔ 水 ➔ 火 ➔ 金</strong>。
                </p>
                <p className="text-xs">
                  • 屬性相剋時造成 <strong>1.30x</strong> 傷害（<strong>術士</strong>受【五行靈體】天賦加成提升至 <strong>1.45x</strong> 並額外回復 +15 MP）；被剋制時傷害降至 <strong>0.75x</strong>。
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="font-bold text-amber-300">2. 九宮陣法與前後排仇恨</div>
                <p className="text-xs">
                  • <strong>前排</strong>受擊仇恨最高並享有物理減傷；<strong>中排</strong>攻守均衡；<strong>後排</strong>仇恨最低並獲得速度加成，適合放置脆皮輸出與治療。
                </p>
                <p className="text-xs">
                  • 唯有<strong>「風水師」</strong>可切換特殊陣法，且發動【奇門陣眼】使所有陣法加成數值 <strong>×2 倍強化</strong>。
                </p>
              </div>
            </>
          )}

          {activeGuide === 'heroes' && (
            <>
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="font-bold text-amber-300">1. 英雄招募與重傷瀕死懲罰</div>
                <p className="text-xs">
                  • 最多可同時派遣 <strong>4 位不同名英雄</strong>與主角並肩作戰。
                </p>
                <p className="text-xs text-rose-300">
                  • ⚠️ <strong>瀕死懲罰</strong>：若英雄在戰鬥中 HP 歸零重傷，每場戰鬥首次倒下將<strong>永久扣除該英雄部分基礎屬性</strong>，請善用前排坦位與藥師治療保護隊友。
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="font-bold text-amber-300">2. 英雄技能卡裝配</div>
                <p className="text-xs">
                  • 每位英雄可裝備最多 <strong>2 張主動技能卡</strong>（戰鬥中依機率自動觸發）與 <strong>2 張被動技能卡</strong>（永久強化屬性），須符合英雄對應職業方可裝配。
                </p>
              </div>
            </>
          )}

          {activeGuide === 'tower' && (
            <>
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="font-bold text-amber-300">1. 鎮魔塔層數推進與每 5 層首領</div>
                <p className="text-xs">
                  • 必須<strong>實際擊敗當前層數守衛</strong>才算通關並推進至下一層，同時刷新最高通關紀錄。
                </p>
                <p className="text-xs">
                  • <strong>每逢第 5、10、15、20… 層</strong>為「鎮守妖王首領戰」，妖王具備全體順劈「狂暴橫掃」與高暴擊率，擊敗後 <strong>100% 必掉高階神裝、技能卡與多顆精鍊石</strong>！
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="font-bold text-amber-300">2. 天外英雄大圖鑑</div>
                <p className="text-xs">
                  • 累計收錄 <strong>3 / 6 / 10 / 15 位</strong>不同英雄時，將永久解鎖主角攻擊、生命、防禦與行動速度百分比加成。
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
