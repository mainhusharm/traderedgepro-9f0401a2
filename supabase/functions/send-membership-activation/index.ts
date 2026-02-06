import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logoUrl = "https://raw.githubusercontent.com/anchalw11/photos/main/freepik_create_a_professional_3d_rendered_trading_platform_84327.png";
const appUrl = "https://traderedgepro.lovable.app";

interface ActivationEmailRequest {
  email: string;
  planName: string;
  expiresAt: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, planName, expiresAt }: ActivationEmailRequest = await req.json();

    const formattedDate = new Date(expiresAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "TraderEdge Pro <membership@traderedgepro.com>",
        to: [email],
        subject: "🎉 Your Membership is Now Active!",
        html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Membership Activated</title>
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; display: block; }
    table { border-collapse: collapse !important; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #09090b; font-family: 'Inter', Helvetica, Arial, sans-serif; color: #fafafa; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #09090b;">
  <center style="width: 100%; background-color: #09090b;">
    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #09090b;">
      <tr><td height="40">&nbsp;</td></tr>
      
      <!-- Logo -->
      <tr>
        <td align="center" style="padding: 0 20px;">
          <table border="0" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center">
                <div style="border: 1px solid #27272a; background-color: #18181b; border-radius: 8px; padding: 8px;">
                  <img src="${logoUrl}" alt="TraderEdge Logo" width="32" height="32" style="display: block; width: 32px; height: 32px; border-radius: 4px;">
                </div>
              </td>
              <td width="12"></td>
              <td style="font-size: 18px; font-weight: 700; color: #fafafa; letter-spacing: -0.5px;">TraderEdge Pro</td>
            </tr>
          </table>
        </td>
      </tr>
      
      <tr><td height="32">&nbsp;</td></tr>
      
      <!-- Main Card -->
      <tr>
        <td style="padding: 0 16px;">
          <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #18181b; border: 1px solid #27272a; border-radius: 12px;">
            <tr>
              <td style="padding: 40px 32px;">
                <div style="text-align: center; margin-bottom: 24px;">
                  <div style="display: inline-block; width: 64px; height: 64px; background: linear-gradient(135deg, rgba(34,197,94,0.2) 0%, rgba(22,163,74,0.2) 100%); border-radius: 50%; line-height: 64px; font-size: 28px;">🎉</div>
                </div>
                
                <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; text-align: center; color: #fafafa;">Welcome to TraderEdge!</h1>
                <p style="margin: 0 0 24px 0; font-size: 15px; text-align: center; color: #a1a1aa;">Your membership has been activated successfully.</p>
                
                <!-- Membership Details -->
                <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                  <tr>
                    <td style="padding: 24px; background: linear-gradient(135deg, rgba(34,197,94,0.1) 0%, rgba(22,163,74,0.1) 100%); border: 1px solid rgba(34,197,94,0.2); border-radius: 12px;">
                      <table width="100%" border="0" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="color: #a1a1aa; font-size: 14px; padding: 8px 0;">Plan:</td>
                          <td style="color: #fafafa; font-size: 14px; padding: 8px 0; text-align: right; font-weight: 600;">${planName}</td>
                        </tr>
                        <tr>
                          <td style="color: #a1a1aa; font-size: 14px; padding: 8px 0;">Status:</td>
                          <td style="color: #22c55e; font-size: 14px; padding: 8px 0; text-align: right; font-weight: 600;">Active ✓</td>
                        </tr>
                        <tr>
                          <td style="color: #a1a1aa; font-size: 14px; padding: 8px 0;">Valid Until:</td>
                          <td style="color: #fafafa; font-size: 14px; padding: 8px 0; text-align: right; font-weight: 600;">${formattedDate}</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
                
                <p style="color: #a1a1aa; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0; text-align: center;">
                  Your payment has been verified and your full membership access is now active.
                </p>
                
                <!-- CTA Button -->
                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center">
                      <a href="${appUrl}/dashboard" style="display: inline-block; background-color: #fafafa; color: #18181b; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 14px;">
                        Go to Dashboard →
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      
      <tr><td height="32">&nbsp;</td></tr>
      
      <!-- Footer -->
      <tr>
        <td align="center" style="padding: 0 20px; border-top: 1px solid #27272a; padding-top: 32px;">
          <p style="margin: 0 0 8px; font-size: 12px; color: #52525b;">© ${new Date().getFullYear()} TraderEdge Pro. All rights reserved.</p>
          <p style="margin: 0; font-size: 11px; color: #52525b;">Need help? Contact our support team.</p>
        </td>
      </tr>
      
      <tr><td height="40">&nbsp;</td></tr>
    </table>
  </center>
</body>
</html>
        `,
      }),
    });

    const data = await res.json();
    console.log("Activation email sent successfully:", data);

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    console.error("Error sending activation email:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
