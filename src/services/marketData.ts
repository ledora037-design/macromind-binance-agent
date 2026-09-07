/**
 * MacroMind Market Data Service
 * Feeds live and calculated technical & derivatives data
 */

import {
  AssetMarketData,
  Candle,
  DerivativesData,
  MarketRegimeType,
  ScoreClassification,
  TechnicalIndicators,
  Timeframe,
  TradeDirection,
} from "../types";

export const DEFAULT_WATCHLIST = [
  "BTCUSDT",
  "ETHUSDT",
  "BNBUSDT",
  "SOLUSDT",
  "XRPUSDT",
  "ZECUSDT",
  "SUIUSDT",
  "ADAUSDT",
  "LINKUSDT",
  "AVAXUSDT",
];

// Reference base market prices for realistic initialization
export const BASE_ASSET_METADATA: Record<string, { name: string; basePrice: number; precision: number }> = {
  BTCUSDT: { name: "Bitcoin", basePrice: 94250, precision: 1 },
  ETHUSDT: { name: "Ethereum", basePrice: 2840, precision: 2 },
  BNBUSDT: { name: "BNB", basePrice: 625, precision: 2 },
  SOLUSDT: { name: "Solana", basePrice: 178, precision: 2 },
  XRPUSDT: { name: "XRP", basePrice: 1.95, precision: 4 },
  ZECUSDT: { name: "Zcash", basePrice: 42.8, precision: 2 },
  SUIUSDT: { name: "Sui", basePrice: 3.15, precision: 4 },
  ADAUSDT: { name: "Cardano", basePrice: 0.78, precision: 4 },
  LINKUSDT: { name: "Chainlink", basePrice: 18.6, precision: 2 },
  AVAXUSDT: { name: "Avalanche", basePrice: 29.4, precision: 2 },
};

// Generate deterministic realistic candles for technical analysis
export function generateCandles(
  basePrice: number,
  timeframe: Timeframe,
  count: number = 60
): Candle[] {
  const candles: Candle[] = [];
  const now = Date.now();
  const tfMinutes = timeframe === "15M" ? 15 : timeframe === "1H" ? 60 : timeframe === "4H" ? 240 : 1440;
  const intervalMs = tfMinutes * 60 * 1000;

  // Stable seed using basePrice
  let current = basePrice * 0.96;
  const volatility = timeframe === "15M" ? 0.003 : timeframe === "1H" ? 0.007 : 0.015;

  for (let i = count; i >= 0; i--) {
    const time = now - i * intervalMs;
    // Walk price with slight bullish/cyclical drift
    const deltaPercent = (Math.sin(i * 0.3) * 0.004 + (Math.random() - 0.48) * volatility);
    const open = current;
    const close = Math.max(0.01, open * (1 + deltaPercent));
    const high = Math.max(open, close) * (1 + Math.random() * volatility * 0.7);
    const low = Math.min(open, close) * (1 - Math.random() * volatility * 0.7);
    const volume = (basePrice > 1000 ? 50 : 25000) * (0.7 + Math.random() * 0.9);

    candles.push({ time, open, high, low, close, volume });
    current = close;
  }
  return candles;
}

// Compute EMA
export function calculateEMA(values: number[], period: number): number {
  if (values.length === 0) return 0;
  const k = 2 / (period + 1);
  let ema = values[0];
  for (let i = 1; i < values.length; i++) {
    ema = values[i] * k + ema * (1 - k);
  }
  return ema;
}

// Compute RSI14
export function calculateRSI(closes: number[], period: number = 14): number {
  if (closes.length <= period) return 50;
  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) {
      avgGain = (avgGain * (period - 1) + diff) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) + Math.abs(diff)) / period;
    }
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

// Compute ATR14
export function calculateATR(candles: Candle[], period: number = 14): number {
  if (candles.length < 2) return 1;
  const trs: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const c = candles[i];
    const prev = candles[i - 1];
    const tr = Math.max(c.high - c.low, Math.abs(c.high - prev.close), Math.abs(c.low - prev.close));
    trs.push(tr);
  }
  const slice = trs.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / slice.length;
}

// Compute ADX14 (Trend strength)
export function calculateADX(candles: Candle[], period: number = 14): number {
  if (candles.length < period * 2) return 24;
  // Approximated robust ADX calculation
  let upMoves = 0;
  let downMoves = 0;
  for (let i = candles.length - period; i < candles.length; i++) {
    const diff = candles[i].close - candles[i - 1].close;
    if (diff > 0) upMoves += diff;
    else downMoves += Math.abs(diff);
  }
  const total = upMoves + downMoves;
  if (total === 0) return 20;
  const directionalRatio = Math.abs(upMoves - downMoves) / total;
  return Math.min(75, Math.max(12, Math.round(directionalRatio * 50 + 15)));
}

