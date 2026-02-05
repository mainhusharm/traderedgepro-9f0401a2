import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type AcceptInviteBody = {
  invitationToken: string;
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ success: false, error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { invitationToken } = (await req.json()) as AcceptInviteBody;

    if (!invitationToken?.trim()) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing invitationToken" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: agent, error: findError } = await supabase
      .from("admin_agents")
      .select("id, status, email, name")
      .eq("invitation_token", invitationToken.trim())
      .single();

    if (findError || !agent) {
      console.log("accept-agent-invite: invalid token", findError?.message);
      return new Response(
        JSON.stringify({ success: false, error: "Invalid or expired invitation" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (agent.status === "inactive") {
      return new Response(
        JSON.stringify({ success: false, error: "Agent is inactive" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const now = new Date().toISOString();

    const { data: updated, error: updateError } = await supabase
      .from("admin_agents")
      .update({
        status: "active",
        invitation_accepted_at: now,
        is_online: true,
        last_seen_at: now,
      })
      .eq("id", agent.id)
      .select("id, status, invitation_accepted_at")
      .single();

    if (updateError || !updated) {
      console.log("accept-agent-invite: update failed", updateError?.message);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to activate agent" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    console.log("accept-agent-invite: activated", {
      id: updated.id,
      status: updated.status,
      invitation_accepted_at: updated.invitation_accepted_at,
    });

    return new Response(JSON.stringify({ success: true, agent: updated }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.log("accept-agent-invite: unexpected error", error?.message);
    return new Response(
      JSON.stringify({ success: false, error: error?.message || "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
