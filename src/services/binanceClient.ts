/**
 * Client-Side Binance Gateway Service
 * Handles:
 * - Public real-time market data requests
 * - User exchange credentials connection
 * - Multi-user isolation via x-user-id header
 * - Order execution with verified responses
 * - Connection testing & health monitoring
 */

import {
  BinanceAccountInfo,
  BinancePublicStatus,
  Candle,
  DerivativesData,
  OrderBookData,
  RecentTrade,
  Timeframe,
} from "../types";

// Generate or retrieve persistent user identity for data isolation
export function getUserId(): string {
  let id = localStorage.getItem("macromind_user_id");
  if (!id) {
    id = "usr_" + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
    localStorage.setItem("macromind_user_id", id);
  }
  return id;
}

function getHeaders(customHeaders: Record<string, string> = {}): HeadersInit {
  return {
    "Content-Type": "application/json",
    "x-user-id": getUserId(),
    ...customHeaders,
  };
}

/* =========================================================================
   PUBLIC MARKET DATA APIS (No API Key Required)
   ========================================================================= */

export async function fetchBinanceTickers(symbols: string[]): Promise<any[]> {
  try {
    const query = encodeURIComponent(symbols.join(","));
    const res = await fetch(`/api/binance/public/tickers?symbols=${query}`, {
      headers: getHeaders(),
    });
    const json = await res.json();
    if (json.success && Array.isArray(json.data)) {
      return json.data;
    }
    return [];
  } catch (err) {
    console.error("fetchBinanceTickers error:", err);
    return [];
  }
}

export async function fetchBinanceKlines(
  symbol: string,
  timeframe: Timeframe = "1H",
  limit = 80
): Promise<Candle[]> {
  try {
    const intervalMap: Record<Timeframe, string> = {
      "15M": "15m",
      "1H": "1h",
      "4H": "4h",
      "1D": "1d",
    };
    const interval = intervalMap[timeframe] || "1h";
    const res = await fetch(
      `/api/binance/public/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`,
      { headers: getHeaders() }
    );
    const json = await res.json();
    if (json.success && Array.isArray(json.data) && json.data.length > 0) {
      return json.data;
    }
    return [];
  } catch (err) {
    console.error("fetchBinanceKlines error:", err);
    return [];
  }
}

export async function fetchBinanceDepth(symbol: string, limit = 20): Promise<OrderBookData | null> {
  try {
    const res = await fetch(`/api/binance/public/depth?symbol=${symbol}&limit=${limit}`, {
      headers: getHeaders(),
    });
    const json = await res.json();
    if (json.success && json.data) {
      return json.data;
    }
    return null;
  } catch (err) {
    console.error("fetchBinanceDepth error:", err);
    return null;
  }
}

export async function fetchBinanceDerivatives(symbol: string): Promise<Partial<DerivativesData> | null> {
  try {
    const res = await fetch(`/api/binance/public/derivatives?symbol=${symbol}`, {
      headers: getHeaders(),
    });
    const json = await res.json();
    if (json.success) {
      return {
        fundingRate: json.fundingRate,
        openInterest: json.openInterest,
        longShortRatio: json.longShortRatio,
        takerBuySellRatio: json.takerBuySellRatio,
      };
    }
    return null;
  } catch (err) {
    console.error("fetchBinanceDerivatives error:", err);
    return null;
  }
}

export async function fetchBinanceRecentTrades(symbol: string, limit = 20): Promise<RecentTrade[]> {
  try {
    const res = await fetch(`/api/binance/public/trades?symbol=${symbol}&limit=${limit}`, {
      headers: getHeaders(),
    });
    const json = await res.json();
    if (json.success && Array.isArray(json.data)) {
      return json.data;
    }
    return [];
  } catch (err) {
    console.error("fetchBinanceRecentTrades error:", err);
    return [];
  }
}

export async function fetchBinancePublicStatus(): Promise<BinancePublicStatus> {
  try {
    const res = await fetch("/api/binance/public/status", {
      headers: getHeaders(),
    });
    const json = await res.json();
    if (json.success) {
      return {
        isLive: json.isLive,
        lastUpdated: json.lastUpdated,
        latencyMs: json.latencyMs,
        isStale: json.isStale,
        serverTime: json.serverTime,
      };
    }
  } catch {
    // Return offline indicator
  }
  return {
    isLive: false,
    lastUpdated: 0,
    latencyMs: 0,
    isStale: true,
    serverTime: Date.now(),
  };
}

/* =========================================================================
   USER PRIVATE ACCOUNT APIS (Requires User Keys Saved on Encrypted Backend)
   ========================================================================= */

export async function connectBinanceUser(
  apiKey: string,
  secretKey: string,
  testnet = false
): Promise<{ success: boolean; message: string; accountInfo?: BinanceAccountInfo }> {
  try {
    const res = await fetch("/api/binance/user/connect", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ apiKey, secretKey, testnet }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, message: `Network error: ${err.message}` };
  }
}

export async function testBinanceUserConnection(): Promise<{
  success: boolean;
  message: string;
  data?: BinanceAccountInfo;
}> {
  try {
    const res = await fetch("/api/binance/user/test", {
      method: "POST",
      headers: getHeaders(),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, message: `Test network error: ${err.message}` };
  }
}

export async function getBinanceUserStatus(): Promise<BinanceAccountInfo> {
  try {
    const res = await fetch("/api/binance/user/status", {
      headers: getHeaders(),
    });
    const json = await res.json();
    if (json.success && json.data) {
      return json.data;
    }
  } catch {
    // Ignore
  }
  return {
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
  };
}

export async function disconnectBinanceUser(): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch("/api/binance/user/disconnect", {
      method: "POST",
      headers: getHeaders(),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function executeBinanceOrder(params: {
  symbol: string;
  side: "BUY" | "SELL";
  type: "MARKET" | "LIMIT" | "STOP_MARKET";
  quantity: number;
  price?: number;
  stopPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  reduceOnly?: boolean;
}): Promise<{
  success: boolean;
  orderId?: string | number;
  status: "PENDING" | "SUBMITTED" | "FILLED" | "PARTIALLY_FILLED" | "CANCELLED" | "FAILED";
  executedQty?: number;
  avgPrice?: number;
  message: string;
}> {
  try {
    const res = await fetch("/api/binance/user/order", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(params),
    });
    return await res.json();
  } catch (err: any) {
    return {
      success: false,
      status: "FAILED",
      message: `Order execution network error: ${err.message}`,
    };
  }
}

export async function cancelBinancePendingOrders(symbol?: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const res = await fetch("/api/binance/user/cancel-orders", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ symbol }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}
