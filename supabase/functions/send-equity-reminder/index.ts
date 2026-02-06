import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
    const today = new Date().toISOString().split('T')[0];

    console.log('Running equity reminder for date:', today);

    // Get all active prop accounts that haven't confirmed equity today
    const { data: accounts, error: accountsError } = await supabase
      .from('user_prop_accounts')
      .select(`
        id,
        user_id,
        account_name,
        prop_firm,
        current_equity
      `)
      .eq('status', 'active');

    if (accountsError) throw accountsError;

    if (!accounts || accounts.length === 0) {
      console.log('No active accounts found');
      return new Response(
        JSON.stringify({ success: true, message: 'No active accounts' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check which accounts already have confirmations today
    const accountIds = accounts.map(a => a.id);
    const { data: confirmations } = await supabase
      .from('daily_equity_confirmations')
      .select('account_id')
      .in('account_id', accountIds)
      .eq('date', today);

    const confirmedAccountIds = new Set(confirmations?.map(c => c.account_id) || []);
    
    // Filter to accounts without confirmations today
    const needsReminder = accounts.filter(a => !confirmedAccountIds.has(a.id));

    console.log(`Found ${needsReminder.length} accounts needing equity reminder`);

    let pushNotificationsSent = 0;
    let notificationsSent = 0;

    for (const account of needsReminder) {
      // Create in-app notification
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: account.user_id,
          title: '📊 Daily Equity Update',
          message: `Time to update your ${account.prop_firm} account equity. This helps track your drawdown accurately.`,
          type: 'equity_reminder',
          priority: 'medium',
          action_url: '/dashboard?tab=rules',
          metadata: { account_id: account.id, account_name: account.account_name }
        });

      if (!notifError) notificationsSent++;

      // Get user's push subscriptions
      const { data: subscriptions } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', account.user_id);

      if (subscriptions && subscriptions.length > 0) {
        // Send push notification via send-web-push
        try {
          const pushResponse = await fetch(`${supabaseUrl}/functions/v1/send-web-push`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
              userId: account.user_id,
              title: '📊 Update Your Equity',
              body: `Update your ${account.prop_firm} account to track drawdown`,
              icon: '/favicon.png',
              tag: 'equity-reminder',
              data: { url: '/dashboard?tab=rules' }
            }),
          });

          if (pushResponse.ok) {
            pushNotificationsSent++;
          }
        } catch (pushError) {
          console.error(`Error sending push to user ${account.user_id}:`, pushError);
        }
      }
    }

    console.log(`Equity reminders sent: ${notificationsSent} in-app, ${pushNotificationsSent} push`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        accountsChecked: accounts.length,
        remindersNeeded: needsReminder.length,
        notificationsSent,
        pushNotificationsSent
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-equity-reminder:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
