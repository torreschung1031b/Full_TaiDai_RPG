import React, { useState, useEffect, useMemo } from 'react';
import { 
  Shield, Sword, Heart, Zap, Sparkles, Award, Settings, 
  RotateCcw, RefreshCw, Layers, Crosshair, Users, MapPin, 
  BookOpen, Feather, ShoppingBag, Terminal, Database, Play, CheckCircle
} from 'lucide-react';

// ==================== 1. 五行與基礎資料庫 ====================
const ELEMENTS = {
  METAL: { name: '金', color: 'text-amber-300', bg: 'bg-amber-950/40', border: 'border-amber-500/50', beats: 'WOOD' },
  WOOD:  { name: '木', color: 'text-emerald-400', bg: 'bg-emerald-950/40', border: 'border-emerald-500/50', beats: 'EARTH' },
  WATER: { name: '水', color: 'text-cyan-400', bg: 'bg-cyan-950/40', border: 'border-cyan-500/50', beats: 'FIRE' },
  FIRE:  { name: '火', color: 'text-rose-400', bg: 'bg-rose-950/40', border: 'border-rose-500/50', beats: 'METAL' },
  EARTH: { name: '土', color: 'text-yellow-600', bg: 'bg-yellow-950/40', border: 'border-yellow-600/50', beats: 'WATER' }
};

const FORMATIONS = [
  { id: 'NONE', name: '無陣法', desc: '標準戰鬥姿態，無額外加成。', atkBonus: 0, defBonus: 0, spdBonus: 0 },
  { id: 'HEAVEN', name: '天覆陣', desc: '全隊防禦 +20%，受到的五行克制傷害減少 15%。', atkBonus: 0, defBonus: 0.2, spdBonus: 0 },
  { id: 'EARTH', name: '地載陣', desc: '全隊最大 HP +15%，格擋率提升。', atkBonus: 0, defBonus: 0.15, spdBonus: -0.05 },
  { id: 'ARROW', name: '鋒矢陣', desc: '全隊物理與法術攻擊 +25%，速度 +10%，但防禦 -10%。', atkBonus: 0.25, defBonus: -0.1, spdBonus: 0.1 }
];

const INITIAL_HERO_POOL = [
  { id: 't1_1', name: '鄉勇男丁', tier: 1, job: '猛將', element: 'EARTH', baseHp: 120, baseAtk: 18, baseDef: 6, speed: 10 },
  { id: 't1_2', name: '草藥學徒', tier: 1, job: '藥師', element: 'WOOD', baseHp: 90, baseAtk: 12, baseDef: 4, speed: 12 },
  { id: 't1_3', name: '機關弩手', tier: 1, job: '巧匠', element: 'METAL', baseHp: 100, baseAtk: 22, baseDef: 3, speed: 14 },
  { id: 't2_1', name: '周倉', tier: 2, job: '猛將', element: 'EARTH', baseHp: 220, baseAtk: 35, baseDef: 12, speed: 11, innateSkill: '忠勇重擊' },
  { id: 't2_2', name: '廖化', tier: 2, job: '猛將', element: 'WOOD', baseHp: 240, baseAtk: 32, baseDef: 14, speed: 10, innateSkill: '先鋒突刺' },
  { id: 't3_1', name: '關羽', tier: 3, job: '猛將', element: 'WATER', baseHp: 480, baseAtk: 75, baseDef: 25, speed: 18, innateSkill: '青龍偃月斬' },
  { id: 't3_2', name: '張飛', tier: 3, job: '猛將', element: 'FIRE', baseHp: 520, baseAtk: 82, baseDef: 22, speed: 16, innateSkill: '萬夫不當咆哮' },
  { id: 't4_1', name: '趙雲', tier: 4, job: '巧匠', element: 'METAL', baseHp: 750, baseAtk: 125, baseDef: 38, speed: 28, innateSkill: '七探盤龍槍' },
  { id: 't4_2', name: '諸葛亮', tier: 4, job: '風水師', element: 'WOOD', baseHp: 620, baseAtk: 140, baseDef: 30, speed: 24, innateSkill: '臥龍八陣圖' },
  { id: 't5_1', name: '孫悟空', tier: 5, job: '猛將', element: 'FIRE', baseHp: 1200, baseAtk: 210, baseDef: 65, speed: 35, innateSkill: '大鬧天宮·金箍破魔' }
];

