import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logoUrl = "https://raw.githubusercontent.com/anchalw11/photos/main/freepik_create_a_professional_3d_rendered_trading_platform_84327.png";
const appUrl = "https://traderedgepro.lovable.app";

interface PaymentReceiptRequest {
  email: string;
  planName: string;
  amount: number;
  paymentMethod: string;
  transactionId?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, planName, amount, paymentMethod, transactionId }: PaymentReceiptRequest = await req.json();

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "TraderEdge Pro <payments@traderedgepro.com>",
        to: [email],
        subject: "Payment Received - Pending Verification",
        html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Payment Receipt</title>
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
                  <div style="display: inline-block; width: 64px; height: 64px; background: linear-gradient(135deg, rgba(245,158,11,0.2) 0%, rgba(234,179,8,0.2) 100%); border-radius: 50%; line-height: 64px; font-size: 28px;">⏳</div>
                </div>
                
                <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; text-align: center; color: #fafafa;">Payment Received!</h1>
                <p style="margin: 0 0 24px 0; font-size: 15px; text-align: center; color: #a1a1aa;">Your payment is pending verification.</p>
                
                <!-- Payment Details -->
                <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                  <tr>
                    <td style="padding: 24px; background: linear-gradient(135deg, rgba(245,158,11,0.1) 0%, rgba(234,179,8,0.1) 100%); border: 1px solid rgba(245,158,11,0.2); border-radius: 12px;">
                      <table width="100%" border="0" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="color: #a1a1aa; font-size: 14px; padding: 8px 0;">Plan:</td>
                          <td style="color: #fafafa; font-size: 14px; padding: 8px 0; text-align: right; font-weight: 600;">${planName}</td>
                        </tr>
                        <tr>
                          <td style="color: #a1a1aa; font-size: 14px; padding: 8px 0;">Amount:</td>
                          <td style="color: #fafafa; font-size: 14px; padding: 8px 0; text-align: right; font-weight: 600;">$${amount.toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td style="color: #a1a1aa; font-size: 14px; padding: 8px 0;">Payment Method:</td>
                          <td style="color: #fafafa; font-size: 14px; padding: 8px 0; text-align: right; font-weight: 600;">${paymentMethod}</td>
                        </tr>
                        <tr>
                          <td style="color: #a1a1aa; font-size: 14px; padding: 8px 0;">Status:</td>
                          <td style="color: #f59e0b; font-size: 14px; padding: 8px 0; text-align: right; font-weight: 600;">Pending Verification ⏳</td>
                        </tr>
                        ${transactionId ? `
                        <tr>
                          <td style="color: #a1a1aa; font-size: 14px; padding: 8px 0;">Transaction ID:</td>
                          <td style="color: #71717a; font-size: 12px; padding: 8px 0; text-align: right; font-family: monospace;">${transactionId.slice(0, 20)}...</td>
                        </tr>
                        ` : ''}
                      </table>
                    </td>
                  </tr>
                </table>
                
                <!-- What happens next -->
                <div style="background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.2); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                  <h3 style="color: #3b82f6; font-size: 14px; margin: 0 0 12px 0; font-weight: 600;">What happens next?</h3>
                  <ol style="color: #d4d4d8; font-size: 14px; line-height: 1.8; padding-left: 20px; margin: 0;">
                    <li>Our team will verify your payment (usually within 24 hours)</li>
                    <li>You will receive an email confirmation once verified</li>
                    <li>Your full membership access will be activated automatically</li>
                  </ol>
                </div>
                
                <p style="color: #71717a; font-size: 14px; text-align: center; margin: 0;">
                  If you have any questions, please contact our support team.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      
      <tr><td height="32">&nbsp;</td></tr>
      
      <!-- Footer -->
      <tr>
        <td align="center" style="padding: 0 20px; border-top: 1px solid #27272a; padding-top: 32px;">
          <p style="margin: 0; font-size: 12px; color: #52525b;">© ${new Date().getFullYear()} TraderEdge Pro. All rights reserved.</p>
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
    console.log("Payment receipt email sent:", data);

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    console.error("Error sending payment receipt:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
