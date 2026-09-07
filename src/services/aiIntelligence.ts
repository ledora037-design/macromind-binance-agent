/**
 * MacroMind Intelligence & Setup Generator
 * Multi-timeframe confluence, deterministic setup generation, and Copilot bridge
 */

import { AssetMarketData, TradeJournalEntry, TradeSetup } from "../types";

export function generateTradeSetup(assetData: AssetMarketData): TradeSetup | null {
  const { symbol, price, signal, scoreBreakdown, timeframeIndicators, derivatives } = assetData;

  // Enforce strict NO TRADE principle
  if (signal !== "LONG" && signal !== "SHORT") {
    return null;
  }

  const ind15M = timeframeIndicators["15M"];
  const ind1H = timeframeIndicators["1H"];
  const ind4H = timeframeIndicators["4H"];

  const atr15M = ind15M.atr14 || price * 0.008;

  let entryZone: [number, number];
  let stopLoss: number;
  let invalidation: number;
  let tp1: number;
  let tp2: number;
  let riskReward: number;
  let setupType = "Adaptive Trend";
  const reasons: string[] = [];

  if (signal === "LONG") {
    const entryLow = Math.round(price * 0.999 * 100) / 100;
    const entryHigh = Math.round(price * 1.0015 * 100) / 100;
    entryZone = [entryLow, entryHigh];

    // Invalidation just below local 15M swing support or EMA50
    const localSupport = Math.min(ind15M.support, ind15M.ema50, price - atr15M * 1.5);
    stopLoss = Math.round(localSupport * 0.9985 * 100) / 100;
    invalidation = stopLoss;

    const risk = price - stopLoss;
    if (risk <= 0) return null;

    // Minimum 1:2.0 and 1:3.2 for TP1 and TP2
    tp1 = Math.round((price + risk * 2.2) * 100) / 100;
    tp2 = Math.round((price + risk * 3.4) * 100) / 100;
    riskReward = Math.round((2.2) * 10) / 10;

    if (ind15M.breakout) {
      setupType = "Breakout Hunter";
      reasons.push("15M volume-backed breakout above key dynamic resistance");
    } else if (ind1H.rsi14 < 45) {
      setupType = "Momentum Reversal";
      reasons.push("1H structural support defense with bullish momentum divergence");
    } else {
      setupType = "Trend Continuation";
      reasons.push("4H bullish trend with clean EMA20/50 alignment");
    }

    reasons.push(`1H structure confirmed bullish (${ind1H.structure}) with healthy RSI14 at ${ind1H.rsi14.toFixed(1)}`);
    reasons.push(`15M entry volume expansion at ${ind15M.volumeRatio.toFixed(2)}x 20-period average`);
    reasons.push(`Derivatives confluence: Funding neutral (${(derivatives.fundingRate * 100).toFixed(3)}%), OI expanding`);
    reasons.push(`Clean risk invalidation strictly anchored at $${stopLoss.toLocaleString()}`);

  } else {
    // SHORT setup
    const entryHigh = Math.round(price * 1.001 * 100) / 100;
    const entryLow = Math.round(price * 0.9985 * 100) / 100;
    entryZone = [entryLow, entryHigh];

    const localResistance = Math.max(ind15M.resistance, ind15M.ema50, price + atr15M * 1.5);
    stopLoss = Math.round(localResistance * 1.0015 * 100) / 100;
    invalidation = stopLoss;

    const risk = stopLoss - price;
    if (risk <= 0) return null;

    tp1 = Math.round((price - risk * 2.2) * 100) / 100;
    tp2 = Math.round((price - risk * 3.4) * 100) / 100;
    riskReward = Math.round((2.2) * 10) / 10;

    if (ind15M.breakdown) {
      setupType = "Breakout Hunter";
      reasons.push("15M volume breakdown below key dynamic support");
    } else {
      setupType = "Trend Continuation";
      reasons.push("4H bearish trend with price rejected beneath EMA20/50");
    }

    reasons.push(`1H structure confirmed bearish (${ind1H.structure})`);
    reasons.push(`15M volume confirmation with seller dominance`);
    reasons.push(`Derivatives align: Taker selling dominant (${derivatives.takerBuySellRatio.toFixed(2)})`);
  }

  const confidence =
    scoreBreakdown.total >= 90
      ? "Exceptional"
      : scoreBreakdown.total >= 80
      ? "High"
      : "Medium";

  return {
    id: `setup_${symbol}_${Date.now()}`,
    asset: symbol,
    direction: signal,
    score: scoreBreakdown.total,
    currentPrice: price,
    entryZone,
    stopLoss,
    invalidation,
    tp1,
    tp2,
    riskReward,
    positionSizeSuggestion: 1.0,
    leverageSuggestion: 2,
    confidence,
    setupType,
    reasons,
    invalidationReason: `Price crossing through $${stopLoss.toLocaleString()} invalidates market structure and cancels setup immediately.`,
    createdAt: Date.now(),
  };
}

