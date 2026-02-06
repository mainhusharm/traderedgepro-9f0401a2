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
  timestamp?: number;
}

interface SignalResult {
  symbol: string;
  direction: 'BUY' | 'SELL';
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  riskReward: number;
  confidence: number;
  timeframe: string;
  tradeType: 'scalp' | 'intraday' | 'swing';
  operatorAnalysis: {
    supplyZones: number[];
    demandZones: number[];
    liquidityPools: number[];
    stopLossHuntZone: number;
    trapDirection: string;
    institutionalBias: string;
    trendStrength: number;
    volatility: number;
  };
  reasoning: string;
}

// Fetch real market data from Yahoo Finance
async function fetchMarketData(symbol: string, interval: string = '1h'): Promise<CandleData[]> {
  try {
    const yahooSymbol = convertToYahooSymbol(symbol);
    const range = interval === '15m' ? '5d' : interval === '1h' ? '1mo' : '3mo';
    
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=${interval}&range=${range}`;
    
    console.log(`Fetching ${symbol} (${yahooSymbol}) - interval: ${interval}, range: ${range}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
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
          timestamp: timestamps[i]
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
  const forexMap: Record<string, string> = {
    'EURUSD': 'EURUSD=X', 'GBPUSD': 'GBPUSD=X', 'USDJPY': 'USDJPY=X',
    'GBPJPY': 'GBPJPY=X', 'EURJPY': 'EURJPY=X', 'AUDUSD': 'AUDUSD=X',
    'USDCHF': 'USDCHF=X', 'USDCAD': 'USDCAD=X', 'XAUUSD': 'GC=F',
  };
  const cryptoMap: Record<string, string> = {
    'BTCUSD': 'BTC-USD', 'ETHUSD': 'ETH-USD', 'SOLUSD': 'SOL-USD', 'BNBUSD': 'BNB-USD',
  };
  const futuresMap: Record<string, string> = {
    'NQ': 'NQ=F', 'ES': 'ES=F', 'YM': 'YM=F', 'GC': 'GC=F', 'CL': 'CL=F',
  };
  return forexMap[symbol] || cryptoMap[symbol] || futuresMap[symbol] || symbol;
}

// Enhanced Operator Strategy Analysis
function analyzeOperatorStrategy(candles: CandleData[], symbol: string, timeframe: string): SignalResult | null {
  if (candles.length < 50) {
    console.log(`${symbol} ${timeframe}: Not enough candles (${candles.length})`);
    return null;
  }
  
  const recent = candles.slice(-50);
  const currentPrice = recent[recent.length - 1].close;
  
  // 1. Calculate market volatility and trend strength
  const volatility = calculateVolatility(recent);
  const trendStrength = calculateTrendStrength(recent);
  
  // 2. Identify Supply and Demand Zones
  const supplyZones = findSupplyZones(recent);
  const demandZones = findDemandZones(recent);
  
  // 3. Find Liquidity Pools
  const liquidityPools = findLiquidityPools(recent);
  
  // 4. Detect Trap Setups (more sensitive)
  const trapAnalysis = detectTrapSetup(recent);
  
  // 5. Find stop loss hunt zone
  const stopLossHuntZone = findStopLossHuntZone(recent, currentPrice);
  
  // 6. Determine Institutional Bias
  const institutionalBias = determineInstitutionalBias(recent);
  
  // 7. Check for momentum divergence
  const hasDivergence = checkMomentumDivergence(recent);
  
  // 8. Check key level proximity
  const nearKeyLevel = isNearKeyLevel(currentPrice, [...supplyZones, ...demandZones]);
  
  console.log(`${symbol} ${timeframe}: bias=${institutionalBias}, trap=${trapAnalysis.direction}, trend=${trendStrength.toFixed(2)}, nearKey=${nearKeyLevel}, divergence=${hasDivergence}`);
  
  // Generate signal with dynamic confidence
  const signal = generateOperatorSignal(
    currentPrice,
    supplyZones,
    demandZones,
    liquidityPools,
    trapAnalysis,
    stopLossHuntZone,
    institutionalBias,
    symbol,
    timeframe,
    trendStrength,
    volatility,
    hasDivergence,
    nearKeyLevel
  );
  
  return signal;
}

function calculateVolatility(candles: CandleData[]): number {
  const ranges = candles.map(c => (c.high - c.low) / c.close);
  return ranges.reduce((a, b) => a + b, 0) / ranges.length;
}

function calculateTrendStrength(candles: CandleData[]): number {
  // Use ADX-like calculation
  const closes = candles.map(c => c.close);
  const first10Avg = closes.slice(0, 10).reduce((a, b) => a + b) / 10;
  const last10Avg = closes.slice(-10).reduce((a, b) => a + b) / 10;
  const priceChange = (last10Avg - first10Avg) / first10Avg;
  
  // Count directional moves
  let upMoves = 0, downMoves = 0;
  for (let i = 1; i < candles.length; i++) {
    if (candles[i].close > candles[i-1].close) upMoves++;
    else downMoves++;
  }
  
  const directionalRatio = Math.abs(upMoves - downMoves) / candles.length;
  return Math.abs(priceChange) * 100 + directionalRatio * 50;
}

function findSupplyZones(candles: CandleData[]): number[] {
  const zones: number[] = [];
  
  for (let i = 3; i < candles.length - 1; i++) {
    const candle = candles[i];
    const prev1 = candles[i - 1];
    const prev2 = candles[i - 2];
    const next = candles[i + 1];
    
    // Strong rejection from high (swing high with upper wick)
    if (candle.high > prev1.high && candle.high > prev2.high && candle.high > next.high) {
      const bodySize = Math.abs(candle.close - candle.open);
      const upperWick = candle.high - Math.max(candle.open, candle.close);
      
      if (upperWick > bodySize * 0.3 || candle.close < candle.open) {
        zones.push(candle.high);
      }
    }
  }
  
  return [...new Set(zones)].slice(-3);
}

function findDemandZones(candles: CandleData[]): number[] {
  const zones: number[] = [];
  
  for (let i = 3; i < candles.length - 1; i++) {
    const candle = candles[i];
    const prev1 = candles[i - 1];
    const prev2 = candles[i - 2];
    const next = candles[i + 1];
    
    // Strong rejection from low (swing low with lower wick)
    if (candle.low < prev1.low && candle.low < prev2.low && candle.low < next.low) {
      const bodySize = Math.abs(candle.close - candle.open);
      const lowerWick = Math.min(candle.open, candle.close) - candle.low;
      
      if (lowerWick > bodySize * 0.3 || candle.close > candle.open) {
        zones.push(candle.low);
      }
    }
  }
  
  return [...new Set(zones)].slice(-3);
}

function findLiquidityPools(candles: CandleData[]): number[] {
  const pools: number[] = [];
  const recentCandles = candles.slice(-20);
  
  // Find equal lows (liquidity below)
  const lows = recentCandles.map(c => c.low);
  for (let i = 0; i < lows.length - 1; i++) {
    for (let j = i + 1; j < lows.length; j++) {
      const diff = Math.abs(lows[i] - lows[j]) / lows[i];
      if (diff < 0.002) { // Within 0.2%
        pools.push(Math.min(lows[i], lows[j]));
      }
    }
  }
  
  // Find equal highs (liquidity above)
  const highs = recentCandles.map(c => c.high);
  for (let i = 0; i < highs.length - 1; i++) {
    for (let j = i + 1; j < highs.length; j++) {
      const diff = Math.abs(highs[i] - highs[j]) / highs[i];
      if (diff < 0.002) {
        pools.push(Math.max(highs[i], highs[j]));
      }
    }
  }
  
  return [...new Set(pools)].slice(-5);
}

function detectTrapSetup(candles: CandleData[]): { isTrap: boolean; direction: 'bull_trap' | 'bear_trap' | 'none'; strength: number } {
  const last5 = candles.slice(-5);
  const last = last5[4];
  const prev = last5[3];
  const prev2 = last5[2];
  
  // Look for swing point breakout and reversal
  const recentHighs = candles.slice(-20).map(c => c.high);
  const recentLows = candles.slice(-20).map(c => c.low);
  const highestHigh = Math.max(...recentHighs.slice(0, -2));
  const lowestLow = Math.min(...recentLows.slice(0, -2));
  
  // Bull trap: Broke above recent high but closed bearish
  if (last.high > highestHigh && last.close < last.open) {
    const rejectionStrength = (last.high - last.close) / (last.high - last.low);
    if (rejectionStrength > 0.5) {
      return { isTrap: true, direction: 'bull_trap', strength: rejectionStrength };
    }
  }
  
  // Bear trap: Broke below recent low but closed bullish
  if (last.low < lowestLow && last.close > last.open) {
    const rejectionStrength = (last.close - last.low) / (last.high - last.low);
    if (rejectionStrength > 0.5) {
      return { isTrap: true, direction: 'bear_trap', strength: rejectionStrength };
    }
  }
  
  // Also check for pin bars at extremes
  if (last.high > prev.high && last.high > prev2.high) {
    const upperWick = last.high - Math.max(last.open, last.close);
    const body = Math.abs(last.close - last.open);
    if (upperWick > body * 2) {
      return { isTrap: true, direction: 'bull_trap', strength: 0.6 };
    }
  }
  
  if (last.low < prev.low && last.low < prev2.low) {
    const lowerWick = Math.min(last.open, last.close) - last.low;
    const body = Math.abs(last.close - last.open);
    if (lowerWick > body * 2) {
      return { isTrap: true, direction: 'bear_trap', strength: 0.6 };
    }
  }
  
  return { isTrap: false, direction: 'none', strength: 0 };
}

function findStopLossHuntZone(candles: CandleData[], currentPrice: number): number {
  const recent = candles.slice(-20);
  const lowestLow = Math.min(...recent.map(c => c.low));
  const highestHigh = Math.max(...recent.map(c => c.high));
  
  const distanceToLow = currentPrice - lowestLow;
  const distanceToHigh = highestHigh - currentPrice;
  
  if (distanceToLow < distanceToHigh) {
    return lowestLow * 0.998;
  } else {
    return highestHigh * 1.002;
  }
}

function determineInstitutionalBias(candles: CandleData[]): 'bullish' | 'bearish' | 'neutral' {
  const firstHalf = candles.slice(0, 25);
  const secondHalf = candles.slice(-25);
  
  // Check structure
  const firstHighs = Math.max(...firstHalf.map(c => c.high));
  const secondHighs = Math.max(...secondHalf.map(c => c.high));
  const firstLows = Math.min(...firstHalf.map(c => c.low));
  const secondLows = Math.min(...secondHalf.map(c => c.low));
  
  const higherHighs = secondHighs > firstHighs * 1.001;
  const higherLows = secondLows > firstLows * 1.001;
  const lowerHighs = secondHighs < firstHighs * 0.999;
  const lowerLows = secondLows < firstLows * 0.999;
  
  // Check EMA cross
  const ema10 = calculateEMA(candles.slice(-15).map(c => c.close), 10);
  const ema20 = calculateEMA(candles.slice(-25).map(c => c.close), 20);
  const emaBullish = ema10 > ema20;
  
  if ((higherHighs && higherLows) || (higherLows && emaBullish)) return 'bullish';
  if ((lowerHighs && lowerLows) || (lowerHighs && !emaBullish)) return 'bearish';
  
  return 'neutral';
}

function calculateEMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1];
  const multiplier = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((a, b) => a + b) / period;
  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
  }
  return ema;
}

