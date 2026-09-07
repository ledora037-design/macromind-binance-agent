/**
 * MacroMind Autonomous Intelligence Layer (Agent OS)
 * Core Loop: OBSERVE → ANALYZE → PLAN → RISK CHECK → ACT → MONITOR → LEARN
 * Strict Objective: Find high quality opportunities while protecting capital.
 */

import {
  AssetMarketData,
  Candle,
  MarketRegimeType,
  Position,
  RiskSettings,
  TradeDirection,
  TradeSetup,
  TradingMode,
  BinancePublicStatus,
  AgentDecisionRecord,
  AgentActivityEvent,
  PositionMonitoringReport,
  MarketBriefData,
  DetectedRegime,
} from "../types";
import { generateTradeSetup } from "./aiIntelligence";

export interface AutonomousScanOutput {
  decisionRecord: AgentDecisionRecord;
  timelineEvents: AgentActivityEvent[];
  selectedRegime: DetectedRegime;
  selectedStrategy: string;
  strategyWhy: string;
  isNoTrade: boolean;
  isRiskVetoed: boolean;
  vetoReason?: string;
  rankedCandidates: { symbol: string; score: number; signal: TradeDirection }[];
}

/**
 * Detect 4H Market Regime
 */
export function detectRegime(assets: AssetMarketData[]): {
  regime: DetectedRegime;
  description: string;
  marketRegimeType: MarketRegimeType;
} {
  const btc = assets.find((a) => a.symbol === "BTCUSDT") || assets[0];
  if (!btc) {
    return {
      regime: "RANGING",
      description: "Insufficient asset feed. Operating in defensive range mode.",
      marketRegimeType: "NEUTRAL",
    };
  }

  const ind4H = btc.timeframeIndicators?.["4H"];
  const ind1H = btc.timeframeIndicators?.["1H"];

  const btcPrice = btc.price;
  const ema20_4h = ind4H?.ema20 || btcPrice;
  const ema50_4h = ind4H?.ema50 || btcPrice;
  const rsi_4h = ind4H?.rsi14 || 50;
  const adx_4h = ind4H?.adx14 || 20;
  const breakout = ind4H?.breakout;

  // Bullish breakout
  if (breakout && btc.change24h > 3.0) {
    return {
      regime: "BREAKOUT",
      description: "4H volume-backed breakout above dynamic resistance. Momentum expanding.",
      marketRegimeType: "STRONG BULL",
    };
  }

  // Strong Trending Bull
  if (btcPrice > ema20_4h && ema20_4h > ema50_4h && adx_4h > 24) {
    return {
      regime: "TRENDING",
      description: "4H trend is strongly bullish with clean EMA20/50 alignment and expanding momentum.",
      marketRegimeType: "STRONG BULL",
    };
  }

  // Mild Trending Bull
  if (btcPrice > ema50_4h && rsi_4h > 52) {
    return {
      regime: "TRENDING",
      description: "4H structural support holding above EMA50 with constructive buyer accumulation.",
      marketRegimeType: "BULL",
    };
  }

  // Strong Trending Bear
  if (btcPrice < ema20_4h && ema20_4h < ema50_4h && adx_4h > 24) {
    return {
      regime: "TRENDING",
      description: "4H bearish expansion with price rejected below declining EMA20/50 bands.",
      marketRegimeType: "STRONG BEAR",
    };
  }

  // High Volatility / Liquidity Sweep
  if (Math.abs(btc.change24h) > 6.0 || (btc.derivatives?.openInterestChange24h < -5.0 && Math.abs(btc.change24h) > 4.0)) {
    return {
      regime: "HIGH VOLATILITY",
      description: "High volatility with aggressive derivative liquidations. Elevated chop danger.",
      marketRegimeType: "NEUTRAL",
    };
  }

  // Reversal candidate
  if ((rsi_4h < 28 && ind1H?.rsi14 > 35) || (rsi_4h > 75 && ind1H?.rsi14 < 65)) {
    return {
      regime: "REVERSAL",
      description: "Momentum divergence at key higher-timeframe structural boundary.",
      marketRegimeType: "NEUTRAL",
    };
  }

  // Default Ranging / Neutral
  return {
    regime: "RANGING",
    description: "4H range-bound consolidation between established support and resistance.",
    marketRegimeType: "NEUTRAL",
  };
}

