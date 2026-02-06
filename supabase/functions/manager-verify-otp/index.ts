import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-session, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return new Response(
        JSON.stringify({ success: false, error: "Email and OTP are required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get manager
    const { data: manager, error: managerError } = await supabase
      .from("managers")
      .select("*")
      .eq("email", email.toLowerCase())
      .single();

    if (managerError || !manager) {
      return new Response(
        JSON.stringify({ success: false, error: "Manager not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    // Verify OTP
    if (manager.otp_code !== otp) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid OTP" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    // Check if OTP expired
    if (new Date(manager.otp_expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ success: false, error: "OTP has expired" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    // Clear OTP
    await supabase
      .from("managers")
      .update({
        otp_code: null,
        otp_expires_at: null,
        is_online: true,
        last_seen_at: new Date().toISOString(),
      })
      .eq("id", manager.id);

    // Create session token
    const sessionToken = crypto.randomUUID() + "-" + crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await supabase.from("manager_sessions").insert({
      manager_id: manager.id,
      session_token: sessionToken,
      expires_at: expiresAt.toISOString(),
    });

    return new Response(
      JSON.stringify({
        success: true,
        sessionToken,
        manager: {
          id: manager.id,
          email: manager.email,
          name: manager.name,
          permissions: manager.permissions,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in manager-verify-otp:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
