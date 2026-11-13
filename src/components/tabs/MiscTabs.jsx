import React from 'react';
import { HelpCircle } from 'lucide-react';
import { FORMATIONS_CONFIG } from '../../data/formations';
import { HERO_TEMPLATES } from '../../data/heroes';
import { CODEX_MILESTONES, calculateCodexBonus } from '../../utils/codexHelper';

export function FormationsTab({
  isFengShui,
  isInCombat,
  currentFormation,
  handleSelectFormation,
  setHelpModalTab
}) {
  return (
    <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur space-y-4 max-w-4xl mx-auto">
      <div className="flex flex-wrap justify-between items-center gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div>
            <h2 className="font-extrabold text-amber-400 text-lg">☯️ 陣法與五行機制</h2>
            <p className="text-xs text-slate-400 mt-0.5">五行相剋：金剋木 → 木剋土 → 土剋水 → 水剋火 → 火剋金</p>
          </div>
          <button onClick={() => setHelpModalTab('elements')} className="text-slate-400 hover:text-amber-300 transition-colors" title="查看五行相剋與狀態說明">
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
        {!isFengShui ? (
          <span className="text-xs bg-rose-950 text-rose-300 border border-rose-700 px-3 py-1 rounded-full font-bold">🔒 僅限「風水師」職業可變換陣法</span>
        ) : isInCombat ? (
          <span className="text-xs text-rose-400 font-bold">🔒 戰鬥中鎖定陣法切換</span>
        ) : (
          <span className="text-xs bg-emerald-950 text-emerald-300 border border-emerald-700 px-3 py-1 rounded-full font-bold">✨ 【奇門陣眼】啟動：所有陣法增益 2 倍強化！</span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Object.keys(FORMATIONS_CONFIG).map(fKey => {
          const canClick = isFengShui && !isInCombat;
          const isSelected = currentFormation === fKey;
          return (
            <div
              key={fKey}
              onClick={() => handleSelectFormation(fKey)}
              className={`p-4 rounded-2xl border transition-all ${canClick ? 'cursor-pointer hover:border-amber-500/60' : 'cursor-not-allowed opacity-65'} ${isSelected ? 'bg-amber-950/40 border-amber-400 ring-1 ring-amber-400' : 'bg-slate-950 border-slate-800'}`}
            >
              <div className="font-bold text-amber-300 text-sm flex justify-between items-center">
                <span>{FORMATIONS_CONFIG[fKey].icon} {FORMATIONS_CONFIG[fKey].name}</span>
                {!isFengShui && fKey !== 'none' && <span className="text-[10px] text-rose-400 font-bold">🔒 限風水師</span>}
              </div>
              <div className="text-xs text-slate-400 mt-1">{FORMATIONS_CONFIG[fKey].desc}</div>
              {isFengShui && fKey !== 'none' && (
                <div className="text-[11px] text-emerald-400 font-bold mt-1.5">☯️ 風水師倍增生效中：所有陣法加成數值 ×2！</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function TowerTab({
  towerFloor,
  towerBestFloor,
  isInCombat,
  autoTower,
  handleToggleAutoTower,
  handleStartTowerChallenge
}) {
  const isBossFloor = towerFloor % 5 === 0;
  const nextBossFloor = Math.ceil(towerFloor / 5) * 5;
  const expectedTierText =
    towerFloor >= 20 ? 'Tier 4 靈寶 ～ Tier 5 仙器' :
    towerFloor >= 11 ? 'Tier 3 玄鐵 ～ Tier 4 靈寶' :
    towerFloor >= 5 ? 'Tier 2 精鋼 ～ Tier 3 玄鐵' : 'Tier 1 凡鐵 ～ Tier 2 精鋼';

  return (
    <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur space-y-5 max-w-2xl mx-auto">
      <div className="flex flex-wrap justify-between items-center gap-2 border-b border-slate-800 pb-4">
        <div>
          <h2 className="font-extrabold text-amber-400 text-xl">🗼 鎮魔塔試煉（目前：第 {towerFloor} 層）</h2>
          <p className="text-xs text-slate-400 mt-0.5">實際擊敗本層守衛後方可晉升下一層；每 5 層鎮守首領必掉高階神兵！</p>
        </div>
        <span className="text-xs font-mono font-bold bg-slate-950 text-emerald-300 border border-emerald-700/60 px-3 py-1.5 rounded-full">
          🏆 最高通關紀錄：第 {Math.max(0, towerBestFloor - 1)} 層
        </span>
      </div>

      <div className={`p-5 rounded-2xl border space-y-2.5 ${isBossFloor ? 'bg-rose-950/30 border-rose-600/80' : 'bg-slate-950/90 border-slate-800'}`}>
        <div className="flex items-center justify-between">
          <span className={`text-sm font-extrabold ${isBossFloor ? 'text-rose-300' : 'text-amber-300'}`}>
            {isBossFloor ? `🔥 第 ${towerFloor} 層・鎮守妖王首領戰（BOSS）` : `⚔️ 第 ${towerFloor} 層・鎮魔塔守衛戰（距離首領層：第 ${nextBossFloor} 層）`}
          </span>
          <span className="text-[11px] font-mono bg-slate-900 text-slate-300 px-2.5 py-0.5 rounded border border-slate-700">
            難度倍率 ×{(1.2 * (1 + (towerFloor - 1) * 0.25)).toFixed(1)}
          </span>
        </div>

        <div className="text-xs text-slate-300 space-y-1 leading-relaxed">
          <div>• 產出裝備階級：<span className="text-amber-300 font-bold">{expectedTierText}</span></div>
          <div>
            • 通關獎勵：
            {isBossFloor
              ? <span className="text-emerald-300 font-bold">100% 必掉高階神裝 ＋ 100% 必掉技能卡 ＋ 額外 {2 + Math.floor(towerFloor / 5)} 顆精鍊石</span>
              : <span>35% 機率掉落裝備、40% 機率掉落技能卡，並解鎖第 {towerFloor + 1} 層</span>}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
        <button
          disabled={isInCombat}
          onClick={handleStartTowerChallenge}
          className={`px-7 py-3.5 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-black rounded-2xl text-sm shadow-xl transition-all ${isBossFloor ? 'bg-gradient-to-r from-rose-700 to-amber-600 hover:from-rose-600 hover:to-amber-500' : 'bg-amber-600 hover:bg-amber-500'}`}
        >
          {isInCombat ? '🔒 戰鬥進行中' : isBossFloor ? `🔥 迎戰第 ${towerFloor} 層鎮守首領` : `⚔️ 挑戰第 ${towerFloor} 層守衛`}
        </button>

        <button
          type="button"
          onClick={handleToggleAutoTower}
          className={`px-5 py-3.5 rounded-2xl font-black text-sm border transition-all flex items-center gap-2 ${autoTower ? 'bg-cyan-500 border-cyan-300 text-slate-950 shadow-lg shadow-cyan-500/25' : 'bg-slate-950 border-slate-700 text-slate-300 hover:border-cyan-500'}`}
        >
          <span>{autoTower ? '🤖 自動爬塔：開啟中' : '🤖 自動爬塔：關閉'}</span>
        </button>
      </div>

      {autoTower && (
        <div className="text-center text-xs text-cyan-300 bg-cyan-950/40 border border-cyan-800/70 rounded-xl py-2 px-3">
          ⚡ 自動爬塔已啟動：點擊挑戰後將自動託管戰鬥，每層勝利短暫結算後自動進入下一層！
        </div>
      )}
    </div>
  );
}

export function CodexTab({ heroRoster }) {
  const codexBonus = calculateCodexBonus(heroRoster);
  const pct = Math.min(100, Math.round((codexBonus.unlockedCount / Math.max(1, codexBonus.totalCount)) * 100));

  return (
    <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur space-y-5 max-w-4xl mx-auto">
      <div className="flex flex-wrap justify-between items-center gap-2 border-b border-slate-800 pb-3">
        <div>
          <h2 className="font-extrabold text-amber-400 text-lg">📖 天外英雄大圖鑑</h2>
          <p className="text-xs text-slate-400 mt-0.5">收錄不同英雄即可永久解鎖主角全屬性里程碑加成</p>
        </div>
        <span className="text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3.5 py-1.5 rounded-full">
          圖鑑收錄進度：{codexBonus.unlockedCount} / {codexBonus.totalCount} ({pct}%)
        </span>
      </div>

      <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
          <div className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {CODEX_MILESTONES.map(m => {
            const achieved = codexBonus.unlockedCount >= m.count;
            return (
              <div
                key={m.count}
                className={`px-3 py-2 rounded-xl border flex items-center justify-between ${achieved ? 'bg-emerald-950/40 border-emerald-600/60 text-emerald-300 font-bold' : 'bg-slate-900/60 border-slate-800 text-slate-500'}`}
              >
                <span>{achieved ? '✅' : '🔒'} {m.label}</span>
                <span>{m.bonusText}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {HERO_TEMPLATES.map(tmp => {
          const unlocked = heroRoster.some(h => h.baseId === tmp.id_base);
          return (
            <div key={tmp.id_base} className={`p-3 rounded-2xl border text-xs ${unlocked ? 'bg-slate-950 border-amber-400 text-amber-300 font-bold' : 'bg-slate-950/40 opacity-40 border-slate-800'}`}>
              {tmp.icon} {unlocked ? tmp.name : '???'} (Tier {tmp.tier} • {tmp.heroClass})
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function SaveLoadTab({
  isInCombat,
  saveLoadStatus,
  jsonSaveText,
  setJsonSaveText,
  handleExportSave,
  handleImportSave,
  handleResetSave
}) {
  return (
    <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 space-y-4 shadow-2xl backdrop-blur max-w-4xl mx-auto">
      <h2 className="font-extrabold text-amber-400 text-lg">💾 存檔管理與 JSON 導出</h2>
      <div className="flex flex-wrap gap-3">
        <button onClick={handleExportSave} className="bg-amber-600 hover:bg-amber-500 text-white px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm">
          匯出 JSON 存檔
        </button>
        <button
          disabled={isInCombat}
          onClick={handleImportSave}
          className="bg-cyan-700 hover:bg-cyan-600 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm"
        >
          {isInCombat ? '🔒 戰鬥中鎖定讀檔' : '讀取 JSON 存檔'}
        </button>
        <button onClick={handleResetSave} className="bg-rose-800 hover:bg-rose-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm ml-auto">
          重置所有紀錄
        </button>
      </div>
      {saveLoadStatus && <div className="text-xs text-emerald-400 font-mono">{saveLoadStatus}</div>}
      <textarea
        value={jsonSaveText}
        onChange={(e) => setJsonSaveText(e.target.value)}
        className="w-full h-44 bg-slate-950/90 border border-slate-800 rounded-2xl p-4 text-xs font-mono text-emerald-400 focus:outline-none focus:border-amber-500"
      />
    </div>
  );
}
