import React, { useState } from "react";
import {
  Briefcase,
  TrendingUp,
  TrendingDown,
  XCircle,
  ShieldCheck,
  Percent,
  BookOpen,
  Sparkles,
  Search,
  CheckCircle,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { JournalEntry, Position, RiskSettings } from "../types";

interface PortfolioViewProps {
  equity: number;
  availableBalance: number;
  usedMargin: number;
  unrealizedPnl: number;
  realizedPnl: number;
  dailyPnl: number;
  drawdownPercent: number;
  openPositions: Position[];
  journalEntries: JournalEntry[];
  onClosePosition: (id: string) => void;
  onMoveToBreakeven: (id: string) => void;
  onTakePartialProfit: (id: string) => void;
  onUpdateJournalNote: (id: string, note: string) => void;
}

export const PortfolioView: React.FC<PortfolioViewProps> = ({
  equity,
  availableBalance,
  usedMargin,
  unrealizedPnl,
  realizedPnl,
  dailyPnl,
  drawdownPercent,
  openPositions,
  journalEntries,
  onClosePosition,
  onMoveToBreakeven,
  onTakePartialProfit,
  onUpdateJournalNote,
}) => {
  const [activeTab, setActiveTab] = useState<"POSITIONS" | "JOURNAL">("POSITIONS");
  const [journalFilter, setJournalFilter] = useState<string>("ALL");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState<string>("");

  const filteredJournal = journalEntries.filter((j) => {
    if (journalFilter === "WINS") return j.result === "WIN";
    if (journalFilter === "LOSSES") return j.result === "LOSS";
    return true;
  });

  const handleSaveNote = (id: string) => {
    onUpdateJournalNote(id, noteText);
    setEditingNoteId(null);
  };

  return (
    <div id="portfolio-view" className="bg-[#0b0f16] border border-[#1c2432] rounded flex flex-col h-full font-mono select-none overflow-auto">
      {/* Top Metric Summary Cards */}
      <div className="p-3.5 border-b border-[#1a2331] grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
        <div className="bg-[#0e141f] p-2.5 rounded border border-[#1c2635]">
          <span className="text-[10px] text-slate-400">TOTAL EQUITY</span>
          <div className="text-sm sm:text-base font-bold text-slate-100">
            ${equity.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-[#0e141f] p-2.5 rounded border border-[#1c2635]">
          <span className="text-[10px] text-slate-400">AVAILABLE</span>
          <div className="text-sm sm:text-base font-bold text-slate-200">
            ${availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-[#0e141f] p-2.5 rounded border border-[#1c2635]">
          <span className="text-[10px] text-slate-400">USED MARGIN</span>
          <div className="text-sm sm:text-base font-bold text-slate-300">
            ${usedMargin.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-[#0e141f] p-2.5 rounded border border-[#1c2635]">
          <span className="text-[10px] text-slate-400">UNREALIZED PnL</span>
          <div
            className={`text-sm sm:text-base font-bold flex items-center space-x-1 ${
              unrealizedPnl >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {unrealizedPnl >= 0 ? (
              <ArrowUpRight className="w-3.5 h-3.5" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5" />
            )}
            <span>
              {unrealizedPnl >= 0 ? "+" : ""}${unrealizedPnl.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="bg-[#0e141f] p-2.5 rounded border border-[#1c2635]">
          <span className="text-[10px] text-slate-400">REALIZED PnL</span>
          <div
            className={`text-sm sm:text-base font-bold ${
              realizedPnl >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {realizedPnl >= 0 ? "+" : ""}${realizedPnl.toFixed(2)}
          </div>
        </div>

        <div className="bg-[#0e141f] p-2.5 rounded border border-[#1c2635]">
          <span className="text-[10px] text-slate-400">DAILY PnL</span>
          <div
            className={`text-sm sm:text-base font-bold ${
              dailyPnl >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {dailyPnl >= 0 ? "+" : ""}${dailyPnl.toFixed(2)}
          </div>
        </div>

        <div className="bg-[#0e141f] p-2.5 rounded border border-[#1c2635]">
          <span className="text-[10px] text-slate-400">DRAWDOWN</span>
          <div className="text-sm sm:text-base font-bold text-slate-200">
            {drawdownPercent.toFixed(2)}%
          </div>
        </div>
      </div>

      {/* Sub Tabs: Open Positions vs Trade Journal */}
      <div className="p-3 border-b border-[#1a2331] flex items-center justify-between">
        <div className="bg-[#121824] p-0.5 rounded border border-[#1e293a] flex items-center text-xs">
          <button
            onClick={() => setActiveTab("POSITIONS")}
            className={`px-3 py-1 rounded transition-colors flex items-center space-x-1.5 ${
              activeTab === "POSITIONS"
                ? "bg-[#1f2b3c] text-slate-100 font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Briefcase className="w-3.5 h-3.5 text-emerald-400" />
            <span>Open Positions ({openPositions.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("JOURNAL")}
            className={`px-3 py-1 rounded transition-colors flex items-center space-x-1.5 ${
              activeTab === "JOURNAL"
                ? "bg-[#1f2b3c] text-slate-100 font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-400" />
            <span>Journal & AI Review ({journalEntries.length})</span>
          </button>
        </div>

        {activeTab === "JOURNAL" && (
          <div className="flex items-center space-x-1 text-xs">
            {(["ALL", "WINS", "LOSSES"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setJournalFilter(f)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                  journalFilter === f
                    ? "bg-[#1f2b3c] text-slate-100 border-[#2d3e57]"
                    : "bg-[#101520] text-slate-400 border-[#1a2332]"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="p-3.5 flex-1 overflow-auto">
        {activeTab === "POSITIONS" ? (
          /* Active Positions Table */
          <div className="overflow-x-auto">
            {openPositions.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                <Briefcase className="w-8 h-8 mx-auto text-slate-600 mb-2 opacity-60" />
                <p>No active positions open.</p>
                <p className="text-[11px] text-slate-600 mt-1">
                  Scanner or Manual orders will appear here in real-time.
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#0e131d] text-slate-400 border-b border-[#1a2331] text-[11px]">
                    <th className="py-2.5 px-3">ASSET / STRATEGY</th>
                    <th className="py-2.5 px-3">SIDE</th>
                    <th className="py-2.5 px-3 text-right">ENTRY / CURRENT</th>
                    <th className="py-2.5 px-3 text-right">SIZE / NOTIONAL</th>
                    <th className="py-2.5 px-3 text-right">UNREALIZED PnL</th>
                    <th className="py-2.5 px-3 text-right">STOP / TP</th>
                    <th className="py-2.5 px-3 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#151d2a]">
                  {openPositions.map((pos) => {
                    const isLong = pos.side === "LONG";
                    const isProfitable = pos.unrealizedPnl >= 0;

                    return (
                      <tr key={pos.id} className="hover:bg-[#121924] transition-colors">
                        {/* Asset / Strategy */}
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-100">{pos.asset}</div>
                          <div className="text-[10px] text-slate-400">{pos.strategyName}</div>
                        </td>

                        {/* Side */}
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              isLong
                                ? "text-emerald-400 bg-emerald-950/40 border-emerald-500/40"
                                : "text-rose-400 bg-rose-950/40 border-rose-500/40"
                            }`}
                          >
                            {pos.side} {pos.leverage}x
                          </span>
                        </td>

                        {/* Entry / Current */}
                        <td className="py-2.5 px-3 text-right">
                          <div className="text-slate-300 font-medium">
                            ${pos.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Entry: ${pos.entryPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </div>
                        </td>

                        {/* Size / Notional */}
                        <td className="py-2.5 px-3 text-right">
                          <div className="text-slate-200">
                            {pos.size.toFixed(4)} {pos.asset.replace("USDT", "")}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            ${pos.notionalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </div>
                        </td>

                        {/* Unrealized PnL */}
                        <td className="py-2.5 px-3 text-right">
                          <div
                            className={`font-bold ${
                              isProfitable ? "text-emerald-400" : "text-rose-400"
                            }`}
                          >
                            {isProfitable ? "+" : ""}${pos.unrealizedPnl.toFixed(2)}
                          </div>
                          <div
                            className={`text-[10px] ${
                              isProfitable ? "text-emerald-400/80" : "text-rose-400/80"
                            }`}
                          >
                            {isProfitable ? "+" : ""}
                            {pos.unrealizedPnlPercent.toFixed(2)}%
                          </div>
                        </td>

                        {/* Stop / TP */}
                        <td className="py-2.5 px-3 text-right">
                          <div className="text-rose-400 text-[11px]">
                            SL: ${pos.stopLoss.toLocaleString()}
                          </div>
                          <div className="text-emerald-400 text-[11px]">
                            TP: ${pos.takeProfit.toLocaleString()}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            {/* Move to BE */}
                            <button
                              onClick={() => onMoveToBreakeven(pos.id)}
                              className="px-2 py-1 rounded bg-[#162130] hover:bg-[#1d2a3d] text-slate-300 text-[10px] border border-[#223044] flex items-center space-x-1"
                              title="Set Stop Loss to Entry Price (Zero Risk)"
                            >
                              <ShieldCheck className="w-3 h-3 text-blue-400" />
                              <span>BE</span>
                            </button>

                            {/* Take Partial Profit (50%) */}
                            <button
                              onClick={() => onTakePartialProfit(pos.id)}
                              className="px-2 py-1 rounded bg-[#162130] hover:bg-[#1d2a3d] text-emerald-300 text-[10px] border border-[#223044] flex items-center space-x-1"
                              title="Take 50% profit off the table"
                            >
                              <Percent className="w-3 h-3 text-emerald-400" />
                              <span>50%</span>
                            </button>

                            {/* Close Position */}
                            <button
                              onClick={() => onClosePosition(pos.id)}
                              className="px-2 py-1 rounded bg-rose-950/60 hover:bg-rose-900 text-rose-300 text-[10px] border border-rose-500/40 flex items-center space-x-1"
                              title="Market Close entire position"
                            >
                              <XCircle className="w-3 h-3 text-rose-400" />
                              <span>CLOSE</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          /* Trade Journal & AI Review */
          <div className="space-y-4">
            {/* AI Review Header Card */}
            <div className="bg-[#0e141f] border border-[#1e2a3c] rounded p-3.5 space-y-2">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span className="font-bold text-xs text-slate-100 uppercase">
                  MacroMind Quantitative Trade Review
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Aggregated trade intelligence indicates strongest edge on <strong>BTC</strong> and{" "}
                <strong>SOL</strong> when adhering to <strong>Breakout Hunter</strong> during{" "}
                <strong>STRONG BULL / BULL</strong> regimes (Win rate 66.7%, Avg R: +2.18R).
                Penalize early exits before TP1; trailing stops to breakeven after 1.5R improved
                retention by +14.2%.
              </p>
            </div>

            {/* Journal Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#0e131d] text-slate-400 border-b border-[#1a2331] text-[11px]">
                    <th className="py-2 px-2.5">DATE / TIME</th>
                    <th className="py-2 px-2.5">ASSET</th>
                    <th className="py-2 px-2.5">STRATEGY</th>
                    <th className="py-2 px-2.5 text-right">ENTRY / EXIT</th>
                    <th className="py-2 px-2.5 text-center">RESULT</th>
                    <th className="py-2 px-2.5 text-right">PnL ($)</th>
                    <th className="py-2 px-2.5 text-right">R-MULTIPLE</th>
                    <th className="py-2 px-2.5">NOTES / WHY</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#151d2a]">
                  {filteredJournal.map((entry) => (
                    <tr key={entry.id} className="hover:bg-[#121924]">
                      <td className="py-2 px-2.5 text-slate-400 text-[11px]">
                        {new Date(entry.timestamp).toLocaleDateString()}
                      </td>
                      <td className="py-2 px-2.5 font-bold text-slate-200">
                        {entry.asset}
                        <span
                          className={`ml-1 text-[10px] ${
                            entry.direction === "LONG" ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {entry.direction}
                        </span>
                      </td>
                      <td className="py-2 px-2.5 text-slate-400">{entry.strategy}</td>
                      <td className="py-2 px-2.5 text-right text-slate-300">
                        ${entry.entryPrice.toLocaleString()} → ${entry.exitPrice.toLocaleString()}
                      </td>
                      <td className="py-2 px-2.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            entry.result === "WIN"
                              ? "bg-emerald-950/60 text-emerald-300 border border-emerald-500/40"
                              : "bg-rose-950/60 text-rose-300 border border-rose-500/40"
                          }`}
                        >
                          {entry.result}
                        </span>
                      </td>
                      <td
                        className={`py-2 px-2.5 text-right font-bold ${
                          entry.pnl >= 0 ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {entry.pnl >= 0 ? "+" : ""}${entry.pnl.toFixed(2)}
                      </td>
                      <td className="py-2 px-2.5 text-right font-bold text-slate-200">
                        {entry.rMultiple >= 0 ? "+" : ""}
                        {entry.rMultiple.toFixed(2)}R
                      </td>
                      <td className="py-2 px-2.5 text-slate-400 text-[11px]">
                        {editingNoteId === entry.id ? (
                          <div className="flex items-center space-x-1">
                            <input
                              type="text"
                              value={noteText}
                              onChange={(e) => setNoteText(e.target.value)}
                              className="px-1.5 py-0.5 bg-[#121824] border border-[#1e293a] rounded text-slate-200 text-xs w-48"
                            />
                            <button
                              onClick={() => handleSaveNote(entry.id)}
                              className="text-emerald-400 text-[10px] hover:underline"
                            >
                              Save
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={() => {
                              setEditingNoteId(entry.id);
                              setNoteText(entry.notes);
                            }}
                            className="cursor-pointer hover:text-slate-200"
                            title="Click to edit notes"
                          >
                            {entry.notes || "Add note..."}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
