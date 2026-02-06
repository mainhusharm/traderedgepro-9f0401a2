import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PropAccount {
  id: string;
  user_id: string;
  prop_firm_name: string;
  account_label: string;
  current_equity: number;
  starting_balance: number;
  highest_equity: number;
  daily_starting_equity: number;
  daily_dd_limit_pct: number;
  max_dd_limit_pct: number;
  is_trailing_dd: boolean;
  trailing_dd_floor: number;
  daily_drawdown_used_pct: number;
  max_drawdown_used_pct: number;
  realized_pnl: number;
  status: string;
  recovery_mode_active: boolean;
  recovery_mode_started_at: string | null;
  consecutive_winning_days: number;
}

// Thresholds for alerts
const ALERT_THRESHOLDS = [50, 70, 90];
const RECOVERY_MODE_THRESHOLD = 70; // Activate at 70% DD used
const RECOVERY_MODE_EXIT_WINNING_DAYS = 3; // Exit after 3 consecutive winning days

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('[DD-MONITOR] Starting drawdown monitoring cycle...');

    // Fetch all active prop accounts
    const { data: accounts, error: accountsError } = await supabase
      .from('user_prop_accounts')
      .select('*')
      .eq('status', 'active');

    if (accountsError) {
      throw accountsError;
    }

    if (!accounts || accounts.length === 0) {
      console.log('[DD-MONITOR] No active accounts to monitor');
      return new Response(JSON.stringify({ message: 'No active accounts', processed: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[DD-MONITOR] Monitoring ${accounts.length} active accounts`);

    const results = {
      processed: 0,
      alertsSent: 0,
      accountsFailed: 0,
      accountsAtRisk: 0,
      recoveryModeActivated: 0,
      recoveryModeExited: 0
    };

    for (const account of accounts as PropAccount[]) {
      try {
        // Fetch open trades for this account to calculate unrealized P&L
        const { data: openTrades } = await supabase
          .from('user_trade_allocations')
          .select('unrealized_pnl')
          .eq('account_id', account.id)
          .in('status', ['active', 'partial']);

        const totalUnrealizedPnL = openTrades?.reduce((sum, t) => sum + (t.unrealized_pnl || 0), 0) || 0;
        const currentEquity = account.starting_balance + (account.realized_pnl || 0) + totalUnrealizedPnL;

        // Calculate daily drawdown
        const dailyStartEquity = account.daily_starting_equity || account.current_equity;
        const dailyDD = dailyStartEquity > 0 
          ? ((dailyStartEquity - currentEquity) / dailyStartEquity) * 100 
          : 0;
        const dailyDDPct = Math.max(0, dailyDD);
        const dailyDDUsedPct = (dailyDDPct / account.daily_dd_limit_pct) * 100;

        // Calculate max drawdown
        let maxDDPct: number;
        if (account.is_trailing_dd) {
          // Trailing DD: measure from highest equity
          const highestEquity = Math.max(account.highest_equity, currentEquity);
          maxDDPct = highestEquity > 0 
            ? ((highestEquity - currentEquity) / account.starting_balance) * 100 
            : 0;
        } else {
          // Static DD: measure from starting balance
          maxDDPct = account.starting_balance > 0 
            ? ((account.starting_balance - currentEquity) / account.starting_balance) * 100 
            : 0;
        }
        maxDDPct = Math.max(0, maxDDPct);
        const maxDDUsedPct = (maxDDPct / account.max_dd_limit_pct) * 100;

        console.log(`[DD-MONITOR] Account ${account.id}: Daily DD ${dailyDDPct.toFixed(2)}% (${dailyDDUsedPct.toFixed(0)}% of limit), Max DD ${maxDDPct.toFixed(2)}% (${maxDDUsedPct.toFixed(0)}% of limit)`);

        // Update account with latest equity and drawdown
        const updates: any = {
          current_equity: currentEquity,
          unrealized_pnl: totalUnrealizedPnL,
          daily_drawdown_used_pct: dailyDDPct,
          max_drawdown_used_pct: maxDDPct
        };

        // Update highest equity if new high (for trailing DD)
        if (currentEquity > account.highest_equity) {
          updates.highest_equity = currentEquity;
          if (account.is_trailing_dd) {
            updates.trailing_dd_floor = currentEquity * (1 - account.max_dd_limit_pct / 100);
          }
        }

        // ===== RECOVERY MODE LOGIC =====
        const maxDDUsedForRecovery = Math.max(dailyDDUsedPct, maxDDUsedPct);
        
        // Check if we should activate recovery mode
        if (!account.recovery_mode_active && maxDDUsedForRecovery >= RECOVERY_MODE_THRESHOLD) {
          updates.recovery_mode_active = true;
          updates.recovery_mode_started_at = new Date().toISOString();
          updates.consecutive_winning_days = 0;
          results.recoveryModeActivated++;
          
          console.log(`[DD-MONITOR] Account ${account.id}: RECOVERY MODE ACTIVATED at ${maxDDUsedForRecovery.toFixed(1)}% DD usage`);
          
          // Send recovery mode notification
          try {
            await supabase.functions.invoke('send-web-push', {
              body: {
                user_id: account.user_id,
                title: '🛡️ Recovery Mode Activated',
                body: `Your ${account.account_label || account.prop_firm_name} account is at ${maxDDUsedForRecovery.toFixed(0)}% drawdown. Risk reduced to 0.5% per trade to protect your account.`,
                url: '/dashboard?tab=prop-firm-rules'
              }
            });
          } catch (e) {
            console.log('[DD-MONITOR] Could not send recovery mode notification:', e);
          }
          
          // Create in-app notification
          await supabase.from('user_notifications').insert({
            user_id: account.user_id,
            title: 'Recovery Mode Activated',
            message: `Your account has reached ${maxDDUsedForRecovery.toFixed(0)}% of drawdown limit. Trading risk automatically reduced to 0.5% per trade until you have 3 consecutive winning days.`,
            type: 'warning',
            priority: 'high'
          });
        }
        
        // Check if we should exit recovery mode (3 consecutive winning days)
        if (account.recovery_mode_active && (account.consecutive_winning_days || 0) >= RECOVERY_MODE_EXIT_WINNING_DAYS) {
          updates.recovery_mode_active = false;
          updates.recovery_mode_started_at = null;
          results.recoveryModeExited++;
          
          console.log(`[DD-MONITOR] Account ${account.id}: RECOVERY MODE EXITED after ${RECOVERY_MODE_EXIT_WINNING_DAYS} winning days`);
          
          // Send exit notification
          try {
            await supabase.functions.invoke('send-web-push', {
              body: {
                user_id: account.user_id,
                title: '✅ Recovery Mode Complete',
                body: `Congratulations! Your ${account.account_label || account.prop_firm_name} account has exited recovery mode after 3 consecutive winning days. Normal risk levels restored.`,
                url: '/dashboard?tab=prop-firm-rules'
              }
            });
          } catch (e) {
            console.log('[DD-MONITOR] Could not send recovery exit notification:', e);
          }
        }
        // ===== END RECOVERY MODE LOGIC =====

        // Check for breaches
        let accountFailed = false;
        let failureReason = '';

        if (dailyDDPct >= account.daily_dd_limit_pct) {
          accountFailed = true;
          failureReason = `Daily drawdown limit breached: ${dailyDDPct.toFixed(2)}% (limit: ${account.daily_dd_limit_pct}%)`;
        } else if (maxDDPct >= account.max_dd_limit_pct) {
          accountFailed = true;
          failureReason = `Max drawdown limit breached: ${maxDDPct.toFixed(2)}% (limit: ${account.max_dd_limit_pct}%)`;
        }

        if (accountFailed) {
          updates.status = 'failed';
          updates.failure_reason = failureReason;
          updates.recovery_mode_active = false; // Exit recovery mode on failure
          results.accountsFailed++;

          // Send breach alert
          await supabase.from('drawdown_alerts').insert({
            user_id: account.user_id,
            account_id: account.id,
            alert_type: 'breach',
            threshold_pct: 100,
            current_dd_pct: Math.max(dailyDDUsedPct, maxDDUsedPct),
            equity_at_alert: currentEquity,
            signals_paused: true,
            notification_sent: true
          });

          // Send push notification for breach
          try {
            await supabase.functions.invoke('send-web-push', {
              body: {
                user_id: account.user_id,
                title: '⚠️ ACCOUNT FAILED - Drawdown Breach',
                body: failureReason,
                url: '/dashboard?tab=overview'
              }
            });
          } catch (e) {
            console.log('[DD-MONITOR] Could not send push notification:', e);
          }

          results.alertsSent++;
        } else {
          // Check for warning thresholds
          for (const threshold of ALERT_THRESHOLDS) {
            const dailyHitThreshold = dailyDDUsedPct >= threshold;
            const maxHitThreshold = maxDDUsedPct >= threshold;

            if (dailyHitThreshold || maxHitThreshold) {
              // Check if we already sent this alert today
              const today = new Date().toISOString().split('T')[0];
              const alertType = dailyHitThreshold ? `daily_dd_${threshold}` : `max_dd_${threshold}`;
              
              const { data: existingAlert } = await supabase
                .from('drawdown_alerts')
                .select('id')
                .eq('account_id', account.id)
                .eq('alert_type', alertType)
                .gte('created_at', `${today}T00:00:00`)
                .maybeSingle();

              if (!existingAlert) {
                const ddType = dailyHitThreshold ? 'Daily' : 'Max';
                const currentPct = dailyHitThreshold ? dailyDDUsedPct : maxDDUsedPct;
                
                // Insert alert record
                await supabase.from('drawdown_alerts').insert({
                  user_id: account.user_id,
                  account_id: account.id,
                  alert_type: alertType,
                  threshold_pct: threshold,
                  current_dd_pct: currentPct,
                  equity_at_alert: currentEquity,
                  signals_paused: threshold >= 90,
                  notification_sent: true
                });

                // Send push notification
                const urgency = threshold >= 90 ? '🚨 CRITICAL' : threshold >= 70 ? '⚠️ WARNING' : '📊 NOTICE';
                try {
                  await supabase.functions.invoke('send-web-push', {
                    body: {
                      user_id: account.user_id,
                      title: `${urgency}: ${ddType} Drawdown at ${currentPct.toFixed(0)}%`,
                      body: `${account.account_label || account.prop_firm_name} has used ${currentPct.toFixed(1)}% of ${ddType.toLowerCase()} drawdown limit.${threshold >= 90 ? ' Trading paused.' : ''}${threshold >= 70 && !account.recovery_mode_active ? ' Recovery mode activated.' : ''}`,
                      url: '/dashboard?tab=overview'
                    }
                  });
                } catch (e) {
                  console.log('[DD-MONITOR] Could not send push notification:', e);
                }

                results.alertsSent++;
                
                if (threshold >= 90) {
                  results.accountsAtRisk++;
                }
              }
            }
          }
        }

        // Update the account
        await supabase
          .from('user_prop_accounts')
          .update(updates)
          .eq('id', account.id);

        results.processed++;
      } catch (accountError) {
        console.error(`[DD-MONITOR] Error processing account ${account.id}:`, accountError);
      }
    }

    console.log('[DD-MONITOR] Monitoring complete:', results);

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[DD-MONITOR] Error:', error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
