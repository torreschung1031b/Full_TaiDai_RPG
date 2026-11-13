import React, { useState } from 'react';
import { Store, Sparkles, Lock, Filter } from 'lucide-react';

const SHOP_CATEGORIES = ['全部', '鍛造耗材', '補給丹藥', '武學秘笈', '神兵利器', '英雄招募'];

export default function ShopTab({
  player,
  isInCombat,
  shopLastReward,
  handleShopPurchase
}) {
  const [activeCategory, setActiveCategory] = useState('全部');

  // 大還丹隨主角等級動態調整價格（避免後期廉價無限續航）
  const rationDynamicPrice = 200 + (player.level || 1) * 25;

  const shopItems = [
    {
      id: 'ration_full',
      category: '補給丹藥',
      icon: '🍙',
      name: '行軍大還丹禮包',
      price: rationDynamicPrice,
      badge: '隨身救急',
      badgeStyle: 'bg-emerald-950 text-emerald-300 border-emerald-700',
      oddsText: '即時生效 • 價格隨少俠境界動態調整',
      allowBulk5: false,
      desc: '立即恢復主角與全體登場英雄 100% 氣血、內力與職業資源（若在營地可優先回客棧免費休養）。'
    },
    {
      id: 'stone_1',
      category: '鍛造耗材',
      icon: '💎',
      name: '精鍊石（單顆）',
      price: 350,
      badge: '強化耗材',
      badgeStyle: 'bg-cyan-950 text-cyan-300 border-cyan-700',
      oddsText: '固定獲得 • +1 顆精鍊石',
      allowBulk5: false,
      desc: '鐵匠鋪強化裝備必備材料，立即獲得 +1 顆精鍊石。'
    },
    {
      id: 'stone_5',
      category: '鍛造耗材',
      icon: '💠',
      name: '五連精鍊石袋',
      price: 1600,
      badge: '特惠 91 折',
      badgeStyle: 'bg-amber-950 text-amber-300 border-amber-700',
      oddsText: '批發優惠（原價 1,750 金幣）• +5 顆精鍊石',
      allowBulk5: false,
      desc: '行腳商批量採購優惠袋，立即獲得 +5 顆精鍊石。'
    },
    {
      id: 'skill_box',
      category: '武學秘笈',
      icon: '🃏',
      name: '秘傳技能卡盲盒',
      price: 900,
      badge: '武學殘卷',
      badgeStyle: 'bg-purple-950 text-purple-300 border-purple-700',
      oddsText: '機率公示：全職業主動 / 被動技能卡等機率隨機',
      allowBulk5: true,
      desc: '隨機開出 1 張英雄主動或被動技能卡，自動存入技能卡倉庫。'
    },
    {
      id: 'equip_box_mid',
      category: '神兵利器',
      icon: '🎁',
      name: '江湖兵器箱（Tier 1～3）',
      price: 1100,
      badge: '凡鐵～玄鐵',
      badgeStyle: 'bg-sky-950 text-sky-300 border-sky-700',
      oddsText: '掉率：Tier 1 (62%) • Tier 2 (28%) • Tier 3 (10%)',
      allowBulk5: true,
      desc: '依副本同級掉率開出 Tier 1 至 Tier 3 裝備，有 10% 機率附帶 +1 精鍊。'
    },
    {
      id: 'equip_box_high',
      category: '神兵利器',
      icon: '⚱️',
      name: '天工神兵匣（Tier 3～5）',
      price: 4200,
      badge: '玄鐵～仙器',
      badgeStyle: 'bg-amber-950 text-amber-300 border-amber-500',
      oddsText: '掉率：Tier 3 (68%) • Tier 4 靈寶 (25%) • Tier 5 仙器 (7%)',
      allowBulk5: true,
      desc: '西域秘藏神兵匣，保底 Tier 3 起跳，低機率開出傳世靈寶與仙器（15% 附帶 +1 精鍊）。'
    },
    {
      id: 'hero_scroll_normal',
      category: '英雄招募',
      icon: '📜',
      name: '尋訪英雄帖（Tier 1～3）',
      price: 1400,
      badge: '江湖招募',
      badgeStyle: 'bg-indigo-950 text-indigo-300 border-indigo-700',
      oddsText: '掉率：Tier 1 (65%) • Tier 2 (27%) • Tier 3 (8%)',
      allowBulk5: true,
      desc: '廣發江湖帖招募豪傑，依稀有度權重招募 Tier 1 至 Tier 3 英雄加入名冊。'
    },
    {
      id: 'hero_scroll_rare',
      category: '英雄招募',
      icon: '👑',
      name: '名將拜帖（Tier 3～5 稀有）',
      price: 4800,
      badge: '名將保底',
      badgeStyle: 'bg-rose-950 text-rose-300 border-rose-700',
      oddsText: '掉率：Tier 3 (72%) • Tier 4 宗師 (22%) • Tier 5 傳說 (6%)',
      allowBulk5: true,
      desc: '重金禮聘隱世高人，保底招募 Tier 3 以上豪傑，有 6% 機率延攬 Tier 5 傳說名將！'
    }
  ];

  const visibleItems = activeCategory === '全部'
    ? shopItems
    : shopItems.filter(i => i.category === activeCategory);

  return (
    <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur space-y-5 max-w-5xl mx-auto">
      {/* 標題與資產列 */}
      <div className="flex flex-wrap justify-between items-center gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <Store className="w-6 h-6 text-amber-400" />
          <div>
            <h2 className="font-extrabold text-amber-400 text-lg">🏮 江湖市集（西域行腳商）</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              定價與機率已對齊副本掉落曲線，高階仙器與傳說名將需重金求購
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

      {/* 分類篩選列 */}
      <div className="flex flex-wrap items-center gap-1.5">
        <Filter className="w-3.5 h-3.5 text-slate-400 mr-1" />
        {SHOP_CATEGORIES.map(cat => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${
              activeCategory === cat
                ? 'bg-amber-500 text-slate-950 border-amber-300'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-600'
            }`}
          >
            {cat}
          </button>
        ))}
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

      {/* 商品網格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {visibleItems.map(item => {
          const canAfford1 = player.gold >= item.price;
          const bulk5Price = item.price * 5;
          const canAfford5 = player.gold >= bulk5Price;

          return (
            <div
              key={item.id}
              className="bg-slate-950/90 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-4 flex flex-col justify-between gap-3 transition-all"
            >
              <div className="space-y-2">
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

                {/* 機率 / 規則公示條 */}
                <div className="text-[11px] font-mono bg-slate-900/90 text-slate-300 px-3 py-1.5 rounded-xl border border-slate-800/90">
                  {item.oddsText}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-slate-800/80">
                <span className="text-xs font-mono font-bold text-amber-400">
                  單價：{item.price.toLocaleString()} 金幣
                </span>

                <div className="flex items-center gap-2">
                  {item.allowBulk5 && (
                    <button
                      type="button"
                      disabled={isInCombat || !canAfford5}
                      onClick={() => handleShopPurchase(item, 5)}
                      className="px-3 py-2 bg-purple-700 hover:bg-purple-600 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow transition-all active:scale-95"
                      title={`花費 ${bulk5Price.toLocaleString()} 金幣連開 5 次`}
                    >
                      五連開 ({bulk5Price.toLocaleString()})
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={isInCombat || !canAfford1}
                    onClick={() => handleShopPurchase(item, 1)}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow transition-all active:scale-95"
                  >
                    {isInCombat ? '🔒 鎖定' : !canAfford1 ? '金幣不足' : `💰 購買`}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
