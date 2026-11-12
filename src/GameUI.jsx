import React, { useState } from 'react';
import { 
  User, Layers, Play, ScrollText, Trash2, X, Lock, Compass, Coffee, Sparkles 
} from 'lucide-react';

import { TIER_CONFIG, HERO_TEMPLATES } from './data/heroes';
import { EQUIP_SLOTS, GEMS_DB } from './data/equipment';
import { 
  MAX_LEVEL,
  MAX_SKILL_LEVEL,
  CLASS_CONFIGS,
  CLASS_SKILLS_DB,
  FORMATIONS_CONFIG,
  SKILL_CARDS_DB, 
  createSkillCardInstance, 
  calculateHeroEffectiveStats 
} from './App';

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

export default function GameUI(props) {
  const {
    gameStarted,
    isInCombat,
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
    playerTotalSpeed,
    activeHeroes,
    activeHeroInstanceIds,
    heroRoster,
    handleToggleDeployHero,
    handleReleaseHero,
    handleEquipSkillCard,
    handleUnequipSkillCard,
    handleRestInn,
    handleEquipItem,
    handleSelectFormation,
    handleSelectZone,
    handleFleeCombat,
    monsters,
    selectedTargetIndex,
    setSelectedTargetIndex,
    combatLogs,
    combatBuffs,
    heroBattleBuffs,
    activeTab,
    setActiveTab,
    currentZoneIndex,
    spawnEncounter,
    handleExecuteRound,
    equipmentInventory,
    skillCardsInventory,
    setSkillCardsInventory,
    handleRefineEquipment,
    handleSocketGem,
    currentFormation,
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
    defeatSummary,
    setDefeatSummary,
    chatEndRef
  } = props;

  const [skillModalHeroId, setSkillModalHeroId] = useState(null);
  const isFengShui = player.job === '風水師';

  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-amber-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-4xl w-full bg-slate-900/90 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md relative z-10 space-y-6 ring-1 ring-amber-500/20">
          <div className="text-center space-y-2 border-b border-slate-800/80 pb-5">
            <h1 className="text-3xl sm:text-4xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-600 drop-shadow">
              《天外 Online》文字 RPG
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">五大鮮明職業 • Lv.30 封頂修練 • 主動搜敵與英雄戰損系統</p>
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
                <label className="text-xs text-slate-400 block mb-1.5">選擇職業（各具專屬天賦與定位）</label>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {Object.keys(CLASS_CONFIGS).map(jKey => {
                    const job = CLASS_CONFIGS[jKey];
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
                          <span className="text-slate-400 text-[10px]">HP:{job.baseHp} / ATK:{job.baseAtk}</span>
                        </div>
                        <div className="text-[10px] text-slate-300 mt-1 leading-relaxed">{job.desc}</div>
                        <div className="text-[10px] text-emerald-400 mt-0.5">{job.passiveName} {job.passiveDesc}</div>
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
                        <span>{hero.icon} {hero.name} ({hero.heroClass})</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${elemInfo?.badge}`}>
                          {elemInfo?.icon} {hero.element}屬性
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">{hero.desc}</div>
                      <div className="text-[11px] font-mono text-slate-300 mt-2 flex gap-3">
                        <span>❤️ HP {hero.maxHp}</span>
                        <span>⚔️ ATK {hero.atk}</span>
                        <span>🛡️ DEF {hero.def}</span>
                      </div>
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

  const classInfo = CLASS_CONFIGS[player.job] || CLASS_CONFIGS['猛將'];
  const classSkills = CLASS_SKILLS_DB[player.job] || [];

  const deployedHeroesList = heroRoster.filter(h => activeHeroInstanceIds.includes(h.instanceId));
  const reserveHeroesList = heroRoster.filter(h => !activeHeroInstanceIds.includes(h.instanceId));
  const modalHero = skillModalHeroId ? heroRoster.find(h => h.instanceId === skillModalHeroId) : null;

  // 渲染單張英雄完整卡片（含 Lv.30 上限顯示）
  const renderHeroCard = (hero, isDeployed) => {
    const elemInfo = ELEMENTS[hero.element];
    const { 
      effectiveMaxHp, 
      effectiveAtk, 
      effectiveDef, 
      effectiveSpeed, 
      skillChance 
    } = calculateHeroEffectiveStats(hero, isFengShui, heroBattleBuffs?.[hero.instanceId]);
    const activeCards = hero.activeSkillSlots || [];
    const passiveCards = hero.passiveSkillSlots || [];
    const isMaxLvl = hero.level >= MAX_LEVEL;
    const expPct = isMaxLvl ? 100 : Math.min(100, Math.round(((hero.exp || 0) / (hero.maxExp || 100)) * 100));

    return (
      <div 
        key={hero.instanceId} 
        className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
          isDeployed 
            ? 'bg-amber-950/30 border-amber-400 ring-2 ring-amber-400/40 shadow-lg' 
            : 'bg-slate-950 border-slate-800 hover:border-slate-700'
        }`}
      >
        <div className="space-y-3">
          <div className="flex justify-between items-start gap-2">
            <div>
              <div className="font-extrabold text-amber-300 text-base flex items-center gap-1.5 flex-wrap">
                <span>{hero.icon} {hero.name}</span>
                <span className="text-xs bg-slate-800 text-amber-200 px-2 py-0.5 rounded-full font-mono">
                  Lv.{hero.level}/{MAX_LEVEL}
                </span>
                {hero.statLossTotal > 0 && (
                  <span className="text-[10px] bg-rose-950 text-rose-300 border border-rose-700/70 px-2 py-0.5 rounded-full font-mono">
                    💔 戰損 -{hero.statLossTotal} 屬
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Tier {hero.tier} ({TIER_CONFIG[hero.tier]?.name || '英豪'}) • {hero.heroClass}
              </div>
            </div>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold shrink-0 ${elemInfo?.badge}`}>
              {elemInfo?.icon} {hero.element}
            </span>
          </div>

          {/* 經驗進度條（Lv.30 顯示 MAX） */}
          <div>
            <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
              <span>EXP 經驗進度</span>
              <span>{isMaxLvl ? 'MAX (Lv.30 滿級)' : `${hero.exp || 0} / ${hero.maxExp || 100} (${expPct}%)`}</span>
            </div>
            <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
              <div className="bg-purple-500 h-full transition-all duration-300" style={{ width: `${expPct}%` }} />
            </div>
          </div>

          <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800/80 space-y-2">
            <div className="text-[11px] font-bold text-slate-400 flex justify-between items-center">
              <span>📊 戰鬥屬性總覽</span>
              <span className="text-purple-300 font-mono">
                🎲 技能率: {Math.round(skillChance * 100)}%{isFengShui ? ' (+15%陣眼)' : ''}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-xs font-mono">
              <div className="bg-slate-950/70 px-2.5 py-1.5 rounded-lg border border-slate-800/60 flex justify-between">
                <span className="text-slate-400">❤️ 生命</span>
                <span className={`font-bold ${hero.hp <= 0 ? 'text-rose-500' : 'text-rose-400'}`}>{hero.hp}/{effectiveMaxHp}</span>
              </div>
              <div className="bg-slate-950/70 px-2.5 py-1.5 rounded-lg border border-slate-800/60 flex justify-between">
                <span className="text-slate-400">⚔️ 攻擊</span>
                <span className="text-amber-300 font-bold">{effectiveAtk}</span>
              </div>
              <div className="bg-slate-950/70 px-2.5 py-1.5 rounded-lg border border-slate-800/60 flex justify-between">
                <span className="text-slate-400">🛡️ 防禦</span>
                <span className="text-cyan-300 font-bold">{effectiveDef}</span>
              </div>
              <div className="bg-slate-950/70 px-2.5 py-1.5 rounded-lg border border-slate-800/60 flex justify-between">
                <span className="text-slate-400">⚡ 速度</span>
                <span className="text-emerald-300 font-bold">{effectiveSpeed}</span>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-1 pt-1 text-[11px] font-mono text-center">
              <div className="bg-slate-950/60 py-1 rounded border border-slate-800/50">
                <div className="text-[9px] text-slate-500">力量 STR</div>
                <div className="text-slate-200 font-bold">{hero.stats?.str ?? 0}</div>
              </div>
              <div className="bg-slate-950/60 py-1 rounded border border-slate-800/50">
                <div className="text-[9px] text-slate-500">體質 CON</div>
                <div className="text-slate-200 font-bold">{hero.stats?.con ?? 0}</div>
              </div>
              <div className="bg-slate-950/60 py-1 rounded border border-slate-800/50">
                <div className="text-[9px] text-slate-500">智慧 INT</div>
                <div className="text-slate-200 font-bold">{hero.stats?.int ?? 0}</div>
              </div>
              <div className="bg-slate-950/60 py-1 rounded border border-slate-800/50">
                <div className="text-[9px] text-slate-500">敏捷 AGI</div>
                <div className="text-slate-200 font-bold">{hero.stats?.agi ?? 0}</div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-800/80 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold text-purple-300">🃏 專屬技能卡槽</span>
              <button
                disabled={isInCombat}
                onClick={() => setSkillModalHeroId(hero.instanceId)}
                className="px-2.5 py-1 bg-purple-700 hover:bg-purple-600 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white rounded-lg text-[11px] font-bold transition-all"
              >
                {isInCombat ? '🔒 戰鬥鎖定' : '+ 裝配卡片'}
              </button>
            </div>

            <div className="space-y-1">
              <div className="text-[10px] text-slate-400">主動槽 ({activeCards.length}/2)：</div>
              {activeCards.length === 0 ? (
                <div className="text-[11px] text-slate-600 italic">尚未裝配主動卡</div>
              ) : (
                activeCards.map(card => (
                  <div key={card.uid} className="flex items-center justify-between bg-slate-950 px-2.5 py-1 rounded-lg border border-purple-500/30">
                    <span className="text-purple-200 font-bold truncate">{card.icon} {card.name}</span>
                    <button
                      disabled={isInCombat}
                      onClick={() => handleUnequipSkillCard(hero.instanceId, card)}
                      className="text-[10px] px-2 py-0.5 bg-slate-800 hover:bg-rose-800 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 hover:text-white rounded font-bold transition-all shrink-0 ml-2"
                    >
                      拆下
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="space-y-1">
              <div className="text-[10px] text-slate-400">被動槽 ({passiveCards.length}/2)：</div>
              {passiveCards.length === 0 ? (
                <div className="text-[11px] text-slate-600 italic">尚未裝配被動卡</div>
              ) : (
                passiveCards.map(card => (
                  <div key={card.uid} className="flex items-center justify-between bg-slate-950 px-2.5 py-1 rounded-lg border border-cyan-500/30">
                    <span className="text-cyan-200 font-bold truncate">{card.icon} {card.name}</span>
                    <button
                      disabled={isInCombat}
                      onClick={() => handleUnequipSkillCard(hero.instanceId, card)}
                      className="text-[10px] px-2 py-0.5 bg-slate-800 hover:bg-rose-800 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 hover:text-white rounded font-bold transition-all shrink-0 ml-2"
                    >
                      拆下
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="pt-1 flex gap-2">
          <button
            disabled={isInCombat}
            onClick={() => handleToggleDeployHero(hero)}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed ${
              isDeployed 
                ? 'bg-rose-700 hover:bg-rose-600 text-white' 
                : 'bg-amber-600 hover:bg-amber-500 text-white'
            }`}
          >
            {isInCombat ? '🔒 戰鬥中鎖定' : isDeployed ? '📥 解除登場' : '⚔️ 派遣登場'}
          </button>

          {!isDeployed && (
            <button
              disabled={isInCombat}
              onClick={() => handleReleaseHero(hero)}
              className="px-3.5 py-2.5 rounded-xl font-bold text-xs bg-slate-900 hover:bg-rose-950 disabled:opacity-40 disabled:cursor-not-allowed text-rose-400 border border-rose-800/60 flex items-center justify-center gap-1 transition-all"
              title="放走此英雄（自動退回技能卡）"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>放走</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      {/* 方案 B：合併置頂區塊（單行緊湊狀態列 ＋ 鎖定橫幅 ＋ 靠左滑動導航列），永不遮擋分頁按鈕 */}
      <div className="sticky top-0 z-20 bg-slate-950/95 backdrop-blur-md shadow-xl border-b border-slate-800/90">
        <header className="px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2 border-b border-slate-800/70">
          {/* 左側：主角名、等級、職業、五行、戰鬥狀態燈 */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
            <span className="font-extrabold text-amber-400 text-sm sm:text-base truncate">
              {player.name}
            </span>
            <span className="text-[11px] text-slate-300 font-mono bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800 shrink-0">
              Lv.{player.level}/{MAX_LEVEL} {player.job}
            </span>
            <span className={`hidden sm:inline-flex items-center text-[11px] px-2 py-0.5 rounded-full font-bold border shrink-0 ${ELEMENTS[player.element]?.border} ${ELEMENTS[player.element]?.color}`}>
              {ELEMENTS[player.element]?.icon} {player.element}
            </span>
            {isInCombat ? (
              <span className="text-[10px] sm:text-[11px] bg-rose-950 text-rose-300 border border-rose-600/70 px-2 py-0.5 rounded-full font-bold animate-pulse shrink-0">
                ⚔️ 交鋒中
              </span>
            ) : (
              <span className="text-[10px] sm:text-[11px] bg-emerald-950 text-emerald-300 border border-emerald-700/60 px-2 py-0.5 rounded-full font-bold shrink-0">
                🏕️ 安全整備
              </span>
            )}
          </div>

          {/* 右側：核心生命 / 職業資源 / 回客棧（單行不換行） */}
          <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm font-bold font-mono shrink-0">
            <span className="text-rose-400">
              ❤️ {player.hp}/{playerTotalMaxHp}
              {combatBuffs?.shield > 0 && <span className="text-sky-300 ml-1">(+{combatBuffs.shield}盾)</span>}
            </span>
            {player.job === '猛將' ? (
              <span className="text-amber-400">🔥 {player.rage}/100</span>
            ) : player.job === '巧匠' ? (
              <span className="text-amber-400">🏹 {player.ammo}/{player.maxAmmo}</span>
            ) : (
              <span className="text-cyan-400">💧 {player.mp}/{playerTotalMaxMp}</span>
            )}
            <button
              disabled={isInCombat}
              onClick={handleRestInn}
              className="px-2.5 py-1 bg-indigo-700 hover:bg-indigo-600 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white rounded-lg text-xs font-sans font-bold flex items-center gap-1 transition-all"
            >
              <Coffee className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">{isInCombat ? '鎖定' : '回客棧'}</span>
            </button>
          </div>
        </header>

        {/* 戰鬥中鎖定提示橫幅 */}
        {isInCombat && (
          <div className="bg-rose-950/80 border-b border-rose-800/70 px-3 py-1 text-center text-[11px] text-rose-200 font-bold flex items-center justify-center gap-1.5">
            <Lock className="w-3 h-3 text-rose-400 shrink-0" />
            <span className="truncate">戰鬥交鋒中：已鎖定更換裝備、調整陣容與技能卡、切換陣法及回客棧休息</span>
          </div>
        )}

        {/* 靠左橫向滑動導航列（窄螢幕下最左側按鈕絕不裁切） */}
        <nav className="bg-slate-900/60 flex justify-start items-center gap-1.5 px-3 sm:px-6 py-2 overflow-x-auto">
          {[
            { id: 'combat', label: '⚔️ 戰鬥遭遇' },
            { id: 'character', label: `👤 主角屬性${player.statPoints > 0 ? ` (+${player.statPoints})` : ''}` },
            { id: 'skills', label: `✨ 技能樹${player.sp > 0 ? ` (+${player.sp}SP)` : ''}` },
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
              className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 ${
                activeTab === tab.id 
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-900/40 ring-1 ring-amber-400' 
                  : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
        {/* 1. 戰鬥遭遇 */}
        {activeTab === 'combat' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 bg-slate-900/80 border border-slate-800/80 rounded-3xl p-5 sm:p-6 flex flex-col justify-between shadow-2xl backdrop-blur space-y-5">
              <div>
                <div className="flex flex-wrap justify-between items-center gap-2 mb-4 pb-3 border-b border-slate-800/60">
                  <div className="flex gap-2 overflow-x-auto">
                    {ZONES.map((zone, zIdx) => (
                      <button
                        key={zone.id}
                        disabled={isInCombat}
                        onClick={() => handleSelectZone(zIdx)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                          currentZoneIndex === zIdx ? 'bg-amber-600 text-white shadow' : 'bg-slate-950/60 text-slate-400 border border-slate-800'
                        }`}
                      >
                        {zone.name}
                      </button>
                    ))}
                  </div>
                  <button 
                    disabled={isInCombat}
                    onClick={() => spawnEncounter(currentZoneIndex)} 
                    className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
                  >
                    <Compass className="w-4 h-4" />
                    <span>{isInCombat ? '交鋒進行中...' : '🔍 尋找怪群 (主動搜敵)'}</span>
                  </button>
                </div>

                {/* 戰鬥中我方生效增益狀態標籤 */}
                {isInCombat && (combatBuffs?.tauntTurns > 0 || combatBuffs?.reflectTurns > 0 || combatBuffs?.baguaTurns > 0 || combatBuffs?.shield > 0) && (
                  <div className="flex flex-wrap gap-1.5 mb-3 text-[11px] font-bold">
                    {combatBuffs.shield > 0 && (
                      <span className="bg-sky-950 text-sky-300 border border-sky-700 px-2.5 py-0.5 rounded-full">
                        🛡️ 護盾: {combatBuffs.shield}
                      </span>
                    )}
                    {combatBuffs.tauntTurns > 0 && (
                      <span className="bg-amber-950 text-amber-300 border border-amber-700 px-2.5 py-0.5 rounded-full">
                        📢 全場嘲諷 ({combatBuffs.tauntTurns}回合)
                      </span>
                    )}
                    {combatBuffs.reflectTurns > 0 && (
                      <span className="bg-rose-950 text-rose-300 border border-rose-700 px-2.5 py-0.5 rounded-full">
                        🔄 明王反震 {Math.round(combatBuffs.reflectPct * 100)}% ({combatBuffs.reflectTurns}回合)
                      </span>
                    )}
                    {combatBuffs.baguaTurns > 0 && (
                      <span className="bg-emerald-950 text-emerald-300 border border-emerald-700 px-2.5 py-0.5 rounded-full">
                        ☯️ 八卦結界 -{Math.round(combatBuffs.baguaReducePct * 100)}%傷 ({combatBuffs.baguaTurns}回合)
                      </span>
                    )}
                  </div>
                )}

                {!isInCombat ? (
                  <div className="bg-slate-950/70 border border-dashed border-slate-700/80 rounded-2xl p-8 text-center space-y-3">
                    <div className="text-2xl">🏕️</div>
                    <div className="text-sm font-bold text-amber-300">
                      目前位於【{ZONES[currentZoneIndex].name}】安全營地
                    </div>
                    <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                      本命天賦：<span className="text-emerald-400 font-bold">{classInfo.passiveName}</span> {classInfo.passiveDesc}
                    </p>
                    {Object.values(player.skillLevels || {}).every(v => v === 0) && (
                      <div className="text-xs text-amber-300 font-bold bg-amber-950/40 border border-amber-700/50 rounded-xl py-2 px-3 max-w-md mx-auto">
                        💡 提示：你目前擁有 {player.sp} 點 SP，可先點擊上方「✨ 技能樹」學習首招職業技能！
                      </div>
                    )}
                    <div className="pt-2 flex justify-center gap-3">
                      <button
                        onClick={handleRestInn}
                        className="px-4 py-2.5 bg-indigo-700 hover:bg-indigo-600 text-white rounded-xl font-bold text-xs shadow"
                      >
                        ☕ 客棧休息恢復滿血
                      </button>
                      <button
                        onClick={() => spawnEncounter(currentZoneIndex)}
                        className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-slate-950 rounded-xl font-black text-xs shadow-lg"
                      >
                        🔍 立即主動搜敵
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5 max-h-64 overflow-y-auto p-1">
                    {monsters.map((m, idx) => {
                      const isDead = m.hp <= 0;
                      const isSelected = selectedTargetIndex === idx && !isDead;
                      const elemInfo = ELEMENTS[m.element];
                      return (
                        <div
                          key={m.id}
                          onClick={() => !isDead && setSelectedTargetIndex(idx)}
                          className={`p-3 rounded-2xl border text-center cursor-pointer transition-all shadow-md space-y-1 ${
                            isDead ? 'opacity-30 bg-slate-950 border-slate-800' : isSelected ? 'border-amber-400 bg-amber-950/40 ring-2 ring-amber-400/60 scale-105' : 'border-slate-800/80 bg-slate-950/60 hover:border-slate-700'
                          }`}
                        >
                          <div className="text-xs font-bold truncate text-slate-200">{m.name}</div>
                          <div className={`text-[10px] ${elemInfo?.color.split(' ')[0]} font-bold`}>
                            {elemInfo?.icon} {m.element} {m.elemShiftTurns > 0 ? `(轉${m.elemShiftTurns})` : ''}
                          </div>
                          <div className="text-[10px] text-rose-400 font-mono">HP {m.hp}</div>
                          {/* 敵怪減益狀態小標籤 */}
                          {!isDead && (
                            <div className="flex flex-wrap justify-center gap-1 pt-0.5 text-[9px] font-bold">
                              {m.poisonTurns > 0 && (
                                <span className="bg-emerald-950 text-emerald-300 px-1 rounded border border-emerald-700">
                                  ☠️毒{m.poisonStacks}({m.poisonTurns})
                                </span>
                              )}
                              {m.armorBreakTurns > 0 && (
                                <span className="bg-amber-950 text-amber-300 px-1 rounded border border-amber-700">
                                  💔破甲({m.armorBreakTurns})
                                </span>
                              )}
                              {m.blindTurns > 0 && (
                                <span className="bg-purple-950 text-purple-300 px-1 rounded border border-purple-700">
                                  🕸️盲({m.blindTurns})
                                </span>
                              )}
                              {m.vulnTurns > 0 && (
                                <span className="bg-rose-950 text-rose-300 px-1 rounded border border-rose-700">
                                  🎯易傷({m.vulnTurns})
                                </span>
                              )}
                              {m.burnTurns > 0 && (
                                <span className="bg-orange-950 text-orange-300 px-1 rounded border border-orange-700">
                                  🔥灼({m.burnTurns})
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 我方出戰英雄狀態列 */}
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3.5 space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-emerald-400">🛡️ 我方出戰英雄 ({activeHeroes.length}/4 人登場)</span>
                  <button
                    disabled={isInCombat}
                    onClick={handleRestInn}
                    className="px-2.5 py-1 bg-indigo-900/60 hover:bg-indigo-800 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-indigo-200 border border-indigo-700/60 rounded-lg text-[11px] font-bold"
                  >
                    {isInCombat ? '🔒 戰鬥中鎖定' : '☕ 客棧全隊恢復'}
                  </button>
                </div>
                {activeHeroes.length === 0 ? (
                  <div className="text-xs text-slate-500 text-center py-2">目前無英雄登場，可前往「英雄隊伍」派遣夥伴。</div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {activeHeroes.map(h => {
                      const hBuff = heroBattleBuffs?.[h.instanceId];
                      const { effectiveMaxHp, effectiveAtk, skillChance } = calculateHeroEffectiveStats(h, isFengShui, hBuff);
                      const hpPct = Math.max(0, Math.min(100, (h.hp / effectiveMaxHp) * 100));
                      return (
                        <div key={h.instanceId} className={`p-2.5 rounded-xl border text-xs ${h.hp <= 0 ? 'bg-red-950/30 border-red-800/70 opacity-80' : 'bg-slate-900 border-slate-800'}`}>
                          <div className="flex justify-between font-bold text-amber-300 truncate">
                            <span>{h.icon} {h.name}</span>
                            <span className="text-[10px] text-slate-400">T{h.tier}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            Lv.{h.level} • 攻{effectiveAtk} • 技{Math.round(skillChance * 100)}%
                          </div>
                          {hBuff?.surgeTurns > 0 && (
                            <div className="text-[9px] text-emerald-300 font-bold mt-0.5">
                              💊 藥力激發 ({hBuff.surgeTurns}回合)
                            </div>
                          )}
                          <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden mt-1.5 border border-slate-800">
                            <div className="bg-emerald-500 h-full transition-all" style={{ width: `${hpPct}%` }} />
                          </div>
                          <div className="text-[10px] text-right font-mono text-slate-300 mt-0.5">
                            {h.hp <= 0 ? <span className="text-rose-400 font-bold">☠️ 陣亡重傷</span> : `${h.hp}/${effectiveMaxHp}`}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 戰鬥動作按鈕區 */}
              <div className="pt-3 border-t border-slate-800/80 space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <button 
                    disabled={!isInCombat}
                    onClick={() => handleExecuteRound({ type: 'attack' }, false)} 
                    className="bg-rose-700 hover:bg-rose-600 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white py-3 px-2 rounded-2xl font-bold text-xs sm:text-sm shadow-lg transition-all active:scale-95 text-center"
                  >
                    <div>普通攻擊</div>
                    <div className="text-[10px] opacity-80 mt-0.5">
                      {player.job === '猛將' ? '+25怒氣' : player.job === '巧匠' ? (player.ammo > 6 ? '二連射 +4彈' : '+4彈藥') : '+20MP'}
                    </div>
                  </button>

                  {classSkills.map((sk, sIdx) => {
                    const skLvl = player.skillLevels[sIdx] || 0;
                    const isUnlearned = skLvl <= 0;
                    let canAfford = !isUnlearned;
                    if (sk.costType === 'rage' && player.rage < sk.cost) canAfford = false;
                    if (sk.costType === 'mp' && player.mp < sk.cost) canAfford = false;
                    if (sk.costType === 'ammo' && player.ammo < sk.cost) canAfford = false;

                    const costLabel = sk.costType === 'rage' ? `${sk.cost}怒` : sk.costType === 'ammo' ? `${sk.cost}彈` : `${sk.cost}MP`;

                    return (
                      <button 
                        key={sk.id} 
                        disabled={!isInCombat || isUnlearned}
                        onClick={() => handleExecuteRound({ type: 'skill', skill: sk, skillIdx: sIdx }, false)} 
                        className={`py-3 px-2 rounded-2xl font-bold text-xs sm:text-sm shadow-lg transition-all active:scale-95 text-center disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed ${
                          canAfford && isInCombat ? 'bg-cyan-700 hover:bg-cyan-600 text-white' : 'bg-slate-800 text-slate-500 opacity-60'
                        }`}
                      >
                        <div className="truncate">
                          {isUnlearned ? `🔒 ${sk.name}` : `${sk.name} (Lv.${skLvl})`}
                        </div>
                        <div className="text-[10px] opacity-80 mt-0.5 font-mono">
                          {isUnlearned ? '未學習 (Lv.0)' : `消耗 ${costLabel}`}
                        </div>
                      </button>
                    );
                  })}

                  <button 
                    disabled={!isInCombat}
                    onClick={() => handleExecuteRound({ type: 'attack' }, true)} 
                    className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-slate-950 font-black py-3 px-2 rounded-2xl text-xs sm:text-sm shadow-lg transition-all active:scale-95 text-center"
                  >
                    <div>⚡ 全軍合擊</div>
                    <div className="text-[10px] opacity-80 mt-0.5">主僕集火奧義</div>
                  </button>
                </div>

                {isInCombat && (
                  <div className="flex justify-end">
                    <button
                      onClick={handleFleeCombat}
                      className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-bold transition-all"
                    >
                      🏃 撤退逃跑 (70% 成功脫離)
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-4 bg-slate-900/80 border border-slate-800/80 rounded-3xl p-5 flex flex-col shadow-2xl backdrop-blur">
              <h3 className="font-extrabold text-amber-400 mb-3 border-b border-slate-800/80 pb-2 text-sm flex items-center gap-1.5">
                <ScrollText className="w-4 h-4" />
                <span>實時戰況日誌</span>
              </h3>
              <div className="flex-1 overflow-y-auto space-y-2 text-xs font-mono max-h-[480px] p-1">
                {combatLogs.map(log => (
                  <div 
                    key={log.id} 
                    className={`leading-relaxed border-b border-slate-800/40 pb-1.5 ${
                      log.type === 'danger' ? 'text-rose-400 font-bold' : 'text-slate-300'
                    }`}
                  >
                    {log.text}
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
            </div>
          </div>
        )}

        {/* 2. 主角屬性畫面（含金幣、精鍊石、職業天賦、Lv.30上限與四維配點） */}
        {activeTab === 'character' && (
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur space-y-6 max-w-4xl mx-auto">
            <div className="flex flex-wrap justify-between items-center gap-3 border-b border-slate-800 pb-4">
              <div>
                <h2 className="font-extrabold text-amber-400 text-lg">👤 少俠完整屬性與配點</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {player.name} • Lv.{player.level} / {MAX_LEVEL} {player.job} • {ELEMENTS[player.element]?.icon} {player.element}本命
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs bg-slate-950 text-amber-300 font-mono font-bold px-3 py-1.5 rounded-full border border-slate-800">
                  💰 金幣: {player.gold}
                </span>
                <span className="text-xs bg-slate-950 text-cyan-300 font-mono font-bold px-3 py-1.5 rounded-full border border-slate-800">
                  💎 精鍊石: {player.refineStones}
                </span>
                <span className="text-xs bg-amber-500/20 text-amber-300 font-mono font-bold px-3.5 py-1.5 rounded-full border border-amber-500/40">
                  可分配屬性點: {player.statPoints} Pts
                </span>
              </div>
            </div>

            {/* 職業專屬本命天賦展示卡片 */}
            <div className="bg-emerald-950/30 border border-emerald-700/60 rounded-2xl p-4 space-y-1">
              <div className="text-xs font-extrabold text-emerald-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                <span>{classInfo.icon} {player.job}專屬天賦：{classInfo.passiveName}</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{classInfo.passiveDesc}</p>
            </div>

            <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-amber-300">📊 主角綜合戰鬥屬性（含裝備與陣法加成）</span>
                <span className="text-xs font-mono text-slate-400">
                  {player.level >= MAX_LEVEL ? 'EXP: MAX (Lv.30 滿級上限)' : `EXP: ${player.exp} / ${player.maxExp}`}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono">
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-center">
                  <div className="text-[11px] text-slate-400">❤️ 最大生命</div>
                  <div className="text-base font-bold text-rose-400 mt-1">{player.hp} / {playerTotalMaxHp}</div>
                </div>
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-center">
                  <div className="text-[11px] text-slate-400">💧 內力 / 資源</div>
                  <div className="text-base font-bold text-cyan-400 mt-1">
                    {player.job === '猛將' ? `${player.rage}/100 怒` : player.job === '巧匠' ? `${player.ammo}/${player.maxAmmo} 彈` : `${player.mp}/${playerTotalMaxMp}`}
                  </div>
                </div>
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-center">
                  <div className="text-[11px] text-slate-400">⚔️ 總攻擊力</div>
                  <div className="text-base font-bold text-amber-300 mt-1">{playerTotalAtk}</div>
                </div>
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-center">
                  <div className="text-[11px] text-slate-400">🛡️ 總防禦力</div>
                  <div className="text-base font-bold text-indigo-300 mt-1">{playerTotalDef}</div>
                </div>
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-center col-span-2 sm:col-span-1">
                  <div className="text-[11px] text-slate-400">⚡ 行動速度</div>
                  <div className="text-base font-bold text-emerald-300 mt-1">{playerTotalSpeed}</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { key: 'str', label: '力量 (STR)', desc: '每點 +3 攻擊力', val: player.stats.str },
                { key: 'con', label: '體質 (CON)', desc: '每點 +16 HP / +1 防禦', val: player.stats.con },
                { key: 'int', label: '智慧 (INT)', desc: '每點 +10 最大 MP', val: player.stats.int },
                { key: 'agi', label: '敏捷 (AGI)', desc: '每點 +1 行動速度', val: player.stats.agi }
              ].map(st => (
                <div key={st.key} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-center">
                  <div className="text-xs font-bold text-amber-300">{st.label}</div>
                  <div className="text-2xl font-black font-mono text-slate-100">{st.val}</div>
                  <div className="text-[10px] text-slate-400">{st.desc}</div>
                  <button
                    onClick={() => {
                      if (player.statPoints > 0) {
                        setPlayer(p => ({ ...p, statPoints: p.statPoints - 1, stats: { ...p.stats, [st.key]: p.stats[st.key] + 1 } }));
                      }
                    }}
                    disabled={player.statPoints <= 0}
                    className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs disabled:opacity-40 transition-all"
                  >
                    +1 提升屬性
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. 技能樹（Lv.0 未學習起步、Lv.10 滿級、配點頁面展示當前與下一級強化效果） */}
        {activeTab === 'skills' && (
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur space-y-5 max-w-4xl mx-auto">
            <div className="flex flex-wrap justify-between items-center gap-3 border-b border-slate-800 pb-4">
              <div>
                <h2 className="font-extrabold text-amber-400 text-lg">
                  ✨ {player.job}專屬技能樹（Lv.0 未學習 ～ Lv.{MAX_SKILL_LEVEL} 滿級）
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  角色最高 Lv.{MAX_LEVEL}，共可獲得 30 點 SP 完整修滿全部三招技能！
                </p>
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

                    {/* 配點頁面：當前效果與下一級升級強化預覽 */}
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
        )}

        {/* 4. 裝備與技能卡背包 */}
        {activeTab === 'equip' && (
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur space-y-6 max-w-5xl mx-auto">
            <div className="flex flex-wrap justify-between items-center gap-2 border-b border-slate-800 pb-3">
              <h2 className="font-extrabold text-amber-400 text-lg">🛡️ 6大部位與裝備欄</h2>
              <div className="flex gap-2 text-xs font-mono font-bold">
                <span className="bg-slate-950 text-amber-300 px-3 py-1 rounded-full border border-slate-800">💰 金幣: {player.gold}</span>
                <span className="bg-slate-950 text-cyan-300 px-3 py-1 rounded-full border border-slate-800">💎 精鍊石: {player.refineStones}</span>
              </div>
            </div>

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
                      disabled={isInCombat}
                      onClick={() => handleEquipItem(item)}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs"
                    >
                      {isInCombat ? '🔒 戰鬥中鎖定' : '裝備上身'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-extrabold text-purple-300 text-base mb-3">🃏 閒置英雄技能卡庫存 ({skillCardsInventory.length} 張)</h3>
              {skillCardsInventory.length === 0 ? (
                <div className="text-xs text-slate-500 bg-slate-950 p-4 rounded-xl border border-slate-800">
                  背包中暫無閒置技能卡（已裝配在英雄身上的卡片可前往「英雄隊伍」隨時拆下）。
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {skillCardsInventory.map(card => (
                    <div key={card.uid} className="bg-slate-950 p-3.5 rounded-xl border border-purple-500/30 text-xs space-y-1">
                      <div className="font-bold text-purple-300 flex justify-between">
                        <span>{card.icon} {card.name}</span>
                        <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                          {card.type === 'active' ? '主動卡' : '被動卡'}
                        </span>
                      </div>
                      <div className="text-slate-400 text-[11px]">{card.desc}</div>
                      <div className="text-[10px] text-amber-300/90 pt-1">
                        適用職業：{card.allowedJobs.join('、')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 5. 鐵匠精鍊 */}
        {activeTab === 'forge' && (
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur space-y-4 max-w-5xl mx-auto">
            <div className="flex flex-wrap justify-between items-center gap-2 border-b border-slate-800 pb-3">
              <h2 className="font-extrabold text-amber-400 text-lg">🔨 鐵匠精鍊與寶石鑲嵌</h2>
              <div className="flex gap-2 text-xs font-mono font-bold">
                <span className="bg-slate-950 text-amber-300 px-3 py-1 rounded-full border border-slate-800">💰 金幣: {player.gold}</span>
                <span className="bg-slate-950 text-cyan-300 px-3 py-1 rounded-full border border-slate-800">💎 精鍊石: {player.refineStones}</span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {equipmentInventory.map(item => (
                <div key={item.uid} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <div className="font-bold text-amber-300 text-sm">{item.name} (+{item.refineLevel || 0})</div>
                  <div className="text-xs text-slate-400">{item.desc}</div>
                  <button
                    disabled={isInCombat}
                    onClick={() => handleRefineEquipment(item)}
                    className="w-full py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow"
                  >
                    {isInCombat ? '🔒 戰鬥中鎖定' : `精鍊裝備 (需要 1 精鍊石 & ${(item.refineLevel || 0) * 120 + 120} 金幣)`}
                  </button>
                  {item.sockets && item.sockets.length > 0 && (
                    <div className="pt-2 border-t border-slate-800 space-y-1.5">
                      <div className="text-[11px] text-slate-400">寶石插槽：</div>
                      <div className="flex flex-wrap gap-1.5">
                        {item.sockets.map((gem, sIdx) => (
                          <div key={sIdx} className="text-[10px] bg-slate-900 px-2 py-1 rounded border border-slate-700">
                            {gem ? gem.name : (
                              <button
                                disabled={isInCombat}
                                onClick={() => handleSocketGem(item, GEMS_DB[0], sIdx)}
                                className="text-cyan-400 hover:underline disabled:text-slate-500 disabled:no-underline"
                              >
                                {isInCombat ? '🔒 鎖定' : '+ 鑲嵌紅寶石'}
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. 陣法五行（限定只有風水師才可轉陣） */}
        {activeTab === 'formations' && (
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur space-y-4 max-w-4xl mx-auto">
            <div className="flex flex-wrap justify-between items-center gap-2 border-b border-slate-800 pb-3">
              <div>
                <h2 className="font-extrabold text-amber-400 text-lg">☯️ 陣法與五行機制</h2>
                <p className="text-xs text-slate-400 mt-0.5">五行相剋：金剋木 → 木剋土 → 土剋水 → 水剋火 → 火剋金</p>
              </div>
              {!isFengShui ? (
                <span className="text-xs bg-rose-950 text-rose-300 border border-rose-700 px-3 py-1 rounded-full font-bold">
                  🔒 僅限「風水師」職業可變換陣法
                </span>
              ) : isInCombat ? (
                <span className="text-xs text-rose-400 font-bold">🔒 戰鬥中鎖定陣法切換</span>
              ) : (
                <span className="text-xs bg-emerald-950 text-emerald-300 border border-emerald-700 px-3 py-1 rounded-full font-bold">
                  ✨ 【奇門陣眼】啟動：所有陣法增益 2 倍強化！
                </span>
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
                    className={`p-4 rounded-2xl border transition-all ${
                      canClick ? 'cursor-pointer hover:border-amber-500/60' : 'cursor-not-allowed opacity-65'
                    } ${
                      isSelected ? 'bg-amber-950/40 border-amber-400 ring-1 ring-amber-400' : 'bg-slate-950 border-slate-800'
                    }`}
                  >
                    <div className="font-bold text-amber-300 text-sm flex justify-between items-center">
                      <span>{FORMATIONS_CONFIG[fKey].icon} {FORMATIONS_CONFIG[fKey].name}</span>
                      {!isFengShui && fKey !== 'none' && (
                        <span className="text-[10px] text-rose-400 font-bold">🔒 限風水師</span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">{FORMATIONS_CONFIG[fKey].desc}</div>
                    {isFengShui && fKey !== 'none' && (
                      <div className="text-[11px] text-emerald-400 font-bold mt-1.5">
                        ☯️ 風水師倍增生效中：所有陣法加成數值 ×2！
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 7. 英雄隊伍 */}
        {activeTab === 'heroes' && (
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur space-y-8">
            <div className="flex flex-wrap justify-between items-center gap-3 border-b border-slate-800 pb-4">
              <div>
                <h2 className="font-extrabold text-amber-400 text-lg">👥 英雄隊伍管理 (上限 4 位登場，最高 Lv.{MAX_LEVEL})</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  總名冊：{heroRoster.length} 位英雄 • 閒置技能卡：{skillCardsInventory.length} 張
                </p>
              </div>
              <button 
                disabled={isInCombat}
                onClick={handleRestInn} 
                className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold shadow"
              >
                {isInCombat ? '🔒 戰鬥中鎖定客棧' : '☕ 客棧休息 (全隊恢復滿血)'}
              </button>
            </div>

            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-emerald-400 text-base flex items-center gap-2">
                  <span>⚔️ 一、已登場英雄</span>
                  <span className="text-xs bg-emerald-950 text-emerald-300 border border-emerald-700/60 px-2.5 py-0.5 rounded-full font-mono">
                    {deployedHeroesList.length} / 4 人
                  </span>
                </h3>
              </div>

              {deployedHeroesList.length === 0 ? (
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-6 text-center text-xs text-slate-500">
                  目前尚未派遣任何英雄登場，請從下方「未登場英雄」選擇夥伴出戰。
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {deployedHeroesList.map(hero => renderHeroCard(hero, true))}
                </div>
              )}
            </section>

            <section className="space-y-4 pt-6 border-t border-slate-800/80">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-slate-200 text-base flex items-center gap-2">
                  <span>🛖 二、未登場英雄（客棧休養名冊）</span>
                  <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full font-mono">
                    {reserveHeroesList.length} 人
                  </span>
                </h3>
              </div>

              {reserveHeroesList.length === 0 ? (
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-6 text-center text-xs text-slate-500">
                  客棧中目前沒有未登場的備用英雄，在戰鬥勝利時有機會招募新英雄加入！
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {reserveHeroesList.map(hero => renderHeroCard(hero, false))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* 8. 鎮魔塔 */}
        {activeTab === 'tower' && (
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur text-center space-y-4 max-w-xl mx-auto">
            <h2 className="font-extrabold text-amber-400 text-xl">🗼 鎮魔塔挑戰 (目前: 第 {towerFloor} 層)</h2>
            <p className="text-xs text-slate-400">挑戰鎮魔塔守衛可贏取稀有英雄技能卡與精鍊石！</p>
            <div className="flex justify-center gap-3">
              <button 
                disabled={isInCombat}
                onClick={() => { 
                  setTowerFloor(prev => prev + 1); 
                  const randTemplate = SKILL_CARDS_DB[Math.floor(Math.random() * SKILL_CARDS_DB.length)];
                  setSkillCardsInventory(prev => [...prev, createSkillCardInstance(randTemplate)]);
                  spawnEncounter(3); 
                  setActiveTab('combat'); 
                }} 
                className="px-6 py-3 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold rounded-2xl text-sm shadow-lg"
              >
                {isInCombat ? '🔒 戰鬥進行中' : '⚔️ 挑戰本層並進入戰鬥'}
              </button>
            </div>
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
                    {tmp.icon} {unlocked ? tmp.name : '???'} (Tier {tmp.tier} • {tmp.heroClass})
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
        )}
      </main>

      {/* 英雄技能卡裝配 Modal */}
      {modalHero && !isInCombat && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-slate-900 border-2 border-purple-500/70 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-black text-purple-300">
                  🃏 為【{modalHero.name}】裝配技能卡
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  英雄職業：<span className="text-amber-300 font-bold">{modalHero.heroClass}</span>（自動過濾不可用職業卡片，且不可重複裝備同名卡）
                </p>
              </div>
              <button
                onClick={() => setSkillModalHeroId(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {skillCardsInventory.length === 0 ? (
                <div className="text-center text-xs text-slate-500 py-8">
                  背包中目前沒有閒置的技能卡（可拆下其他英雄的卡片或透過戰鬥/鎮魔塔取得）。
                </div>
              ) : (
                skillCardsInventory.map(card => {
                  const isJobAllowed = card.allowedJobs.includes(modalHero.heroClass);
                  const allHeroCards = [
                    ...(modalHero.activeSkillSlots || []),
                    ...(modalHero.passiveSkillSlots || [])
                  ];
                  const isDuplicate = allHeroCards.some(c => c.id === card.id || c.name === card.name);
                  const targetSlots = card.type === 'active'
                    ? (modalHero.activeSkillSlots || [])
                    : (modalHero.passiveSkillSlots || []);
                  const isSlotFull = targetSlots.length >= 2;
                  const canEquip = isJobAllowed && !isDuplicate && !isSlotFull;

                  let disabledReason = '';
                  if (!isJobAllowed) disabledReason = `限 ${card.allowedJobs.join('/')}`;
                  else if (isDuplicate) disabledReason = '已裝備同名卡';
                  else if (isSlotFull) disabledReason = `${card.type === 'active' ? '主動' : '被動'}槽已滿`;

                  return (
                    <div 
                      key={card.uid} 
                      className={`p-3 rounded-xl border flex justify-between items-center gap-3 ${
                        canEquip 
                          ? 'bg-slate-950 border-slate-700' 
                          : 'bg-slate-950/50 border-slate-800/60 opacity-60'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold text-xs text-purple-300 flex items-center gap-1.5">
                          <span>{card.icon} {card.name}</span>
                          <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">
                            {card.type === 'active' ? '主動' : '被動'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">{card.desc}</div>
                      </div>

                      <button
                        disabled={!canEquip}
                        onClick={() => handleEquipSkillCard(modalHero.instanceId, card)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                          canEquip
                            ? 'bg-purple-600 hover:bg-purple-500 text-white shadow'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        {canEquip ? '裝配' : disabledReason}
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <button
              onClick={() => setSkillModalHeroId(null)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs"
            >
              完成並關閉
            </button>
          </div>
        </div>
      )}

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
    </div>
  );
}
