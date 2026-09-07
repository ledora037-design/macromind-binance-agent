import React, { useState } from "react";
import {
  FileText,
  X,
  Copy,
  Check,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Layers,
  ShieldCheck,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { MarketBriefData } from "../types";

interface MarketBriefModalProps {
  brief: MarketBriefData | null;
  onClose: () => void;
  onRegenerate: () => void;
  isGenerating?: boolean;
}

export const MarketBriefModal: React.FC<MarketBriefModalProps> = ({
  brief,
  onClose,
  onRegenerate,
  isGenerating,
}) => {
  const [copied, setCopied] = useState(false);

  if (!brief) return null;

  const handleCopy = () => {
    const text = `MacroMind Market Brief (${new Date(brief.timestamp).toLocaleTimeString()})
• Regime: ${brief.marketRegime}
• BTC Condition: ${brief.btcCondition}
• Top Opportunity: ${brief.topOpportunity}
• Biggest Risk: ${brief.biggestRisk}
• Key Levels: ${brief.importantLevels}
• Best Strategy: ${brief.bestStrategy}
• Worth Trading: ${brief.worthTrading ? "YES" : "NO"}
• Verdict: ${brief.verdict}
${brief.fullAnalysis}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      id="market-brief-modal"
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 font-mono select-none"
    >
      <div className="bg-[#0b1018] border border-[#222f42] rounded-lg max-w-xl w-full p-4 sm:p-5 space-y-4 shadow-2xl animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1b2536] pb-3">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded bg-blue-950/80 border border-blue-500/50 flex items-center justify-center text-blue-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100 uppercase tracking-wider">
                MacroMind AI Market Brief
              </h3>
              <p className="text-[10px] text-slate-400">
                Institutional Executive Intelligence • {new Date(brief.timestamp).toLocaleTimeString()}
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

        {/* Verdict Badge */}
        <div
          className={`p-3 rounded border text-xs flex items-center justify-between ${
            brief.worthTrading
              ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-200"
              : "bg-amber-950/40 border-amber-500/50 text-amber-200"
          }`}
        >
          <div className="flex items-center space-x-2">
            {brief.worthTrading ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <div>
              <span className="font-bold text-xs uppercase block">
                WORTH TRADING: {brief.worthTrading ? "YES (SELECTIVE)" : "NO (PATIENCE / PROTECT)"}
              </span>
              <span className="text-[11px] text-slate-300">{brief.verdict}</span>
            </div>
          </div>
        </div>

        {/* Breakdown Grid */}
        <div className="space-y-2 text-xs">
          {/* Regime & Strategy */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded bg-[#101724] border border-[#1c2738]">
              <span className="text-[10px] text-slate-500 block uppercase">CURRENT REGIME</span>
              <span className="font-bold text-slate-200">{brief.marketRegime}</span>
            </div>
            <div className="p-2.5 rounded bg-[#101724] border border-[#1c2738]">
              <span className="text-[10px] text-slate-500 block uppercase">RECOMMENDED STRATEGY</span>
              <span className="font-bold text-emerald-400">{brief.bestStrategy}</span>
            </div>
          </div>

          {/* BTC Condition */}
          <div className="p-2.5 rounded bg-[#101724] border border-[#1c2738]">
            <span className="text-[10px] text-slate-500 block uppercase">BTC CONDITION</span>
            <span className="text-slate-300">{brief.btcCondition}</span>
          </div>

          {/* Top Opportunity */}
          <div className="p-2.5 rounded bg-[#101724] border border-[#1c2738]">
            <span className="text-[10px] text-slate-500 block uppercase">TOP OPPORTUNITY</span>
            <span className="font-bold text-emerald-300">{brief.topOpportunity}</span>
          </div>

          {/* Key Levels & Biggest Risk */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="p-2.5 rounded bg-[#101724] border border-[#1c2738]">
              <span className="text-[10px] text-slate-500 block uppercase">IMPORTANT LEVELS</span>
              <span className="text-slate-300 text-[11px]">{brief.importantLevels}</span>
            </div>
            <div className="p-2.5 rounded bg-[#101724] border border-[#1c2738]">
              <span className="text-[10px] text-slate-500 block uppercase">BIGGEST RISK</span>
              <span className="text-rose-300 text-[11px]">{brief.biggestRisk}</span>
            </div>
          </div>
        </div>

        {/* Full Analysis Summary */}
        <div className="p-3 rounded bg-[#0d1420] border border-[#1c293b] text-slate-300 text-xs leading-relaxed">
          <span className="text-blue-400 font-bold block mb-1">EXECUTIVE SUMMARY:</span>
          <p>{brief.fullAnalysis}</p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-2 border-t border-[#1a2536] text-xs">
          <button
            onClick={onRegenerate}
            disabled={isGenerating}
            className="px-3 py-1.5 rounded bg-[#162130] hover:bg-[#1e2c3e] border border-[#25364e] text-slate-300 flex items-center space-x-1.5 transition-colors disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>{isGenerating ? "REGENERATING..." : "REGENERATE"}</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded bg-[#162130] hover:bg-[#1e2c3e] border border-[#25364e] text-slate-200 flex items-center space-x-1.5 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "COPIED" : "COPY BRIEF"}</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors"
            >
              CLOSE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
