// Trading Calculator Service
// Advanced lot size, P&L, and risk calculations for Forex, Futures, and Crypto

export type InstrumentType = 'forex' | 'futures' | 'crypto';

interface QuestionnaireData {
  accountSize?: number;
  accountEquity?: number;
  riskPercentage?: number;
  riskRewardRatio?: string;
}

interface Signal {
  pair?: string;
  symbol?: string;
  entry?: number | string;
  entryPrice?: number | string;
  entry_price?: number;
  stopLoss?: number | string;
  stop_loss?: number | null;
  takeProfit?: number | string | number[];
  take_profit?: number | null;
}

interface LotSizeResult {
  lotSize: number;
  potentialProfit: number;
  potentialLoss: number;
  dollarAmount: number;
  matchesUserPreference: boolean;
  riskReward: string;
  stopLossPips: number;
  takeProfitPips: number;
  instrumentType: InstrumentType;
  positionLabel: string;
  calculationBreakdown: string;
}

// Detect instrument type from symbol
export const detectInstrumentType = (symbol: string): InstrumentType => {
  const upperSymbol = symbol.toUpperCase();
  
  // Crypto detection
  if (upperSymbol.includes('BTC') || upperSymbol.includes('ETH') || 
      upperSymbol.includes('SOL') || upperSymbol.includes('XRP') ||
      upperSymbol.includes('DOGE') || upperSymbol.includes('ADA') ||
      upperSymbol.includes('USDT') || upperSymbol.includes('BNB')) {
    return 'crypto';
  }
  
  // Futures detection (common futures symbols)
  if (upperSymbol.includes('ES') || upperSymbol.includes('NQ') || 
      upperSymbol.includes('YM') || upperSymbol.includes('RTY') ||
      upperSymbol.includes('CL') || upperSymbol.includes('GC') ||
      upperSymbol.includes('SI') || upperSymbol.includes('ZB') ||
      upperSymbol.includes('ZN') || upperSymbol.includes('ZC') ||
      upperSymbol.includes('ZS') || upperSymbol.includes('ZW')) {
    return 'futures';
  }
  
  // Default to forex
  return 'forex';
};

// Get pip value based on currency pair
export const getPipValue = (symbol: string): number => {
  const upperSymbol = symbol.toUpperCase();
  if (upperSymbol.includes('JPY')) return 0.01;
  return 0.0001;
};

// Get pip value per lot based on instrument
export const getPipValuePerLot = (symbol: string, instrumentType?: InstrumentType): number => {
  const upperSymbol = symbol.toUpperCase();
  const type = instrumentType || detectInstrumentType(symbol);
  
  if (type === 'crypto') {
    // Crypto: value per point depends on position size
    return 1;
  }
  
  if (type === 'futures') {
    // Futures tick values
    if (upperSymbol.includes('ES')) return 12.50; // E-mini S&P 500
    if (upperSymbol.includes('NQ')) return 5.00;  // E-mini NASDAQ
    if (upperSymbol.includes('YM')) return 5.00;  // E-mini Dow
    if (upperSymbol.includes('CL')) return 10.00; // Crude Oil
    if (upperSymbol.includes('GC')) return 10.00; // Gold futures
    return 12.50; // Default tick value
  }
  
  // Forex
  if (upperSymbol.includes('XAU') || upperSymbol.includes('GOLD')) return 100; // Gold
  if (upperSymbol.includes('XAG') || upperSymbol.includes('SILVER')) return 50; // Silver
  return 10; // Forex majors ($10 per pip per standard lot)
};

// Load questionnaire data from localStorage
export const loadQuestionnaireData = (): QuestionnaireData => {
  try {
    const stored = localStorage.getItem('questionnaireAnswers');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading questionnaire data:', error);
  }
  return {};
};

