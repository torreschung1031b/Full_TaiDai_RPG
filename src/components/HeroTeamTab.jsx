import React, { useState } from 'react';
import { Trash2, X, Lock, HelpCircle } from 'lucide-react';
import { MAX_LEVEL, ELEMENTS } from '../data/constants';
import { FORMATIONS_CONFIG, FORMATION_GRID_SLOTS } from '../data/formations';
import { TIER_CONFIG } from '../data/heroes';
import { calculateHeroEffectiveStats } from '../utils/statCalculator';

export default function HeroTeamTab({
  player,
  isInCombat,
  isFengShui,
  heroRoster,
  activeHeroInstanceIds,
  heroBattleBuffs,
  formationSlots,
  currentFormation,
  skillCardsInventory,
  handleRestInn,
  handleSelectFormation,
  handleSwapFormationSlots,
  handleToggleDeployHero,
  handleReleaseHero,
  handleEquipSkillCard,
  handleUnequipSkillCard,
  setHelpModalTab,
  getHeroRowIdx
}) {
  const [skillModalHeroId, setSkillModalHeroId] = useState(null);
  const [selectedGridSlot, setSelectedGridSlot] = useState(null);

  const deployedHeroesList = heroRoster.filter(h => activeHeroInstanceIds.includes(h.instanceId));
  const reserveHeroesList = heroRoster.filter(h => !activeHeroInstanceIds.includes(h.instanceId));
  const modalHero = skillModalHeroId ? heroRoster.find(h => h.instanceId === skillModalHeroId) : null;

  const resolveHeroRow = (heroInstanceId) => {
    if (getHeroRowIdx) return getHeroRowIdx(heroInstanceId);
    const foundKey = Object.keys(formationSlots || {}).find(k => formationSlots[k] === heroInstanceId);
    return foundKey !== undefined ? Math.floor(Number(foundKey) / 3) : 1;
  };

  const renderHeroCard = (hero, isDeployed) => {
    const elemInfo = ELEMENTS[hero.element];
    const hRow = isDeployed ? resolveHeroRow(hero.instanceId) : 1;
    const {
      effectiveMaxHp,
      effectiveAtk,
      effectiveDef,
      effectiveSpeed,
      skillChance
    } = calculateHeroEffectiveStats(hero, isFengShui, heroBattleBuffs?.[hero.instanceId], hRow);
    const activeCards = hero.activeSkillSlots || [];
    const passiveCards = hero.passiveSkillSlots || [];
    const isMaxLvl = hero.level >= MAX_LEVEL;
    const expPct = isMaxLvl ? 100 : Math.min(100, Math.round(((hero.exp || 0) / (hero.maxExp || 100)) * 100));

    return (
      <div
        key={hero.instanceId}
        className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
          isDeployed
            ? 'bg-amber-950/30 border-amber-400 ring-2 ring-amber-400/40 shadow-lg'
            : 'bg-slate-950 border-slate-800 hover:border-slate-700'
        }`}
      >
        <div className="space-y-3">
          <div className="flex justify-between items-start gap-2">
            <div>
              <div className="font-extrabold text-amber-300 text-base flex items-center gap-1.5 flex-wrap">
                <span>{hero.icon} {hero.name}</span>
                <span className="text-xs bg-slate-800 text-amber-200 px-2 py-0.5 rounded-full font-mono">
                  Lv.{hero.level}/{MAX_LEVEL}
                </span>
                {hero.statLossTotal > 0 && (
                  <span className="text-[10px] bg-rose-950 text-rose-300 border border-rose-700/70 px-2 py-0.5 rounded-full font-mono">
                    💔 戰損 -{hero.statLossTotal} 屬
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Tier {hero.tier} ({TIER_CONFIG[hero.tier]?.name || '英豪'}) • {hero.heroClass}
              </div>
            </div>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold shrink-0 ${elemInfo?.badge}`}>
              {elemInfo?.icon} {hero.element}
            </span>
          </div>

          <div>
            <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
              <span>EXP 經驗進度</span>
              <span>{isMaxLvl ? 'MAX (Lv.30 滿級)' : `${hero.exp || 0} / ${hero.maxExp || 100} (${expPct}%)`}</span>
            </div>
            <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
              <div className="bg-purple-500 h-full transition-all duration-300" style={{ width: `${expPct}%` }} />
            </div>
          </div>

          <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800/80 space-y-2">
            <div className="text-[11px] font-bold text-slate-400 flex justify-between items-center">
              <span>📊 戰鬥屬性總覽</span>
              <span className="text-purple-300 font-mono">
                🎲 技能率: {Math.round(skillChance * 100)}%{isFengShui ? ' (+15%陣眼)' : ''}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-xs font-mono">
              <div className="bg-slate-950/70 px-2.5 py-1.5 rounded-lg border border-slate-800/60 flex justify-between">
                <span className="text-slate-400">❤️ 生命</span>
                <span className={`font-bold ${hero.hp <= 0 ? 'text-rose-500' : 'text-rose-400'}`}>{hero.hp}/{effectiveMaxHp}</span>
              </div>
              <div className="bg-slate-950/70 px-2.5 py-1.5 rounded-lg border border-slate-800/60 flex justify-between">
                <span className="text-slate-400">⚔️ 攻擊</span>
                <span className="text-amber-300 font-bold">{effectiveAtk}</span>
              </div>
              <div className="bg-slate-950/70 px-2.5 py-1.5 rounded-lg border border-slate-800/60 flex justify-between">
                <span className="text-slate-400">🛡️ 防禦</span>
                <span className="text-cyan-300 font-bold">{effectiveDef}</span>
              </div>
              <div className="bg-slate-950/70 px-2.5 py-1.5 rounded-lg border border-slate-800/60 flex justify-between">
                <span className="text-slate-400">⚡ 速度</span>
                <span className="text-emerald-300 font-bold">{effectiveSpeed}</span>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-1 pt-1 text-[11px] font-mono text-center">
              <div className="bg-slate-950/60 py-1 rounded border border-slate-800/50">
                <div className="text-[9px] text-slate-500">力量 STR</div>
                <div className="text-slate-200 font-bold">{hero.stats?.str ?? 0}</div>
              </div>
              <div className="bg-slate-950/60 py-1 rounded border border-slate-800/50">
                <div className="text-[9px] text-slate-500">體質 CON</div>
                <div className="text-slate-200 font-bold">{hero.stats?.con ?? 0}</div>
              </div>
              <div className="bg-slate-950/60 py-1 rounded border border-slate-800/50">
                <div className="text-[9px] text-slate-500">智慧 INT</div>
                <div className="text-slate-200 font-bold">{hero.stats?.int ?? 0}</div>
              </div>
              <div className="bg-slate-950/60 py-1 rounded border border-slate-800/50">
                <div className="text-[9px] text-slate-500">敏捷 AGI</div>
                <div className="text-slate-200 font-bold">{hero.stats?.agi ?? 0}</div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-800/80 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold text-purple-300">🃏 專屬技能卡槽</span>
              <button
                disabled={isInCombat}
                onClick={() => setSkillModalHeroId(hero.instanceId)}
                className="px-2.5 py-1 bg-purple-700 hover:bg-purple-600 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white rounded-lg text-[11px] font-bold transition-all"
              >
                {isInCombat ? '🔒 戰鬥鎖定' : '+ 裝配卡片'}
              </button>
            </div>

            <div className="space-y-1">
              <div className="text-[10px] text-slate-400">主動槽 ({activeCards.length}/2)：</div>
              {activeCards.length === 0 ? (
                <div className="text-[11px] text-slate-600 italic">尚未裝配主動卡</div>
              ) : (
                activeCards.map(card => (
                  <div key={card.uid} className="flex items-center justify-between bg-slate-950 px-2.5 py-1 rounded-lg border border-purple-500/30">
                    <span className="text-purple-200 font-bold truncate">{card.icon} {card.name}</span>
                    <button
                      disabled={isInCombat}
                      onClick={() => handleUnequipSkillCard(hero.instanceId, card)}
                      className="text-[10px] px-2 py-0.5 bg-slate-800 hover:bg-rose-800 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 hover:text-white rounded font-bold transition-all shrink-0 ml-2"
                    >
                      拆下
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="space-y-1">
              <div className="text-[10px] text-slate-400">被動槽 ({passiveCards.length}/2)：</div>
              {passiveCards.length === 0 ? (
                <div className="text-[11px] text-slate-600 italic">尚未裝配被動卡</div>
              ) : (
                passiveCards.map(card => (
                  <div key={card.uid} className="flex items-center justify-between bg-slate-950 px-2.5 py-1 rounded-lg border border-cyan-500/30">
                    <span className="text-cyan-200 font-bold truncate">{card.icon} {card.name}</span>
                    <button
                      disabled={isInCombat}
                      onClick={() => handleUnequipSkillCard(hero.instanceId, card)}
                      className="text-[10px] px-2 py-0.5 bg-slate-800 hover:bg-rose-800 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 hover:text-white rounded font-bold transition-all shrink-0 ml-2"
                    >
                      拆下
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="pt-1 flex gap-2">
          <button
            disabled={isInCombat}
            onClick={() => handleToggleDeployHero(hero)}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed ${
              isDeployed
                ? 'bg-rose-700 hover:bg-rose-600 text-white'
                : 'bg-amber-600 hover:bg-amber-500 text-white'
            }`}
          >
            {isInCombat ? '🔒 戰鬥中鎖定' : isDeployed ? '📥 解除登場' : '⚔️ 派遣登場'}
          </button>

          {!isDeployed && (
            <button
              disabled={isInCombat}
              onClick={() => handleReleaseHero(hero)}
              className="px-3.5 py-2.5 rounded-xl font-bold text-xs bg-slate-900 hover:bg-rose-950 disabled:opacity-40 disabled:cursor-not-allowed text-rose-400 border border-rose-800/60 flex items-center justify-center gap-1 transition-all"
              title="放走此英雄（自動退回技能卡）"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>放走</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur space-y-8">
      <div className="flex flex-wrap justify-between items-center gap-3 border-b border-slate-800 pb-4">
        <div>
          <h2 className="font-extrabold text-amber-400 text-lg">👥 英雄隊伍管理 (上限 4 位登場，最高 Lv.{MAX_LEVEL})</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            總名冊：{heroRoster.length} 位英雄 • 閒置技能卡：{skillCardsInventory.length} 張
          </p>
        </div>
        <button
          disabled={isInCombat}
          onClick={handleRestInn}
          className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold shadow"
        >
          {isInCombat ? '🔒 戰鬥中鎖定客棧' : '☕ 客棧休息 (全隊恢復滿血)'}
        </button>
      </div>

      {/* 3x3 戰術陣形與站位配置 */}
      <section className="bg-slate-950/90 border border-amber-500/30 rounded-2xl p-5 space-y-4">
        <div className="flex flex-wrap justify-between items-center gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-amber-300 text-base">
              📐 戰術陣形與站位配置（1 主角 ＋ 最多 4 英雄）
            </h3>
            <button
              onClick={() => setHelpModalTab('formation')}
              className="text-slate-400 hover:text-amber-300 transition-colors"
              title="查看陣形與前中後排站位規則"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
          <span className="text-xs text-slate-400">
            {isInCombat ? '🔒 戰鬥中鎖定站位調整' : '💡 點擊任一亮起陣位，再點另一陣位即可互換主角或英雄位置'}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">選擇出戰陣法：</span>
              {!isFengShui && (
                <span className="text-[10px] bg-rose-950 text-rose-300 border border-rose-800 px-2 py-0.5 rounded-full font-bold">
                  🔒 僅限風水師變換特殊陣法
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-2">
              {Object.keys(FORMATIONS_CONFIG).map(fKey => {
                const isSelected = currentFormation === fKey;
                const canSwitch = isFengShui && !isInCombat;
                return (
                  <button
                    key={fKey}
                    disabled={!canSwitch}
                    onClick={() => {
                      setSelectedGridSlot(null);
                      handleSelectFormation(fKey);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-amber-950/60 border-amber-400 text-amber-200 ring-1 ring-amber-400'
                        : canSwitch
                          ? 'bg-slate-900 border-slate-800 hover:border-slate-600 text-slate-300'
                          : 'bg-slate-900/50 border-slate-800/60 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <div className="text-xs font-bold flex items-center justify-between">
                      <span>{FORMATIONS_CONFIG[fKey].icon} {FORMATIONS_CONFIG[fKey].name}</span>
                      {!isFengShui && fKey !== 'none' && <Lock className="w-3 h-3 text-rose-400" />}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                      {FORMATIONS_CONFIG[fKey].desc}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-1.5 text-[11px]">
              <div className="font-bold text-amber-300">📊 前／中／後排站位戰術加成：</div>
              <div className="text-slate-300">🛡️ <span className="text-sky-300 font-bold">前排</span>：受擊仇恨最高 (~60%)，物理減傷 <span className="text-emerald-400 font-mono">+10%</span></div>
              <div className="text-slate-300">⚡ <span className="text-amber-300 font-bold">中排</span>：受擊仇恨中等 (~25%)，行動速度 <span className="text-emerald-400 font-mono">+10%</span></div>
              <div className="text-slate-300">✨ <span className="text-purple-300 font-bold">後排</span>：受擊仇恨最低 (~15%)，暴擊與技能率 <span className="text-emerald-400 font-mono">+8%</span></div>
            </div>
          </div>

          <div className="lg:col-span-7 bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-rose-400">⬅️ 敵軍方向（前排優先承傷）</span>
              <span className="font-bold text-emerald-400">我方大營 ➡️</span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {[
                { row: 0, title: '🛡️ 前排（高仇恨 / +10%物減）', color: 'text-sky-300' },
                { row: 1, title: '⚡ 中排（均勢 / +10%速度）', color: 'text-amber-300' },
                { row: 2, title: '✨ 後排（低仇恨 / +8%暴技）', color: 'text-purple-300' }
              ].map(col => {
                const activeSlotSet = new Set(FORMATION_GRID_SLOTS[currentFormation] || FORMATION_GRID_SLOTS['none']);
                const rowIndices = [col.row * 3, col.row * 3 + 1, col.row * 3 + 2];
                return (
                  <div key={col.row} className="space-y-2">
                    <div className={`text-[10px] font-bold text-center truncate ${col.color}`}>
                      {col.title}
                    </div>
                    {rowIndices.map(gridIdx => {
                      const isValidSlot = activeSlotSet.has(gridIdx);
                      const occupantId = formationSlots?.[gridIdx] || null;
                      const isSelected = selectedGridSlot === gridIdx;

                      if (!isValidSlot) {
                        return (
                          <div
                            key={gridIdx}
                            className="h-20 rounded-xl border border-dashed border-slate-800/70 bg-slate-950/30 flex items-center justify-center text-[10px] text-slate-600"
                          >
                            未啟用陣位
                          </div>
                        );
                      }

                      const isPlayerSlot = occupantId === 'PLAYER';
                      const heroObj = !isPlayerSlot && occupantId
                        ? heroRoster.find(h => h.instanceId === occupantId)
                        : null;

                      return (
                        <button
                          key={gridIdx}
                          type="button"
                          disabled={isInCombat}
                          onClick={() => {
                            if (selectedGridSlot === null) {
                              setSelectedGridSlot(gridIdx);
                            } else if (selectedGridSlot === gridIdx) {
                              setSelectedGridSlot(null);
                            } else {
                              handleSwapFormationSlots(selectedGridSlot, gridIdx);
                              setSelectedGridSlot(null);
                            }
                          }}
                          className={`w-full h-20 p-2 rounded-xl border text-left transition-all flex flex-col justify-between disabled:cursor-not-allowed ${
                            isSelected
                              ? 'bg-amber-600/30 border-amber-300 ring-2 ring-amber-400 scale-[1.02]'
                              : isPlayerSlot
                                ? 'bg-amber-950/60 border-amber-500/80 hover:border-amber-300'
                                : heroObj
                                  ? 'bg-slate-950 border-emerald-600/60 hover:border-emerald-400'
                                  : 'bg-slate-950/80 border-slate-700 hover:border-amber-400/60'
                          }`}
                        >
                          {isPlayerSlot ? (
                            <>
                              <div className="flex justify-between items-center w-full">
                                <span className="text-[10px] bg-amber-500 text-slate-950 px-1.5 py-0.5 rounded font-black">
                                  👑 主角
                                </span>
                                <span className="text-[10px] text-amber-300 font-mono">Lv.{player.level}</span>
                              </div>
                              <div className="font-bold text-xs text-amber-200 truncate w-full">
                                {player.name} ({player.job})
                              </div>
                            </>
                          ) : heroObj ? (
                            <>
                              <div className="flex justify-between items-center w-full">
                                <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-700 px-1.5 py-0.5 rounded font-bold">
                                  {heroObj.icon} {heroObj.heroClass}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">Lv.{heroObj.level}</span>
                              </div>
                              <div className="font-bold text-xs text-slate-100 truncate w-full">
                                {heroObj.name}
                              </div>
                            </>
                          ) : (
                            <div className="h-full flex items-center justify-center text-[11px] text-slate-500 italic">
                              {selectedGridSlot !== null ? '📥 點此移入空位' : '空陣位（可調入）'}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 一、已登場英雄 */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-emerald-400 text-base flex items-center gap-2">
            <span>⚔️ 一、已登場英雄</span>
            <span className="text-xs bg-emerald-950 text-emerald-300 border border-emerald-700/60 px-2.5 py-0.5 rounded-full font-mono">
              {deployedHeroesList.length} / 4 人
            </span>
          </h3>
        </div>

        {deployedHeroesList.length === 0 ? (
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-6 text-center text-xs text-slate-500">
            目前尚未派遣任何英雄登場，請從下方「未登場英雄」選擇夥伴出戰。
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {deployedHeroesList.map(hero => renderHeroCard(hero, true))}
          </div>
        )}
      </section>

      {/* 二、未登場英雄 */}
      <section className="space-y-4 pt-6 border-t border-slate-800/80">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-slate-200 text-base flex items-center gap-2">
            <span>🛖 二、未登場英雄（客棧休養名冊）</span>
            <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full font-mono">
              {reserveHeroesList.length} 人
            </span>
          </h3>
        </div>

        {reserveHeroesList.length === 0 ? (
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-6 text-center text-xs text-slate-500">
            客棧中目前沒有未登場的備用英雄，在戰鬥勝利時有機會招募新英雄加入！
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reserveHeroesList.map(hero => renderHeroCard(hero, false))}
          </div>
        )}
      </section>

      {/* 英雄技能卡裝配 Modal */}
      {modalHero && !isInCombat && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-slate-900 border-2 border-purple-500/70 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-black text-purple-300">
                  🃏 為【{modalHero.name}】裝配技能卡
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  英雄職業：<span className="text-amber-300 font-bold">{modalHero.heroClass}</span>（自動過濾不可用職業卡片，且不可重複裝備同名卡）
                </p>
              </div>
              <button
                onClick={() => setSkillModalHeroId(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {skillCardsInventory.length === 0 ? (
                <div className="text-center text-xs text-slate-500 py-8">
                  背包中目前沒有閒置的技能卡（可拆下其他英雄的卡片或透過戰鬥/鎮魔塔取得）。
                </div>
              ) : (
                skillCardsInventory.map(card => {
                  const isJobAllowed = card.allowedJobs.includes(modalHero.heroClass);
                  const allHeroCards = [
                    ...(modalHero.activeSkillSlots || []),
                    ...(modalHero.passiveSkillSlots || [])
                  ];
                  const isDuplicate = allHeroCards.some(c => c.id === card.id || c.name === card.name);
                  const targetSlots = card.type === 'active'
                    ? (modalHero.activeSkillSlots || [])
                    : (modalHero.passiveSkillSlots || []);
                  const isSlotFull = targetSlots.length >= 2;
                  const canEquip = isJobAllowed && !isDuplicate && !isSlotFull;

                  let disabledReason = '';
                  if (!isJobAllowed) disabledReason = `限 ${card.allowedJobs.join('/')}`;
                  else if (isDuplicate) disabledReason = '已裝備同名卡';
                  else if (isSlotFull) disabledReason = `${card.type === 'active' ? '主動' : '被動'}槽已滿`;

                  return (
                    <div
                      key={card.uid}
                      className={`p-3 rounded-xl border flex justify-between items-center gap-3 ${
                        canEquip
                          ? 'bg-slate-950 border-slate-700'
                          : 'bg-slate-950/50 border-slate-800/60 opacity-60'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold text-xs text-purple-300 flex items-center gap-1.5">
                          <span>{card.icon} {card.name}</span>
                          <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">
                            {card.type === 'active' ? '主動' : '被動'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">{card.desc}</div>
                      </div>

                      <button
                        disabled={!canEquip}
                        onClick={() => handleEquipSkillCard(modalHero.instanceId, card)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                          canEquip
                            ? 'bg-purple-600 hover:bg-purple-500 text-white shadow'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        {canEquip ? '裝配' : disabledReason}
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <button
              onClick={() => setSkillModalHeroId(null)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs"
            >
              完成並關閉
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
