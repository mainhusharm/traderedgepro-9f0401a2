import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-session',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
};

interface CandleData {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: number;
}

interface PriceActionAnalysis {
  supportResistance: { level: number; touches: number; type: 'support' | 'resistance' }[];
  candlePatterns: { type: string; timeframe: string; strength: number }[];
  maAnalysis: { ema9: number; ema21: number; ema50: number; ema200: number; crosses: string[] };
  trendLines: { type: string; startPrice: number; endPrice: number; broken: boolean }[];
  divergences: { type: string; indicator: string; strength: number }[];
}

interface SMCAnalysis {
  orderBlocks: { type: 'bullish' | 'bearish'; high: number; low: number; mitigated: boolean }[];
  fvgs: { type: 'bullish' | 'bearish'; top: number; bottom: number; filled: boolean }[];
  liquiditySweeps: { type: string; level: number; time: number }[];
  amdPhase: 'accumulation' | 'manipulation' | 'distribution' | 'unknown';
  killZone: { name: string; active: boolean; probability: number };
}

interface IPDATargets {
  twentyDayHigh: number;
  twentyDayLow: number;
  fortyDayHigh: number;
  fortyDayLow: number;
  sixtyDayHigh: number;
  sixtyDayLow: number;
}

// ===========================================
// MARKET DATA FETCHING
// ===========================================

async function fetchMarketData(symbol: string, interval: string, range: string): Promise<CandleData[]> {
  try {
    const yahooSymbol = convertToYahooSymbol(symbol);
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=${interval}&range=${range}`;
    
    console.log(`Fetching ${symbol} - interval: ${interval}, range: ${range}`);
    
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    
    if (!response.ok) {
      console.warn(`Yahoo Finance API error for ${symbol}: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    const result = data.chart?.result?.[0];
    
    if (!result?.indicators?.quote?.[0]) {
      console.warn(`No data returned for ${yahooSymbol}`);
      return [];
    }
    
    const quote = result.indicators.quote[0];
    const timestamps = result.timestamp || [];
    const candles: CandleData[] = [];
    
    for (let i = 0; i < quote.open.length; i++) {
      if (quote.open[i] && quote.high[i] && quote.low[i] && quote.close[i]) {
        candles.push({
          open: quote.open[i],
          high: quote.high[i],
          low: quote.low[i],
          close: quote.close[i],
          volume: quote.volume[i] || 0,
          timestamp: timestamps[i] * 1000
        });
      }
    }
    
    console.log(`Got ${candles.length} candles for ${symbol}`);
    return candles;
    
  } catch (error) {
    console.error(`Error fetching ${symbol}:`, error);
    return [];
  }
}

function convertToYahooSymbol(symbol: string): string {
  // Forex pairs - using correct Yahoo Finance symbols
  const forexMap: Record<string, string> = {
    'EURUSD': 'EURUSD=X', 'GBPUSD': 'GBPUSD=X', 'USDJPY': 'JPY=X',
    'GBPJPY': 'GBPJPY=X', 'EURJPY': 'EURJPY=X', 'AUDUSD': 'AUDUSD=X',
    'USDCHF': 'CHF=X', 'USDCAD': 'CAD=X', 'NZDUSD': 'NZDUSD=X',
    'AUDJPY': 'AUDJPY=X', 'CADJPY': 'CADJPY=X', 'CHFJPY': 'CHFJPY=X',
    'EURAUD': 'EURAUD=X', 'EURGBP': 'EURGBP=X', 'EURCHF': 'EURCHF=X',
    'EURCAD': 'EURCAD=X', 'EURNZD': 'EURNZD=X', 'GBPAUD': 'GBPAUD=X',
    'GBPCAD': 'GBPCAD=X', 'GBPCHF': 'GBPCHF=X', 'GBPNZD': 'GBPNZD=X',
    'AUDCAD': 'AUDCAD=X', 'AUDCHF': 'AUDCHF=X', 'AUDNZD': 'AUDNZD=X',
    'NZDJPY': 'NZDJPY=X', 'CADCHF': 'CADCHF=X', 'NZDCAD': 'NZDCAD=X',
    'NZDCHF': 'NZDCHF=X',
  };
  
  // Precious Metals - Gold only (silver removed)
  const commoditiesMap: Record<string, string> = {
    'XAUUSD': 'GC=F',   // Gold futures
  };
  
  // Crypto pairs
  const cryptoMap: Record<string, string> = {
    'BTCUSD': 'BTC-USD',
    'ETHUSD': 'ETH-USD',
    'SOLUSD': 'SOL-USD',
    'BNBUSD': 'BNB-USD',
    'XRPUSD': 'XRP-USD',
    'ADAUSD': 'ADA-USD',
    'DOGEUSD': 'DOGE-USD',
    'AVAXUSD': 'AVAX-USD',
    'LINKUSD': 'LINK-USD',
    'MATICUSD': 'POL-USD',
  };
  
  // US Futures (ZB, ZN removed)
  const futuresMap: Record<string, string> = {
    'NQ': 'NQ=F',      // Nasdaq 100 E-mini
    'ES': 'ES=F',      // S&P 500 E-mini
    'YM': '^DJI',      // Dow Jones Industrial Average (cash index)
    'RTY': 'RTY=F',    // Russell 2000 E-mini
    'GC': 'GC=F',      // Gold
    'SI': 'SI=F',      // Silver
    'CL': 'CL=F',      // Crude Oil
    'NG': 'NG=F',      // Natural Gas
  };
  
  return forexMap[symbol] || commoditiesMap[symbol] || cryptoMap[symbol] || futuresMap[symbol] || symbol;
}

// Instrument type detection for proper pip/point calculations
function getInstrumentType(symbol: string): 'forex' | 'crypto' | 'futures' | 'commodity' {
  const cryptoSymbols = ['BTCUSD', 'ETHUSD', 'SOLUSD', 'BNBUSD', 'XRPUSD', 'ADAUSD', 'DOGEUSD', 'AVAXUSD', 'LINKUSD', 'MATICUSD'];
  const futuresSymbols = ['NQ', 'ES', 'YM', 'RTY', 'GC', 'SI', 'CL', 'NG'];
  const commoditySymbols = ['XAUUSD'];
  
  if (cryptoSymbols.includes(symbol)) return 'crypto';
  if (futuresSymbols.includes(symbol)) return 'futures';
  if (commoditySymbols.includes(symbol)) return 'commodity';
  return 'forex';
}

