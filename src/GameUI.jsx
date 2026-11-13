import React, { useState } from 'react';
import {
  Swords, Users, Sparkles, Shield, Hammer, User, Compass,
  Castle, Store, BookOpen, Save, HelpCircle, LogOut, Search, Zap, Bot
} from 'lucide-react';
import { ZONES, ELEMENTS } from './data/constants';
import { CLASS_CONFIGS } from './data/classes';
import { FORMATIONS_CONFIG } from './data/formations';
import { PROTAGONIST_SKILLS_DB, getSkillMultiplier } from './data/skills';
import { enrichEquipmentMeta } from './data/equipment';
import { calculateHeroEffectiveStats } from './utils/statCalculator';
import {
  getSkillMeta,
  getZoneSweepReqLevel,
  getMonsterSpeed,
  getSpeedAdvantage
} from './utils/combatEngine';
import HeroRosterTab from './components/HeroRosterTab';
import SkillTreeTab from './components/SkillTreeTab';
import HelpGuideModal from './components/HelpGuideModal';
import BattleResultModals from './components/BattleResultModals';
import {
  CharacterTab,
  ForgeTab,
  FormationsTab,
  TowerTab,
  CodexTab,
  SaveLoadTab
} from './components/SecondaryTabs';

const SHOP_ITEMS = [
  { id: 'stone_1', name: '精鍊石 ×1', price: 150, tag: '鍛造素材', desc: '鐵匠鋪強化裝備必備靈石。' },
  { id: 'stone_5', name: '五連精鍊石禮盒 ×5', price: 700, tag: '超值禮盒', desc: '一次補充 5 顆精鍊石（省 50 金幣）。' },
  { id: 'ration_full', name: '行軍大還丹禮包', price: 120, tag: '即時補給', desc: '立即恢復全隊 100% 生命與內力／彈藥。' },
  { id: 'skill_box', name: '秘傳技能卡盲盒', price: 260, tag: '英雄強化', desc: '隨機開出一張英雄主動或被動強化技能卡。' },
  { id: 'equip_box_mid', name: '江湖兵器箱 (T1~T3)', price: 320, tag: '神兵抽獎', desc: '隨機獲得 Tier 1～3 裝備，25% 機率自帶 +1 精鍊。' },
  { id: 'equip_box_high', name: '天工神兵匣 (T3~T5)', price: 950, tag: '頂級寶匣', desc: '必得 Tier 3～5 名器，有高機率開出靈寶與仙器！' },
  { id: 'hero_scroll_normal', name: '江湖英雄帖 (T1~T3)', price: 380, tag: '英雄招募', desc: '招募 Tier 1～3 俠客（抽到同名英雄可進行合成升星）。' },
  { id: 'hero_scroll_rare', name: '名將點將錄 (T3~T5)', price: 1100, tag: '絕世招募', desc: '必得 Tier 3～5 絕世名將，大幅提升陣容上限！' }
];

const EQUIP_SLOTS = [
  { key: 'weapon', label: '🗡️ 武器' },
  { key: 'offhand', label: '🛡️ 副手' },
  { key: 'helmet', label: '🪖 頭冠' },
  { key: 'armor', label: '🥋 戰甲' },
  { key: 'shoes', label: '👢 戰靴' },
  { key: 'accessory', label: '💍 飾品' }
];

function buildAdaptedClassSkills(job, fallbackSkills = []) {
  if (fallbackSkills && fallbackSkills.length > 0) return fallbackSkills;
  const rawList = PROTAGONIST_SKILLS_DB?.[job] || [];
  return rawList.map((sk, idx) => {
    const unlockLevel = sk.unlockLevel ?? (idx === 0 ? 1 : idx * 5);
    const cd = sk.cd ?? (idx === 0 ? 0 : idx === 1 ? 2 : 4);
    const getStatsAtLevel = sk.getStatsAtLevel || ((lvl = 1) => {
      const effectiveLvl = Math.max(1, lvl);
      const mult = Number(getSkillMultiplier(sk, effectiveLvl).toFixed(2));
      return {
        mult,
        shieldPct: Number((0.25 + (effectiveLvl - 1) * 0.05).toFixed(2)),
        breakPct: Number((0.20 + (effectiveLvl - 1) * 0.05).toFixed(2)),
        reflectPct: Number((0.30 + (effectiveLvl - 1) * 0.05).toFixed(2)),
        blindPct: Number((0.25 + (effectiveLvl - 1) * 0.05).toFixed(2)),
        poisonPct: Number((0.08 + (effectiveLvl - 1) * 0.02).toFixed(2)),
        reviveHpPct: Number((0.35 + (effectiveLvl - 1) * 0.08).toFixed(2)),
        atkBuffPct: Number((0.20 + (effectiveLvl - 1) * 0.05).toFixed(2)),
        bonusDmgPct: Number((0.20 + (effectiveLvl - 1) * 0.05).toFixed(2)),
        reducePct: Number((0.25 + (effectiveLvl - 1) * 0.04).toFixed(2)),
        vulnPct: Number((0.20 + (effectiveLvl - 1) * 0.05).toFixed(2))
      };
    });

    const getDescAtLevel = sk.getDescAtLevel || ((lvl = 1) => {
      const effectiveLvl = Math.max(1, lvl);
      const mult = Number(getSkillMultiplier(sk, effectiveLvl).toFixed(2));
      return `技能倍率 ${mult}x（每升 1 級倍率 +0.3x）`;
    });

    return {
      ...sk,
      unlockLevel,
      cd,
      getStatsAtLevel,
      getDescAtLevel
    };
  });
}