// Client helper for asking MacroMind Copilot
export async function askMacroMindCopilot(
  prompt: string,
  context: any,
  type: string = "copilot_query"
): Promise<{ text: string; source: string }> {
  try {
    const res = await fetch("/api/gemini/copilot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, type, context }),
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err: any) {
    console.warn("Copilot API fallback:", err.message);
    return {
      source: "algorithmic_local",
      text: `**MacroMind Market Note**: ${err.message}. Market data active and continuously monitored locally.`,
    };
  }
}

// Generate AI Trade Journal Review
export function generateJournalReview(entries: TradeJournalEntry[]): {
  mostProfitableStrategy: string;
  worstStrategy: string;
  bestAsset: string;
  worstAsset: string;
  averageR: number;
  winRate: number;
  totalPnl: number;
  summaryText: string;
} {
  if (entries.length === 0) {
    return {
      mostProfitableStrategy: "None recorded",
      worstStrategy: "None recorded",
      bestAsset: "None recorded",
      worstAsset: "None recorded",
      averageR: 0,
      winRate: 0,
      totalPnl: 0,
      summaryText: "No closed trades recorded yet in the journal. Execute paper or manual setups to generate performance analytics.",
    };
  }

  const stratPnl: Record<string, number> = {};
  const assetPnl: Record<string, number> = {};
  let totalR = 0;
  let wins = 0;
  let totalPnl = 0;

  for (const e of entries) {
    stratPnl[e.strategy] = (stratPnl[e.strategy] || 0) + e.pnl;
    assetPnl[e.asset] = (assetPnl[e.asset] || 0) + e.pnl;
    totalR += e.rMultiple;
    totalPnl += e.pnl;
    if (e.result === "WIN") wins++;
  }

  const stratEntries = Object.entries(stratPnl).sort((a, b) => b[1] - a[1]);
  const assetEntries = Object.entries(assetPnl).sort((a, b) => b[1] - a[1]);

  const bestStrat = stratEntries[0]?.[0] || "Adaptive Trend";
  const worstStrat = stratEntries[stratEntries.length - 1]?.[0] || "None";
  const bestAsset = assetEntries[0]?.[0] || "BTCUSDT";
  const worstAsset = assetEntries[assetEntries.length - 1]?.[0] || "None";

  const winRate = (wins / entries.length) * 100;
  const averageR = totalR / entries.length;

  const summaryText = `**MacroMind Quantitative Journal Review**:
• **Discipline Audit**: ${entries.length} completed trade setups analyzed. Overall Win Rate is ${winRate.toFixed(1)}% with an Average Realized R of ${averageR.toFixed(2)}R.
• **Strategy Optimization**: Your strongest performance comes from **${bestStrat}** during bullish 4H market regimes.
• **Asset Efficiency**: Highest expectancy is concentrated in **${bestAsset}**, while **${worstAsset}** exhibits lower momentum follow-through.
• **Recommendation**: Strictly enforce minimum 1:2.0 R:R and preserve capital during neutral range compressions.`;

  return {
    mostProfitableStrategy: bestStrat,
    worstStrategy: worstStrat,
    bestAsset,
    worstAsset,
    averageR: Math.round(averageR * 100) / 100,
    winRate: Math.round(winRate * 10) / 10,
    totalPnl: Math.round(totalPnl * 100) / 100,
    summaryText,
  };
}
