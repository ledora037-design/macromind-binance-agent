import React, { useState } from "react";
import {
  AlertTriangle,
  ShieldAlert,
  Bot,
  CheckCircle,
  Pause,
  X,
} from "lucide-react";
import { RiskSettings, StrategyRule } from "../types";

interface AutoTradingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmEnableAuto: () => void;
  riskSettings: RiskSettings;
  activeStrategies: StrategyRule[];
}

export const AutoTradingModal: React.FC<AutoTradingModalProps> = ({
  isOpen,
  onClose,
  onConfirmEnableAuto,
  riskSettings,
  activeStrategies,
}) => {
  const [hasAcknowledged, setHasAcknowledged] = useState<boolean>(false);

  if (!isOpen) return null;

  return (
    <div
      id="auto-trading-safety-modal"
      className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-mono select-none"
    >
      <div className="bg-[#0f1420] border-2 border-amber-500/60 rounded-lg max-w-lg w-full p-4.5 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#1c283a] pb-3">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-amber-400 animate-pulse" />
            <span className="font-bold text-sm text-amber-300 uppercase tracking-wide">
              Automated Execution Authorization
            </span>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div className="bg-amber-950/30 border border-amber-500/40 p-3 rounded text-amber-200 space-y-2">
            <p className="font-bold">CRITICAL SAFETY CONFIRMATION:</p>
            <p className="leading-relaxed">
              Automated trading will execute orders automatically according to active strategies and
              risk limits. Ensure your exchange API permissions and risk rules are correct before
              proceeding.
            </p>
          </div>

          <div className="bg-[#121927] p-3 rounded border border-[#1e2a3c] space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-400">Active Automated Strategies:</span>
              <span className="text-emerald-400 font-bold">
                {activeStrategies.length > 0
                  ? activeStrategies.map((s) => s.name).join(", ")
                  : "None active (Enable in Strategies Lab)"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Risk Per Trade:</span>
              <span className="text-slate-100 font-bold">{riskSettings.riskPerTrade}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Max Positions:</span>
              <span className="text-slate-100 font-bold">
                {riskSettings.maxSimultaneousPositions}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Daily Loss Hard Halt:</span>
              <span className="text-rose-400 font-bold">{riskSettings.maxDailyLoss}%</span>
            </div>
          </div>

          {/* Acknowledgement Checkbox */}
          <label className="flex items-start space-x-2.5 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={hasAcknowledged}
              onChange={(e) => setHasAcknowledged(e.target.checked)}
              className="w-4 h-4 mt-0.5 rounded border-amber-500 accent-amber-500 cursor-pointer"
            />
            <span className="text-slate-300 text-[11px] leading-snug">
              I authorize MacroMind to execute algorithmic signals automatically within the bounds
              of my predefined risk parameters.
            </span>
          </label>
        </div>

        <div className="flex justify-end space-x-2 pt-2 border-t border-[#1a2536]">
          <button
            onClick={onClose}
            className="px-3.5 py-2 rounded bg-[#162130] hover:bg-[#1d2a3d] text-slate-300 text-xs font-bold"
          >
            DISMISS
          </button>
          <button
            id="btn-confirm-enable-auto"
            disabled={!hasAcknowledged}
            onClick={() => {
              onConfirmEnableAuto();
              onClose();
            }}
            className="px-4 py-2 rounded bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold text-xs shadow flex items-center space-x-1.5"
          >
            <Bot className="w-4 h-4" />
            <span>ENABLE AUTO TRADING</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export const AutoTradingBanner: React.FC<{
  activeStrategyName: string;
  riskSettings: RiskSettings;
  isLiveConnected: boolean;
  onPause: () => void;
  onEmergencyStop: () => void;
}> = ({ activeStrategyName, riskSettings, isLiveConnected, onPause, onEmergencyStop }) => {
  return (
    <div
      id="auto-trading-active-banner"
      className="bg-amber-950/80 border-b border-amber-500/60 px-3 sm:px-5 py-2 flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs font-mono text-amber-200 select-none animate-in fade-in"
    >
      <div className="flex items-center space-x-2">
        <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
        <span className="font-bold text-amber-300 uppercase tracking-wider">
          AUTO TRADING ACTIVE
        </span>
        <span className="hidden sm:inline text-amber-500">|</span>
        <span className="hidden sm:inline text-amber-100">
          Strategy: <strong>{activeStrategyName || "Adaptive Multi-Timeframe"}</strong>
        </span>
      </div>

      <div className="flex items-center flex-wrap gap-2 text-[11px]">
        <span>
          Risk: <strong>{riskSettings.riskPerTrade}%</strong>
        </span>
        <span className="text-amber-500">•</span>
        <span>
          Max Pos: <strong>{riskSettings.maxSimultaneousPositions}</strong>
        </span>
        <span className="text-amber-500">•</span>
        <span>
          Loss Cap: <strong>{riskSettings.maxDailyLoss}%</strong>
        </span>
        <span className="text-amber-500">•</span>
        <span>
          Status:{" "}
          <strong>{isLiveConnected ? "LIVE BROKER" : "PAPER SIMULATOR"}</strong>
        </span>

        <div className="flex items-center space-x-1.5 ml-2">
          <button
            onClick={onPause}
            className="px-2 py-0.5 rounded bg-amber-900/60 hover:bg-amber-800 text-amber-100 border border-amber-500/40 text-[10px] font-bold flex items-center space-x-1"
          >
            <Pause className="w-3 h-3" />
            <span>PAUSE</span>
          </button>
          <button
            onClick={onEmergencyStop}
            className="px-2 py-0.5 rounded bg-rose-900 hover:bg-rose-800 text-white border border-rose-500/50 text-[10px] font-bold"
          >
            HALT
          </button>
        </div>
      </div>
    </div>
  );
};
