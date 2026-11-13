import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  HelpCircle,
  Users,
  Layers,
  X,
  Wand2,
  Trash2,
  Filter,
  ShieldAlert,
  Star,
  UserMinus
} from 'lucide-react';
import { ELEMENTS, MAX_LEVEL } from '../data/constants';
import { calculateHeroEffectiveStats } from '../utils/statCalculator';
import { getRowPositionBuffs } from '../utils/formationHelper';

const TIER_BADGE_STYLES = {
  5: 'bg-gradient-to-r from-rose-950 to-amber-950 text-amber-200 border-amber-400 shadow-sm shadow-amber-500/20',
  4: 'bg-purple-950/80 text-purple-200 border-purple-400/80',
  3: 'bg-indigo-950/80 text-indigo-200 border-indigo-500/80',
  2: 'bg-emerald-950/80 text-emerald-200 border-emerald-600/80',
  1: 'bg-slate-900 text-slate-300 border-slate-700'
};

const JOB_FILTER_OPTIONS = ['全部', '猛將', '術士', '藥師', '巧匠', '風水師'];

/**
 * 將技能卡陣列依模板摺疊成群組，附帶持有數量與可用實體清單
 */
function groupSkillCards(cards = []) {
  const map = new Map();
  cards.forEach(card => {
    const key = `${card.id || card.name}__${card.type}`;
    if (!map.has(key)) {
      map.set(key, {
        key,
        sample: card,
        count: 0,
        instances: []
      });
    }
    const entry = map.get(key);
    entry.count += 1;
    entry.instances.push(card);
  });
  return Array.from(map.values()).sort((a, b) => {
    if (a.sample.type !== b.sample.type) {
      return a.sample.type === 'active' ? -1 : 1;
    }
    return (b.count || 0) - (a.count || 0);
  });
}

