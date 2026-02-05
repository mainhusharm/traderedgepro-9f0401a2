import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logoUrl = "https://raw.githubusercontent.com/anchalw11/photos/main/freepik_create_a_professional_3d_rendered_trading_platform_84327.png";
const appUrl = "https://traderedgepro.lovable.app";
const heroImageUrl = "https://api.designfast.io/v1/illustration_library/findone?desc=futuristic%20dark%20mode%20trading%20dashboard%20interface%20with%20neon%20accents%20and%20data%20visualization&color=%233b82f6";

const generatePromoEmail = () => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Trade Smarter with AI</title>
    <style>
        /* Reset & Client Specifics */
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; display: block; }
        table { border-collapse: collapse !important; }
        body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #09090b; font-family: 'Inter', Helvetica, Arial, sans-serif; color: #fafafa; }
        
        /* Utility Classes */
        .wrapper { width: 100%; table-layout: fixed; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; background-color: #09090b; }
        .webkit { max-width: 600px; margin: 0 auto; }
        .outer-table { margin: 0 auto; width: 100%; max-width: 600px; }
        .card { background-color: #18181b; border: 1px solid #27272a; border-radius: 8px; }
        .text-muted { color: #a1a1aa; }
        .btn-primary { background-color: #fafafa; color: #18181b; border-radius: 6px; font-weight: 600; padding: 12px 24px; text-decoration: none; display: inline-block; mso-padding-alt: 0; text-align: center; }
        .btn-outline { background-color: transparent; color: #fafafa; border: 1px solid #27272a; border-radius: 6px; font-weight: 500; padding: 10px 20px; text-decoration: none; display: inline-block; }
        
        /* Mobile Responsive */
        @media screen and (max-width: 600px) {
            .two-col { width: 100% !important; max-width: 100% !important; display: block; }
            .three-col { width: 100% !important; max-width: 100% !important; display: block; padding-bottom: 20px; }
            .mobile-padding { padding-left: 20px !important; padding-right: 20px !important; }
            .mobile-center { text-align: center !important; }
            .hero-text { font-size: 32px !important; line-height: 40px !important; }
        }
    </style>
    <!--[if mso]>
    <style type="text/css">
    body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
    </style>
    <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #09090b;">

    <center class="wrapper">
        <div class="webkit">
            <table class="outer-table" align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #09090b;">
                
                <!-- Spacer -->
                <tr><td height="40" style="font-size: 40px; line-height: 40px;">&nbsp;</td></tr>

                <!-- Logo Section -->
                <tr>
                    <td align="center" class="mobile-padding">
                        <table border="0" cellpadding="0" cellspacing="0">
                            <tr>
                                <td align="center">
                                    <div style="border: 1px solid #27272a; background-color: #18181b; border-radius: 8px; padding: 8px;">
                                        <img src="${logoUrl}" alt="TraderEdge Logo" width="32" height="32" style="display: block; width: 32px; height: 32px; border-radius: 4px;">
                                    </div>
                                </td>
                                <td width="12"></td>
                                <td align="left" style="font-family: 'Inter', Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 700; color: #fafafa; letter-spacing: -0.5px;">
                                    TraderEdge Pro
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>

                <!-- Spacer -->
                <tr><td height="40" style="font-size: 40px; line-height: 40px;">&nbsp;</td></tr>

                <!-- Hero Image -->
                <tr>
                    <td align="center" class="mobile-padding">
                        <div style="border: 1px solid #27272a; border-radius: 12px; overflow: hidden; background-color: #18181b;">
                            <img src="${heroImageUrl}" alt="AI Trading Dashboard" width="600" style="width: 100%; max-width: 600px; display: block; height: auto;">
                        </div>
                    </td>
                </tr>

                <!-- Spacer -->
                <tr><td height="32" style="font-size: 32px; line-height: 32px;">&nbsp;</td></tr>

                <!-- Main Headlines -->
                <tr>
                    <td align="center" class="mobile-padding" style="font-family: 'Inter', Helvetica, Arial, sans-serif;">
                        <h1 class="hero-text" style="margin: 0; font-size: 42px; line-height: 48px; font-weight: 800; letter-spacing: -1px; font-style: italic; color: #ffffff;">
                            Trade Smarter,<br>Not Harder
                        </h1>
                        <p class="text-muted" style="margin: 16px 0 0; font-size: 18px; line-height: 28px; max-width: 480px; color: #a1a1aa;">
                            AI-powered signals trusted by prop traders worldwide. Institutional-grade precision at your fingertips.
                        </p>
                    </td>
                </tr>

                <!-- Spacer -->
                <tr><td height="48" style="font-size: 48px; line-height: 48px;">&nbsp;</td></tr>

                <!-- Feature Grid (3 Columns) -->
                <tr>
                    <td class="mobile-padding">
                        <table width="100%" border="0" cellpadding="0" cellspacing="0">
                            <tr>
                                <!-- Feature 1 -->
                                <td class="three-col" width="33.33%" valign="top" style="padding-right: 8px; padding-left: 8px;">
                                    <table width="100%" border="0" cellpadding="0" cellspacing="0" class="card" style="height: 100%; background-color: #18181b; border: 1px solid #27272a; border-radius: 8px;">
                                        <tr>
                                            <td style="padding: 24px 20px;">
                                                <div style="margin-bottom: 16px; font-size: 24px;">🎯</div>
                                                <h3 style="margin: 0 0 8px; font-size: 16px; font-weight: 600; color: #fafafa;">AI-Powered Signals</h3>
                                                <p class="text-muted" style="margin: 0; font-size: 14px; line-height: 22px; color: #a1a1aa;">
                                                    Institutional-grade analysis with 85%+ accuracy.
                                                </p>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                                
                                <!-- Feature 2 -->
                                <td class="three-col" width="33.33%" valign="top" style="padding-right: 8px; padding-left: 8px;">
                                    <table width="100%" border="0" cellpadding="0" cellspacing="0" class="card" style="height: 100%; background-color: #18181b; border: 1px solid #27272a; border-radius: 8px;">
                                        <tr>
                                            <td style="padding: 24px 20px;">
                                                <div style="margin-bottom: 16px; font-size: 24px;">🛡️</div>
                                                <h3 style="margin: 0 0 8px; font-size: 16px; font-weight: 600; color: #fafafa;">Risk Management</h3>
                                                <p class="text-muted" style="margin: 0; font-size: 14px; line-height: 22px; color: #a1a1aa;">
                                                    Protect your capital with automated drawdown alerts.
                                                </p>
                                            </td>
                                        </tr>
                                    </table>
                                </td>

                                <!-- Feature 3 -->
                                <td class="three-col" width="33.33%" valign="top" style="padding-right: 8px; padding-left: 8px;">
                                    <table width="100%" border="0" cellpadding="0" cellspacing="0" class="card" style="height: 100%; background-color: #18181b; border: 1px solid #27272a; border-radius: 8px;">
                                        <tr>
                                            <td style="padding: 24px 20px;">
                                                <div style="margin-bottom: 16px; font-size: 24px;">⚡</div>
                                                <h3 style="margin: 0 0 8px; font-size: 16px; font-weight: 600; color: #fafafa;">Prop Firm Ready</h3>
                                                <p class="text-muted" style="margin: 0; font-size: 14px; line-height: 22px; color: #a1a1aa;">
                                                    Built specifically for FTMO, MyFundedFX, and more.
                                                </p>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>

                <!-- Spacer -->
                <tr><td height="48" style="font-size: 48px; line-height: 48px;">&nbsp;</td></tr>

                <!-- Free Plan "Kickstarter" Section -->
                <tr>
                    <td class="mobile-padding" style="padding: 0 8px;">
                        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #18181b; border: 1px solid #27272a; border-radius: 12px; overflow: hidden;">
                            <tr>
                                <td align="center" style="padding: 40px 32px; border-bottom: 1px solid #27272a;">
                                    <span style="font-family: 'Inter', Helvetica, Arial, sans-serif; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #ffffff; background-color: #27272a; padding: 4px 12px; border-radius: 99px;">Free Forever</span>
                                    <h2 style="margin: 24px 0 12px; font-size: 28px; font-weight: 700; color: #fafafa;">Kickstarter Package</h2>
                                    <p class="text-muted" style="margin: 0; font-size: 16px; line-height: 24px; color: #a1a1aa;">Everything you need to start trading smarter — completely free.</p>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 32px;">
                                    <!-- Checklist Grid -->
                                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                        <tr>
                                            <td class="two-col" width="50%" valign="top" style="padding-bottom: 16px;">
                                                <table border="0" cellspacing="0" cellpadding="0">
                                                    <tr>
                                                        <td width="24" valign="top"><span style="color: #ffffff; font-size: 16px;">✓</span></td>
                                                        <td style="font-size: 15px; color: #d4d4d8; padding-left: 8px;">Daily AI Signals</td>
                                                    </tr>
                                                </table>
                                            </td>
                                            <td class="two-col" width="50%" valign="top" style="padding-bottom: 16px;">
                                                <table border="0" cellspacing="0" cellpadding="0">
                                                    <tr>
                                                        <td width="24" valign="top"><span style="color: #ffffff; font-size: 16px;">✓</span></td>
                                                        <td style="font-size: 15px; color: #d4d4d8; padding-left: 8px;">Risk Calculator</td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td class="two-col" width="50%" valign="top" style="padding-bottom: 16px;">
                                                <table border="0" cellspacing="0" cellpadding="0">
                                                    <tr>
                                                        <td width="24" valign="top"><span style="color: #ffffff; font-size: 16px;">✓</span></td>
                                                        <td style="font-size: 15px; color: #d4d4d8; padding-left: 8px;">Trade Journal</td>
                                                    </tr>
                                                </table>
                                            </td>
                                            <td class="two-col" width="50%" valign="top" style="padding-bottom: 16px;">
                                                <table border="0" cellspacing="0" cellpadding="0">
                                                    <tr>
                                                        <td width="24" valign="top"><span style="color: #ffffff; font-size: 16px;">✓</span></td>
                                                        <td style="font-size: 15px; color: #d4d4d8; padding-left: 8px;">Economic Calendar</td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                    </table>
                                    
                                    <!-- Main CTA -->
                                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 24px;">
                                        <tr>
                                            <td align="center">
                                                <a href="${appUrl}/affiliates" class="btn-primary" style="display: block; width: 100%; background-color: #fafafa; color: #18181b; border-radius: 6px; font-weight: 600; padding: 12px 24px; text-decoration: none; text-align: center; font-size: 14px;">Get Started Free →</a>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>

                <!-- Spacer -->
                <tr><td height="40" style="font-size: 40px; line-height: 40px;">&nbsp;</td></tr>

                <!-- Upsell Section -->
                <tr>
                    <td align="center" class="mobile-padding">
                        <p style="margin: 0 0 16px; font-size: 16px; color: #d4d4d8;">Want VIP signals & 1-on-1 expert guidance?</p>
                        <a href="${appUrl}/affiliates" class="btn-outline" style="background-color: transparent; color: #fafafa; border: 1px solid #27272a; border-radius: 6px; font-weight: 500; padding: 10px 20px; text-decoration: none; display: inline-block;">Explore Pro Plans</a>
                    </td>
                </tr>

                <!-- Spacer -->
                <tr><td height="60" style="font-size: 60px; line-height: 60px;">&nbsp;</td></tr>

                <!-- Social Proof / Footer Logos -->
                <tr>
                    <td align="center" class="mobile-padding" style="border-top: 1px solid #27272a; padding-top: 40px;">
                        <p style="margin: 0 0 24px; font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; color: #71717a; font-weight: 600;">Trusted by 500+ prop traders worldwide</p>
                        
                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 400px;">
                            <tr>
                                <td align="center" width="33.33%" style="color: #52525b; font-weight: 700; font-size: 14px; font-family: monospace;">FTMO</td>
                                <td align="center" width="33.33%" style="color: #52525b; font-weight: 700; font-size: 14px; font-family: monospace;">MyFundedFX</td>
                                <td align="center" width="33.33%" style="color: #52525b; font-weight: 700; font-size: 14px; font-family: monospace;">The5ers</td>
                            </tr>
                        </table>
                    </td>
                </tr>

                <!-- Spacer -->
                <tr><td height="40" style="font-size: 40px; line-height: 40px;">&nbsp;</td></tr>

                <!-- Footer Legal -->
                <tr>
                    <td align="center" class="mobile-padding">
                        <p style="margin: 0 0 12px; font-size: 14px; color: #52525b;">© 2025 TraderEdge Pro. All rights reserved.</p>
                        <p style="margin: 0; font-size: 12px;">
                            <a href="${appUrl}/privacy" style="color: #52525b; text-decoration: underline;">Privacy</a>
                            <span style="color: #52525b; margin: 0 8px;">•</span>
                            <a href="${appUrl}/terms" style="color: #52525b; text-decoration: underline;">Terms</a>
                            <span style="color: #52525b; margin: 0 8px;">•</span>
                            <a href="#" style="color: #52525b; text-decoration: underline;">Unsubscribe</a>
                        </p>
                    </td>
                </tr>

                <!-- Spacer -->
                <tr><td height="40" style="font-size: 40px; line-height: 40px;">&nbsp;</td></tr>

            </table>
        </div>
    </center>
</body>
</html>
`;
};

interface PromoEmailRequest {
  email: string;
  subject?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, subject }: PromoEmailRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email address is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const emailSubject = subject || "Trade Smarter, Not Harder";
    const htmlContent = generatePromoEmail();

    console.log(`Sending promo email to: ${email}`);

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "TraderEdge Pro <hello@traderedgepro.com>",
        to: [email],
        subject: emailSubject,
        html: htmlContent,
      }),
    });

    const responseData = await emailResponse.json();
    
    if (!emailResponse.ok) {
      throw new Error(responseData.message || "Failed to send email");
    }

    console.log("Promo email sent successfully:", responseData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Promo email sent to ${email}`,
        data: responseData 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error sending promo email:", error);
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
