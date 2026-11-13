import React, { useState, useMemo } from 'react';
import { Sparkles, HelpCircle, Hammer, Gem, ShieldCheck, Wand2 } from 'lucide-react';
import {
  GEMS_DB,
  enrichEquipmentMeta,
  getRefineSuccessRate,
  getNextRefineIncrementPct
} from '../../data/equipment';

const GEM_SHORT_LABELS = {
  gem_ruby: { label: '🔴 紅寶石 +15攻', style: 'border-rose-700/80 bg-rose-950/50 hover:bg-rose-900/70 text-rose-200' },
  gem_sapphire: { label: '🔵 藍寶石 +30內', style: 'border-sky-700/80 bg-sky-950/50 hover:bg-sky-900/70 text-sky-200' },
  gem_emerald: { label: '🟢 翡翠 +80血', style: 'border-emerald-700/80 bg-emerald-950/50 hover:bg-emerald-900/70 text-emerald-200' },
  gem_topaz: { label: '🟡 黃玉 +10防', style: 'border-amber-700/80 bg-amber-950/50 hover:bg-amber-900/70 text-amber-200' }
};

function getRefineButtonText({ isInCombat, refineStones, gold, goldCost, nextLvl, scrollProtected }) {
  if (isInCombat) return '🔒 戰鬥中鎖定';
  if (refineStones < 1) return '精鍊石不足';
  if (gold < goldCost) return '金幣不足';
  return `🔨 強化精鍊至 +${nextLvl}${scrollProtected ? '（消耗1張保底符）' : ''}`;
}