export default function HeroRosterTab({
  isInCombat,
  isFengShui,
  heroRoster,
  activeHeroInstanceIds,
  skillCardsInventory,
  handleToggleDeployHero,
  handleFuseHero,
  handleFuseAllHeroes,
  fusionFeedback,
  MAX_HERO_FUSION = 5,
  handleReleaseHero,
  handleEquipSkillCard,
  handleUnequipSkillCard,
  handleRestInn,
  getHeroRowIdx,
  setHelpModalTab
}) {
  // 焦點配置視窗目標英雄 ID
  const [configuringHeroId, setConfiguringHeroId] = useState(null);
  // 配置視窗內是否顯示「其他英雄穿戴中的卡片」提示
  const [showOccupiedCards, setShowOccupiedCards] = useState(false);
  // 待命名冊職業篩選與高星篩選
  const [benchJobFilter, setBenchJobFilter] = useState('全部');
  const [onlyStarredBench, setOnlyStarredBench] = useState(false);
  // 精簡背包檢視篩選
  const [bagTypeFilter, setBagTypeFilter] = useState('all');

  // 排序函式：Tier 高 → 低 ➔ 星級 ★+ 高 → 低 ➔ 等級高 → 低
  const compareHeroes = (a, b) => {
    const tierDiff = (b.tier || 1) - (a.tier || 1);
    if (tierDiff !== 0) return tierDiff;

    const fusionDiff = (b.fusionLevel || 0) - (a.fusionLevel || 0);
    if (fusionDiff !== 0) return fusionDiff;

    return (b.level || 1) - (a.level || 1);
  };

  // 1. 出戰英雄（置頂，依站位列次與品階排序）
  const deployedHeroes = useMemo(() => {
    return heroRoster
      .filter(h => activeHeroInstanceIds.includes(h.instanceId))
      .sort((a, b) => {
        const rowDiff = getHeroRowIdx(a.instanceId) - getHeroRowIdx(b.instanceId);
        if (rowDiff !== 0) return rowDiff;
        return compareHeroes(a, b);
      });
  }, [heroRoster, activeHeroInstanceIds, getHeroRowIdx]);

  // 2. 待命英雄（依品階、星級、等級排序，並套用職業與高星篩選）
  const benchHeroes = useMemo(() => {
    return heroRoster
      .filter(h => !activeHeroInstanceIds.includes(h.instanceId))
      .filter(h => benchJobFilter === '全部' || h.heroClass === benchJobFilter)
      .filter(h => !onlyStarredBench || (h.fusionLevel || 0) >= 1)
      .sort(compareHeroes);
  }, [heroRoster, activeHeroInstanceIds, benchJobFilter, onlyStarredBench]);

  // 3. 同名技能卡摺疊群組
  const groupedInventoryCards = useMemo(
    () => groupSkillCards(skillCardsInventory),
    [skillCardsInventory]
  );

  // 4. 計算其他英雄已裝備的卡片清單（方便找回被板凳英雄穿走的卡片）
  const occupiedCardsByOthers = useMemo(() => {
    if (!configuringHeroId) return [];
    const list = [];
    heroRoster.forEach(h => {
      if (h.instanceId === configuringHeroId) return;
      [...(h.activeSkillSlots || []), ...(h.passiveSkillSlots || [])].forEach(c => {
        list.push({ card: c, owner: h });
      });
    });
    return list;
  }, [heroRoster, configuringHeroId]);

  // 5. 計算可手動突破次數
  const totalFusibleOps = useMemo(() => {
    const groups = {};
    heroRoster.forEach(h => {
      if (!groups[h.baseId]) groups[h.baseId] = [];
      groups[h.baseId].push(h);
    });
    let ops = 0;
    Object.values(groups).forEach(group => {
      if (group.length < 2) return;
      const maxCurStar = Math.max(...group.map(g => Math.min(MAX_HERO_FUSION, g.fusionLevel || 0)));
      const room = MAX_HERO_FUSION - maxCurStar;
      ops += Math.min(room, group.length - 1);
    });
    return ops;
  }, [heroRoster, MAX_HERO_FUSION]);

  // 6. 篩選可安全批量遣散的冗餘分身（未出戰、★+0、無穿戴技能卡、且名冊已有滿星 ★+5 本尊）
  const redundantDupHeroes = useMemo(() => {
    const maxStarByBase = {};
    heroRoster.forEach(h => {
      const f = h.fusionLevel || 0;
      if ((maxStarByBase[h.baseId] || 0) < f) {
        maxStarByBase[h.baseId] = f;
      }
    });

    return heroRoster.filter(h => {
      const isDeployed = activeHeroInstanceIds.includes(h.instanceId);
      const hasCards =
        (h.activeSkillSlots?.length || 0) + (h.passiveSkillSlots?.length || 0) > 0;
      const isZeroStar = (h.fusionLevel || 0) === 0;
      const hasMaxedMain = (maxStarByBase[h.baseId] || 0) >= MAX_HERO_FUSION;
      return !isDeployed && !hasCards && isZeroStar && hasMaxedMain;
    });
  }, [heroRoster, activeHeroInstanceIds, MAX_HERO_FUSION]);

  const handleBulkReleaseRedundant = () => {
    if (isInCombat || redundantDupHeroes.length === 0) return;
    if (
      !window.confirm(
        `確定一鍵遣散 ${redundantDupHeroes.length} 位「已滿星溢出的未出戰白板分身」嗎？（已出戰、有星級或穿有技能卡的英雄絕不會被遣散）`
      )
    ) {
      return;
    }
    redundantDupHeroes.forEach(h => {
      if (configuringHeroId === h.instanceId) setConfiguringHeroId(null);
      handleReleaseHero(h);
    });
  };

  const configuringHero = heroRoster.find(h => h.instanceId === configuringHeroId) || null;

  // 一鍵卸下目標英雄全部技能卡
  const handleUnequipAllForHero = (hero) => {
    if (isInCombat || !hero) return;
    const allEquipped = [
      ...(hero.activeSkillSlots || []),
      ...(hero.passiveSkillSlots || [])
    ];
    allEquipped.forEach(card => {
      handleUnequipSkillCard(hero.instanceId, card);
    });
  };

  // 一鍵智慧推薦配卡（優先湊滿 2 張主動觸發雙卡共鳴 + 2 張被動）
  const handleAutoEquipForHero = (hero) => {
    if (isInCombat || !hero) return;
    const compatible = skillCardsInventory.filter(c =>
      c.allowedJobs?.includes(hero.heroClass)
    );
    if (compatible.length === 0) return;

    const curActiveCount = hero.activeSkillSlots?.length || 0;
    const curPassiveCount = hero.passiveSkillSlots?.length || 0;
    const usedUids = new Set();

    let needActive = Math.max(0, 2 - curActiveCount);
    const existingActiveNames = new Set((hero.activeSkillSlots || []).map(c => c.name));
    const activeCandidates = compatible.filter(c => c.type === 'active');

    for (const c of activeCandidates) {
      if (needActive <= 0) break;
      if (!existingActiveNames.has(c.name) && !usedUids.has(c.uid)) {
        handleEquipSkillCard(hero.instanceId, c);
        usedUids.add(c.uid);
        existingActiveNames.add(c.name);
        needActive -= 1;
      }
    }
    for (const c of activeCandidates) {
      if (needActive <= 0) break;
      if (!usedUids.has(c.uid)) {
        handleEquipSkillCard(hero.instanceId, c);
        usedUids.add(c.uid);
        needActive -= 1;
      }
    }

    let needPassive = Math.max(0, 2 - curPassiveCount);
    const existingPassiveNames = new Set((hero.passiveSkillSlots || []).map(c => c.name));
    const passiveCandidates = compatible.filter(c => c.type === 'passive');

    for (const c of passiveCandidates) {
      if (needPassive <= 0) break;
      if (!existingPassiveNames.has(c.name) && !usedUids.has(c.uid)) {
        handleEquipSkillCard(hero.instanceId, c);
        usedUids.add(c.uid);
        existingPassiveNames.add(c.name);
        needPassive -= 1;
      }
    }
    for (const c of passiveCandidates) {
      if (needPassive <= 0) break;
      if (!usedUids.has(c.uid)) {
        handleEquipSkillCard(hero.instanceId, c);
        usedUids.add(c.uid);
        needPassive -= 1;
      }
    }
  };

  // 渲染單張英雄卡片
  const renderHeroCard = (hero, isDeployed) => {
    const hRow = getHeroRowIdx(hero.instanceId);
    const rowLabel = isDeployed ? getRowPositionBuffs(hRow * 3).label : '待命中';
    const {
      effectiveMaxHp,
      effectiveAtk,
      effectiveDef,
      effectiveSpeed,
      skillChance
    } = calculateHeroEffectiveStats(hero, isFengShui, null, hRow);

    const fusionLvl = Math.min(MAX_HERO_FUSION, hero.fusionLevel || 0);
    const duplicateCount = heroRoster.filter(
      h => h.baseId === hero.baseId && h.instanceId !== hero.instanceId
    ).length;
    const canFuse = !isInCombat && duplicateCount > 0 && fusionLvl < MAX_HERO_FUSION;
    const hasDualActive = (hero.activeSkillSlots || []).length >= 2;
    const tierBadgeClass = TIER_BADGE_STYLES[hero.tier] || TIER_BADGE_STYLES[1];
    const isConfiguringThis = configuringHeroId === hero.instanceId;

    const compatibleBagCount = skillCardsInventory.filter(c =>
      c.allowedJobs?.includes(hero.heroClass)
    ).length;

    return (
      <div
        key={hero.instanceId}
        className={`bg-slate-950 p-4 rounded-2xl border space-y-3 flex flex-col justify-between transition-all ${
          isConfiguringThis
            ? 'border-cyan-400 ring-2 ring-cyan-400/40 shadow-xl shadow-cyan-950/30'
            : isDeployed
              ? 'border-amber-500/80 shadow-lg shadow-amber-950/25'
              : (hero.tier || 1) >= 4
                ? 'border-purple-800/60'
                : 'border-slate-800'
        }`}
      >
        <div className="space-y-2.5">
          {/* 頂部識別列 */}
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`text-[10px] px-2 py-0.5 rounded border font-mono font-black ${tierBadgeClass}`}>
                Tier {hero.tier}
              </span>
              <span className="text-lg">{hero.icon || '🧑'}</span>
              <span className="font-extrabold text-amber-300 text-sm">{hero.name}</span>
              {fusionLvl > 0 && (
                <span className="text-[11px] bg-gradient-to-r from-amber-600/30 to-purple-600/30 text-amber-200 border border-amber-400/80 px-2 py-0.5 rounded font-mono font-black">
                  ★+{fusionLvl}
                </span>
              )}
              <span className="text-[10px] bg-slate-900 text-slate-300 border border-slate-700 px-2 py-0.5 rounded font-mono">
                {hero.heroClass}
              </span>
              <span className="text-[10px] bg-slate-900 text-cyan-300 border border-slate-700 px-2 py-0.5 rounded">
                {ELEMENTS[hero.element]?.icon} {hero.element}
              </span>
            </div>

            <span
              className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${
                isDeployed
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                  : 'bg-slate-900 text-slate-400 border-slate-700'
              }`}
            >
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
                  🔥 ★+5 無雙連攜（25% 技能卡二連發）
                </span>
              )}
            </div>
          )}

          {/* 等級與突破加成 */}
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>
              Lv.<strong className="text-slate-100">{hero.level}</strong> / {MAX_LEVEL}
              {fusionLvl > 0 && (
                <span className="text-amber-300 ml-2">
                  (突破全屬性 +{fusionLvl * 15}%)
                </span>
              )}
            </span>
            <span>
              {hero.level >= MAX_LEVEL ? 'EXP MAX' : `EXP ${hero.exp}/${hero.maxExp}`}
            </span>
          </div>

          {/* 有效面板數值 */}
          <div className="grid grid-cols-5 gap-1.5 text-center font-mono text-[11px] bg-slate-900/90 p-2 rounded-xl border border-slate-800/90">
            <div>
              <div className="text-[10px] text-slate-500">❤️ 生命</div>
              <div className="font-bold text-rose-400">{hero.hp}/{effectiveMaxHp}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500">⚔️ 攻擊</div>
              <div className="font-bold text-amber-300">{effectiveAtk}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500">🛡️ 防禦</div>
              <div className="font-bold text-indigo-300">{effectiveDef}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500">⚡ 速度</div>
              <div className="font-bold text-emerald-300">{effectiveSpeed}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500">✨ 技發率</div>
              <div className="font-bold text-cyan-300">{Math.round(skillChance * 100)}%</div>
            </div>
          </div>

          {/* 四維根骨 */}
          <div className="text-[11px] font-mono text-slate-400 flex justify-between px-1">
            <span>力 STR: <strong className="text-slate-200">{hero.stats?.str}</strong></span>
            <span>體 CON: <strong className="text-slate-200">{hero.stats?.con}</strong></span>
            <span>智 INT: <strong className="text-slate-200">{hero.stats?.int}</strong></span>
            <span>敏 AGI: <strong className="text-slate-200">{hero.stats?.agi}</strong></span>
          </div>

          {/* 技能卡插槽區（點擊空槽直接開啟該英雄選卡視窗） */}
          <div className="space-y-1.5 pt-1 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-amber-300">
                ⚡ 主動技能卡 ({hero.activeSkillSlots?.length || 0}/2)
              </span>
              {hasDualActive ? (
                <span className="text-[10px] bg-amber-500/20 text-amber-200 border border-amber-400/60 px-2 py-0.5 rounded font-bold">
                  🔥 雙卡共鳴 (+10%率/+15%威)
                </span>
              ) : (
                <button
                  type="button"
                  disabled={isInCombat}
                  onClick={() => setConfiguringHeroId(hero.instanceId)}
                  className="text-[10px] text-cyan-300 hover:text-cyan-200 underline disabled:opacity-40"
                >
                  + 配置技能卡 ({compatibleBagCount}張可用)
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {[0, 1].map(idx => {
                const card = hero.activeSkillSlots?.[idx];
                return card ? (
                  <button
                    key={card.uid || idx}
                    type="button"
                    disabled={isInCombat}
                    onClick={() => handleUnequipSkillCard(hero.instanceId, card)}
                    title="點擊直接卸下技能卡"
                    className="text-left p-2 rounded-xl bg-amber-950/40 border border-amber-600/60 hover:border-rose-400 text-[11px] transition-all group"
                  >
                    <div className="font-bold text-amber-200 truncate flex justify-between items-center">
                      <span className="truncate">⚡ {card.name}</span>
                      <span className="text-[9px] text-rose-300 opacity-0 group-hover:opacity-100 shrink-0 ml-1">卸下</span>
                    </div>
                    <div className="text-[10px] text-slate-300 truncate">{card.desc}</div>
                  </button>
                ) : (
                  <button
                    key={idx}
                    type="button"
                    disabled={isInCombat}
                    onClick={() => setConfiguringHeroId(hero.instanceId)}
                    className="p-2 rounded-xl bg-slate-900/60 hover:bg-amber-950/30 border border-dashed border-slate-700 hover:border-amber-400 text-[10px] text-slate-400 hover:text-amber-300 text-center transition-all disabled:opacity-40"
                  >
                    + 鑲嵌主動卡
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-[11px] pt-1">
              <span className="font-bold text-cyan-300">
                💠 被動技能卡 ({hero.passiveSkillSlots?.length || 0}/2)
              </span>
              <span className="text-[10px] text-emerald-300 font-mono">全被動效果 ×1.5 倍</span>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {[0, 1].map(idx => {
                const card = hero.passiveSkillSlots?.[idx];
                return card ? (
                  <button
                    key={card.uid || idx}
                    type="button"
                    disabled={isInCombat}
                    onClick={() => handleUnequipSkillCard(hero.instanceId, card)}
                    title="點擊直接卸下技能卡"
                    className="text-left p-2 rounded-xl bg-cyan-950/40 border border-cyan-600/60 hover:border-rose-400 text-[11px] transition-all group"
                  >
                    <div className="font-bold text-cyan-200 truncate flex justify-between items-center">
                      <span className="truncate">💠 {card.name}</span>
                      <span className="text-[9px] text-rose-300 opacity-0 group-hover:opacity-100 shrink-0 ml-1">卸下</span>
                    </div>
                    <div className="text-[10px] text-emerald-300 truncate">{card.desc} (×1.5)</div>
                  </button>
                ) : (
                  <button
                    key={idx}
                    type="button"
                    disabled={isInCombat}
                    onClick={() => setConfiguringHeroId(hero.instanceId)}
                    className="p-2 rounded-xl bg-slate-900/60 hover:bg-cyan-950/30 border border-dashed border-slate-700 hover:border-cyan-400 text-[10px] text-slate-400 hover:text-cyan-300 text-center transition-all disabled:opacity-40"
                  >
                    + 鑲嵌被動卡
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 底部操作按鈕列 */}
        <div className="pt-2 border-t border-slate-800/80 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={isInCombat}
            onClick={() => handleToggleDeployHero(hero)}
            className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs transition-all disabled:opacity-40 ${
              isDeployed
                ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow'
            }`}
          >
            {isDeployed ? '下陣休養' : '⚔️ 派遣出戰'}
          </button>

          <button
            type="button"
            disabled={isInCombat}
            onClick={() => setConfiguringHeroId(hero.instanceId)}
            className="py-2 px-3 rounded-xl font-bold text-xs bg-cyan-950/80 hover:bg-cyan-800 text-cyan-200 border border-cyan-600/70 disabled:opacity-40 transition-all"
          >
            🃏 配卡 ({(hero.activeSkillSlots?.length || 0) + (hero.passiveSkillSlots?.length || 0)}/4)
          </button>

          {duplicateCount > 0 && (
            <button
              type="button"
              disabled={!canFuse}
              onClick={() => handleFuseHero(hero.instanceId)}
              className="py-2 px-3 rounded-xl font-black text-xs text-white bg-gradient-to-r from-purple-700 to-amber-600 hover:from-purple-600 hover:to-amber-500 disabled:opacity-40 shadow transition-all"
            >
              {fusionLvl >= MAX_HERO_FUSION
                ? '★+5 滿星'
                : `✨ 合成 → ★+${fusionLvl + 1}`}
            </button>
          )}

          <button
            type="button"
            disabled={isInCombat}
            onClick={() => {
              if (window.confirm(`確定要放走英雄【${hero.name}】嗎？（已裝備的技能卡會自動退回背包）`)) {
                if (configuringHeroId === hero.instanceId) setConfiguringHeroId(null);
                handleReleaseHero(hero);
              }
            }}
            className="py-2 px-2.5 rounded-xl font-bold text-xs bg-rose-950/70 hover:bg-rose-800 text-rose-300 border border-rose-800/70 disabled:opacity-40 transition-all"
          >
            放走
          </button>
        </div>
      </div>
    );
  };

  const filteredBagGroups = useMemo(() => {
    if (bagTypeFilter === 'all') return groupedInventoryCards;
    return groupedInventoryCards.filter(g => g.sample.type === bagTypeFilter);
  }, [groupedInventoryCards, bagTypeFilter]);

  return (
    <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur space-y-6 max-w-5xl mx-auto">
      {/* 標題與全局操作列 */}
      <div className="flex flex-wrap justify-between items-center gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-amber-400" />
          <div>
            <h2 className="font-extrabold text-amber-400 text-lg">👥 英雄陣容、自動突破與技能卡配置</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              出戰陣容：{deployedHeroes.length} / 4 位（置頂顯示） • 客棧待命：{heroRoster.length - deployedHeroes.length} 位 • 持有技能卡：{skillCardsInventory.length} 張
            </p>
          </div>
          {setHelpModalTab && (
            <button
              type="button"
              onClick={() => setHelpModalTab('heroes')}
              className="text-slate-400 hover:text-amber-300 transition-colors"
              title="查看英雄與技能卡說明"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {totalFusibleOps > 0 && (
            <button
              type="button"
              disabled={isInCombat}
              onClick={handleFuseAllHeroes}
              className="px-3.5 py-2 bg-gradient-to-r from-purple-700 to-amber-600 hover:from-purple-600 hover:to-amber-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-black rounded-xl text-xs shadow transition-all"
            >
              ✨ 合成餘下分身 ({totalFusibleOps}次)
            </button>
          )}

          {redundantDupHeroes.length > 0 && (
            <button
              type="button"
              disabled={isInCombat}
              onClick={handleBulkReleaseRedundant}
              className="px-3.5 py-2 bg-rose-950/80 hover:bg-rose-800 text-rose-200 border border-rose-700/70 disabled:opacity-40 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all"
              title="僅遣散未出戰、★+0、無穿戴任何技能卡且已有滿星本尊的溢出分身"
            >
              <UserMinus className="w-3.5 h-3.5" />
              <span>遣散溢出分身 ({redundantDupHeroes.length})</span>
            </button>
          )}

          <button
            type="button"
            disabled={isInCombat}
            onClick={handleRestInn}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs shadow transition-all"
          >
            {isInCombat ? '🔒 戰鬥中無法休養' : '🏨 客棧全隊休養'}
          </button>
        </div>
      </div>

      {/* 同名合成即時提示 */}
      {fusionFeedback && (
        <div
          className={`rounded-2xl p-3.5 border text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md ${
            fusionFeedback.type === 'danger'
              ? 'bg-rose-950/60 border-rose-500/70 text-rose-200'
              : 'bg-purple-950/60 border-amber-400/80 text-amber-200'
          }`}
        >
          <Sparkles className="w-4 h-4 shrink-0 text-amber-300" />
          <span>{fusionFeedback.text}</span>
        </div>
      )}

      {/* 區塊一：當前出戰陣容（固定置頂） */}
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-amber-300">⚔️ 當前出戰陣容 ({deployedHeroes.length} / 4)</span>
            <span className="text-[11px] text-slate-400">點擊英雄卡片上的卡槽或「🃏 配卡」即可直接配置技能卡</span>
          </div>
        </div>

        {deployedHeroes.length === 0 ? (
          <div className="bg-slate-950/70 border border-dashed border-amber-500/40 rounded-2xl p-6 text-center text-xs text-slate-400">
            目前尚無出戰英雄，請從下方「客棧待命名冊」點擊「⚔️ 派遣出戰」！
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {deployedHeroes.map(hero => renderHeroCard(hero, true))}
          </div>
        )}
      </div>

      {/* 區塊二：客棧待命名冊（依 Tier 高 → 低排列，附職業與星級篩選） */}
      <div className="space-y-3 pt-4 border-t border-slate-800/90">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-extrabold text-slate-200">
              💤 客棧待命名冊 ({heroRoster.length - deployedHeroes.length} 位)
            </span>
            <span className="text-[11px] text-slate-500">依 Tier 品階 → 星級 → 等級排序</span>
          </div>

          {/* 職業與高星篩選膠囊 */}
          <div className="flex flex-wrap items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            {JOB_FILTER_OPTIONS.map(job => (
              <button
                key={job}
                type="button"
                onClick={() => setBenchJobFilter(job)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all ${
                  benchJobFilter === job
                    ? 'bg-amber-500 text-slate-950 border-amber-300'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-600'
                }`}
              >
                {job}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setOnlyStarredBench(prev => !prev)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1 transition-all ${
                onlyStarredBench
                  ? 'bg-purple-600 text-white border-purple-300'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-purple-500/60'
              }`}
            >
              <Star className="w-3 h-3" />
              <span>★+1以上</span>
            </button>
          </div>
        </div>

        {benchHeroes.length === 0 ? (
          <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-5 text-center text-xs text-slate-500">
            {heroRoster.length === deployedHeroes.length
              ? '所有招募的英雄皆已上陣作戰！'
              : '目前沒有符合篩選條件的待命英雄。'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {benchHeroes.map(hero => renderHeroCard(hero, false))}
          </div>
        )}
      </div>

      {/* 區塊三：精簡技能卡倉庫總覽（同名卡片自動摺疊顯示 ×N） */}
      <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-amber-300 text-sm">
              🃏 技能卡倉庫總覽（共 {skillCardsInventory.length} 張 / {groupedInventoryCards.length} 種）
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px]">
            {[
              { id: 'all', label: '全部' },
              { id: 'active', label: '⚡ 主動卡' },
              { id: 'passive', label: '💠 被動卡' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setBagTypeFilter(tab.id)}
                className={`px-2.5 py-1 rounded-lg font-bold border transition-all ${
                  bagTypeFilter === tab.id
                    ? 'bg-cyan-600 text-white border-cyan-400'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {filteredBagGroups.length === 0 ? (
          <div className="text-xs text-slate-500 py-4 text-center">
            倉庫目前無此類閒置技能卡，可透過戰鬥掉落、鎮魔塔或江湖市集盲盒獲得！
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {filteredBagGroups.map(group => {
              const card = group.sample;
              const isActive = card.type === 'active';
              return (
                <div
                  key={group.key}
                  className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex flex-col justify-between gap-1.5"
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <span className={`text-xs font-bold truncate ${isActive ? 'text-amber-300' : 'text-cyan-300'}`}>
                      {isActive ? '⚡' : '💠'} {card.name}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[11px] font-mono font-black bg-slate-950 text-amber-200 border border-amber-500/50 px-2 py-0.5 rounded-full">
                        ×{group.count}
                      </span>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-300">{card.desc}</div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                    <span>適用：{card.allowedJobs?.join('、')}</span>
                    <span className={isActive ? 'text-amber-400' : 'text-emerald-400'}>
                      {isActive ? '主動・1.35x' : '被動・1.5x'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 焦點配置視窗（Modal）：先選英雄、後選卡（自動篩選適用職業 + 同名卡 ×N 摺疊） */}
      {configuringHero && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5"
          onClick={() => setConfiguringHeroId(null)}
        >
          <div
            className="bg-slate-900 border-2 border-cyan-500/80 rounded-3xl max-w-3xl w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal 頂部標題與目標英雄切換列 */}
            <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-2xl">{configuringHero.icon || '🧑'}</span>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-black text-base sm:text-lg text-amber-300">
                      🃏 配置技能卡 — {configuringHero.name}
                    </h3>
                    <span className="text-xs bg-cyan-950 text-cyan-300 border border-cyan-700 px-2.5 py-0.5 rounded-full font-bold">
                      {configuringHero.heroClass} • Tier {configuringHero.tier}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    已自動篩選【{configuringHero.heroClass}】可用的技能卡，點擊下方卡片即可直接鑲嵌
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setConfiguringHeroId(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="關閉視窗"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal 滾動內容區 */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-5">
              {/* 快速切換其他出戰英雄 */}
              {deployedHeroes.length > 1 && (
                <div className="flex items-center gap-1.5 flex-wrap text-xs">
                  <span className="text-slate-400 font-bold mr-1">切換出戰隊友：</span>
                  {deployedHeroes.map(dh => (
                    <button
                      key={dh.instanceId}
                      type="button"
                      onClick={() => setConfiguringHeroId(dh.instanceId)}
                      className={`px-2.5 py-1 rounded-xl font-bold border transition-all ${
                        dh.instanceId === configuringHero.instanceId
                          ? 'bg-cyan-600 text-white border-cyan-300'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-amber-500/60'
                      }`}
                    >
                      {dh.icon} {dh.name} ({dh.heroClass})
                    </button>
                  ))}
                </div>
              )}

              {/* 目標英雄目前 4 個卡槽狀態與快捷按鈕 */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-amber-300">
                    📌 當前已鑲嵌卡槽（點擊已裝卡片可直接卸下）
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isInCombat}
                      onClick={() => handleAutoEquipForHero(configuringHero)}
                      className="px-3 py-1.5 rounded-xl font-bold text-xs bg-gradient-to-r from-amber-600 to-cyan-600 hover:from-amber-500 hover:to-cyan-500 text-white shadow flex items-center gap-1 disabled:opacity-40"
                    >
                      <Wand2 className="w-3.5 h-3.5" />
                      <span>✨ 一鍵推薦配卡</span>
                    </button>

                    {((configuringHero.activeSkillSlots?.length || 0) + (configuringHero.passiveSkillSlots?.length || 0)) > 0 && (
                      <button
                        type="button"
                        disabled={isInCombat}
                        onClick={() => handleUnequipAllForHero(configuringHero)}
                        className="px-3 py-1.5 rounded-xl font-bold text-xs bg-rose-950/80 hover:bg-rose-800 text-rose-200 border border-rose-700/70 flex items-center gap-1 disabled:opacity-40"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>全卸下</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* 主動卡槽 2 格 */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-amber-300">
                      <span>⚡ 主動技能卡 ({configuringHero.activeSkillSlots?.length || 0}/2)</span>
                      {(configuringHero.activeSkillSlots?.length || 0) >= 2 && (
                        <span className="text-emerald-300">🔥 雙卡共鳴已啟動</span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {[0, 1].map(idx => {
                        const card = configuringHero.activeSkillSlots?.[idx];
                        return card ? (
                          <button
                            key={card.uid || idx}
                            type="button"
                            disabled={isInCombat}
                            onClick={() => handleUnequipSkillCard(configuringHero.instanceId, card)}
                            className="p-2.5 rounded-xl bg-amber-950/50 border border-amber-500/70 hover:border-rose-400 text-left transition-all"
                          >
                            <div className="text-xs font-bold text-amber-200 truncate">⚡ {card.name}</div>
                            <div className="text-[10px] text-slate-300 truncate mt-0.5">{card.desc}</div>
                            <div className="text-[10px] text-rose-300 font-bold mt-1">點擊卸下</div>
                          </button>
                        ) : (
                          <div
                            key={idx}
                            className="p-2.5 rounded-xl bg-slate-900/60 border border-dashed border-slate-700 flex items-center justify-center text-[11px] text-slate-500 min-h-[64px]"
                          >
                            空主動槽 #{idx + 1}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 被動卡槽 2 格 */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-cyan-300">
                      <span>💠 被動技能卡 ({configuringHero.passiveSkillSlots?.length || 0}/2)</span>
                      <span className="text-emerald-300">效果 ×1.5 倍</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {[0, 1].map(idx => {
                        const card = configuringHero.passiveSkillSlots?.[idx];
                        return card ? (
                          <button
                            key={card.uid || idx}
                            type="button"
                            disabled={isInCombat}
                            onClick={() => handleUnequipSkillCard(configuringHero.instanceId, card)}
                            className="p-2.5 rounded-xl bg-cyan-950/50 border border-cyan-500/70 hover:border-rose-400 text-left transition-all"
                          >
                            <div className="text-xs font-bold text-cyan-200 truncate">💠 {card.name}</div>
                            <div className="text-[10px] text-emerald-300 truncate mt-0.5">{card.desc}</div>
                            <div className="text-[10px] text-rose-300 font-bold mt-1">點擊卸下</div>
                          </button>
                        ) : (
                          <div
                            key={idx}
                            className="p-2.5 rounded-xl bg-slate-900/60 border border-dashed border-slate-700 flex items-center justify-center text-[11px] text-slate-500 min-h-[64px]"
                          >
                            空被動槽 #{idx + 1}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* 可裝備的相容技能卡清單（已依同名摺疊為 ×N） */}
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-emerald-300">
                    ✅ 倉庫中【{configuringHero.heroClass}】可用技能卡（同名已摺疊）
                  </span>

                  {occupiedCardsByOthers.length > 0 && (
                    <label className="flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={showOccupiedCards}
                        onChange={(e) => setShowOccupiedCards(e.target.checked)}
                        className="rounded border-slate-700 bg-slate-950 text-cyan-500"
                      />
                      <span>顯示其他隊友穿戴中的卡片 ({occupiedCardsByOthers.length})</span>
                    </label>
                  )}
                </div>

                {(() => {
                  const compatibleGroups = groupedInventoryCards.filter(g =>
                    g.sample.allowedJobs?.includes(configuringHero.heroClass)
                  );

                  if (compatibleGroups.length === 0) {
                    return (
                      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 text-center text-xs text-slate-400">
                        目前倉庫中沒有【{configuringHero.heroClass}】可用的閒置技能卡。
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {compatibleGroups.map(group => {
                        const card = group.sample;
                        const isActive = card.type === 'active';
                        const isSlotFull = isActive
                          ? (configuringHero.activeSkillSlots?.length || 0) >= 2
                          : (configuringHero.passiveSkillSlots?.length || 0) >= 2;
                        const nextCardInstance = group.instances[0];

                        return (
                          <div
                            key={group.key}
                            className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex flex-col justify-between gap-2.5"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center justify-between gap-1.5">
                                <span className={`text-xs font-extrabold ${isActive ? 'text-amber-300' : 'text-cyan-300'}`}>
                                  {isActive ? '⚡' : '💠'} {card.name}
                                </span>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className="text-[11px] font-mono font-black bg-slate-900 text-amber-200 border border-amber-500/50 px-2 py-0.5 rounded-full">
                                    持有 ×{group.count}
                                  </span>
                                  <span
                                    className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${
                                      isActive
                                        ? 'bg-amber-950/60 text-amber-300 border-amber-700/60'
                                        : 'bg-cyan-950/60 text-cyan-300 border-cyan-700/60'
                                    }`}
                                  >
                                    {isActive ? '主動' : '被動'}
                                  </span>
                                </div>
                              </div>
                              <div className="text-[11px] text-slate-300 leading-relaxed">{card.desc}</div>
                            </div>

                            <button
                              type="button"
                              disabled={isInCombat || isSlotFull || !nextCardInstance}
                              onClick={() => handleEquipSkillCard(configuringHero.instanceId, nextCardInstance)}
                              className={`w-full py-2 rounded-xl font-black text-xs transition-all disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white ${
                                isActive
                                  ? 'bg-amber-600 hover:bg-amber-500'
                                  : 'bg-cyan-600 hover:bg-cyan-500'
                              }`}
                            >
                              {isInCombat
                                ? '🔒 戰鬥中鎖定'
                                : isSlotFull
                                  ? `${isActive ? '主動' : '被動'}卡槽已滿 (2/2)`
                                  : `+ 鑲嵌至【${configuringHero.name}】`}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

                {/* 選配檢視：其他隊友穿戴中的卡片 */}
                {showOccupiedCards && occupiedCardsByOthers.length > 0 && (
                  <div className="pt-3 border-t border-slate-800 space-y-2">
                    <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                      <span>其他英雄穿戴中的技能卡（點擊可先卸下退回倉庫）：</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {occupiedCardsByOthers
                        .filter(item => item.card.allowedJobs?.includes(configuringHero.heroClass))
                        .map(({ card, owner }) => (
                          <div
                            key={card.uid}
                            className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between gap-2 text-xs"
                          >
                            <div className="min-w-0">
                              <div className="font-bold text-slate-200 truncate">
                                {card.type === 'active' ? '⚡' : '💠'} {card.name}
                              </div>
                              <div className="text-[10px] text-amber-300 truncate">
                                由【{owner.name}】穿戴中
                              </div>
                            </div>
                            <button
                              type="button"
                              disabled={isInCombat}
                              onClick={() => handleUnequipSkillCard(owner.instanceId, card)}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-rose-900 text-slate-200 hover:text-rose-200 text-[11px] font-bold shrink-0"
                            >
                              卸下退回
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal 底部完成按鈕 */}
            <div className="p-3.5 border-t border-slate-800 bg-slate-950/90 flex justify-end">
              <button
                type="button"
                onClick={() => setConfiguringHeroId(null)}
                className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow transition-all"
              >
                完成配置
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
