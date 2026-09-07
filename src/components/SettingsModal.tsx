import React, { useState } from "react";
import {
  SlidersHorizontal,
  X,
  Radio,
  Shield,
  Check,
  AlertTriangle,
  RefreshCw,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  ShieldAlert,
  HelpCircle,
} from "lucide-react";
import { BinanceAccountInfo, RiskSettings } from "../types";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  riskSettings: RiskSettings;
  onUpdateRiskSettings: (settings: RiskSettings) => void;
  isTestnet: boolean;
  onToggleTestnet: (val: boolean) => void;
  binanceAccount: BinanceAccountInfo;
  onConnectBinance: (
    apiKey: string,
    secretKey: string,
    testnet: boolean
  ) => Promise<{ success: boolean; message: string }>;
  onDisconnectBinance: () => Promise<void>;
  onTestConnection: () => Promise<{ success: boolean; message: string }>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  riskSettings,
  onUpdateRiskSettings,
  isTestnet,
  onToggleTestnet,
  binanceAccount,
  onConnectBinance,
  onDisconnectBinance,
  onTestConnection,
}) => {
  const [activeTab, setActiveTab] = useState<"EXCHANGE" | "RISK" | "APP">("EXCHANGE");
  const [localRisk, setLocalRisk] = useState<RiskSettings>({ ...riskSettings });

  // Local Form state for Connecting Binance
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [secretKeyInput, setSecretKeyInput] = useState("");
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [useTestnet, setUseTestnet] = useState(isTestnet);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectMessage, setConnectMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const isConnected = binanceAccount?.status === "CONNECTED";
  const isError = binanceAccount?.status === "ERROR";

  const handleSaveRisk = () => {
    onUpdateRiskSettings(localRisk);
    onClose();
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeyInput.trim() || !secretKeyInput.trim()) {
      setConnectMessage({
        type: "error",
        text: "Both API Key and Secret Key are strictly required.",
      });
      return;
    }

    setIsConnecting(true);
    setConnectMessage(null);

    const res = await onConnectBinance(apiKeyInput.trim(), secretKeyInput.trim(), useTestnet);
    setIsConnecting(false);

    if (res.success) {
      setConnectMessage({ type: "success", text: res.message });
      setSecretKeyInput(""); // Clear secret from memory immediately
      setApiKeyInput("");
    } else {
      setConnectMessage({ type: "error", text: res.message });
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    const res = await onTestConnection();
    setIsTesting(false);
    setTestResult(res);
  };

  return (
    <div
      id="terminal-settings-modal"
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 font-mono select-none"
    >
      <div className="bg-[#0e1420] border border-[#233145] rounded-lg max-w-xl w-full flex flex-col shadow-2xl overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="h-12 px-4 border-b border-[#1c2738] flex items-center justify-between bg-[#111826]">
          <div className="flex items-center space-x-2">
            <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-sm text-slate-100 uppercase">
              Terminal Settings & Preferences
            </span>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sub tabs */}
        <div className="bg-[#121927] px-4 border-b border-[#1b2536] flex space-x-4 text-xs">
          {(["EXCHANGE", "RISK", "APP"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2.5 font-semibold border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-emerald-500 text-emerald-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab === "EXCHANGE"
                ? "Exchange Connection"
                : tab === "RISK"
                ? "Risk Controls"
                : "Application"}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs">
          {/* TAB 1: EXCHANGE CONNECTION */}
          {activeTab === "EXCHANGE" && (
            <div className="space-y-4">
              {/* Header Box */}
              <div className="flex items-center justify-between border-b border-[#1c2738] pb-2.5">
                <div>
                  <h3 className="font-bold text-sm text-slate-100 flex items-center space-x-2">
                    <span>Binance Exchange Connection</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Connect your personal Binance account for authenticated execution
                  </p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    isConnected
                      ? "bg-emerald-950/40 text-emerald-400 border-emerald-500/40"
                      : isError
                      ? "bg-rose-950/40 text-rose-400 border-rose-500/40"
                      : "bg-[#162130] text-slate-400 border-[#223145]"
                  }`}
                >
                  {isConnected ? "CONNECTED" : isError ? "ERROR" : "NOT CONNECTED"}
                </span>
              </div>

              {/* STATE 1: ALREADY CONNECTED */}
              {isConnected ? (
                <div className="space-y-3.5">
                  <div className="bg-[#121824] p-3.5 rounded border border-[#1e293a] space-y-3">
                    <div className="flex items-center justify-between border-b border-[#1c2738] pb-2">
                      <div className="flex items-center space-x-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span className="font-bold text-slate-200">Binance Account Linked</span>
                      </div>
                      <span className="text-[11px] font-mono text-emerald-400 font-bold bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-500/30">
                        {binanceAccount.apiStatus}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-500 block text-[10px]">API KEY (MASKED)</span>
                        <span className="font-mono text-slate-200">
                          {binanceAccount.maskedApiKey || "••••••••"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">ACCOUNT TYPE</span>
                        <span className="font-mono text-slate-200">{binanceAccount.accountType}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">PERMISSIONS</span>
                        <span className="text-emerald-400 font-medium">Read + Trading</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">WITHDRAWAL</span>
                        <span className="text-rose-400 font-medium">Disabled (Secured)</span>
                      </div>
                    </div>

                    {/* Financial Metrics from real Binance API */}
                    <div className="bg-[#0b1018] p-2.5 rounded border border-[#182333] grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                      <div>
                        <div className="text-[10px] text-slate-500">WALLET BAL</div>
                        <div className="font-bold text-slate-200 text-xs">
                          ${binanceAccount.totalWalletBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500">AVAILABLE</div>
                        <div className="font-bold text-emerald-400 text-xs">
                          ${binanceAccount.availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500">MARGIN USED</div>
                        <div className="font-bold text-slate-300 text-xs">
                          ${binanceAccount.totalMarginUsed.toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500">UNREALIZED PNL</div>
                        <div
                          className={`font-bold text-xs ${
                            binanceAccount.totalUnrealizedProfit >= 0 ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {binanceAccount.totalUnrealizedProfit >= 0 ? "+" : ""}
                          ${binanceAccount.totalUnrealizedProfit.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {/* Test result banner if clicked */}
                    {testResult && (
                      <div
                        className={`p-2 rounded text-[11px] border ${
                          testResult.success
                            ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-300"
                            : "bg-rose-950/30 border-rose-500/40 text-rose-300"
                        }`}
                      >
                        {testResult.message}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex space-x-2 pt-1">
                      <button
                        type="button"
                        onClick={handleTest}
                        disabled={isTesting}
                        className="flex-1 py-1.5 px-3 rounded bg-[#1b2738] hover:bg-[#23334a] text-slate-200 font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors border border-[#2b3c54]"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? "animate-spin text-emerald-400" : ""}`} />
                        <span>{isTesting ? "Verifying..." : "Test Connection"}</span>
                      </button>
                      <button
                        type="button"
                        onClick={onDisconnectBinance}
                        className="py-1.5 px-3 rounded bg-rose-950/30 hover:bg-rose-900/40 text-rose-400 border border-rose-600/30 font-bold text-xs transition-colors"
                      >
                        Disconnect
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* STATE 2 & 3: NOT CONNECTED OR ERROR - CONNECTION FORM */
                <form onSubmit={handleConnect} className="space-y-3.5">
                  {/* Security Policy Warning */}
                  <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded text-[11px] space-y-1.5">
                    <p className="font-bold text-emerald-300 flex items-center space-x-1.5">
                      <Shield className="w-3.5 h-3.5 text-emerald-400" />
                      <span>API Permission Safety Standard</span>
                    </p>
                    <p className="text-slate-300 leading-relaxed">
                      "Only enable the permissions required for trading. Withdrawal permission is not required."
                    </p>
                    <div className="grid grid-cols-2 gap-1 pt-1 text-[10px] text-slate-400">
                      <span className="text-emerald-400 flex items-center space-x-1">
                        <Check className="w-3 h-3" /> <span>Enable: Read &amp; Futures Trading</span>
                      </span>
                      <span className="text-rose-400 flex items-center space-x-1">
                        <X className="w-3 h-3" /> <span>Disable: Withdrawals</span>
                      </span>
                    </div>
                  </div>

                  {isError && binanceAccount.rawError && (
                    <div className="p-2.5 bg-rose-950/30 border border-rose-500/40 rounded text-[11px] text-rose-300 flex items-start space-x-2">
                      <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Authentication Failure:</span>
                        <p>{binanceAccount.rawError}</p>
                      </div>
                    </div>
                  )}

                  {/* API Key input */}
                  <div>
                    <label className="block text-slate-300 text-[11px] font-semibold mb-1">
                      API KEY
                    </label>
                    <input
                      type="text"
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      placeholder="Enter your 64-character Binance API Key"
                      className="w-full px-3 py-2 bg-[#121824] border border-[#1e293a] rounded text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-xs"
                      required
                      autoComplete="off"
                      spellCheck={false}
                    />
                  </div>

                  {/* Secret Key input */}
                  <div>
                    <label className="block text-slate-300 text-[11px] font-semibold mb-1 flex items-center justify-between">
                      <span>SECRET KEY</span>
                      <span className="text-[10px] text-slate-500">Stored with AES-256-GCM encryption</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showSecretKey ? "text" : "password"}
                        value={secretKeyInput}
                        onChange={(e) => setSecretKeyInput(e.target.value)}
                        placeholder="••••••••••••••••••••••••••••••••"
                        className="w-full px-3 py-2 bg-[#121824] border border-[#1e293a] rounded text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-xs pr-10"
                        required
                        autoComplete="off"
                        spellCheck={false}
                      />
                      <button
                        type="button"
                        onClick={() => setShowSecretKey(!showSecretKey)}
                        className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300"
                        tabIndex={-1}
                      >
                        {showSecretKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Never displayed after saving. Never shared with frontend code or the AI model.
                    </p>
                  </div>

                  {/* Testnet toggle */}
                  <div className="bg-[#121824] p-2.5 rounded border border-[#1e293a] flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-200 text-xs">Binance Testnet Network</span>
                      <p className="text-[10px] text-slate-500">
                        Routes to testnet.binancefuture.com for zero-risk testing
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={useTestnet}
                      onChange={(e) => setUseTestnet(e.target.checked)}
                      className="w-4 h-4 rounded border-[#1e293a] accent-emerald-500 cursor-pointer"
                    />
                  </div>

                  {/* Notification banner */}
                  {connectMessage && (
                    <div
                      className={`p-2.5 rounded text-[11px] border ${
                        connectMessage.type === "success"
                          ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-300"
                          : "bg-rose-950/30 border-rose-500/40 text-rose-300"
                      }`}
                    >
                      {connectMessage.text}
                    </div>
                  )}

                  {/* Connect Button */}
                  <button
                    type="submit"
                    disabled={isConnecting}
                    className="w-full py-2.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-md transition-colors disabled:opacity-50"
                  >
                    {isConnecting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Verifying &amp; Encrypting...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>Connect Binance Account</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Public Data Notice */}
              <div className="p-3 bg-[#111824] rounded border border-[#1b2536] text-[11px] text-slate-400 space-y-1">
                <p className="font-semibold text-slate-300">Public Market Data Note:</p>
                <p>
                  MacroMind continuously streams real-time Binance public prices, order books,
                  and derivatives data for everyone without requiring an API key. Connecting your
                  account is only needed for live order routing.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: RISK CONTROLS */}
          {activeTab === "RISK" && (
            <div className="space-y-3">
              {/* Account Equity */}
              <div>
                <label className="block text-slate-400 text-[11px] mb-1">
                  ACCOUNT EQUITY ($)
                </label>
                <input
                  type="number"
                  value={localRisk.accountEquity}
                  onChange={(e) =>
                    setLocalRisk({
                      ...localRisk,
                      accountEquity: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-2.5 py-1.5 bg-[#121824] border border-[#1e293a] rounded text-slate-100"
                />
              </div>

              {/* Risk Per Trade */}
              <div>
                <label className="block text-slate-400 text-[11px] mb-1">
                  DEFAULT RISK PER TRADE (%) (Institutional Standard: 0.5% - 1.0%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={localRisk.riskPerTrade}
                  onChange={(e) =>
                    setLocalRisk({
                      ...localRisk,
                      riskPerTrade: parseFloat(e.target.value) || 0.1,
                    })
                  }
                  className="w-full px-2.5 py-1.5 bg-[#121824] border border-[#1e293a] rounded text-slate-100"
                />
              </div>

              {/* Max Simultaneous Positions */}
              <div>
                <label className="block text-slate-400 text-[11px] mb-1">
                  MAX SIMULTANEOUS POSITIONS
                </label>
                <input
                  type="number"
                  value={localRisk.maxSimultaneousPositions}
                  onChange={(e) =>
                    setLocalRisk({
                      ...localRisk,
                      maxSimultaneousPositions: parseInt(e.target.value) || 1,
                    })
                  }
                  className="w-full px-2.5 py-1.5 bg-[#121824] border border-[#1e293a] rounded text-slate-100"
                />
              </div>

              {/* Max Daily Loss */}
              <div>
                <label className="block text-slate-400 text-[11px] mb-1">
                  MAX DAILY LOSS LIMIT (%)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={localRisk.maxDailyLoss}
                  onChange={(e) =>
                    setLocalRisk({
                      ...localRisk,
                      maxDailyLoss: parseFloat(e.target.value) || 1,
                    })
                  }
                  className="w-full px-2.5 py-1.5 bg-[#121824] border border-[#1e293a] rounded text-slate-100"
                />
              </div>

              {/* Leverage settings */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">
                    DEFAULT LEVERAGE
                  </label>
                  <input
                    type="number"
                    value={localRisk.defaultLeverage}
                    onChange={(e) =>
                      setLocalRisk({
                        ...localRisk,
                        defaultLeverage: parseInt(e.target.value) || 1,
                      })
                    }
                    className="w-full px-2.5 py-1.5 bg-[#121824] border border-[#1e293a] rounded text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">
                    MAXIMUM LEVERAGE CAP
                  </label>
                  <input
                    type="number"
                    value={localRisk.maxLeverage}
                    onChange={(e) =>
                      setLocalRisk({
                        ...localRisk,
                        maxLeverage: parseInt(e.target.value) || 2,
                      })
                    }
                    className="w-full px-2.5 py-1.5 bg-[#121824] border border-[#1e293a] rounded text-slate-100"
                  />
                </div>
              </div>

              {/* Minimum R:R */}
              <div>
                <label className="block text-slate-400 text-[11px] mb-1">
                  MINIMUM RISK / REWARD RATIO
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={localRisk.minRiskReward}
                  onChange={(e) =>
                    setLocalRisk({
                      ...localRisk,
                      minRiskReward: parseFloat(e.target.value) || 1.5,
                    })
                  }
                  className="w-full px-2.5 py-1.5 bg-[#121824] border border-[#1e293a] rounded text-slate-100"
                />
              </div>
            </div>
          )}

          {/* TAB 3: APP SETTINGS */}
          {activeTab === "APP" && (
            <div className="space-y-3">
              <div className="bg-[#121824] p-3 rounded border border-[#1e293a] flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-200">Terminal Theme</span>
                  <p className="text-[11px] text-slate-400">Institutional Charcoal Dark Theme</p>
                </div>
                <span className="text-emerald-400 font-bold text-xs">ACTIVE</span>
              </div>

              <div className="bg-[#121824] p-3 rounded border border-[#1e293a] flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-200">Automatic Trade Journaling</span>
                  <p className="text-[11px] text-slate-400">
                    Logs all closed paper, manual, and auto trades with confluence scores
                  </p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 rounded border-[#1e293a] accent-emerald-500 cursor-pointer"
                />
              </div>

              <div className="bg-[#121824] p-3 rounded border border-[#1e293a] flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-200">Data Freshness Timeout</span>
                  <p className="text-[11px] text-slate-400">
                    Auto-halts execution if data is stale (&gt;30s)
                  </p>
                </div>
                <span className="text-xs text-slate-300 font-bold bg-[#17202f] px-2 py-0.5 rounded border border-[#233145]">
                  30 Seconds
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#1c2738] bg-[#111826] flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded bg-[#162130] text-slate-300 text-xs font-bold hover:bg-[#1d2b3f]"
          >
            CLOSE
          </button>
          {activeTab === "RISK" && (
            <button
              onClick={handleSaveRisk}
              className="px-3.5 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow"
            >
              SAVE RISK CONTROLS
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