export default function GameUI(props) {
  const {
    gameStarted,
    isInCombat,
    activeTowerFloor,
    autoBattle,
    handleToggleAutoBattle,
    autoTower,
    handleToggleAutoTower,
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
    activeHeroInstanceIds,
    heroRoster,
    handleToggleDeployHero,
    handleFuseHero,
    handleFuseAllHeroes,
    fusionFeedback,
    MAX_HERO_FUSION,
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
    handleSweepZone,
    handleFleeCombat,
    monsters,
    selectedTargetIndex,
    setSelectedTargetIndex,
    combatLogs,
    lastRoundHits,
    combatBuffs,
    heroBattleBuffs,
    turnCount,
    combatPhase,
    activeTab,
    setActiveTab,
    currentZoneIndex,
    spawnEncounter,
    handleExecuteRound,
    equipmentInventory,
    skillCardsInventory,
    forgeFeedback,
    handleRefineEquipment,
    handleSocketGem,
    shopLastReward,
    handleShopPurchase,
    currentFormation,
    towerFloor,
    towerBestFloor,
    handleStartTowerChallenge,
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
  const [selectedSlotForSwap, setSelectedSlotForSwap] = useState(null);

  const isFengShui = player.job === '風水師';
  const isWarlock = player.job === '術士';
  const classInfo = CLASS_CONFIGS[player.job] || CLASS_CONFIGS['猛將'];
  const currentClassSkills = props.classSkills?.length > 0
    ? props.classSkills
    : buildAdaptedClassSkills(player.job, classInfo.skills);
  const sweepReqLevel = getZoneSweepReqLevel(currentZoneIndex);
  const isSweepLevelUnlocked = (player.level || 1) >= sweepReqLevel;
  const isSweepHpReady = (player.hp || 0) > 1;
  const canSweepCurrentZone = isSweepLevelUnlocked && isSweepHpReady;
  const activeFormationMeta = FORMATIONS_CONFIG[currentFormation] || FORMATIONS_CONFIG['none'];

  const getHeroRowIdx = (heroInstanceId) => {
    const foundKey = Object.keys(formationSlots || {}).find(k => formationSlots[k] === heroInstanceId);
    return foundKey !== undefined ? Math.floor(Number(foundKey) / 3) : 1;
  };

  // ==================== 創角畫面 ====================
  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-3xl w-full bg-slate-900/90 border border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black text-amber-400 tracking-wider">⚔️ 《泰太 Online》文字武俠 RPG</h1>
            <p className="text-xs text-slate-400">創立少俠名號、選擇本命五行與門派職業，招募同行俠客踏入江湖</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-amber-300">少俠名號</label>
              <input
                type="text"
                value={creationData.name}
                onChange={(e) => setCreationData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-100 focus:outline-none focus:border-amber-500"
                placeholder="輸入少俠名稱"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-amber-300">本命五行屬性</label>
              <div className="grid grid-cols-5 gap-1.5">
                {Object.keys(ELEMENTS).map(elKey => (
                  <button
                    key={elKey}
                    type="button"
                    onClick={() => setCreationData(prev => ({ ...prev, element: elKey }))}
                    className={`py-2 rounded-xl border text-xs font-bold transition-all ${
                      creationData.element === elKey
                        ? 'bg-amber-600 border-amber-300 text-slate-950 font-black'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    {ELEMENTS[elKey].icon} {elKey}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-amber-300">選擇江湖職業</label>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
              {Object.keys(CLASS_CONFIGS).map(jobKey => {
                const cfg = CLASS_CONFIGS[jobKey];
                const selected = creationData.job === jobKey;
                return (
                  <button
                    key={jobKey}
                    type="button"
                    onClick={() => setCreationData(prev => ({ ...prev, job: jobKey }))}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      selected
                        ? 'bg-amber-950/50 border-amber-400 ring-1 ring-amber-400'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-extrabold text-sm text-amber-300">{cfg.icon} {jobKey}</div>
                    <div className="text-[11px] text-slate-400 mt-1 line-clamp-2">{cfg.passiveName}</div>
                  </button>
                );
              })}
            </div>
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-xs text-slate-300">
              <strong className="text-emerald-300">{CLASS_CONFIGS[creationData.job]?.passiveName}：</strong>
              {CLASS_CONFIGS[creationData.job]?.passiveDesc}
            </div>
          </div>

          {starterHeroCandidates.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-amber-300">選擇同行初始夥伴（Tier 1 俠客）</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {starterHeroCandidates.map(cand => {
                  const selected = creationData.selectedStarterHero?.instanceId === cand.instanceId;
                  return (
                    <button
                      key={cand.instanceId}
                      type="button"
                      onClick={() => setCreationData(prev => ({ ...prev, selectedStarterHero: cand }))}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        selected
                          ? 'bg-emerald-950/40 border-emerald-400'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-bold text-xs text-amber-300">
                        {cand.icon || '🧑'} {cand.name} ({cand.heroClass})
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        {ELEMENTS[cand.element]?.icon} {cand.element}屬性 • 攻 {cand.atk} / 血 {cand.maxHp}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleStartGame}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-black text-base shadow-xl transition-all"
          >
            ⚔️ 踏入《泰太 Online》江湖
          </button>
        </div>
      </div>
    );
  }

  // ==================== 主遊戲畫面 ====================
  const NAV_TABS = [
    { id: 'combat', label: '歷練戰鬥', icon: Swords },
    { id: 'heroes', label: `英雄名冊 (${heroRoster.length})`, icon: Users },
    { id: 'skills', label: `技能樹${player.sp > 0 ? ` (${player.sp})` : ''}`, icon: Sparkles },
    { id: 'equip', label: `裝備背包 (${equipmentInventory.length})`, icon: Shield },
    { id: 'forge', label: '鐵匠精鍊', icon: Hammer },
    { id: 'character', label: `屬性配點${player.statPoints > 0 ? ` (${player.statPoints})` : ''}`, icon: User },
    { id: 'formations', label: '陣法五行', icon: Compass },
    { id: 'tower', label: `鎮魔塔 (${towerFloor}層)${autoTower ? '・自動' : ''}`, icon: Castle },
    { id: 'shop', label: '江湖市集', icon: Store },
    { id: 'codex', label: '英雄圖鑑', icon: BookOpen },
    { id: 'saveload', label: '存檔管理', icon: Save }
  ];

  const handleSlotClick = (slotIdx) => {
    if (isInCombat) return;
    // 僅允許點擊當前陣法已開放的陣眼槽位
    if (!Object.prototype.hasOwnProperty.call(formationSlots || {}, slotIdx)) return;

    if (selectedSlotForSwap === null) {
      setSelectedSlotForSwap(slotIdx);
    } else if (selectedSlotForSwap === slotIdx) {
      setSelectedSlotForSwap(null);
    } else {
      handleSwapFormationSlots(selectedSlotForSwap, slotIdx);
      setSelectedSlotForSwap(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-12">
      {/* 頂部狀態欄 */}
      <header className="sticky top-0 z-30 bg-slate-950/95 border-b border-slate-800 backdrop-blur px-4 py-3">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="font-black text-amber-400 text-base sm:text-lg">⚔️ 泰太 Online</span>
            <span className="text-xs bg-slate-900 border border-slate-700 px-2.5 py-1 rounded-full font-bold text-slate-200">
              {player.name} • Lv.{player.level} {player.job} ({ELEMENTS[player.element]?.icon}{player.element})
            </span>
            {isInCombat && (
              <span className="text-xs bg-rose-950 border border-rose-500 text-rose-200 px-2.5 py-1 rounded-full font-bold animate-pulse">
                🔥 戰鬥鎖定中 (第 {turnCount} 回合)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap font-mono text-xs">
            <span className="bg-rose-950/70 border border-rose-800 text-rose-200 px-2.5 py-1 rounded-lg font-bold">
              ❤️ {player.hp}/{playerTotalMaxHp}
            </span>
            <span className="bg-cyan-950/70 border border-cyan-800 text-cyan-200 px-2.5 py-1 rounded-lg font-bold">
              {player.job === '猛將'
                ? `🔥 怒氣 ${player.rage}/100`
                : player.job === '巧匠'
                  ? `🏹 彈藥 ${player.ammo}/${player.maxAmmo}`
                  : `💧 內力 ${player.mp}/${playerTotalMaxMp}`}
            </span>
            <span className="bg-slate-900 border border-slate-800 text-amber-300 px-2.5 py-1 rounded-lg font-bold">
              💰 {player.gold}
            </span>
            <span className="bg-slate-900 border border-slate-800 text-cyan-300 px-2.5 py-1 rounded-lg font-bold">
              💎 {player.refineStones}
            </span>
            <button
              onClick={() => setHelpModalTab('combat')}
              className="flex items-center gap-1 bg-amber-600/20 hover:bg-amber-600/40 border border-amber-500/50 text-amber-300 px-2.5 py-1 rounded-lg font-bold transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>江湖指南</span>
            </button>
          </div>
        </div>
      </header>

      {/* 分頁導覽列 */}
      <nav className="max-w-6xl mx-auto px-4 pt-4 pb-2">
        <div className="flex gap-1.5 overflow-x-auto pb-2">
          {NAV_TABS.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  active
                    ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* 主要內容區 */}
      <main className="max-w-6xl mx-auto px-4 pt-2">
        {/* ==================== 1. 歷練戰鬥頁 ==================== */}
        {activeTab === 'combat' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* 左側戰場與操作區 */}
            <div className="lg:col-span-7 space-y-4">
              {/* 地圖選擇、搜敵、快速掃蕩與自動戰鬥控制 */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-amber-400">
                    {activeTowerFloor
                      ? `🗼 鎮魔塔第 ${activeTowerFloor} 層戰場`
                      : `🗺️ 歷練區域：${ZONES[currentZoneIndex]?.name}`}
                  </span>
                  <div className="flex gap-1.5 flex-wrap">
                    {ZONES.map((z, idx) => (
                      <button
                        key={z.name}
                        disabled={isInCombat}
                        onClick={() => handleSelectZone(idx)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all disabled:opacity-40 ${
                          !activeTowerFloor && currentZoneIndex === idx
                            ? 'bg-amber-600 border-amber-400 text-slate-950 font-black'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-600'
                        }`}
                      >
                        {z.name}
                      </button>
                    ))}
                  </div>
                </div>

                {!isInCombat ? (
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => spawnEncounter(currentZoneIndex)}
                      className="flex-1 min-w-[160px] py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-lg transition-all"
                    >
                      <Search className="w-4 h-4" />
                      <span>🔍 尋找怪群</span>
                    </button>

                    <button
                      disabled={!canSweepCurrentZone}
                      onClick={() => handleSweepZone(3)}
                      title={
                        !isSweepLevelUnlocked
                          ? `需少俠達到 Lv.${sweepReqLevel} 解鎖此區域快速掃蕩`
                          : !isSweepHpReady
                            ? '少俠氣血過低，請先客棧休養再掃蕩'
                            : '一鍵模擬連戰 3 場並承受真實戰損（中途戰敗即中止）'
                      }
                      className="py-3 px-3.5 rounded-2xl bg-gradient-to-r from-purple-700 to-indigo-600 hover:from-purple-600 hover:to-indigo-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-black text-xs flex items-center justify-center gap-1.5 shadow transition-all"
                    >
                      <Zap className="w-4 h-4" />
                      <span>
                        {!isSweepLevelUnlocked
                          ? `🔒 掃蕩 (Lv.${sweepReqLevel})`
                          : !isSweepHpReady
                            ? '⚠️ 氣血過低'
                            : '⚡ 快速掃蕩 ×3'}
                      </span>
                    </button>

                    <button
                      onClick={handleToggleAutoBattle}
                      className={`py-3 px-3.5 rounded-2xl font-black text-xs flex items-center justify-center gap-1.5 border transition-all ${
                        autoBattle
                          ? 'bg-cyan-600 border-cyan-300 text-slate-950 shadow-lg shadow-cyan-500/20'
                          : 'bg-slate-950 border-slate-700 text-slate-300 hover:border-cyan-500'
                      }`}
                    >
                      <Bot className="w-4 h-4" />
                      <span>{autoBattle ? '🤖 自動戰鬥：開' : '🤖 自動戰鬥：關'}</span>
                    </button>

                    <button
                      onClick={handleRestInn}
                      className="py-3 px-3.5 rounded-2xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs shadow transition-all"
                    >
                      🏨 客棧回滿
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-950/90 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs">
                    <span className="text-slate-300">
                      護盾：<strong className="text-cyan-300">{combatBuffs.shield || 0}</strong> • 速度先手排序制
                    </span>
                    <div className="flex items-center gap-2 flex-wrap">
                      {activeTowerFloor && (
                        <button
                          onClick={handleToggleAutoTower}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-black border transition-all ${
                            autoTower
                              ? 'bg-amber-500 border-amber-300 text-slate-950'
                              : 'bg-slate-900 border-slate-700 text-amber-300 hover:border-amber-500'
                          }`}
                        >
                          <Castle className="w-3.5 h-3.5" />
                          <span>{autoTower ? '🗼 自動爬塔：開' : '🗼 自動爬塔：關'}</span>
                        </button>
                      )}

                      <button
                        onClick={handleToggleAutoBattle}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-black border transition-all ${
                          autoBattle
                            ? 'bg-cyan-500 border-cyan-300 text-slate-950 animate-pulse'
                            : 'bg-slate-900 border-slate-700 text-cyan-300 hover:border-cyan-500'
                        }`}
                      >
                        <Bot className="w-3.5 h-3.5" />
                        <span>{autoBattle ? '🤖 自動託管中 (點擊接管)' : '🤖 開啟自動戰鬥'}</span>
                      </button>

                      <button
                        onClick={handleFleeCombat}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-900/80 hover:bg-rose-800 text-rose-200 font-bold border border-rose-700 transition-all"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>撤退 (65%)</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 敵方怪群區（含五行相剋即時提示與速度對比） */}
              {isInCombat && (
                <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-extrabold text-rose-400">👹 敵方陣容（點擊鎖定主目標）</span>
                    <span className="text-[11px] text-slate-400">
                      少俠五行：<strong className="text-amber-300">{ELEMENTS[player.element]?.icon}{player.element}</strong>（剋 {ELEMENTS[player.element]?.counters}）
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {monsters.map((m, idx) => {
                      const dead = m.hp <= 0;
                      const isTarget = selectedTargetIndex === idx && !dead;
                      const hpPct = Math.max(0, Math.min(100, Math.round((m.hp / Math.max(1, m.maxHp)) * 100)));
                      const hitInfo = lastRoundHits?.monsters?.[m.id];

                      const mSpeed = getMonsterSpeed(m);
                      const { doubleStrikeRate } = getSpeedAdvantage(playerTotalSpeed, mSpeed);
                      const isCounteredByPlayer = ELEMENTS[player.element]?.counters === m.element;
                      const countersPlayer = ELEMENTS[m.element]?.counters === player.element;

                      return (
                        <div
                          key={m.id}
                          onClick={() => !dead && setSelectedTargetIndex(idx)}
                          className={`p-3 rounded-2xl border transition-all relative ${
                            dead
                              ? 'bg-slate-950/40 border-slate-900 opacity-40'
                              : isTarget
                                ? 'bg-rose-950/30 border-amber-400 ring-1 ring-amber-400 cursor-pointer'
                                : 'bg-slate-950 border-slate-800 hover:border-slate-600 cursor-pointer'
                          }`}
                        >
                          <div className="flex justify-between items-center gap-1.5 text-xs font-bold">
                            <span className="text-slate-100 truncate">
                              {isTarget ? '🎯 ' : ''}{m.name}
                            </span>
                            <div className="flex items-center gap-1 shrink-0">
                              {!dead && isCounteredByPlayer && (
                                <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-600 px-1.5 py-0.2 rounded font-black">
                                  🔥 剋制 ({isWarlock ? '1.45x' : '1.3x'})
                                </span>
                              )}
                              {!dead && countersPlayer && (
                                <span className="text-[10px] bg-rose-950 text-rose-300 border border-rose-700 px-1.5 py-0.2 rounded font-bold">
                                  ⚠️ 被剋 (0.75x)
                                </span>
                              )}
                              <span className="text-[11px] font-mono text-amber-300">
                                {ELEMENTS[m.element]?.icon}{m.element}
                              </span>
                            </div>
                          </div>

                          <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden mt-2 border border-slate-800">
                            <div className="bg-rose-500 h-full transition-all" style={{ width: `${hpPct}%` }} />
                          </div>

                          <div className="flex justify-between items-center text-[11px] font-mono text-slate-400 mt-1">
                            <span>HP {m.hp}/{m.maxHp}</span>
                            <span>
                              攻 {m.atk} / 防 {m.def} / 速 <strong className={playerTotalSpeed > mSpeed ? 'text-emerald-300' : 'text-slate-300'}>{mSpeed}</strong>
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {!dead && doubleStrikeRate > 0 && (
                              <span className="text-[10px] bg-cyan-950/70 text-cyan-300 border border-cyan-800 px-1.5 rounded font-mono">
                                ⚡ 連擊 +{Math.round(doubleStrikeRate * 100)}%
                              </span>
                            )}
                            {m.armorBreakTurns > 0 && (
                              <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-700 px-1.5 rounded">
                                破甲 {m.armorBreakTurns}T
                              </span>
                            )}
                            {m.poisonTurns > 0 && (
                              <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-700 px-1.5 rounded">
                                劇毒×{m.poisonStacks || 1} ({m.poisonTurns}T)
                              </span>
                            )}
                            {m.burnTurns > 0 && (
                              <span className="text-[10px] bg-orange-950 text-orange-300 border border-orange-700 px-1.5 rounded">
                                灼燒 {m.burnTurns}T
                              </span>
                            )}
                            {m.blindTurns > 0 && (
                              <span className="text-[10px] bg-purple-950 text-purple-300 border border-purple-700 px-1.5 rounded">
                                致盲 {m.blindTurns}T
                              </span>
                            )}
                            {m.vulnTurns > 0 && (
                              <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-700 px-1.5 rounded">
                                易傷 {m.vulnTurns}T
                              </span>
                            )}
                            {hitInfo?.dmg > 0 && (
                              <span
                                className={`text-[10px] font-mono font-black px-1.5 rounded ml-auto ${
                                  hitInfo.isCrit
                                    ? 'bg-amber-500/30 border border-amber-400 text-amber-200'
                                    : 'bg-cyan-950 border border-cyan-700 text-cyan-200'
                                }`}
                              >
                                {hitInfo.isCrit ? `💥-${hitInfo.dmg}` : `-${hitInfo.dmg}`}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 我方九宮陣法與排位狀態 */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 space-y-2.5">
                <div className="flex flex-wrap justify-between items-center gap-1.5 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-emerald-400">🛡️ 我方戰術站位</span>
                    <span className="text-[11px] bg-slate-950 border border-slate-700 text-amber-300 px-2 py-0.5 rounded-full font-bold">
                      {activeFormationMeta.icon} {activeFormationMeta.name}（5 陣眼）
                    </span>
                  </div>
                  {!isInCombat && (
                    <span className="text-[11px] text-slate-400">
                      {selectedSlotForSwap !== null ? '✨ 請點擊另一處亮起陣眼互換位置' : '點擊亮起陣眼可互換角色站位'}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[0, 1, 2].map(rowIdx => {
                    const rowNames = ['🛡️ 前排 (60%受擊)', '⚡ 中排 (25%受擊)', '✨ 後排 (15%受擊)'];
                    return (
                      <div key={rowIdx} className="space-y-1.5">
                        <div className="text-[10px] text-center font-bold text-slate-400 bg-slate-950 py-1 rounded-lg border border-slate-800">
                          {rowNames[rowIdx]}
                        </div>
                        {[0, 1, 2].map(colIdx => {
                          const slotIdx = rowIdx * 3 + colIdx;
                          const isAvailableSlot = Object.prototype.hasOwnProperty.call(formationSlots || {}, slotIdx);
                          const occupant = isAvailableSlot ? formationSlots[slotIdx] : undefined;
                          const isSelectedSwap = selectedSlotForSwap === slotIdx;

                          // 1. 該陣法未開放的格子：明確標記為「非陣眼位」並禁用點擊
                          if (!isAvailableSlot) {
                            return (
                              <div
                                key={slotIdx}
                                title="此位置不屬於當前陣法的有效陣眼，無法駐守角色"
                                className="p-2 rounded-xl border border-dashed border-slate-800/40 bg-slate-950/25 text-[10px] text-center h-[54px] flex flex-col items-center justify-center text-slate-600/80 select-none cursor-not-allowed"
                              >
                                <span>🚫 非陣眼位</span>
                              </div>
                            );
                          }

                          // 2. 少俠主角所在槽位
                          if (occupant === 'PLAYER') {
                            const allyHit = lastRoundHits?.allies?.PLAYER;
                            return (
                              <div
                                key={slotIdx}
                                onClick={() => handleSlotClick(slotIdx)}
                                className={`p-2 rounded-xl border text-xs h-[54px] flex flex-col justify-center transition-all ${
                                  !isInCombat ? 'cursor-pointer hover:border-amber-400' : ''
                                } ${
                                  isSelectedSwap
                                    ? 'bg-amber-900/50 border-amber-300 ring-1 ring-amber-300'
                                    : 'bg-amber-950/30 border-amber-500/60'
                                }`}
                              >
                                <div className="font-black text-amber-300 truncate">👑 {player.name}</div>
                                <div className="flex items-center justify-between text-[10px] font-mono text-rose-300">
                                  <span>HP {player.hp}/{playerTotalMaxHp}</span>
                                  {allyHit?.dmg > 0 && <span className="font-bold">-{allyHit.dmg}</span>}
                                </div>
                              </div>
                            );
                          }

                          // 3. 出戰英雄所在槽位
                          const hero = occupant ? heroRoster.find(h => h.instanceId === occupant) : null;
                          if (hero) {
                            const { effectiveMaxHp } = calculateHeroEffectiveStats(hero, isFengShui, heroBattleBuffs[hero.instanceId], rowIdx);
                            const allyHit = lastRoundHits?.allies?.[hero.instanceId];
                            return (
                              <div
                                key={slotIdx}
                                onClick={() => handleSlotClick(slotIdx)}
                                className={`p-2 rounded-xl border text-xs h-[54px] flex flex-col justify-center transition-all ${
                                  !isInCombat ? 'cursor-pointer hover:border-emerald-400' : ''
                                } ${
                                  isSelectedSwap
                                    ? 'bg-amber-900/50 border-amber-300 ring-1 ring-amber-300'
                                    : hero.hp <= 0
                                      ? 'bg-slate-950/50 border-rose-900/60 opacity-50'
                                      : 'bg-slate-950 border-slate-700'
                                }`}
                              >
                                <div className="font-bold text-emerald-300 truncate">
                                  {hero.name} {hero.fusionLevel > 0 ? `★+${hero.fusionLevel}` : ''}
                                </div>
                                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                                  <span>HP {hero.hp}/{effectiveMaxHp}</span>
                                  {allyHit?.dmg > 0 && <span className="font-bold text-rose-300">-{allyHit.dmg}</span>}
                                </div>
                              </div>
                            );
                          }

                          // 4. 已開放但尚無角色駐守的有效陣眼空位
                          return (
                            <div
                              key={slotIdx}
                              onClick={() => handleSlotClick(slotIdx)}
                              className={`p-2 rounded-xl border border-dashed text-[10px] text-center h-[54px] flex flex-col items-center justify-center transition-all ${
                                !isInCombat ? 'cursor-pointer hover:border-emerald-400/70 hover:text-emerald-300' : ''
                              } ${
                                isSelectedSwap
                                  ? 'border-amber-400 bg-amber-950/30 text-amber-300 ring-1 ring-amber-400'
                                  : 'border-emerald-800/60 bg-emerald-950/10 text-emerald-400/80'
                              }`}
                            >
                              <span>✨ 可駐守空位</span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 戰鬥指令操作欄 */}
              {isInCombat && (
                <div className="bg-slate-900/90 border border-amber-500/40 rounded-3xl p-4 space-y-2.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-extrabold text-amber-300">⚔️ 選擇本回合行動指令</span>
                    {autoBattle && (
                      <span className="text-[11px] font-bold text-cyan-300">
                        🤖 自動戰鬥運作中（點上方按鈕可隨時接管）
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      disabled={combatPhase !== 'PLAYER_SELECT'}
                      onClick={() => handleExecuteRound({ type: 'attack' })}
                      className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-left transition-all disabled:opacity-40"
                    >
                      <div className="font-black text-xs text-slate-100">🗡️ 普通攻擊（回復職業資源）</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">無消耗・速度領先時機率觸發 50% 威力連擊</div>
                    </button>

                    {currentClassSkills.map((sk, idx) => {
                      const skLvl = player.skillLevels?.[idx] || 0;
                      const { unlockLevel } = getSkillMeta(sk, idx);
                      const cdLeft = combatBuffs.skillCooldowns?.[idx] || 0;
                      const lockedByLvl = player.level < unlockLevel;
                      const notLearned = skLvl <= 0;
                      const onCd = cdLeft > 0;
                      const costLabel = sk.costType === 'rage' ? `${sk.cost}怒` : sk.costType === 'ammo' ? `${sk.cost}彈` : `${sk.cost}MP`;

                      return (
                        <button
                          key={sk.id}
                          disabled={combatPhase !== 'PLAYER_SELECT' || lockedByLvl || notLearned || onCd}
                          onClick={() => handleExecuteRound({ type: 'skill', skill: sk, skillIdx: idx })}
                          className="p-3 rounded-2xl bg-amber-950/40 hover:bg-amber-900/50 border border-amber-600/60 disabled:bg-slate-950 disabled:border-slate-800 disabled:opacity-45 text-left transition-all"
                        >
                          <div className="flex justify-between items-center text-xs font-extrabold text-amber-300">
                            <span>✨ {sk.name} {skLvl > 0 ? `(Lv.${skLvl})` : ''}</span>
                            <span className="font-mono text-[11px] text-cyan-300">
                              {lockedByLvl
                                ? `🔒 Lv.${unlockLevel}解鎖`
                                : notLearned
                                  ? '未學習'
                                  : onCd
                                    ? `⏳ CD ${cdLeft}T`
                                    : costLabel}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-300 mt-0.5 line-clamp-1">{sk.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 右側即時戰報日誌 */}
            <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-3xl p-4 flex flex-col h-[560px]">
              <div className="text-xs font-extrabold text-amber-400 border-b border-slate-800 pb-2.5 mb-2.5 flex justify-between items-center">
                <span>📜 即時江湖戰報</span>
                <span className="text-[11px] font-mono text-slate-400">總攻 {playerTotalAtk} • 總防 {playerTotalDef} • 速 {playerTotalSpeed}</span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 text-xs leading-relaxed">
                {combatLogs.map(log => {
                  let style = 'text-slate-300 bg-slate-950/60 border-slate-800/70';
                  if (log.dmgRole === 'player_crit') style = 'text-amber-200 bg-amber-500/20 border-amber-400 font-bold';
                  else if (log.dmgRole === 'player_normal') style = 'text-cyan-200 bg-cyan-950/50 border-cyan-800/70';
                  else if (log.dmgRole === 'monster_crit') style = 'text-rose-100 bg-rose-600/35 border-rose-400 font-bold';
                  else if (log.dmgRole === 'monster_normal') style = 'text-rose-300 bg-rose-950/40 border-rose-900/70';
                  else if (log.dmgRole === 'heal' || log.dmgRole === 'shield') style = 'text-emerald-200 bg-emerald-950/50 border-emerald-700/70';
                  else if (log.type === 'danger') style = 'text-rose-300 bg-rose-950/60 border-rose-700 font-bold';
                  else if (log.type === 'sys') style = 'text-amber-300/90 bg-slate-950/90 border-slate-800';

                  return (
                    <div key={log.id} className={`px-3 py-1.5 rounded-xl border ${style}`}>
                      <span className="text-[10px] font-mono text-slate-500 mr-1.5">[T{log.turn}]</span>
                      <span>{log.text}</span>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>
            </div>
          </div>
        )}

        {/* ==================== 2. 英雄名冊與同名合成頁 ==================== */}
        {activeTab === 'heroes' && (
          <HeroRosterTab
            isInCombat={isInCombat}
            isFengShui={isFengShui}
            heroRoster={heroRoster}
            activeHeroInstanceIds={activeHeroInstanceIds}
            skillCardsInventory={skillCardsInventory}
            handleToggleDeployHero={handleToggleDeployHero}
            handleFuseHero={handleFuseHero}
            handleFuseAllHeroes={handleFuseAllHeroes}
            fusionFeedback={fusionFeedback}
            MAX_HERO_FUSION={MAX_HERO_FUSION}
            handleReleaseHero={handleReleaseHero}
            handleEquipSkillCard={handleEquipSkillCard}
            handleUnequipSkillCard={handleUnequipSkillCard}
            handleRestInn={handleRestInn}
            getHeroRowIdx={getHeroRowIdx}
            setHelpModalTab={setHelpModalTab}
          />
        )}

        {/* ==================== 3. 職業技能樹 ==================== */}
        {activeTab === 'skills' && (
          <SkillTreeTab
            player={player}
            setPlayer={setPlayer}
            classSkills={currentClassSkills}
            setHelpModalTab={setHelpModalTab}
          />
        )}

        {/* ==================== 4. 裝備與背包 ==================== */}
        {activeTab === 'equip' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 max-w-5xl mx-auto">
            <div className="flex flex-wrap justify-between items-center gap-2 border-b border-slate-800 pb-3">
              <h2 className="font-extrabold text-amber-400 text-lg">🛡️ 少俠已穿戴神兵與裝備背包</h2>
              <button
                disabled={isInCombat}
                onClick={handleBulkSellUnusableEquipment}
                className="px-3.5 py-1.5 rounded-xl bg-rose-900/80 hover:bg-rose-800 disabled:opacity-40 text-rose-200 font-bold text-xs border border-rose-700"
              >
                🧹 一鍵賣出非本職白板裝
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {EQUIP_SLOTS.map(slot => {
                const rawItem = player.equipped?.[slot.key];
                const item = rawItem ? enrichEquipmentMeta(rawItem) : null;
                return (
                  <div key={slot.key} className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-400">{slot.label}</span>
                      {item && (
                        <button
                          disabled={isInCombat}
                          onClick={() => handleUnequipItem(slot.key)}
                          className="text-[11px] text-rose-300 hover:underline disabled:opacity-40"
                        >
                          卸下
                        </button>
                      )}
                    </div>
                    {item ? (
                      <div className="space-y-1">
                        <div className="font-bold text-amber-300 text-xs flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded border ${item.tierBadgeStyle}`}>{item.tierTag}</span>
                          <span>{item.name} (+{item.refineLevel})</span>
                        </div>
                        <div className="text-[11px] text-slate-300">{item.desc}</div>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-600 italic py-2">尚未穿戴裝備</div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="space-y-2.5">
              <div className="text-xs font-bold text-amber-300">🎒 裝備背包（{equipmentInventory.length} 件）</div>
              {equipmentInventory.length === 0 ? (
                <div className="text-xs text-slate-500 py-6 text-center">背包目前空空如也。</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {equipmentInventory.map(rawItem => {
                    const item = enrichEquipmentMeta(rawItem);
                    const jobAllowed = item.allowedJobs.includes(player.job);
                    return (
                      <div key={item.uid} className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex flex-col justify-between gap-2.5">
                        <div className="space-y-1">
                          <div className="flex justify-between items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-1.5 font-bold text-xs text-amber-300">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded border ${item.tierBadgeStyle}`}>{item.tierTag}</span>
                              <span>{item.name} (+{item.refineLevel})</span>
                            </div>
                            <span className={`text-[10px] px-2 py-0.5 rounded border ${jobAllowed ? 'bg-emerald-950 text-emerald-300 border-emerald-700' : 'bg-rose-950 text-rose-300 border-rose-700'}`}>
                              {item.equipTag}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-300">{item.desc}</div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            disabled={isInCombat || !jobAllowed}
                            onClick={() => handleEquipItem(rawItem)}
                            className="flex-1 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-xs"
                          >
                            {jobAllowed ? '穿戴裝備' : '職業不符'}
                          </button>
                          <button
                            disabled={isInCombat}
                            onClick={() => handleSellEquipment(rawItem)}
                            className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-rose-900 text-amber-300 font-bold text-xs disabled:opacity-40"
                          >
                            賣出 (+{item.sellPrice}金)
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

        {/* ==================== 5. 鐵匠精鍊 ==================== */}
        {activeTab === 'forge' && (
          <ForgeTab
            player={player}
            isInCombat={isInCombat}
            equipmentInventory={equipmentInventory}
            forgeFeedback={forgeFeedback}
            handleRefineEquipment={handleRefineEquipment}
            handleSocketGem={handleSocketGem}
            setHelpModalTab={setHelpModalTab}
          />
        )}

        {/* ==================== 6. 主角屬性配點 ==================== */}
        {activeTab === 'character' && (
          <CharacterTab
            player={player}
            setPlayer={setPlayer}
            classInfo={classInfo}
            playerTotalMaxHp={playerTotalMaxHp}
            playerTotalMaxMp={playerTotalMaxMp}
            playerTotalAtk={playerTotalAtk}
            playerTotalDef={playerTotalDef}
            playerTotalSpeed={playerTotalSpeed}
          />
        )}

        {/* ==================== 7. 陣法五行 ==================== */}
        {activeTab === 'formations' && (
          <FormationsTab
            isFengShui={isFengShui}
            isInCombat={isInCombat}
            currentFormation={currentFormation}
            handleSelectFormation={handleSelectFormation}
            setHelpModalTab={setHelpModalTab}
          />
        )}

        {/* ==================== 8. 鎮魔塔 ==================== */}
        {activeTab === 'tower' && (
          <TowerTab
            towerFloor={towerFloor}
            towerBestFloor={towerBestFloor}
            isInCombat={isInCombat}
            autoTower={autoTower}
            handleToggleAutoTower={handleToggleAutoTower}
            handleStartTowerChallenge={handleStartTowerChallenge}
          />
        )}

        {/* ==================== 9. 江湖市集 ==================== */}
        {activeTab === 'shop' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 max-w-5xl mx-auto">
            <div className="flex flex-wrap justify-between items-center gap-2 border-b border-slate-800 pb-3">
              <div>
                <h2 className="font-extrabold text-amber-400 text-lg">🏮 江湖行腳商市集</h2>
                <p className="text-xs text-slate-400 mt-0.5">購買精鍊石、神兵寶匣、強化技能卡與招募同名英雄進行合成突破</p>
              </div>
              <span className="text-xs font-mono font-bold bg-slate-950 text-amber-300 px-3.5 py-1.5 rounded-full border border-slate-800">
                💰 持有金幣：{player.gold}
              </span>
            </div>

            {shopLastReward && (
              <div className="bg-emerald-950/60 border border-emerald-500/70 text-emerald-200 rounded-2xl p-3.5 text-xs sm:text-sm font-bold">
                {shopLastReward}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {SHOP_ITEMS.map(item => {
                const canBuy = !isInCombat && player.gold >= item.price;
                return (
                  <div key={item.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-3">
                    <div className="space-y-1.5">
                      <span className="text-[10px] bg-amber-950/60 text-amber-300 border border-amber-700/60 px-2 py-0.5 rounded font-bold">
                        {item.tag}
                      </span>
                      <div className="font-extrabold text-sm text-slate-100">{item.name}</div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">{item.desc}</p>
                    </div>
                    <button
                      disabled={!canBuy}
                      onClick={() => handleShopPurchase(item)}
                      className="w-full py-2 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-xs transition-all"
                    >
                      {isInCombat ? '🔒 戰鬥中' : `💰 ${item.price} 金幣購買`}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ==================== 10. 英雄圖鑑 ==================== */}
        {activeTab === 'codex' && <CodexTab heroRoster={heroRoster} />}

        {/* ==================== 11. 存檔管理 ==================== */}
        {activeTab === 'saveload' && (
          <SaveLoadTab
            isInCombat={isInCombat}
            saveLoadStatus={saveLoadStatus}
            jsonSaveText={jsonSaveText}
            setJsonSaveText={setJsonSaveText}
            handleExportSave={handleExportSave}
            handleImportSave={handleImportSave}
            handleResetSave={handleResetSave}
          />
        )}
      </main>

      {/* 戰鬥勝利 / 快速掃蕩 / 戰敗結算視窗 */}
      <BattleResultModals
        victorySummary={victorySummary}
        setVictorySummary={setVictorySummary}
        defeatSummary={defeatSummary}
        setDefeatSummary={setDefeatSummary}
        handleRestInn={handleRestInn}
        autoTower={autoTower}
        handleToggleAutoTower={handleToggleAutoTower}
      />

      {/* 江湖指南彈窗 */}
      <HelpGuideModal helpModalTab={helpModalTab} setHelpModalTab={setHelpModalTab} />
    </div>
  );
}
