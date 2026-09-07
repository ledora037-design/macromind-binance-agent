import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Sparkles,
  Zap,
  Layers,
  Activity,
  AlertOctagon,
} from "lucide-react";
import {
  AssetMarketData,
  BinanceAccountInfo,
  OrderStatus,
  Position,
  RiskSettings,
  TradeDirection,
  TradeSetup,
  TradingMode,
} from "../types";
import { calculatePositionMetrics, validateTradeExecution } from "../services/riskEngine";
import { OrderBookPanel } from "./OrderBookPanel";

interface TradeViewProps {
  asset: AssetMarketData;
  tradingMode: TradingMode;
  riskSettings: RiskSettings;
  openPositions: Position[];
  activeSetup: TradeSetup | null;
  isLiveConnected?: boolean;
  binanceAccount?: BinanceAccountInfo | null;
  onExecuteTrade: (tradeParams: {
    asset: string;
    side: "LONG" | "SHORT";
    entryPrice: number;
    stopLoss: number;
    takeProfit: number;
    tp2: number;
    size: number;
    marginUsed: number;
    leverage: number;
    strategyName: string;
    mode: TradingMode;
  }) => Promise<{ success: boolean; message: string }>;
  onOpenWhyNot: () => void;
  onEmergencyStop?: () => void;
}

