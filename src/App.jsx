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

// ==========================================
// 1. 英雄技能卡資料庫 (含職業限制與分類)
// ==========================================
export const SKILL_CARDS_DB = [
  // 主動技能卡 (Active)
  { 
    id: 'sc_a1', 
    name: '烈焰斬', 
    type: 'active', 
    category: 'physical', 
    allowedJobs: ['猛將', '巧匠'], 
    target: 'single', 
    mult: 2.2, 
    desc: '【物理】發動火焰重擊單體敵人，造成 2.2x 物理傷害。', 
    icon: '🔥' 
  },
  { 
    id: 'sc_a2', 
    name: '萬箭齊發', 
    type: 'active', 
    category: 'physical', 
    allowedJobs: ['巧匠', '猛將'], 
    target: 'aoe', 
    mult: 1.5, 
    desc: '【物理】散射箭雨橫掃全場，造成 1.5x 廣域物理打擊。', 
    icon: '🏹' 
  },
  { 
    id: 'sc_a3', 
    name: '九天雷劫', 
    type: 'active', 
    category: 'magic', 
    allowedJobs: ['術士', '風水師'], 
    target: 'single', 
    mult: 3.0, 
    desc: '【法術】引九天雷霆轟擊單體，爆發 3.0x 雷霆法傷。', 
    icon: '⚡' 
  },
  { 
    id: 'sc_a4', 
    name: '奇門遁甲', 
    type: 'active', 
    category: 'magic', 
    allowedJobs: ['術士', '風水師'], 
    target: 'aoe', 
    mult: 2.0, 
    desc: '【法術】召喚遁甲大陣，造成全場 2.0x 五行法傷。', 
    icon: '☯️' 
  },
  { 
    id: 'sc_a5', 
    name: '神農妙手', 
    type: 'active', 
    category: 'heal', 
    allowedJobs: ['藥師', '風水師'], 
    target: 'heal', 
    mult: 1.8, 
    desc: '【治療】施展回春妙術，為少俠與全隊恢復 1.8x 生命值。', 
    icon: '🌿' 
  },
  { 
    id: 'sc_a6', 
    name: '天羅地網', 
    type: 'active', 
    category: 'trap', 
    allowedJobs: ['巧匠', '風水師'], 
    target: 'aoe', 
    mult: 1.6, 
    desc: '【陷阱】佈下機關毒網，對全體敵怪造成 1.6x 穿刺傷。', 
    icon: '🕸️' 
  },

  // 被動技能卡 (Passive)
  { 
    id: 'sc_p1', 
    name: '鋼筋鐵骨', 
    type: 'passive', 
    category: 'universal', 
    allowedJobs: ['猛將', '巧匠', '術士', '藥師', '風水師'], 
    bonus: { defPct: 0.15, hpPct: 0.10 }, 
    desc: '【通用】常駐護甲 +15%、生命上限 +10%。', 
    icon: '🛡️' 
  },
  { 
    id: 'sc_p2', 
    name: '怒火中燒', 
    type: 'passive', 
    category: 'physical', 
    allowedJobs: ['猛將', '巧匠'], 
    bonus: { atkPct: 0.18 }, 
    desc: '【物理】戰意沸騰，常駐攻擊力 +18%。', 
    icon: '⚔️' 
  },
  { 
    id: 'sc_p3', 
    name: '五行貫通', 
    type: 'passive', 
    category: 'magic', 
    allowedJobs: ['術士', '藥師', '風水師'], 
    bonus: { atkPct: 0.15, elemDmgPct: 0.20 }, 
    desc: '【法術】常駐攻擊力 +15%，五行相剋傷害額外 +20%。', 
    icon: '🔮' 
  },
  { 
    id: 'sc_p4', 
    name: '神行百變', 
    type: 'passive', 
    category: 'universal', 
    allowedJobs: ['猛將', '巧匠', '術士', '藥師', '風水師'], 
    bonus: { speedPct: 0.20 }, 
    desc: '【通用】身輕如燕，常駐速度 +20%。', 
    icon: '💨' 
  }
];