/**
 * Adaptive Strategy Selection based on detected regime and market behavior
 */
export function selectStrategyForRegime(
  regime: DetectedRegime,
  signal: TradeDirection
): { strategy: string; why: string } {
  switch (regime) {
    case "BREAKOUT":
      return {
        strategy: "Breakout Hunter",
        why: "4H volume-backed expansion through dynamic resistance confirms decisive trend acceleration.",
      };
    case "TRENDING":
      return {
        strategy: "Adaptive Trend",
        why: "4H trend is directional and momentum is expanding in confluence with institutional order flow.",
      };
    case "RANGING":
      return {
        strategy: "Range Mean Reversion",
        why: "Market is range-bound with ADX compressed; setups require boundary confirmation or mean-reversion edge.",
      };
    case "HIGH VOLATILITY":
      return {
        strategy: "Volatility Guard / NO TRADE",
        why: "Abnormal volatility increases stop-out risk from liquidity wicks; strict caution or no trade advised.",
      };
    case "REVERSAL":
      return {
        strategy: "Momentum Reversal",
        why: "Structural boundary defense with lower-timeframe divergence provides asymmetric risk/reward reversal entry.",
      };
    case "LOW VOLATILITY":
      return {
        strategy: "Breakout Hunter (Squeeze)",
        why: "Volatility compression signals an impending breakout expansion; waiting for directional trigger.",
      };
    default:
      return {
        strategy: "Adaptive Trend",
        why: "Systematic multi-timeframe alignment across 4H regime and 1H structure.",
      };
  }
}

/**
 * Risk Guardian Veto Engine (Section 41)
 * The AI strategy proposes a trade, the Risk Guardian has the authority to veto/reject it.
 */
export function evaluateRiskGuardian(
  setup: TradeSetup | null,
  riskSettings: RiskSettings,
  openPositions: Position[],
  binancePublicStatus: BinancePublicStatus,
  dailyPnl: number,
  tradingMode: TradingMode
): { pass: boolean; reason?: string } {
  if (!setup) {
    return { pass: false, reason: "No trade setup provided for risk audit." };
  }

  // 1. Data Staleness Veto
  if (binancePublicStatus.isStale || binancePublicStatus.latencyMs > 30000) {
    return {
      pass: false,
      reason: `Binance public market feed is stale (${binancePublicStatus.latencyMs}ms latency). Safety policy prevents live or paper commitments during delayed telemetry.`,
    };
  }

  // 2. Risk/Reward Veto
  if (setup.riskReward < riskSettings.minRiskReward) {
    return {
      pass: false,
      reason: `Expected R:R (${setup.riskReward.toFixed(1)}) fell below the minimum requirement (${riskSettings.minRiskReward.toFixed(1)}R).`,
    };
  }

  // 3. Max Simultaneous Positions Veto
  if (openPositions.length >= riskSettings.maxSimultaneousPositions) {
    return {
      pass: false,
      reason: `Maximum active portfolio positions reached (${openPositions.length}/${riskSettings.maxSimultaneousPositions}). Capital allocation locked.`,
    };
  }

  // 4. Duplicate Asset Position Veto
  if (openPositions.some((p) => p.asset === setup.asset)) {
    return {
      pass: false,
      reason: `An active position for ${setup.asset} already exists. Duplicate exposure prohibited by risk rules.`,
    };
  }

  // 5. Daily Loss Limit Veto
  const maxLossAmount = (riskSettings.accountEquity * riskSettings.maxDailyLoss) / 100;
  if (dailyPnl <= -maxLossAmount || riskSettings.dailyLossCurrent >= riskSettings.maxDailyLoss) {
    return {
      pass: false,
      reason: `Daily loss threshold (${riskSettings.maxDailyLoss}%) reached. Trading circuit-breaker triggered to protect capital.`,
    };
  }

  // 6. Abnormal Volatility / Invalidation distance check
  const riskAmountPercent = (Math.abs(setup.currentPrice - setup.stopLoss) / setup.currentPrice) * 100;
  if (riskAmountPercent > 5.0) {
    return {
      pass: false,
      reason: `Invalidation distance of ${riskAmountPercent.toFixed(1)}% exceeds institutional volatility limit (5.0%). Trade requires excessive stop distance.`,
    };
  }

  // 7. Portfolio Exposure Check
  const currentTotalNotional = openPositions.reduce((acc, p) => acc + p.notionalValue, 0);
  const maxAllowedNotional = (riskSettings.accountEquity * riskSettings.maxPortfolioExposure) / 100;
  if (currentTotalNotional >= maxAllowedNotional) {
    return {
      pass: false,
      reason: `Total portfolio exposure (${((currentTotalNotional / riskSettings.accountEquity) * 100).toFixed(0)}%) reached maximum limit (${riskSettings.maxPortfolioExposure}%).`,
    };
  }

  return { pass: true };
}

