import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface BroadcastRequest {
  title: string;
  message: string;
  notification_type: string;
  target_plans: string[];
  target_user_ids?: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify admin authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("Invalid authentication");
    }

    // Check if user is admin
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });

    if (!isAdmin) {
      throw new Error("Unauthorized: Admin access required");
    }

    const body: BroadcastRequest = await req.json();
    const { title, message, notification_type, target_plans, target_user_ids } = body;

    console.log("Processing broadcast:", { title, notification_type, target_plans });

    // Get target users based on filters
    let userIds: string[] = [];

    if (target_user_ids && target_user_ids.length > 0) {
      // Specific users
      userIds = target_user_ids;
    } else if (target_plans && target_plans.length > 0) {
      // Filter by plan
      const { data: memberships, error: membershipError } = await supabase
        .from("memberships")
        .select("user_id")
        .eq("status", "active")
        .in("plan_name", target_plans);

      if (membershipError) throw membershipError;
      userIds = memberships?.map((m) => m.user_id) || [];
    } else {
      // All active members
      const { data: memberships, error: membershipError } = await supabase
        .from("memberships")
        .select("user_id")
        .eq("status", "active");

      if (membershipError) throw membershipError;
      userIds = memberships?.map((m) => m.user_id) || [];
    }

    // Remove duplicates
    userIds = [...new Set(userIds)];

    console.log(`Sending broadcast to ${userIds.length} users`);

    if (userIds.length === 0) {
      return new Response(
        JSON.stringify({ success: true, recipients_count: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create notifications for all target users
    const notifications = userIds.map((userId) => ({
      user_id: userId,
      type: notification_type,
      title,
      message,
      is_read: false,
      data: { source: "admin_broadcast" },
    }));

    // Insert in batches of 100
    const batchSize = 100;
    for (let i = 0; i < notifications.length; i += batchSize) {
      const batch = notifications.slice(i, i + batchSize);
      const { error: insertError } = await supabase
        .from("user_notifications")
        .insert(batch);

      if (insertError) {
        console.error("Error inserting batch:", insertError);
      }
    }

    // Log the broadcast
    const { error: broadcastError } = await supabase
      .from("admin_broadcasts")
      .insert({
        title,
        message,
        notification_type,
        target_plans: target_plans || [],
        target_user_ids: target_user_ids || null,
        sent_by: user.id,
        total_recipients: userIds.length,
      });

    if (broadcastError) {
      console.error("Error logging broadcast:", broadcastError);
    }

    console.log(`Broadcast sent successfully to ${userIds.length} users`);

    return new Response(
      JSON.stringify({
        success: true,
        recipients_count: userIds.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-admin-broadcast:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
