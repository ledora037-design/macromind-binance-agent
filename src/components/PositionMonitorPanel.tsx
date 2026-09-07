import React from "react";
import {
  Eye,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
  MoveRight,
  Percent,
} from "lucide-react";
import { Position, PositionMonitoringReport } from "../types";

interface PositionMonitorPanelProps {
  positions: Position[];
  reports: PositionMonitoringReport[];
  onApplyAction: (
    positionId: string,
    action: "MOVE STOP" | "TAKE PARTIAL" | "CLOSE",
    report: PositionMonitoringReport
  ) => void;
}

export const PositionMonitorPanel: React.FC<PositionMonitorPanelProps> = ({
  positions,
  reports,
  onApplyAction,
}) => {
  if (positions.length === 0) {
    return (
      <div
        id="position-monitor-empty"
        className="bg-[#0b1018] border border-[#1d2638] rounded-lg p-4 font-mono text-xs text-slate-400 flex items-center justify-between select-none"
      >
        <div className="flex items-center space-x-2">
          <Eye className="w-4 h-4 text-slate-500" />
          <span>No active positions to monitor. Open a position to activate autonomous trade guard.</span>
        </div>
        <span className="text-[10px] text-slate-600">Continuous 15M/1H Telemetry</span>
      </div>
    );
  }

  return (
    <div
      id="position-monitor-panel"
      className="bg-[#0b1018] border border-[#1e2838] rounded-lg p-3.5 font-mono select-none space-y-3 shadow-md"
    >
      <div className="flex items-center justify-between border-b border-[#1a2536] pb-2.5">
        <div className="flex items-center space-x-2">
          <Eye className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-xs text-slate-100 uppercase tracking-wider">
            Autonomous Trade Management ({positions.length} Active)
          </span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
            ACTIVE GUARD
          </span>
        </div>
        <span className="text-[10px] text-slate-400 hidden sm:inline">
          Monitoring: Structure • Momentum • Volume • Invalidation
        </span>
      </div>

      <div className="space-y-2.5">
        {positions.map((pos) => {
          const report = reports.find((r) => r.positionId === pos.id) || {
            positionId: pos.id,
            asset: pos.asset,
            side: pos.side,
            entryPrice: pos.entryPrice,
            currentPrice: pos.currentPrice,
            unrealizedPnlPercent: pos.unrealizedPnlPercent,
            recommendation: "HOLD" as const,
            reason: "Trade progressing within bounds. Monitoring structure.",
            structureStatus: "HEALTHY",
            momentumStatus: "NORMAL",
            updatedAt: Date.now(),
          };

          const isLong = pos.side === "LONG";
          const isProfitable = pos.unrealizedPnlPercent >= 0;

          const getRecommendationColor = (rec: PositionMonitoringReport["recommendation"]) => {
            switch (rec) {
              case "TAKE PARTIAL":
                return "bg-emerald-950/80 text-emerald-300 border-emerald-500/50";
              case "MOVE STOP":
                return "bg-blue-950/80 text-blue-300 border-blue-500/50";
              case "CLOSE":
                return "bg-rose-950/80 text-rose-300 border-rose-500/50";
              default:
                return "bg-[#141d2c] text-slate-300 border-[#223145]";
            }
          };

          return (
            <div
              key={pos.id}
              className="p-3 rounded bg-[#101724] border border-[#1b2637] hover:border-[#2b3a50] transition-colors space-y-2.5 text-xs"
            >
              {/* Top row: Asset, Side, Entry, Current, PnL */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-sm text-slate-100">{pos.asset}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border flex items-center space-x-1 ${
                      isLong
                        ? "text-emerald-400 bg-emerald-950/40 border-emerald-500/40"
                        : "text-rose-400 bg-rose-950/40 border-rose-500/40"
                    }`}
                  >
                    {isLong ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    <span>{pos.side}</span>
                  </span>
                  <span className="text-slate-500 text-[11px]">
                    Entry: ${pos.entryPrice.toLocaleString()} → Now: ${pos.currentPrice.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center space-x-3 text-xs">
                  <div className="text-right">
                    <span
                      className={`font-bold ${
                        isProfitable ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {isProfitable ? "+" : ""}
                      {pos.unrealizedPnlPercent.toFixed(2)}% (${pos.unrealizedPnl.toFixed(2)})
                    </span>
                  </div>
                </div>
              </div>

              {/* Recommendation & Reason Banner */}
              <div className="p-2.5 rounded bg-[#0d131e] border border-[#192334] space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] text-slate-400 uppercase">Recommendation:</span>
                    <span
                      className={`px-2 py-0.5 rounded font-bold text-[11px] border ${getRecommendationColor(
                        report.recommendation
                      )}`}
                    >
                      {report.recommendation}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Structure: <span className="text-slate-300">{report.structureStatus}</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed pl-1 border-l-2 border-emerald-500/50">
                  {report.reason}
                </p>
              </div>

              {/* Action Trigger Buttons if actionable */}
              {report.recommendation !== "HOLD" && report.recommendation !== "DO NOTHING" && (
                <div className="flex items-center justify-end space-x-2 pt-1">
                  {report.recommendation === "MOVE STOP" && report.suggestedStopLoss && (
                    <button
                      onClick={() => onApplyAction(pos.id, "MOVE STOP", report)}
                      className="px-3 py-1 rounded bg-blue-900/60 hover:bg-blue-800 border border-blue-500/50 text-blue-200 text-xs font-bold transition-all flex items-center space-x-1"
                    >
                      <span>APPLY TRAILING STOP ($${report.suggestedStopLoss.toLocaleString()})</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {report.recommendation === "TAKE PARTIAL" && (
                    <button
                      onClick={() => onApplyAction(pos.id, "TAKE PARTIAL", report)}
                      className="px-3 py-1 rounded bg-emerald-900/60 hover:bg-emerald-800 border border-emerald-500/50 text-emerald-200 text-xs font-bold transition-all flex items-center space-x-1"
                    >
                      <span>TAKE 50% PARTIAL PROFIT</span>
                      <Percent className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {report.recommendation === "CLOSE" && (
                    <button
                      onClick={() => onApplyAction(pos.id, "CLOSE", report)}
                      className="px-3 py-1 rounded bg-rose-900/60 hover:bg-rose-800 border border-rose-500/50 text-rose-200 text-xs font-bold transition-all flex items-center space-x-1"
                    >
                      <span>DEFENSIVE CLOSE</span>
                      <AlertTriangle className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
