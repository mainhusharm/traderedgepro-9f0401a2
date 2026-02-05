import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ValidationRequest {
  user_id: string;
  account_id: string;
  signal_id: string;
  symbol: string;
  direction: string;
  entry_price: number;
  stop_loss: number;
  take_profit_1: number;
  take_profit_2?: number;
  take_profit_3?: number;
  requested_risk_pct?: number;
}

interface ValidationResult {
  allowed: boolean;
  blockers: string[];
  warnings: string[];
  adjusted_lot_size?: number;
  max_allowed_lot_size: number;
  risk_amount: number;
  daily_dd_remaining_pct: number;
  max_dd_remaining_pct: number;
  news_window?: { event: string; time: string };
  recovery_mode_active?: boolean;
  cooling_off_active?: boolean;
  cooling_off_ends_at?: string;
}

// Correlation matrix for major pairs
const CORRELATED_PAIRS: Record<string, string[]> = {
  'EURUSD': ['GBPUSD', 'AUDUSD', 'NZDUSD'],
  'GBPUSD': ['EURUSD', 'AUDUSD', 'NZDUSD'],
  'USDJPY': ['USDCHF', 'USDCAD'],
  'USDCHF': ['USDJPY', 'USDCAD'],
  'AUDUSD': ['NZDUSD', 'EURUSD', 'GBPUSD'],
  'NZDUSD': ['AUDUSD', 'EURUSD', 'GBPUSD'],
  'XAUUSD': ['EURUSD', 'XAGUSD'],
};

// Pip values per lot for different symbols
const PIP_VALUES: Record<string, number> = {
  'EURUSD': 10, 'GBPUSD': 10, 'AUDUSD': 10, 'NZDUSD': 10,
  'USDCHF': 10, 'USDCAD': 10, 'USDJPY': 9.1,
  'EURGBP': 12.5, 'EURJPY': 9.1, 'GBPJPY': 9.1,
  'XAUUSD': 10, 'XAGUSD': 50,
};

// Psychology guard settings
const CONSECUTIVE_LOSSES_FOR_COOLDOWN = 2;
const COOLDOWN_MINUTES = 30;

function getPipValue(symbol: string): number {
  return PIP_VALUES[symbol] || 10;
}

function getPipSize(symbol: string): number {
  if (symbol.includes('JPY')) return 0.01;
  if (symbol === 'XAUUSD') return 0.1;
  if (symbol === 'XAGUSD') return 0.01;
  return 0.0001;
}

