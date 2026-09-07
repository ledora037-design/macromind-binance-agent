import React, { useState } from "react";
import {
  History,
  X,
  ShieldAlert,
  ShieldCheck,
  Clock,
  TrendingUp,
  TrendingDown,
  Filter,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { AgentDecisionRecord, AgentDecisionType } from "../types";

interface DecisionHistoryModalProps {
  history: AgentDecisionRecord[];
  onClose: () => void;
  onClear?: () => void;
}

export const DecisionHistoryModal: React.FC<DecisionHistoryModalProps> = ({
  history,
  onClose,
  onClear,
}) => {
  const [filterType, setFilterType] = useState<AgentDecisionType | "ALL">("ALL");

  const filtered = filterType === "ALL" ? history : history.filter((d) => d.decision === filterType);

  const getDecisionBadge = (decision: AgentDecisionType) => {
    switch (decision) {
      case "TRADE":
        return "bg-emerald-950/60 text-emerald-400 border-emerald-500/50";
      case "REJECTED":
        return "bg-rose-950/60 text-rose-400 border-rose-500/50";
      case "NO_TRADE":
        return "bg-amber-950/60 text-amber-400 border-amber-500/40";
      case "WATCH":
        return "bg-cyan-950/60 text-cyan-400 border-cyan-500/40";
      case "CLOSED":
        return "bg-slate-800 text-slate-300 border-slate-700";
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  return (
    <div
      id="decision-history-modal"
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 font-mono select-none"
    >
      <div className="bg-[#0b1018] border border-[#222f42] rounded-lg max-w-4xl w-full p-4 sm:p-5 space-y-4 shadow-2xl animate-fadeIn flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1b2536] pb-3 shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100 uppercase tracking-wider">
                Auditable Agent Decision History
              </h3>
              <p className="text-[10px] text-slate-400">
                {history.length} logged systematic decisions with verifiable Risk Guardian verdicts
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-200 transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto shrink-0 pb-1 text-xs">
          <div className="flex items-center space-x-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            {(["ALL", "TRADE", "NO_TRADE", "REJECTED", "WATCH", "CLOSED"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-2.5 py-1 rounded text-[11px] font-bold border transition-colors ${
                  filterType === type
                    ? "bg-emerald-950 text-emerald-300 border-emerald-500/50"
                    : "bg-[#111724] text-slate-400 border-[#1c2738] hover:text-slate-200"
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {onClear && history.length > 0 && (
            <button
              onClick={onClear}
              className="text-[11px] text-rose-400 hover:text-rose-300 underline"
            >
              Clear Log
            </button>
          )}
        </div>

        {/* Table / List View */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-[#1e293b]">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No decision records matching the filter.
            </div>
          ) : (
            filtered.map((item) => {
              const isLong = item.direction === "LONG";
              return (
                <div
                  key={item.id}
                  className="p-3 rounded bg-[#101724] border border-[#1b2738] hover:border-[#2b3a50] transition-colors space-y-2 text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] text-slate-500">{item.timeString}</span>
                      <span className="font-bold text-slate-100 text-sm">{item.asset}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getDecisionBadge(
                          item.decision
                        )}`}
                      >
                        {item.decision}
                      </span>
                      {item.direction !== "NO_TRADE" && (
                        <span
                          className={`text-[10px] font-bold flex items-center space-x-1 ${
                            isLong ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {isLong ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          <span>{item.direction}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 text-[11px]">
                      <span className="text-slate-400">Score:</span>
                      <span className="font-bold text-slate-100">{item.score}/100</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-slate-400">Regime:</span>
                      <span className="text-slate-200">{item.marketRegime}</span>
                    </div>
                  </div>

                  {/* Strategy and Risk Check Row */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] bg-[#0c121d] p-2 rounded border border-[#172130]">
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-500">Strategy:</span>
                      <span className="font-medium text-emerald-300">{item.strategy}</span>
                      {item.riskReward && (
                        <>
                          <span className="text-slate-600">•</span>
                          <span className="text-slate-500">R:R:</span>
                          <span className="text-emerald-400 font-bold">1:{item.riskReward.toFixed(1)}</span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-slate-500">Risk Guardian:</span>
                      <span
                        className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${
                          item.riskResult === "PASS"
                            ? "bg-emerald-950 text-emerald-400 border border-emerald-600/40"
                            : "bg-rose-950 text-rose-400 border border-rose-600/40"
                        }`}
                      >
                        {item.riskResult}
                      </span>
                    </div>
                  </div>

                  {/* Why / Rejection Reason summary */}
                  {item.riskReason && (
                    <div className="text-[11px] text-rose-300 pl-1 border-l-2 border-rose-500">
                      <strong>Veto Reason:</strong> {item.riskReason}
                    </div>
                  )}

                  {item.why && item.why.length > 0 && !item.riskReason && (
                    <div className="text-[11px] text-slate-300 pl-1 border-l-2 border-emerald-500/60 truncate">
                      {item.why[0]}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-[#1b2536] flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-[#162130] hover:bg-[#1e2c3e] border border-[#25364e] text-slate-200 text-xs font-bold transition-colors"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
