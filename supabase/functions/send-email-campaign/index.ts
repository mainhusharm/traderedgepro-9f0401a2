import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface CampaignRequest {
  campaign_id: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(resendApiKey);

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

    const body: CampaignRequest = await req.json();
    const { campaign_id } = body;

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from("email_campaigns")
      .select("*")
      .eq("id", campaign_id)
      .single();

    if (campaignError || !campaign) {
      throw new Error("Campaign not found");
    }

    if (campaign.status === "sent") {
      throw new Error("Campaign has already been sent");
    }

    console.log("Processing campaign:", campaign.name);

    // Update campaign status to sending
    await supabase
      .from("email_campaigns")
      .update({ status: "sending" })
      .eq("id", campaign_id);

    // Get target users with their profiles
    let query = supabase
      .from("memberships")
      .select(`
        user_id,
        plan_name,
        profiles!inner(user_id, first_name, email_preferences)
      `)
      .eq("status", "active");

    if (campaign.target_plans && campaign.target_plans.length > 0) {
      query = query.in("plan_name", campaign.target_plans);
    }

    const { data: recipients, error: recipientsError } = await query;

    if (recipientsError) throw recipientsError;

    console.log(`Found ${recipients?.length || 0} potential recipients`);

    // Get user emails from auth
    const userIds = recipients?.map((r) => r.user_id) || [];
    
    // We need to get emails from profiles or use a different approach
    // For now, let's get emails from auth users via service role
    const { data: authUsers, error: authUsersError } = await supabase.auth.admin.listUsers();
    
    if (authUsersError) throw authUsersError;

    const userEmailMap = new Map();
    authUsers.users.forEach((u) => {
      userEmailMap.set(u.id, u.email);
    });

    // Filter recipients who have opted in to marketing emails
    const eligibleRecipients = recipients?.filter((r: any) => {
      const profile = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
      const emailPrefs = profile?.email_preferences as any;
      // Check if user has email and hasn't opted out of marketing
      return userEmailMap.has(r.user_id) && 
             (!emailPrefs || emailPrefs.marketing !== false);
    }) || [];

    console.log(`${eligibleRecipients.length} eligible recipients after filtering`);

    // Create recipient records
    const recipientRecords = eligibleRecipients.map((r: any) => {
      const profile = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
      return {
        campaign_id,
        user_id: r.user_id,
        email: userEmailMap.get(r.user_id),
        first_name: profile?.first_name || "Trader",
        plan_name: r.plan_name,
        status: "pending",
      };
    });

    // Insert recipients
    if (recipientRecords.length > 0) {
      await supabase
        .from("email_campaign_recipients")
        .insert(recipientRecords);
    }

    // Update total recipients count
    await supabase
      .from("email_campaigns")
      .update({ total_recipients: recipientRecords.length })
      .eq("id", campaign_id);

    // Send emails in batches
    let sentCount = 0;
    let failedCount = 0;
    const batchSize = 10;

    for (let i = 0; i < recipientRecords.length; i += batchSize) {
      const batch = recipientRecords.slice(i, i + batchSize);
      
      const emailPromises = batch.map(async (recipient) => {
        try {
          // Replace placeholders in content
          let htmlContent = campaign.html_content
            .replace(/\{\{first_name\}\}/g, recipient.first_name)
            .replace(/\{\{plan_name\}\}/g, recipient.plan_name);

          const { error: sendError } = await resend.emails.send({
            from: "TraderEdge Pro <campaigns@traderedgepro.com>",
            to: [recipient.email],
            subject: campaign.subject,
            html: htmlContent,
          });

          if (sendError) {
            throw sendError;
          }

          // Update recipient status
          await supabase
            .from("email_campaign_recipients")
            .update({ status: "sent", sent_at: new Date().toISOString() })
            .eq("campaign_id", campaign_id)
            .eq("user_id", recipient.user_id);

          sentCount++;
          return true;
        } catch (error: any) {
          console.error(`Error sending to ${recipient.email}:`, error);
          
          // Update recipient status
          await supabase
            .from("email_campaign_recipients")
            .update({ status: "failed", error_message: error.message })
            .eq("campaign_id", campaign_id)
            .eq("user_id", recipient.user_id);

          failedCount++;
          return false;
        }
      });

      await Promise.all(emailPromises);
      
      // Small delay between batches to avoid rate limiting
      if (i + batchSize < recipientRecords.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    // Update campaign with final status
    await supabase
      .from("email_campaigns")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        sent_count: sentCount,
        failed_count: failedCount,
      })
      .eq("id", campaign_id);

    // Log to email_logs
    await supabase.from("email_logs").insert({
      email_type: "campaign",
      to_email: `Campaign: ${campaign.name}`,
      subject: campaign.subject,
      status: "sent",
      metadata: {
        campaign_id,
        sent_count: sentCount,
        failed_count: failedCount,
      },
    });

    console.log(`Campaign completed: ${sentCount} sent, ${failedCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        sent_count: sentCount,
        failed_count: failedCount,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-email-campaign:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
