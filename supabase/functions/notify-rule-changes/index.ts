import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

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

    // Get all unnotified rule changes
    const { data: changes, error: changesError } = await supabase
      .from('prop_firm_rule_changes')
      .select(`
        *,
        prop_firms!prop_firm_rule_changes_prop_firm_id_fkey (
          id,
          name,
          slug
        )
      `)
      .eq('notified', false)
      .order('detected_at', { ascending: false });

    if (changesError) {
      throw changesError;
    }

    if (!changes || changes.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No rule changes to notify' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Group changes by prop firm
    const changesByFirm: Record<string, { firm: any; changes: any[] }> = {};
    for (const change of changes) {
      const firmId = change.prop_firm_id;
      if (!changesByFirm[firmId]) {
        changesByFirm[firmId] = {
          firm: change.prop_firms,
          changes: []
        };
      }
      changesByFirm[firmId].changes.push(change);
    }

    // Get all users who have selected these prop firms
    const firmIds = Object.keys(changesByFirm);
    const firmNames = Object.values(changesByFirm).map(f => f.firm?.name).filter(Boolean);

    // Get users with these prop firms selected in their questionnaire
    const { data: users, error: usersError } = await supabase
      .from('questionnaires')
      .select(`
        user_id,
        prop_firm,
        profiles!inner (
          first_name,
          email_preferences
        )
      `)
      .in('prop_firm', firmNames);

    if (usersError) {
      console.error('Error fetching users:', usersError);
    }

    // Get user emails from auth
    const notifiedUsers: string[] = [];
    const emailsSent: string[] = [];

    if (users && users.length > 0) {
      for (const user of users) {
        // profiles comes as array from join, get first element
        const profile = Array.isArray(user.profiles) ? user.profiles[0] : user.profiles;
        
        // Check if user wants email notifications
        const emailPrefs = profile?.email_preferences as any;
        if (emailPrefs?.rule_changes === false) {
          continue; // User has opted out
        }

        // Get user email from auth
        const { data: authUser } = await supabase.auth.admin.getUserById(user.user_id);
        
        if (!authUser?.user?.email) continue;

        const userFirmChanges = changesByFirm[Object.keys(changesByFirm).find(id => 
          changesByFirm[id].firm?.name === user.prop_firm
        ) || ''];

        if (!userFirmChanges) continue;

        const firstName = profile?.first_name || 'Trader';
        const firmName = userFirmChanges.firm?.name || user.prop_firm;

        // Build email content
        const changesHtml = userFirmChanges.changes.map(c => `
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">${c.account_type}</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">${formatFieldName(c.field_name)}</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; color: #dc2626; text-decoration: line-through;">${c.old_value || 'N/A'}</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; color: #16a34a; font-weight: bold;">${c.new_value || 'N/A'}</td>
          </tr>
        `).join('');

        try {
          const emailRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${RESEND_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: "TraderEdge Pro <alerts@traderedgepro.com>",
              to: [authUser.user.email],
              subject: `⚠️ ${firmName} Trading Rules Have Changed`,
              html: `
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
                  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; text-align: center;">
                      <h1 style="color: #f59e0b; margin: 0; font-size: 24px;">⚠️ Rule Change Alert</h1>
                      <p style="color: #94a3b8; margin: 10px 0 0 0; font-size: 16px;">${firmName}</p>
                    </div>
                    <div style="padding: 30px;">
                      <p style="color: #374151; font-size: 16px; line-height: 1.6;">Hi ${firstName},</p>
                      <p style="color: #374151; font-size: 16px; line-height: 1.6;">We detected changes to the trading rules at <strong>${firmName}</strong>. Please review these changes to ensure your trading strategy remains compliant.</p>
                      <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
                        <p style="color: #92400e; margin: 0; font-weight: 500;">⚠️ Important: These rule changes may affect your daily loss limits, drawdown thresholds, or profit targets.</p>
                      </div>
                      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                        <thead>
                          <tr style="background: #f3f4f6;">
                            <th style="padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #6b7280;">Account Type</th>
                            <th style="padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #6b7280;">Rule</th>
                            <th style="padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #6b7280;">Old Value</th>
                            <th style="padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #6b7280;">New Value</th>
                          </tr>
                        </thead>
                        <tbody>${changesHtml}</tbody>
                      </table>
                      <div style="text-align: center; margin-top: 30px;">
                        <a href="${Deno.env.get('SITE_URL') || 'https://your-site.com'}/dashboard?tab=rules" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600;">View Full Rules</a>
                      </div>
                      <p style="color: #6b7280; font-size: 14px; margin-top: 30px; text-align: center;">Stay disciplined and trade safely! 📈</p>
                    </div>
                    <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                      <p style="color: #9ca3af; font-size: 12px; margin: 0;">You're receiving this because you selected ${firmName} as your prop firm.<br><a href="${Deno.env.get('SITE_URL') || 'https://your-site.com'}/dashboard?tab=settings" style="color: #6b7280;">Manage notification preferences</a></p>
                    </div>
                  </div>
                </body>
                </html>
              `,
            }),
          });

          emailsSent.push(authUser.user.email);
          notifiedUsers.push(user.user_id);
          // Also send push notification
          try {
            await fetch(`${supabaseUrl}/functions/v1/send-web-push`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseServiceKey}`,
              },
              body: JSON.stringify({
                userId: user.user_id,
                title: `⚠️ ${firmName} Rules Changed`,
                body: `${userFirmChanges.changes.length} trading rule(s) have been updated. Review before trading.`,
                icon: '/favicon.png',
                tag: 'rule-change',
                data: { url: '/dashboard?tab=rules' }
              }),
            });
          } catch (pushError) {
            console.error('Error sending push:', pushError);
          }
        } catch (emailError) {
          console.error(`Error sending email to ${authUser.user.email}:`, emailError);
        }
      }
    }

    // Mark changes as notified
    const changeIds = changes.map(c => c.id);
    await supabase
      .from('prop_firm_rule_changes')
      .update({ notified: true })
      .in('id', changeIds);

    return new Response(
      JSON.stringify({ 
        success: true, 
        changesProcessed: changes.length,
        emailsSent: emailsSent.length,
        notifiedUsers: notifiedUsers.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in notify-rule-changes:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function formatFieldName(field: string): string {
  return field
    .replace(/_/g, ' ')
    .replace(/percent/g, '%')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