function checkMomentumDivergence(candles: CandleData[]): boolean {
  const recent = candles.slice(-20);
  
  // Simple RSI-like momentum check
  let gains = 0, losses = 0;
  for (let i = 1; i < recent.length; i++) {
    const change = recent[i].close - recent[i-1].close;
    if (change > 0) gains += change;
    else losses -= change;
  }
  
  const rsi = 100 - (100 / (1 + gains / (losses || 0.001)));
  
  // Check for potential divergence (price making new high/low but momentum not)
  const priceHigh = Math.max(...recent.slice(-5).map(c => c.high));
  const priceLow = Math.min(...recent.slice(-5).map(c => c.low));
  const overallHigh = Math.max(...recent.map(c => c.high));
  const overallLow = Math.min(...recent.map(c => c.low));
  
  // Bearish divergence: new high but RSI < 70
  if (priceHigh >= overallHigh * 0.998 && rsi < 65) return true;
  // Bullish divergence: new low but RSI > 30
  if (priceLow <= overallLow * 1.002 && rsi > 35) return true;
  
  return false;
}

function isNearKeyLevel(price: number, levels: number[]): boolean {
  for (const level of levels) {
    const distance = Math.abs(price - level) / price;
    if (distance < 0.003) return true; // Within 0.3%
  }
  return false;
}