async function fetchRealtimePriceFromService(supabase: any, symbol: string): Promise<number | null> {
  try {
    const { data, error } = await supabase.functions.invoke('get-live-prices', {
      body: { symbols: [symbol] }
    });
    if (error) {
      console.warn(`get-live-prices invoke error for ${symbol}:`, error);
      return null;
    }
    const p = data?.prices?.[symbol]?.price;
    return typeof p === 'number' && Number.isFinite(p) ? p : null;
  } catch (e) {
    console.warn(`get-live-prices invoke failed for ${symbol}:`, e);
    return null;
  }
}

// ===========================================
// PRE-ENTRY CHECK FUNCTIONS
// ===========================================

function calculateATR(candles: CandleData[], period: number): number {
  if (candles.length < period + 1) return 0;
  
  let atrSum = 0;
  for (let i = 1; i <= period; i++) {
    const curr = candles[candles.length - i];
    const prev = candles[candles.length - i - 1];
    if (!curr || !prev) continue;
    
    const tr = Math.max(
      curr.high - curr.low,
      Math.abs(curr.high - prev.close),
      Math.abs(curr.low - prev.close)
    );
    atrSum += tr;
  }
  
  return atrSum / period;
}

function calculateAverageATR(candles: CandleData[], period: number): number {
  if (candles.length < period * 2) return 0;
  
  // Calculate ATR for each day over the period
  const atrValues: number[] = [];
  for (let i = period; i < candles.length; i++) {
    const slice = candles.slice(i - period, i);
    const atr = calculateATR([...slice, candles[i]], period);
    if (atr > 0) atrValues.push(atr);
  }
  
  if (atrValues.length === 0) return 0;
  return atrValues.reduce((a, b) => a + b, 0) / atrValues.length;
}

function estimateSpread(symbol: string): number {
  // Typical spreads for different instruments
  const spreads: Record<string, number> = {
    // Forex Majors
    'EURUSD': 0.8, 'GBPUSD': 1.2, 'USDJPY': 0.9, 'USDCHF': 1.2, 'USDCAD': 1.5,
    'AUDUSD': 1.0, 'NZDUSD': 1.2,
    // Forex Crosses
    'GBPJPY': 2.5, 'EURJPY': 1.5, 'AUDJPY': 1.8, 'CADJPY': 2.0, 'CHFJPY': 2.0,
    'NZDJPY': 2.0, 'EURAUD': 2.5, 'EURGBP': 1.5, 'EURCHF': 1.8, 'EURCAD': 2.0,
    'EURNZD': 3.0, 'GBPAUD': 3.0, 'GBPCAD': 2.5, 'GBPCHF': 2.5, 'GBPNZD': 4.0,
    'AUDCAD': 2.0, 'AUDCHF': 2.0, 'AUDNZD': 2.5, 'CADCHF': 2.0, 'NZDCAD': 2.5,
    'NZDCHF': 2.5,
    // Commodities
    'XAUUSD': 2.0,
    // Crypto (spreads in dollars)
    'BTCUSD': 50, 'ETHUSD': 3, 'SOLUSD': 0.1, 'BNBUSD': 0.5, 'XRPUSD': 0.005,
    'ADAUSD': 0.002, 'DOGEUSD': 0.0002, 'AVAXUSD': 0.1, 'LINKUSD': 0.05, 'MATICUSD': 0.005,
    // Futures (points)
    'NQ': 0.5, 'ES': 0.25, 'YM': 1, 'RTY': 0.1, 'GC': 0.3, 'SI': 0.01,
    'CL': 0.02, 'NG': 0.002,
  };
  return spreads[symbol] || 2.0;
}

async function checkUpcomingNews(supabase: any, symbol: string): Promise<{ newsWithin30Min: boolean; minutesUntil: number | null }> {
  try {
    // Parse currencies from symbol
    const currencies: string[] = [];
    if (symbol.includes('XAU')) {
      currencies.push('USD', 'XAU');
    } else {
      currencies.push(symbol.slice(0, 3), symbol.slice(3, 6));
    }
    
    const now = new Date();
    const thirtyMinsFromNow = new Date(now.getTime() + 30 * 60 * 1000);
    
    // Check economic calendar for high-impact news
    const { data: events } = await supabase
      .from('economic_calendar')
      .select('*')
      .in('currency', currencies)
      .eq('impact', 'high')
      .gte('event_time', now.toISOString())
      .lte('event_time', thirtyMinsFromNow.toISOString())
      .limit(1);
    
    if (events && events.length > 0) {
      const eventTime = new Date(events[0].event_time);
      const minutesUntil = Math.round((eventTime.getTime() - now.getTime()) / (1000 * 60));
      return { newsWithin30Min: true, minutesUntil };
    }
    
    return { newsWithin30Min: false, minutesUntil: null };
  } catch (error) {
    console.error('Error checking news:', error);
    return { newsWithin30Min: false, minutesUntil: null };
  }
}

function checkVolatilityRegime(atr14: number, avgATR: number): { regime: string; allowed: boolean } {
  const ratio = atr14 / avgATR;
  
  if (ratio > 2) {
    return { regime: 'extreme', allowed: false };
  } else if (ratio > 1.5) {
    return { regime: 'high', allowed: true };
  } else if (ratio < 0.5) {
    return { regime: 'low', allowed: true };
  } else {
    return { regime: 'normal', allowed: true };
  }
}

// ===========================================
// PRICE ACTION MODULE (HTF - 1H+)
// ===========================================

function calculateEMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1] || 0;
  const multiplier = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
  }
  return ema;
}

function findPriceActionLevels(candles: CandleData[]): PriceActionAnalysis['supportResistance'] {
  const levels: PriceActionAnalysis['supportResistance'] = [];
  const tolerance = 0.002; // 0.2% tolerance
  
  // Find swing highs and lows
  for (let i = 3; i < candles.length - 3; i++) {
    const c = candles[i];
    const prevCandles = candles.slice(i - 3, i);
    const nextCandles = candles.slice(i + 1, i + 4);
    
    // Swing High (Resistance)
    if (c.high > Math.max(...prevCandles.map(x => x.high)) && 
        c.high > Math.max(...nextCandles.map(x => x.high))) {
      const existingLevel = levels.find(l => Math.abs(l.level - c.high) / c.high < tolerance);
      if (existingLevel) {
        existingLevel.touches++;
      } else {
        levels.push({ level: c.high, touches: 1, type: 'resistance' });
      }
    }
    
    // Swing Low (Support)
    if (c.low < Math.min(...prevCandles.map(x => x.low)) && 
        c.low < Math.min(...nextCandles.map(x => x.low))) {
      const existingLevel = levels.find(l => Math.abs(l.level - c.low) / c.low < tolerance);
      if (existingLevel) {
        existingLevel.touches++;
      } else {
        levels.push({ level: c.low, touches: 1, type: 'support' });
      }
    }
  }
  
  return levels.sort((a, b) => b.touches - a.touches).slice(0, 6);
}

