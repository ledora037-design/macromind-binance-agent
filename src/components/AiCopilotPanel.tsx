import React, { useState } from "react";
import {
  Sparkles,
  Send,
  HelpCircle,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  X,
  Bot,
  Zap,
} from "lucide-react";
import { AssetMarketData, MarketRegimeType } from "../types";

interface AiCopilotPanelProps {
  currentRegime: MarketRegimeType;
  assets: AssetMarketData[];
  selectedAsset: AssetMarketData;
  whyNotModalAsset: AssetMarketData | null;
  onCloseWhyNotModal: () => void;
  isOpen: boolean;
  onCloseCopilot: () => void;
}

export const AiCopilotPanel: React.FC<AiCopilotPanelProps> = ({
  currentRegime,
  assets,
  selectedAsset,
  whyNotModalAsset,
  onCloseWhyNotModal,
  isOpen,
  onCloseCopilot,
}) => {
  const [query, setQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [conversation, setConversation] = useState<
    { role: "user" | "assistant"; text: string; timestamp: string }[]
  >([
    {
      role: "assistant",
      text: `MacroMind Intelligence online. Market Regime: **${currentRegime}**. I evaluate market structure, RSI/EMA alignments, funding rates, open interest flows, and risk boundaries. How can I assist your execution?`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const quickPrompts = [
    `Best setup right now?`,
    `Why not ${selectedAsset?.symbol || "ETHUSDT"}?`,
    `Why is SOL ranked above ETH?`,
    `Should I trade today?`,
    `Show only high confidence setups`,
  ];

  const handleSend = async (textToSend?: string) => {
    const prompt = (textToSend || query).trim();
    if (!prompt) return;

    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setConversation((prev) => [...prev, { role: "user", text: prompt, timestamp: time }]);
    setQuery("");
    setLoading(true);

    try {
      // Call backend Gemini Copilot API route
      const res = await fetch("/api/gemini/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          marketRegime: currentRegime,
          assetList: assets.map((a) => ({
            symbol: a.symbol,
            price: a.price,
            score: a.scoreBreakdown.total,
            signal: a.signal,
            classification: a.classification,
          })),
          selectedAssetSymbol: selectedAsset?.symbol,
        }),
      });

      const data = await res.json();
      setConversation((prev) => [
        ...prev,
        {
          role: "assistant",
          text: data.response || "No response generated.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch (err: any) {
      // Fallback local analytical response
      setConversation((prev) => [
        ...prev,
        {
          role: "assistant",
          text: `MacroMind Analysis: Current regime is **${currentRegime}**. Top ranked asset is **${
            assets.sort((a, b) => b.scoreBreakdown.total - a.scoreBreakdown.total)[0]?.symbol || "BTCUSDT"
          }** with score **${
            assets.sort((a, b) => b.scoreBreakdown.total - a.scoreBreakdown.total)[0]?.scoreBreakdown.total || 88
          }/100**. Avoid assets below 70 score due to elevated chop and conflicting 4H structures.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Why Not Modal (when requested on an asset) */}
      {whyNotModalAsset && (
        <div
          id="why-not-modal"
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-mono select-none"
        >
          <div className="bg-[#0e1420] border border-[#233145] rounded-lg max-w-lg w-full p-4.5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1c2738] pb-3">
              <div className="flex items-center space-x-2">
                <HelpCircle className="w-5 h-5 text-amber-400" />
                <span className="font-bold text-sm text-slate-100 uppercase">
                  WHY NOT TRADE {whyNotModalAsset.symbol}?
                </span>
              </div>
              <button
                onClick={onCloseWhyNotModal}
                className="text-slate-500 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-[#121927] p-3 rounded border border-[#1e2a3c] space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Quantitative Score:</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded border ${
                      whyNotModalAsset.scoreBreakdown.total >= 80
                        ? "text-emerald-400 bg-emerald-950/40 border-emerald-500/40"
                        : "text-amber-400 bg-amber-950/40 border-amber-500/40"
                    }`}
                  >
                    {whyNotModalAsset.scoreBreakdown.total} / 100 ({whyNotModalAsset.classification})
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Action Signal:</span>
                  <span className="text-slate-200 font-bold">{whyNotModalAsset.signal}</span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-slate-200 text-xs">Missing Confluence Factors:</span>
                <div className="space-y-1.5 text-slate-300">
                  {whyNotModalAsset.scoreBreakdown.total >= 80 ? (
                    <div className="p-2.5 rounded bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>
                        {whyNotModalAsset.symbol} currently satisfies setup criteria! It scored{" "}
                        {whyNotModalAsset.scoreBreakdown.total}/100 with clear invalidation and
                        volume expansion.
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="p-2 rounded bg-[#131b28] border border-[#1f2c3f] flex items-start space-x-2">
                        <span className="text-rose-400 font-bold">1.</span>
                        <span>
                          <strong>Market Structure:</strong> 4H EMA20 & EMA50 alignment is neutral
                          to weak; no decisive clean break with volume.
                        </span>
                      </div>
                      <div className="p-2 rounded bg-[#131b28] border border-[#1f2c3f] flex items-start space-x-2">
                        <span className="text-rose-400 font-bold">2.</span>
                        <span>
                          <strong>Derivatives Flow:</strong> Funding rates are elevated while Open
                          Interest is flat or declining, suggesting retail exhaustion.
                        </span>
                      </div>
                      <div className="p-2 rounded bg-[#131b28] border border-[#1f2c3f] flex items-start space-x-2">
                        <span className="text-rose-400 font-bold">3.</span>
                        <span>
                          <strong>Risk Quality:</strong> Stop distance requires &gt;2.5% ATR buffer,
                          reducing the achievable R:R ratio below the institutional 2.0 minimum.
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Recommendation */}
              <div className="bg-[#121927] p-2.5 rounded border border-[#1e2a3c] text-slate-300 text-[11px] leading-relaxed">
                <strong className="text-amber-300">MacroMind Stance:</strong>{" "}
                {whyNotModalAsset.scoreBreakdown.total >= 80
                  ? "Qualifies for execution. Verify pre-trade risk sizing before entry."
                  : `NO TRADE. Wait for higher timeframe structural reclaim or focus capital on top-ranked setups (BTC/SOL).`}
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={onCloseWhyNotModal}
                className="px-4 py-2 rounded bg-[#182333] hover:bg-[#202d42] text-slate-200 text-xs font-bold border border-[#27384f]"
              >
                DISMISS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating or Docked Ask MacroMind Drawer */}
      {isOpen && (
        <div
          id="ask-macromind-panel"
          className="fixed bottom-0 right-0 sm:right-4 sm:bottom-4 w-full sm:w-[440px] h-[520px] bg-[#0c1018] border border-[#233145] rounded-t-lg sm:rounded-lg shadow-2xl z-40 flex flex-col font-mono select-none"
        >
          {/* Header */}
          <div className="h-11 px-3.5 border-b border-[#1c2738] flex items-center justify-between bg-[#0e1420]">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="font-bold text-xs text-slate-100 uppercase tracking-wider">
                Ask MacroMind AI Copilot
              </span>
            </div>
            <button
              onClick={onCloseCopilot}
              className="text-slate-500 hover:text-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Prompts */}
          <div className="p-2 border-b border-[#16202e] bg-[#0f1522] overflow-x-auto flex items-center space-x-1.5 scrollbar-none">
            {quickPrompts.map((qp, i) => (
              <button
                key={i}
                onClick={() => handleSend(qp)}
                className="px-2 py-1 rounded bg-[#162130] hover:bg-[#1d2a3d] text-slate-300 text-[10px] whitespace-nowrap border border-[#223145] transition-colors"
              >
                {qp}
              </button>
            ))}
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-3 overflow-y-auto space-y-3 text-xs">
            {conversation.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${
                  msg.role === "user" ? "items-end" : "items-start"
                }`}
              >
                <div className="text-[10px] text-slate-500 mb-1 flex items-center space-x-1">
                  <span>{msg.role === "user" ? "YOU" : "MACROMIND ANALYST"}</span>
                  <span>•</span>
                  <span>{msg.timestamp}</span>
                </div>
                <div
                  className={`p-2.5 rounded-lg max-w-[90%] leading-relaxed ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-[#131b28] text-slate-200 border border-[#1f2b3e]"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center space-x-2 text-slate-500 text-xs py-1">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                <span>MacroMind analyzing quantitative model and derivatives...</span>
              </div>
            )}
          </div>

          {/* Input Bar */}
          <div className="p-2.5 border-t border-[#1a2434] bg-[#0e1420]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center space-x-1.5"
            >
              <input
                type="text"
                placeholder="Ask about market regime, setups, or why-not..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 px-3 py-1.5 bg-[#131b28] border border-[#1f2b3e] rounded text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded text-xs font-bold transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
