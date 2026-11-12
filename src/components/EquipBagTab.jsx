import React from 'react';
import { HelpCircle } from 'lucide-react';
import { EQUIP_SLOTS } from '../data/equipment';
import { enrichEquipmentMeta } from '../utils/statCalculator';

export default function EquipBagTab({
  player,
  isInCombat,
  equipmentInventory,
  skillCardsInventory,
  handleEquipItem,
  handleUnequipItem,
  handleSellEquipment,
  handleBulkSellUnusableEquipment,
  setHelpModalTab
}) {
  return (
    <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-wrap justify-between items-center gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <h2 className="font-extrabold text-amber-400 text-lg">🛡️ 6大部位與裝備欄</h2>
          <button
            onClick={() => setHelpModalTab('equip')}
            className="text-slate-400 hover:text-amber-300 transition-colors"
            title="查看裝備職業限制與賣出規則"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono font-bold">
          <span className="bg-slate-950 text-amber-300 px-3 py-1 rounded-full border border-slate-800">💰 金幣: {player.gold}</span>
          <span className="bg-slate-950 text-cyan-300 px-3 py-1 rounded-full border border-slate-800">💎 精鍊石: {player.refineStones}</span>
        </div>
      </div>

      {/* 身上六大部位 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {EQUIP_SLOTS.map(s => {
          const rawItem = player.equipped[s.key];
          const item = enrichEquipmentMeta(rawItem);
          return (
            <div key={s.key} className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-xs flex justify-between items-center gap-2">
              <div className="min-w-0">
                <div className="text-slate-400 font-bold">{s.icon} {s.label}</div>
                {item ? (
                  <>
                    <div className="text-amber-300 font-bold mt-1 truncate">{item.name} (+{item.refineLevel || 0})</div>
                    <div className="text-[10px] text-slate-400 truncate mt-0.5">{item.desc}</div>
                  </>
                ) : (
                  <div className="text-slate-600 italic mt-1">未裝備</div>
                )}
              </div>
              {item && (
                <button
                  disabled={isInCombat}
                  onClick={() => handleUnequipItem(s.key)}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-rose-800 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 hover:text-white rounded-xl text-[11px] font-bold shrink-0 transition-all"
                >
                  {isInCombat ? '🔒 鎖定' : '📤 除下'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* 背包內閒置裝備 */}
      <div className="space-y-3">
        <div className="flex flex-wrap justify-between items-center gap-2">
          <h3 className="font-extrabold text-amber-400 text-base">
            📦 背包內閒置裝備 ({equipmentInventory.length} 件)
          </h3>
          <button
            disabled={isInCombat || equipmentInventory.length === 0}
            onClick={handleBulkSellUnusableEquipment}
            className="px-3 py-1.5 bg-rose-900/70 hover:bg-rose-800 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-rose-200 border border-rose-700/60 rounded-xl text-xs font-bold transition-all"
          >
            🧹 一鍵賣出非本職裝備
          </button>
        </div>

        {equipmentInventory.length === 0 ? (
          <div className="text-xs text-slate-500 bg-slate-950 p-4 rounded-xl border border-slate-800">
            背包中暫無閒置裝備（已穿在身上的裝備可於上方部位欄點擊「📤 除下」退回背包）。
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {equipmentInventory.map(rawItem => {
              const item = enrichEquipmentMeta(rawItem);
              const canWear = item.allowedJobs.includes(player.job);
              return (
                <div key={item.uid} className={`bg-slate-950 p-3.5 rounded-2xl border flex justify-between items-center gap-3 text-xs ${canWear ? 'border-slate-800' : 'border-rose-950/80 opacity-85'}`}>
                  <div className="min-w-0 space-y-1">
                    <div className="font-bold text-amber-300 flex items-center gap-1.5 flex-wrap">
                      <span>{item.name} (+{item.refineLevel || 0})</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${canWear ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300 border border-rose-800'}`}>
                        {item.equipTag}
                      </span>
                    </div>
                    <div className="text-slate-400 text-[11px]">{item.desc}</div>
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <button
                      disabled={isInCombat || !canWear}
                      onClick={() => handleEquipItem(item)}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs transition-all"
                    >
                      {isInCombat ? '🔒 戰鬥鎖定' : !canWear ? '🔒 職業不符' : '裝備上身'}
                    </button>
                    <button
                      disabled={isInCombat}
                      onClick={() => handleSellEquipment(item)}
                      className="px-3 py-1 bg-slate-900 hover:bg-rose-900/80 disabled:opacity-40 disabled:cursor-not-allowed text-amber-300 hover:text-white border border-slate-700 rounded-xl text-[11px] font-mono font-bold transition-all"
                    >
                      💰 賣出 +{item.sellPrice}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 閒置英雄技能卡庫存 */}
      <div>
        <h3 className="font-extrabold text-purple-300 text-base mb-3">🃏 閒置英雄技能卡庫存 ({skillCardsInventory.length} 張)</h3>
        {skillCardsInventory.length === 0 ? (
          <div className="text-xs text-slate-500 bg-slate-950 p-4 rounded-xl border border-slate-800">
            背包中暫無閒置技能卡（已裝配在英雄身上的卡片可前往「英雄隊伍」隨時拆下）。
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {skillCardsInventory.map(card => (
              <div key={card.uid} className="bg-slate-950 p-3.5 rounded-xl border border-purple-500/30 text-xs space-y-1">
                <div className="font-bold text-purple-300 flex justify-between">
                  <span>{card.icon} {card.name}</span>
                  <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                    {card.type === 'active' ? '主動卡' : '被動卡'}
                  </span>
                </div>
                <div className="text-slate-400 text-[11px]">{card.desc}</div>
                <div className="text-[10px] text-amber-300/90 pt-1">
                  適用職業：{card.allowedJobs.join('、')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
