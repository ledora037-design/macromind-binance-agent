import React, { useState } from "react";
import {
  Star,
  Plus,
  Trash2,
  ShieldCheck,
  AlertOctagon,
  Search,
  Filter,
  HelpCircle,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Info,
} from "lucide-react";
import { AssetMarketData, ScoreClassification, TradeDirection } from "../types";

interface ScannerViewProps {
  assets: AssetMarketData[];
  onSelectAsset: (symbol: string) => void;
  selectedAsset: string;
  onOpenTrade: (symbol: string) => void;
  onWhyNot: (asset: AssetMarketData) => void;
  onToggleFavorite: (symbol: string) => void;
  onAddAsset: (symbol: string) => void;
  onRemoveAsset: (symbol: string) => void;
}

export const ScannerView: React.FC<ScannerViewProps> = ({
  assets,
  onSelectAsset,
  selectedAsset,
  onOpenTrade,
  onWhyNot,
  onToggleFavorite,
  onAddAsset,
  onRemoveAsset,
}) => {
  const [filterSignal, setFilterSignal] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"ALL" | "FAVORITES">("ALL");
  const [newSymbolInput, setNewSymbolInput] = useState<string>("");

  // Filter and sort assets by score descending
  const filteredAssets = assets
    .filter((a) => {
      if (activeTab === "FAVORITES" && !a.isFavorite) return false;
      if (searchQuery && !a.symbol.toLowerCase().includes(searchQuery.toLowerCase()) && !a.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (filterSignal === "LONGS") return a.signal === "LONG";
      if (filterSignal === "SHORTS") return a.signal === "SHORT";
      if (filterSignal === "WATCH") return a.signal === "WATCH";
      if (filterSignal === "NO_TRADE") return a.signal === "NO_TRADE";
      return true;
    })
    .sort((a, b) => b.scoreBreakdown.total - a.scoreBreakdown.total);

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-emerald-400 bg-emerald-950/40 border-emerald-500/40";
    if (score >= 80) return "text-emerald-300 bg-emerald-950/30 border-emerald-500/30";
    if (score >= 70) return "text-blue-300 bg-blue-950/30 border-blue-500/30";
    if (score >= 60) return "text-amber-300 bg-amber-950/30 border-amber-500/30";
    return "text-slate-400 bg-slate-900/40 border-slate-700/40";
  };

  const getSignalBadge = (signal: TradeDirection) => {
    switch (signal) {
      case "LONG":
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/50 flex items-center space-x-1">
            <TrendingUp className="w-3 h-3" />
            <span>LONG</span>
          </span>
        );
      case "SHORT":
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold text-rose-400 bg-rose-950/60 border border-rose-500/50 flex items-center space-x-1">
            <TrendingDown className="w-3 h-3" />
            <span>SHORT</span>
          </span>
        );
      case "WATCH":
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono text-blue-300 bg-blue-950/40 border border-blue-500/40">
            WATCH
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono text-slate-400 bg-slate-900/60 border border-slate-800 flex items-center space-x-1">
            <AlertOctagon className="w-3 h-3 text-slate-500" />
            <span>NO TRADE</span>
          </span>
        );
    }
  };

  const handleAddCustomAsset = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newSymbolInput.trim().toUpperCase();
    if (!clean) return;
    const finalSymbol = clean.endsWith("USDT") ? clean : `${clean}USDT`;
    onAddAsset(finalSymbol);
    setNewSymbolInput("");
  };

  return (
    <div id="ai-scanner-view" className="bg-[#0b0f16] border border-[#1c2432] rounded flex flex-col h-full select-none">
      {/* Scanner Toolbar */}
      <div className="p-3 border-b border-[#1a2331] flex flex-col md:flex-row md:items-center justify-between gap-3 font-mono">
        <div className="flex items-center space-x-2">
          {/* Tabs: All / Favorites */}
          <div className="bg-[#121824] p-0.5 rounded border border-[#1e293a] flex items-center text-xs">
            <button
              onClick={() => setActiveTab("ALL")}
              className={`px-2.5 py-1 rounded transition-colors ${
                activeTab === "ALL"
                  ? "bg-[#1f2b3c] text-slate-100 font-medium"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              All Assets ({assets.length})
            </button>
            <button
              onClick={() => setActiveTab("FAVORITES")}
              className={`px-2.5 py-1 rounded transition-colors flex items-center space-x-1 ${
                activeTab === "FAVORITES"
                  ? "bg-[#1f2b3c] text-amber-300 font-medium"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span>Favorites</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
            <input
              type="text"
              placeholder="Filter ticker..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-2 py-1 bg-[#121824] border border-[#1e293a] rounded text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-400 w-32 sm:w-44"
            />
          </div>
        </div>

        {/* Signal Filters + Add Asset */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 text-xs">
            {(["ALL", "LONGS", "SHORTS", "WATCH", "NO_TRADE"] as const).map((sig) => (
              <button
                key={sig}
                onClick={() => setFilterSignal(sig)}
                className={`px-2 py-1 rounded text-[10px] font-mono border transition-colors ${
                  filterSignal === sig
                    ? "bg-[#1e2a3c] text-emerald-400 border-[#2d3e57]"
                    : "bg-[#101520] text-slate-400 border-[#1a2332] hover:text-slate-200"
                }`}
              >
                {sig.replace("_", " ")}
              </button>
            ))}
          </div>

          {/* Add custom asset form */}
          <form onSubmit={handleAddCustomAsset} className="flex items-center space-x-1">
            <input
              type="text"
              placeholder="+ Symbol"
              value={newSymbolInput}
              onChange={(e) => setNewSymbolInput(e.target.value)}
              className="px-2 py-1 bg-[#121824] border border-[#1e293a] rounded text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-400 w-24 uppercase"
            />
            <button
              type="submit"
              className="p-1 rounded bg-[#162130] border border-[#233145] text-slate-300 hover:text-white"
              title="Add asset to scanner"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>

      {/* Main Ranking Table */}
      <div className="flex-1 overflow-auto scrollbar-none font-mono">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#0e131d] text-slate-400 border-b border-[#1a2331] text-[11px] sticky top-0 z-10">
              <th className="py-2.5 px-3 font-normal">ASSET</th>
              <th className="py-2.5 px-3 font-normal text-right">PRICE / 24H</th>
              <th className="py-2.5 px-3 font-normal text-center">SCORE (100)</th>
              <th className="py-2.5 px-3 font-normal hidden lg:table-cell">CONFLUENCE BREAKDOWN</th>
              <th className="py-2.5 px-3 font-normal text-center">CLASS</th>
              <th className="py-2.5 px-3 font-normal text-center">SIGNAL</th>
              <th className="py-2.5 px-3 font-normal text-right">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#151d2a]">
            {filteredAssets.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500 text-xs font-mono">
                  No assets match current criteria.
                </td>
              </tr>
            ) : (
              filteredAssets.map((asset) => {
                const isSelected = selectedAsset === asset.symbol;
                const b = asset.scoreBreakdown;

                return (
                  <tr
                    key={asset.symbol}
                    id={`scanner-row-${asset.symbol}`}
                    onClick={() => onSelectAsset(asset.symbol)}
                    className={`hover:bg-[#131b26] cursor-pointer transition-colors ${
                      isSelected ? "bg-[#15202e] border-l-2 border-emerald-500" : ""
                    }`}
                  >
                    {/* Asset & Favorite */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite(asset.symbol);
                          }}
                          className="text-slate-600 hover:text-amber-400 transition-colors"
                        >
                          <Star
                            className={`w-3.5 h-3.5 ${
                              asset.isFavorite ? "text-amber-400 fill-amber-400" : ""
                            }`}
                          />
                        </button>
                        <div>
                          <div className="font-bold text-slate-100 flex items-center space-x-1.5">
                            <span>{asset.symbol}</span>
                          </div>
                          <span className="text-[10px] text-slate-400">{asset.name}</span>
                        </div>
                      </div>
                    </td>

                    {/* Price & 24h Change */}
                    <td className="py-2.5 px-3 text-right">
                      <div className="font-medium text-slate-200">
                        ${asset.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                      <div
                        className={`text-[11px] ${
                          asset.change24h >= 0 ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {asset.change24h >= 0 ? "+" : ""}
                        {asset.change24h.toFixed(2)}%
                      </div>
                    </td>

                    {/* Score */}
                    <td className="py-2.5 px-3 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span
                          className={`px-2 py-0.5 rounded font-bold text-xs border ${getScoreColor(
                            b.total
                          )}`}
                        >
                          {b.total}
                        </span>
                      </div>
                    </td>

                    {/* Breakdown Bar (Trend 25, Mom 15, Vol 15, Deriv 20, Struct 15, Risk 10) */}
                    <td className="py-2.5 px-3 hidden lg:table-cell">
                      <div className="w-56 space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>Tr:{b.trend}/25</span>
                          <span>Mo:{b.momentum}/15</span>
                          <span>Vo:{b.volume}/15</span>
                          <span>De:{b.derivatives}/20</span>
                          <span>St:{b.marketStructure}/15</span>
                        </div>
                        <div className="h-1.5 w-full bg-[#16202c] rounded-full overflow-hidden flex">
                          <div
                            style={{ width: `${(b.trend / 100) * 100}%` }}
                            className="bg-blue-500 h-full"
                            title={`Trend: ${b.trend}/25`}
                          />
                          <div
                            style={{ width: `${(b.momentum / 100) * 100}%` }}
                            className="bg-purple-500 h-full"
                            title={`Momentum: ${b.momentum}/15`}
                          />
                          <div
                            style={{ width: `${(b.volume / 100) * 100}%` }}
                            className="bg-amber-500 h-full"
                            title={`Volume: ${b.volume}/15`}
                          />
                          <div
                            style={{ width: `${(b.derivatives / 100) * 100}%` }}
                            className="bg-emerald-500 h-full"
                            title={`Derivatives: ${b.derivatives}/20`}
                          />
                          <div
                            style={{ width: `${(b.marketStructure / 100) * 100}%` }}
                            className="bg-cyan-500 h-full"
                            title={`Structure: ${b.marketStructure}/15`}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Classification */}
                    <td className="py-2.5 px-3 text-center">
                      <span className="text-[11px] text-slate-300 font-medium">
                        {asset.classification}
                      </span>
                    </td>

                    {/* Signal */}
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex justify-center">{getSignalBadge(asset.signal)}</div>
                    </td>

                    {/* Action buttons */}
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          id={`btn-why-not-${asset.symbol}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onWhyNot(asset);
                          }}
                          className="px-2 py-1 rounded bg-[#151e2b] border border-[#223044] text-slate-400 hover:text-slate-200 text-[11px] flex items-center space-x-1"
                          title="Audit why MacroMind is taking or withholding a trade"
                        >
                          <HelpCircle className="w-3 h-3 text-slate-400" />
                          <span>WHY NOT?</span>
                        </button>

                        <button
                          id={`btn-trade-${asset.symbol}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenTrade(asset.symbol);
                          }}
                          className="px-2.5 py-1 rounded bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/80 text-[11px] font-medium flex items-center space-x-1"
                        >
                          <span>TRADE</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="p-2.5 border-t border-[#1a2331] bg-[#0c1018] text-[11px] font-mono text-slate-400 flex items-center justify-between">
        <div className="flex items-center space-x-1.5">
          <Info className="w-3.5 h-3.5 text-slate-500" />
          <span>
            Scoring algorithm strictly penalizes conflicting higher timeframe indicators.
          </span>
        </div>
        <span className="text-slate-500">
          Ranked across 6 quantitative pillars
        </span>
      </div>
    </div>
  );
};