// 生成帶有獨立 UID 的技能卡實體（確保單卡獨佔）
export function createSkillCardInstance(template) {
  return {
    ...template,
    uid: `sc_${template.id}_${Date.now()}_${Math.floor(Math.random() * 100000)}`
  };
}

// ==========================================
// 2. Tier 階梯式主動技能觸發機率
// ==========================================
export const TIER_SKILL_CHANCE = {
  1: 0.15, // Tier 1: 15%
  2: 0.25, // Tier 2: 25%
  3: 0.35, // Tier 3: 35%
  4: 0.50, // Tier 4: 50%
  5: 0.70  // Tier 5: 70%
};

// 計算英雄含被動技能卡加成後的實際戰鬥屬性
export function calculateHeroEffectiveStats(hero) {
  const passives = hero.passiveSkillSlots || [];
  let atkPct = 0;
  let defPct = 0;
  let hpPct = 0;
  let speedPct = 0;
  let elemDmgPct = 0;

  passives.forEach(card => {
    if (card && card.bonus) {
      atkPct += card.bonus.atkPct || 0;
      defPct += card.bonus.defPct || 0;
      hpPct += card.bonus.hpPct || 0;
      speedPct += card.bonus.speedPct || 0;
      elemDmgPct += card.bonus.elemDmgPct || 0;
    }
  });

  const baseMaxHp = hero.maxHp || 150;
  const baseAtk = hero.atk || 20;
  const baseDef = hero.def || 8;
  const baseSpeed = hero.speed || 10;

  return {
    effectiveMaxHp: Math.floor(baseMaxHp * (1 + hpPct)),
    effectiveAtk: Math.floor(baseAtk * (1 + atkPct)),
    effectiveDef: Math.floor(baseDef * (1 + defPct)),
    effectiveSpeed: Math.floor(baseSpeed * (1 + speedPct)),
    elemDmgPct,
    skillChance: TIER_SKILL_CHANCE[hero.tier] || 0.15
  };
}