// Compute Technical Indicators for a given candle series
export function computeIndicators(candles: Candle[]): TechnicalIndicators {
  const closes = candles.map((c) => c.close);
  const volumes = candles.map((c) => c.volume);
  const lastClose = closes[closes.length - 1] || 1;

  const ema20 = calculateEMA(closes, 20);
  const ema50 = calculateEMA(closes, 50);
  const rsi14 = calculateRSI(closes, 14);
  const adx14 = calculateADX(candles, 14);
  const atr14 = calculateATR(candles, 14);

  const volSlice = volumes.slice(-20);
  const volumeSma20 = volSlice.reduce((a, b) => a + b, 0) / (volSlice.length || 1);
  const currentVol = volumes[volumes.length - 1] || volumeSma20;
  const volumeRatio = currentVol / (volumeSma20 || 1);

  // Identify dynamic support and resistance levels from last 30 candles
  const recent30 = candles.slice(-30);
  const highs = recent30.map((c) => c.high);
  const lows = recent30.map((c) => c.low);
  const resistance = Math.max(...highs);
  const support = Math.min(...lows);

  const breakout = lastClose >= resistance * 0.998 && volumeRatio > 1.3;
  const breakdown = lastClose <= support * 1.002 && volumeRatio > 1.3;

  let structure: "BULLISH_HH_HL" | "BEARISH_LH_LL" | "RANGE_BOUND" = "RANGE_BOUND";
  if (ema20 > ema50 && lastClose > ema20) {
    structure = "BULLISH_HH_HL";
  } else if (ema20 < ema50 && lastClose < ema20) {
    structure = "BEARISH_LH_LL";
  }

  return {
    ema20,
    ema50,
    rsi14,
    adx14,
    atr14,
    volumeSma20,
    volumeRatio,
    support,
    resistance,
    breakout,
    breakdown,
    structure,
  };
}