// Calculate lot size and P&L based on signal and user settings
export const calculateLotSizeAndPL = (signal: Signal, overrideData?: Partial<QuestionnaireData>): LotSizeResult => {
  const questionnaireData = { ...loadQuestionnaireData(), ...overrideData };
  
  const accountBalance = questionnaireData.accountSize || questionnaireData.accountEquity || 10000;
  const riskPercentage = questionnaireData.riskPercentage || 1;
  const userRiskReward = questionnaireData.riskRewardRatio || '2';
  
  const symbol = signal.pair || signal.symbol || 'EURUSD';
  const instrumentType = detectInstrumentType(symbol);
  const entryPrice = parseFloat(String(signal.entry || signal.entryPrice || signal.entry_price || '0'));
  const stopLoss = parseFloat(String(signal.stopLoss || signal.stop_loss || '0'));
  
  // Handle take profit (can be array or single value)
  let takeProfit = 0;
  if (Array.isArray(signal.takeProfit)) {
    takeProfit = parseFloat(String(signal.takeProfit[0] || '0'));
  } else {
    takeProfit = parseFloat(String(signal.takeProfit || signal.take_profit || '0'));
  }

  // Validate inputs
  if (!entryPrice || !stopLoss) {
    return {
      lotSize: 0,
      potentialProfit: 0,
      potentialLoss: 0,
      dollarAmount: 0,
      matchesUserPreference: true,
      riskReward: '0',
      stopLossPips: 0,
      takeProfitPips: 0,
      instrumentType,
      positionLabel: 'Lot Size',
      calculationBreakdown: 'Invalid input data',
    };
  }

  // Step 1: Calculate Money at Risk
  const moneyAtRisk = (accountBalance * riskPercentage) / 100;

  let lotSize = 0;
  let stopLossPips = 0;
  let takeProfitPips = 0;
  let positionLabel = 'Lot Size';
  let calculationBreakdown = '';

  switch (instrumentType) {
    case 'forex': {
      // Forex: Lot Size = Risk Amount / (Stop Loss in Pips × Pip Value per Lot)
      const pipValue = getPipValue(symbol);
      const pipValuePerLot = getPipValuePerLot(symbol, 'forex');
      
      stopLossPips = Math.abs(entryPrice - stopLoss) / pipValue;
      takeProfitPips = takeProfit ? Math.abs(takeProfit - entryPrice) / pipValue : 0;
      
      lotSize = moneyAtRisk / (stopLossPips * pipValuePerLot);
      positionLabel = 'Lot Size';
      calculationBreakdown = `Lot Size = $${moneyAtRisk.toFixed(2)} ÷ (${stopLossPips.toFixed(1)} pips × $${pipValuePerLot}/pip) = ${lotSize.toFixed(2)} lots`;
      break;
    }
    
    case 'futures': {
      // Futures: Contracts = Risk Amount / (Stop Loss in Ticks × Tick Value)
      const tickValue = getPipValuePerLot(symbol, 'futures');
      const tickSize = 0.25; // Standard tick size for E-mini
      
      stopLossPips = Math.abs(entryPrice - stopLoss) / tickSize;
      takeProfitPips = takeProfit ? Math.abs(takeProfit - entryPrice) / tickSize : 0;
      
      lotSize = moneyAtRisk / (stopLossPips * tickValue);
      positionLabel = 'Contracts';
      calculationBreakdown = `Contracts = $${moneyAtRisk.toFixed(2)} ÷ (${stopLossPips.toFixed(0)} ticks × $${tickValue}/tick) = ${lotSize.toFixed(2)}`;
      break;
    }
    
    case 'crypto': {
      // Crypto: Position Size = Risk Amount / (Stop Loss Distance / Entry Price)
      // For crypto, we calculate position size in base currency (e.g., BTC)
      const stopLossPercent = Math.abs(entryPrice - stopLoss) / entryPrice;
      stopLossPips = Math.abs(entryPrice - stopLoss); // Dollar distance
      takeProfitPips = takeProfit ? Math.abs(takeProfit - entryPrice) : 0;
      
      // Position size in base currency = Risk Amount / Stop Loss in $
      const positionValueUSD = moneyAtRisk / stopLossPercent;
      lotSize = positionValueUSD / entryPrice; // Convert to coin amount
      
      positionLabel = 'Position';
      calculationBreakdown = `Position = $${moneyAtRisk.toFixed(2)} ÷ (${(stopLossPercent * 100).toFixed(2)}% SL) = ${lotSize.toFixed(4)} units ($${positionValueUSD.toFixed(2)})`;
      break;
    }
  }

  // Ensure minimum lot size
  const roundedLotSize = Math.max(0.01, Math.round(lotSize * 100) / 100);

  // Calculate P&L based on instrument type
  let potentialProfit = 0;
  let potentialLoss = 0;

  switch (instrumentType) {
    case 'forex': {
      const pipValuePerLot = getPipValuePerLot(symbol, 'forex');
      potentialLoss = stopLossPips * roundedLotSize * pipValuePerLot;
      potentialProfit = takeProfitPips * roundedLotSize * pipValuePerLot;
      break;
    }
    case 'futures': {
      const tickValue = getPipValuePerLot(symbol, 'futures');
      potentialLoss = stopLossPips * roundedLotSize * tickValue;
      potentialProfit = takeProfitPips * roundedLotSize * tickValue;
      break;
    }
    case 'crypto': {
      // For crypto, P&L is based on position size and price movement
      potentialLoss = roundedLotSize * Math.abs(entryPrice - stopLoss);
      potentialProfit = takeProfit ? roundedLotSize * Math.abs(takeProfit - entryPrice) : 0;
      break;
    }
  }

  const dollarAmount = Math.round(moneyAtRisk * 100) / 100;

  // Calculate Risk:Reward Ratio
  const risk = Math.abs(entryPrice - stopLoss);
  const reward = takeProfit ? Math.abs(takeProfit - entryPrice) : 0;
  const calculatedRiskReward = risk > 0 && reward > 0 ? (reward / risk).toFixed(2) : '0';

  // Check if matches user preference
  const matchesUserPreference = parseFloat(calculatedRiskReward) >= parseFloat(userRiskReward);

  return {
    lotSize: roundedLotSize,
    potentialProfit: Math.round(potentialProfit * 100) / 100,
    potentialLoss: Math.round(potentialLoss * 100) / 100,
    dollarAmount,
    matchesUserPreference,
    riskReward: calculatedRiskReward,
    stopLossPips: Math.round(stopLossPips * 10) / 10,
    takeProfitPips: Math.round(takeProfitPips * 10) / 10,
    instrumentType,
    positionLabel,
    calculationBreakdown,
  };
};

