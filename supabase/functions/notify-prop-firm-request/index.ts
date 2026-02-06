import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const ADMIN_EMAIL = "giggletales18@gmail.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface PropFirmRequest {
  userName: string;
  userEmail: string;
  propFirmName: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userName, userEmail, propFirmName }: PropFirmRequest = await req.json();

    // Validate inputs
    if (!userName || !userEmail || !propFirmName) {
      throw new Error("Missing required fields: userName, userEmail, propFirmName");
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      throw new Error("Invalid email address");
    }

    // Store in database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error: dbError } = await supabase
      .from("prop_firm_requests")
      .insert({
        user_name: userName,
        user_email: userEmail,
        prop_firm_name: propFirmName,
      });

    if (dbError) {
      console.error("Database error:", dbError);
      throw new Error("Failed to save request");
    }

    // Send email notification to admin
    const emailResponse = await resend.emails.send({
      from: "TraderEdge Pro <noreply@traderedgepro.lovable.app>",
      to: [ADMIN_EMAIL],
      subject: `🏢 New Prop Firm Affiliate Request: ${propFirmName}`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 32px;">
      <img src="https://traderedgepro.lovable.app/logo3d.png" alt="TraderEdge Pro" style="width: 80px; height: 80px;" />
      <h1 style="color: #ffffff; font-size: 24px; margin: 16px 0 0 0;">New Prop Firm Request</h1>
    </div>
    
    <!-- Content Card -->
    <div style="background: linear-gradient(145deg, #18181b, #1f1f23); border: 1px solid #27272a; border-radius: 16px; padding: 32px; margin-bottom: 24px;">
      <div style="margin-bottom: 24px;">
        <p style="color: #71717a; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px 0;">Prop Firm Requested</p>
        <p style="color: #22c55e; font-size: 24px; font-weight: bold; margin: 0;">${propFirmName}</p>
      </div>
      
      <div style="border-top: 1px solid #27272a; padding-top: 24px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #27272a;">
              <span style="color: #71717a; font-size: 14px;">User Name</span>
            </td>
            <td style="padding: 12px 0; border-bottom: 1px solid #27272a; text-align: right;">
              <span style="color: #ffffff; font-size: 14px; font-weight: 500;">${userName}</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 12px 0;">
              <span style="color: #71717a; font-size: 14px;">Email Address</span>
            </td>
            <td style="padding: 12px 0; text-align: right;">
              <a href="mailto:${userEmail}" style="color: #8b5cf6; font-size: 14px; font-weight: 500; text-decoration: none;">${userEmail}</a>
            </td>
          </tr>
        </table>
      </div>
    </div>
    
    <!-- Action Note -->
    <div style="background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 12px; padding: 20px; text-align: center;">
      <p style="color: #a78bfa; font-size: 14px; margin: 0;">
        ⏱️ User expects response within <strong>24-72 hours</strong>
      </p>
    </div>
    
    <!-- Footer -->
    <div style="text-align: center; margin-top: 32px;">
      <p style="color: #52525b; font-size: 12px; margin: 0;">
        This notification was sent from TraderEdge Pro Affiliate System
      </p>
    </div>
  </div>
</body>
</html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, message: "Request submitted successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in notify-prop-firm-request:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
