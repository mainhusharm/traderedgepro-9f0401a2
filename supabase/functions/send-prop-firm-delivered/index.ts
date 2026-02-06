import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface DeliveredNotification {
  userEmail: string;
  userName: string;
  propFirmName: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userEmail, userName, propFirmName }: DeliveredNotification = await req.json();

    if (!userEmail || !userName || !propFirmName) {
      throw new Error("Missing required fields");
    }

    const emailResponse = await resend.emails.send({
      from: "TraderEdge Pro <noreply@traderedgepro.lovable.app>",
      to: [userEmail],
      subject: `Great News! ${propFirmName} is Now Available`,
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Prop Firm Request - Delivered</title>
</head>
<body style="margin: 0; padding: 0; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  
  <!-- Main Container -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        
        <!-- Content Card -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 520px; background-color: #ffffff;">
          
          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <img src="https://traderedgepro.lovable.app/lovable-uploads/b99a92c8-affc-462e-9f44-e5983cfdfd8a.png" alt="TraderEdge Pro" width="48" height="48" style="display: block;" />
            </td>
          </tr>
          
          <!-- Heading -->
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 600; color: #000000; letter-spacing: -0.5px;">
                Great News, ${userName}!
              </h1>
            </td>
          </tr>
          
          <!-- Subheading -->
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <p style="margin: 0; font-size: 16px; color: #666666; line-height: 1.6;">
                Your requested prop firm is now available for affiliate purchase.
              </p>
            </td>
          </tr>
          
          <!-- Prop Firm Card -->
          <tr>
            <td style="padding: 0 0 32px 0;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #000000; border-radius: 12px;">
                <tr>
                  <td style="padding: 24px; text-align: center;">
                    <p style="margin: 0 0 8px 0; font-size: 12px; color: #888888; text-transform: uppercase; letter-spacing: 1.5px;">
                      NOW AVAILABLE
                    </p>
                    <p style="margin: 0; font-size: 24px; font-weight: 600; color: #ffffff;">
                      ${propFirmName}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Message -->
          <tr>
            <td style="padding-bottom: 32px;">
              <p style="margin: 0; font-size: 15px; color: #444444; line-height: 1.7; text-align: center;">
                We've successfully partnered with <strong>${propFirmName}</strong> to bring you exclusive affiliate benefits. You can now purchase through our platform and unlock special perks.
              </p>
            </td>
          </tr>
          
          <!-- CTA Button -->
          <tr>
            <td align="center" style="padding-bottom: 40px;">
              <a href="https://traderedgepro.lovable.app/affiliates" 
                 style="display: inline-block; padding: 14px 32px; background-color: #000000; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 500; border-radius: 8px; letter-spacing: 0.3px;">
                View Affiliate Links →
              </a>
            </td>
          </tr>
          
          <!-- Divider -->
          <tr>
            <td style="padding-bottom: 24px;">
              <hr style="border: none; height: 1px; background-color: #eeeeee; margin: 0;" />
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td align="center">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #999999;">
                TraderEdge Pro
              </p>
              <p style="margin: 0; font-size: 11px; color: #cccccc;">
                This email was sent because you requested an affiliate partnership.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
  
</body>
</html>
      `,
    });

    console.log("Delivery notification sent:", emailResponse);

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error sending delivery notification:", error);
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
