import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const ADMIN_EMAIL = 'anchalw11@gmail.com';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ActivityNotification {
  id: string;
  activity_type: string;
  portal: string;
  user_email: string;
  user_name: string;
  plan_name?: string;
  amount?: number;
  coupon_code?: string;
  is_trial?: boolean;
  details?: Record<string, unknown>;
  created_at: string;
}

const getActivityLabel = (type: string): string => {
  const labels: Record<string, string> = {
    'signup': '🎉 New User Signup (Main Website)',
    'purchase': '💰 New Purchase (Main Website)',
    'trial_activation': '🎁 Trial Activated (Main Website)',
    'mt5_signup': '🤖 New MT5 User Signup',
    'mt5_trial': '🎁 MT5 Trial Activated',
    'mt5_purchase': '💰 MT5 Bot Purchase',
  };
  return labels[type] || type;
};

const getPortalLabel = (portal: string): string => {
  return portal === 'mt5' ? 'MT5 Bot Portal' : 'Main Website';
};

const sendEmail = async (to: string, subject: string, html: string) => {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'TradingNexus <notifications@resend.dev>',
      to: [to],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to send email: ${error}`);
  }

  return response.json();
};

const buildEmailHtml = (activity: ActivityNotification): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 30px; }
        .info-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #eee; }
        .info-label { color: #666; font-weight: 500; }
        .info-value { color: #333; font-weight: 600; }
        .coupon-badge { background: #10b981; color: white; padding: 4px 12px; border-radius: 20px; font-size: 14px; display: inline-block; }
        .trial-badge { background: #f59e0b; color: white; padding: 4px 12px; border-radius: 20px; font-size: 14px; display: inline-block; }
        .amount { color: #10b981; font-size: 24px; font-weight: bold; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${getActivityLabel(activity.activity_type)}</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">${getPortalLabel(activity.portal)}</p>
        </div>
        <div class="content">
          <div class="info-row">
            <span class="info-label">User Name</span>
            <span class="info-value">${activity.user_name || 'N/A'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Email</span>
            <span class="info-value">${activity.user_email}</span>
          </div>
          ${activity.plan_name ? `
          <div class="info-row">
            <span class="info-label">Plan</span>
            <span class="info-value">${activity.plan_name}</span>
          </div>
          ` : ''}
          ${activity.amount ? `
          <div class="info-row">
            <span class="info-label">Amount</span>
            <span class="amount">$${Number(activity.amount).toFixed(2)}</span>
          </div>
          ` : ''}
          ${activity.coupon_code ? `
          <div class="info-row">
            <span class="info-label">Coupon Code</span>
            <span class="${activity.is_trial ? 'trial-badge' : 'coupon-badge'}">${activity.coupon_code}</span>
          </div>
          ` : ''}
          ${activity.is_trial ? `
          <div class="info-row">
            <span class="info-label">Type</span>
            <span class="trial-badge">Free Trial</span>
          </div>
          ` : ''}
          <div class="info-row">
            <span class="info-label">Time</span>
            <span class="info-value">${new Date(activity.created_at).toLocaleString()}</span>
          </div>
        </div>
        <div class="footer">
          <p>This is an automated notification from your TradingNexus platform.</p>
          <p>View all activity in your Admin Dashboard → User Activity tab</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, notification } = await req.json();

    if (action === 'send_alert') {
      const activity = notification as ActivityNotification;
      const emailHtml = buildEmailHtml(activity);

      await sendEmail(
        ADMIN_EMAIL,
        `${getActivityLabel(activity.activity_type)} - ${activity.user_email}`,
        emailHtml
      );

      // Mark notification as email sent
      await supabase
        .from('user_activity_notifications')
        .update({ email_sent: true, email_sent_at: new Date().toISOString() })
        .eq('id', activity.id);

      console.log('Alert email sent successfully to', ADMIN_EMAIL);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'process_pending') {
      // Process any pending notifications that haven't been emailed
      const { data: pendingNotifications } = await supabase
        .from('user_activity_notifications')
        .select('*')
        .eq('email_sent', false)
        .order('created_at', { ascending: true })
        .limit(10);

      if (!pendingNotifications || pendingNotifications.length === 0) {
        return new Response(JSON.stringify({ success: true, processed: 0 }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      let processed = 0;
      for (const notif of pendingNotifications) {
        try {
          const activity = notif as ActivityNotification;
          const emailHtml = buildEmailHtml(activity);

          await sendEmail(
            ADMIN_EMAIL,
            `${getActivityLabel(activity.activity_type)} - ${activity.user_email}`,
            emailHtml
          );

          await supabase
            .from('user_activity_notifications')
            .update({ email_sent: true, email_sent_at: new Date().toISOString() })
            .eq('id', notif.id);

          processed++;
        } catch (err) {
          console.error('Failed to process notification:', notif.id, err);
        }
      }

      return new Response(JSON.stringify({ success: true, processed }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Activity alert error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