// ==================== 2. 主組件 ====================
export default function App() {
  // 遊戲狀態與存檔
  const [gameState, setGameState] = useState('CREATION'); // CREATION | MAIN
  const [activeTab, setActiveTab] = useState('BATTLE');
  
  // 創角資訊
  const [characterName, setCharacterName] = useState('Torres');
  const [gender, setGender] = useState('男');
  const [playerJob, setPlayerJob] = useState('猛將');
  const [playerElement, setPlayerElement] = useState('FIRE');
  
  // 玩家核心數值
  const [player, setPlayer] = useState({
    level: 1, exp: 0, maxExp: 100,
    hp: 250, maxHp: 250, mp: 100, maxMp: 100,
    str: 10, con: 10, int: 10, agi: 10, statPoints: 5,
    sp: 2, jobAdv: '無', rage: 0, ammo: 20
  });

  // 隊伍與英雄庫
  const [activeHeroes, setActiveHeroes] = useState([]);
  const [heroRoster, setHeroRoster] = useState([]);
  const [formation, setFormation] = useState('NONE');
  
  // 資源與背包
  const [gold, setGold] = useState(500);
  const [refineStones, setRefineStones] = useState(5);
  const [inventory, setInventory] = useState([]);
  const [equipped, setEquipped] = useState({ weapon: null, offhand: null, head: null, chest: null, shoes: null, accessory: null });
  
  // 戰鬥狀態
  const [monsters, setMonsters] = useState([]);
  const [selectedMonsterIdx, setSelectedMonsterIdx] = useState(0);
  const [combatLogs, setCombatLogs] = useState(['歡迎來到《天外 Online》文字 RPG 大陸！']);
  const [battleActive, setBattleActive] = useState(false);
  const [jsonSaveText, setJsonSaveText] = useState('');

  // 1. 本地自動存檔
  useEffect(() => {
    const saved = localStorage.getItem('TIANWAI_FULL_SAVE');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setPlayer(data.player);
        setActiveHeroes(data.activeHeroes || []);
        setHeroRoster(data.heroRoster || []);
        setGold(data.gold || 0);
        setGameState('MAIN');
      } catch (e) {
        console.error("存檔載入失敗", e);
      }
    }
  }, []);

  const saveGame = () => {
    const data = { player, activeHeroes, heroRoster, gold, inventory, equipped, formation };
    localStorage.setItem('TIANWAI_FULL_SAVE', JSON.stringify(data));
    setJsonSaveText(JSON.stringify(data, null, 2));
  };

  // 2. 開局創角流程
  const handleStartGame = (starterHero) => {
    setHeroRoster([starterHero]);
    setActiveHeroes([starterHero]);
    setGameState('MAIN');
    setCombatLogs(prev => [...prev, `你選擇了五行【${ELEMENTS[playerElement].name}】屬性的【${playerJob}】，並與【${starterHero.name}】攜手踏上冒險！`]);
  };

  // 3. 戰鬥遭遇生成 (依小隊人數 1~3 倍生成 5~15 隻怪)
  const startNewEncounter = () => {
    const totalTeamCount = 1 + activeHeroes.length;
    const monsterCount = Math.floor(Math.random() * (totalTeamCount * 2)) + totalTeamCount; // 5~15 隻
    
    const newMonsters = Array.from({ length: monsterCount }).map((_, i) => ({
      id: `m_${i}`,
      name: `黑山山賊 ${String.fromCharCode(65 + i)}`,
      element: Object.keys(ELEMENTS)[Math.floor(Math.random() * 5)],
      hp: 150 + (player.level * 20),
      maxHp: 150 + (player.level * 20),
      atk: 15 + (player.level * 3),
      def: 5,
      speed: 8 + Math.floor(Math.random() * 5)
    }));

    setMonsters(newMonsters);
    setSelectedMonsterIdx(0);
    setBattleActive(true);
    setCombatLogs(prev => [...prev, `⚔️ 遭遇敵群！前方出現了 ${monsterCount} 隻怪物！`]);
  };

  // 4. 回合戰鬥推進
  const handleTurnAction = (actionType) => {
    if (!battleActive || monsters.length === 0) return;

    let logs = [];
    let updatedMonsters = [...monsters];
    let target = updatedMonsters[selectedMonsterIdx] || updatedMonsters[0];

    // 主角打擊
    if (actionType === 'ATTACK') {
      const dmg = Math.max(5, player.str * 3 - target.def);
      target.hp -= dmg;
      logs.push(`你揮舞武器對【${target.name}】造成 ${dmg} 點物理傷害！`);
    }

    // 英雄協同攻擊
    activeHeroes.forEach(hero => {
      if (hero.fatigue < 100 && target.hp > 0) {
        const hDmg = Math.max(5, hero.baseAtk - target.def);
        target.hp -= hDmg;
        hero.fatigue = Math.min(100, hero.fatigue + 2);
        logs.push(`英雄【${hero.name}】施展招式，對【${target.name}】造成 ${hDmg} 點傷害！（疲勞度 ${hero.fatigue}%）`);
      }
    });

    // 清除死亡怪物
    updatedMonsters = updatedMonsters.filter(m => m.hp > 0);
    setMonsters(updatedMonsters);

    // 戰鬥結算
    if (updatedMonsters.length === 0) {
      setBattleActive(false);
      const earnedGold = 80 + player.level * 10;
      const earnedExp = 50 + player.level * 15;
      setGold(g => g + earnedGold);
      logs.push(`🎉 全滅敵群！獲得 ${earnedGold} 金幣，${earnedExp} 經驗值！`);
      
      // 升級檢測
      if (player.exp + earnedExp >= player.maxExp) {
        setPlayer(p => ({
          ...p,
          level: p.level + 1,
          exp: 0,
          maxExp: p.maxExp + 50,
          hp: p.maxHp,
          mp: p.maxMp,
          statPoints: p.statPoints + 3,
          sp: p.sp + 1
        }));
        logs.push(`✨ 升級了！目前等級 Lv.${player.level + 1}，HP/MP 完全恢復！`);
      }
    }

    setCombatLogs(prev => [...prev, ...logs]);
    saveGame();
  };

  // 創角畫面
  if (gameState === 'CREATION') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
        <div className="max-w-xl w-full bg-slate-900 border border-amber-500/30 rounded-xl p-6 shadow-2xl space-y-6">
          <h1 className="text-3xl font-bold text-center text-amber-400">《天外 Online》文字 RPG - 建立主角</h1>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">主角姓名</label>
              <input 
                type="text" 
                value={characterName} 
                onChange={(e) => setCharacterName(e.target.value)} 
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-amber-200"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1">職業選擇</label>
              <div className="grid grid-cols-5 gap-2">
                {['猛將', '巧匠', '術士', '藥師', '風水師'].map(j => (
                  <button 
                    key={j} 
                    onClick={() => setPlayerJob(j)}
                    className={`py-2 rounded border text-sm font-bold ${playerJob === j ? 'bg-amber-600 border-amber-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                  >
                    {j}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1">五行本命屬性</label>
              <div className="grid grid-cols-5 gap-2">
                {Object.keys(ELEMENTS).map(elemKey => (
                  <button 
                    key={elemKey}
                    onClick={() => setPlayerElement(elemKey)}
                    className={`py-2 rounded border text-sm font-bold ${ELEMENTS[elemKey].color} ${playerElement === elemKey ? 'bg-slate-700 border-amber-400 ring-2 ring-amber-400/50' : 'bg-slate-800 border-slate-700'}`}
                  >
                    {ELEMENTS[elemKey].name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">選擇一位起步夥牌英雄 (3-選-1 雜兵卡)</label>
              <div className="grid grid-cols-3 gap-3">
                {INITIAL_HERO_POOL.slice(0, 3).map(hero => (
                  <div key={hero.id} className="bg-slate-800 p-3 rounded border border-slate-700 hover:border-amber-400 cursor-pointer text-center" onClick={() => handleStartGame(hero)}>
                    <div className="font-bold text-amber-300">{hero.name}</div>
                    <div className="text-xs text-slate-400">Tier 1 • {hero.job}</div>
                    <div className="text-xs text-cyan-400 mt-1">HP: {hero.baseHp} / ATK: {hero.baseAtk}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 主遊戲介面
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* 頂部資訊欄 */}
      <header className="bg-slate-900 border-b border-slate-800 p-3 px-6 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <span className="font-bold text-lg text-amber-400">{characterName} (Lv.{player.level} {playerJob})</span>
          <span className={`text-xs px-2 py-0.5 rounded border ${ELEMENTS[playerElement].border} ${ELEMENTS[playerElement].color}`}>
            本命五行：{ELEMENTS[playerElement].name}
          </span>
        </div>
        <div className="flex space-x-6 text-sm">
          <span className="text-rose-400">HP: {player.hp}/{player.maxHp}</span>
          <span className="text-cyan-400">MP: {player.mp}/{player.maxMp}</span>
          <span className="text-amber-300">💰 金幣: {gold}</span>
        </div>
      </header>

      {/* 主面板分頁籤 */}
      <nav className="bg-slate-900/60 border-b border-slate-800 flex justify-center space-x-2 p-2">
        {[
          { id: 'BATTLE', label: '⚔️ 戰鬥地圖' },
          { id: 'HEROES', label: '👥 英雄隊伍 (4/4)' },
          { id: 'SAVE', label: '💾 存檔/匯出' }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-colors ${activeTab === tab.id ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* 內容區塊 */}
      <main className="flex-1 p-4 max-w-6xl w-full mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
        {activeTab === 'BATTLE' && (
          <>
            {/* 左側：戰鬥遭遇畫面 */}
            <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-bold text-amber-400">敵方群體 (當前 {monsters.length} 隻)</h2>
                  {!battleActive && (
                    <button onClick={startNewEncounter} className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-1.5 rounded font-bold text-sm">
                      ⚔️ 尋找野生怪群 (5~15隻)
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 max-h-60 overflow-y-auto p-1">
                  {monsters.map((m, idx) => (
                    <div 
                      key={m.id}
                      onClick={() => setSelectedMonsterIdx(idx)}
                      className={`p-2 rounded border text-center cursor-pointer transition-all ${selectedMonsterIdx === idx ? 'border-amber-400 bg-amber-950/30' : 'border-slate-800 bg-slate-800/40'}`}
                    >
                      <div className="text-xs font-bold truncate text-slate-200">{m.name}</div>
                      <div className="text-[10px] text-rose-400">HP {m.hp}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 戰鬥操作選項 */}
              <div className="mt-4 pt-4 border-t border-slate-800">
                <div className="grid grid-cols-4 gap-2">
                  <button disabled={!battleActive} onClick={() => handleTurnAction('ATTACK')} className="bg-rose-700 hover:bg-rose-600 disabled:opacity-50 text-white py-2 rounded font-bold text-sm">
                    普通攻擊
                  </button>
                  <button disabled={!battleActive} onClick={() => handleTurnAction('SKILL')} className="bg-cyan-700 hover:bg-cyan-600 disabled:opacity-50 text-white py-2 rounded font-bold text-sm">
                    職業絕學
                  </button>
                  <button disabled={!battleActive} onClick={() => handleTurnAction('HERO_AOE')} className="bg-amber-700 hover:bg-amber-600 disabled:opacity-50 text-white py-2 rounded font-bold text-sm">
                    主僕合擊
                  </button>
                  <button onClick={() => setCombatLogs([])} className="bg-slate-800 text-slate-400 py-2 rounded text-sm">
                    清空戰報
                  </button>
                </div>
              </div>
            </div>

            {/* 右側：戰鬥日誌 */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col">
              <h3 className="font-bold text-slate-300 mb-2 border-b border-slate-800 pb-2">📜 實時戰況日誌</h3>
              <div className="flex-1 overflow-y-auto space-y-1.5 text-xs font-mono text-slate-400 max-h-80">
                {combatLogs.map((log, index) => (
                  <div key={index} className="leading-relaxed">{log}</div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'HEROES' && (
          <div className="md:col-span-3 bg-slate-900 border border-slate-800 rounded-xl p-4">
            <h2 className="font-bold text-amber-400 mb-4">出戰陣容 (最多 4 位英雄，不可重複)</h2>
            <div className="grid grid-cols-4 gap-4">
              {activeHeroes.map(hero => (
                <div key={hero.id} className="bg-slate-800 p-4 rounded border border-amber-500/30">
                  <div className="font-bold text-amber-300">{hero.name}</div>
                  <div className="text-xs text-slate-400">Tier {hero.tier} • {hero.job}</div>
                  <div className="mt-2 text-xs space-y-1">
                    <div>HP: {hero.baseHp}</div>
                    <div>ATK: {hero.baseAtk}</div>
                    <div className="text-amber-400">疲勞度: {hero.fatigue || 0}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'SAVE' && (
          <div className="md:col-span-3 bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
            <h2 className="font-bold text-amber-400">遊戲存檔與備份管理</h2>
            <div className="flex space-x-2">
              <button onClick={saveGame} className="bg-amber-600 text-white px-4 py-2 rounded font-bold text-sm">
                立即手動存檔
              </button>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">JSON 存檔文字 (可複製導出備份)</label>
              <textarea 
                value={jsonSaveText} 
                onChange={(e) => setJsonSaveText(e.target.value)} 
                className="w-full h-40 bg-slate-950 border border-slate-800 rounded p-2 text-xs font-mono text-emerald-400"
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
