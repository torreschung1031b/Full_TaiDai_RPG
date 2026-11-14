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
 * 自動從單回合戰報 logs 中解析每位成員的輸出、治療、承傷與招牌技能卡
 */
export function accumulateStatsFromRoundLogs(stats, logs = [], monstersBefore = [], monstersAfter = []) {
  if (!stats?.members || !Array.isArray(logs) || logs.length === 0) return;

  const memberList = Object.values(stats.members);
  const playerEntry = stats.members.PLAYER || null;
  const heroEntries = memberList.filter(m => !m.isPlayer);

  // 計算本回合新增擊殺數
  const prevAliveCount = (monstersBefore || []).filter(m => m.hp > 0).length;
  const nextAliveCount = (monstersAfter || []).filter(m => m.hp > 0).length;
  let remainingRoundKills = Math.max(0, prevAliveCount - nextAliveCount);

  let lastActor = playerEntry;

  logs.forEach(log => {
    const text = typeof log === 'string' ? log : (log?.text || '');
    if (!text) return;

    // 辨識本條戰報的主動出手者
    let actor = null;
    if (text.includes('少俠') && (text.includes('施展') || text.includes('攻擊') || text.includes('爆發') || text.includes('追擊') || text.includes('反震'))) {
      actor = playerEntry;
    } else {
      for (const h of heroEntries) {
        if (text.includes(h.name)) {
          // 排除「重擊...英雄【XXX】」這種挨打句型
          const isBeingHit = text.includes(`重擊`) && text.indexOf('重擊') < text.indexOf(h.name);
          const isProtected = text.includes(`替【${h.name}】`) || text.includes(`護盾為【${h.name}】`);
          if (!isBeingHit && !isProtected) {
            actor = h;
            break;
          }
        }
      }
    }

    if (actor && (log?.type === 'hero' || log?.type === 'player')) {
      lastActor = actor;
    }

    // 1. 解析技能卡或絕學名稱
    const skillMatch = text.match(/(技能卡【[^】]+】|絕學【[^】]+】|施展【[^】]+】)/);
    const extractedSkill = skillMatch
      ? skillMatch[1].replace(/^施展/, '')
      : text.includes('追擊')
        ? '疾速追擊'
        : '普通攻擊';

    // 2. 解析造成傷害（hero 或 player 類型戰報）
    if (log?.type === 'hero' || log?.type === 'player') {
      const dmgMatch = text.match(/造成\s*(\d+)\s*(?:總)?傷害|反彈給[^0-9]*(\d+)\s*點傷害/);
      const dmgVal = dmgMatch ? Number(dmgMatch[1] || dmgMatch[2] || 0) : 0;
      const targetActor = actor || lastActor;
      if (dmgVal > 0 && targetActor) {
        targetActor.damageDealt += dmgVal;
        targetActor.skillTotals[extractedSkill] = (targetActor.skillTotals[extractedSkill] || 0) + dmgVal;
        if (remainingRoundKills > 0) {
          targetActor.kills += 1;
          remainingRoundKills -= 1;
        }
      }
    }

    // 3. 解析治療回血（heal 角色或恢復 +XX HP）
    if (log?.dmgRole === 'heal' || text.includes('恢復 +')) {
      const healMatch = text.match(/恢復\s*\+(\d+)\s*HP|回血\s*\+(\d+)/);
      const healVal = healMatch ? Number(healMatch[1] || healMatch[2] || 0) : 0;
      // 若為全隊恢復，粗估乘以存活人數（或採單體回血值）
      const isTeamHeal = text.includes('全隊恢復');
      const multiplier = isTeamHeal ? Math.max(1, memberList.length) : 1;
      const healer = actor || heroEntries.find(h => h.role.includes('藥師')) || playerEntry;
      if (healVal > 0 && healer) {
        const totalHeal = healVal * multiplier;
        const healSkillName = text.includes('醫道餘韻') ? '醫道餘韻' : extractedSkill;
        healer.healingDone += totalHeal;
        healer.skillTotals[healSkillName] = (healer.skillTotals[healSkillName] || 0) + totalHeal;
      }
    }

    // 4. 解析我方承受傷害（monster 類型戰報）
    if (log?.type === 'monster') {
      const takenMatch = text.match(/造成\s*(\d+)\s*點傷害/);
      const takenVal = takenMatch ? Number(takenMatch[1] || 0) : 0;
      if (takenVal > 0) {
        if (text.includes('少俠') && playerEntry) {
          playerEntry.damageTaken += takenVal;
        } else {
          for (const h of heroEntries) {
            if (text.includes(`【${h.name}】`)) {
              h.damageTaken += takenVal;
              break;
            }
          }
        }
      }
    }
  });
}

/**
 * 嵌入式 MVP 戰鬥數據統計面板（供 BattleResultModals 勝利／戰敗共用）
 */
export default function BattleMvpPanel({ battleStats }) {
  const [sortMetric, setSortMetric] = useState('damageDealt');

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

              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden mt-1.5 border border-slate-800">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${activeTab.barColor}`}
                  style={{ width: `${Math.max(currentVal > 0 ? 4 : 0, currentPct)}%` }}
                />
              </div>

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