function detectCandlestickPatterns(candles: CandleData[]): PriceActionAnalysis['candlePatterns'] {
  const patterns: PriceActionAnalysis['candlePatterns'] = [];
  const recent = candles.slice(-10);
  
  for (let i = 1; i < recent.length; i++) {
    const curr = recent[i];
    const prev = recent[i - 1];
    const body = Math.abs(curr.close - curr.open);
    const range = curr.high - curr.low;
    const upperWick = curr.high - Math.max(curr.open, curr.close);
    const lowerWick = Math.min(curr.open, curr.close) - curr.low;
    
    // Bullish Engulfing
    if (prev.close < prev.open && curr.close > curr.open &&
        curr.open <= prev.close && curr.close >= prev.open) {
      patterns.push({ type: 'bullish_engulfing', timeframe: 'htf', strength: 0.8 });
    }
    
    // Bearish Engulfing
    if (prev.close > prev.open && curr.close < curr.open &&
        curr.open >= prev.close && curr.close <= prev.open) {
      patterns.push({ type: 'bearish_engulfing', timeframe: 'htf', strength: 0.8 });
    }
    
    // Hammer (Bullish)
    if (lowerWick > body * 2 && upperWick < body * 0.5 && curr.close > curr.open) {
      patterns.push({ type: 'hammer', timeframe: 'htf', strength: 0.7 });
    }
    
    // Shooting Star (Bearish)
    if (upperWick > body * 2 && lowerWick < body * 0.5 && curr.close < curr.open) {
      patterns.push({ type: 'shooting_star', timeframe: 'htf', strength: 0.7 });
    }
    
    // Doji
    if (body < range * 0.1) {
      patterns.push({ type: 'doji', timeframe: 'htf', strength: 0.5 });
    }
  }
  
  return patterns;
}

function analyzeMovingAverages(candles: CandleData[]): PriceActionAnalysis['maAnalysis'] {
  const closes = candles.map(c => c.close);
  const ema9 = calculateEMA(closes, 9);
  const ema21 = calculateEMA(closes, 21);
  const ema50 = calculateEMA(closes, 50);
  const ema200 = calculateEMA(closes, 200);
  
  const crosses: string[] = [];
  
  // Check for recent crosses (last 5 candles)
  for (let i = candles.length - 5; i < candles.length; i++) {
    if (i < 21) continue;
    const prevCloses = closes.slice(0, i);
    const currCloses = closes.slice(0, i + 1);
    
    const prevEma9 = calculateEMA(prevCloses, 9);
    const currEma9 = calculateEMA(currCloses, 9);
    const prevEma21 = calculateEMA(prevCloses, 21);
    const currEma21 = calculateEMA(currCloses, 21);
    
    if (prevEma9 < prevEma21 && currEma9 > currEma21) {
      crosses.push('golden_cross_9_21');
    }
    if (prevEma9 > prevEma21 && currEma9 < currEma21) {
      crosses.push('death_cross_9_21');
    }
  }
  
  return { ema9, ema21, ema50, ema200, crosses };
}

function detectDivergence(candles: CandleData[]): PriceActionAnalysis['divergences'] {
  const divergences: PriceActionAnalysis['divergences'] = [];
  const recent = candles.slice(-20);
  
  // Calculate RSI
  let gains = 0, losses = 0;
  for (let i = 1; i < recent.length; i++) {
    const change = recent[i].close - recent[i - 1].close;
    if (change > 0) gains += change;
    else losses -= change;
  }
  const rsi = 100 - (100 / (1 + gains / (losses || 0.001)));
  
  // Find price highs and lows
  const priceHighs = recent.slice(-5).map(c => c.high);
  const priceLows = recent.slice(-5).map(c => c.low);
  const overallHigh = Math.max(...recent.map(c => c.high));
  const overallLow = Math.min(...recent.map(c => c.low));
  
  // Bearish divergence: price making new highs but RSI not overbought
  if (Math.max(...priceHighs) >= overallHigh * 0.998 && rsi < 65) {
    divergences.push({ type: 'bearish_regular', indicator: 'RSI', strength: 0.7 });
  }
  
  // Bullish divergence: price making new lows but RSI not oversold
  if (Math.min(...priceLows) <= overallLow * 1.002 && rsi > 35) {
    divergences.push({ type: 'bullish_regular', indicator: 'RSI', strength: 0.7 });
  }
  
  return divergences;
}

function determineHTFBias(pa: PriceActionAnalysis, currentPrice: number): 'bullish' | 'bearish' | 'neutral' {
  let bullishScore = 0;
  let bearishScore = 0;
  
  // MA Analysis
  if (currentPrice > pa.maAnalysis.ema200) bullishScore += 2;
  else bearishScore += 2;
  
  if (pa.maAnalysis.ema9 > pa.maAnalysis.ema21) bullishScore += 1;
  else bearishScore += 1;
  
  // Candlestick patterns
  pa.candlePatterns.forEach(p => {
    if (p.type.includes('bullish') || p.type === 'hammer') bullishScore += p.strength;
    if (p.type.includes('bearish') || p.type === 'shooting_star') bearishScore += p.strength;
  });
  
  // Divergences
  pa.divergences.forEach(d => {
    if (d.type.includes('bullish')) bullishScore += d.strength;
    if (d.type.includes('bearish')) bearishScore += d.strength;
  });
  
  // MA crosses
  pa.maAnalysis.crosses.forEach(c => {
    if (c.includes('golden')) bullishScore += 1;
    if (c.includes('death')) bearishScore += 1;
  });
  
  const diff = bullishScore - bearishScore;
  if (diff > 1.5) return 'bullish';
  if (diff < -1.5) return 'bearish';
  return 'neutral';
}

// ===========================================
// SMC/IPDA MODULE (LTF - Below 1H)
// ===========================================

function findOrderBlocks(candles: CandleData[]): SMCAnalysis['orderBlocks'] {
  const orderBlocks: SMCAnalysis['orderBlocks'] = [];
  
  for (let i = 2; i < candles.length - 2; i++) {
    const c = candles[i];
    const next = candles[i + 1];
    const nextNext = candles[i + 2];
    
    // Bullish Order Block: Last bearish candle before impulsive bullish move
    if (c.close < c.open && next.close > next.open) {
      const impulse = (nextNext.close - c.low) / c.low;
      if (impulse > 0.003) { // 0.3% impulse move
        orderBlocks.push({
          type: 'bullish',
          high: c.high,
          low: c.low,
          mitigated: false
        });
      }
    }
    
    // Bearish Order Block: Last bullish candle before impulsive bearish move
    if (c.close > c.open && next.close < next.open) {
      const impulse = (c.high - nextNext.close) / c.high;
      if (impulse > 0.003) {
        orderBlocks.push({
          type: 'bearish',
          high: c.high,
          low: c.low,
          mitigated: false
        });
      }
    }
  }
  
  return orderBlocks.slice(-4);
}

