import React from "react";
import {
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Zap,
  Clock,
  CheckCircle,
  XCircle,
  HelpCircle,
  RotateCcw,
  Sliders,
} from "lucide-react";
import { AgentDecisionRecord, BinanceAccountInfo, TradingMode } from "../types";

interface AgentDecisionCardProps {
  decision: AgentDecisionRecord;
  tradingMode: TradingMode;
  binanceAccount: BinanceAccountInfo;
  onExecute: (decision: AgentDecisionRecord) => void;
  onSimulatePaper: (decision: AgentDecisionRecord) => void;
  onReScan: () => void;
  onOpenWhyNot: (asset: string) => void;
}

export const AgentDecisionCard: React.FC<AgentDecisionCardProps> = ({
  decision,
  tradingMode,
  binanceAccount,
  onExecute,
  onSimulatePaper,
  onReScan,
  onOpenWhyNot,
}) => {
  const isNoTrade = decision.decision === "NO_TRADE";
  const isVetoed = decision.decision === "REJECTED" || decision.riskResult === "REJECT";
  const isReady = decision.decision === "TRADE" && !isVetoed;
  const isLong = decision.direction === "LONG";
  const isConnected = binanceAccount.status === "CONNECTED";

  return (
    <div
      id={`agent-decision-card-${decision.asset}`}
      className={`border rounded-lg p-4 font-mono select-none transition-all shadow-lg ${
        isVetoed
          ? "bg-[#140c10] border-rose-600/60"
          : isReady
          ? "bg-[#0b1419] border-emerald-500/60"
          : "bg-[#111622] border-[#222d40]"
      }`}
    >
      {/* Header Banner: Agent Status Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 mb-3 border-[#1d2738]">
        <div className="flex items-center space-x-2">
          {isVetoed ? (
            <div className="w-7 h-7 rounded bg-rose-950/80 border border-rose-500/60 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          ) : isReady ? (
            <div className="w-7 h-7 rounded bg-emerald-950/80 border border-emerald-500/60 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-7 h-7 rounded bg-amber-950/80 border border-amber-500/60 flex items-center justify-center text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          )}

          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] uppercase tracking-wider text-slate-400">
                Agent Decision
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-[11px] text-slate-400 font-medium">
                {decision.timeString}
              </span>
            </div>
            <div className="text-sm font-bold tracking-wide">
              {isVetoed ? (
                <span className="text-rose-400">TRADE REJECTED BY RISK GUARDIAN</span>
              ) : isReady ? (
                <span className="text-emerald-400 flex items-center space-x-1.5">
                  <span>DECISION: READY</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </span>
              ) : (
                <span className="text-amber-400">DECISION: NO TRADE</span>
              )}
            </div>
          </div>
        </div>

        {/* Selected Strategy Tag */}
        <div className="flex items-center space-x-2 text-xs">
          <div className="bg-[#151e2c] border border-[#233247] px-2.5 py-1 rounded text-slate-300 flex items-center space-x-1.5">
            <span className="text-slate-500 text-[10px]">STRATEGY:</span>
            <span className="font-semibold text-emerald-300">{decision.strategy}</span>
          </div>
          <button
            onClick={onReScan}
            className="p-1 rounded bg-[#16202e] hover:bg-[#1f2c3f] border border-[#27374d] text-slate-400 hover:text-slate-200 transition-colors"
            title="Re-run Autonomous Market Scan"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* VETO ALERT BANNER (Section 41) */}
      {isVetoed && (
        <div
          id="risk-guardian-veto-banner"
          className="mb-3.5 p-3 rounded bg-rose-950/60 border border-rose-600/60 text-xs text-rose-200 space-y-1 animate-fadeIn"
        >
          <div className="flex items-center space-x-2 font-bold text-rose-400">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="tracking-wide">TRADE REJECTED BY RISK GUARDIAN</span>
          </div>
          <p className="text-[11px] text-rose-200 pl-6 leading-relaxed">
            <strong>Reason:</strong> "{decision.riskReason || "Expected R:R fell below the institutional minimum requirement."}"
          </p>
          <div className="pl-6 pt-1 text-[10px] text-rose-400/80">
            The AI strategy engine proposed this setup, but the autonomous Risk Guardian exercised its veto power to protect capital.
          </div>
        </div>
      )}

      {/* SMART NO TRADE BANNER (Section 49) */}
      {isNoTrade && (
        <div
          id="smart-no-trade-banner"
          className="mb-3.5 p-3 rounded bg-[#151c2a] border border-amber-500/40 text-xs text-amber-200 space-y-2"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 font-bold text-amber-300">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>DISCIPLINED NO TRADE: EDGE INSUFFICIENT</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-600/40">
              CAPITAL PRESERVATION
            </span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            MacroMind surveyed the universe across 4H regimes, 1H structures, and 15M confirmations.
            Current market conditions provide no institutional edge &gt; 2.0R with clean invalidation.
          </p>
          {decision.nextTrigger && (
            <div className="p-2 rounded bg-[#0d131d] border border-[#1b2536] text-[11px]">
              <span className="text-amber-400 font-bold block mb-0.5">NEXT TRIGGER CONDITION:</span>
              <span className="text-slate-300">{decision.nextTrigger}</span>
            </div>
          )}
        </div>
      )}

      {/* Core Setup Metrics Grid (Section 40) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 mb-3.5 text-xs">
        {/* ASSET */}
        <div className="p-2 rounded bg-[#131b28] border border-[#1e2a3c]">
          <span className="text-[10px] text-slate-500 block uppercase">ASSET</span>
          <span className="font-bold text-slate-100 text-sm">{decision.asset}</span>
        </div>

        {/* DIRECTION */}
        <div className="p-2 rounded bg-[#131b28] border border-[#1e2a3c]">
          <span className="text-[10px] text-slate-500 block uppercase">DIRECTION</span>
          <span
            className={`font-bold flex items-center space-x-1 ${
              isLong
                ? "text-emerald-400"
                : decision.direction === "SHORT"
                ? "text-rose-400"
                : "text-slate-400"
            }`}
          >
            {isLong && <TrendingUp className="w-3.5 h-3.5" />}
            {decision.direction === "SHORT" && <TrendingDown className="w-3.5 h-3.5" />}
            <span>{decision.direction}</span>
          </span>
        </div>

        {/* SETUP SCORE */}
        <div className="p-2 rounded bg-[#131b28] border border-[#1e2a3c]">
          <span className="text-[10px] text-slate-500 block uppercase">SCORE</span>
          <span
            className={`font-bold text-sm ${
              decision.score >= 80 ? "text-emerald-400" : "text-amber-400"
            }`}
          >
            {decision.score}/100
          </span>
        </div>

        {/* ENTRY */}
        <div className="p-2 rounded bg-[#131b28] border border-[#1e2a3c]">
          <span className="text-[10px] text-slate-500 block uppercase">ENTRY ZONE</span>
          <span className="font-medium text-slate-200">
            {decision.entryZone
              ? `$${decision.entryZone[0].toLocaleString()} - $${decision.entryZone[1].toLocaleString()}`
              : decision.entry
              ? `$${decision.entry.toLocaleString()}`
              : "Market Price"}
          </span>
        </div>

        {/* STOP */}
        <div className="p-2 rounded bg-[#131b28] border border-[#1e2a3c]">
          <span className="text-[10px] text-slate-500 block uppercase">STOP LOSS</span>
          <span className="font-bold text-rose-400">
            {decision.stopLoss ? `$${decision.stopLoss.toLocaleString()}` : "N/A"}
          </span>
        </div>

        {/* TP1 & TP2 */}
        <div className="p-2 rounded bg-[#131b28] border border-[#1e2a3c]">
          <span className="text-[10px] text-slate-500 block uppercase">TARGETS</span>
          <span className="font-medium text-emerald-400 block text-[11px]">
            TP1: {decision.tp1 ? `$${decision.tp1.toLocaleString()}` : "N/A"}
          </span>
          <span className="font-medium text-emerald-300 block text-[10px] text-opacity-80">
            TP2: {decision.tp2 ? `$${decision.tp2.toLocaleString()}` : "N/A"}
          </span>
        </div>

        {/* R:R */}
        <div className="p-2 rounded bg-[#131b28] border border-[#1e2a3c]">
          <span className="text-[10px] text-slate-500 block uppercase">R:R RATIO</span>
          <span className="font-bold text-emerald-300 text-sm">
            {decision.riskReward ? `1 : ${decision.riskReward.toFixed(1)}` : "N/A"}
          </span>
        </div>

        {/* RISK */}
        <div className="p-2 rounded bg-[#131b28] border border-[#1e2a3c]">
          <span className="text-[10px] text-slate-500 block uppercase">ALLOCATION</span>
          <span className="font-medium text-slate-300">
            {decision.riskPercentage ? `${decision.riskPercentage}%` : "0.5%"}
          </span>
        </div>
      </div>

      {/* WHY & INVALIDATIONS (Section 40) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3.5 text-xs">
        {/* WHY: 3 to 5 concise reasons */}
        <div className="p-3 rounded bg-[#0e1522] border border-[#1a2538] space-y-2">
          <div className="flex items-center space-x-1.5 text-emerald-400 font-bold text-[11px] uppercase tracking-wider">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>WHY (CONFLUENCE PILLARS)</span>
          </div>
          <ul className="space-y-1.5 text-slate-300 text-[11px] leading-relaxed">
            {decision.why.map((r, i) => (
              <li key={i} className="flex items-start space-x-1.5">
                <span className="text-emerald-500 font-bold">•</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* WHAT WOULD INVALIDATE IT: 2 to 3 concise conditions */}
        <div className="p-3 rounded bg-[#0e1522] border border-[#1a2538] space-y-2">
          <div className="flex items-center space-x-1.5 text-rose-400 font-bold text-[11px] uppercase tracking-wider">
            <XCircle className="w-3.5 h-3.5" />
            <span>WHAT WOULD INVALIDATE IT</span>
          </div>
          <ul className="space-y-1.5 text-slate-300 text-[11px] leading-relaxed">
            {decision.invalidations.map((inv, i) => (
              <li key={i} className="flex items-start space-x-1.5">
                <span className="text-rose-500 font-bold">•</span>
                <span>{inv}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Execution Control Action Row */}
      <div className="pt-2 border-t border-[#1a2536] flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center space-x-2">
          <span className="text-slate-500 text-[11px]">Mode:</span>
          <span className="font-bold text-slate-200">{tradingMode}</span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400 text-[11px]">
            {isConnected ? "Binance API Verified" : "Simulated Local Engine"}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onOpenWhyNot(decision.asset)}
            className="px-2.5 py-1.5 rounded bg-[#16202e] hover:bg-[#1d2a3d] border border-[#233145] text-slate-300 text-xs flex items-center space-x-1 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>DEEP WHY NOT</span>
          </button>

          {isReady && (
            <>
              <button
                onClick={() => onSimulatePaper(decision)}
                className="px-3 py-1.5 rounded bg-[#1c2738] hover:bg-[#25344a] border border-[#2c3d56] text-slate-200 text-xs font-semibold transition-colors"
              >
                PAPER SIMULATE
              </button>

              <button
                onClick={() => onExecute(decision)}
                className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold flex items-center space-x-1.5 shadow-md transition-all"
              >
                <span>
                  {tradingMode === "AUTO"
                    ? "AUTO-EXECUTE"
                    : isConnected && tradingMode === "MANUAL"
                    ? "CONFIRM LIVE BINANCE"
                    : "EXECUTE ORDER"}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          {isVetoed && (
            <button
              onClick={onReScan}
              className="px-3 py-1.5 rounded bg-rose-950/60 border border-rose-600/60 text-rose-300 hover:bg-rose-900/60 text-xs font-bold flex items-center space-x-1"
            >
              <span>VETO ENGAGED - SCAN NEXT</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {isNoTrade && (
            <button
              onClick={onReScan}
              className="px-3 py-1.5 rounded bg-[#16202e] hover:bg-[#1e2a3c] border border-[#253448] text-slate-300 text-xs font-bold flex items-center space-x-1"
            >
              <span>WAIT & RE-SCAN</span>
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
