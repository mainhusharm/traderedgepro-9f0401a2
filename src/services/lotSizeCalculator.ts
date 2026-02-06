// Lot Size Calculator Service
// Calculates proper position sizing based on risk parameters and user questionnaire

import { supabase } from '@/integrations/supabase/client';

interface LotSizeInput {
  accountBalance: number;
  riskPercentage: number;
  stopLossPips: number;
  currencyPair: string;
  accountCurrency?: string;
}

interface LotSizeResult {
  lotSize: number;
  microLots: number;
  miniLots: number;
  standardLots: number;
  riskAmount: number;
  pipValue: number;
}

interface UserTradingParams {
  accountSize: number;
  riskPercentage: number;
  propFirm: string;
  accountType: string;
}

interface PropFirmRules {
  maxDailyDrawdown: number;
  maxTotalDrawdown: number;
  profitTarget: number;
  minTradingDays: number;
  maxPositionSize: number;
  newsRestriction: boolean;
  weekendHolding: boolean;
}

// Pip values for major pairs (in USD for standard lot)
const PIP_VALUES: Record<string, number> = {
  'EURUSD': 10,
  'GBPUSD': 10,
  'AUDUSD': 10,
  'NZDUSD': 10,
  'USDJPY': 9.09,
  'USDCHF': 10.75,
  'USDCAD': 7.35,
  'EURJPY': 9.09,
  'GBPJPY': 9.09,
  'EURGBP': 12.50,
  'XAUUSD': 10,
  'BTCUSD': 1,
  'ETHUSD': 1,
};

// Fetch user trading parameters from questionnaire
export const getUserTradingParams = async (userId: string): Promise<UserTradingParams | null> => {
  try {
    const { data, error } = await supabase
      .from('questionnaires')
      .select('account_size, risk_percentage, prop_firm, account_type')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) return null;

    return {
      accountSize: data.account_size || 10000,
      riskPercentage: data.risk_percentage || 1,
      propFirm: data.prop_firm || 'FTMO',
      accountType: data.account_type || 'Challenge',
    };
  } catch (err) {
    console.error('Error fetching user trading params:', err);
    return null;
  }
};

export const calculateLotSize = (input: LotSizeInput): LotSizeResult => {
  const { accountBalance, riskPercentage, stopLossPips, currencyPair } = input;

  // Calculate risk amount
  const riskAmount = accountBalance * (riskPercentage / 100);

  // Get pip value (default to 10 if pair not found)
  const normalizedPair = currencyPair.replace('/', '').toUpperCase();
  const pipValue = PIP_VALUES[normalizedPair] || 10;

  // Calculate lot size: Risk Amount / (Stop Loss in Pips * Pip Value)
  const standardLots = riskAmount / (stopLossPips * pipValue);
  const miniLots = standardLots * 10;
  const microLots = standardLots * 100;

  // Round to 2 decimal places, minimum 0.01
  const lotSize = Math.max(0.01, Math.floor(microLots) / 100);

  return {
    lotSize,
    microLots: Math.floor(microLots),
    miniLots: Math.floor(miniLots * 10) / 10,
    standardLots: Math.floor(standardLots * 100) / 100,
    riskAmount,
    pipValue,
  };
};

// Calculate lot size for a signal based on user's questionnaire
export const calculateSignalLotSize = async (
  userId: string,
  symbol: string,
  entryPrice: number,
  stopLoss: number
): Promise<number> => {
  const params = await getUserTradingParams(userId);
  
  if (!params) {
    return 0.01; // Default minimum lot size
  }

  // Calculate stop loss in pips
  const normalizedSymbol = symbol.replace('/', '').toUpperCase();
  const isJpyPair = normalizedSymbol.includes('JPY');
  const isGold = normalizedSymbol.includes('XAU');
  const isCrypto = normalizedSymbol.includes('BTC') || normalizedSymbol.includes('ETH');

  let stopLossPips: number;
  
  if (isCrypto) {
    // For crypto, calculate based on percentage
    stopLossPips = Math.abs(entryPrice - stopLoss) / entryPrice * 100;
  } else if (isGold) {
    // Gold: 1 pip = $0.10
    stopLossPips = Math.abs(entryPrice - stopLoss) * 10;
  } else if (isJpyPair) {
    // JPY pairs: 1 pip = 0.01
    stopLossPips = Math.abs(entryPrice - stopLoss) * 100;
  } else {
    // Standard forex: 1 pip = 0.0001
    stopLossPips = Math.abs(entryPrice - stopLoss) * 10000;
  }

  // Minimum 1 pip to avoid division issues
  stopLossPips = Math.max(1, stopLossPips);

  const result = calculateLotSize({
    accountBalance: params.accountSize,
    riskPercentage: params.riskPercentage,
    stopLossPips,
    currencyPair: symbol,
  });

  // Apply prop firm limits if applicable
  const propFirmRules = getPropFirmRules(params.propFirm);
  const maxLots = (params.accountSize / 10000) * (propFirmRules.maxPositionSize / 100);

  return Math.min(result.lotSize, maxLots);
};

