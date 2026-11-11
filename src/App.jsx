import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, Sword, Sparkles, Heart, Zap, RefreshCw, Award, User, Layers, Plus, X, 
  AlertTriangle, Coffee, Flame, ChevronRight, RotateCcw, Package, Activity, MapPin, 
  TrendingUp, ArrowUpCircle, ShoppingBag, Target, Gift, Crown, Shirt, Gem, CheckCircle2, 
  HelpCircle, Dices, PlusCircle, MinusCircle, BarChart3, Sliders, UserCheck, Star, 
  Hammer, Compass, BookOpen, Trophy, Lock, Unlock, Crosshair, ShieldAlert, Save, 
  Download, Upload, Copy, Check, Trash2, Users 
} from 'lucide-react';

// ==========================================
// 1. 引入拆分出來的 3 個資料模組 (MODULE IMPORTS)
// ==========================================
import { 
  TIER_CONFIG, 
  HERO_CLASS_GROWTH_WEIGHTS, 
  INNATE_SKILLS_DB, 
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

// ==========================================
// 2. 全域五行與陣法機制設定 (GAME MECHANICS)
// ==========================================
const ELEMENTS = {
  '金': { name: '金', icon: '⚔️', counters: '木', color: 'text-yellow-400 bg-yellow-950/80 border-yellow-500', badge: 'bg-yellow-500 text-slate-950', status: '破甲' },
  '木': { name: '木', icon: '🌿', counters: '土', color: 'text-emerald-400 bg-emerald-950/80 border-emerald-500', badge: 'bg-emerald-500 text-slate-950', status: '中毒' },
  '水': { name: '水', icon: '💧', counters: '火', color: 'text-cyan-400 bg-cyan-950/80 border-cyan-500', badge: 'bg-cyan-500 text-slate-950', status: '冰凍' },
  '火': { name: '火', icon: '🔥', counters: '金', color: 'text-red-400 bg-red-950/80 border-red-500', badge: 'bg-red-500 text-slate-950', status: '灼燒' },
  '土': { name: '土', icon: '🪨', counters: '水', color: 'text-amber-500 bg-amber-950/80 border-amber-600', badge: 'bg-amber-600 text-slate-950', status: '眩暈' }
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

// 地圖關卡設定
const ZONES = [
  { id: 'z1', name: '新手竹林 (Lvl.1-4)', lvlReq: 1, monsters: [ { name: '竹林野兔', hp: 80, atk: 16, def: 3, speed: 10, exp: 35, gold: 25 }, { name: '青竹小蛇', hp: 100, atk: 20, def: 5, speed: 12, exp: 45, gold: 30 } ] },
  { id: 'z2', name: '黑山寨 (Lvl.5-9)', lvlReq: 5, monsters: [ { name: '黃巾刀客', hp: 220, atk: 36, def: 9, speed: 12, exp: 90, gold: 70 }, { name: '黑山狼妖', hp: 280, atk: 45, def: 12, speed: 15, exp: 120, gold: 95 } ] },
  { id: 'z3', name: '火雲洞 (Lvl.10-14)', lvlReq: 10, monsters: [ { name: '赤焰火蝠', hp: 550, atk: 68, def: 16, speed: 18, exp: 200, gold: 170 }, { name: '火雲洞主', hp: 980, atk: 92, def: 22, speed: 14, exp: 360, gold: 320 } ] },
  { id: 'z4', name: '蓬萊仙島 (Lvl.15+)', lvlReq: 15, monsters: [ { name: '仙境靈鹿', hp: 1350, atk: 110, def: 30, speed: 20, exp: 500, gold: 420 }, { name: '守護仙童', hp: 1800, atk: 135, def: 38, speed: 18, exp: 650, gold: 550 } ] }
];

const LOCAL_STORAGE_KEY = 'MYSTINA_RPG_SAVE_V2';

// ==========================================
// 3. REACT 主組件 (MAIN APP COMPONENT)
// ==========================================
export default function App() {
  // 創角與遊戲狀態
  const [gameStarted, setGameStarted] = useState(false);
  const [creationData, setCreationData] = useState({
    name: "太古少俠",
    gender: "male",
    job: "猛將",
    element: "金",
    selectedStarterHero: null
  });
  const [starterHeroCandidates, setStarterHeroCandidates] = useState([]);

  // 主角數值
  const [player, setPlayer] = useState({
    name: "太古少俠",
    gender: "male",
    job: "猛將",
    advancement: null,
    element: "金",
    level: 1,
    exp: 0,
    maxExp: 100,
    hp: 260, maxHp: 260,
    mp: 0, maxMp: 0,
    rage: 0, maxRage: 100,
    ammo: 20, maxAmmo: 20,
    incantation: 0, maxIncantation: 5,
    atk: 38, def: 14, speed: 10,
    gold: 600, refineStones: 10,
    statPoints: 5, sp: 2, tp: 2,
    stats: { str: 0, con: 0, int: 0, agi: 0 },
    skillLevels: { 0: 1, 1: 0, 2: 0 },
    talents: { attack: 0, defense: 0, utility: 0 },
    equipped: { weapon: null, offhand: null, helmet: null, armor: null, shoes: null, accessory: null },
    inventory: []
  });

  // 英雄陣容與出戰
  const [heroRoster, setHeroRoster] = useState([]);
  const [activeHeroInstanceIds, setActiveHeroInstanceIds] = useState([]); // 最多 4 位
  const [currentFormation, setCurrentFormation] = useState('none');
  const [equipmentInventory, setEquipmentInventory] = useState(ITEM_DROP_POOL.slice(0, 3));
  const [towerFloor, setTowerFloor] = useState(1);

  // 戰鬥狀態
  const [activeTab, setActiveTab] = useState('combat');
  const [currentZoneIndex, setCurrentZoneIndex] = useState(0);
  const [monsters, setMonsters] = useState([]);
  const [selectedTargetIndex, setSelectedTargetIndex] = useState(0);
  const [combatLogs, setCombatLogs] = useState([]);
  const [turnCount, setTurnCount] = useState(1);
  const [combatPhase, setCombatPhase] = useState('PLAYER_SELECT');
  const [selectedPlayerAction, setSelectedPlayerAction] = useState(null);
  const [victorySummary, setVictorySummary] = useState(null);

  // 存檔/匯入 modal
  const [jsonSaveText, setJsonSaveText] = useState('');
  const [saveLoadStatus, setSaveLoadStatus] = useState('');

  const chatEndRef = useRef(null);

  // 初始化起步英雄與試讀 LocalStorage
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

  // 自動備份進度
  useEffect(() => {
    if (gameStarted) {
      try {
        const saveData = {
          player,
          heroRoster,
          activeHeroInstanceIds,
          currentFormation,
          equipmentInventory,
          towerFloor
        };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(saveData));
      } catch (e) {
        console.warn('自動存檔失敗', e);
      }
    }
  }, [player, heroRoster, activeHeroInstanceIds, currentFormation, equipmentInventory, towerFloor, gameStarted]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [combatLogs]);

  // 目前登場的英雄物件列表
  const activeHeroes = activeHeroInstanceIds
    .map(id => heroRoster.find(h => h.instanceId === id))
    .filter(Boolean);

  // 調用裝備庫 Helper 計算總屬性加成
  const { bonus: equipBonus, setAtkPct, setHpPct, setMpPct, setDefPct } = calculateEquipmentBonus(player.equipped);
  const formBonus = FORMATIONS_CONFIG[currentFormation].bonus || {};

  // 主角最終數值計算
  const statHpBonus = player.stats.con * 16;
  const statMpBonus = player.stats.int * 10;
  const statAtkBonus = (player.stats.str * 3) + (player.stats.int * 2);
  const statDefBonus = player.stats.con * 1;
  const statSpeedBonus = player.stats.agi * 2;

  const playerTotalMaxHp = Math.floor((player.maxHp + statHpBonus + equipBonus.hp) * (1 + setHpPct + (formBonus.hpPct || 0)));
  const playerTotalMaxMp = Math.floor((player.maxMp + statMpBonus + equipBonus.mp) * (1 + setMpPct));
  const playerTotalAtk = Math.floor((player.atk + statAtkBonus + equipBonus.atk + (player.talents.attack * 5)) * (1 + setAtkPct + (formBonus.atkPct || 0)));
  const playerTotalDef = Math.floor((player.def + statDefBonus + equipBonus.def + (player.talents.defense * 3)) * (1 + (setDefPct || 0) + (formBonus.defPct || 0)));
  const playerTotalSpeed = Math.floor(player.speed + statSpeedBonus + equipBonus.speed + (player.talents.utility * 2));

  const addLog = (text, type = 'info') => {
    setCombatLogs(prev => [...prev, { id: Date.now() + Math.random(), turn: turnCount, text, type }]);
  };

  const handleStartGame = () => {
    const jobConfig = JOBS_CONFIG[creationData.job];
    const starterHero = creationData.selectedStarterHero;

    const newPlayer = {
      ...player,
      name: creationData.name || "太古少俠",
      gender: creationData.gender,
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
    setCombatLogs([
      { id: 1, turn: 1, type: 'sys', text: `📜 少俠【${newPlayer.name}】(${newPlayer.element}屬性 ${newPlayer.job}) 攜手夥伴【${starterHero.name}】(${starterHero.element}屬性) 踏入《天外 Online》！` }
    ]);
  };

  // 生成 5~15 隻動態怪物群
  const spawnEncounter = (zoneIdx, customActiveHeroes = null) => {
    const deployed = customActiveHeroes !== null ? customActiveHeroes : activeHeroes;
    const totalCombatants = 1 + deployed.length;
    
    const minM = Math.max(1, totalCombatants * 1);
    const maxM = totalCombatants * 3;
    const count = Math.floor(Math.random() * (maxM - minM + 1)) + minM;

    const zone = ZONES[zoneIdx];
    let list = [];
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    for (let i = 0; i < count; i++) {
      const template = zone.monsters[Math.floor(Math.random() * zone.monsters.length)];
      const randElem = getRandomElement();
      const letter = alphabet[i] || `${i + 1}`;

      list.push({
        id: `m_${Date.now()}_${i}`,
        name: `${template.name} ${letter}`,
        element: randElem,
        maxHp: template.hp, hp: template.hp,
        atk: template.atk, def: template.def, speed: template.speed,
        exp: template.exp, gold: template.gold
      });
    }

    setMonsters(list);
    setSelectedTargetIndex(0);
    setTurnCount(1);
    setCombatPhase('PLAYER_SELECT');
    return list;
  };

  // 英雄登場切換 (含同名英雄限制防呆)
  const handleToggleDeployHero = (hero) => {
    if (activeHeroInstanceIds.includes(hero.instanceId)) {
      setActiveHeroInstanceIds(prev => prev.filter(id => id !== hero.instanceId));
      addLog(`🛡️ 英雄【${hero.name}】退出登場佇列。`, 'sys');
    } else {
      if (activeHeroInstanceIds.length >= 4) {
        addLog(`⚠️ 最多僅能同時派遣 4 位英雄登場！`, 'sys');
        return;
      }
      const isDuplicate = activeHeroes.some(h => h.baseId === hero.baseId);
      if (isDuplicate) {
        addLog(`⚠️ 同名英雄【${hero.name}】不可重複同場登場！`, 'sys');
        return;
      }

      setActiveHeroInstanceIds(prev => [...prev, hero.instanceId]);
      addLog(`⚔️ 英雄【${hero.name}】(${hero.element}屬性) 成功加入登場佇列！`, 'sys');
    }
  };

  // 回合結算
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

    addLog(`--- ⚔️ 第 ${turnCount} 回合戰鬥結算 (全軍陣型) ---`, 'sys');

    if (currentPlayer.job === '猛將') {
      currentPlayer.rage = Math.min(100, currentPlayer.rage + 15);
    }

    // 1. 主僕合擊奧義
    if (isFusionUltimate) {
      addLog(`✨ 觸發【主僕合擊奧義】！全軍爆發五行連鎖神技！`, 'player');
      currentMonsters.forEach(m => {
        if (m.hp > 0) {
          let teamAtk = playerTotalAtk;
          currentHeroes.forEach(h => { teamAtk += h.atk; });
          const em = getElementMultiplier(currentPlayer.element, m.element);
          const dmg = Math.max(40, Math.floor(teamAtk * 2.2 * em) - m.def);
          m.hp = Math.max(0, m.hp - dmg);
          addLog(`💥 【主僕合擊】對【${m.name}】爆發 ${dmg} 點五行巨額打擊！`, 'player');
        }
      });
      if (currentPlayer.job === '猛將') currentPlayer.rage = 0;
      else currentPlayer.mp = Math.max(0, currentPlayer.mp - 40);
    }
    // 2. 主角行動
    else if (selectedPlayerAction && currentMonsters[targetIdx]) {
      const pAct = selectedPlayerAction;
      const targetM = currentMonsters[targetIdx];

      if (pAct.type === 'attack') {
        const elemMult = getElementMultiplier(currentPlayer.element, targetM.element);
        const dmg = Math.max(5, Math.floor((playerTotalAtk - targetM.def) * elemMult));
        targetM.hp = Math.max(0, targetM.hp - dmg);
        addLog(`🗡️ 你發動【${currentPlayer.element}屬性】物理打擊【${targetM.name}】，造成 ${dmg} 點傷害 (${elemMult > 1 ? '相剋1.5x' : '一般'})！`, 'player');
      } else if (pAct.type === 'skill') {
        const sk = pAct.skill;
        const skLvl = currentPlayer.skillLevels[pAct.skillIdx] || 1;
        const mult = getSkillMultiplier(sk, skLvl);

        if (sk.costType === 'rage' && currentPlayer.rage < sk.cost) {
          addLog(`⚠️ 怒氣不足 (${currentPlayer.rage}/${sk.cost})！改為普通打擊。`, 'sys');
        } else if (sk.costType === 'mp' && currentPlayer.mp < sk.cost) {
          addLog(`⚠️ MP 真氣不足！改為普通打擊。`, 'sys');
        } else if (sk.costType === 'ammo' && currentPlayer.ammo < sk.cost) {
          addLog(`⚠️ 彈藥不足！改為普通打擊。`, 'sys');
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
                addLog(`🔥 施展全體【${sk.name} (Lv.${skLvl})】，對【${m.name}】爆發 ${dmg} 點傷害！`, 'player');
              }
            });
          } else if (sk.type === 'heal') {
            const heal = Math.floor(playerTotalAtk * mult);
            currentPlayer.hp = Math.min(playerTotalMaxHp, currentPlayer.hp + heal);
            currentHeroes.forEach(h => { h.hp = Math.min(h.maxHp, h.hp + heal); });
            addLog(`🌿 施展【${sk.name} (Lv.${skLvl})】，全隊少俠與英雄恢復 +${heal} HP！`, 'player');
          } else {
            const em = getElementMultiplier(currentPlayer.element, targetM.element);
            const dmg = Math.max(10, Math.floor(playerTotalAtk * mult * em) - targetM.def);
            targetM.hp = Math.max(0, targetM.hp - dmg);
            addLog(`⚡ 發動【${sk.name} (Lv.${skLvl})】，對【${targetM.name}】爆發 ${dmg} 點傷害！`, 'player');
          }
        }
      }
    }

    // 3. 登場英雄聯動打擊
    currentHeroes.forEach(h => {
      if (h.hp <= 0) return;
      const aliveTargets = currentMonsters.filter(m => m.hp > 0);
      if (aliveTargets.length === 0) return;

      let validTarget = currentMonsters[targetIdx];
      if (!validTarget || validTarget.hp <= 0) validTarget = aliveTargets[Math.floor(Math.random() * aliveTargets.length)];

      h.fatigue = Math.min(100, h.fatigue + 3);

      if (h.innateSkill && Math.random() < 0.60) {
        const em = getElementMultiplier(h.element, validTarget.element);
        const dmg = Math.max(10, Math.floor(h.atk * h.innateSkill.damageMultiplier * em) - validTarget.def);
        validTarget.hp = Math.max(0, validTarget.hp - dmg);
        addLog(`✨ 【${h.name}】(${h.element}屬性) 發動天生絕學【${h.innateSkill.name}】，對【${validTarget.name}】造成 ${dmg} 點重創！`, 'hero');
      } else {
        const em = getElementMultiplier(h.element, validTarget.element);
        const dmg = Math.max(5, Math.floor((h.atk - validTarget.def) * em));
        validTarget.hp = Math.max(0, validTarget.hp - dmg);
        addLog(`💥 英雄【${h.name}】(${h.element}屬性) 出手，對【${validTarget.name}】造成 ${dmg} 點打擊！`, 'hero');
      }
    });

    setHeroRoster(prev => prev.map(rHero => {
      const updated = currentHeroes.find(ch => ch.instanceId === rHero.instanceId);
      return updated || rHero;
    }));

    // 4. 怪物反擊
    const aliveMonsters = currentMonsters.filter(m => m.hp > 0);
    if (aliveMonsters.length > 0) {
      aliveMonsters.forEach(m => {
        const targets = ['PLAYER', ...currentHeroes.filter(h => h.hp > 0).map(h => h.instanceId)];
        const chosenTargetId = targets[Math.floor(Math.random() * targets.length)];

        if (chosenTargetId === 'PLAYER') {
          const em = getElementMultiplier(m.element, currentPlayer.element);
          const dmg = Math.max(3, Math.floor((m.atk - playerTotalDef) * em));
          currentPlayer.hp = Math.max(0, currentPlayer.hp - dmg);
          if (currentPlayer.job === '猛將') currentPlayer.rage = Math.min(100, currentPlayer.rage + 10);
          addLog(`👹 【${m.name}】襲擊少俠，造成 ${dmg} 點傷害！`, 'monster');
        } else {
          const victimHero = currentHeroes.find(h => h.instanceId === chosenTargetId);
          if (victimHero) {
            const em = getElementMultiplier(m.element, victimHero.element);
            const dmg = Math.max(3, Math.floor((m.atk - victimHero.def) * em));
            victimHero.hp = Math.max(0, victimHero.hp - dmg);
            addLog(`👹 【${m.name}】襲擊英雄【${victimHero.name}】，造成 ${dmg} 點傷害！`, 'monster');
          }
        }
      });
    }

    setMonsters(currentMonsters);
    setPlayer(currentPlayer);

    if (currentMonsters.every(m => m.hp <= 0)) {
      addLog(`🎉 敵方 ${currentMonsters.length} 隻怪物全數殲滅！戰鬥大捷！`, 'sys');
      handleBattleVictory(currentPlayer, currentMonsters);
      return;
    }

    setTurnCount(prev => prev + 1);
    setCombatPhase('PLAYER_SELECT');
    setSelectedPlayerAction(null);
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

    let newPlayer = { ...pObj, gold: pObj.gold + totalGold, refineStones: pObj.refineStones + droppedStones, exp: pObj.exp + totalExp };
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
      msgs.push(`🎉 升級至 Level ${newPlayer.level}！獲得 3 點屬性點、1 點 SP 與 1 點 TP！`);
    }

    setPlayer(newPlayer);
    if (droppedEquipments.length > 0) setEquipmentInventory(prev => [...prev, ...droppedEquipments]);

    setVictorySummary({ gold: totalGold, exp: totalExp, stones: droppedStones, droppedHero, msgs });
  };

  const handleRefineEquipment = (item) => {
    const level = item.refineLevel || 0;
    if (level >= 10 || player.gold < (level + 1) * 120 || player.refineStones < 1) return;

    const isSuccess = Math.random() < (level < 4 ? 1.0 : 0.65);
    setPlayer(p => ({ ...p, gold: p.gold - (level + 1) * 120, refineStones: p.refineStones - 1 }));

    const nextLevel = isSuccess ? level + 1 : Math.max(0, level - 1);
    const updated = { ...item, refineLevel: nextLevel };

    setEquipmentInventory(prev => prev.map(i => i.uid === item.uid ? updated : i));
    if (player.equipped[item.type]?.uid === item.uid) {
      setPlayer(p => ({ ...p, equipped: { ...p.equipped, [item.type]: updated } }));
    }
    addLog(isSuccess ? `✨ 【${item.name}】精鍊成功升級至 +${nextLevel}！` : `💔 【${item.name}】精鍊失敗等級倒退！`, 'sys');
  };

  const handleSocketGem = (item, gem, socketIdx) => {
    let newSockets = [...(item.sockets || [null])];
    newSockets[socketIdx] = gem;
    const updated = { ...item, sockets: newSockets };

    setEquipmentInventory(prev => prev.map(i => i.uid === item.uid ? updated : i));
    if (player.equipped[item.type]?.uid === item.uid) {
      setPlayer(p => ({ ...p, equipped: { ...p.equipped, [item.type]: updated } }));
    }
    addLog(`💎 成功在【${item.name}】鑲嵌【${gem.name}】！`, 'sys');
  };

  const handleExportSave = () => {
    const saveData = {
      player,
      heroRoster,
      activeHeroInstanceIds,
      currentFormation,
      equipmentInventory,
      towerFloor
    };
    const jsonStr = JSON.stringify(saveData, null, 2);
    setJsonSaveText(jsonStr);
    setSaveLoadStatus('存檔 JSON 匯出成功！請複製文字備份。');
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
        setSaveLoadStatus('✅ 成功匯入遊戲進度紀錄！');
      } else {
        setSaveLoadStatus('❌ 無效的存檔 JSON 格式！');
      }
    } catch (e) {
      setSaveLoadStatus('❌ 解析 JSON 失敗，請檢查剪貼簿內容。');
    }
  };

  const handleResetSave = () => {
    if (window.confirm("確定要重置所有遊戲紀錄嗎？這無法復原！")) {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      window.location.reload();
    }
  };

  const classSkills = PROTAGONIST_SKILLS_DB[player.job] || [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-amber-500 selection:text-slate-950">
      
      {/* 1. 創角 modal */}
      {!gameStarted ? (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-amber-950 flex items-center justify-center p-4">
          <div className="max-w-4xl w-full bg-slate-900/95 border-2 border-amber-500/50 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 backdrop-blur-md">
            <div className="text-center border-b border-slate-800 pb-4">
              <h1 className="text-3xl font-black text-amber-400 tracking-wider">《天外 Online》文字 RPG</h1>
              <p className="text-xs text-slate-400 mt-1">4英雄同場陣列 + 5-15動態怪物遭遇 + 五行自選相剋系統</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                  <User className="w-4 h-4" /> 1. 少俠創建與五行自選
                </h3>
                
                <div>
                  <label className="text-xs text-slate-400 block mb-1">少俠姓名：</label>
                  <input
                    type="text"
                    value={creationData.name}
                    onChange={(e) => setCreationData({ ...creationData, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-amber-300 outline-none focus:border-amber-400 font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">選擇自訂本命五行：</label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {ELEMENT_KEYS.map(eKey => {
                      const elem = ELEMENTS[eKey];
                      const isSelected = creationData.element === eKey;
                      return (
                        <button
                          key={eKey}
                          onClick={() => setCreationData({ ...creationData, element: eKey })}
                          className={`p-2 rounded-lg border text-center font-bold text-xs transition-all ${
                            isSelected ? `${elem.color} ring-2 ring-amber-400 shadow-md` : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <div>{elem.icon} {elem.name}</div>
                          <div className="text-[9px] mt-0.5 opacity-80">剋{elem.counters}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 block">選擇職業：</label>
                  {Object.keys(JOBS_CONFIG).map(jKey => {
                    const job = JOBS_CONFIG[jKey];
                    return (
                      <div
                        key={jKey}
                        onClick={() => setCreationData({ ...creationData, job: jKey })}
                        className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                          creationData.job === jKey ? 'bg-amber-950/70 border-amber-400 text-amber-300 shadow-lg' : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="font-bold text-xs flex justify-between">
                          <span>{job.icon} {job.title}</span>
                          <span className="text-amber-400 font-mono">[{creationData.element}本命]</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">{job.desc}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                  <Layers className="w-4 h-4" /> 2. 選擇隨機五行夥伴 (3選1)
                </h3>
                {starterHeroCandidates.map(hero => (
                  <div
                    key={hero.instanceId}
                    onClick={() => setCreationData({ ...creationData, selectedStarterHero: hero })}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      creationData.selectedStarterHero?.instanceId === hero.instanceId ? 'bg-amber-950 border-amber-400' : 'bg-slate-950 border-slate-800'
                    }`}
                  >
                    <div className="font-bold text-sm text-amber-300 flex items-center justify-between">
                      <span>{hero.icon} {hero.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded font-mono font-bold ${ELEMENTS[hero.element]?.badge}`}>
                        {ELEMENTS[hero.element]?.icon} {hero.element}屬性
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1">{hero.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleStartGame}
              className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-base shadow-xl transition-all"
            >
              🚀 進入《天外 Online》世界 (開啟存檔護航)
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Top Bar */}
          <header className="border-b border-amber-900/40 bg-slate-900/90 px-4 py-3 sticky top-0 z-20 backdrop-blur-md">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-black flex items-center justify-center text-lg shadow-md">
                  天
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-amber-400 text-base">{player.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded font-mono font-bold ${ELEMENTS[player.element]?.badge}`}>
                      {ELEMENTS[player.element]?.icon} {player.element}屬性 {player.advancement || player.job}
                    </span>
                    <span className="text-xs bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full font-bold font-mono">
                      Lvl.{player.level}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex gap-2 font-mono mt-0.5">
                    <span>HP: {player.hp}/{playerTotalMaxHp}</span>
                    <span>|</span>
                    {player.job === '猛將' ? (
                      <span className="text-red-400 font-bold">怒氣: {player.rage}/100</span>
                    ) : player.job === '巧匠' ? (
                      <span className="text-amber-400 font-bold">彈藥: {player.ammo}/{player.maxAmmo}</span>
                    ) : (
                      <span>MP: {player.mp}/{playerTotalMaxMp}</span>
                    )}
                    <span>|</span>
                    <span className="text-amber-400 font-bold">💰 {player.gold}</span>
                    <span>|</span>
                    <span className="text-cyan-400 font-bold">💎 {player.refineStones}</span>
                  </div>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-2">
                <div className="text-right">
                  <div className="text-xs font-bold text-amber-300">出戰隊伍 ({activeHeroes.length}/4 位英雄)</div>
                  <div className="text-[10px] text-slate-400">戰力規模: {1 + activeHeroes.length} 位角色</div>
                </div>
                <div className="flex -space-x-2">
                  {activeHeroes.map(h => (
                    <div key={h.instanceId} className="w-8 h-8 rounded-full bg-slate-950 border border-amber-400 flex items-center justify-center text-sm shadow">
                      {h.icon}
                    </div>
                  ))}
                  {Array.from({ length: 4 - activeHeroes.length }).map((_, i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-slate-950/60 border border-slate-800 flex items-center justify-center text-xs text-slate-600">
                      +
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </header>

          {/* Navigation Bar */}
          <nav className="bg-slate-900 border-b border-slate-800 px-4">
            <div className="max-w-7xl mx-auto flex space-x-1 overflow-x-auto py-1">
              {[
                { id: 'combat', label: '戰鬥與遭遇', icon: Sword },
                { id: 'character', label: '角色與屬性', icon: User },
                { id: 'skills', label: '技能樹', icon: Sparkles },
                { id: 'equip', label: '6裝備與背包', icon: Shirt },
                { id: 'forge', label: '鐵匠精鍊', icon: Hammer },
                { id: 'formations', label: '陣法與五行', icon: Shield },
                { id: 'heroes', label: `4英雄登場 (${activeHeroes.length}/4)`, icon: Users },
                { id: 'tower', label: '鎮魔塔', icon: Compass },
                { id: 'codex', label: '圖鑑與成就', icon: BookOpen },
                { id: 'saveload', label: '存檔/載入', icon: Save }
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
                      activeTab === tab.id ? 'bg-amber-500 text-slate-950 shadow-md font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" /> {tab.label}
                  </button>
                );
              })}
            </div>
          </nav>

          {/* 主內容面板 */}
          <main className="flex-1 p-4 max-w-7xl mx-auto w-full">
            {activeTab === 'combat' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 space-y-4">
                  <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl flex justify-between items-center overflow-x-auto">
                    <div className="flex gap-2">
                      {ZONES.map((zone, zIdx) => (
                        <button
                          key={zone.id}
                          onClick={() => { setCurrentZoneIndex(zIdx); spawnEncounter(zIdx); }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                            currentZoneIndex === zIdx ? 'bg-amber-500 text-slate-950' : 'bg-slate-950 text-slate-400 border border-slate-800'
                          }`}
                        >
                          🗺️ {zone.name}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => spawnEncounter(currentZoneIndex)}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-slate-100 font-bold text-xs rounded-xl shadow flex items-center gap-1 whitespace-nowrap"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> 重新遭遇怪群
                    </button>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl">
                    <div className="text-xs font-bold text-amber-300 mb-2 flex justify-between">
                      <span>🛡️ 少俠與 4 位登場英雄陣列 ({1 + activeHeroes.length} 戰力單位)</span>
                      <span className="text-slate-400 font-mono">怪群規模: 5 ~ 15 隻</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      <div className="bg-slate-950 p-2 rounded-xl border border-amber-500/50">
                        <div className="font-bold text-xs text-amber-300 flex justify-between">
                          <span>👤 少俠</span>
                          <span className="text-[10px] font-mono">{player.element}</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                          <div className="bg-emerald-500 h-full" style={{ width: `${(player.hp / playerTotalMaxHp) * 100}%` }} />
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 mt-1">HP: {player.hp}</div>
                      </div>

                      {activeHeroes.map(h => (
                        <div key={h.instanceId} className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                          <div className="font-bold text-xs text-amber-300 flex justify-between">
                            <span className="truncate">{h.icon} {h.name}</span>
                            <span className="text-[10px] font-mono">{h.element}</span>
                          </div>
                          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                            <div className="bg-emerald-500 h-full" style={{ width: `${(h.hp / h.maxHp) * 100}%` }} />
                          </div>
                          <div className="text-[10px] font-mono text-slate-400 mt-1 flex justify-between">
                            <span>HP:{h.hp}</span>
                            <span className="text-amber-400">疲:{h.fatigue}%</span>
                          </div>
                        </div>
                      ))}

                      {Array.from({ length: 4 - activeHeroes.length }).map((_, idx) => (
                        <div key={idx} className="bg-slate-950/40 p-2 rounded-xl border border-dashed border-slate-800 flex items-center justify-center text-[10px] text-slate-600">
                          空英雄位
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl border-2 border-amber-900/40 bg-slate-900 space-y-4 shadow-xl">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                        <Crosshair className="w-4 h-4 text-red-400" /> 敵方陣營 ({monsters.filter(m => m.hp > 0).length} / {monsters.length} 隻怪物存活)
                      </span>
                      <span className="text-xs font-mono text-amber-400 font-bold">第 {turnCount} 回合</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 max-h-[280px] overflow-y-auto p-1">
                      {monsters.map((m, idx) => {
                        const isDead = m.hp <= 0;
                        const isSelected = selectedTargetIndex === idx && !isDead;
                        const elemInfo = ELEMENTS[m.element];

                        return (
                          <div
                            key={m.id}
                            onClick={() => !isDead && setSelectedTargetIndex(idx)}
                            className={`p-2 rounded-xl border cursor-pointer transition-all ${
                              isDead ? 'opacity-30 bg-slate-950 border-slate-800' : isSelected ? 'bg-red-950 border-red-500 ring-2 ring-red-500 shadow-lg' : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <div className="font-bold text-[11px] text-red-300 flex justify-between items-center">
                              <span className="truncate">{m.name}</span>
                              <span className={`text-[9px] px-1 rounded font-mono font-bold ${elemInfo?.badge}`}>
                                {m.element}
                              </span>
                            </div>
                            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                              <div className="bg-red-500 h-full transition-all" style={{ width: `${(m.hp / m.maxHp) * 100}%` }} />
                            </div>
                            <div className="text-[9px] font-mono text-slate-400 mt-1 flex justify-between">
                              <span>HP: {m.hp}</span>
                              <span>ATK:{m.atk}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="bg-gradient-to-r from-amber-950 via-red-950 to-amber-950 p-3 rounded-xl border border-amber-500/50 flex justify-between items-center">
                      <div>
                        <div className="font-black text-xs text-amber-300">✨ 【主僕合擊奧義】全軍蓄力完成！</div>
                        <div className="text-[10px] text-amber-200/80">少俠與 {activeHeroes.length} 位登場英雄集體發動五行連鎖絕爆！</div>
                      </div>
                      <button
                        onClick={() => handleExecuteRound(true)}
                        className="px-4 py-2 bg-gradient-to-r from-amber-500 to-red-500 text-slate-950 font-black text-xs rounded-lg shadow-lg hover:brightness-110"
                      >
                        ⚡ 全軍合擊
                      </button>
                    </div>

                    {combatPhase === 'PLAYER_SELECT' && (
                      <div className="space-y-2">
                        <div className="text-xs text-slate-400 font-bold">選擇少俠行動 (選擇後全隊自動同時聯動回合)：</div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <button
                            onClick={() => { setSelectedPlayerAction({ type: 'attack' }); handleExecuteRound(); }}
                            className="p-3 bg-slate-950 border border-slate-700 hover:border-amber-400 rounded-xl text-left"
                          >
                            <div className="font-bold text-xs text-amber-300">🗡️ 普通打擊</div>
                            <div className="text-[10px] text-slate-400">【{player.element}屬性】單體打擊</div>
                          </button>

                          {classSkills.map((sk, sIdx) => {
                            const skLvl = player.skillLevels[sIdx] || 1;
                            return (
                              <button
                                key={sk.id}
                                onClick={() => { setSelectedPlayerAction({ type: 'skill', skill: sk, skillIdx: sIdx }); handleExecuteRound(); }}
                                className="p-3 bg-amber-950/40 border border-amber-500/40 hover:border-amber-400 rounded-xl text-left"
                              >
                                <div className="font-bold text-xs text-amber-300">⚡ {sk.name} (Lv.{skLvl})</div>
                                <div className="text-[10px] text-slate-400">{sk.desc}</div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 h-[500px] flex flex-col shadow-lg">
                  <div className="font-bold text-xs text-amber-400 mb-2 border-b border-slate-800 pb-2 flex justify-between items-center">
                    <span>📜 戰鬥與探索日誌</span>
                    <span className="text-[10px] text-slate-500">五行相剋1.5x生效中</span>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-1.5 text-xs font-mono">
                    {combatLogs.map(log => (
                      <div key={log.id} className="p-1.5 rounded bg-slate-950/80 text-slate-300 border border-slate-800/40">
                        {log.text}
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'character' && (
              <div className="max-w-5xl mx-auto space-y-6">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <h2 className="text-lg font-bold text-amber-400">👤 角色能力值與屬性配點</h2>
                    <span className="text-xs bg-amber-500/20 border border-amber-500/40 text-amber-300 px-3 py-1 rounded-full font-bold font-mono">
                      可用屬性點: {player.statPoints} Pts
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { key: 'str', label: '力量 (STR)', desc: '+3 物攻/點', val: player.stats.str },
                      { key: 'con', label: '體質 (CON)', desc: '+16 HP, +1 護甲/點', val: player.stats.con },
                      { key: 'int', label: '智慧 (INT)', desc: '+10 MP, +2 法攻/點', val: player.stats.int },
                      { key: 'agi', label: '敏捷 (AGI)', desc: '+2 速度/點', val: player.stats.agi }
                    ].map(st => (
                      <div key={st.key} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                        <div className="font-bold text-xs text-amber-300">{st.label}</div>
                        <div className="text-[10px] text-slate-400">{st.desc}</div>
                        <div className="flex justify-between items-center pt-2 font-mono">
                          <span className="text-lg font-bold text-slate-100">{st.val}</span>
                          <button
                            onClick={() => {
                              if (player.statPoints > 0) {
                                setPlayer(p => ({
                                  ...p,
                                  statPoints: p.statPoints - 1,
                                  stats: { ...p.stats, [st.key]: p.stats[st.key] + 1 }
                                }));
                              }
                            }}
                            disabled={player.statPoints <= 0}
                            className="w-7 h-7 bg-amber-500 text-slate-950 font-bold rounded-lg flex items-center justify-center disabled:opacity-40"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-900 border border-amber-500/40 rounded-2xl p-6 shadow-lg space-y-4">
                  <h2 className="text-lg font-bold text-amber-400">👑 二轉高階職業專精</h2>
                  {player.level < 15 ? (
                    <div className="text-xs text-slate-400 bg-slate-950 p-4 rounded-xl border border-slate-800">
                      🔒 需要達到 Level 15 解鎖二轉高階專精！(目前等級: Lv.{player.level})
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {JOBS_CONFIG[player.job].advancements.map(adv => (
                        <div key={adv.id} className="bg-slate-950 p-4 rounded-xl border border-amber-500/40 space-y-2">
                          <div className="font-bold text-base text-amber-300">{adv.name}</div>
                          <p className="text-xs text-slate-400">{adv.desc}</p>
                          <button
                            onClick={() => {
                              setPlayer(p => ({ ...p, advancement: adv.name }));
                              addLog(`🌟 成功晉升二轉職業【${adv.name}】！`, 'sys');
                            }}
                            disabled={player.advancement === adv.name}
                            className="w-full py-2 bg-amber-500 text-slate-950 font-bold text-xs rounded-lg disabled:opacity-40"
                          >
                            {player.advancement === adv.name ? '已選擇此專精' : '晉升此二轉職業'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'skills' && (
              <div className="max-w-4xl mx-auto space-y-6">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <h2 className="text-lg font-bold text-amber-400">✨ 專屬職業技能樹 ({player.job})</h2>
                    <span className="text-xs bg-amber-500/20 text-amber-300 font-bold px-3 py-1 rounded-full font-mono">
                      可用技能點 (SP): {player.sp} Pts
                    </span>
                  </div>

                  <div className="space-y-3">
                    {classSkills.map((sk, idx) => {
                      const lvl = player.skillLevels[idx] || 1;
                      return (
                        <div key={sk.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-between items-center">
                          <div>
                            <div className="font-bold text-sm text-amber-300">{sk.name} (Lv.{lvl}/5)</div>
                            <div className="text-xs text-slate-400 mt-1">{sk.desc}</div>
                          </div>
                          <button
                            onClick={() => {
                              if (player.sp > 0 && lvl < 5) {
                                setPlayer(p => ({
                                  ...p,
                                  sp: p.sp - 1,
                                  skillLevels: { ...p.skillLevels, [idx]: lvl + 1 }
                                }));
                              }
                            }}
                            disabled={player.sp <= 0 || lvl >= 5}
                            className="px-4 py-2 bg-amber-500 text-slate-950 font-bold text-xs rounded-lg disabled:opacity-40"
                          >
                            {lvl >= 5 ? '已滿級' : '技能升級'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'equip' && (
              <div className="max-w-5xl mx-auto space-y-6">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
                  <h2 className="text-lg font-bold text-amber-400 mb-4">🛡️ 6大裝備部位</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {EQUIP_SLOTS.map(slot => {
                      const item = player.equipped[slot.key];
                      return (
                        <div key={slot.key} className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                          <div className="text-xs text-slate-400 font-bold">{slot.icon} {slot.label}</div>
                          {item ? (
                            <div className="mt-1 font-bold text-xs text-amber-300">{item.name} (+{item.refineLevel || 0})</div>
                          ) : (
                            <div className="text-xs text-slate-600 italic mt-1">未裝備</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
                  <h3 className="font-bold text-sm text-amber-400 mb-3">📦 裝備背包</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {equipmentInventory.map(item => (
                      <div key={item.uid} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center">
                        <div>
                          <div className="font-bold text-xs text-amber-300">{item.name} (+{item.refineLevel || 0})</div>
                          <div className="text-[10px] text-slate-400">{item.desc}</div>
                        </div>
                        <button
                          onClick={() => setPlayer(p => ({ ...p, equipped: { ...p.equipped, [item.type]: item } }))}
                          className="px-3 py-1 bg-amber-500 text-slate-950 font-bold text-xs rounded-lg"
                        >
                          裝備
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'forge' && (
              <div className="max-w-5xl mx-auto space-y-6">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
                  <h2 className="text-lg font-bold text-amber-400">🔨 鐵匠精鍊與寶石鑲嵌</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {equipmentInventory.map(item => (
                      <div key={item.uid} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                        <div className="font-bold text-sm text-amber-300">{item.name} (+{item.refineLevel || 0})</div>
                        <button
                          onClick={() => handleRefineEquipment(item)}
                          className="w-full py-2 bg-amber-600 text-slate-950 font-bold text-xs rounded-lg shadow"
                        >
                          精鍊裝備 (+1)
                        </button>

                        <div className="space-y-1">
                          <div className="text-xs text-slate-400">寶石插槽：</div>
                          {(item.sockets || []).map((gem, gIdx) => (
                            <div key={gIdx} className="flex justify-between items-center bg-slate-900 p-2 rounded text-xs">
                              <span className="text-amber-300 font-mono">{gem ? gem.name : '空插槽'}</span>
                              {!gem && (
                                <button
                                  onClick={() => handleSocketGem(item, GEMS_DB[0], gIdx)}
                                  className="px-2 py-0.5 bg-blue-600 text-slate-100 text-[10px] rounded"
                                >
                                  鑲嵌紅寶石
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'formations' && (
              <div className="max-w-5xl mx-auto space-y-6">
                <div className="bg-slate-900 border border-amber-500/40 rounded-2xl p-6 shadow-lg space-y-4">
                  <h2 className="text-lg font-bold text-amber-400">☯️ 五行相剋與傷害加成規則</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                    {ELEMENT_KEYS.map(eKey => {
                      const elem = ELEMENTS[eKey];
                      return (
                        <div key={eKey} className={`p-3 rounded-xl border ${elem.color}`}>
                          <div className="font-bold text-sm">{elem.icon} {elem.name}屬性</div>
                          <div className="text-xs mt-1 font-mono">相剋: {elem.counters}屬性</div>
                          <div className="text-[10px] opacity-80 mt-1">對【{elem.counters}】爆發 1.5x 傷害</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
                  <h2 className="text-lg font-bold text-amber-400">🛡️ 天外戰術陣法設定</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.keys(FORMATIONS_CONFIG).map(fKey => {
                      const form = FORMATIONS_CONFIG[fKey];
                      return (
                        <div
                          key={fKey}
                          onClick={() => setCurrentFormation(fKey)}
                          className={`p-4 rounded-xl border cursor-pointer transition-all ${
                            currentFormation === fKey ? 'bg-amber-950 border-amber-400' : 'bg-slate-950 border-slate-800'
                          }`}
                        >
                          <div className="font-bold text-sm text-amber-300">{form.icon} {form.name}</div>
                          <div className="text-xs text-slate-400 mt-1">{form.desc}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'heroes' && (
              <div className="max-w-5xl mx-auto space-y-6">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <div>
                      <h2 className="text-lg font-bold text-amber-400">Users 英雄陣容庫 (可選擇最多 4 位同時登場)</h2>
                      <p className="text-xs text-slate-400">限制：同名英雄卡片不可重複同場登場！</p>
                    </div>
                    <button
                      onClick={() => {
                        setHeroRoster(prev => prev.map(h => ({ ...h, fatigue: 0 })));
                        addLog('☕ 在客棧休息，全隊英雄疲勞度歸零回復！', 'sys');
                      }}
                      className="px-4 py-2 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow flex items-center gap-1"
                    >
                      <Coffee className="w-4 h-4" /> 客棧休息 (疲勞歸零)
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {heroRoster.map(hero => {
                      const isDeployed = activeHeroInstanceIds.includes(hero.instanceId);
                      const elemInfo = ELEMENTS[hero.element];

                      return (
                        <div key={hero.instanceId} className={`p-4 rounded-xl border space-y-2 transition-all ${isDeployed ? 'bg-amber-950/60 border-amber-400 shadow-lg' : 'bg-slate-950 border-slate-800'}`}>
                          <div className="font-bold text-sm text-amber-300 flex justify-between items-center">
                            <span>{hero.icon} {hero.name}</span>
                            <span className={`text-xs px-2 py-0.5 rounded font-mono font-bold ${elemInfo?.badge}`}>
                              {elemInfo?.icon} {hero.element}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400">{hero.title} (Tier {hero.tier})</div>
                          <div className="text-xs font-mono text-slate-400 flex justify-between">
                            <span>ATK: {hero.atk}</span>
                            <span className="text-amber-400">疲勞: {hero.fatigue}%</span>
                          </div>
                          <button
                            onClick={() => handleToggleDeployHero(hero)}
                            className={`w-full py-2 font-bold text-xs rounded-lg transition-all ${
                              isDeployed ? 'bg-red-600 text-slate-100' : 'bg-amber-500 text-slate-950'
                            }`}
                          >
                            {isDeployed ? '解除登場' : '派遣登場 (上限4位)'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'tower' && (
              <div className="max-w-4xl mx-auto space-y-6">
                <div className="bg-slate-900 border border-amber-500/40 rounded-2xl p-6 shadow-lg space-y-4 text-center">
                  <h2 className="text-xl font-black text-amber-400">🗼 鎮魔塔挑戰 (目前: 第 {towerFloor} 層)</h2>
                  <p className="text-xs text-slate-400">挑戰高難度守護獸，獲得高階神話英雄與稀有裝備！</p>
                  <button
                    onClick={() => {
                      setTowerFloor(prev => prev + 1);
                      spawnEncounter(3);
                      setActiveTab('combat');
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-amber-500 to-red-500 text-slate-950 font-black text-sm rounded-xl shadow-lg"
                  >
                    ⚔️ 進入鎮魔塔戰鬥
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'codex' && (
              <div className="max-w-5xl mx-auto space-y-6">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
                  <h2 className="text-lg font-bold text-amber-400">📖 天外英雄大圖鑑</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {HERO_TEMPLATES.map(tmp => {
                      const unlocked = heroRoster.some(h => h.baseId === tmp.id_base);
                      return (
                        <div key={tmp.id_base} className={`p-3 rounded-xl border ${unlocked ? 'bg-slate-950 border-amber-400' : 'bg-slate-950 opacity-40 border-slate-800'}`}>
                          <div className="font-bold text-xs text-amber-300">{tmp.icon} {unlocked ? tmp.name : '???'}</div>
                          <div className="text-[10px] text-slate-400">Tier {tmp.tier}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'saveload' && (
              <div className="max-w-4xl mx-auto space-y-6">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
                  <h2 className="text-lg font-bold text-amber-400 flex items-center gap-2">
                    <Save className="w-5 h-5" /> 遊戲紀錄與備份 (LocalStorage & JSON 匯入匯出)
                  </h2>
                  <p className="text-xs text-slate-400">
                    系統會在戰鬥與升級時自動儲存進度至瀏覽器。你可以將存檔匯出成 JSON 文字複製備份，隨時貼上恢復進度！
                  </p>

                  {saveLoadStatus && (
                    <div className="p-3 bg-amber-950/60 border border-amber-500/40 rounded-xl text-xs text-amber-300 font-mono">
                      {saveLoadStatus}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <button
                      onClick={handleExportSave}
                      className="py-3 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" /> 產生/匯出存檔 JSON 文字
                    </button>
                    <button
                      onClick={handleImportSave}
                      className="py-3 bg-blue-600 text-slate-100 font-bold text-xs rounded-xl shadow flex items-center justify-center gap-2"
                    >
                      <Upload className="w-4 h-4" /> 讀取/匯入下方 JSON 存檔
                    </button>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 block mb-1">存檔 JSON 文字內容：</label>
                    <textarea
                      rows={8}
                      value={jsonSaveText}
                      onChange={(e) => setJsonSaveText(e.target.value)}
                      placeholder="在此貼上您備份的 JSON 存檔文字..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-amber-300 outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="border-t border-slate-800 pt-4 flex justify-between items-center">
                    <span className="text-xs text-red-400 font-bold">危險區域：</span>
                    <button
                      onClick={handleResetSave}
                      className="px-4 py-2 bg-red-950 border border-red-600 text-red-400 font-bold text-xs rounded-xl hover:bg-red-900"
                    >
                      🗑️ 清除 LocalStorage 重置遊戲
                    </button>
                  </div>
                </div>
              </div>
            )}
          </main>
        </>
      )}

      {/* 勝利結算 Modal */}
      {victorySummary && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border-2 border-amber-500 rounded-2xl p-6 space-y-4 shadow-2xl">
            <h3 className="text-xl font-black text-amber-400 text-center">🏆 戰鬥大捷！</h3>
            <div className="bg-slate-950 p-3 rounded-xl text-xs font-mono space-y-1 border border-slate-800">
              <div>金幣獲得: +{victorySummary.gold} 💰</div>
              <div>經驗值獲得: +{victorySummary.exp} EXP</div>
              <div>精鍊石獲得: +{victorySummary.stones} 💎</div>
              {victorySummary.droppedHero && (
                <div className="text-amber-300 font-bold mt-2 flex items-center gap-1">
                  ✨ 獲得英雄卡片：【{victorySummary.droppedHero.name}】({victorySummary.droppedHero.element}屬性)！
                </div>
              )}
            </div>
            {victorySummary.msgs.map((m, i) => (
              <div key={i} className="text-xs text-amber-300 font-bold">{m}</div>
            ))}
            <button
              onClick={() => setVictorySummary(null)}
              className="w-full py-3 bg-amber-500 text-slate-950 font-black rounded-xl text-sm hover:bg-amber-400 transition-all"
            >
              繼續冒險
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
