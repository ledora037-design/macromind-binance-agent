 MacroMind — Regime-Adaptive Momentum & Confluence Trading Agent

An AI trading agent built on Binance Agent OS (MCP) that reads live market data, classifies the current market regime, and generates risk-managed, confluence-based trade signals — combining technical structure with a lightweight news/sentiment layer, all sized against your actual sub-account equity.
Built for the Binance Agent OS Mini Hackathon (Track A).

What it does

1. Reads live market data for BTC, ETH, SOL, BNB, AVAX (USDS-M perpetual futures) via the Binance Agent OS MCP server.
2. Classifies the market regime (Trending vs Ranging) using volatility compression and trend-alignment indicators.
3. Generates trade signals using a confluence checklist tailored to the current regime — no single indicator fires a trade alone.
4. Sizes every trade against your real sub-account equity, pulled live via MCP, not a hardcoded number.
5. Runs entirely in simulated/paper mode by default — live order placement is a separate, explicit, off-by-default toggle.
6. Backtests the same rules against 1,000 historical candles per asset and shows an equity curve, win rate, and trade log.
7. Runs a live paper trading loop** so you can watch the agent make (simulated) decisions in real time.

Architecture

┌─────────────────────────────┐
│   Binance Agent OS (MCP)     │  https://agent.binance.com/mcp/agentic
│   StreamableHTTP transport   │
└──────────────┬───────────────┘
               │
    ┌──────────▼───────────┐
    │  binanceAgentClient   │  MCP client wrapper (klines, price,
    │        .js            │  positions, balance, sub-account)
    └──────────┬───────────┘
               │
   ┌───────────┼────────────────────┬─────────────────────┐
   ▼                                ▼                      ▼
Regime Classifier          Confluence Engine       News Sentiment Layer
(volatility + trend)     (TA rules, regime-aware)   (AI headline scoring,
                                                       optional booster)
   │                                │                      │
   └───────────────┬────────────────┴──────────────────────┘
                    ▼
            Risk Management Layer
      (equity-based sizing, ATR-adjusted,
       drawdown circuit breakers, correlation guard)
                    │
        ┌───────────┴────────────┐
        ▼                        ▼
  Paper Trading Engine     Historical Backtest
  (live, simulated)         (1,000 candles/asset)


 MCP Integration

All market and account data is pulled through the Binance Agent OS Model Context Protocol server:

| Function | MCP Tool | Purpose |
| `getKlines()` | `futures_usds.klineCandlestickData` | Live/historical candles for signal generation and backtesting |
| `getPrice()` | `futures_usds.symbolPriceTicker` | Live mark price |
| `getFuturesBalance()` | `futures_usds.futuresAccountBalanceV3` | Margin wallet balance |
| `getAccountSnapshot()` | `futures_usds.accountInformationV3` | Full account snapshot (balance + positions + margin ratio) |
| `getSubAccountAssets()` | `sub_account.getMainAccountAsset` | Live sub-account spot balances |
| `getOpenPositions()` | `futures_usds.positionInformationV2` | Currently open futures positions |

No order-placement MCP tools are called unless the Enable Live Trading toggle is explicitly switched on by the connected user — everything defaults to simulated/paper mode.

 Confluence Entry Logic

The agent never trades off a single indicator. It requires multiple independent signals to align, and the required set changes with the detected regime.

Trending regime (long or short) — requires 3 of:
- Price relative to session VWAP
- EMA(20) / EMA(50) alignment
- RSI(14) in the 40–60 pullback zone (not overbought/oversold)
- A recent 3-candle Fair Value Gap (FVG) mitigation in the trade's direction

Ranging regime (long or short) — requires 2 of:
- Price at a detected support/resistance level or order block
- RSI(14) at an extreme (<35 or >65)
- A confirmed trendline bounce or rejection

Volatility filter: if current ATR(14) exceeds 1.5× its 20-period average, position risk is automatically halved rather than skipping the trade.

News/sentiment layer (optional booster, non-blocking):** recent headlines per asset are pulled and scored (Bullish/Bearish/Neutral + confidence). If sentiment agrees with the trade direction, it adds one extra point to the confluence checklist — but a trade already meeting the technical requirement is never blocked by absent or neutral news.

 Risk Management

- Position sizing: 1.5% of live sub-account equity risked per trade (0.75% when the ATR volatility filter is active), calculated from real account data, not a fixed dollar amount.
- Stop-loss: anchored to the structural invalidation point (order block / FVG zone), not a fixed percentage.
- Take-profit: minimum 2.0R (twice the risk distance).
- Max concurrent positions: 2.
- Daily drawdown circuit breaker: new entries halt at 3% daily loss.
- Weekly drawdown circuit breaker: new entries halt at 6% weekly loss.
- Correlation guard: avoids opening same-direction positions in highly correlated pairs (e.g. BTC + ETH) simultaneously.

Every simulated trade logs exactly which conditions triggered it (e.g. `VWAP + EMA + FVG aligned`) for full auditability.

Connect Your Own Account

Judges/users can optionally connect their own Binance Agent OS session:

- Paste your own MCP session token/API key on the Connect Account screen.
- The credential is held **only in browser memory for the current session** — never written to localStorage, a database, or any log.
- Disconnecting or closing the tab clears it immediately.
- No credential connected → the app runs in demo mode against its own default sub-account, so it works out of the box for evaluation.

Historical Backtest

The Historical Backtest panel runs the exact same confluence rules against 1,000 hourly candles per asset and reports:
- Equity curve (simulated $50,000 baseline)
- Win rate, average R-multiple, profit factor, max drawdown, total return
- Full trade log (entry/exit time, direction, result, triggering conditions)

This is clearly labeled "Historical Backtest — Simulated, Not Live" and is never mixed with live paper trading data.

 Live Paper Trading

The Live Paper Trading panel runs continuously against live market data, evaluating the confluence rules on each new candle/poll interval and logging simulated trades (with live sub-account-based sizing) without placing real orders — so the agent's real-time decision-making can be observed directly.


 Safety Defaults

- Live order execution: **off by default**, explicit opt-in toggle required.
- Auto-Rebalance: computes order differentials but does not place real orders unless live trading is enabled.
- Any fallback to simulated/mirrored data is clearly badged in the UI — never shown silently as live.
- No API credentials are ever persisted to disk, a database, or logs.

 Disclaimer

This project is a hackathon submission demonstrating Binance Agent OS / MCP integration for AI-driven trading agents. It is not financial advice. Trading involves risk; historical backtest and paper trading results do not guarantee future performance. Live trading is disabled by default and should only be enabled with capital you can afford to risk.

 Tech Stack

- Frontend/backend built and iterated via AI Studio
- Binance Agent OS MCP Server (`https://agent.binance.com/mcp/agentic`) via `@modelcontextprotocol/sdk` (StreamableHTTP transport)
- AI-based sentiment classification and macro intelligence briefing
