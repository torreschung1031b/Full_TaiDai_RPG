import React, { useState } from 'react';
import { Sparkles, HelpCircle, Users, Layers } from 'lucide-react';
import { ELEMENTS, MAX_LEVEL } from '../data/constants';
import { calculateHeroEffectiveStats } from '../utils/statCalculator';
import { getRowPositionBuffs } from '../utils/formationHelper';

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
  const [selectedHeroForCard, setSelectedHeroForCard] = useState(
    heroRoster[0]?.instanceId || ''
  );

  const effectiveTargetHeroId = heroRoster.some(h => h.instanceId === selectedHeroForCard)
    ? selectedHeroForCard
    : (heroRoster[0]?.instanceId || '');

  const totalFusibleOps = (() => {
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
  })();

  return (
    <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur space-y-6 max-w-5xl mx-auto">
      {/* 標題與客棧休養 / 一鍵同名合成 */}
      <div className="flex flex-wrap justify-between items-center gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-amber-400" />
          <div>
            <h2 className="font-extrabold text-amber-400 text-lg">👥 英雄名冊、同名合成與強化技能卡</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              出戰陣容：{activeHeroInstanceIds.length} / 4 位 • 名冊總數：{heroRoster.length} 位
            </p>
          </div>
          {setHelpModalTab && (
            <button
              onClick={() => setHelpModalTab('heroes')}
              className="text-slate-400 hover:text-amber-300 transition-colors"
              title="查看英雄與技能卡說明"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            disabled={isInCombat || totalFusibleOps === 0}
            onClick={handleFuseAllHeroes}
            className="px-4 py-2 bg-gradient-to-r from-purple-700 to-amber-600 hover:from-purple-600 hover:to-amber-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-black rounded-xl text-xs shadow transition-all"
          >
            {totalFusibleOps > 0
              ? `✨ 一鍵同名合成 (${totalFusibleOps}次可突破)`
              : '✨ 一鍵同名合成 (無可突破)'}
          </button>

          <button
            disabled={isInCombat}
            onClick={handleRestInn}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs shadow transition-all"
          >
            {isInCombat ? '🔒 戰鬥中無法休養' : '🏨 客棧全隊休養（滿血滿真元）'}
          </button>
        </div>
      </div>

      {/* 同名合成與覺醒里程碑說明橫幅 */}
      <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3.5 text-xs text-slate-300 grid grid-cols-1 md:grid-cols-2 gap-2.5">
        <div>
          <span className="text-amber-300 font-bold">🌟 同名英雄合成（最高 ★+{MAX_HERO_FUSION}）：</span>
          每星<strong>全基礎屬性 +15%、主屬性 +3、技能卡威力 +12%</strong>。
          <div className="text-[11px] text-purple-300 mt-1">
            • <strong>★+3 覺醒【護主靈罡】</strong>：開戰提供自身 15% HP 護盾並補充少俠真元<br />
            • <strong>★+5 覺醒【無雙連攜】</strong>：主動技能卡 25% 機率觸發 65% 威力二連發
          </div>
        </div>
        <div>
          <span className="text-cyan-300 font-bold">🔮 強化技能卡共鳴與疾速連擊：</span>
          主動卡保底發動率 <strong>45%</strong>（雙主動卡觸發<strong>雙卡共鳴 +10% 率 / +15% 威</strong>）；被動卡屬性 <strong>1.5 倍強化</strong>。速度高於敵方時可觸發<strong>身法閃避</strong>與<strong>普攻連擊</strong>！
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

      {/* 英雄卡片列表 */}
      {heroRoster.length === 0 ? (
        <div className="text-xs text-slate-500 py-8 text-center">目前名冊尚無英雄，可前往「🏮 江湖市集」招募！</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {heroRoster.map(hero => {
            const isDeployed = activeHeroInstanceIds.includes(hero.instanceId);
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

            return (
              <div
                key={hero.instanceId}
                className={`bg-slate-950 p-4 rounded-2xl border space-y-3 flex flex-col justify-between transition-all ${
                  isDeployed
                    ? 'border-amber-500/70 shadow-lg shadow-amber-950/20'
                    : 'border-slate-800'
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-lg">{hero.icon || '🧑'}</span>
                      <span className="font-extrabold text-amber-300 text-sm">{hero.name}</span>
                      {fusionLvl > 0 && (
                        <span className="text-[11px] bg-gradient-to-r from-amber-600/30 to-purple-600/30 text-amber-200 border border-amber-400/80 px-2 py-0.5 rounded font-mono font-black">
                          ★+{fusionLvl}
                        </span>
                      )}
                      <span className="text-[10px] bg-slate-900 text-slate-300 border border-slate-700 px-2 py-0.5 rounded font-mono">
                        Tier {hero.tier} • {hero.heroClass}
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

                  <div className="text-[11px] font-mono text-slate-400 flex justify-between px-1">
                    <span>力 STR: <strong className="text-slate-200">{hero.stats?.str}</strong></span>
                    <span>體 CON: <strong className="text-slate-200">{hero.stats?.con}</strong></span>
                    <span>智 INT: <strong className="text-slate-200">{hero.stats?.int}</strong></span>
                    <span>敏 AGI: <strong className="text-slate-200">{hero.stats?.agi}</strong></span>
                  </div>

                  <div className="space-y-1.5 pt-1 border-t border-slate-800/80">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-amber-300">
                        ⚡ 主動技能卡 ({hero.activeSkillSlots?.length || 0}/2)
                      </span>
                      {hasDualActive && (
                        <span className="text-[10px] bg-amber-500/20 text-amber-200 border border-amber-400/60 px-2 py-0.5 rounded font-bold">
                          🔥 雙卡共鳴啟動 (+10%率/+15%威)
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[0, 1].map(idx => {
                        const card = hero.activeSkillSlots?.[idx];
                        return card ? (
                          <button
                            key={card.uid || idx}
                            disabled={isInCombat}
                            onClick={() => handleUnequipSkillCard(hero.instanceId, card)}
                            title="點擊卸下技能卡"
                            className="text-left p-2 rounded-xl bg-amber-950/40 border border-amber-600/60 hover:border-rose-400 text-[11px] transition-all"
                          >
                            <div className="font-bold text-amber-200 truncate">⚡ {card.name}</div>
                            <div className="text-[10px] text-slate-300 truncate">{card.desc}</div>
                          </button>
                        ) : (
                          <div key={idx} className="p-2 rounded-xl bg-slate-900/50 border border-dashed border-slate-800 text-[10px] text-slate-600 text-center">
                            空主動卡槽
                          </div>
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
                            disabled={isInCombat}
                            onClick={() => handleUnequipSkillCard(hero.instanceId, card)}
                            title="點擊卸下技能卡"
                            className="text-left p-2 rounded-xl bg-cyan-950/40 border border-cyan-600/60 hover:border-rose-400 text-[11px] transition-all"
                          >
                            <div className="font-bold text-cyan-200 truncate">💠 {card.name}</div>
                            <div className="text-[10px] text-emerald-300 truncate">{card.desc} (×1.5)</div>
                          </button>
                        ) : (
                          <div key={idx} className="p-2 rounded-xl bg-slate-900/50 border border-dashed border-slate-800 text-[10px] text-slate-600 text-center">
                            空被動卡槽
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex flex-wrap gap-2">
                  <button
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

                  {duplicateCount > 0 && (
                    <button
                      disabled={!canFuse}
                      onClick={() => handleFuseHero(hero.instanceId)}
                      className="py-2 px-3 rounded-xl font-black text-xs text-white bg-gradient-to-r from-purple-700 to-amber-600 hover:from-purple-600 hover:to-amber-500 disabled:opacity-40 shadow transition-all"
                    >
                      {fusionLvl >= MAX_HERO_FUSION
                        ? '★+5 已滿星'
                        : `✨ 同名合成 → ★+${fusionLvl + 1} (${duplicateCount}可用)`}
                    </button>
                  )}

                  <button
                    disabled={isInCombat}
                    onClick={() => {
                      if (window.confirm(`確定要放走英雄【${hero.name}】嗎？（已裝備的技能卡會自動退回背包）`)) {
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
          })}
        </div>
      )}

      {/* 技能卡背包與快速裝配 */}
      <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-amber-300 text-sm">
              🃏 技能卡背包（持有 {skillCardsInventory.length} 張）
            </span>
          </div>

          {heroRoster.length > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">目標英雄：</span>
              <select
                value={effectiveTargetHeroId}
                onChange={(e) => setSelectedHeroForCard(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-amber-300 font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:border-amber-500"
              >
                {heroRoster.map(h => (
                  <option key={h.instanceId} value={h.instanceId}>
                    {h.name} {h.fusionLevel > 0 ? `(★+${h.fusionLevel})` : ''} — {h.heroClass}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {skillCardsInventory.length === 0 ? (
          <div className="text-xs text-slate-500 py-4 text-center">
            技能卡背包目前為空，可透過戰鬥掉落、鎮魔塔或江湖市集盲盒獲得！
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {skillCardsInventory.map(card => {
              const targetHero = heroRoster.find(h => h.instanceId === effectiveTargetHeroId);
              const isJobOk = targetHero && card.allowedJobs?.includes(targetHero.heroClass);
              const isActive = card.type === 'active';

              return (
                <div
                  key={card.uid}
                  className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex flex-col justify-between gap-2"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className={`text-xs font-bold ${isActive ? 'text-amber-300' : 'text-cyan-300'}`}>
                        {isActive ? '⚡' : '💠'} {card.name}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${
                          isActive
                            ? 'bg-amber-950/60 text-amber-300 border-amber-700/60'
                            : 'bg-cyan-950/60 text-cyan-300 border-cyan-700/60'
                        }`}
                      >
                        {isActive ? '主動・1.35x' : '被動・1.5x'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-300">{card.desc}</div>
                    <div className="text-[10px] text-slate-400">
                      適用職業：{card.allowedJobs?.join('、')}
                    </div>
                  </div>

                  <button
                    disabled={isInCombat || !targetHero || !isJobOk}
                    onClick={() => targetHero && handleEquipSkillCard(targetHero.instanceId, card)}
                    className="w-full py-1.5 rounded-lg font-bold text-[11px] bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white transition-all"
                  >
                    {!targetHero
                      ? '無可裝配英雄'
                      : !isJobOk
                        ? `限 ${card.allowedJobs?.join('/')}`
                        : `裝備給【${targetHero.name}】`}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