function findFairValueGaps(candles: CandleData[]): SMCAnalysis['fvgs'] {
  const fvgs: SMCAnalysis['fvgs'] = [];
  
  for (let i = 1; i < candles.length - 1; i++) {
    const prev = candles[i - 1];
    const next = candles[i + 1];
    
    // Bullish FVG: Gap between candle 1's high and candle 3's low
    if (prev.high < next.low) {
      fvgs.push({
        type: 'bullish',
        top: next.low,
        bottom: prev.high,
        filled: false
      });
    }
    
    // Bearish FVG: Gap between candle 1's low and candle 3's high
    if (prev.low > next.high) {
      fvgs.push({
        type: 'bearish',
        top: prev.low,
        bottom: next.high,
        filled: false
      });
    }
  }
  
  return fvgs.slice(-4);
}

function detectLiquiditySweeps(candles: CandleData[], levels: PriceActionAnalysis['supportResistance']): SMCAnalysis['liquiditySweeps'] {
  const sweeps: SMCAnalysis['liquiditySweeps'] = [];
  const recent = candles.slice(-10);
  
  for (const level of levels) {
    for (let i = 1; i < recent.length; i++) {
      const c = recent[i];
      const prev = recent[i - 1];
      
      // Sweep of resistance (bull trap)
      if (level.type === 'resistance') {
        if (c.high > level.level && c.close < level.level && c.close < c.open) {
          sweeps.push({ type: 'resistance_sweep', level: level.level, time: c.timestamp });
        }
      }
      
      // Sweep of support (bear trap)
      if (level.type === 'support') {
        if (c.low < level.level && c.close > level.level && c.close > c.open) {
          sweeps.push({ type: 'support_sweep', level: level.level, time: c.timestamp });
        }
      }
    }
  }
  
  return sweeps.slice(-3);
}

function detectAMDPattern(candles: CandleData[]): SMCAnalysis['amdPhase'] {
  const recent = candles.slice(-20);
  
  // Calculate volatility for different periods
  const firstHalf = recent.slice(0, 10);
  const secondHalf = recent.slice(10);
  
  const calcVolatility = (c: CandleData[]) => {
    const ranges = c.map(x => (x.high - x.low) / x.close);
    return ranges.reduce((a, b) => a + b, 0) / c.length;
  };
  
  const firstVol = calcVolatility(firstHalf);
  const secondVol = calcVolatility(secondHalf);
  
  // Price range analysis
  const firstRange = Math.max(...firstHalf.map(c => c.high)) - Math.min(...firstHalf.map(c => c.low));
  const secondRange = Math.max(...secondHalf.map(c => c.high)) - Math.min(...secondHalf.map(c => c.low));
  
  // Accumulation: Low volatility, tight range
  if (firstVol < 0.005 && firstRange / firstHalf[0].close < 0.01) {
    if (secondVol > firstVol * 1.5) {
      return 'manipulation';
    }
    return 'accumulation';
  }
  
  // Manipulation: Sudden spike then reversal
  const lastFew = recent.slice(-5);
  const hasSpike = lastFew.some(c => (c.high - c.low) / c.close > 0.01);
  const hasReversal = lastFew[lastFew.length - 1].close < lastFew[0].open;
  
  if (hasSpike && hasReversal) {
    return 'manipulation';
  }
  
  // Distribution: Strong directional move
  if (secondVol > firstVol * 2 && secondRange > firstRange * 1.5) {
    return 'distribution';
  }
  
  return 'unknown';
}

function analyzeKillZone(): SMCAnalysis['killZone'] {
  const now = new Date();
  const utcHour = now.getUTCHours();
  
  // Convert to EST (UTC-5)
  const estHour = (utcHour - 5 + 24) % 24;
  
  // London Open: 2-5 AM EST (7-10 UTC)
  if (estHour >= 2 && estHour < 5) {
    return { name: 'london_open', active: true, probability: 0.75 };
  }
  
  // NY Open: 7-10 AM EST (12-15 UTC)
  if (estHour >= 7 && estHour < 10) {
    return { name: 'ny_open', active: true, probability: 0.80 };
  }
  
  // London Close: 11 AM - 12 PM EST
  if (estHour >= 11 && estHour < 12) {
    return { name: 'london_close', active: true, probability: 0.65 };
  }
  
  // Asian Session: 7 PM - 4 AM EST
  if (estHour >= 19 || estHour < 4) {
    return { name: 'asian', active: true, probability: 0.50 };
  }
  
  return { name: 'off_hours', active: false, probability: 0.40 };
}

function calculateIPDATargets(dailyCandles: CandleData[]): IPDATargets {
  const last20 = dailyCandles.slice(-20);
  const last40 = dailyCandles.slice(-40);
  const last60 = dailyCandles.slice(-60);
  
  return {
    twentyDayHigh: Math.max(...last20.map(c => c.high)),
    twentyDayLow: Math.min(...last20.map(c => c.low)),
    fortyDayHigh: Math.max(...last40.map(c => c.high)),
    fortyDayLow: Math.min(...last40.map(c => c.low)),
    sixtyDayHigh: Math.max(...last60.map(c => c.high)),
    sixtyDayLow: Math.min(...last60.map(c => c.low)),
  };
}

// ===========================================
// CONFLUENCE ENGINE
// ===========================================

interface ConfluenceResult {
  score: number;
  factors: string[];
  aligned: boolean;
  htfBias: 'bullish' | 'bearish' | 'neutral';
  ltfEntry: 'buy' | 'sell' | 'none';
}

