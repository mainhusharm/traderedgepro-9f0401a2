import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, svix-id, svix-timestamp, svix-signature",
};

interface ResendWebhookEvent {
  type: string;
  created_at: string;
  data: {
    email_id: string;
    from?: string;
    to?: string[];
    subject?: string;
    created_at?: string;
    bounce?: {
      message?: string;
    };
    complaint?: {
      type?: string;
    };
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify webhook signature (optional but recommended)
    // const svixId = req.headers.get("svix-id");
    // const svixTimestamp = req.headers.get("svix-timestamp");
    // const svixSignature = req.headers.get("svix-signature");
    
    const event: ResendWebhookEvent = await req.json();
    
    console.log("Received Resend webhook event:", event.type, event.data.email_id);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Map Resend event types to our status
    let status = "sent";
    let errorMessage: string | null = null;
    
    switch (event.type) {
      case "email.sent":
        status = "sent";
        break;
      case "email.delivered":
        status = "delivered";
        break;
      case "email.delivery_delayed":
        status = "delayed";
        break;
      case "email.complained":
        status = "complained";
        errorMessage = event.data.complaint?.type || "User marked as spam";
        break;
      case "email.bounced":
        status = "bounced";
        errorMessage = event.data.bounce?.message || "Email bounced";
        break;
      case "email.opened":
        status = "opened";
        break;
      case "email.clicked":
        status = "clicked";
        break;
      default:
        console.log("Unknown event type:", event.type);
    }

    // Update email log in database
    const { error: updateError } = await supabase
      .from("email_logs")
      .update({
        status,
        error_message: errorMessage,
        updated_at: new Date().toISOString(),
        metadata: {
          event_type: event.type,
          event_created_at: event.created_at,
          ...((event.data.bounce || event.data.complaint) && {
            details: event.data.bounce || event.data.complaint
          })
        }
      })
      .eq("resend_id", event.data.email_id);

    if (updateError) {
      console.error("Error updating email log:", updateError);
      // Don't throw - we still want to return 200 to Resend
    } else {
      console.log(`Updated email ${event.data.email_id} status to ${status}`);
    }

    // If email bounced or complained, we might want to handle it specially
    if (status === "bounced" || status === "complained") {
      // You could create a notification for admin, update user preferences, etc.
      console.log(`Email issue detected: ${status} for ${event.data.email_id}`);
      
      // Create admin notification
      await supabase.from("user_notifications").insert({
        user_id: "00000000-0000-0000-0000-000000000000", // System notification - you'd replace with admin user
        type: "email_issue",
        title: `Email ${status}`,
        message: `Email to ${event.data.to?.[0] || "unknown"} has ${status}. ${errorMessage || ""}`,
        data: { email_id: event.data.email_id, status, error: errorMessage }
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    console.error("Error in resend-webhook function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    // Still return 200 to prevent Resend from retrying
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
