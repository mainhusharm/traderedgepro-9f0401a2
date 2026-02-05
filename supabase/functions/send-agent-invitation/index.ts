import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const logoUrl = "https://raw.githubusercontent.com/anchalw11/photos/main/freepik_create_a_professional_3d_rendered_trading_platform_84327.png";
const rawSiteUrl = Deno.env.get("SITE_URL") || "https://traderedgepro.lovable.app";
const normalizeSiteUrl = (url: string) => {
  const withProto = /^https?:\/\//i.test(url) ? url : `https://${url}`;
  return withProto.replace(/\/+$/, "");
};
const SITE_URL = normalizeSiteUrl(rawSiteUrl);

interface InvitationRequest {
  email: string;
  name?: string;
  invitationToken: string;
  permissions?: {
    can_chat?: boolean;
    can_schedule?: boolean;
    can_view_all_sessions?: boolean;
    can_send_signals?: boolean;
  };
  inviteMessage?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, invitationToken, permissions, inviteMessage }: InvitationRequest = await req.json();

    const escapeHtml = (value: string) =>
      value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");

    const inviteUrl = new URL("/agent", SITE_URL);
    inviteUrl.searchParams.set("token", invitationToken);
    const invitationLink = inviteUrl.toString();

    const permissionsProvided = typeof permissions === 'object' && permissions !== null;
    const features = [
      { enabled: permissionsProvided ? !!permissions?.can_chat : true, label: 'Provide 1-on-1 guidance to traders' },
      { enabled: permissionsProvided ? !!permissions?.can_schedule : true, label: 'Schedule and manage trading sessions' },
      { enabled: permissionsProvided ? !!permissions?.can_send_signals : true, label: 'Send trading signals to users' },
      { enabled: permissionsProvided ? !!permissions?.can_view_all_sessions : true, label: 'View all sessions (admin-granted)' },
      { enabled: true, label: 'Access the Agent Dashboard' },
    ].filter((f) => f.enabled);

    console.log(`Sending agent invitation to ${email}`);
    console.log(`Invitation link: ${invitationLink}`);

    const emailResponse = await resend.emails.send({
      from: "TraderEdge Pro <invites@traderedgepro.com>",
      to: [email],
      subject: "🎉 You're Invited to Join TraderEdge Pro as an Expert",
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>TraderEdge Pro Invitation</title>
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
                  <div style="display: inline-block; width: 64px; height: 64px; background: linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(139,92,246,0.2) 100%); border-radius: 50%; line-height: 64px; font-size: 28px;">🎉</div>
                </div>
                
                <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; text-align: center; color: #fafafa;">You're Invited!</h1>
                <p style="margin: 0 0 24px 0; font-size: 15px; text-align: center; color: #a1a1aa;">
                  Hi${name ? ` <strong style="color: #fafafa;">${escapeHtml(name)}</strong>` : ''}, join TraderEdge Pro as a Trading Expert.
                </p>
                
                <!-- Features List -->
                <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                  ${features.map((f, idx) => `
                    <tr>
                      <td style="padding: 12px 16px; ${idx === 0 ? 'border-top-left-radius: 8px; border-top-right-radius: 8px;' : ''} ${idx === features.length - 1 ? 'border-bottom-left-radius: 8px; border-bottom-right-radius: 8px;' : ''} background: rgba(255,255,255,0.03); ${idx < features.length - 1 ? 'border-bottom: 1px solid #27272a;' : ''}">
                        <span style="color: #22c55e; font-size: 16px; margin-right: 12px;">✓</span>
                        <span style="color: #d4d4d8; font-size: 14px;">${escapeHtml(f.label)}</span>
                      </td>
                    </tr>
                  `).join('')}
                </table>
                
                ${inviteMessage?.trim() ? `
                  <div style="background: rgba(255,255,255,0.05); border: 1px solid #27272a; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                    <p style="margin: 0 0 8px 0; color: #a1a1aa; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Onboarding Notes</p>
                    <p style="margin: 0; color: #d4d4d8; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(inviteMessage.trim())}</p>
                  </div>
                ` : ''}
                
                <!-- CTA Button -->
                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center">
                      <a href="${invitationLink}" style="display: inline-block; background-color: #fafafa; color: #18181b; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 14px;">
                        Accept Invitation →
                      </a>
                    </td>
                  </tr>
                </table>
                
                <p style="margin: 24px 0 0 0; font-size: 12px; text-align: center; color: #71717a; line-height: 1.6;">
                  If the button doesn't work, copy and paste this link:<br>
                  <a href="${invitationLink}" style="color: #8b5cf6; word-break: break-all;">${invitationLink}</a>
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
          <p style="margin: 0 0 8px; font-size: 12px; color: #52525b;">© ${new Date().getFullYear()} TraderEdge Pro. All rights reserved.</p>
        </td>
      </tr>
      
      <tr><td height="40">&nbsp;</td></tr>
    </table>
  </center>
</body>
</html>
      `,
    });

    console.log("Invitation email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, invitationLink }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending invitation:", error);
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
