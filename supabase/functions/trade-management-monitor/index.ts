import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// =====================================================
// PROFESSIONAL TRADE MANAGEMENT MONITOR
// Institutional-grade trade lifecycle management
// =====================================================

interface TradeConfig {
  base_risk_pct: number;
  max_risk_pct: number;
  volatility_scaling: boolean;
  tp1_close_pct: number;
  tp2_close_pct: number;
  runner_pct: number;
  trailing_atr_multiple: number;
  trailing_start_after_tp: number;
  max_hold_hours: number;
  close_before_weekend: boolean;
  weekend_close_hour: number;
  avoid_news_minutes: number;
  close_before_high_impact: boolean;
  max_daily_trades: number;
  max_correlated_positions: number;
  max_currency_exposure_pct: number;
  daily_loss_limit_pct: number;
  pause_after_consecutive_losses: number;
  reduce_size_after_losses: number;
  reduction_factor: number;
  is_active: boolean;
}

interface Signal {
  id: string;
  symbol: string;
  direction: string;
  entry_price: number;
  stop_loss: number;
  take_profit_1: number;
  take_profit_2: number | null;
  take_profit_3: number | null;
  trade_state: string;
  current_sl: number | null;
  original_sl: number | null;
  atr_14: number | null;
  activated_at: string | null;
  remaining_position_pct: number;
  tp1_closed: boolean;
  tp2_closed: boolean;
  tp1_pnl: number | null;
  tp2_pnl: number | null;
  trailing_active: boolean;
  trailing_atr_multiple: number | null;
  highest_price: number | null;
  lowest_price: number | null;
  max_adverse_excursion: number | null;
  max_favorable_excursion: number | null;
  created_at: string;
  max_hold_hours: number | null;
}

interface DailyStats {
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  breakeven_trades: number;
  consecutive_losses: number;
  consecutive_wins: number;
  bot_paused: boolean;
}

// Correlation matrix for currency pairs
const CORRELATED_PAIRS: Record<string, string[]> = {
  'EURUSD': ['GBPUSD', 'AUDUSD', 'NZDUSD'],
  'GBPUSD': ['EURUSD', 'AUDUSD'],
  'USDJPY': ['USDCHF', 'USDCAD'],
  'AUDUSD': ['NZDUSD', 'EURUSD'],
  'XAUUSD': ['EURUSD', 'XAGUSD'],
};

// Session definitions (UTC hours)
const SESSIONS = {
  asian: { start: 0, end: 8 },
  london: { start: 7, end: 16 },
  newyork: { start: 13, end: 22 },
};

// Get pip value for different symbols
function getPipSize(symbol: string): number {
  if (symbol.includes('JPY')) return 0.01;
  if (symbol.includes('XAU')) return 0.1;
  if (symbol.includes('XAG')) return 0.01;
  return 0.0001;
}

// Calculate pips between two prices
function calculatePips(symbol: string, priceDiff: number): number {
  return priceDiff / getPipSize(symbol);
}

// Check if price has passed a level based on direction
function isPricePast(price: number, level: number, direction: string, isTP: boolean): boolean {
  if (isTP) {
    // For TP: BUY needs price >= level, SELL needs price <= level
    return direction === 'BUY' ? price >= level : price <= level;
  } else {
    // For SL: BUY needs price <= level, SELL needs price >= level
    return direction === 'BUY' ? price <= level : price >= level;
  }
}

// Get current trading session
function getCurrentSession(): string {
  const hour = new Date().getUTCHours();
  if (hour >= SESSIONS.newyork.start && hour < SESSIONS.newyork.end) return 'newyork';
  if (hour >= SESSIONS.london.start && hour < SESSIONS.london.end) return 'london';
  if (hour >= SESSIONS.asian.start && hour < SESSIONS.asian.end) return 'asian';
  return 'asian'; // Default
}

// Check if it's Friday and approaching weekend close
function isApproachingWeekendClose(closeHour: number): boolean {
  const now = new Date();
  return now.getUTCDay() === 5 && now.getUTCHours() >= closeHour;
}