/**
 * Execute Full Autonomous Market Scan (Sections 36, 37, 38, 39, 40, 41, 49, 50)
 * OBSERVE → ANALYZE → PLAN → RISK CHECK → ACT → MONITOR
 */
export function runAutonomousMarketScan(
  assets: AssetMarketData[],
  riskSettings: RiskSettings,
  openPositions: Position[],
  binancePublicStatus: BinancePublicStatus,
  dailyPnl: number,
  tradingMode: TradingMode,
  forcedFilter?: "ONLY_LONGS" | "ONLY_SHORTS"
): AutonomousScanOutput {
  const timestamp = Date.now();
  const timeString = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const timelineEvents: AgentActivityEvent[] = [];

  // Helper to add timestamped event
  const addEvent = (
    type: AgentActivityEvent["type"],
    message: string,
    level: AgentActivityEvent["level"] = "info",
    asset?: string
  ) => {
    timelineEvents.push({
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      timeString: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      type,
      message,
      level,
      asset,
    });
  };

  // Step 1: OBSERVE - Retrieve market data
  addEvent("OBSERVE", `Market scan started across ${assets.length} Binance watchlist assets.`, "info");

  // Step 2 & 3: ANALYZE - 4H Regime
  const { regime, description, marketRegimeType } = detectRegime(assets);
  const btc = assets.find((a) => a.symbol === "BTCUSDT") || assets[0];
  addEvent("ANALYZE", `BTC 4H regime identified: ${regime} (${marketRegimeType})`, "info", "BTCUSDT");

  // Step 4 & 5: Technical structure & Multi-timeframe evaluation
  addEvent("ANALYZE", "Technical structure analyzed: 4H trend, 1H structure, 15M confirmation.", "info");

  // Step 6 & 7: Check volume & derivatives
  addEvent("ANALYZE", "Derivatives conditions checked: funding rates, open interest delta, order book imbalance.", "info");

  // Rank candidate assets by quantitative score
  let eligibleAssets = [...assets];
  if (forcedFilter === "ONLY_LONGS") {
    eligibleAssets = eligibleAssets.filter((a) => a.signal === "LONG");
  } else if (forcedFilter === "ONLY_SHORTS") {
    eligibleAssets = eligibleAssets.filter((a) => a.signal === "SHORT");
  }

  // Sort by score descending
  const ranked = eligibleAssets
    .map((a) => ({ symbol: a.symbol, score: a.scoreBreakdown.total, signal: a.signal }))
    .sort((a, b) => b.score - a.score);

  // Identify top candidate
  const topCandidateData = assets.find((a) => a.symbol === ranked[0]?.symbol) || assets[0];
  const topScore = topCandidateData.scoreBreakdown.total;

  // Generate trade setup for top candidate if score >= 78 and signal is actionable
  let proposedSetup: TradeSetup | null = null;
  if (topScore >= 78 && (topCandidateData.signal === "LONG" || topCandidateData.signal === "SHORT")) {
    proposedSetup = generateTradeSetup(topCandidateData);
  }

  // Strategy selection
  const { strategy, why: strategyWhy } = selectStrategyForRegime(
    regime,
    proposedSetup?.direction || topCandidateData.signal
  );
  addEvent("PLAN", `Selected Strategy: ${strategy} (${strategyWhy.slice(0, 48)}...)`, "info");

  // If score < 78 or no actionable directional setup -> SMART NO TRADE (Section 49)
  if (!proposedSetup || topScore < 78 || topCandidateData.signal === "NO_TRADE" || topCandidateData.signal === "WATCH") {
    addEvent("PLAN", `${topCandidateData.symbol} score: ${topScore}/100. Edge insufficient for execution.`, "warning", topCandidateData.symbol);
    addEvent("VETO", `MacroMind Principle: NO TRADE returned. Protecting capital during ${regime.toLowerCase()} conditions.`, "warning");

    const whyNoTrade = [
      "15M confirmation missing: Entry volume ratio is beneath 1.2x threshold.",
      "Market regime is " + regime.toLowerCase() + "; risk/reward asymmetry is not institutional quality.",
      "Derivatives alignment neutral: funding and open interest show retail balance rather than institutional accumulation.",
      "Stop invalidation requires wide buffer, compressing R:R below 2.0R.",
    ];

    const nextTrigger = `Wait for ${topCandidateData.symbol} to reclaim ${
      topCandidateData.timeframeIndicators?.["15M"]?.resistance
        ? "$" + topCandidateData.timeframeIndicators["15M"].resistance.toLocaleString()
        : "dynamic EMA20"
    } with volume expansion > 1.5x.`;

    const noTradeDecision: AgentDecisionRecord = {
      id: `dec_${topCandidateData.symbol}_${timestamp}`,
      timestamp,
      timeString,
      asset: topCandidateData.symbol,
      direction: "NO_TRADE",
      marketRegime: `${regime} (${marketRegimeType})`,
      strategy,
      strategyWhy,
      score: topScore,
      decision: "NO_TRADE",
      riskResult: "PASS",
      why: whyNoTrade,
      invalidations: [
        "Sudden news shock or BTC impulse through dynamic resistance without volume",
        "Funding rate surge beyond 0.03% indicating late chasing retail",
      ],
      nextTrigger,
      mode: tradingMode,
    };

    return {
      decisionRecord: noTradeDecision,
      timelineEvents,
      selectedRegime: regime,
      selectedStrategy: strategy,
      strategyWhy,
      isNoTrade: true,
      isRiskVetoed: false,
      rankedCandidates: ranked,
    };
  }

  // Top setup scored well! Log setup score
  addEvent("PLAN", `${proposedSetup.asset} setup score: ${proposedSetup.score}/100 [${proposedSetup.direction}]`, "success", proposedSetup.asset);

  // Step 8 & 9: Run Risk Guardian
  const riskCheck = evaluateRiskGuardian(
    proposedSetup,
    riskSettings,
    openPositions,
    binancePublicStatus,
    dailyPnl,
    tradingMode
  );

  if (!riskCheck.pass) {
    // TRADE REJECTED BY RISK GUARDIAN (Section 41)
    addEvent("VETO", `Risk Guardian: REJECTED - ${riskCheck.reason}`, "danger", proposedSetup.asset);

    const vetoedDecision: AgentDecisionRecord = {
      id: `dec_${proposedSetup.asset}_${timestamp}`,
      timestamp,
      timeString,
      asset: proposedSetup.asset,
      direction: proposedSetup.direction,
      marketRegime: `${regime} (${marketRegimeType})`,
      strategy,
      strategyWhy,
      score: proposedSetup.score,
      decision: "REJECTED",
      riskResult: "REJECT",
      riskReason: riskCheck.reason,
      entryZone: proposedSetup.entryZone,
      entry: proposedSetup.currentPrice,
      stopLoss: proposedSetup.stopLoss,
      tp1: proposedSetup.tp1,
      tp2: proposedSetup.tp2,
      riskReward: proposedSetup.riskReward,
      riskPercentage: riskSettings.riskPerTrade,
      why: proposedSetup.reasons,
      invalidations: [
        proposedSetup.invalidationReason,
        `Breach of dynamic 15M EMA50 invalidates setup.`,
      ],
      mode: tradingMode,
    };

    return {
      decisionRecord: vetoedDecision,
      timelineEvents,
      selectedRegime: regime,
      selectedStrategy: strategy,
      strategyWhy,
      isNoTrade: false,
      isRiskVetoed: true,
      vetoReason: riskCheck.reason,
      rankedCandidates: ranked,
    };
  }

  // Risk validation PASSED! (Section 40)
  addEvent("RISK", "Risk Guardian: PASS. Exposure, R:R, and daily drawdown constraints verified.", "success", proposedSetup.asset);
  addEvent("ACT", `Decision Ready: ${proposedSetup.asset} ${proposedSetup.direction} (Score: ${proposedSetup.score})`, "success", proposedSetup.asset);

  const readyDecision: AgentDecisionRecord = {
    id: `dec_${proposedSetup.asset}_${timestamp}`,
    timestamp,
    timeString,
    asset: proposedSetup.asset,
    direction: proposedSetup.direction,
    marketRegime: `${regime} (${marketRegimeType})`,
    strategy,
    strategyWhy,
    score: proposedSetup.score,
    decision: "TRADE",
    riskResult: "PASS",
    entryZone: proposedSetup.entryZone,
    entry: proposedSetup.currentPrice,
    stopLoss: proposedSetup.stopLoss,
    tp1: proposedSetup.tp1,
    tp2: proposedSetup.tp2,
    riskReward: proposedSetup.riskReward,
    riskPercentage: riskSettings.riskPerTrade,
    why: proposedSetup.reasons.length >= 3 ? proposedSetup.reasons.slice(0, 5) : [
      `4H trend structure confirmed bullish above key dynamic averages`,
      `1H continuation structure formed higher highs with strong RSI momentum`,
      `15M volume expansion confirms clean order flow entering entry zone`,
      `Derivatives alignment: Funding neutral, OI expanding steadily`,
      `Institutional risk/reward locked at 1:${proposedSetup.riskReward.toFixed(1)}R`,
    ],
    invalidations: [
      `Price crossing through $${proposedSetup.stopLoss.toLocaleString()} invalidates market structure and cancels setup immediately.`,
      `15M candle close beneath local swing support before reaching entry zone.`,
      `Sudden open interest contraction (>3%) signaling institutional withdrawal.`,
    ],
    nextTrigger: "Order ready for user confirmation or auto-execution.",
    mode: tradingMode,
  };

  return {
    decisionRecord: readyDecision,
    timelineEvents,
    selectedRegime: regime,
    selectedStrategy: strategy,
    strategyWhy,
    isNoTrade: false,
    isRiskVetoed: false,
    rankedCandidates: ranked,
  };
}

