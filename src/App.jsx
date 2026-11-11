import React, { useState, useEffect, useRef } from 'react';
import GameUI from './GameUI';

import { 
  TIER_CONFIG, 
  HERO_TEMPLATES, 
  instantiateHero 
} from './data/heroes';

import { 
  EQUIP_SLOTS,
  EQUIP_SETS_DB,
  GEMS_DB,
  ITEM_DROP_POOL, 
  calculateEquipmentBonus 
} from './data/equipment';

import { 
  JOBS_CONFIG, 
  PROTAGONIST_SKILLS_DB, 
  getSkillMultiplier 
} from './data/skills';

const ELEMENTS = {
  '金': { name: '金', counters: '木' },
  '木': { name: '木', counters: '土' },
  '水': { name: '水', counters: '火' },
  '火': { name: '火', counters: '金' },
  '土': { name: '土', counters: '水' }
};

const ELEMENT_KEYS = ['金', '木', '水', '火', '土'];

function getRandomElement() {
  return ELEMENT_KEYS[Math.floor(Math.random() * ELEMENT_KEYS.length)];
}

function getElementMultiplier(attElem, defElem) {
  if (!attElem || !defElem || !ELEMENTS[attElem]) return 1.0;
  if (ELEMENTS[attElem].counters === defElem) return 1.5;
  if (ELEMENTS[defElem] && ELEMENTS[defElem].counters === attElem) return 0.75;
  return 1.0;
}

const FORMATIONS_CONFIG = {
  'none': { name: '無陣法', desc: '標準自由站位，無額外陣法增益。', icon: '⚪', bonus: {} },
  'tianfu': { name: '天覆陣', desc: '天罡護體！全隊護甲 +20%，受到傷害 -10%。', icon: '🛡️', bonus: { defPct: 0.20, damageTakenPct: -0.10 } },
  'dizai': { name: '地載陣', desc: '厚德載物！全隊生命上限 +15%，格擋率 +15%。', icon: '🏔️', bonus: { hpPct: 0.15, blockPct: 0.15 } },
  'bagua': { name: '八卦陣', desc: '陰陽迴轉！五行法術傷害 +15%，速度 +15%。', icon: '☯️', bonus: { elemDmgPct: 0.15, speedPct: 0.15 } },
  'fengshi': { name: '鋒矢陣', desc: '如箭離弦！全隊物理攻擊 +25%，暴擊率 +10%。', icon: '🏹', bonus: { atkPct: 0.25, critPct: 0.10 } }
};

const ZONES = [
  { id: 'z1', name: '新手竹林 (Lvl.1-4)', monsters: [{ name: '竹林野兔', hp: 80, atk: 16, def: 3, exp: 35, gold: 25 }, { name: '青竹小蛇', hp: 100, atk: 20, def: 5, exp: 45, gold: 30 }] },
  { id: 'z2', name: '黑山寨 (Lvl.5-9)', monsters: [{ name: '黃巾刀客', hp: 220, atk: 36, def: 9, exp: 90, gold: 70 }, { name: '黑山狼妖', hp: 280, atk: 45, def: 12, exp: 120, gold: 95 }] },
  { id: 'z3', name: '火雲洞 (Lvl.10-14)', monsters: [{ name: '烈焰火妖', hp: 450, atk: 70, def: 18, exp: 210, gold: 180 }, { name: '熔岩怪石', hp: 600, atk: 55, def: 28, exp: 260, gold: 220 }] },
  { id: 'z4', name: '蓬萊仙島 (Lvl.15+)', monsters: [{ name: '蓬萊仙鹿', hp: 950, atk: 120, def: 40, exp: 500, gold: 450 }, { name: '九天神將', hp: 1300, atk: 155, def: 55, exp: 750, gold: 650 }] }
];