function ForgeItemCard({
  rawItem,
  player,
  isInCombat,
  useProtectScroll,
  protectScrolls,
  handleRefineEquipment,
  handleReforgeEquipment,
  handleSocketGem
}) {
  const item = enrichEquipmentMeta(rawItem);
  const lvl = item.refineLevel || 0;
  const goldCost = (lvl + 1) * 120;
  const ratePct = Math.round(getRefineSuccessRate(lvl) * 100);
  const nextIncPct = Math.round(getNextRefineIncrementPct(lvl) * 100);
  const isRisky = lvl >= 4;
  const scrollProtected = isRisky && useProtectScroll && protectScrolls > 0;
  const canRefine = !isInCombat && player.gold >= goldCost && player.refineStones >= 1;
  const canReforge = !isInCombat && player.gold >= 250 && player.refineStones >= 1;

  return (
    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 flex flex-col justify-between">
      <div className="space-y-2">
        <div className="font-bold text-amber-300 text-sm flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`text-[10px] px-2 py-0.5 rounded border font-bold ${item.tierBadgeStyle}`}>{item.tierTag}</span>
            <span>{item.name} (+{lvl})</span>
          </div>
          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${item._isEquipped ? 'bg-emerald-950 text-emerald-300 border-emerald-700' : 'bg-slate-900 text-slate-400 border-slate-700'}`}>
            {item._isEquipped ? '已穿戴' : '背包中'}
          </span>
        </div>

        <div className="text-xs text-slate-400">{item.desc}</div>

        {/* 洗鍊副詞條 */}
        <div className="flex items-center justify-between gap-2 bg-purple-950/25 border border-purple-700/40 rounded-xl px-3 py-2 text-xs">
          <div>
            <span className="text-[11px] text-purple-300 font-bold">✨ 洗鍊詞條：</span>
            {item.reforgeAffix ? (
              <span className="text-amber-200 font-bold">【{item.reforgeAffix.name}】{item.reforgeAffix.desc}</span>
            ) : (
              <span className="text-slate-500 italic">尚未覺醒副詞條</span>
            )}
          </div>
          {handleReforgeEquipment && (
            <button
              type="button"
              disabled={!canReforge}
              onClick={() => handleReforgeEquipment(rawItem)}
              className="px-2.5 py-1 rounded-lg bg-purple-700 hover:bg-purple-600 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-[11px] flex items-center gap-1 shrink-0 transition-all"
              title="消耗 250 金幣 + 1 精鍊石重鑄隨機副詞條"
            >
              <Wand2 className="w-3 h-3" />
              <span>洗鍊 (250金+1石)</span>
            </button>
          )}
        </div>

        {/* 精鍊操作 */}
        <div className="pt-1 space-y-1.5">
          <div className="flex justify-between items-center text-[11px] font-mono flex-wrap gap-1">
            <span className="text-slate-400">
              消耗：<span className="text-cyan-300 font-bold">1石</span>＋<span className="text-amber-300 font-bold">{goldCost}金</span>（下級 +{nextIncPct}%）
            </span>
            <span className={`px-2 py-0.5 rounded font-bold border ${scrollProtected ? 'bg-indigo-950/80 text-indigo-300 border-indigo-600' : isRisky ? 'bg-rose-950/80 text-rose-300 border-rose-700/80' : 'bg-emerald-950/80 text-emerald-300 border-emerald-700/80'}`}>
              {scrollProtected ? `🛡️ 成功率 ${ratePct}% (保底護持)` : isRisky ? `⚠️ 成功率 ${ratePct}% (失敗降1級)` : `✅ 成功率 ${ratePct}%`}
            </span>
          </div>
          <button
            disabled={!canRefine}
            onClick={() => handleRefineEquipment(rawItem, scrollProtected)}
            className={`w-full py-2.5 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow transition-all ${scrollProtected ? 'bg-indigo-600 hover:bg-indigo-500' : isRisky ? 'bg-orange-600 hover:bg-orange-500' : 'bg-amber-600 hover:bg-amber-500'}`}
          >
            {getRefineButtonText({
              isInCombat,
              refineStones: player.refineStones,
              gold: player.gold,
              goldCost,
              nextLvl: lvl + 1,
              scrollProtected
            })}
          </button>
        </div>
      </div>

      {/* 寶石插槽 */}
      <div className="pt-2.5 border-t border-slate-800/80 space-y-2">
        <div className="text-[11px] text-slate-400 flex items-center justify-between">
          <span className="flex items-center gap-1 font-bold text-cyan-300">
            <Gem className="w-3.5 h-3.5" />
            <span>寶石插槽 ({item.sockets?.length || 0} 孔)</span>
          </span>
          {item.sockets?.length > 0 && <span className="text-[10px] text-slate-500 font-mono">每次鑲嵌/替換 100 金幣</span>}
        </div>

        {!item.sockets || item.sockets.length === 0 ? (
          <div className="text-[11px] text-slate-600 italic bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800/60">
            此階裝備無寶石插槽（Tier 2 以上名器附帶插槽）
          </div>
        ) : (
          <div className="space-y-2">
            {item.sockets.map((gem, sIdx) => (
              <div key={sIdx} className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-400 font-bold">第 {sIdx + 1} 孔狀態：</span>
                  {gem ? (
                    <span className="text-amber-300 font-bold bg-amber-950/60 border border-amber-700/60 px-2 py-0.5 rounded">💠 {gem.name}</span>
                  ) : (
                    <span className="text-slate-500 italic">空插槽</span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {GEMS_DB.map(gOption => {
                    const shortMeta = GEM_SHORT_LABELS[gOption.id] || { label: gOption.name, style: 'border-slate-700 bg-slate-800 text-slate-200' };
                    const isSameGem = gem?.id === gOption.id;
                    return (
                      <button
                        key={gOption.id}
                        disabled={isInCombat || isSameGem || player.gold < 100}
                        onClick={() => handleSocketGem(rawItem, gOption, sIdx)}
                        className={`px-2 py-1 rounded-lg border text-[10px] font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed text-left truncate ${shortMeta.style}`}
                      >
                        {isSameGem ? '✓ 已鑲嵌' : `${gem ? '換' : '+'}${shortMeta.label}`}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function ForgeTab({
  player,
  isInCombat,
  equipmentInventory,
  forgeFeedback,
  handleRefineEquipment,
  handleReforgeEquipment,
  handleSocketGem,
  setHelpModalTab
}) {
  const [useProtectScroll, setUseProtectScroll] = useState(true);
  const protectScrolls = player.protectScrolls || 0;

  const allForgeable = useMemo(() => {
    const sortByTierAndRefine = (a, b) => (b.tier || 1) - (a.tier || 1) || (b.refineLevel || 0) - (a.refineLevel || 0);
    const equippedList = Object.values(player.equipped || {}).filter(Boolean).map(i => ({ ...i, _isEquipped: true })).sort(sortByTierAndRefine);
    const bagList = [...(equipmentInventory || [])].map(i => ({ ...i, _isEquipped: false })).sort(sortByTierAndRefine);
    return [...equippedList, ...bagList];
  }, [player.equipped, equipmentInventory]);

  return (
    <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur space-y-5 max-w-5xl mx-auto">
      <div className="flex flex-wrap justify-between items-center gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Hammer className="w-5 h-5 text-amber-400" />
          <h2 className="font-extrabold text-amber-400 text-lg">🔨 鐵匠精鍊・詞條洗鍊・寶石鑲嵌</h2>
          {setHelpModalTab && (
            <button onClick={() => setHelpModalTab('equip')} className="text-slate-400 hover:text-amber-300 transition-colors" title="查看裝備階級與精鍊規則">
              <HelpCircle className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-mono font-bold">
          <span className="bg-slate-950 text-amber-300 px-3 py-1 rounded-full border border-slate-800">💰 金幣: {player.gold}</span>
          <span className="bg-slate-950 text-cyan-300 px-3 py-1 rounded-full border border-slate-800">💎 精鍊石: {player.refineStones}</span>
          <span className="bg-slate-950 text-indigo-300 px-3 py-1 rounded-full border border-indigo-700/70">🛡️ 保底符: {protectScrolls}</span>
        </div>
      </div>

      {/* 保底符與規則說明 */}
      <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3.5 text-xs text-slate-300 flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <div>
            <span className="text-amber-300 font-bold">⚒️ 遞增精鍊：</span>
            越高級成長幅度越大（+1 增 10%、+5 累計 +80%、+10 累計 +256%）；<span className="text-rose-300 font-bold">+4 以上失敗將降 1 級</span>。
          </div>
          <div>
            <span className="text-purple-300 font-bold">✨ 神兵洗鍊：</span>
            花費 <span className="text-amber-300 font-mono">250 金幣 + 1 精鍊石</span> 可為任意神兵重鑄額外神兵副詞條。
          </div>
        </div>

        <label className="flex items-center gap-2 bg-indigo-950/50 border border-indigo-600/60 px-3.5 py-2 rounded-xl cursor-pointer select-none">
          <input
            type="checkbox"
            checked={useProtectScroll && protectScrolls > 0}
            disabled={protectScrolls <= 0}
            onChange={(e) => setUseProtectScroll(e.target.checked)}
            className="accent-indigo-400 w-4 h-4"
          />
          <ShieldCheck className="w-4 h-4 text-indigo-300" />
          <span className="font-bold text-indigo-200">+4 以上自動使用【天工保底符】({protectScrolls} 張)</span>
        </label>
      </div>

      {forgeFeedback && (
        <div className={`rounded-2xl p-3.5 border text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md ${forgeFeedback.type === 'danger' ? 'bg-rose-950/60 border-rose-500/70 text-rose-200' : forgeFeedback.type === 'info' ? 'bg-indigo-950/60 border-indigo-500/70 text-indigo-200' : 'bg-emerald-950/60 border-emerald-500/70 text-emerald-200'}`}>
          <Sparkles className="w-4 h-4 shrink-0 text-amber-300" />
          <span>{forgeFeedback.text}</span>
        </div>
      )}

      {allForgeable.length === 0 ? (
        <div className="text-xs text-slate-500 py-6 text-center">目前身上與背包皆無可精鍊的裝備。</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allForgeable.map(rawItem => (
            <ForgeItemCard
              key={rawItem.uid}
              rawItem={rawItem}
              player={player}
              isInCombat={isInCombat}
              useProtectScroll={useProtectScroll}
              protectScrolls={protectScrolls}
              handleRefineEquipment={handleRefineEquipment}
              handleReforgeEquipment={handleReforgeEquipment}
              handleSocketGem={handleSocketGem}
            />
          ))}
        </div>
      )}
    </div>
  );
}
