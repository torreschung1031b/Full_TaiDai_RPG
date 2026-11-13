import React, { useState, useMemo } from 'react';
import { Filter } from 'lucide-react';
import { enrichEquipmentMeta, getActiveSetBonuses } from '../../data/equipment';

const EQUIP_SLOTS = [
  { key: 'weapon', label: '🗡️ 武器' },
  { key: 'offhand', label: '🛡️ 副手' },
  { key: 'helmet', label: '🪖 頭冠' },
  { key: 'armor', label: '🥋 戰甲' },
  { key: 'shoes', label: '👢 戰靴' },
  { key: 'accessory', label: '💍 飾品' }
];

const TIER_FILTER_OPTIONS = [
  { tier: 1, label: 'T1 凡鐵' },
  { tier: 2, label: 'T2 精鋼' },
  { tier: 3, label: 'T3 玄鐵' },
  { tier: 4, label: 'T4 靈寶' }
];

export function EquipmentBagTab({
  player,
  isInCombat,
  equipmentInventory,
  handleEquipItem,
  handleUnequipItem,
  handleSellEquipment,
  handleBulkSellFilteredEquipment
}) {
  const [showBulkCleanPanel, setShowBulkCleanPanel] = useState(false);
  const [cleanTiers, setCleanTiers] = useState([1, 2]);
  const [cleanTypes, setCleanTypes] = useState(EQUIP_SLOTS.map(s => s.key));
  const [cleanOnlyUnusable, setCleanOnlyUnusable] = useState(false);
  const [cleanProtectModified, setCleanProtectModified] = useState(true);

  const sortedEquipmentInventory = useMemo(() => {
    return [...(equipmentInventory || [])].sort((a, b) => {
      const tierDiff = (b.tier || 1) - (a.tier || 1);
      if (tierDiff !== 0) return tierDiff;
      const refineDiff = (b.refineLevel || 0) - (a.refineLevel || 0);
      if (refineDiff !== 0) return refineDiff;
      const aUsable = enrichEquipmentMeta(a).allowedJobs.includes(player.job) ? 1 : 0;
      const bUsable = enrichEquipmentMeta(b).allowedJobs.includes(player.job) ? 1 : 0;
      return bUsable - aUsable;
    });
  }, [equipmentInventory, player.job]);

  const bulkCleanPreview = useMemo(() => {
    let count = 0;
    let totalGold = 0;
    (equipmentInventory || []).forEach(item => {
      const meta = enrichEquipmentMeta(item);
      const isModified = (item.refineLevel || 0) > 0 || (item.sockets || []).some(Boolean) || Boolean(item.reforgeAffix);
      if (
        cleanTiers.includes(meta.tier) &&
        cleanTypes.includes(meta.type) &&
        (!cleanOnlyUnusable || !meta.allowedJobs.includes(player.job)) &&
        (!cleanProtectModified || !isModified)
      ) {
        count += 1;
        totalGold += meta.sellPrice;
      }
    });
    return { count, totalGold };
  }, [equipmentInventory, cleanTiers, cleanTypes, cleanOnlyUnusable, cleanProtectModified, player.job]);

  const activeSetBonuses = useMemo(() => getActiveSetBonuses(player.equipped), [player.equipped]);

  const toggleCleanTier = (t) => setCleanTiers(prev => (prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]));
  const toggleCleanType = (k) => setCleanTypes(prev => (prev.includes(k) ? prev.filter(x => x !== k) : [...prev, k]));

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-wrap justify-between items-center gap-2 border-b border-slate-800 pb-3">
        <div>
          <h2 className="font-extrabold text-amber-400 text-lg">🛡️ 少俠已穿戴神兵與裝備背包</h2>
          <p className="text-xs text-slate-400 mt-0.5">背包已自動依階級（T5 仙器 → T1 凡鐵）與精鍊等級由高至低排序</p>
        </div>
        <button
          type="button"
          disabled={isInCombat}
          onClick={() => setShowBulkCleanPanel(prev => !prev)}
          className={`px-3.5 py-2 rounded-xl font-bold text-xs border flex items-center gap-1.5 transition-all disabled:opacity-40 ${
            showBulkCleanPanel ? 'bg-rose-600 border-rose-400 text-white' : 'bg-rose-950/80 hover:bg-rose-900 text-rose-200 border-rose-700'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          <span>{showBulkCleanPanel ? '▲ 收起批量清理設定' : '🧹 一鍵清理（自訂階級／類型）'}</span>
        </button>
      </div>

      {/* 批量清理面板 */}
      {showBulkCleanPanel && (
        <div className="bg-slate-950/95 border border-rose-500/50 rounded-2xl p-4 space-y-3.5 shadow-xl">
          <div className="text-xs font-extrabold text-rose-300 flex items-center justify-between flex-wrap gap-2">
            <span>🧹 勾選要批量出售的裝備條件（預設保護 T5 仙器）：</span>
            <div className="flex gap-2 text-[11px]">
              <button type="button" onClick={() => setCleanTiers([1, 2, 3, 4])} className="text-amber-300 hover:underline">全選 T1~T4</button>
              <span className="text-slate-600">|</span>
              <button type="button" onClick={() => setCleanTypes(EQUIP_SLOTS.map(s => s.key))} className="text-cyan-300 hover:underline">全選類型</button>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="text-[11px] font-bold text-slate-400">1. 選擇裝備階級：</div>
            <div className="flex flex-wrap gap-2">
              {TIER_FILTER_OPTIONS.map(opt => {
                const checked = cleanTiers.includes(opt.tier);
                return (
                  <button
                    key={opt.tier}
                    type="button"
                    onClick={() => toggleCleanTier(opt.tier)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${checked ? 'bg-amber-500/25 border-amber-400 text-amber-200' : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-600'}`}
                  >
                    {checked ? '☑️' : '⬜'} {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="text-[11px] font-bold text-slate-400">2. 選擇裝備部位類型：</div>
            <div className="flex flex-wrap gap-2">
              {EQUIP_SLOTS.map(slot => {
                const checked = cleanTypes.includes(slot.key);
                return (
                  <button
                    key={slot.key}
                    type="button"
                    onClick={() => toggleCleanType(slot.key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${checked ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200' : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-600'}`}
                  >
                    {checked ? '☑️' : '⬜'} {slot.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-1 text-xs">
            <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer select-none">
              <input type="checkbox" checked={cleanOnlyUnusable} onChange={(e) => setCleanOnlyUnusable(e.target.checked)} className="accent-rose-500 w-3.5 h-3.5" />
              <span>僅出售「非本職業可穿戴」裝備</span>
            </label>
            <label className="flex items-center gap-1.5 text-emerald-300 cursor-pointer select-none">
              <input type="checkbox" checked={cleanProtectModified} onChange={(e) => setCleanProtectModified(e.target.checked)} className="accent-emerald-500 w-3.5 h-3.5" />
              <span>自動跳過已精鍊 / 已鑲嵌寶石 / 已洗鍊神兵</span>
            </label>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-slate-800">
            <div className="text-xs font-mono text-slate-300">
              符合條件：<strong className="text-rose-300">{bulkCleanPreview.count}</strong> 件 • 預計獲得：<strong className="text-amber-300">+{bulkCleanPreview.totalGold} 金幣</strong>
            </div>
            <button
              type="button"
              disabled={isInCombat || bulkCleanPreview.count === 0}
              onClick={() => handleBulkSellFilteredEquipment({ tiers: cleanTiers, types: cleanTypes, onlyUnusable: cleanOnlyUnusable, protectModified: cleanProtectModified })}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-black text-xs shadow transition-all"
            >
              💰 確認批量出售 ({bulkCleanPreview.count} 件)
            </button>
          </div>
        </div>
      )}

      {/* 套裝共鳴 */}
      {activeSetBonuses.length > 0 && (
        <div className="bg-amber-950/25 border border-amber-500/45 rounded-2xl p-4 space-y-2">
          <div className="text-xs font-extrabold text-amber-300">🔮 已穿戴套裝共鳴效果</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {activeSetBonuses.map(s => (
              <div key={s.setId} className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 space-y-1">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-amber-300">【{s.name}】</span>
                  <span className={`font-mono px-2 py-0.5 rounded ${s.hasAnyUnlocked ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'bg-slate-900 text-slate-400'}`}>
                    {s.count} / {s.maxPieces} 件
                  </span>
                </div>
                {s.tiers.map(t => (
                  <div key={t.pieces} className={`text-[11px] ${t.unlocked ? 'text-emerald-300 font-bold' : 'text-slate-500'}`}>
                    {t.unlocked ? '✅' : '⬜'} ({t.pieces}件套) {t.desc}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 已穿戴 6 部位 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {EQUIP_SLOTS.map(slot => {
          const rawItem = player.equipped?.[slot.key];
          const item = rawItem ? enrichEquipmentMeta(rawItem) : null;
          return (
            <div key={slot.key} className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-400">{slot.label}</span>
                {item && (
                  <button disabled={isInCombat} onClick={() => handleUnequipItem(slot.key)} className="text-[11px] text-rose-300 hover:underline disabled:opacity-40">
                    卸下
                  </button>
                )}
              </div>
              {item ? (
                <div className="space-y-1">
                  <div className="font-bold text-amber-300 text-xs flex items-center gap-1.5 flex-wrap">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${item.tierBadgeStyle}`}>{item.tierTag}</span>
                    <span>{item.name} (+{item.refineLevel})</span>
                  </div>
                  <div className="text-[11px] text-slate-300">{item.desc}</div>
                  {item.reforgeAffix && (
                    <div className="text-[11px] text-purple-300 font-bold">✨ 詞條【{item.reforgeAffix.name}】{item.reforgeAffix.desc}</div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-slate-600 italic py-2">尚未穿戴裝備</div>
              )}
            </div>
          );
        })}
      </div>

      {/* 裝備背包清單 */}
      <div className="space-y-2.5">
        <div className="text-xs font-bold text-amber-300">🎒 裝備背包（{sortedEquipmentInventory.length} 件 • 高階優先排序）</div>
        {sortedEquipmentInventory.length === 0 ? (
          <div className="text-xs text-slate-500 py-6 text-center">背包目前空空如也。</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sortedEquipmentInventory.map(rawItem => {
              const item = enrichEquipmentMeta(rawItem);
              const jobAllowed = item.allowedJobs.includes(player.job);
              return (
                <div key={item.uid} className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex flex-col justify-between gap-2.5">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-amber-300">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${item.tierBadgeStyle}`}>{item.tierTag}</span>
                        <span>{item.name} (+{item.refineLevel})</span>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded border ${jobAllowed ? 'bg-emerald-950 text-emerald-300 border-emerald-700' : 'bg-rose-950 text-rose-300 border-rose-700'}`}>
                        {item.equipTag}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-300">{item.desc}</div>
                    {item.reforgeAffix && (
                      <div className="text-[11px] text-purple-300 font-bold">✨ 詞條【{item.reforgeAffix.name}】{item.reforgeAffix.desc}</div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      disabled={isInCombat || !jobAllowed}
                      onClick={() => handleEquipItem(rawItem)}
                      className="flex-1 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-xs"
                    >
                      {jobAllowed ? '穿戴裝備' : '職業不符'}
                    </button>
                    <button
                      disabled={isInCombat}
                      onClick={() => handleSellEquipment(rawItem)}
                      className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-rose-900 text-amber-300 font-bold text-xs disabled:opacity-40"
                    >
                      賣出 (+{item.sellPrice}金)
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
