import React, { useState, useMemo } from 'react';
import { ELEMENTS } from '../../data/constants';

/**
 * 建立一場新戰鬥的統計容器（在開戰時呼叫）
 */
export function createInitialBattleStats(player, activeHeroes = []) {
  const members = {};

  if (player) {
    members.PLAYER = {
      id: 'PLAYER',
      name: player.name || '少俠',
      role: `主角・${player.job || '俠客'}`,
      element: player.element || '火',
      isPlayer: true,
      damageDealt: 0,
      damageTaken: 0,
      healingDone: 0,
      kills: 0,
      skillTotals: {}
    };
  }

  activeHeroes.forEach(h => {
    if (!h?.instanceId) return;
    members[h.instanceId] = {
      id: h.instanceId,
      name: h.name,
      role: `${h.heroClass || '名將'}${h.fusionLevel > 0 ? ` ★${h.fusionLevel}` : ''}`,
      element: h.element || '金',
      isPlayer: false,
      damageDealt: 0,
      damageTaken: 0,
      healingDone: 0,
      kills: 0,
      skillTotals: {}
    };
  });

  return { members };
}

/**
 * 累加單筆戰鬥統計（在行動結算時呼叫）
 */
export function recordBattleStat(stats, memberId, delta = {}) {
  if (!stats?.members || !memberId) return;
  const entry = stats.members[memberId];
  if (!entry) return;

  if (delta.damageDealt > 0) {
    entry.damageDealt += delta.damageDealt;
    if (delta.skillName) {
      entry.skillTotals[delta.skillName] = (entry.skillTotals[delta.skillName] || 0) + delta.damageDealt;
    }
  }
  if (delta.damageTaken > 0) {
    entry.damageTaken += delta.damageTaken;
  }
  if (delta.healingDone > 0) {
    entry.healingDone += delta.healingDone;
    if (delta.skillName) {
      entry.skillTotals[delta.skillName] = (entry.skillTotals[delta.skillName] || 0) + delta.healingDone;
    }
  }
  if (delta.kills > 0) {
    entry.kills += delta.kills;
  }
}

/**
 * 嵌入式 MVP 戰鬥數據統計面板（供 BattleResultModals 勝利／戰敗共用）
 */
