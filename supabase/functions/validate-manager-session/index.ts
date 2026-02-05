import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionToken } = await req.json();

    if (!sessionToken) {
      return new Response(
        JSON.stringify({ valid: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Find session
    const { data: session, error: sessionError } = await supabase
      .from("manager_sessions")
      .select("*, managers(*)")
      .eq("session_token", sessionToken)
      .single();

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({ valid: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if expired
    if (new Date(session.expires_at) < new Date()) {
      // Delete expired session
      await supabase
        .from("manager_sessions")
        .delete()
        .eq("id", session.id);

      return new Response(
        JSON.stringify({ valid: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update last activity
    await supabase
      .from("manager_sessions")
      .update({ last_activity_at: new Date().toISOString() })
      .eq("id", session.id);

    // Update manager online status
    await supabase
      .from("managers")
      .update({
        is_online: true,
        last_seen_at: new Date().toISOString(),
      })
      .eq("id", session.manager_id);

    return new Response(
      JSON.stringify({
        valid: true,
        manager: {
          id: session.managers.id,
          email: session.managers.email,
          name: session.managers.name,
          permissions: session.managers.permissions,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in validate-manager-session:", error);
    return new Response(
      JSON.stringify({ valid: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
