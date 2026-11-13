import { useState } from 'react';
import { SKILL_CARDS_DB, createSkillCardInstance } from '../data/skillCards';
import { HERO_TEMPLATES, instantiateHero } from '../data/heroes';
import {
  enrichEquipmentMeta,
  rollEquipmentFromTierRange,
  getRefineSuccessRate,
  getCumulativeRefineBonusPct
} from '../data/equipment';
import {
  getRandomElement,
  calculateHeroEffectiveStats,
  normalizeHero
} from '../utils/statCalculator';

/**
 * 依權重表抽取指定 Tier
 */
function rollWeightedTier(weights) {
  const total = weights.reduce((sum, w) => sum + w.weight, 0);
  let r = Math.random() * total;
  for (const item of weights) {
    if (r < item.weight) return item.tier;
    r -= item.weight;
  }
  return weights[weights.length - 1].tier;
}

export function useInventoryAndShop({
  isInCombat,
  isFengShui,
  player,
  setPlayer,
  playerTotalMaxHp,
  playerTotalMaxMp,
  equipmentInventory,
  setEquipmentInventory,
  setSkillCardsInventory,
  setHeroRoster,
  getHeroRowIdx,
  addLog
}) {
  const [shopLastReward, setShopLastReward] = useState('');
  const [forgeFeedback, setForgeFeedback] = useState(null);

  const handleEquipItem = (item) => {
    if (isInCombat) {
      addLog(`🔒 戰鬥進行中，無法更換裝備！`, 'sys');
      return;
    }
    const meta = enrichEquipmentMeta(item);
    if (!meta.allowedJobs.includes(player.job)) {
      addLog(`🔒 職業不符！【${player.job}】無法穿戴【${item.name}】（${meta.equipTag}）！`, 'danger');
      return;
    }

    const prevEquipped = player.equipped[item.type];
    setEquipmentInventory(prev => {
      const filtered = prev.filter(i => i.uid !== item.uid);
      return prevEquipped ? [...filtered, prevEquipped] : filtered;
    });
    setPlayer(p => ({ ...p, equipped: { ...p.equipped, [item.type]: item } }));
    addLog(`🛡️ 少俠已裝備【${meta.tierTag}・${item.name}】${prevEquipped ? `（原【${prevEquipped.name}】已退回背包）` : ''}。`, 'sys');
  };

  const handleUnequipItem = (slotKey) => {
    if (isInCombat) {
      addLog(`🔒 戰鬥進行中，無法除下裝備！`, 'sys');
      return;
    }
    const currentItem = player.equipped[slotKey];
    if (!currentItem) return;

    setPlayer(p => ({ ...p, equipped: { ...p.equipped, [slotKey]: null } }));
    setEquipmentInventory(prev => [...prev, currentItem]);
    addLog(`📤 已除下【${currentItem.name}】，裝備已放回背包。`, 'sys');
  };

  const handleSellEquipment = (item) => {
    if (isInCombat) {
      addLog(`🔒 戰鬥進行中，無法賣出裝備！`, 'sys');
      return;
    }
    const meta = enrichEquipmentMeta(item);
    setEquipmentInventory(prev => prev.filter(i => i.uid !== item.uid));
    setPlayer(p => ({ ...p, gold: p.gold + meta.sellPrice }));
    addLog(`💰 已賣出【${meta.tierTag}・${item.name}】，獲得 +${meta.sellPrice} 金幣！`, 'sys');
  };

  const handleBulkSellUnusableEquipment = () => {
    if (isInCombat) {
      addLog(`🔒 戰鬥進行中，無法賣出裝備！`, 'sys');
      return;
    }
    let totalGold = 0;
    let soldCount = 0;
    const kept = [];

    equipmentInventory.forEach(item => {
      const meta = enrichEquipmentMeta(item);
      const isUnusable = !meta.allowedJobs.includes(player.job);
      const isClean = (item.refineLevel || 0) === 0 && !(item.sockets || []).some(Boolean);
      if (isUnusable && isClean) {
        totalGold += meta.sellPrice;
        soldCount += 1;
      } else {
        kept.push(item);
      }
    });

    if (soldCount === 0) {
      addLog(`ℹ️ 背包中沒有可一鍵清理的非本職白板裝備。`, 'sys');
      return;
    }

    setEquipmentInventory(kept);
    setPlayer(p => ({ ...p, gold: p.gold + totalGold }));
    addLog(`🧹 一鍵清理完成！共賣出 ${soldCount} 件非本職裝備，獲得 +${totalGold} 金幣！`, 'sys');
  };

  const handleRefineEquipment = (item) => {
    if (isInCombat) {
      addLog(`🔒 戰鬥進行中，無法進行鐵匠精鍊！`, 'sys');
      return;
    }
    const level = item.refineLevel || 0;
    const goldCost = (level + 1) * 120;
    if (player.gold < goldCost || player.refineStones < 1) {
      setForgeFeedback({ type: 'danger', text: `⚠️ 金幣或精鍊石不足，無法強化【${item.name}】！` });
      return;
    }

    const successRate = getRefineSuccessRate(level);
    const isSuccess = Math.random() < successRate;
    setPlayer(p => ({ ...p, gold: p.gold - goldCost, refineStones: p.refineStones - 1 }));
    const nextLevel = isSuccess ? level + 1 : Math.max(0, level - 1);
    const updated = { ...item, refineLevel: nextLevel };

    setEquipmentInventory(prev => prev.map(i => i.uid === item.uid ? updated : i));
    if (player.equipped[item.type]?.uid === item.uid) {
      setPlayer(p => ({ ...p, equipped: { ...p.equipped, [item.type]: updated } }));
    }

    const nextBonusPct = Math.round(getCumulativeRefineBonusPct(nextLevel) * 100);
    const msg = isSuccess
      ? `🔨 精鍊成功！【${item.name}】強化至 +${nextLevel}（基礎屬性累計額外 +${nextBonusPct}%）！`
      : `💥 精鍊失敗（成功率 ${Math.round(successRate * 100)}%）！【${item.name}】靈氣震盪，精鍊等級為 +${nextLevel}（基礎屬性累計 +${nextBonusPct}%）！`;
    setForgeFeedback({ type: isSuccess ? 'success' : 'danger', text: msg });
    addLog(msg, isSuccess ? 'sys' : 'danger');
  };

  const handleSocketGem = (item, gem, socketIdx) => {
    if (isInCombat) {
      addLog(`🔒 戰鬥進行中，無法鑲嵌寶石！`, 'sys');
      return;
    }
    const socketCost = 100;
    if (player.gold < socketCost) {
      setForgeFeedback({ type: 'danger', text: `⚠️ 金幣不足（需 100 金幣），無法鑲嵌寶石！` });
      return;
    }

    const prevGem = item.sockets?.[socketIdx];
    const newSockets = [...(item.sockets || [null])];
    newSockets[socketIdx] = gem;
    const updated = { ...item, sockets: newSockets };

    setPlayer(p => ({ ...p, gold: p.gold - socketCost }));
    setEquipmentInventory(prev => prev.map(i => i.uid === item.uid ? updated : i));
    if (player.equipped[item.type]?.uid === item.uid) {
      setPlayer(p => ({ ...p, equipped: { ...p.equipped, [item.type]: updated } }));
    }

    const msg = prevGem
      ? `💎 已花費 100 金幣將【${item.name}】第 ${socketIdx + 1} 孔的【${prevGem.name}】替換為【${gem.name}】！`
      : `💎 已花費 100 金幣為【${item.name}】第 ${socketIdx + 1} 孔鑲嵌【${gem.name}】！`;
    setForgeFeedback({ type: 'success', text: msg });
    addLog(msg, 'sys');
  };

  const handleShopPurchase = (shopItem, quantity = 1) => {
    if (isInCombat) {
      addLog(`🔒 戰鬥進行中，行腳商暫停交易！`, 'sys');
      return;
    }
    const count = Math.max(1, quantity);
    const totalPrice = shopItem.price * count;

    if (player.gold < totalPrice) {
      addLog(`⚠️ 金幣不足（需要 ${totalPrice} 金幣），無法購買【${shopItem.name}】！`, 'sys');
      return;
    }

    let rewardMsg = '';

    if (shopItem.id === 'stone_1') {
      setPlayer(p => ({
        ...p,
        gold: p.gold - totalPrice,
        refineStones: p.refineStones + count
      }));
      rewardMsg = `💎 成功購入【精鍊石 ×${count}】，目前持有 ${player.refineStones + count} 顆！`;
    } else if (shopItem.id === 'stone_5') {
      const gained = 5 * count;
      setPlayer(p => ({
        ...p,
        gold: p.gold - totalPrice,
        refineStones: p.refineStones + gained
      }));
      rewardMsg = `💠 成功購入【精鍊石袋 ×${gained}】，目前持有 ${player.refineStones + gained} 顆！`;
    } else if (shopItem.id === 'ration_full') {
      setPlayer(p => ({
        ...p,
        gold: p.gold - totalPrice,
        hp: playerTotalMaxHp,
        mp: playerTotalMaxMp,
        rage: 0,
        ammo: p.maxAmmo
      }));
      setHeroRoster(prev => prev.map(h => {
        const { effectiveMaxHp } = calculateHeroEffectiveStats(h, isFengShui, null, getHeroRowIdx(h.instanceId));
        return { ...h, hp: effectiveMaxHp, fatigue: 0, rage: 0, ammo: h.maxAmmo || 6, mp: h.maxMp || 100 };
      }));
      rewardMsg = `🍙 服用【行軍大還丹禮包】，全隊生命與資源已恢復至 100% 巔峰狀態！`;
    } else if (shopItem.id === 'skill_box') {
      const newCards = [];
      for (let i = 0; i < count; i++) {
        const template = SKILL_CARDS_DB[Math.floor(Math.random() * SKILL_CARDS_DB.length)];
        newCards.push(createSkillCardInstance(template));
      }
      setPlayer(p => ({ ...p, gold: p.gold - totalPrice }));
      setSkillCardsInventory(prev => [...prev, ...newCards]);
      rewardMsg = count === 1
        ? `🃏 開啟秘傳技能卡盲盒，獲得【${newCards[0].name}】（適用：${newCards[0].allowedJobs.join('、')}）！`
        : `🃏 連開 ${count} 個技能卡盲盒，獲得：${newCards.map(c => `【${c.name}】`).join('、')}！`;
    } else if (shopItem.id === 'equip_box_mid' || shopItem.id === 'equip_box_high') {
      const isHigh = shopItem.id === 'equip_box_high';
      const tierWeights = isHigh
        ? [{ tier: 3, weight: 68 }, { tier: 4, weight: 25 }, { tier: 5, weight: 7 }]
        : [{ tier: 1, weight: 62 }, { tier: 2, weight: 28 }, { tier: 3, weight: 10 }];

      const rolledList = [];
      for (let i = 0; i < count; i++) {
        const targetTier = rollWeightedTier(tierWeights);
        const rolled = rollEquipmentFromTierRange(targetTier, targetTier, 'eq_shop');
        const bonusRefine = Math.random() < (isHigh ? 0.15 : 0.10) ? 1 : 0;
        rolledList.push({ ...rolled, refineLevel: bonusRefine });
      }

      setPlayer(p => ({ ...p, gold: p.gold - totalPrice }));
      setEquipmentInventory(prev => [...prev, ...rolledList]);

      const summaryNames = rolledList.map(eq => {
        const m = enrichEquipmentMeta(eq);
        return `【${m.tierTag}・${eq.name}${eq.refineLevel > 0 ? ` +${eq.refineLevel}` : ''}】`;
      });
      rewardMsg = count === 1
        ? `🎁 開啟${isHigh ? '天工神兵匣' : '江湖兵器箱'}，獲得${summaryNames[0]}！`
        : `🎁 連開 ${count} 個${isHigh ? '天工神兵匣' : '江湖兵器箱'}，獲得：${summaryNames.join('、')}！`;
    } else if (shopItem.id === 'hero_scroll_normal' || shopItem.id === 'hero_scroll_rare') {
      const isRare = shopItem.id === 'hero_scroll_rare';
      const tierWeights = isRare
        ? [{ tier: 3, weight: 72 }, { tier: 4, weight: 22 }, { tier: 5, weight: 6 }]
        : [{ tier: 1, weight: 65 }, { tier: 2, weight: 27 }, { tier: 3, weight: 8 }];

      const recruitedList = [];
      for (let i = 0; i < count; i++) {
        const targetTier = rollWeightedTier(tierWeights);
        const pool = HERO_TEMPLATES.filter(t => t.tier === targetTier);
        const fallbackPool = isRare
          ? HERO_TEMPLATES.filter(t => t.tier >= 3 && t.tier <= 5)
          : HERO_TEMPLATES.filter(t => t.tier >= 1 && t.tier <= 3);
        const finalPool = pool.length > 0 ? pool : fallbackPool;
        const picked = finalPool[Math.floor(Math.random() * finalPool.length)];
        recruitedList.push({
          ...normalizeHero(instantiateHero(picked, true, null, getRandomElement)),
          fusionLevel: 0
        });
      }

      setPlayer(p => ({ ...p, gold: p.gold - totalPrice }));
      setHeroRoster(prev => [...prev, ...recruitedList]);

      const summaryHeroes = recruitedList.map(
        h => `【Tier ${h.tier}】${h.heroClass}・${h.name}(${h.element})`
      );
      rewardMsg = count === 1
        ? `👥 招募成功！${summaryHeroes[0]} 正式加入名冊！`
        : `👥 連開 ${count} 張招募令，延攬：${summaryHeroes.join('、')}！`;
    }

    if (rewardMsg) {
      setShopLastReward(rewardMsg);
      addLog(`🏮 [江湖市集] ${rewardMsg}`, 'sys');
    }
  };

  return {
    shopLastReward,
    forgeFeedback,
    handleEquipItem,
    handleUnequipItem,
    handleSellEquipment,
    handleBulkSellUnusableEquipment,
    handleRefineEquipment,
    handleSocketGem,
    handleShopPurchase
  };
}
