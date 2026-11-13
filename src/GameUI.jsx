import React, { useState, useMemo } from 'react';
import {
  Swords, Users, Sparkles, Shield, Hammer, User, Compass,
  Castle, Store, BookOpen, Save, HelpCircle, LogOut, Search, Zap, Bot, FastForward, Filter
} from 'lucide-react';
import { ZONES, ELEMENTS } from './data/constants';
import { CLASS_CONFIGS } from './data/classes';
import { FORMATIONS_CONFIG } from './data/formations';
import { PROTAGONIST_SKILLS_DB, getSkillMultiplier } from './data/skills';
import { enrichEquipmentMeta, getActiveSetBonuses } from './data/equipment';
import { calculateHeroEffectiveStats } from './utils/statCalculator';
import {
  getSkillMeta,
  getZoneSweepReqLevel,
  getMonsterSpeed,
  getSpeedAdvantage
} from './utils/combatEngine';
import HeroRosterTab from './components/HeroRosterTab';
import SkillTreeTab from './components/SkillTreeTab';
import ShopTab from './components/ShopTab';
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

const EQUIP_SLOTS = [
  { key: 'weapon', label: '🗡️ 武器', short: '武器' },
  { key: 'offhand', label: '🛡️ 副手', short: '副手' },
  { key: 'helmet', label: '🪖 頭冠', short: '頭冠' },
  { key: 'armor', label: '🥋 戰甲', short: '戰甲' },
  { key: 'shoes', label: '👢 戰靴', short: '戰靴' },
  { key: 'accessory', label: '💍 飾品', short: '飾品' }
];

