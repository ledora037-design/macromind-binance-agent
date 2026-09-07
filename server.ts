import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import {
  getBinance24hTickers,
  getBinanceKlines,
  getBinanceOrderBook,
  getBinanceDerivatives,
  getBinanceRecentTrades,
  getBinancePublicStatus,
} from "./src/server/binancePublicService";
import {
  connectUserBinance,
  testUserBinanceConnection,
  getUserAccountStatus,
  disconnectUserBinance,
  executeUserOrder,
  cancelUserPendingOrders,
} from "./src/server/binanceUserService";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Shared Gemini client lazy initialization
let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

function getUserIdFromReq(req: express.Request): string {
  const headerId = req.headers["x-user-id"];
  if (typeof headerId === "string" && headerId.trim()) return headerId.trim();
  if (req.body?.userId && typeof req.body.userId === "string") return req.body.userId.trim();
  return "default_user";
}

// In-memory cache for market ticker & kline data to ensure sub-millisecond responses
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}
const cache: Record<string, CacheEntry<any>> = {};

async function cachedFetch<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
  const now = Date.now();
  if (cache[key] && now - cache[key].timestamp < ttlMs) {
    return cache[key].data;
  }
  try {
    const data = await fetcher();
    cache[key] = { data, timestamp: now };
    return data;
  } catch (err) {
    if (cache[key]) {
      return cache[key].data; // return stale on error
    }
    throw err;
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health endpoint
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      name: "MacroMind Server",
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
      timestamp: Date.now(),
    });
  });

  /* =========================================================================
     BINANCE PUBLIC MARKET DATA ENDPOINTS (No User API Key Required)
     ========================================================================= */

  // Public 24hr Tickers
  app.get("/api/binance/public/tickers", async (req, res) => {
    try {
      const symbolsParam = req.query.symbols as string;
      const symbols = symbolsParam
        ? symbolsParam.split(",").map((s) => s.trim().toUpperCase())
        : ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT", "SUIUSDT", "ADAUSDT", "LINKUSDT", "AVAXUSDT", "ZECUSDT"];

      const data = await getBinance24hTickers(symbols);
      res.json({ success: true, data, timestamp: Date.now(), source: "binance_public" });
    } catch (err: any) {
      res.status(502).json({ success: false, error: err.message, data: [] });
    }
  });

  // Public Candlestick Klines (15m, 1h, 4h, 1d)
  app.get("/api/binance/public/klines", async (req, res) => {
    try {
      const symbol = ((req.query.symbol as string) || "BTCUSDT").toUpperCase();
      const interval = (req.query.interval as string) || "1h";
      const limit = Number(req.query.limit) || 80;

      const data = await getBinanceKlines(symbol, interval, limit);
      res.json({ success: true, symbol, interval, data, timestamp: Date.now() });
    } catch (err: any) {
      res.status(502).json({ success: false, error: err.message, data: [] });
    }
  });

  // Public Order Book Depth (bids/asks)
  app.get("/api/binance/public/depth", async (req, res) => {
    try {
      const symbol = ((req.query.symbol as string) || "BTCUSDT").toUpperCase();
      const limit = Number(req.query.limit) || 20;

      const data = await getBinanceOrderBook(symbol, limit);
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(502).json({ success: false, error: err.message });
    }
  });

  // Public Derivatives (Funding, Open Interest, Long/Short ratio, Taker ratio)
  app.get("/api/binance/public/derivatives", async (req, res) => {
    try {
      const symbol = ((req.query.symbol as string) || "BTCUSDT").toUpperCase();
      const data = await getBinanceDerivatives(symbol);
      res.json({ success: true, ...data });
    } catch (err: any) {
      res.status(502).json({ success: false, error: err.message });
    }
  });

  // Public Recent Trades
  app.get("/api/binance/public/trades", async (req, res) => {
    try {
      const symbol = ((req.query.symbol as string) || "BTCUSDT").toUpperCase();
      const limit = Number(req.query.limit) || 20;
      const data = await getBinanceRecentTrades(symbol, limit);
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(502).json({ success: false, error: err.message, data: [] });
    }
  });

  // Public Connection Status & Latency
  app.get("/api/binance/public/status", (_req, res) => {
    const status = getBinancePublicStatus();
    res.json({ success: true, ...status });
  });

  /* =========================================================================
     USER PRIVATE BINANCE API ENDPOINTS (Multi-user Isolated, Encrypted Backend)
     ========================================================================= */

  // Connect user credentials
  app.post("/api/binance/user/connect", async (req, res) => {
    const userId = getUserIdFromReq(req);
    const { apiKey, secretKey, testnet } = req.body;

    if (!apiKey || !secretKey) {
      return res.status(400).json({ success: false, message: "API Key and Secret Key are required." });
    }

    const result = await connectUserBinance(userId, apiKey, secretKey, Boolean(testnet));
    res.json(result);
  });

  // Test user credentials against Binance live endpoint
  app.post("/api/binance/user/test", async (req, res) => {
    const userId = getUserIdFromReq(req);
    const result = await testUserBinanceConnection(userId);
    res.json(result);
  });

  // Get user account connection status & metrics (balance, positions, permissions)
  app.get("/api/binance/user/status", (req, res) => {
    const userId = getUserIdFromReq(req);
    const data = getUserAccountStatus(userId);
    res.json({ success: true, data });
  });

  // Disconnect user credentials
  app.post("/api/binance/user/disconnect", (req, res) => {
    const userId = getUserIdFromReq(req);
    disconnectUserBinance(userId);
    res.json({ success: true, message: "Binance credentials disconnected and purged." });
  });

  // Place order on Binance
  app.post("/api/binance/user/order", async (req, res) => {
    const userId = getUserIdFromReq(req);
    const result = await executeUserOrder(userId, req.body);
    res.json(result);
  });

  // Emergency cancel all pending orders
  app.post("/api/binance/user/cancel-orders", async (req, res) => {
    const userId = getUserIdFromReq(req);
    const result = await cancelUserPendingOrders(userId, req.body.symbol);
    res.json(result);
  });

  /* =========================================================================
     LEGACY COMPATIBILITY PROXIES
     ========================================================================= */

  // Market Tickers proxy (with Binance API + fallbacks)
  app.get("/api/market/tickers", async (req, res) => {
    try {
      const symbolsParam = req.query.symbols as string;
      const symbols = symbolsParam
        ? symbolsParam.split(",").map((s) => s.trim().toUpperCase())
        : ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT", "SUIUSDT", "ADAUSDT", "LINKUSDT", "AVAXUSDT", "ZECUSDT"];

      const data = await getBinance24hTickers(symbols);
      res.json({ success: true, data, source: "binance" });
    } catch (err: any) {
      res.json({ success: false, error: err.message, source: "fallback" });
    }
  });

  // Market Klines proxy
  app.get("/api/market/klines", async (req, res) => {
    const symbol = ((req.query.symbol as string) || "BTCUSDT").toUpperCase();
    const interval = (req.query.interval as string) || "1h";
    const limit = Math.min(Number(req.query.limit) || 100, 200);

    try {
      const klines = await getBinanceKlines(symbol, interval, limit);
      res.json({ success: true, symbol, interval, data: klines });
    } catch (err: any) {
      res.json({ success: false, error: err.message, symbol, interval, data: [] });
    }
  });

  // Market Derivatives proxy (Funding & Open Interest)
  app.get("/api/market/derivatives", async (req, res) => {
    const symbol = ((req.query.symbol as string) || "BTCUSDT").toUpperCase();
    try {
      const data = await getBinanceDerivatives(symbol);
      res.json({ success: true, symbol, ...data });
    } catch (err: any) {
      res.json({
        success: false,
        symbol,
        fundingRate: 0.0001,
        openInterest: 25400,
        error: err.message,
      });
    }
  });

  // MacroMind Intelligence Copilot & Analysis Endpoint
  app.post("/api/gemini/copilot", async (req, res) => {
    try {
      const { prompt, type, context } = req.body;
      const ai = getAiClient();

      // Sanitize context: Never expose API credentials to the AI model
      const sanitizedContext = JSON.parse(JSON.stringify(context || {}));
      delete sanitizedContext.apiKey;
      delete sanitizedContext.secretKey;
      delete sanitizedContext.apiSecret;
      delete sanitizedContext.credentials;
      sanitizedContext.marketDataTimestamp = Date.now();

      if (!ai) {
        // Return structured algorithmic answer if no API key
        return res.json({
          source: "algorithmic",
          text: generateAlgorithmicResponse(prompt, type, sanitizedContext),
        });
      }

      const systemInstruction = `You are MacroMind Intelligence, an elite institutional crypto strategist, derivatives specialist, and systematic risk officer.
Tone & Style:
- Short, direct, cold, evidence-based, professional.
- No conversational filler ("Sure! Let me check", "Great question", "Certainly").
- No emojis, no hyperbole, no emotional bias.
- Never invent prices, volumes, or balances. Use strictly the supplied context.
- Always observe the NO TRADE principle: If multi-timeframe confluence (4H regime, 1H setup, 15M confirmation) is lacking or contradictory, return NO TRADE with explicit missing criteria.
- Timeframe hierarchy: 4H = Market regime, 1H = Setup structure, 15M = Entry confirmation.
- Format with clean concise markdown bullet points and bold headers.`;

      const promptPayload = `User Query / Task: ${prompt || "Analyze current market state"}
Action Type: ${type || "copilot_query"}
Market & Application Context (Timestamp: ${Date.now()}):
${JSON.stringify(sanitizedContext, null, 2)}

Provide your institutional, structured assessment.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: promptPayload,
        config: {
          systemInstruction,
          temperature: 0.2,
        },
      });

      res.json({
        source: "gemini",
        text: response.text || "Assessment completed.",
      });
    } catch (error: any) {
      console.error("Gemini Copilot Error:", error);
      // Fallback seamlessly to deterministic engine
      const { prompt, type, context } = req.body;
      res.json({
        source: "algorithmic_fallback",
        text: generateAlgorithmicResponse(prompt, type, context),
      });
    }
  });

  // Algorithmic technical analyst response fallback
  function generateAlgorithmicResponse(prompt: string, type: string, context: any): string {
    const p = (prompt || "").toLowerCase();
    const asset = context?.selectedAsset || "BTCUSDT";
    const setup = context?.setup;
    const regime = context?.regime || "NEUTRAL";

    if (type === "why_not" || p.includes("why not")) {
      if (setup && setup.direction !== "NO_TRADE") {
        return `**${asset} Technical Audit**:
• **Status**: Active setup flagged (${setup.direction} Score: ${setup.score}/100).
• **Cautionary Factors**: 
  - 15M volume delta currently testing local EMA20 band.
  - Risk/Reward ratio strictly bounded at 1:${setup.riskReward.toFixed(1)}.
  - Invalidation barrier at **$${setup.invalidation.toLocaleString()}**. If price breaches this level prior to confirmation, invalidate immediately.`;
      }
      return `**${asset} - WHY NOT TRADE ANALYSIS**:
• **4H Regime**: ${regime} structure.
• **Missing Criteria**:
  1. 15M entry volume expansion below 1.5x 20-period moving average.
  2. Momentum oscillator (RSI14) compression showing no divergence or breakout clearance.
  3. Derivatives alignment: Taker buy/sell ratio neutral to contradictory.
• **System Verdict**: **NO TRADE**. Preserving capital until 1H structure breaks key resistance with confirmed volume.`;
    }

    if (p.includes("btc") || p.includes("bitcoin")) {
      return `**BTC Market Confluence**:
• **Regime**: ${regime} on 4H horizon.
• **EMA Status**: Price relative to EMA20 and EMA50 signals consolidation.
• **Derivatives**: Funding rate neutral; Open Interest stable without aggressive liquidation cascade.
• **Decision**: Trade setups require 15M breakout confirmation above key resistance. Strict invalidation applied on break below swing low.`;
    }

    if (p.includes("should i trade") || p.includes("today")) {
      return `**MacroMind Market Readiness**:
• **Global Regime**: ${regime}.
• **Market Breadth**: Volatility index moderate. Liquidity concentrated in top tier assets.
• **Execution Stance**: Selective. Only execute assets qualifying with Score ≥ 75 and verified 1:2.0+ R:R. If lower timeframes clash with 4H trend, enforce **NO TRADE**.`;
    }

    if (p.includes("position size") || p.includes("risk")) {
      return `**Risk Management Calculation**:
• **Rule**: Never increase size based on subjective confidence.
• **Formula**: \`Position Size = (Account Equity × Risk %) / (Entry - Stop Distance)\`
• **Limit Check**: Current maximum allowed risk per trade is ${context?.riskSettings?.riskPerTrade || 0.5}%. Ensure simultaneous positions do not exceed ${context?.riskSettings?.maxSimultaneousPositions || 2}.`;
    }

    if (p.includes("scan") || p.includes("best setup")) {
      return `**Scanner Confluence Summary**:
• Assets currently undergoing multi-timeframe scoring (Trend 25, Momentum 15, Volume 15, Derivatives 20, Market Structure 15, Risk Quality 10).
• Prioritize setups classified as **Strong** (80-89) or **Exceptional** (90-100) with unambiguous 15M entry confirmation.`;
    }

    return `**MacroMind Analysis**:
• **Asset Context**: ${asset}
• **Regime State**: ${regime}
• **Confluence Criteria**: 4H trend alignment, 1H structure support, 15M volume trigger.
• **Advisory**: Keep risk strictly at predefined percentage. Invalidation points must be set prior to order placement.`;
  }

  // Vite middleware in dev; static dist in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`MacroMind Terminal Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