function getPipValue(symbol: string): number {
  if (symbol.includes('JPY')) return 0.01;
  if (symbol.includes('XAU') || symbol.includes('GC')) return 0.1;
  if (symbol.includes('BTC')) return 10;
  if (symbol.includes('ETH') || symbol.includes('SOL') || symbol.includes('BNB')) return 0.1;
  if (['NQ', 'ES', 'YM'].includes(symbol)) return 0.25;
  if (symbol === 'CL') return 0.01;
  return 0.0001;
}

function generateOperatorSignal(
  currentPrice: number,
  supplyZones: number[],
  demandZones: number[],
  liquidityPools: number[],
  trapAnalysis: { isTrap: boolean; direction: string; strength: number },
  stopLossHuntZone: number,
  institutionalBias: string,
  symbol: string,
  timeframe: string,
  trendStrength: number,
  volatility: number,
  hasDivergence: boolean,
  nearKeyLevel: boolean
): SignalResult | null {
  
  let direction: 'BUY' | 'SELL' = 'BUY';
  let entryPrice = currentPrice;
  let stopLoss: number;
  let takeProfit: number;
  let confidence = 50; // Start lower
  let reasoning = '';
  
  // Build confidence based on multiple factors
  const confidenceFactors: string[] = [];
  
  // Primary setup: Trap detection (highest priority)
  if (trapAnalysis.isTrap) {
    confidence += 20 + Math.floor(trapAnalysis.strength * 10);
    if (trapAnalysis.direction === 'bull_trap') {
      direction = 'SELL';
      reasoning = `BULL TRAP: Price swept highs and rejected. `;
      confidenceFactors.push('trap_detected');
    } else {
      direction = 'BUY';
      reasoning = `BEAR TRAP: Price swept lows and rejected. `;
      confidenceFactors.push('trap_detected');
    }
  } else if (institutionalBias !== 'neutral') {
    // Secondary: Follow institutional bias
    confidence += 10;
    if (institutionalBias === 'bullish') {
      direction = 'BUY';
      reasoning = `Bullish structure (HH/HL). `;
    } else {
      direction = 'SELL';
      reasoning = `Bearish structure (LH/LL). `;
    }
    confidenceFactors.push('bias_aligned');
  } else {
    // No clear setup - skip this pair
    console.log(`${symbol} ${timeframe}: Skipping - no trap and neutral bias`);
    return null;
  }
  
  // Bonus: Divergence confirmation
  if (hasDivergence) {
    confidence += 8;
    reasoning += `Momentum divergence detected. `;
    confidenceFactors.push('divergence');
  }
  
  // Bonus: Near key level
  if (nearKeyLevel) {
    confidence += 7;
    reasoning += `Near key S/D zone. `;
    confidenceFactors.push('key_level');
  }
  
  // Bonus: Strong trend
  if (trendStrength > 1.5) {
    confidence += 5;
    confidenceFactors.push('strong_trend');
  }
  
  // Penalty: High volatility (riskier)
  if (volatility > 0.02) {
    confidence -= 5;
  }
  
  // Cap confidence
  confidence = Math.min(95, Math.max(55, confidence));
  
  // Calculate SL and TP
  const pipValue = getPipValue(symbol);
  const atr = volatility * currentPrice; // Approximate ATR
  
  if (direction === 'BUY') {
    const nearestDemand = demandZones.length > 0 
      ? demandZones.filter(d => d < currentPrice).sort((a, b) => b - a)[0] 
      : currentPrice * 0.995;
    
    const nearestSupply = supplyZones.length > 0 
      ? supplyZones.filter(s => s > currentPrice).sort((a, b) => a - b)[0]
      : currentPrice * 1.015;
    
    stopLoss = (nearestDemand || currentPrice * 0.995) - (pipValue * 5);
    takeProfit = nearestSupply || currentPrice * 1.015;
    
    reasoning += `Entry: ${currentPrice.toFixed(5)}, SL below demand at ${stopLoss.toFixed(5)}, TP at supply ${takeProfit.toFixed(5)}. `;
  } else {
    const nearestSupply = supplyZones.length > 0 
      ? supplyZones.filter(s => s > currentPrice).sort((a, b) => a - b)[0]
      : currentPrice * 1.005;
    
    const nearestDemand = demandZones.length > 0 
      ? demandZones.filter(d => d < currentPrice).sort((a, b) => b - a)[0]
      : currentPrice * 0.985;
    
    stopLoss = (nearestSupply || currentPrice * 1.005) + (pipValue * 5);
    takeProfit = nearestDemand || currentPrice * 0.985;
    
    reasoning += `Entry: ${currentPrice.toFixed(5)}, SL above supply at ${stopLoss.toFixed(5)}, TP at demand ${takeProfit.toFixed(5)}. `;
  }
  
  // Calculate R:R
  const risk = Math.abs(currentPrice - stopLoss);
  const reward = Math.abs(takeProfit - currentPrice);
  const riskReward = reward / (risk || 0.0001);
  
  // Require minimum R:R based on trade type
  const minRR = timeframe === 'M15' ? 1.5 : timeframe === 'H1' ? 2.0 : 2.5;
  if (riskReward < minRR) {
    console.log(`${symbol} ${timeframe}: Skipping - R:R ${riskReward.toFixed(2)} < ${minRR}`);
    return null;
  }
  
  reasoning += `R:R ${riskReward.toFixed(2)}. Factors: ${confidenceFactors.join(', ')}.`;
  
  const tradeType = timeframe === 'M15' ? 'scalp' : timeframe === 'H1' ? 'intraday' : 'swing';
  
  return {
    symbol,
    direction,
    entryPrice,
    stopLoss,
    takeProfit,
    riskReward: Math.round(riskReward * 100) / 100,
    confidence,
    timeframe,
    tradeType,
    operatorAnalysis: {
      supplyZones,
      demandZones,
      liquidityPools,
      stopLossHuntZone,
      trapDirection: trapAnalysis.direction,
      institutionalBias,
      trendStrength,
      volatility
    },
    reasoning
  };
}