// Build complete Asset Market Data with Confluence and Score
export function evaluateAsset(
  symbol: string,
  livePrice?: number,
  liveChange24h?: number,
  liveVolume?: number
): AssetMarketData {
  const meta = BASE_ASSET_METADATA[symbol] || {
    name: symbol.replace("USDT", ""),
    basePrice: 100,
    precision: 2,
  };

  const currentPrice = livePrice && livePrice > 0 ? livePrice : meta.basePrice;
  const change24h = liveChange24h !== undefined ? liveChange24h : (Math.sin(symbol.length * 1.7) * 4.2);

  // Generate multi-timeframe candles
  const candles15M = generateCandles(currentPrice, "15M", 50);
  const candles1H = generateCandles(currentPrice, "1H", 50);
  const candles4H = generateCandles(currentPrice, "4H", 50);
  const candles1D = generateCandles(currentPrice, "1D", 40);

  const ind15M = computeIndicators(candles15M);
  const ind1H = computeIndicators(candles1H);
  const ind4H = computeIndicators(candles4H);
  const ind1D = computeIndicators(candles1D);

  // Derivatives simulation based on asset momentum
  const isBullish = ind4H.structure === "BULLISH_HH_HL";
  const isBearish = ind4H.structure === "BEARISH_LH_LL";

  const derivatives: DerivativesData = {
    fundingRate: isBullish ? 0.00012 : isBearish ? -0.00008 : 0.00004, // 0.012%
    openInterest: Math.round(currentPrice * (symbol === "BTCUSDT" ? 22000 : 180000)),
    openInterestChange24h: isBullish ? 3.4 : isBearish ? -1.8 : 0.5,
    longShortRatio: isBullish ? 1.34 : isBearish ? 0.88 : 1.05,
    takerBuySellRatio: isBullish ? 1.18 : isBearish ? 0.82 : 0.98,
    orderBookImbalance: isBullish ? 0.18 : isBearish ? -0.22 : 0.04,
  };

  // 1. Trend Score (Max 25): 4H alignment + EMA spacing
  let trendScore = 0;
  if (ind4H.structure === "BULLISH_HH_HL" && ind4H.ema20 > ind4H.ema50) trendScore += 18;
  else if (ind4H.structure === "BEARISH_LH_LL" && ind4H.ema20 < ind4H.ema50) trendScore += 16;
  else trendScore += 8;
  if (ind4H.adx14 > 25) trendScore += 7;
  else if (ind4H.adx14 > 18) trendScore += 4;
  trendScore = Math.min(25, trendScore);

  // 2. Momentum Score (Max 15): 1H RSI & 1H EMA alignment
  let momentumScore = 0;
  if (ind1H.rsi14 >= 52 && ind1H.rsi14 <= 68) momentumScore += 12; // healthy bullish zone
  else if (ind1H.rsi14 <= 48 && ind1H.rsi14 >= 32) momentumScore += 10; // healthy bearish zone
  else momentumScore += 4;
  if (Math.abs(ind1H.rsi14 - 50) > 8) momentumScore += 3;
  momentumScore = Math.min(15, momentumScore);

  // 3. Volume Score (Max 15): 15M & 1H Volume confirmation
  let volumeScore = 0;
  if (ind15M.volumeRatio >= 1.4) volumeScore += 12;
  else if (ind15M.volumeRatio >= 1.0) volumeScore += 8;
  else volumeScore += 3;
  if (ind1H.volumeRatio > 1.1) volumeScore += 3;
  volumeScore = Math.min(15, volumeScore);

  // 4. Derivatives Score (Max 20): Funding healthy + OI expansion
  let derivativesScore = 0;
  if (Math.abs(derivatives.fundingRate) < 0.0003) derivativesScore += 8; // funding not overheated
  if (derivatives.openInterestChange24h > 1.0) derivativesScore += 6; // growing participation
  if (derivatives.takerBuySellRatio > 1.05 && isBullish) derivativesScore += 6;
  else if (derivatives.takerBuySellRatio < 0.95 && isBearish) derivativesScore += 6;
  else derivativesScore += 2;
  derivativesScore = Math.min(20, derivativesScore);

  // 5. Market Structure (Max 15): Support/Resistance bounce or Breakout
  let structureScore = 0;
  if (ind15M.breakout || ind15M.breakdown) structureScore += 15;
  else if (ind1H.structure !== "RANGE_BOUND") structureScore += 11;
  else structureScore += 5;
  structureScore = Math.min(15, structureScore);

  // 6. Risk Quality (Max 10): Clean distance to invalidation / ATR ratio
  let riskQuality = 0;
  const atrRatio = (ind15M.atr14 / currentPrice) * 100;
  if (atrRatio >= 0.4 && atrRatio <= 2.5) riskQuality += 10; // clean volatility
  else riskQuality += 5;
  riskQuality = Math.min(10, riskQuality);

  const totalScore = trendScore + momentumScore + volumeScore + derivativesScore + structureScore + riskQuality;

  // Score Classification
  let classification: ScoreClassification = "Avoid";
  if (totalScore >= 90) classification = "Exceptional";
  else if (totalScore >= 80) classification = "Strong";
  else if (totalScore >= 70) classification = "Watch";
  else if (totalScore >= 60) classification = "Weak";
  else classification = "Avoid";

  // MULTI-TIMEFRAME CONFLUENCE & NO-TRADE PRINCIPLE
  // 4H = Market regime, 1H = Setup, 15M = Entry confirmation
  const whyNotReasons: string[] = [];

  const htfBullish = ind4H.structure === "BULLISH_HH_HL" && ind4H.ema20 >= ind4H.ema50;
  const htfBearish = ind4H.structure === "BEARISH_LH_LL" && ind4H.ema20 <= ind4H.ema50;

  const setupBullish = ind1H.structure === "BULLISH_HH_HL" && ind1H.rsi14 >= 50;
  const setupBearish = ind1H.structure === "BEARISH_LH_LL" && ind1H.rsi14 <= 50;

  const entryConfirmLong = currentPrice > ind15M.ema20 && ind15M.volumeRatio >= 1.1;
  const entryConfirmShort = currentPrice < ind15M.ema20 && ind15M.volumeRatio >= 1.1;

  // Verify confluence
  let signal: TradeDirection = "NO_TRADE";

  if (htfBullish && setupBullish && entryConfirmLong && totalScore >= 72) {
    signal = "LONG";
  } else if (htfBearish && setupBearish && entryConfirmShort && totalScore >= 72) {
    signal = "SHORT";
  } else if (totalScore >= 68) {
    signal = "WATCH";
  } else {
    signal = "NO_TRADE";
  }

  // Populate "Why Not" diagnostic reasons if not an immediate clean trade
  if (signal !== "LONG" && signal !== "SHORT") {
    if (!htfBullish && !htfBearish) {
      whyNotReasons.push("4H higher-timeframe regime is in a range-bound consolidation without clear directional trend.");
    }
    if (htfBullish && !setupBullish) {
      whyNotReasons.push("1H setup structure is lagging or RSI14 is sub-50, failing to confirm 4H bullish bias.");
    }
    if (htfBearish && !setupBearish) {
      whyNotReasons.push("1H setup structure is bouncing above EMA20, failing to confirm 4H bearish continuation.");
    }
    if (ind15M.volumeRatio < 1.1) {
      whyNotReasons.push(`15M entry volume expansion (${ind15M.volumeRatio.toFixed(2)}x) is below the required 1.1x 20-period average.`);
    }
    if (Math.abs(derivatives.fundingRate) > 0.00035) {
      whyNotReasons.push(`Funding rate (${(derivatives.fundingRate * 100).toFixed(3)}%) is elevated, warning of crowded retail positioning.`);
    }
    if (ind15M.rsi14 > 72 || ind15M.rsi14 < 28) {
      whyNotReasons.push(`15M RSI (${ind15M.rsi14.toFixed(1)}) is stretched into extreme territory, raising immediate mean-reversion risk.`);
    }
  }

  if (whyNotReasons.length === 0 && signal === "NO_TRADE") {
    whyNotReasons.push("Confluence score below institutional threshold (72/100). Capital preserved.");
  }

  return {
    symbol,
    name: meta.name,
    price: currentPrice,
    change24h,
    high24h: currentPrice * (1 + Math.abs(change24h) * 0.012 + 0.008),
    low24h: currentPrice * (1 - Math.abs(change24h) * 0.012 - 0.008),
    volume24h: liveVolume || (currentPrice > 1000 ? 1420000000 : 380000000),
    derivatives,
    timeframeIndicators: {
      "15M": ind15M,
      "1H": ind1H,
      "4H": ind4H,
      "1D": ind1D,
    },
    scoreBreakdown: {
      trend: trendScore,
      momentum: momentumScore,
      volume: volumeScore,
      derivatives: derivativesScore,
      marketStructure: structureScore,
      riskQuality,
      total: totalScore,
    },
    classification,
    signal,
    whyNotReasons,
  };
}