export default function BattleMvpPanel({ battleStats }) {
  const [sortMetric, setSortMetric] = useState('damageDealt'); // 'damageDealt' | 'healingDone' | 'damageTaken'

  const summary = useMemo(() => {
    const rawList = Object.values(battleStats?.members || {});
    const totalDmg = rawList.reduce((s, m) => s + m.damageDealt, 0);
    const totalHeal = rawList.reduce((s, m) => s + m.healingDone, 0);
    const totalTaken = rawList.reduce((s, m) => s + m.damageTaken, 0);

    const enriched = rawList.map(m => {
      const mvpScore = m.damageDealt * 1.0 + m.healingDone * 1.15 + m.damageTaken * 0.65 + m.kills * 80;
      const skillEntries = Object.entries(m.skillTotals || {}).sort((a, b) => b[1] - a[1]);
      const topSkill = skillEntries.length > 0
        ? { name: skillEntries[0][0], value: skillEntries[0][1] }
        : null;

      return {
        ...m,
        mvpScore,
        dmgPct: totalDmg > 0 ? Math.round((m.damageDealt / totalDmg) * 100) : 0,
        healPct: totalHeal > 0 ? Math.round((m.healingDone / totalHeal) * 100) : 0,
        takenPct: totalTaken > 0 ? Math.round((m.damageTaken / totalTaken) * 100) : 0,
        topSkill
      };
    });

    const mvpMember = [...enriched].sort((a, b) => b.mvpScore - a.mvpScore)[0] || null;
    const sortedList = [...enriched].sort((a, b) => b[sortMetric] - a[sortMetric]);

    return {
      list: sortedList,
      mvpId: mvpMember && mvpMember.mvpScore > 0 ? mvpMember.id : null,
      totalDmg,
      totalHeal,
      totalTaken
    };
  }, [battleStats, sortMetric]);

  if (!battleStats?.members || summary.list.length === 0) return null;

  const metricTabs = [
    { key: 'damageDealt', label: '⚔️ 總輸出', barColor: 'bg-amber-500', textColor: 'text-amber-300', pctKey: 'dmgPct' },
    { key: 'healingDone', label: '💚 總治療', barColor: 'bg-emerald-500', textColor: 'text-emerald-300', pctKey: 'healPct' },
    { key: 'damageTaken', label: '🛡️ 承傷', barColor: 'bg-sky-500', textColor: 'text-sky-300', pctKey: 'takenPct' }
  ];

  const activeTab = metricTabs.find(t => t.key === sortMetric) || metricTabs[0];

  return (
    <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
      {/* 標題與指標切換鈕 */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs font-extrabold text-slate-200 flex items-center gap-1.5">
          <span>📊 本場戰績統計</span>
          <span className="text-[10px] font-mono text-slate-400 font-normal">
            (總傷 {summary.totalDmg.toLocaleString()})
          </span>
        </div>

        <div className="flex gap-1 bg-slate-900 p-0.5 rounded-xl border border-slate-800">
          {metricTabs.map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setSortMetric(tab.key)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                sortMetric === tab.key
                  ? 'bg-slate-800 text-white shadow border border-slate-600'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 成員佔比長條圖列表 */}
      <div className="space-y-2 max-h-56 overflow-y-auto pr-0.5">
        {summary.list.map(member => {
          const isMvp = member.id === summary.mvpId;
          const currentVal = member[sortMetric] || 0;
          const currentPct = member[activeTab.pctKey] || 0;

          return (
            <div
              key={member.id}
              className={`p-2.5 rounded-xl border transition-all ${
                isMvp
                  ? 'bg-amber-950/20 border-amber-500/50 ring-1 ring-amber-500/25'
                  : 'bg-slate-900/75 border-slate-800/90'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-xs font-mono">{ELEMENTS[member.element]?.icon || '⚔️'}</span>
                  <span className="font-extrabold text-xs text-slate-100 truncate">{member.name}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
                    {member.role}
                  </span>
                  {isMvp && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black shrink-0">
                      👑 MVP
                    </span>
                  )}
                </div>

                <div className="text-right shrink-0 font-mono">
                  <span className={`text-xs font-black ${activeTab.textColor}`}>
                    {currentVal.toLocaleString()}
                  </span>
                  <span className="text-[11px] text-slate-400 ml-1">({currentPct}%)</span>
                </div>
              </div>

              {/* 佔比進度條 */}
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden mt-1.5 border border-slate-800">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${activeTab.barColor}`}
                  style={{ width: `${Math.max(currentVal > 0 ? 4 : 0, currentPct)}%` }}
                />
              </div>

              {/* 三項數值明細 + 最高輸出技能卡 */}
              <div className="flex flex-wrap items-center justify-between gap-1.5 mt-1.5 text-[10px] text-slate-400 font-mono">
                <div className="flex items-center gap-2.5">
                  <span>⚔️ 輸出 <strong className="text-slate-200">{member.damageDealt}</strong></span>
                  <span>💚 治療 <strong className="text-emerald-300">{member.healingDone}</strong></span>
                  <span>🛡️ 承傷 <strong className="text-sky-300">{member.damageTaken}</strong></span>
                  {member.kills > 0 && (
                    <span>💀 擊殺 <strong className="text-rose-300">{member.kills}</strong></span>
                  )}
                </div>

                {member.topSkill && (
                  <span className="text-[10px] text-amber-300/90 bg-amber-950/50 border border-amber-800/50 px-1.5 rounded truncate max-w-[190px]">
                    ✨ {member.topSkill.name} ({member.topSkill.value})
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