export const TradeView: React.FC<TradeViewProps> = ({
  asset,
  tradingMode,
  riskSettings,
  openPositions,
  activeSetup,
  isLiveConnected = false,
  binanceAccount,
  onExecuteTrade,
  onOpenWhyNot,
  onEmergencyStop,
}) => {
  const [side, setSide] = useState<"LONG" | "SHORT">(
    activeSetup?.direction === "SHORT" ? "SHORT" : "LONG"
  );
  const [entryPrice, setEntryPrice] = useState<number>(asset.price);
  const [stopLoss, setStopLoss] = useState<number>(
    side === "LONG" ? asset.price * 0.985 : asset.price * 1.015
  );
  const [tp1, setTp1] = useState<number>(
    side === "LONG" ? asset.price * 1.03 : asset.price * 0.97
  );
  const [tp2, setTp2] = useState<number>(
    side === "LONG" ? asset.price * 1.05 : asset.price * 0.95
  );
  const [leverage, setLeverage] = useState<number>(riskSettings.defaultLeverage);
  const [rightPanelTab, setRightPanelTab] = useState<"RISK" | "ORDERBOOK">("RISK");

  // Handle clicking price from Order Book or Tape
  const handleSelectPriceFromBook = (price: number) => {
    setEntryPrice(price);
    const isLong = side === "LONG";
    setStopLoss(isLong ? price * 0.985 : price * 1.015);
    setTp1(isLong ? price * 1.03 : price * 0.97);
    setTp2(isLong ? price * 1.05 : price * 0.95);
  };

  // Modal confirmation state
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [executionState, setExecutionState] = useState<{
    status: OrderStatus | "IDLE";
    message: string;
  }>({ status: "IDLE", message: "" });

  // Update prices when asset changes
  useEffect(() => {
    setEntryPrice(asset.price);
    if (activeSetup && activeSetup.asset === asset.symbol) {
      setSide(activeSetup.direction === "SHORT" ? "SHORT" : "LONG");
      setEntryPrice(asset.price);
      setStopLoss(activeSetup.stopLoss);
      setTp1(activeSetup.tp1);
      setTp2(activeSetup.tp2);
      setLeverage(activeSetup.leverageSuggestion || 2);
    } else {
      const isLong = side === "LONG";
      setStopLoss(isLong ? asset.price * 0.985 : asset.price * 1.015);
      setTp1(isLong ? asset.price * 1.03 : asset.price * 0.97);
      setTp2(isLong ? asset.price * 1.05 : asset.price * 0.95);
    }
  }, [asset.symbol, activeSetup]);

  // Handle Loading AI Setup
  const handleLoadAiSetup = () => {
    if (!activeSetup) return;
    setSide(activeSetup.direction === "SHORT" ? "SHORT" : "LONG");
    setEntryPrice(asset.price);
    setStopLoss(activeSetup.stopLoss);
    setTp1(activeSetup.tp1);
    setTp2(activeSetup.tp2);
    setLeverage(activeSetup.leverageSuggestion || 2);
  };

  // Real-time Risk Engine calculation
  const metrics = calculatePositionMetrics(
    riskSettings.accountEquity,
    riskSettings.riskPerTrade,
    entryPrice,
    stopLoss,
    tp1,
    tp2,
    leverage,
    riskSettings
  );

  // Pre-execution validation
  const validation = validateTradeExecution(
    riskSettings,
    openPositions,
    metrics.riskAmount
  );

  const handleInitiateOrder = () => {
    if (!validation.canExecute) {
      alert(validation.reason);
      return;
    }
    setExecutionState({ status: "PENDING", message: "Awaiting user authorization..." });
    setShowConfirmModal(true);
  };

  const handleConfirmExecution = async () => {
    setExecutionState({
      status: "SUBMITTED",
      message: `Transmitting ${tradingMode} order to execution engine...`,
    });

    try {
      const res = await onExecuteTrade({
        asset: asset.symbol,
        side,
        entryPrice,
        stopLoss,
        takeProfit: tp1,
        tp2,
        size: metrics.positionSizeUnits,
        marginUsed: metrics.marginRequired,
        leverage,
        strategyName: activeSetup ? activeSetup.setupType : "Manual Discretionary",
        mode: tradingMode,
      });

      if (res.success) {
        setExecutionState({
          status: "FILLED",
          message: res.message || "Order filled successfully.",
        });
        setTimeout(() => {
          setShowConfirmModal(false);
          setExecutionState({ status: "IDLE", message: "" });
        }, 1200);
      } else {
        setExecutionState({
          status: "FAILED",
          message: res.message || "Execution rejected by risk engine.",
        });
      }
    } catch (err: any) {
      setExecutionState({
        status: "FAILED",
        message: err.message || "Order transmission failure.",
      });
    }
  };

  return (
    <div id="trade-execution-view" className="grid grid-cols-1 lg:grid-cols-12 gap-3 h-full select-none">
      {/* Left / Main: Order Ticket & Setup Details (7 cols) */}
      <div className="lg:col-span-7 bg-[#0b0f16] border border-[#1c2432] rounded flex flex-col p-3.5 font-mono space-y-3.5">
        {/* Ticket Header */}
        <div className="flex items-center justify-between border-b border-[#192230] pb-2.5">
          <div className="flex items-center space-x-2.5">
            <span className="font-bold text-slate-100 text-sm sm:text-base">
              {asset.symbol} ORDER TICKET
            </span>
            <span
              className={`text-[11px] px-2 py-0.5 rounded font-bold border ${
                tradingMode === "PAPER"
                  ? "bg-slate-800 text-slate-300 border-slate-700"
                  : tradingMode === "MANUAL"
                  ? "bg-emerald-950/60 text-emerald-300 border-emerald-500/50"
                  : "bg-amber-950/60 text-amber-300 border-amber-500/50"
              }`}
            >
              {tradingMode} MODE
            </span>

            {/* Execution routing badge */}
            {tradingMode !== "PAPER" && (
              binanceAccount?.status === "CONNECTED" ? (
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 font-bold hidden sm:inline-flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>BINANCE LIVE ({binanceAccount.maskedApiKey})</span>
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950/70 border border-amber-500/40 text-amber-300 font-bold hidden sm:inline-flex">
                  PAPER FALLBACK (CONNECT API IN SETTINGS)
                </span>
              )
            )}
          </div>

          <div className="flex items-center space-x-3">
            {onEmergencyStop && (
              <button
                onClick={onEmergencyStop}
                className="px-2 py-0.5 rounded bg-rose-950/60 hover:bg-rose-900 border border-rose-600/50 text-rose-300 text-[10px] font-bold transition-colors flex items-center space-x-1"
                title="Emergency Halt: cancel all open orders and freeze executions"
              >
                <AlertOctagon className="w-3 h-3 text-rose-400" />
                <span className="hidden sm:inline">EMERGENCY STOP</span>
              </button>
            )}

            <div className="text-right">
              <div className="text-xs font-semibold text-slate-100">
                ${asset.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div
                className={`text-[10px] ${
                  asset.change24h >= 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {asset.change24h >= 0 ? "+" : ""}
                {asset.change24h.toFixed(2)}%
              </div>
            </div>
          </div>
        </div>

        {/* AI Setup Notification or Why-Not banner */}
        {activeSetup && activeSetup.asset === asset.symbol ? (
          <div className="bg-emerald-950/20 border border-emerald-500/30 rounded p-2.5 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="font-bold text-emerald-300">
                  MacroMind {activeSetup.direction} Setup Active (Score: {activeSetup.score}/100)
                </span>
                <p className="text-[11px] text-slate-400">
                  {activeSetup.setupType} • Invalidation at ${activeSetup.stopLoss.toLocaleString()}
                </p>
              </div>
            </div>
            <button
              onClick={handleLoadAiSetup}
              className="px-2.5 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-bold transition-colors"
            >
              AUTOLOAD SETUP
            </button>
          </div>
        ) : (
          <div className="bg-[#121824] border border-[#1e293a] rounded p-2.5 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <HelpCircle className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-slate-300">
                No active confluence setup on {asset.symbol}. (Score: {asset.scoreBreakdown.total}/100)
              </span>
            </div>
            <button
              onClick={onOpenWhyNot}
              className="px-2.5 py-1 rounded bg-[#182333] hover:bg-[#202d42] text-slate-300 text-xs transition-colors"
            >
              WHY NOT TRADE?
            </button>
          </div>
        )}

        {/* Side Selector: LONG vs SHORT */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setSide("LONG")}
            className={`py-2 rounded font-bold text-xs flex items-center justify-center space-x-1.5 transition-all ${
              side === "LONG"
                ? "bg-emerald-600 text-white shadow"
                : "bg-[#111722] text-slate-400 hover:text-slate-200 border border-[#1e2838]"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>BUY / LONG</span>
          </button>
          <button
            onClick={() => setSide("SHORT")}
            className={`py-2 rounded font-bold text-xs flex items-center justify-center space-x-1.5 transition-all ${
              side === "SHORT"
                ? "bg-rose-600 text-white shadow"
                : "bg-[#111722] text-slate-400 hover:text-slate-200 border border-[#1e2838]"
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5" />
            <span>SELL / SHORT</span>
          </button>
        </div>

        {/* Price Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Entry Price */}
          <div>
            <label className="block text-slate-400 text-[11px] mb-1">
              ENTRY PRICE ($)
            </label>
            <input
              type="number"
              step="any"
              value={entryPrice}
              onChange={(e) => setEntryPrice(parseFloat(e.target.value) || 0)}
              className="w-full px-2.5 py-1.5 bg-[#121824] border border-[#1e293a] rounded text-slate-100 font-mono text-xs focus:outline-none focus:border-slate-400"
            />
          </div>

          {/* Stop Loss */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-slate-400 text-[11px]">
                STOP LOSS / INVALIDATION ($)
              </label>
              <span className="text-rose-400 text-[10px]">
                -{metrics.stopDistancePercent.toFixed(2)}%
              </span>
            </div>
            <input
              type="number"
              step="any"
              value={stopLoss}
              onChange={(e) => setStopLoss(parseFloat(e.target.value) || 0)}
              className="w-full px-2.5 py-1.5 bg-[#121824] border border-[#1e293a] rounded text-rose-300 font-mono text-xs focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* TP1 */}
          <div>
            <label className="block text-slate-400 text-[11px] mb-1">
              TAKE PROFIT 1 ($)
            </label>
            <input
              type="number"
              step="any"
              value={tp1}
              onChange={(e) => setTp1(parseFloat(e.target.value) || 0)}
              className="w-full px-2.5 py-1.5 bg-[#121824] border border-[#1e293a] rounded text-emerald-300 font-mono text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* TP2 */}
          <div>
            <label className="block text-slate-400 text-[11px] mb-1">
              TAKE PROFIT 2 ($)
            </label>
            <input
              type="number"
              step="any"
              value={tp2}
              onChange={(e) => setTp2(parseFloat(e.target.value) || 0)}
              className="w-full px-2.5 py-1.5 bg-[#121824] border border-[#1e293a] rounded text-emerald-400 font-mono text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Leverage Slider */}
        <div className="bg-[#121824] p-2.5 rounded border border-[#1e293a] space-y-1.5">
          <div className="flex justify-between text-xs text-slate-300">
            <span>Execution Leverage</span>
            <span className="font-bold text-amber-400">{leverage}x</span>
          </div>
          <input
            type="range"
            min={1}
            max={riskSettings.maxLeverage}
            value={leverage}
            onChange={(e) => setLeverage(parseInt(e.target.value))}
            className="w-full h-1.5 bg-[#1c2738] rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>1x (Spot)</span>
            <span>2x (Standard)</span>
            <span>{riskSettings.maxLeverage}x (Max Cap)</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            id="btn-place-order"
            onClick={handleInitiateOrder}
            disabled={!validation.canExecute}
            className={`w-full py-2.5 rounded font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow ${
              !validation.canExecute
                ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                : side === "LONG"
                ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                : "bg-rose-600 hover:bg-rose-500 text-white"
            }`}
          >
            <span>
              {tradingMode === "PAPER" ? "EXECUTE PAPER" : "EXECUTE MANUAL"}{" "}
              {side} ON {asset.symbol}
            </span>
          </button>
        </div>
      </div>

      {/* Right: Institutional Risk Engine Output & Live Binance Depth (5 cols) */}
      <div className="lg:col-span-5 bg-[#0b0f16] border border-[#1c2432] rounded flex flex-col p-3 font-mono space-y-3">
        {/* Right Panel Subtabs */}
        <div className="flex items-center justify-between border-b border-[#192230] pb-2">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setRightPanelTab("RISK")}
              className={`px-2.5 py-1 rounded text-xs font-bold flex items-center space-x-1.5 transition-colors ${
                rightPanelTab === "RISK"
                  ? "bg-[#162130] text-emerald-300 border border-emerald-500/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>RISK ENGINE</span>
            </button>
            <button
              onClick={() => setRightPanelTab("ORDERBOOK")}
              className={`px-2.5 py-1 rounded text-xs font-bold flex items-center space-x-1.5 transition-colors ${
                rightPanelTab === "ORDERBOOK"
                  ? "bg-[#162130] text-emerald-300 border border-emerald-500/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              <span>ORDER BOOK & TAPE</span>
            </button>
          </div>

          <span className="text-[10px] text-slate-400">
            {rightPanelTab === "RISK" ? "Sizing Protocol" : "Binance Public"}
          </span>
        </div>

        {rightPanelTab === "ORDERBOOK" ? (
          <div className="flex-1 min-h-[440px]">
            <OrderBookPanel
              symbol={asset.symbol}
              onSelectPrice={handleSelectPriceFromBook}
            />
          </div>
        ) : (
          <div className="flex flex-col space-y-3">
            {/* Sizing Breakdown Table */}
            <div className="bg-[#101622] rounded border border-[#1b2535] p-3 divide-y divide-[#17212e] text-xs">
              <div className="py-1.5 flex justify-between">
                <span className="text-slate-400">Account Risk (% / $):</span>
                <span className="text-slate-100 font-bold">
                  {riskSettings.riskPerTrade}% / ${metrics.riskAmount.toFixed(2)}
                </span>
              </div>

              <div className="py-1.5 flex justify-between">
                <span className="text-slate-400">Position Size:</span>
                <span className="text-emerald-400 font-bold">
                  {metrics.positionSizeUnits.toFixed(4)} {asset.symbol.replace("USDT", "")}
                </span>
              </div>

              <div className="py-1.5 flex justify-between">
                <span className="text-slate-400">Notional Value:</span>
                <span className="text-slate-200">
                  ${Math.round(metrics.notionalValue).toLocaleString()}
                </span>
              </div>

              <div className="py-1.5 flex justify-between">
                <span className="text-slate-400">Margin Required ({leverage}x):</span>
                <span className="text-slate-200">
                  ${Math.round(metrics.marginRequired).toLocaleString()}
                </span>
              </div>

              <div className="py-1.5 flex justify-between">
                <span className="text-slate-400">Estimated Loss at Stop:</span>
                <span className="text-rose-400 font-bold">
                  -${metrics.estimatedLossAtStop.toFixed(2)}
                </span>
              </div>

              <div className="py-1.5 flex justify-between">
                <span className="text-slate-400">Estimated Gain (TP1 / TP2):</span>
                <span className="text-emerald-400 font-bold">
                  +${metrics.estimatedGainTP1.toFixed(1)} / +${metrics.estimatedGainTP2.toFixed(1)}
                </span>
              </div>

              <div className="py-1.5 flex justify-between">
                <span className="text-slate-400">Risk / Reward (R:R):</span>
                <span
                  className={`font-bold ${
                    metrics.riskReward >= riskSettings.minRiskReward
                      ? "text-emerald-400"
                      : "text-amber-400"
                  }`}
                >
                  1 : {metrics.riskReward.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Protection Limits Status */}
            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between text-slate-400">
                <span>Simultaneous Positions:</span>
                <span className="text-slate-200">
                  {openPositions.length} / {riskSettings.maxSimultaneousPositions} max
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-400">
                <span>Cumulative Daily Drawdown:</span>
                <span
                  className={
                    riskSettings.dailyLossCurrent > 1.0 ? "text-amber-400" : "text-slate-200"
                  }
                >
                  {riskSettings.dailyLossCurrent.toFixed(2)}% / {riskSettings.maxDailyLoss}% max
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-400">
                <span>Portfolio Exposure Cap:</span>
                <span className="text-slate-200">{riskSettings.maxPortfolioExposure}%</span>
              </div>
            </div>

            {/* Warnings or Policy Enforcement */}
            {metrics.warnings.length > 0 && (
              <div className="bg-amber-950/30 border border-amber-500/40 rounded p-2.5 text-[11px] text-amber-300 space-y-1">
                <div className="flex items-center space-x-1 font-bold">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Risk Policy Advisory</span>
                </div>
                {metrics.warnings.map((w, i) => (
                  <p key={i}>• {w}</p>
                ))}
              </div>
            )}

            <div className="p-2 bg-[#0d121b] rounded border border-[#16202c] text-[10px] text-slate-400">
              <p>
                Strict Policy: Position sizes are mathematically derived from stop distance. Size is
                never increased based on subjective confidence.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div
          id="order-confirmation-modal"
          className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-mono select-none"
        >
          <div className="bg-[#0e141f] border border-[#233145] rounded-lg max-w-md w-full p-4 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1c2738] pb-3">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-emerald-400" />
                <span className="font-bold text-sm text-slate-100 uppercase">
                  Verify & Confirm Order
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                {tradingMode} MODE
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="bg-[#121926] p-3 rounded border border-[#1d293b] space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Asset & Direction:</span>
                  <span
                    className={`font-bold ${
                      side === "LONG" ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {side} {asset.symbol}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Entry Price:</span>
                  <span className="text-slate-200">${entryPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Stop Loss:</span>
                  <span className="text-rose-400">${stopLoss.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Take Profit 1 / 2:</span>
                  <span className="text-emerald-400">
                    ${tp1.toLocaleString()} / ${tp2.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Calculated Size:</span>
                  <span className="text-slate-100 font-bold">
                    {metrics.positionSizeUnits.toFixed(4)} {asset.symbol.replace("USDT", "")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Risk Amount (0.5%):</span>
                  <span className="text-slate-100">${metrics.riskAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Estimated Exchange Fees:</span>
                  <span className="text-slate-400">
                    ~${(metrics.notionalValue * 0.0004).toFixed(2)} (0.04% taker)
                  </span>
                </div>
              </div>

              {/* Status Tracker */}
              {executionState.status !== "IDLE" && (
                <div
                  className={`p-2.5 rounded border text-xs flex items-center space-x-2 ${
                    executionState.status === "FILLED"
                      ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-300"
                      : executionState.status === "FAILED"
                      ? "bg-rose-950/40 border-rose-500/50 text-rose-300"
                      : "bg-blue-950/40 border-blue-500/50 text-blue-300"
                  }`}
                >
                  {executionState.status === "FILLED" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : executionState.status === "FAILED" ? (
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  ) : (
                    <Clock className="w-4 h-4 text-blue-400 animate-spin shrink-0" />
                  )}
                  <div>
                    <span className="font-bold">STATUS: {executionState.status}</span>
                    <p className="text-[11px] opacity-80">{executionState.message}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <button
                disabled={executionState.status === "SUBMITTED"}
                onClick={() => {
                  setShowConfirmModal(false);
                  setExecutionState({ status: "IDLE", message: "" });
                }}
                className="flex-1 py-2 rounded bg-[#16202e] hover:bg-[#1f2b3e] text-slate-300 text-xs font-bold border border-[#233145]"
              >
                CANCEL
              </button>
              <button
                id="btn-confirm-order-execution"
                disabled={executionState.status === "SUBMITTED"}
                onClick={handleConfirmExecution}
                className="flex-1 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow"
              >
                CONFIRM & PLACE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
