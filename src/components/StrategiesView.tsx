import React, { useState } from "react";
import {
  Cpu,
  BarChart2,
  Play,
  CheckCircle2,
  AlertCircle,
  Plus,
  Sliders,
  TrendingUp,
  Layers,
  Sparkles,
} from "lucide-react";
import { BacktestRequest, BacktestResult, StrategyRule, Timeframe } from "../types";
import { runStrategyBacktest } from "../services/strategyEngine";

interface StrategiesViewProps {
  strategies: StrategyRule[];
  onToggleStrategy: (id: string) => void;
  onAddCustomStrategy: (strategy: StrategyRule) => void;
  availableAssets: string[];
}

export const StrategiesView: React.FC<StrategiesViewProps> = ({
  strategies,
  onToggleStrategy,
  onAddCustomStrategy,
  availableAssets,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"LAB" | "BACKTEST">("LAB");

  // Backtest form state
  const [selectedAsset, setSelectedAsset] = useState<string>("BTCUSDT");
  const [selectedStrategyId, setSelectedStrategyId] = useState<string>(
    strategies[0]?.id || "strat_adaptive_trend"
  );
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>("1H");
  const [dateRangeDays, setDateRangeDays] = useState<number>(90);
  const [initialCapital, setInitialCapital] = useState<number>(25000);
  const [riskPerTrade, setRiskPerTrade] = useState<number>(0.5);

  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(() => {
    return runStrategyBacktest({
      asset: "BTCUSDT",
      strategyId: "strat_adaptive_trend",
      timeframe: "1H",
      dateRangeDays: 90,
      initialCapital: 25000,
      riskPerTrade: 0.5,
    });
  });

  const handleRunBacktest = () => {
    const res = runStrategyBacktest({
      asset: selectedAsset,
      strategyId: selectedStrategyId,
      timeframe: selectedTimeframe,
      dateRangeDays,
      initialCapital,
      riskPerTrade,
    });
    setBacktestResult(res);
  };

  return (
    <div id="strategies-view" className="bg-[#0b0f16] border border-[#1c2432] rounded flex flex-col h-full font-mono select-none overflow-auto">
      {/* Sub-navigation */}
      <div className="p-3 border-b border-[#1a2331] flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="bg-[#121824] p-0.5 rounded border border-[#1e293a] flex items-center text-xs">
            <button
              onClick={() => setActiveSubTab("LAB")}
              className={`px-3 py-1 rounded transition-colors flex items-center space-x-1.5 ${
                activeSubTab === "LAB"
                  ? "bg-[#1f2b3c] text-slate-100 font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              <span>Strategy Lab ({strategies.length})</span>
            </button>
            <button
              onClick={() => setActiveSubTab("BACKTEST")}
              className={`px-3 py-1 rounded transition-colors flex items-center space-x-1.5 ${
                activeSubTab === "BACKTEST"
                  ? "bg-[#1f2b3c] text-slate-100 font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5 text-blue-400" />
              <span>Quantitative Backtester</span>
            </button>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 hidden sm:block">
          All strategies are OFF by default. Requires explicit user authorization.
        </div>
      </div>

      {/* Content Area */}
      <div className="p-3.5 flex-1">
        {activeSubTab === "LAB" ? (
          /* Strategy Lab */
          <div className="space-y-3.5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {strategies.map((strat) => (
                <div
                  key={strat.id}
                  id={`strategy-card-${strat.id}`}
                  className={`bg-[#0e141f] border rounded p-3.5 flex flex-col justify-between space-y-3 transition-colors ${
                    strat.isActive
                      ? "border-emerald-500/50 shadow-sm"
                      : "border-[#1c2635]"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-slate-100">
                          {strat.name}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#162130] text-slate-400 border border-[#223043]">
                          {strat.type}
                        </span>
                      </div>

                      {/* Active Toggle Switch */}
                      <button
                        onClick={() => onToggleStrategy(strat.id)}
                        className={`px-2.5 py-1 rounded text-[11px] font-bold border transition-colors flex items-center space-x-1.5 ${
                          strat.isActive
                            ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/60"
                            : "bg-[#141b26] text-slate-500 border-[#202c3d] hover:text-slate-300"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            strat.isActive ? "bg-emerald-400 animate-pulse" : "bg-slate-600"
                          }`}
                        />
                        <span>{strat.isActive ? "ACTIVE" : "DISABLED"}</span>
                      </button>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed">
                      {strat.description}
                    </p>

                    {/* Conditions */}
                    <div className="bg-[#121926] p-2.5 rounded border border-[#1b2536] space-y-1.5 text-[11px]">
                      <div className="text-slate-300 font-semibold flex items-center space-x-1">
                        <span className="text-emerald-400 font-bold">ENTRY CRITERIA:</span>
                      </div>
                      {strat.entryConditions.map((cond, idx) => (
                        <div key={idx} className="text-slate-400 flex items-start space-x-1.5">
                          <span className="text-slate-600">•</span>
                          <span>{cond}</span>
                        </div>
                      ))}

                      <div className="pt-1 text-slate-300 font-semibold flex items-center space-x-1">
                        <span className="text-amber-400 font-bold">EXIT & INVALIDATION:</span>
                      </div>
                      <div className="text-slate-400">
                        Stop: {strat.stopLossRule} • Take Profit: {strat.takeProfitRule}
                      </div>
                    </div>
                  </div>

                  {/* Rules Footer */}
                  <div className="pt-2 border-t border-[#182230] flex items-center justify-between text-[11px] text-slate-400">
                    <div>
                      Risk: <span className="text-slate-200">{strat.risk}%</span> • Lev:{" "}
                      <span className="text-slate-200">{strat.leverage}x</span> • Max Pos:{" "}
                      <span className="text-slate-200">{strat.maxPositions}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-[10px] text-slate-500">
                      <span>TFs: {strat.timeframes.join(", ")}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Quantitative Backtester */
          <div className="space-y-4">
            {/* Backtest Configuration Form */}
            <div className="bg-[#0e141f] border border-[#1c2635] rounded p-3.5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 items-end text-xs">
              {/* Asset */}
              <div>
                <label className="block text-slate-400 text-[11px] mb-1">ASSET</label>
                <select
                  value={selectedAsset}
                  onChange={(e) => setSelectedAsset(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-[#121824] border border-[#1e293a] rounded text-slate-200 font-mono text-xs focus:outline-none"
                >
                  {availableAssets.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Strategy */}
              <div>
                <label className="block text-slate-400 text-[11px] mb-1">STRATEGY</label>
                <select
                  value={selectedStrategyId}
                  onChange={(e) => setSelectedStrategyId(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-[#121824] border border-[#1e293a] rounded text-slate-200 font-mono text-xs focus:outline-none"
                >
                  {strategies.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Timeframe */}
              <div>
                <label className="block text-slate-400 text-[11px] mb-1">TIMEFRAME</label>
                <select
                  value={selectedTimeframe}
                  onChange={(e) => setSelectedTimeframe(e.target.value as Timeframe)}
                  className="w-full px-2.5 py-1.5 bg-[#121824] border border-[#1e293a] rounded text-slate-200 font-mono text-xs focus:outline-none"
                >
                  <option value="15M">15M</option>
                  <option value="1H">1H</option>
                  <option value="4H">4H</option>
                  <option value="1D">1D</option>
                </select>
              </div>

              {/* Date Range Days */}
              <div>
                <label className="block text-slate-400 text-[11px] mb-1">LOOKBACK</label>
                <select
                  value={dateRangeDays}
                  onChange={(e) => setDateRangeDays(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-[#121824] border border-[#1e293a] rounded text-slate-200 font-mono text-xs focus:outline-none"
                >
                  <option value={30}>30 Days</option>
                  <option value={60}>60 Days</option>
                  <option value={90}>90 Days</option>
                  <option value={180}>180 Days</option>
                </select>
              </div>

              {/* Initial Capital */}
              <div>
                <label className="block text-slate-400 text-[11px] mb-1">CAPITAL ($)</label>
                <input
                  type="number"
                  value={initialCapital}
                  onChange={(e) => setInitialCapital(Number(e.target.value) || 1000)}
                  className="w-full px-2.5 py-1.5 bg-[#121824] border border-[#1e293a] rounded text-slate-200 font-mono text-xs focus:outline-none"
                />
              </div>

              {/* Run Button */}
              <div>
                <button
                  id="btn-run-backtest"
                  onClick={handleRunBacktest}
                  className="w-full py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>SIMULATE</span>
                </button>
              </div>
            </div>

            {/* Backtest Results Display */}
            {backtestResult && (
              <div className="space-y-4">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5">
                  <div className="bg-[#0e141f] p-3 rounded border border-[#1c2635]">
                    <span className="text-[10px] text-slate-400">TOTAL RETURN</span>
                    <div
                      className={`text-sm sm:text-base font-bold ${
                        backtestResult.totalReturn >= 0 ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {backtestResult.totalReturn >= 0 ? "+" : ""}
                      ${backtestResult.totalReturn.toLocaleString()} (
                      {backtestResult.totalReturnPercent}%)
                    </div>
                  </div>

                  <div className="bg-[#0e141f] p-3 rounded border border-[#1c2635]">
                    <span className="text-[10px] text-slate-400">WIN RATE</span>
                    <div className="text-sm sm:text-base font-bold text-slate-100">
                      {backtestResult.winRate}%
                    </div>
                    <span className="text-[10px] text-slate-500">
                      {backtestResult.winningTrades}W / {backtestResult.losingTrades}L
                    </span>
                  </div>

                  <div className="bg-[#0e141f] p-3 rounded border border-[#1c2635]">
                    <span className="text-[10px] text-slate-400">PROFIT FACTOR</span>
                    <div className="text-sm sm:text-base font-bold text-emerald-300">
                      {backtestResult.profitFactor.toFixed(2)}
                    </div>
                  </div>

                  <div className="bg-[#0e141f] p-3 rounded border border-[#1c2635]">
                    <span className="text-[10px] text-slate-400">MAX DRAWDOWN</span>
                    <div className="text-sm sm:text-base font-bold text-rose-400">
                      -{backtestResult.maxDrawdown}%
                    </div>
                  </div>

                  <div className="bg-[#0e141f] p-3 rounded border border-[#1c2635]">
                    <span className="text-[10px] text-slate-400">AVERAGE R</span>
                    <div className="text-sm sm:text-base font-bold text-slate-100">
                      +{backtestResult.averageR.toFixed(2)}R
                    </div>
                  </div>

                  <div className="bg-[#0e141f] p-3 rounded border border-[#1c2635]">
                    <span className="text-[10px] text-slate-400">TOTAL TRADES</span>
                    <div className="text-sm sm:text-base font-bold text-slate-100">
                      {backtestResult.totalTrades}
                    </div>
                  </div>

                  <div className="bg-[#0e141f] p-3 rounded border border-[#1c2635]">
                    <span className="text-[10px] text-slate-400">SHARPE RATIO</span>
                    <div className="text-sm sm:text-base font-bold text-blue-300">
                      {backtestResult.sharpeRatio.toFixed(2)}
                    </div>
                  </div>

                  <div className="bg-[#0e141f] p-3 rounded border border-[#1c2635]">
                    <span className="text-[10px] text-slate-400">LARGEST WIN</span>
                    <div className="text-sm sm:text-base font-bold text-emerald-400">
                      +${backtestResult.largestWin.toLocaleString()}
                    </div>
                  </div>

                  <div className="bg-[#0e141f] p-3 rounded border border-[#1c2635]">
                    <span className="text-[10px] text-slate-400">LARGEST LOSS</span>
                    <div className="text-sm sm:text-base font-bold text-rose-400">
                      -${backtestResult.largestLoss.toLocaleString()}
                    </div>
                  </div>

                  <div className="bg-[#0e141f] p-3 rounded border border-[#1c2635]">
                    <span className="text-[10px] text-slate-400">EXECUTION MODE</span>
                    <div className="text-sm sm:text-base font-bold text-slate-300">
                      Simulated 0.5%
                    </div>
                  </div>
                </div>

                {/* Interactive SVG Equity Curve */}
                <div className="bg-[#0e141f] border border-[#1c2635] rounded p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-semibold">
                      SIMULATED EQUITY CURVE (HISTORICAL PROGRESSION)
                    </span>
                    <span className="text-slate-500 text-[11px]">
                      {dateRangeDays} Days Window
                    </span>
                  </div>

                  <div className="h-52 w-full relative">
                    <svg className="w-full h-full" viewBox="0 0 800 200" preserveAspectRatio="none">
                      {/* Background grid */}
                      <line x1="0" y1="50" x2="800" y2="50" stroke="#182332" strokeDasharray="3 3" />
                      <line x1="0" y1="100" x2="800" y2="100" stroke="#182332" strokeDasharray="3 3" />
                      <line x1="0" y1="150" x2="800" y2="150" stroke="#182332" strokeDasharray="3 3" />

                      {/* Line & Area */}
                      {(() => {
                        const pts = backtestResult.equityCurve;
                        if (pts.length < 2) return null;
                        const minE = Math.min(...pts.map((p) => p.equity)) * 0.98;
                        const maxE = Math.max(...pts.map((p) => p.equity)) * 1.02;

                        const getX = (i: number) => (i / (pts.length - 1)) * 800;
                        const getY = (val: number) => 190 - ((val - minE) / (maxE - minE)) * 170;

                        const pathData = pts
                          .map((p, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getY(p.equity)}`)
                          .join(" ");

                        const areaData = `${pathData} L 800 200 L 0 200 Z`;

                        return (
                          <>
                            <defs>
                              <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                              </linearGradient>
                            </defs>
                            <path d={areaData} fill="url(#eqGrad)" />
                            <path
                              d={pathData}
                              fill="none"
                              stroke="#10b981"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                            />
                          </>
                        );
                      })()}
                    </svg>
                  </div>
                </div>

                {/* Formal Disclaimer */}
                <div className="bg-[#121824] border border-[#1e293a] rounded p-2.5 text-[11px] text-slate-400 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    <strong>Historical Simulation Notice:</strong> Backtest results reflect
                    algorithmic simulations executed against historical price models and slippage
                    buffers. Past performance does not guarantee future results.
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
