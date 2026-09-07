import React, { useState, useEffect } from "react";
import { OrderBookData, RecentTrade } from "../types";
import { fetchBinanceDepth, fetchBinanceRecentTrades } from "../services/binanceClient";
import { Activity, Layers, ArrowUpRight, ArrowDownRight, RefreshCw } from "lucide-react";

interface OrderBookPanelProps {
  symbol: string;
  onSelectPrice?: (price: number) => void;
}

export const OrderBookPanel: React.FC<OrderBookPanelProps> = ({
  symbol,
  onSelectPrice,
}) => {
  const [tab, setTab] = useState<"BOOK" | "TRADES">("BOOK");
  const [orderBook, setOrderBook] = useState<OrderBookData | null>(null);
  const [trades, setTrades] = useState<RecentTrade[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());

  // Polling Depth and Trades
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const [depthData, tradesData] = await Promise.all([
          fetchBinanceDepth(symbol, 12),
          fetchBinanceRecentTrades(symbol, 16),
        ]);

        if (isMounted) {
          if (depthData) setOrderBook(depthData);
          if (tradesData && tradesData.length > 0) setTrades(tradesData);
          setIsLoading(false);
          setLastUpdated(Date.now());
        }
      } catch (err) {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();
    const interval = setInterval(loadData, 2500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [symbol]);

  // Derived metrics
  const topBid = orderBook?.bids?.[0]?.price || 0;
  const topAsk = orderBook?.asks?.[0]?.price || 0;
  const spread = topAsk > 0 && topBid > 0 ? topAsk - topBid : 0;
  const spreadPercent = topAsk > 0 ? (spread / topAsk) * 100 : 0;

  // Max quantities for depth bar rendering
  const maxBidQty = orderBook?.bids?.reduce((max, b) => Math.max(max, b.quantity), 0.0001) || 1;
  const maxAskQty = orderBook?.asks?.reduce((max, a) => Math.max(max, a.quantity), 0.0001) || 1;

  return (
    <div className="bg-[#0b0f16] border border-[#1c2432] rounded flex flex-col font-mono text-xs select-none h-full overflow-hidden">
      {/* Header with Subtabs */}
      <div className="flex items-center justify-between border-b border-[#182230] px-3 py-2 bg-[#090d13]">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setTab("BOOK")}
            className={`px-2 py-0.5 rounded text-[11px] font-bold flex items-center space-x-1.5 transition-colors ${
              tab === "BOOK"
                ? "bg-[#182333] text-emerald-300 border border-emerald-500/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>ORDER BOOK</span>
          </button>
          <button
            onClick={() => setTab("TRADES")}
            className={`px-2 py-0.5 rounded text-[11px] font-bold flex items-center space-x-1.5 transition-colors ${
              tab === "TRADES"
                ? "bg-[#182333] text-emerald-300 border border-emerald-500/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Activity className="w-3 h-3" />
            <span>RECENT TRADES</span>
          </button>
        </div>

        <div className="flex items-center space-x-1.5 text-[10px] text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-emerald-400 font-bold">BINANCE L2</span>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-2.5 overflow-hidden flex flex-col">
        {tab === "BOOK" ? (
          <div className="flex-1 flex flex-col justify-between space-y-1.5">
            {/* Asks (Sells) in reverse order - highest to lowest */}
            <div className="space-y-0.5">
              <div className="grid grid-cols-3 text-[10px] text-slate-500 pb-1 border-b border-[#151c27] px-1">
                <span>PRICE (USDT)</span>
                <span className="text-right">SIZE</span>
                <span className="text-right">TOTAL</span>
              </div>

              {orderBook?.asks && orderBook.asks.length > 0 ? (
                orderBook.asks.slice(0, 6).reverse().map((ask, idx) => {
                  const fillWidth = Math.min(100, Math.round((ask.quantity / maxAskQty) * 100));
                  return (
                    <div
                      key={`ask-${idx}`}
                      onClick={() => onSelectPrice && onSelectPrice(ask.price)}
                      className="relative grid grid-cols-3 text-[11px] py-0.5 px-1 rounded cursor-pointer hover:bg-rose-950/20 transition-colors group"
                      title="Click to copy price to order ticket"
                    >
                      {/* Depth Bar */}
                      <div
                        className="absolute right-0 top-0 bottom-0 bg-rose-500/10 pointer-events-none rounded"
                        style={{ width: `${fillWidth}%` }}
                      />
                      <span className="text-rose-400 font-bold relative z-10">
                        {ask.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-right text-slate-300 relative z-10">
                        {ask.quantity.toFixed(3)}
                      </span>
                      <span className="text-right text-slate-500 relative z-10">
                        ${Math.round(ask.price * ask.quantity).toLocaleString()}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="py-4 text-center text-slate-500 text-[11px]">
                  {isLoading ? "Connecting to Binance Order Book..." : "No order book data available."}
                </div>
              )}
            </div>

            {/* Mid Price & Spread Banner */}
            <div className="py-1 px-2 my-0.5 bg-[#101723] rounded border border-[#1b2536] flex items-center justify-between text-[11px]">
              <div className="flex items-center space-x-1.5">
                <span className="text-slate-400 text-[10px]">SPREAD:</span>
                <span className="font-bold text-slate-200">${spread.toFixed(2)}</span>
                <span className="text-slate-500 text-[10px]">({spreadPercent.toFixed(3)}%)</span>
              </div>
              <div className="text-[10px] text-emerald-400 font-bold">
                MID: ${((topBid + topAsk) / 2 || topBid).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>

            {/* Bids (Buys) - Highest to lowest */}
            <div className="space-y-0.5">
              {orderBook?.bids && orderBook.bids.length > 0 ? (
                orderBook.bids.slice(0, 6).map((bid, idx) => {
                  const fillWidth = Math.min(100, Math.round((bid.quantity / maxBidQty) * 100));
                  return (
                    <div
                      key={`bid-${idx}`}
                      onClick={() => onSelectPrice && onSelectPrice(bid.price)}
                      className="relative grid grid-cols-3 text-[11px] py-0.5 px-1 rounded cursor-pointer hover:bg-emerald-950/20 transition-colors group"
                      title="Click to copy price to order ticket"
                    >
                      {/* Depth Bar */}
                      <div
                        className="absolute right-0 top-0 bottom-0 bg-emerald-500/10 pointer-events-none rounded"
                        style={{ width: `${fillWidth}%` }}
                      />
                      <span className="text-emerald-400 font-bold relative z-10">
                        {bid.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-right text-slate-300 relative z-10">
                        {bid.quantity.toFixed(3)}
                      </span>
                      <span className="text-right text-slate-500 relative z-10">
                        ${Math.round(bid.price * bid.quantity).toLocaleString()}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="py-4 text-center text-slate-500 text-[11px]">
                  {isLoading ? "Loading bids..." : "No bids."}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Recent Trades Tape */
          <div className="flex-1 flex flex-col space-y-1">
            <div className="grid grid-cols-3 text-[10px] text-slate-500 pb-1 border-b border-[#151c27] px-1">
              <span>TIME</span>
              <span className="text-right">PRICE</span>
              <span className="text-right">SIZE</span>
            </div>

            <div className="space-y-0.5 overflow-y-auto max-h-[260px] pr-1">
              {trades.length > 0 ? (
                trades.map((t) => {
                  const date = new Date(t.time);
                  const timeStr = date.toTimeString().split(" ")[0];
                  const isBuy = !t.isBuyerMaker; // In Binance, buyerMaker: false means market buy (hit ask)
                  return (
                    <div
                      key={t.id}
                      onClick={() => onSelectPrice && onSelectPrice(t.price)}
                      className="grid grid-cols-3 text-[11px] py-0.5 px-1 rounded hover:bg-[#121926] cursor-pointer"
                    >
                      <span className="text-slate-500 text-[10px]">{timeStr}</span>
                      <span
                        className={`text-right font-bold ${
                          isBuy ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {t.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-right text-slate-300">{t.qty.toFixed(3)}</span>
                    </div>
                  );
                })
              ) : (
                <div className="py-6 text-center text-slate-500 text-[11px]">
                  {isLoading ? "Streaming recent trades..." : "No trades found."}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="px-3 py-1.5 bg-[#090d13] border-t border-[#151c27] text-[10px] text-slate-500 flex items-center justify-between">
        <span>Click any price to load into Order Ticket</span>
        <span>{symbol}</span>
      </div>
    </div>
  );
};
