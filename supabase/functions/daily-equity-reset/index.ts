import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('[DAILY-RESET] Starting daily equity reset...');
    
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Fetch all active accounts
    const { data: accounts, error: accountsError } = await supabase
      .from('user_prop_accounts')
      .select('*')
      .eq('status', 'active');

    if (accountsError) {
      throw accountsError;
    }

    if (!accounts || accounts.length === 0) {
      console.log('[DAILY-RESET] No active accounts to reset');
      return new Response(JSON.stringify({ message: 'No active accounts', processed: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[DAILY-RESET] Processing ${accounts.length} accounts`);

    let processed = 0;
    let dailyStatsCreated = 0;
    let scalingUpdates = 0;

    for (const account of accounts) {
      try {
        // 1. Close out yesterday's daily stats
        const { data: yesterdayStats } = await supabase
          .from('user_daily_stats')
          .select('*')
          .eq('account_id', account.id)
          .eq('date', yesterday)
          .maybeSingle();

        if (yesterdayStats) {
          // Update ending values
          const totalProfit = account.current_profit || 0;
          const contributedPct = totalProfit > 0 ? (yesterdayStats.daily_pnl / totalProfit) * 100 : 0;

          await supabase
            .from('user_daily_stats')
            .update({
              ending_equity: account.current_equity,
              is_profitable: yesterdayStats.daily_pnl > 0,
              contributed_pct_of_total: contributedPct,
              is_trading_day: yesterdayStats.trades_taken > 0
            })
            .eq('id', yesterdayStats.id);

          // Update days traded on account if trades were taken
          if (yesterdayStats.trades_taken > 0) {
            await supabase
              .from('user_prop_accounts')
              .update({ days_traded: (account.days_traded || 0) + 1 })
              .eq('id', account.id);
          }
        }

        // 2. Create today's daily stats record
        const { error: insertError } = await supabase
          .from('user_daily_stats')
          .upsert({
            user_id: account.user_id,
            account_id: account.id,
            date: today,
            starting_equity: account.current_equity,
            highest_equity: account.current_equity,
            lowest_equity: account.current_equity,
            daily_pnl: 0,
            daily_pnl_pct: 0,
            trades_taken: 0,
            trades_won: 0,
            trades_lost: 0,
            trades_breakeven: 0,
            max_daily_dd_reached_pct: 0
          }, {
            onConflict: 'user_id,account_id,date'
          });

        if (!insertError) {
          dailyStatsCreated++;
        }

        // 3. Reset daily drawdown on the account
        await supabase
          .from('user_prop_accounts')
          .update({
            daily_starting_equity: account.current_equity,
            daily_pnl: 0,
            daily_drawdown_used_pct: 0
          })
          .eq('id', account.id);

        // 4. Update scaling plan (weekly)
        const dayOfWeek = new Date().getDay();
        if (dayOfWeek === 1) { // Monday
          const currentWeek = account.scaling_week || 1;
          const newWeek = currentWeek + 1;
          
          // Increase risk multiplier gradually
          let newMultiplier = account.current_risk_multiplier || 0.5;
          if (newWeek === 2) newMultiplier = 0.75;
          else if (newWeek >= 3) newMultiplier = 1.0;

          await supabase
            .from('user_prop_accounts')
            .update({
              scaling_week: newWeek,
              current_risk_multiplier: Math.min(newMultiplier, 1.0)
            })
            .eq('id', account.id);

          scalingUpdates++;
        }

        processed++;
      } catch (accountError) {
        console.error(`[DAILY-RESET] Error processing account ${account.id}:`, accountError);
      }
    }

    // 5. Clean up old validation logs (older than 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    await supabase
      .from('risk_validation_log')
      .delete()
      .lt('created_at', thirtyDaysAgo);

    // 6. Clean up old drawdown alerts (older than 90 days)
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    await supabase
      .from('drawdown_alerts')
      .delete()
      .lt('created_at', ninetyDaysAgo);

    const result = {
      processed,
      dailyStatsCreated,
      scalingUpdates,
      date: today
    };

    console.log('[DAILY-RESET] Complete:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[DAILY-RESET] Error:', error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
