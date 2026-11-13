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

  const handleShopPurchase = (shopItem) => {
    if (isInCombat) {
      addLog(`🔒 戰鬥進行中，行腳商暫停交易！`, 'sys');
      return;
    }
    if (player.gold < shopItem.price) {
      addLog(`⚠️ 金幣不足，無法購買【${shopItem.name}】！`, 'sys');
      return;
    }

    let rewardMsg = '';

    if (shopItem.id === 'stone_1') {
      setPlayer(p => ({ ...p, gold: p.gold - shopItem.price, refineStones: p.refineStones + 1 }));
      rewardMsg = `💎 成功購入【精鍊石 ×1】，目前持有 ${player.refineStones + 1} 顆！`;
    } else if (shopItem.id === 'stone_5') {
      setPlayer(p => ({ ...p, gold: p.gold - shopItem.price, refineStones: p.refineStones + 5 }));
      rewardMsg = `💠 成功購入【五連精鍊石禮盒 ×5】，目前持有 ${player.refineStones + 5} 顆！`;
    } else if (shopItem.id === 'ration_full') {
      setPlayer(p => ({
        ...p,
        gold: p.gold - shopItem.price,
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
      const template = SKILL_CARDS_DB[Math.floor(Math.random() * SKILL_CARDS_DB.length)];
      const newCard = createSkillCardInstance(template);
      setPlayer(p => ({ ...p, gold: p.gold - shopItem.price }));
      setSkillCardsInventory(prev => [...prev, newCard]);
      rewardMsg = `🃏 開啟秘傳技能卡盲盒，獲得【${newCard.name}】（適用：${newCard.allowedJobs.join('、')}）！`;
    } else if (shopItem.id === 'equip_box_mid' || shopItem.id === 'equip_box_high') {
      const isHigh = shopItem.id === 'equip_box_high';
      const rolled = rollEquipmentFromTierRange(isHigh ? 3 : 1, isHigh ? 5 : 3, 'eq_shop');
      const bonusRefine = Math.random() < (isHigh ? 0.30 : 0.25) ? 1 : 0;
      const newEquip = { ...rolled, refineLevel: bonusRefine };
      const meta = enrichEquipmentMeta(newEquip);
      setPlayer(p => ({ ...p, gold: p.gold - shopItem.price }));
      setEquipmentInventory(prev => [...prev, newEquip]);
      rewardMsg = `🎁 開啟${isHigh ? '天工神兵匣' : '江湖兵器箱'}，獲得【${meta.tierTag}・${newEquip.name} (+${bonusRefine})】！`;
    } else if (shopItem.id === 'hero_scroll_normal' || shopItem.id === 'hero_scroll_rare') {
      const pool = shopItem.id === 'hero_scroll_rare'
        ? HERO_TEMPLATES.filter(t => t.tier >= 3 && t.tier <= 5)
        : HERO_TEMPLATES.filter(t => t.tier >= 1 && t.tier <= 3);
      const picked = pool[Math.floor(Math.random() * pool.length)];
      const recruitedHero = {
        ...normalizeHero(instantiateHero(picked, true, null, getRandomElement)),
        fusionLevel: 0
      };
      setPlayer(p => ({ ...p, gold: p.gold - shopItem.price }));
      setHeroRoster(prev => [...prev, recruitedHero]);
      rewardMsg = `👥 招募成功！【Tier ${recruitedHero.tier}】${recruitedHero.heroClass}【${recruitedHero.name}】（${recruitedHero.element}屬性）正式加入名冊！`;
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
