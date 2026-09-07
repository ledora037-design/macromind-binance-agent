import React from "react";
import {
  Sparkles,
  Play,
  RotateCw,
  Cpu,
  ShieldCheck,
  Zap,
  Activity,
  CheckCircle,
  FileText,
  Flame,
  Search,
  History,
} from "lucide-react";
import { DetectedRegime } from "../types";

interface AgentHeroBannerProps {
  isRunning: boolean;
  activeThinkingStep: string | null;
  detectedRegime: DetectedRegime;
  selectedStrategy: string;
  onRunAgent: () => void;
  onGenerateBrief: () => void;
  onOpenHistory: () => void;
  onCommandClick: (command: string) => void;
  decisionReady: boolean;
}

export const AgentHeroBanner: React.FC<AgentHeroBannerProps> = ({
  isRunning,
  activeThinkingStep,
  detectedRegime,
  selectedStrategy,
  onRunAgent,
  onGenerateBrief,
  onOpenHistory,
  onCommandClick,
  decisionReady,
}) => {
  const quickCommands = [
    "Scan the market",
    "Find the best setup",
    "Show me only longs",
    "Show me only shorts",
    "Analyze my open positions",
    "Give me a market brief",
  ];

  return (
    <div
      id="agent-hero-banner"
      className="bg-gradient-to-r from-[#0c121d] via-[#0f1726] to-[#0c121d] border border-[#1e2a3c] rounded-lg p-3.5 sm:p-4 select-none shadow-xl relative overflow-hidden"
    >
      {/* Background ambient pulse line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />

      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 sm:gap-4">
        {/* Left: Identity & Core Philosophy */}
        <div className="space-y-1 font-mono">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shadow-sm">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-bold text-base tracking-wider text-slate-100">
                  MACROMIND
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 font-bold uppercase">
                  Autonomous Agent OS
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                AI Trading Intelligence Agent
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-[11px] text-slate-400">
            <span className="text-emerald-300 font-medium">
              See the regime. Find the edge. Control the risk.
            </span>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <span className="text-slate-400">
              Trade less. Trade better. Protect capital.
            </span>
          </div>
        </div>

        {/* Center: Live Thinking / Status Feedback */}
        <div className="w-full lg:w-auto flex-1 max-w-md font-mono">
          {isRunning ? (
            <div className="p-2.5 rounded bg-[#131d2c] border border-emerald-500/50 flex items-center space-x-2.5 animate-pulse">
              <RotateCw className="w-4 h-4 text-emerald-400 animate-spin shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-[10px] text-emerald-400 font-bold uppercase block tracking-wider">
                  MACROMIND IS THINKING
                </span>
                <span className="text-xs text-slate-200 truncate block">
                  {activeThinkingStep || "Evaluating live Binance market feeds..."}
                </span>
              </div>
            </div>
          ) : decisionReady ? (
            <div className="p-2.5 rounded bg-[#0d1c18] border border-emerald-500/50 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-emerald-300 font-bold">
                  DECISION READY
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-600/40 font-bold">
                {detectedRegime} • {selectedStrategy}
              </span>
            </div>
          ) : (
            <div className="p-2.5 rounded bg-[#101724] border border-[#1d293b] flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center space-x-2">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span>Loop: OBSERVE → ANALYZE → PLAN → VETO</span>
              </div>
              <span className="text-[10px] text-slate-500">Autonomous Mode</span>
            </div>
          )}
        </div>

        {/* Right: Hackathon Action Buttons */}
        <div className="flex items-center space-x-2 w-full lg:w-auto justify-end font-mono">
          {/* Auditable Decision History */}
          <button
            id="btn-open-decision-history"
            onClick={onOpenHistory}
            className="px-3 py-2 rounded bg-[#162130] hover:bg-[#1d2b3e] border border-[#26374f] text-slate-200 text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-sm active:scale-95"
            title="View auditable decision history"
          >
            <History className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">DECISIONS</span>
            <span className="sm:hidden">LOG</span>
          </button>

          {/* One-Click Market Brief */}
          <button
            id="btn-generate-market-brief"
            onClick={onGenerateBrief}
            className="px-3 py-2 rounded bg-[#162130] hover:bg-[#1d2b3e] border border-[#26374f] text-slate-200 text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-sm active:scale-95"
            title="Generate AI Market Brief summary"
          >
            <FileText className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">MARKET BRIEF</span>
            <span className="sm:hidden">BRIEF</span>
          </button>

          {/* Primary RUN AGENT Hackathon Demo Trigger */}
          <button
            id="btn-run-agent"
            onClick={onRunAgent}
            disabled={isRunning}
            className={`px-4 py-2 rounded text-xs font-bold font-mono flex items-center space-x-2 shadow-lg transition-all active:scale-95 ${
              isRunning
                ? "bg-emerald-900/60 text-emerald-300 border border-emerald-500/40 cursor-wait"
                : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border border-emerald-400/40 shadow-emerald-950/50"
            }`}
          >
            {isRunning ? (
              <>
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
                <span>AGENT RUNNING...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>RUN AGENT</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Natural Language Agent Commands (Section 47) */}
      <div className="mt-3 pt-2.5 border-t border-[#182333] flex items-center space-x-1.5 overflow-x-auto scrollbar-none font-mono text-xs">
        <span className="text-[10px] uppercase text-slate-500 shrink-0 mr-1 flex items-center space-x-1">
          <Sparkles className="w-3 h-3 text-emerald-400" />
          <span>COMMANDS:</span>
        </span>
        {quickCommands.map((cmd, idx) => (
          <button
            key={idx}
            onClick={() => onCommandClick(cmd)}
            className="px-2.5 py-1 rounded bg-[#131c2a] hover:bg-[#1b273b] hover:text-emerald-300 text-slate-300 text-[11px] whitespace-nowrap border border-[#1e2a3c] transition-colors"
          >
            "{cmd}"
          </button>
        ))}
      </div>
    </div>
  );
};
