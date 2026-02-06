import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface RatingNotificationRequest {
  agentEmail: string;
  agentName: string;
  sessionNumber: string;
  topic: string;
  rating: number;
  feedback?: string;
  userName: string;
}

// Generate star display
function getStarDisplay(rating: number): string {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating);
}

// Get rating label
function getRatingLabel(rating: number): string {
  switch (rating) {
    case 1: return 'Poor';
    case 2: return 'Fair';
    case 3: return 'Good';
    case 4: return 'Very Good';
    case 5: return 'Excellent';
    default: return '';
  }
}

// Get rating color
function getRatingColor(rating: number): string {
  if (rating >= 4) return '#22c55e';
  if (rating >= 3) return '#eab308';
  return '#ef4444';
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Rating notification function called");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: RatingNotificationRequest = await req.json();
    console.log("Sending rating notification to agent:", data.agentEmail);
    
    const starDisplay = getStarDisplay(data.rating);
    const ratingLabel = getRatingLabel(data.rating);
    const ratingColor = getRatingColor(data.rating);

    const emailResponse = await resend.emails.send({
      from: "TraderEdge Pro <notifications@traderedgepro.com>",
      to: [data.agentEmail],
      subject: `New Rating: ${data.rating}/5 stars for session ${data.sessionNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; overflow: hidden;">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 40px 40px 20px; text-align: center;">
                      <div style="font-size: 40px; margin-bottom: 15px; color: #fbbf24;">${starDisplay}</div>
                      <h1 style="color: #ffffff; font-size: 24px; margin: 0 0 10px;">New Session Rating</h1>
                      <p style="color: #94a3b8; font-size: 16px; margin: 0;">You received feedback from ${data.userName}</p>
                    </td>
                  </tr>
                  
                  <!-- Rating Display -->
                  <tr>
                    <td style="padding: 0 40px;">
                      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: rgba(255,255,255,0.05); border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">
                        <tr>
                          <td style="padding: 24px; text-align: center;">
                            <div style="font-size: 64px; font-weight: bold; color: ${ratingColor}; margin-bottom: 8px;">${data.rating}</div>
                            <div style="font-size: 18px; color: ${ratingColor}; font-weight: 600;">${ratingLabel}</div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Session Details -->
                  <tr>
                    <td style="padding: 20px 40px;">
                      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: rgba(255,255,255,0.05); border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">
                        <tr>
                          <td style="padding: 24px;">
                            <p style="color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px;">Session</p>
                            <p style="color: #ffffff; font-size: 16px; font-weight: 600; margin: 0 0 16px;">${data.sessionNumber}</p>
                            
                            <p style="color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px;">Topic</p>
                            <p style="color: #ffffff; font-size: 16px; margin: 0;">${data.topic}</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  ${data.feedback ? `
                  <!-- Feedback -->
                  <tr>
                    <td style="padding: 0 40px 20px;">
                      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: rgba(255,255,255,0.05); border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">
                        <tr>
                          <td style="padding: 24px;">
                            <p style="color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px;">💬 User Feedback</p>
                            <p style="color: #e2e8f0; font-size: 15px; line-height: 1.6; margin: 0; font-style: italic;">"${data.feedback}"</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  ` : ''}
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 20px 40px 30px; text-align: center; border-top: 1px solid rgba(255,255,255,0.1);">
                      <p style="color: #64748b; font-size: 12px; margin: 0;">
                        Keep up the great work! View all your ratings in the Agent Dashboard.<br>
                        © ${new Date().getFullYear()} Trading Pro. All rights reserved.
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
    });

    console.log("Rating notification sent:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-rating-notification function:", error);
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
