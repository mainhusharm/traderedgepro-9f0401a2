import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PriceData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  timestamp: string;
  marketState?: string;
  isDelayed?: boolean;
  ageMinutes?: number;
}

function convertToYahooSymbol(symbol: string): string {
  const symbolMap: Record<string, string> = {
    // Forex Majors
    EURUSD: 'EURUSD=X',
    GBPUSD: 'GBPUSD=X',
    USDJPY: 'JPY=X',
    USDCHF: 'CHF=X',
    USDCAD: 'CAD=X',
    AUDUSD: 'AUDUSD=X',
    NZDUSD: 'NZDUSD=X',

    // Forex Crosses
    GBPJPY: 'GBPJPY=X',
    EURJPY: 'EURJPY=X',
    AUDJPY: 'AUDJPY=X',
    CADJPY: 'CADJPY=X',
    CHFJPY: 'CHFJPY=X',
    NZDJPY: 'NZDJPY=X',
    EURAUD: 'EURAUD=X',
    EURGBP: 'EURGBP=X',
    EURCHF: 'EURCHF=X',
    EURCAD: 'EURCAD=X',
    EURNZD: 'EURNZD=X',
    GBPAUD: 'GBPAUD=X',
    GBPCAD: 'GBPCAD=X',
    GBPCHF: 'GBPCHF=X',
    GBPNZD: 'GBPNZD=X',
    AUDCAD: 'AUDCAD=X',
    AUDCHF: 'AUDCHF=X',
    AUDNZD: 'AUDNZD=X',
    CADCHF: 'CADCHF=X',
    NZDCAD: 'NZDCAD=X',
    NZDCHF: 'NZDCHF=X',

    // Precious Metals
    XAUUSD: 'GC=F',   // Gold futures

    // Crypto (USD)
    BTCUSD: 'BTC-USD',
    ETHUSD: 'ETH-USD',
    SOLUSD: 'SOL-USD',
    BNBUSD: 'BNB-USD',
    XRPUSD: 'XRP-USD',
    ADAUSD: 'ADA-USD',
    DOGEUSD: 'DOGE-USD',
    AVAXUSD: 'AVAX-USD',
    LINKUSD: 'LINK-USD',
    MATICUSD: 'POL-USD',

    // US Index Futures (E-mini contracts)
    NQ: 'NQ=F',   // Nasdaq-100 E-mini futures
    ES: 'ES=F',   // S&P 500 E-mini futures  
    YM: '^DJI',   // Dow Jones Industrial Average index
    RTY: 'RTY=F', // Russell 2000 E-mini futures
    
    // Commodity Futures
    GC: 'GC=F',   // Gold futures (per oz)
    SI: 'SI=F',   // Silver futures (per oz)
    CL: 'CL=F',   // Crude Oil WTI (per barrel)
    NG: 'NG=F',   // Natural Gas (per MMBtu)
  };

  return symbolMap[symbol] ?? symbol;
}

const isFiniteNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

function lastFinite(values?: Array<number | null>): number | null {
  if (!values?.length) return null;
  for (let i = values.length - 1; i >= 0; i--) {
    const v = values[i];
    if (isFiniteNumber(v)) return v;
  }
  return null;
}

function maxFinite(values?: Array<number | null>): number | null {
  if (!values?.length) return null;
  let max: number | null = null;
  for (const v of values) {
    if (!isFiniteNumber(v)) continue;
    max = max === null ? v : Math.max(max, v);
  }
  return max;
}

function minFinite(values?: Array<number | null>): number | null {
  if (!values?.length) return null;
  let min: number | null = null;
  for (const v of values) {
    if (!isFiniteNumber(v)) continue;
    min = min === null ? v : Math.min(min, v);
  }
  return min;
}

function maxAgeMsForYahooSymbol(yahooSymbol: string): number {
  // Hard caps to prevent nonsense data.
  // - Crypto should be close to live (24/7 markets)
  // - FX/metals need weekend tolerance (markets close Fri-Sun)
  // - Futures/indices need holiday tolerance
  if (yahooSymbol.endsWith('-USD')) return 10 * 60 * 1000; // crypto must be near-live
  // Precious metals spot (XAUUSD=X, XAGUSD=X) need weekend tolerance
  if (yahooSymbol === 'XAUUSD=X' || yahooSymbol === 'XAGUSD=X') return 7 * 24 * 60 * 60 * 1000;
  if (yahooSymbol.endsWith('=X')) return 7 * 24 * 60 * 60 * 1000; // FX pairs - weekend tolerance
  if (yahooSymbol.endsWith('=F')) return 7 * 24 * 60 * 60 * 1000; // futures up to 7 days
  if (yahooSymbol.startsWith('^')) return 7 * 24 * 60 * 60 * 1000; // cash indices up to 7 days
  return 7 * 24 * 60 * 60 * 1000; // default 7 days for closed markets
}

