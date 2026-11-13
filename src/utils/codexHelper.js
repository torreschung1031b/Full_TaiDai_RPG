import { HERO_TEMPLATES } from '../data/heroes';

export const CODEX_MILESTONES = [
  { count: 3, label: '初窺門徑（3 位）', bonusText: '主角攻擊力 +5%', atkPct: 0.05, hpPct: 0, defPct: 0, speedPct: 0 },
  { count: 6, label: '群英薈萃（6 位）', bonusText: '主角最大生命 +8%', atkPct: 0, hpPct: 0.08, defPct: 0, speedPct: 0 },
  { count: 10, label: '名震江湖（10 位）', bonusText: '主角防禦力 +8%', atkPct: 0, hpPct: 0, defPct: 0.08, speedPct: 0 },
  { count: 15, label: '天下歸心（15 位）', bonusText: '主角攻擊再 +5%・速度 +8%', atkPct: 0.05, hpPct: 0, defPct: 0, speedPct: 0.08 }
];

export function calculateCodexBonus(heroRoster = []) {
  const unlockedCount = HERO_TEMPLATES.filter(tmp =>
    heroRoster.some(h => h.baseId === tmp.id_base)
  ).length;

  const totals = CODEX_MILESTONES.reduce(
    (acc, m) => {
      if (unlockedCount >= m.count) {
        acc.atkPct += m.atkPct;
        acc.hpPct += m.hpPct;
        acc.defPct += m.defPct;
        acc.speedPct += m.speedPct;
      }
      return acc;
    },
    { atkPct: 0, hpPct: 0, defPct: 0, speedPct: 0 }
  );

  return {
    unlockedCount,
    totalCount: HERO_TEMPLATES.length,
    ...totals
  };
}
