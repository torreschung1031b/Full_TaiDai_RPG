import React from 'react';
import { Sparkles, HelpCircle } from 'lucide-react';
import { MAX_LEVEL, ELEMENTS } from '../data/constants';
import { FORMATIONS_CONFIG } from '../data/formations';
import { SKILL_CARDS_DB, createSkillCardInstance } from '../data/skillCards';
import { HERO_TEMPLATES } from '../data/heroes';
import { GEMS_DB } from '../data/equipment';

export const CODEX_MILESTONES = [
  { count: 3, label: '初窺門徑（3 位）', bonusText: '主角攻擊力 +5%', atkPct: 0.05, hpPct: 0, defPct: 0, speedPct: 0 },
  { count: 6, label: '群英薈萃（6 位）', bonusText: '主角最大生命 +8%', atkPct: 0, hpPct: 0.08, defPct: 0, speedPct: 0 },
  { count: 10, label: '名震江湖（10 位）', bonusText: '主角防禦力 +8%', atkPct: 0, hpPct: 0, defPct: 0.08, speedPct: 0 },
  { count: 15, label: '天下歸心（15 位）', bonusText: '主角攻擊再 +5%・速度 +8%', atkPct: 0.05, hpPct: 0, defPct: 0, speedPct: 0.08 }
];

export function calculateCodexBonus(heroRoster = []) {
  const uniqueUnlocked = HERO_TEMPLATES.filter(tmp =>
    heroRoster.some(h => h.baseId === tmp.id_base)
  ).length;

  let atkPct = 0;
  let hpPct = 0;
  let defPct = 0;
  let speedPct = 0;

  CODEX_MILESTONES.forEach(m => {
    if (uniqueUnlocked >= m.count) {
      atkPct += m.atkPct;
      hpPct += m.hpPct;
      defPct += m.defPct;
      speedPct += m.speedPct;
    }
  });

  return {
    unlockedCount: uniqueUnlocked,
    totalCount: HERO_TEMPLATES.length,
    atkPct,
    hpPct,
    defPct,
    speedPct
  };
}

