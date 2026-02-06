import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const generateReminderEmail = (daysRemaining: number, planName: string, expiresAt: string) => {
  const urgencyColor = daysRemaining === 1 ? '#ef4444' : daysRemaining === 3 ? '#f59e0b' : '#3b82f6';
  const urgencyText = daysRemaining === 1 ? 'URGENT' : daysRemaining === 3 ? 'Important' : 'Reminder';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0a; color: #ffffff; margin: 0; padding: 40px 20px; }
        .container { max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a2e 0%, #0f0f1a 100%); border-radius: 16px; padding: 40px; border: 1px solid rgba(255,255,255,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { font-size: 28px; font-weight: bold; background: linear-gradient(90deg, #3b82f6, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .urgency-badge { display: inline-block; background: ${urgencyColor}; color: white; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase; margin-bottom: 20px; }
        .countdown { text-align: center; margin: 30px 0; }
        .days-number { font-size: 72px; font-weight: bold; color: ${urgencyColor}; line-height: 1; }
        .days-label { font-size: 18px; color: #71717a; margin-top: 8px; }
        h1 { color: #ffffff; margin: 0 0 20px 0; font-size: 24px; text-align: center; }
        .content { color: #a1a1aa; line-height: 1.6; }
        .details { background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .detail-row:last-child { border-bottom: none; }
        .detail-label { color: #71717a; }
        .detail-value { color: #ffffff; font-weight: 600; }
        .cta { display: block; text-align: center; background: linear-gradient(90deg, #3b82f6, #8b5cf6); color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 24px; }
        .benefits { margin: 24px 0; }
        .benefit { display: flex; align-items: center; gap: 12px; padding: 10px 0; color: #a1a1aa; }
        .benefit-icon { color: #22c55e; }
        .footer { text-align: center; margin-top: 30px; color: #71717a; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">TraderEdge Pro</div>
        </div>
        
        <div style="text-align: center;">
          <span class="urgency-badge">${urgencyText}</span>
        </div>
        
        <h1>Your Subscription is Expiring Soon</h1>
        
        <div class="countdown">
          <div class="days-number">${daysRemaining}</div>
          <div class="days-label">${daysRemaining === 1 ? 'Day' : 'Days'} Remaining</div>
        </div>
        
        <div class="content">
          <div class="details">
            <div class="detail-row">
              <span class="detail-label">Current Plan</span>
              <span class="detail-value">${planName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Expires On</span>
              <span class="detail-value">${new Date(expiresAt).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>
          
          <p style="text-align: center;">Don't lose access to these premium features:</p>
          
          <div class="benefits">
            <div class="benefit">
              <span class="benefit-icon">✓</span>
              <span>Real-time AI-powered trading signals</span>
            </div>
            <div class="benefit">
              <span class="benefit-icon">✓</span>
              <span>Advanced risk management tools</span>
            </div>
            <div class="benefit">
              <span class="benefit-icon">✓</span>
              <span>Personalized AI trading coach</span>
            </div>
            <div class="benefit">
              <span class="benefit-icon">✓</span>
              <span>Trade journal with analytics</span>
            </div>
          </div>
          
          <a href="https://traderedge.pro/renew" class="cta">Renew Now</a>
        </div>
        
        <div class="footer">
          <p>Keep trading with confidence - renew your subscription today!</p>
          <p>TraderEdge Pro - Your AI Trading Partner</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const reminderDays = [7, 3, 1];
    const results: { day: number; sent: number; errors: string[] }[] = [];

    for (const days of reminderDays) {
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + days);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0)).toISOString();
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999)).toISOString();

      // Find active memberships expiring on the target date
      const { data: memberships, error: membershipError } = await supabase
        .from('memberships')
        .select('id, user_id, plan_name, expires_at')
        .eq('status', 'active')
        .gte('expires_at', startOfDay)
        .lte('expires_at', endOfDay);

      if (membershipError) {
        console.error(`Error fetching memberships for ${days} days:`, membershipError);
        results.push({ day: days, sent: 0, errors: [membershipError.message] });
        continue;
      }

      let sentCount = 0;
      const errors: string[] = [];

      for (const membership of memberships || []) {
        // Get user email from auth.users via profiles
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(membership.user_id);

        if (userError || !userData?.user?.email) {
          errors.push(`Could not get email for user ${membership.user_id}`);
          continue;
        }

        const email = userData.user.email;
        const subject = days === 1 
          ? '⚠️ URGENT: Your Subscription Expires Tomorrow!'
          : days === 3 
          ? '⏰ 3 Days Left on Your TraderEdge Pro Subscription'
          : '📅 Your Subscription Expires in 7 Days';

        const html = generateReminderEmail(days, membership.plan_name, membership.expires_at!);

        try {
          const { error: emailError } = await resend.emails.send({
            from: 'TraderEdge Pro <notifications@traderedge.pro>',
            to: [email],
            subject,
            html,
          });

          if (emailError) {
            errors.push(`Failed to send to ${email}: ${emailError.message}`);
          } else {
            sentCount++;
            console.log(`Sent ${days}-day reminder to ${email}`);
          }
        } catch (sendError: any) {
          errors.push(`Exception sending to ${email}: ${sendError.message}`);
        }
      }

      results.push({ day: days, sent: sentCount, errors });
    }

    console.log('Subscription reminder results:', JSON.stringify(results, null, 2));

    return new Response(JSON.stringify({ success: true, results }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in subscription-reminders function:", error);
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
