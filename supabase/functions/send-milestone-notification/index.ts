import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface MilestoneNotificationRequest {
  email: string;
  userName: string;
  milestoneName: string;
  milestoneDescription: string;
  currentPnl: number;
  nextMilestoneTarget: number | null;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      email, 
      userName, 
      milestoneName, 
      milestoneDescription,
      currentPnl,
      nextMilestoneTarget
    }: MilestoneNotificationRequest = await req.json();

    const nextMilestoneText = nextMilestoneTarget 
      ? `<p style="color: #9ca3af; font-size: 14px; margin-top: 16px;">
          🎯 <strong>Next Goal:</strong> Reach $${nextMilestoneTarget.toFixed(0)} P&L to unlock the next milestone!
        </p>`
      : `<p style="color: #10b981; font-size: 14px; margin-top: 16px;">
          🏆 <strong>Congratulations!</strong> You've unlocked all milestones!
        </p>`;

    const emailResponse = await resend.emails.send({
      from: "TraderEdge Pro <milestones@traderedgepro.com>",
      to: [email],
      subject: `🎉 Milestone Unlocked: ${milestoneName}!`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
              <!-- Header -->
              <div style="text-align: center; margin-bottom: 40px;">
                <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #3b82f6, #8b5cf6); border-radius: 20px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                  <span style="font-size: 40px;">🏆</span>
                </div>
                <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 8px;">Milestone Unlocked!</h1>
                <p style="color: #9ca3af; font-size: 16px; margin: 0;">Congratulations on your trading progress</p>
              </div>

              <!-- Content Card -->
              <div style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1)); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; padding: 32px;">
                <p style="color: #ffffff; font-size: 16px; margin: 0 0 24px;">
                  Hey ${userName || 'Trader'},
                </p>
                
                <p style="color: #d1d5db; font-size: 16px; margin: 0 0 24px; line-height: 1.6;">
                  Amazing work! You've just unlocked <strong style="color: #3b82f6;">${milestoneName}</strong> - ${milestoneDescription}!
                </p>

                <!-- Stats Box -->
                <div style="background: rgba(0, 0, 0, 0.3); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                      <p style="color: #9ca3af; font-size: 12px; margin: 0 0 4px; text-transform: uppercase;">Current P&L</p>
                      <p style="color: #10b981; font-size: 24px; font-weight: bold; margin: 0;">$${currentPnl.toFixed(2)}</p>
                    </div>
                    <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #10b981, #3b82f6); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                      <span style="font-size: 28px;">✓</span>
                    </div>
                  </div>
                </div>

                <p style="color: #d1d5db; font-size: 16px; margin: 0 0 16px; line-height: 1.6;">
                  This milestone unlocks new high-confidence trading signals tailored to your progress. Keep up the momentum!
                </p>

                ${nextMilestoneText}

                <!-- CTA Button -->
                <a href="https://traderedge.com/dashboard" style="display: block; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: #ffffff; text-align: center; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; margin-top: 24px;">
                  View New Signals →
                </a>
              </div>

              <!-- Footer -->
              <div style="text-align: center; margin-top: 40px;">
                <p style="color: #6b7280; font-size: 12px; margin: 0;">
                  Keep trading smart. Keep winning.
                </p>
                <p style="color: #4b5563; font-size: 12px; margin: 8px 0 0;">
                  © 2024 TraderEdge. All rights reserved.
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Milestone notification email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-milestone-notification function:", error);
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
