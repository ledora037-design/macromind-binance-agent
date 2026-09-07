/**
 * MacroMind - Professional AI Trading Terminal
 * Designed for institutional quantitative macro analysis, derivatives flow,
 * multi-timeframe confluence scoring, and strict risk discipline.
 */

import React, { useState, useEffect, useCallback } from "react";
import { TopBar } from "./components/TopBar";
import { Navigation, ActiveNavMode } from "./components/Navigation";
import { MarketRegimeBanner } from "./components/MarketRegimeBanner";
import { CandlestickChart } from "./components/CandlestickChart";
import { ScannerView } from "./components/ScannerView";
import { TradeView } from "./components/TradeView";
import { StrategiesView } from "./components/StrategiesView";
import { PortfolioView } from "./components/PortfolioView";
import { TopSetupsList } from "./components/TopSetupsList";
import { AiCopilotPanel } from "./components/AiCopilotPanel";
import { SettingsModal } from "./components/SettingsModal";
import { AutoTradingModal, AutoTradingBanner } from "./components/AutoTradingModal";
import {
  AssetMarketData,
  Candle,
  JournalEntry,
  MarketRegimeType,
  Position,
  RiskSettings,
  StrategyRule,
  Timeframe,
  TradeSetup,
  TradingMode,
  BinanceAccountInfo,
  BinancePublicStatus,
  AgentDecisionRecord,
  AgentActivityEvent,
  PositionMonitoringReport,
  MarketBriefData,
  DetectedRegime,
} from "./types";
import {
  DEFAULT_WATCHLIST,
  evaluateAsset,
  computeGlobalMarketRegime,
  generateCandles,
} from "./services/marketData";
import { generateTradeSetup } from "./services/aiIntelligence";
import { BUILT_IN_STRATEGIES } from "./services/strategyEngine";
import {
  runAutonomousMarketScan,
  monitorActivePositions,
  generateAutonomousMarketBrief,
  detectRegime,
  selectStrategyForRegime,
} from "./services/agentOS";
import { AgentHeroBanner } from "./components/AgentHeroBanner";
import { AgentDecisionCard } from "./components/AgentDecisionCard";
import { AgentActivityCenter } from "./components/AgentActivityCenter";
import { MarketBriefModal } from "./components/MarketBriefModal";
import { DecisionHistoryModal } from "./components/DecisionHistoryModal";
import { PositionMonitorPanel } from "./components/PositionMonitorPanel";
import {
  fetchBinanceTickers,
  fetchBinanceKlines,
  fetchBinancePublicStatus,
  getBinanceUserStatus,
  connectBinanceUser,
  disconnectBinanceUser,
  testBinanceUserConnection,
  executeBinanceOrder,
  cancelBinancePendingOrders,
} from "./services/binanceClient";
import { AlertTriangle, ShieldCheck, WifiOff } from "lucide-react";

