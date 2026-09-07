import React from "react";
import {
  Zap,
  TrendingUp,
  TrendingDown,
  AlertOctagon,
  ArrowRight,
  ShieldAlert,
  HelpCircle,
  Clock,
  Sparkles,
} from "lucide-react";
import { TradeSetup } from "../types";

interface TopSetupsListProps {
  setups: TradeSetup[];
  onTradeSetup: (setup: TradeSetup) => void;
  onOpenWhyNot: (assetSymbol: string) => void;
}

export const TopSetupsList: React.FC<TopSetupsListProps> = ({
  setups,
  onTradeSetup,
  onOpenWhyNot,
}) => {
  if (setups.length === 0) {
    return (
      <div
        id="no-setups-card"
        className="bg-[#0e141f] border border-[#1e2838] rounded p-4.5 font-mono select-none space-y-3"
      >
        <div className="flex items-center space-x-2 border-b border-[#182332] pb-2.5">
          <AlertOctagon className="w-4 h-4 text-slate-400" />
          <span className="font-bold text-xs text-slate-200 uppercase tracking-wider">
            Top Confluence Setups: NO QUALIFIED SETUPS
          </span>
        </div>

        <div className="bg-[#121927] p-3.5 rounded border border-[#1c2738] space-y-2 text-xs">
          <div className="flex items-center space-x-2 text-amber-300 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>MacroMind Discipline Principle: "NO TRADE" is an active position.</span>
          </div>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            The quantitative engine has evaluated the universe against all 6 pillars (Trend,
            Momentum, Volume, Derivatives, Structure, Risk). Current conditions do not present an
            institutional risk/reward asymmetry &gt; 2.0R with clean invalidation.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px] text-slate-400">
            <div>• Conflicting 4H vs 15M indicator momentum</div>
            <div>• Elevated retail funding rate compression</div>
            <div>• Choppy liquidity sweeps without volume expansion</div>
            <div>• Unfavorable stop distance (&gt; 2.2% ATR)</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="top-setups-container" className="space-y-2.5 font-mono select-none">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Zap className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-xs text-slate-100 uppercase tracking-wider">
            Top Confluence Setups ({setups.length})
          </span>
        </div>
        <span className="text-[10px] text-slate-500">
          Ranked by multi-factor score (Threshold &ge; 80)
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {setups.map((setup) => {
          const isLong = setup.direction === "LONG";
          return (
            <div
              key={setup.id}
              id={`setup-card-${setup.id}`}
              className="bg-[#0e141f] border border-[#1e2a3c] hover:border-emerald-500/40 rounded p-3.5 flex flex-col justify-between space-y-3 transition-colors shadow-sm"
            >
              <div className="space-y-2.5">
                {/* Header: Asset + Direction + Score */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm text-slate-100">{setup.asset}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border flex items-center space-x-1 ${
                        isLong
                          ? "text-emerald-400 bg-emerald-950/40 border-emerald-500/40"
                          : "text-rose-400 bg-rose-950/40 border-rose-500/40"
                      }`}
                    >
                      {isLong ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      <span>{setup.direction}</span>
                    </span>
                  </div>

                  <div className="flex items-center space-x-1">
                    <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-500/40">
                      {setup.score}/100
                    </span>
                  </div>
                </div>

                {/* Setup Type */}
                <div className="text-[11px] text-slate-400">
                  <span className="text-slate-500">Type:</span>{" "}
                  <span className="text-slate-200 font-medium">{setup.setupType}</span>
                </div>

                {/* Price Levels Grid */}
                <div className="bg-[#121926] p-2.5 rounded border border-[#1b2536] grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-500 block text-[10px]">ENTRY ZONE</span>
                    <span className="text-slate-200 font-medium">
                      ${setup.entryZone[0].toLocaleString()} - ${setup.entryZone[1].toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">STOP LOSS</span>
                    <span className="text-rose-400 font-medium">
                      ${setup.stopLoss.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">TAKE PROFIT 1</span>
                    <span className="text-emerald-400 font-medium">
                      ${setup.tp1.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">TAKE PROFIT 2 (RUNNER)</span>
                    <span className="text-emerald-400 font-medium">
                      ${setup.tp2.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Why it works & Risks */}
                <div className="space-y-1 text-[11px]">
                  <p className="text-slate-300">
                    <strong className="text-emerald-400">Why:</strong> {setup.whyItWorks}
                  </p>
                  <p className="text-slate-400">
                    <strong className="text-amber-400">Risk:</strong> {setup.keyRisks}
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2 border-t border-[#182230] flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-medium">
                  R:R: <strong className="text-emerald-300">1 : {setup.riskReward.toFixed(1)}</strong>
                </span>

                <button
                  id={`btn-trade-setup-${setup.id}`}
                  onClick={() => onTradeSetup(setup)}
                  className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow"
                >
                  <span>TRADE NOW</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