function calculateConfluence(
  htfBias: 'bullish' | 'bearish' | 'neutral',
  pa: PriceActionAnalysis,
  smc: SMCAnalysis,
  currentPrice: number
): ConfluenceResult {
  const factors: string[] = [];
  let score = 0;
  
  // 1. HTF Bias Clear (+1)
  if (htfBias !== 'neutral') {
    score += 1;
    factors.push('htf_bias_clear');
  }
  
  // 2. Above/Below EMA200 (+1)
  if ((htfBias === 'bullish' && currentPrice > pa.maAnalysis.ema200) ||
      (htfBias === 'bearish' && currentPrice < pa.maAnalysis.ema200)) {
    score += 1;
    factors.push('ema200_aligned');
  }
  
  // 3. Candlestick Pattern Confirmation (+1)
  const hasConfirmingPattern = pa.candlePatterns.some(p => 
    (htfBias === 'bullish' && (p.type.includes('bullish') || p.type === 'hammer')) ||
    (htfBias === 'bearish' && (p.type.includes('bearish') || p.type === 'shooting_star'))
  );
  if (hasConfirmingPattern) {
    score += 1;
    factors.push('candle_pattern_confirm');
  }
  
  // 4. Divergence Present (+1)
  const hasConfirmingDivergence = pa.divergences.some(d =>
    (htfBias === 'bullish' && d.type.includes('bullish')) ||
    (htfBias === 'bearish' && d.type.includes('bearish'))
  );
  if (hasConfirmingDivergence) {
    score += 1;
    factors.push('divergence_present');
  }
  
  // 5. Liquidity Swept (+1)
  const hasLiquiditySweep = smc.liquiditySweeps.length > 0;
  if (hasLiquiditySweep) {
    score += 1;
    factors.push('liquidity_swept');
  }
  
  // 6. Order Block Reaction (+1)
  const hasOBReaction = smc.orderBlocks.some(ob =>
    (htfBias === 'bullish' && ob.type === 'bullish' && currentPrice >= ob.low && currentPrice <= ob.high) ||
    (htfBias === 'bearish' && ob.type === 'bearish' && currentPrice >= ob.low && currentPrice <= ob.high)
  );
  if (hasOBReaction) {
    score += 1;
    factors.push('order_block_reaction');
  }
  
  // 7. FVG Target (+1)
  const hasFVGTarget = smc.fvgs.some(fvg =>
    (htfBias === 'bullish' && fvg.type === 'bullish' && !fvg.filled) ||
    (htfBias === 'bearish' && fvg.type === 'bearish' && !fvg.filled)
  );
  if (hasFVGTarget) {
    score += 1;
    factors.push('fvg_target');
  }
  
  // 8. Kill Zone Active (+1)
  if (smc.killZone.active) {
    score += 1;
    factors.push('kill_zone_active');
  }
  
  // 9. AMD Phase Correct (+1)
  if (smc.amdPhase === 'manipulation' || smc.amdPhase === 'distribution') {
    score += 1;
    factors.push('amd_phase_correct');
  }
  
  // 10. MA Cross Recent (+1)
  if (pa.maAnalysis.crosses.length > 0) {
    const hasConfirmingCross = pa.maAnalysis.crosses.some(c =>
      (htfBias === 'bullish' && c.includes('golden')) ||
      (htfBias === 'bearish' && c.includes('death'))
    );
    if (hasConfirmingCross) {
      score += 1;
      factors.push('ma_cross_recent');
    }
  }
  
  // Determine LTF entry based on SMC
  let ltfEntry: 'buy' | 'sell' | 'none' = 'none';
  if (smc.liquiditySweeps.some(s => s.type === 'support_sweep')) ltfEntry = 'buy';
  if (smc.liquiditySweeps.some(s => s.type === 'resistance_sweep')) ltfEntry = 'sell';
  if (smc.orderBlocks.some(ob => ob.type === 'bullish' && !ob.mitigated)) ltfEntry = 'buy';
  if (smc.orderBlocks.some(ob => ob.type === 'bearish' && !ob.mitigated)) ltfEntry = 'sell';
  
  // Check alignment
  const aligned = (htfBias === 'bullish' && ltfEntry === 'buy') ||
                  (htfBias === 'bearish' && ltfEntry === 'sell');
  
  return { score, factors, aligned, htfBias, ltfEntry };
}

// ===========================================
// SIGNAL GENERATION
// ===========================================

function getPipValue(symbol: string): number {
  if (symbol.includes('JPY')) return 0.01;
  if (symbol.includes('XAU') || symbol.includes('GC')) return 0.1;
  return 0.0001;
}

function calculatePips(symbol: string, priceMove: number): number {
  const pipValue = getPipValue(symbol);
  return Math.abs(priceMove) / pipValue;
}

