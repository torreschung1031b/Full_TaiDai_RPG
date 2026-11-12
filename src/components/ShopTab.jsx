import React from 'react';
import { Store, Sparkles, Lock } from 'lucide-react';

const SHOP_ITEMS = [
  {
    id: 'stone_1',
    category: '鍛造耗材',
    icon: '💎',
    name: '精鍊石（單顆）',
    price: 180,
    badge: '基礎強化',
    badgeStyle: 'bg-cyan-950 text-cyan-300 border-cyan-700',
    desc: '鐵匠鋪強化裝備必備材料，立即獲得 +1 顆精鍊石。'
  },
  {
    id: 'stone_5',
    category: '鍛造耗材',
    icon: '💠',
    name: '五連精鍊石禮盒',
    price: 800,
    badge: '特惠 88 折',
    badgeStyle: 'bg-amber-950 text-amber-300 border-amber-700',
    desc: '行腳商批發優惠（原價 900 金幣），立即獲得 +5 顆精鍊石。'
  },
  {
    id: 'ration_full',
    category: '補給丹藥',
    icon: '🍙',
    name: '行軍大還丹禮包',
    price: 120,
    badge: '隨身補給',
    badgeStyle: 'bg-emerald-950 text-emerald-300 border-emerald-700',
    desc: '立即恢復主角與全體登場英雄 100% 氣血、內力與職業資源。'
  },
  {
    id: 'skill_box',
    category: '武學秘笈',
    icon: '🃏',
    name: '秘傳技能卡盲盒',
    price: 450,
    badge: '隨機技能卡',
    badgeStyle: 'bg-purple-950 text-purple-300 border-purple-700',
    desc: '隨機開出 1 張英雄主動或被動技能卡，自動存入技能卡庫存。'
  },
  {
    id: 'equip_box_mid',
    category: '神兵利器',
    icon: '🎁',
    name: '江湖兵器箱（Tier 1～3）',
    price: 450,
    badge: '凡鐵～玄鐵',
    badgeStyle: 'bg-sky-950 text-sky-300 border-sky-700',
    desc: '隨機開出 1 件 Tier 1 至 Tier 3 裝備，有 25% 機率直接附帶 +1 精鍊！'
  },
  {
    id: 'equip_box_high',
    category: '神兵利器',
    icon: '⚱️',
    name: '天工神兵匣（Tier 3～5）',
    price: 1600,
    badge: '玄鐵～仙器',
    badgeStyle: 'bg-amber-950 text-amber-300 border-amber-500',
    desc: '西域秘藏神兵匣，必定開出 Tier 3 至 Tier 5 稀有神裝（30% 附帶 +1 精鍊）！'
  },
  {
    id: 'hero_scroll_normal',
    category: '英雄招募',
    icon: '📜',
    name: '尋訪英雄帖（Tier 1～3）',
    price: 600,
    badge: '必得英雄',
    badgeStyle: 'bg-indigo-950 text-indigo-300 border-indigo-700',
    desc: '廣發江湖帖招募豪傑，隨機獲得 1 位 Tier 1 至 Tier 3 英雄加入名冊。'
  },
  {
    id: 'hero_scroll_rare',
    category: '英雄招募',
    icon: '👑',
    name: '名將拜帖（Tier 3～5 稀有）',
    price: 1800,
    badge: '高階保底',
    badgeStyle: 'bg-rose-950 text-rose-300 border-rose-700',
    desc: '重金禮聘隱世高人，必定招募 1 位 Tier 3 至 Tier 5 稀有傳奇英雄！'
  }
];

export default function ShopTab({
  player,
  isInCombat,
  shopLastReward,
  handleShopPurchase
}) {
  return (
    <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-wrap justify-between items-center gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <Store className="w-6 h-6 text-amber-400" />
          <div>
            <h2 className="font-extrabold text-amber-400 text-lg">🏮 江湖市集（西域行腳商）</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              消耗金幣採購精鍊耗材、分階神兵寶箱與高階英雄招募令
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono font-bold">
          <span className="bg-slate-950 text-amber-300 px-3.5 py-1.5 rounded-full border border-amber-500/40">
            💰 持有金幣: {player.gold}
          </span>
          <span className="bg-slate-950 text-cyan-300 px-3.5 py-1.5 rounded-full border border-slate-800">
            💎 精鍊石: {player.refineStones}
          </span>
        </div>
      </div>

      {isInCombat && (
        <div className="bg-rose-950/70 border border-rose-700/70 rounded-2xl p-3 text-xs text-rose-200 font-bold flex items-center gap-2">
          <Lock className="w-4 h-4 text-rose-400 shrink-0" />
          <span>戰鬥交鋒期間行腳商暫停營業，請先結束戰鬥返回安全營地。</span>
        </div>
      )}

      {shopLastReward && (
        <div className="bg-emerald-950/50 border border-emerald-500/60 rounded-2xl p-4 flex items-center gap-2.5 text-xs sm:text-sm text-emerald-200 font-bold shadow-lg">
          <Sparkles className="w-5 h-5 text-amber-300 shrink-0" />
          <span>{shopLastReward}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SHOP_ITEMS.map(item => {
          const canAfford = player.gold >= item.price;
          const disabled = isInCombat || !canAfford;

          return (
            <div
              key={item.id}
              className="bg-slate-950/90 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-4 flex flex-col justify-between gap-3 transition-all"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-extrabold text-amber-300 text-sm sm:text-base flex items-center gap-2">
                    <span className="text-xl">{item.icon}</span>
                    <span>{item.name}</span>
                  </div>
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border shrink-0 ${item.badgeStyle}`}>
                    {item.badge}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                <span className="text-xs font-mono font-bold text-amber-400">
                  售價：{item.price} 金幣
                </span>
                <button
                  disabled={disabled}
                  onClick={() => handleShopPurchase(item)}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow transition-all active:scale-95"
                >
                  {isInCombat ? '🔒 戰鬥鎖定' : !canAfford ? '金幣不足' : `💰 立即購買`}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
