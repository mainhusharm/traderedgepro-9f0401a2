import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface TrackRequest {
  referralCode: string;
  fingerprint?: string;
  referrerUrl?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { referralCode, fingerprint, referrerUrl }: TrackRequest = await req.json();
    
    if (!referralCode) {
      return new Response(
        JSON.stringify({ error: "Referral code is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Tracking click for referral code: ${referralCode}`);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Find the referrer by their referral code
    const { data: referrerProfile, error: profileError } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("referral_code", referralCode)
      .single();

    if (profileError) {
      console.log("Referral code not found:", referralCode);
      return new Response(
        JSON.stringify({ error: "Invalid referral code" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check for duplicate clicks (same fingerprint within 24 hours)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    if (fingerprint) {
      const { data: existingClick } = await supabase
        .from("referral_clicks")
        .select("id")
        .eq("visitor_fingerprint", fingerprint)
        .eq("referral_code", referralCode)
        .gte("created_at", oneDayAgo.toISOString())
        .maybeSingle();

      if (existingClick) {
        console.log("Duplicate click detected, skipping");
        return new Response(
          JSON.stringify({ success: true, duplicate: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Get user agent from request
    const userAgent = req.headers.get("user-agent") || "";

    // Record the click
    const { error: insertError } = await supabase
      .from("referral_clicks")
      .insert({
        referral_code: referralCode,
        referrer_user_id: referrerProfile.user_id,
        visitor_fingerprint: fingerprint || null,
        user_agent: userAgent,
        referrer_url: referrerUrl || null,
      });

    if (insertError) {
      console.error("Failed to insert click:", insertError);
      throw insertError;
    }

    console.log(`Click tracked successfully for ${referralCode}`);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error tracking referral click:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
