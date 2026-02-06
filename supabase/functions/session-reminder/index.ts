import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'https://esm.sh/resend@2.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const logoUrl = "https://raw.githubusercontent.com/anchalw11/photos/main/freepik_create_a_professional_3d_rendered_trading_platform_84327.png";
const appUrl = "https://traderedgepro.lovable.app";

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    const fiftyMinutesFromNow = new Date(now.getTime() + 50 * 60 * 1000);

    console.log(`Checking for sessions between ${fiftyMinutesFromNow.toISOString()} and ${oneHourFromNow.toISOString()}`);

    const { data: sessions, error: sessionsError } = await supabase
      .from('guidance_sessions')
      .select('*')
      .gte('scheduled_at', fiftyMinutesFromNow.toISOString())
      .lte('scheduled_at', oneHourFromNow.toISOString())
      .in('status', ['confirmed', 'in_progress']);

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError);
      throw sessionsError;
    }

    console.log(`Found ${sessions?.length || 0} sessions to remind`);

    const emailPromises = (sessions || []).map(async (session) => {
      try {
        const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(session.user_id);
        
        if (authError || !authUser?.user?.email) {
          console.error(`Could not get email for user ${session.user_id}:`, authError);
          return null;
        }

        const userEmail = authUser.user.email;
        const userName = authUser.user.user_metadata?.first_name || 'Trader';
        const scheduledAt = new Date(session.scheduled_at);
        const formattedTime = scheduledAt.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        });
        const formattedDate = scheduledAt.toLocaleDateString('en-US', { 
          weekday: 'long',
          month: 'long', 
          day: 'numeric' 
        });

        console.log(`Sending reminder to ${userEmail} for session ${session.session_number}`);

        const emailResult = await resend.emails.send({
          from: 'TraderEdge Pro <notifications@traderedgepro.com>',
          to: [userEmail],
          subject: `⏰ Reminder: Your Guidance Session Starts in 1 Hour`,
          html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Session Reminder</title>
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
                  <div style="display: inline-block; width: 64px; height: 64px; background: linear-gradient(135deg, rgba(34,197,94,0.2) 0%, rgba(22,163,74,0.2) 100%); border-radius: 50%; line-height: 64px; font-size: 28px;">⏰</div>
                </div>
                
                <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; text-align: center; color: #fafafa;">Your Session Starts Soon!</h1>
                <p style="margin: 0 0 24px 0; font-size: 15px; text-align: center; color: #a1a1aa;">
                  Hi ${userName}, this is a friendly reminder that your 1-on-1 guidance session is starting in about 1 hour.
                </p>
                
                <!-- Session Details -->
                <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                  <tr>
                    <td style="padding: 20px; background: linear-gradient(135deg, rgba(34,197,94,0.1) 0%, rgba(22,163,74,0.1) 100%); border: 1px solid rgba(34,197,94,0.3); border-radius: 12px;">
                      <table width="100%" border="0" cellpadding="0" cellspacing="0">
                        <tr><td style="font-size: 13px; color: #a1a1aa; padding-bottom: 12px;">Session:</td><td style="font-size: 14px; font-weight: 600; text-align: right; color: #fafafa; padding-bottom: 12px;">${session.session_number}</td></tr>
                        <tr><td style="font-size: 13px; color: #a1a1aa; padding-bottom: 12px;">Topic:</td><td style="font-size: 14px; font-weight: 600; text-align: right; color: #fafafa; padding-bottom: 12px;">${session.topic}</td></tr>
                        <tr><td style="font-size: 13px; color: #a1a1aa; padding-bottom: 12px;">Date:</td><td style="font-size: 14px; font-weight: 600; text-align: right; color: #fafafa; padding-bottom: 12px;">${formattedDate}</td></tr>
                        <tr><td style="font-size: 13px; color: #a1a1aa;">Time:</td><td style="font-size: 14px; font-weight: 600; text-align: right; color: #22c55e;">${formattedTime}</td></tr>
                      </table>
                    </td>
                  </tr>
                </table>
                
                <!-- CTA Button -->
                <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                  <tr>
                    <td align="center">
                      <a href="${appUrl}/dashboard?tab=guidance" style="display: inline-block; background-color: #fafafa; color: #18181b; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: 600; font-size: 14px;">
                        Open Dashboard
                      </a>
                    </td>
                  </tr>
                </table>
                
                <!-- Tip -->
                <div style="background: rgba(255,255,255,0.05); border: 1px solid #27272a; border-radius: 8px; padding: 16px; text-align: center;">
                  <p style="margin: 0; font-size: 14px; color: #a1a1aa;">
                    💡 <strong style="color: #fafafa;">Tip:</strong> Make sure you have your trading journal and any questions ready for the session!
                  </p>
                </div>
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
          <p style="margin: 0; font-size: 11px; color: #52525b;">
            <a href="${appUrl}" style="color: #22c55e; text-decoration: none;">traderedgepro.lovable.app</a>
          </p>
        </td>
      </tr>
      
      <tr><td height="40">&nbsp;</td></tr>
    </table>
  </center>
</body>
</html>
          `,
        });

        console.log(`Email sent successfully to ${userEmail}:`, emailResult);
        return { success: true, email: userEmail, sessionId: session.id };
      } catch (emailError) {
        console.error(`Error sending reminder for session ${session.id}:`, emailError);
        return { success: false, sessionId: session.id, error: emailError };
      }
    });

    const results = await Promise.all(emailPromises);
    const successful = results.filter(r => r?.success).length;
    const failed = results.filter(r => r && !r.success).length;

    console.log(`Session reminders complete: ${successful} sent, ${failed} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: successful, 
        failed,
        sessionsFound: sessions?.length || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Session reminder error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
