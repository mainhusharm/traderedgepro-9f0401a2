import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: 'status_change' | 'new_message';
  sessionId: string;
  userId: string;
  newStatus?: string;
  messagePreview?: string;
  senderType?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { type, sessionId, userId, newStatus, messagePreview, senderType }: NotificationRequest = await req.json();

    console.log(`Processing ${type} notification for session ${sessionId}`);

    // Get user email from profiles or auth
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('user_id', userId)
      .single();

    const { data: authUser } = await supabase.auth.admin.getUserById(userId);
    const userEmail = authUser?.user?.email;
    const userName = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 'Trader';

    if (!userEmail) {
      console.log('No email found for user');
      return new Response(JSON.stringify({ error: 'No email found' }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Get session details
    const { data: session } = await supabase
      .from('guidance_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (!session) {
      return new Response(JSON.stringify({ error: 'Session not found' }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    let subject = '';
    let content = '';

    if (type === 'status_change') {
      const statusMessages: Record<string, { subject: string; message: string }> = {
        confirmed: {
          subject: '✅ Your Guidance Session is Confirmed!',
          message: 'Great news! Your guidance session has been confirmed. An expert will be available to assist you.'
        },
        in_progress: {
          subject: '🎯 Your Guidance Session is Starting!',
          message: 'Your guidance session is now in progress. Head to the Guidance tab to chat with your expert.'
        },
        completed: {
          subject: '🎉 Guidance Session Completed',
          message: 'Your guidance session has been marked as completed. We hope it was helpful!'
        },
        cancelled: {
          subject: '❌ Guidance Session Cancelled',
          message: 'Unfortunately, your guidance session has been cancelled. Please book a new session if needed.'
        }
      };

      const statusInfo = statusMessages[newStatus || ''] || {
        subject: 'Guidance Session Update',
        message: `Your session status has been updated to: ${newStatus}`
      };

      subject = statusInfo.subject;
      content = statusInfo.message;
    } else if (type === 'new_message') {
      if (senderType === 'admin') {
        subject = '💬 New Message from Trading Expert';
        content = `You have a new message regarding your "${session.topic}" session. ${messagePreview ? `Preview: "${messagePreview.substring(0, 100)}${messagePreview.length > 100 ? '...' : ''}"` : ''}`;
      } else {
        // Don't send notification to user for their own messages
        return new Response(JSON.stringify({ success: true, skipped: true }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
    }

    const emailResponse = await resend.emails.send({
      from: "TraderEdge Pro <guidance@traderedgepro.com>",
      to: [userEmail],
      subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; background-color: #0a0a0a;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 40px; border: 1px solid rgba(255,255,255,0.1);">
              <h1 style="color: #ffffff; font-size: 24px; margin: 0 0 16px 0;">${subject}</h1>
              
              <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                <p style="color: #ffffff; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
                  Hi ${userName},
                </p>
                <p style="color: #a0a0a0; font-size: 14px; line-height: 1.6; margin: 0;">
                  ${content}
                </p>
              </div>
              
              <div style="background: rgba(99, 102, 241, 0.1); border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <p style="color: #6366f1; font-size: 14px; margin: 0;">
                  <strong>Session:</strong> ${session.topic}<br>
                  <strong>Session #:</strong> ${session.session_number}
                </p>
              </div>
              
              <div style="text-align: center;">
                <a href="${req.headers.get('origin') || 'https://your-app.lovable.app'}/dashboard?tab=guidance" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 14px;">
                  View Session
                </a>
              </div>
            </div>
            
            <p style="color: #666666; font-size: 12px; text-align: center; margin-top: 24px;">
              © ${new Date().getFullYear()} TradingNexus. All rights reserved.
            </p>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Notification email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending notification:", error);
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
