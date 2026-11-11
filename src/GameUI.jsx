import React from 'react';
import { 
  User, Layers, Play, ScrollText, Sword, Shield, Sparkles, Shirt, 
  Hammer, Users, Compass, BookOpen, Save, Coffee, RefreshCw, Crosshair 
} from 'lucide-react';

import { TIER_CONFIG, HERO_TEMPLATES } from './data/heroes';
import { EQUIP_SLOTS, GEMS_DB } from './data/equipment';
import { JOBS_CONFIG, PROTAGONIST_SKILLS_DB } from './data/skills';

const ELEMENTS = {
  '金': { name: '金', icon: '⚔️', counters: '木', color: 'text-amber-300 bg-amber-950/40 border-amber-500/50', badge: 'bg-amber-500 text-slate-950', border: 'border-amber-500/50' },
  '木': { name: '木', icon: '🌿', counters: '土', color: 'text-emerald-400 bg-emerald-950/40 border-emerald-500/50', badge: 'bg-emerald-500 text-slate-950', border: 'border-emerald-500/50' },
  '水': { name: '水', icon: '💧', counters: '火', color: 'text-cyan-400 bg-cyan-950/40 border-cyan-500/50', badge: 'bg-cyan-500 text-slate-950', border: 'border-cyan-500/50' },
  '火': { name: '火', icon: '🔥', counters: '金', color: 'text-rose-400 bg-rose-950/40 border-rose-500/50', badge: 'bg-rose-500 text-slate-950', border: 'border-rose-500/50' },
  '土': { name: '土', icon: '🪨', counters: '水', color: 'text-yellow-600 bg-yellow-950/40 border-yellow-600/50', badge: 'bg-yellow-600 text-slate-950', border: 'border-yellow-600/50' }
};

const ZONES = [
  { id: 'z1', name: '新手竹林 (Lvl.1-4)' },
  { id: 'z2', name: '黑山寨 (Lvl.5-9)' },
  { id: 'z3', name: '火雲洞 (Lvl.10-14)' },
  { id: 'z4', name: '蓬萊仙島 (Lvl.15+)' }
];

const FORMATIONS_CONFIG = {
  'none': { name: '無陣法', desc: '標準自由站位，無額外陣法增益。', icon: '⚪' },
  'tianfu': { name: '天覆陣', desc: '天罡護體！全隊護甲 +20%，受到傷害 -10%。', icon: '🛡️' },
  'dizai': { name: '地載陣', desc: '厚德載物！全隊生命上限 +15%，格擋率 +15%。', icon: '🏔️' },
  'bagua': { name: '八卦陣', desc: '陰陽迴轉！五行法術傷害 +15%，速度 +15%。', icon: '☯️' },
  'fengshi': { name: '鋒矢陣', desc: '如箭離弦！全隊物理攻擊 +25%，暴擊率 +10%。', icon: '🏹' }
};

// 職業資源渲染子組件
const HeroResourceBar = ({ hero }) => {
  const { job, rage = 0, ammo = 6, maxAmmo = 6, mp = 50, maxMp = 100 } = hero;

  if (job === '猛將') {
    const ragePercent = Math.min(100, Math.max(0, (rage / 100) * 100));
    return (
      <div className="mt-1.5">
        <div className="flex justify-between text-[11px] text-orange-400 mb-0.5">
          <span>🔥 怒氣</span>
          <span className="font-mono">{rage} / 100</span>
        </div>
        <div className="w-full bg-slate-950 rounded-full h-1.5 border border-orange-950 overflow-hidden">
          <div
            className="bg-gradient-to-r from-orange-600 to-red-500 h-full transition-all duration-300"
            style={{ width: `${ragePercent}%` }}
          />
        </div>
      </div>
    );
  }

  if (job === '巧匠') {
    const ammoPercent = Math.min(100, Math.max(0, (ammo / maxAmmo) * 100));
    return (
      <div className="mt-1.5">
        <div className="flex justify-between text-[11px] text-yellow-400 mb-0.5">
          <span>⚙️ 彈藥</span>
          <span className="font-mono">{ammo} / {maxAmmo}</span>
        </div>
        <div className="w-full bg-slate-950 rounded-full h-1.5 border border-yellow-950 overflow-hidden">
          <div
            className="bg-gradient-to-r from-amber-500 to-yellow-300 h-full transition-all duration-300"
            style={{ width: `${ammoPercent}%` }}
          />
        </div>
      </div>
    );
  }

  // 法系 (術士 / 藥師 / 風水師)
  const mpPercent = Math.min(100, Math.max(0, (mp / maxMp) * 100));
  return (
    <div className="mt-1.5">
      <div className="flex justify-between text-[11px] text-cyan-400 mb-0.5">
        <span>💧 MP (凝神)</span>
        <span className="font-mono">{mp} / {maxMp}</span>
      </div>
      <div className="w-full bg-slate-950 rounded-full h-1.5 border border-blue-950 overflow-hidden">
        <div
          className="bg-gradient-to-r from-blue-600 to-cyan-400 h-full transition-all duration-300"
          style={{ width: `${mpPercent}%` }}
        />
      </div>
    </div>
  );
};