export function CharacterTab({
  player,
  setPlayer,
  classInfo,
  playerTotalMaxHp,
  playerTotalMaxMp,
  playerTotalAtk,
  playerTotalDef,
  playerTotalSpeed
}) {
  return (
    <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-wrap justify-between items-center gap-3 border-b border-slate-800 pb-4">
        <div>
          <h2 className="font-extrabold text-amber-400 text-lg">👤 少俠完整屬性與配點</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {player.name} • Lv.{player.level} / {MAX_LEVEL} {player.job} • {ELEMENTS[player.element]?.icon} {player.element}本命
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs bg-slate-950 text-amber-300 font-mono font-bold px-3 py-1.5 rounded-full border border-slate-800">
            💰 金幣: {player.gold}
          </span>
          <span className="text-xs bg-slate-950 text-cyan-300 font-mono font-bold px-3 py-1.5 rounded-full border border-slate-800">
            💎 精鍊石: {player.refineStones}
          </span>
          <span className="text-xs bg-amber-500/20 text-amber-300 font-mono font-bold px-3.5 py-1.5 rounded-full border border-amber-500/40">
            可分配屬性點: {player.statPoints} Pts
          </span>
        </div>
      </div>

      <div className="bg-emerald-950/30 border border-emerald-700/60 rounded-2xl p-4 space-y-1">
        <div className="text-xs font-extrabold text-emerald-300 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4" />
          <span>{classInfo.icon} {player.job}專屬天賦：{classInfo.passiveName}</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">{classInfo.passiveDesc}</p>
      </div>

      <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-amber-300">📊 主角綜合戰鬥屬性（含裝備、陣法與圖鑑加成）</span>
          <span className="text-xs font-mono text-slate-400">
            {player.level >= MAX_LEVEL ? 'EXP: MAX (Lv.30 滿級上限)' : `EXP: ${player.exp} / ${player.maxExp}`}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono">
          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-center">
            <div className="text-[11px] text-slate-400">❤️ 最大生命</div>
            <div className="text-base font-bold text-rose-400 mt-1">{player.hp} / {playerTotalMaxHp}</div>
          </div>
          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-center">
            <div className="text-[11px] text-slate-400">💧 內力 / 資源</div>
            <div className="text-base font-bold text-cyan-400 mt-1">
              {player.job === '猛將' ? `${player.rage}/100 怒` : player.job === '巧匠' ? `${player.ammo}/${player.maxAmmo} 彈` : `${player.mp}/${playerTotalMaxMp}`}
            </div>
          </div>
          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-center">
            <div className="text-[11px] text-slate-400">⚔️ 總攻擊力</div>
            <div className="text-base font-bold text-amber-300 mt-1">{playerTotalAtk}</div>
          </div>
          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-center">
            <div className="text-[11px] text-slate-400">🛡️ 總防禦力</div>
            <div className="text-base font-bold text-indigo-300 mt-1">{playerTotalDef}</div>
          </div>
          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-center col-span-2 sm:col-span-1">
            <div className="text-[11px] text-slate-400">⚡ 行動速度</div>
            <div className="text-base font-bold text-emerald-300 mt-1">{playerTotalSpeed}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { key: 'str', label: '力量 (STR)', desc: '每點 +3 攻擊力', val: player.stats.str },
          { key: 'con', label: '體質 (CON)', desc: '每點 +16 HP / +1 防禦', val: player.stats.con },
          { key: 'int', label: '智慧 (INT)', desc: '每點 +10 最大 MP', val: player.stats.int },
          { key: 'agi', label: '敏捷 (AGI)', desc: '每點 +1 行動速度', val: player.stats.agi }
        ].map(st => (
          <div key={st.key} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-center">
            <div className="text-xs font-bold text-amber-300">{st.label}</div>
            <div className="text-2xl font-black font-mono text-slate-100">{st.val}</div>
            <div className="text-[10px] text-slate-400">{st.desc}</div>
            <button
              onClick={() => {
                if (player.statPoints > 0) {
                  setPlayer(p => ({ ...p, statPoints: p.statPoints - 1, stats: { ...p.stats, [st.key]: p.stats[st.key] + 1 } }));
                }
              }}
              disabled={player.statPoints <= 0}
              className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs disabled:opacity-40 transition-all"
            >
              +1 提升屬性
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ForgeTab({
  player,
  isInCombat,
  equipmentInventory,
  handleRefineEquipment,
  handleSocketGem
}) {
  const allForgeable = [
    ...Object.values(player.equipped).filter(Boolean).map(i => ({ ...i, _isEquipped: true })),
    ...equipmentInventory.map(i => ({ ...i, _isEquipped: false }))
  ];

  return (
    <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur space-y-4 max-w-5xl mx-auto">
      <div className="flex flex-wrap justify-between items-center gap-2 border-b border-slate-800 pb-3">
        <h2 className="font-extrabold text-amber-400 text-lg">🔨 鐵匠精鍊與寶石鑲嵌</h2>
        <div className="flex gap-2 text-xs font-mono font-bold">
          <span className="bg-slate-950 text-amber-300 px-3 py-1 rounded-full border border-slate-800">💰 金幣: {player.gold}</span>
          <span className="bg-slate-950 text-cyan-300 px-3 py-1 rounded-full border border-slate-800">💎 精鍊石: {player.refineStones}</span>
        </div>
      </div>

      {allForgeable.length === 0 ? (
        <div className="text-xs text-slate-500 py-6 text-center">目前身上與背包皆無可精鍊的裝備。</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {allForgeable.map(item => (
            <div key={item.uid} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="font-bold text-amber-300 text-sm flex items-center justify-between">
                <span>{item.name} (+{item.refineLevel || 0})</span>
                {item._isEquipped && (
                  <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-700 px-2 py-0.5 rounded-full">
                    已穿戴
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-400">{item.desc}</div>
              <button
                disabled={isInCombat}
                onClick={() => handleRefineEquipment(item)}
                className="w-full py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow"
              >
                {isInCombat ? '🔒 戰鬥中鎖定' : `精鍊裝備 (需要 1 精鍊石 & ${(item.refineLevel || 0) * 120 + 120} 金幣)`}
              </button>
              {item.sockets && item.sockets.length > 0 && (
                <div className="pt-2 border-t border-slate-800 space-y-1.5">
                  <div className="text-[11px] text-slate-400">寶石插槽：</div>
                  <div className="flex flex-wrap gap-1.5">
                    {item.sockets.map((gem, sIdx) => (
                      <div key={sIdx} className="text-[10px] bg-slate-900 px-2 py-1 rounded border border-slate-700">
                        {gem ? gem.name : (
                          <button
                            disabled={isInCombat}
                            onClick={() => handleSocketGem(item, GEMS_DB[0], sIdx)}
                            className="text-cyan-400 hover:underline disabled:text-slate-500 disabled:no-underline"
                          >
                            {isInCombat ? '🔒 鎖定' : '+ 鑲嵌紅寶石'}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function FormationsTab({
  isFengShui,
  isInCombat,
  currentFormation,
  handleSelectFormation,
  setHelpModalTab
}) {
  return (
    <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur space-y-4 max-w-4xl mx-auto">
      <div className="flex flex-wrap justify-between items-center gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div>
            <h2 className="font-extrabold text-amber-400 text-lg">☯️ 陣法與五行機制</h2>
            <p className="text-xs text-slate-400 mt-0.5">五行相剋：金剋木 → 木剋土 → 土剋水 → 水剋火 → 火剋金</p>
          </div>
          <button
            onClick={() => setHelpModalTab('elements')}
            className="text-slate-400 hover:text-amber-300 transition-colors"
            title="查看五行相剋與狀態說明"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
        {!isFengShui ? (
          <span className="text-xs bg-rose-950 text-rose-300 border border-rose-700 px-3 py-1 rounded-full font-bold">
            🔒 僅限「風水師」職業可變換陣法
          </span>
        ) : isInCombat ? (
          <span className="text-xs text-rose-400 font-bold">🔒 戰鬥中鎖定陣法切換</span>
        ) : (
          <span className="text-xs bg-emerald-950 text-emerald-300 border border-emerald-700 px-3 py-1 rounded-full font-bold">
            ✨ 【奇門陣眼】啟動：所有陣法增益 2 倍強化！
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Object.keys(FORMATIONS_CONFIG).map(fKey => {
          const canClick = isFengShui && !isInCombat;
          const isSelected = currentFormation === fKey;
          return (
            <div
              key={fKey}
              onClick={() => handleSelectFormation(fKey)}
              className={`p-4 rounded-2xl border transition-all ${
                canClick ? 'cursor-pointer hover:border-amber-500/60' : 'cursor-not-allowed opacity-65'
              } ${
                isSelected ? 'bg-amber-950/40 border-amber-400 ring-1 ring-amber-400' : 'bg-slate-950 border-slate-800'
              }`}
            >
              <div className="font-bold text-amber-300 text-sm flex justify-between items-center">
                <span>{FORMATIONS_CONFIG[fKey].icon} {FORMATIONS_CONFIG[fKey].name}</span>
                {!isFengShui && fKey !== 'none' && (
                  <span className="text-[10px] text-rose-400 font-bold">🔒 限風水師</span>
                )}
              </div>
              <div className="text-xs text-slate-400 mt-1">{FORMATIONS_CONFIG[fKey].desc}</div>
              {isFengShui && fKey !== 'none' && (
                <div className="text-[11px] text-emerald-400 font-bold mt-1.5">
                  ☯️ 風水師倍增生效中：所有陣法加成數值 ×2！
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function TowerTab({
  towerFloor,
  setTowerFloor,
  isInCombat,
  setSkillCardsInventory,
  spawnEncounter,
  setActiveTab
}) {
  return (
    <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur text-center space-y-4 max-w-xl mx-auto">
      <h2 className="font-extrabold text-amber-400 text-xl">🗼 鎮魔塔挑戰 (目前: 第 {towerFloor} 層)</h2>
      <p className="text-xs text-slate-400">挑戰鎮魔塔守衛可贏取稀有英雄技能卡與精鍊石！</p>
      <div className="flex justify-center gap-3">
        <button
          disabled={isInCombat}
          onClick={() => {
            setTowerFloor(prev => prev + 1);
            const randTemplate = SKILL_CARDS_DB[Math.floor(Math.random() * SKILL_CARDS_DB.length)];
            setSkillCardsInventory(prev => [...prev, createSkillCardInstance(randTemplate)]);
            spawnEncounter(3);
            setActiveTab('combat');
          }}
          className="px-6 py-3 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold rounded-2xl text-sm shadow-lg"
        >
          {isInCombat ? '🔒 戰鬥進行中' : '⚔️ 挑戰本層並進入戰鬥'}
        </button>
      </div>
    </div>
  );
}

export function CodexTab({ heroRoster }) {
  const codexBonus = calculateCodexBonus(heroRoster);
  const pct = Math.min(100, Math.round((codexBonus.unlockedCount / Math.max(1, codexBonus.totalCount)) * 100));

  return (
    <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur space-y-5 max-w-4xl mx-auto">
      <div className="flex flex-wrap justify-between items-center gap-2 border-b border-slate-800 pb-3">
        <div>
          <h2 className="font-extrabold text-amber-400 text-lg">📖 天外英雄大圖鑑</h2>
          <p className="text-xs text-slate-400 mt-0.5">收錄不同英雄即可永久解鎖主角全屬性里程碑加成</p>
        </div>
        <span className="text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3.5 py-1.5 rounded-full">
          圖鑑收錄進度：{codexBonus.unlockedCount} / {codexBonus.totalCount} ({pct}%)
        </span>
      </div>

      {/* 收錄進度條與里程碑 */}
      <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
          <div className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {CODEX_MILESTONES.map(m => {
            const achieved = codexBonus.unlockedCount >= m.count;
            return (
              <div
                key={m.count}
                className={`px-3 py-2 rounded-xl border flex items-center justify-between ${
                  achieved
                    ? 'bg-emerald-950/40 border-emerald-600/60 text-emerald-300 font-bold'
                    : 'bg-slate-900/60 border-slate-800 text-slate-500'
                }`}
              >
                <span>{achieved ? '✅' : '🔒'} {m.label}</span>
                <span>{m.bonusText}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {HERO_TEMPLATES.map(tmp => {
          const unlocked = heroRoster.some(h => h.baseId === tmp.id_base);
          return (
            <div key={tmp.id_base} className={`p-3 rounded-2xl border text-xs ${unlocked ? 'bg-slate-950 border-amber-400 text-amber-300 font-bold' : 'bg-slate-950/40 opacity-40 border-slate-800'}`}>
              {tmp.icon} {unlocked ? tmp.name : '???'} (Tier {tmp.tier} • {tmp.heroClass})
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function SaveLoadTab({
  isInCombat,
  saveLoadStatus,
  jsonSaveText,
  setJsonSaveText,
  handleExportSave,
  handleImportSave,
  handleResetSave
}) {
  return (
    <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 space-y-4 shadow-2xl backdrop-blur max-w-4xl mx-auto">
      <h2 className="font-extrabold text-amber-400 text-lg">💾 存檔管理與 JSON 導出</h2>
      <div className="flex flex-wrap gap-3">
        <button onClick={handleExportSave} className="bg-amber-600 hover:bg-amber-500 text-white px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm">
          匯出 JSON 存檔
        </button>
        <button
          disabled={isInCombat}
          onClick={handleImportSave}
          className="bg-cyan-700 hover:bg-cyan-600 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm"
        >
          {isInCombat ? '🔒 戰鬥中鎖定讀檔' : '讀取 JSON 存檔'}
        </button>
        <button onClick={handleResetSave} className="bg-rose-800 hover:bg-rose-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm ml-auto">
          重置所有紀錄
        </button>
      </div>
      {saveLoadStatus && <div className="text-xs text-emerald-400 font-mono">{saveLoadStatus}</div>}
      <textarea
        value={jsonSaveText}
        onChange={(e) => setJsonSaveText(e.target.value)}
        className="w-full h-44 bg-slate-950/90 border border-slate-800 rounded-2xl p-4 text-xs font-mono text-emerald-400 focus:outline-none focus:border-amber-500"
      />
    </div>
  );
}
