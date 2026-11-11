import React, { useState } from 'react';
import { 
  User, Layers, Play, ScrollText, Sword, Shield, Sparkles, Shirt, 
  Hammer, Users, Compass, BookOpen, Save, Coffee, RefreshCw, Trash2
} from 'lucide-react';

import { TIER_CONFIG, HERO_TEMPLATES } from './data/heroes';
import { EQUIP_SLOTS, GEMS_DB } from './data/equipment';
import { JOBS_CONFIG, PROTAGONIST_SKILLS_DB } from './data/skills';
import { SKILL_CARDS_DB } from './App';

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

const HeroResourceBar = ({ hero }) => {
  const { job, heroClass, rage = 0, ammo = 6, maxAmmo = 6, mp = 50, maxMp = 100 } = hero;
  const cls = job || heroClass;

  if (cls === '猛將') {
    const ragePercent = Math.min(100, Math.max(0, (rage / 100) * 100));
    return (
      <div className="mt-1.5">
        <div className="flex justify-between text-[11px] text-orange-400 mb-0.5">
          <span>🔥 怒氣</span>
          <span className="font-mono">{rage} / 100</span>
        </div>
        <div className="w-full bg-slate-950 rounded-full h-1.5 border border-orange-950 overflow-hidden">
          <div className="bg-gradient-to-r from-orange-600 to-red-500 h-full transition-all duration-300" style={{ width: `${ragePercent}%` }} />
        </div>
      </div>
    );
  }

  if (cls === '巧匠') {
    const ammoPercent = Math.min(100, Math.max(0, (ammo / maxAmmo) * 100));
    return (
      <div className="mt-1.5">
        <div className="flex justify-between text-[11px] text-yellow-400 mb-0.5">
          <span>⚙️ 彈藥</span>
          <span className="font-mono">{ammo} / {maxAmmo}</span>
        </div>
        <div className="w-full bg-slate-950 rounded-full h-1.5 border border-yellow-950 overflow-hidden">
          <div className="bg-gradient-to-r from-amber-500 to-yellow-300 h-full transition-all duration-300" style={{ width: `${ammoPercent}%` }} />
        </div>
      </div>
    );
  }

  const mpPercent = Math.min(100, Math.max(0, (mp / maxMp) * 100));
  return (
    <div className="mt-1.5">
      <div className="flex justify-between text-[11px] text-cyan-400 mb-0.5">
        <span>💧 MP (凝神)</span>
        <span className="font-mono">{mp} / {maxMp}</span>
      </div>
      <div className="w-full bg-slate-950 rounded-full h-1.5 border border-blue-950 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-cyan-400 h-full transition-all duration-300" style={{ width: `${mpPercent}%` }} />
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
    setHeroRoster,
    activeHeroes,
    activeHeroInstanceIds,
    handleToggleDeployHero,
    handleReleaseHero,
    currentFormation,
    setCurrentFormation,
    equipmentInventory,
    setEquipmentInventory,
    skillCardsInventory,
    setSkillCardsInventory,
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

  const [allocatedInputs, setAllocatedInputs] = useState({ str: 0, int: 0, con: 0, agi: 0 });
  const [selectedHeroForSkills, setSelectedHeroForSkills] = useState(null);
  const [inventorySubTab, setInventorySubTab] = useState('equip');

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
                      <div className="text-[10px] text-slate-400 mt-0.5">{hero.heroClass} · {hero.element}</div>
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
  const totalAllocated = (allocatedInputs.str || 0) + (allocatedInputs.int || 0) + (allocatedInputs.con || 0) + (allocatedInputs.agi || 0);

  const handleApplyStatAllocation = () => {
    if (totalAllocated > player.statPoints) return;
    setPlayer(prev => ({
      ...prev,
      statPoints: prev.statPoints - totalAllocated,
      stats: {
        str: prev.stats.str + (allocatedInputs.str || 0),
        int: prev.stats.int + (allocatedInputs.int || 0),
        con: prev.stats.con + (allocatedInputs.con || 0),
        agi: prev.stats.agi + (allocatedInputs.agi || 0)
      }
    }));
    setAllocatedInputs({ str: 0, int: 0, con: 0, agi: 0 });
  };

  // 分離已登場與未登場英雄列表
  const deployedHeroesList = heroRoster.filter(h => activeHeroInstanceIds.includes(h.instanceId));
  const reserveHeroesList = heroRoster.filter(h => !activeHeroInstanceIds.includes(h.instanceId));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
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

      <main className="flex-1 max-w-7xl w-full mx-auto p-4">

        {/* 1. 戰鬥遭遇頁籤 */}
        {activeTab === 'combat' && (
          <div className="space-y-4">
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

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl">
              <div className="flex justify-between items-center mb-3 border-b border-slate-800 pb-2">
                <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                  🛡️ 我方出戰隊伍 <span className="text-xs font-normal text-slate-400">({1 + activeHeroes.length} / 5 人登場)</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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

                  <div>
                    <div className="flex justify-between text-[11px] mb-0.5">
                      <span className="text-slate-400">HP</span>
                      <span className="font-mono text-slate-200">{player.hp} / {playerTotalMaxHp}</span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                      <div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${Math.max(0, (player.hp / playerTotalMaxHp) * 100)}%` }} />
                    </div>
                  </div>

                  <HeroResourceBar hero={{ ...player, maxMp: playerTotalMaxMp }} />
                </div>

                {activeHeroes.map((hero, idx) => {
                  const isFainted = hero.hp <= 0;
                  const hpPct = Math.max(0, Math.min(100, (hero.hp / hero.maxHp) * 100));
                  const expPct = Math.max(0, Math.min(100, (hero.exp / hero.maxExp) * 100));
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
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <div className="font-bold text-slate-100 text-sm">{hero.name} <span className="text-xs text-amber-400">Lv.{hero.level}</span></div>
                          <div className="text-xs text-slate-400">{hero.heroClass} · Tier {hero.tier}</div>
                        </div>
                        <span className={`text-[11px] px-2 py-0.5 rounded border font-semibold ${elemStyle}`}>
                          {hero.element}
                        </span>
                      </div>

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

                      <div className="mt-1">
                        <div className="w-full bg-slate-950 rounded-full h-1 overflow-hidden border border-slate-800">
                          <div className="bg-purple-500 h-full transition-all duration-300" style={{ width: `${expPct}%` }} />
                        </div>
                      </div>

                      {!isFainted && <HeroResourceBar hero={hero} />}

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
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-lg font-bold text-amber-400">⚡ 主角屬性自由配點</h2>
                <p className="text-xs text-slate-400">每次升級固定獲得 7 點自由屬性點。</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400">當前可用餘額:</span>
                <div className="text-amber-400 font-bold text-lg font-mono">{player.statPoints} 點</div>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { key: 'str', name: '力量 (STR)', desc: '+3 攻擊力' },
                { key: 'int', name: '智力 (INT)', desc: '+10 魔法 MP' },
                { key: 'con', name: '體質 (CON)', desc: '+16 生命 HP, +1 防禦' },
                { key: 'agi', name: '敏捷 (AGI)', desc: '+1 速度與暴擊' }
              ].map(stat => {
                const currentVal = player.stats[stat.key];
                const inputVal = allocatedInputs[stat.key] || 0;

                return (
                  <div key={stat.key} className="bg-slate-800 p-3 rounded-lg border border-slate-700 flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <div className="font-bold text-xs text-slate-200">{stat.name}</div>
                      <div className="text-[10px] text-slate-400">{stat.desc}</div>
                      <div className="text-xs font-mono text-amber-300 mt-1">目前點數: {currentVal}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max={player.statPoints}
                        value={inputVal}
                        onChange={(e) => {
                          const val = Math.max(0, Math.min(player.statPoints, parseInt(e.target.value) || 0));
                          setAllocatedInputs(prev => ({ ...prev, [stat.key]: val }));
                        }}
                        className="w-20 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-center font-mono text-amber-400 text-sm focus:outline-none focus:border-amber-500"
                      />
                      <button
                        onClick={() => {
                          const maxPossible = player.statPoints - (totalAllocated - inputVal);
                          setAllocatedInputs(prev => ({ ...prev, [stat.key]: Math.max(0, maxPossible) }));
                        }}
                        className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 text-xs font-bold rounded border border-amber-500/40"
                      >
                        MAX
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-xs text-slate-400">已擬定分配總和: <span className="text-amber-300 font-bold font-mono">{totalAllocated}</span> / {player.statPoints}</span>
              <button
                disabled={totalAllocated <= 0 || totalAllocated > player.statPoints}
                onClick={handleApplyStatAllocation}
                className="bg-amber-500 disabled:bg-slate-800 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2 rounded-lg text-xs transition-all shadow"
              >
                確認注入屬性點
              </button>
            </div>
          </div>
        )}

        {/* 3. 技能樹頁籤 */}
        {activeTab === 'skills' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-2xl mx-auto space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-lg font-bold text-amber-400">🌿 主角職業技能樹 ({player.job})</h2>
                <p className="text-xs text-slate-400">消耗升級獲得的 SP 點數解鎖與升級專屬招式。</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400">剩餘技能點 (SP):</span>
                <div className="text-purple-400 font-bold text-lg font-mono">{player.sp} 點</div>
              </div>
            </div>

            <div className="space-y-3">
              {currentJobSkills.map((sk, idx) => {
                const lvl = player.skillLevels[idx] || 0;
                return (
                  <div key={sk.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="font-bold text-sm text-slate-100 flex items-center gap-2">
                        {sk.name} <span className="text-xs text-purple-300 font-mono">Lv.{lvl} / 5</span>
                      </div>
                      <div className="text-xs text-slate-400">{sk.desc}</div>
                      <div className="text-[10px] text-slate-500 font-mono">消耗: {sk.cost} {sk.costType.toUpperCase()}</div>
                    </div>

                    <button
                      disabled={player.sp <= 0 || lvl >= 5}
                      onClick={() => {
                        if (player.sp > 0 && lvl < 5) {
                          const newLvls = [...player.skillLevels];
                          newLvls[idx] = (newLvls[idx] || 0) + 1;
                          setPlayer(prev => ({ ...prev, sp: prev.sp - 1, skillLevels: newLvls }));
                        }
                      }}
                      className="bg-purple-600 disabled:bg-slate-800 hover:bg-purple-500 text-white font-bold px-4 py-2 rounded-lg text-xs transition-all shadow"
                    >
                      {lvl === 0 ? '解鎖技能 (-1 SP)' : lvl >= 5 ? '已滿級' : '升級 (-1 SP)'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 4. 裝備背包頁籤 */}
        {activeTab === 'inventory' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-amber-400">🎒 裝備與背包庫</h2>
              <div className="flex gap-2">
                {['equip', 'skillCard', 'mat'].map(sub => (
                  <button
                    key={sub}
                    onClick={() => setInventorySubTab(sub)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      inventorySubTab === sub
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {sub === 'equip' ? '裝備列表' : sub === 'skillCard' ? '英雄技能卡' : '材料物品'}
                  </button>
                ))}
              </div>
            </div>

            {inventorySubTab === 'equip' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {equipmentInventory.map(eq => (
                  <div key={eq.uid} className="bg-slate-800 p-3 rounded-lg border border-slate-700 space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="font-bold text-xs text-amber-300">{eq.name} {eq.refineLevel > 0 && `+${eq.refineLevel}`}</div>
                      <span className="text-[10px] text-slate-400 font-mono">{eq.slot}</span>
                    </div>
                    <div className="text-[10px] text-slate-400">{eq.desc}</div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setPlayer(prev => ({
                            ...prev,
                            equipped: { ...prev.equipped, [eq.slot]: eq }
                          }));
                        }}
                        className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 py-1 rounded text-xs font-bold"
                      >
                        穿戴給少俠
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {inventorySubTab === 'skillCard' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {skillCardsInventory.map((card, idx) => (
                  <div key={idx} className="bg-slate-800 p-3 rounded-lg border border-purple-500/40 space-y-1">
                    <div className="flex justify-between items-center font-bold text-xs text-purple-300">
                      <span>{card.icon} {card.name}</span>
                      <span className="text-[10px] text-slate-400">{card.type.toUpperCase()}</span>
                    </div>
                    <div className="text-xs text-slate-300">{card.desc}</div>
                  </div>
                ))}
              </div>
            )}

            {inventorySubTab === 'mat' && (
              <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm text-cyan-300">💎 精鍊石 (Refine Stone)</div>
                  <div className="text-xs text-slate-400">用於鐵匠鋪強化裝備等階與鍛造。</div>
                </div>
                <div className="text-lg font-mono font-bold text-cyan-400">{player.refineStones} 顆</div>
              </div>
            )}
          </div>
        )}

        {/* 5. 鐵匠精鍊頁籤 */}
        {activeTab === 'blacksmith' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-xl mx-auto space-y-4">
            <h2 className="text-lg font-bold text-amber-400">🔨 鐵匠精鍊鍛造</h2>
            <p className="text-xs text-slate-400">選擇已有裝備消耗精鍊石與金幣強化屬性 (最高 +10)。</p>

            <div className="space-y-3">
              {equipmentInventory.map(eq => (
                <div key={eq.uid} className="bg-slate-800 p-3 rounded-lg border border-slate-700 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-xs text-amber-300">{eq.name} +{eq.refineLevel || 0}</div>
                    <div className="text-[10px] text-slate-400">消耗: 100 金幣 + 1 精鍊石</div>
                  </div>
                  <button
                    disabled={player.gold < 100 || player.refineStones < 1 || (eq.refineLevel || 0) >= 10}
                    onClick={() => {
                      setPlayer(prev => ({ ...prev, gold: prev.gold - 100, refineStones: prev.refineStones - 1 }));
                      setEquipmentInventory(prev => prev.map(item => item.uid === eq.uid ? { ...item, refineLevel: (item.refineLevel || 0) + 1 } : item));
                    }}
                    className="bg-amber-500 disabled:bg-slate-800 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded text-xs"
                  >
                    強化 +1
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. 陣法頁籤 */}
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

        {/* 7. 英雄隊伍頁籤 (全新雙區塊重構: 已登場 vs 未登場庫存 + 放走英雄) */}
        {activeTab === 'squad' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-lg font-bold text-amber-400">👥 英雄隊伍管理與放走處置</h2>
                <p className="text-xs text-slate-400">管理已登場主力與客棧庫存英雄 (登場上限 4 人)。</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400">已登場隊員:</span>
                <div className="text-emerald-400 font-bold text-lg font-mono">{deployedHeroesList.length} / 4</div>
              </div>
            </div>

            {/* ⚔️ 第一部份：已登場英雄列表 (Deployed Heroes) */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                ⚔️ 已登場隊伍英雄 ({deployedHeroesList.length} 人)
              </h3>

              {deployedHeroesList.length === 0 ? (
                <div className="bg-slate-800/40 border border-slate-800 p-4 rounded-xl text-center text-slate-500 text-xs">
                  目前尚未派遣任何英雄登場，請從下方未登場名冊選擇英雄登場。
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {deployedHeroesList.map(hero => {
                    const activeCards = hero.activeSkillSlots || [];
                    const passiveCards = hero.passiveSkillSlots || [];

                    return (
                      <div key={hero.instanceId} className="bg-slate-800 p-4 rounded-xl border border-emerald-500/50 space-y-3 shadow-md relative">
                        <span className="absolute -top-2 -right-2 bg-emerald-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full shadow">
                          已登場
                        </span>
                        
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-bold text-sm text-slate-100">{hero.name} <span className="text-xs text-amber-400 font-mono">Lv.{hero.level}</span></div>
                            <div className="text-xs text-slate-400">{hero.heroClass} · Tier {hero.tier}</div>
                          </div>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${ELEMENTS[hero.element]?.badge || ''}`}>
                            {hero.element}
                          </span>
                        </div>

                        {/* 技能卡槽展示 */}
                        <div className="space-y-1.5 text-xs bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                          <div className="text-[10px] text-purple-300 font-bold">主動技能卡槽 (最多 2 個):</div>
                          <div className="text-slate-300 truncate">{activeCards.map(c => c.name).join(', ') || '無裝配'}</div>
                          <div className="text-[10px] text-blue-300 font-bold mt-1">被動技能卡槽 (最多 2 個):</div>
                          <div className="text-slate-300 truncate">{passiveCards.map(c => c.name).join(', ') || '無裝配'}</div>

                          <button
                            onClick={() => setSelectedHeroForSkills(hero)}
                            className="w-full mt-2 bg-purple-900/60 hover:bg-purple-800 text-purple-200 border border-purple-700 py-1 rounded text-[11px] font-bold"
                          >
                            ⚙️ 裝配 / 替換技能卡
                          </button>
                        </div>

                        <button
                          onClick={() => handleToggleDeployHero(hero)}
                          className="w-full py-1.5 rounded text-xs font-bold bg-amber-900/60 hover:bg-amber-800 text-amber-200 border border-amber-700 transition-all"
                        >
                          📥 卸下登場 (回到客棧)
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 🛖 第二部份：未登場英雄列表 / 客棧庫存 (Reserve Heroes) */}
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                🛖 未登場客棧名冊 ({reserveHeroesList.length} 人)
              </h3>

              {reserveHeroesList.length === 0 ? (
                <div className="bg-slate-800/40 border border-slate-800 p-4 rounded-xl text-center text-slate-500 text-xs">
                  客棧中目前沒有備用英雄。可在戰鬥勝利或鎮魔塔中獲得新英雄卡片！
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {reserveHeroesList.map(hero => {
                    return (
                      <div key={hero.instanceId} className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-bold text-sm text-slate-100">{hero.name} <span className="text-xs text-amber-400 font-mono">Lv.{hero.level}</span></div>
                            <div className="text-xs text-slate-400">{hero.heroClass} · Tier {hero.tier}</div>
                          </div>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${ELEMENTS[hero.element]?.badge || ''}`}>
                            {hero.element}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-400 bg-slate-900/40 p-2 rounded border border-slate-800 font-mono">
                          <div>ATK: {hero.atk} | DEF: {hero.def}</div>
                          <div>HP: {hero.hp} / {hero.maxHp}</div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleToggleDeployHero(hero)}
                            className="flex-1 py-1.5 rounded text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all"
                          >
                            ⚔️ 派遣登場
                          </button>
                          
                          <button
                            onClick={() => handleReleaseHero(hero)}
                            className="px-3 py-1.5 rounded text-xs font-bold bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 flex items-center justify-center gap-1 transition-all"
                            title="放走英雄"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> 放走
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}

        {/* 8. 鎮魔塔頁籤 */}
        {activeTab === 'tower' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-xl mx-auto space-y-4 text-center">
            <h2 className="text-xl font-bold text-amber-400">🏰 太古鎮魔塔</h2>
            <div className="text-xs text-slate-400">挑戰連續層數 Boss，逢 5/10 層保證掉落稀有英雄技能卡！</div>
            <div className="text-3xl font-black text-amber-300 font-mono my-3">第 {towerFloor} 層</div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setTowerFloor(prev => prev + 1);
                  setPlayer(prev => ({ ...prev, gold: prev.gold + 300, refineStones: prev.refineStones + 2 }));
                  setSkillCardsInventory(prev => [...prev, SKILL_CARDS_DB[Math.floor(Math.random() * SKILL_CARDS_DB.length)]]);
                }}
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 rounded-xl text-xs shadow"
              >
                ⚔️ 挑戰本層守衛
              </button>
              <button
                onClick={() => {
                  setPlayer(prev => ({ ...prev, gold: prev.gold + (towerFloor * 100) }));
                }}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-3 rounded-xl text-xs"
              >
                🧹 一鍵掃蕩
              </button>
            </div>
          </div>
        )}

        {/* 9. 圖鑑成就頁籤 */}
        {activeTab === 'codex' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-amber-400">📖 圖鑑與成就系統</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                <h3 className="font-bold text-sm text-amber-300 mb-2">🏆 已獲得英雄全集 ({heroRoster.length})</h3>
                <div className="text-xs text-slate-300 space-y-1">
                  {heroRoster.map(h => (
                    <div key={h.instanceId}>• 【{h.name}】 {h.heroClass} · Tier {h.tier} (Lv.{h.level})</div>
                  ))}
                </div>
              </div>
              <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                <h3 className="font-bold text-sm text-cyan-300 mb-2">🎯 全隊天賦常駐加成</h3>
                <div className="text-xs text-slate-300 space-y-1">
                  <div>• 解鎖 3 位英雄: 全隊攻擊力 +5%</div>
                  <div>• 突破鎮魔塔 10 層: 全隊護甲 +10%</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 10. 存檔管理頁籤 */}
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

      {/* 技能卡裝配彈窗 */}
      {selectedHeroForSkills && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-amber-400">⚙️ 為【{selectedHeroForSkills.name}】裝配技能卡</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {skillCardsInventory.map((card, idx) => (
                <div key={idx} className="bg-slate-800 p-2.5 rounded-lg border border-slate-700 flex justify-between items-center">
                  <div>
                    <div className="font-bold text-xs text-purple-300">{card.icon} {card.name}</div>
                    <div className="text-[10px] text-slate-400">{card.desc}</div>
                  </div>
                  <button
                    onClick={() => {
                      setHeroRoster(prev => prev.map(h => {
                        if (h.instanceId !== selectedHeroForSkills.instanceId) return h;
                        if (card.type === 'active') {
                          const slots = h.activeSkillSlots || [];
                          return { ...h, activeSkillSlots: [...slots.slice(0, 1), card] };
                        } else {
                          const slots = h.passiveSkillSlots || [];
                          return { ...h, passiveSkillSlots: [...slots.slice(0, 1), card] };
                        }
                      }));
                      setSelectedHeroForSkills(null);
                    }}
                    className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-3 py-1 rounded text-xs"
                  >
                    裝配至技能槽
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => setSelectedHeroForSkills(null)}
              className="w-full bg-slate-800 text-slate-300 font-bold py-2 rounded-xl text-xs"
            >
              關閉彈窗
            </button>
          </div>
        </div>
      )}

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
              {victorySummary.skillCard && (
                <div className="text-purple-300 font-bold mt-1">
                  🔮 獲得英雄技能卡: 【{victorySummary.skillCard.name}】！
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