export default function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [creationData, setCreationData] = useState({
    name: '',
    element: '金',
    job: '猛將',
    selectedStarterHero: null
  });

  const [starterHeroCandidates, setStarterHeroCandidates] = useState([]);

  // 主角 State
  const [player, setPlayer] = useState({
    name: '太古少俠',
    level: 1,
    exp: 0,
    maxExp: 100,
    job: '猛將',
    element: '金',
    stats: { str: 10, int: 10, con: 10, agi: 10 },
    statPoints: 5,
    maxHp: 150, hp: 150,
    maxMp: 60, mp: 60,
    rage: 0,
    ammo: 6, maxAmmo: 6,
    atk: 25, def: 8, speed: 10,
    gold: 500, refineStones: 5,
    sp: 2, tp: 0,
    skillLevels: [1, 0, 0, 0],
    equipped: { weapon: null, armor: null, accessory: null, hat: null, boots: null }
  });

  // 英雄隊伍 State
  const [heroRoster, setHeroRoster] = useState([]);
  const [activeHeroInstanceIds, setActiveHeroInstanceIds] = useState([]);
  const [currentFormation, setCurrentFormation] = useState('none');
  const [equipmentInventory, setEquipmentInventory] = useState(ITEM_DROP_POOL.slice(0, 3));
  const [towerFloor, setTowerFloor] = useState(1);

  // UI 與戰鬥 State
  const [activeTab, setActiveTab] = useState('combat');
  const [currentZoneIndex, setCurrentZoneIndex] = useState(0);
  const [monsters, setMonsters] = useState([]);
  const [selectedTargetIndex, setSelectedTargetIndex] = useState(0);
  const [combatLogs, setCombatLogs] = useState([]);
  const [turnCount, setTurnCount] = useState(1);
  const [combatPhase, setCombatPhase] = useState('PLAYER_SELECT');
  const [victorySummary, setVictorySummary] = useState(null);

  const [jsonSaveText, setJsonSaveText] = useState('');
  const [saveLoadStatus, setSaveLoadStatus] = useState('');

  // 初始化 Starter 3 選 1
  useEffect(() => {
    const pool = HERO_TEMPLATES.filter(h => h.tier === 1 || h.tier === 2);
    const shuffled = [...pool].sort(() => 0.5 - Math.random()).slice(0, 3);
    const instanced = shuffled.map(t => instantiateHero(t, true, null, getRandomElement));
    setStarterHeroCandidates(instanced);
    setCreationData(prev => ({ ...prev, selectedStarterHero: instanced[0] }));
  }, []);

  // 本地自動存檔載入
  useEffect(() => {
    const saved = localStorage.getItem('TIANWAI_RPG_SAVE');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPlayer(parsed.player);
        setHeroRoster(parsed.heroRoster || []);
        setActiveHeroInstanceIds(parsed.activeHeroInstanceIds || []);
        setCurrentFormation(parsed.currentFormation || 'none');
        setEquipmentInventory(parsed.equipmentInventory || []);
        setTowerFloor(parsed.towerFloor || 1);
        setGameStarted(true);
      } catch (e) {
        console.error("載入存檔失敗", e);
      }
    }
  }, []);

  // 自動存檔
  useEffect(() => {
    if (gameStarted) {
      const saveData = { player, heroRoster, activeHeroInstanceIds, currentFormation, equipmentInventory, towerFloor };
      localStorage.setItem('TIANWAI_RPG_SAVE', JSON.stringify(saveData));
    }
  }, [player, heroRoster, activeHeroInstanceIds, currentFormation, equipmentInventory, towerFloor, gameStarted]);

  // 計算登場英雄
  const activeHeroes = activeHeroInstanceIds
    .map(id => heroRoster.find(h => h.instanceId === id))
    .filter(Boolean);

  const { bonus: equipBonus, setAtkPct, setHpPct, setMpPct, setDefPct } = calculateEquipmentBonus(player.equipped);
  const formBonus = FORMATIONS_CONFIG[currentFormation]?.bonus || {};

  const playerTotalMaxHp = Math.floor((player.maxHp + (player.stats.con * 16) + equipBonus.hp) * (1 + setHpPct + (formBonus.hpPct || 0)));
  const playerTotalMaxMp = Math.floor((player.maxMp + (player.stats.int * 10) + equipBonus.mp) * (1 + setMpPct));
  const playerTotalAtk = Math.floor((player.atk + (player.stats.str * 3) + equipBonus.atk) * (1 + setAtkPct + (formBonus.atkPct || 0)));
  const playerTotalDef = Math.floor((player.def + (player.stats.con * 1) + equipBonus.def) * (1 + (setDefPct || 0) + (formBonus.defPct || 0)));

  const addLog = (text, type = 'info') => {
    setCombatLogs(prev => [...prev, { id: Date.now() + Math.random(), turn: turnCount, text, type }]);
  };

  const handleStartGame = () => {
    const jobConfig = JOBS_CONFIG[creationData.job];
    const starterHero = creationData.selectedStarterHero;

    const newPlayer = {
      ...player,
      name: creationData.name || "太古少俠",
      job: creationData.job,
      element: creationData.element,
      maxHp: jobConfig.baseHp, hp: jobConfig.baseHp,
      maxMp: jobConfig.baseMp, mp: jobConfig.baseMp,
      atk: jobConfig.baseAtk, def: jobConfig.baseDef, speed: jobConfig.baseSpeed
    };

    setPlayer(newPlayer);
    setHeroRoster([starterHero]);
    setActiveHeroInstanceIds([starterHero.instanceId]);
    setGameStarted(true);
    spawnEncounter(0, [starterHero]);
    setCombatLogs([{ id: 1, turn: 1, type: 'sys', text: `📜 少俠【${newPlayer.name}】踏入《天外 Online》！` }]);
  };

  const spawnEncounter = (zoneIdx, customActiveHeroes = null) => {
    const deployed = customActiveHeroes !== null ? customActiveHeroes : activeHeroes;
    const totalCombatants = 1 + deployed.length;
    const count = Math.floor(Math.random() * (totalCombatants * 2)) + totalCombatants;

    const zone = ZONES[zoneIdx];
    let list = [];
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    for (let i = 0; i < count; i++) {
      const template = zone.monsters[Math.floor(Math.random() * zone.monsters.length)];
      const randElem = getRandomElement();
      list.push({
        id: `m_${Date.now()}_${i}`,
        name: `${template.name} ${alphabet[i] || i + 1}`,
        element: randElem,
        maxHp: template.hp, hp: template.hp,
        atk: template.atk, def: template.def,
        exp: template.exp, gold: template.gold
      });
    }

    setMonsters(list);
    setSelectedTargetIndex(0);
    setTurnCount(1);
    setCombatPhase('PLAYER_SELECT');
    return list;
  };

  const handleToggleDeployHero = (hero) => {
    if (activeHeroInstanceIds.includes(hero.instanceId)) {
      setActiveHeroInstanceIds(prev => prev.filter(id => id !== hero.instanceId));
      addLog(`🛡️ 英雄【${hero.name}】退出登場佇列。`, 'sys');
    } else {
      if (activeHeroInstanceIds.length >= 4) {
        addLog(`⚠️ 最多同時派遣 4 位英雄！`, 'sys');
        return;
      }
      if (activeHeroes.some(h => h.baseId === hero.baseId)) {
        addLog(`⚠️ 同名英雄【${hero.name}】不可重複登場！`, 'sys');
        return;
      }
      setActiveHeroInstanceIds(prev => [...prev, hero.instanceId]);
      addLog(`⚔️ 英雄【${hero.name}】加入登場佇列！`, 'sys');
    }
  };

  // 核心回合處理：包含動態職業資源與隊伍英雄連動
  const handleExecuteRound = (actionInput = { type: 'attack' }, isFusionUltimate = false) => {
    setCombatPhase('EXECUTING');
    let currentMonsters = [...monsters];
    let currentPlayer = { ...player };
    let currentRoster = [...heroRoster];

    let targetIdx = selectedTargetIndex;
    if (!currentMonsters[targetIdx] || currentMonsters[targetIdx].hp <= 0) {
      targetIdx = currentMonsters.findIndex(m => m.hp > 0);
      if (targetIdx === -1) targetIdx = 0;
    }

    // 1. 主僕合擊奧義
    if (isFusionUltimate) {
      addLog(`✨ 觸發【主僕合擊奧義】！`, 'player');
      currentMonsters.forEach(m => {
        if (m.hp > 0) {
          let teamAtk = playerTotalAtk;
          activeHeroes.forEach(h => { teamAtk += h.atk; });
          const em = getElementMultiplier(currentPlayer.element, m.element);
          const dmg = Math.max(30, Math.floor(teamAtk * 2.0 * em) - m.def);
          m.hp = Math.max(0, m.hp - dmg);
          addLog(`💥 對【${m.name}】造成 ${dmg} 點巨額打擊！`, 'player');
        }
      });
      if (currentPlayer.job === '猛將') currentPlayer.rage = 0;
      else currentPlayer.mp = Math.max(0, currentPlayer.mp - 40);
    } 
    // 2. 普通攻擊 (累積資源)
    else if (actionInput.type === 'attack' && currentMonsters[targetIdx]) {
      const targetM = currentMonsters[targetIdx];
      const em = getElementMultiplier(currentPlayer.element, targetM.element);
      const dmg = Math.max(5, Math.floor((playerTotalAtk - targetM.def) * em));
      targetM.hp = Math.max(0, targetM.hp - dmg);
      addLog(`🗡️ 你發動普通攻擊，對【${targetM.name}】造成 ${dmg} 點傷害！`, 'player');

      // 🔥 職業資源恢復機制
      if (currentPlayer.job === '猛將') {
        currentPlayer.rage = Math.min(100, currentPlayer.rage + 25);
        addLog(`🔥 攻擊積攢怒氣！目前怒氣: ${currentPlayer.rage}/100`, 'sys');
      } else if (currentPlayer.job === '巧匠') {
        currentPlayer.ammo = Math.min(currentPlayer.maxAmmo, currentPlayer.ammo + 4);
        addLog(`🏹 補給暗器！目前彈藥: ${currentPlayer.ammo}/${currentPlayer.maxAmmo}`, 'sys');
      } else {
        currentPlayer.mp = Math.min(playerTotalMaxMp, currentPlayer.mp + 20);
        addLog(`💧 調息凝神！恢復 +20 MP (目前: ${currentPlayer.mp}/${playerTotalMaxMp})`, 'sys');
      }
    } 
    // 3. 釋放職業技能
    else if (actionInput.type === 'skill' && actionInput.skill) {
      const sk = actionInput.skill;
      const skLvl = currentPlayer.skillLevels[actionInput.skillIdx] || 1;
      const mult = getSkillMultiplier(sk, skLvl);

      let hasResource = true;
      if (sk.costType === 'rage' && currentPlayer.rage < sk.cost) hasResource = false;
      if (sk.costType === 'mp' && currentPlayer.mp < sk.cost) hasResource = false;
      if (sk.costType === 'ammo' && currentPlayer.ammo < sk.cost) hasResource = false;

      if (!hasResource) {
        addLog(`⚠️ 資源不足，無法發動【${sk.name}】！改為普通打擊。`, 'sys');
        const targetM = currentMonsters[targetIdx];
        if (targetM) {
          const em = getElementMultiplier(currentPlayer.element, targetM.element);
          const dmg = Math.max(5, Math.floor((playerTotalAtk - targetM.def) * em));
          targetM.hp = Math.max(0, targetM.hp - dmg);
        }
      } else {
        if (sk.costType === 'rage') currentPlayer.rage -= sk.cost;
        if (sk.costType === 'mp') currentPlayer.mp -= sk.cost;
        if (sk.costType === 'ammo') currentPlayer.ammo -= sk.cost;

        if (sk.type === 'aoe') {
          currentMonsters.forEach(m => {
            if (m.hp > 0) {
              const em = getElementMultiplier(currentPlayer.element, m.element);
              const dmg = Math.max(8, Math.floor(playerTotalAtk * mult * em) - m.def);
              m.hp = Math.max(0, m.hp - dmg);
              addLog(`⚡ 發動全體【${sk.name} (Lv.${skLvl})】，對【${m.name}】造成 ${dmg} 點打擊！`, 'player');
            }
          });
        } else if (sk.type === 'heal') {
          const healVal = Math.floor(playerTotalAtk * mult);
          currentPlayer.hp = Math.min(playerTotalMaxHp, currentPlayer.hp + healVal);
          currentRoster = currentRoster.map(h => 
            activeHeroInstanceIds.includes(h.instanceId)
              ? { ...h, hp: Math.min(h.maxHp, h.hp + healVal) }
              : h
          );
          addLog(`🌿 施展【${sk.name} (Lv.${skLvl})】，全隊恢復 +${healVal} HP！`, 'player');
        } else {
          const targetM = currentMonsters[targetIdx];
          if (targetM) {
            const em = getElementMultiplier(currentPlayer.element, targetM.element);
            const dmg = Math.max(10, Math.floor(playerTotalAtk * mult * em) - targetM.def);
            targetM.hp = Math.max(0, targetM.hp - dmg);
            addLog(`⚡ 發動【${sk.name} (Lv.${skLvl})】，對【${targetM.name}】爆發 ${dmg} 點重傷！`, 'player');
          }
        }
      }
    }

    // 4. 登場英雄出手打擊與資源積攢
    currentRoster = currentRoster.map(h => {
      if (!activeHeroInstanceIds.includes(h.instanceId)) return h;
      if (h.hp <= 0) return h;

      const aliveTargets = currentMonsters.filter(m => m.hp > 0);
      if (aliveTargets.length === 0) return h;
      const validTarget = aliveTargets[Math.floor(Math.random() * aliveTargets.length)];
      const em = getElementMultiplier(h.element, validTarget.element);
      const dmg = Math.max(5, Math.floor((h.atk - validTarget.def) * em));
      validTarget.hp = Math.max(0, validTarget.hp - dmg);
      addLog(`💥 英雄【${h.name}】對【${validTarget.name}】造成 ${dmg} 點打擊！`, 'hero');

      // 更新英雄專屬資源
      let updatedRage = h.rage || 0;
      let updatedAmmo = h.ammo || 6;
      let updatedMp = h.mp || 50;

      if (h.job === '猛將') updatedRage = Math.min(100, updatedRage + 20);
      else if (h.job === '巧匠') updatedAmmo = Math.min(h.maxAmmo || 6, updatedAmmo + 2);
      else updatedMp = Math.min(h.maxMp || 100, updatedMp + 15);

      return { ...h, rage: updatedRage, ammo: updatedAmmo, mp: updatedMp };
    });

    // 5. 怪物群體反擊
    const aliveMonsters = currentMonsters.filter(m => m.hp > 0);
    if (aliveMonsters.length > 0) {
      aliveMonsters.forEach(m => {
        const em = getElementMultiplier(m.element, currentPlayer.element);
        const dmg = Math.max(3, Math.floor((m.atk - playerTotalDef) * em));
        currentPlayer.hp = Math.max(0, currentPlayer.hp - dmg);
        addLog(`👹 【${m.name}】襲擊少俠，造成 ${dmg} 點傷害！`, 'monster');

        if (currentPlayer.job === '猛將') {
          currentPlayer.rage = Math.min(100, currentPlayer.rage + 15);
        }

        // 隊伍英雄承傷
        currentRoster = currentRoster.map(h => {
          if (!activeHeroInstanceIds.includes(h.instanceId) || h.hp <= 0) return h;
          if (Math.random() < 0.4) {
            const hDmg = Math.max(2, Math.floor(m.atk * 0.6));
            const newHp = Math.max(0, h.hp - hDmg);
            if (newHp === 0) addLog(`💀 英雄【${h.name}】不敵倒下！`, 'sys');
            return { ...h, hp: newHp };
          }
          return h;
        });
      });
    }

    setMonsters(currentMonsters);
    setPlayer(currentPlayer);
    setHeroRoster(currentRoster);

    if (currentMonsters.every(m => m.hp <= 0)) {
      addLog(`🎉 敵方全數殲滅！`, 'sys');
      handleBattleVictory(currentPlayer, currentMonsters);
      return;
    }

    setTurnCount(prev => prev + 1);
    setCombatPhase('PLAYER_SELECT');
  };

  const handleBattleVictory = (pObj, defeatedMonsters) => {
    let totalGold = 0, totalExp = 0, droppedStones = 0;
    let droppedEquipments = [];

    defeatedMonsters.forEach(m => {
      totalGold += m.gold;
      totalExp += m.exp;
      if (Math.random() < 0.45) droppedStones += 1;
      if (Math.random() < 0.35) {
        const template = ITEM_DROP_POOL[Math.floor(Math.random() * ITEM_DROP_POOL.length)];
        droppedEquipments.push({ ...template, refineLevel: 0, uid: `eq_${Date.now()}_${Math.random()}` });
      }
    });

    let droppedHero = null;
    if (Math.random() < 0.30) {
      const candidates = HERO_TEMPLATES.filter(t => t.tier <= Math.min(5, currentZoneIndex + 2));
      const picked = candidates[Math.floor(Math.random() * candidates.length)];
      droppedHero = instantiateHero(picked, true, null, getRandomElement);
      setHeroRoster(prev => [...prev, droppedHero]);
    }

    let newPlayer = {
      ...pObj,
      gold: pObj.gold + totalGold,
      refineStones: pObj.refineStones + droppedStones,
      exp: pObj.exp + totalExp
    };

    while (newPlayer.exp >= newPlayer.maxExp) {
      newPlayer.exp -= newPlayer.maxExp;
      newPlayer.level += 1;
      newPlayer.maxExp = Math.floor(newPlayer.maxExp * 1.5);
      newPlayer.maxHp += 30;
      newPlayer.maxMp += 20;
      newPlayer.hp = newPlayer.maxHp;
      newPlayer.mp = newPlayer.maxMp;
      newPlayer.statPoints += 3;
      newPlayer.sp += 1;
      newPlayer.tp += 1;
    }

    setPlayer(newPlayer);
    if (droppedEquipments.length > 0) {
      setEquipmentInventory(prev => [...prev, ...droppedEquipments]);
    }

    setVictorySummary({
      gold: totalGold,
      exp: totalExp,
      stones: droppedStones,
      equipments: droppedEquipments,
      hero: droppedHero
    });
  };

  const handleRestInn = () => {
    setPlayer(prev => ({ ...prev, hp: playerTotalMaxHp, mp: playerTotalMaxMp, rage: 0, ammo: prev.maxAmmo }));
    setHeroRoster(prev => prev.map(h => ({ ...h, hp: h.maxHp, rage: 0, ammo: h.maxAmmo || 6, mp: h.maxMp || 100 })));
    addLog(`🏨 在客棧休養生息，全隊 HP/MP/職業資源恢復滿值！`, 'sys');
  };

  const handleExportSave = () => {
    const saveData = { player, heroRoster, activeHeroInstanceIds, currentFormation, equipmentInventory, towerFloor };
    setJsonSaveText(JSON.stringify(saveData, null, 2));
    setSaveLoadStatus('✅ 存檔匯出成功！請複製上方 JSON 數據。');
  };

  const handleImportSave = () => {
    try {
      const parsed = JSON.parse(jsonSaveText);
      setPlayer(parsed.player);
      setHeroRoster(parsed.heroRoster || []);
      setActiveHeroInstanceIds(parsed.activeHeroInstanceIds || []);
      setCurrentFormation(parsed.currentFormation || 'none');
      setEquipmentInventory(parsed.equipmentInventory || []);
      setTowerFloor(parsed.towerFloor || 1);
      setSaveLoadStatus('🎉 存檔匯入成功！系統已更新。');
    } catch (e) {
      setSaveLoadStatus('❌ JSON 匯入失敗，格式有誤！');
    }
  };

  return (
    <GameUI
      gameStarted={gameStarted}
      creationData={creationData}
      setCreationData={setCreationData}
      starterHeroCandidates={starterHeroCandidates}
      handleStartGame={handleStartGame}
      player={player}
      setPlayer={setPlayer}
      playerTotalMaxHp={playerTotalMaxHp}
      playerTotalMaxMp={playerTotalMaxMp}
      playerTotalAtk={playerTotalAtk}
      playerTotalDef={playerTotalDef}
      heroRoster={heroRoster}
      activeHeroes={activeHeroes}
      activeHeroInstanceIds={activeHeroInstanceIds}
      handleToggleDeployHero={handleToggleDeployHero}
      currentFormation={currentFormation}
      setCurrentFormation={setCurrentFormation}
      equipmentInventory={equipmentInventory}
      setEquipmentInventory={setEquipmentInventory}
      towerFloor={towerFloor}
      setTowerFloor={setTowerFloor}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      currentZoneIndex={currentZoneIndex}
      setCurrentZoneIndex={setCurrentZoneIndex}
      monsters={monsters}
      selectedTargetIndex={selectedTargetIndex}
      setSelectedTargetIndex={setSelectedTargetIndex}
      combatLogs={combatLogs}
      handleExecuteRound={handleExecuteRound}
      spawnEncounter={spawnEncounter}
      victorySummary={victorySummary}
      setVictorySummary={setVictorySummary}
      handleRestInn={handleRestInn}
      jsonSaveText={jsonSaveText}
      setJsonSaveText={setJsonSaveText}
      saveLoadStatus={saveLoadStatus}
      handleExportSave={handleExportSave}
      handleImportSave={handleImportSave}
    />
  );
}
