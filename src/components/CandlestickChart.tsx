import React, { useEffect, useRef, useState } from "react";
import { Candle, Timeframe, TradeSetup } from "../types";
import { calculateEMA } from "../services/marketData";

interface CandlestickChartProps {
  symbol: string;
  candles: Candle[];
  timeframe: Timeframe;
  onSelectTimeframe: (tf: Timeframe) => void;
  activeSetup?: TradeSetup | null;
  supportLevel?: number;
  resistanceLevel?: number;
}

export const CandlestickChart: React.FC<CandlestickChartProps> = ({
  symbol,
  candles,
  timeframe,
  onSelectTimeframe,
  activeSetup,
  supportLevel,
  resistanceLevel,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });
  const [hoverData, setHoverData] = useState<{
    candle: Candle | null;
    x: number;
    y: number;
  }>({ candle: null, x: 0, y: 0 });

  // Handle responsive sizing
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setDimensions({ width, height });
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Main Canvas Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || candles.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Handle high DPI
    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    ctx.scale(dpr, dpr);

    const width = dimensions.width;
    const height = dimensions.height;

    // Background
    ctx.fillStyle = "#0c1017";
    ctx.fillRect(0, 0, width, height);

    // Padding margins
    const paddingTop = 25;
    const paddingBottom = 40;
    const paddingRight = 65; // price axis
    const paddingLeft = 10;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;
    const volumeHeight = chartHeight * 0.22;
    const priceChartHeight = chartHeight * 0.78;

    // Price scaling
    let minPrice = Math.min(...candles.map((c) => c.low));
    let maxPrice = Math.max(...candles.map((c) => c.high));

    // Incorporate setup levels into scale if present
    if (activeSetup && activeSetup.asset === symbol) {
      minPrice = Math.min(minPrice, activeSetup.stopLoss, activeSetup.entryZone[0]);
      maxPrice = Math.max(maxPrice, activeSetup.tp2, activeSetup.entryZone[1]);
    }
    if (supportLevel) minPrice = Math.min(minPrice, supportLevel);
    if (resistanceLevel) maxPrice = Math.max(maxPrice, resistanceLevel);

    const priceBuffer = (maxPrice - minPrice) * 0.08 || 1;
    minPrice -= priceBuffer;
    maxPrice += priceBuffer;

    const maxVolume = Math.max(...candles.map((c) => c.volume), 1);

    const priceToY = (price: number) => {
      return (
        paddingTop +
        (1 - (price - minPrice) / (maxPrice - minPrice)) * priceChartHeight
      );
    };

    const volumeToHeight = (vol: number) => {
      return (vol / maxVolume) * volumeHeight;
    };

    // Draw Grid Lines & Price Axis Labels
    ctx.strokeStyle = "#161f2c";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    const numPriceLines = 6;
    ctx.fillStyle = "#64748b";
    ctx.font = "10px monospace";
    ctx.textAlign = "left";

    for (let i = 0; i <= numPriceLines; i++) {
      const p = minPrice + (i / numPriceLines) * (maxPrice - minPrice);
      const y = priceToY(p);

      ctx.beginPath();
      ctx.moveTo(paddingLeft, y);
      ctx.lineTo(width - paddingRight, y);
      ctx.stroke();

      ctx.fillText(
        p > 100 ? p.toFixed(1) : p.toFixed(4),
        width - paddingRight + 6,
        y + 3
      );
    }
    ctx.setLineDash([]); // Reset dash

    // Time Axis Grid Lines
    const numTimeLines = 5;
    ctx.textAlign = "center";
    for (let i = 0; i < numTimeLines; i++) {
      const candleIndex = Math.floor(
        (i / (numTimeLines - 1)) * (candles.length - 1)
      );
      const c = candles[candleIndex];
      if (!c) continue;
      const x =
        paddingLeft + (candleIndex + 0.5) * (chartWidth / candles.length);

      ctx.strokeStyle = "#141c27";
      ctx.beginPath();
      ctx.moveTo(x, paddingTop);
      ctx.lineTo(x, height - paddingBottom);
      ctx.stroke();

      const d = new Date(c.time);
      const label =
        timeframe === "1D"
          ? `${d.getMonth() + 1}/${d.getDate()}`
          : `${d.getHours().toString().padStart(2, "0")}:${d
              .getMinutes()
              .toString()
              .padStart(2, "0")}`;
      ctx.fillText(label, x, height - paddingBottom + 16);
    }

    // Draw Horizontal Support & Resistance
    if (supportLevel && supportLevel >= minPrice) {
      const sY = priceToY(supportLevel);
      ctx.strokeStyle = "#10b98155";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(paddingLeft, sY);
      ctx.lineTo(width - paddingRight, sY);
      ctx.stroke();
      ctx.fillStyle = "#10b981aa";
      ctx.fillText(`SUPP ${supportLevel.toFixed(1)}`, width - paddingRight + 6, sY - 4);
    }

    if (resistanceLevel && resistanceLevel <= maxPrice) {
      const rY = priceToY(resistanceLevel);
      ctx.strokeStyle = "#f43f5e55";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(paddingLeft, rY);
      ctx.lineTo(width - paddingRight, rY);
      ctx.stroke();
      ctx.fillStyle = "#f43f5eaa";
      ctx.fillText(`RES ${resistanceLevel.toFixed(1)}`, width - paddingRight + 6, rY - 4);
    }
    ctx.setLineDash([]);

    // Draw Active Setup Overlays (Entry Zone, Stop Loss, TP1, TP2)
    if (activeSetup && activeSetup.asset === symbol) {
      const entryY1 = priceToY(activeSetup.entryZone[0]);
      const entryY2 = priceToY(activeSetup.entryZone[1]);
      const entryTop = Math.min(entryY1, entryY2);
      const entryHeight = Math.abs(entryY1 - entryY2) || 4;

      // Entry Zone shaded band
      ctx.fillStyle = "rgba(56, 189, 248, 0.12)";
      ctx.fillRect(paddingLeft, entryTop, chartWidth, entryHeight);

      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 1;
      ctx.strokeRect(paddingLeft, entryTop, chartWidth, entryHeight);

      ctx.fillStyle = "#38bdf8";
      ctx.fillText(
        `ENTRY ${activeSetup.entryZone[0].toFixed(1)} - ${activeSetup.entryZone[1].toFixed(1)}`,
        paddingLeft + 10,
        entryTop - 4
      );

      // Stop Loss Line
      const slY = priceToY(activeSetup.stopLoss);
      ctx.strokeStyle = "#f43f5e";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 3]);
      ctx.beginPath();
      ctx.moveTo(paddingLeft, slY);
      ctx.lineTo(width - paddingRight, slY);
      ctx.stroke();
      ctx.fillStyle = "#f43f5e";
      ctx.fillText(`SL ${activeSetup.stopLoss.toFixed(1)}`, paddingLeft + 10, slY - 4);

      // TP1 Line
      const tp1Y = priceToY(activeSetup.tp1);
      ctx.strokeStyle = "#10b981";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(paddingLeft, tp1Y);
      ctx.lineTo(width - paddingRight, tp1Y);
      ctx.stroke();
      ctx.fillStyle = "#10b981";
      ctx.fillText(`TP1 ${activeSetup.tp1.toFixed(1)} (2.2R)`, paddingLeft + 10, tp1Y - 4);

      // TP2 Line
      const tp2Y = priceToY(activeSetup.tp2);
      ctx.strokeStyle = "#059669";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(paddingLeft, tp2Y);
      ctx.lineTo(width - paddingRight, tp2Y);
      ctx.stroke();
      ctx.fillStyle = "#059669";
      ctx.fillText(`TP2 ${activeSetup.tp2.toFixed(1)} (3.4R)`, paddingLeft + 10, tp2Y - 4);

      ctx.setLineDash([]);
    }

    // Calculate EMAs
    const closes = candles.map((c) => c.close);
    const ema20Values = calculateEMAArray(closes, 20);
    const ema50Values = calculateEMAArray(closes, 50);

    const candleWidth = (chartWidth / candles.length) * 0.75;

    // Draw Volume Bars
    candles.forEach((c, idx) => {
      const x =
        paddingLeft +
        idx * (chartWidth / candles.length) +
        (chartWidth / candles.length - candleWidth) / 2;
      const vH = volumeToHeight(c.volume);
      const y = height - paddingBottom - vH;

      ctx.fillStyle =
        c.close >= c.open
          ? "rgba(16, 185, 129, 0.22)"
          : "rgba(244, 63, 94, 0.22)";
      ctx.fillRect(x, y, candleWidth, vH);
    });

    // Draw Candlesticks (Wick & Body)
    candles.forEach((c, idx) => {
      const xCenter =
        paddingLeft + (idx + 0.5) * (chartWidth / candles.length);
      const isUp = c.close >= c.open;
      const color = isUp ? "#10b981" : "#f43f5e";

      const openY = priceToY(c.open);
      const closeY = priceToY(c.close);
      const highY = priceToY(c.high);
      const lowY = priceToY(c.low);

      // Wick
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(xCenter, highY);
      ctx.lineTo(xCenter, lowY);
      ctx.stroke();

      // Body
      const bodyTop = Math.min(openY, closeY);
      const bodyHeight = Math.max(1.5, Math.abs(closeY - openY));
      const bodyLeft = xCenter - candleWidth / 2;

      ctx.fillStyle = color;
      ctx.fillRect(bodyLeft, bodyTop, candleWidth, bodyHeight);
    });

    // Draw EMA20 (Blue)
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ema20Values.forEach((val, idx) => {
      const x = paddingLeft + (idx + 0.5) * (chartWidth / candles.length);
      const y = priceToY(val);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Draw EMA50 (Amber)
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ema50Values.forEach((val, idx) => {
      const x = paddingLeft + (idx + 0.5) * (chartWidth / candles.length);
      const y = priceToY(val);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Draw Interactive Crosshair if Hovering
    if (hoverData.candle) {
      ctx.strokeStyle = "#475569";
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);

      // Vertical line
      ctx.beginPath();
      ctx.moveTo(hoverData.x, paddingTop);
      ctx.lineTo(hoverData.x, height - paddingBottom);
      ctx.stroke();

      // Horizontal line
      ctx.beginPath();
      ctx.moveTo(paddingLeft, hoverData.y);
      ctx.lineTo(width - paddingRight, hoverData.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Price Tag on right axis
      const hoveredPrice =
        minPrice +
        (1 - (hoverData.y - paddingTop) / priceChartHeight) *
          (maxPrice - minPrice);
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(width - paddingRight, hoverData.y - 8, paddingRight, 16);
      ctx.fillStyle = "#f8fafc";
      ctx.fillText(
        hoveredPrice > 100
          ? hoveredPrice.toFixed(1)
          : hoveredPrice.toFixed(4),
        width - paddingRight + 4,
        hoverData.y + 4
      );
    }
  }, [
    candles,
    dimensions,
    activeSetup,
    symbol,
    timeframe,
    supportLevel,
    resistanceLevel,
    hoverData,
  ]);

  // Helper to calculate EMA for each point
  function calculateEMAArray(closes: number[], period: number): number[] {
    const res: number[] = [];
    if (closes.length === 0) return res;
    const k = 2 / (period + 1);
    let ema = closes[0];
    for (let i = 0; i < closes.length; i++) {
      ema = closes[i] * k + ema * (1 - k);
      res.push(ema);
    }
    return res;
  }

  // Handle Mouse Move for Crosshair
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || candles.length === 0) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const paddingLeft = 10;
    const paddingRight = 65;
    const chartWidth = dimensions.width - paddingLeft - paddingRight;

    if (x >= paddingLeft && x <= dimensions.width - paddingRight) {
      const idx = Math.floor(
        ((x - paddingLeft) / chartWidth) * candles.length
      );
      const candle = candles[Math.min(Math.max(0, idx), candles.length - 1)];
      setHoverData({ candle, x, y });
    } else {
      setHoverData({ candle: null, x: 0, y: 0 });
    }
  };

  const handleMouseLeave = () => {
    setHoverData({ candle: null, x: 0, y: 0 });
  };

  const lastCandle = candles[candles.length - 1];
  const activeCandle = hoverData.candle || lastCandle;

  return (
    <div
      id="chart-container"
      className="bg-[#0b0f16] border border-[#1c2432] rounded flex flex-col h-full min-h-[360px] select-none"
    >
      {/* Top Chart Header Toolbar */}
      <div className="h-10 border-b border-[#1a2331] px-3 flex items-center justify-between font-mono text-xs">
        {/* Symbol and Metrics */}
        <div className="flex items-center space-x-3 overflow-x-auto scrollbar-none py-1">
          <div className="flex items-center space-x-1.5">
            <span className="font-bold text-slate-100 text-sm">{symbol}</span>
            <span className="text-[10px] px-1 py-0.2 rounded bg-[#16202e] text-slate-400">
              BINANCE
            </span>
          </div>

          {activeCandle && (
            <div className="hidden sm:flex items-center space-x-2.5 text-[11px] text-slate-400">
              <span>
                O:{" "}
                <span className="text-slate-200">
                  {activeCandle.open.toLocaleString()}
                </span>
              </span>
              <span>
                H:{" "}
                <span className="text-slate-200">
                  {activeCandle.high.toLocaleString()}
                </span>
              </span>
              <span>
                L:{" "}
                <span className="text-slate-200">
                  {activeCandle.low.toLocaleString()}
                </span>
              </span>
              <span>
                C:{" "}
                <span
                  className={
                    activeCandle.close >= activeCandle.open
                      ? "text-emerald-400 font-medium"
                      : "text-rose-400 font-medium"
                  }
                >
                  {activeCandle.close.toLocaleString()}
                </span>
              </span>
            </div>
          )}

          {/* Indicator Legends */}
          <div className="hidden md:flex items-center space-x-2 text-[10px]">
            <span className="text-[#38bdf8] flex items-center space-x-1">
              <span className="w-2 h-0.5 bg-[#38bdf8] inline-block" />
              <span>EMA20</span>
            </span>
            <span className="text-[#f59e0b] flex items-center space-x-1">
              <span className="w-2 h-0.5 bg-[#f59e0b] inline-block" />
              <span>EMA50</span>
            </span>
            <span className="text-slate-500">VOL</span>
          </div>
        </div>

        {/* Timeframe Selectors */}
        <div className="flex items-center space-x-1 bg-[#121824] p-0.5 rounded border border-[#1e293a]">
          {(["15M", "1H", "4H", "1D"] as Timeframe[]).map((tf) => (
            <button
              key={tf}
              id={`tf-btn-${tf}`}
              onClick={() => onSelectTimeframe(tf)}
              className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                timeframe === tf
                  ? "bg-[#1f2c3d] text-emerald-300 font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div ref={containerRef} className="flex-1 relative w-full h-full min-h-[300px]">
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="absolute inset-0 w-full h-full cursor-crosshair"
        />
      </div>
    </div>
  );
};
