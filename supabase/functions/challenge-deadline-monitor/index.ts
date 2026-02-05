import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ChallengeAccount {
  id: string;
  user_id: string;
  prop_firm: string;
  account_name: string;
  account_type: string;
  starting_balance: number;
  current_equity: number;
  profit_target: number;
  challenge_deadline: string;
  days_traded: number;
  min_trading_days: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase credentials not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Running challenge deadline monitor');

    // Get all active challenge accounts with deadlines
    const { data: accounts, error: accountsError } = await supabase
      .from('user_prop_accounts')
      .select('*')
      .eq('status', 'active')
      .not('challenge_deadline', 'is', null)
      .in('account_type', ['Challenge Phase 1', 'Challenge Phase 2', 'Evaluation', '1-Step', '2-Step Phase 1', '2-Step Phase 2']);

    if (accountsError) throw accountsError;

    if (!accounts || accounts.length === 0) {
      console.log('No active challenge accounts with deadlines found');
      return new Response(
        JSON.stringify({ success: true, message: 'No challenge accounts to monitor' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const now = new Date();
    const alerts: { type: string; account: ChallengeAccount; daysRemaining: number; requiredDaily: number }[] = [];

    for (const account of accounts as ChallengeAccount[]) {
      const deadline = new Date(account.challenge_deadline);
      const msRemaining = deadline.getTime() - now.getTime();
      const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));

      if (daysRemaining <= 0 || daysRemaining > 7) continue; // Only alert for 1-7 days

      // Calculate profit progress
      const currentProfit = account.current_equity - account.starting_balance;
      const profitNeeded = account.profit_target - currentProfit;
      const requiredDaily = daysRemaining > 0 ? profitNeeded / daysRemaining : profitNeeded;

      // Determine alert type based on days remaining
      let alertType = '';
      if (daysRemaining === 7) alertType = '7_day_warning';
      else if (daysRemaining === 3) alertType = '3_day_warning';
      else if (daysRemaining === 1) alertType = '1_day_warning';
      else continue; // Only send for 7, 3, 1 day marks

      alerts.push({ type: alertType, account, daysRemaining, requiredDaily });
    }

    console.log(`Found ${alerts.length} challenge deadline alerts to send`);

    let notificationsSent = 0;
    let pushNotificationsSent = 0;

    for (const alert of alerts) {
      const { account, daysRemaining, requiredDaily } = alert;
      const profitProgress = ((account.current_equity - account.starting_balance) / account.profit_target * 100).toFixed(1);
      
      // Determine urgency message
      const urgencyEmoji = daysRemaining === 1 ? '🚨' : daysRemaining === 3 ? '⚠️' : '📅';
      const urgencyText = daysRemaining === 1 ? 'FINAL DAY' : 
                          daysRemaining === 3 ? 'Only 3 Days Left' : 
                          '7 Days Remaining';

      // Create in-app notification
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: account.user_id,
          title: `${urgencyEmoji} Challenge Deadline: ${urgencyText}`,
          message: `${account.prop_firm} ${account.account_name}: ${profitProgress}% to target. Need $${requiredDaily.toFixed(0)}/day to pass.`,
          type: 'challenge_deadline',
          priority: daysRemaining === 1 ? 'urgent' : 'high',
          action_url: '/dashboard?tab=rules',
          metadata: { 
            account_id: account.id, 
            days_remaining: daysRemaining,
            required_daily: requiredDaily,
            profit_progress: profitProgress
          }
        });

      if (!notifError) notificationsSent++;

      // Send push notification
      try {
        const pushResponse = await fetch(`${supabaseUrl}/functions/v1/send-web-push`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            userId: account.user_id,
            title: `${urgencyEmoji} ${urgencyText}!`,
            body: `${account.prop_firm}: Need $${requiredDaily.toFixed(0)}/day to pass. Currently ${profitProgress}% to target.`,
            icon: '/favicon.png',
            tag: `challenge-deadline-${account.id}`,
            data: { url: '/dashboard?tab=rules' }
          }),
        });

        if (pushResponse.ok) {
          pushNotificationsSent++;
        }
      } catch (pushError) {
        console.error(`Error sending push:`, pushError);
      }

      // Log the psychology event for tracking
      await supabase.from('trading_psychology_logs').insert({
        user_id: account.user_id,
        account_id: account.id,
        event_type: 'deadline_warning',
        trigger_reason: `${daysRemaining} days remaining`,
        metadata: { 
          days_remaining: daysRemaining, 
          required_daily: requiredDaily,
          profit_progress: parseFloat(profitProgress)
        }
      });
    }

    console.log(`Deadline alerts sent: ${notificationsSent} in-app, ${pushNotificationsSent} push`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        accountsChecked: accounts.length,
        alertsSent: alerts.length,
        notificationsSent,
        pushNotificationsSent
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in challenge-deadline-monitor:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
