/**
 * 英雄排序：Tier 高 → 低 ➔ 星級 ★+ 高 → 低 ➔ 等級高 → 低
 */
export function compareHeroes(a, b) {
  return (
    (b.tier || 1) - (a.tier || 1) ||
    (b.fusionLevel || 0) - (a.fusionLevel || 0) ||
    (b.level || 1) - (a.level || 1)
  );
}

/**
 * 將技能卡陣列依模板摺疊成群組，附帶持有數量與可用實體清單
 */
export function groupSkillCards(cards = []) {
  const map = new Map();
  cards.forEach(card => {
    const key = `${card.id || card.name}__${card.type}`;
    if (!map.has(key)) {
      map.set(key, { key, sample: card, count: 0, instances: [] });
    }
    const entry = map.get(key);
    entry.count += 1;
    entry.instances.push(card);
  });
  return Array.from(map.values()).sort((a, b) => {
    if (a.sample.type !== b.sample.type) return a.sample.type === 'active' ? -1 : 1;
    return (b.count || 0) - (a.count || 0);
  });
}

/**
 * 計算名冊內可手動突破總次數
 */
export function calcTotalFusibleOps(heroRoster, maxFusion) {
  const groups = {};
  heroRoster.forEach(h => {
    (groups[h.baseId] ||= []).push(h);
  });
  return Object.values(groups).reduce((ops, group) => {
    if (group.length < 2) return ops;
    const maxCurStar = Math.max(...group.map(g => Math.min(maxFusion, g.fusionLevel || 0)));
    return ops + Math.min(maxFusion - maxCurStar, group.length - 1);
  }, 0);
}

/**
 * 篩選可安全批量遣散的冗餘分身（未出戰、★+0、無穿戴技能卡、且已有滿星本尊）
 */
export function getRedundantDupHeroes(heroRoster, activeHeroInstanceIds, maxFusion) {
  const maxStarByBase = {};
  heroRoster.forEach(h => {
    const f = h.fusionLevel || 0;
    if ((maxStarByBase[h.baseId] || 0) < f) maxStarByBase[h.baseId] = f;
  });

  return heroRoster.filter(h => {
    const isDeployed = activeHeroInstanceIds.includes(h.instanceId);
    const hasCards = (h.activeSkillSlots?.length || 0) + (h.passiveSkillSlots?.length || 0) > 0;
    return !isDeployed && !hasCards && (h.fusionLevel || 0) === 0 && (maxStarByBase[h.baseId] || 0) >= maxFusion;
  });
}

/**
 * 計算智慧推薦配卡清單（優先不重複名稱，再補同卡）
 */
export function pickAutoEquipCards(hero, skillCardsInventory) {
  const compatible = skillCardsInventory.filter(c => c.allowedJobs?.includes(hero.heroClass));
  const usedUids = new Set();
  const picked = [];

  const fillType = (type, existingSlots) => {
    let need = Math.max(0, 2 - (existingSlots?.length || 0));
    if (need <= 0) return;
    const existingNames = new Set((existingSlots || []).map(c => c.name));
    const candidates = compatible.filter(c => c.type === type);

    for (const c of candidates) {
      if (need <= 0) break;
      if (!existingNames.has(c.name) && !usedUids.has(c.uid)) {
        usedUids.add(c.uid);
        existingNames.add(c.name);
        picked.push(c);
        need -= 1;
      }
    }
    for (const c of candidates) {
      if (need <= 0) break;
      if (!usedUids.has(c.uid)) {
        usedUids.add(c.uid);
        picked.push(c);
        need -= 1;
      }
    }
  };

  fillType('active', hero.activeSkillSlots);
  fillType('passive', hero.passiveSkillSlots);
  return picked;
}
