import React, { useState, useMemo } from 'react';
import { Sparkles, HelpCircle, Users, Layers, Filter, Star, UserMinus } from 'lucide-react';
import {
  compareHeroes,
  groupSkillCards,
  calcTotalFusibleOps,
  getRedundantDupHeroes,
  pickAutoEquipCards
} from '../utils/heroRosterHelper';
import { HeroCard } from './hero/HeroCard';
import { HeroSkillConfigModal } from './hero/HeroSkillConfigModal';

const JOB_FILTER_OPTIONS = ['全部', '猛將', '術士', '藥師', '巧匠', '風水師'];

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
  const [configuringHeroId, setConfiguringHeroId] = useState(null);
  const [benchJobFilter, setBenchJobFilter] = useState('全部');
  const [onlyStarredBench, setOnlyStarredBench] = useState(false);
  const [bagTypeFilter, setBagTypeFilter] = useState('all');

  const deployedHeroes = useMemo(() => {
    return heroRoster
      .filter(h => activeHeroInstanceIds.includes(h.instanceId))
      .sort((a, b) => getHeroRowIdx(a.instanceId) - getHeroRowIdx(b.instanceId) || compareHeroes(a, b));
  }, [heroRoster, activeHeroInstanceIds, getHeroRowIdx]);

  const benchHeroes = useMemo(() => {
    return heroRoster
      .filter(h => !activeHeroInstanceIds.includes(h.instanceId))
      .filter(h => benchJobFilter === '全部' || h.heroClass === benchJobFilter)
      .filter(h => !onlyStarredBench || (h.fusionLevel || 0) >= 1)
      .sort(compareHeroes);
  }, [heroRoster, activeHeroInstanceIds, benchJobFilter, onlyStarredBench]);

  const groupedInventoryCards = useMemo(() => groupSkillCards(skillCardsInventory), [skillCardsInventory]);
  const totalFusibleOps = useMemo(() => calcTotalFusibleOps(heroRoster, MAX_HERO_FUSION), [heroRoster, MAX_HERO_FUSION]);
  const redundantDupHeroes = useMemo(
    () => getRedundantDupHeroes(heroRoster, activeHeroInstanceIds, MAX_HERO_FUSION),
    [heroRoster, activeHeroInstanceIds, MAX_HERO_FUSION]
  );

  const filteredBagGroups = useMemo(() => {
    return bagTypeFilter === 'all' ? groupedInventoryCards : groupedInventoryCards.filter(g => g.sample.type === bagTypeFilter);
  }, [groupedInventoryCards, bagTypeFilter]);

  const configuringHero = heroRoster.find(h => h.instanceId === configuringHeroId) || null;

  const handleBulkReleaseRedundant = () => {
    if (isInCombat || redundantDupHeroes.length === 0) return;
    if (!window.confirm(`確定一鍵遣散 ${redundantDupHeroes.length} 位「已滿星溢出的未出戰白板分身」嗎？（已出戰、有星級或穿有技能卡的英雄絕不會被遣散）`)) return;
    redundantDupHeroes.forEach(h => {
      if (configuringHeroId === h.instanceId) setConfiguringHeroId(null);
      handleReleaseHero(h);
    });
  };

  const handleAutoEquipForHero = (hero) => {
    if (isInCombat || !hero) return;
    pickAutoEquipCards(hero, skillCardsInventory).forEach(c => handleEquipSkillCard(hero.instanceId, c));
  };

  const handleUnequipAllForHero = (hero) => {
    if (isInCombat || !hero) return;
    [...(hero.activeSkillSlots || []), ...(hero.passiveSkillSlots || [])].forEach(c =>
      handleUnequipSkillCard(hero.instanceId, c)
    );
  };

  const renderHeroGrid = (list, isDeployed) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
      {list.map(hero => (
        <HeroCard
          key={hero.instanceId}
          hero={hero}
          isDeployed={isDeployed}
          isInCombat={isInCombat}
          isFengShui={isFengShui}
          isConfiguring={configuringHeroId === hero.instanceId}
          duplicateCount={heroRoster.filter(h => h.baseId === hero.baseId && h.instanceId !== hero.instanceId).length}
          compatibleBagCount={skillCardsInventory.filter(c => c.allowedJobs?.includes(hero.heroClass)).length}
          maxFusion={MAX_HERO_FUSION}
          heroRowIdx={getHeroRowIdx(hero.instanceId)}
          onOpenConfig={setConfiguringHeroId}
          onToggleDeploy={handleToggleDeployHero}
          onFuseHero={handleFuseHero}
          onReleaseHero={(h) => {
            if (configuringHeroId === h.instanceId) setConfiguringHeroId(null);
            handleReleaseHero(h);
          }}
          onUnequipSkillCard={handleUnequipSkillCard}
        />
      ))}
    </div>
  );

  return (
    <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur space-y-6 max-w-5xl mx-auto [overflow-anchor:none]">
      {/* 標題與全局操作列 */}
      <div className="flex flex-wrap justify-between items-center gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-amber-400" />
          <div>
            <h2 className="font-extrabold text-amber-400 text-lg">👥 英雄陣容、自動突破與技能卡配置</h2>
            <p className="text-xs text-slate-400 mt-0.5 tabular-nums">
              出戰陣容：{deployedHeroes.length} / 4 位（置頂顯示） • 客棧待命：{heroRoster.length - deployedHeroes.length} 位 • 持有技能卡：{skillCardsInventory.length} 張
            </p>
          </div>
          {setHelpModalTab && (
            <button type="button" onClick={() => setHelpModalTab('heroes')} className="text-slate-400 hover:text-amber-300 transition-colors" title="查看英雄與技能卡說明">
              <HelpCircle className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {totalFusibleOps > 0 && (
            <button type="button" disabled={isInCombat} onClick={handleFuseAllHeroes} className="px-3.5 py-2 bg-gradient-to-r from-purple-700 to-amber-600 hover:from-purple-600 hover:to-amber-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-black rounded-xl text-xs shadow transition-colors">
              ✨ 合成餘下分身 ({totalFusibleOps}次)
            </button>
          )}
          {redundantDupHeroes.length > 0 && (
            <button type="button" disabled={isInCombat} onClick={handleBulkReleaseRedundant} className="px-3.5 py-2 bg-rose-950/80 hover:bg-rose-800 text-rose-200 border border-rose-700/70 disabled:opacity-40 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors" title="僅遣散未出戰、★+0、無穿戴任何技能卡且已有滿星本尊的溢出分身">
              <UserMinus className="w-3.5 h-3.5" />
              <span>遣散溢出分身 ({redundantDupHeroes.length})</span>
            </button>
          )}
          <button type="button" disabled={isInCombat} onClick={handleRestInn} className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs shadow transition-colors">
            {isInCombat ? '🔒 戰鬥中無法休養' : '🏨 客棧全隊休養'}
          </button>
        </div>
      </div>

      {fusionFeedback && (
        <div className={`rounded-2xl p-3.5 border text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md ${fusionFeedback.type === 'danger' ? 'bg-rose-950/60 border-rose-500/70 text-rose-200' : 'bg-purple-950/60 border-amber-400/80 text-amber-200'}`}>
          <Sparkles className="w-4 h-4 shrink-0 text-amber-300" />
          <span>{fusionFeedback.text}</span>
        </div>
      )}

      {/* 區塊一：當前出戰陣容 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-black text-amber-300 tabular-nums">⚔️ 當前出戰陣容 ({deployedHeroes.length} / 4)</span>
          <span className="text-[11px] text-slate-400">點擊英雄卡片上的卡槽或「🃏 配卡」即可直接配置技能卡</span>
        </div>
        {deployedHeroes.length === 0 ? (
          <div className="bg-slate-950/70 border border-dashed border-amber-500/40 rounded-2xl p-6 text-center text-xs text-slate-400">
            目前尚無出戰英雄，請從下方「客棧待命名冊」點擊「⚔️ 派遣出戰」！
          </div>
        ) : renderHeroGrid(deployedHeroes, true)}
      </div>

      {/* 區塊二：客棧待命名冊 */}
      <div className="space-y-3 pt-4 border-t border-slate-800/90">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-extrabold text-slate-200 tabular-nums">💤 客棧待命名冊 ({heroRoster.length - deployedHeroes.length} 位)</span>
            <span className="text-[11px] text-slate-500">依 Tier 品階 → 星級 → 等級排序</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            {JOB_FILTER_OPTIONS.map(job => (
              <button key={job} type="button" onClick={() => setBenchJobFilter(job)} className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors ${benchJobFilter === job ? 'bg-amber-500 text-slate-950 border-amber-300' : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-600'}`}>
                {job}
              </button>
            ))}
            <button type="button" onClick={() => setOnlyStarredBench(prev => !prev)} className={`px-2.5 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1 transition-colors ${onlyStarredBench ? 'bg-purple-600 text-white border-purple-300' : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-purple-500/60'}`}>
              <Star className="w-3 h-3" />
              <span>★+1以上</span>
            </button>
          </div>
        </div>

        {benchHeroes.length === 0 ? (
          <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-5 text-center text-xs text-slate-500">
            {heroRoster.length === deployedHeroes.length ? '所有招募的英雄皆已上陣作戰！' : '目前沒有符合篩選條件的待命英雄。'}
          </div>
        ) : renderHeroGrid(benchHeroes, false)}
      </div>

      {/* 區塊三：技能卡倉庫總覽（鎖定最小高度防止卡片減少時版面跳動） */}
      <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 space-y-3 min-h-[168px]">
        <div className="flex flex-wrap items-center justify-between gap-2 min-h-[28px]">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="font-bold text-amber-300 text-sm tabular-nums">
              🃏 技能卡倉庫總覽（共 {skillCardsInventory.length} 張 / {groupedInventoryCards.length} 種）
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px]">
            {[{ id: 'all', label: '全部' }, { id: 'active', label: '⚡ 主動卡' }, { id: 'passive', label: '💠 被動卡' }].map(tab => (
              <button key={tab.id} type="button" onClick={() => setBagTypeFilter(tab.id)} className={`px-2.5 py-1 rounded-lg font-bold border transition-colors ${bagTypeFilter === tab.id ? 'bg-cyan-600 text-white border-cyan-400' : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-600'}`}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {filteredBagGroups.length === 0 ? (
          <div className="h-[108px] flex items-center justify-center text-xs text-slate-500 text-center">
            倉庫目前無此類閒置技能卡，可透過戰鬥掉落、鎮魔塔或江湖市集盲盒獲得！
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {filteredBagGroups.map(group => {
              const card = group.sample;
              const isActive = card.type === 'active';
              return (
                <div key={group.key} className="h-[108px] bg-slate-900 p-3 rounded-xl border border-slate-800 flex flex-col justify-between gap-1 overflow-hidden">
                  <div className="flex items-center justify-between gap-1.5">
                    <span className={`text-xs font-bold truncate ${isActive ? 'text-amber-300' : 'text-cyan-300'}`}>{isActive ? '⚡' : '💠'} {card.name}</span>
                    <span className="text-[11px] font-mono tabular-nums font-black bg-slate-950 text-amber-200 border border-amber-500/50 px-2 py-0.5 rounded-full shrink-0">×{group.count}</span>
                  </div>
                  <div className="text-[11px] text-slate-300 line-clamp-2 leading-snug">{card.desc}</div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="truncate">適用：{card.allowedJobs?.join('、')}</span>
                    <span className={`shrink-0 ml-1 ${isActive ? 'text-amber-400' : 'text-emerald-400'}`}>{isActive ? '主動・1.35x' : '被動・1.5x'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 配卡彈窗 */}
      <HeroSkillConfigModal
        configuringHero={configuringHero}
        deployedHeroes={deployedHeroes}
        heroRoster={heroRoster}
        groupedInventoryCards={groupedInventoryCards}
        isInCombat={isInCombat}
        onSelectHero={setConfiguringHeroId}
        onClose={() => setConfiguringHeroId(null)}
        onAutoEquip={handleAutoEquipForHero}
        onUnequipAll={handleUnequipAllForHero}
        onEquipSkillCard={handleEquipSkillCard}
        onUnequipSkillCard={handleUnequipSkillCard}
      />
    </div>
  );
}
