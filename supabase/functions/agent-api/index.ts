import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type AgentAuth = {
  sessionToken?: string | null;
  agentToken?: string | null;
  agentId?: string | null;
};

type AgentApiRequest =
  | {
      action: "get_team_overview";
      data: { sessionToken: string };
    }
  | {
      action: "send_message";
      data: AgentAuth & { sessionId: string; content: string };
    }
  | {
      action: "mark_read_user_messages";
      data: AgentAuth & { sessionId: string };
    };

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = (await req.json()) as AgentApiRequest;

    const resolveAgent = async (auth: AgentAuth) => {
      const nowIso = new Date().toISOString();

      // Prefer validating via agent session token (most secure for the agent portal)
      if (auth.sessionToken) {
        const { data: session, error } = await supabase
          .from("agent_sessions")
          .select("agent_id, expires_at, admin_agents(status)")
          .eq("session_token", auth.sessionToken)
          .gte("expires_at", nowIso)
          .single();

        if (error || !session) {
          console.log("agent-api: invalid sessionToken", error?.message);
          return { error: "Invalid or expired session" as const };
        }

        if (session.admin_agents?.[0]?.status === "inactive") {
          return { error: "Agent is inactive" as const };
        }

        return { agentId: session.agent_id };
      }

      // Backwards compatible auth methods
      if (auth.agentToken) {
        const { data, error } = await supabase
          .from("admin_agents")
          .select("id, status")
          .eq("invitation_token", auth.agentToken)
          .single();

        if (error || !data) {
          console.log("agent-api: invalid agentToken", error?.message);
          return { error: "Invalid agent token" as const };
        }

        if (data.status === "inactive") {
          return { error: "Agent is inactive" as const };
        }

        return { agentId: data.id };
      }

      if (auth.agentId) {
        const { data, error } = await supabase
          .from("admin_agents")
          .select("id, status")
          .eq("id", auth.agentId)
          .single();

        if (error || !data) {
          console.log("agent-api: invalid agentId", error?.message);
          return { error: "Invalid agent" as const };
        }

        if (data.status === "inactive") {
          return { error: "Agent is inactive" as const };
        }

        return { agentId: data.id };
      }

      return { error: "Missing agent auth" as const };
    };

    if (body.action === "get_team_overview") {
      const { sessionToken } = body.data;

      if (!sessionToken) {
        return new Response(JSON.stringify({ error: "Missing session token" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const agentRes = await resolveAgent({ sessionToken });
      if ("error" in agentRes) {
        return new Response(JSON.stringify({ error: agentRes.error }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: agentsData, error: agentsError } = await supabase
        .from("admin_agents")
        .select("id, name, email, is_online, last_seen_at, status")
        .neq("status", "inactive")
        .order("name", { ascending: true });

      if (agentsError) {
        console.log("agent-api: get_team_overview agentsError", agentsError.message);
        return new Response(JSON.stringify({ error: agentsError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: statsData, error: statsError } = await supabase
        .from("agent_stats")
        .select("*");

      if (statsError) {
        console.log("agent-api: get_team_overview statsError", statsError.message);
        return new Response(JSON.stringify({ error: statsError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: signalRows, error: signalError } = await supabase
        .from("signals")
        .select("agent_id, outcome")
        .not("agent_id", "is", null);

      if (signalError) {
        console.log("agent-api: get_team_overview signalError", signalError.message);
        return new Response(JSON.stringify({ error: signalError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: clientsRows, error: clientsError } = await supabase
        .from("agent_clients")
        .select("agent_id")
        .eq("status", "active");

      if (clientsError) {
        console.log("agent-api: get_team_overview clientsError", clientsError.message);
        return new Response(JSON.stringify({ error: clientsError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const computedStats: Record<
        string,
        { total: number; wins: number; losses: number; be: number }
      > = {};

      (signalRows || []).forEach((s) => {
        const agentId = (s as any).agent_id as string | null;
        if (!agentId) return;
        if (!computedStats[agentId]) {
          computedStats[agentId] = { total: 0, wins: 0, losses: 0, be: 0 };
        }
        computedStats[agentId].total++;
        if ((s as any).outcome === "target_hit") computedStats[agentId].wins++;
        if ((s as any).outcome === "stop_loss_hit") computedStats[agentId].losses++;
        if ((s as any).outcome === "breakeven") computedStats[agentId].be++;
      });

      const clientsPerAgent: Record<string, number> = {};
      (clientsRows || []).forEach((c) => {
        const agentId = (c as any).agent_id as string;
        clientsPerAgent[agentId] = (clientsPerAgent[agentId] || 0) + 1;
      });

      const agents = (agentsData || []).map((agent) => {
        const dbStats = (statsData || []).find((s: any) => s.agent_id === agent.id);
        const computed = computedStats[agent.id];

        const stats = dbStats ||
          (computed
            ? {
                agent_id: agent.id,
                total_signals_posted: computed.total,
                winning_signals: computed.wins,
                losing_signals: computed.losses,
                breakeven_signals: computed.be,
                clients_handled: clientsPerAgent[agent.id] || 0,
                last_signal_at: null,
              }
            : null);

        // Ensure clients_handled is present even when dbStats exists
        if (stats && (stats as any).clients_handled == null) {
          (stats as any).clients_handled = clientsPerAgent[agent.id] || 0;
        }

        return { ...agent, stats };
      });

      const teamStats = agents.reduce(
        (acc: any, a: any) => ({
          totalSignals: acc.totalSignals + (a.stats?.total_signals_posted || 0),
          totalWins: acc.totalWins + (a.stats?.winning_signals || 0),
          totalLosses: acc.totalLosses + (a.stats?.losing_signals || 0),
          onlineAgents: acc.onlineAgents + (a.is_online ? 1 : 0),
        }),
        { totalSignals: 0, totalWins: 0, totalLosses: 0, onlineAgents: 0 }
      );

      return new Response(JSON.stringify({ success: true, agents, teamStats }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (body.action === "send_message") {
      const { sessionId, content, ...auth } = body.data;

      if (!sessionId || !content?.trim()) {
        return new Response(JSON.stringify({ error: "Missing sessionId or content" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const agentRes = await resolveAgent(auth);
      if ("error" in agentRes) {
        return new Response(JSON.stringify({ error: agentRes.error }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Ensure session exists
      const { data: session, error: sessionError } = await supabase
        .from("guidance_sessions")
        .select("id")
        .eq("id", sessionId)
        .single();

      if (sessionError || !session) {
        console.log("agent-api: session not found", sessionError?.message);
        return new Response(JSON.stringify({ error: "Session not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: message, error } = await supabase
        .from("guidance_messages")
        .insert({
          session_id: sessionId,
          sender_id: agentRes.agentId,
          sender_type: "agent",
          content: content.trim(),
          is_read: false,
        })
        .select()
        .single();

      if (error) {
        console.log("agent-api: insert failed", error.message);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, message }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (body.action === "mark_read_user_messages") {
      const { sessionId, ...auth } = body.data;
      const agentRes = await resolveAgent(auth);
      if ("error" in agentRes) {
        return new Response(JSON.stringify({ error: agentRes.error }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error } = await supabase
        .from("guidance_messages")
        .update({ is_read: true })
        .eq("session_id", sessionId)
        .eq("sender_type", "user")
        .eq("is_read", false);

      if (error) {
        console.log("agent-api: mark_read failed", error.message);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.log("agent-api: unexpected error", error?.message);
    return new Response(JSON.stringify({ error: error?.message || "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