function calculateLotSize(
  equity: number,
  riskPct: number,
  entryPrice: number,
  stopLoss: number,
  symbol: string
): { lotSize: number; riskAmount: number; stopPips: number } {
  const pipSize = getPipSize(symbol);
  const pipValue = getPipValue(symbol);
  const stopPips = Math.abs(entryPrice - stopLoss) / pipSize;
  const riskAmount = equity * (riskPct / 100);
  const lotSize = riskAmount / (stopPips * pipValue);
  
  return {
    lotSize: Math.floor(lotSize * 100) / 100, // Round down to 0.01
    riskAmount,
    stopPips
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body: ValidationRequest = await req.json();
    const { 
      user_id, 
      account_id, 
      signal_id,
      symbol, 
      direction,
      entry_price, 
      stop_loss, 
      take_profit_1,
      take_profit_2,
      take_profit_3,
      requested_risk_pct = 1 
    } = body;

    console.log(`[VALIDATE] Validating trade for user ${user_id}, account ${account_id}`);

    const blockers: string[] = [];
    const warnings: string[] = [];
    let newsWindow: { event: string; time: string } | undefined;
    let coolingOffActive = false;
    let coolingOffEndsAt: string | undefined;

    // 1. Fetch user's prop account
    const { data: account, error: accountError } = await supabase
      .from('user_prop_accounts')
      .select('*')
      .eq('id', account_id)
      .eq('user_id', user_id)
      .single();

    if (accountError || !account) {
      return new Response(JSON.stringify({
        allowed: false,
        blockers: ['Account not found'],
        warnings: [],
        max_allowed_lot_size: 0,
        risk_amount: 0,
        daily_dd_remaining_pct: 0,
        max_dd_remaining_pct: 0
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Check if account is still active
    if (account.status !== 'active') {
      return new Response(JSON.stringify({
        allowed: false,
        blockers: [`Account is ${account.status}: ${account.failure_reason || 'Not active'}`],
        warnings: [],
        max_allowed_lot_size: 0,
        risk_amount: 0,
        daily_dd_remaining_pct: 0,
        max_dd_remaining_pct: 0
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ===== DAILY CHECKLIST REQUIREMENT =====
    if (account.require_checklist_before_trading === true) {
      const today = new Date().toISOString().split('T')[0];
      const { data: todayChecklist } = await supabase
        .from('daily_trading_checklists')
        .select('completed_at')
        .eq('account_id', account_id)
        .eq('user_id', user_id)
        .eq('date', today)
        .maybeSingle();

      if (!todayChecklist?.completed_at) {
        return new Response(JSON.stringify({
          allowed: false,
          blockers: ['📋 Daily checklist not completed. Complete your pre-trade checklist before trading.'],
          warnings: [],
          max_allowed_lot_size: 0,
          risk_amount: 0,
          daily_dd_remaining_pct: 0,
          max_dd_remaining_pct: 0,
          checklist_required: true
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }
    // ===== END CHECKLIST REQUIREMENT =====

    // ===== CIRCUIT BREAKER CHECK =====
    // Check if trading is locked (daily loss limit or profit target)
    if (account.trading_locked_until && new Date(account.trading_locked_until) > new Date()) {
      const lockReason = account.lock_reason || 'Trading temporarily paused';
      return new Response(JSON.stringify({
        allowed: false,
        blockers: [`🔴 ${lockReason}`],
        warnings: [],
        max_allowed_lot_size: 0,
        risk_amount: 0,
        daily_dd_remaining_pct: 0,
        max_dd_remaining_pct: 0,
        circuit_breaker_active: true,
        locked_until: account.trading_locked_until
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ===== SESSION TIME CHECK =====
    if (account.allowed_trading_hours) {
      const tradingHours = account.allowed_trading_hours as { start?: string; end?: string; enabled?: boolean };
      if (tradingHours.enabled && tradingHours.start && tradingHours.end) {
        const now = new Date();
        const currentHour = now.getUTCHours();
        const currentMinute = now.getUTCMinutes();
        const currentTime = currentHour * 60 + currentMinute;

        const [startH, startM] = tradingHours.start.split(':').map(Number);
        const [endH, endM] = tradingHours.end.split(':').map(Number);
        const startTime = startH * 60 + startM;
        const endTime = endH * 60 + endM;

        const isWithinHours = startTime <= endTime 
          ? (currentTime >= startTime && currentTime <= endTime)
          : (currentTime >= startTime || currentTime <= endTime);

        if (!isWithinHours) {
          blockers.push(`⏰ Outside your trading hours (${tradingHours.start} - ${tradingHours.end} UTC). Wait for your session to open.`);
        }
      }
    }
    // ===== END SESSION TIME CHECK =====

    // ===== PSYCHOLOGY GUARD: Check for consecutive losses =====
    const today = new Date().toISOString().split('T')[0];
    const { data: todayStats } = await supabase
      .from('trade_daily_stats')
      .select('consecutive_losses, last_loss_at')
      .eq('account_id', account_id)
      .eq('date', today)
      .maybeSingle();

    const consecutiveLosses = todayStats?.consecutive_losses || 0;
    const lastLossAt = todayStats?.last_loss_at ? new Date(todayStats.last_loss_at) : null;

    if (consecutiveLosses >= CONSECUTIVE_LOSSES_FOR_COOLDOWN && lastLossAt) {
      const cooldownEnds = new Date(lastLossAt.getTime() + COOLDOWN_MINUTES * 60 * 1000);
      const now = new Date();
      
      if (now < cooldownEnds) {
        coolingOffActive = true;
        coolingOffEndsAt = cooldownEnds.toISOString();
        const minutesRemaining = Math.ceil((cooldownEnds.getTime() - now.getTime()) / 60000);
        blockers.push(`Psychology Guard: Cooling-off period active. ${minutesRemaining} minutes remaining after ${consecutiveLosses} consecutive losses. Take a break to avoid revenge trading.`);
      }
    }

    if (consecutiveLosses >= 1 && consecutiveLosses < CONSECUTIVE_LOSSES_FOR_COOLDOWN) {
      warnings.push(`Caution: You have ${consecutiveLosses} consecutive loss${consecutiveLosses > 1 ? 'es' : ''} today. Consider your next trade carefully.`);
    }
    // ===== END PSYCHOLOGY GUARD =====

    // 2. Calculate drawdown room
    const dailyDDRemaining = account.daily_dd_limit_pct - (account.daily_drawdown_used_pct || 0);
    const maxDDRemaining = account.max_dd_limit_pct - (account.max_drawdown_used_pct || 0);

    console.log(`[VALIDATE] Daily DD remaining: ${dailyDDRemaining}%, Max DD remaining: ${maxDDRemaining}%`);

    // 3. Calculate max safe risk based on remaining drawdown
    let maxRiskFromDaily = dailyDDRemaining * 0.5; // Never use more than 50% of remaining DD
    let maxRiskFromMax = maxDDRemaining * 0.3; // Never use more than 30% of max DD remaining
    let maxSafeRisk = Math.min(maxRiskFromDaily, maxRiskFromMax, account.max_risk_per_trade_pct || 2);

    // ===== RECOVERY MODE: Override risk if active =====
    const isRecoveryMode = account.recovery_mode_active === true;
    if (isRecoveryMode) {
      const recoveryRisk = 0.5; // Fixed 0.5% risk in recovery mode
      maxSafeRisk = Math.min(maxSafeRisk, recoveryRisk);
      warnings.push(`🛡️ Recovery Mode Active: Risk limited to ${recoveryRisk}% per trade to protect your account.`);
    }
    // ===== END RECOVERY MODE =====

    // Apply scaling plan multiplier
    const scaledRisk = maxSafeRisk * (account.current_risk_multiplier || 1);
    const effectiveRisk = Math.min(requested_risk_pct, scaledRisk);

    console.log(`[VALIDATE] Max safe risk: ${maxSafeRisk}%, Scaled: ${scaledRisk}%, Effective: ${effectiveRisk}%${isRecoveryMode ? ' (RECOVERY MODE)' : ''}`);

    // 4. Check if there's any room at all
    if (dailyDDRemaining <= 0.5) {
      blockers.push(`Daily drawdown limit nearly reached (${(100 - dailyDDRemaining).toFixed(2)}% used). No trades allowed until tomorrow.`);
    }

    if (maxDDRemaining <= 1) {
      blockers.push(`Max drawdown limit nearly reached (${(100 - maxDDRemaining).toFixed(2)}% used). Account at critical risk.`);
    }

    if (effectiveRisk < 0.1) {
      blockers.push('Insufficient risk budget for this trade');
    }

    // 5. Calculate position size
    const { lotSize, riskAmount, stopPips } = calculateLotSize(
      account.current_equity,
      effectiveRisk,
      entry_price,
      stop_loss,
      symbol
    );

    // Check minimum lot size
    if (lotSize < 0.01) {
      blockers.push('Calculated lot size below minimum (0.01). Not enough risk budget.');
    }

    // Check firm lot size limit
    let adjustedLotSize = lotSize;
    if (account.max_lot_size && lotSize > account.max_lot_size) {
      adjustedLotSize = account.max_lot_size;
      warnings.push(`Lot size reduced to firm limit of ${account.max_lot_size}`);
    }

    // 5b. Check max open trades limit and get existing trades
    const { data: existingTrades } = await supabase
      .from('user_trade_allocations')
      .select('id, signal_id, lot_size, institutional_signals(symbol, direction)')
      .eq('user_id', user_id)
      .eq('account_id', account_id)
      .in('status', ['pending', 'active', 'partial']);

    if (account.max_open_trades && existingTrades && existingTrades.length >= account.max_open_trades) {
      blockers.push(`Max open trades reached (${existingTrades.length}/${account.max_open_trades}). Close a position first.`);
    }

    // 5c. Check max open lots
    if (account.max_open_lots && existingTrades) {
      const totalOpenLots = existingTrades.reduce((sum: number, t: any) => sum + (t.lot_size || 0), 0);
      if (totalOpenLots + adjustedLotSize > account.max_open_lots) {
        const remainingLots = account.max_open_lots - totalOpenLots;
        if (remainingLots <= 0) {
          blockers.push(`Max open lots reached (${totalOpenLots.toFixed(2)}/${account.max_open_lots}). Close positions first.`);
        } else {
          adjustedLotSize = Math.min(adjustedLotSize, remainingLots);
          warnings.push(`Lot size reduced to ${adjustedLotSize.toFixed(2)} due to max open lots limit`);
        }
      }
    }

    // 5d. Check stop loss requirement
    if (account.stop_loss_required && !stop_loss) {
      blockers.push('Stop loss is required by this prop firm for all trades.');
    }

    // 5e. Check minimum stop loss distance
    if (account.min_stop_loss_pips && stopPips < account.min_stop_loss_pips) {
      blockers.push(`Stop loss too tight (${stopPips.toFixed(1)} pips). Minimum required: ${account.min_stop_loss_pips} pips.`);
    }

    // 5f. Check hedging restrictions
    if (account.hedging_allowed === false && existingTrades) {
      const oppositePosition = existingTrades.find((t: any) => {
        const signalData = t.institutional_signals as any;
        return signalData && signalData.symbol === symbol && signalData.direction !== direction;
      });
      if (oppositePosition) {
        blockers.push(`Hedging not allowed: Already have opposite ${symbol} position open.`);
      }
    }

    // 5g. Check prohibited instruments
    if (account.prohibited_instruments && Array.isArray(account.prohibited_instruments)) {
      const prohibited = account.prohibited_instruments as string[];
      const symbolLower = symbol.toLowerCase();
      const isProhibited = prohibited.some((p: string) => {
        const pLower = p.toLowerCase();
        return symbolLower.includes(pLower) || pLower.includes(symbolLower);
      });
      if (isProhibited) {
        blockers.push(`${symbol} is a prohibited instrument for this prop firm.`);
      }
    }

    // 5h. Martingale detection (check if averaging into same symbol in same direction after loss)
    if (account.martingale_allowed === false && existingTrades) {
      const sameSymbolTrades = existingTrades.filter((t: any) => {
        const signalData = t.institutional_signals as any;
        return signalData && signalData.symbol === symbol && signalData.direction === direction;
      });
      
      if (sameSymbolTrades.length > 0) {
        // Already have same symbol/direction - could be martingale
        warnings.push(`Warning: Adding to existing ${symbol} ${direction} position. Martingale/averaging may not be allowed.`);
      }
    }

    // 6. Check news restrictions (if not allowed)
    if (!account.news_trading_allowed) {
      try {
        const { data: events } = await supabase.functions.invoke('economic-calendar', {
          body: { days: 1 }
        });

        if (events?.events) {
          const currencies = [symbol.substring(0, 3), symbol.substring(3, 6)];
          const now = new Date();
          // Use user's configured news buffer or default to 30 minutes
          const newsBufferMinutes = account.news_buffer_minutes || 30;
          const bufferTime = new Date(now.getTime() + newsBufferMinutes * 60 * 1000);
          
          const upcomingHighImpact = events.events.filter((e: any) => {
            const eventTime = new Date(e.date || e.time);
            return currencies.includes(e.currency) &&
                   e.impact === 'high' &&
                   eventTime > now &&
                   eventTime < bufferTime;
          });

          if (upcomingHighImpact.length > 0) {
            const nextEvent = upcomingHighImpact[0];
            const minutesUntil = Math.round((new Date(nextEvent.date || nextEvent.time).getTime() - now.getTime()) / 60000);
            blockers.push(`News restriction: ${nextEvent.name} for ${nextEvent.currency} in ${minutesUntil} minutes (buffer: ${newsBufferMinutes}min)`);
            newsWindow = { event: nextEvent.name, time: nextEvent.date || nextEvent.time };
          }
        }
      } catch (e) {
        console.log('[VALIDATE] Could not check economic calendar:', e);
        warnings.push('Could not verify news schedule');
      }
    }

    // 7. Check weekend holding restrictions
    if (!account.weekend_holding_allowed) {
      const now = new Date();
      const dayOfWeek = now.getUTCDay();
      const hour = now.getUTCHours();
      
      // Friday after 4 PM UTC
      if (dayOfWeek === 5 && hour >= 16) {
        blockers.push('Weekend holding not allowed. No new trades after Friday 4 PM UTC.');
      }
      // Saturday or Sunday
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        blockers.push('Weekend holding not allowed. Trading resumes Sunday night.');
      }
    }

    // 8. Check correlation with existing positions (with hard block option)
    const { data: openTrades } = await supabase
      .from('user_trade_allocations')
      .select('signal_id, lot_size, institutional_signals(symbol, direction)')
      .eq('user_id', user_id)
      .eq('account_id', account_id)
      .in('status', ['pending', 'active', 'partial']);

    if (openTrades && openTrades.length > 0) {
      const correlatedPairs = CORRELATED_PAIRS[symbol] || [];
      const correlatedPositions: { symbol: string; lotSize: number }[] = [];
      let totalCorrelatedExposure = 0;

      for (const trade of openTrades) {
        const signalData = trade.institutional_signals as any;
        if (signalData && correlatedPairs.includes(signalData.symbol)) {
          if (signalData.direction === direction) {
            correlatedPositions.push({ symbol: signalData.symbol, lotSize: trade.lot_size || 0 });
            totalCorrelatedExposure += trade.lot_size || 0;
          }
        }
      }

      // Calculate correlation exposure as percentage of account
      const maxCorrelatedExposurePct = account.max_correlated_exposure_pct || 5; // Default 5%
      const correlatedExposureValue = totalCorrelatedExposure * getPipValue(symbol) * 100; // Rough USD value
      const exposurePct = (correlatedExposureValue / account.current_equity) * 100;

      if (correlatedPositions.length >= 2) {
        const correlatedSymbols = correlatedPositions.map(p => p.symbol).join(', ');
        
        // Hard block if enabled and exceeding limit
        if (account.hard_block_correlation === true && exposurePct >= maxCorrelatedExposurePct) {
          blockers.push(`🔗 Correlation limit reached: Already have ${correlatedSymbols} in same direction (${exposurePct.toFixed(1)}% exposure, max: ${maxCorrelatedExposurePct}%)`);
        } else {
          warnings.push(`High correlation exposure: Already have ${correlatedSymbols} in same direction (${exposurePct.toFixed(1)}% exposure)`);
        }
      } else if (correlatedPositions.length === 1) {
        warnings.push(`Note: ${symbol} is correlated with your open ${correlatedPositions[0].symbol} position`);
      }
    }

    // 9. Check consistency rule (if applicable) - NOW A BLOCKER, NOT JUST WARNING
    if (account.consistency_rule_pct && account.current_profit > 0) {
      const { data: dailyStatsForConsistency } = await supabase
        .from('user_daily_stats')
        .select('daily_pnl')
        .eq('user_id', user_id)
        .eq('account_id', account_id)
        .eq('date', today)
        .maybeSingle();

      const todayPnL = dailyStatsForConsistency?.daily_pnl || 0;
      const potentialProfit = riskAmount * 2; // Assume 2R potential
      const potentialTodayPnL = todayPnL + potentialProfit;
      const contributionPct = (potentialTodayPnL / account.current_profit) * 100;

      if (contributionPct > account.consistency_rule_pct * 0.8) {
        warnings.push(`Approaching consistency limit: Today's profit at ${contributionPct.toFixed(1)}% of total (limit: ${account.consistency_rule_pct}%)`);
      }

      // HARD BLOCK if would breach consistency rule
      if (contributionPct > account.consistency_rule_pct) {
        blockers.push(`Would breach consistency rule: ${contributionPct.toFixed(1)}% of total profit in one day (max: ${account.consistency_rule_pct}%). Reduce position size or wait for tomorrow.`);
      }
    }

    // 10. Add scaling plan warning if on reduced risk
    if (account.current_risk_multiplier < 1) {
      warnings.push(`Scaling plan active: Using ${(account.current_risk_multiplier * 100).toFixed(0)}% of normal risk (Week ${account.scaling_week})`);
    }

    const allowed = blockers.length === 0;

    // 11. Log the validation
    await supabase.from('risk_validation_log').insert({
      user_id,
      account_id,
      signal_id,
      allowed,
      blockers,
      warnings,
      daily_dd_used_pct: account.daily_drawdown_used_pct,
      max_dd_used_pct: account.max_drawdown_used_pct,
      daily_dd_remaining: dailyDDRemaining,
      max_dd_remaining: maxDDRemaining,
      requested_lot_size: lotSize,
      max_allowed_lot_size: adjustedLotSize,
      adjusted_lot_size: allowed ? adjustedLotSize : null,
      news_blocked: !!newsWindow,
      news_event_name: newsWindow?.event,
      news_event_time: newsWindow?.time
    });

    const result: ValidationResult = {
      allowed,
      blockers,
      warnings,
      adjusted_lot_size: allowed ? adjustedLotSize : undefined,
      max_allowed_lot_size: adjustedLotSize,
      risk_amount: riskAmount,
      daily_dd_remaining_pct: dailyDDRemaining,
      max_dd_remaining_pct: maxDDRemaining,
      news_window: newsWindow,
      recovery_mode_active: isRecoveryMode,
      cooling_off_active: coolingOffActive,
      cooling_off_ends_at: coolingOffEndsAt
    };

    console.log(`[VALIDATE] Result: ${allowed ? 'ALLOWED' : 'BLOCKED'}`, { blockers, warnings });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[VALIDATE] Error:', error);
    return new Response(JSON.stringify({ 
      error: String(error),
      allowed: false,
      blockers: ['Validation system error'],
      warnings: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
