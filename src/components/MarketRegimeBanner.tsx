import React from "react";
import {
  TrendingUp,
  TrendingDown,
  Gauge,
  Flame,
  Droplets,
  DollarSign,
  BarChart3,
  Search,
  Sparkles,
  Zap,
  HelpCircle,
  FolderOpen,
} from "lucide-react";
import { AssetMarketData, MarketRegimeType } from "../types";

interface MarketRegimeBannerProps {
  regime: MarketRegimeType;
  btcAsset?: AssetMarketData;
  ethAsset?: AssetMarketData;
  regimeData: {
    btcTrend: string;
    ethTrend: string;
    volatilityIndex: number;
    fearGreedIndex: number;
    totalMarketTrend: string;
    marketMomentum: string;
    marketLiquidity: string;
    fundingState: string;
    oiState: string;
  };
  onQuickAction: (action: "scan" | "best_setup" | "watchlist" | "positions" | "ask_ai") => void;
  bestSetupAsset?: string;
}

export const MarketRegimeBanner: React.FC<MarketRegimeBannerProps> = ({
  regime,
  btcAsset,
  ethAsset,
  regimeData,
  onQuickAction,
  bestSetupAsset,
}) => {
  const getRegimeBadge = () => {
    switch (regime) {
      case "STRONG BULL":
        return {
          label: "STRONG BULL",
          color: "text-emerald-400 bg-emerald-950/60 border-emerald-500/50",
          advice: "Aggressive Trend Continuation. Prioritize qualified long breakouts.",
        };
      case "BULL":
        return {
          label: "BULL",
          color: "text-emerald-300 bg-emerald-950/40 border-emerald-500/40",
          advice: "Selective Long Bias. Confirm 15M volume expansion before entry.",
        };
      case "BEAR":
        return {
          label: "BEAR",
          color: "text-rose-400 bg-rose-950/40 border-rose-500/40",
          advice: "Defensive / Short Bias. Enforce strict invalidation stops.",
        };
      case "STRONG BEAR":
        return {
          label: "STRONG BEAR",
          color: "text-rose-500 bg-rose-950/60 border-rose-500/60",
          advice: "Capital Preservation Priority. High probability of chop and liquidations.",
        };
      default:
        return {
          label: "NEUTRAL",
          color: "text-amber-400 bg-amber-950/40 border-amber-500/40",
          advice: "Range Consolidation. Trade only verified boundary mean-reversions or wait.",
        };
    }
  };

  const badge = getRegimeBadge();

  return (
    <div
      id="market-regime-banner"
      className="bg-[#0e131c] border-b border-[#1c2432] p-3 sm:p-4 select-none"
    >
      {/* Top row: Big Question Answered + Core Market Gauges */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
        {/* Market Stance Summary */}
        <div className="lg:col-span-4 flex flex-col justify-center space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-mono">
              Market Regime
            </span>
            <span
              className={`px-2 py-0.5 rounded text-xs font-mono font-bold tracking-wide border ${badge.color}`}
            >
              {badge.label}
            </span>
          </div>
          <p className="text-xs text-slate-300 font-mono line-clamp-1">
            {badge.advice}
          </p>
        </div>

        {/* Core Asset & Macro Stats */}
        <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono">
          {/* BTC */}
          <div className="bg-[#121824] px-2.5 py-1.5 rounded border border-[#1e2838] flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>BTC</span>
              <span
                className={`text-[11px] ${
                  (btcAsset?.change24h || 0) >= 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {(btcAsset?.change24h || 0) >= 0 ? "+" : ""}
                {(btcAsset?.change24h || 0).toFixed(2)}%
              </span>
            </div>
            <div className="text-xs sm:text-sm font-bold text-slate-100">
              ${btcAsset?.price ? btcAsset.price.toLocaleString() : "94,250"}
            </div>
          </div>

          {/* ETH */}
          <div className="bg-[#121824] px-2.5 py-1.5 rounded border border-[#1e2838] flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>ETH</span>
              <span
                className={`text-[11px] ${
                  (ethAsset?.change24h || 0) >= 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {(ethAsset?.change24h || 0) >= 0 ? "+" : ""}
                {(ethAsset?.change24h || 0).toFixed(2)}%
              </span>
            </div>
            <div className="text-xs sm:text-sm font-bold text-slate-100">
              ${ethAsset?.price ? ethAsset.price.toLocaleString() : "2,840"}
            </div>
          </div>

          {/* VOLATILITY (VIX) */}
          <div className="bg-[#121824] px-2.5 py-1.5 rounded border border-[#1e2838] flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>VOLATILITY</span>
              <span className="text-[10px] text-amber-400">INDEX</span>
            </div>
            <div className="text-xs sm:text-sm font-bold text-slate-100 flex items-center space-x-1">
              <Gauge className="w-3.5 h-3.5 text-slate-400" />
              <span>{regimeData.volatilityIndex.toFixed(1)}</span>
            </div>
          </div>

          {/* FEAR / GREED */}
          <div className="bg-[#121824] px-2.5 py-1.5 rounded border border-[#1e2838] flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>FEAR / GREED</span>
              <span
                className={`text-[10px] ${
                  regimeData.fearGreedIndex >= 60
                    ? "text-emerald-400"
                    : regimeData.fearGreedIndex <= 40
                    ? "text-rose-400"
                    : "text-amber-400"
                }`}
              >
                {regimeData.fearGreedIndex >= 60
                  ? "GREED"
                  : regimeData.fearGreedIndex <= 40
                  ? "FEAR"
                  : "NEUTRAL"}
              </span>
            </div>
            <div className="text-xs sm:text-sm font-bold text-slate-100 flex items-center space-x-1">
              <Flame
                className={`w-3.5 h-3.5 ${
                  regimeData.fearGreedIndex >= 60
                    ? "text-emerald-400"
                    : "text-amber-400"
                }`}
              />
              <span>{regimeData.fearGreedIndex} / 100</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom compact indicators + Quick Actions */}
      <div className="mt-2.5 pt-2.5 border-t border-[#19212d] flex flex-col md:flex-row items-start md:items-center justify-between gap-2.5">
        {/* Six Compact Indicator Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 w-full md:w-auto font-mono text-[11px]">
          <div className="flex items-center space-x-1.5 text-slate-400">
            <span className="text-slate-500">Trend:</span>
            <span className="text-slate-200 font-medium">
              {regimeData.totalMarketTrend}
            </span>
          </div>

          <div className="flex items-center space-x-1.5 text-slate-400">
            <span className="text-slate-500">Momentum:</span>
            <span className="text-slate-200 font-medium">
              {regimeData.marketMomentum}
            </span>
          </div>

          <div className="flex items-center space-x-1.5 text-slate-400">
            <span className="text-slate-500">Volatility:</span>
            <span className="text-amber-400 font-medium">Controlled</span>
          </div>

          <div className="flex items-center space-x-1.5 text-slate-400">
            <span className="text-slate-500">Liquidity:</span>
            <span className="text-emerald-400 font-medium">
              {regimeData.marketLiquidity}
            </span>
          </div>

          <div className="flex items-center space-x-1.5 text-slate-400">
            <span className="text-slate-500">Funding:</span>
            <span className="text-slate-200 font-medium">
              {regimeData.fundingState}
            </span>
          </div>

          <div className="flex items-center space-x-1.5 text-slate-400">
            <span className="text-slate-500">OI:</span>
            <span className="text-emerald-400 font-medium">
              {regimeData.oiState}
            </span>
          </div>
        </div>

        {/* Quick Actions Bar */}
        <div className="flex items-center flex-wrap gap-1.5 w-full md:w-auto justify-end font-mono">
          <button
            id="quick-action-scan"
            onClick={() => onQuickAction("scan")}
            className="px-2.5 py-1 rounded bg-[#161f2c] border border-[#232f42] text-slate-300 hover:text-slate-100 hover:bg-[#1d293b] text-xs flex items-center space-x-1 transition-colors"
            title="Scan universe and rank setups"
          >
            <Search className="w-3 h-3 text-slate-400" />
            <span>SCAN MARKET</span>
          </button>

          <button
            id="quick-action-best-setup"
            onClick={() => onQuickAction("best_setup")}
            className="px-2.5 py-1 rounded bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60 text-xs flex items-center space-x-1 transition-colors font-medium"
            title="Jump to highest scored setup"
          >
            <Zap className="w-3 h-3 text-emerald-400" />
            <span>BEST SETUP {bestSetupAsset ? `(${bestSetupAsset.replace("USDT","")})` : ""}</span>
          </button>

          <button
            id="quick-action-watchlist"
            onClick={() => onQuickAction("watchlist")}
            className="px-2.5 py-1 rounded bg-[#161f2c] border border-[#232f42] text-slate-300 hover:text-slate-100 hover:bg-[#1d293b] text-xs flex items-center space-x-1 transition-colors"
          >
            <BarChart3 className="w-3 h-3 text-slate-400" />
            <span>MY WATCHLIST</span>
          </button>

          <button
            id="quick-action-positions"
            onClick={() => onQuickAction("positions")}
            className="px-2.5 py-1 rounded bg-[#161f2c] border border-[#232f42] text-slate-300 hover:text-slate-100 hover:bg-[#1d293b] text-xs flex items-center space-x-1 transition-colors"
          >
            <FolderOpen className="w-3 h-3 text-slate-400" />
            <span>OPEN POSITIONS</span>
          </button>

          <button
            id="quick-action-ask-ai"
            onClick={() => onQuickAction("ask_ai")}
            className="px-2.5 py-1 rounded bg-[#182333] border border-[#2c3b52] text-slate-200 hover:text-white hover:bg-[#202d42] text-xs flex items-center space-x-1 transition-colors"
          >
            <Sparkles className="w-3 h-3 text-blue-400" />
            <span>ASK AI</span>
          </button>
        </div>
      </div>
    </div>
  );
};
