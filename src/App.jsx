import React, { useState, useEffect } from 'react';
import { 
  Shield, Sword, Heart, Zap, Sparkles, Award, RotateCcw, 
  Users, MapPin, Play, CheckCircle, Flame, Droplets, Mountain, Trees,
  BookOpen, Feather, ShoppingBag, Database, ArrowUpCircle
} from 'lucide-react';

// ==================== 1. 五行與戰鬥機制 ====================
const ELEMENTS = {
  METAL: { name: '金', icon: '⚔️', color: 'text-amber-300', bg: 'bg-amber-950/40', border: 'border-amber-500/50', beats: 'WOOD' },
  WOOD:  { name: '木', icon: '🌿', color: 'text-emerald-400', bg: 'bg-emerald-950/40', border: 'border-emerald-500/50', beats: 'EARTH' },
  WATER: { name: '水', icon: '💧', color: 'text-cyan-400', bg: 'bg-cyan-950/40', border: 'border-cyan-500/50', beats: 'FIRE' },
  FIRE:  { name: '火', icon: '🔥', color: 'text-rose-400', bg: 'bg-rose-950/40', border: 'border-rose-500/50', beats: 'METAL' },
  EARTH: { name: '土', icon: '⛰️', color: 'text-yellow-600', bg: 'bg-yellow-950/40', border: 'border-yellow-600/50', beats: 'WATER' }
};

// 五行克制傷害加成計算 (克制 +30% 傷害，被克 -20% 傷害)
const getElementMultiplier = (attackerElem, defenderElem) => {
  if (ELEMENTS[attackerElem]?.beats === defenderElem) return 1.3;
  if (ELEMENTS[defenderElem]?.beats === attackerElem) return 0.8;
  return 1.0;
};

const INITIAL_HERO_POOL = [
  { id: 't1_1', name: '鄉勇男丁', tier: 1, job: '猛將', element: 'EARTH', baseHp: 120, baseAtk: 18, baseDef: 6, speed: 10, fatigue: 0 },
  { id: 't1_2', name: '草藥學徒', tier: 1, job: '藥師', element: 'WOOD', baseHp: 90, baseAtk: 12, baseDef: 4, speed: 12, fatigue: 0 },
  { id: 't1_3', name: '機關弩手', tier: 1, job: '巧匠', element: 'METAL', baseHp: 100, baseAtk: 22, baseDef: 3, speed: 14, fatigue: 0 },
  { id: 't2_1', name: '周倉', tier: 2, job: '猛將', element: 'EARTH', baseHp: 220, baseAtk: 35, baseDef: 12, speed: 11, fatigue: 0 },
  { id: 't3_1', name: '關羽', tier: 3, job: '猛將', element: 'WATER', baseHp: 480, baseAtk: 75, baseDef: 25, speed: 18, fatigue: 0 }
];