// 規範化英雄物件（相容舊存檔並補齊預設欄位）
function normalizeHero(h) {
  return {
    ...h,
    def: h.def ?? (5 + ((h.tier || 1) * 4) + ((h.stats?.con || 2) * 1)),
    speed: h.speed ?? (10 + ((h.tier || 1) * 2) + ((h.stats?.agi || 2) * 2)),
    maxExp: h.maxExp || 100,
    rage: h.rage ?? 0,
    ammo: h.ammo ?? 6,
    maxAmmo: h.maxAmmo ?? 6,
    mp: h.mp ?? 50,
    maxMp: h.maxMp ?? 100,
    activeSkillSlots: Array.isArray(h.activeSkillSlots) ? h.activeSkillSlots : [],
    passiveSkillSlots: Array.isArray(h.passiveSkillSlots) ? h.passiveSkillSlots : [],
    stats: h.stats || { str: 4, con: 4, int: 2, agi: 2 }
  };
}

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
    mp: 100, maxMp: 100,
    rage: 0, ammo: 20, maxAmmo: 20,
    atk: 38, def: 14, speed: 10,
    gold: 600, refineStones: 10,
    statPoints: 5, sp: 2, tp: 2,
    stats: { str: 10, con: 10, int: 10, agi: 10 },
    skillLevels: { 0: 1, 1: 0, 2: 0 },
    equipped: { weapon: null, offhand: null, helmet: null, armor: null, shoes: null, accessory: null }
  });

  const [heroRoster, setHeroRoster] = useState([]);
  const [activeHeroInstanceIds, setActiveHeroInstanceIds] = useState([]);
  const [currentFormation, setCurrentFormation] = useState('none');
  const [equipmentInventory, setEquipmentInventory] = useState(
    ITEM_DROP_POOL.slice(0, 3).map((item, idx) => ({ ...item, refineLevel: 0, uid: `eq_init_${idx}` }))
  );
  const [skillCardsInventory, setSkillCardsInventory] = useState(() => [
    createSkillCardInstance(SKILL_CARDS_DB[0]), // 烈焰斬 (物理)
    createSkillCardInstance(SKILL_CARDS_DB[2]), // 九天雷劫 (法術)
    createSkillCardInstance(SKILL_CARDS_DB[6])  // 鋼筋鐵骨 (通用被動)
  ]);
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
    const cands = t1s.map(t => normalizeHero(instantiateHero(t, true, null, getRandomElement)));
    setStarterHeroCandidates(cands);
    setCreationData(prev => ({ ...prev, selectedStarterHero: cands[0] }));

    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.player) {
          setPlayer(parsed.player);
          setHeroRoster((parsed.heroRoster || []).map(normalizeHero));
          setActiveHeroInstanceIds(parsed.activeHeroInstanceIds || []);
          setCurrentFormation(parsed.currentFormation || 'none');
          setEquipmentInventory(parsed.equipmentInventory || []);
          if (parsed.skillCardsInventory) {
            setSkillCardsInventory(parsed.skillCardsInventory);
          }
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
        const saveData = { 
          player, 
          heroRoster, 
          activeHeroInstanceIds, 
          currentFormation, 
          equipmentInventory, 
          skillCardsInventory,
          towerFloor 
        };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(saveData));
      } catch (e) {
        console.warn('自動存檔失敗', e);
      }
    }
  }, [player, heroRoster, activeHeroInstanceIds, currentFormation, equipmentInventory, skillCardsInventory, towerFloor, gameStarted]);

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
  const playerTotalSpeed = Math.floor((player.speed + (player.stats.agi * 1) + equipBonus.speed) * (1 + (formBonus.speedPct || 0)));

  const addLog = (text, type = 'info') => {
    setCombatLogs(prev => [...prev, { id: Date.now() + Math.random(), turn: turnCount, text, type }]);
  };

  const handleStartGame = () => {
    const jobConfig = JOBS_CONFIG[creationData.job];
    const starterHero = normalizeHero(creationData.selectedStarterHero);

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

  // 派遣 / 卸下登場英雄
  const handleToggleDeployHero = (hero) => {
    if (activeHeroInstanceIds.includes(hero.instanceId)) {
      setActiveHeroInstanceIds(prev => prev.filter(id => id !== hero.instanceId));
      addLog(`🛡️ 英雄【${hero.name}】卸下登場，返回客棧休養。`, 'sys');
    } else {
      if (activeHeroInstanceIds.length >= 4) {
        addLog(`⚠️ 最多同時派遣 4 位英雄登場！`, 'sys');
        return;
      }
      if (activeHeroes.some(h => h.baseId === hero.baseId)) {
        addLog(`⚠️ 同名英雄【${hero.name}】不可重複登場！`, 'sys');
        return;
      }
      setActiveHeroInstanceIds(prev => [...prev, hero.instanceId]);
      addLog(`⚔️ 英雄【${hero.name}】加入出戰陣容！`, 'sys');
    }
  };

  // 放走英雄（自動退還身上所有已裝配的技能卡至背包）
  const handleReleaseHero = (hero) => {
    const returnedCards = [
      ...(hero.activeSkillSlots || []),
      ...(hero.passiveSkillSlots || [])
    ];
    if (returnedCards.length > 0) {
      setSkillCardsInventory(prev => [...prev, ...returnedCards]);
    }
    if (activeHeroInstanceIds.includes(hero.instanceId)) {
      setActiveHeroInstanceIds(prev => prev.filter(id => id !== hero.instanceId));
    }
    setHeroRoster(prev => prev.filter(h => h.instanceId !== hero.instanceId));
    addLog(`👋 已放走英雄【${hero.name}】${returnedCards.length > 0 ? `（自動收回 ${returnedCards.length} 張技能卡）` : ''}。`, 'sys');
  };

  // 裝配技能卡給指定英雄（單卡獨佔：從背包移出；同職業限定；不可重複同名卡）
  const handleEquipSkillCard = (heroInstanceId, card) => {
    const targetHero = heroRoster.find(h => h.instanceId === heroInstanceId);
    if (!targetHero) return;

    // 1. 檢查職業限制
    if (!card.allowedJobs.includes(targetHero.heroClass)) {
      addLog(`⚠️ 職業不符！【${targetHero.heroClass}】無法裝備【${card.name}】！`, 'sys');
      return;
    }

    // 2. 檢查是否已裝備同名/同ID技能卡
    const allEquipped = [
      ...(targetHero.activeSkillSlots || []),
      ...(targetHero.passiveSkillSlots || [])
    ];
    if (allEquipped.some(c => c.id === card.id || c.name === card.name)) {
      addLog(`⚠️ 英雄【${targetHero.name}】已裝備相同的技能卡【${card.name}】！`, 'sys');
      return;
    }

    // 3. 檢查槽位上限（主動最多 2 張、被動最多 2 張）
    const targetSlots = card.type === 'active' 
      ? (targetHero.activeSkillSlots || []) 
      : (targetHero.passiveSkillSlots || []);
    if (targetSlots.length >= 2) {
      addLog(`⚠️ 英雄【${targetHero.name}】的${card.type === 'active' ? '主動' : '被動'}技能槽已滿（最多 2 張），請先拆下舊卡片！`, 'sys');
      return;
    }

    // 從背包移出該獨立卡片（確保一張卡片同時只能用一次）
    setSkillCardsInventory(prev => prev.filter(c => c.uid !== card.uid));

    // 裝配至英雄身上
    setHeroRoster(prev => prev.map(h => {
      if (h.instanceId !== heroInstanceId) return h;
      if (card.type === 'active') {
        return { ...h, activeSkillSlots: [...(h.activeSkillSlots || []), card] };
      } else {
        return { ...h, passiveSkillSlots: [...(h.passiveSkillSlots || []), card] };
      }
    }));

    addLog(`🔮 英雄【${targetHero.name}】成功裝備技能卡【${card.name}】！`, 'sys');
  };

  // 拆下英雄身上的技能卡（退回背包供其他英雄使用）
  const handleUnequipSkillCard = (heroInstanceId, card) => {
    setHeroRoster(prev => prev.map(h => {
      if (h.instanceId !== heroInstanceId) return h;
      if (card.type === 'active') {
        return { ...h, activeSkillSlots: (h.activeSkillSlots || []).filter(c => c.uid !== card.uid) };
      } else {
        return { ...h, passiveSkillSlots: (h.passiveSkillSlots || []).filter(c => c.uid !== card.uid) };
      }
    }));

    setSkillCardsInventory(prev => [...prev, card]);
    addLog(`📤 已拆下技能卡【${card.name}】，卡片已放回背包。`, 'sys');
  };

  // 英雄自動升級邏輯
  const processHeroExpGain = (hero, expGained) => {
    let currentHero = normalizeHero(hero);
    currentHero.exp += expGained;
    let upgradedMsgs = [];

    while (currentHero.exp >= currentHero.maxExp) {
      currentHero.exp -= currentHero.maxExp;
      currentHero.level += 1;
      currentHero.maxExp = Math.floor(100 * Math.pow(currentHero.level, 1.3));

      const tierPtsMap = { 1: 2, 2: 3, 3: 5, 4: 7, 5: 10 };
      const pts = tierPtsMap[currentHero.tier] || 2;

      const weightsMap = {
        '猛將': { str: 0.30, con: 0.50, int: 0.00, agi: 0.20 },
        '巧匠': { str: 0.30, con: 0.20, int: 0.00, agi: 0.50 },
        '術士': { str: 0.00, con: 0.20, int: 0.60, agi: 0.20 },
        '藥師': { str: 0.00, con: 0.40, int: 0.40, agi: 0.20 },
        '風水師': { str: 0.00, con: 0.30, int: 0.30, agi: 0.40 }
      };
      const w = weightsMap[currentHero.heroClass] || weightsMap['猛將'];

      const addStr = Math.round(pts * w.str);
      const addCon = Math.round(pts * w.con);
      const addInt = Math.round(pts * w.int);
      const addAgi = pts - (addStr + addCon + addInt);

      const oldStats = currentHero.stats || { str: 4, con: 4, int: 2, agi: 2 };
      currentHero.stats = {
        str: oldStats.str + addStr,
        con: oldStats.con + addCon,
        int: oldStats.int + addInt,
        agi: oldStats.agi + addAgi
      };

      const tier = currentHero.tier || 1;
      currentHero.maxHp = 130 + (tier * 45) + (currentHero.stats.con * 16);
      currentHero.atk = 16 + (tier * 11) + (currentHero.stats.str * 3) + (currentHero.stats.int * 2);
      currentHero.def = 5 + (tier * 4) + (currentHero.stats.con * 1);
      currentHero.speed = 10 + (tier * 2) + (currentHero.stats.agi * 2);

      const { effectiveMaxHp } = calculateHeroEffectiveStats(currentHero);
      currentHero.hp = effectiveMaxHp;

      upgradedMsgs.push(`🎉 英雄【${currentHero.name}】升至 Lv.${currentHero.level}！(獲得 +${pts} 屬性點自動成長)`);
    }

    return { updatedHero: currentHero, upgradedMsgs };
  };

  // 核心回合處理
  const handleExecuteRound = (actionInput = { type: 'attack' }, isFusionUltimate = false) => {
    setCombatPhase('EXECUTING');
    let currentMonsters = [...monsters];
    let currentPlayer = { ...player };
    let currentRoster = heroRoster.map(h => normalizeHero(h));

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
          activeHeroes.forEach(h => {
            const { effectiveAtk } = calculateHeroEffectiveStats(h);
            teamAtk += effectiveAtk;
          });
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
    // 3. 釋放主角職業技能
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
          currentRoster = currentRoster.map(h => {
            if (!activeHeroInstanceIds.includes(h.instanceId)) return h;
            const { effectiveMaxHp } = calculateHeroEffectiveStats(h);
            return { ...h, hp: Math.min(effectiveMaxHp, h.hp + healVal) };
          });
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

    // 4. 登場英雄聯動打擊（依 Tier 機率隨機觸發主動技能卡）
    let teamHealFromHeroes = 0;

    currentRoster = currentRoster.map(h => {
      if (!activeHeroInstanceIds.includes(h.instanceId) || h.hp <= 0) return h;

      const aliveTargets = currentMonsters.filter(m => m.hp > 0);
      if (aliveTargets.length === 0) return h;
      const validTarget = aliveTargets[Math.floor(Math.random() * aliveTargets.length)];

      const { effectiveAtk, elemDmgPct, skillChance } = calculateHeroEffectiveStats(h);
      const activeCards = h.activeSkillSlots || [];

      // 依 Tier 機率抽籤是否施放主動技能卡
      if (activeCards.length > 0 && Math.random() < skillChance) {
        const cardToCast = activeCards[Math.floor(Math.random() * activeCards.length)];
        const mult = cardToCast.mult || 1.8;

        if (cardToCast.target === 'aoe') {
          currentMonsters.forEach(m => {
            if (m.hp > 0) {
              let em = getElementMultiplier(h.element, m.element);
              if (em > 1.0) em += elemDmgPct;
              const dmg = Math.max(6, Math.floor(effectiveAtk * mult * em) - m.def);
              m.hp = Math.max(0, m.hp - dmg);
            }
          });
          addLog(`✨ 【Tier ${h.tier}】英雄【${h.name}】觸發技能卡【${cardToCast.name}】，對敵方全體造成廣域打擊！`, 'hero');
        } else if (cardToCast.target === 'heal') {
          const healVal = Math.floor(effectiveAtk * mult);
          teamHealFromHeroes += healVal;
          addLog(`🌿 【Tier ${h.tier}】英雄【${h.name}】施展【${cardToCast.name}】，為全隊恢復 +${healVal} HP！`, 'hero');
        } else {
          let em = getElementMultiplier(h.element, validTarget.element);
          if (em > 1.0) em += elemDmgPct;
          const dmg = Math.max(8, Math.floor(effectiveAtk * mult * em) - validTarget.def);
          validTarget.hp = Math.max(0, validTarget.hp - dmg);
          addLog(`⚡ 【Tier ${h.tier}】英雄【${h.name}】爆發技能卡【${cardToCast.name}】，對【${validTarget.name}】造成 ${dmg} 點重創！`, 'hero');
        }
      } else {
        // 普通攻擊
        let em = getElementMultiplier(h.element, validTarget.element);
        if (em > 1.0) em += elemDmgPct;
        const dmg = Math.max(5, Math.floor((effectiveAtk - validTarget.def) * em));
        validTarget.hp = Math.max(0, validTarget.hp - dmg);
        addLog(`💥 英雄【${h.name}】普通攻擊，對【${validTarget.name}】造成 ${dmg} 點打擊！`, 'hero');
      }

      // 職業資源積攢
      let updatedRage = h.rage || 0;
      let updatedAmmo = h.ammo || 6;
      let updatedMp = h.mp || 50;

      if (h.heroClass === '猛將') updatedRage = Math.min(100, updatedRage + 20);
      else if (h.heroClass === '巧匠') updatedAmmo = Math.min(h.maxAmmo || 6, updatedAmmo + 2);
      else updatedMp = Math.min(h.maxMp || 100, updatedMp + 15);

      return { ...h, rage: updatedRage, ammo: updatedAmmo, mp: updatedMp };
    });

    // 套用英雄治療卡效果
    if (teamHealFromHeroes > 0) {
      currentPlayer.hp = Math.min(playerTotalMaxHp, currentPlayer.hp + teamHealFromHeroes);
      currentRoster = currentRoster.map(h => {
        if (!activeHeroInstanceIds.includes(h.instanceId) || h.hp <= 0) return h;
        const { effectiveMaxHp } = calculateHeroEffectiveStats(h);
        return { ...h, hp: Math.min(effectiveMaxHp, h.hp + teamHealFromHeroes) };
      });
    }

    // 5. 怪物反擊
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

        // 怪物隨機波及登場英雄
        currentRoster = currentRoster.map(h => {
          if (!activeHeroInstanceIds.includes(h.instanceId) || h.hp <= 0) return h;
          if (Math.random() < 0.35) {
            const { effectiveDef } = calculateHeroEffectiveStats(h);
            const hDmg = Math.max(2, Math.floor(m.atk * 0.65) - Math.floor(effectiveDef * 0.5));
            const newHp = Math.max(0, h.hp - hDmg);
            if (newHp === 0) addLog(`💀 英雄【${h.name}】重傷倒下！`, 'sys');
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
      handleBattleVictory(currentPlayer, currentMonsters, currentRoster);
      return;
    }

    setTurnCount(prev => prev + 1);
    setCombatPhase('PLAYER_SELECT');
  };

  // ✅ 戰鬥勝利結算：確保新掉落英雄與英雄 EXP 成長完美共存不被覆寫
  const handleBattleVictory = (pObj, defeatedMonsters, currentRoster) => {
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
      droppedHero = normalizeHero(instantiateHero(picked, true, null, getRandomElement));
    }

    let droppedSkillCard = null;
    if (Math.random() < 0.35) {
      const cardTemplate = SKILL_CARDS_DB[Math.floor(Math.random() * SKILL_CARDS_DB.length)];
      droppedSkillCard = createSkillCardInstance(cardTemplate);
      setSkillCardsInventory(prev => [...prev, droppedSkillCard]);
    }

    // 先將新掉落英雄併入名冊，再統一結算經驗值
    let mergedRoster = [...currentRoster];
    if (droppedHero) {
      mergedRoster.push(droppedHero);
    }

    let msgs = [];
    const finalRoster = mergedRoster.map(hero => {
      if (!activeHeroInstanceIds.includes(hero.instanceId)) return hero;
      const { updatedHero, upgradedMsgs } = processHeroExpGain(hero, totalExp);
      if (upgradedMsgs.length > 0) msgs.push(...upgradedMsgs);
      return updatedHero;
    });

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
      newPlayer.statPoints += 5;
      newPlayer.sp += 1;
      newPlayer.tp += 1;
      msgs.push(`🎉 少俠升級至 Level ${newPlayer.level}！獲得 5 點屬性點與 1 點 SP！`);
    }

    setPlayer(newPlayer);
    setHeroRoster(finalRoster);
    if (droppedEquipments.length > 0) {
      setEquipmentInventory(prev => [...prev, ...droppedEquipments]);
    }

    setVictorySummary({
      gold: totalGold,
      exp: totalExp,
      stones: droppedStones,
      droppedEquipments,
      droppedHero,
      droppedSkillCard,
      msgs
    });
  };

  const handleRestInn = () => {
    setPlayer(prev => ({
      ...prev,
      hp: playerTotalMaxHp,
      mp: playerTotalMaxMp,
      rage: 0,
      ammo: prev.maxAmmo
    }));
    setHeroRoster(prev => prev.map(h => {
      const { effectiveMaxHp } = calculateHeroEffectiveStats(h);
      return {
        ...h,
        hp: effectiveMaxHp,
        fatigue: 0,
        rage: 0,
        ammo: h.maxAmmo || 6,
        mp: h.maxMp || 100
      };
    }));
    addLog(`🏨 客棧休養完成，全隊生命、資源恢復滿值且疲勞歸零！`, 'sys');
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
    const jsonStr = JSON.stringify({ 
      player, 
      heroRoster, 
      activeHeroInstanceIds, 
      currentFormation, 
      equipmentInventory, 
      skillCardsInventory,
      towerFloor 
    }, null, 2);
    setJsonSaveText(jsonStr);
    setSaveLoadStatus('存檔 JSON 匯出成功！');
  };

  const handleImportSave = () => {
    try {
      const parsed = JSON.parse(jsonSaveText);
      if (parsed && parsed.player) {
        setPlayer(parsed.player);
        setHeroRoster((parsed.heroRoster || []).map(normalizeHero));
        setActiveHeroInstanceIds(parsed.activeHeroInstanceIds || []);
        setCurrentFormation(parsed.currentFormation || 'none');
        setEquipmentInventory(parsed.equipmentInventory || []);
        setSkillCardsInventory(parsed.skillCardsInventory || []);
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
      playerTotalAtk={playerTotalAtk}
      playerTotalDef={playerTotalDef}
      playerTotalSpeed={playerTotalSpeed}
      activeHeroes={activeHeroes}
      activeHeroInstanceIds={activeHeroInstanceIds}
      heroRoster={heroRoster}
      setHeroRoster={setHeroRoster}
      handleToggleDeployHero={handleToggleDeployHero}
      handleReleaseHero={handleReleaseHero}
      handleEquipSkillCard={handleEquipSkillCard}
      handleUnequipSkillCard={handleUnequipSkillCard}
      handleRestInn={handleRestInn}
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
      skillCardsInventory={skillCardsInventory}
      setSkillCardsInventory={setSkillCardsInventory}
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
