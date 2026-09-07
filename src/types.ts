/**
 * MacroMind Trading Terminal - Type Definitions
 */

export type MarketRegimeType = "STRONG BULL" | "BULL" | "NEUTRAL" | "BEAR" | "STRONG BEAR";

export type TradingMode = "PAPER" | "MANUAL" | "AUTO";

export type TradeDirection = "LONG" | "SHORT" | "WATCH" | "NO_TRADE";

export type SetupConfidence = "Low" | "Medium" | "High" | "Exceptional";

export type ScoreClassification = "Exceptional" | "Strong" | "Watch" | "Weak" | "Avoid";

export type OrderStatus = "PENDING" | "SUBMITTED" | "FILLED" | "PARTIALLY_FILLED" | "CANCELLED" | "FAILED";

export type Timeframe = "15M" | "1H" | "4H" | "1D";

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TechnicalIndicators {
  ema20: number;
  ema50: number;
  rsi14: number;
  adx14: number;
  atr14: number;
  volumeSma20: number;
  volumeRatio: number; // current volume / volumeSma20
  support: number;
  resistance: number;
  breakout: boolean;
  breakdown: boolean;
  structure: "BULLISH_HH_HL" | "BEARISH_LH_LL" | "RANGE_BOUND";
}

export interface DerivativesData {
  fundingRate: number; // e.g. 0.0001 = 0.01%
  openInterest: number;
  openInterestChange24h: number; // percentage
  longShortRatio: number; // e.g. 1.25
  takerBuySellRatio: number; // e.g. 1.08
  orderBookImbalance: number; // -1.0 to 1.0 (positive = bid heavy)
}

export interface AssetMarketData {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  isFavorite?: boolean;
  derivatives: DerivativesData;
  timeframeIndicators: {
    "15M": TechnicalIndicators;
    "1H": TechnicalIndicators;
    "4H": TechnicalIndicators;
    "1D": TechnicalIndicators;
  };
  scoreBreakdown: {
    trend: number; // max 25
    momentum: number; // max 15
    volume: number; // max 15
    derivatives: number; // max 20
    marketStructure: number; // max 15
    riskQuality: number; // max 10
    total: number; // max 100
  };
  classification: ScoreClassification;
  signal: TradeDirection;
  whyNotReasons: string[];
}

export interface TradeSetup {
  id: string;
  asset: string;
  direction: TradeDirection;
  score: number;
  currentPrice: number;
  entryZone: [number, number]; // [low, high]
  stopLoss: number;
  invalidation: number;
  tp1: number;
  tp2: number;
  riskReward: number;
  positionSizeSuggestion: number;
  leverageSuggestion: number;
  confidence: SetupConfidence;
  setupType: string; // e.g., "Trend Continuation", "Breakout Hunter", etc.
  reasons: string[];
  invalidationReason: string;
  createdAt: number;
  whyItWorks?: string;
  keyRisks?: string;
  timeframe?: string;
}

export interface Position {
  id: string;
  asset: string;
  side: "LONG" | "SHORT";
  entryPrice: number;
  currentPrice: number;
  size: number; // in asset units
  notionalValue: number; // size * currentPrice
  marginUsed: number;
  leverage: number;
  stopLoss: number;
  takeProfit: number;
  tp2?: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  realizedPnl: number;
  riskReward: number;
  strategyName: string;
  openedAt: number;
  mode: TradingMode;
}

export interface TradeJournalEntry {
  id: string;
  date: string;
  timestamp: number;
  asset: string;
  direction: "LONG" | "SHORT";
  strategy: string;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  exitPrice: number;
  result: "WIN" | "LOSS" | "BREAKEVEN";
  pnl: number;
  pnlPercent: number;
  rMultiple: number;
  setupScore: number;
  marketRegime: MarketRegimeType;
  reasonForEntry: string;
  reasonForExit: string;
  notes: string;
  mode: TradingMode;
}

export type JournalEntry = TradeJournalEntry;

export interface RiskSettings {
  accountEquity: number;
  riskPerTrade: number; // percentage, e.g. 0.5%
  maxSimultaneousPositions: number; // e.g. 2
  maxDailyLoss: number; // percentage, e.g. 2%
  maxPortfolioExposure: number; // percentage, e.g. 50%
  minRiskReward: number; // e.g. 2.0
  defaultLeverage: number; // e.g. 2
  maxLeverage: number; // e.g. 5
  dailyLossCurrent: number; // tracks cumulative daily loss %
}

