import React, { useState, useMemo } from 'react';
import { Sparkles, RotateCcw, Check, Target, Sliders } from 'lucide-react';
import { MAX_LEVEL, ELEMENTS } from '../../data/constants';
import { getActiveSetBonuses } from '../../data/equipment';
import { getPlayerStatScaling, getPlayerCritProfile } from '../../utils/combatEngine';

const BASE_INITIAL_STAT = 10;
const STAT_KEYS = ['str', 'con', 'int', 'agi'];
const STAT_LABELS = { str: '力量', con: '體質', int: '智力', agi: '敏捷' };

const RECOMMENDED_RATIOS = {
  '猛將': { str: 0.7, con: 0.3 },
  '巧匠': { agi: 0.75, str: 0.25 },
  default: { int: 0.85, agi: 0.15 }
};

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
  const [draftAlloc, setDraftAlloc] = useState({ str: 0, con: 0, int: 0, agi: 0 });
  const [allocFeedback, setAllocFeedback] = useState(null);

  const statScaling = getPlayerStatScaling(player.job);
  const { critRate } = getPlayerCritProfile(player);
  const activeSets = useMemo(() => getActiveSetBonuses(player.equipped), [player.equipped]);

  const isWarrior = player.job === '猛將';
  const isArtisan = player.job === '巧匠';
  const isWarlock = player.job === '術士';
  const isMagic = ['術士', '藥師', '風水師'].includes(player.job);

  const totalDraftUsed = STAT_KEYS.reduce((sum, k) => sum + draftAlloc[k], 0);
  const safeDraft = totalDraftUsed <= player.statPoints ? draftAlloc : { str: 0, con: 0, int: 0, agi: 0 };
  const activeDraftSum = STAT_KEYS.reduce((sum, k) => sum + safeDraft[k], 0);
  const remainingPoints = Math.max(0, player.statPoints - activeDraftSum);

  const previewMetrics = useMemo(() => {
    const calcDelta = (baseVal, totalVal, rawDelta) => {
      if (activeDraftSum <= 0 || rawDelta <= 0) return { next: totalVal, delta: 0 };
      const mult = Math.max(1, totalVal / Math.max(1, baseVal));
      const next = Math.max(totalVal, Math.round(totalVal + rawDelta * mult));
      return { next, delta: next - totalVal };
    };

    const previewStats = Object.fromEntries(STAT_KEYS.map(k => [k, player.stats[k] + safeDraft[k]]));
    const hp = calcDelta(player.maxHp + player.stats.con * statScaling.conHp, playerTotalMaxHp, safeDraft.con * statScaling.conHp);
    const mp = calcDelta(player.maxMp + player.stats.int * 10, playerTotalMaxMp, safeDraft.int * 10);
    const atk = calcDelta(
      player.atk + statScaling.calcStatAtk(player.stats),
      playerTotalAtk,
      statScaling.calcStatAtk(previewStats) - statScaling.calcStatAtk(player.stats)
    );
    const def = calcDelta(player.def + player.stats.con * statScaling.conDef, playerTotalDef, safeDraft.con * statScaling.conDef);
    const spd = calcDelta(player.speed + player.stats.agi, playerTotalSpeed, safeDraft.agi);

    const previewCrit = Math.round(getPlayerCritProfile({ ...player, stats: previewStats }).critRate * 100);
    const currCrit = Math.round(critRate * 100);

    return { hp, mp, atk, def, spd, crit: { next: previewCrit, delta: previewCrit - currCrit } };
  }, [player, safeDraft, activeDraftSum, statScaling, playerTotalMaxHp, playerTotalMaxMp, playerTotalAtk, playerTotalDef, playerTotalSpeed, critRate]);

  const adjustDraft = (key, delta) => {
    setAllocFeedback(null);
    setDraftAlloc(prev => {
      const curRem = Math.max(0, player.statPoints - STAT_KEYS.reduce((s, k) => s + prev[k], 0));
      const change = delta > 0 ? Math.min(delta, curRem) : -Math.min(Math.abs(delta), prev[key]);
      return change === 0 ? prev : { ...prev, [key]: prev[key] + change };
    });
  };

  const handleApplyRecommended = () => {
    if (player.statPoints <= 0) return;
    setAllocFeedback(null);
    const entries = Object.entries(RECOMMENDED_RATIOS[player.job] || RECOMMENDED_RATIOS.default);
    const [[pKey, pRatio], [sKey]] = entries;
    const primaryPts = Math.ceil(player.statPoints * pRatio);
    setDraftAlloc({ str: 0, con: 0, int: 0, agi: 0, [pKey]: primaryPts, [sKey]: player.statPoints - primaryPts });
  };

  const handleConfirmAllocation = () => {
    if (activeDraftSum <= 0 || activeDraftSum > player.statPoints) return;
    const parts = STAT_KEYS.filter(k => safeDraft[k] > 0).map(k => `${STAT_LABELS[k]} +${safeDraft[k]}`);

    setPlayer(p => ({
      ...p,
      statPoints: p.statPoints - activeDraftSum,
      stats: Object.fromEntries(STAT_KEYS.map(k => [k, p.stats[k] + safeDraft[k]]))
    }));
    setDraftAlloc({ str: 0, con: 0, int: 0, agi: 0 });
    setAllocFeedback({ type: 'success', text: `✨ 屬性配點完成！【${parts.join('、')}】已永久融入奇經八脈！` });
  };

  const investedPoints = STAT_KEYS.reduce((sum, k) => sum + Math.max(0, player.stats[k] - BASE_INITIAL_STAT), 0);
  const respecGoldCost = Math.max(50, (player.level || 1) * 50);

  const handleRespecStats = () => {
    if (investedPoints <= 0) return;
    if (player.gold < respecGoldCost) {
      return setAllocFeedback({ type: 'danger', text: `⚠️ 金幣不足！洗點重配需要 ${respecGoldCost} 金幣。` });
    }
    if (!window.confirm(`確定花費 ${respecGoldCost} 金幣洗髓重配嗎？將退還全部 ${investedPoints} 點已投入的屬性點！`)) return;

    setPlayer(p => ({
      ...p,
      gold: p.gold - respecGoldCost,
      statPoints: p.statPoints + investedPoints,
      stats: { str: BASE_INITIAL_STAT, con: BASE_INITIAL_STAT, int: BASE_INITIAL_STAT, agi: BASE_INITIAL_STAT }
    }));
    setDraftAlloc({ str: 0, con: 0, int: 0, agi: 0 });
    setAllocFeedback({ type: 'success', text: `🔄 洗髓易筋完成！已退還 ${investedPoints} 點可分配屬性點！` });
  };

  const summaryBoxes = [
    { label: '❤️ 最大生命', val: `${player.hp} / ${previewMetrics.hp.next}`, delta: previewMetrics.hp.delta, color: 'text-rose-400' },
    {
      label: '💧 內力 / 資源',
      val: isWarrior ? `${player.rage}/100 怒` : isArtisan ? `${player.ammo}/${player.maxAmmo} 彈` : `${player.mp}/${previewMetrics.mp.next}`,
      delta: !['猛將', '巧匠'].includes(player.job) ? previewMetrics.mp.delta : 0,
      color: 'text-cyan-400'
    },
    { label: isMagic ? '🔮 法術攻擊' : '⚔️ 總攻擊力', val: previewMetrics.atk.next, delta: previewMetrics.atk.delta, color: 'text-amber-300' },
    { label: '🛡️ 總防禦力', val: previewMetrics.def.next, delta: previewMetrics.def.delta, color: 'text-indigo-300' },
    { label: '⚡ 行動速度', val: previewMetrics.spd.next, delta: previewMetrics.spd.delta, color: 'text-emerald-300' },
    { label: '💥 暴擊機率', val: `${previewMetrics.crit.next}%`, delta: previewMetrics.crit.delta, suffix: '%', color: 'text-orange-300' }
  ];

  const totalStatsSum = STAT_KEYS.reduce((s, k) => s + player.stats[k], 0) + activeDraftSum;

  const statCards = [
    {
      key: 'str', icon: '💪', title: '力量 (STR)',
      roleTag: isWarrior ? '★ 核心主攻' : isArtisan ? '☆ 副修物理' : null,
      desc: isWarrior ? '每點 +3.2 物理攻擊（重兵主屬性）' : isArtisan ? '每點 +1.6 物理攻擊（敏力雙修）' : '提升基礎物理筋骨（法系主看智力）',
      barColor: 'bg-rose-500', highlight: isWarrior || isArtisan
    },
    {
      key: 'con', icon: '🫀', title: '體質 (CON)',
      roleTag: isWarrior ? '★ 重裝生存' : '☆ 生存氣血',
      desc: isWarrior ? '每點 +24 生命 / +2 防禦（重裝專精）' : '每點 +16 生命 / +1 防禦',
      barColor: 'bg-emerald-500', highlight: isWarrior
    },
    {
      key: 'int', icon: '🧠', title: '智力 (INT)',
      roleTag: isMagic ? '★ 核心法攻' : null,
      desc: isWarlock ? '每點 +3.5 法攻 / +10 真元（術法核心）' : isMagic ? '每點 +3.2 法攻 / +10 真元（主屬性）' : '每點 +10 最大真元上限',
      barColor: 'bg-cyan-500', highlight: isMagic
    },
    {
      key: 'agi', icon: '⚡', title: '敏捷 (AGI)',
      roleTag: isArtisan ? '★ 核心疾速' : '☆ 先手暴擊',
      desc: isArtisan ? '每點 +2.2 攻擊 / +1 速度 / +0.4% 暴擊' : '每點 +1 行動速度 / +0.4% 暴擊率',
      barColor: 'bg-amber-400', highlight: isArtisan
    }
  ];

  return (
    <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-wrap justify-between items-center gap-3 border-b border-slate-800 pb-4">
        <div>
          <h2 className="font-extrabold text-amber-400 text-lg">👤 少俠根骨與屬性配點</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {player.name} • Lv.{player.level} / {MAX_LEVEL} {player.job} • {ELEMENTS[player.element]?.icon} {player.element}本命
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs bg-slate-950 text-amber-300 font-mono font-bold px-3 py-1.5 rounded-full border border-slate-800">💰 金幣: {player.gold}</span>
          <span className="text-xs bg-slate-950 text-cyan-300 font-mono font-bold px-3 py-1.5 rounded-full border border-slate-800">💎 精鍊石: {player.refineStones}</span>
          <span className={`text-xs font-mono font-black px-3.5 py-1.5 rounded-full border transition-all ${remainingPoints > 0 ? 'bg-amber-500/25 text-amber-300 border-amber-400 shadow-sm shadow-amber-500/20' : 'bg-slate-950 text-slate-400 border-slate-800'}`}>
            剩餘可配點數: {remainingPoints} Pts
          </span>
        </div>
      </div>

      {/* 職業專屬天賦 */}
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

      {/* 套裝共鳴狀態列 */}
      {activeSets.length > 0 && (
        <div className="bg-amber-950/25 border border-amber-500/45 rounded-2xl p-4 space-y-2.5">
          <div className="text-xs font-extrabold text-amber-300">🔮 目前神兵套裝共鳴</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {activeSets.map(s => (
              <div key={s.setId} className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-amber-300">【{s.name}】</span>
                  <span className={`font-mono px-2 py-0.5 rounded ${s.hasAnyUnlocked ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'bg-slate-900 text-slate-400'}`}>
                    已穿戴 {s.count} / {s.maxPieces} 件
                  </span>
                </div>
                <div className="space-y-1 text-[11px]">
                  {s.tiers.map(t => (
                    <div key={t.pieces} className={t.unlocked ? 'text-emerald-300 font-bold' : 'text-slate-500'}>
                      {t.unlocked ? '✅' : '⬜'} ({t.pieces}件套) {t.desc}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 綜合戰鬥屬性面板 */}
      <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
            <span>📊 主角綜合戰鬥面板</span>
            {activeDraftSum > 0 && (
              <span className="text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 px-2 py-0.5 rounded-full font-bold">
                正在預覽 +{activeDraftSum} 點配點效果
              </span>
            )}
          </span>
          <span className="text-xs font-mono text-slate-400">
            {player.level >= MAX_LEVEL ? 'EXP: MAX (Lv.30 滿級上限)' : `EXP: ${player.exp} / ${player.maxExp}`}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 font-mono">
          {summaryBoxes.map(box => (
            <div key={box.label} className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-center">
              <div className="text-[11px] text-slate-400">{box.label}</div>
              <div className={`text-sm font-bold ${box.color} mt-1`}>{box.val}</div>
              {box.delta > 0 && (
                <div className="text-[11px] font-black text-emerald-400 mt-0.5">(+{box.delta}{box.suffix || ''})</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 配點快捷操作列 */}
      <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mr-1">
            <Sliders className="w-4 h-4 text-amber-400" />
            <span>四維根骨配點：</span>
          </span>
          <button
            type="button"
            disabled={player.statPoints <= 0}
            onClick={handleApplyRecommended}
            className="px-3.5 py-1.5 rounded-xl font-bold text-xs bg-indigo-950 hover:bg-indigo-900 text-indigo-200 border border-indigo-600/70 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition-all"
          >
            <Target className="w-3.5 h-3.5 text-amber-300" />
            <span>🎯 {player.job}一鍵推薦配點</span>
          </button>
          {investedPoints > 0 && (
            <button
              type="button"
              onClick={handleRespecStats}
              className="px-3 py-1.5 rounded-xl font-bold text-xs bg-rose-950/60 hover:bg-rose-900/80 text-rose-200 border border-rose-800/70 flex items-center gap-1.5 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>洗點重配 ({respecGoldCost} 金)</span>
            </button>
          )}
        </div>

        {activeDraftSum > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={() => setDraftAlloc({ str: 0, con: 0, int: 0, agi: 0 })}
              className="px-3.5 py-2 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
            >
              取消重設
            </button>
            <button
              type="button"
              onClick={handleConfirmAllocation}
              className="px-5 py-2 rounded-xl font-black text-xs bg-gradient-to-r from-emerald-600 to-amber-600 hover:from-emerald-500 hover:to-amber-500 text-white shadow-lg flex items-center gap-1.5 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>確認分配 ({activeDraftSum} 點)</span>
            </button>
          </div>
        )}
      </div>

      {allocFeedback && (
        <div className={`rounded-2xl p-3 border text-xs font-bold flex items-center gap-2 ${allocFeedback.type === 'danger' ? 'bg-rose-950/60 border-rose-500/70 text-rose-200' : 'bg-emerald-950/60 border-emerald-500/70 text-emerald-200'}`}>
          <Sparkles className="w-4 h-4 shrink-0 text-amber-300" />
          <span>{allocFeedback.text}</span>
        </div>
      )}

      {/* 四維屬性卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(st => {
          const baseVal = player.stats[st.key];
          const draftVal = safeDraft[st.key];
          const finalVal = baseVal + draftVal;
          const sharePct = Math.min(100, Math.round((finalVal / Math.max(1, totalStatsSum)) * 100));

          return (
            <div
              key={st.key}
              className={`bg-slate-950 p-4 rounded-2xl border flex flex-col justify-between space-y-3 transition-all ${
                draftVal > 0 ? 'border-emerald-400/80 shadow-lg shadow-emerald-950/30' : st.highlight ? 'border-amber-500/60 shadow-md shadow-amber-950/20' : 'border-slate-800'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-1">
                  <span className={`text-xs font-extrabold flex items-center gap-1 ${st.highlight ? 'text-amber-300' : 'text-slate-200'}`}>
                    <span>{st.icon}</span>
                    <span>{st.title}</span>
                  </span>
                  {st.roleTag && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${st.roleTag.startsWith('★') ? 'bg-amber-950/80 text-amber-300 border-amber-500/70' : 'bg-slate-900 text-slate-300 border-slate-700'}`}>
                      {st.roleTag}
                    </span>
                  )}
                </div>

                <div className="bg-slate-900/90 rounded-xl py-2.5 px-3 border border-slate-800/90 text-center">
                  <div className="flex items-baseline justify-center gap-1.5 font-mono">
                    <span className="text-2xl font-black text-slate-100">{finalVal}</span>
                    {draftVal > 0 && <span className="text-xs font-black text-emerald-400">(+{draftVal})</span>}
                  </div>
                  <div className="mt-2 space-y-1">
                    <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                      <div className={`h-full ${st.barColor} transition-all duration-200`} style={{ width: `${sharePct}%` }} />
                    </div>
                    <div className="text-[10px] font-mono text-slate-500">根骨佔比 {sharePct}%</div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 text-center leading-snug min-h-[32px] flex items-center justify-center px-1">
                  {st.desc}
                </div>
              </div>

              <div className="grid grid-cols-4 gap-1.5 pt-1">
                <button
                  type="button"
                  disabled={draftVal <= 0}
                  onClick={() => adjustDraft(st.key, -1)}
                  className="py-2 rounded-xl font-mono font-black text-xs bg-slate-900 hover:bg-rose-950/80 text-rose-300 border border-slate-800 hover:border-rose-600/70 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  -1
                </button>
                {[1, 5].map(step => (
                  <button
                    key={step}
                    type="button"
                    disabled={remainingPoints <= 0}
                    onClick={() => adjustDraft(st.key, step)}
                    className={`py-2 rounded-xl font-mono font-black text-xs ${step === 1 ? 'bg-amber-600 hover:bg-amber-500' : 'bg-amber-700 hover:bg-amber-600'} text-white disabled:opacity-35 disabled:cursor-not-allowed transition-all`}
                  >
                    +{step}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={remainingPoints <= 0}
                  onClick={() => adjustDraft(st.key, remainingPoints)}
                  className="py-2 rounded-xl font-mono font-black text-[11px] bg-indigo-700 hover:bg-indigo-600 text-white disabled:opacity-35 disabled:cursor-not-allowed transition-all"
                >
                  ALL
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
