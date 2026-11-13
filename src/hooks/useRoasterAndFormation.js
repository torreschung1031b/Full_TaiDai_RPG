import { useState } from 'react';
import { FORMATIONS_CONFIG } from '../data/formations';
import { syncFormationSlots } from '../utils/formationHelper';
import { MAX_HERO_FUSION, mergeHeroIntoTarget } from '../utils/heroFusionHelper';

export function useRosterAndFormation({
  isInCombat,
  player,
  heroRoster,
  setHeroRoster,
  activeHeroInstanceIds,
  setActiveHeroInstanceIds,
  activeHeroes,
  effectiveFormationKey,
  setCurrentFormation,
  setFormationSlots,
  setSkillCardsInventory,
  addLog
}) {
  const [fusionFeedback, setFusionFeedback] = useState(null);

  const handleToggleDeployHero = (hero) => {
    if (isInCombat) {
      addLog(`🔒 戰鬥進行中，無法調整出戰陣容！`, 'sys');
      return;
    }
    if (activeHeroInstanceIds.includes(hero.instanceId)) {
      const nextIds = activeHeroInstanceIds.filter(id => id !== hero.instanceId);
      setActiveHeroInstanceIds(nextIds);
      setFormationSlots(prev => syncFormationSlots(effectiveFormationKey, prev, nextIds));
      addLog(`🛡️ 英雄【${hero.name}】卸下登場，返回客棧休養。`, 'sys');
    } else {
      if (activeHeroInstanceIds.length >= 4) {
        addLog(`⚠️ 最多同時派遣 4 位英雄登場！`, 'sys');
        return;
      }
      if (activeHeroes.some(h => h.baseId === hero.baseId)) {
        addLog(`⚠️ 同名英雄【${hero.name}】不可重複登場（可進行同名合成升星）！`, 'sys');
        return;
      }
      const nextIds = [...activeHeroInstanceIds, hero.instanceId];
      setActiveHeroInstanceIds(nextIds);
      setFormationSlots(prev => syncFormationSlots(effectiveFormationKey, prev, nextIds));
      addLog(`⚔️ 英雄【${hero.name}】加入出戰陣容！`, 'sys');
    }
  };

  const handleFuseHero = (targetInstanceId, materialInstanceId = null) => {
    if (isInCombat) {
      addLog(`🔒 戰鬥進行中，無法進行英雄合成！`, 'sys');
      return;
    }

    const targetHero = heroRoster.find(h => h.instanceId === targetInstanceId);
    if (!targetHero) return;

    const currentFusion = Math.min(MAX_HERO_FUSION, targetHero.fusionLevel || 0);
    if (currentFusion >= MAX_HERO_FUSION) {
      const msg = `⚠️ 英雄【${targetHero.name}】已達最高突破星級（★+${MAX_HERO_FUSION}）！`;
      setFusionFeedback({ type: 'danger', text: msg });
      addLog(msg, 'sys');
      return;
    }

    const duplicates = heroRoster.filter(
      h => h.baseId === targetHero.baseId && h.instanceId !== targetHero.instanceId
    );
    if (duplicates.length === 0) {
      const msg = `⚠️ 名冊中沒有多餘的同名英雄【${targetHero.name}】可供合成！`;
      setFusionFeedback({ type: 'danger', text: msg });
      addLog(msg, 'sys');
      return;
    }

    let materialHero = materialInstanceId
      ? duplicates.find(d => d.instanceId === materialInstanceId)
      : null;
    if (!materialHero) {
      const sorted = [...duplicates].sort((a, b) => {
        const aDep = activeHeroInstanceIds.includes(a.instanceId) ? 1 : 0;
        const bDep = activeHeroInstanceIds.includes(b.instanceId) ? 1 : 0;
        return aDep - bDep || (a.level || 1) - (b.level || 1);
      });
      materialHero = sorted[0];
    }

    const nextFusion = currentFusion + 1;
    const upgradedTarget = mergeHeroIntoTarget(targetHero, materialHero, nextFusion);

    const recoveredCards = [
      ...(materialHero.activeSkillSlots || []),
      ...(materialHero.passiveSkillSlots || [])
    ];
    if (recoveredCards.length > 0) {
      setSkillCardsInventory(prev => [...prev, ...recoveredCards]);
    }

    const nextRoster = heroRoster
      .filter(h => h.instanceId !== materialHero.instanceId)
      .map(h => (h.instanceId === targetHero.instanceId ? upgradedTarget : h));
    setHeroRoster(nextRoster);

    if (activeHeroInstanceIds.includes(materialHero.instanceId)) {
      const nextActiveIds = activeHeroInstanceIds.filter(id => id !== materialHero.instanceId);
      setActiveHeroInstanceIds(nextActiveIds);
      setFormationSlots(prev => syncFormationSlots(effectiveFormationKey, prev, nextActiveIds));
    }

    const milestoneHint = nextFusion === 3
      ? '【解鎖 ★+3 覺醒：護主靈罡（開戰護盾＋真元補給）】'
      : nextFusion === 5
        ? '【解鎖 ★+5 覺醒：無雙連攜（25% 機率技能卡二連發）】'
        : '';

    const successMsg = `🌟 同名合成成功！【${targetHero.name}】突破至 ★+${nextFusion}（全基礎屬性 +${nextFusion * 15}%、主屬性 +3、技能卡威力 +${nextFusion * 12}%）${milestoneHint}${recoveredCards.length > 0 ? `，並收回素材身上 ${recoveredCards.length} 張技能卡` : ''}！`;
    setFusionFeedback({ type: 'success', text: successMsg });
    addLog(successMsg, 'sys');
  };

  const handleFuseAllHeroes = () => {
    if (isInCombat) {
      addLog(`🔒 戰鬥進行中，無法進行一鍵合成！`, 'sys');
      return;
    }

    const groups = {};
    heroRoster.forEach(h => {
      if (!groups[h.baseId]) groups[h.baseId] = [];
      groups[h.baseId].push(h);
    });

    const consumedIds = new Set();
    const updatedMap = {};
    const recoveredCards = [];
    let fusionOps = 0;

    Object.values(groups).forEach(group => {
      if (group.length < 2) return;

      const sorted = [...group].sort((a, b) => {
        const aDep = activeHeroInstanceIds.includes(a.instanceId) ? 1 : 0;
        const bDep = activeHeroInstanceIds.includes(b.instanceId) ? 1 : 0;
        return (
          bDep - aDep ||
          (b.fusionLevel || 0) - (a.fusionLevel || 0) ||
          (b.level || 1) - (a.level || 1)
        );
      });

      let mainHero = sorted[0];
      for (let i = 1; i < sorted.length; i++) {
        const curFusion = Math.min(MAX_HERO_FUSION, mainHero.fusionLevel || 0);
        if (curFusion >= MAX_HERO_FUSION) break;

        const matHero = sorted[i];
        mainHero = mergeHeroIntoTarget(mainHero, matHero, curFusion + 1);
        consumedIds.add(matHero.instanceId);
        fusionOps += 1;

        recoveredCards.push(
          ...(matHero.activeSkillSlots || []),
          ...(matHero.passiveSkillSlots || [])
        );
      }

      if (mainHero.instanceId !== sorted[0].instanceId || fusionOps > 0) {
        updatedMap[mainHero.instanceId] = mainHero;
      }
    });

    if (fusionOps === 0) {
      const msg = `ℹ️ 目前沒有可進行同名合成的英雄（需持有重複分身且未達 ★+${MAX_HERO_FUSION}）。`;
      setFusionFeedback({ type: 'danger', text: msg });
      addLog(msg, 'sys');
      return;
    }

    if (recoveredCards.length > 0) {
      setSkillCardsInventory(prev => [...prev, ...recoveredCards]);
    }

    const nextRoster = heroRoster
      .filter(h => !consumedIds.has(h.instanceId))
      .map(h => updatedMap[h.instanceId] || h);
    setHeroRoster(nextRoster);

    const nextActiveIds = activeHeroInstanceIds.filter(id => !consumedIds.has(id));
    if (nextActiveIds.length !== activeHeroInstanceIds.length) {
      setActiveHeroInstanceIds(nextActiveIds);
      setFormationSlots(prev => syncFormationSlots(effectiveFormationKey, prev, nextActiveIds));
    }

    const summaryMsg = `✨ 一鍵同名合成完成！共執行 ${fusionOps} 次星級突破${recoveredCards.length > 0 ? `，並安全收回 ${recoveredCards.length} 張素材技能卡` : ''}！`;
    setFusionFeedback({ type: 'success', text: summaryMsg });
    addLog(summaryMsg, 'sys');
  };

  const handleReleaseHero = (hero) => {
    if (isInCombat) {
      addLog(`🔒 戰鬥進行中，無法放走英雄！`, 'sys');
      return;
    }
    const returnedCards = [
      ...(hero.activeSkillSlots || []),
      ...(hero.passiveSkillSlots || [])
    ];
    if (returnedCards.length > 0) {
      setSkillCardsInventory(prev => [...prev, ...returnedCards]);
    }
    if (activeHeroInstanceIds.includes(hero.instanceId)) {
      const nextIds = activeHeroInstanceIds.filter(id => id !== hero.instanceId);
      setActiveHeroInstanceIds(nextIds);
      setFormationSlots(prev => syncFormationSlots(effectiveFormationKey, prev, nextIds));
    }
    setHeroRoster(prev => prev.filter(h => h.instanceId !== hero.instanceId));
    addLog(`👋 已放走英雄【${hero.name}】${returnedCards.length > 0 ? `（自動收回 ${returnedCards.length} 張技能卡）` : ''}。`, 'sys');
  };

  const handleEquipSkillCard = (heroInstanceId, card) => {
    if (isInCombat) {
      addLog(`🔒 戰鬥進行中，無法更換技能卡！`, 'sys');
      return;
    }
    const targetHero = heroRoster.find(h => h.instanceId === heroInstanceId);
    if (!targetHero) return;

    if (!card.allowedJobs.includes(targetHero.heroClass)) {
      addLog(`⚠️ 職業不符！【${targetHero.heroClass}】無法裝備【${card.name}】！`, 'danger');
      return;
    }

    const allEquipped = [
      ...(targetHero.activeSkillSlots || []),
      ...(targetHero.passiveSkillSlots || [])
    ];
    if (allEquipped.some(c => c.id === card.id || c.name === card.name)) {
      addLog(`⚠️ 英雄【${targetHero.name}】已裝備相同的技能卡【${card.name}】！`, 'sys');
      return;
    }

    const targetSlots = card.type === 'active'
      ? (targetHero.activeSkillSlots || [])
      : (targetHero.passiveSkillSlots || []);
    if (targetSlots.length >= 2) {
      addLog(`⚠️ 英雄【${targetHero.name}】的${card.type === 'active' ? '主動' : '被動'}技能槽已滿！`, 'sys');
      return;
    }

    setSkillCardsInventory(prev => prev.filter(c => c.uid !== card.uid));
    setHeroRoster(prev => prev.map(h => {
      if (h.instanceId !== heroInstanceId) return h;
      if (card.type === 'active') {
        return { ...h, activeSkillSlots: [...(h.activeSkillSlots || []), card] };
      }
      return { ...h, passiveSkillSlots: [...(h.passiveSkillSlots || []), card] };
    }));

    addLog(`🔮 英雄【${targetHero.name}】成功裝備強化技能卡【${card.name}】！`, 'sys');
  };

  const handleUnequipSkillCard = (heroInstanceId, card) => {
    if (isInCombat) {
      addLog(`🔒 戰鬥進行中，無法拆下技能卡！`, 'sys');
      return;
    }
    setHeroRoster(prev => prev.map(h => {
      if (h.instanceId !== heroInstanceId) return h;
      if (card.type === 'active') {
        return { ...h, activeSkillSlots: (h.activeSkillSlots || []).filter(c => c.uid !== card.uid) };
      }
      return { ...h, passiveSkillSlots: (h.passiveSkillSlots || []).filter(c => c.uid !== card.uid) };
    }));

    setSkillCardsInventory(prev => [...prev, card]);
    addLog(`📤 已拆下技能卡【${card.name}】，卡片已放回背包。`, 'sys');
  };

  const handleSelectFormation = (fKey) => {
    if (player.job !== '風水師') {
      addLog(`🔒 僅限「風水師」職業可變換陣法！`, 'sys');
      return;
    }
    if (isInCombat) {
      addLog(`🔒 戰鬥進行中，無法變換陣法！`, 'sys');
      return;
    }
    setCurrentFormation(fKey);
    setFormationSlots(prev => syncFormationSlots(fKey, prev, activeHeroInstanceIds));
    addLog(`☯️ 風水師施展【奇門陣眼】，切換為【${FORMATIONS_CONFIG[fKey].name}】（陣法增益 2 倍強化）！`, 'sys');
  };

  const handleSwapFormationSlots = (slotA, slotB) => {
    if (isInCombat) {
      addLog(`🔒 戰鬥進行中，無法調整站位！`, 'sys');
      return;
    }
    if (slotA === slotB) return;
    setFormationSlots(prev => {
      const base = syncFormationSlots(effectiveFormationKey, prev, activeHeroInstanceIds);
      if (!(slotA in base) || !(slotB in base)) return base;
      const temp = base[slotA];
      base[slotA] = base[slotB];
      base[slotB] = temp;
      return { ...base };
    });
    addLog(`📐 已調整隊伍戰術站位！`, 'sys');
  };

  return {
    fusionFeedback,
    handleToggleDeployHero,
    handleFuseHero,
    handleFuseAllHeroes,
    handleReleaseHero,
    handleEquipSkillCard,
    handleUnequipSkillCard,
    handleSelectFormation,
    handleSwapFormationSlots
  };
}
