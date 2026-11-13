import { useState, useEffect, useCallback } from 'react';
import { MAX_LEVEL, MAX_SKILL_LEVEL, LOCAL_STORAGE_KEY } from '../data/constants';
import { syncFormationSlots } from '../utils/formationHelper';
import { normalizeHero } from '../utils/statCalculator';
import {
  CURRENT_SAVE_VERSION,
  buildExportSaveData,
  migrateAndValidateSave
} from '../utils/saveHelper';
import { MAX_HERO_FUSION } from '../utils/heroFusionHelper';

export function useSaveSystem({
  initialPlayer,
  gameStarted,
  setGameStarted,
  isInCombat,
  player,
  setPlayer,
  heroRoster,
  setHeroRoster,
  activeHeroInstanceIds,
  setActiveHeroInstanceIds,
  currentFormation,
  setCurrentFormation,
  formationSlots,
  setFormationSlots,
  syncedSlots,
  equipmentInventory,
  setEquipmentInventory,
  skillCardsInventory,
  setSkillCardsInventory,
  towerFloor,
  setTowerFloor,
  towerBestFloor,
  setTowerBestFloor,
  setActiveTowerFloor,
  setMonsters,
  resetCombatStates,
  setAutoBattle
}) {
  const [jsonSaveText, setJsonSaveText] = useState('');
  const [saveLoadStatus, setSaveLoadStatus] = useState('');

  const applyMigratedSaveState = useCallback((migratedData) => {
    const rawP = migratedData.player;
    const loadedP = {
      ...rawP,
      level: Math.min(MAX_LEVEL, rawP.level || 1),
      maxAmmo: rawP.job === '巧匠' ? 12 : (rawP.maxAmmo || 12),
      skillLevels: {
        0: Math.min(MAX_SKILL_LEVEL, rawP.skillLevels?.[0] ?? 0),
        1: Math.min(MAX_SKILL_LEVEL, rawP.skillLevels?.[1] ?? 0),
        2: Math.min(MAX_SKILL_LEVEL, rawP.skillLevels?.[2] ?? 0)
      }
    };
    const loadedForm = loadedP.job === '風水師' ? (migratedData.currentFormation || 'none') : 'none';
    const loadedActiveIds = migratedData.activeHeroInstanceIds || [];
    const loadedFloor = Math.max(1, migratedData.towerFloor || 1);

    setPlayer(loadedP);
    setHeroRoster((migratedData.heroRoster || []).map(h => ({
      ...normalizeHero(h),
      fusionLevel: Math.min(MAX_HERO_FUSION, Math.max(0, h.fusionLevel || 0))
    })));
    setActiveHeroInstanceIds(loadedActiveIds);
    setCurrentFormation(loadedForm);
    setFormationSlots(syncFormationSlots(loadedForm, migratedData.formationSlots || {}, loadedActiveIds));
    setEquipmentInventory(migratedData.equipmentInventory || []);
    setSkillCardsInventory(migratedData.skillCardsInventory || []);
    setTowerFloor(loadedFloor);
    setTowerBestFloor(Math.max(loadedFloor, migratedData.towerBestFloor || loadedFloor));
    setActiveTowerFloor(null);
  }, [
    setPlayer,
    setHeroRoster,
    setActiveHeroInstanceIds,
    setCurrentFormation,
    setFormationSlots,
    setEquipmentInventory,
    setSkillCardsInventory,
    setTowerFloor,
    setTowerBestFloor,
    setActiveTowerFloor
  ]);

  // 開局自動從 localStorage 載入存檔
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const res = migrateAndValidateSave(parsed, { player: initialPlayer });
        if (res.ok && res.data) {
          applyMigratedSaveState(res.data);
          setGameStarted(true);
        }
      }
    } catch (e) {
      console.warn('自動載入存檔失敗', e);
    }
  }, [initialPlayer, applyMigratedSaveState, setGameStarted]);

  // 狀態變動時自動存檔
  useEffect(() => {
    if (!gameStarted) return;
    try {
      const saveData = buildExportSaveData({
        player,
        heroRoster,
        activeHeroInstanceIds,
        currentFormation,
        formationSlots,
        equipmentInventory,
        skillCardsInventory,
        towerFloor,
        towerBestFloor
      });
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(saveData));
    } catch (e) {
      console.warn('自動存檔失敗', e);
    }
  }, [
    player,
    heroRoster,
    activeHeroInstanceIds,
    currentFormation,
    formationSlots,
    equipmentInventory,
    skillCardsInventory,
    towerFloor,
    towerBestFloor,
    gameStarted
  ]);

  const handleExportSave = () => {
    const exportPayload = buildExportSaveData({
      player,
      heroRoster,
      activeHeroInstanceIds,
      currentFormation,
      formationSlots: syncedSlots,
      equipmentInventory,
      skillCardsInventory,
      towerFloor,
      towerBestFloor
    });
    setJsonSaveText(JSON.stringify(exportPayload, null, 2));
    setSaveLoadStatus(`✅ 存檔 JSON 匯出成功（版本 v${CURRENT_SAVE_VERSION}）！`);
  };

  const handleImportSave = () => {
    if (isInCombat) {
      setSaveLoadStatus('🔒 戰鬥中無法讀取存檔！');
      return;
    }
    try {
      const parsed = JSON.parse(jsonSaveText);
      const res = migrateAndValidateSave(parsed, { player: initialPlayer });
      if (!res.ok) {
        setSaveLoadStatus(`❌ ${res.error}`);
        return;
      }
      applyMigratedSaveState(res.data);
      setMonsters([]);
      resetCombatStates();
      setAutoBattle(false);
      setGameStarted(true);
      const migrateHint = res.migratedFrom < CURRENT_SAVE_VERSION
        ? `（已自動從 v${res.migratedFrom} 遷移至 v${CURRENT_SAVE_VERSION}）`
        : '';
      setSaveLoadStatus(`✅ 成功匯入遊戲進度${migrateHint}！`);
    } catch (e) {
      setSaveLoadStatus('❌ 匯入失敗，請確認 JSON 格式是否正確。');
    }
  };

  const handleResetSave = () => {
    if (window.confirm("確定要重置所有遊戲紀錄嗎？")) {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      window.location.reload();
    }
  };

  return {
    jsonSaveText,
    setJsonSaveText,
    saveLoadStatus,
    handleExportSave,
    handleImportSave,
    handleResetSave
  };
}
