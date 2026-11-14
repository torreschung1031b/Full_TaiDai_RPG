import React from 'react';
import { ELEMENTS, MAX_LEVEL } from '../../data/constants';
import { calculateHeroEffectiveStats, normalizeHero } from '../../utils/statCalculator';
import { getRowPositionBuffs } from '../../utils/formationHelper';

const TIER_BADGE_STYLES = {
  5: 'bg-gradient-to-r from-rose-950 to-amber-950 text-amber-200 border-amber-400 shadow-sm shadow-amber-500/20',
  4: 'bg-purple-950/80 text-purple-200 border-purple-400/80',
  3: 'bg-indigo-950/80 text-indigo-200 border-indigo-500/80',
  2: 'bg-emerald-950/80 text-emerald-200 border-emerald-600/80',
  1: 'bg-slate-900 text-slate-300 border-slate-700'
};

const TARGET_TYPE_LABELS = {
  aoe: '全體橫掃',
  heal: '全隊治療',
  single: '單體爆發'
};

function SkillSlotPair({ slots = [], type, isInCombat, onUnequip, onOpenConfig }) {
  const isActive = type === 'active';
  const equippedCls = isActive
    ? 'bg-amber-950/40 border-amber-600/60 text-amber-200'
    : 'bg-cyan-950/40 border-cyan-600/60 text-cyan-200';
  const emptyHoverCls = isActive
    ? 'hover:bg-amber-950/30 hover:border-amber-400 hover:text-amber-300'
    : 'hover:bg-cyan-950/30 hover:border-cyan-400 hover:text-cyan-300';

  return (
    <div className="grid grid-cols-2 gap-1.5">
      {[0, 1].map(idx => {
        const card = slots[idx];
        return card ? (
          <button
            key={`equipped-${idx}`}
            type="button"
            disabled={isInCombat}
            onClick={() => onUnequip(card)}
            title={`${card.name}：${card.desc}（點擊直接卸下）`}
            className={`h-[54px] flex flex-col justify-center text-left px-2.5 py-1.5 rounded-xl border hover:border-rose-400 text-[11px] transition-colors group overflow-hidden ${equippedCls}`}
          >
            <div className="font-bold truncate flex justify-between items-center w-full">
              <span className="truncate">{isActive ? '⚡' : '💠'} {card.name}</span>
              <span className="text-[9px] text-rose-300 opacity-0 group-hover:opacity-100 shrink-0 ml-1">卸下</span>
            </div>
            <div className={`text-[10px] truncate w-full mt-0.5 ${isActive ? 'text-slate-300' : 'text-emerald-300'}`}>
              {card.desc}{!isActive && ' (×1.5)'}
            </div>
          </button>
        ) : (
          <button
            key={`empty-${idx}`}
            type="button"
            disabled={isInCombat}
            onClick={onOpenConfig}
            className={`h-[54px] flex items-center justify-center px-2.5 py-1.5 rounded-xl bg-slate-900/60 border border-dashed border-slate-700 text-[10px] text-slate-400 text-center transition-colors disabled:opacity-40 ${emptyHoverCls}`}
          >
            + 鑲嵌{isActive ? '主動' : '被動'}卡
          </button>
        );
      })}
    </div>
  );
}