export default function GameUI(props) {
  const {
    gameStarted,
    creationData,
    setCreationData,
    starterHeroCandidates,
    handleStartGame,
    player,
    setPlayer,
    playerTotalMaxHp,
    playerTotalMaxMp,
    playerTotalAtk,
    playerTotalDef,
    heroRoster,
    activeHeroes,
    activeHeroInstanceIds,
    handleToggleDeployHero,
    currentFormation,
    setCurrentFormation,
    equipmentInventory,
    setEquipmentInventory,
    towerFloor,
    setTowerFloor,
    activeTab,
    setActiveTab,
    currentZoneIndex,
    setCurrentZoneIndex,
    monsters,
    selectedTargetIndex,
    setSelectedTargetIndex,
    combatLogs,
    handleExecuteRound,
    spawnEncounter,
    victorySummary,
    setVictorySummary,
    handleRestInn,
    jsonSaveText,
    setJsonSaveText,
    saveLoadStatus,
    handleExportSave,
    handleImportSave
  } = props;

  // 創角畫面
  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-black bg-gradient-to-r from-amber-400 via-orange-300 to-yellow-500 bg-clip-text text-transparent">
              ⚔️ 天外 Online
            </h1>
            <p className="text-slate-400 text-xs mt-1">經典文字 RPG 仙俠傳奇 (React + Vite + Tailwind)</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">少俠姓名</label>
              <input
                type="text"
                value={creationData.name}
                onChange={(e) => setCreationData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="輸入大名..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">五行屬性</label>
                <div className="grid grid-cols-5 gap-1">
                  {Object.keys(ELEMENTS).map(elem => (
                    <button
                      key={elem}
                      onClick={() => setCreationData(prev => ({ ...prev, element: elem }))}
                      className={`py-1.5 text-xs font-bold rounded border transition-all ${
                        creationData.element === elem
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                      }`}
                    >
                      {elem}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">初始職業</label>
                <select
                  value={creationData.job}
                  onChange={(e) => setCreationData(prev => ({ ...prev, job: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-amber-500"
                >
                  {Object.keys(JOBS_CONFIG).map(j => (
                    <option key={j} value={j}>{j}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">選擇 Starter 伴隨英雄 (3選1)</label>
              <div className="grid grid-cols-3 gap-2">
                {starterHeroCandidates.map((hero) => {
                  const isSelected = creationData.selectedStarterHero?.instanceId === hero.instanceId;
                  return (
                    <div
                      key={hero.instanceId}
                      onClick={() => setCreationData(prev => ({ ...prev, selectedStarterHero: hero }))}
                      className={`cursor-pointer p-3 rounded-lg border text-center transition-all ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/50'
                          : 'bg-slate-800/60 border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      <div className="font-bold text-sm text-slate-100">{hero.name}</div>
                      <div className="text-xs text-amber-400 mt-1">{hero.title}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{hero.job} · {hero.element}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              onClick={handleStartGame}
              className="w-full mt-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold py-3 rounded-xl shadow-lg transition-all transform active:scale-95"
            >
              🚀 踏入天外天，開啟傳奇之旅
            </button>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'combat', label: '戰鬥遭遇', icon: Sword },
    { id: 'attributes', label: '屬性配點', icon: User },
    { id: 'skills', label: '技能樹', icon: Sparkles },
    { id: 'inventory', label: '裝備背包', icon: Shirt },
    { id: 'blacksmith', label: '鐵匠精鍊', icon: Hammer },
    { id: 'formation', label: '陣法五行', icon: Layers },
    { id: 'squad', label: '英雄隊伍', icon: Users },
    { id: 'tower', label: '鎮魔塔', icon: Compass },
    { id: 'codex', label: '圖鑑成就', icon: BookOpen },
    { id: 'save', label: '存檔管理', icon: Save }
  ];

  const currentJobSkills = PROTAGONIST_SKILLS_DB[player.job] || [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* 頂部玩家資訊列 */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 py-3 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-black bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
              《天外 Online》
            </h1>
            <div className="flex items-center gap-2 text-xs bg-slate-800 px-2.5 py-1 rounded-full border border-slate-700">
              <span className="font-bold text-slate-200">{player.name}</span>
              <span className="text-amber-400">Lv.{player.level} {player.job}</span>
              <span className={`px-1.5 py-0.2 rounded font-bold text-[10px] ${ELEMENTS[player.element]?.badge || ''}`}>
                {player.element}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div>💰 金幣: <span className="text-amber-400 font-bold">{player.gold}</span></div>
            <div>💎 精鍊石: <span className="text-cyan-400 font-bold">{player.refineStones}</span></div>
            <button
              onClick={handleRestInn}
              className="flex items-center gap-1 bg-indigo-900/60 hover:bg-indigo-800 border border-indigo-700 px-2.5 py-1 rounded text-indigo-200 transition-all"
            >
              <Coffee className="w-3.5 h-3.5" /> 客棧休息
            </button>
          </div>
        </div>
      </header>

      {/* 導覽頁籤列 */}
      <nav className="bg-slate-900/80 border-b border-slate-800 px-4 py-2 overflow-x-auto">
        <div className="max-w-7xl mx-auto flex items-center gap-1 min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* 主要內容區域 */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4">

        {/* 1. 戰鬥遭遇頁籤 */}
        {activeTab === 'combat' && (
          <div className="space-y-4">

            {/* 區域選擇與探索 */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 p-3 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-400">當前地圖:</span>
                <select
                  value={currentZoneIndex}
                  onChange={(e) => {
                    const idx = parseInt(e.target.value);
                    setCurrentZoneIndex(idx);
                    spawnEncounter(idx);
                  }}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1 text-xs text-amber-400 font-bold focus:outline-none"
                >
                  {ZONES.map((z, i) => (
                    <option key={z.id} value={i}>{z.name}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => spawnEncounter(currentZoneIndex)}
                className="flex items-center gap-1 bg-amber-500 hover:bg-amber-400 text-slate-950 px-3 py-1 rounded-lg text-xs font-bold transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" /> 尋找敵人
              </button>
            </div>

            {/* 敵方怪群面板 */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
              <h3 className="text-sm font-bold text-rose-400 mb-3 flex items-center gap-1">
                👹 敵方陣容 <span className="text-xs text-slate-500">({monsters.filter(m => m.hp > 0).length} 隻存活)</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {monsters.map((m, idx) => {
                  const isAlive = m.hp > 0;
                  const isTarget = selectedTargetIndex === idx;
                  const hpPct = Math.max(0, (m.hp / m.maxHp) * 100);
                  return (
                    <div
                      key={m.id}
                      onClick={() => isAlive && setSelectedTargetIndex(idx)}
                      className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                        !isAlive
                          ? 'bg-slate-950/40 border-slate-900 opacity-40 grayscale'
                          : isTarget
                          ? 'bg-rose-950/30 border-rose-500 ring-2 ring-rose-500/50'
                          : 'bg-slate-800/60 border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      <div className="flex justify-between items-start text-xs mb-1">
                        <span className="font-bold text-slate-200">{m.name}</span>
                        <span className={`text-[10px] px-1 rounded font-bold ${ELEMENTS[m.element]?.badge || ''}`}>
                          {m.element}
                        </span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-rose-500 h-full transition-all duration-300" style={{ width: `${hpPct}%` }} />
                      </div>
                      <div className="text-[10px] text-right font-mono text-slate-400 mt-1">
                        {m.hp} / {m.maxHp}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 🛡️ 我方出戰隊伍全員狀態面板 (全新調整) */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl">
              <div className="flex justify-between items-center mb-3 border-b border-slate-800 pb-2">
                <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                  🛡️ 我方出戰隊伍 <span className="text-xs font-normal text-slate-400">({1 + activeHeroes.length} / 5 人登場)</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* 1. 主角面板 */}
                <div className="p-3 rounded-lg border bg-slate-800/90 border-amber-500/50 shadow-md relative">
                  <span className="absolute -top-2 -left-2 bg-amber-500 text-slate-950 text-[10px] font-black px-1.5 py-0.5 rounded shadow">
                    少俠 (隊長)
                  </span>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-bold text-slate-100 text-sm">{player.name} <span className="text-xs text-slate-400">Lv.{player.level}</span></div>
                      <div className="text-xs text-amber-400">{player.job}</div>
                    </div>
                    <span className={`text-[11px] px-2 py-0.5 rounded border font-semibold ${ELEMENTS[player.element]?.color || ''}`}>
                      {player.element}
                    </span>
                  </div>

                  {/* HP 條 */}
                  <div>
                    <div className="flex justify-between text-[11px] mb-0.5">
                      <span className="text-slate-400">HP</span>
                      <span className="font-mono text-slate-200">{player.hp} / {playerTotalMaxHp}</span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                      <div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${Math.max(0, (player.hp / playerTotalMaxHp) * 100)}%` }} />
                    </div>
                  </div>

                  {/* 主角職業動態資源條 */}
                  <HeroResourceBar hero={{ ...player, maxMp: playerTotalMaxMp }} />
                </div>

                {/* 2. 登場英雄面板群 */}
                {activeHeroes.map((hero, idx) => {
                  const isFainted = hero.hp <= 0;
                  const hpPct = Math.max(0, Math.min(100, (hero.hp / hero.maxHp) * 100));
                  const elemStyle = ELEMENTS[hero.element]?.color || 'border-slate-700 text-slate-300 bg-slate-800';

                  return (
                    <div
                      key={hero.instanceId || idx}
                      className={`relative p-3 rounded-lg border transition-all ${
                        isFainted
                          ? 'bg-red-950/20 border-red-900/40 opacity-60 grayscale'
                          : 'bg-slate-800/80 border-slate-700 shadow-md hover:border-slate-500'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-bold text-slate-100 text-sm">{hero.name} <span className="text-xs text-slate-400">Lv.{hero.level}</span></div>
                          <div className="text-xs text-slate-400">{hero.job}</div>
                        </div>
                        <span className={`text-[11px] px-2 py-0.5 rounded border font-semibold ${elemStyle}`}>
                          {hero.element}
                        </span>
                      </div>

                      {/* HP 條 */}
                      <div>
                        <div className="flex justify-between text-[11px] mb-0.5">
                          <span className="text-slate-400">HP</span>
                          <span className={`font-mono ${isFainted ? 'text-red-500 font-bold' : 'text-slate-200'}`}>
                            {hero.hp} / {hero.maxHp}
                          </span>
                        </div>
                        <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                          <div
                            className={`h-full transition-all duration-300 ${
                              hpPct > 50 ? 'bg-emerald-500' : hpPct > 20 ? 'bg-yellow-500' : 'bg-red-600'
                            }`}
                            style={{ width: `${hpPct}%` }}
                          />
                        </div>
                      </div>

                      {/* 英雄專屬職業資源條 */}
                      {!isFainted && <HeroResourceBar hero={hero} />}

                      {/* 倒下標籤 */}
                      {isFainted && (
                        <div className="mt-2 text-center text-[10px] font-bold text-red-400 bg-red-950/60 py-0.5 rounded border border-red-800">
                          ☠️ 已倒下
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 操作控制與技能發動區 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-400">回合指令發動</h4>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleExecuteRound({ type: 'attack' })}
                    className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 px-4 rounded-lg text-xs shadow transition-all"
                  >
                    🗡️ 普通攻擊 (積攢資源)
                  </button>

                  <button
                    onClick={() => handleExecuteRound({}, true)}
                    className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 px-4 rounded-lg text-xs shadow transition-all"
                  >
                    ✨ 主僕合擊奧義
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                  {currentJobSkills.map((sk, idx) => (
                    <button
                      key={sk.id}
                      onClick={() => handleExecuteRound({ type: 'skill', skill: sk, skillIdx: idx })}
                      className="bg-slate-800 hover:bg-slate-750 border border-slate-700 p-2 rounded-lg text-left transition-all"
                    >
                      <div className="font-bold text-xs text-amber-300">{sk.name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{sk.desc}</div>
                      <div className="text-[10px] text-slate-500 mt-1 font-mono">
                        消耗: {sk.cost} {sk.costType.toUpperCase()}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 戰況日誌 */}
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex flex-col h-64">
                <h4 className="text-xs font-bold text-slate-400 mb-2 flex items-center gap-1">
                  <ScrollText className="w-3.5 h-3.5" /> 戰況日誌
                </h4>
                <div className="flex-1 overflow-y-auto space-y-1 pr-1 font-mono text-[11px]">
                  {combatLogs.map(log => (
                    <div key={log.id} className="text-slate-300 leading-tight">
                      <span className="text-slate-600">[{log.turn}T]</span> {log.text}
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* 2. 屬性配點頁籤 */}
        {activeTab === 'attributes' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-xl mx-auto space-y-4">
            <h2 className="text-lg font-bold text-amber-400">⚡ 屬性配點</h2>
            <div className="text-xs text-slate-400">剩餘可分配點數: <span className="text-amber-400 font-bold text-sm">{player.statPoints}</span></div>
            <div className="space-y-3">
              {[
                { key: 'str', name: '力量 (STR)', desc: '+3 攻擊力' },
                { key: 'int', name: '智力 (INT)', desc: '+10 魔法 MP' },
                { key: 'con', name: '體質 (CON)', desc: '+16 生命 HP, +1 防禦' },
                { key: 'agi', name: '敏捷 (AGI)', desc: '+1 速度與暴擊' }
              ].map(stat => (
                <div key={stat.key} className="flex items-center justify-between bg-slate-800 p-3 rounded-lg border border-slate-700">
                  <div>
                    <div className="font-bold text-xs text-slate-200">{stat.name}</div>
                    <div className="text-[10px] text-slate-400">{stat.desc}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-amber-400 text-sm">{player.stats[stat.key]}</span>
                    <button
                      disabled={player.statPoints <= 0}
                      onClick={() => {
                        if (player.statPoints > 0) {
                          setPlayer(prev => ({
                            ...prev,
                            statPoints: prev.statPoints - 1,
                            stats: { ...prev.stats, [stat.key]: prev.stats[stat.key] + 1 }
                          }));
                        }
                      }}
                      className="w-7 h-7 bg-amber-500 disabled:bg-slate-700 text-slate-950 rounded-md font-bold text-xs flex items-center justify-center hover:bg-amber-400"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. 陣法頁籤 */}
        {activeTab === 'formation' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-2xl mx-auto space-y-4">
            <h2 className="text-lg font-bold text-amber-400">☯️ 陣法五行</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(FORMATIONS_CONFIG).map(([key, form]) => (
                <div
                  key={key}
                  onClick={() => setCurrentFormation(key)}
                  className={`cursor-pointer p-4 rounded-xl border transition-all ${
                    currentFormation === key
                      ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/50'
                      : 'bg-slate-800/60 border-slate-700 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-sm text-slate-100">
                    <span>{form.icon}</span> {form.name}
                  </div>
                  <div className="text-xs text-slate-400 mt-2">{form.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. 英雄隊伍頁籤 */}
        {activeTab === 'squad' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-amber-400">👥 英雄隊伍管理</h2>
              <span className="text-xs text-slate-400">登場佇列: {activeHeroes.length} / 4</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {heroRoster.map(hero => {
                const isDeployed = activeHeroInstanceIds.includes(hero.instanceId);
                return (
                  <div key={hero.instanceId} className="bg-slate-800 p-3 rounded-lg border border-slate-700 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-sm text-slate-100">{hero.name}</div>
                        <div className="text-xs text-slate-400">{hero.job} · {hero.title}</div>
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${ELEMENTS[hero.element]?.badge || ''}`}>
                        {hero.element}
                      </span>
                    </div>
                    <button
                      onClick={() => handleToggleDeployHero(hero)}
                      className={`w-full py-1.5 rounded text-xs font-bold transition-all ${
                        isDeployed
                          ? 'bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      }`}
                    >
                      {isDeployed ? '卸下登場' : '派遣登場'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 5. 存檔管理頁籤 */}
        {activeTab === 'save' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-xl mx-auto space-y-4">
            <h2 className="text-lg font-bold text-amber-400">💾 存檔管理</h2>
            <textarea
              rows={6}
              value={jsonSaveText}
              onChange={(e) => setJsonSaveText(e.target.value)}
              placeholder="在此粘貼或讀取 JSON 存檔..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-xs font-mono text-slate-200 focus:outline-none"
            />
            <div className="flex gap-2">
              <button
                onClick={handleExportSave}
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2 rounded-lg text-xs"
              >
                匯出存檔
              </button>
              <button
                onClick={handleImportSave}
                className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 rounded-lg text-xs"
              >
                匯入存檔
              </button>
            </div>
            {saveLoadStatus && <div className="text-xs font-bold text-amber-300 text-center">{saveLoadStatus}</div>}
          </div>
        )}

      </main>

      {/* 戰利品 Modal */}
      {victorySummary && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 text-center">
            <h3 className="text-2xl font-black text-amber-400">🏆 戰鬥勝利！</h3>
            <div className="space-y-1 text-xs text-slate-300">
              <div>💰 獲得金幣: +{victorySummary.gold}</div>
              <div>✨ 獲得經驗: +{victorySummary.exp}</div>
              <div>💎 獲得精鍊石: +{victorySummary.stones}</div>
              {victorySummary.hero && (
                <div className="text-amber-300 font-bold mt-2">
                  🎉 獲得新英雄卡片: 【{victorySummary.hero.name}】！
                </div>
              )}
            </div>
            <button
              onClick={() => {
                setVictorySummary(null);
                spawnEncounter(currentZoneIndex);
              }}
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs"
            >
              確定收下並繼續戰鬥
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