// Parse currency pair into base and quote
function parseCurrencyPair(symbol: string): { base: string; quote: string } {
  const cleanSymbol = symbol.replace(/[^A-Z]/g, '');
  if (cleanSymbol.startsWith('XAU') || cleanSymbol.startsWith('XAG')) {
    return { base: cleanSymbol.slice(0, 3), quote: cleanSymbol.slice(3) };
  }
  return { base: cleanSymbol.slice(0, 3), quote: cleanSymbol.slice(3, 6) };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action = 'monitor' } = await req.json().catch(() => ({}));

    console.log(`[Trade Monitor] Action: ${action}`);

    // Get configuration
    const { data: configData } = await supabase
      .from('trade_management_config')
      .select('*')
      .eq('is_active', true)
      .maybeSingle();

    const config: TradeConfig = configData || {
      base_risk_pct: 1,
      max_risk_pct: 2,
      volatility_scaling: true,
      tp1_close_pct: 33,
      tp2_close_pct: 33,
      runner_pct: 34,
      trailing_atr_multiple: 1.5,
      trailing_start_after_tp: 2,
      max_hold_hours: 48,
      close_before_weekend: true,
      weekend_close_hour: 16,
      avoid_news_minutes: 30,
      close_before_high_impact: true,
      max_daily_trades: 5,
      max_correlated_positions: 2,
      max_currency_exposure_pct: 3,
      daily_loss_limit_pct: 3,
      pause_after_consecutive_losses: 3,
      reduce_size_after_losses: 2,
      reduction_factor: 0.5,
      is_active: true,
    };

    // Get today's stats
    const today = new Date().toISOString().split('T')[0];
    const { data: statsData } = await supabase
      .from('trade_daily_stats')
      .select('*')
      .eq('date', today)
      .maybeSingle();

    const dailyStats: DailyStats = statsData || {
      total_trades: 0,
      winning_trades: 0,
      losing_trades: 0,
      breakeven_trades: 0,
      consecutive_losses: 0,
      consecutive_wins: 0,
      bot_paused: false,
    };

    // Check if bot is paused
    if (dailyStats.bot_paused) {
      console.log('[Trade Monitor] Bot is paused for today');
      return new Response(JSON.stringify({
        success: true,
        message: 'Bot is paused',
        paused: true,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Check circuit breakers
    if (dailyStats.consecutive_losses >= config.pause_after_consecutive_losses) {
      console.log(`[Trade Monitor] Circuit breaker: ${dailyStats.consecutive_losses} consecutive losses`);
      await supabase
        .from('trade_daily_stats')
        .upsert({
          date: today,
          bot_paused: true,
          pause_reason: `${dailyStats.consecutive_losses} consecutive losses`,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'date' });

      return new Response(JSON.stringify({
        success: true,
        message: 'Bot paused due to consecutive losses',
        paused: true,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Weekend close check
    if (config.close_before_weekend && isApproachingWeekendClose(config.weekend_close_hour)) {
      console.log('[Trade Monitor] Approaching weekend close - force closing all positions');
      await forceCloseAllPositions(supabase, 'weekend_close');
    }

    // =====================================================
    // STEP 1: Check for entry triggers on pending signals
    // =====================================================
    await checkPendingEntries(supabase, config, dailyStats);

    // =====================================================
    // STEP 2: Manage active trades through state machine
    // =====================================================
    await manageActiveTrades(supabase, config);

    // =====================================================
    // STEP 3: Update analytics and exposure
    // =====================================================
    await updateCurrencyExposure(supabase);

    return new Response(JSON.stringify({
      success: true,
      message: 'Trade management cycle complete',
      session: getCurrentSession(),
      stats: dailyStats,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: unknown) {
    console.error('[Trade Monitor] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});

// =====================================================
// CHECK PENDING ENTRIES
// =====================================================
async function checkPendingEntries(
  supabase: any, 
  config: TradeConfig,
  dailyStats: DailyStats
) {
  // Get pending signals
  const { data: pendingSignals, error } = await supabase
    .from('institutional_signals')
    .select('*')
    .eq('trade_state', 'pending')
    .eq('send_to_users', true)
    .order('created_at', { ascending: false });

  if (error || !pendingSignals?.length) {
    console.log('[Entry Check] No pending signals');
    return;
  }

  console.log(`[Entry Check] Found ${pendingSignals.length} pending signals`);

  // Check daily trade limit
  if (dailyStats.total_trades >= config.max_daily_trades) {
    console.log('[Entry Check] Daily trade limit reached');
    return;
  }

  // Get current prices
  const symbols = [...new Set(pendingSignals.map((s: Signal) => s.symbol))] as string[];
  const prices = await fetchCurrentPrices(symbols);

  // Get active signals for correlation check
  const { data: activeSignals } = await supabase
    .from('institutional_signals')
    .select('symbol, direction')
    .in('trade_state', ['active', 'phase1', 'phase2', 'phase3']);

  for (const signal of pendingSignals) {
    const currentPrice = prices[signal.symbol];
    if (!currentPrice) {
      console.log(`[Entry Check] No price for ${signal.symbol}`);
      continue;
    }

    // Check if signal is expired (4 hours old)
    const hoursOld = (Date.now() - new Date(signal.created_at).getTime()) / (1000 * 60 * 60);
    if (hoursOld > 4) {
      console.log(`[Entry Check] Signal ${signal.id} expired after ${hoursOld.toFixed(1)} hours`);
      await expireSignal(supabase, signal.id, 'expired_not_triggered');
      continue;
    }

    // Check if entry is triggered (within 5 pips or price moved past entry)
    const tolerance = getPipSize(signal.symbol) * 5;
    const entryHit = Math.abs(currentPrice - signal.entry_price) <= tolerance;
    const pricePastEntry = signal.direction === 'BUY' 
      ? currentPrice > signal.entry_price 
      : currentPrice < signal.entry_price;

    if (entryHit || pricePastEntry) {
      // Correlation check
      const correlationResult = checkCorrelation(signal, activeSignals || [], config);
      if (!correlationResult.allowed) {
        console.log(`[Entry Check] Correlation block: ${correlationResult.reason}`);
        await supabase
          .from('institutional_signals')
          .update({ correlation_warning: correlationResult.reason })
          .eq('id', signal.id);
        continue;
      }

      // Activate the signal
      await activateSignal(supabase, signal, currentPrice);
    }
  }
}

// =====================================================
// MANAGE ACTIVE TRADES - STATE MACHINE
// =====================================================
async function manageActiveTrades(supabase: any, config: TradeConfig) {
  // Get all active trades
  const { data: activeTrades, error } = await supabase
    .from('institutional_signals')
    .select('*')
    .in('trade_state', ['active', 'phase1', 'phase2', 'phase3'])
    .order('activated_at', { ascending: true });

  if (error || !activeTrades?.length) {
    console.log('[Trade Manager] No active trades');
    return;
  }

  console.log(`[Trade Manager] Managing ${activeTrades.length} active trades`);

  // Get current prices
  const symbols = [...new Set(activeTrades.map((s: Signal) => s.symbol))] as string[];
  const prices = await fetchCurrentPrices(symbols);

  for (const trade of activeTrades) {
    const currentPrice = prices[trade.symbol];
    if (!currentPrice) {
      console.log(`[Trade Manager] No price for ${trade.symbol}`);
      continue;
    }

    // Update MAE/MFE tracking
    await updateTradeAnalytics(supabase, trade, currentPrice);

    // Check max hold time
    if (trade.activated_at) {
      const hoursInTrade = (Date.now() - new Date(trade.activated_at).getTime()) / (1000 * 60 * 60);
      if (hoursInTrade >= (trade.max_hold_hours || config.max_hold_hours)) {
        console.log(`[Trade Manager] Max hold time reached for ${trade.id}`);
        await closeTrade(supabase, trade, currentPrice, 'time_exit', calculateCurrentPnL(trade, currentPrice));
        continue;
      }
    }

    const sl = trade.current_sl || trade.stop_loss;
    const originalRisk = Math.abs(trade.entry_price - trade.stop_loss);

    // Calculate key levels
    const pipsFromEntry = calculatePips(trade.symbol, currentPrice - trade.entry_price) * (trade.direction === 'BUY' ? 1 : -1);
    const pipsToTP1 = calculatePips(trade.symbol, trade.take_profit_1 - trade.entry_price) * (trade.direction === 'BUY' ? 1 : -1);
    const progressToTP1 = Math.abs(pipsFromEntry) / Math.abs(pipsToTP1);

    console.log(`[Trade Manager] ${trade.symbol} ${trade.direction} | State: ${trade.trade_state} | Progress: ${(progressToTP1 * 100).toFixed(1)}% to TP1`);

    switch (trade.trade_state) {
      case 'active':
        // Phase 0: Initial Risk
        // Check if SL hit -> -1R loss
        if (isPricePast(currentPrice, sl, trade.direction, false)) {
          console.log(`[Trade Manager] ${trade.symbol} SL hit at ${currentPrice}`);
          await closeTrade(supabase, trade, currentPrice, 'sl_hit', -1);
        }
        // Check if 50% to TP1 -> Move to breakeven
        else if (progressToTP1 >= 0.5) {
          console.log(`[Trade Manager] ${trade.symbol} Moving to breakeven (50% to TP1)`);
          await moveToBreakeven(supabase, trade, currentPrice, config);
        }
        break;

      case 'phase1':
        // Phase 1: Risk-Free (SL at BE)
        // Check if BE hit -> 0R exit
        if (isPricePast(currentPrice, sl, trade.direction, false)) {
          console.log(`[Trade Manager] ${trade.symbol} BE hit at ${currentPrice}`);
          await closeTrade(supabase, trade, currentPrice, 'breakeven', 0);
        }
        // Check if TP1 hit -> Partial close + move to Phase 2
        else if (isPricePast(currentPrice, trade.take_profit_1, trade.direction, true)) {
          console.log(`[Trade Manager] ${trade.symbol} TP1 hit - partial close`);
          await partialCloseTP1(supabase, trade, currentPrice, config);
        }
        break;

      case 'phase2':
        // Phase 2: Profit Locked (33% closed at TP1, SL at entry + 5 pips)
        // Check if SL hit -> +0.33R to +0.5R partial win
        if (isPricePast(currentPrice, sl, trade.direction, false)) {
          const pnl = trade.tp1_pnl || (config.tp1_close_pct / 100);
          console.log(`[Trade Manager] ${trade.symbol} SL hit after TP1 - partial win: ${pnl}R`);
          await closeTrade(supabase, trade, currentPrice, 'tp1_only', pnl);
        }
        // Check if TP2 hit -> Another partial close + activate trailing
        else if (trade.take_profit_2 && isPricePast(currentPrice, trade.take_profit_2, trade.direction, true)) {
          console.log(`[Trade Manager] ${trade.symbol} TP2 hit - partial close + trailing`);
          await partialCloseTP2(supabase, trade, currentPrice, config);
        }
        break;

      case 'phase3':
        // Phase 3: Runner with Trailing Stop (66% closed, trailing active)
        // Update trailing stop
        await updateTrailingStop(supabase, trade, currentPrice, config);

        const trailSL = trade.current_sl || sl;
        // Check if trailing SL hit
        if (isPricePast(currentPrice, trailSL, trade.direction, false)) {
          const totalPnL = (trade.tp1_pnl || 0) + (trade.tp2_pnl || 0) + calculateRunnerPnL(trade, currentPrice);
          console.log(`[Trade Manager] ${trade.symbol} Trailing SL hit - total: ${totalPnL.toFixed(2)}R`);
          await closeTrade(supabase, trade, currentPrice, 'trailing_stop', totalPnL);
        }
        // Check if TP3 hit -> Full exit
        else if (trade.take_profit_3 && isPricePast(currentPrice, trade.take_profit_3, trade.direction, true)) {
          const totalPnL = (trade.tp1_pnl || 0) + (trade.tp2_pnl || 0) + calculateRunnerPnL(trade, currentPrice);
          console.log(`[Trade Manager] ${trade.symbol} TP3 hit - full win: ${totalPnL.toFixed(2)}R`);
          await closeTrade(supabase, trade, currentPrice, 'tp3_full', totalPnL);
        }
        break;
    }
  }
}

// =====================================================
// TRADE STATE TRANSITIONS
// =====================================================

async function activateSignal(supabase: any, signal: Signal, currentPrice: number) {
  console.log(`[Activate] ${signal.symbol} at ${currentPrice}`);
  
  await supabase
    .from('institutional_signals')
    .update({
      trade_state: 'active',
      activated_at: new Date().toISOString(),
      entry_triggered: true,
      entry_triggered_at: new Date().toISOString(),
      signal_status: 'active',
      current_sl: signal.stop_loss,
      original_sl: signal.stop_loss,
      current_price: currentPrice,
      highest_price: currentPrice,
      lowest_price: currentPrice,
      max_adverse_excursion: 0,
      max_favorable_excursion: 0,
    })
    .eq('id', signal.id);

  await logTradeEvent(supabase, signal.id, 'entry_triggered', 'active', currentPrice, null, signal.stop_loss, 0, 0, 0);
  await updateDailyStats(supabase, 'trade_opened');
  
  // Add trade management message for entry
  await addTradeManagementMessage(supabase, signal.id, 'entry_triggered', {
    symbol: signal.symbol,
    direction: signal.direction,
    entryPrice: currentPrice,
  });
  
  // Send push notification for entry triggered
  try {
    await supabase.functions.invoke('send-vip-signal-push', {
      body: {
        signal: {
          symbol: signal.symbol,
          direction: signal.direction,
          entry_price: currentPrice,
        },
        type: 'entry_triggered',
        title: `🎯 Entry Triggered: ${signal.symbol}`,
        body: `${signal.direction} entry at ${currentPrice.toFixed(5)}`
      }
    });
    console.log(`[Activate] Push notification sent for ${signal.symbol}`);
  } catch (pushError) {
    console.error(`[Activate] Failed to send push:`, pushError);
  }
}

async function moveToBreakeven(supabase: any, trade: Signal, currentPrice: number, config: TradeConfig) {
  // Move SL to entry + spread + 2 pips buffer
  const buffer = getPipSize(trade.symbol) * 3;
  const newSL = trade.direction === 'BUY' 
    ? trade.entry_price + buffer 
    : trade.entry_price - buffer;

  await supabase
    .from('institutional_signals')
    .update({
      trade_state: 'phase1',
      current_sl: newSL,
      breakeven_triggered: true,
    })
    .eq('id', trade.id);

  await logTradeEvent(supabase, trade.id, 'sl_to_breakeven', 'phase1', currentPrice, trade.current_sl, newSL, 0, 0, 0);
  
  // Add trade management message for breakeven
  await addTradeManagementMessage(supabase, trade.id, 'breakeven_move', {
    symbol: trade.symbol,
    direction: trade.direction,
    newSL: newSL,
    entryPrice: trade.entry_price,
  });
}

async function partialCloseTP1(supabase: any, trade: Signal, currentPrice: number, config: TradeConfig) {
  const closePct = config.tp1_close_pct;
  const pnlR = closePct / 100; // 33% of 1R = 0.33R
  
  // Move SL to entry + small profit lock
  const profitLock = getPipSize(trade.symbol) * 5;
  const newSL = trade.direction === 'BUY' 
    ? trade.entry_price + profitLock 
    : trade.entry_price - profitLock;

  const timeToTP1 = trade.activated_at 
    ? Math.round((Date.now() - new Date(trade.activated_at).getTime()) / (1000 * 60))
    : null;

  await supabase
    .from('institutional_signals')
    .update({
      trade_state: 'phase2',
      current_sl: newSL,
      tp1_closed: true,
      tp1_closed_at: new Date().toISOString(),
      tp1_pnl: pnlR,
      tp1_r_multiple: pnlR,
      remaining_position_pct: 100 - closePct,
      time_to_tp1_minutes: timeToTP1,
      partial_tp_triggered: true,
    })
    .eq('id', trade.id);

  await logTradeEvent(supabase, trade.id, 'tp1_partial_close', 'phase2', currentPrice, trade.current_sl, newSL, closePct, pnlR, pnlR);
  
  // Add trade management message for TP1 hit
  await addTradeManagementMessage(supabase, trade.id, 'tp1_hit', {
    symbol: trade.symbol,
    direction: trade.direction,
    tp1Price: trade.take_profit_1,
    closePct: closePct,
    newSL: newSL,
    entryPrice: trade.entry_price,
  });
}

async function partialCloseTP2(supabase: any, trade: Signal, currentPrice: number, config: TradeConfig) {
  const closePct = config.tp2_close_pct;
  const pnlR = (closePct / 100) * 2; // 33% of 2R = 0.66R

  // Activate trailing stop
  const atr = trade.atr_14 || (getPipSize(trade.symbol) * 20);
  const trailDistance = atr * config.trailing_atr_multiple;
  const newSL = trade.direction === 'BUY'
    ? currentPrice - trailDistance
    : currentPrice + trailDistance;

  await supabase
    .from('institutional_signals')
    .update({
      trade_state: 'phase3',
      current_sl: newSL,
      tp2_closed: true,
      tp2_closed_at: new Date().toISOString(),
      tp2_pnl: pnlR,
      tp2_r_multiple: pnlR,
      trailing_active: true,
      remaining_position_pct: config.runner_pct,
      highest_price: trade.direction === 'BUY' ? currentPrice : trade.highest_price,
      lowest_price: trade.direction === 'SELL' ? currentPrice : trade.lowest_price,
    })
    .eq('id', trade.id);

  await logTradeEvent(supabase, trade.id, 'tp2_partial_close', 'phase3', currentPrice, trade.current_sl, newSL, closePct, pnlR, pnlR);
  
  // Add trade management message for TP2 hit
  await addTradeManagementMessage(supabase, trade.id, 'tp2_hit', {
    symbol: trade.symbol,
    direction: trade.direction,
    tp2Price: trade.take_profit_2,
    closePct: closePct,
    remainingPct: config.runner_pct,
    trailingSL: newSL,
  });
}

async function updateTrailingStop(supabase: any, trade: Signal, currentPrice: number, config: TradeConfig) {
  if (!trade.trailing_active) return;

  const atr = trade.atr_14 || (getPipSize(trade.symbol) * 20);
  const trailDistance = atr * (trade.trailing_atr_multiple || config.trailing_atr_multiple);

  let newSL = trade.current_sl;
  let shouldUpdate = false;

  if (trade.direction === 'BUY') {
    // Only trail up
    const potentialSL = currentPrice - trailDistance;
    if (potentialSL > (trade.current_sl || 0)) {
      newSL = potentialSL;
      shouldUpdate = true;
    }
  } else {
    // Only trail down
    const potentialSL = currentPrice + trailDistance;
    if (potentialSL < (trade.current_sl || Infinity)) {
      newSL = potentialSL;
      shouldUpdate = true;
    }
  }

  if (shouldUpdate) {
    await supabase
      .from('institutional_signals')
      .update({
        current_sl: newSL,
        highest_price: trade.direction === 'BUY' ? Math.max(currentPrice, trade.highest_price || 0) : trade.highest_price,
        lowest_price: trade.direction === 'SELL' ? Math.min(currentPrice, trade.lowest_price || Infinity) : trade.lowest_price,
      })
      .eq('id', trade.id);

    await logTradeEvent(supabase, trade.id, 'trailing_update', 'phase3', currentPrice, trade.current_sl, newSL, 0, 0, 0);
    
    // Add trade management message for significant trailing stop updates (only if moved more than 10 pips)
    const pipsMoved = Math.abs(calculatePips(trade.symbol, newSL! - (trade.current_sl || 0)));
    if (pipsMoved >= 10) {
      await addTradeManagementMessage(supabase, trade.id, 'trailing_update', {
        symbol: trade.symbol,
        direction: trade.direction,
        newSL: newSL,
        currentPrice: currentPrice,
      });
    }
  }
}

async function closeTrade(supabase: any, trade: Signal, currentPrice: number, exitReason: string, finalR: number) {
  const now = new Date();
  const timeInTrade = trade.activated_at 
    ? Math.round((now.getTime() - new Date(trade.activated_at).getTime()) / (1000 * 60))
    : null;

  // Determine outcome for daily stats
  let outcomeType: 'win' | 'loss' | 'breakeven' = 'breakeven';
  if (finalR > 0.1) outcomeType = 'win';
  else if (finalR < -0.1) outcomeType = 'loss';

  // Map exit reason to outcome
  const outcomeMap: Record<string, string> = {
    'sl_hit': 'stop_loss',
    'breakeven': 'breakeven',
    'tp1_only': 'target_hit',
    'tp2_only': 'target_hit',
    'tp3_full': 'target_hit',
    'trailing_stop': 'target_hit',
    'time_exit': 'expired',
    'weekend_close': 'expired',
    'news_exit': 'expired',
    'manual': 'manual',
  };

  await supabase
    .from('institutional_signals')
    .update({
      trade_state: 'closed',
      closed_at: now.toISOString(),
      final_pnl: finalR,
      final_r_multiple: finalR,
      exit_reason: exitReason,
      outcome: outcomeMap[exitReason] || 'expired',
      time_in_trade_minutes: timeInTrade,
      runner_closed: true,
      runner_closed_at: now.toISOString(),
      runner_pnl: trade.trade_state === 'phase3' ? calculateRunnerPnL(trade, currentPrice) : 0,
    })
    .eq('id', trade.id);

  await logTradeEvent(supabase, trade.id, 'trade_closed', 'closed', currentPrice, trade.current_sl, null, trade.remaining_position_pct, finalR, finalR);
  await updateDailyStats(supabase, 'trade_closed', outcomeType, finalR);
  await updateCurrencyExposure(supabase);
  
  // Add trade management message based on outcome
  const messageParams = {
    symbol: trade.symbol,
    direction: trade.direction,
    exitPrice: currentPrice,
    totalPnL: finalR,
    exitReason: exitReason,
  };
  
  if (exitReason === 'tp3_full') {
    await addTradeManagementMessage(supabase, trade.id, 'trade_closed_full', messageParams);
  } else if (exitReason === 'sl_hit' && trade.trade_state === 'active') {
    await addTradeManagementMessage(supabase, trade.id, 'trade_closed_loss', messageParams);
  } else if (exitReason === 'breakeven' || (outcomeType === 'breakeven' && finalR >= -0.1 && finalR <= 0.1)) {
    await addTradeManagementMessage(supabase, trade.id, 'trade_closed_breakeven', messageParams);
  } else if (exitReason === 'tp1_only' || (trade.tp1_closed && !trade.tp2_closed)) {
    await addTradeManagementMessage(supabase, trade.id, 'trade_closed_partial', messageParams);
  } else if (outcomeType === 'win') {
    await addTradeManagementMessage(supabase, trade.id, 'trade_closed_win', messageParams);
  } else {
    await addTradeManagementMessage(supabase, trade.id, 'trade_closed_loss', messageParams);
  }
}

async function expireSignal(supabase: any, signalId: string, reason: string) {
  await supabase
    .from('institutional_signals')
    .update({
      trade_state: 'closed',
      closed_at: new Date().toISOString(),
      exit_reason: reason,
      outcome: 'expired',
      final_pnl: 0,
      final_r_multiple: 0,
    })
    .eq('id', signalId);
}

async function forceCloseAllPositions(supabase: any, reason: string) {
  const { data: openTrades } = await supabase
    .from('institutional_signals')
    .select('*')
    .in('trade_state', ['active', 'phase1', 'phase2', 'phase3']);

  if (!openTrades?.length) return;

  const symbols = [...new Set(openTrades.map((s: Signal) => s.symbol))] as string[];
  const prices = await fetchCurrentPrices(symbols);

  for (const trade of openTrades) {
    const currentPrice = prices[trade.symbol];
    const pnl = calculateCurrentPnL(trade, currentPrice || trade.entry_price);
    await closeTrade(supabase, trade, currentPrice || trade.entry_price, reason, pnl);
  }
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function checkCorrelation(
  newSignal: Signal, 
  activeSignals: Array<{ symbol: string; direction: string }>,
  config: TradeConfig
): { allowed: boolean; reason?: string } {
  const correlatedPairs = CORRELATED_PAIRS[newSignal.symbol] || [];
  
  // Check for same direction trades in correlated pairs
  const conflicting = activeSignals.filter(s => 
    correlatedPairs.includes(s.symbol) && s.direction === newSignal.direction
  );

  if (conflicting.length >= config.max_correlated_positions) {
    return { 
      allowed: false, 
      reason: `Max correlated positions (${config.max_correlated_positions}) reached with ${conflicting.map(c => c.symbol).join(', ')}` 
    };
  }

  return { allowed: true };
}

function calculateCurrentPnL(trade: Signal, currentPrice: number): number {
  const originalRisk = Math.abs(trade.entry_price - (trade.original_sl || trade.stop_loss));
  const currentMove = (currentPrice - trade.entry_price) * (trade.direction === 'BUY' ? 1 : -1);
  const rMultiple = currentMove / originalRisk;
  
  // Factor in partials already closed
  const closedPnL = (trade.tp1_pnl || 0) + (trade.tp2_pnl || 0);
  const remainingPct = trade.remaining_position_pct / 100;
  
  return closedPnL + (rMultiple * remainingPct);
}

function calculateRunnerPnL(trade: Signal, currentPrice: number): number {
  const originalRisk = Math.abs(trade.entry_price - (trade.original_sl || trade.stop_loss));
  const currentMove = (currentPrice - trade.entry_price) * (trade.direction === 'BUY' ? 1 : -1);
  const rMultiple = currentMove / originalRisk;
  return rMultiple * (trade.remaining_position_pct / 100);
}

async function updateTradeAnalytics(supabase: any, trade: Signal, currentPrice: number) {
  const originalRisk = Math.abs(trade.entry_price - (trade.original_sl || trade.stop_loss));
  const currentMove = (currentPrice - trade.entry_price) * (trade.direction === 'BUY' ? 1 : -1);
  
  // Track MAE (worst drawdown)
  const currentDrawdown = Math.min(0, currentMove) / originalRisk;
  const newMAE = Math.min(trade.max_adverse_excursion || 0, currentDrawdown);
  
  // Track MFE (best profit)
  const currentProfit = Math.max(0, currentMove) / originalRisk;
  const newMFE = Math.max(trade.max_favorable_excursion || 0, currentProfit);

  // Update highest/lowest
  const newHighest = trade.direction === 'BUY' 
    ? Math.max(currentPrice, trade.highest_price || 0) 
    : trade.highest_price;
  const newLowest = trade.direction === 'SELL' 
    ? Math.min(currentPrice, trade.lowest_price || Infinity) 
    : trade.lowest_price;

  if (newMAE !== trade.max_adverse_excursion || newMFE !== trade.max_favorable_excursion) {
    await supabase
      .from('institutional_signals')
      .update({
        max_adverse_excursion: newMAE,
        max_favorable_excursion: newMFE,
        highest_price: newHighest,
        lowest_price: newLowest,
      })
      .eq('id', trade.id);
  }
}

async function logTradeEvent(
  supabase: any,
  signalId: string,
  eventType: string,
  phase: string,
  price: number,
  slBefore: number | null,
  slAfter: number | null,
  positionClosedPct: number,
  pnlRealized: number,
  rMultiple: number
) {
  await supabase
    .from('trade_management_events')
    .insert({
      signal_id: signalId,
      event_type: eventType,
      phase: phase,
      price_at_event: price,
      sl_before: slBefore,
      sl_after: slAfter,
      position_closed_pct: positionClosedPct,
      pnl_realized: pnlRealized,
      r_multiple: rMultiple,
    });
}

// =====================================================
// AUTOMATED TRADE MANAGEMENT MESSAGES
// User-facing step-by-step trade instructions
// =====================================================

interface TradeMessageConfig {
  messageType: string;
  title: string;
  content: string;
  metadata?: Record<string, any>;
}

const RISK_MANAGEMENT_MESSAGES: Record<string, (params: any) => TradeMessageConfig> = {
  entry_triggered: ({ symbol, direction, entryPrice }) => ({
    messageType: 'entry_triggered',
    title: '🎯 Trade Entry Triggered',
    content: `Your ${direction} position on ${symbol} has been activated at ${entryPrice.toFixed(5)}. 
    
📋 WHAT TO DO NOW:
• Risk 1-2% of your account on this trade
• Set your stop loss as shown in the signal
• Do NOT move your stop loss wider
• Set a price alert at 50% to TP1`,
    metadata: { symbol, direction, entryPrice, phase: 'active' }
  }),

  breakeven_move: ({ symbol, direction, newSL, entryPrice }) => ({
    messageType: 'breakeven',
    title: '🛡️ Move Stop Loss to Breakeven',
    content: `${symbol} has moved 50% toward TP1. Time to protect your capital!

📋 ACTION REQUIRED:
• Move your Stop Loss to ${newSL.toFixed(5)} (entry + small buffer)
• This locks in a risk-free trade
• Original entry was at ${entryPrice.toFixed(5)}
• If price retraces, you exit at breakeven (0R)

✅ You are now in a risk-free position!`,
    metadata: { symbol, direction, newSL, entryPrice, phase: 'phase1' }
  }),

  tp1_hit: ({ symbol, direction, tp1Price, closePct, newSL, entryPrice }) => ({
    messageType: 'tp_hit',
    title: '💰 TP1 Hit - Book Partial Profits!',
    content: `Congratulations! ${symbol} has reached Take Profit 1!

📋 ACTION REQUIRED:
• Close ${closePct}% of your position NOW (book +0.33R)
• Move Stop Loss to ${newSL.toFixed(5)} (entry + 5 pips profit lock)
• Keep ${100 - closePct}% running for TP2

💡 RISK MANAGEMENT TIP:
• You've secured 33% of your profit target
• Even if price reverses now, you're still profitable
• Let the remaining position run toward TP2`,
    metadata: { symbol, direction, tp1Price, closePct, newSL, phase: 'phase2' }
  }),

  tp2_hit: ({ symbol, direction, tp2Price, closePct, remainingPct, trailingSL }) => ({
    messageType: 'tp_hit',
    title: '🚀 TP2 Hit - Trailing Stop Activated!',
    content: `Excellent! ${symbol} has reached Take Profit 2!

📋 ACTION REQUIRED:
• Close another ${closePct}% of your position (book +0.66R)
• Only ${remainingPct}% remains as your "runner"
• Set a TRAILING STOP at ${trailingSL.toFixed(5)}

💡 RUNNER STRATEGY:
• This is your "free trade" - let it ride
• Trailing stop will lock in profits as price moves
• Potential to reach TP3 for maximum gains
• Total locked profit so far: ~1R`,
    metadata: { symbol, direction, tp2Price, closePct, remainingPct, trailingSL, phase: 'phase3' }
  }),

  trailing_update: ({ symbol, direction, newSL, currentPrice }) => ({
    messageType: 'sl_adjusted',
    title: '📈 Trailing Stop Updated',
    content: `${symbol} trailing stop has been adjusted.

📋 UPDATE YOUR PLATFORM:
• New Stop Loss: ${newSL.toFixed(5)}
• Current Price: ${currentPrice.toFixed(5)}
• Continue to trail as price moves in your favor`,
    metadata: { symbol, direction, newSL, currentPrice, phase: 'phase3' }
  }),

  trade_closed_win: ({ symbol, direction, exitPrice, totalPnL, exitReason }) => ({
    messageType: 'outcome',
    title: '✅ Trade Closed - Profit Secured!',
    content: `${symbol} ${direction} trade has been closed with profit!

📊 TRADE SUMMARY:
• Exit Price: ${exitPrice.toFixed(5)}
• Total P&L: +${totalPnL.toFixed(2)}R
• Exit Reason: ${formatExitReason(exitReason)}

✨ Well managed trade! Risk management preserved your capital and maximized gains.`,
    metadata: { symbol, direction, exitPrice, totalPnL, exitReason }
  }),

  trade_closed_loss: ({ symbol, direction, exitPrice, totalPnL }) => ({
    messageType: 'outcome',
    title: '❌ Trade Closed - Stop Loss Hit',
    content: `${symbol} ${direction} trade has been stopped out.

📊 TRADE SUMMARY:
• Exit Price: ${exitPrice.toFixed(5)}
• Total P&L: ${totalPnL.toFixed(2)}R
• Maximum loss was limited by proper position sizing

💪 REMEMBER:
• Losses are part of trading - you followed your plan
• Risk was limited to 1-2% as per risk management
• The next signal is a fresh opportunity`,
    metadata: { symbol, direction, exitPrice, totalPnL }
  }),

  trade_closed_breakeven: ({ symbol, direction, exitPrice }) => ({
    messageType: 'outcome',
    title: '⚖️ Trade Closed at Breakeven',
    content: `${symbol} ${direction} trade exited at breakeven.

📊 TRADE SUMMARY:
• Exit Price: ${exitPrice.toFixed(5)}
• Total P&L: 0R (no loss, no gain)

✅ This is a WIN! You protected your capital when the trade didn't work out as expected.`,
    metadata: { symbol, direction, exitPrice, totalPnL: 0 }
  }),

  trade_closed_partial: ({ symbol, direction, exitPrice, totalPnL }) => ({
    messageType: 'outcome',
    title: '💵 Trade Closed - Partial Profit',
    content: `${symbol} ${direction} trade has been closed after TP1.

📊 TRADE SUMMARY:
• Exit Price: ${exitPrice.toFixed(5)}
• Total P&L: +${totalPnL.toFixed(2)}R
• Partial profits from TP1 were secured!

👍 You took partial profits and the remainder was stopped out. This is good risk management!`,
    metadata: { symbol, direction, exitPrice, totalPnL }
  }),

  trade_closed_full: ({ symbol, direction, exitPrice, totalPnL }) => ({
    messageType: 'outcome',
    title: '🏆 Trade Closed - Full Target Hit!',
    content: `${symbol} ${direction} trade reached maximum target!

📊 TRADE SUMMARY:
• Exit Price: ${exitPrice.toFixed(5)}
• Total P&L: +${totalPnL.toFixed(2)}R
• All take profit levels were hit!

🎉 Outstanding trade execution! Maximum profit achieved through disciplined management.`,
    metadata: { symbol, direction, exitPrice, totalPnL }
  }),
};

function formatExitReason(reason: string): string {
  const reasonMap: Record<string, string> = {
    'sl_hit': 'Stop Loss Hit',
    'breakeven': 'Breakeven Exit',
    'tp1_only': 'TP1 Partial Win',
    'tp2_only': 'TP2 Partial Win',
    'tp3_full': 'Full Target Achieved',
    'trailing_stop': 'Trailing Stop Hit',
    'time_exit': 'Max Hold Time',
    'weekend_close': 'Weekend Close',
    'news_exit': 'High Impact News',
    'manual': 'Manual Close',
  };
  return reasonMap[reason] || reason;
}

async function addTradeManagementMessage(
  supabase: any,
  signalId: string,
  messageKey: string,
  params: any
) {
  try {
    const messageGenerator = RISK_MANAGEMENT_MESSAGES[messageKey];
    if (!messageGenerator) {
      console.error(`[Trade Messages] Unknown message key: ${messageKey}`);
      return;
    }

    const message = messageGenerator(params);

    // Check if this exact message type already exists for this signal to prevent duplicates
    const { data: existingMessages } = await supabase
      .from('signal_messages')
      .select('id')
      .eq('signal_id', signalId)
      .eq('message_type', message.messageType)
      .eq('title', message.title);

    if (existingMessages && existingMessages.length > 0) {
      console.log(`[Trade Messages] Skipping duplicate ${messageKey} message for signal ${signalId}`);
      return;
    }

    await supabase
      .from('signal_messages')
      .insert({
        signal_id: signalId,
        message_type: message.messageType,
        title: message.title,
        content: message.content,
        metadata: message.metadata || {},
      });

    console.log(`[Trade Messages] Added ${messageKey} message for signal ${signalId}`);
  } catch (error) {
    console.error(`[Trade Messages] Error adding message:`, error);
  }
}

async function updateDailyStats(
  supabase: any, 
  action: 'trade_opened' | 'trade_closed',
  outcome?: 'win' | 'loss' | 'breakeven',
  pnl?: number
) {
  const today = new Date().toISOString().split('T')[0];
  
  // Get current stats
  const { data: current } = await supabase
    .from('trade_daily_stats')
    .select('*')
    .eq('date', today)
    .maybeSingle();

  const stats = current || {
    date: today,
    total_trades: 0,
    winning_trades: 0,
    losing_trades: 0,
    breakeven_trades: 0,
    total_pnl: 0,
    total_r_multiple: 0,
    consecutive_losses: 0,
    consecutive_wins: 0,
  };

  if (action === 'trade_opened') {
    stats.total_trades++;
  } else if (action === 'trade_closed' && outcome) {
    if (outcome === 'win') {
      stats.winning_trades++;
      stats.consecutive_wins++;
      stats.consecutive_losses = 0;
    } else if (outcome === 'loss') {
      stats.losing_trades++;
      stats.consecutive_losses++;
      stats.consecutive_wins = 0;
    } else {
      stats.breakeven_trades++;
      stats.consecutive_losses = 0;
      stats.consecutive_wins = 0;
    }
    stats.total_pnl = (stats.total_pnl || 0) + (pnl || 0);
    stats.total_r_multiple = (stats.total_r_multiple || 0) + (pnl || 0);
  }

  stats.updated_at = new Date().toISOString();

  await supabase
    .from('trade_daily_stats')
    .upsert(stats, { onConflict: 'date' });
}

async function updateCurrencyExposure(supabase: any) {
  // Get all active trades
  const { data: activeTrades } = await supabase
    .from('institutional_signals')
    .select('symbol, direction, initial_position_size, remaining_position_pct')
    .in('trade_state', ['active', 'phase1', 'phase2', 'phase3']);

  // Reset all exposures
  await supabase
    .from('currency_exposure')
    .update({ net_exposure: 0, position_count: 0, last_updated: new Date().toISOString() })
    .neq('currency', '');

  if (!activeTrades?.length) return;

  // Calculate new exposures
  const exposures: Record<string, { net: number; count: number }> = {};

  for (const trade of activeTrades) {
    const { base, quote } = parseCurrencyPair(trade.symbol);
    const size = (trade.initial_position_size || 1) * ((trade.remaining_position_pct || 100) / 100);
    const direction = trade.direction === 'BUY' ? 1 : -1;

    exposures[base] = exposures[base] || { net: 0, count: 0 };
    exposures[quote] = exposures[quote] || { net: 0, count: 0 };

    exposures[base].net += size * direction;
    exposures[base].count++;
    exposures[quote].net -= size * direction;
    exposures[quote].count++;
  }

  // Update database
  for (const [currency, data] of Object.entries(exposures)) {
    await supabase
      .from('currency_exposure')
      .update({ 
        net_exposure: data.net, 
        position_count: data.count,
        last_updated: new Date().toISOString() 
      })
      .eq('currency', currency);
  }
}

async function fetchCurrentPrices(symbols: string[]): Promise<Record<string, number>> {
  const prices: Record<string, number> = {};
  
  try {
    // Use Yahoo Finance API for prices
    for (const symbol of symbols) {
      const yahooSymbol = convertToYahooSymbol(symbol);
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1m&range=1d`;
      
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      
      if (response.ok) {
        const data = await response.json();
        const quote = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
        if (quote) {
          prices[symbol] = quote;
        }
      }
    }
  } catch (error) {
    console.error('[Prices] Error fetching prices:', error);
  }
  
  return prices;
}

function convertToYahooSymbol(symbol: string): string {
  const mapping: Record<string, string> = {
    'EURUSD': 'EURUSD=X',
    'GBPUSD': 'GBPUSD=X',
    'USDJPY': 'USDJPY=X',
    'AUDUSD': 'AUDUSD=X',
    'USDCHF': 'USDCHF=X',
    'USDCAD': 'USDCAD=X',
    'NZDUSD': 'NZDUSD=X',
    'EURGBP': 'EURGBP=X',
    'EURJPY': 'EURJPY=X',
    'GBPJPY': 'GBPJPY=X',
    'XAUUSD': 'GC=F',
    'XAGUSD': 'SI=F',
  };
  return mapping[symbol] || `${symbol}=X`;
}