export function HeroCard({
  hero: rawHero,
  isDeployed,
  isInCombat,
  isFengShui,
  isConfiguring,
  duplicateCount,
  compatibleBagCount,
  maxFusion,
  heroRowIdx,
  onOpenConfig,
  onToggleDeploy,
  onFuseHero,
  onReleaseHero,
  onUnequipSkillCard
}) {
  const hero = normalizeHero(rawHero);
  const rowLabel = isDeployed ? getRowPositionBuffs(heroRowIdx * 3).label : '待命中';
  const { effectiveMaxHp, effectiveAtk, effectiveDef, effectiveSpeed, skillChance } =
    calculateHeroEffectiveStats(hero, isFengShui, null, heroRowIdx);

  const fusionLvl = Math.min(maxFusion, hero.fusionLevel || 0);
  const canFuse = !isInCombat && duplicateCount > 0 && fusionLvl < maxFusion;
  const hasDualActive = (hero.activeSkillSlots || []).length >= 2;
  const tierBadgeClass = TIER_BADGE_STYLES[hero.tier] || TIER_BADGE_STYLES[1];

  const sigSkill = hero.signatureSkill;
  const effectiveSigMult = sigSkill
    ? ((sigSkill.mult || 1.7) * (1 + fusionLvl * 0.12)).toFixed(2)
    : null;

  const statBoxes = [
    { label: '❤️ 生命', val: `${hero.hp}/${effectiveMaxHp}`, color: 'text-rose-400' },
    { label: '⚔️ 攻擊', val: effectiveAtk, color: 'text-amber-300' },
    { label: '🛡️ 防禦', val: effectiveDef, color: 'text-indigo-300' },
    { label: '⚡ 速度', val: effectiveSpeed, color: 'text-emerald-300' },
    { label: '✨ 技發率', val: `${Math.round(skillChance * 100)}%`, color: 'text-cyan-300' }
  ];

  const cardBorder = isConfiguring
    ? 'border-cyan-400 ring-2 ring-cyan-400/40 shadow-xl shadow-cyan-950/30'
    : isDeployed
      ? 'border-amber-500/80 shadow-lg shadow-amber-950/25'
      : (hero.tier || 1) >= 4 ? 'border-purple-800/60' : 'border-slate-800';

  return (
    <div className={`bg-slate-950 p-4 rounded-2xl border space-y-3 flex flex-col justify-between transition-colors ${cardBorder}`}>
      <div className="space-y-2.5">
        {/* 頂部識別列 */}
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`text-[10px] px-2 py-0.5 rounded border font-mono font-black ${tierBadgeClass}`}>Tier {hero.tier}</span>
            <span className="text-lg">{hero.icon || '🧑'}</span>
            <span className="font-extrabold text-amber-300 text-sm">{hero.name}</span>
            {fusionLvl > 0 && (
              <span className="text-[11px] bg-gradient-to-r from-amber-600/30 to-purple-600/30 text-amber-200 border border-amber-400/80 px-2 py-0.5 rounded font-mono font-black">
                ★+{fusionLvl}
              </span>
            )}
            <span className="text-[10px] bg-slate-900 text-slate-300 border border-slate-700 px-2 py-0.5 rounded font-mono">{hero.heroClass}</span>
            <span className="text-[10px] bg-slate-900 text-cyan-300 border border-slate-700 px-2 py-0.5 rounded">
              {ELEMENTS[hero.element]?.icon} {hero.element}
            </span>
          </div>

          <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${isDeployed ? 'bg-emerald-950 text-emerald-300 border-emerald-600' : 'bg-slate-900 text-slate-400 border-slate-700'}`}>
            {isDeployed ? `⚔️ 出戰中 (${rowLabel})` : '💤 客棧待命'}
          </span>
        </div>

        {/* 星級覺醒標籤 */}
        {fusionLvl >= 3 && (
          <div className="flex flex-wrap gap-1.5 text-[10px]">
            <span className="bg-purple-950/70 text-purple-200 border border-purple-500/60 px-2 py-0.5 rounded font-bold">
              🛡️ ★+3 護主靈罡（開戰 +{Math.floor(effectiveMaxHp * 0.15)} 護盾）
            </span>
            {fusionLvl >= 5 && (
              <span className="bg-amber-950/70 text-amber-200 border border-amber-400/80 px-2 py-0.5 rounded font-bold">
                🔥 ★+5 無雙連攜（25% 技能二連發）
              </span>
            )}
          </div>
        )}

        {/* 等級與突破 */}
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span>
            Lv.<strong className="text-slate-100">{hero.level}</strong> / {MAX_LEVEL}
            {fusionLvl > 0 && <span className="text-amber-300 ml-2">(突破全屬性 +{fusionLvl * 15}%)</span>}
          </span>
          <span>{hero.level >= MAX_LEVEL ? 'EXP MAX' : `EXP ${hero.exp}/${hero.maxExp}`}</span>
        </div>

        {/* 有效面板數值 */}
        <div className="grid grid-cols-5 gap-1.5 text-center font-mono text-[11px] bg-slate-900/90 p-2 rounded-xl border border-slate-800/90">
          {statBoxes.map(b => (
            <div key={b.label}>
              <div className="text-[10px] text-slate-500">{b.label}</div>
              <div className={`font-bold ${b.color}`}>{b.val}</div>
            </div>
          ))}
        </div>

        {/* 四維根骨 */}
        <div className="text-[11px] font-mono text-slate-400 flex justify-between px-1">
          <span>力 STR: <strong className="text-slate-200">{hero.stats?.str}</strong></span>
          <span>體 CON: <strong className="text-slate-200">{hero.stats?.con}</strong></span>
          <span>智 INT: <strong className="text-slate-200">{hero.stats?.int}</strong></span>
          <span>敏 AGI: <strong className="text-slate-200">{hero.stats?.agi}</strong></span>
        </div>

        {/* 本命天賦與固有本命絕學展示 */}
        <div className="bg-slate-900/75 border border-slate-800 rounded-xl p-2.5 space-y-1.5">
          <div className="text-[11px] leading-snug">
            <span className="text-emerald-300 font-extrabold">🌟 天賦【{hero.traitName}】：</span>
            <span className="text-slate-300">{hero.traitDesc}</span>
          </div>
          {sigSkill && (
            <div className="pt-1.5 border-t border-slate-800/80 text-[11px] space-y-0.5">
              <div className="flex items-center justify-between gap-1.5 flex-wrap">
                <span className="text-amber-300 font-extrabold">
                  {sigSkill.icon || '🔥'} 本命絕學【{sigSkill.name}】
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[10px] bg-amber-950/80 text-amber-200 border border-amber-600/60 px-1.5 py-0.2 rounded font-mono">
                    {TARGET_TYPE_LABELS[sigSkill.target] || '專屬絕技'} • {effectiveSigMult}x
                  </span>
                  <span className="text-[10px] bg-purple-950/70 text-purple-200 border border-purple-700/60 px-1.5 py-0.2 rounded">
                    固有免槽
                  </span>
                </div>
              </div>
              <div className="text-[10px] text-slate-400">{sigSkill.desc}</div>
            </div>
          )}
        </div>

       {/* 技能卡插槽區 */}
        <div className="space-y-1.5 pt-1 border-t border-slate-800/80">
          <div className="h-6 flex items-center justify-between gap-2 text-[11px] whitespace-nowrap">
            <span className="font-bold text-amber-300 tabular-nums shrink-0">
              ⚡ 額外主動技能卡 ({hero.activeSkillSlots?.length || 0}/2)
            </span>
            {hasDualActive ? (
              <span className="text-[10px] bg-amber-500/20 text-amber-200 border border-amber-400/60 px-2 py-0.5 rounded font-bold leading-none truncate">
                🔥 雙卡共鳴 (+10%率/+15%威)
              </span>
            ) : (
              <button
                type="button"
                disabled={isInCombat}
                onClick={() => onOpenConfig(hero.instanceId)}
                className="text-[10px] text-cyan-300 hover:text-cyan-200 underline disabled:opacity-40 leading-none tabular-nums truncate"
              >
                + 配置技能卡 ({compatibleBagCount}張可用)
              </button>
            )}
          </div>
          <SkillSlotPair
            slots={hero.activeSkillSlots}
            type="active"
            isInCombat={isInCombat}
            onUnequip={(c) => onUnequipSkillCard(hero.instanceId, c)}
            onOpenConfig={() => onOpenConfig(hero.instanceId)}
          />

          <div className="h-6 flex items-center justify-between gap-2 text-[11px] pt-1 whitespace-nowrap">
            <span className="font-bold text-cyan-300 tabular-nums shrink-0">
              💠 被動技能卡 ({hero.passiveSkillSlots?.length || 0}/2)
            </span>
            <span className="text-[10px] text-emerald-300 font-mono leading-none truncate">全被動效果 ×1.5 倍</span>
          </div>
          <SkillSlotPair
            slots={hero.passiveSkillSlots}
            type="passive"
            isInCombat={isInCombat}
            onUnequip={(c) => onUnequipSkillCard(hero.instanceId, c)}
            onOpenConfig={() => onOpenConfig(hero.instanceId)}
          />
        </div>
        
      {/* 底部操作按鈕列 */}
      <div className="pt-2 border-t border-slate-800/80 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={isInCombat}
          onClick={() => onToggleDeploy(hero)}
          className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs transition-colors disabled:opacity-40 ${isDeployed ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow'}`}
        >
          {isDeployed ? '下陣休養' : '⚔️ 派遣出戰'}
        </button>

        <button
          type="button"
          disabled={isInCombat}
          onClick={() => onOpenConfig(hero.instanceId)}
          className="py-2 px-3 rounded-xl font-bold text-xs bg-cyan-950/80 hover:bg-cyan-800 text-cyan-200 border border-cyan-600/70 disabled:opacity-40 transition-colors"
        >
          🃏 配卡 ({(hero.activeSkillSlots?.length || 0) + (hero.passiveSkillSlots?.length || 0)}/4)
        </button>

        {duplicateCount > 0 && (
          <button
            type="button"
            disabled={!canFuse}
            onClick={() => onFuseHero(hero.instanceId)}
            className="py-2 px-3 rounded-xl font-black text-xs text-white bg-gradient-to-r from-purple-700 to-amber-600 hover:from-purple-600 hover:to-amber-500 disabled:opacity-40 shadow transition-colors"
          >
            {fusionLvl >= maxFusion ? '★+5 滿星' : `✨ 合成 → ★+${fusionLvl + 1}`}
          </button>
        )}

        <button
          type="button"
          disabled={isInCombat}
          onClick={() => {
            if (window.confirm(`確定要放走英雄【${hero.name}】嗎？（已裝備的技能卡會自動退回背包）`)) {
              onReleaseHero(hero);
            }
          }}
          className="py-2 px-2.5 rounded-xl font-bold text-xs bg-rose-950/70 hover:bg-rose-800 text-rose-300 border border-rose-800/70 disabled:opacity-40 transition-colors"
        >
          放走
        </button>
      </div>
    </div>
  );
}
