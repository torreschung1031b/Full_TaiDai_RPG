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
      healingDone: 0,
      shieldDone: 0,
      damageTaken: 0,
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
      healingDone: 0,
      shieldDone: 0,
      damageTaken: 0,
      kills: 0,
      skillTotals: {}
    };
  });

  return { members };
}

/**
 * 自動從單回合戰報 logs 中解析每位成員的輸出、治療、加盾、承傷與招牌技能
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

    // 1. 優先依據 log.type 與名稱辨識本條戰報的主動出手者
    let actor = null;
    const isPlayerMentioned =
      text.includes('少俠') ||
      (playerEntry?.name && text.includes(playerEntry.name));

    if (log?.type === 'player') {
      actor = playerEntry;
    } else if (isPlayerMentioned && !text.includes('重擊少俠') && !text.includes(`重擊【${playerEntry?.name}】`)) {
      // 排除純粹「怪物攻擊少俠」的受擊句
      const monsterHitPlayer = log?.type === 'monster' && !text.includes('反震') && !text.includes('反彈');
      if (!monsterHitPlayer) {
        actor = playerEntry;
      }
    }

    if (!actor) {
      for (const h of heroEntries) {
        if (text.includes(h.name)) {
          const isBeingHit =
            log?.type === 'monster' ||
            (text.includes('重擊') && text.indexOf('重擊') < text.indexOf(h.name));
          const isProtected =
            text.includes(`替【${h.name}】`) ||
            text.includes(`護盾為【${h.name}】`) ||
            text.includes(`治療【${h.name}】`);
          if (!isBeingHit && !isProtected) {
            actor = h;
            break;
          }
        }
      }
    }

    if (actor && (log?.type === 'hero' || log?.type === 'player' || log?.type === 'sys')) {
      lastActor = actor;
    }

    // 2. 解析技能卡或絕學名稱
    const skillMatch = text.match(/(技能卡【[^】]+】|絕學【[^】]+】|施展【[^】]+】|發動【[^】]+】)/);
    const extractedSkill = skillMatch
      ? skillMatch[1].replace(/^(?:施展|發動)/, '')
      : text.includes('追擊')
        ? '疾速追擊'
        : text.includes('反震') || text.includes('反彈')
          ? '反震護罡'
          : '普通攻擊';

    // 3. 解析我方造成傷害（涵蓋 player、hero 及主角反震/連攜）
    const isFriendlyAttackLog =
      log?.type === 'player' ||
      log?.type === 'hero' ||
      (actor && (text.includes('造成') || text.includes('反彈給') || text.includes('反震')));

    if (isFriendlyAttackLog && log?.type !== 'monster') {
      const dmgMatch = text.match(
        /造成\s*(\d+)\s*(?:點)?(?:總|真實|暴擊|五行)?傷害|傷害\s*[:：]?\s*(\d+)|反彈給[^0-9]*(\d+)\s*(?:點)?傷害/
      );
      const dmgVal = dmgMatch ? Number(dmgMatch[1] || dmgMatch[2] || dmgMatch[3] || 0) : 0;
      const targetActor = actor || (log?.type === 'player' ? playerEntry : lastActor);

      if (dmgVal > 0 && targetActor) {
        targetActor.damageDealt += dmgVal;
        targetActor.skillTotals[extractedSkill] = (targetActor.skillTotals[extractedSkill] || 0) + dmgVal;
        if (remainingRoundKills > 0) {
          targetActor.kills += 1;
          remainingRoundKills -= 1;
        }
      }
    }

    // 4. 解析加盾紀錄（護盾 +XX / 獲得 XX 點護盾 / 提供 +XX 點護盾）
    if (
      log?.dmgRole === 'shield' ||
      text.includes('護盾') ||
      text.includes('護體') ||
      text.includes('真氣罩') ||
      text.includes('金鐘')
    ) {
      const shieldMatch = text.match(
        /(?:護盾|護體|真氣罩|金鐘)[^0-9+]*\+?\s*(\d+)|(?:獲得|提供|形成|增加|附加)\s*\+?(\d+)\s*(?:點)?(?:護盾|護體)/
      );
      const shieldVal = shieldMatch ? Number(shieldMatch[1] || shieldMatch[2] || 0) : 0;
      // 排除「護盾抵消了 XX 點傷害」這類扣盾戰報
      const isShieldConsumed = text.includes('抵消') || text.includes('吸收') || text.includes('擊碎');
      const shieldProvider = actor || lastActor || playerEntry;

      if (shieldVal > 0 && !isShieldConsumed && shieldProvider) {
        const shieldSkillName = extractedSkill !== '普通攻擊' ? extractedSkill : '護體真氣';
        shieldProvider.shieldDone += shieldVal;
        shieldProvider.skillTotals[shieldSkillName] = (shieldProvider.skillTotals[shieldSkillName] || 0) + shieldVal;
      }
    }

    // 5. 解析治療回血（heal 角色或恢復/治療/回血 +XX）
    if (
      log?.dmgRole === 'heal' ||
      text.includes('恢復 +') ||
      text.includes('回血') ||
      text.includes('治療') ||
      text.includes('回復')
    ) {
      const healMatch = text.match(
        /(?:恢復|回血|治療|回復)[^0-9+]*\+?\s*(\d+)\s*(?:點)?(?:HP|氣血|生命)?/
      );
      const healVal = healMatch ? Number(healMatch[1] || 0) : 0;
      const isTeamHeal = text.includes('全隊');
      const multiplier = isTeamHeal ? Math.max(1, memberList.length) : 1;
      const healer =
        actor ||
        (log?.type === 'player' ? playerEntry : null) ||
        heroEntries.find(h => h.role.includes('藥師')) ||
        playerEntry;

      if (healVal > 0 && healer) {
        const totalHeal = healVal * multiplier;
        const healSkillName = text.includes('醫道餘韻')
          ? '醫道餘韻'
          : extractedSkill !== '普通攻擊'
            ? extractedSkill
            : '回春妙手';
        healer.healingDone += totalHeal;
        healer.skillTotals[healSkillName] = (healer.skillTotals[healSkillName] || 0) + totalHeal;
      }
    }

    // 6. 解析我方承受傷害（monster 類型戰報）
    if (log?.type === 'monster') {
      const takenMatch = text.match(/造成\s*(\d+)\s*(?:點)?傷害/);
      const takenVal = takenMatch ? Number(takenMatch[1] || 0) : 0;
      if (takenVal > 0) {
        if (isPlayerMentioned && playerEntry) {
          playerEntry.damageTaken += takenVal;
        } else {
          for (const h of heroEntries) {
            if (text.includes(`【${h.name}】`) || text.includes(h.name)) {
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
 * 嵌入式 MVP 戰鬥數據統計面板（支援 總輸出 / 總治療 / 加盾量 / 承傷 切換檢視）
 */