export const calculatePipValue = (
  currencyPair: string,
  lotSize: number,
  accountCurrency: string = 'USD'
): number => {
  const normalizedPair = currencyPair.replace('/', '').toUpperCase();
  const basePipValue = PIP_VALUES[normalizedPair] || 10;
  return basePipValue * lotSize;
};

export const calculatePnL = (
  entryPrice: number,
  exitPrice: number,
  direction: 'BUY' | 'SELL',
  lotSize: number,
  currencyPair: string
): number => {
  const priceDiff = direction === 'BUY' 
    ? exitPrice - entryPrice 
    : entryPrice - exitPrice;

  // Calculate pips (for JPY pairs, 1 pip = 0.01, others 0.0001)
  const normalizedPair = currencyPair.replace('/', '').toUpperCase();
  const isJpyPair = normalizedPair.includes('JPY');
  const pipMultiplier = isJpyPair ? 100 : 10000;
  const pips = priceDiff * pipMultiplier;

  // Calculate PnL
  const pipValue = calculatePipValue(currencyPair, lotSize);
  return pips * pipValue;
};

export const getPropFirmRules = (propFirm: string): PropFirmRules => {
  const rules: Record<string, PropFirmRules> = {
    'FTMO': {
      maxDailyDrawdown: 5,
      maxTotalDrawdown: 10,
      profitTarget: 10,
      minTradingDays: 4,
      maxPositionSize: 100,
      newsRestriction: true,
      weekendHolding: true,
    },
    'Funded Next': {
      maxDailyDrawdown: 5,
      maxTotalDrawdown: 10,
      profitTarget: 10,
      minTradingDays: 0,
      maxPositionSize: 100,
      newsRestriction: false,
      weekendHolding: true,
    },
    'My Forex Funds': {
      maxDailyDrawdown: 5,
      maxTotalDrawdown: 12,
      profitTarget: 8,
      minTradingDays: 5,
      maxPositionSize: 100,
      newsRestriction: true,
      weekendHolding: false,
    },
    'The5ers': {
      maxDailyDrawdown: 4,
      maxTotalDrawdown: 6,
      profitTarget: 8,
      minTradingDays: 3,
      maxPositionSize: 100,
      newsRestriction: false,
      weekendHolding: true,
    },
    'True Forex Funds': {
      maxDailyDrawdown: 5,
      maxTotalDrawdown: 10,
      profitTarget: 8,
      minTradingDays: 5,
      maxPositionSize: 100,
      newsRestriction: true,
      weekendHolding: true,
    },
  };

  return rules[propFirm] || rules['FTMO'];
};

export const calculateRiskReward = (
  entryPrice: number,
  stopLoss: number,
  takeProfit: number,
  direction: 'BUY' | 'SELL'
): { risk: number; reward: number; ratio: string } => {
  let risk: number;
  let reward: number;

  if (direction === 'BUY') {
    risk = entryPrice - stopLoss;
    reward = takeProfit - entryPrice;
  } else {
    risk = stopLoss - entryPrice;
    reward = entryPrice - takeProfit;
  }

  const ratio = Math.abs(reward / risk);
  
  return {
    risk: Math.abs(risk),
    reward: Math.abs(reward),
    ratio: `1:${ratio.toFixed(2)}`,
  };
};

export const isWithinRiskLimits = (
  currentDrawdown: number,
  dailyPnL: number,
  propFirmRules: PropFirmRules
): { safe: boolean; warnings: string[] } => {
  const warnings: string[] = [];

  if (Math.abs(currentDrawdown) >= propFirmRules.maxTotalDrawdown * 0.8) {
    warnings.push(`Approaching max drawdown limit (${propFirmRules.maxTotalDrawdown}%)`);
  }

  if (Math.abs(dailyPnL) >= propFirmRules.maxDailyDrawdown * 0.8) {
    warnings.push(`Approaching daily loss limit (${propFirmRules.maxDailyDrawdown}%)`);
  }

  const safe = 
    Math.abs(currentDrawdown) < propFirmRules.maxTotalDrawdown &&
    Math.abs(dailyPnL) < propFirmRules.maxDailyDrawdown;

  return { safe, warnings };
};