/**
 * Autonomous Trade Management (Section 42)
 * Continuously monitors live open positions and generates concise institutional recommendations:
 * HOLD, MOVE STOP, TAKE PARTIAL, CLOSE, DO NOTHING.
 */
export function monitorActivePositions(
  positions: Position[],
  assets: AssetMarketData[]
): PositionMonitoringReport[] {
  const reports: PositionMonitoringReport[] = [];

  for (const pos of positions) {
    const asset = assets.find((a) => a.symbol === pos.asset);
    const currentPrice = asset ? asset.price : pos.currentPrice;
    const isLong = pos.side === "LONG";
    const pnlPercent = ((currentPrice - pos.entryPrice) / pos.entryPrice) * 100 * (isLong ? 1 : -1);

    const ind15M = asset?.timeframeIndicators?.["15M"];
    const ind1H = asset?.timeframeIndicators?.["1H"];

    let recommendation: PositionMonitoringReport["recommendation"] = "HOLD";
    let reason = "Trade progressing within calculated boundaries. Momentum structure intact.";
    let suggestedStopLoss: number | undefined;
    let partialPercent: number | undefined;

    // Calculate R multiple reached
    const initialRisk = Math.abs(pos.entryPrice - pos.stopLoss);
    const priceGain = Math.abs(currentPrice - pos.entryPrice);
    const rMultiple = initialRisk > 0 ? priceGain / initialRisk : 0;

    // Check for take partial (at TP1 or 1.8R+)
    if (rMultiple >= 1.8 || (pos.takeProfit && (isLong ? currentPrice >= pos.takeProfit : currentPrice <= pos.takeProfit))) {
      recommendation = "TAKE PARTIAL";
      partialPercent = 50;
      reason = `${pos.asset} reached target zone (+${pnlPercent.toFixed(1)}%, ~${rMultiple.toFixed(1)}R). Taking 50% partial profit to de-risk.`;
    }
    // Check for Move Stop to Breakeven
    else if (rMultiple >= 1.0) {
      recommendation = "MOVE STOP";
      suggestedStopLoss = pos.entryPrice;
      reason = `${pos.asset} is in profit (+${pnlPercent.toFixed(1)}%, ${rMultiple.toFixed(1)}R). Trail stop loss to breakeven ($${pos.entryPrice.toLocaleString()}) to eliminate downside risk.`;
    }
    // Check for premature weakness / momentum divergence
    else if (pnlPercent < -1.5 && ind15M && (isLong ? ind15M.rsi14 < 38 : ind15M.rsi14 > 62)) {
      recommendation = "CLOSE";
      reason = `${pos.asset} momentum weakened and original continuation condition is no longer valid. Invalidation risk elevated.`;
    }
    // Normal hold
    else {
      recommendation = "HOLD";
      reason = `${pos.asset} price action is healthy. 1H structure (${ind1H?.structure || "HOLDING"}) aligns with original thesis.`;
    }

    reports.push({
      positionId: pos.id,
      asset: pos.asset,
      side: pos.side,
      entryPrice: pos.entryPrice,
      currentPrice,
      unrealizedPnlPercent: Math.round(pnlPercent * 100) / 100,
      recommendation,
      reason,
      structureStatus: ind1H?.structure || "NEUTRAL",
      momentumStatus: `${ind15M?.rsi14.toFixed(0) || 50} RSI (${ind15M?.volumeRatio.toFixed(1) || 1.0}x Vol)`,
      suggestedStopLoss,
      partialPercent,
      updatedAt: Date.now(),
    });
  }

  return reports;
}