export interface StrategyRule {
  id: string;
  name: string;
  description: string;
  assets: string[];
  timeframes: Timeframe[];
  entryConditions: string[];
  exitConditions: string[];
  stopLossRule: string;
  takeProfitRule: string;
  risk: number; // %
  leverage: number;
  maxPositions: number;
  tradingMode: TradingMode;
  isActive: boolean;
  type: "Adaptive Trend" | "Breakout Hunter" | "Momentum Reversal" | "Trend Continuation" | "Custom";
}

export interface BacktestRequest {
  asset: string;
  strategyId: string;
  timeframe: Timeframe;
  dateRangeDays: number;
  initialCapital: number;
  riskPerTrade: number;
}

export interface BacktestResult {
  totalReturn: number;
  totalReturnPercent: number;
  winRate: number;
  profitFactor: number;
  maxDrawdown: number;
  averageR: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  sharpeRatio: number;
  largestWin: number;
  largestLoss: number;
  equityCurve: { time: string; equity: number }[];
}

export interface ExchangeConfig {
  exchange: "Binance" | "Bybit" | "OKX";
  apiKeyConfigured: boolean;
  isConnected: boolean;
  statusMessage: string;
  testnet: boolean;
}

export type BinanceConnectionStatus = "NOT_CONNECTED" | "CONNECTED" | "ERROR";

export interface BinanceAccountInfo {
  status: BinanceConnectionStatus;
  maskedApiKey: string;
  apiStatus: "Healthy" | "Degraded" | "Invalid";
  permissions: {
    read: boolean;
    spotTrading: boolean;
    futuresTrading: boolean;
    withdrawals: boolean;
  };
  totalWalletBalance: number;
  availableBalance: number;
  totalMarginUsed: number;
  totalUnrealizedProfit: number;
  openPositionsCount: number;
  lastSyncTimestamp: number;
  accountType: "FUTURES" | "SPOT";
  rawError?: string;
}

export interface BinancePublicStatus {
  isLive: boolean;
  lastUpdated: number;
  latencyMs: number;
  isStale: boolean;
  serverTime: number;
}

export interface OrderBookLevel {
  price: number;
  quantity: number;
}

export interface OrderBookData {
  symbol: string;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  timestamp: number;
}

export interface RecentTrade {
  id: number;
  price: number;
  qty: number;
  time: number;
  isBuyerMaker: boolean;
}

export interface MarketAlert {
  id: string;
  title: string;
  description: string;
  type: "REGIME" | "SETUP" | "RISK" | "BREAKOUT" | "PRICE";
  timestamp: number;
  read: boolean;
}

export type AgentDecisionType = "TRADE" | "WATCH" | "NO_TRADE" | "REJECTED" | "CLOSED";

export type DetectedRegime =
  | "TRENDING"
  | "RANGING"
  | "HIGH VOLATILITY"
  | "LOW VOLATILITY"
  | "BREAKOUT"
  | "REVERSAL";

export interface AgentDecisionRecord {
  id: string;
  timestamp: number;
  timeString: string;
  asset: string;
  direction: TradeDirection;
  marketRegime: string;
  strategy: string;
  strategyWhy: string;
  score: number;
  decision: AgentDecisionType;
  riskResult: "PASS" | "REJECT";
  riskReason?: string;
  entryZone?: [number, number];
  entry?: number;
  stopLoss?: number;
  tp1?: number;
  tp2?: number;
  riskReward?: number;
  riskPercentage?: number;
  why: string[];
  invalidations: string[];
  nextTrigger?: string;
  userAction?: "EXECUTED" | "DISMISSED" | "PAPER_SIMULATED" | "WAITING";
  executionResult?: string;
  mode: TradingMode;
}

export interface AgentActivityEvent {
  id: string;
  timestamp: number;
  timeString: string;
  type: "OBSERVE" | "ANALYZE" | "PLAN" | "RISK" | "ACT" | "MONITOR" | "VETO";
  message: string;
  asset?: string;
  level: "info" | "success" | "warning" | "danger";
}

export interface PositionMonitoringReport {
  positionId: string;
  asset: string;
  side: "LONG" | "SHORT";
  entryPrice: number;
  currentPrice: number;
  unrealizedPnlPercent: number;
  recommendation: "HOLD" | "MOVE STOP" | "TAKE PARTIAL" | "CLOSE" | "DO NOTHING";
  reason: string;
  structureStatus: string;
  momentumStatus: string;
  suggestedStopLoss?: number;
  partialPercent?: number;
  updatedAt: number;
}

export interface MarketBriefData {
  timestamp: number;
  marketRegime: string;
  btcCondition: string;
  topOpportunity: string;
  biggestRisk: string;
  importantLevels: string;
  bestStrategy: string;
  worthTrading: boolean;
  verdict: string;
  fullAnalysis: string;
}
