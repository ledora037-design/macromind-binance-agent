/**
 * MacroMind Binance Public Market Data Service
 * Provides direct, authenticated-free public Binance market data:
 * - Real-time prices & 24h stats
 * - 15M, 1H, 4H, and 1D candlesticks
 * - Order book depth (bids & asks)
 * - Funding rates & open interest
 * - Global Long/Short ratio & Taker buy/sell ratio
 * - Recent market trades
 * - Connection health & data freshness tracking
 */

export interface CachedItem<T> {
  data: T;
  timestamp: number;
}

const memoryCache = new Map<string, CachedItem<any>>();

let binancePublicLiveStatus = {
  isLive: false,
  lastUpdated: 0,
  latencyMs: 0,
  consecutiveFailures: 0,
};

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 4500): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "User-Agent": "MacroMind-Terminal/1.0",
        Accept: "application/json",
        ...(options.headers || {}),
      },
    });
    return res;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function getCachedOrFetch<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
  const cached = memoryCache.get(key);
  const now = Date.now();
  if (cached && now - cached.timestamp < ttlMs) {
    return cached.data;
  }

  const startTime = Date.now();
  try {
    const data = await fetcher();
    const latency = Date.now() - startTime;
    memoryCache.set(key, { data, timestamp: now });
    binancePublicLiveStatus = {
      isLive: true,
      lastUpdated: now,
      latencyMs: latency,
      consecutiveFailures: 0,
    };
    return data;
  } catch (err) {
    binancePublicLiveStatus.consecutiveFailures++;
    if (binancePublicLiveStatus.consecutiveFailures >= 3) {
      binancePublicLiveStatus.isLive = false;
    }
    if (cached) {
      return cached.data; // Serve cached data as fallback if available
    }
    throw err;
  }
}

/**
 * Fetch 24h tickers for selected symbols
 */
export async function getBinance24hTickers(symbols: string[]) {
  const cacheKey = `tickers_${symbols.sort().join("_")}`;
  return getCachedOrFetch(cacheKey, 2000, async () => {
    // Try Binance Spot first
    const res = await fetchWithTimeout("https://api.binance.com/api/v3/ticker/24hr");
    if (!res.ok) {
      // Try Futures fallback
      const fRes = await fetchWithTimeout("https://fapi.binance.com/fapi/v1/ticker/24hr");
      if (!fRes.ok) throw new Error(`Binance API error ${res.status}`);
      const raw = await fRes.json();
      return Array.isArray(raw) ? raw.filter((t: any) => symbols.includes(t.symbol)) : [];
    }
    const raw = await res.json();
    return Array.isArray(raw) ? raw.filter((t: any) => symbols.includes(t.symbol)) : [];
  });
}

/**
 * Fetch Candlesticks (klines) for specified interval (15m, 1h, 4h, 1d)
 */
export async function getBinanceKlines(symbol: string, interval: string = "1h", limit: number = 100) {
  const safeInterval = ["15m", "1h", "4h", "1d"].includes(interval.toLowerCase())
    ? interval.toLowerCase()
    : "1h";
  const safeLimit = Math.min(Math.max(10, limit), 250);
  const cacheKey = `klines_${symbol}_${safeInterval}_${safeLimit}`;

  return getCachedOrFetch(cacheKey, 3000, async () => {
    // Try spot klines
    let url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${safeInterval}&limit=${safeLimit}`;
    let res = await fetchWithTimeout(url);

    if (!res.ok) {
      // Fallback to USDT-M Futures klines
      url = `https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=${safeInterval}&limit=${safeLimit}`;
      res = await fetchWithTimeout(url);
      if (!res.ok) throw new Error(`Binance klines error: ${res.status}`);
    }

    const raw = await res.json();
    if (!Array.isArray(raw)) throw new Error("Invalid klines format from Binance");

    return raw.map((k: any) => ({
      time: Number(k[0]),
      open: parseFloat(k[1]),
      high: parseFloat(k[2]),
      low: parseFloat(k[3]),
      close: parseFloat(k[4]),
      volume: parseFloat(k[5]),
    }));
  });
}

/**
 * Fetch Order Book Depth (top bids & asks)
 */
export async function getBinanceOrderBook(symbol: string, limit: number = 20) {
  const cacheKey = `depth_${symbol}_${limit}`;
  return getCachedOrFetch(cacheKey, 2000, async () => {
    const url = `https://api.binance.com/api/v3/depth?symbol=${symbol}&limit=${limit}`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) throw new Error(`Binance depth error: ${res.status}`);
    const raw = await res.json();
    return {
      symbol,
      bids: (raw.bids || []).map((b: any) => ({ price: parseFloat(b[0]), quantity: parseFloat(b[1]) })),
      asks: (raw.asks || []).map((a: any) => ({ price: parseFloat(a[0]), quantity: parseFloat(a[1]) })),
      timestamp: Date.now(),
    };
  });
}