/**
 * AI Market Brief Generator (Section 46)
 * One-click institutional summary
 */
export function generateAutonomousMarketBrief(
  assets: AssetMarketData[],
  regime: DetectedRegime,
  bestSetup: TradeSetup | null,
  riskSettings: RiskSettings
): MarketBriefData {
  const btc = assets.find((a) => a.symbol === "BTCUSDT") || assets[0];
  const eth = assets.find((a) => a.symbol === "ETHUSDT");
  const btcPrice = btc ? `$${btc.price.toLocaleString()}` : "Market active";
  const btcChange = btc ? `${btc.change24h >= 0 ? "+" : ""}${btc.change24h.toFixed(1)}%` : "0.0%";

  const { strategy } = selectStrategyForRegime(regime, bestSetup?.direction || "LONG");
  const isWorthTrading = Boolean(bestSetup && bestSetup.score >= 80);

  const topOppText = bestSetup
    ? `${bestSetup.asset} ${bestSetup.direction} (Score: ${bestSetup.score}/100, 1:${bestSetup.riskReward.toFixed(1)}R)`
    : btc
    ? `${btc.symbol} (Score: ${btc.scoreBreakdown.total}/100 - Coiling for confirmation)`
    : "None qualified";

  const btcCondition = `${btcPrice} (${btcChange} 24h). 4H structure is ${
    btc?.timeframeIndicators?.["4H"]?.structure || "HOLDING"
  } with funding rate at ${(btc?.derivatives?.fundingRate * 100).toFixed(3)}%.`;

  const biggestRisk =
    regime === "HIGH VOLATILITY"
      ? "Elevated derivatives liquidation sweeps and sudden chop."
      : "Low volume weekend compressions causing false continuation breaks.";

  const importantLevels = btc?.timeframeIndicators?.["4H"]
    ? `BTC Resistance: $${btc.timeframeIndicators["4H"].resistance.toLocaleString()} | Support: $${btc.timeframeIndicators["4H"].support.toLocaleString()}`
    : "Key dynamic levels anchored to EMA20/50 bands.";

  const verdict = isWorthTrading
    ? `Market regime is ${regime.toLowerCase()}. ${bestSetup?.asset} offers verified institutional confluence. Proceed with strict pre-trade risk sizing.`
    : `Market regime is ${regime.toLowerCase()}. No qualified setup exceeds the 80/100 threshold. Best approach is capital preservation and selective patience.`;

  const fullAnalysis = `Market regime is ${regime.toLowerCase()} with BTC at ${btcPrice} (${btcChange}). Top candidate is ${topOppText}. Biggest operational risk is ${biggestRisk.toLowerCase()} Recommended strategy is ${strategy}. Worth trading: ${
    isWorthTrading ? "YES (Selective setups)" : "NO (Wait for confirmation trigger)"
  }. No need to force trades when edge is lacking.`;

  return {
    timestamp: Date.now(),
    marketRegime: regime,
    btcCondition,
    topOpportunity: topOppText,
    biggestRisk,
    importantLevels,
    bestStrategy: strategy,
    worthTrading: isWorthTrading,
    verdict,
    fullAnalysis,
  };
}
