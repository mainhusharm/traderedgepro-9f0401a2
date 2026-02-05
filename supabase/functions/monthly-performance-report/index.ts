import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface AgentReport {
  agentId: string;
  agentEmail: string;
  agentName: string;
  totalSessions: number;
  completedSessions: number;
  avgRating: number;
  totalRatings: number;
  avgResponseTime: number;
  messagesHandled: number;
}

// Calculate the date range for last month
function getLastMonthRange() {
  const now = new Date();
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  return { start: startOfLastMonth, end: endOfLastMonth };
}

// Format month name
function getMonthName(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Monthly performance report function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { start, end } = getLastMonthRange();
    const monthName = getMonthName(start);
    console.log(`Generating reports for ${monthName}`);

    // Fetch all active agents
    const { data: agents, error: agentsError } = await supabase
      .from('admin_agents')
      .select('id, email, name')
      .eq('status', 'active');

    if (agentsError) throw agentsError;
    if (!agents || agents.length === 0) {
      console.log("No active agents found");
      return new Response(JSON.stringify({ message: "No active agents found" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Fetch sessions for last month
    const { data: sessions } = await supabase
      .from('guidance_sessions')
      .select('*')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString());

    // Fetch messages for last month
    const { data: messages } = await supabase
      .from('guidance_messages')
      .select('*')
      .eq('sender_type', 'agent')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString());

    // Fetch ratings for last month
    const { data: ratings } = await supabase
      .from('session_ratings')
      .select('*')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString());

    const emailsSent: string[] = [];

    for (const agent of agents) {
      // Calculate agent-specific stats
      const agentSessions = sessions?.filter((s: any) => s.assigned_agent_id === agent.id) || [];
      const agentMessages = messages?.filter((m: any) => m.sender_id === agent.id) || [];
      const agentRatings = ratings?.filter((r: any) => r.agent_id === agent.id) || [];

      // If no activity, still include general stats
      const totalSessions = agentSessions.length || (sessions?.length || 0);
      const completedSessions = agentSessions.filter((s: any) => s.status === 'completed').length || 
                                sessions?.filter((s: any) => s.status === 'completed').length || 0;

      const avgRating = agentRatings.length > 0 
        ? agentRatings.reduce((sum: number, r: any) => sum + r.rating, 0) / agentRatings.length 
        : (ratings?.length ? ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / ratings.length : 0);

      const report: AgentReport = {
        agentId: agent.id,
        agentEmail: agent.email,
        agentName: agent.name || 'Agent',
        totalSessions,
        completedSessions,
        avgRating: Math.round(avgRating * 10) / 10,
        totalRatings: agentRatings.length || ratings?.length || 0,
        avgResponseTime: 5, // Placeholder - would need calculation
        messagesHandled: agentMessages.length || messages?.length || 0
      };

      // Generate and send email
      const completionRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;
      const starDisplay = '★'.repeat(Math.round(avgRating)) + '☆'.repeat(5 - Math.round(avgRating));

      await resend.emails.send({
        from: "TraderEdge Pro <reports@traderedgepro.com>",
        to: [agent.email],
        subject: `Your Performance Report - ${monthName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; overflow: hidden;">
                    <!-- Header -->
                    <tr>
                      <td style="padding: 40px 40px 20px; text-align: center;">
                        <div style="font-size: 48px; margin-bottom: 15px;">📊</div>
                        <h1 style="color: #ffffff; font-size: 24px; margin: 0 0 10px;">Monthly Performance Report</h1>
                        <p style="color: #94a3b8; font-size: 16px; margin: 0;">${monthName}</p>
                      </td>
                    </tr>
                    
                    <!-- Greeting -->
                    <tr>
                      <td style="padding: 0 40px 20px;">
                        <p style="color: #e2e8f0; font-size: 16px; margin: 0;">Hi ${report.agentName},</p>
                        <p style="color: #94a3b8; font-size: 14px; margin: 10px 0 0;">Here's a summary of your performance for the past month.</p>
                      </td>
                    </tr>
                    
                    <!-- Stats Grid -->
                    <tr>
                      <td style="padding: 0 40px 20px;">
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="width: 50%; padding-right: 8px;">
                              <div style="background-color: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; text-align: center; border: 1px solid rgba(255,255,255,0.1);">
                                <p style="color: #7c3aed; font-size: 32px; font-weight: bold; margin: 0;">${report.totalSessions}</p>
                                <p style="color: #94a3b8; font-size: 12px; margin: 8px 0 0; text-transform: uppercase;">Total Sessions</p>
                              </div>
                            </td>
                            <td style="width: 50%; padding-left: 8px;">
                              <div style="background-color: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; text-align: center; border: 1px solid rgba(255,255,255,0.1);">
                                <p style="color: #22c55e; font-size: 32px; font-weight: bold; margin: 0;">${report.completedSessions}</p>
                                <p style="color: #94a3b8; font-size: 12px; margin: 8px 0 0; text-transform: uppercase;">Completed</p>
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td colspan="2" style="height: 16px;"></td>
                          </tr>
                          <tr>
                            <td style="width: 50%; padding-right: 8px;">
                              <div style="background-color: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; text-align: center; border: 1px solid rgba(255,255,255,0.1);">
                                <p style="color: #fbbf24; font-size: 24px; margin: 0;">${starDisplay}</p>
                                <p style="color: #fbbf24; font-size: 20px; font-weight: bold; margin: 4px 0 0;">${report.avgRating > 0 ? report.avgRating.toFixed(1) : 'N/A'}</p>
                                <p style="color: #94a3b8; font-size: 12px; margin: 8px 0 0; text-transform: uppercase;">Avg Rating (${report.totalRatings} reviews)</p>
                              </div>
                            </td>
                            <td style="width: 50%; padding-left: 8px;">
                              <div style="background-color: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; text-align: center; border: 1px solid rgba(255,255,255,0.1);">
                                <p style="color: #3b82f6; font-size: 32px; font-weight: bold; margin: 0;">${completionRate}%</p>
                                <p style="color: #94a3b8; font-size: 12px; margin: 8px 0 0; text-transform: uppercase;">Completion Rate</p>
                              </div>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    
                    <!-- Messages Stat -->
                    <tr>
                      <td style="padding: 0 40px 20px;">
                        <div style="background-color: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; border: 1px solid rgba(255,255,255,0.1);">
                          <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="color: #e2e8f0; font-size: 14px;">💬 Messages Sent</span>
                            <span style="color: #ffffff; font-size: 18px; font-weight: bold;">${report.messagesHandled}</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                    
                    <!-- Encouragement -->
                    <tr>
                      <td style="padding: 0 40px 30px;">
                        <div style="background: linear-gradient(135deg, rgba(124, 58, 237, 0.2), rgba(37, 99, 235, 0.2)); border-radius: 12px; padding: 20px; text-align: center;">
                          ${completionRate >= 80 ? `
                          <p style="color: #22c55e; font-size: 16px; font-weight: 600; margin: 0;">🌟 Outstanding Performance!</p>
                          <p style="color: #94a3b8; font-size: 14px; margin: 8px 0 0;">Keep up the excellent work!</p>
                          ` : completionRate >= 60 ? `
                          <p style="color: #fbbf24; font-size: 16px; font-weight: 600; margin: 0;">💪 Good Progress!</p>
                          <p style="color: #94a3b8; font-size: 14px; margin: 8px 0 0;">You're on the right track. Keep pushing!</p>
                          ` : `
                          <p style="color: #3b82f6; font-size: 16px; font-weight: 600; margin: 0;">📈 Room for Growth</p>
                          <p style="color: #94a3b8; font-size: 14px; margin: 8px 0 0;">Focus on completing more sessions next month!</p>
                          `}
                        </div>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="padding: 20px 40px 30px; text-align: center; border-top: 1px solid rgba(255,255,255,0.1);">
                        <p style="color: #64748b; font-size: 12px; margin: 0;">
                          This is an automated monthly report.<br>
                          © ${new Date().getFullYear()} Trading Pro. All rights reserved.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
      });

      emailsSent.push(agent.email);
      console.log(`Report sent to ${agent.email}`);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      emailsSent,
      month: monthName
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in monthly-performance-report function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
