import React from 'react';
import { HelpCircle } from 'lucide-react';
import { FORMATIONS_CONFIG } from '../../data/formations';
import { HERO_TEMPLATES } from '../../data/heroes';
import { CODEX_MILESTONES, calculateCodexBonus } from '../../utils/codexHelper';
import {
  DEMON_TOWERS,
  TOWER_TYPE_LIST,
  normalizeTowerProgress,
  calculateTowerFloorRewards
} from '../../data/towers';

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

const TOWER_COLOR_STYLES = {
  amber: {
    selectedCard: 'bg-amber-950/40 border-amber-400 ring-1 ring-amber-400',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/50',
    btn: 'bg-amber-600 hover:bg-amber-500'
  },
  purple: {
    selectedCard: 'bg-purple-950/40 border-purple-400 ring-1 ring-purple-400',
    badge: 'bg-purple-500/20 text-purple-300 border-purple-500/50',
    btn: 'bg-purple-600 hover:bg-purple-500'
  },
  emerald: {
    selectedCard: 'bg-emerald-950/40 border-emerald-400 ring-1 ring-emerald-400',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50',
    btn: 'bg-emerald-600 hover:bg-emerald-500'
  },
  cyan: {
    selectedCard: 'bg-cyan-950/40 border-cyan-400 ring-1 ring-cyan-400',
    badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50',
    btn: 'bg-cyan-600 hover:bg-cyan-500'
  },
  rose: {
    selectedCard: 'bg-rose-950/40 border-rose-400 ring-1 ring-rose-400',
    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/50',
    btn: 'bg-rose-600 hover:bg-rose-500'
  }
};

