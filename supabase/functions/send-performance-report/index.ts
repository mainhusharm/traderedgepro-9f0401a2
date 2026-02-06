import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PerformanceReportRequest {
  reportType: 'weekly' | 'monthly';
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { reportType }: PerformanceReportRequest = await req.json();
    
    console.log(`Generating ${reportType} performance reports...`);

    // Get all users with dashboard data and email preferences
    const { data: dashboards, error: dashboardError } = await supabase
      .from('dashboard_data')
      .select('*');

    if (dashboardError) throw dashboardError;

    // Get user profiles and auth data
    const userIds = dashboards?.map(d => d.user_id) || [];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, first_name, email_preferences')
      .in('user_id', userIds);

    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

    // Get auth users for emails
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
    if (usersError) throw usersError;

    const emailMap = new Map(users?.map(u => [u.id, u.email]) || []);

    let sentCount = 0;
    const errors: string[] = [];

    for (const dashboard of dashboards || []) {
      const profile = profileMap.get(dashboard.user_id);
      const email = emailMap.get(dashboard.user_id);

      if (!email) continue;

      // Check email preferences
      const prefs = profile?.email_preferences as any;
      if (prefs?.performance_reports === false) continue;

      // Calculate milestone progress
      const accountSize = dashboard.account_size || 10000;
      const pnl = dashboard.total_pnl || 0;
      let unlockedMilestones = 1;
      if (pnl >= accountSize * 0.15) unlockedMilestones = 4;
      else if (pnl >= accountSize * 0.10) unlockedMilestones = 3;
      else if (pnl >= accountSize * 0.05) unlockedMilestones = 2;

      const nextMilestoneTarget = unlockedMilestones < 4 
        ? accountSize * (0.05 * (unlockedMilestones + 1))
        : null;
      const progressToNext = nextMilestoneTarget 
        ? Math.min(100, (pnl / nextMilestoneTarget) * 100)
        : 100;

      const periodLabel = reportType === 'weekly' ? 'This Week' : 'This Month';
      const userName = profile?.first_name || 'Trader';

      try {
        await resend.emails.send({
          from: "TraderEdge Pro <reports@traderedgepro.com>",
          to: [email],
          subject: `📊 Your ${reportType === 'weekly' ? 'Weekly' : 'Monthly'} Performance Report`,
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                  <!-- Header -->
                  <div style="text-align: center; margin-bottom: 40px;">
                    <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 8px;">📊 ${periodLabel} Performance</h1>
                    <p style="color: #9ca3af; font-size: 16px; margin: 0;">Hey ${userName}, here's your trading summary</p>
                  </div>

                  <!-- Stats Grid -->
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 32px;">
                    <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; padding: 20px; text-align: center;">
                      <p style="color: #9ca3af; font-size: 12px; margin: 0 0 8px; text-transform: uppercase;">Total P&L</p>
                      <p style="color: ${pnl >= 0 ? '#10b981' : '#ef4444'}; font-size: 24px; font-weight: bold; margin: 0;">
                        ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}
                      </p>
                    </div>
                    <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 12px; padding: 20px; text-align: center;">
                      <p style="color: #9ca3af; font-size: 12px; margin: 0 0 8px; text-transform: uppercase;">Win Rate</p>
                      <p style="color: #3b82f6; font-size: 24px; font-weight: bold; margin: 0;">
                        ${(dashboard.win_rate || 0).toFixed(1)}%
                      </p>
                    </div>
                    <div style="background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 12px; padding: 20px; text-align: center;">
                      <p style="color: #9ca3af; font-size: 12px; margin: 0 0 8px; text-transform: uppercase;">Total Trades</p>
                      <p style="color: #8b5cf6; font-size: 24px; font-weight: bold; margin: 0;">
                        ${dashboard.total_trades || 0}
                      </p>
                    </div>
                    <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 12px; padding: 20px; text-align: center;">
                      <p style="color: #9ca3af; font-size: 12px; margin: 0 0 8px; text-transform: uppercase;">Profit Factor</p>
                      <p style="color: #f59e0b; font-size: 24px; font-weight: bold; margin: 0;">
                        ${(dashboard.profit_factor || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <!-- Milestone Progress -->
                  <div style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1)); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; padding: 24px; margin-bottom: 32px;">
                    <h2 style="color: #ffffff; font-size: 18px; margin: 0 0 16px;">🏔️ Milestone Progress</h2>
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
                      ${[1, 2, 3, 4].map(m => `
                        <div style="width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: bold; ${
                          m <= unlockedMilestones 
                            ? 'background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white;'
                            : 'background: rgba(255, 255, 255, 0.1); color: #6b7280;'
                        }">
                          M${m}
                        </div>
                      `).join('')}
                    </div>
                    ${nextMilestoneTarget ? `
                      <div style="background: rgba(0, 0, 0, 0.3); border-radius: 8px; padding: 12px;">
                        <p style="color: #9ca3af; font-size: 14px; margin: 0 0 8px;">
                          Progress to M${unlockedMilestones + 1}: ${progressToNext.toFixed(0)}%
                        </p>
                        <div style="height: 8px; background: rgba(255, 255, 255, 0.1); border-radius: 4px; overflow: hidden;">
                          <div style="width: ${progressToNext}%; height: 100%; background: linear-gradient(90deg, #3b82f6, #8b5cf6); border-radius: 4px;"></div>
                        </div>
                        <p style="color: #6b7280; font-size: 12px; margin: 8px 0 0;">
                          $${(nextMilestoneTarget - pnl).toFixed(0)} more to unlock
                        </p>
                      </div>
                    ` : `
                      <p style="color: #10b981; font-size: 14px; margin: 0;">🏆 All milestones unlocked!</p>
                    `}
                  </div>

                  <!-- CTA -->
                  <a href="https://traderedge.com/dashboard" style="display: block; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: #ffffff; text-align: center; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 600;">
                    View Full Dashboard →
                  </a>

                  <!-- Footer -->
                  <div style="text-align: center; margin-top: 40px;">
                    <p style="color: #4b5563; font-size: 12px; margin: 0;">
                      Keep trading smart. Keep winning.<br>
                      © 2024 TraderEdge
                    </p>
                  </div>
                </div>
              </body>
            </html>
          `,
        });
        sentCount++;
      } catch (emailError) {
        console.error(`Failed to send to ${email}:`, emailError);
        errors.push(email);
      }
    }

    console.log(`Sent ${sentCount} ${reportType} reports. Errors: ${errors.length}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: sentCount, 
        errors: errors.length 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-performance-report function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
