import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface PerformanceDigestRequest {
  userId?: string;
  period: 'daily' | 'weekly';
  email?: string;
}

interface PerformanceStats {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  totalPnl: number;
  winRate: number;
  bestTrade: number;
  worstTrade: number;
  avgWin: number;
  avgLoss: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { userId, period, email }: PerformanceDigestRequest = await req.json();

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    
    if (period === 'daily') {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 1);
    } else {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
    }

    // If userId provided, send to single user; otherwise send to all users with preference
    let usersToNotify: { user_id: string; email: string; first_name: string | null }[] = [];

    if (userId && email) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name')
        .eq('user_id', userId)
        .single();
      
      usersToNotify = [{ user_id: userId, email, first_name: profile?.first_name || null }];
    } else {
      // Get all users with email preferences enabled for performance reports
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, first_name, email_preferences')
        .not('email_preferences', 'is', null);

      if (profiles) {
        for (const profile of profiles) {
          const prefs = profile.email_preferences as Record<string, boolean> | null;
          const wantsDigest = period === 'weekly' 
            ? prefs?.weekly_digest !== false 
            : prefs?.performance_alerts !== false;

          if (wantsDigest) {
            // Get user email from auth
            const { data: authUser } = await supabase.auth.admin.getUserById(profile.user_id);
            if (authUser?.user?.email) {
              usersToNotify.push({
                user_id: profile.user_id,
                email: authUser.user.email,
                first_name: profile.first_name,
              });
            }
          }
        }
      }
    }

    console.log(`Sending ${period} digest to ${usersToNotify.length} users`);

    const results = [];

    for (const user of usersToNotify) {
      try {
        // Fetch user's signals for the period
        const { data: signals } = await supabase
          .from('signals')
          .select('*')
          .eq('user_id', user.user_id)
          .eq('taken_by_user', true)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', now.toISOString());

        // Fetch dashboard data
        const { data: dashboard } = await supabase
          .from('dashboard_data')
          .select('*')
          .eq('user_id', user.user_id)
          .single();

        // Calculate period stats
        const periodSignals = signals || [];
        const wins = periodSignals.filter(s => s.outcome === 'target_hit');
        const losses = periodSignals.filter(s => s.outcome === 'stop_loss_hit');
        const pnls = periodSignals.map(s => s.pnl || 0);

        const stats: PerformanceStats = {
          totalTrades: periodSignals.length,
          winningTrades: wins.length,
          losingTrades: losses.length,
          totalPnl: pnls.reduce((a, b) => a + b, 0),
          winRate: periodSignals.length > 0 ? (wins.length / periodSignals.length) * 100 : 0,
          bestTrade: pnls.length > 0 ? Math.max(...pnls) : 0,
          worstTrade: pnls.length > 0 ? Math.min(...pnls) : 0,
          avgWin: wins.length > 0 ? wins.reduce((a, s) => a + (s.pnl || 0), 0) / wins.length : 0,
          avgLoss: losses.length > 0 ? Math.abs(losses.reduce((a, s) => a + (s.pnl || 0), 0) / losses.length) : 0,
        };

        const periodLabel = period === 'daily' ? 'Daily' : 'Weekly';
        const userName = user.first_name || 'Trader';

        // Generate email HTML
        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${periodLabel} Performance Digest</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="padding: 40px; text-align: center; background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(6, 182, 212, 0.1));">
              <h1 style="color: #ffffff; margin: 0 0 10px 0; font-size: 28px;">📊 ${periodLabel} Performance Digest</h1>
              <p style="color: #a0aec0; margin: 0; font-size: 14px;">Hello ${userName}, here's your trading summary</p>
            </td>
          </tr>
          
          <!-- Main Stats -->
          <tr>
            <td style="padding: 30px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="50%" style="padding: 10px;">
                    <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; text-align: center;">
                      <p style="color: #a0aec0; margin: 0 0 5px 0; font-size: 12px;">Total Trades</p>
                      <p style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold;">${stats.totalTrades}</p>
                    </div>
                  </td>
                  <td width="50%" style="padding: 10px;">
                    <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; text-align: center;">
                      <p style="color: #a0aec0; margin: 0 0 5px 0; font-size: 12px;">Win Rate</p>
                      <p style="color: ${stats.winRate >= 50 ? '#22c55e' : '#ef4444'}; margin: 0; font-size: 32px; font-weight: bold;">${stats.winRate.toFixed(1)}%</p>
                    </div>
                  </td>
                </tr>
              </table>
              
              <!-- P&L Display -->
              <div style="background: ${stats.totalPnl >= 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)'}; border: 1px solid ${stats.totalPnl >= 0 ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}; border-radius: 12px; padding: 25px; text-align: center; margin-top: 20px;">
                <p style="color: #a0aec0; margin: 0 0 5px 0; font-size: 12px;">${periodLabel} P&L</p>
                <p style="color: ${stats.totalPnl >= 0 ? '#22c55e' : '#ef4444'}; margin: 0; font-size: 42px; font-weight: bold;">${stats.totalPnl >= 0 ? '+' : ''}$${stats.totalPnl.toFixed(2)}</p>
              </div>
              
              <!-- Win/Loss Breakdown -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 20px;">
                <tr>
                  <td width="50%" style="padding: 10px;">
                    <div style="background: rgba(34, 197, 94, 0.1); border-radius: 12px; padding: 15px; text-align: center;">
                      <p style="color: #22c55e; margin: 0; font-size: 24px; font-weight: bold;">${stats.winningTrades}</p>
                      <p style="color: #a0aec0; margin: 5px 0 0 0; font-size: 12px;">Winning Trades</p>
                    </div>
                  </td>
                  <td width="50%" style="padding: 10px;">
                    <div style="background: rgba(239, 68, 68, 0.1); border-radius: 12px; padding: 15px; text-align: center;">
                      <p style="color: #ef4444; margin: 0; font-size: 24px; font-weight: bold;">${stats.losingTrades}</p>
                      <p style="color: #a0aec0; margin: 5px 0 0 0; font-size: 12px;">Losing Trades</p>
                    </div>
                  </td>
                </tr>
              </table>
              
              <!-- Trade Details -->
              <div style="background: rgba(255,255,255,0.03); border-radius: 12px; padding: 20px; margin-top: 20px;">
                <h3 style="color: #ffffff; margin: 0 0 15px 0; font-size: 16px;">Trade Details</h3>
                <table width="100%" cellpadding="5" cellspacing="0">
                  <tr>
                    <td style="color: #a0aec0; font-size: 14px;">Best Trade</td>
                    <td align="right" style="color: #22c55e; font-size: 14px; font-weight: bold;">+$${stats.bestTrade.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td style="color: #a0aec0; font-size: 14px;">Worst Trade</td>
                    <td align="right" style="color: #ef4444; font-size: 14px; font-weight: bold;">$${stats.worstTrade.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td style="color: #a0aec0; font-size: 14px;">Average Win</td>
                    <td align="right" style="color: #22c55e; font-size: 14px; font-weight: bold;">+$${stats.avgWin.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td style="color: #a0aec0; font-size: 14px;">Average Loss</td>
                    <td align="right" style="color: #ef4444; font-size: 14px; font-weight: bold;">-$${stats.avgLoss.toFixed(2)}</td>
                  </tr>
                </table>
              </div>
              
              <!-- Overall Account Stats -->
              ${dashboard ? `
              <div style="background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 12px; padding: 20px; margin-top: 20px;">
                <h3 style="color: #ffffff; margin: 0 0 15px 0; font-size: 16px;">📈 Account Overview</h3>
                <table width="100%" cellpadding="5" cellspacing="0">
                  <tr>
                    <td style="color: #a0aec0; font-size: 14px;">Total Account P&L</td>
                    <td align="right" style="color: ${(dashboard.total_pnl || 0) >= 0 ? '#22c55e' : '#ef4444'}; font-size: 14px; font-weight: bold;">${(dashboard.total_pnl || 0) >= 0 ? '+' : ''}$${(dashboard.total_pnl || 0).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td style="color: #a0aec0; font-size: 14px;">All-Time Win Rate</td>
                    <td align="right" style="color: #8b5cf6; font-size: 14px; font-weight: bold;">${(dashboard.win_rate || 0).toFixed(1)}%</td>
                  </tr>
                  <tr>
                    <td style="color: #a0aec0; font-size: 14px;">Total Trades</td>
                    <td align="right" style="color: #ffffff; font-size: 14px; font-weight: bold;">${dashboard.total_trades || 0}</td>
                  </tr>
                </table>
              </div>
              ` : ''}
              
              <!-- CTA Button -->
              <div style="text-align: center; margin-top: 30px;">
                <a href="${Deno.env.get('FRONTEND_URL') || 'https://tradenexus.app'}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6, #06b6d4); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 10px; font-weight: bold; font-size: 16px;">View Full Dashboard</a>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; text-align: center; background: rgba(0,0,0,0.2);">
              <p style="color: #64748b; margin: 0; font-size: 12px;">
                You're receiving this because you have ${period} digests enabled.<br>
                <a href="${Deno.env.get('FRONTEND_URL') || 'https://tradenexus.app'}/dashboard?tab=settings" style="color: #8b5cf6;">Manage email preferences</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `;

        // Send email
        const emailResponse = await resend.emails.send({
          from: "TraderEdge Pro <notifications@traderedgepro.com>",
          to: [user.email],
          subject: `📊 Your ${periodLabel} Trading Performance - ${stats.totalPnl >= 0 ? '+' : ''}$${stats.totalPnl.toFixed(2)}`,
          html: emailHtml,
        });

        results.push({ userId: user.user_id, success: true });
        console.log(`Sent ${period} digest to ${user.email}`);

      } catch (userError: unknown) {
        const errorMessage = userError instanceof Error ? userError.message : 'Unknown error';
        console.error(`Error sending digest to ${user.email}:`, userError);
        results.push({ userId: user.user_id, success: false, error: errorMessage });
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      sent: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in performance-digest function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
