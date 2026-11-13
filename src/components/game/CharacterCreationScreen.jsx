import React from 'react';
import { ELEMENTS } from '../../data/constants';
import { CLASS_CONFIGS } from '../../data/classes';
import { PROTAGONIST_SKILLS_DB, getSkillMultiplier } from '../../data/skills';

export function buildAdaptedClassSkills(job, fallbackSkills = []) {
  if (fallbackSkills && fallbackSkills.length > 0) return fallbackSkills;
  const rawList = PROTAGONIST_SKILLS_DB?.[job] || [];
  return rawList.map((sk, idx) => {
    const unlockLevel = sk.unlockLevel ?? (idx <= 1 ? 1 : idx === 2 ? 5 : 10);
    const cd = sk.cd ?? (idx === 0 ? 0 : idx === 1 ? 2 : idx === 2 ? 3 : 4);
    const getStatsAtLevel = sk.getStatsAtLevel || ((lvl = 1) => {
      const effectiveLvl = Math.max(1, lvl);
      const mult = Number(getSkillMultiplier(sk, effectiveLvl).toFixed(2));
      return {
        mult,
        shieldPct: Number((0.25 + (effectiveLvl - 1) * 0.05).toFixed(2)),
        breakPct: Number((0.20 + (effectiveLvl - 1) * 0.05).toFixed(2)),
        reflectPct: Number((0.30 + (effectiveLvl - 1) * 0.05).toFixed(2)),
        blindPct: Number((0.25 + (effectiveLvl - 1) * 0.05).toFixed(2)),
        poisonPct: Number((0.08 + (effectiveLvl - 1) * 0.02).toFixed(2)),
        reviveHpPct: Number((0.35 + (effectiveLvl - 1) * 0.08).toFixed(2)),
        atkBuffPct: Number((0.20 + (effectiveLvl - 1) * 0.05).toFixed(2)),
        bonusDmgPct: Number((0.20 + (effectiveLvl - 1) * 0.05).toFixed(2)),
        reducePct: Number((0.25 + (effectiveLvl - 1) * 0.04).toFixed(2)),
        vulnPct: Number((0.20 + (effectiveLvl - 1) * 0.05).toFixed(2))
      };
    });

    const getDescAtLevel = sk.getDescAtLevel || ((lvl = 1) => {
      const effectiveLvl = Math.max(1, lvl);
      const mult = Number(getSkillMultiplier(sk, effectiveLvl).toFixed(2));
      return `技能倍率 ${mult}x（每升 1 級倍率 +0.15x）`;
    });

    return { ...sk, unlockLevel, cd, getStatsAtLevel, getDescAtLevel };
  });
}

export function CharacterCreationScreen({
  creationData,
  setCreationData,
  starterHeroCandidates,
  handleStartGame
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="max-w-3xl w-full bg-slate-900/90 border border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black text-amber-400 tracking-wider">⚔️ 《天外 Online》文字武俠 RPG</h1>
          <p className="text-xs text-slate-400">創立少俠名號、選擇本命五行與門派職業，招募同行俠客踏入江湖</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-amber-300">少俠名號</label>
            <input
              type="text"
              value={creationData.name}
              onChange={(e) => setCreationData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-100 focus:outline-none focus:border-amber-500"
              placeholder="輸入少俠名稱"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-amber-300">本命五行屬性</label>
            <div className="grid grid-cols-5 gap-1.5">
              {Object.keys(ELEMENTS).map(elKey => (
                <button
                  key={elKey}
                  type="button"
                  onClick={() => setCreationData(prev => ({ ...prev, element: elKey }))}
                  className={`py-2 rounded-xl border text-xs font-bold transition-all ${
                    creationData.element === elKey
                      ? 'bg-amber-600 border-amber-300 text-slate-950 font-black'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  {ELEMENTS[elKey].icon} {elKey}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-amber-300">選擇江湖職業</label>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
            {Object.keys(CLASS_CONFIGS).map(jobKey => {
              const cfg = CLASS_CONFIGS[jobKey];
              const selected = creationData.job === jobKey;
              return (
                <button
                  key={jobKey}
                  type="button"
                  onClick={() => setCreationData(prev => ({ ...prev, job: jobKey }))}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    selected
                      ? 'bg-amber-950/50 border-amber-400 ring-1 ring-amber-400'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="font-extrabold text-sm text-amber-300">{cfg.icon} {jobKey}</div>
                  <div className="text-[11px] text-slate-400 mt-1 line-clamp-2">{cfg.passiveName}</div>
                </button>
              );
            })}
          </div>
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-xs text-slate-300">
            <strong className="text-emerald-300">{CLASS_CONFIGS[creationData.job]?.passiveName}：</strong>
            {CLASS_CONFIGS[creationData.job]?.passiveDesc}
          </div>
        </div>

        {starterHeroCandidates.length > 0 && (
          <div className="space-y-2">
            <label className="text-xs font-bold text-amber-300">選擇同行初始夥伴（Tier 1 俠客）</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {starterHeroCandidates.map(cand => {
                const selected = creationData.selectedStarterHero?.instanceId === cand.instanceId;
                return (
                  <button
                    key={cand.instanceId}
                    type="button"
                    onClick={() => setCreationData(prev => ({ ...prev, selectedStarterHero: cand }))}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      selected
                        ? 'bg-emerald-950/40 border-emerald-400'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs text-amber-300">{cand.icon || '🧑'} {cand.name} ({cand.heroClass})</div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      {ELEMENTS[cand.element]?.icon} {cand.element}屬性 • 攻 {cand.atk} / 血 {cand.maxHp}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={handleStartGame}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-black text-base shadow-xl transition-all"
        >
          ⚔️ 踏入《天外 Online》江湖
        </button>
      </div>
    </div>
  );
}