export default function BattleMvpPanel({ battleStats }) {
  const [sortMetric, setSortMetric] = useState('damageDealt');

  const summary = useMemo(() => {
    const rawList = Object.values(battleStats?.members || {});
    const totalDmg = rawList.reduce((s, m) => s + (m.damageDealt || 0), 0);
    const totalHeal = rawList.reduce((s, m) => s + (m.healingDone || 0), 0);
    const totalShield = rawList.reduce((s, m) => s + (m.shieldDone || 0), 0);
    const totalTaken = rawList.reduce((s, m) => s + (m.damageTaken || 0), 0);

    const enriched = rawList.map(m => {
      const dmg = m.damageDealt || 0;
      const heal = m.healingDone || 0;
      const shield = m.shieldDone || 0;
      const taken = m.damageTaken || 0;
      const kills = m.kills || 0;

      const mvpScore = dmg * 1.0 + heal * 1.15 + shield * 1.1 + taken * 0.65 + kills * 80;
      const skillEntries = Object.entries(m.skillTotals || {}).sort((a, b) => b[1] - a[1]);
      const topSkill = skillEntries.length > 0
        ? { name: skillEntries[0][0], value: skillEntries[0][1] }
        : null;

      return {
        ...m,
        damageDealt: dmg,
        healingDone: heal,
        shieldDone: shield,
        damageTaken: taken,
        mvpScore,
        dmgPct: totalDmg > 0 ? Math.round((dmg / totalDmg) * 100) : 0,
        healPct: totalHeal > 0 ? Math.round((heal / totalHeal) * 100) : 0,
        shieldPct: totalShield > 0 ? Math.round((shield / totalShield) * 100) : 0,
        takenPct: totalTaken > 0 ? Math.round((taken / totalTaken) * 100) : 0,
        topSkill
      };
    });

    const mvpMember = [...enriched].sort((a, b) => b.mvpScore - a.mvpScore)[0] || null;
    const sortedList = [...enriched].sort((a, b) => (b[sortMetric] || 0) - (a[sortMetric] || 0));

    return {
      list: sortedList,
      mvpId: mvpMember && mvpMember.mvpScore > 0 ? mvpMember.id : null,
      totalDmg,
      totalHeal,
      totalShield,
      totalTaken
    };
  }, [battleStats, sortMetric]);

  if (!battleStats?.members || summary.list.length === 0) return null;

  const metricTabs = [
    { key: 'damageDealt', label: '⚔️ 總輸出', barColor: 'bg-amber-500', textColor: 'text-amber-300', pctKey: 'dmgPct' },
    { key: 'healingDone', label: '💚 補血', barColor: 'bg-emerald-500', textColor: 'text-emerald-300', pctKey: 'healPct' },
    { key: 'shieldDone', label: '🔰 加盾', barColor: 'bg-purple-500', textColor: 'text-purple-300', pctKey: 'shieldPct' },
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
              className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
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
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span>⚔️ 輸出 <strong className="text-slate-200">{member.damageDealt}</strong></span>
                  <span>💚 補血 <strong className="text-emerald-300">{member.healingDone}</strong></span>
                  <span>🔰 加盾 <strong className="text-purple-300">{member.shieldDone}</strong></span>
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
