export const CURRENT_SAVE_VERSION = 2;

/**
 * 封裝標準化匯出存檔結構（附帶版本號與匯出時間戳）
 */
export function buildExportSaveData(gameState) {
  return {
    saveVersion: CURRENT_SAVE_VERSION,
    exportedAt: new Date().toISOString(),
    ...gameState
  };
}

/**
 * 校驗並遷移舊版 localStorage 或匯入的 JSON 存檔，自動補齊新增系統的預設欄位
 * @param {object} rawData - 解析後的存檔物件
 * @param {object} defaults - 當前版本的預設狀態（包含 defaultPlayer 等）
 * @returns {{ ok: boolean, data?: object, error?: string, migratedFrom?: number }}
 */
export function migrateAndValidateSave(rawData, defaults = {}) {
  if (!rawData || typeof rawData !== 'object' || Array.isArray(rawData)) {
    return { ok: false, error: '存檔格式無效：內容必須為 JSON 物件。' };
  }

  if (!rawData.player || typeof rawData.player !== 'object') {
    return { ok: false, error: '存檔資料不完整：缺少主角 (player) 紀錄。' };
  }

  const incomingVersion = typeof rawData.saveVersion === 'number' ? rawData.saveVersion : 1;
  const basePlayer = defaults.player || {};
  const rawPlayer = rawData.player;

  // 1. 深度合併主角屬性、技能等級與六大裝備欄
  const mergedPlayer = {
    ...basePlayer,
    ...rawPlayer,
    stats: {
      ...(basePlayer.stats || { str: 5, con: 5, int: 5, agi: 5 }),
      ...(rawPlayer.stats || {})
    },
    skillLevels: {
      ...(basePlayer.skillLevels || { 0: 0, 1: 0, 2: 0 }),
      ...(rawPlayer.skillLevels || {})
    },
    equipped: {
      ...(basePlayer.equipped || {}),
      ...(rawPlayer.equipped || {})
    },
    gold: Math.max(0, Number(rawPlayer.gold ?? basePlayer.gold ?? 0)),
    refineStones: Math.max(0, Number(rawPlayer.refineStones ?? basePlayer.refineStones ?? 0)),
    statPoints: Math.max(0, Number(rawPlayer.statPoints ?? 0)),
    sp: Math.max(0, Number(rawPlayer.sp ?? 0))
  };

  // 2. 校驗英雄名冊與出戰列表（過濾無效 ID 並確保上限 4 人）
  const validRoster = Array.isArray(rawData.heroRoster)
    ? rawData.heroRoster.map(h => ({
        ...h,
        activeSkillSlots: Array.isArray(h.activeSkillSlots) ? h.activeSkillSlots : [],
        passiveSkillSlots: Array.isArray(h.passiveSkillSlots) ? h.passiveSkillSlots : [],
        statLossTotal: Number(h.statLossTotal || 0)
      }))
    : (defaults.heroRoster || []);

  const validRosterIds = new Set(validRoster.map(h => h.instanceId));
  const rawActiveIds = Array.isArray(rawData.activeHeroInstanceIds)
    ? rawData.activeHeroInstanceIds
    : (defaults.activeHeroInstanceIds || []);
  const validActiveIds = rawActiveIds
    .filter(id => validRosterIds.has(id))
    .slice(0, 4);

  // 3. 校驗背包、技能卡、陣法與鎮魔塔進度（預留階段三新欄位預設值）
  const validEquipInv = Array.isArray(rawData.equipmentInventory)
    ? rawData.equipmentInventory
    : (defaults.equipmentInventory || []);

  const validSkillInv = Array.isArray(rawData.skillCardsInventory)
    ? rawData.skillCardsInventory
    : (defaults.skillCardsInventory || []);

  const validFormationSlots =
    rawData.formationSlots && typeof rawData.formationSlots === 'object'
      ? rawData.formationSlots
      : (defaults.formationSlots || { 4: 'PLAYER' });

  const migratedData = {
    ...defaults,
    ...rawData,
    saveVersion: CURRENT_SAVE_VERSION,
    player: mergedPlayer,
    heroRoster: validRoster,
    activeHeroInstanceIds: validActiveIds,
    equipmentInventory: validEquipInv,
    skillCardsInventory: validSkillInv,
    currentFormation: rawData.currentFormation || defaults.currentFormation || 'none',
    formationSlots: validFormationSlots,
    currentZoneIndex: Number.isInteger(rawData.currentZoneIndex) ? rawData.currentZoneIndex : 0,
    towerFloor: Math.max(1, Number(rawData.towerFloor || 1)),
    towerBestFloor: Math.max(1, Number(rawData.towerBestFloor || rawData.towerFloor || 1)),
    consumables:
      rawData.consumables && typeof rawData.consumables === 'object'
        ? rawData.consumables
        : { hpPotion: 2, mpPotion: 2 }
  };

  return {
    ok: true,
    data: migratedData,
    migratedFrom: incomingVersion
  };
}
