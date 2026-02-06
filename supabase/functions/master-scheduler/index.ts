import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SchedulerResult {
  function: string;
  status: 'success' | 'skipped' | 'error';
  message?: string;
  duration_ms?: number;
}

// Check if market is open (Forex hours: Sunday 5pm EST - Friday 5pm EST)
function isMarketOpen(): boolean {
  const now = new Date();
  const day = now.getUTCDay();
  const hour = now.getUTCHours();
  
  // Convert to EST (UTC-5, ignoring DST for simplicity)
  const estHour = (hour - 5 + 24) % 24;
  const estDay = hour < 5 ? (day - 1 + 7) % 7 : day;
  
  // Market closed: Saturday all day, Sunday until 5pm EST, Friday after 5pm EST
  if (estDay === 6) return false; // Saturday
  if (estDay === 0 && estHour < 17) return false; // Sunday before 5pm EST
  if (estDay === 5 && estHour >= 17) return false; // Friday after 5pm EST
  
  return true;
}

// Check if it's time for daily reset (midnight UTC)
function isDailyResetTime(): boolean {
  const now = new Date();
  return now.getUTCHours() === 0 && now.getUTCMinutes() < 10;
}

// Check if it's time for weekly checks (Sunday 6pm UTC)
function isWeeklyCheckTime(): boolean {
  const now = new Date();
  return now.getUTCDay() === 0 && now.getUTCHours() === 18 && now.getUTCMinutes() < 10;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const results: SchedulerResult[] = [];

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json().catch(() => ({}));
    const { force_all = false, specific_function = null } = body;

    console.log(`[MASTER-SCHEDULER] Starting run. Force all: ${force_all}, Specific: ${specific_function}`);
    console.log(`[MASTER-SCHEDULER] Market open: ${isMarketOpen()}, Daily reset: ${isDailyResetTime()}, Weekly check: ${isWeeklyCheckTime()}`);

    // ===== 1. DAILY EQUITY RESET (runs at midnight UTC) =====
    if (force_all || specific_function === 'daily-equity-reset' || isDailyResetTime()) {
      const funcStart = Date.now();
      try {
        await supabase.functions.invoke('daily-equity-reset');
        results.push({ 
          function: 'daily-equity-reset', 
          status: 'success',
          duration_ms: Date.now() - funcStart
        });
      } catch (e: any) {
        results.push({ 
          function: 'daily-equity-reset', 
          status: 'error', 
          message: e.message 
        });
      }
    } else {
      results.push({ function: 'daily-equity-reset', status: 'skipped', message: 'Not reset time' });
    }

    // ===== 2. DRAWDOWN MONITOR (runs every 5 minutes during market hours) =====
    if (force_all || specific_function === 'drawdown-monitor' || isMarketOpen()) {
      const funcStart = Date.now();
      try {
        await supabase.functions.invoke('drawdown-monitor');
        results.push({ 
          function: 'drawdown-monitor', 
          status: 'success',
          duration_ms: Date.now() - funcStart
        });
      } catch (e: any) {
        results.push({ 
          function: 'drawdown-monitor', 
          status: 'error', 
          message: e.message 
        });
      }
    } else {
      results.push({ function: 'drawdown-monitor', status: 'skipped', message: 'Market closed' });
    }

    // ===== 3. DAILY CIRCUIT BREAKER (runs every 5 minutes during market hours) =====
    if (force_all || specific_function === 'daily-circuit-breaker' || isMarketOpen()) {
      const funcStart = Date.now();
      try {
        await supabase.functions.invoke('daily-circuit-breaker');
        results.push({ 
          function: 'daily-circuit-breaker', 
          status: 'success',
          duration_ms: Date.now() - funcStart
        });
      } catch (e: any) {
        results.push({ 
          function: 'daily-circuit-breaker', 
          status: 'error', 
          message: e.message 
        });
      }
    } else {
      results.push({ function: 'daily-circuit-breaker', status: 'skipped', message: 'Market closed' });
    }

    // ===== 4. TRADE MANAGEMENT MONITOR (runs every minute during market hours) =====
    if (force_all || specific_function === 'trade-management-monitor' || isMarketOpen()) {
      const funcStart = Date.now();
      try {
        await supabase.functions.invoke('trade-management-monitor');
        results.push({ 
          function: 'trade-management-monitor', 
          status: 'success',
          duration_ms: Date.now() - funcStart
        });
      } catch (e: any) {
        results.push({ 
          function: 'trade-management-monitor', 
          status: 'error', 
          message: e.message 
        });
      }
    } else {
      results.push({ function: 'trade-management-monitor', status: 'skipped', message: 'Market closed' });
    }

    // ===== 5. LOT SIZE CONSISTENCY (runs every 15 minutes) =====
    if (force_all || specific_function === 'lot-size-consistency') {
      const funcStart = Date.now();
      try {
        await supabase.functions.invoke('lot-size-consistency');
        results.push({ 
          function: 'lot-size-consistency', 
          status: 'success',
          duration_ms: Date.now() - funcStart
        });
      } catch (e: any) {
        results.push({ 
          function: 'lot-size-consistency', 
          status: 'error', 
          message: e.message 
        });
      }
    }

    // ===== 6. CHALLENGE DEADLINE MONITOR (runs at midnight UTC) =====
    if (force_all || specific_function === 'challenge-deadline-monitor' || isDailyResetTime()) {
      const funcStart = Date.now();
      try {
        await supabase.functions.invoke('challenge-deadline-monitor');
        results.push({ 
          function: 'challenge-deadline-monitor', 
          status: 'success',
          duration_ms: Date.now() - funcStart
        });
      } catch (e: any) {
        results.push({ 
          function: 'challenge-deadline-monitor', 
          status: 'error', 
          message: e.message 
        });
      }
    } else {
      results.push({ function: 'challenge-deadline-monitor', status: 'skipped', message: 'Not reset time' });
    }

    // ===== 7. INACTIVITY MONITOR (runs once daily at 1am UTC) =====
    if (force_all || specific_function === 'inactivity-monitor' || (new Date().getUTCHours() === 1 && new Date().getUTCMinutes() < 10)) {
      const funcStart = Date.now();
      try {
        await supabase.functions.invoke('inactivity-monitor');
        results.push({ 
          function: 'inactivity-monitor', 
          status: 'success',
          duration_ms: Date.now() - funcStart
        });
      } catch (e: any) {
        results.push({ 
          function: 'inactivity-monitor', 
          status: 'error', 
          message: e.message 
        });
      }
    } else {
      results.push({ function: 'inactivity-monitor', status: 'skipped', message: 'Not check time' });
    }

    // ===== 8. SCALING PLAN PROGRESS (runs weekly on Sunday) =====
    if (force_all || specific_function === 'scaling-plan-progress' || isWeeklyCheckTime()) {
      const funcStart = Date.now();
      try {
        // Get all active scaling plans and check progress
        const { data: accounts } = await supabase
          .from('user_prop_accounts')
          .select('id, user_id, scaling_week')
          .not('scaling_week', 'is', null)
          .eq('status', 'active');

        if (accounts && accounts.length > 0) {
          for (const account of accounts) {
            await supabase.functions.invoke('scaling-plan-progress', {
              body: { 
                action: 'check_progress',
                account_id: account.id,
                user_id: account.user_id
              }
            });
          }
        }

        results.push({ 
          function: 'scaling-plan-progress', 
          status: 'success',
          message: `Checked ${accounts?.length || 0} accounts`,
          duration_ms: Date.now() - funcStart
        });
      } catch (e: any) {
        results.push({ 
          function: 'scaling-plan-progress', 
          status: 'error', 
          message: e.message 
        });
      }
    } else {
      results.push({ function: 'scaling-plan-progress', status: 'skipped', message: 'Not weekly check time' });
    }

    // ===== 9. WEEKEND POSITION REMINDER (Friday 3pm UTC) =====
    const now = new Date();
    const isFridayReminder = now.getUTCDay() === 5 && now.getUTCHours() === 15 && now.getUTCMinutes() < 10;
    if (force_all || specific_function === 'weekend-position-reminder' || isFridayReminder) {
      const funcStart = Date.now();
      try {
        await supabase.functions.invoke('weekend-position-reminder');
        results.push({ 
          function: 'weekend-position-reminder', 
          status: 'success',
          duration_ms: Date.now() - funcStart
        });
      } catch (e: any) {
        results.push({ 
          function: 'weekend-position-reminder', 
          status: 'error', 
          message: e.message 
        });
      }
    } else {
      results.push({ function: 'weekend-position-reminder', status: 'skipped', message: 'Not Friday reminder time' });
    }

    // ===== 10. DETECT TRADING MISTAKES (runs every 30 minutes during market hours) =====
    if (force_all || specific_function === 'detect-trading-mistakes' || isMarketOpen()) {
      const funcStart = Date.now();
      try {
        await supabase.functions.invoke('detect-trading-mistakes');
        results.push({ 
          function: 'detect-trading-mistakes', 
          status: 'success',
          duration_ms: Date.now() - funcStart
        });
      } catch (e: any) {
        results.push({ 
          function: 'detect-trading-mistakes', 
          status: 'error', 
          message: e.message 
        });
      }
    } else {
      results.push({ function: 'detect-trading-mistakes', status: 'skipped', message: 'Market closed' });
    }

    const totalDuration = Date.now() - startTime;
    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;

    console.log(`[MASTER-SCHEDULER] Completed. Success: ${successCount}, Errors: ${errorCount}, Duration: ${totalDuration}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        market_open: isMarketOpen(),
        daily_reset_time: isDailyResetTime(),
        weekly_check_time: isWeeklyCheckTime(),
        total_duration_ms: totalDuration,
        summary: {
          success: successCount,
          skipped: results.filter(r => r.status === 'skipped').length,
          errors: errorCount
        },
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[MASTER-SCHEDULER] Fatal error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        results 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