function isUuid(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function resolveBotActorUserId(supabase: any, botConfig: any): Promise<string | null> {
  if (isUuid(botConfig?.updated_by)) return botConfig.updated_by;

  const { data: adminRole, error } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('role', 'admin')
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Failed to resolve admin user_id:', error);
    return null;
  }

  return adminRole?.user_id ?? null;
}

async function matchUsersToSignal(supabase: any, signal: SignalResult): Promise<string[]> {
  const { data: questionnaires, error } = await supabase
    .from('questionnaires')
    .select('user_id, trading_style, preferred_pairs, preferred_timeframes');
  
  if (error || !questionnaires) {
    console.error('Error fetching questionnaires:', error);
    return [];
  }
  
  const matchedUserIds: string[] = [];
  
  for (const q of questionnaires) {
    let score = 0;
    
    if (!q.trading_style || q.trading_style === signal.tradeType) score += 3;
    if (!q.preferred_pairs || q.preferred_pairs.length === 0 || q.preferred_pairs.includes(signal.symbol)) score += 2;
    if (!q.preferred_timeframes || q.preferred_timeframes.length === 0 || q.preferred_timeframes.includes(signal.timeframe)) score += 1;
    
    if (score >= 3) matchedUserIds.push(q.user_id);
  }
  
  return matchedUserIds;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const body = await req.json();
    const { action, botType, symbol, signalId } = body;
    
    console.log(`Operator Signal Bot: action=${action}, botType=${botType}`);
    
    if (action === 'analyze_single') {
      const candles = await fetchMarketData(symbol, '1h');
      const signal = analyzeOperatorStrategy(candles, symbol, 'H1');
      
      return new Response(JSON.stringify({ signal }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    if (action === 'run_bot') {
      const { data: botConfig } = await supabase
        .from('bot_status')
        .select('*')
        .eq('bot_type', botType)
        .single();
      
      if (!botConfig?.is_running) {
        return new Response(JSON.stringify({ error: 'Bot is not running' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      const pairs = botConfig.pairs || [];
      const timeframes = botConfig.timeframes || ['H1'];
      const autoBroadcast = botConfig.auto_broadcast || false;
      const actorUserId = await resolveBotActorUserId(supabase, botConfig);

      if (!actorUserId) {
        return new Response(JSON.stringify({ 
          error: 'No valid admin user found.',
          signalsGenerated: 0 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      console.log(`Bot ${botType} analyzing ${pairs.length} pairs across ${timeframes.length} timeframes`);
      
      const generatedSignals: any[] = [];
      const processedPairs = new Set<string>(); // Avoid duplicates
      
      // Check for existing pending signals to avoid conflicting signals
      const { data: existingPendingSignals } = await supabase
        .from('signals')
        .select('symbol, signal_type, created_at')
        .eq('outcome', 'pending')
        .eq('generated_by', 'bot')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Last 24 hours
      
      const pairsWithPendingSignals = new Map<string, { direction: string; createdAt: string }>();
      for (const sig of existingPendingSignals || []) {
        pairsWithPendingSignals.set(sig.symbol, { 
          direction: sig.signal_type, 
          createdAt: sig.created_at 
        });
      }
      
      console.log(`Found ${pairsWithPendingSignals.size} pairs with existing pending signals`);
      
      // For each pair, find the BEST signal across timeframes (not all)
      for (const pair of pairs) {
        // Skip if there's already a pending signal for this pair
        const existingSignal = pairsWithPendingSignals.get(pair);
        if (existingSignal) {
          console.log(`${pair}: Skipping - already has pending ${existingSignal.direction} signal from ${existingSignal.createdAt}`);
          continue;
        }
        
        let bestSignal: SignalResult | null = null;
        let bestTimeframe = '';
        
        for (const tf of timeframes) {
          // Skip if we already have a high-confidence signal for this pair
          if (bestSignal && bestSignal.confidence >= 85) break;
          
          const interval = tf === 'M15' ? '15m' : tf === 'H1' ? '1h' : tf === 'H4' ? '4h' : '1d';
          
          try {
            const candles = await fetchMarketData(pair, interval);
            if (candles.length < 50) continue;
            
            const signal = analyzeOperatorStrategy(candles, pair, tf);
            
            if (signal) {
              // Keep the signal with highest confidence
              if (!bestSignal || signal.confidence > bestSignal.confidence) {
                bestSignal = signal;
                bestTimeframe = tf;
              }
            }
          } catch (err) {
            console.error(`Error analyzing ${pair} on ${tf}:`, err);
          }
          
          // Small delay to avoid rate limiting
          await new Promise(r => setTimeout(r, 100));
        }
        
        // Save only the best signal for this pair
        if (bestSignal && !processedPairs.has(pair)) {
          processedPairs.add(pair);
          
          const matchedUserIds = await matchUsersToSignal(supabase, bestSignal);
          
          console.log(`Saving signal: ${pair} ${bestSignal.direction} ${bestTimeframe} conf=${bestSignal.confidence}`);
          
          const { data: savedSignal, error: insertError } = await supabase
            .from('signals')
            .insert({
              symbol: bestSignal.symbol,
              signal_type: bestSignal.direction,
              entry_price: bestSignal.entryPrice,
              stop_loss: bestSignal.stopLoss,
              take_profit: bestSignal.takeProfit,
              confidence_score: bestSignal.confidence,
              ai_reasoning: bestSignal.reasoning,
              milestone: bestSignal.timeframe === 'M15' ? 'M1' : bestSignal.timeframe === 'H1' ? 'M2' : 'M3',
              is_public: autoBroadcast,
              user_id: actorUserId,
              trade_type: bestSignal.tradeType,
              timeframe: bestSignal.timeframe,
              risk_reward_ratio: bestSignal.riskReward,
              operator_analysis: bestSignal.operatorAnalysis,
              generated_by: 'bot',
              sent_to_users: autoBroadcast,
              matched_user_ids: matchedUserIds
            })
            .select()
            .single();
          
          if (insertError) {
            console.error('Error saving signal:', insertError);
          } else {
            generatedSignals.push(savedSignal);
            
            if (autoBroadcast && matchedUserIds.length > 0) {
              try {
                await supabase.functions.invoke('send-signal-notification', {
                  body: { signal: savedSignal, userIds: matchedUserIds },
                });
              } catch (e) {
                console.error('Failed to send notifications:', e);
              }
            }
          }
        }
      }
      
      // Update bot status
      await supabase
        .from('bot_status')
        .update({
          last_signal_at: new Date().toISOString(),
          signals_sent_today: (botConfig.signals_sent_today || 0) + generatedSignals.length
        })
        .eq('bot_type', botType);
      
      console.log(`Bot ${botType} complete: ${generatedSignals.length} signals generated`);
      
      return new Response(JSON.stringify({ 
        success: true, 
        signalsGenerated: generatedSignals.length,
        signals: generatedSignals
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    if (action === 'send_signal_to_users') {
      // signalId is already extracted from body at the top
      
      const { data: signal } = await supabase
        .from('signals')
        .select('*')
        .eq('id', signalId)
        .single();
      
      if (!signal) {
        return new Response(JSON.stringify({ error: 'Signal not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      let userIds = signal.matched_user_ids || [];
      
      if (userIds.length === 0) {
        const { data: members } = await supabase
          .from('memberships')
          .select('user_id')
          .eq('status', 'active');
        userIds = (members || []).map((m: any) => m.user_id);
      }
      
      await supabase
        .from('signals')
        .update({ sent_to_users: true, is_public: true })
        .eq('id', signalId);
      
      await supabase.functions.invoke('send-signal-notification', {
        body: { signal, userIds },
      });
      
      return new Response(JSON.stringify({ 
        success: true, 
        sentToUsers: userIds.length 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Operator Signal Bot error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