function realtimeTargetMsForYahooSymbol(yahooSymbol: string): number {
  if (yahooSymbol.endsWith('-USD')) return 3 * 60 * 1000;
  if (yahooSymbol.endsWith('=X')) return 3 * 60 * 1000;
  if (yahooSymbol.endsWith('=F')) return 30 * 60 * 1000;
  if (yahooSymbol.startsWith('^')) return 30 * 60 * 1000; // cash indices
  return 30 * 60 * 1000;
}

async function fetchPrice(symbol: string): Promise<PriceData | null> {

  const yahooSymbol = convertToYahooSymbol(symbol);

  // No fallbacks: only 1m data (closest to real-time on Yahoo).
  const interval = '1m';
  const range = '1d';

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?interval=${interval}&range=${range}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      console.warn(`Yahoo chart request failed (${response.status}) for ${symbol} (${yahooSymbol})`);
      return null;
    }

    const data = await response.json();
    const result = data.chart?.result?.[0];
    if (!result) return null;

    const meta = result.meta;
    const quote = result.indicators?.quote?.[0];
    if (!meta || !quote) return null;

    // Prefer Yahoo "regularMarketPrice" (closest to live). Chart close can lag.
    const currentPrice = (isFiniteNumber(meta.regularMarketPrice)
      ? meta.regularMarketPrice
      : lastFinite(quote.close));

    if (!isFiniteNumber(currentPrice)) return null;

    const prev = meta.previousClose ?? meta.chartPreviousClose;
    const previousClose = isFiniteNumber(prev) ? prev : currentPrice;

    const change = currentPrice - previousClose;
    const changePercent = previousClose !== 0 ? (change / previousClose) * 100 : 0;

    const high = (isFiniteNumber(meta.regularMarketDayHigh)
      ? meta.regularMarketDayHigh
      : maxFinite(quote.high)) ?? currentPrice;
    const low = (isFiniteNumber(meta.regularMarketDayLow)
      ? meta.regularMarketDayLow
      : minFinite(quote.low)) ?? currentPrice;

    let tsMs = isFiniteNumber(meta.regularMarketTime) ? meta.regularMarketTime * 1000 : null;
    if (tsMs === null && Array.isArray(result.timestamp) && result.timestamp.length > 0) {
      // Fallback to last chart timestamp
      tsMs = result.timestamp[result.timestamp.length - 1] * 1000;
    }
    if (tsMs === null) return null;

    const ageMs = Date.now() - tsMs;
    const maxAgeMs = maxAgeMsForYahooSymbol(yahooSymbol);
    if (ageMs > maxAgeMs) {
      console.warn(`Too-old quote skipped for ${symbol} (${yahooSymbol}) @ ${new Date(tsMs).toISOString()}`);
      return null;
    }

    const realtimeTargetMs = realtimeTargetMsForYahooSymbol(yahooSymbol);
    const isDelayed = ageMs > realtimeTargetMs;
    const ageMinutes = Math.round(ageMs / 60000);

    return {
      symbol,
      price: currentPrice,
      change: Math.round(change * 100000) / 100000,
      changePercent: Math.round(changePercent * 100) / 100,
      high,
      low,
      timestamp: new Date(tsMs).toISOString(),
      marketState: meta.marketState,
      isDelayed,
      ageMinutes,
    };
  } catch (error) {
    console.error(`Error fetching ${symbol}:`, error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbols } = await req.json();
    
    if (!symbols || !Array.isArray(symbols)) {
      return new Response(JSON.stringify({ error: 'Symbols array required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Fetching prices for: ${symbols.join(', ')}`);
    // Fetch all prices in parallel
    const results = await Promise.all(symbols.map((s) => fetchPrice(s)));

    const prices: Record<string, PriceData> = {};
    results.forEach((result, idx) => {
      if (result) prices[symbols[idx]] = result;
    });

    return new Response(JSON.stringify({ prices }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Get live prices error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});