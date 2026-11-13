import React from 'react';
import { Sparkles, Lock, Clock, HelpCircle } from 'lucide-react';
import { MAX_SKILL_LEVEL } from '../data/constants';
import { getSkillMeta, getPlayerStatScaling } from '../utils/combatEngine';

export default function SkillTreeTab({
  player,
  setPlayer,
  classSkills,
  setHelpModalTab
}) {
  const statScaling = getPlayerStatScaling(player.job);

  const handleLearnOrUpgradeSkill = (sIdx, unlockLevel, reqPrevSkillLevel) => {
    const currentLvl = player.skillLevels?.[sIdx] || 0;
    const prevLvl = sIdx > 0 ? (player.skillLevels?.[sIdx - 1] || 0) : 99;
    if ((player.level || 1) < unlockLevel) return;
    if (sIdx > 0 && prevLvl < reqPrevSkillLevel) return;
    if ((player.sp || 0) <= 0 || currentLvl >= MAX_SKILL_LEVEL) return;

    setPlayer(p => ({
      ...p,
      sp: p.sp - 1,
      skillLevels: {
        ...(p.skillLevels || {}),
        [sIdx]: currentLvl + 1
      }
    }));
  };

  const formatSkillStatsSummary = (sk, lvl) => {
    if (!sk.getStatsAtLevel || lvl <= 0) return null;
    const st = sk.getStatsAtLevel(lvl);
    const parts = [];
    if (st.mult) parts.push(`技能倍率 ${(st.mult * 100).toFixed(0)}%`);
    if (st.rageGain) parts.push(`回復 +${st.rageGain} 怒氣`);
    if (st.ammoGain) parts.push(`回復 +${st.ammoGain} 彈藥`);
    if (st.mpGain) parts.push(`回復 +${st.mpGain} MP`);
    if (st.shieldPct) parts.push(`最大生命 ${Math.round(st.shieldPct * 100)}% 護盾`);
    if (st.guardSharePct) parts.push(`分擔隊友 ${Math.round(st.guardSharePct * 100)}% 傷害`);
    if (st.lifestealPct) parts.push(`傷害 ${Math.round(st.lifestealPct * 100)}% 吸血`);
    if (st.bleedMult) parts.push(`每回合流血 ${(st.bleedMult * 100).toFixed(0)}% 攻`);
    if (st.burnMult) parts.push(`每回合灼燒 ${(st.burnMult * 100).toFixed(0)}% 攻`);
    if (st.vulnPct) parts.push(`全場易傷 +${Math.round(st.vulnPct * 100)}%`);
    if (st.blindPct) parts.push(`致盲降命中 ${Math.round(st.blindPct * 100)}%`);
    if (st.breakPct) parts.push(`破甲降防 ${Math.round(st.breakPct * 100)}%`);
    if (st.poisonPct) parts.push(`每回合劇毒 ${Math.round(st.poisonPct * 100)}% 血`);
    if (st.regenMult) parts.push(`每回合生機回血 ${(st.regenMult * 100).toFixed(0)}% 攻`);
    if (st.atkBuffPct) parts.push(`全隊攻擊 +${Math.round(st.atkBuffPct * 100)}%`);
    if (st.speedBonus) parts.push(`全隊速度 +${st.speedBonus}`);
    if (st.critBonusPct) parts.push(`全隊暴擊 +${Math.round(st.critBonusPct * 100)}%`);
    if (st.reducePct) parts.push(`全隊減傷 ${Math.round(st.reducePct * 100)}%`);
    if (st.reflectPct) parts.push(`反彈傷害 ${Math.round(st.reflectPct * 100)}%`);
    if (st.heroSkillBoostPct) parts.push(`英雄技能發動率 +${Math.round(st.heroSkillBoostPct * 100)}%`);
    if (st.heroDmgBoostPct) parts.push(`英雄全傷害 +${Math.round(st.heroDmgBoostPct * 100)}%`);
    return parts.join(' • ');
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur space-y-5 max-w-5xl mx-auto">
      <div className="flex flex-wrap justify-between items-center gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <div>
            <h2 className="font-extrabold text-amber-400 text-lg flex items-center gap-1.5">
              <Sparkles className="w-5 h-5" />
              <span>✨ 【{player.job}】職業四招武學技能樹</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              主屬性係數：<span className="text-amber-300 font-bold">{statScaling.primaryLabel}</span> • 創角自動習得前 2 招
            </p>
          </div>
          {setHelpModalTab && (
            <button
              onClick={() => setHelpModalTab('combat')}
              className="text-slate-400 hover:text-amber-300 transition-colors"
              title="查看技能解鎖與冷卻規則"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 font-mono text-xs font-bold">
          <span className="bg-slate-950 text-slate-300 px-3 py-1.5 rounded-full border border-slate-800">
            目前等級: Lv.{player.level}
          </span>
          <span className="bg-amber-500/20 text-amber-300 px-3.5 py-1.5 rounded-full border border-amber-500/40">
            剩餘技能點 (SP): {player.sp}
          </span>
        </div>
      </div>

      {/* 雙重解鎖條件說明 */}
      <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3.5 text-xs text-slate-300 space-y-1">
        <div>
          <span className="text-amber-300 font-bold">📜 雙重進階修煉門檻：</span>
          第 1、2 招 <span className="text-emerald-300 font-bold">1 級自動習得</span>；
          第 3 招需 <span className="text-cyan-300 font-bold">Lv.5 且第 2 招達 Lv.5</span>；
          第 4 招需 <span className="text-purple-300 font-bold">Lv.10 且第 3 招達 Lv.5</span>。
        </div>
        <div className="text-slate-400">
          第 1 招取代無係數普攻（CD 0 基礎循環技），升級將同步提升攻擊倍率與職業資源回復量！
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {classSkills.map((sk, sIdx) => {
          const skLvl = player.skillLevels?.[sIdx] || 0;
          const prevSkill = sIdx > 0 ? classSkills[sIdx - 1] : null;
          const prevSkillLvl = sIdx > 0 ? (player.skillLevels?.[sIdx - 1] || 0) : 99;
          const { unlockLevel, reqPrevSkillLevel, cooldown } = getSkillMeta(sk, sIdx);

          const isLevelLocked = (player.level || 1) < unlockLevel;
          const isPrevSkillLocked = sIdx > 0 && reqPrevSkillLevel > 0 && prevSkillLvl < reqPrevSkillLevel;
          const isLocked = isLevelLocked || isPrevSkillLocked;
          const isMaxed = skLvl >= MAX_SKILL_LEVEL;
          const canUpgrade = !isLocked && !isMaxed && (player.sp || 0) > 0;

          const costLabel =
            sk.cost === 0
              ? '無消耗（回復資源）'
              : sk.costType === 'rage'
                ? `${sk.cost} 怒氣`
                : sk.costType === 'ammo'
                  ? `${sk.cost} 彈藥`
                  : `${sk.cost} 內力 (MP)`;

          const currentSummary = formatSkillStatsSummary(sk, skLvl);
          const nextSummary = !isMaxed ? formatSkillStatsSummary(sk, skLvl + 1) : null;

          return (
            <div
              key={sk.id}
              className={`rounded-2xl p-5 border flex flex-col justify-between space-y-4 transition-all ${
                isLocked
                  ? 'bg-slate-950/50 border-slate-800/80 opacity-80'
                  : skLvl > 0
                    ? 'bg-slate-950 border-amber-500/50 shadow-lg'
                    : 'bg-slate-950/90 border-slate-700'
              }`}
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-1.5 text-[11px] font-mono font-bold flex-wrap">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`px-2 py-0.5 rounded border ${
                        isLevelLocked
                          ? 'bg-rose-950/70 text-rose-300 border-rose-700/70'
                          : 'bg-emerald-950/70 text-emerald-300 border-emerald-700/70'
                      }`}
                    >
                      {isLevelLocked ? `🔒 Lv.${unlockLevel}` : `✅ Lv.${unlockLevel}`}
                    </span>

                    {sIdx > 0 && reqPrevSkillLevel > 0 && (
                      <span
                        className={`px-2 py-0.5 rounded border ${
                          isPrevSkillLocked
                            ? 'bg-rose-950/70 text-rose-300 border-rose-700/70'
                            : 'bg-emerald-950/70 text-emerald-300 border-emerald-700/70'
                        }`}
                      >
                        {isPrevSkillLocked
                          ? `🔒 需【${prevSkill?.name}】Lv.${reqPrevSkillLevel} (${prevSkillLvl}/${reqPrevSkillLevel})`
                          : `✅ 前置 Lv.${reqPrevSkillLevel} 達成`}
                      </span>
                    )}
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded border flex items-center gap-1 ${
                      cooldown === 0
                        ? 'bg-slate-900 text-slate-300 border-slate-700'
                        : 'bg-cyan-950/70 text-cyan-300 border-cyan-700/70'
                    }`}
                  >
                    <Clock className="w-3 h-3" />
                    <span>{cooldown === 0 ? 'CD: 0回合' : `CD: ${cooldown}回合`}</span>
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-extrabold text-amber-300 text-base">
                    第 {sIdx + 1} 招・{sk.icon || '✨'} {sk.name}
                  </h3>
                  <span className="text-xs font-mono font-black bg-slate-900 text-amber-200 px-2.5 py-0.5 rounded-full border border-slate-700">
                    Lv.{skLvl} / {MAX_SKILL_LEVEL}
                  </span>
                </div>

                <div className="text-xs font-mono text-cyan-300">
                  施放消耗：<span className="font-bold">{costLabel}</span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {sk.desc}
                </p>

                <div className="space-y-1.5 pt-1">
                  {skLvl > 0 && currentSummary && (
                    <div className="bg-emerald-950/35 border border-emerald-700/50 rounded-xl p-2.5 text-[11px] text-emerald-200">
                      <span className="font-bold">當前 (Lv.{skLvl})：</span>
                      {currentSummary}
                    </div>
                  )}
                  {!isMaxed && nextSummary && (
                    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 text-[11px] text-slate-300">
                      <span className="text-amber-300 font-bold">
                        {skLvl === 0 ? '領悟後 (Lv.1)：' : `下一級 (Lv.${skLvl + 1})：`}
                      </span>
                      {nextSummary}
                    </div>
                  )}
                </div>
              </div>

              <button
                disabled={!canUpgrade}
                onClick={() => handleLearnOrUpgradeSkill(sIdx, unlockLevel, reqPrevSkillLevel)}
                className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow ${
                  isLocked
                    ? 'bg-slate-900 text-rose-300/80 border border-rose-900/60 cursor-not-allowed'
                    : isMaxed
                      ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-700/60 cursor-not-allowed'
                      : canUpgrade
                        ? 'bg-amber-600 hover:bg-amber-500 text-slate-950 font-black'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                {isLevelLocked ? (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>需主角達 Lv.{unlockLevel} 解鎖</span>
                  </>
                ) : isPrevSkillLocked ? (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>需先將【{prevSkill?.name}】升至 Lv.{reqPrevSkillLevel}</span>
                  </>
                ) : isMaxed ? (
                  <span>⭐ 已修煉至最高境界</span>
                ) : (player.sp || 0) <= 0 ? (
                  <span>SP 技能點不足</span>
                ) : skLvl === 0 ? (
                  <span>✨ 消耗 1 SP 領悟此招</span>
                ) : (
                  <span>⬆️ 消耗 1 SP 強化至 Lv.{skLvl + 1}</span>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
