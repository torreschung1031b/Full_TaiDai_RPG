export const MAX_LEVEL = 30;
export const MAX_SKILL_LEVEL = 10;
export const LOCAL_STORAGE_KEY = 'MYSTINA_RPG_SAVE_V3';

export const ELEMENTS = {
  '金': { name: '金', icon: '⚔️', counters: '木', color: 'text-amber-300 bg-amber-950/40 border-amber-500/50', badge: 'bg-amber-500 text-slate-950', border: 'border-amber-500/50' },
  '木': { name: '木', icon: '🌿', counters: '土', color: 'text-emerald-400 bg-emerald-950/40 border-emerald-500/50', badge: 'bg-emerald-500 text-slate-950', border: 'border-emerald-500/50' },
  '水': { name: '水', icon: '💧', counters: '火', color: 'text-cyan-400 bg-cyan-950/40 border-cyan-500/50', badge: 'bg-cyan-500 text-slate-950', border: 'border-cyan-500/50' },
  '火': { name: '火', icon: '🔥', counters: '金', color: 'text-rose-400 bg-rose-950/40 border-rose-500/50', badge: 'bg-rose-500 text-slate-950', border: 'border-rose-500/50' },
  '土': { name: '土', icon: '🪨', counters: '水', color: 'text-yellow-600 bg-yellow-950/40 border-yellow-600/50', badge: 'bg-yellow-600 text-slate-950', border: 'border-yellow-600/50' }
};

export const ELEMENT_KEYS = ['金', '木', '水', '火', '土'];

export const ZONES = [
  { id: 'z1', name: '新手竹林 (Lvl.1-4)', monsters: [{ name: '竹林野兔', hp: 80, atk: 16, def: 3, exp: 35, gold: 25 }, { name: '青竹小蛇', hp: 100, atk: 20, def: 5, exp: 45, gold: 30 }] },
  { id: 'z2', name: '黑山寨 (Lvl.5-9)', monsters: [{ name: '黃巾刀客', hp: 220, atk: 36, def: 9, exp: 90, gold: 70 }, { name: '黑山狼妖', hp: 280, atk: 45, def: 12, exp: 120, gold: 95 }] },
  { id: 'z3', name: '火雲洞 (Lvl.10-14)', monsters: [{ name: '赤焰火蝠', hp: 550, atk: 68, def: 16, exp: 200, gold: 170 }, { name: '火雲洞主', hp: 980, atk: 92, def: 22, exp: 360, gold: 320 }] },
  { id: 'z4', name: '蓬萊仙島 (Lvl.15+)', monsters: [{ name: '仙境靈鹿', hp: 1350, atk: 110, def: 30, exp: 500, gold: 420 }, { name: '守護仙童', hp: 1800, atk: 135, def: 38, exp: 650, gold: 550 }] }
];