function generateInstitutionalSignal(
  symbol: string,
  currentPrice: number,
  confluence: ConfluenceResult,
  pa: PriceActionAnalysis,
  smc: SMCAnalysis,
  ipda: IPDATargets,
  analysisMode: string,
  htfTimeframe: string = '1H',
  ltfTimeframe: string = '15m'
) {
  const direction = confluence.htfBias === 'bullish' ? 'BUY' : 'SELL';
  const pipValue = getPipValue(symbol);
  
  // Find the nearest order block for SL placement
  let stopLoss: number;
  let slReason = '';
  
  if (direction === 'BUY') {
    // For BUY: SL below the order block low or recent swing low
    const bullishOBs = smc.orderBlocks.filter(ob => ob.type === 'bullish' && ob.low < currentPrice);
    const nearestOB = bullishOBs.length > 0 ? bullishOBs[bullishOBs.length - 1] : null;
    
    // Find nearest support below current price
    const supports = pa.supportResistance
      .filter(sr => sr.type === 'support' && sr.level < currentPrice)
      .sort((a, b) => b.level - a.level); // Closest first
    const nearestSupport = supports[0];
    
    if (nearestOB && (!nearestSupport || nearestOB.low > nearestSupport.level)) {
      // Use order block - SL 5 pips below OB low
      stopLoss = nearestOB.low - (5 * pipValue);
      slReason = 'Below Order Block';
    } else if (nearestSupport) {
      // Use support - SL 10 pips below support
      stopLoss = nearestSupport.level - (10 * pipValue);
      slReason = 'Below Support';
    } else {
      // Fallback: Use ATR-based or fixed pips (30 pips for forex, 100 pips for gold)
      const defaultPips = symbol.includes('XAU') ? 100 : 30;
      stopLoss = currentPrice - (defaultPips * pipValue);
      slReason = 'Fixed Distance';
    }
  } else {
    // For SELL: SL above the order block high or recent swing high
    const bearishOBs = smc.orderBlocks.filter(ob => ob.type === 'bearish' && ob.high > currentPrice);
    const nearestOB = bearishOBs.length > 0 ? bearishOBs[bearishOBs.length - 1] : null;
    
    // Find nearest resistance above current price
    const resistances = pa.supportResistance
      .filter(sr => sr.type === 'resistance' && sr.level > currentPrice)
      .sort((a, b) => a.level - b.level); // Closest first
    const nearestResistance = resistances[0];
    
    if (nearestOB && (!nearestResistance || nearestOB.high < nearestResistance.level)) {
      stopLoss = nearestOB.high + (5 * pipValue);
      slReason = 'Above Order Block';
    } else if (nearestResistance) {
      stopLoss = nearestResistance.level + (10 * pipValue);
      slReason = 'Above Resistance';
    } else {
      const defaultPips = symbol.includes('XAU') ? 100 : 30;
      stopLoss = currentPrice + (defaultPips * pipValue);
      slReason = 'Fixed Distance';
    }
  }
  
  // Calculate pips to SL
  const pipsToSL = calculatePips(symbol, currentPrice - stopLoss);
  
  // Calculate TPs based on Risk:Reward ratios AND IPDA targets
  // TP1: 1:1.5 RR or nearest FVG fill
  // TP2: 1:2.5 RR or 20-day IPDA target
  // TP3: 1:4 RR or 40-day IPDA target
  
  const slDistance = Math.abs(currentPrice - stopLoss);
  
  let takeProfit1: number, takeProfit2: number, takeProfit3: number;
  
  if (direction === 'BUY') {
    // Find nearest unfilled FVG above price
    const bullishFVG = smc.fvgs.find(fvg => fvg.type === 'bullish' && !fvg.filled && fvg.bottom > currentPrice);
    
    // TP1: 1.5x RR or FVG, whichever is closer
    const tp1RR = currentPrice + (slDistance * 1.5);
    takeProfit1 = bullishFVG && bullishFVG.bottom < tp1RR ? bullishFVG.bottom : tp1RR;
    
    // TP2: 2.5x RR or 20-day high, whichever is more conservative
    const tp2RR = currentPrice + (slDistance * 2.5);
    takeProfit2 = Math.min(tp2RR, ipda.twentyDayHigh);
    if (takeProfit2 <= takeProfit1) takeProfit2 = currentPrice + (slDistance * 2.5);
    
    // TP3: 4x RR or 40-day high
    const tp3RR = currentPrice + (slDistance * 4);
    takeProfit3 = Math.min(tp3RR, ipda.fortyDayHigh);
    if (takeProfit3 <= takeProfit2) takeProfit3 = currentPrice + (slDistance * 4);
    
  } else {
    // For SELL trades
    const bearishFVG = smc.fvgs.find(fvg => fvg.type === 'bearish' && !fvg.filled && fvg.top < currentPrice);
    
    const tp1RR = currentPrice - (slDistance * 1.5);
    takeProfit1 = bearishFVG && bearishFVG.top > tp1RR ? bearishFVG.top : tp1RR;
    
    const tp2RR = currentPrice - (slDistance * 2.5);
    takeProfit2 = Math.max(tp2RR, ipda.twentyDayLow);
    if (takeProfit2 >= takeProfit1) takeProfit2 = currentPrice - (slDistance * 2.5);
    
    const tp3RR = currentPrice - (slDistance * 4);
    takeProfit3 = Math.max(tp3RR, ipda.fortyDayLow);
    if (takeProfit3 >= takeProfit2) takeProfit3 = currentPrice - (slDistance * 4);
  }
  
  // Calculate pips to TP1 and Risk:Reward ratio
  const pipsToTP1 = calculatePips(symbol, takeProfit1 - currentPrice);
  const riskRewardRatio = pipsToTP1 / pipsToSL;
  
  // Calculate confidence based on confluence score
  const confidence = Math.min(95, 50 + (confluence.score * 5));
  
  // Build detailed reasoning
  let reasoning = `${analysisMode.toUpperCase()} ANALYSIS [HTF: ${htfTimeframe}, LTF: ${ltfTimeframe}]: `;
  reasoning += `HTF ${confluence.htfBias} bias`;
  if (confluence.factors.includes('ema200_aligned')) reasoning += `, price ${direction === 'BUY' ? 'above' : 'below'} EMA200`;
  if (confluence.factors.includes('liquidity_swept')) reasoning += `, liquidity swept`;
  if (confluence.factors.includes('order_block_reaction')) reasoning += `, at order block`;
  if (confluence.factors.includes('kill_zone_active')) reasoning += `, ${smc.killZone.name} kill zone active`;
  if (confluence.factors.includes('divergence_present')) reasoning += `, divergence detected`;
  reasoning += `. SL: ${slReason}. RR: 1:${riskRewardRatio.toFixed(1)}. Confluence: ${confluence.score}/10.`;
  
  return {
    symbol,
    direction,
    entry_price: currentPrice,
    stop_loss: stopLoss,
    take_profit_1: takeProfit1,
    take_profit_2: takeProfit2,
    take_profit_3: takeProfit3,
    confidence,
    confluence_score: confluence.score,
    htf_bias: confluence.htfBias,
    ltf_entry: confluence.ltfEntry,
    analysis_mode: analysisMode,
    price_action_analysis: pa,
    smc_analysis: smc,
    ipda_targets: ipda,
    confluence_factors: confluence.factors,
    reasoning,
    kill_zone: smc.killZone.name,
    session_type: smc.killZone.active ? 'active' : 'inactive',
    // Auto-send to users if confluence score is 8 or above
    send_to_users: confluence.score >= 8,
    agent_approved: confluence.score >= 8,
    sent_at: confluence.score >= 8 ? new Date().toISOString() : null,
    outcome: 'pending',
    // New fields
    timeframe: ltfTimeframe,
    htf_timeframe: htfTimeframe,
    ltf_timeframe: ltfTimeframe,
    risk_reward_ratio: riskRewardRatio,
    pips_to_sl: pipsToSL,
    pips_to_tp1: pipsToTP1
  };
}

// ===========================================
// MAIN BOT LOGIC
// ===========================================

