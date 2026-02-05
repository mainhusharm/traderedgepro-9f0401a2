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
    const { email } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ success: false, error: "Email is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Check if manager exists and is active
    const { data: manager, error: managerError } = await supabase
      .from("managers")
      .select("*")
      .eq("email", email.toLowerCase())
      .single();

    if (managerError || !manager) {
      return new Response(
        JSON.stringify({ success: false, error: "Manager account not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    if (manager.status !== "active") {
      return new Response(
        JSON.stringify({ success: false, error: "Manager account is not active" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update manager with OTP
    await supabase
      .from("managers")
      .update({
        otp_code: otp,
        otp_expires_at: expiresAt.toISOString(),
      })
      .eq("id", manager.id);

    // Send OTP via email
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (resendApiKey) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "TraderEdge Pro <noreply@traderedgepro.com>",
          to: [email],
          subject: "Manager Portal - Login Code",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #9333EA;">Manager Portal Access</h2>
              <p>Hello ${manager.name || 'Manager'},</p>
              <p>Your login verification code is:</p>
              <div style="background: linear-gradient(135deg, #9333EA 0%, #6366F1 100%); color: white; font-size: 32px; font-weight: bold; text-align: center; padding: 20px; border-radius: 10px; letter-spacing: 8px;">
                ${otp}
              </div>
              <p style="color: #666; margin-top: 20px;">This code will expire in 10 minutes.</p>
              <p style="color: #999; font-size: 12px;">If you didn't request this code, please ignore this email.</p>
            </div>
          `,
        }),
      });
    }

    // Mask email for response
    const [localPart, domain] = email.split("@");
    const maskedEmail = localPart.substring(0, 2) + "***@" + domain;

    return new Response(
      JSON.stringify({
        success: true,
        managerName: manager.name,
        maskedEmail,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in manager-send-otp:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
