import React, { useState } from 'react';
import { Lock, Coffee, Sparkles, HelpCircle } from 'lucide-react';

import { MAX_LEVEL, MAX_SKILL_LEVEL, ELEMENTS } from './data/constants';
import { CLASS_CONFIGS, CLASS_SKILLS_DB } from './data/classes';
import { FORMATIONS_CONFIG } from './data/formations';
import { SKILL_CARDS_DB, createSkillCardInstance } from './data/skillCards';
import { HERO_TEMPLATES } from './data/heroes';
import { EQUIP_SLOTS, GEMS_DB } from './data/equipment';
import { enrichEquipmentMeta } from './utils/statCalculator';

import CharacterCreation from './components/CharacterCreation';
import HelpGuideModal from './components/HelpGuideModal';
import CombatTab from './components/CombatTab';
import HeroTeamTab from './components/HeroTeamTab';

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
    handleUnequipItem,
    handleSellEquipment,
    handleBulkSellUnusableEquipment,
    handleSelectFormation,
    formationSlots,
    handleSwapFormationSlots,
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

  const [helpModalTab, setHelpModalTab] = useState(null);

  const isFengShui = player.job === '風水師';

  if (!gameStarted) {
    return (
      <CharacterCreation
        creationData={creationData}
        setCreationData={setCreationData}
        starterHeroCandidates={starterHeroCandidates}
        handleStartGame={handleStartGame}
      />
    );
  }

  const classInfo = CLASS_CONFIGS[player.job] || CLASS_CONFIGS['猛將'];
  const classSkills = CLASS_SKILLS_DB[player.job] || [];

  const getHeroRowIdx = (heroInstanceId) => {
    const foundKey = Object.keys(formationSlots || {}).find(k => formationSlots[k] === heroInstanceId);
    return foundKey !== undefined ? Math.floor(Number(foundKey) / 3) : 1;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      {/* 合併置頂區塊 */}
      <div className="sticky top-0 z-20 bg-slate-950/95 backdrop-blur-md shadow-xl border-b border-slate-800/90">
        <header className="px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2 border-b border-slate-800/70">
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

          <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm font-bold font-mono shrink-0">
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
            <button
              onClick={() => setHelpModalTab('combat')}
              className="px-2.5 py-1 bg-amber-600/90 hover:bg-amber-500 text-slate-950 rounded-lg text-xs font-sans font-black flex items-center gap-1 shadow transition-all"
              title="開啟《江湖指南》遊戲機制說明"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>指南</span>
            </button>
          </div>
        </header>

        {isInCombat && (
          <div className="bg-rose-950/80 border-b border-rose-800/70 px-3 py-1 text-center text-[11px] text-rose-200 font-bold flex items-center justify-center gap-1.5">
            <Lock className="w-3 h-3 text-rose-400 shrink-0" />
            <span className="truncate">戰鬥交鋒中：已鎖定更換裝備、調整陣容與站位、切換陣法及回客棧休息</span>
          </div>
        )}

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
          <CombatTab
            isInCombat={isInCombat}
            currentZoneIndex={currentZoneIndex}
            handleSelectZone={handleSelectZone}
            spawnEncounter={spawnEncounter}
            setHelpModalTab={setHelpModalTab}
            combatBuffs={combatBuffs}
            classInfo={classInfo}
            player={player}
            handleRestInn={handleRestInn}
            monsters={monsters}
            selectedTargetIndex={selectedTargetIndex}
            setSelectedTargetIndex={setSelectedTargetIndex}
            activeHeroes={activeHeroes}
            heroBattleBuffs={heroBattleBuffs}
            isFengShui={isFengShui}
            getHeroRowIdx={getHeroRowIdx}
            classSkills={classSkills}
            handleExecuteRound={handleExecuteRound}
            handleFleeCombat={handleFleeCombat}
            combatLogs={combatLogs}
            chatEndRef={chatEndRef}
          />
        )}

        {/* 2. 主角屬性畫面 */}
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

        {/* 3. 技能樹 */}
        {activeTab === 'skills' && (
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
        )}

        {/* 4. 裝備與技能卡背包 */}
        {activeTab === 'equip' && (
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur space-y-6 max-w-5xl mx-auto">
            <div className="flex flex-wrap justify-between items-center gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-amber-400 text-lg">🛡️ 6大部位與裝備欄</h2>
                <button
                  onClick={() => setHelpModalTab('equip')}
                  className="text-slate-400 hover:text-amber-300 transition-colors"
                  title="查看裝備職業限制與賣出規則"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono font-bold">
                <span className="bg-slate-950 text-amber-300 px-3 py-1 rounded-full border border-slate-800">💰 金幣: {player.gold}</span>
                <span className="bg-slate-950 text-cyan-300 px-3 py-1 rounded-full border border-slate-800">💎 精鍊石: {player.refineStones}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {EQUIP_SLOTS.map(s => {
                const rawItem = player.equipped[s.key];
                const item = enrichEquipmentMeta(rawItem);
                return (
                  <div key={s.key} className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-xs flex justify-between items-center gap-2">
                    <div className="min-w-0">
                      <div className="text-slate-400 font-bold">{s.icon} {s.label}</div>
                      {item ? (
                        <>
                          <div className="text-amber-300 font-bold mt-1 truncate">{item.name} (+{item.refineLevel || 0})</div>
                          <div className="text-[10px] text-slate-400 truncate mt-0.5">{item.desc}</div>
                        </>
                      ) : (
                        <div className="text-slate-600 italic mt-1">未裝備</div>
                      )}
                    </div>
                    {item && (
                      <button
                        disabled={isInCombat}
                        onClick={() => handleUnequipItem(s.key)}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-rose-800 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 hover:text-white rounded-xl text-[11px] font-bold shrink-0 transition-all"
                      >
                        {isInCombat ? '🔒 鎖定' : '📤 除下'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap justify-between items-center gap-2">
                <h3 className="font-extrabold text-amber-400 text-base">
                  📦 背包內閒置裝備 ({equipmentInventory.length} 件)
                </h3>
                <button
                  disabled={isInCombat || equipmentInventory.length === 0}
                  onClick={handleBulkSellUnusableEquipment}
                  className="px-3 py-1.5 bg-rose-900/70 hover:bg-rose-800 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-rose-200 border border-rose-700/60 rounded-xl text-xs font-bold transition-all"
                >
                  🧹 一鍵賣出非本職裝備
                </button>
              </div>

              {equipmentInventory.length === 0 ? (
                <div className="text-xs text-slate-500 bg-slate-950 p-4 rounded-xl border border-slate-800">
                  背包中暫無閒置裝備（已穿在身上的裝備可於上方部位欄點擊「📤 除下」退回背包）。
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {equipmentInventory.map(rawItem => {
                    const item = enrichEquipmentMeta(rawItem);
                    const canWear = item.allowedJobs.includes(player.job);
                    return (
                      <div key={item.uid} className={`bg-slate-950 p-3.5 rounded-2xl border flex justify-between items-center gap-3 text-xs ${canWear ? 'border-slate-800' : 'border-rose-950/80 opacity-85'}`}>
                        <div className="min-w-0 space-y-1">
                          <div className="font-bold text-amber-300 flex items-center gap-1.5 flex-wrap">
                            <span>{item.name} (+{item.refineLevel || 0})</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${canWear ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300 border border-rose-800'}`}>
                              {item.equipTag}
                            </span>
                          </div>
                          <div className="text-slate-400 text-[11px]">{item.desc}</div>
                        </div>
                        <div className="flex flex-col gap-1.5 shrink-0">
                          <button
                            disabled={isInCombat || !canWear}
                            onClick={() => handleEquipItem(item)}
                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs transition-all"
                          >
                            {isInCombat ? '🔒 戰鬥鎖定' : !canWear ? '🔒 職業不符' : '裝備上身'}
                          </button>
                          <button
                            disabled={isInCombat}
                            onClick={() => handleSellEquipment(item)}
                            className="px-3 py-1 bg-slate-900 hover:bg-rose-900/80 disabled:opacity-40 disabled:cursor-not-allowed text-amber-300 hover:text-white border border-slate-700 rounded-xl text-[11px] font-mono font-bold transition-all"
                          >
                            💰 賣出 +{item.sellPrice}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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
            {(() => {
              const allForgeable = [
                ...Object.values(player.equipped).filter(Boolean).map(i => ({ ...i, _isEquipped: true })),
                ...equipmentInventory.map(i => ({ ...i, _isEquipped: false }))
              ];
              if (allForgeable.length === 0) {
                return <div className="text-xs text-slate-500 py-6 text-center">目前身上與背包皆無可精鍊的裝備。</div>;
              }
              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {allForgeable.map(item => (
                    <div key={item.uid} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                      <div className="font-bold text-amber-300 text-sm flex items-center justify-between">
                        <span>{item.name} (+{item.refineLevel || 0})</span>
                        {item._isEquipped && (
                          <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-700 px-2 py-0.5 rounded-full">
                            已穿戴
                          </span>
                        )}
                      </div>
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
              );
            })()}
          </div>
        )}

        {/* 6. 陣法五行 */}
        {activeTab === 'formations' && (
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur space-y-4 max-w-4xl mx-auto">
            <div className="flex flex-wrap justify-between items-center gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div>
                  <h2 className="font-extrabold text-amber-400 text-lg">☯️ 陣法與五行機制</h2>
                  <p className="text-xs text-slate-400 mt-0.5">五行相剋：金剋木 → 木剋土 → 土剋水 → 水剋火 → 火剋金</p>
                </div>
                <button
                  onClick={() => setHelpModalTab('elements')}
                  className="text-slate-400 hover:text-amber-300 transition-colors"
                  title="查看五行相剋與狀態說明"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
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
          <HeroTeamTab
            player={player}
            isInCombat={isInCombat}
            isFengShui={isFengShui}
            heroRoster={heroRoster}
            activeHeroInstanceIds={activeHeroInstanceIds}
            heroBattleBuffs={heroBattleBuffs}
            formationSlots={formationSlots}
            currentFormation={currentFormation}
            skillCardsInventory={skillCardsInventory}
            handleRestInn={handleRestInn}
            handleSelectFormation={handleSelectFormation}
            handleSwapFormationSlots={handleSwapFormationSlots}
            handleToggleDeployHero={handleToggleDeployHero}
            handleReleaseHero={handleReleaseHero}
            handleEquipSkillCard={handleEquipSkillCard}
            handleUnequipSkillCard={handleUnequipSkillCard}
            setHelpModalTab={setHelpModalTab}
            getHeroRowIdx={getHeroRowIdx}
          />
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

      {/* (?) 《江湖指南》彈出式說明視窗 */}
      <HelpGuideModal
        helpModalTab={helpModalTab}
        setHelpModalTab={setHelpModalTab}
      />
    </div>
  );
}
