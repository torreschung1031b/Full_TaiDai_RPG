import React, { useState } from 'react';
import { Lock, Coffee, HelpCircle } from 'lucide-react';

import { MAX_LEVEL, ELEMENTS } from './data/constants';
import { CLASS_CONFIGS, CLASS_SKILLS_DB } from './data/classes';

import CharacterCreation from './components/CharacterCreation';
import HelpGuideModal from './components/HelpGuideModal';
import CombatTab from './components/CombatTab';
import HeroTeamTab from './components/HeroTeamTab';
import SkillTreeTab from './components/SkillTreeTab';
import EquipBagTab from './components/EquipBagTab';
import ShopTab from './components/ShopTab';
import {
  CharacterTab,
  ForgeTab,
  FormationsTab,
  TowerTab,
  CodexTab,
  SaveLoadTab
} from './components/SecondaryTabs';
import BattleResultModals from './components/BattleResultModals';

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
    shopLastReward,
    handleShopPurchase,
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
      {/* 合併置頂狀態列與導覽分頁 */}
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
            <span className="truncate">戰鬥交鋒中：已鎖定更換裝備、調整陣容與站位、切換陣法、市集交易及回客棧休息</span>
          </div>
        )}

        <nav className="bg-slate-900/60 flex justify-start items-center gap-1.5 px-3 sm:px-6 py-2 overflow-x-auto">
          {[
            { id: 'combat', label: '⚔️ 戰鬥遭遇' },
            { id: 'character', label: `👤 主角屬性${player.statPoints > 0 ? ` (+${player.statPoints})` : ''}` },
            { id: 'skills', label: `✨ 技能樹${player.sp > 0 ? ` (+${player.sp}SP)` : ''}` },
            { id: 'equip', label: '🛡️ 裝備背包' },
            { id: 'forge', label: '🔨 鐵匠精鍊' },
            { id: 'shop', label: '🏮 江湖市集' },
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

      {/* 各分頁視圖路由 */}
      <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
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
            playerTotalMaxHp={playerTotalMaxHp}
            playerTotalMaxMp={playerTotalMaxMp}
            playerTotalAtk={playerTotalAtk}
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

        {activeTab === 'skills' && (
          <SkillTreeTab
            player={player}
            setPlayer={setPlayer}
            classSkills={classSkills}
            setHelpModalTab={setHelpModalTab}
          />
        )}

        {activeTab === 'equip' && (
          <EquipBagTab
            player={player}
            isInCombat={isInCombat}
            equipmentInventory={equipmentInventory}
            skillCardsInventory={skillCardsInventory}
            handleEquipItem={handleEquipItem}
            handleUnequipItem={handleUnequipItem}
            handleSellEquipment={handleSellEquipment}
            handleBulkSellUnusableEquipment={handleBulkSellUnusableEquipment}
            setHelpModalTab={setHelpModalTab}
          />
        )}

        {activeTab === 'forge' && (
          <ForgeTab
            player={player}
            isInCombat={isInCombat}
            equipmentInventory={equipmentInventory}
            handleRefineEquipment={handleRefineEquipment}
            handleSocketGem={handleSocketGem}
          />
        )}

        {activeTab === 'shop' && (
          <ShopTab
            player={player}
            isInCombat={isInCombat}
            shopLastReward={shopLastReward}
            handleShopPurchase={handleShopPurchase}
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

        {activeTab === 'tower' && (
          <TowerTab
            towerFloor={towerFloor}
            setTowerFloor={setTowerFloor}
            isInCombat={isInCombat}
            setSkillCardsInventory={setSkillCardsInventory}
            spawnEncounter={spawnEncounter}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'codex' && (
          <CodexTab heroRoster={heroRoster} />
        )}

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

      {/* 勝負結算彈窗 */}
      <BattleResultModals
        victorySummary={victorySummary}
        setVictorySummary={setVictorySummary}
        defeatSummary={defeatSummary}
        setDefeatSummary={setDefeatSummary}
        handleRestInn={handleRestInn}
      />

      {/* (?) 《江湖指南》說明彈窗 */}
      <HelpGuideModal
        helpModalTab={helpModalTab}
        setHelpModalTab={setHelpModalTab}
      />
    </div>
  );
}