const TIER_FILTER_OPTIONS = [
  { tier: 1, label: 'T1 凡鐵' },
  { tier: 2, label: 'T2 精鋼' },
  { tier: 3, label: 'T3 玄鐵' },
  { tier: 4, label: 'T4 靈寶' }
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
    battleSpeed = 1,
    handleCycleBattleSpeed,
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
    handleBulkSellFilteredEquipment,
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
    handleReforgeEquipment,
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
  const [logFilter, setLogFilter] = useState('all');

  // 批量清理篩選面板狀態
  const [showBulkCleanPanel, setShowBulkCleanPanel] = useState(false);
  const [cleanTiers, setCleanTiers] = useState([1, 2]);
  const [cleanTypes, setCleanTypes] = useState(['weapon', 'offhand', 'helmet', 'armor', 'shoes', 'accessory']);
  const [cleanOnlyUnusable, setCleanOnlyUnusable] = useState(false);
  const [cleanProtectModified, setCleanProtectModified] = useState(true);

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

  const filteredCombatLogs = useMemo(() => {
    if (logFilter === 'all') return combatLogs;
    if (logFilter === 'combat') {
      return combatLogs.filter(
        l => l.dmgRole || l.text?.includes('暴擊') || l.text?.includes('連攜') || l.text?.includes('剋制')
      );
    }
    return combatLogs.filter(l => l.type === 'sys' || l.type === 'danger');
  }, [combatLogs, logFilter]);

  // 高階裝備排在前面（Tier 降冪 -> 精鍊等級降冪 -> 本職可用優先）
  const sortedEquipmentInventory = useMemo(() => {
    return [...(equipmentInventory || [])].sort((a, b) => {
      const tierDiff = (b.tier || 1) - (a.tier || 1);
      if (tierDiff !== 0) return tierDiff;
      const refineDiff = (b.refineLevel || 0) - (a.refineLevel || 0);
      if (refineDiff !== 0) return refineDiff;
      const aMeta = enrichEquipmentMeta(a);
      const bMeta = enrichEquipmentMeta(b);
      const aUsable = aMeta.allowedJobs.includes(player.job) ? 1 : 0;
      const bUsable = bMeta.allowedJobs.includes(player.job) ? 1 : 0;
      return bUsable - aUsable;
    });
  }, [equipmentInventory, player.job]);

  // 即時試算符合批量清理條件的裝備數量與總金幣
  const bulkCleanPreview = useMemo(() => {
    let count = 0;
    let totalGold = 0;
    (equipmentInventory || []).forEach(item => {
      const meta = enrichEquipmentMeta(item);
      const matchTier = cleanTiers.includes(meta.tier);
      const matchType = cleanTypes.includes(meta.type);
      const matchJob = !cleanOnlyUnusable || !meta.allowedJobs.includes(player.job);
      const isModified =
        (item.refineLevel || 0) > 0 ||
        (item.sockets || []).some(Boolean) ||
        Boolean(item.reforgeAffix);
      const matchClean = !cleanProtectModified || !isModified;

      if (matchTier && matchType && matchJob && matchClean) {
        count += 1;
        totalGold += meta.sellPrice;
      }
    });
    return { count, totalGold };
  }, [equipmentInventory, cleanTiers, cleanTypes, cleanOnlyUnusable, cleanProtectModified, player.job]);

  const activeSetBonuses = useMemo(() => getActiveSetBonuses(player.equipped), [player.equipped]);

  const toggleCleanTier = (t) => {
    setCleanTiers(prev => (prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]));
  };

  const toggleCleanType = (typeKey) => {
    setCleanTypes(prev => (prev.includes(typeKey) ? prev.filter(x => x !== typeKey) : [...prev, typeKey]));
  };

  // ==================== 創角畫面 ====================
  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-3xl w-full bg-slate-900/90 border border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black text-amber-400 tracking-wider">⚔️ 《天外 Online》文字武俠 RPG</h1>
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
            ⚔️ 踏入《天外 Online》江湖
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
            <span className="font-black text-amber-400 text-base sm:text-lg">⚔️ 天外 Online</span>
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
            <div className="lg:col-span-7 space-y-4">
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
                      className="flex-1 min-w-[150px] py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-lg transition-all"
                    >
                      <Search className="w-4 h-4" />
                      <span>🔍 尋找怪群</span>
                    </button>

                    <button
                      disabled={!canSweepCurrentZone}
                      onClick={() => handleSweepZone(3)}
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

                    {handleCycleBattleSpeed && (
                      <button
                        type="button"
                        onClick={handleCycleBattleSpeed}
                        className={`py-3 px-3 rounded-2xl font-mono font-black text-xs flex items-center gap-1 border transition-all ${
                          battleSpeed === 3
                            ? 'bg-amber-500/25 border-amber-400 text-amber-300'
                            : battleSpeed === 2
                              ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                              : 'bg-slate-950 border-slate-700 text-slate-300 hover:border-slate-500'
                        }`}
                      >
                        <FastForward className="w-3.5 h-3.5" />
                        <span>{battleSpeed}x</span>
                      </button>
                    )}

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
                      護盾：<strong className="text-cyan-300">{combatBuffs.shield || 0}</strong> • 速度先手制
                    </span>
                    <div className="flex items-center gap-2 flex-wrap">
                      {handleCycleBattleSpeed && (
                        <button
                          type="button"
                          onClick={handleCycleBattleSpeed}
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-mono font-black border transition-all ${
                            battleSpeed === 3
                              ? 'bg-amber-500/25 border-amber-400 text-amber-300'
                              : battleSpeed === 2
                                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                                : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
                          }`}
                        >
                          <FastForward className="w-3.5 h-3.5" />
                          <span>{battleSpeed}x</span>
                        </button>
                      )}

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

              {/* 敵方怪群區 */}
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
                          className={`p-3 rounded-2xl border transition-all relative overflow-visible ${
                            dead
                              ? 'bg-slate-950/40 border-slate-900 opacity-40'
                              : isTarget
                                ? 'bg-rose-950/30 border-amber-400 ring-1 ring-amber-400 cursor-pointer'
                                : 'bg-slate-950 border-slate-800 hover:border-slate-600 cursor-pointer'
                          }`}
                        >
                          {hitInfo?.dmg > 0 && (
                            <div
                              key={`${m.id}_t${turnCount}_${hitInfo.dmg}`}
                              className={`pointer-events-none absolute -top-3 right-3 z-20 px-2 py-0.5 rounded-lg font-mono font-black shadow-lg animate-float-dmg ${
                                hitInfo.isCrit
                                  ? 'text-sm bg-amber-500 text-slate-950 border border-amber-200'
                                  : 'text-xs bg-cyan-950/95 text-cyan-200 border border-cyan-500'
                              }`}
                            >
                              {hitInfo.isCrit ? `💥 暴擊 -${hitInfo.dmg}!` : `-${hitInfo.dmg}`}
                            </div>
                          )}

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

                          if (!isAvailableSlot) {
                            return (
                              <div
                                key={slotIdx}
                                className="p-2 rounded-xl border border-dashed border-slate-800/40 bg-slate-950/25 text-[10px] text-center h-[54px] flex flex-col items-center justify-center text-slate-600/80 select-none cursor-not-allowed"
                              >
                                <span>🚫 非陣眼位</span>
                              </div>
                            );
                          }

                          if (occupant === 'PLAYER') {
                            const allyHit = lastRoundHits?.allies?.PLAYER;
                            return (
                              <div
                                key={slotIdx}
                                onClick={() => handleSlotClick(slotIdx)}
                                className={`relative p-2 rounded-xl border text-xs h-[54px] flex flex-col justify-center transition-all ${
                                  !isInCombat ? 'cursor-pointer hover:border-amber-400' : ''
                                } ${
                                  isSelectedSwap
                                    ? 'bg-amber-900/50 border-amber-300 ring-1 ring-amber-300'
                                    : 'bg-amber-950/30 border-amber-500/60'
                                }`}
                              >
                                {allyHit?.dmg > 0 && (
                                  <span
                                    key={`player_t${turnCount}_${allyHit.dmg}`}
                                    className="pointer-events-none absolute -top-2.5 right-1.5 z-20 px-1.5 py-0.2 rounded bg-rose-600 text-white font-mono font-black text-[10px] shadow animate-float-dmg"
                                  >
                                    -{allyHit.dmg}
                                  </span>
                                )}
                                <div className="font-black text-amber-300 truncate">👑 {player.name}</div>
                                <div className="flex items-center justify-between text-[10px] font-mono text-rose-300">
                                  <span>HP {player.hp}/{playerTotalMaxHp}</span>
                                </div>
                              </div>
                            );
                          }

                          const hero = occupant ? heroRoster.find(h => h.instanceId === occupant) : null;
                          if (hero) {
                            const { effectiveMaxHp } = calculateHeroEffectiveStats(hero, isFengShui, heroBattleBuffs[hero.instanceId], rowIdx);
                            const allyHit = lastRoundHits?.allies?.[hero.instanceId];
                            return (
                              <div
                                key={slotIdx}
                                onClick={() => handleSlotClick(slotIdx)}
                                className={`relative p-2 rounded-xl border text-xs h-[54px] flex flex-col justify-center transition-all ${
                                  !isInCombat ? 'cursor-pointer hover:border-emerald-400' : ''
                                } ${
                                  isSelectedSwap
                                    ? 'bg-amber-900/50 border-amber-300 ring-1 ring-amber-300'
                                    : hero.hp <= 0
                                      ? 'bg-slate-950/50 border-rose-900/60 opacity-50'
                                      : 'bg-slate-950 border-slate-700'
                                }`}
                              >
                                {allyHit?.dmg > 0 && (
                                  <span
                                    key={`${hero.instanceId}_t${turnCount}_${allyHit.dmg}`}
                                    className="pointer-events-none absolute -top-2.5 right-1.5 z-20 px-1.5 py-0.2 rounded bg-rose-600 text-white font-mono font-black text-[10px] shadow animate-float-dmg"
                                  >
                                    -{allyHit.dmg}
                                  </span>
                                )}
                                <div className="font-bold text-emerald-300 truncate">
                                  {hero.name} {hero.fusionLevel > 0 ? `★+${hero.fusionLevel}` : ''}
                                </div>
                                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                                  <span>HP {hero.hp}/{effectiveMaxHp}</span>
                                </div>
                              </div>
                            );
                          }

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
                        🤖 自動戰鬥運作中（{battleSpeed}x 速 • 點上方按鈕可隨時接管）
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
              <div className="border-b border-slate-800 pb-2.5 mb-2.5 space-y-2">
                <div className="text-xs font-extrabold text-amber-400 flex justify-between items-center">
                  <span>📜 即時江湖戰報</span>
                  <span className="text-[11px] font-mono text-slate-400">
                    總攻 {playerTotalAtk} • 總防 {playerTotalDef} • 速 {playerTotalSpeed}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-[11px]">
                  {[
                    { id: 'all', label: `全部 (${combatLogs.length})` },
                    { id: 'combat', label: '💥 傷害暴擊' },
                    { id: 'sys', label: '🎁 系統與掉落' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setLogFilter(tab.id)}
                      className={`px-2.5 py-0.5 rounded-full font-bold border transition-all ${
                        logFilter === tab.id
                          ? 'bg-amber-500 text-slate-950 border-amber-300'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-600'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 text-xs leading-relaxed">
                {filteredCombatLogs.map(log => {
                  let style = 'text-slate-300 bg-slate-950/60 border-slate-800/70';
                  let badge = null;

                  if (log.dmgRole === 'player_crit') {
                    style = 'text-amber-200 bg-amber-500/20 border-amber-400 font-bold';
                    badge = '💥 暴擊';
                  } else if (log.dmgRole === 'player_normal') {
                    style = 'text-cyan-200 bg-cyan-950/50 border-cyan-800/70';
                  } else if (log.dmgRole === 'monster_crit') {
                    style = 'text-rose-100 bg-rose-600/35 border-rose-400 font-bold';
                    badge = '⚠️ 敵暴擊';
                  } else if (log.dmgRole === 'monster_normal') {
                    style = 'text-rose-300 bg-rose-950/40 border-rose-900/70';
                  } else if (log.dmgRole === 'heal' || log.dmgRole === 'shield') {
                    style = 'text-emerald-200 bg-emerald-950/50 border-emerald-700/70';
                    badge = '💚 護療';
                  } else if (log.type === 'danger') {
                    style = 'text-rose-300 bg-rose-950/60 border-rose-700 font-bold';
                  } else if (log.type === 'sys') {
                    style = 'text-amber-300/90 bg-slate-950/90 border-slate-800';
                  }

                  if (!badge && log.text?.includes('無雙連攜')) badge = '🔥 無雙連攜';
                  else if (!badge && log.text?.includes('雙卡共鳴')) badge = '✨ 共鳴';
                  else if (!badge && log.text?.includes('五行剋制')) badge = '☯️ 剋制';

                  return (
                    <div key={log.id} className={`px-3 py-1.5 rounded-xl border ${style}`}>
                      <span className="text-[10px] font-mono text-slate-500 mr-1.5">[T{log.turn}]</span>
                      {badge && (
                        <span className="inline-block text-[10px] font-black px-1.5 py-0.2 mr-1.5 rounded bg-slate-950/80 border border-current">
                          {badge}
                        </span>
                      )}
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

        {/* ==================== 4. 裝備與背包（高階排序＋勾選清理＋套裝共鳴顯性化） ==================== */}
        {activeTab === 'equip' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 max-w-5xl mx-auto">
            <div className="flex flex-wrap justify-between items-center gap-2 border-b border-slate-800 pb-3">
              <div>
                <h2 className="font-extrabold text-amber-400 text-lg">🛡️ 少俠已穿戴神兵與裝備背包</h2>
                <p className="text-xs text-slate-400 mt-0.5">背包已自動依階級（T5 仙器 → T1 凡鐵）與精鍊等級由高至低排序</p>
              </div>
              <button
                type="button"
                disabled={isInCombat}
                onClick={() => setShowBulkCleanPanel(prev => !prev)}
                className={`px-3.5 py-2 rounded-xl font-bold text-xs border flex items-center gap-1.5 transition-all disabled:opacity-40 ${
                  showBulkCleanPanel
                    ? 'bg-rose-600 border-rose-400 text-white'
                    : 'bg-rose-950/80 hover:bg-rose-900 text-rose-200 border-rose-700'
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                <span>{showBulkCleanPanel ? '▲ 收起批量清理設定' : '🧹 一鍵清理（自訂階級／類型）'}</span>
              </button>
            </div>

            {/* 勾選階級與裝備類型的批量清理面板 */}
            {showBulkCleanPanel && (
              <div className="bg-slate-950/95 border border-rose-500/50 rounded-2xl p-4 space-y-3.5 shadow-xl">
                <div className="text-xs font-extrabold text-rose-300 flex items-center justify-between flex-wrap gap-2">
                  <span>🧹 勾選要批量出售的裝備條件（預設保護 T5 仙器）：</span>
                  <div className="flex gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setCleanTiers([1, 2, 3, 4])}
                      className="text-amber-300 hover:underline"
                    >
                      全選 T1~T4
                    </button>
                    <span className="text-slate-600">|</span>
                    <button
                      type="button"
                      onClick={() => setCleanTypes(EQUIP_SLOTS.map(s => s.key))}
                      className="text-cyan-300 hover:underline"
                    >
                      全選類型
                    </button>
                  </div>
                </div>

                {/* 階級勾選 */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-400">1. 選擇裝備階級：</div>
                  <div className="flex flex-wrap gap-2">
                    {TIER_FILTER_OPTIONS.map(opt => {
                      const checked = cleanTiers.includes(opt.tier);
                      return (
                        <button
                          key={opt.tier}
                          type="button"
                          onClick={() => toggleCleanTier(opt.tier)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                            checked
                              ? 'bg-amber-500/25 border-amber-400 text-amber-200'
                              : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-600'
                          }`}
                        >
                          {checked ? '☑️' : '⬜'} {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 裝備類型勾選 */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-400">2. 選擇裝備部位類型：</div>
                  <div className="flex flex-wrap gap-2">
                    {EQUIP_SLOTS.map(slot => {
                      const checked = cleanTypes.includes(slot.key);
                      return (
                        <button
                          key={slot.key}
                          type="button"
                          onClick={() => toggleCleanType(slot.key)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                            checked
                              ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200'
                              : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-600'
                          }`}
                        >
                          {checked ? '☑️' : '⬜'} {slot.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 安全保護開關 */}
                <div className="flex flex-wrap items-center gap-4 pt-1 text-xs">
                  <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={cleanOnlyUnusable}
                      onChange={(e) => setCleanOnlyUnusable(e.target.checked)}
                      className="accent-rose-500 w-3.5 h-3.5"
                    />
                    <span>僅出售「非本職業可穿戴」裝備</span>
                  </label>

                  <label className="flex items-center gap-1.5 text-emerald-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={cleanProtectModified}
                      onChange={(e) => setCleanProtectModified(e.target.checked)}
                      className="accent-emerald-500 w-3.5 h-3.5"
                    />
                    <span>自動跳過已精鍊 / 已鑲嵌寶石 / 已洗鍊神兵</span>
                  </label>
                </div>

                {/* 預覽件數與確認出售按鈕 */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-slate-800">
                  <div className="text-xs font-mono text-slate-300">
                    符合條件：<strong className="text-rose-300">{bulkCleanPreview.count}</strong> 件 • 預計獲得：<strong className="text-amber-300">+{bulkCleanPreview.totalGold} 金幣</strong>
                  </div>
                  <button
                    type="button"
                    disabled={isInCombat || bulkCleanPreview.count === 0}
                    onClick={() => {
                      handleBulkSellFilteredEquipment({
                        tiers: cleanTiers,
                        types: cleanTypes,
                        onlyUnusable: cleanOnlyUnusable,
                        protectModified: cleanProtectModified
                      });
                    }}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-black text-xs shadow transition-all"
                  >
                    💰 確認批量出售 ({bulkCleanPreview.count} 件)
                  </button>
                </div>
              </div>
            )}

            {/* 套裝共鳴顯性化進度條 */}
            {activeSetBonuses.length > 0 && (
              <div className="bg-amber-950/25 border border-amber-500/45 rounded-2xl p-4 space-y-2">
                <div className="text-xs font-extrabold text-amber-300">🔮 已穿戴套裝共鳴效果</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {activeSetBonuses.map(s => (
                    <div key={s.setId} className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-amber-300">【{s.name}】</span>
                        <span className={`font-mono px-2 py-0.5 rounded ${s.hasAnyUnlocked ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'bg-slate-900 text-slate-400'}`}>
                          {s.count} / {s.maxPieces} 件
                        </span>
                      </div>
                      {s.tiers.map(t => (
                        <div key={t.pieces} className={`text-[11px] ${t.unlocked ? 'text-emerald-300 font-bold' : 'text-slate-500'}`}>
                          {t.unlocked ? '✅' : '⬜'} ({t.pieces}件套) {t.desc}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 已穿戴裝備欄 */}
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
                        {item.reforgeAffix && (
                          <div className="text-[11px] text-purple-300 font-bold">
                            ✨ 詞條【{item.reforgeAffix.name}】{item.reforgeAffix.desc}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-600 italic py-2">尚未穿戴裝備</div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 裝備背包清單（高階置頂） */}
            <div className="space-y-2.5">
              <div className="text-xs font-bold text-amber-300">🎒 裝備背包（{sortedEquipmentInventory.length} 件 • 高階優先排序）</div>
              {sortedEquipmentInventory.length === 0 ? (
                <div className="text-xs text-slate-500 py-6 text-center">背包目前空空如也。</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {sortedEquipmentInventory.map(rawItem => {
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
                          {item.reforgeAffix && (
                            <div className="text-[11px] text-purple-300 font-bold">
                              ✨ 詞條【{item.reforgeAffix.name}】{item.reforgeAffix.desc}
                            </div>
                          )}
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
            handleReforgeEquipment={handleReforgeEquipment}
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
          <ShopTab
            player={player}
            isInCombat={isInCombat}
            shopLastReward={shopLastReward}
            handleShopPurchase={handleShopPurchase}
          />
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
        autoBattle={autoBattle}
        handleToggleAutoBattle={handleToggleAutoBattle}
        autoTower={autoTower}
        handleToggleAutoTower={handleToggleAutoTower}
        battleSpeed={battleSpeed}
      />

      {/* 江湖指南彈窗 */}
      <HelpGuideModal helpModalTab={helpModalTab} setHelpModalTab={setHelpModalTab} />
    </div>
  );
}
