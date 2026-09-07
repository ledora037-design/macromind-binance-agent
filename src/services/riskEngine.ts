/**
 * MacroMind Dedicated Risk Engine
 * Enforces institutional position sizing, risk per trade, and daily drawdown limits
 */

import { Position, RiskSettings, TradeSetup } from "../types";

export const DEFAULT_RISK_SETTINGS: RiskSettings = {
  accountEquity: 25000, // $25,000 baseline
  riskPerTrade: 0.5, // 0.5%
  maxSimultaneousPositions: 2,
  maxDailyLoss: 2.0, // 2.0%
  maxPortfolioExposure: 50.0, // 50%
  minRiskReward: 2.0, // 1:2 minimum
  defaultLeverage: 2,
  maxLeverage: 5,
  dailyLossCurrent: 0.0,
};

export interface PositionCalculation {
  riskAmount: number; // Dollars risked (e.g. $125 on $25,000 at 0.5%)
  stopDistance: number; // Price difference between entry and stop
  stopDistancePercent: number; // % move to stop
  positionSizeUnits: number; // Coins / contracts
  notionalValue: number; // positionSizeUnits * entryPrice
  marginRequired: number; // notionalValue / leverage
  estimatedLossAtStop: number; // riskAmount
  estimatedGainTP1: number; // gain if TP1 hits
  estimatedGainTP2: number; // gain if TP2 hits
  riskReward: number;
  isRiskExceeded: boolean;
  warnings: string[];
}

export function calculatePositionMetrics(
  equity: number,
  riskPercent: number,
  entryPrice: number,
  stopLossPrice: number,
  tp1Price: number,
  tp2Price: number,
  leverage: number,
  settings: RiskSettings
): PositionCalculation {
  const warnings: string[] = [];

  // Account Risk in $
  const riskAmount = equity * (riskPercent / 100);
  const stopDistance = Math.abs(entryPrice - stopLossPrice);
  const stopDistancePercent = entryPrice > 0 ? (stopDistance / entryPrice) * 100 : 1;

  if (stopDistance <= 0) {
    return {
      riskAmount,
      stopDistance: 0,
      stopDistancePercent: 0,
      positionSizeUnits: 0,
      notionalValue: 0,
      marginRequired: 0,
      estimatedLossAtStop: 0,
      estimatedGainTP1: 0,
      estimatedGainTP2: 0,
      riskReward: 0,
      isRiskExceeded: true,
      warnings: ["Stop loss must be different from entry price."],
    };
  }

  // Institutional Position Sizing Formula:
  // Units = Risk$ / StopDistance$
  const positionSizeUnits = riskAmount / stopDistance;
  const notionalValue = positionSizeUnits * entryPrice;
  const clampedLeverage = Math.min(Math.max(1, leverage), settings.maxLeverage);
  const marginRequired = notionalValue / clampedLeverage;

  const tp1Distance = Math.abs(tp1Price - entryPrice);
  const tp2Distance = Math.abs(tp2Price - entryPrice);
  const riskReward = stopDistance > 0 ? tp1Distance / stopDistance : 0;

  const estimatedLossAtStop = riskAmount;
  const estimatedGainTP1 = positionSizeUnits * tp1Distance;
  const estimatedGainTP2 = positionSizeUnits * tp2Distance;

  // Enforce Risk Engine Constraints
  if (riskReward < settings.minRiskReward) {
    warnings.push(`R:R is 1:${riskReward.toFixed(2)}, which is below your minimum requirement of 1:${settings.minRiskReward.toFixed(1)}.`);
  }

  const maxExposureValue = equity * (settings.maxPortfolioExposure / 100);
  if (notionalValue > maxExposureValue) {
    warnings.push(`Position notional value ($${Math.round(notionalValue).toLocaleString()}) exceeds maximum portfolio exposure cap ($${Math.round(maxExposureValue).toLocaleString()}).`);
  }

  if (leverage > settings.maxLeverage) {
    warnings.push(`Leverage ${leverage}x exceeds configured maximum of ${settings.maxLeverage}x.`);
  }

  const isRiskExceeded = warnings.length > 0;

  return {
    riskAmount,
    stopDistance,
    stopDistancePercent,
    positionSizeUnits,
    notionalValue,
    marginRequired,
    estimatedLossAtStop,
    estimatedGainTP1,
    estimatedGainTP2,
    riskReward,
    isRiskExceeded,
    warnings,
  };
}

export function validateTradeExecution(
  settings: RiskSettings,
  openPositions: Position[],
  newRiskAmount: number
): { canExecute: boolean; reason?: string } {
  // 1. Daily Loss Limit
  if (settings.dailyLossCurrent >= settings.maxDailyLoss) {
    return {
      canExecute: false,
      reason: `Daily loss limit of ${settings.maxDailyLoss}% has been reached (${settings.dailyLossCurrent.toFixed(2)}%). New trade execution locked to prevent overtrading.`,
    };
  }

  // 2. Maximum Simultaneous Positions
  if (openPositions.length >= settings.maxSimultaneousPositions) {
    return {
      canExecute: false,
      reason: `Maximum simultaneous positions (${settings.maxSimultaneousPositions}) reached. Close an existing position before entering a new setup.`,
    };
  }

  // 3. Margin & Exposure check
  const currentUsedMargin = openPositions.reduce((sum, p) => sum + p.marginUsed, 0);
  const maxAllowedExposure = settings.accountEquity * (settings.maxPortfolioExposure / 100);
  const currentNotional = openPositions.reduce((sum, p) => sum + p.notionalValue, 0);

  if (currentNotional >= maxAllowedExposure) {
    return {
      canExecute: false,
      reason: `Portfolio exposure limit reached (${((currentNotional / settings.accountEquity) * 100).toFixed(1)}% / ${settings.maxPortfolioExposure}%).`,
    };
  }

  return { canExecute: true };
}