/**
 * Fetch Derivatives Data: Funding rate, Open Interest, Long/Short ratio, Taker ratio
 */
export async function getBinanceDerivatives(symbol: string) {
  const cacheKey = `derivatives_full_${symbol}`;
  return getCachedOrFetch(cacheKey, 5000, async () => {
    const [premiumRes, oiRes, lsRes, takerRes] = await Promise.allSettled([
      fetchWithTimeout(`https://fapi.binance.com/fapi/v1/premiumIndex?symbol=${symbol}`),
      fetchWithTimeout(`https://fapi.binance.com/fapi/v1/openInterest?symbol=${symbol}`),
      fetchWithTimeout(`https://fapi.binance.com/futures/data/globalLongShortAccountRatio?symbol=${symbol}&period=5m&limit=1`),
      fetchWithTimeout(`https://fapi.binance.com/futures/data/takerlongshortRatio?symbol=${symbol}&period=5m&limit=1`),
    ]);

    let fundingRate = 0.0001; // default 0.01%
    let openInterest = 0;
    let longShortRatio = 1.0;
    let takerBuySellRatio = 1.0;

    if (premiumRes.status === "fulfilled" && premiumRes.value.ok) {
      const p = await premiumRes.value.json();
      if (p && p.lastFundingRate !== undefined) {
        fundingRate = parseFloat(p.lastFundingRate);
      }
    }

    if (oiRes.status === "fulfilled" && oiRes.value.ok) {
      const oi = await oiRes.value.json();
      if (oi && oi.openInterest) {
        openInterest = parseFloat(oi.openInterest);
      }
    }

    if (lsRes.status === "fulfilled" && lsRes.value.ok) {
      const ls = await lsRes.value.json();
      if (Array.isArray(ls) && ls.length > 0 && ls[0].longShortRatio) {
        longShortRatio = parseFloat(ls[0].longShortRatio);
      }
    }

    if (takerRes.status === "fulfilled" && takerRes.value.ok) {
      const taker = await takerRes.value.json();
      if (Array.isArray(taker) && taker.length > 0 && taker[0].buySellRatio) {
        takerBuySellRatio = parseFloat(taker[0].buySellRatio);
      }
    }

    return {
      symbol,
      fundingRate,
      openInterest,
      longShortRatio,
      takerBuySellRatio,
      timestamp: Date.now(),
    };
  });
}

/**
 * Fetch Recent Trades
 */
export async function getBinanceRecentTrades(symbol: string, limit: number = 20) {
  const cacheKey = `trades_${symbol}_${limit}`;
  return getCachedOrFetch(cacheKey, 2000, async () => {
    const url = `https://api.binance.com/api/v3/trades?symbol=${symbol}&limit=${limit}`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) throw new Error(`Binance trades error: ${res.status}`);
    const raw = await res.json();
    return (raw || []).map((t: any) => ({
      id: t.id,
      price: parseFloat(t.price),
      qty: parseFloat(t.qty),
      time: t.time,
      isBuyerMaker: t.isBuyerMaker,
    }));
  });
}

/**
 * Get Binance Public Health Status
 */
export function getBinancePublicStatus() {
  const now = Date.now();
  const isStale = now - binancePublicLiveStatus.lastUpdated > 30000;
  return {
    isLive: binancePublicLiveStatus.isLive && !isStale,
    lastUpdated: binancePublicLiveStatus.lastUpdated,
    latencyMs: binancePublicLiveStatus.latencyMs,
    isStale,
    serverTime: now,
  };
}