async function runInstitutionalBot(supabase: any, config: any) {
  console.log('🏛️ Starting Institutional Signal Bot...');
  console.log('Config:', JSON.stringify(config));
  
  const pairs = config.pairs || ['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD'];
  const minConfluence = config.minConfluenceScore || 6;
  const killZoneOnly = config.killZoneOnly ?? true;
  const analysisMode = config.analysisMode || 'hybrid';
  
  const killZone = analyzeKillZone();
  console.log(`Current Kill Zone: ${killZone.name}, Active: ${killZone.active}`);
  
  // Skip if not in kill zone and killZoneOnly is enabled
  if (killZoneOnly && !killZone.active) {
    console.log('⏸️ Not in kill zone, skipping analysis');
    return { signalsGenerated: 0, message: 'Not in kill zone' };
  }
  
  const generatedSignals: any[] = [];
  
  for (const symbol of pairs) {
    try {
      console.log(`\n📊 Analyzing ${symbol}...`);
      
      // Fetch multi-timeframe data
      const [dailyCandles, h4Candles, h1Candles, m15Candles] = await Promise.all([
        fetchMarketData(symbol, '1d', '3mo'),
        fetchMarketData(symbol, '1h', '1mo'), // Will use as 4H approximation
        fetchMarketData(symbol, '1h', '7d'),
        fetchMarketData(symbol, '15m', '5d')
      ]);
      
      if (!dailyCandles.length || !h1Candles.length || !m15Candles.length) {
        console.log(`⚠️ Insufficient data for ${symbol}`);
        continue;
      }
      
      let currentPrice = m15Candles[m15Candles.length - 1]?.close || h1Candles[h1Candles.length - 1]?.close;
      
      // For crypto, use the shared real-time price service (closest to live)
      if (getInstrumentType(symbol) === 'crypto') {
        const live = await fetchRealtimePriceFromService(supabase, symbol);
        if (live !== null) currentPrice = live;
      }

      if (!currentPrice) {
        console.log(`⚠️ Missing current price for ${symbol}`);
        continue;
      }
      // 1. ATR Volatility Check
      const atr14 = calculateATR(m15Candles, 14);
      const avgATR = calculateAverageATR(dailyCandles, 20);
      const volatilityCheck = checkVolatilityRegime(atr14, avgATR);
      
      if (!volatilityCheck.allowed) {
        console.log(`⚠️ ${symbol}: Volatility too extreme (${volatilityCheck.regime}), skipping`);
        continue;
      }
      
      // 2. Spread Check (flag only, don't skip)
      const estimatedSpread = estimateSpread(symbol);
      
      // 3. News Check
      const newsCheck = await checkUpcomingNews(supabase, symbol);
      if (newsCheck.newsWithin30Min) {
        console.log(`⚠️ ${symbol}: High-impact news in ${newsCheck.minutesUntil} minutes (flagging signal)`);
      }
      
      // Run Price Action Analysis (HTF)
      const priceActionAnalysis: PriceActionAnalysis = {
        supportResistance: findPriceActionLevels([...dailyCandles, ...h4Candles]),
        candlePatterns: detectCandlestickPatterns(h1Candles),
        maAnalysis: analyzeMovingAverages(dailyCandles),
        trendLines: [], // Simplified for now
        divergences: detectDivergence(h1Candles)
      };
      
      const htfBias = determineHTFBias(priceActionAnalysis, currentPrice);
      console.log(`HTF Bias for ${symbol}: ${htfBias}`);
      
      // Skip if HTF bias is neutral
      if (htfBias === 'neutral') {
        console.log(`⏸️ ${symbol}: Neutral HTF bias, skipping`);
        continue;
      }
      
      // Run SMC/IPDA Analysis (LTF)
      const smcAnalysis: SMCAnalysis = {
        orderBlocks: findOrderBlocks(m15Candles),
        fvgs: findFairValueGaps(m15Candles),
        liquiditySweeps: detectLiquiditySweeps(m15Candles, priceActionAnalysis.supportResistance),
        amdPhase: detectAMDPattern(m15Candles),
        killZone
      };
      
      // Calculate IPDA targets
      const ipdaTargets = calculateIPDATargets(dailyCandles);
      
      // Calculate Confluence
      const confluence = calculateConfluence(htfBias, priceActionAnalysis, smcAnalysis, currentPrice);
      console.log(`${symbol} Confluence: ${confluence.score}/10, Aligned: ${confluence.aligned}`);
      console.log(`Factors: ${confluence.factors.join(', ')}`);
      
      // Generate signal if confluence meets threshold and is aligned
      if (confluence.score >= minConfluence && confluence.aligned) {
        const signal = generateInstitutionalSignal(
          symbol,
          currentPrice,
          confluence,
          priceActionAnalysis,
          smcAnalysis,
          ipdaTargets,
          analysisMode,
          '1H',   // HTF timeframe
          '15m'   // LTF timeframe
        );
        
        // Check for existing pending signal on same pair
        const { data: existingSignal } = await supabase
          .from('institutional_signals')
          .select('id')
          .eq('symbol', symbol)
          .eq('outcome', 'pending')
          .single();
        
        if (existingSignal) {
          console.log(`⚠️ ${symbol}: Existing pending signal, skipping`);
          continue;
        }
        
        // Save to database
        const { data, error } = await supabase
          .from('institutional_signals')
          .insert([signal])
          .select()
          .single();
        
        if (error) {
          console.error(`Error saving signal for ${symbol}:`, error);
        } else {
          const autoSent = signal.confluence_score >= 8;
          console.log(`✅ Signal generated for ${symbol}: ${signal.direction} @ ${currentPrice}${autoSent ? ' [AUTO-SENT TO USERS - High Confluence ≥8]' : ''}`);
          generatedSignals.push(data);
          
          // NEW: Run per-user validation and create trade allocations
          try {
            const { data: activeAccounts } = await supabase
              .from('user_prop_accounts')
              .select('id, user_id, current_equity, daily_starting_equity, account_size')
              .eq('status', 'active');
            
            if (activeAccounts && activeAccounts.length > 0) {
              console.log(`Validating signal for ${activeAccounts.length} active accounts...`);
              
              const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
              const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
              
              for (const account of activeAccounts) {
                try {
                  // Call validate-trade-for-user for each account
                  const validationResult = await fetch(
                    `${supabaseUrl}/functions/v1/validate-trade-for-user`,
                    {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${supabaseServiceKey}`
                      },
                      body: JSON.stringify({
                        userId: account.user_id,
                        accountId: account.id,
                        signal: {
                          symbol: data.symbol,
                          direction: data.direction,
                          entry_price: data.entry_price,
                          stop_loss: data.stop_loss,
                          take_profit_1: data.take_profit_1
                        }
                      })
                    }
                  );
                  
                  const validation = await validationResult.json();
                  
                  // Create trade allocation record
                  await supabase
                    .from('user_trade_allocations')
                    .insert({
                      user_id: account.user_id,
                      account_id: account.id,
                      signal_id: data.id,
                      signal_type: 'institutional',
                      symbol: data.symbol,
                      direction: data.direction,
                      entry_price: data.entry_price,
                      stop_loss: data.stop_loss,
                      take_profit_1: data.take_profit_1,
                      take_profit_2: data.take_profit_2,
                      personalized_lot_size: validation.safeLotSize || 0.01,
                      personalized_risk_amount: validation.riskAmount || 0,
                      risk_percentage_used: validation.riskPercentage || 0,
                      validation_passed: validation.isValid,
                      blockers: validation.blockers || [],
                      warnings: validation.warnings || [],
                      status: validation.isValid ? 'pending' : 'blocked'
                    });
                    
                  console.log(`Trade allocation created for user ${account.user_id}: ${validation.isValid ? 'VALID' : 'BLOCKED'}`);
                  
                } catch (userError) {
                  console.error(`Error validating for user ${account.user_id}:`, userError);
                }
              }
            }
          } catch (validationError) {
            console.error('Error running per-user validation:', validationError);
          }
        }
      } else {
        console.log(`⏸️ ${symbol}: Confluence too low or not aligned (${confluence.score}/10)`);
      }
      
    } catch (error) {
      console.error(`Error analyzing ${symbol}:`, error);
    }
  }
  
  // Update bot status
  await supabase
    .from('bot_status')
    .update({ 
      last_signal_at: new Date().toISOString(),
      signals_sent_today: generatedSignals.length,
      updated_at: new Date().toISOString()
    })
    .eq('bot_type', 'institutional_signal_bot');
  
  console.log(`\n🏛️ Institutional Bot Complete: ${generatedSignals.length} signals generated`);
  
  return { signalsGenerated: generatedSignals.length, signals: generatedSignals };
}

// ===========================================
// MAIN HANDLER
// ===========================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action } = await req.json();
    console.log('Institutional Signal Bot - Action:', action);

    if (action === 'run_bot') {
      // Get bot configuration
      const { data: botConfig } = await supabase
        .from('bot_status')
        .select('*')
        .eq('bot_type', 'institutional_signal_bot')
        .single();

      if (!botConfig) {
        return new Response(JSON.stringify({ error: 'Bot not configured' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const config = {
        pairs: botConfig.pairs,
        sendToUsersEnabled: botConfig.send_to_users_enabled || false,
        sendToAgentsEnabled: botConfig.send_to_agents_enabled || false,
        ...botConfig.strategy_config
      };

      const result = await runInstitutionalBot(supabase, config);

      // After generating signals, update them based on toggles
      // IMPORTANT: 
      // - Confluence 8+ signals ALWAYS go to users automatically (this is the core rule)
      // - Other signals go to agents for review if sendToAgentsEnabled is true
      if (result.signals && result.signals.length > 0) {
        
        // Separate high confluence signals (auto-send) from lower confluence (need review)
        const highConfluenceSignals = result.signals.filter((s: any) => s.confluence_score >= 8);
        const lowerConfluenceSignals = result.signals.filter((s: any) => s.confluence_score < 8);
        
        // HIGH CONFLUENCE (8+): Always send to users AND agents (already set in generateInstitutionalSignal)
        if (highConfluenceSignals.length > 0) {
          const highConfluenceIds = highConfluenceSignals.map((s: any) => s.id);
          
          // Update to ensure they're marked as sent to both
          await supabase
            .from('institutional_signals')
            .update({ 
              send_to_users: true,
              sent_at: new Date().toISOString(),
              agent_approved: true,
              sent_to_agents: true,
              sent_to_agents_at: new Date().toISOString()
            })
            .in('id', highConfluenceIds);
          
          console.log(`🚀 HIGH CONFLUENCE (8+): Auto-sent ${highConfluenceIds.length} signals to users`);
          
          // Trigger notifications for high confluence signals
          for (const signal of highConfluenceSignals) {
            try {
              await fetch(`${supabaseUrl}/functions/v1/send-signal-notification`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${supabaseKey}`
                },
                body: JSON.stringify({
                  signal: {
                    id: signal.id,
                    symbol: signal.symbol,
                    signal_type: signal.direction,
                    entry_price: signal.entry_price,
                    stop_loss: signal.stop_loss,
                    take_profit: signal.take_profit_1,
                    ai_reasoning: signal.reasoning,
                    is_vip: signal.is_vip || false
                  }
                })
              });
              console.log(`✅ Notification sent for high confluence signal: ${signal.symbol}`);
            } catch (notifError) {
              console.error(`❌ Failed to send notification for ${signal.symbol}:`, notifError);
            }
          }
          
          // Also send Telegram alerts to agents for visibility
          if (config.sendToAgentsEnabled) {
            try {
              for (const signal of highConfluenceSignals) {
                await fetch(`${supabaseUrl}/functions/v1/send-agent-telegram-alert`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${supabaseKey}`
                  },
                  body: JSON.stringify({ signal, autoApproved: true })
                });
              }
              console.log(`✅ Telegram alerts sent to agents for ${highConfluenceSignals.length} auto-approved signals`);
            } catch (telegramError) {
              console.error('Failed to send Telegram alerts for high confluence:', telegramError);
            }
          }
        }
        
        // LOWER CONFLUENCE (<8): Send to agents for review if enabled
        if (lowerConfluenceSignals.length > 0 && config.sendToAgentsEnabled) {
          const lowerConfluenceIds = lowerConfluenceSignals.map((s: any) => s.id);
          
          await supabase
            .from('institutional_signals')
            .update({ 
              sent_to_agents: true,
              sent_to_agents_at: new Date().toISOString(),
              send_to_users: false,
              sent_at: null
            })
            .in('id', lowerConfluenceIds);
          
          console.log(`📋 LOWER CONFLUENCE (<8): ${lowerConfluenceIds.length} signals sent to agents for review`);
          
          // Send Telegram alerts to agents for review
          try {
            for (const signal of lowerConfluenceSignals) {
              const telegramResponse = await fetch(`${supabaseUrl}/functions/v1/send-agent-telegram-alert`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${supabaseKey}`
                },
                body: JSON.stringify({ signal })
              });
              
              if (telegramResponse.ok) {
                console.log(`✅ Telegram alert sent for signal ${signal.symbol} (pending review)`);
              } else {
                const errorText = await telegramResponse.text();
                console.error(`❌ Telegram alert failed for ${signal.symbol}:`, errorText);
              }
            }
          } catch (telegramError) {
            console.error('Failed to send Telegram alerts:', telegramError);
          }
        } else if (lowerConfluenceSignals.length > 0 && config.sendToUsersEnabled && !config.sendToAgentsEnabled) {
          // If only sendToUsersEnabled (no agent review), auto-send all signals
          const lowerConfluenceIds = lowerConfluenceSignals.map((s: any) => s.id);
          
          await supabase
            .from('institutional_signals')
            .update({ 
              send_to_users: true,
              sent_at: new Date().toISOString()
            })
            .in('id', lowerConfluenceIds);
          
          console.log(`Signals auto-sent to users without agent review (${lowerConfluenceIds.length} signals)`);
        }
      }

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'get_signals') {
      const { data: signals } = await supabase
        .from('institutional_signals')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      return new Response(JSON.stringify({ signals }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'toggle_send_to_users') {
      const body = await req.json();
      const { signalId, sendToUsers } = body;

      const { data, error } = await supabase
        .from('institutional_signals')
        .update({ 
          send_to_users: sendToUsers,
          sent_at: sendToUsers ? new Date().toISOString() : null
        })
        .eq('id', signalId)
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ signal: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Institutional Bot error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
