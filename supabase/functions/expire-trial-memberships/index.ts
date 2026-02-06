import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Starting membership expiration check...");

    // Expire trial memberships
    const { data: expiredTrialMemberships, error: trialError } = await supabase
      .from("memberships")
      .update({ status: "expired" })
      .eq("is_trial", true)
      .eq("status", "active")
      .lt("expires_at", new Date().toISOString())
      .select("id, user_id, plan_name");

    if (trialError) {
      console.error("Error expiring trial memberships:", trialError);
    } else {
      console.log(`Expired ${expiredTrialMemberships?.length || 0} trial memberships`);
    }

    // Expire regular memberships that have passed their expiration date
    const { data: expiredRegularMemberships, error: regularError } = await supabase
      .from("memberships")
      .update({ status: "expired" })
      .eq("is_trial", false)
      .eq("status", "active")
      .lt("expires_at", new Date().toISOString())
      .select("id, user_id, plan_name");

    if (regularError) {
      console.error("Error expiring regular memberships:", regularError);
    } else {
      console.log(`Expired ${expiredRegularMemberships?.length || 0} regular memberships`);
    }

    // Expire MT5 trial users
    const { data: expiredMT5Users, error: mt5Error } = await supabase
      .from("mt5_users")
      .update({ 
        payment_verified: false, 
        is_active: false 
      })
      .eq("is_trial", true)
      .eq("payment_verified", true)
      .lt("trial_expires_at", new Date().toISOString())
      .select("id, user_id, email");

    if (mt5Error) {
      console.error("Error expiring MT5 trials:", mt5Error);
    } else {
      console.log(`Expired ${expiredMT5Users?.length || 0} MT5 trial users`);
    }

    const summary = {
      timestamp: new Date().toISOString(),
      expiredTrialMemberships: expiredTrialMemberships?.length || 0,
      expiredRegularMemberships: expiredRegularMemberships?.length || 0,
      expiredMT5Users: expiredMT5Users?.length || 0,
      trialDetails: expiredTrialMemberships || [],
      regularDetails: expiredRegularMemberships || [],
      mt5UserDetails: expiredMT5Users || [],
    };

    console.log("Membership expiration check complete:", summary);

    return new Response(
      JSON.stringify({ success: true, ...summary }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in expire-trial-memberships:", error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
