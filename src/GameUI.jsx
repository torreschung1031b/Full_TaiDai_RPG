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

const ELEMENT_KEYS = ['金', '木', '水', '火', '土'];
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
    activeHeroes,
    activeHeroInstanceIds,
    heroRoster,
    setHeroRoster,
    handleToggleDeployHero,
    monsters,
    selectedTargetIndex,
    setSelectedTargetIndex,
    combatLogs,
    activeTab,
    setActiveTab,
    currentZoneIndex,
    setCurrentZoneIndex,
    spawnEncounter,
    handleExecuteRound,
    equipmentInventory,
    setEquipmentInventory,
    handleRefineEquipment,
    handleSocketGem,
    currentFormation,
    setCurrentFormation,
    towerFloor,
    setTowerFloor,
    jsonSaveText,
    setJsonSaveText,
    saveLoadStatus,
    handleExportSave,
    handleImportSave,
    handleResetSave,
    victorySummary,
    setVictorySummary,
    chatEndRef
  } = props;

  // 1. 創角畫面
  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-amber-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-4xl w-full bg-slate-900/90 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md relative z-10 space-y-6 ring-1 ring-amber-500/20">
          <div className="text-center space-y-2 border-b border-slate-800/80 pb-5">
            <h1 className="text-3xl sm:text-4xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-600 drop-shadow">
              《天外 Online》文字 RPG
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">4 英雄陣列 • 5-15 動態怪群 • 本命五行相剋系統</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-amber-400 tracking-wider flex items-center gap-1.5">
                <User className="w-4 h-4 text-amber-400" /> 1. 少俠創建與本命五行
              </h3>

              <div>
                <label className="text-xs text-slate-400 block mb-1">少俠姓名</label>
                <input
                  type="text"
                  value={creationData.name}
                  onChange={(e) => setCreationData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-4 py-2.5 text-amber-200 focus:outline-none focus:border-amber-500 font-bold text-sm shadow-inner"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1.5">選擇本命五行</label>
                <div className="grid grid-cols-5 gap-2">
                  {ELEMENT_KEYS.map(eKey => {
                    const elem = ELEMENTS[eKey];
                    const isSelected = creationData.element === eKey;
                    return (
                      <button
                        key={eKey}
                        type="button"
                        onClick={() => setCreationData(prev => ({ ...prev, element: eKey }))}
                        className={`py-2 rounded-xl border text-center font-bold text-xs transition-all flex flex-col items-center justify-center space-y-0.5 ${
                          isSelected ? 'bg-amber-600 text-slate-950 border-amber-400 ring-2 ring-amber-400/50 shadow-lg scale-105' : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/40'
                        }`}
                      >
                        <span className="text-sm">{elem.icon}</span>
                        <span>{elem.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1.5">選擇職業</label>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {Object.keys(JOBS_CONFIG).map(jKey => {
                    const job = JOBS_CONFIG[jKey];
                    const isSelected = creationData.job === jKey;
                    return (
                      <button
                        key={jKey}
                        type="button"
                        onClick={() => setCreationData(prev => ({ ...prev, job: jKey }))}
                        className={`w-full text-left p-3 rounded-2xl border transition-all ${
                          isSelected ? 'bg-amber-950/60 border-amber-400 ring-2 ring-amber-400/50 shadow-md' : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="font-bold text-xs text-amber-300 flex justify-between">
                          <span>{job.icon} {job.title}</span>
                          <span className="text-slate-400 text-[10px]">基礎 HP: {job.baseHp}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1 leading-relaxed">{job.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold text-amber-400 tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-amber-400" /> 2. 選擇首位夥伴 (3選1)
              </h3>
              <div className="space-y-3">
                {starterHeroCandidates.map(hero => {
                  const isSelected = creationData.selectedStarterHero?.baseId === hero.baseId;
                  const elemInfo = ELEMENTS[hero.element];
                  return (
                    <button
                      key={hero.instanceId || hero.baseId}
                      type="button"
                      onClick={() => setCreationData(prev => ({ ...prev, selectedStarterHero: hero }))}
                      className={`w-full text-left p-4 rounded-2xl border transition-all ${
                        isSelected ? 'bg-amber-950/60 border-amber-400 ring-2 ring-amber-400/50 shadow-lg scale-[1.02]' : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-bold text-sm text-amber-300 flex items-center justify-between">
                        <span>{hero.icon} {hero.name}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${elemInfo?.badge}`}>
                          {elemInfo?.icon} {hero.element}屬性
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">{hero.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80">
            <button
              type="button"
              onClick={handleStartGame}
              className="w-full bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black py-4 rounded-2xl shadow-xl shadow-amber-950/50 transition-all flex items-center justify-center space-x-2 text-base active:scale-[0.99]"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>踏入天外世界 • 開始遊戲</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. 主畫面
  const classSkills = PROTAGONIST_SKILLS_DB[player.job] || [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      {/* 頂部 Header */}
      <header className="bg-slate-900/90 border-b border-slate-800/80 p-3 sm:p-4 px-6 flex flex-wrap justify-between items-center gap-3 backdrop-blur shadow-lg sticky top-0 z-20">
        <div className="flex items-center space-x-3">
          <span className="font-extrabold text-amber-400 text-base sm:text-lg tracking-wide">{player.name} <span className="text-slate-400 font-normal text-xs">(Lv.{player.level} {player.advancement || player.job})</span></span>
          <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${ELEMENTS[player.element]?.border} ${ELEMENTS[player.element]?.color}`}>
            {ELEMENTS[player.element]?.icon} {player.element}本命
          </span>
        </div>
        <div className="flex items-center space-x-4 sm:space-x-6 text-xs sm:text-sm font-semibold font-mono">
          <span className="text-rose-400 flex items-center gap-1">❤️ HP: {player.hp}/{playerTotalMaxHp}</span>
          {player.job === '猛將' ? (
            <span className="text-amber-400 font-bold">🔥 怒氣: {player.rage}/100</span>
          ) : player.job === '巧匠' ? (
            <span className="text-amber-400 font-bold">🏹 彈藥: {player.ammo}/{player.maxAmmo}</span>
          ) : (
            <span className="text-cyan-400 flex items-center gap-1">💧 MP: {player.mp}/{playerTotalMaxMp}</span>
          )}
          <span className="text-amber-300 flex items-center gap-1">💰 金幣: {player.gold}</span>
          <span className="text-cyan-300 flex items-center gap-1">💎 精鍊石: {player.refineStones}</span>
        </div>
      </header>

      {/* 完整的 10 個導覽頁籤 Navbar */}
      <nav className="bg-slate-900/40 border-b border-slate-800/80 flex justify-center space-x-1.5 p-2 backdrop-blur overflow-x-auto">
        {[
          { id: 'combat', label: '⚔️ 戰鬥遭遇' },
          { id: 'character', label: '👤 屬性配點' },
          { id: 'skills', label: '✨ 技能樹' },
          { id: 'equip', label: '🛡️ 裝備背包' },
          { id: 'forge', label: '🔨 鐵匠精鍊' },
          { id: 'formations', label: '☯️ 陣法五行' },
          { id: 'heroes', label: `👥 英雄隊伍 (${activeHeroes.length}/4)` },
          { id: 'tower', label: '🗼 鎮魔塔' },
          { id: 'codex', label: '📖 圖鑑成就' },
          { id: 'saveload', label: '💾 存檔管理' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === tab.id ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/40 ring-1 ring-amber-400' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* 主頁面內容區 */}
      <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
        {/* 1. 戰鬥遭遇 */}
        {activeTab === 'combat' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 bg-slate-900/80 border border-slate-800/80 rounded-3xl p-5 sm:p-6 flex flex-col justify-between shadow-2xl backdrop-blur">
              <div>
                <div className="flex flex-wrap justify-between items-center gap-2 mb-5 pb-3 border-b border-slate-800/60">
                  <div className="flex gap-2 overflow-x-auto">
                    {ZONES.map((zone, zIdx) => (
                      <button
                        key={zone.id}
                        onClick={() => { setCurrentZoneIndex(zIdx); spawnEncounter(zIdx); }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          currentZoneIndex === zIdx ? 'bg-amber-600 text-white shadow' : 'bg-slate-950/60 text-slate-400 border border-slate-800'
                        }`}
                      >
                        {zone.name}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => spawnEncounter(currentZoneIndex)} className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-md transition-all">
                    ⚔️ 尋找怪群 (5~15隻)
                  </button>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5 max-h-72 overflow-y-auto p-1">
                  {monsters.map((m, idx) => {
                    const isDead = m.hp <= 0;
                    const isSelected = selectedTargetIndex === idx && !isDead;
                    const elemInfo = ELEMENTS[m.element];
                    return (
                      <div
                        key={m.id}
                        onClick={() => !isDead && setSelectedTargetIndex(idx)}
                        className={`p-3 rounded-2xl border text-center cursor-pointer transition-all shadow-md ${
                          isDead ? 'opacity-30 bg-slate-950 border-slate-800' : isSelected ? 'border-amber-400 bg-amber-950/40 ring-2 ring-amber-400/60 scale-105' : 'border-slate-800/80 bg-slate-950/60 hover:border-slate-700'
                        }`}
                      >
                        <div className="text-xs font-bold truncate text-slate-200">{m.name}</div>
                        <div className={`text-[10px] ${elemInfo?.color.split(' ')[0]} font-bold mt-1`}>
                          {elemInfo?.icon} {m.element}
                        </div>
                        <div className="text-[10px] text-rose-400 font-mono mt-1">HP {m.hp}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-slate-800/80 space-y-3">
                <div className="grid grid-cols-4 gap-2">
                  <button onClick={() => handleExecuteRound(false)} className="bg-rose-700 hover:bg-rose-600 text-white py-3 rounded-2xl font-bold text-xs sm:text-sm shadow-lg transition-all active:scale-95">
                    普通攻擊
                  </button>
                  {classSkills.slice(0, 2).map((sk) => (
                    <button key={sk.id} onClick={() => handleExecuteRound(false)} className="bg-cyan-700 hover:bg-cyan-600 text-white py-3 rounded-2xl font-bold text-xs sm:text-sm shadow-lg transition-all active:scale-95">
                      {sk.name}
                    </button>
                  ))}
                  <button onClick={() => handleExecuteRound(true)} className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-slate-950 font-black py-3 rounded-2xl text-xs sm:text-sm shadow-lg transition-all active:scale-95">
                    ⚡ 全軍合擊
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 bg-slate-900/80 border border-slate-800/80 rounded-3xl p-5 flex flex-col shadow-2xl backdrop-blur">
              <h3 className="font-extrabold text-amber-400 mb-3 border-b border-slate-800/80 pb-2 text-sm flex items-center gap-1.5">
                <ScrollText className="w-4 h-4" />
                <span>實時戰況日誌</span>
              </h3>
              <div className="flex-1 overflow-y-auto space-y-2 text-xs font-mono text-slate-300 max-h-96 p-1">
                {combatLogs.map(log => (
                  <div key={log.id} className="leading-relaxed border-b border-slate-800/40 pb-1.5">{log.text}</div>
                ))}
                <div ref={chatEndRef} />
              </div>
            </div>
          </div>
        )}

        {/* 2. 屬性配點 */}
        {activeTab === 'character' && (
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur space-y-4 max-w-4xl mx-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h2 className="font-extrabold text-amber-400 text-lg">👤 角色屬性配點</h2>
              <span className="text-xs bg-amber-500/20 text-amber-300 font-mono font-bold px-3 py-1 rounded-full">點數: {player.statPoints} Pts</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { key: 'str', label: '力量 (STR)', val: player.stats.str },
                { key: 'con', label: '體質 (CON)', val: player.stats.con },
                { key: 'int', label: '智慧 (INT)', val: player.stats.int },
                { key: 'agi', label: '敏捷 (AGI)', val: player.stats.agi }
              ].map(st => (
                <div key={st.key} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-center">
                  <div className="text-xs font-bold text-amber-300">{st.label}</div>
                  <div className="text-xl font-bold font-mono">{st.val}</div>
                  <button
                    onClick={() => {
                      if (player.statPoints > 0) {
                        setPlayer(p => ({ ...p, statPoints: p.statPoints - 1, stats: { ...p.stats, [st.key]: p.stats[st.key] + 1 } }));
                      }
                    }}
                    disabled={player.statPoints <= 0}
                    className="w-full py-1.5 bg-amber-600 text-white font-bold rounded-xl text-xs disabled:opacity-40"
                  >
                    + 提升
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. 技能樹 */}
        {activeTab === 'skills' && (
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur space-y-4 max-w-4xl mx-auto">
            <h2 className="font-extrabold text-amber-400 text-lg">✨ 技能樹修練 (SP: {player.sp})</h2>
            <div className="space-y-3">
              {classSkills.map((sk, idx) => (
                <div key={sk.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex justify-between items-center">
                  <div>
                    <div className="font-bold text-amber-300 text-sm">{sk.name}</div>
                    <div className="text-xs text-slate-400">{sk.desc}</div>
                  </div>
                  <button
                    onClick={() => {
                      if (player.sp > 0) {
                        setPlayer(p => ({ ...p, sp: p.sp - 1, skillLevels: { ...p.skillLevels, [idx]: (p.skillLevels[idx] || 1) + 1 } }));
                      }
                    }}
                    disabled={player.sp <= 0}
                    className="px-4 py-2 bg-amber-600 text-white font-bold text-xs rounded-xl disabled:opacity-40"
                  >
                    技能升級
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. 裝備背包 */}
        {activeTab === 'equip' && (
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur space-y-6 max-w-5xl mx-auto">
            <div>
              <h2 className="font-extrabold text-amber-400 text-lg mb-3">🛡️ 6大部位與裝備欄</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {EQUIP_SLOTS.map(s => {
                  const item = player.equipped[s.key];
                  return (
                    <div key={s.key} className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-xs">
                      <div className="text-slate-400 font-bold">{s.icon} {s.label}</div>
                      {item ? (
                        <div className="text-amber-300 font-bold mt-1">{item.name} (+{item.refineLevel || 0})</div>
                      ) : (
                        <div className="text-slate-600 italic mt-1">未裝備</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="font-extrabold text-amber-400 text-base mb-3">📦 背包裡戰利品裝備 ({equipmentInventory.length} 件)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {equipmentInventory.map(item => (
                  <div key={item.uid} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                    <div>
                      <div className="font-bold text-amber-300">{item.name} (+{item.refineLevel || 0})</div>
                      <div className="text-slate-400 text-[10px]">{item.desc}</div>
                    </div>
                    <button
                      onClick={() => setPlayer(p => ({ ...p, equipped: { ...p.equipped, [item.type]: item } }))}
                      className="px-3 py-1.5 bg-amber-600 text-white font-bold rounded-xl text-xs"
                    >
                      裝備上身
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 5. 鐵匠精鍊 */}
        {activeTab === 'forge' && (
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur space-y-4 max-w-5xl mx-auto">
            <h2 className="font-extrabold text-amber-400 text-lg">🔨 鐵匠精鍊與寶石鑲嵌</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {equipmentInventory.map(item => (
                <div key={item.uid} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <div className="font-bold text-amber-300 text-sm">{item.name} (+{item.refineLevel || 0})</div>
                  <button
                    onClick={() => handleRefineEquipment(item)}
                    className="w-full py-2 bg-amber-600 text-white font-bold text-xs rounded-xl shadow"
                  >
                    精鍊裝備 (需要 1 精鍊石 & 金幣)
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. 陣法五行 */}
        {activeTab === 'formations' && (
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur space-y-4 max-w-4xl mx-auto">
            <h2 className="font-extrabold text-amber-400 text-lg">☯️ 陣法與五行機制</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.keys(FORMATIONS_CONFIG).map(fKey => (
                <div key={fKey} onClick={() => setCurrentFormation(fKey)} className={`p-4 rounded-2xl border cursor-pointer ${currentFormation === fKey ? 'bg-amber-950/40 border-amber-400 ring-1 ring-amber-400' : 'bg-slate-950 border-slate-800'}`}>
                  <div className="font-bold text-amber-300 text-sm">{FORMATIONS_CONFIG[fKey].name}</div>
                  <div className="text-xs text-slate-400 mt-1">{FORMATIONS_CONFIG[fKey].desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 7. 英雄隊伍 */}
        {activeTab === 'heroes' && (
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-extrabold text-amber-400 text-lg">出戰陣容 (上限 4 位英雄，同名防呆)</h2>
              <button onClick={() => setHeroRoster(prev => prev.map(h => ({ ...h, fatigue: 0 })))} className="px-3 py-1.5 bg-amber-600 text-white rounded-xl text-xs font-bold">
                ☕ 客棧休息 (疲勞歸零)
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {heroRoster.map(hero => {
                const isDeployed = activeHeroInstanceIds.includes(hero.instanceId);
                const elemInfo = ELEMENTS[hero.element];
                return (
                  <div key={hero.instanceId} className={`p-5 rounded-2xl border transition-all ${isDeployed ? 'bg-amber-950/40 border-amber-400 ring-2 ring-amber-400/50 shadow-lg' : 'bg-slate-950 border-slate-800'}`}>
                    <div className="font-extrabold text-amber-300 text-base flex justify-between">
                      <span>{hero.icon} {hero.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${elemInfo?.badge}`}>{hero.element}</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1">Tier {hero.tier} • {hero.heroClass}</div>
                    <div className="mt-3 text-xs space-y-1 text-slate-300 font-mono">
                      <div>❤️ HP: {hero.hp}</div>
                      <div>⚔️ ATK: {hero.atk}</div>
                    </div>
                    <button onClick={() => handleToggleDeployHero(hero)} className={`w-full mt-4 py-2.5 rounded-xl font-bold text-xs transition-all ${isDeployed ? 'bg-rose-700 text-white' : 'bg-amber-600 text-white'}`}>
                      {isDeployed ? '解除登場' : '派遣登場'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 8. 鎮魔塔 */}
        {activeTab === 'tower' && (
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur text-center space-y-4 max-w-xl mx-auto">
            <h2 className="font-extrabold text-amber-400 text-xl">🗼 鎮魔塔挑戰 (目前: 第 {towerFloor} 層)</h2>
            <button onClick={() => { setTowerFloor(prev => prev + 1); spawnEncounter(3); setActiveTab('combat'); }} className="px-6 py-3 bg-amber-600 text-white font-bold rounded-2xl text-sm shadow-lg">
              ⚔️ 進入鎮魔塔戰鬥
            </button>
          </div>
        )}

        {/* 9. 圖鑑成就 */}
        {activeTab === 'codex' && (
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur space-y-4 max-w-4xl mx-auto">
            <h2 className="font-extrabold text-amber-400 text-lg">📖 天外英雄大圖鑑</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {HERO_TEMPLATES.map(tmp => {
                const unlocked = heroRoster.some(h => h.baseId === tmp.id_base);
                return (
                  <div key={tmp.id_base} className={`p-3 rounded-2xl border text-xs ${unlocked ? 'bg-slate-950 border-amber-400 text-amber-300' : 'bg-slate-950/40 opacity-40 border-slate-800'}`}>
                    {tmp.icon} {unlocked ? tmp.name : '???'} (Tier {tmp.tier})
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 10. 存檔管理 */}
        {activeTab === 'saveload' && (
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 space-y-4 shadow-2xl backdrop-blur max-w-4xl mx-auto">
            <h2 className="font-extrabold text-amber-400 text-lg">💾 存檔管理與 JSON 導出</h2>
            <div className="flex gap-3">
              <button onClick={handleExportSave} className="bg-amber-600 hover:bg-amber-500 text-white px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm">
                匯出 JSON 存檔
              </button>
              <button onClick={handleImportSave} className="bg-cyan-700 hover:bg-cyan-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm">
                讀取 JSON 存檔
              </button>
            </div>
            {saveLoadStatus && <div className="text-xs text-emerald-400 font-mono">{saveLoadStatus}</div>}
            <textarea
              value={jsonSaveText}
              onChange={(e) => setJsonSaveText(e.target.value)}
              className="w-full h-44 bg-slate-950/90 border border-slate-800 rounded-2xl p-4 text-xs font-mono text-emerald-400 focus:outline-none focus:border-amber-500"
            />
          </div>
        )}
      </main>

      {/* 戰利品與戰鬥大捷 Modal (展示裝備與英雄卡片掉落) */}
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
                <div className="text-amber-300 font-bold mt-1">
                  👥 獲得英雄卡片：【{victorySummary.droppedHero.name}】({victorySummary.droppedHero.element}屬性)！
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
              繼續冒險
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
