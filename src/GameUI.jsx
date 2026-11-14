import React, { useState } from 'react';
import {
  Swords, Users, Sparkles, Shield, Hammer, User, Compass,
  Castle, Store, BookOpen, Save, HelpCircle
} from 'lucide-react';
import { ELEMENTS } from './data/constants';
import { CLASS_CONFIGS } from './data/classes';
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
import { CharacterCreationScreen, buildAdaptedClassSkills } from './components/game/CharacterCreationScreen';
import { CombatTab } from './components/game/CombatTab';
import { EquipmentBagTab } from './components/game/EquipmentBagTab';

export default function GameUI(props) {
  const {
    gameStarted, isInCombat, activeTowerFloor,
    autoBattle, handleToggleAutoBattle, autoTower, handleToggleAutoTower,
    battleSpeed = 1, handleCycleBattleSpeed,
    creationData, setCreationData, starterHeroCandidates, handleStartGame,
    player, setPlayer, playerTotalMaxHp, playerTotalMaxMp,
    playerTotalAtk, playerTotalDef, playerTotalSpeed,
    activeHeroInstanceIds, heroRoster,
    handleToggleDeployHero, handleFuseHero, handleFuseAllHeroes,
    fusionFeedback, MAX_HERO_FUSION, handleReleaseHero,
    handleEquipSkillCard, handleUnequipSkillCard, handleRestInn,
    handleEquipItem, handleUnequipItem, handleSellEquipment, handleBulkSellFilteredEquipment,
    handleSelectFormation, formationSlots, handleSwapFormationSlots,
    handleSelectZone, handleSweepZone, handleFleeCombat,
    monsters, selectedTargetIndex, setSelectedTargetIndex,
    combatLogs, lastRoundHits, combatBuffs, heroBattleBuffs,
    turnCount, combatPhase, activeTab, setActiveTab,
    currentZoneIndex, spawnEncounter, handleExecuteRound,
    equipmentInventory, skillCardsInventory, forgeFeedback,
    handleRefineEquipment, handleReforgeEquipment, handleSocketGem,
    shopLastReward, handleShopPurchase, currentFormation,
    towerFloor, towerBestFloor, towerProgress,
    selectedTowerType, setSelectedTowerType, handleStartTowerChallenge,
    jsonSaveText, setJsonSaveText, saveLoadStatus,
    handleExportSave, handleImportSave, handleResetSave,
    victorySummary, setVictorySummary, defeatSummary, setDefeatSummary,
    chatEndRef
  } = props;

  const [helpModalTab, setHelpModalTab] = useState(null);

  if (!gameStarted) {
    return (
      <CharacterCreationScreen
        creationData={creationData}
        setCreationData={setCreationData}
        starterHeroCandidates={starterHeroCandidates}
        handleStartGame={handleStartGame}
      />
    );
  }

  const isFengShui = player.job === '風水師';
  const isWarlock = player.job === '術士';
  const classInfo = CLASS_CONFIGS[player.job] || CLASS_CONFIGS['猛將'];
  const currentClassSkills = props.classSkills?.length > 0 ? props.classSkills : buildAdaptedClassSkills(player.job);

  const getHeroRowIdx = (heroInstanceId) => {
    const foundKey = Object.keys(formationSlots || {}).find(k => formationSlots[k] === heroInstanceId);
    return foundKey !== undefined ? Math.floor(Number(foundKey) / 3) : 1;
  };

  const NAV_TABS = [
    { id: 'combat', label: '歷練戰鬥', icon: Swords },
    { id: 'heroes', label: `英雄名冊 (${heroRoster.length})`, icon: Users },
    { id: 'skills', label: `技能樹${player.sp > 0 ? ` (${player.sp})` : ''}`, icon: Sparkles },
    { id: 'equip', label: `裝備背包 (${equipmentInventory.length})`, icon: Shield },
    { id: 'forge', label: '鐵匠精鍊', icon: Hammer },
    { id: 'character', label: `屬性配點${player.statPoints > 0 ? ` (${player.statPoints})` : ''}`, icon: User },
    { id: 'formations', label: '陣法五行', icon: Compass },
    { id: 'tower', label: `鎮魔五塔${autoTower ? '・自動' : ''}`, icon: Castle },
    { id: 'shop', label: '江湖市集', icon: Store },
    { id: 'codex', label: '英雄圖鑑', icon: BookOpen },
    { id: 'saveload', label: '存檔管理', icon: Save }
  ];

  const resourceLabel = player.job === '猛將'
    ? `🔥 怒氣 ${player.rage}/100`
    : player.job === '巧匠'
      ? `🏹 彈藥 ${player.ammo}/${player.maxAmmo}`
      : `💧 內力 ${player.mp}/${playerTotalMaxMp}`;

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
            <span className="bg-rose-950/70 border border-rose-800 text-rose-200 px-2.5 py-1 rounded-lg font-bold">❤️ {player.hp}/{playerTotalMaxHp}</span>
            <span className="bg-cyan-950/70 border border-cyan-800 text-cyan-200 px-2.5 py-1 rounded-lg font-bold">{resourceLabel}</span>
            <span className="bg-slate-900 border border-slate-800 text-amber-300 px-2.5 py-1 rounded-lg font-bold">💰 {player.gold}</span>
            <span className="bg-slate-900 border border-slate-800 text-cyan-300 px-2.5 py-1 rounded-lg font-bold">💎 {player.refineStones}</span>
            <button onClick={() => setHelpModalTab('combat')} className="flex items-center gap-1 bg-amber-600/20 hover:bg-amber-600/40 border border-amber-500/50 text-amber-300 px-2.5 py-1 rounded-lg font-bold transition-colors">
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
                  active ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20' : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
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
        {activeTab === 'combat' && (
          <CombatTab
            player={player}
            isInCombat={isInCombat}
            isFengShui={isFengShui}
            isWarlock={isWarlock}
            activeTowerFloor={activeTowerFloor}
            currentZoneIndex={currentZoneIndex}
            handleSelectZone={handleSelectZone}
            spawnEncounter={spawnEncounter}
            handleSweepZone={handleSweepZone}
            autoBattle={autoBattle}
            handleToggleAutoBattle={handleToggleAutoBattle}
            autoTower={autoTower}
            handleToggleAutoTower={handleToggleAutoTower}
            battleSpeed={battleSpeed}
            handleCycleBattleSpeed={handleCycleBattleSpeed}
            handleRestInn={handleRestInn}
            handleFleeCombat={handleFleeCombat}
            monsters={monsters}
            selectedTargetIndex={selectedTargetIndex}
            setSelectedTargetIndex={setSelectedTargetIndex}
            lastRoundHits={lastRoundHits}
            turnCount={turnCount}
            playerTotalMaxHp={playerTotalMaxHp}
            playerTotalAtk={playerTotalAtk}
            playerTotalDef={playerTotalDef}
            playerTotalSpeed={playerTotalSpeed}
            currentFormation={currentFormation}
            formationSlots={formationSlots}
            handleSwapFormationSlots={handleSwapFormationSlots}
            heroRoster={heroRoster}
            heroBattleBuffs={heroBattleBuffs}
            combatBuffs={combatBuffs}
            combatPhase={combatPhase}
            currentClassSkills={currentClassSkills}
            handleExecuteRound={handleExecuteRound}
            combatLogs={combatLogs}
            chatEndRef={chatEndRef}
          />
        )}

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

        {activeTab === 'skills' && (
          <SkillTreeTab player={player} setPlayer={setPlayer} classSkills={currentClassSkills} setHelpModalTab={setHelpModalTab} />
        )}

        {activeTab === 'equip' && (
          <EquipmentBagTab
            player={player}
            isInCombat={isInCombat}
            equipmentInventory={equipmentInventory}
            handleEquipItem={handleEquipItem}
            handleUnequipItem={handleUnequipItem}
            handleSellEquipment={handleSellEquipment}
            handleBulkSellFilteredEquipment={handleBulkSellFilteredEquipment}
          />
        )}

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

        {activeTab === 'formations' && (
          <FormationsTab
            isFengShui={isFengShui}
            isInCombat={isInCombat}
            currentFormation={currentFormation}
            handleSelectFormation={handleSelectFormation}
            setHelpModalTab={setHelpModalTab}
          />
        )}

        {activeTab === 'tower' && (
          <TowerTab
            player={player}
            towerFloor={towerFloor}
            towerBestFloor={towerBestFloor}
            towerProgress={towerProgress}
            selectedTowerType={selectedTowerType}
            setSelectedTowerType={setSelectedTowerType}
            isInCombat={isInCombat}
            autoTower={autoTower}
            handleToggleAutoTower={handleToggleAutoTower}
            handleStartTowerChallenge={handleStartTowerChallenge}
          />
        )}

        {activeTab === 'shop' && (
          <ShopTab player={player} isInCombat={isInCombat} shopLastReward={shopLastReward} handleShopPurchase={handleShopPurchase} />
        )}

        {activeTab === 'codex' && <CodexTab heroRoster={heroRoster} />}

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

      <HelpGuideModal helpModalTab={helpModalTab} setHelpModalTab={setHelpModalTab} />
    </div>
  );
}
