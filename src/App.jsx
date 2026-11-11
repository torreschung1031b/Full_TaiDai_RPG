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
  { id: 'z3', name: '火雲洞 (Lvl.10-14)', monsters: [{ name: '赤焰火蝠', hp: 550, atk: 68, def: 16, exp: 200, gold: 170 }, { name: '火雲洞主', hp: 980, atk: 92, def: 22, exp: 360, gold: 320 }] },
  { id: 'z4', name: '蓬萊仙島 (Lvl.15+)', monsters: [{ name: '仙境靈鹿', hp: 1350, atk: 110, def: 30, exp: 500, gold: 420 }, { name: '守護仙童', hp: 1800, atk: 135, def: 38, exp: 650, gold: 550 }] }
];

const LOCAL_STORAGE_KEY = 'MYSTINA_RPG_SAVE_V2';

export default function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [creationData, setCreationData] = useState({
    name: "太古少俠",
    gender: "male",
    job: "猛將",
    element: "金",
    selectedStarterHero: null
  });
  const [starterHeroCandidates, setStarterHeroCandidates] = useState([]);

  const [player, setPlayer] = useState({
    name: "太古少俠",
    job: "猛將",
    advancement: null,
    element: "金",
    level: 1,
    exp: 0,
    maxExp: 100,
    hp: 260, maxHp: 260,
    mp: 0, maxMp: 0,
    rage: 0, ammo: 20, maxAmmo: 20,
    atk: 38, def: 14, speed: 10,
    gold: 600, refineStones: 10,
    statPoints: 5, sp: 2, tp: 2,
    stats: { str: 0, con: 0, int: 0, agi: 0 },
    skillLevels: { 0: 1, 1: 0, 2: 0 },
    equipped: { weapon: null, offhand: null, helmet: null, armor: null, shoes: null, accessory: null }
  });

  const [heroRoster, setHeroRoster] = useState([]);
  const [activeHeroInstanceIds, setActiveHeroInstanceIds] = useState([]);
  const [currentFormation, setCurrentFormation] = useState('none');
  const [equipmentInventory, setEquipmentInventory] = useState(ITEM_DROP_POOL.slice(0, 3));
  const [towerFloor, setTowerFloor] = useState(1);

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

  const chatEndRef = useRef(null);

  useEffect(() => {
    const t1s = HERO_TEMPLATES.filter(t => t.tier === 1);
    const cands = t1s.map(t => instantiateHero(t, true, null, getRandomElement));
    setStarterHeroCandidates(cands);
    setCreationData(prev => ({ ...prev, selectedStarterHero: cands[0] }));

    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.player) {
          setPlayer(parsed.player);
          setHeroRoster(parsed.heroRoster || []);
          setActiveHeroInstanceIds(parsed.activeHeroInstanceIds || []);
          setCurrentFormation(parsed.currentFormation || 'none');
          setEquipmentInventory(parsed.equipmentInventory || []);
          setTowerFloor(parsed.towerFloor || 1);
          setGameStarted(true);
        }
      }
    } catch (e) {
      console.warn('自動載入存檔失敗', e);
    }
  }, []);

  useEffect(() => {
    if (gameStarted) {
      try {
        const saveData = { player, heroRoster, activeHeroInstanceIds, currentFormation, equipmentInventory, towerFloor };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(saveData));
      } catch (e) {
        console.warn('自動存檔失敗', e);
      }
    }
  }, [player, heroRoster, activeHeroInstanceIds, currentFormation, equipmentInventory, towerFloor, gameStarted]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [combatLogs]);

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

  const handleExecuteRound = (isFusionUltimate = false) => {
    setCombatPhase('EXECUTING');
    let currentMonsters = [...monsters];
    let currentPlayer = { ...player };
    let currentHeroes = activeHeroes.map(h => ({ ...h }));

    let targetIdx = selectedTargetIndex;
    if (!currentMonsters[targetIdx] || currentMonsters[targetIdx].hp <= 0) {
      targetIdx = currentMonsters.findIndex(m => m.hp > 0);
      if (targetIdx === -1) targetIdx = 0;
    }

    if (isFusionUltimate) {
      addLog(`✨ 觸發【主僕合擊奧義】！`, 'player');
      currentMonsters.forEach(m => {
        if (m.hp > 0) {
          let teamAtk = playerTotalAtk;
          currentHeroes.forEach(h => { teamAtk += h.atk; });
          const em = getElementMultiplier(currentPlayer.element, m.element);
          const dmg = Math.max(30, Math.floor(teamAtk * 2.0 * em) - m.def);
          m.hp = Math.max(0, m.hp - dmg);
          addLog(`💥 對【${m.name}】造成 ${dmg} 點巨額打擊！`, 'player');
        }
      });
    } else if (currentMonsters[targetIdx]) {
      const targetM = currentMonsters[targetIdx];
      const em = getElementMultiplier(currentPlayer.element, targetM.element);
      const dmg = Math.max(5, Math.floor((playerTotalAtk - targetM.def) * em));
      targetM.hp = Math.max(0, targetM.hp - dmg);
      addLog(`🗡️ 你打擊【${targetM.name}】，造成 ${dmg} 點傷害！`, 'player');
    }

    currentHeroes.forEach(h => {
      if (h.hp <= 0) return;
      const aliveTargets = currentMonsters.filter(m => m.hp > 0);
      if (aliveTargets.length === 0) return;
      const validTarget = aliveTargets[Math.floor(Math.random() * aliveTargets.length)];
      const em = getElementMultiplier(h.element, validTarget.element);
      const dmg = Math.max(5, Math.floor((h.atk - validTarget.def) * em));
      validTarget.hp = Math.max(0, validTarget.hp - dmg);
      addLog(`💥 英雄【${h.name}】對【${validTarget.name}】造成 ${dmg} 點打擊！`, 'hero');
    });

    const aliveMonsters = currentMonsters.filter(m => m.hp > 0);
    if (aliveMonsters.length > 0) {
      aliveMonsters.forEach(m => {
        const em = getElementMultiplier(m.element, currentPlayer.element);
        const dmg = Math.max(3, Math.floor((m.atk - playerTotalDef) * em));
        currentPlayer.hp = Math.max(0, currentPlayer.hp - dmg);
        addLog(`👹 【${m.name}】襲擊少俠，造成 ${dmg} 點傷害！`, 'monster');
      });
    }

    setMonsters(currentMonsters);
    setPlayer(currentPlayer);

    if (currentMonsters.every(m => m.hp <= 0)) {
      addLog(`🎉 敵方全數殲滅！`, 'sys');
      handleBattleVictory(currentPlayer, currentMonsters);
      return;
    }

    setTurnCount(prev => prev + 1);
    setCombatPhase('PLAYER_SELECT');
  };

  // 戰鬥勝利結算（包含裝備與英雄卡片掉落算法）
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
    let msgs = [];

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
      msgs.push(`🎉 升級至 Level ${newPlayer.level}！獲得 3 點屬性點與 1 點 SP！`);
    }

    setPlayer(newPlayer);
    if (droppedEquipments.length > 0) {
      setEquipmentInventory(prev => [...prev, ...droppedEquipments]);
    }

    setVictorySummary({
      gold: totalGold,
      exp: totalExp,
      stones: droppedStones,
      droppedEquipments,
      droppedHero,
      msgs
    });
  };

  const handleRefineEquipment = (item) => {
    const level = item.refineLevel || 0;
    if (player.gold < (level + 1) * 120 || player.refineStones < 1) return;
    const isSuccess = Math.random() < (level < 4 ? 1.0 : 0.65);
    setPlayer(p => ({ ...p, gold: p.gold - (level + 1) * 120, refineStones: p.refineStones - 1 }));
    const nextLevel = isSuccess ? level + 1 : Math.max(0, level - 1);
    const updated = { ...item, refineLevel: nextLevel };

    setEquipmentInventory(prev => prev.map(i => i.uid === item.uid ? updated : i));
    if (player.equipped[item.type]?.uid === item.uid) {
      setPlayer(p => ({ ...p, equipped: { ...p.equipped, [item.type]: updated } }));
    }
  };

  const handleSocketGem = (item, gem, socketIdx) => {
    let newSockets = [...(item.sockets || [null])];
    newSockets[socketIdx] = gem;
    const updated = { ...item, sockets: newSockets };

    setEquipmentInventory(prev => prev.map(i => i.uid === item.uid ? updated : i));
    if (player.equipped[item.type]?.uid === item.uid) {
      setPlayer(p => ({ ...p, equipped: { ...p.equipped, [item.type]: updated } }));
    }
  };

  const handleExportSave = () => {
    const jsonStr = JSON.stringify({ player, heroRoster, activeHeroInstanceIds, currentFormation, equipmentInventory, towerFloor }, null, 2);
    setJsonSaveText(jsonStr);
    setSaveLoadStatus('存檔 JSON 匯出成功！');
  };

  const handleImportSave = () => {
    try {
      const parsed = JSON.parse(jsonSaveText);
      if (parsed && parsed.player) {
        setPlayer(parsed.player);
        setHeroRoster(parsed.heroRoster || []);
        setActiveHeroInstanceIds(parsed.activeHeroInstanceIds || []);
        setCurrentFormation(parsed.currentFormation || 'none');
        setEquipmentInventory(parsed.equipmentInventory || []);
        setTowerFloor(parsed.towerFloor || 1);
        setGameStarted(true);
        setSaveLoadStatus('✅ 成功匯入遊戲進度！');
      }
    } catch (e) {
      setSaveLoadStatus('❌ 匯入失敗，請確認 JSON 格式。');
    }
  };

  const handleResetSave = () => {
    if (window.confirm("確定要重置所有遊戲紀錄嗎？")) {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      window.location.reload();
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
      activeHeroes={activeHeroes}
      activeHeroInstanceIds={activeHeroInstanceIds}
      heroRoster={heroRoster}
      setHeroRoster={setHeroRoster}
      handleToggleDeployHero={handleToggleDeployHero}
      monsters={monsters}
      selectedTargetIndex={selectedTargetIndex}
      setSelectedTargetIndex={setSelectedTargetIndex}
      combatLogs={combatLogs}
      turnCount={turnCount}
      combatPhase={combatPhase}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      currentZoneIndex={currentZoneIndex}
      setCurrentZoneIndex={setCurrentZoneIndex}
      spawnEncounter={spawnEncounter}
      handleExecuteRound={handleExecuteRound}
      equipmentInventory={equipmentInventory}
      setEquipmentInventory={setEquipmentInventory}
      handleRefineEquipment={handleRefineEquipment}
      handleSocketGem={handleSocketGem}
      currentFormation={currentFormation}
      setCurrentFormation={setCurrentFormation}
      towerFloor={towerFloor}
      setTowerFloor={setTowerFloor}
      jsonSaveText={jsonSaveText}
      setJsonSaveText={setJsonSaveText}
      saveLoadStatus={saveLoadStatus}
      handleExportSave={handleExportSave}
      handleImportSave={handleImportSave}
      handleResetSave={handleResetSave}
      victorySummary={victorySummary}
      setVictorySummary={setVictorySummary}
      chatEndRef={chatEndRef}
    />
  );
}
