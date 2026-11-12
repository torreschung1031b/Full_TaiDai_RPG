import React from 'react';
import { User, Layers, Play } from 'lucide-react';
import { ELEMENTS, ELEMENT_KEYS } from '../data/constants';
import { CLASS_CONFIGS } from '../data/classes';

export default function CharacterCreation({
  creationData,
  setCreationData,
  starterHeroCandidates,
  handleStartGame
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-amber-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-4xl w-full bg-slate-900/90 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md relative z-10 space-y-6 ring-1 ring-amber-500/20">
        <div className="text-center space-y-2 border-b border-slate-800/80 pb-5">
          <h1 className="text-3xl sm:text-4xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-600 drop-shadow">
            《天外 Online》文字 RPG
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">五大鮮明職業 • Lv.30 封頂修練 • 主動搜敵與英雄戰損系統</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-amber-400 tracking-wider flex items-center gap-1.5">
              <User className="w-4 h-4 text-amber-400" /> 1. 少俠創建與本命五行
            </h3>

            <div>
              <label className="text-xs text-slate-400 block mb-1">少俠姓名</label>
              <input
                type="text"
                value={creationData.name}
                onChange={(e) => setCreationData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-4 py-2.5 text-amber-200 focus:outline-none focus:border-amber-500 font-bold text-sm shadow-inner"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1.5">選擇本命五行</label>
              <div className="grid grid-cols-5 gap-2">
                {ELEMENT_KEYS.map(eKey => {
                  const elem = ELEMENTS[eKey];
                  const isSelected = creationData.element === eKey;
                  return (
                    <button
                      key={eKey}
                      type="button"
                      onClick={() => setCreationData(prev => ({ ...prev, element: eKey }))}
                      className={`py-2 rounded-xl border text-center font-bold text-xs transition-all flex flex-col items-center justify-center space-y-0.5 ${
                        isSelected ? 'bg-amber-600 text-slate-950 border-amber-400 ring-2 ring-amber-400/50 shadow-lg scale-105' : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/40'
                      }`}
                    >
                      <span className="text-sm">{elem.icon}</span>
                      <span>{elem.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1.5">選擇職業（各具專屬天賦與定位）</label>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {Object.keys(CLASS_CONFIGS).map(jKey => {
                  const job = CLASS_CONFIGS[jKey];
                  const isSelected = creationData.job === jKey;
                  return (
                    <button
                      key={jKey}
                      type="button"
                      onClick={() => setCreationData(prev => ({ ...prev, job: jKey }))}
                      className={`w-full text-left p-3 rounded-2xl border transition-all ${
                        isSelected ? 'bg-amber-950/60 border-amber-400 ring-2 ring-amber-400/50 shadow-md' : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-bold text-xs text-amber-300 flex justify-between">
                        <span>{job.icon} {job.title}</span>
                        <span className="text-slate-400 text-[10px]">HP:{job.baseHp} / ATK:{job.baseAtk}</span>
                      </div>
                      <div className="text-[10px] text-slate-300 mt-1 leading-relaxed">{job.desc}</div>
                      <div className="text-[10px] text-emerald-400 mt-0.5">{job.passiveName} {job.passiveDesc}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold text-amber-400 tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-amber-400" /> 2. 選擇首位夥伴 (3選1)
            </h3>
            <div className="space-y-3">
              {starterHeroCandidates.map(hero => {
                const isSelected = creationData.selectedStarterHero?.baseId === hero.baseId;
                const elemInfo = ELEMENTS[hero.element];
                return (
                  <button
                    key={hero.instanceId || hero.baseId}
                    type="button"
                    onClick={() => setCreationData(prev => ({ ...prev, selectedStarterHero: hero }))}
                    className={`w-full text-left p-4 rounded-2xl border transition-all ${
                      isSelected ? 'bg-amber-950/60 border-amber-400 ring-2 ring-amber-400/50 shadow-lg scale-[1.02]' : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-sm text-amber-300 flex items-center justify-between">
                      <span>{hero.icon} {hero.name} ({hero.heroClass})</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${elemInfo?.badge}`}>
                        {elemInfo?.icon} {hero.element}屬性
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1">{hero.desc}</div>
                    <div className="text-[11px] font-mono text-slate-300 mt-2 flex gap-3">
                      <span>❤️ HP {hero.maxHp}</span>
                      <span>⚔️ ATK {hero.atk}</span>
                      <span>🛡️ DEF {hero.def}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800/80">
          <button
            type="button"
            onClick={handleStartGame}
            className="w-full bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black py-4 rounded-2xl shadow-xl shadow-amber-950/50 transition-all flex items-center justify-center space-x-2 text-base active:scale-[0.99]"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>踏入天外世界 • 開始遊戲</span>
          </button>
        </div>
      </div>
    </div>
  );
}
