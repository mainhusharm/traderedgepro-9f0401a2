import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log("Starting daily agent digest...");

    // Get all active agents
    const { data: agents, error: agentsError } = await supabase
      .from("admin_agents")
      .select("id, email, name")
      .eq("status", "active");

    if (agentsError) {
      throw new Error(`Failed to fetch agents: ${agentsError.message}`);
    }

    if (!agents || agents.length === 0) {
      console.log("No active agents found");
      return new Response(JSON.stringify({ message: "No active agents" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const emailsSent: string[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const agent of agents) {
      // Get pending sessions assigned to this agent
      const { data: pendingSessions } = await supabase
        .from("guidance_sessions")
        .select("id, topic, session_number, status, created_at")
        .eq("assigned_agent_id", agent.id)
        .in("status", ["pending", "confirmed"])
        .order("created_at", { ascending: false });

      // Get unread notifications
      const { data: unreadNotifications } = await supabase
        .from("agent_notifications")
        .select("id, title, message, type, created_at")
        .eq("agent_id", agent.id)
        .eq("is_read", false)
        .order("created_at", { ascending: false })
        .limit(10);

      // Get sessions scheduled for today
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data: todaySessions } = await supabase
        .from("guidance_sessions")
        .select("id, topic, session_number, scheduled_at")
        .eq("assigned_agent_id", agent.id)
        .gte("scheduled_at", today.toISOString())
        .lt("scheduled_at", tomorrow.toISOString())
        .order("scheduled_at", { ascending: true });

      // Skip if nothing to report
      const hasPending = pendingSessions && pendingSessions.length > 0;
      const hasUnread = unreadNotifications && unreadNotifications.length > 0;
      const hasToday = todaySessions && todaySessions.length > 0;

      if (!hasPending && !hasUnread && !hasToday) {
        console.log(`No updates for agent ${agent.email}, skipping`);
        continue;
      }

      // Build email content
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0a;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 32px; border: 1px solid rgba(255,255,255,0.1);">
              
              <div style="text-align: center; margin-bottom: 32px;">
                <h1 style="color: #ffffff; font-size: 24px; margin: 0 0 8px 0;">📋 Daily Digest</h1>
                <p style="color: #a0a0a0; font-size: 14px; margin: 0;">
                  ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>

              ${hasToday ? `
              <div style="margin-bottom: 24px;">
                <h2 style="color: #6366f1; font-size: 16px; margin: 0 0 16px 0; display: flex; align-items: center; gap: 8px;">
                  📅 Today's Sessions (${todaySessions?.length || 0})
                </h2>
                <div style="background: rgba(99, 102, 241, 0.1); border-radius: 8px; padding: 16px; border: 1px solid rgba(99, 102, 241, 0.2);">
                  ${todaySessions?.map(s => `
                    <div style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                      <p style="color: #ffffff; font-size: 14px; margin: 0;">${s.topic}</p>
                      <p style="color: #a0a0a0; font-size: 12px; margin: 4px 0 0 0;">
                        ${s.session_number} • ${new Date(s.scheduled_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  `).join('') || ''}
                </div>
              </div>
              ` : ''}

              ${hasPending ? `
              <div style="margin-bottom: 24px;">
                <h2 style="color: #f59e0b; font-size: 16px; margin: 0 0 16px 0;">
                  ⏳ Pending Sessions (${pendingSessions?.length || 0})
                </h2>
                <div style="background: rgba(245, 158, 11, 0.1); border-radius: 8px; padding: 16px; border: 1px solid rgba(245, 158, 11, 0.2);">
                  ${pendingSessions?.slice(0, 5).map(s => `
                    <div style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                      <p style="color: #ffffff; font-size: 14px; margin: 0;">${s.topic}</p>
                      <p style="color: #a0a0a0; font-size: 12px; margin: 4px 0 0 0;">
                        ${s.session_number} • ${s.status}
                      </p>
                    </div>
                  `).join('') || ''}
                  ${(pendingSessions?.length || 0) > 5 ? `
                    <p style="color: #f59e0b; font-size: 12px; margin: 12px 0 0 0;">
                      + ${(pendingSessions?.length || 0) - 5} more pending sessions
                    </p>
                  ` : ''}
                </div>
              </div>
              ` : ''}

              ${hasUnread ? `
              <div style="margin-bottom: 24px;">
                <h2 style="color: #ef4444; font-size: 16px; margin: 0 0 16px 0;">
                  🔔 Unread Notifications (${unreadNotifications?.length || 0})
                </h2>
                <div style="background: rgba(239, 68, 68, 0.1); border-radius: 8px; padding: 16px; border: 1px solid rgba(239, 68, 68, 0.2);">
                  ${unreadNotifications?.slice(0, 5).map(n => `
                    <div style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                      <p style="color: #ffffff; font-size: 14px; margin: 0;">${n.title}</p>
                      <p style="color: #a0a0a0; font-size: 12px; margin: 4px 0 0 0;">
                        ${n.message.slice(0, 80)}${n.message.length > 80 ? '...' : ''}
                      </p>
                    </div>
                  `).join('') || ''}
                </div>
              </div>
              ` : ''}

              <div style="text-align: center; margin-top: 24px;">
                <a href="${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovable.app') || '#'}/agent/dashboard" 
                   style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">
                  Open Agent Portal
                </a>
              </div>

            </div>
            
            <p style="color: #666666; font-size: 12px; text-align: center; margin-top: 24px;">
              You're receiving this because you're an active agent. © ${new Date().getFullYear()} TradingNexus
            </p>
          </div>
        </body>
        </html>
      `;

      try {
        await resend.emails.send({
          from: "TraderEdge Pro <agents@traderedgepro.com>",
          to: [agent.email],
          subject: `📋 Daily Digest: ${hasToday ? `${todaySessions?.length} session${(todaySessions?.length || 0) !== 1 ? 's' : ''} today` : 'Your summary'}`,
          html: emailHtml,
        });
        emailsSent.push(agent.email);
        console.log(`Digest sent to ${agent.email}`);
      } catch (emailError) {
        console.error(`Failed to send digest to ${agent.email}:`, emailError);
      }
    }

    console.log(`Daily digest completed. Emails sent: ${emailsSent.length}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailsSent: emailsSent.length,
        agents: emailsSent 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in daily digest:", error);
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
