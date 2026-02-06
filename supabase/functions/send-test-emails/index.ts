import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logoUrl = "https://raw.githubusercontent.com/anchalw11/photos/main/freepik_create_a_professional_3d_rendered_trading_platform_84327.png";
const appUrl = "https://traderedgepro.lovable.app";

// Dark theme email wrapper matching the promo email design
const emailWrapper = (content: string, preheader: string = "") => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>TraderEdge Pro</title>
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; display: block; }
    table { border-collapse: collapse !important; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #09090b; font-family: 'Inter', Helvetica, Arial, sans-serif; color: #fafafa; }
    .wrapper { width: 100%; table-layout: fixed; background-color: #09090b; }
    .outer-table { margin: 0 auto; width: 100%; max-width: 600px; }
    .card { background-color: #18181b; border: 1px solid #27272a; border-radius: 12px; }
    .text-muted { color: #a1a1aa; }
    .btn-primary { background-color: #fafafa; color: #18181b; border-radius: 6px; font-weight: 600; padding: 14px 28px; text-decoration: none; display: inline-block; text-align: center; font-size: 14px; }
    @media screen and (max-width: 600px) {
      .mobile-padding { padding-left: 20px !important; padding-right: 20px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #09090b;">
  ${preheader ? `<div style="display: none; max-height: 0; overflow: hidden;">${preheader}</div>` : ''}
  <center class="wrapper">
    <table class="outer-table" align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #09090b;">
      <tr><td height="40">&nbsp;</td></tr>
      <!-- Logo -->
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
              <td style="font-size: 18px; font-weight: 700; color: #fafafa; letter-spacing: -0.5px;">TraderEdge Pro</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr><td height="32">&nbsp;</td></tr>
      <!-- Content Card -->
      <tr>
        <td class="mobile-padding" style="padding: 0 16px;">
          <table width="100%" border="0" cellpadding="0" cellspacing="0" class="card" style="background-color: #18181b; border: 1px solid #27272a; border-radius: 12px;">
            <tr>
              <td style="padding: 32px;">
                ${content}
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr><td height="32">&nbsp;</td></tr>
      <!-- Footer -->
      <tr>
        <td align="center" class="mobile-padding" style="border-top: 1px solid #27272a; padding-top: 32px;">
          <p style="margin: 0 0 8px; font-size: 12px; color: #52525b;">© 2025 TraderEdge Pro. All rights reserved.</p>
          <p style="margin: 0; font-size: 11px; color: #52525b;">
            <a href="${appUrl}/privacy" style="color: #52525b; text-decoration: underline;">Privacy</a>
            <span style="margin: 0 6px;">•</span>
            <a href="${appUrl}/terms" style="color: #52525b; text-decoration: underline;">Terms</a>
          </p>
        </td>
      </tr>
      <tr><td height="40">&nbsp;</td></tr>
    </table>
  </center>
</body>
</html>`;

const sendEmail = async (to: string, subject: string, html: string) => {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
    body: JSON.stringify({ from: "TraderEdge Pro <notifications@traderedgepro.com>", to: [to], subject, html }),
  });
  return res.json();
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { email, count } = await req.json();
    const targetEmail = email || "giggletales18@gmail.com";
    const maxEmails = count || 12;
    const results: { template: string; status: string; error?: string }[] = [];

    const templates = [
      { 
        name: "Signal Notification", 
        subject: "🔔 New Trading Signal — EUR/USD BUY", 
        html: emailWrapper(`
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="display: inline-block; padding: 6px 14px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; font-size: 11px; font-weight: 600; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px;">New Signal</span>
          </div>
          <h1 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 700; text-align: center; color: #fafafa;">EUR/USD</h1>
          <p style="margin: 0 0 24px 0; font-size: 16px; text-align: center;">
            <span style="display: inline-block; padding: 6px 16px; background: rgba(34, 197, 94, 0.2); color: #22c55e; font-weight: 600; border-radius: 6px;">BUY</span>
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
            <tr>
              <td style="padding: 20px; background: rgba(255,255,255,0.05); border: 1px solid #27272a; border-radius: 12px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr><td style="font-size: 13px; color: #a1a1aa; padding-bottom: 12px;">Entry Price</td><td style="font-size: 15px; font-weight: 600; text-align: right; color: #fafafa; padding-bottom: 12px;">1.0850</td></tr>
                  <tr><td style="font-size: 13px; color: #a1a1aa; padding-bottom: 12px;">Take Profit</td><td style="font-size: 15px; font-weight: 600; text-align: right; color: #22c55e; padding-bottom: 12px;">1.0920</td></tr>
                  <tr><td style="font-size: 13px; color: #a1a1aa;">Stop Loss</td><td style="font-size: 15px; font-weight: 600; text-align: right; color: #ef4444;">1.0800</td></tr>
                </table>
              </td>
            </tr>
          </table>
          <div style="text-align: center; padding: 16px; background: linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.15) 100%); border-radius: 12px; margin-bottom: 24px;">
            <span style="font-size: 13px; color: #a1a1aa;">Confidence Score</span>
            <p style="margin: 4px 0 0 0; font-size: 24px; font-weight: 700; color: #8b5cf6;">87%</p>
          </div>
          <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
            <a href="${appUrl}/dashboard?tab=signals" class="btn-primary" style="background-color: #fafafa; color: #18181b; border-radius: 6px; font-weight: 600; padding: 14px 28px; text-decoration: none; display: inline-block;">View in Dashboard →</a>
          </td></tr></table>
        `, "New trading signal: EUR/USD BUY @ 1.0850")
      },
      { 
        name: "VIP Signal", 
        subject: "⭐ VIP Signal Alert — XAU/USD SELL", 
        html: emailWrapper(`
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="display: inline-block; padding: 6px 14px; background: linear-gradient(135deg, #f59e0b 0%, #eab308 100%); color: #18181b; font-size: 11px; font-weight: 600; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px;">⭐ VIP Signal</span>
          </div>
          <h1 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 700; text-align: center; color: #fafafa;">XAU/USD</h1>
          <p style="margin: 0 0 24px 0; font-size: 16px; text-align: center;">
            <span style="display: inline-block; padding: 6px 16px; background: rgba(239, 68, 68, 0.2); color: #ef4444; font-weight: 600; border-radius: 6px;">SELL</span>
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
            <tr>
              <td style="padding: 20px; background: linear-gradient(135deg, rgba(245,158,11,0.1) 0%, rgba(234,179,8,0.1) 100%); border: 1px solid rgba(245,158,11,0.3); border-radius: 12px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr><td style="font-size: 13px; color: #a1a1aa; padding-bottom: 12px;">Entry</td><td style="font-size: 15px; font-weight: 600; text-align: right; color: #fafafa; padding-bottom: 12px;">2,045.50</td></tr>
                  <tr><td style="font-size: 13px; color: #a1a1aa; padding-bottom: 12px;">Take Profit</td><td style="font-size: 15px; font-weight: 600; text-align: right; color: #22c55e; padding-bottom: 12px;">2,020.00</td></tr>
                  <tr><td style="font-size: 13px; color: #a1a1aa;">Stop Loss</td><td style="font-size: 15px; font-weight: 600; text-align: right; color: #ef4444;">2,060.00</td></tr>
                </table>
              </td>
            </tr>
          </table>
          <div style="text-align: center; padding: 12px 16px; background: rgba(245,158,11,0.15); border-radius: 10px; margin-bottom: 24px;">
            <span style="font-size: 13px; color: #f59e0b; font-weight: 500;">✓ Reviewed by 4 Expert Analysts</span>
          </div>
          <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
            <a href="${appUrl}/dashboard?tab=signals" class="btn-primary" style="background: linear-gradient(135deg, #f59e0b 0%, #eab308 100%); color: #18181b; border-radius: 6px; font-weight: 600; padding: 14px 28px; text-decoration: none; display: inline-block;">Trade Now →</a>
          </td></tr></table>
        `, "VIP Signal: XAU/USD SELL - Reviewed by 4 experts")
      },
      { 
        name: "Membership Activation", 
        subject: "🎉 Welcome to TraderEdge Pro!", 
        html: emailWrapper(`
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; width: 64px; height: 64px; background: linear-gradient(135deg, rgba(34,197,94,0.2) 0%, rgba(22,163,74,0.2) 100%); border-radius: 50%; line-height: 64px; font-size: 28px;">🎉</div>
          </div>
          <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; text-align: center; color: #fafafa;">Welcome Aboard!</h1>
          <p style="margin: 0 0 24px 0; font-size: 15px; text-align: center; color: #a1a1aa; line-height: 1.6;">Your Pro membership is now active. You have full access to all premium features.</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
            <tr>
              <td style="padding: 24px; background: linear-gradient(135deg, rgba(34,197,94,0.1) 0%, rgba(22,163,74,0.1) 100%); border: 1px solid rgba(34,197,94,0.2); border-radius: 12px; text-align: center;">
                <span style="font-size: 12px; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.5px;">Your Plan</span>
                <p style="margin: 8px 0 0 0; font-size: 20px; font-weight: 700; color: #22c55e;">Pro Membership</p>
                <p style="margin: 4px 0 0 0; font-size: 13px; color: #a1a1aa;">Valid until Jan 8, 2027</p>
              </td>
            </tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
            <a href="${appUrl}/dashboard" class="btn-primary" style="background-color: #fafafa; color: #18181b; border-radius: 6px; font-weight: 600; padding: 14px 28px; text-decoration: none; display: inline-block;">Start Trading →</a>
          </td></tr></table>
        `, "Your Pro membership is now active!")
      },
      { 
        name: "Payment Receipt", 
        subject: "💳 Payment Confirmed — $199.00", 
        html: emailWrapper(`
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; width: 56px; height: 56px; background: linear-gradient(135deg, rgba(59,130,246,0.2) 0%, rgba(37,99,235,0.2) 100%); border-radius: 50%; line-height: 56px; font-size: 24px;">💳</div>
          </div>
          <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; text-align: center; color: #fafafa;">Payment Received</h1>
          <p style="margin: 0 0 24px 0; font-size: 15px; text-align: center; color: #a1a1aa;">Thank you for your payment.</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
            <tr><td style="padding: 20px; background: rgba(255,255,255,0.05); border: 1px solid #27272a; border-radius: 12px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="font-size: 13px; color: #a1a1aa; padding-bottom: 12px;">Plan</td><td style="font-size: 14px; font-weight: 500; text-align: right; color: #fafafa; padding-bottom: 12px;">Pro Monthly</td></tr>
                <tr><td style="font-size: 13px; color: #a1a1aa; padding-bottom: 12px;">Date</td><td style="font-size: 14px; text-align: right; color: #fafafa; padding-bottom: 12px;">${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</td></tr>
                <tr><td style="font-size: 13px; color: #a1a1aa; padding-bottom: 12px;">Transaction ID</td><td style="font-size: 12px; text-align: right; color: #71717a; font-family: monospace; padding-bottom: 12px;">TXN-2026-X7K9M</td></tr>
                <tr style="border-top: 1px solid #27272a;"><td style="font-size: 15px; font-weight: 600; color: #fafafa; padding-top: 12px;">Total</td><td style="font-size: 20px; font-weight: 700; text-align: right; color: #22c55e; padding-top: 12px;">$199.00</td></tr>
              </table>
            </td></tr>
          </table>
          <p style="margin: 0; font-size: 13px; text-align: center; color: #71717a;">A copy has been sent to your email for your records.</p>
        `, "Payment of $199.00 confirmed")
      },
      { 
        name: "Milestone", 
        subject: "🏆 Achievement Unlocked!", 
        html: emailWrapper(`
          <div style="text-align: center;">
            <div style="display: inline-block; width: 80px; height: 80px; background: linear-gradient(135deg, rgba(245,158,11,0.2) 0%, rgba(234,179,8,0.2) 100%); border-radius: 50%; line-height: 80px; font-size: 36px; margin-bottom: 20px;">🏆</div>
            <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: #fafafa;">First Profit!</h1>
            <p style="margin: 0 0 24px 0; font-size: 15px; color: #a1a1aa;">You've completed your first profitable trade.</p>
            <div style="padding: 20px; background: linear-gradient(135deg, rgba(245,158,11,0.1) 0%, rgba(234,179,8,0.1) 100%); border: 1px solid rgba(245,158,11,0.2); border-radius: 12px; margin-bottom: 24px;">
              <span style="font-size: 14px; color: #f59e0b; font-weight: 500;">+50 XP earned</span>
            </div>
            <a href="${appUrl}/achievements" class="btn-primary" style="background: linear-gradient(135deg, #f59e0b 0%, #eab308 100%); color: #18181b; border-radius: 6px; font-weight: 600; padding: 12px 24px; text-decoration: none; display: inline-block;">View Achievements</a>
          </div>
        `, "You unlocked a new achievement!")
      },
      { 
        name: "Badge Earned", 
        subject: "🎖️ New Badge: Risk Master", 
        html: emailWrapper(`
          <div style="text-align: center;">
            <div style="display: inline-block; width: 80px; height: 80px; background: linear-gradient(135deg, rgba(139,92,246,0.2) 0%, rgba(124,58,237,0.2) 100%); border-radius: 50%; line-height: 80px; font-size: 36px; margin-bottom: 20px;">🎖️</div>
            <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: #fafafa;">Risk Master</h1>
            <p style="margin: 0 0 24px 0; font-size: 15px; color: #a1a1aa; line-height: 1.6;">You maintained strict 2% risk management for 30 consecutive days.</p>
            <div style="padding: 16px 20px; background: rgba(255,255,255,0.05); border: 1px solid #27272a; border-radius: 10px; margin-bottom: 24px;">
              <span style="font-size: 13px; color: #a1a1aa;">Badge Rarity: </span>
              <span style="font-size: 13px; color: #8b5cf6; font-weight: 600;">Epic</span>
            </div>
            <a href="${appUrl}/achievements" class="btn-primary" style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: #ffffff; border-radius: 6px; font-weight: 600; padding: 12px 24px; text-decoration: none; display: inline-block;">View All Badges</a>
          </div>
        `, "You earned the Risk Master badge!")
      },
      { 
        name: "Booking Confirmation", 
        subject: "📅 Session Confirmed — Jan 15, 2026", 
        html: emailWrapper(`
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; width: 56px; height: 56px; background: linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(139,92,246,0.2) 100%); border-radius: 50%; line-height: 56px; font-size: 24px;">📅</div>
          </div>
          <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; text-align: center; color: #fafafa;">Session Confirmed</h1>
          <p style="margin: 0 0 24px 0; font-size: 15px; text-align: center; color: #a1a1aa;">Your 1-on-1 guidance session has been scheduled.</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
            <tr><td style="padding: 20px; background: rgba(255,255,255,0.05); border: 1px solid #27272a; border-radius: 12px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="font-size: 13px; color: #a1a1aa; padding-bottom: 12px;">Date</td><td style="font-size: 14px; font-weight: 600; text-align: right; color: #fafafa; padding-bottom: 12px;">January 15, 2026</td></tr>
                <tr><td style="font-size: 13px; color: #a1a1aa; padding-bottom: 12px;">Time</td><td style="font-size: 14px; font-weight: 600; text-align: right; color: #fafafa; padding-bottom: 12px;">10:00 AM UTC</td></tr>
                <tr><td style="font-size: 13px; color: #a1a1aa; padding-bottom: 12px;">Topic</td><td style="font-size: 14px; font-weight: 500; text-align: right; color: #fafafa; padding-bottom: 12px;">Risk Management</td></tr>
                <tr><td style="font-size: 13px; color: #a1a1aa;">Expert</td><td style="font-size: 14px; font-weight: 500; text-align: right; color: #fafafa;">John Smith</td></tr>
              </table>
            </td></tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
            <a href="${appUrl}/dashboard?tab=guidance" class="btn-primary" style="background-color: #fafafa; color: #18181b; border-radius: 6px; font-weight: 600; padding: 14px 28px; text-decoration: none; display: inline-block;">Add to Calendar</a>
          </td></tr></table>
        `, "Your guidance session is confirmed for Jan 15")
      },
      { 
        name: "Performance Report", 
        subject: "📈 Weekly Performance: +$1,245", 
        html: emailWrapper(`
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="display: inline-block; padding: 6px 14px; background: rgba(255,255,255,0.1); color: #a1a1aa; font-size: 11px; font-weight: 500; border-radius: 20px;">Weekly Report</span>
          </div>
          <h1 style="margin: 0 0 24px 0; font-size: 24px; font-weight: 700; text-align: center; color: #fafafa;">Great Week!</h1>
          <div style="text-align: center; padding: 24px; background: linear-gradient(135deg, rgba(34,197,94,0.15) 0%, rgba(22,163,74,0.15) 100%); border-radius: 12px; margin-bottom: 20px;">
            <span style="font-size: 12px; color: #a1a1aa; text-transform: uppercase;">Total Profit</span>
            <p style="margin: 8px 0 0 0; font-size: 32px; font-weight: 700; color: #22c55e;">+$1,245.50</p>
          </div>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
            <tr>
              <td style="width: 48%; padding: 16px; background: rgba(255,255,255,0.05); border: 1px solid #27272a; border-radius: 10px; text-align: center;">
                <span style="font-size: 12px; color: #a1a1aa;">Win Rate</span>
                <p style="margin: 4px 0 0 0; font-size: 20px; font-weight: 700; color: #fafafa;">78%</p>
              </td>
              <td style="width: 4%;"></td>
              <td style="width: 48%; padding: 16px; background: rgba(255,255,255,0.05); border: 1px solid #27272a; border-radius: 10px; text-align: center;">
                <span style="font-size: 12px; color: #a1a1aa;">Total Trades</span>
                <p style="margin: 4px 0 0 0; font-size: 20px; font-weight: 700; color: #fafafa;">24</p>
              </td>
            </tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
            <a href="${appUrl}/dashboard?tab=performance" class="btn-primary" style="background-color: #fafafa; color: #18181b; border-radius: 6px; font-weight: 600; padding: 14px 28px; text-decoration: none; display: inline-block;">View Full Report →</a>
          </td></tr></table>
        `, "Your weekly performance: +$1,245.50 profit")
      },
      { 
        name: "Session Reminder", 
        subject: "⏰ Session in 1 Hour", 
        html: emailWrapper(`
          <div style="text-align: center;">
            <div style="display: inline-block; width: 64px; height: 64px; background: linear-gradient(135deg, rgba(245,158,11,0.2) 0%, rgba(234,179,8,0.2) 100%); border-radius: 50%; line-height: 64px; font-size: 28px; margin-bottom: 20px;">⏰</div>
            <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: #fafafa;">Starting Soon!</h1>
            <p style="margin: 0 0 24px 0; font-size: 15px; color: #a1a1aa;">Your guidance session begins in 1 hour.</p>
            <div style="padding: 20px; background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.3); border-radius: 12px; margin-bottom: 24px;">
              <p style="margin: 0; font-size: 15px; font-weight: 600; color: #f59e0b;">Risk Management Strategy</p>
              <p style="margin: 4px 0 0 0; font-size: 14px; color: #d97706;">Today at 10:00 AM UTC</p>
            </div>
            <a href="${appUrl}/dashboard?tab=guidance" class="btn-primary" style="background: linear-gradient(135deg, #f59e0b 0%, #eab308 100%); color: #18181b; border-radius: 6px; font-weight: 600; padding: 12px 24px; text-decoration: none; display: inline-block;">Join Session</a>
          </div>
        `, "Your session starts in 1 hour")
      },
      { 
        name: "Daily Digest", 
        subject: "📊 Daily Digest — 87% Win Rate", 
        html: emailWrapper(`
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="display: inline-block; padding: 6px 14px; background: rgba(255,255,255,0.1); color: #a1a1aa; font-size: 11px; font-weight: 500; border-radius: 20px;">January 7, 2026</span>
          </div>
          <h1 style="margin: 0 0 24px 0; font-size: 24px; font-weight: 700; text-align: center; color: #fafafa;">Daily Digest</h1>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
            <tr>
              <td style="width: 48%; padding: 20px; background: rgba(255,255,255,0.05); border: 1px solid #27272a; border-radius: 12px; text-align: center;">
                <span style="font-size: 12px; color: #a1a1aa;">Signals</span>
                <p style="margin: 8px 0 0 0; font-size: 28px; font-weight: 700; color: #fafafa;">8</p>
              </td>
              <td style="width: 4%;"></td>
              <td style="width: 48%; padding: 20px; background: linear-gradient(135deg, rgba(34,197,94,0.15) 0%, rgba(22,163,74,0.15) 100%); border-radius: 12px; text-align: center;">
                <span style="font-size: 12px; color: #a1a1aa;">Win Rate</span>
                <p style="margin: 8px 0 0 0; font-size: 28px; font-weight: 700; color: #22c55e;">87%</p>
              </td>
            </tr>
          </table>
          <div style="padding: 16px; background: rgba(255,255,255,0.05); border: 1px solid #27272a; border-radius: 10px; margin-bottom: 24px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="font-size: 13px; color: #22c55e;">✓ Target Hit: 7</td><td style="font-size: 13px; color: #ef4444; text-align: right;">✕ Stop Loss: 1</td></tr>
            </table>
          </div>
          <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
            <a href="${appUrl}/dashboard" class="btn-primary" style="background-color: #fafafa; color: #18181b; border-radius: 6px; font-weight: 600; padding: 14px 28px; text-decoration: none; display: inline-block;">View Details →</a>
          </td></tr></table>
        `, "8 signals today with 87% win rate")
      },
      { 
        name: "Agent Invitation", 
        subject: "🤝 Join TraderEdge Pro Team", 
        html: emailWrapper(`
          <div style="text-align: center;">
            <div style="display: inline-block; width: 64px; height: 64px; background: linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(139,92,246,0.2) 100%); border-radius: 50%; line-height: 64px; font-size: 28px; margin-bottom: 20px;">🤝</div>
            <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: #fafafa;">You're Invited!</h1>
            <p style="margin: 0 0 24px 0; font-size: 15px; color: #a1a1aa; line-height: 1.6;">Join TraderEdge Pro as an Expert Agent and help traders succeed.</p>
            <a href="${appUrl}/agent/accept" class="btn-primary" style="background-color: #fafafa; color: #18181b; border-radius: 6px; font-weight: 600; padding: 14px 32px; text-decoration: none; display: inline-block;">Accept Invitation</a>
            <p style="margin: 20px 0 0 0; font-size: 13px; color: #71717a;">This invitation expires in 7 days.</p>
          </div>
        `, "You've been invited to join as an Expert Agent")
      },
      { 
        name: "OTP Verification", 
        subject: "🔐 Your Verification Code", 
        html: emailWrapper(`
          <div style="text-align: center;">
            <div style="display: inline-block; width: 56px; height: 56px; background: linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(139,92,246,0.2) 100%); border-radius: 50%; line-height: 56px; font-size: 24px; margin-bottom: 20px;">🔐</div>
            <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: #fafafa;">Verification Code</h1>
            <p style="margin: 0 0 24px 0; font-size: 15px; color: #a1a1aa;">Enter this code to verify your identity.</p>
            <div style="padding: 24px; background: rgba(255,255,255,0.05); border: 1px solid #27272a; border-radius: 12px; margin-bottom: 20px;">
              <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #fafafa; font-family: monospace;">123456</span>
            </div>
            <p style="margin: 0; font-size: 13px; color: #71717a;">This code expires in 10 minutes.</p>
          </div>
        `, "Your verification code is 123456")
      },
    ];

    const templatesToSend = templates.slice(0, maxEmails);
    
    for (const t of templatesToSend) {
      try {
        await sendEmail(targetEmail, t.subject, t.html);
        results.push({ template: t.name, status: "sent" });
      } catch (e: any) {
        results.push({ template: t.name, status: "failed", error: e.message });
      }
    }

    return new Response(JSON.stringify({ success: true, target_email: targetEmail, results, summary: { successful: results.filter(r => r.status === 'sent').length, failed: results.filter(r => r.status === 'failed').length } }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
};

serve(handler);
