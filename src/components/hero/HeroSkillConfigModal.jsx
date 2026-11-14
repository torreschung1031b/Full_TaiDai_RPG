import React, { useState, useMemo, useRef, useEffect } from 'react';
import { X, Wand2, Trash2, ShieldAlert } from 'lucide-react';

function ModalSlotColumn({ title, badge, slots = [], type, isInCombat, onUnequip }) {
  const isActive = type === 'active';
  const cardStyle = isActive
    ? 'bg-amber-950/50 border-amber-500/70 text-amber-200 hover:border-rose-400 cursor-pointer'
    : 'bg-cyan-950/50 border-cyan-500/70 text-cyan-200 hover:border-rose-400 cursor-pointer';

  return (
    <div className="space-y-1.5">
      <div className={`h-5 flex items-center justify-between text-[11px] font-bold whitespace-nowrap ${isActive ? 'text-amber-300' : 'text-cyan-300'}`}>
        <span className="tabular-nums">{title} ({slots.length}/2)</span>
        {badge && <span className="text-emerald-300 text-[10px]">{badge}</span>}
      </div>
      <div className="grid grid-cols-2 gap-2 items-stretch">
        {[0, 1].map(idx => {
          const card = slots[idx];
          const isFilled = Boolean(card);
          return (
            <button
              key={`slot-${type}-${idx}`}
              type="button"
              disabled={isInCombat || !isFilled}
              onClick={() => isFilled && onUnequip(card)}
              style={{ height: '74px', minHeight: '74px', maxHeight: '74px' }}
              className={`w-full p-2.5 rounded-xl border text-left overflow-hidden flex flex-col justify-between ${
                isFilled
                  ? cardStyle
                  : 'bg-slate-900/60 border-dashed border-slate-700 text-slate-500 cursor-default items-center justify-center'
              }`}
            >
              {isFilled ? (
                <>
                  <div className="w-full min-w-0">
                    <div className="text-xs font-bold truncate leading-tight">
                      {isActive ? '⚡' : '💠'} {card.name}
                    </div>
                    <div className={`text-[10px] truncate mt-1 leading-tight ${isActive ? 'text-slate-300' : 'text-emerald-300'}`}>
                      {card.desc}
                    </div>
                  </div>
                  <div className="text-[10px] text-rose-300 font-bold leading-none">
                    點擊卸下
                  </div>
                </>
              ) : (
                <span className="text-[11px] text-slate-500 leading-none">
                  空{isActive ? '主動' : '被動'}槽 #{idx + 1}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function HeroSkillConfigModal({
  configuringHero,
  deployedHeroes,
  heroRoster,
  groupedInventoryCards,
  isInCombat,
  onSelectHero,
  onClose,
  onAutoEquip,
  onUnequipAll,
  onEquipSkillCard,
  onUnequipSkillCard
}) {
  const [showOccupiedCards, setShowOccupiedCards] = useState(false);
  const sessionGroupsRef = useRef({ heroKey: null, map: new Map() });

  const heroSessionKey = configuringHero
    ? `${configuringHero.instanceId}_${configuringHero.heroClass}`
    : null;

  
useEffect(() => {
    if (!configuringHero) {
      sessionGroupsRef.current = { heroKey: null, map: new Map() };
      return;
    }
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [configuringHero]);
  
  const compatibleGroups = useMemo(() => {
    if (!configuringHero) return [];

    if (sessionGroupsRef.current.heroKey !== heroSessionKey) {
      sessionGroupsRef.current = { heroKey: heroSessionKey, map: new Map() };
    }

    const currentMap = new Map();
    groupedInventoryCards.forEach(g => {
      if (g?.sample?.allowedJobs?.includes(configuringHero.heroClass)) {
        const key = g.key || `${g.sample.type}_${g.sample.name}`;
        currentMap.set(key, g);
        sessionGroupsRef.current.map.set(key, g.sample);
      }
    });

    const merged = [];
    sessionGroupsRef.current.map.forEach((sampleCard, key) => {
      const liveGroup = currentMap.get(key);
      merged.push({
        key,
        sample: liveGroup?.sample || sampleCard,
        count: liveGroup?.count || 0,
        instances: (liveGroup?.instances || []).filter(Boolean)
      });
    });

    return merged;
  }, [configuringHero, heroSessionKey, groupedInventoryCards]);

  const occupiedCardsByOthers = useMemo(() => {
    if (!configuringHero) return [];
    const list = [];
    heroRoster.forEach(h => {
      if (h.instanceId === configuringHero.instanceId) return;
      [...(h.activeSkillSlots || []), ...(h.passiveSkillSlots || [])].forEach((c, slotIdx) => {
        if (c && c.allowedJobs?.includes(configuringHero.heroClass)) {
          list.push({
            uniqueKey: `${h.instanceId}-${c.uid || c.id || c.name}-${slotIdx}`,
            card: c,
            owner: h
          });
        }
      });
    });
    return list;
  }, [heroRoster, configuringHero]);

  if (!configuringHero) return null;

  const totalEquipped = (configuringHero.activeSkillSlots?.length || 0) + (configuringHero.passiveSkillSlots?.length || 0);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 flex items-center justify-center p-3 sm:p-5" onClick={onClose}>
      <div
        style={{ height: '82vh', maxHeight: '760px' }}
        className="bg-slate-900 border-2 border-cyan-500/80 rounded-3xl max-w-3xl w-full flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 頂部標題 */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-2xl shrink-0">{configuringHero.icon || '🧑'}</span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-base sm:text-lg text-amber-300 truncate">🃏 配置技能卡 — {configuringHero.name}</h3>
                <span className="text-xs bg-cyan-950 text-cyan-300 border border-cyan-700 px-2.5 py-0.5 rounded-full font-bold shrink-0">
                  {configuringHero.heroClass} • Tier {configuringHero.tier}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 truncate">已自動篩選【{configuringHero.heroClass}】可用的技能卡，點擊下方卡片即可直接鑲嵌</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 shrink-0" title="關閉視窗">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 滾動內容區：用 inline style 強制關閉瀏覽器捲動錨點補償 */}
        <div
          style={{ overflowAnchor: 'none' }}
          className="p-4 sm:p-5 overflow-y-auto overscroll-contain space-y-5 flex-1"
        >
          {deployedHeroes.length > 1 && (
            <div className="flex items-center gap-1.5 flex-wrap text-xs">
              <span className="text-slate-400 font-bold mr-1">切換出戰隊友：</span>
              {deployedHeroes.map(dh => (
                <button
                  key={dh.instanceId}
                  type="button"
                  onClick={() => onSelectHero(dh.instanceId)}
                  className={`px-2.5 py-1 rounded-xl font-bold border ${dh.instanceId === configuringHero.instanceId ? 'bg-cyan-600 text-white border-cyan-300' : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-amber-500/60'}`}
                >
                  {dh.icon} {dh.name} ({dh.heroClass})
                </button>
              ))}
            </div>
          )}

          {/* 目前 4 個卡槽狀態 */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between gap-2 min-h-[32px]">
              <span className="text-xs font-extrabold text-amber-300 truncate">
                📌 當前已鑲嵌卡槽（點擊已裝卡片可直接卸下）
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  disabled={isInCombat}
                  onClick={() => onAutoEquip(configuringHero)}
                  className="px-3 py-1.5 rounded-xl font-bold text-xs bg-gradient-to-r from-amber-600 to-cyan-600 hover:from-amber-500 hover:to-cyan-500 text-white shadow flex items-center gap-1 whitespace-nowrap disabled:opacity-40"
                >
                  <Wand2 className="w-3.5 h-3.5 shrink-0" />
                  <span>一鍵推薦配卡</span>
                </button>
                <button
                  type="button"
                  disabled={isInCombat || totalEquipped === 0}
                  onClick={() => onUnequipAll(configuringHero)}
                  className="px-3 py-1.5 rounded-xl font-bold text-xs bg-rose-950/80 hover:bg-rose-800 text-rose-200 border border-rose-700/70 flex items-center gap-1 whitespace-nowrap disabled:opacity-35 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-3.5 h-3.5 shrink-0" />
                  <span>全卸下</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ModalSlotColumn
                title="⚡ 主動技能卡"
                badge={(configuringHero.activeSkillSlots?.length || 0) >= 2 ? '🔥 雙卡共鳴已啟動' : null}
                slots={configuringHero.activeSkillSlots}
                type="active"
                isInCombat={isInCombat}
                onUnequip={(c) => onUnequipSkillCard(configuringHero.instanceId, c)}
              />
              <ModalSlotColumn
                title="💠 被動技能卡"
                badge="效果 ×1.5 倍"
                slots={configuringHero.passiveSkillSlots}
                type="passive"
                isInCombat={isInCombat}
                onUnequip={(c) => onUnequipSkillCard(configuringHero.instanceId, c)}
              />
            </div>
          </div>

          {/* 倉庫可用卡片 */}
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2 min-h-[22px]">
              <span className="text-xs font-extrabold text-emerald-300">✅ 倉庫中【{configuringHero.heroClass}】可用技能卡（同名已摺疊）</span>
              {occupiedCardsByOthers.length > 0 && (
                <label className="flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer select-none">
                  <input type="checkbox" checked={showOccupiedCards} onChange={(e) => setShowOccupiedCards(e.target.checked)} className="rounded border-slate-700 bg-slate-950 text-cyan-500" />
                  <span>顯示其他隊友穿戴中的卡片 ({occupiedCardsByOthers.length})</span>
                </label>
              )}
            </div>

            {compatibleGroups.length === 0 ? (
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 text-center text-xs text-slate-400">
                目前倉庫中沒有【{configuringHero.heroClass}】可用的閒置技能卡。
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {compatibleGroups.map((group) => {
                  const card = group.sample;
                  const isActive = card.type === 'active';
                  const isSlotFull = isActive
                    ? (configuringHero.activeSkillSlots?.length || 0) >= 2
                    : (configuringHero.passiveSkillSlots?.length || 0) >= 2;
                  const nextInstance = group.instances[0] || null;
                  const isDepleted = group.count <= 0 || !nextInstance;

                  return (
                    <div
                      key={group.key}
                      style={{ height: '132px' }}
                      className={`p-3.5 rounded-2xl border flex flex-col justify-between overflow-hidden ${
                        isDepleted
                          ? 'bg-slate-950/50 border-slate-800/50'
                          : 'bg-slate-950 border-slate-800'
                      }`}
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center justify-between gap-1.5">
                          <span className={`text-xs font-extrabold truncate ${
                            isDepleted
                              ? 'text-slate-500'
                              : isActive ? 'text-amber-300' : 'text-cyan-300'
                          }`}>
                            {isActive ? '⚡' : '💠'} {card.name}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className={`text-[11px] font-mono tabular-nums font-black px-2 py-0.5 rounded-full border ${
                              isDepleted
                                ? 'bg-slate-900/60 text-slate-500 border-slate-800'
                                : 'bg-slate-900 text-amber-200 border-amber-500/50'
                            }`}>
                              持有 ×{group.count}
                            </span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${
                              isDepleted
                                ? 'bg-slate-900/60 text-slate-500 border-slate-800'
                                : isActive
                                  ? 'bg-amber-950/60 text-amber-300 border-amber-700/60'
                                  : 'bg-cyan-950/60 text-cyan-300 border-cyan-700/60'
                            }`}>
                              {isActive ? '主動' : '被動'}
                            </span>
                          </div>
                        </div>
                        <div className={`text-[11px] leading-relaxed line-clamp-2 ${isDepleted ? 'text-slate-500' : 'text-slate-300'}`}>
                          {card.desc}
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={isInCombat || isSlotFull || isDepleted}
                        onClick={() => nextInstance && onEquipSkillCard(configuringHero.instanceId, nextInstance)}
                        className={`w-full py-2 rounded-xl font-black text-xs shrink-0 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white ${isActive ? 'bg-amber-600 hover:bg-amber-500' : 'bg-cyan-600 hover:bg-cyan-500'}`}
                      >
                        {isInCombat
                          ? '🔒 戰鬥中鎖定'
                          : isDepleted
                            ? '已全數裝出 (0)'
                            : isSlotFull
                              ? `${isActive ? '主動' : '被動'}卡槽已滿 (2/2)`
                              : `+ 鑲嵌至【${configuringHero.name}】`}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {showOccupiedCards && occupiedCardsByOthers.length > 0 && (
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                  <span>其他英雄穿戴中的技能卡（點擊可先卸下退回倉庫）：</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {occupiedCardsByOthers.map(({ uniqueKey, card, owner }) => (
                    <div key={uniqueKey} className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between gap-2 text-xs">
                      <div className="min-w-0">
                        <div className="font-bold text-slate-200 truncate">{card.type === 'active' ? '⚡' : '💠'} {card.name}</div>
                        <div className="text-[10px] text-amber-300 truncate">由【{owner.name}】穿戴中</div>
                      </div>
                      <button
                        type="button"
                        disabled={isInCombat}
                        onClick={() => onUnequipSkillCard(owner.instanceId, card)}
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

        {/* 底部完成按鈕 */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950/90 flex justify-end shrink-0">
          <button type="button" onClick={onClose} className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow">
            完成配置
          </button>
        </div>
      </div>
    </div>
  );
}
