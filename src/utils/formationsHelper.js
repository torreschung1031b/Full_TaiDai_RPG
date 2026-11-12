import { FORMATION_GRID_SLOTS } from '../data/formations';

export function getRowPositionBuffs(gridIdx) {
  const row = Math.floor((gridIdx ?? 0) / 3);
  if (row === 0) {
    return { row: 0, label: '前排', physReducePct: 0.10, speedPct: 0, critSkillPct: 0, aggroWeight: 60 };
  }
  if (row === 1) {
    return { row: 1, label: '中排', physReducePct: 0, speedPct: 0.10, critSkillPct: 0, aggroWeight: 25 };
  }
  return { row: 2, label: '後排', physReducePct: 0, speedPct: 0, critSkillPct: 0.08, aggroWeight: 15 };
}

export function syncFormationSlots(formationKey, currentSlots = {}, deployedHeroIds = []) {
  const validIndices = FORMATION_GRID_SLOTS[formationKey] || FORMATION_GRID_SLOTS['none'];
  const nextSlots = {};
  validIndices.forEach(idx => { nextSlots[idx] = null; });

  const allowedEntities = new Set(['PLAYER', ...deployedHeroIds]);
  const placedEntities = new Set();

  validIndices.forEach(idx => {
    const occupant = currentSlots[idx];
    if (occupant && allowedEntities.has(occupant) && !placedEntities.has(occupant)) {
      nextSlots[idx] = occupant;
      placedEntities.add(occupant);
    }
  });

  ['PLAYER', ...deployedHeroIds].forEach(entityId => {
    if (!placedEntities.has(entityId)) {
      const emptyIdx = validIndices.find(idx => nextSlots[idx] === null);
      if (emptyIdx !== undefined) {
        nextSlots[emptyIdx] = entityId;
        placedEntities.add(entityId);
      }
    }
  });

  return nextSlots;
}
