import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface BadgeNotificationRequest {
  email: string;
  firstName: string;
  badgeName: string;
  badgeDescription: string;
  totalReferrals: number;
}

const getBadgeEmoji = (badgeName: string): string => {
  const emojiMap: Record<string, string> = {
    "First Steps": "⭐",
    "Rising Star": "⚡",
    "Influencer": "🚀",
    "Champion": "🏆",
    "Legend": "👑",
  };
  return emojiMap[badgeName] || "🎉";
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, firstName, badgeName, badgeDescription, totalReferrals }: BadgeNotificationRequest = await req.json();

    if (!email || !badgeName) {
      return new Response(
        JSON.stringify({ error: "Email and badge name are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Sending badge notification to ${email} for badge: ${badgeName}`);

    const emoji = getBadgeEmoji(badgeName);
    const displayName = firstName || "Trader";

    const emailResponse = await resend.emails.send({
      from: "TraderEdge Pro <badges@traderedgepro.com>",
      to: [email],
      subject: `${emoji} Congratulations! You've unlocked the "${badgeName}" badge!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0f; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="100%" max-width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(180deg, #1a1a2e 0%, #16162a 100%); border-radius: 16px; overflow: hidden; max-width: 600px;">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 40px 40px 20px; text-align: center;">
                      <div style="font-size: 64px; margin-bottom: 16px;">${emoji}</div>
                      <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 8px;">Achievement Unlocked!</h1>
                      <p style="color: #9ca3af; font-size: 16px; margin: 0;">Congratulations, ${displayName}!</p>
                    </td>
                  </tr>
                  
                  <!-- Badge Info -->
                  <tr>
                    <td style="padding: 20px 40px;">
                      <div style="background: linear-gradient(135deg, rgba(147, 51, 234, 0.2) 0%, rgba(79, 70, 229, 0.2) 100%); border: 1px solid rgba(147, 51, 234, 0.3); border-radius: 12px; padding: 24px; text-align: center;">
                        <h2 style="color: #a78bfa; font-size: 24px; margin: 0 0 8px;">${badgeName}</h2>
                        <p style="color: #d1d5db; font-size: 14px; margin: 0;">${badgeDescription}</p>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Stats -->
                  <tr>
                    <td style="padding: 20px 40px;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 8px; padding: 16px; text-align: center;">
                            <p style="color: #10b981; font-size: 32px; font-weight: bold; margin: 0;">${totalReferrals}</p>
                            <p style="color: #9ca3af; font-size: 12px; margin: 4px 0 0;">Total Referrals</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- CTA -->
                  <tr>
                    <td style="padding: 20px 40px 40px; text-align: center;">
                      <p style="color: #9ca3af; font-size: 14px; margin: 0 0 20px;">Keep referring friends to unlock more badges and earn more credits!</p>
                      <a href="https://traderedge.pro/profile" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 14px;">View Your Badges</a>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 24px 40px; background: rgba(0,0,0,0.3); text-align: center;">
                      <p style="color: #6b7280; font-size: 12px; margin: 0;">You're receiving this because you unlocked an achievement on TraderEdge Pro.</p>
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

    console.log("Badge notification sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailResponse }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error sending badge notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
