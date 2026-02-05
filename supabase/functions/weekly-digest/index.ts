import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Generating weekly digest emails...");

    // Get dashboard data
    const { data: dashboards } = await supabase.from('dashboard_data').select('*');
    if (!dashboards?.length) {
      return new Response(JSON.stringify({ success: true, sent: 0 }), { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    // Get profiles
    const userIds = dashboards.map(d => d.user_id);
    const { data: profiles } = await supabase.from('profiles').select('user_id, first_name, email_preferences').in('user_id', userIds);
    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

    // Get auth users
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const emailMap = new Map(users?.map(u => [u.id, u.email]) || []);

    let sentCount = 0;

    for (const dashboard of dashboards) {
      const profile = profileMap.get(dashboard.user_id);
      const email = emailMap.get(dashboard.user_id);
      if (!email) continue;

      const prefs = profile?.email_preferences as any;
      if (prefs?.weekly_summary === false) continue;

      const userName = profile?.first_name || 'Trader';
      const pnl = dashboard.total_pnl || 0;
      const winRate = dashboard.win_rate || 0;
      const trades = dashboard.total_trades || 0;

      try {
        await resend.emails.send({
          from: "TraderEdge Pro <digest@traderedgepro.com>",
          to: [email],
          subject: `📅 Weekly Trading Digest - ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #0a0a0a; color: #fff;">
              <h1 style="text-align: center;">📅 Weekly Digest</h1>
              <p style="text-align: center; color: #9ca3af;">Hey ${userName}, here's your week in review</p>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 24px 0;">
                <div style="background: #111; padding: 16px; border-radius: 8px; text-align: center;">
                  <p style="color: #6b7280; font-size: 12px; margin: 0;">Total P&L</p>
                  <p style="color: ${pnl >= 0 ? '#10b981' : '#ef4444'}; font-size: 20px; font-weight: bold; margin: 8px 0 0 0;">
                    ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}
                  </p>
                </div>
                <div style="background: #111; padding: 16px; border-radius: 8px; text-align: center;">
                  <p style="color: #6b7280; font-size: 12px; margin: 0;">Win Rate</p>
                  <p style="color: #3b82f6; font-size: 20px; font-weight: bold; margin: 8px 0 0 0;">${winRate.toFixed(0)}%</p>
                </div>
              </div>
              <p style="color: #6b7280; font-size: 12px; text-align: center;">
                Total Trades: ${trades} | Keep trading smart!
              </p>
            </div>
          `,
        });
        sentCount++;
        console.log(`Sent digest to ${email}`);
      } catch (e) {
        console.error(`Failed: ${email}`, e);
      }
    }

    return new Response(JSON.stringify({ success: true, sent: sentCount }), { 
      status: 200, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});
