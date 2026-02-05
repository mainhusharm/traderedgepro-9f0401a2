import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface RejectionEmailRequest {
  email: string;
  planName: string;
  rejectionReason: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, planName, rejectionReason }: RejectionEmailRequest = await req.json();

    console.log(`Sending rejection email to ${email} for ${planName} plan`);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "TraderEdge Pro <payments@traderedgepro.com>",
        to: [email],
        subject: "Payment Verification Update - Action Required",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1);">
                    <tr>
                      <td style="padding: 40px 40px 20px; text-align: center;">
                        <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #ef4444, #dc2626); border-radius: 12px; margin: 0 auto 20px;">
                          <span style="font-size: 24px; line-height: 60px;">⚠️</span>
                        </div>
                        <h1 style="color: #ef4444; font-size: 28px; margin: 0 0 8px; font-weight: 700;">Payment Verification Issue</h1>
                        <p style="color: #a1a1aa; font-size: 16px; margin: 0;">Your payment for the ${planName} plan could not be verified</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 20px 40px;">
                        <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                          <h2 style="color: #ef4444; font-size: 16px; margin: 0 0 12px; font-weight: 600;">Reason:</h2>
                          <p style="color: #fecaca; font-size: 14px; margin: 0; line-height: 1.6;">
                            ${rejectionReason || 'Transaction could not be verified on the blockchain. Please ensure you sent the correct amount to the correct wallet address.'}
                          </p>
                        </div>
                        
                        <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                          <h3 style="color: #3b82f6; font-size: 16px; margin: 0 0 12px; font-weight: 600;">What to do next:</h3>
                          <ul style="color: #d4d4d8; font-size: 14px; line-height: 1.8; padding-left: 20px; margin: 0;">
                            <li>Double-check the transaction on the blockchain explorer</li>
                            <li>Ensure the correct amount was sent to the correct wallet</li>
                            <li>Try submitting your payment again with the correct transaction ID</li>
                            <li>Contact support if you believe this is an error</li>
                          </ul>
                        </div>
                        
                        <div style="text-align: center; margin-bottom: 24px;">
                          <a href="https://traderedge.app/membership" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                            Try Payment Again
                          </a>
                        </div>
                        
                        <p style="color: #71717a; font-size: 14px; text-align: center; margin: 0;">
                          Need help? Reply to this email or contact our support team.
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 24px 40px 40px; border-top: 1px solid rgba(255,255,255,0.1);">
                        <p style="color: #52525b; font-size: 11px; margin: 0; text-align: center;">
                          © ${new Date().getFullYear()} TraderEdge. All rights reserved.
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
      }),
    });

    const data = await res.json();
    console.log("Rejection email sent:", data);

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    console.error("Error sending rejection email:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
