import React from 'react';
import { Sparkles, HelpCircle, Hammer, Gem } from 'lucide-react';
import { MAX_LEVEL, ELEMENTS } from '../data/constants';
import { FORMATIONS_CONFIG } from '../data/formations';
import { HERO_TEMPLATES } from '../data/heroes';
import { GEMS_DB, enrichEquipmentMeta } from '../data/equipment';
import { getPlayerStatScaling, getPlayerCritProfile } from '../utils/combatEngine';

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
  const statScaling = getPlayerStatScaling(player.job);
  const { critRate } = getPlayerCritProfile(player);
  const isWarrior = player.job === '猛將';
  const isArtisan = player.job === '巧匠';
  const isWarlock = player.job === '術士';
  const isMagic = ['術士', '藥師', '風水師'].includes(player.job);

  const statCards = [
    {
      key: 'str',
      label: isWarrior ? '力量 (STR) ★主攻' : isArtisan ? '力量 (STR) ☆副攻' : '力量 (STR)',
      desc: isWarrior
        ? '每點 +3.2 攻擊力（主屬性）'
        : isArtisan
          ? '每點 +1.6 攻擊力（敏力雙修）'
          : '物理筋骨（法系主看智力）',
      val: player.stats.str,
      highlight: isWarrior || isArtisan
    },
    {
      key: 'con',
      label: isWarrior ? '體質 (CON) ★重裝' : '體質 (CON)',
      desc: isWarrior
        ? '每點 +24 HP / +2 防禦（重裝專精）'
        : '每點 +16 HP / +1 防禦',
      val: player.stats.con,
      highlight: isWarrior
    },
    {
      key: 'int',
      label: isMagic ? '智力 (INT) ★主攻' : '智力 (INT)',
      desc: isWarlock
        ? '每點 +3.5 法攻 / +10 MP（主屬性）'
        : isMagic
          ? '每點 +3.2 法攻 / +10 MP（主屬性）'
          : '每點 +10 最大 MP',
      val: player.stats.int,
      highlight: isMagic
    },
    {
      key: 'agi',
      label: isArtisan ? '敏捷 (AGI) ★主攻' : '敏捷 (AGI)',
      desc: isArtisan
        ? '每點 +2.2 攻擊 / +1 速度 / +0.4% 暴擊'
        : '每點 +1 速度 / +0.4% 暴擊率',
      val: player.stats.agi,
      highlight: isArtisan
    }
  ];

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
        <div className="text-xs font-extrabold text-emerald-300 flex items-center justify-between flex-wrap gap-1">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            <span>{classInfo.icon} {player.job}專屬天賦：{classInfo.passiveName}</span>
          </span>
          <span className="text-[11px] bg-slate-950/80 text-amber-300 border border-amber-600/50 px-2.5 py-0.5 rounded-full font-mono">
            輸出係數：{statScaling.primaryLabel}
          </span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">{classInfo.passiveDesc}</p>
      </div>

      <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <span className="text-xs font-bold text-amber-300">📊 主角綜合戰鬥屬性（含職業係數、裝備、陣法與圖鑑加成）</span>
          <span className="text-xs font-mono text-slate-400">
            {player.level >= MAX_LEVEL ? 'EXP: MAX (Lv.30 滿級上限)' : `EXP: ${player.exp} / ${player.maxExp}`}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5 font-mono">
          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-center">
            <div className="text-[11px] text-slate-400">❤️ 最大生命</div>
            <div className="text-sm sm:text-base font-bold text-rose-400 mt-1">{player.hp} / {playerTotalMaxHp}</div>
          </div>
          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-center">
            <div className="text-[11px] text-slate-400">💧 內力 / 資源</div>
            <div className="text-sm sm:text-base font-bold text-cyan-400 mt-1">
              {player.job === '猛將' ? `${player.rage}/100 怒` : player.job === '巧匠' ? `${player.ammo}/${player.maxAmmo} 彈` : `${player.mp}/${playerTotalMaxMp}`}
            </div>
          </div>
          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-center">
            <div className="text-[11px] text-slate-400">{isMagic ? '🔮 法術攻擊' : '⚔️ 總攻擊力'}</div>
            <div className="text-sm sm:text-base font-bold text-amber-300 mt-1">{playerTotalAtk}</div>
          </div>
          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-center">
            <div className="text-[11px] text-slate-400">🛡️ 總防禦力</div>
            <div className="text-sm sm:text-base font-bold text-indigo-300 mt-1">{playerTotalDef}</div>
          </div>
          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-center">
            <div className="text-[11px] text-slate-400">⚡ 行動速度</div>
            <div className="text-sm sm:text-base font-bold text-emerald-300 mt-1">{playerTotalSpeed}</div>
          </div>
          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-center">
            <div className="text-[11px] text-slate-400">💥 暴擊機率</div>
            <div className="text-sm sm:text-base font-bold text-orange-300 mt-1">{Math.round(critRate * 100)}%</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(st => (
          <div
            key={st.key}
            className={`bg-slate-950 p-4 rounded-2xl border space-y-2 text-center ${
              st.highlight ? 'border-amber-500/60 shadow-md shadow-amber-950/20' : 'border-slate-800'
            }`}
          >
            <div className={`text-xs font-bold ${st.highlight ? 'text-amber-300' : 'text-slate-300'}`}>
              {st.label}
            </div>
            <div className="text-2xl font-black font-mono text-slate-100">{st.val}</div>
            <div className="text-[10px] text-slate-400 min-h-[28px] flex items-center justify-center">
              {st.desc}
            </div>
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

const GEM_SHORT_LABELS = {
  gem_ruby: { label: '🔴 紅寶石 +15攻', style: 'border-rose-700/80 bg-rose-950/50 hover:bg-rose-900/70 text-rose-200' },
  gem_sapphire: { label: '🔵 藍寶石 +30內', style: 'border-sky-700/80 bg-sky-950/50 hover:bg-sky-900/70 text-sky-200' },
  gem_emerald: { label: '🟢 翡翠 +80血', style: 'border-emerald-700/80 bg-emerald-950/50 hover:bg-emerald-900/70 text-emerald-200' },
  gem_topaz: { label: '🟡 黃玉 +10防', style: 'border-amber-700/80 bg-amber-950/50 hover:bg-amber-900/70 text-amber-200' }
};

export function ForgeTab({
  player,
  isInCombat,
  equipmentInventory,
  forgeFeedback,
  handleRefineEquipment,
  handleSocketGem,
  setHelpModalTab
}) {
  const allForgeable = [
    ...Object.values(player.equipped).filter(Boolean).map(i => ({ ...i, _isEquipped: true })),
    ...equipmentInventory.map(i => ({ ...i, _isEquipped: false }))
  ];

  return (
    <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur space-y-5 max-w-5xl mx-auto">
      <div className="flex flex-wrap justify-between items-center gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Hammer className="w-5 h-5 text-amber-400" />
          <h2 className="font-extrabold text-amber-400 text-lg">🔨 鐵匠精鍊與四象寶石鑲嵌</h2>
          {setHelpModalTab && (
            <button
              onClick={() => setHelpModalTab('equip')}
              className="text-slate-400 hover:text-amber-300 transition-colors"
              title="查看裝備階級與精鍊規則"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex gap-2 text-xs font-mono font-bold">
          <span className="bg-slate-950 text-amber-300 px-3 py-1 rounded-full border border-slate-800">💰 金幣: {player.gold}</span>
          <span className="bg-slate-950 text-cyan-300 px-3 py-1 rounded-full border border-slate-800">💎 精鍊石: {player.refineStones}</span>
        </div>
      </div>

      <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3.5 text-xs text-slate-300 flex flex-wrap justify-between gap-2">
        <div>
          <span className="text-amber-300 font-bold">⚒️ 精鍊規則：</span>
          每級提升基礎屬性 <span className="text-emerald-300 font-bold">+15%</span>；
          <span className="text-emerald-300 font-bold">+0～+3 成功率 100%</span>，
          <span className="text-rose-300 font-bold">+4 起成功率 65%（失敗精鍊等級 -1 級）</span>。
        </div>
        <div>
          <span className="text-cyan-300 font-bold">💎 鑲嵌規則：</span>
          每孔花費 <span className="text-amber-300 font-mono font-bold">100 金幣</span>，可自由鑲嵌或替換四種寶石。
        </div>
      </div>

      {forgeFeedback && (
        <div
          className={`rounded-2xl p-3.5 border text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md ${
            forgeFeedback.type === 'danger'
              ? 'bg-rose-950/60 border-rose-500/70 text-rose-200'
              : 'bg-emerald-950/60 border-emerald-500/70 text-emerald-200'
          }`}
        >
          <Sparkles className="w-4 h-4 shrink-0 text-amber-300" />
          <span>{forgeFeedback.text}</span>
        </div>
      )}

      {allForgeable.length === 0 ? (
        <div className="text-xs text-slate-500 py-6 text-center">目前身上與背包皆無可精鍊的裝備。</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allForgeable.map(rawItem => {
            const item = enrichEquipmentMeta(rawItem);
            const lvl = item.refineLevel || 0;
            const goldCost = (lvl + 1) * 120;
            const isRisky = lvl >= 4;
            const canRefine = !isInCombat && player.gold >= goldCost && player.refineStones >= 1;

            return (
              <div key={item.uid} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="font-bold text-amber-300 text-sm flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[10px] px-2 py-0.5 rounded border font-bold ${item.tierBadgeStyle}`}>
                        {item.tierTag}
                      </span>
                      <span>{item.name} (+{lvl})</span>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${
                        item._isEquipped
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                          : 'bg-slate-900 text-slate-400 border-slate-700'
                      }`}
                    >
                      {item._isEquipped ? '已穿戴' : '背包中'}
                    </span>
                  </div>

                  <div className="text-xs text-slate-400">{item.desc}</div>

                  <div className="pt-1 space-y-1.5">
                    <div className="flex justify-between items-center text-[11px] font-mono">
                      <span className="text-slate-400">
                        消耗：<span className="text-cyan-300 font-bold">1 精鍊石</span> ＋ <span className="text-amber-300 font-bold">{goldCost} 金幣</span>
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded font-bold border ${
                          isRisky
                            ? 'bg-rose-950/80 text-rose-300 border-rose-700/80'
                            : 'bg-emerald-950/80 text-emerald-300 border-emerald-700/80'
                        }`}
                      >
                        {isRisky ? '⚠️ 成功率 65% (失敗降1級)' : '✅ 成功率 100%'}
                      </span>
                    </div>
                    <button
                      disabled={!canRefine}
                      onClick={() => handleRefineEquipment(rawItem)}
                      className={`w-full py-2.5 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow transition-all ${
                        isRisky ? 'bg-orange-600 hover:bg-orange-500' : 'bg-amber-600 hover:bg-amber-500'
                      }`}
                    >
                      {isInCombat
                        ? '🔒 戰鬥中鎖定'
                        : player.refineStones < 1
                          ? '精鍊石不足'
                          : player.gold < goldCost
                            ? '金幣不足'
                            : `🔨 強化精鍊至 +${lvl + 1}`}
                    </button>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-slate-800/80 space-y-2">
                  <div className="text-[11px] text-slate-400 flex items-center justify-between">
                    <span className="flex items-center gap-1 font-bold text-cyan-300">
                      <Gem className="w-3.5 h-3.5" />
                      <span>寶石插槽 ({item.sockets?.length || 0} 孔)</span>
                    </span>
                    {item.sockets?.length > 0 && (
                      <span className="text-[10px] text-slate-500 font-mono">每次鑲嵌/替換 100 金幣</span>
                    )}
                  </div>

                  {!item.sockets || item.sockets.length === 0 ? (
                    <div className="text-[11px] text-slate-600 italic bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800/60">
                      此階裝備無寶石插槽（Tier 2 以上名器附帶插槽）
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {item.sockets.map((gem, sIdx) => (
                        <div key={sIdx} className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 space-y-1.5">
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="text-slate-400 font-bold">第 {sIdx + 1} 孔狀態：</span>
                            {gem ? (
                              <span className="text-amber-300 font-bold bg-amber-950/60 border border-amber-700/60 px-2 py-0.5 rounded">
                                💠 {gem.name}
                              </span>
                            ) : (
                              <span className="text-slate-500 italic">空插槽</span>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-1.5">
                            {GEMS_DB.map(gOption => {
                              const shortMeta = GEM_SHORT_LABELS[gOption.id] || { label: gOption.name, style: 'border-slate-700 bg-slate-800 text-slate-200' };
                              const isSameGem = gem?.id === gOption.id;
                              const disabled = isInCombat || isSameGem || player.gold < 100;
                              return (
                                <button
                                  key={gOption.id}
                                  disabled={disabled}
                                  onClick={() => handleSocketGem(rawItem, gOption, sIdx)}
                                  className={`px-2 py-1 rounded-lg border text-[10px] font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed text-left truncate ${shortMeta.style}`}
                                >
                                  {isSameGem ? '✓ 已鑲嵌' : `${gem ? '換' : '+'}${shortMeta.label}`}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
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
  towerBestFloor,
  isInCombat,
  autoTower,
  handleToggleAutoTower,
  handleStartTowerChallenge
}) {
  const isBossFloor = towerFloor % 5 === 0;
  const nextBossFloor = Math.ceil(towerFloor / 5) * 5;
  const expectedTierText =
    towerFloor >= 20 ? 'Tier 4 靈寶 ～ Tier 5 仙器' :
    towerFloor >= 11 ? 'Tier 3 玄鐵 ～ Tier 4 靈寶' :
    towerFloor >= 5 ? 'Tier 2 精鋼 ～ Tier 3 玄鐵' : 'Tier 1 凡鐵 ～ Tier 2 精鋼';

  return (
    <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur space-y-5 max-w-2xl mx-auto">
      <div className="flex flex-wrap justify-between items-center gap-2 border-b border-slate-800 pb-4">
        <div>
          <h2 className="font-extrabold text-amber-400 text-xl">🗼 鎮魔塔試煉（目前：第 {towerFloor} 層）</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            實際擊敗本層守衛後方可晉升下一層；每 5 層鎮守首領必掉高階神兵！
          </p>
        </div>
        <span className="text-xs font-mono font-bold bg-slate-950 text-emerald-300 border border-emerald-700/60 px-3 py-1.5 rounded-full">
          🏆 最高通關紀錄：第 {Math.max(0, towerBestFloor - 1)} 層
        </span>
      </div>

      <div className={`p-5 rounded-2xl border space-y-2.5 ${
        isBossFloor
          ? 'bg-rose-950/30 border-rose-600/80'
          : 'bg-slate-950/90 border-slate-800'
      }`}>
        <div className="flex items-center justify-between">
          <span className={`text-sm font-extrabold ${isBossFloor ? 'text-rose-300' : 'text-amber-300'}`}>
            {isBossFloor
              ? `🔥 第 ${towerFloor} 層・鎮守妖王首領戰（BOSS）`
              : `⚔️ 第 ${towerFloor} 層・鎮魔塔守衛戰（距離首領層：第 ${nextBossFloor} 層）`}
          </span>
          <span className="text-[11px] font-mono bg-slate-900 text-slate-300 px-2.5 py-0.5 rounded border border-slate-700">
            難度倍率 ×{(1.2 * (1 + (towerFloor - 1) * 0.25)).toFixed(1)}
          </span>
        </div>

        <div className="text-xs text-slate-300 space-y-1 leading-relaxed">
          <div>• 產出裝備階級：<span className="text-amber-300 font-bold">{expectedTierText}</span></div>
          <div>
            • 通關獎勵：
            {isBossFloor
              ? <span className="text-emerald-300 font-bold">100% 必掉高階神裝 ＋ 100% 必掉技能卡 ＋ 額外 {2 + Math.floor(towerFloor / 5)} 顆精鍊石</span>
              : <span>35% 機率掉落裝備、40% 機率掉落技能卡，並解鎖第 {towerFloor + 1} 層</span>}
          </div>
        </div>
      </div>

      {/* 操作按鈕區：挑戰按鈕 + 自動爬塔開關 */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
        <button
          disabled={isInCombat}
          onClick={handleStartTowerChallenge}
          className={`px-7 py-3.5 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-black rounded-2xl text-sm shadow-xl transition-all ${
            isBossFloor
              ? 'bg-gradient-to-r from-rose-700 to-amber-600 hover:from-rose-600 hover:to-amber-500'
              : 'bg-amber-600 hover:bg-amber-500'
          }`}
        >
          {isInCombat
            ? '🔒 戰鬥進行中'
            : isBossFloor
              ? `🔥 迎戰第 ${towerFloor} 層鎮守首領`
              : `⚔️ 挑戰第 ${towerFloor} 層守衛`}
        </button>

        <button
          type="button"
          onClick={handleToggleAutoTower}
          className={`px-5 py-3.5 rounded-2xl font-black text-sm border transition-all flex items-center gap-2 ${
            autoTower
              ? 'bg-cyan-500 border-cyan-300 text-slate-950 shadow-lg shadow-cyan-500/25'
              : 'bg-slate-950 border-slate-700 text-slate-300 hover:border-cyan-500'
          }`}
        >
          <span>{autoTower ? '🤖 自動爬塔：開啟中' : '🤖 自動爬塔：關閉'}</span>
        </button>
      </div>

      {autoTower && (
        <div className="text-center text-xs text-cyan-300 bg-cyan-950/40 border border-cyan-800/70 rounded-xl py-2 px-3">
          ⚡ 自動爬塔已啟動：點擊挑戰後將自動託管戰鬥，每層勝利短暫結算後自動進入下一層！
        </div>
      )}
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
