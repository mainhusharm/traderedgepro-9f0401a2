import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logoUrl = "https://raw.githubusercontent.com/anchalw11/photos/main/freepik_create_a_professional_3d_rendered_trading_platform_84327.png";
const appUrl = "https://traderedgepro.lovable.app";

interface BookingConfirmationRequest {
  userEmail: string;
  userName: string;
  sessionNumber: string;
  topic: string;
  scheduledAt: string;
  description?: string;
}

function generateICS(data: BookingConfirmationRequest): string {
  const startDate = new Date(data.scheduledAt);
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
  
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };
  
  const uid = `${data.sessionNumber}@traderedgepro.com`;
  const now = formatDate(new Date());
  
  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//TraderEdge Pro//Guidance Session//EN
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${now}
DTSTART:${formatDate(startDate)}
DTEND:${formatDate(endDate)}
SUMMARY:Trading Guidance Session - ${data.topic}
DESCRIPTION:Your guidance session on "${data.topic}"${data.description ? `\\n\\nDetails: ${data.description}` : ''}\\n\\nSession ID: ${data.sessionNumber}
LOCATION:Online Video Call
STATUS:CONFIRMED
ORGANIZER;CN=TraderEdge Pro:mailto:guidance@traderedgepro.com
ATTENDEE;CN=${data.userName};RSVP=TRUE:mailto:${data.userEmail}
BEGIN:VALARM
TRIGGER:-PT30M
ACTION:DISPLAY
DESCRIPTION:Your guidance session starts in 30 minutes
END:VALARM
BEGIN:VALARM
TRIGGER:-PT5M
ACTION:DISPLAY
DESCRIPTION:Your guidance session starts in 5 minutes
END:VALARM
END:VEVENT
END:VCALENDAR`;
}

function formatDisplayDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Booking confirmation function called");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: BookingConfirmationRequest = await req.json();
    console.log("Sending booking confirmation to:", data.userEmail);
    
    const icsContent = generateICS(data);
    const icsBase64 = btoa(icsContent);
    const formattedDate = formatDisplayDate(data.scheduledAt);

    const emailResponse = await resend.emails.send({
      from: "TraderEdge Pro <bookings@traderedgepro.com>",
      to: [data.userEmail],
      subject: `Session Confirmed: ${data.topic} - ${data.sessionNumber}`,
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Session Confirmed</title>
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
                  <div style="display: inline-block; width: 64px; height: 64px; background: linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(139,92,246,0.2) 100%); border-radius: 50%; line-height: 64px; font-size: 28px;">📅</div>
                </div>
                
                <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; text-align: center; color: #fafafa;">Session Confirmed!</h1>
                <p style="margin: 0 0 24px 0; font-size: 15px; text-align: center; color: #a1a1aa;">Your guidance session has been booked.</p>
                
                <!-- Session Details -->
                <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                  <tr>
                    <td style="padding: 24px; background: rgba(255,255,255,0.05); border: 1px solid #27272a; border-radius: 12px;">
                      <table width="100%" border="0" cellpadding="0" cellspacing="0">
                        <tr><td style="font-size: 12px; color: #71717a; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 4px;">Session ID</td></tr>
                        <tr><td style="font-size: 16px; font-weight: 600; color: #fafafa; padding-bottom: 16px;">${data.sessionNumber}</td></tr>
                        
                        <tr><td style="font-size: 12px; color: #71717a; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 4px;">Topic</td></tr>
                        <tr><td style="font-size: 18px; font-weight: 600; color: #fafafa; padding-bottom: 16px;">${data.topic}</td></tr>
                        
                        <tr><td style="font-size: 12px; color: #71717a; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 4px;">Date & Time</td></tr>
                        <tr><td style="font-size: 16px; font-weight: 600; color: #22c55e;">${formattedDate}</td></tr>
                        
                        ${data.description ? `
                        <tr><td style="font-size: 12px; color: #71717a; text-transform: uppercase; letter-spacing: 0.5px; padding-top: 16px; padding-bottom: 4px;">Details</td></tr>
                        <tr><td style="font-size: 14px; color: #d4d4d8;">${data.description}</td></tr>
                        ` : ''}
                      </table>
                    </td>
                  </tr>
                </table>
                
                <!-- Calendar Note -->
                <div style="text-align: center; padding: 16px; background: rgba(255,255,255,0.03); border: 1px solid #27272a; border-radius: 8px; margin-bottom: 24px;">
                  <p style="margin: 0; font-size: 14px; color: #a1a1aa;">📎 Calendar invite attached to this email</p>
                </div>
                
                <!-- What to Expect -->
                <h3 style="color: #fafafa; font-size: 14px; margin: 0 0 12px 0; font-weight: 600;">What to Expect</h3>
                <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                  <tr>
                    <td style="padding: 8px 0;">
                      <span style="color: #22c55e; margin-right: 10px;">✓</span>
                      <span style="color: #d4d4d8; font-size: 14px;">Expert will contact you before the session</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;">
                      <span style="color: #22c55e; margin-right: 10px;">✓</span>
                      <span style="color: #d4d4d8; font-size: 14px;">Video call link will be shared 15 mins prior</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;">
                      <span style="color: #22c55e; margin-right: 10px;">✓</span>
                      <span style="color: #d4d4d8; font-size: 14px;">Session duration: approximately 1 hour</span>
                    </td>
                  </tr>
                </table>
                
                <!-- CTA Button -->
                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center">
                      <a href="${appUrl}/dashboard?tab=guidance" style="display: inline-block; background-color: #fafafa; color: #18181b; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: 600; font-size: 14px;">
                        View in Dashboard
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
          <p style="margin: 0; font-size: 11px; color: #52525b;">Questions? Reply to this email or visit your dashboard.</p>
        </td>
      </tr>
      
      <tr><td height="40">&nbsp;</td></tr>
    </table>
  </center>
</body>
</html>
      `,
      attachments: [
        {
          filename: `session-${data.sessionNumber}.ics`,
          content: icsBase64
        }
      ]
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-booking-confirmation function:", error);
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
