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

    console.log('Running inactivity monitor...');

    // Fetch all active prop accounts with inactivity rules
    const { data: accounts, error: accountsError } = await supabase
      .from('user_prop_accounts')
      .select(`
        id,
        user_id,
        account_name,
        prop_firm,
        status,
        last_trade_at,
        last_inactivity_warning_at,
        inactivity_deadline_at,
        prop_firm_rules!inner(
          inactivity_rule_days,
          prop_firm_name
        )
      `)
      .in('status', ['active', 'evaluation', 'funded'])
      .not('inactivity_deadline_at', 'is', null);

    if (accountsError) throw accountsError;

    console.log(`Checking ${accounts?.length || 0} accounts for inactivity`);

    const now = new Date();
    const alertsSent: string[] = [];
    const warnings: any[] = [];

    for (const account of accounts || []) {
      const deadline = new Date(account.inactivity_deadline_at);
      const daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const lastWarning = account.last_inactivity_warning_at 
        ? new Date(account.last_inactivity_warning_at) 
        : null;

      // Check if we've already warned today
      const alreadyWarnedToday = lastWarning && 
        lastWarning.toDateString() === now.toDateString();

      // Warning thresholds: 7 days, 3 days, 1 day
      const shouldWarn = !alreadyWarnedToday && (
        daysUntilDeadline <= 1 ||
        daysUntilDeadline <= 3 ||
        daysUntilDeadline <= 7
      );

      if (shouldWarn && daysUntilDeadline > 0) {
        // Get user email
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name')
          .eq('user_id', account.user_id)
          .single();

        const { data: authUser } = await supabase.auth.admin.getUserById(account.user_id);
        const userEmail = authUser?.user?.email;

        if (userEmail) {
          // Send push notification
          await supabase.functions.invoke('send-web-push', {
            body: {
              userId: account.user_id,
              title: `⚠️ Inactivity Warning: ${account.account_name}`,
              body: `Your ${account.prop_firm} account will be flagged for inactivity in ${daysUntilDeadline} day(s). Place a trade to reset the timer.`,
              tag: `inactivity-${account.id}`,
              data: {
                type: 'inactivity_warning',
                accountId: account.id,
                daysRemaining: daysUntilDeadline
              }
            }
          });

          // Create in-app notification
          await supabase
            .from('notifications')
            .insert({
              user_id: account.user_id,
              title: `Inactivity Warning: ${account.account_name}`,
              message: `Your ${account.prop_firm} account will be flagged for inactivity in ${daysUntilDeadline} day(s). Place a trade to avoid losing your account.`,
              type: 'warning',
              read: false,
              metadata: {
                account_id: account.id,
                days_remaining: daysUntilDeadline,
                deadline: account.inactivity_deadline_at
              }
            });

          // Update last warning timestamp
          await supabase
            .from('user_prop_accounts')
            .update({
              last_inactivity_warning_at: now.toISOString()
            })
            .eq('id', account.id);

          alertsSent.push(account.id);
          warnings.push({
            accountId: account.id,
            accountName: account.account_name,
            propFirm: account.prop_firm,
            daysUntilDeadline,
            userId: account.user_id
          });
        }
      }

      // Check if account has breached inactivity rule
      if (daysUntilDeadline <= 0) {
        // Mark account as failed due to inactivity
        await supabase
          .from('user_prop_accounts')
          .update({
            status: 'failed',
            failure_reason: 'Inactivity breach - no trades within required period'
          })
          .eq('id', account.id);

        // Create alert record
        await supabase
          .from('drawdown_alerts')
          .insert({
            user_id: account.user_id,
            account_id: account.id,
            alert_type: 'inactivity_breach',
            threshold_pct: 100,
            current_dd_pct: 100,
            equity_at_alert: 0,
            signals_paused: true
          });

        console.log(`Account ${account.id} failed due to inactivity breach`);
      }
    }

    console.log(`Inactivity check complete. Sent ${alertsSent.length} warnings.`);

    return new Response(JSON.stringify({ 
      success: true,
      accountsChecked: accounts?.length || 0,
      warningsSent: alertsSent.length,
      warnings
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in inactivity monitor:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
