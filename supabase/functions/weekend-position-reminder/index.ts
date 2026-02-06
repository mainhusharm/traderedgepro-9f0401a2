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

    console.log('[WEEKEND-REMINDER] Starting Friday position check...');

    // Check if it's Friday
    const now = new Date();
    const dayOfWeek = now.getUTCDay();
    const hour = now.getUTCHours();

    // Only run on Friday between 3 PM and 4 PM UTC
    if (dayOfWeek !== 5 || hour < 15 || hour >= 16) {
      console.log('[WEEKEND-REMINDER] Not Friday 3-4 PM UTC, skipping');
      return new Response(
        JSON.stringify({ message: 'Not Friday 3-4 PM UTC' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find all accounts with weekend holding NOT allowed
    const { data: restrictedAccounts, error: accountsError } = await supabase
      .from('user_prop_accounts')
      .select('id, user_id, account_name, prop_firm, weekend_holding_allowed')
      .eq('status', 'active')
      .eq('weekend_holding_allowed', false);

    if (accountsError) throw accountsError;

    console.log(`[WEEKEND-REMINDER] Found ${restrictedAccounts?.length || 0} accounts with weekend restriction`);

    let notificationsSent = 0;
    let pushNotificationsSent = 0;

    for (const account of restrictedAccounts || []) {
      // Check for open positions
      const { data: openPositions } = await supabase
        .from('user_trade_allocations')
        .select(`
          id, 
          lot_size,
          entry_price,
          institutional_signals (
            symbol,
            direction
          )
        `)
        .eq('account_id', account.id)
        .in('status', ['active', 'partial']);

      if (!openPositions || openPositions.length === 0) {
        continue; // No open positions, no reminder needed
      }

      // Build position summary
      const positionSummary = openPositions.map((p: any) => {
        const signal = p.institutional_signals;
        return `${signal?.symbol || 'Unknown'} ${signal?.direction || ''} @ ${p.lot_size} lots`;
      }).join(', ');

      const message = `⚠️ Weekend Alert: You have ${openPositions.length} open position(s) on ${account.account_name || account.prop_firm}: ${positionSummary}. Weekend holding is NOT allowed. Market closes in ~2 hours!`;

      // Create in-app notification
      await supabase.from('user_notifications').insert({
        user_id: account.user_id,
        type: 'weekend_reminder',
        title: '⚠️ Close Positions Before Weekend!',
        message,
      });
      notificationsSent++;

      // Send push notification
      const { data: subscriptions } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', account.user_id);

      if (subscriptions && subscriptions.length > 0) {
        try {
          await supabase.functions.invoke('send-web-push', {
            body: {
              user_id: account.user_id,
              title: '⚠️ Close Positions Before Weekend!',
              body: `${openPositions.length} open position(s) on ${account.prop_firm}. Weekend holding NOT allowed!`,
              data: {
                type: 'weekend_reminder',
                account_id: account.id,
                position_count: openPositions.length,
              },
            },
          });
          pushNotificationsSent++;
        } catch (e) {
          console.error('[WEEKEND-REMINDER] Push notification failed:', e);
        }
      }

      console.log(`[WEEKEND-REMINDER] Notified user ${account.user_id} about ${openPositions.length} positions`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        notifications_sent: notificationsSent,
        push_notifications_sent: pushNotificationsSent,
        accounts_checked: restrictedAccounts?.length || 0,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[WEEKEND-REMINDER] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