export default function App() {
  const [gameState, setGameState] = useState('CREATION');
  const [activeTab, setActiveTab] = useState('BATTLE');
  
  // 創角資訊
  const [characterName, setCharacterName] = useState('Torres');
  const [playerJob, setPlayerJob] = useState('猛將');
  const [playerElement, setPlayerElement] = useState('FIRE');
  const [selectedStarter, setSelectedStarter] = useState(INITIAL_HERO_POOL[0]);

  // 玩家與英雄隊伍
  const [player, setPlayer] = useState({
    level: 1, exp: 0, maxExp: 100,
    hp: 250, maxHp: 250, mp: 100, maxMp: 100,
    str: 10, con: 10, int: 10, agi: 10, statPoints: 5,
    sp: 2, jobAdv: '無'
  });

  const [activeHeroes, setActiveHeroes] = useState([]);
  const [gold, setGold] = useState(500);
  
  // 戰鬥狀態
  const [monsters, setMonsters] = useState([]);
  const [selectedMonsterIdx, setSelectedMonsterIdx] = useState(0);
  const [combatLogs, setCombatLogs] = useState(['歡迎來到《天外 Online》文字 RPG 大陸！']);
  const [battleActive, setBattleActive] = useState(false);
  const [jsonSaveText, setJsonSaveText] = useState('');

  // 存檔讀取
  useEffect(() => {
    const saved = localStorage.getItem('TIANWAI_FULL_SAVE');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.player && data.activeHeroes) {
          setPlayer(data.player);
          setActiveHeroes(data.activeHeroes || []);
          setGold(data.gold || 0);
          setGameState('MAIN');
        }
      } catch (e) {
        console.error("存檔載入失敗", e);
      }
    }
  }, []);

  const saveGame = () => {
    const data = { player, activeHeroes, gold, characterName, playerJob, playerElement };
    localStorage.setItem('TIANWAI_FULL_SAVE', JSON.stringify(data));
    setJsonSaveText(JSON.stringify(data, null, 2));
  };

  const handleConfirmCharacter = () => {
    setActiveHeroes([selectedStarter]);
    setGameState('MAIN');
    setCombatLogs(prev => [
      ...prev, 
      `✨ 角色建立成功！五行【${ELEMENTS[playerElement].name}】屬性【${playerJob}】${characterName} 攜手夥伴【${selectedStarter.name}】正式踏入天外世界！`
    ]);
  };

  // 生成 5~15 隻怪群
  const startNewEncounter = () => {
    const totalTeamCount = 1 + activeHeroes.length;
    const monsterCount = Math.floor(Math.random() * (totalTeamCount * 2)) + totalTeamCount;
    
    const newMonsters = Array.from({ length: monsterCount }).map((_, i) => ({
      id: `m_${i}`,
      name: `黑山山賊 ${String.fromCharCode(65 + i)}`,
      element: Object.keys(ELEMENTS)[Math.floor(Math.random() * 5)],
      hp: 120 + (player.level * 15),
      maxHp: 120 + (player.level * 15),
      atk: 14 + (player.level * 2),
      def: 4
    }));

    setMonsters(newMonsters);
    setSelectedMonsterIdx(0);
    setBattleActive(true);
    setCombatLogs(prev => [...prev, `⚔️ 遭遇敵群！前方出現了 ${monsterCount} 隻怪物！`]);
  };

  // 戰鬥邏輯 (含五行相剋)
  const handleTurnAction = (actionType) => {
    if (!battleActive || monsters.length === 0) return;

    let logs = [];
    let updatedMonsters = [...monsters];
    let target = updatedMonsters[selectedMonsterIdx] || updatedMonsters[0];

    // 1. 主角打擊
    if (actionType === 'ATTACK') {
      const mult = getElementMultiplier(playerElement, target.element);
      const baseDmg = Math.max(5, player.str * 3 - target.def);
      const finalDmg = Math.floor(baseDmg * mult);
      
      target.hp -= finalDmg;
      const elemText = mult > 1.0 ? ' (五行克制 +30%)' : mult < 1.0 ? ' (五行被克 -20%)' : '';
      logs.push(`你打出【${ELEMENTS[playerElement].name}】屬性物理攻擊，對【${target.name}】造成 ${finalDmg} 點傷害${elemText}！`);
    }

    // 2. 英雄協同攻擊
    activeHeroes.forEach(hero => {
      if (target.hp > 0) {
        const mult = getElementMultiplier(hero.element, target.element);
        const hDmg = Math.floor(Math.max(5, hero.baseAtk - target.def) * mult);
        target.hp -= hDmg;
        logs.push(`英雄【${hero.name}】(${ELEMENTS[hero.element].name}) 施展招式，對【${target.name}】造成 ${hDmg} 點傷害！`);
      }
    });

    // 3. 怪物清算
    updatedMonsters = updatedMonsters.filter(m => m.hp > 0);
    setMonsters(updatedMonsters);

    // 4. 戰鬥結算
    if (updatedMonsters.length === 0) {
      setBattleActive(false);
      const earnedGold = 80 + player.level * 10;
      const earnedExp = 50 + player.level * 15;
      setGold(g => g + earnedGold);
      logs.push(`🎉 全滅敵群！獲得 ${earnedGold} 金幣，${earnedExp} 經驗值！`);
      
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
        logs.push(`✨ 升級了！目前等級 Lv.${player.level + 1}，獲得 3 點屬性點數！`);
      }
    }

    setCombatLogs(prev => [...prev, ...logs]);
    saveGame();
  };

  // ==================== 創角 UI ====================
  if (gameState === 'CREATION') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-slate-900/90 border border-amber-500/40 rounded-2xl p-6 shadow-2xl backdrop-blur space-y-6">
          <div className="text-center space-y-2 border-b border-slate-800 pb-4">
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
              《天外 Online》文字 RPG
            </h1>
            <p className="text-xs text-slate-400">請設定你的主角姓名、五行本命屬性與首位起步夥伴</p>
          </div>
          
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-amber-400 mb-1">1. 主角姓名</label>
              <input 
                type="text" 
                value={characterName} 
                onChange={(e) => setCharacterName(e.target.value)} 
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-amber-200 focus:outline-none focus:border-amber-500 font-bold text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-amber-400 mb-2">2. 選擇職業</label>
              <div className="grid grid-cols-5 gap-2">
                {['猛將', '巧匠', '術士', '藥師', '風水師'].map(j => (
                  <button 
                    key={j} 
                    onClick={() => setPlayerJob(j)}
                    className={`py-2 rounded-lg border text-xs sm:text-sm font-bold transition-all ${playerJob === j ? 'bg-amber-600 border-amber-400 text-white shadow-lg ring-2 ring-amber-400/50' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
                  >
                    {j}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-amber-400 mb-2">3. 五行本命屬性</label>
              <div className="grid grid-cols-5 gap-2">
                {Object.keys(ELEMENTS).map(elemKey => (
                  <button 
                    key={elemKey}
                    onClick={() => setPlayerElement(elemKey)}
                    className={`py-2 rounded-lg border text-xs sm:text-sm font-bold transition-all flex flex-col items-center justify-center space-y-1 ${ELEMENTS[elemKey].color} ${playerElement === elemKey ? 'bg-slate-800 border-amber-400 ring-2 ring-amber-400/50 shadow-md' : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800'}`}
                  >
                    <span>{ELEMENTS[elemKey].icon}</span>
                    <span>{ELEMENTS[elemKey].name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-amber-400 mb-2">4. 選擇首位起步英雄夥伴</label>
              <div className="grid grid-cols-3 gap-3">
                {INITIAL_HERO_POOL.slice(0, 3).map(hero => (
                  <div 
                    key={hero.id} 
                    onClick={() => setSelectedStarter(hero)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${selectedStarter.id === hero.id ? 'bg-amber-950/40 border-amber-400 ring-2 ring-amber-400/50' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}
                  >
                    <div className="font-bold text-amber-300 text-sm">{hero.name}</div>
                    <div className="text-[10px] text-slate-400">Tier {hero.tier} • {hero.job}</div>
                    <div className="text-[10px] text-cyan-400 mt-2">HP: {hero.baseHp} | ATK: {hero.baseAtk}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <button 
                onClick={handleConfirmCharacter}
                className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-extrabold py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 text-base"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>踏入天外世界 • 開始遊戲</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==================== 主遊戲 UI ====================
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* 頂部英雄面板資訊 */}
      <header className="bg-slate-900 border-b border-slate-800 p-3 px-6 flex flex-wrap justify-between items-center gap-2">
        <div className="flex items-center space-x-3">
          <span className="font-bold text-amber-400 text-base sm:text-lg">{characterName} (Lv.{player.level} {playerJob})</span>
          <span className={`text-xs px-2.5 py-0.5 rounded border ${ELEMENTS[playerElement].border} ${ELEMENTS[playerElement].color}`}>
            {ELEMENTS[playerElement].icon} 本命：{ELEMENTS[playerElement].name}
          </span>
        </div>
        <div className="flex items-center space-x-4 sm:space-x-6 text-xs sm:text-sm font-semibold">
          <span className="text-rose-400">❤️ HP: {player.hp}/{player.maxHp}</span>
          <span className="text-cyan-400">💧 MP: {player.mp}/{player.maxMp}</span>
          <span className="text-amber-300">💰 金幣: {gold}</span>
        </div>
      </header>

      {/* 頁籤選單 */}
      <nav className="bg-slate-900/60 border-b border-slate-800 flex justify-center space-x-2 p-2">
        {[
          { id: 'BATTLE', label: '⚔️ 戰鬥地圖' },
          { id: 'HEROES', label: `👥 英雄隊伍 (${activeHeroes.length}/4)` },
          { id: 'SAVE', label: '💾 存檔/匯出' }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-amber-600 text-white shadow' : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700'}`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* 主面板內容 */}
      <main className="flex-1 p-4 max-w-6xl w-full mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
        {activeTab === 'BATTLE' && (
          <>
            {/* 左側戰鬥區域 */}
            <div className="md:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-xl">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-bold text-amber-400 text-sm sm:text-base">敵方群體 (當前 {monsters.length} 隻)</h2>
                  {!battleActive && (
                    <button onClick={startNewEncounter} className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all">
                      ⚔️ 尋找野外怪群 (5~15隻)
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5 max-h-64 overflow-y-auto p-1">
                  {monsters.map((m, idx) => (
                    <div 
                      key={m.id}
                      onClick={() => setSelectedMonsterIdx(idx)}
                      className={`p-2.5 rounded-xl border text-center cursor-pointer transition-all ${selectedMonsterIdx === idx ? 'border-amber-400 bg-amber-950/40 ring-1 ring-amber-400' : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'}`}
                    >
                      <div className="text-xs font-bold truncate text-slate-200">{m.name}</div>
                      <div className={`text-[10px] ${ELEMENTS[m.element].color} font-bold mt-0.5`}>
                        {ELEMENTS[m.element].icon} {ELEMENTS[m.element].name}
                      </div>
                      <div className="text-[10px] text-rose-400 mt-1">HP {m.hp}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 戰鬥按鈕組 */}
              <div className="mt-4 pt-4 border-t border-slate-800">
                <div className="grid grid-cols-4 gap-2">
                  <button disabled={!battleActive} onClick={() => handleTurnAction('ATTACK')} className="bg-rose-700 hover:bg-rose-600 disabled:opacity-40 text-white py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow">
                    普通攻擊
                  </button>
                  <button disabled={!battleActive} onClick={() => handleTurnAction('SKILL')} className="bg-cyan-700 hover:bg-cyan-600 disabled:opacity-40 text-white py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow">
                    職業絕學
                  </button>
                  <button disabled={!battleActive} onClick={() => handleTurnAction('HERO_AOE')} className="bg-amber-700 hover:bg-amber-600 disabled:opacity-40 text-white py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow">
                    主僕合擊
                  </button>
                  <button onClick={() => setCombatLogs([])} className="bg-slate-800 text-slate-400 hover:bg-slate-700 py-2.5 rounded-xl text-xs font-bold">
                    清空戰報
                  </button>
                </div>
              </div>
            </div>

            {/* 右側戰況日誌 */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col shadow-xl">
              <h3 className="font-bold text-slate-300 mb-2 border-b border-slate-800 pb-2 text-sm">📜 實時戰況日誌</h3>
              <div className="flex-1 overflow-y-auto space-y-2 text-xs font-mono text-slate-400 max-h-80 p-1">
                {combatLogs.map((log, index) => (
                  <div key={index} className="leading-relaxed border-b border-slate-800/40 pb-1">{log}</div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'HEROES' && (
          <div className="md:col-span-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h2 className="font-bold text-amber-400 mb-4">出戰陣容 (最多 4 位英雄，同名防呆)</h2>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              {activeHeroes.map(hero => (
                <div key={hero.id} className="bg-slate-950 p-4 rounded-xl border border-amber-500/30">
                  <div className="font-bold text-amber-300">{hero.name}</div>
                  <div className="text-xs text-slate-400 mt-1">Tier {hero.tier} • {hero.job}</div>
                  <div className="mt-3 text-xs space-y-1 text-slate-300">
                    <div>❤️ HP: {hero.baseHp}</div>
                    <div>⚔️ ATK: {hero.baseAtk}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'SAVE' && (
          <div className="md:col-span-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <h2 className="font-bold text-amber-400">遊戲存檔與備份管理</h2>
            <div className="flex space-x-2">
              <button onClick={saveGame} className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-xl font-bold text-xs sm:text-sm">
                手動存檔至 LocalStorage
              </button>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">JSON 存檔文字 (導出與備份)</label>
              <textarea 
                value={jsonSaveText} 
                onChange={(e) => setJsonSaveText(e.target.value)} 
                className="w-full h-40 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-emerald-400"
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