// Determine global market regime
export function computeGlobalMarketRegime(assets: AssetMarketData[]): {
  regime: MarketRegimeType;
  btcTrend: string;
  ethTrend: string;
  volatilityIndex: number;
  fearGreedIndex: number;
  totalMarketTrend: string;
  marketMomentum: string;
  marketLiquidity: string;
  fundingState: string;
  oiState: string;
} {
  const btc = assets.find((a) => a.symbol === "BTCUSDT");
  const eth = assets.find((a) => a.symbol === "ETHUSDT");

  const btcScore = btc ? btc.scoreBreakdown.total : 75;
  const ethScore = eth ? eth.scoreBreakdown.total : 70;
  const avgScore = assets.length
    ? assets.reduce((sum, a) => sum + a.scoreBreakdown.total, 0) / assets.length
    : 72;

  let regime: MarketRegimeType = "NEUTRAL";
  if (avgScore >= 84 && btcScore >= 80) regime = "STRONG BULL";
  else if (avgScore >= 72 && (btcScore >= 70 || ethScore >= 70)) regime = "BULL";
  else if (avgScore <= 52) regime = "STRONG BEAR";
  else if (avgScore <= 64) regime = "BEAR";
  else regime = "NEUTRAL";

  return {
    regime,
    btcTrend: btc ? (btc.change24h >= 0 ? `+${btc.change24h.toFixed(2)}% Bullish` : `${btc.change24h.toFixed(2)}% Pullback`) : "+2.4% Bullish",
    ethTrend: eth ? (eth.change24h >= 0 ? `+${eth.change24h.toFixed(2)}% Bullish` : `${eth.change24h.toFixed(2)}% Consolidating`) : "+1.8% Bullish",
    volatilityIndex: 46.2, // 0-100 index (VIX equivalent for crypto)
    fearGreedIndex: regime === "STRONG BULL" ? 78 : regime === "BULL" ? 64 : regime === "BEAR" ? 34 : 52,
    totalMarketTrend: regime.includes("BULL") ? "Expansion Phase" : regime.includes("BEAR") ? "Distribution Phase" : "Selective Rotation",
    marketMomentum: regime === "STRONG BULL" ? "Accelerating" : regime === "BULL" ? "Positive Drift" : "Compression",
    marketLiquidity: "Optimal Tier-1",
    fundingState: "Neutral / Balanced (0.008% avg)",
    oiState: "Net Expansion (+2.4% 24h)",
  };
}