// Calculate position size with dynamic risk adjustment
export const calculateDynamicPositionSize = (
  currentEquity: number,
  baseRiskPercentage: number,
  recentLosses: number,
  consecutiveLossesLimit: number = 3
): number => {
  let riskPercentage = baseRiskPercentage;

  // Dynamic risk adjustment based on recent performance
  if (recentLosses >= consecutiveLossesLimit) {
    riskPercentage *= 0.5; // Reduce risk by 50% after consecutive losses
  }

  return (currentEquity * riskPercentage) / 100;
};

// Format P&L for display
export const formatPnL = (pnl: number): string => {
  const prefix = pnl >= 0 ? '+' : '';
  return `${prefix}$${Math.abs(pnl).toFixed(2)}`;
};

// Calculate outcome-based P&L
export type TradeOutcome = 'target_hit' | 'stop_loss_hit' | 'breakeven' | 'custom';

export const getOutcomePnL = (
  outcome: TradeOutcome,
  potentialProfit: number,
  potentialLoss: number,
  customPnL?: number
): number => {
  switch (outcome) {
    case 'target_hit':
      return potentialProfit;
    case 'stop_loss_hit':
      return -potentialLoss;
    case 'breakeven':
      return 0;
    case 'custom':
      return customPnL || 0;
    default:
      return 0;
  }
};