export function TowerTab({
  player,
  towerFloor = 1,
  towerProgress: propTowerProgress,
  selectedTowerType = 'gold',
  setSelectedTowerType,
  isInCombat,
  autoTower,
  handleToggleAutoTower,
  handleStartTowerChallenge
}) {
  const progress = propTowerProgress || normalizeTowerProgress({ ...player, towerFloor });
  const activeType = DEMON_TOWERS[selectedTowerType] ? selectedTowerType : 'gold';
  const activeMeta = DEMON_TOWERS[activeType];
  const currentFloor = progress[activeType] || 1;
  const isBossFloor = currentFloor % 5 === 0;
  const isTenMilestone = currentFloor % 10 === 0;
  const nextBossFloor = Math.ceil(currentFloor / 5) * 5;

  const previewReward = calculateTowerFloorRewards({
    towerType: activeType,
    floor: currentFloor,
    isFirstClear: true
  });

  const colorStyle = TOWER_COLOR_STYLES[activeMeta.themeColor] || TOWER_COLOR_STYLES.amber;

  return (
    <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur space-y-5 max-w-4xl mx-auto">
      {/* 標題與核心規則提示 */}
      <div className="flex flex-wrap justify-between items-center gap-2 border-b border-slate-800 pb-4">
        <div>
          <h2 className="font-extrabold text-amber-400 text-xl">🗼 鎮魔五塔・專精試煉殿</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            五座古塔各自專精產出高階資源與 4★～5★ 神品；<span className="text-rose-300 font-bold">塔內所有戰鬥均不提供經驗值（0 EXP）</span>。
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="bg-slate-950 border border-slate-700 text-purple-300 px-3 py-1.5 rounded-full font-bold">
            🛡️ 裝備防爆符：{player?.antiExplodeScrolls || 0} 張
          </span>
        </div>
      </div>

      {/* 五塔選擇卡片列 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
        {TOWER_TYPE_LIST.map(tKey => {
          const meta = DEMON_TOWERS[tKey];
          const f = progress[tKey] || 1;
          const isSelected = tKey === activeType;
          const style = TOWER_COLOR_STYLES[meta.themeColor] || TOWER_COLOR_STYLES.amber;
          const bossReady = f % 5 === 0;

          return (
            <button
              key={tKey}
              type="button"
              onClick={() => setSelectedTowerType && setSelectedTowerType(tKey)}
              className={`text-left p-3.5 rounded-2xl border transition-all flex flex-col justify-between space-y-2 ${
                isSelected
                  ? style.selectedCard
                  : 'bg-slate-950/90 border-slate-800 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="font-black text-sm text-slate-100">
                  {meta.icon} {meta.shortName}
                </span>
                <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full border ${style.badge}`}>
                  第 {f} 層
                </span>
              </div>
              <div className="text-[11px] text-slate-300 font-bold leading-snug">
                {meta.specialty}
              </div>
              <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
                <span>已通關 {f - 1} 層</span>
                {bossReady && <span className="text-rose-400 font-bold animate-pulse">🔥 首領層</span>}
              </div>
            </button>
          );
        })}
      </div>

      {/* 當前選定挑戰塔詳情面板 */}
      <div className={`p-5 rounded-2xl border space-y-3 ${isBossFloor ? 'bg-rose-950/25 border-rose-600/80' : 'bg-slate-950/90 border-slate-800'}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">{activeMeta.icon}</span>
            <span className={`text-base font-extrabold ${isBossFloor ? 'text-rose-300' : 'text-amber-300'}`}>
              {activeMeta.name}・第 {currentFloor} 層
              {isTenMilestone ? '【十層大關・必出 5★ 傳說】' : isBossFloor ? '【五層首領戰】' : ''}
            </span>
          </div>
          <span className="text-[11px] font-mono bg-slate-900 text-slate-300 px-2.5 py-1 rounded border border-slate-700">
            距離首領層：第 {nextBossFloor} 層 • 經驗獲取：0 EXP
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-300">
          <div className="bg-slate-900/70 border border-slate-800/90 rounded-xl p-3 space-y-1">
            <div className="text-slate-400 font-bold">⚔️ 守軍情報</div>
            <div>• 鎮守敵軍：<span className="text-slate-100 font-bold">{activeMeta.elementHint}</span></div>
            <div>• 里程碑規則：<span className="text-amber-300">{activeMeta.milestoneDesc}</span></div>
          </div>

          <div className="bg-slate-900/70 border border-slate-800/90 rounded-xl p-3 space-y-1">
            <div className="text-slate-400 font-bold">🎁 本層首通預期獎勵</div>
            {activeType === 'gold' && (
              <div>• 金幣產出：<span className="text-amber-300 font-mono font-bold">+{previewReward.gold} 金幣</span></div>
            )}
            {activeType === 'refine' && (
              <div>
                • 煉器素材：<span className="text-cyan-300 font-bold">+{previewReward.refineStones} 精鍊石</span>
                {previewReward.antiExplodeScrolls > 0 && (
                  <span className="text-purple-300 font-bold"> ＋ 裝備防爆符 ×{previewReward.antiExplodeScrolls}</span>
                )}
              </div>
            )}
            {['hero', 'skill', 'equip'].includes(activeType) && (
              <div>
                • 專精掉落星級：
                <span className="text-emerald-300 font-bold">
                  {previewReward.minStar === previewReward.maxStar
                    ? `必出 ${previewReward.minStar}★ 神品`
                    : `${previewReward.minStar}★ ～ ${previewReward.maxStar}★`}
                </span>
                {previewReward.refineStones > 0 && (
                  <span className="text-cyan-300">（附贈 +{previewReward.refineStones} 精鍊石）</span>
                )}
              </div>
            )}
            <div className="text-[11px] text-slate-400">• 戰勝後解鎖第 {currentFloor + 1} 層；重打已通關層領取 38% 基礎收益。</div>
          </div>
        </div>
      </div>

      {/* 操作按鈕區 */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
        <button
          disabled={isInCombat}
          onClick={() => handleStartTowerChallenge(activeType, currentFloor)}
          className={`px-7 py-3.5 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-black rounded-2xl text-sm shadow-xl transition-all ${
            isBossFloor ? 'bg-gradient-to-r from-rose-700 to-amber-600 hover:from-rose-600 hover:to-amber-500' : colorStyle.btn
          }`}
        >
          {isInCombat
            ? '🔒 戰鬥進行中'
            : `${activeMeta.icon} 挑戰【${activeMeta.shortName}】第 ${currentFloor} 層`}
        </button>

        {currentFloor > 1 && (
          <button
            type="button"
            disabled={isInCombat}
            onClick={() => handleStartTowerChallenge(activeType, currentFloor - 1)}
            className="px-4 py-3.5 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-700 font-bold rounded-2xl text-xs transition-all"
            title="重複挑戰已通關的上一層（領取 38% 基礎資源，無 4-5 星首通大獎）"
          >
            🔁 重打第 {currentFloor - 1} 層 (38% 收益)
          </button>
        )}

        <button
          type="button"
          onClick={() => handleToggleAutoTower(activeType)}
          className={`px-5 py-3.5 rounded-2xl font-black text-sm border transition-all flex items-center gap-2 ${
            autoTower
              ? 'bg-cyan-500 border-cyan-300 text-slate-950 shadow-lg shadow-cyan-500/25'
              : 'bg-slate-950 border-slate-700 text-slate-300 hover:border-cyan-500'
          }`}
        >
          <span>{autoTower ? `🤖 自動爬塔（${activeMeta.shortName}）：開啟中` : '🤖 自動爬塔：關閉'}</span>
        </button>
      </div>

      {autoTower && (
        <div className="text-center text-xs text-cyan-300 bg-cyan-950/40 border border-cyan-800/70 rounded-xl py-2 px-3">
          ⚡ 自動爬塔已啟動：點擊挑戰後將自動託管戰鬥，勝利後自動推進【{activeMeta.name}】下一層！
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
