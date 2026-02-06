import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CircuitBreakerResult {
  is_locked: boolean;
  lock_reason: string | null;
  locked_until: string | null;
  breaker_type: string | null;
  daily_loss_pct: number;
  personal_limit_pct: number;
  daily_profit_pct: number;
  profit_target: number | null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { account_id, user_id, check_only = false } = await req.json();

    if (!account_id || !user_id) {
      return new Response(
        JSON.stringify({ error: 'account_id and user_id required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[CIRCUIT-BREAKER] Checking account ${account_id}`);

    // Fetch account settings
    const { data: account, error: accountError } = await supabase
      .from('user_prop_accounts')
      .select('*')
      .eq('id', account_id)
      .eq('user_id', user_id)
      .single();

    if (accountError || !account) {
      return new Response(
        JSON.stringify({ error: 'Account not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const today = new Date().toISOString().split('T')[0];
    const result: CircuitBreakerResult = {
      is_locked: false,
      lock_reason: null,
      locked_until: null,
      breaker_type: null,
      daily_loss_pct: 0,
      personal_limit_pct: account.personal_daily_loss_limit_pct || 3,
      daily_profit_pct: 0,
      profit_target: account.daily_profit_target,
    };

    // Get today's stats
    const { data: todayStats } = await supabase
      .from('trade_daily_stats')
      .select('*')
      .eq('account_id', account_id)
      .eq('date', today)
      .maybeSingle();

    const dailyPnL = todayStats?.daily_pnl || 0;
    const dailyLossPct = account.daily_starting_equity > 0 
      ? Math.abs(Math.min(0, dailyPnL)) / account.daily_starting_equity * 100 
      : 0;
    const dailyProfitPct = account.daily_starting_equity > 0 
      ? Math.max(0, dailyPnL) / account.daily_starting_equity * 100 
      : 0;

    result.daily_loss_pct = dailyLossPct;
    result.daily_profit_pct = dailyProfitPct;

    // Check if already locked
    if (account.trading_locked_until && new Date(account.trading_locked_until) > new Date()) {
      result.is_locked = true;
      result.lock_reason = account.lock_reason;
      result.locked_until = account.trading_locked_until;
      result.breaker_type = account.daily_loss_locked ? 'daily_loss' : 
                            account.daily_profit_locked ? 'profit_lock' : 'manual';
      
      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // CHECK 1: Personal daily loss limit
    const personalLimitPct = account.personal_daily_loss_limit_pct || 3;
    if (dailyLossPct >= personalLimitPct) {
      result.is_locked = true;
      result.lock_reason = `Daily loss limit hit: ${dailyLossPct.toFixed(2)}% loss (limit: ${personalLimitPct}%)`;
      result.breaker_type = 'daily_loss';
      
      // Lock until midnight UTC
      const tomorrow = new Date();
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
      tomorrow.setUTCHours(0, 0, 0, 0);
      result.locked_until = tomorrow.toISOString();

      if (!check_only) {
        // Update account with lock
        await supabase
          .from('user_prop_accounts')
          .update({
            trading_locked_until: result.locked_until,
            lock_reason: result.lock_reason,
            daily_loss_locked: true,
          })
          .eq('id', account_id);

        // Log the circuit breaker event
        await supabase.from('trading_circuit_breaker_log').insert({
          user_id,
          account_id,
          breaker_type: 'daily_loss',
          trigger_value: dailyLossPct,
          threshold_value: personalLimitPct,
          reason: result.lock_reason,
          locked_until: result.locked_until,
        });

        // Create notification
        await supabase.from('user_notifications').insert({
          user_id,
          type: 'circuit_breaker',
          title: '🔴 Trading Paused - Daily Loss Limit',
          message: result.lock_reason + ' Trading will resume at midnight UTC.',
        });

        // Send push notification for critical alert
        try {
          await supabase.functions.invoke('send-web-push', {
            body: {
              user_id,
              title: '🔴 Trading Locked',
              body: result.lock_reason,
              data: { type: 'circuit_breaker', account_id }
            }
          });
        } catch (pushError) {
          console.log('[CIRCUIT-BREAKER] Push notification failed:', pushError);
        }

        console.log(`[CIRCUIT-BREAKER] LOCKED account ${account_id}: ${result.lock_reason}`);
      }
    }

    // CHECK 2: Daily profit target (if lock_after_target enabled)
    if (!result.is_locked && account.lock_after_target && account.daily_profit_target) {
      const dailyProfit = Math.max(0, dailyPnL);
      if (dailyProfit >= account.daily_profit_target) {
        result.is_locked = true;
        result.lock_reason = `Daily profit target reached: $${dailyProfit.toFixed(2)} (target: $${account.daily_profit_target})`;
        result.breaker_type = 'profit_lock';
        
        // Lock until midnight UTC
        const tomorrow = new Date();
        tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
        tomorrow.setUTCHours(0, 0, 0, 0);
        result.locked_until = tomorrow.toISOString();

        if (!check_only) {
          await supabase
            .from('user_prop_accounts')
            .update({
              trading_locked_until: result.locked_until,
              lock_reason: result.lock_reason,
              daily_profit_locked: true,
            })
            .eq('id', account_id);

          await supabase.from('trading_circuit_breaker_log').insert({
            user_id,
            account_id,
            breaker_type: 'profit_lock',
            trigger_value: dailyProfit,
            threshold_value: account.daily_profit_target,
            reason: result.lock_reason,
            locked_until: result.locked_until,
          });

          await supabase.from('user_notifications').insert({
            user_id,
            type: 'profit_lock',
            title: '🎯 Trading Paused - Target Reached!',
            message: result.lock_reason + ' Great discipline! Resume tomorrow.',
          });

          // Send push notification for profit lock
          try {
            await supabase.functions.invoke('send-web-push', {
              body: {
                user_id,
                title: '🎯 Target Reached!',
                body: result.lock_reason,
                data: { type: 'profit_lock', account_id }
              }
            });
          } catch (pushError) {
            console.log('[CIRCUIT-BREAKER] Push notification failed:', pushError);
          }

          console.log(`[CIRCUIT-BREAKER] PROFIT LOCKED account ${account_id}: ${result.lock_reason}`);
        }
      }
    }

    // CHECK 3: Session time restrictions
    if (!result.is_locked && account.allowed_trading_hours) {
      const tradingHours = account.allowed_trading_hours as { start: string; end: string; timezone?: string };
      if (tradingHours.start && tradingHours.end) {
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
          : (currentTime >= startTime || currentTime <= endTime); // Handles overnight sessions

        if (!isWithinHours) {
          result.is_locked = true;
          result.lock_reason = `Outside trading hours. Allowed: ${tradingHours.start} - ${tradingHours.end} UTC`;
          result.breaker_type = 'session_time';
          // Don't set locked_until - this unlocks dynamically
        }
      }
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[CIRCUIT-BREAKER] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
