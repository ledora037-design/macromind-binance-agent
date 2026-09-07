import React from "react";
import {
  ShieldAlert,
  SlidersHorizontal,
  Activity,
  AlertTriangle,
  Radio,
  ShieldCheck,
  ZapOff,
} from "lucide-react";
import {
  BinanceAccountInfo,
  BinancePublicStatus,
  MarketRegimeType,
  TradingMode,
} from "../types";

interface TopBarProps {
  regime: MarketRegimeType;
  tradingMode: TradingMode;
  onSelectTradingMode: (mode: TradingMode) => void;
  equity: number;
  dailyPnl: number;
  isAutoTradingActive: boolean;
  onOpenSettings: () => void;
  onEmergencyStop: () => void;
  binancePublicStatus: BinancePublicStatus;
  binanceAccount: BinanceAccountInfo;
}

export const TopBar: React.FC<TopBarProps> = ({
  regime,
  tradingMode,
  onSelectTradingMode,
  equity,
  dailyPnl,
  isAutoTradingActive,
  onOpenSettings,
  onEmergencyStop,
  binancePublicStatus,
  binanceAccount,
}) => {
  const getRegimeColor = (r: MarketRegimeType) => {
    switch (r) {
      case "STRONG BULL":
        return "text-emerald-400 bg-emerald-950/40 border-emerald-500/40";
      case "BULL":
        return "text-emerald-300 bg-emerald-950/20 border-emerald-500/30";
      case "BEAR":
        return "text-rose-400 bg-rose-950/20 border-rose-500/30";
      case "STRONG BEAR":
        return "text-rose-500 bg-rose-950/40 border-rose-500/50";
      default:
        return "text-amber-400 bg-amber-950/20 border-amber-500/30";
    }
  };

  const isConnected = binanceAccount?.status === "CONNECTED";
  const isError = binanceAccount?.status === "ERROR";

  return (
    <header
      id="terminal-topbar"
      className="h-14 bg-[#0c1017] border-b border-[#1c2432] px-3 md:px-5 flex items-center justify-between select-none z-30 sticky top-0"
    >
      {/* Brand and Market Status */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded bg-[#16202e] border border-[#2d3b4e] flex items-center justify-center text-emerald-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-sm tracking-wider text-slate-100 font-mono">
                MACROMIND
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#1b2535] text-slate-400 font-mono">
                v2.5
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block">
              AI Trading Terminal
            </p>
          </div>
        </div>

        {/* Global Regime Badge */}
        <div className="hidden sm:flex items-center space-x-2">
          <div
            id="topbar-regime-badge"
            className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium border flex items-center space-x-1.5 ${getRegimeColor(
              regime
            )}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            <span>{regime}</span>
          </div>
        </div>

        {/* Binance Public Market Data Status */}
        <div
          id="binance-public-status-badge"
          className="flex items-center space-x-1.5 text-[10px] font-mono px-2 py-0.5 rounded border select-none"
        >
          {binancePublicStatus?.isLive ? (
            <div className="flex items-center space-x-1.5 text-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-semibold text-slate-300">BINANCE DATA</span>
              <span className="font-bold text-emerald-400">LIVE</span>
              {binancePublicStatus.latencyMs > 0 && (
                <span className="text-slate-500 text-[9px] hidden md:inline">
                  {binancePublicStatus.latencyMs}ms
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 text-rose-400">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              <span className="font-semibold text-slate-300">BINANCE DATA</span>
              <span className="font-bold text-rose-500">OFFLINE</span>
            </div>
          )}
        </div>

        {/* User Exchange Account Connection Status */}
        <button
          id="user-exchange-status-btn"
          onClick={onOpenSettings}
          className={`hidden lg:flex items-center space-x-1.5 text-[11px] font-mono px-2.5 py-1 rounded border transition-colors ${
            isConnected
              ? "bg-emerald-950/30 border-emerald-600/40 text-emerald-300 hover:bg-emerald-900/40"
              : isError
              ? "bg-rose-950/30 border-rose-600/40 text-rose-300 hover:bg-rose-900/40"
              : "bg-[#121824] border-[#1e2838] text-slate-400 hover:text-slate-200"
          }`}
          title="Click to configure Exchange Connection in Settings"
        >
          {isConnected ? (
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
          ) : isError ? (
            <ShieldAlert className="w-3 h-3 text-rose-400" />
          ) : (
            <Radio className="w-3 h-3 text-slate-400" />
          )}
          <span>
            {isConnected
              ? `BINANCE: CONNECTED`
              : isError
              ? `BINANCE: ERROR`
              : `BINANCE: NOT CONNECTED`}
          </span>
        </button>
      </div>

      {/* Trading Mode Selector + Account Equity + Emergency Stop */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Mode Selector */}
        <div
          id="mode-selector-group"
          className="bg-[#121722] p-0.5 rounded border border-[#212c3d] flex items-center text-xs font-mono"
        >
          <button
            id="mode-btn-paper"
            onClick={() => onSelectTradingMode("PAPER")}
            className={`px-2.5 py-1 rounded transition-all ${
              tradingMode === "PAPER"
                ? "bg-[#1f2a3a] text-slate-100 font-medium shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
            title="Simulated paper orders only"
          >
            PAPER
          </button>
          <button
            id="mode-btn-manual"
            onClick={() => onSelectTradingMode("MANUAL")}
            className={`px-2.5 py-1 rounded transition-all ${
              tradingMode === "MANUAL"
                ? "bg-emerald-950/80 text-emerald-300 font-medium border border-emerald-500/40"
                : "text-slate-400 hover:text-slate-200"
            }`}
            title={
              isConnected
                ? "AI generates setups, manual execution confirmation required"
                : "Requires Binance account connection (Switches to Paper if disconnected)"
            }
          >
            MANUAL
          </button>
          <button
            id="mode-btn-auto"
            onClick={() => onSelectTradingMode("AUTO")}
            className={`px-2.5 py-1 rounded transition-all flex items-center space-x-1 ${
              tradingMode === "AUTO"
                ? "bg-amber-950/80 text-amber-300 font-medium border border-amber-500/50"
                : "text-slate-400 hover:text-slate-200"
            }`}
            title="Systematic automated execution (Requires safety confirmation)"
          >
            <span>AUTO</span>
            {isAutoTradingActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
            )}
          </button>
        </div>

        {/* Equity Display */}
        <div className="hidden sm:flex flex-col items-end px-2.5 py-0.5 bg-[#121824] rounded border border-[#1e293a] font-mono">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center space-x-1">
            <span>{isConnected ? "Binance Equity" : "Paper Equity"}</span>
            <span
              className={`text-[10px] ${
                dailyPnl >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {dailyPnl >= 0 ? `+${dailyPnl.toFixed(2)}` : dailyPnl.toFixed(2)}$
            </span>
          </div>
          <div className="text-xs font-semibold text-slate-100">
            ${equity.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        {/* Emergency Stop Button */}
        <button
          id="btn-emergency-stop"
          onClick={onEmergencyStop}
          className="px-2.5 py-1.5 rounded bg-rose-950/40 border border-rose-600/50 text-rose-300 hover:bg-rose-900/60 hover:text-rose-100 text-xs font-mono font-medium flex items-center space-x-1.5 transition-all shadow-sm active:scale-95"
          title="Emergency Stop: Immediately pauses auto-trading, cancels pending orders, locks execution"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
          <span className="hidden md:inline">EMERGENCY STOP</span>
          <span className="md:hidden">HALT</span>
        </button>

        {/* Settings Toggle */}
        <button
          id="btn-open-settings"
          onClick={onOpenSettings}
          className="p-1.5 rounded bg-[#121824] border border-[#1f2a3a] text-slate-400 hover:text-slate-100 hover:bg-[#182030] transition-colors relative"
          title="Terminal Settings, Risk & Binance Exchange Connection"
        >
          <SlidersHorizontal className="w-4 h-4" />
          {isError && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-rose-500" />
          )}
        </button>
      </div>
    </header>
  );
};