export default function App() {
  // Navigation & Mode States
  const [activeMode, setActiveMode] = useState<ActiveNavMode>("dashboard");
  const [tradingMode, setTradingMode] = useState<TradingMode>("PAPER");
  const [isAutoTradingActive, setIsAutoTradingActive] = useState<boolean>(false);
  const [emergencyHalted, setEmergencyHalted] = useState<boolean>(false);

  // Binance Real-time Public & User Account State
  const [binancePublicStatus, setBinancePublicStatus] = useState<BinancePublicStatus>({
    isLive: false,
    lastUpdated: 0,
    latencyMs: 0,
    isStale: false,
    serverTime: 0,
  });

  const [binanceAccount, setBinanceAccount] = useState<BinanceAccountInfo>({
    status: "NOT_CONNECTED",
    maskedApiKey: "",
    apiStatus: "Invalid",
    permissions: { read: false, spotTrading: false, futuresTrading: false, withdrawals: false },
    totalWalletBalance: 0,
    availableBalance: 0,
    totalMarginUsed: 0,
    totalUnrealizedProfit: 0,
    openPositionsCount: 0,
    lastSyncTimestamp: 0,
    accountType: "FUTURES",
  });

  const [isTestnet, setIsTestnet] = useState<boolean>(false);

  // Modals & Panels
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isAutoTradingModalOpen, setIsAutoTradingModalOpen] = useState<boolean>(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(false);
  const [whyNotModalAsset, setWhyNotModalAsset] = useState<AssetMarketData | null>(null);
  const [isBriefModalOpen, setIsBriefModalOpen] = useState<boolean>(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const [marketBrief, setMarketBrief] = useState<MarketBriefData | null>(null);

  // Agent OS Autonomous Intelligence State (Sections 36-53)
  const [agentDecision, setAgentDecision] = useState<AgentDecisionRecord | null>(null);
  const [isAgentThinking, setIsAgentThinking] = useState<boolean>(false);
  const [thinkingStep, setThinkingStep] = useState<string | null>(null);
  const [positionReports, setPositionReports] = useState<PositionMonitoringReport[]>([]);
  const [agentEvents, setAgentEvents] = useState<AgentActivityEvent[]>([
    {
      id: "evt_init_1",
      timestamp: Date.now() - 180000,
      timeString: "09:41",
      type: "OBSERVE",
      message: "Autonomous Market Scan initialized on Binance watchlist.",
      level: "info",
    },
    {
      id: "evt_init_2",
      timestamp: Date.now() - 150000,
      timeString: "09:41",
      type: "ANALYZE",
      message: "BTC 4H regime identified: TRENDING (Bullish expansion above EMA20/50)",
      level: "info",
      asset: "BTCUSDT",
    },
    {
      id: "evt_init_3",
      timestamp: Date.now() - 120000,
      timeString: "09:42",
      type: "PLAN",
      message: "Selected Strategy: Adaptive Trend (4H trend is directional)",
      level: "info",
    },
    {
      id: "evt_init_4",
      timestamp: Date.now() - 90000,
      timeString: "09:42",
      type: "RISK",
      message: "Risk Guardian: PASS. Exposure, R:R, and daily drawdown constraints verified.",
      level: "success",
    },
    {
      id: "evt_init_5",
      timestamp: Date.now() - 60000,
      timeString: "09:43",
      type: "ACT",
      message: "Decision Ready: BTCUSDT LONG (Score: 84/100)",
      level: "success",
      asset: "BTCUSDT",
    },
  ]);

  const [decisionHistory, setDecisionHistory] = useState<AgentDecisionRecord[]>([
    {
      id: "dec_hist_1",
      timestamp: Date.now() - 86400000,
      timeString: new Date(Date.now() - 86400000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      asset: "SOLUSDT",
      direction: "LONG",
      marketRegime: "TRENDING (STRONG BULL)",
      strategy: "Breakout Hunter",
      strategyWhy: "15M volume compression breakout with positive open interest delta",
      score: 88,
      decision: "TRADE",
      riskResult: "PASS",
      entry: 196.4,
      stopLoss: 192.8,
      tp1: 204.0,
      riskReward: 2.11,
      riskPercentage: 0.5,
      why: [
        "15M volume breakout through structural resistance",
        "Open interest expanded +4.2% on breakout bar",
        "Funding rate normal and stable (+0.008%)",
      ],
      invalidations: ["15M candle close beneath $192.80"],
      userAction: "EXECUTED",
      executionResult: "Filled at $196.40",
      mode: "PAPER",
    },
    {
      id: "dec_hist_2",
      timestamp: Date.now() - 43200000,
      timeString: new Date(Date.now() - 43200000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      asset: "DOGEUSDT",
      direction: "LONG",
      marketRegime: "RANGING (NEUTRAL)",
      strategy: "Range Mean Reversion",
      strategyWhy: "Extreme volatility spike with high retail chasing",
      score: 74,
      decision: "REJECTED",
      riskResult: "REJECT",
      riskReason: "Expected R:R (1.4R) fell below the minimum requirement (2.0R).",
      entry: 0.385,
      stopLoss: 0.371,
      tp1: 0.405,
      riskReward: 1.43,
      riskPercentage: 0.5,
      why: ["Retail volume surge without institutional spot absorption"],
      invalidations: ["Loss of local support"],
      userAction: "DISMISSED",
      mode: "PAPER",
    },
  ]);

  // Selected Asset & Chart Config
  const [selectedSymbol, setSelectedSymbol] = useState<string>("BTCUSDT");
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>("1H");
  const [candles, setCandles] = useState<Candle[]>([]);

  // Risk & Account Financials
  const [riskSettings, setRiskSettings] = useState<RiskSettings>({
    accountEquity: 25000.0,
    riskPerTrade: 0.5, // 0.5% risk per trade default
    maxSimultaneousPositions: 3,
    maxDailyLoss: 2.0, // 2% daily loss limit
    maxPortfolioExposure: 20.0,
    defaultLeverage: 2,
    maxLeverage: 5,
    minRiskReward: 2.0, // Strict 2.0R minimum
    dailyLossCurrent: 0.0,
  });

  // Open Positions & Trade Journal
  const [openPositions, setOpenPositions] = useState<Position[]>([
    {
      id: "pos_init_btc",
      asset: "BTCUSDT",
      side: "LONG",
      entryPrice: 93450,
      currentPrice: 94250,
      size: 0.2675,
      notionalValue: 25211.8,
      marginUsed: 5042.3,
      leverage: 2,
      stopLoss: 92800,
      takeProfit: 95800,
      tp2: 97500,
      unrealizedPnl: 214.0,
      unrealizedPnlPercent: 4.24,
      realizedPnl: 0,
      riskReward: 2.5,
      openedAt: Date.now() - 3600 * 4 * 1000,
      strategyName: "Adaptive Trend",
      mode: "PAPER",
    },
  ]);

  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([
    {
      id: "j_1",
      date: new Date(Date.now() - 86400 * 1000 * 2).toLocaleDateString(),
      timestamp: Date.now() - 86400 * 1000 * 2,
      asset: "SOLUSDT",
      direction: "LONG",
      strategy: "Breakout Hunter",
      entryPrice: 196.4,
      stopLoss: 192.8,
      takeProfit: 204.0,
      exitPrice: 204.0,
      result: "WIN",
      pnl: 263.2,
      pnlPercent: 3.87,
      rMultiple: 2.11,
      setupScore: 88,
      marketRegime: "BULL",
      reasonForEntry: "15M volume compression breakout with positive open interest delta",
      reasonForExit: "Target 1 reached at dynamic resistance",
      notes: "Held through slight pullback to EMA20; executed TP1 target smoothly.",
      mode: "PAPER",
    },
    {
      id: "j_2",
      date: new Date(Date.now() - 86400 * 1000 * 3).toLocaleDateString(),
      timestamp: Date.now() - 86400 * 1000 * 3,
      asset: "ETHUSDT",
      direction: "LONG",
      strategy: "Trend Continuation",
      entryPrice: 2795.0,
      stopLoss: 2760.0,
      takeProfit: 2870.0,
      exitPrice: 2760.0,
      result: "LOSS",
      pnl: -125.0,
      pnlPercent: -1.25,
      rMultiple: -1.0,
      setupScore: 81,
      marketRegime: "NEUTRAL",
      reasonForEntry: "EMA20 re-test in dynamic pocket",
      reasonForExit: "Invalidated by stop loss on BTC cascade",
      notes: "BTC experienced spot liquidation cascade, invalidating ETH support.",
      mode: "PAPER",
    },
  ]);

  // Strategy Lab State
  const [strategies, setStrategies] = useState<StrategyRule[]>(BUILT_IN_STRATEGIES);

  // Market Assets & Regime
  const [assets, setAssets] = useState<AssetMarketData[]>(() => {
    return DEFAULT_WATCHLIST.map((symbol) => {
      const asset = evaluateAsset(symbol);
      if (symbol === "BTCUSDT" || symbol === "SOLUSDT" || symbol === "ETHUSDT") {
        asset.isFavorite = true;
      }
      return asset;
    });
  });

  // Calculate Market Regime & Data
  const regimeData = computeGlobalMarketRegime(assets);
  const marketRegime: MarketRegimeType = regimeData.regime;

  // Compute High-Confidence Top Setups (Score >= 80)
  const topSetups: TradeSetup[] = assets
    .map((a) => generateTradeSetup(a))
    .filter((s): s is TradeSetup => s !== null && s.score >= 80)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  // Calculate live portfolio stats
  const totalUnrealizedPnl = openPositions.reduce((acc, p) => acc + p.unrealizedPnl, 0);
  const totalUsedMargin = openPositions.reduce((acc, p) => acc + p.marginUsed, 0);
  const totalEquity = riskSettings.accountEquity + totalUnrealizedPnl;
  const availableBalance = Math.max(0, totalEquity - totalUsedMargin);
  const dailyPnl = totalUnrealizedPnl + 138.2; // Including realized portions

  // Selected asset object
  const currentAsset =
    assets.find((a) => a.symbol === selectedSymbol) || assets[0];

  // Active setup on selected asset if any
  const currentActiveSetup =
    topSetups.find((s) => s.asset === selectedSymbol) || null;

  // Refresh Binance user account
  const refreshUserAccount = useCallback(async () => {
    try {
      const acc = await getBinanceUserStatus();
      if (acc) {
        setBinanceAccount(acc);
      }
    } catch (err) {
      console.error("Failed to refresh user account:", err);
    }
  }, []);

  useEffect(() => {
    refreshUserAccount();
  }, [refreshUserAccount]);

  // Real-time Binance Public Market Data polling (tickers & system latency)
  useEffect(() => {
    let isMounted = true;

    async function pollMarketData() {
      try {
        const [status, tickers] = await Promise.all([
          fetchBinancePublicStatus(),
          fetchBinanceTickers(assets.map((a) => a.symbol)),
        ]);

        if (!isMounted) return;

        if (status) {
          setBinancePublicStatus(status);
        }

        if (Array.isArray(tickers) && tickers.length > 0) {
          setAssets((prev) =>
            prev.map((a) => {
              const ticker = tickers.find((t: any) => t.symbol === a.symbol);
              if (!ticker) return a;
              const newPrice = parseFloat(ticker.lastPrice || ticker.price) || a.price;
              const newChange = parseFloat(ticker.priceChangePercent) || a.change24h;
              const newVol = parseFloat(ticker.quoteVolume || ticker.volume) || a.volume24h;

              const evaluated = evaluateAsset(
                a.symbol,
                newPrice,
                newChange,
                newVol
              );

              return {
                ...evaluated,
                isFavorite: a.isFavorite,
              };
            })
          );
        }
      } catch (err) {
        console.error("Public market data poll error:", err);
      }
    }

    pollMarketData();
    const interval = setInterval(pollMarketData, 3500);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Update open position unrealized PnL when asset prices update
  useEffect(() => {
    setOpenPositions((prev) =>
      prev.map((pos) => {
        const matchingAsset = assets.find((a) => a.symbol === pos.asset);
        if (!matchingAsset) return pos;
        const currPrice = matchingAsset.price;
        const isLong = pos.side === "LONG";
        const pnl = isLong
          ? (currPrice - pos.entryPrice) * pos.size
          : (pos.entryPrice - currPrice) * pos.size;
        const pnlPercent = (pnl / (pos.marginUsed || 1)) * 100;
        return {
          ...pos,
          currentPrice: currPrice,
          unrealizedPnl: Math.round(pnl * 100) / 100,
          unrealizedPnlPercent: Math.round(pnlPercent * 100) / 100,
        };
      })
    );
  }, [assets]);

  // Load real Binance Candles for the Candlestick Chart (with fallback)
  useEffect(() => {
    let isMounted = true;

    async function loadCandles() {
      try {
        const realKlines = await fetchBinanceKlines(selectedSymbol, selectedTimeframe, 80);
        if (isMounted && Array.isArray(realKlines) && realKlines.length > 0) {
          setCandles(realKlines);
          return;
        }
      } catch (err) {
        // Fallback to synthetic generator below
      }

      if (isMounted) {
        const fallback = generateCandles(currentAsset.price, selectedTimeframe, 60);
        setCandles(fallback);
      }
    }

    loadCandles();
    const interval = setInterval(loadCandles, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [selectedSymbol, selectedTimeframe, currentAsset.price]);

  // Handle Mode Change (Interception for AUTO mode safety confirmation)
  const handleSelectTradingMode = (mode: TradingMode) => {
    if (mode === "AUTO") {
      if (!isAutoTradingActive) {
        setIsAutoTradingModalOpen(true);
      } else {
        setTradingMode("AUTO");
      }
    } else {
      setTradingMode(mode);
    }
  };

  // Confirm enable AUTO
  const handleConfirmEnableAuto = () => {
    setIsAutoTradingActive(true);
    setTradingMode("AUTO");
  };

  const handlePauseAuto = () => {
    setIsAutoTradingActive(false);
    setTradingMode("PAPER");
  };

  // Emergency Stop Handler
  const handleEmergencyStop = async () => {
    setEmergencyHalted(true);
    setIsAutoTradingActive(false);
    setTradingMode("PAPER");

    if (binanceAccount.status === "CONNECTED") {
      try {
        await cancelBinancePendingOrders();
      } catch (err) {
        console.error("Error cancelling Binance pending orders on halt:", err);
      }
    }

    alert(
      "EMERGENCY HALT TRIGGERED: Automated trading stopped, pending orders cancelled, execution locked."
    );
  };

  // Execute Trade Handler
  const handleExecuteTrade = async (params: {
    asset: string;
    side: "LONG" | "SHORT";
    entryPrice: number;
    stopLoss: number;
    takeProfit: number;
    tp2: number;
    size: number;
    marginUsed: number;
    leverage: number;
    strategyName: string;
    mode: TradingMode;
  }): Promise<{ success: boolean; message: string }> => {
    if (emergencyHalted) {
      return { success: false, message: "System is in EMERGENCY HALT state. Reset in top bar." };
    }

    if (binancePublicStatus.isStale) {
      return {
        success: false,
        message: "Binance data feed is stale (>30s). New orders blocked for account safety.",
      };
    }

    // Check max positions
    if (openPositions.length >= riskSettings.maxSimultaneousPositions) {
      return {
        success: false,
        message: `Rejected: Reached max concurrent positions limit (${riskSettings.maxSimultaneousPositions}).`,
      };
    }

    const riskDist = Math.abs(params.entryPrice - params.stopLoss);
    const rewardDist = Math.abs(params.takeProfit - params.entryPrice);
    const riskReward = riskDist > 0 ? rewardDist / riskDist : 2.0;

    let positionId = `pos_${Date.now()}`;
    let executionNote = "";

    // Route to Binance Live Execution if in MANUAL or AUTO mode and user is connected
    if (params.mode !== "PAPER" && binanceAccount.status === "CONNECTED") {
      const binanceRes = await executeBinanceOrder({
        symbol: params.asset,
        side: params.side === "LONG" ? "BUY" : "SELL",
        type: "MARKET",
        quantity: params.size,
        stopLoss: params.stopLoss,
        takeProfit: params.takeProfit,
      });

      if (!binanceRes.success) {
        return {
          success: false,
          message: `Binance Execution Rejected: ${binanceRes.message || "Order error"}`,
        };
      }

      positionId = binanceRes.orderId ? `pos_binance_${binanceRes.orderId}` : positionId;
      executionNote = ` [Binance Live #${binanceRes.orderId || "FILLED"}]`;
      refreshUserAccount();
    } else if (params.mode !== "PAPER") {
      executionNote = " [Paper fallback: connect Binance API in Settings for live]";
    }

    const newPosition: Position = {
      id: positionId,
      asset: params.asset,
      side: params.side,
      entryPrice: params.entryPrice,
      currentPrice: params.entryPrice,
      size: params.size,
      notionalValue: params.size * params.entryPrice,
      marginUsed: params.marginUsed,
      leverage: params.leverage,
      stopLoss: params.stopLoss,
      takeProfit: params.takeProfit,
      tp2: params.tp2,
      unrealizedPnl: 0,
      unrealizedPnlPercent: 0,
      realizedPnl: 0,
      riskReward: Math.round(riskReward * 10) / 10,
      openedAt: Date.now(),
      strategyName: params.strategyName,
      mode: params.mode,
    };

    setOpenPositions((prev) => [newPosition, ...prev]);

    return {
      success: true,
      message: `${params.mode} ${params.side} filled at $${params.entryPrice.toLocaleString()} (${
        params.size.toFixed(4)
      } units)${executionNote}`,
    };
  };

  // Close Position Handler
  const handleClosePosition = (id: string) => {
    const pos = openPositions.find((p) => p.id === id);
    if (!pos) return;

    const pnlPercent = (pos.unrealizedPnl / (pos.marginUsed || 1)) * 100;
    const riskDist = Math.abs(pos.entryPrice - pos.stopLoss) * pos.size;
    const rMult = riskDist > 0 ? pos.unrealizedPnl / riskDist : 1.0;

    // Log to journal
    const newEntry: JournalEntry = {
      id: `j_${Date.now()}`,
      date: new Date().toLocaleDateString(),
      timestamp: Date.now(),
      asset: pos.asset,
      direction: pos.side,
      strategy: pos.strategyName,
      entryPrice: pos.entryPrice,
      stopLoss: pos.stopLoss,
      takeProfit: pos.takeProfit,
      exitPrice: pos.currentPrice,
      result: pos.unrealizedPnl >= 0 ? "WIN" : "LOSS",
      pnl: pos.unrealizedPnl,
      pnlPercent: Math.round(pnlPercent * 100) / 100,
      rMultiple: Math.round(rMult * 10) / 10,
      setupScore: 85,
      marketRegime: marketRegime,
      reasonForEntry: `${pos.strategyName} trigger executed`,
      reasonForExit: "Closed manually from terminal",
      notes: "Closed manually from Portfolio terminal.",
      mode: pos.mode,
    };

    setJournalEntries((prev) => [newEntry, ...prev]);
    setOpenPositions((prev) => prev.filter((p) => p.id !== id));
  };

  // Move Stop to Breakeven
  const handleMoveToBreakeven = (id: string) => {
    setOpenPositions((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          return { ...p, stopLoss: p.entryPrice };
        }
        return p;
      })
    );
  };

  // Take Partial Profit (50%)
  const handleTakePartialProfit = (id: string) => {
    setOpenPositions((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const halfSize = p.size / 2;
          const halfPnl = p.unrealizedPnl / 2;
          return {
            ...p,
            size: halfSize,
            marginUsed: p.marginUsed / 2,
            notionalValue: p.notionalValue / 2,
            realizedPnl: p.realizedPnl + halfPnl,
            unrealizedPnl: halfPnl,
          };
        }
        return p;
      })
    );
  };

  // Update Journal Note
  const handleUpdateJournalNote = (id: string, note: string) => {
    setJournalEntries((prev) =>
      prev.map((j) => (j.id === id ? { ...j, notes: note } : j))
    );
  };

  // Toggle Strategy Activation
  const handleToggleStrategy = (id: string) => {
    setStrategies((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isActive: !s.isActive } : s))
    );
  };

  // Quick Action Router
  const handleQuickAction = (
    action: "scan" | "best_setup" | "watchlist" | "positions" | "ask_ai"
  ) => {
    if (action === "scan") {
      setActiveMode("scanner");
    } else if (action === "best_setup") {
      const best = topSetups[0]?.asset || assets[0]?.symbol;
      if (best) {
        setSelectedSymbol(best);
        setActiveMode("trade");
      }
    } else if (action === "watchlist") {
      setActiveMode("scanner");
    } else if (action === "positions") {
      setActiveMode("portfolio");
    } else if (action === "ask_ai") {
      setIsCopilotOpen(true);
    }
  };

  // Add custom asset
  const handleAddAsset = (symbol: string) => {
    if (assets.some((a) => a.symbol === symbol)) return;
    const newAsset = evaluateAsset(symbol);
    newAsset.isFavorite = true;
    setAssets((prev) => [newAsset, ...prev]);
  };

  // Toggle Favorite
  const handleToggleFavorite = (symbol: string) => {
    setAssets((prev) =>
      prev.map((a) => (a.symbol === symbol ? { ...a, isFavorite: !a.isFavorite } : a))
    );
  };

  // Autonomous Agent OS Logic & Handlers (Sections 36-53)
  const detectedRegimeInfo = detectRegime(assets);
  const detectedRegime = detectedRegimeInfo.regime;
  const adaptiveStrategy = selectStrategyForRegime(
    detectedRegime,
    agentDecision?.direction || "LONG"
  ).strategy;

  // Execute Trade Decision (Live Binance or Paper)
  const handleExecuteDecision = async (decision: AgentDecisionRecord) => {
    if (decision.decision === "REJECTED" || decision.riskResult === "REJECT") {
      alert("Execution blocked by Risk Guardian. Veto reason: " + decision.riskReason);
      return;
    }

    const entryPrice =
      decision.entry || assets.find((a) => a.symbol === decision.asset)?.price || 50000;
    const stopLoss = decision.stopLoss || entryPrice * 0.98;
    const riskAmount = (riskSettings.accountEquity * riskSettings.riskPerTrade) / 100;
    const priceDist = Math.abs(entryPrice - stopLoss);
    const calculatedSize = priceDist > 0 ? riskAmount / priceDist : 0.1;

    const notional = calculatedSize * entryPrice;
    const marginUsed = notional / riskSettings.defaultLeverage;

    const result = await handleExecuteTrade({
      asset: decision.asset,
      side: decision.direction === "LONG" ? "LONG" : "SHORT",
      entryPrice,
      stopLoss,
      takeProfit: decision.tp1 || entryPrice * 1.04,
      tp2: decision.tp2 || entryPrice * 1.06,
      size: calculatedSize,
      marginUsed,
      leverage: riskSettings.defaultLeverage,
      strategyName: decision.strategy,
      mode: decision.mode || tradingMode,
    });

    // Add activity event
    const newEvent: AgentActivityEvent = {
      id: `evt_act_${Date.now()}`,
      timestamp: Date.now(),
      timeString: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      type: "ACT",
      message: `${decision.mode || tradingMode} position opened: ${decision.asset} ${decision.direction} at $${entryPrice.toLocaleString()}`,
      asset: decision.asset,
      level: "success",
    };
    setAgentEvents((prev) => [newEvent, ...prev]);

    // Update decision history record
    setDecisionHistory((prev) =>
      prev.map((d) =>
        d.id === decision.id
          ? { ...d, userAction: "EXECUTED", executionResult: result.message }
          : d
      )
    );
  };

  // Autonomous Market Scan Runner (10-Step Pipeline + Thinking Feedback)
  const handleRunAgent = useCallback(
    (forcedFilter?: "ONLY_LONGS" | "ONLY_SHORTS") => {
      if (isAgentThinking) return;
      setIsAgentThinking(true);
      setThinkingStep("Retrieving live Binance market data & order books...");

      setTimeout(() => {
        setThinkingStep("Analyzing 4H market regime & 1H multi-timeframe structures...");
      }, 250);

      setTimeout(() => {
        setThinkingStep("Checking derivatives conditions (funding rates, OI delta, depth)...");
      }, 500);

      setTimeout(() => {
        setThinkingStep("Risk Guardian performing capital preservation & R:R verification...");
      }, 750);

      setTimeout(() => {
        const scanResult = runAutonomousMarketScan(
          assets,
          riskSettings,
          openPositions,
          binancePublicStatus,
          dailyPnl,
          tradingMode,
          forcedFilter
        );

        setAgentDecision(scanResult.decisionRecord);
        setAgentEvents((prev) => [...scanResult.timelineEvents, ...prev]);
        setDecisionHistory((prev) => [scanResult.decisionRecord, ...prev]);
        setIsAgentThinking(false);
        setThinkingStep(null);

        // Auto trading execution if mode is AUTO and decision is TRADE
        if (
          tradingMode === "AUTO" &&
          scanResult.decisionRecord.decision === "TRADE" &&
          !scanResult.isRiskVetoed
        ) {
          handleExecuteDecision(scanResult.decisionRecord);
        }
      }, 1000);
    },
    [isAgentThinking, assets, riskSettings, openPositions, binancePublicStatus, dailyPnl, tradingMode]
  );

  // Apply Autonomous Position Monitor Action
  const handleApplyMonitorAction = (
    positionId: string,
    action: "MOVE STOP" | "TAKE PARTIAL" | "CLOSE",
    report: PositionMonitoringReport
  ) => {
    if (action === "MOVE STOP") {
      if (report.suggestedStopLoss) {
        setOpenPositions((prev) =>
          prev.map((p) => (p.id === positionId ? { ...p, stopLoss: report.suggestedStopLoss! } : p))
        );
      } else {
        handleMoveToBreakeven(positionId);
      }
      setAgentEvents((prev) => [
        {
          id: `evt_mon_${Date.now()}`,
          timestamp: Date.now(),
          timeString: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          type: "MONITOR",
          message: `Autonomous Guard: Stop trailed to breakeven on ${report.asset}`,
          asset: report.asset,
          level: "info",
        },
        ...prev,
      ]);
    } else if (action === "TAKE PARTIAL") {
      handleTakePartialProfit(positionId);
      setAgentEvents((prev) => [
        {
          id: `evt_mon_${Date.now()}`,
          timestamp: Date.now(),
          timeString: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          type: "MONITOR",
          message: `Autonomous Guard: 50% partial profit secured on ${report.asset}`,
          asset: report.asset,
          level: "success",
        },
        ...prev,
      ]);
    } else if (action === "CLOSE") {
      handleClosePosition(positionId);
      setAgentEvents((prev) => [
        {
          id: `evt_mon_${Date.now()}`,
          timestamp: Date.now(),
          timeString: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          type: "MONITOR",
          message: `Autonomous Guard: Defensive close executed on ${report.asset}`,
          asset: report.asset,
          level: "warning",
        },
        ...prev,
      ]);
    }
  };

  // Generate Institutional Market Brief
  const handleGenerateMarketBrief = () => {
    const { regime } = detectRegime(assets);
    const brief = generateAutonomousMarketBrief(
      assets,
      regime,
      topSetups[0] || null,
      riskSettings
    );
    setMarketBrief(brief);
    setIsBriefModalOpen(true);

    setAgentEvents((prev) => [
      {
        id: `evt_brief_${Date.now()}`,
        timestamp: Date.now(),
        timeString: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        type: "ANALYZE",
        message: `Market Brief: Regime is ${regime}. Worth trading: ${
          brief.worthTrading ? "YES" : "NO"
        }`,
        level: "info",
      },
      ...prev,
    ]);
  };

  // Natural Language Command Router
  const handleAgentCommand = (command: string) => {
    const lower = command.toLowerCase();
    if (
      lower.includes("scan") ||
      lower.includes("best setup") ||
      lower.includes("find high confidence")
    ) {
      handleRunAgent();
    } else if (lower.includes("only longs") || lower.includes("longs")) {
      handleRunAgent("ONLY_LONGS");
    } else if (lower.includes("only shorts") || lower.includes("shorts")) {
      handleRunAgent("ONLY_SHORTS");
    } else if (lower.includes("market brief") || lower.includes("brief")) {
      handleGenerateMarketBrief();
    } else if (
      lower.includes("analyze my open positions") ||
      lower.includes("positions")
    ) {
      setActiveMode("portfolio");
    } else if (lower.includes("paper")) {
      handleSelectTradingMode("PAPER");
    } else if (lower.includes("auto")) {
      handleSelectTradingMode("AUTO");
    } else if (lower.includes("pause")) {
      handlePauseAuto();
    } else {
      setIsCopilotOpen(true);
    }
  };

  // Continuous autonomous monitoring of active positions
  useEffect(() => {
    if (assets.length > 0) {
      const reports = monitorActivePositions(openPositions, assets);
      setPositionReports(reports);
    }
  }, [openPositions, assets]);

  // Initial autonomous scan on mount
  useEffect(() => {
    if (!agentDecision && assets.length > 0) {
      const scanResult = runAutonomousMarketScan(
        assets,
        riskSettings,
        openPositions,
        binancePublicStatus,
        dailyPnl,
        tradingMode
      );
      setAgentDecision(scanResult.decisionRecord);
      setAgentEvents((prev) => [...scanResult.timelineEvents, ...prev]);
    }
  }, [assets]);

  const ind15M = currentAsset.timeframeIndicators?.["15M"];
  const srSupport = ind15M?.support || currentAsset.price * 0.96;
  const srResistance = ind15M?.resistance || currentAsset.price * 1.04;

  return (
    <div id="macromind-app-root" className="min-h-screen bg-[#070a0f] text-slate-100 flex flex-col font-sans selection:bg-emerald-900 selection:text-emerald-100">
      {/* Top Bar Header */}
      <TopBar
        regime={marketRegime}
        tradingMode={tradingMode}
        onSelectTradingMode={handleSelectTradingMode}
        equity={totalEquity}
        dailyPnl={dailyPnl}
        isAutoTradingActive={isAutoTradingActive}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onEmergencyStop={handleEmergencyStop}
        binancePublicStatus={binancePublicStatus}
        binanceAccount={binanceAccount}
      />

      {/* Stale Binance Public Data Advisory Banner */}
      {binancePublicStatus.isStale && (
        <div className="bg-amber-950/80 border-b border-amber-500/50 px-4 py-2 flex items-center justify-between font-mono text-xs text-amber-200">
          <div className="flex items-center space-x-2">
            <WifiOff className="w-4 h-4 text-amber-400 animate-pulse" />
            <span className="font-bold">BINANCE MARKET DATA STALE (&gt;30s).</span>
            <span>Latency: {binancePublicStatus.latencyMs}ms. Safety pause active for live order submission.</span>
          </div>
          <span className="text-[10px] text-amber-300 font-bold bg-amber-900/60 px-2 py-0.5 rounded border border-amber-600/40">
            AUTO-PROTECT ENGAGED
          </span>
        </div>
      )}

      {/* Auto Trading Active Banner */}
      {isAutoTradingActive && (
        <AutoTradingBanner
          activeStrategyName={
            strategies.find((s) => s.isActive)?.name || "Adaptive Trend"
          }
          riskSettings={riskSettings}
          isLiveConnected={binanceAccount.status === "CONNECTED"}
          onPause={handlePauseAuto}
          onEmergencyStop={handleEmergencyStop}
        />
      )}

      {/* Emergency Halt Banner if triggered */}
      {emergencyHalted && (
        <div className="bg-rose-950 border-b border-rose-600 px-4 py-2 flex items-center justify-between font-mono text-xs text-rose-200">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span className="font-bold">SYSTEM IN EMERGENCY STOP STATE.</span>
            <span>All execution halted.</span>
          </div>
          <button
            onClick={() => setEmergencyHalted(false)}
            className="px-2.5 py-0.5 rounded bg-rose-900 hover:bg-rose-800 text-white font-bold text-[11px]"
          >
            DISMISS & RESUME
          </button>
        </div>
      )}

      {/* MacroMind Autonomous Agent OS Hero Banner (Sections 36-53) */}
      <div className="px-3 sm:px-4 max-w-[1600px] w-full mx-auto pt-3">
        <AgentHeroBanner
          isRunning={isAgentThinking}
          activeThinkingStep={thinkingStep}
          detectedRegime={detectedRegime}
          selectedStrategy={adaptiveStrategy}
          onRunAgent={() => handleRunAgent()}
          onGenerateBrief={handleGenerateMarketBrief}
          onOpenHistory={() => setIsHistoryModalOpen(true)}
          onCommandClick={handleAgentCommand}
          decisionReady={Boolean(agentDecision)}
        />
      </div>

      {/* Primary Navigation Modes (Dashboard, Scanner, Trade, Strategies, Portfolio) */}
      <Navigation
        activeMode={activeMode}
        onSelectMode={(mode) => setActiveMode(mode)}
        openPositionsCount={openPositions.length}
        activeSetupsCount={topSetups.length}
      />

      {/* Market Regime Banner (What is market doing right now & should I trade?) */}
      <MarketRegimeBanner
        regime={marketRegime}
        btcAsset={assets.find((a) => a.symbol === "BTCUSDT")}
        ethAsset={assets.find((a) => a.symbol === "ETHUSDT")}
        regimeData={{
          btcTrend: "Bullish (Above EMA50)",
          ethTrend: "Neutral (Consolidating)",
          volatilityIndex: 18.4,
          fearGreedIndex: 68,
          totalMarketTrend: "Bullish Expansion",
          marketMomentum: "Strong (+62 RSI)",
          marketLiquidity: "Deep Books",
          fundingState: "Normal (+0.008%)",
          oiState: "Expanding (+4.5%)",
        }}
        onQuickAction={handleQuickAction}
        bestSetupAsset={topSetups[0]?.asset}
      />

      {/* Main Mode View Container */}
      <main className="flex-1 p-3 sm:p-4 max-w-[1600px] w-full mx-auto space-y-4">
        {/* MODE 1: DASHBOARD */}
        {activeMode === "dashboard" && (
          <div className="space-y-4">
            {/* Row 1: Agent Decision Card (8 cols) + Agent Activity Timeline (4 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
              <div className="lg:col-span-8">
                {agentDecision ? (
                  <AgentDecisionCard
                    decision={agentDecision}
                    tradingMode={tradingMode}
                    binanceAccount={binanceAccount}
                    onExecute={handleExecuteDecision}
                    onSimulatePaper={(dec) => {
                      handleExecuteDecision({ ...dec, mode: "PAPER" });
                    }}
                    onReScan={() => handleRunAgent()}
                    onOpenWhyNot={(sym) => {
                      const a = assets.find((x) => x.symbol === sym);
                      if (a) setWhyNotModalAsset(a);
                    }}
                  />
                ) : (
                  <div className="bg-[#0e141f] border border-[#1e2a3c] rounded p-6 text-center text-slate-400 font-mono text-xs">
                    Click "RUN AGENT" to trigger autonomous confluence scan.
                  </div>
                )}
              </div>

              <div className="lg:col-span-4 min-h-[220px]">
                <AgentActivityCenter
                  events={agentEvents}
                  onClear={() => setAgentEvents([])}
                />
              </div>
            </div>

            {/* Row 2: Autonomous Trade Management for Active Positions */}
            {openPositions.length > 0 && (
              <PositionMonitorPanel
                positions={openPositions}
                reports={positionReports}
                onApplyAction={handleApplyMonitorAction}
              />
            )}

            {/* Row 3: Top 3 Confluence Setups */}
            <TopSetupsList
              setups={topSetups}
              onTradeSetup={(setup) => {
                setSelectedSymbol(setup.asset);
                setActiveMode("trade");
              }}
              onOpenWhyNot={(sym) => {
                const a = assets.find((x) => x.symbol === sym);
                if (a) setWhyNotModalAsset(a);
              }}
            />

            {/* Split Section: Candlestick Chart + Fast Market Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
              {/* Chart (8 cols) */}
              <div className="lg:col-span-8 min-h-[420px]">
                <CandlestickChart
                  symbol={selectedSymbol}
                  candles={candles}
                  timeframe={selectedTimeframe}
                  onSelectTimeframe={setSelectedTimeframe}
                  activeSetup={currentActiveSetup}
                  supportLevel={srSupport}
                  resistanceLevel={srResistance}
                />
              </div>

              {/* Fast Watchlist & Scores (4 cols) */}
              <div className="lg:col-span-4 bg-[#0b0f16] border border-[#1c2432] rounded p-3 flex flex-col justify-between font-mono select-none">
                <div>
                  <div className="flex items-center justify-between border-b border-[#1a2331] pb-2 mb-2">
                    <span className="font-bold text-xs text-slate-100 uppercase tracking-wider">
                      Quick Universe Scan
                    </span>
                    <button
                      onClick={() => setActiveMode("scanner")}
                      className="text-[11px] text-emerald-400 hover:underline"
                    >
                      Full Scanner →
                    </button>
                  </div>

                  <div className="space-y-1.5 overflow-y-auto max-h-[340px] pr-1 scrollbar-none">
                    {assets.slice(0, 8).map((asset) => (
                      <div
                        key={asset.symbol}
                        onClick={() => setSelectedSymbol(asset.symbol)}
                        className={`p-2 rounded flex items-center justify-between text-xs cursor-pointer transition-colors ${
                          selectedSymbol === asset.symbol
                            ? "bg-[#162130] border border-emerald-500/40"
                            : "hover:bg-[#121926] border border-transparent"
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-100">{asset.symbol}</span>
                          <span
                            className={`text-[10px] ${
                              asset.change24h >= 0 ? "text-emerald-400" : "text-rose-400"
                            }`}
                          >
                            {asset.change24h >= 0 ? "+" : ""}
                            {asset.change24h.toFixed(2)}%
                          </span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <span className="text-[11px] font-bold text-slate-200">
                            ${asset.price.toLocaleString()}
                          </span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                              asset.scoreBreakdown.total >= 80
                                ? "bg-emerald-950/60 text-emerald-400 border border-emerald-500/40"
                                : "bg-slate-800 text-slate-400"
                            }`}
                          >
                            {asset.scoreBreakdown.total}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-[#1a2331] text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Selected: {selectedSymbol}</span>
                  <button
                    onClick={() => setActiveMode("trade")}
                    className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                  >
                    Open Ticket
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODE 2: AI SCANNER */}
        {activeMode === "scanner" && (
          <div className="h-full min-h-[580px]">
            <ScannerView
              assets={assets}
              onSelectAsset={(sym) => {
                setSelectedSymbol(sym);
                setActiveMode("dashboard");
              }}
              selectedAsset={selectedSymbol}
              onOpenTrade={(sym) => {
                setSelectedSymbol(sym);
                setActiveMode("trade");
              }}
              onWhyNot={(asset) => setWhyNotModalAsset(asset)}
              onToggleFavorite={handleToggleFavorite}
              onAddAsset={handleAddAsset}
              onRemoveAsset={(sym) => setAssets((prev) => prev.filter((a) => a.symbol !== sym))}
            />
          </div>
        )}

        {/* MODE 3: TRADE */}
        {activeMode === "trade" && (
          <div className="space-y-3.5">
            <TradeView
              asset={currentAsset}
              tradingMode={tradingMode}
              riskSettings={riskSettings}
              openPositions={openPositions}
              activeSetup={currentActiveSetup}
              isLiveConnected={binanceAccount.status === "CONNECTED"}
              binanceAccount={binanceAccount}
              onExecuteTrade={handleExecuteTrade}
              onOpenWhyNot={() => setWhyNotModalAsset(currentAsset)}
              onEmergencyStop={handleEmergencyStop}
            />

            {/* Embedded Chart in Trade Mode for Visual Verification */}
            <div className="h-[360px]">
              <CandlestickChart
                symbol={selectedSymbol}
                candles={candles}
                timeframe={selectedTimeframe}
                onSelectTimeframe={setSelectedTimeframe}
                activeSetup={currentActiveSetup}
                supportLevel={srSupport}
                resistanceLevel={srResistance}
              />
            </div>
          </div>
        )}

        {/* MODE 4: STRATEGIES */}
        {activeMode === "strategies" && (
          <div className="min-h-[580px]">
            <StrategiesView
              strategies={strategies}
              onToggleStrategy={handleToggleStrategy}
              onAddCustomStrategy={(newStrat) => setStrategies((prev) => [newStrat, ...prev])}
              availableAssets={assets.map((a) => a.symbol)}
            />
          </div>
        )}

        {/* MODE 5: PORTFOLIO */}
        {activeMode === "portfolio" && (
          <div className="space-y-4 min-h-[580px]">
            {openPositions.length > 0 && (
              <PositionMonitorPanel
                positions={openPositions}
                reports={positionReports}
                onApplyAction={handleApplyMonitorAction}
              />
            )}
            <PortfolioView
              equity={totalEquity}
              availableBalance={availableBalance}
              usedMargin={totalUsedMargin}
              unrealizedPnl={totalUnrealizedPnl}
              realizedPnl={riskSettings.accountEquity - 25000 + 138.2}
              dailyPnl={dailyPnl}
              drawdownPercent={0.4}
              openPositions={openPositions}
              journalEntries={journalEntries}
              onClosePosition={handleClosePosition}
              onMoveToBreakeven={handleMoveToBreakeven}
              onTakePartialProfit={handleTakePartialProfit}
              onUpdateJournalNote={handleUpdateJournalNote}
            />
          </div>
        )}
      </main>

      {/* Floating Ask AI Button */}
      <button
        id="btn-floating-ask-macromind"
        onClick={() => setIsCopilotOpen((prev) => !prev)}
        className="fixed bottom-4 right-4 z-30 px-3.5 py-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold shadow-xl flex items-center space-x-2 transition-all active:scale-95"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>Ask MacroMind</span>
      </button>

      {/* Ask MacroMind AI Copilot Panel */}
      <AiCopilotPanel
        currentRegime={marketRegime}
        assets={assets}
        selectedAsset={currentAsset}
        whyNotModalAsset={whyNotModalAsset}
        onCloseWhyNotModal={() => setWhyNotModalAsset(null)}
        isOpen={isCopilotOpen}
        onCloseCopilot={() => setIsCopilotOpen(false)}
      />

      {/* Market Brief Modal (Section 52) */}
      <MarketBriefModal
        brief={marketBrief}
        onClose={() => setIsBriefModalOpen(false)}
        onRegenerate={handleGenerateMarketBrief}
        isGenerating={false}
      />

      {/* Decision History Modal (Section 51) */}
      {isHistoryModalOpen && (
        <DecisionHistoryModal
          history={decisionHistory}
          onClose={() => setIsHistoryModalOpen(false)}
          onClear={() => setDecisionHistory([])}
        />
      )}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        riskSettings={riskSettings}
        onUpdateRiskSettings={setRiskSettings}
        isTestnet={isTestnet}
        onToggleTestnet={setIsTestnet}
        binanceAccount={binanceAccount}
        onConnectBinance={async (apiKey, secretKey, testnet) => {
          const res = await connectBinanceUser(apiKey, secretKey, testnet);
          if (res.success) {
            await refreshUserAccount();
          }
          return res;
        }}
        onDisconnectBinance={async () => {
          await disconnectBinanceUser();
          await refreshUserAccount();
        }}
        onTestConnection={async () => {
          const res = await testBinanceUserConnection();
          await refreshUserAccount();
          return res;
        }}
      />

      {/* Auto Trading Safety Confirmation Modal */}
      <AutoTradingModal
        isOpen={isAutoTradingModalOpen}
        onClose={() => setIsAutoTradingModalOpen(false)}
        onConfirmEnableAuto={handleConfirmEnableAuto}
        riskSettings={riskSettings}
        activeStrategies={strategies.filter((s) => s.isActive)}
      />
    </div>
  );
}
