import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface EmailRequest {
  type: 'payment_verified' | 'payment_rejected' | 'ai_coach_summary' | 'welcome' | 'mt5_license' | 'mt5_order_update' | 'mt5_files_ready' | 'kickstarter_approved' | 'kickstarter_rejected';
  to: string;
  data: Record<string, any>;
}

// Generate a unique license key
const generateLicenseKey = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const segments = 4;
  const segmentLength = 4;
  const parts: string[] = [];
  
  for (let i = 0; i < segments; i++) {
    let segment = '';
    for (let j = 0; j < segmentLength; j++) {
      segment += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    parts.push(segment);
  }
  
  return `MT5-${parts.join('-')}`;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, to, data }: EmailRequest = await req.json();

    let subject = '';
    let html = '';

    switch (type) {
      case 'payment_verified':
        subject = '✅ Payment Verified - Welcome to TraderEdge Pro!';
        html = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0a; color: #ffffff; margin: 0; padding: 40px 20px; }
              .container { max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a2e 0%, #0f0f1a 100%); border-radius: 16px; padding: 40px; border: 1px solid rgba(255,255,255,0.1); }
              .header { text-align: center; margin-bottom: 30px; }
              .logo { font-size: 28px; font-weight: bold; background: linear-gradient(90deg, #22c55e, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
              .success-icon { font-size: 48px; margin-bottom: 20px; }
              h1 { color: #22c55e; margin: 0 0 10px 0; font-size: 24px; }
              .content { color: #a1a1aa; line-height: 1.6; }
              .details { background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; margin: 20px 0; }
              .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
              .detail-label { color: #71717a; }
              .detail-value { color: #ffffff; font-weight: 600; }
              .cta { display: inline-block; background: linear-gradient(90deg, #3b82f6, #8b5cf6); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px; }
              .footer { text-align: center; margin-top: 30px; color: #71717a; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="success-icon">✅</div>
                <div class="logo">TraderEdge Pro</div>
              </div>
              <h1>Payment Verified!</h1>
              <div class="content">
                <p>Great news! Your payment has been verified and your account is now active.</p>
                <div class="details">
                  <div class="detail-row">
                    <span class="detail-label">Plan</span>
                    <span class="detail-value">${data.planName}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Amount</span>
                    <span class="detail-value">$${data.amount}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Transaction ID</span>
                    <span class="detail-value">${data.transactionId?.slice(0, 20)}...</span>
                  </div>
                </div>
                <p>You now have full access to all premium features. Start your trading journey today!</p>
                <a href="${data.dashboardUrl || 'https://traderedge.pro/dashboard'}" class="cta">Go to Dashboard</a>
              </div>
              <div class="footer">
                <p>TraderEdge Pro - Your AI Trading Partner</p>
              </div>
            </div>
          </body>
          </html>
        `;
        break;

      case 'payment_rejected':
        subject = '❌ Payment Could Not Be Verified';
        html = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0a; color: #ffffff; margin: 0; padding: 40px 20px; }
              .container { max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a2e 0%, #0f0f1a 100%); border-radius: 16px; padding: 40px; border: 1px solid rgba(255,255,255,0.1); }
              h1 { color: #ef4444; margin: 0 0 20px 0; }
              .content { color: #a1a1aa; line-height: 1.6; }
              .cta { display: inline-block; background: #3b82f6; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>Payment Verification Failed</h1>
              <div class="content">
                <p>We were unable to verify your payment. This could be due to:</p>
                <ul>
                  <li>Transaction not found on the blockchain</li>
                  <li>Incorrect transaction hash provided</li>
                  <li>Payment sent to wrong address</li>
                </ul>
                <p>Please contact our support team if you believe this is an error.</p>
                <a href="${data.supportUrl || 'https://traderedge.pro/contact'}" class="cta">Contact Support</a>
              </div>
            </div>
          </body>
          </html>
        `;
        break;

      case 'ai_coach_summary':
        subject = '🤖 Your Weekly AI Coach Summary';
        html = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0a; color: #ffffff; margin: 0; padding: 40px 20px; }
              .container { max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a2e 0%, #0f0f1a 100%); border-radius: 16px; padding: 40px; border: 1px solid rgba(255,255,255,0.1); }
              h1 { color: #8b5cf6; margin: 0 0 20px 0; }
              .content { color: #a1a1aa; line-height: 1.6; }
              .insight { background: rgba(139,92,246,0.1); border-left: 4px solid #8b5cf6; padding: 15px; margin: 15px 0; border-radius: 0 8px 8px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>🤖 Weekly AI Coach Insights</h1>
              <div class="content">
                <p>Here's your personalized trading summary:</p>
                <div class="insight">
                  <strong>Key Insight:</strong> ${data.insight || 'Focus on risk management this week.'}
                </div>
                <p>${data.summary || 'Keep up the great work on your trading journey!'}</p>
              </div>
            </div>
          </body>
          </html>
        `;
        break;

      case 'welcome':
        subject = '🎉 Welcome to TraderEdge Pro!';
        html = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0a; color: #ffffff; margin: 0; padding: 40px 20px; }
              .container { max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a2e 0%, #0f0f1a 100%); border-radius: 16px; padding: 40px; border: 1px solid rgba(255,255,255,0.1); }
              h1 { background: linear-gradient(90deg, #3b82f6, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 0 0 20px 0; }
              .content { color: #a1a1aa; line-height: 1.6; }
              .cta { display: inline-block; background: linear-gradient(90deg, #3b82f6, #8b5cf6); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>Welcome to TraderEdge Pro! 🎉</h1>
              <div class="content">
                <p>Hi ${data.name || 'Trader'},</p>
                <p>Welcome to the TraderEdge Pro family! You've just taken the first step towards becoming a better trader.</p>
                <p>Here's what you can do next:</p>
                <ul>
                  <li>Complete your trading questionnaire</li>
                  <li>Set up your risk parameters</li>
                  <li>Start receiving AI-powered signals</li>
                </ul>
                <a href="${data.dashboardUrl || 'https://traderedge.pro/dashboard'}" class="cta">Get Started</a>
              </div>
            </div>
          </body>
          </html>
        `;
        break;

      case 'mt5_license':
        const licenseKey = data.licenseKey || generateLicenseKey();
        subject = '🤖 Your MT5 Bot License Key - Ready to Trade!';
        html = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0a; color: #ffffff; margin: 0; padding: 40px 20px; }
              .container { max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a2e 0%, #0f0f1a 100%); border-radius: 16px; padding: 40px; border: 1px solid rgba(255,255,255,0.1); }
              .header { text-align: center; margin-bottom: 30px; }
              .logo { font-size: 28px; font-weight: bold; color: #10b981; }
              .bot-icon { font-size: 48px; margin-bottom: 20px; }
              h1 { color: #10b981; margin: 0 0 10px 0; font-size: 24px; }
              .content { color: #a1a1aa; line-height: 1.6; }
              .license-box { background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center; }
              .license-label { font-size: 12px; color: rgba(255,255,255,0.7); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
              .license-key { font-size: 24px; font-weight: bold; color: white; font-family: monospace; letter-spacing: 2px; }
              .details { background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; margin: 20px 0; }
              .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
              .detail-label { color: #71717a; }
              .detail-value { color: #ffffff; font-weight: 600; }
              .cta { display: inline-block; background: linear-gradient(90deg, #10b981, #059669); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px; }
              .steps { margin: 24px 0; }
              .step { display: flex; gap: 12px; margin-bottom: 16px; }
              .step-number { width: 28px; height: 28px; background: #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; color: white; flex-shrink: 0; }
              .step-content { color: #a1a1aa; }
              .footer { text-align: center; margin-top: 30px; color: #71717a; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="bot-icon">🤖</div>
                <div class="logo">MT5 Bot</div>
              </div>
              <h1>Your License Key is Ready!</h1>
              <div class="content">
                <p>Congratulations! Your payment has been verified and your MT5 bot license is now active.</p>
                
                <div class="license-box">
                  <div class="license-label">Your License Key</div>
                  <div class="license-key">${licenseKey}</div>
                </div>

                <div class="details">
                  <div class="detail-row">
                    <span class="detail-label">Plan</span>
                    <span class="detail-value">${data.planName || 'MT5 Bot'}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Amount Paid</span>
                    <span class="detail-value">$${data.amount || '0'}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">License Type</span>
                    <span class="detail-value">Lifetime</span>
                  </div>
                  <div class="detail-row" style="border-bottom: none;">
                    <span class="detail-label">Accounts Allowed</span>
                    <span class="detail-value">${data.accountsAllowed || '1'}</span>
                  </div>
                </div>

                <div class="steps">
                  <h3 style="color: white; margin-bottom: 16px;">What's Next?</h3>
                  <div class="step">
                    <div class="step-number">1</div>
                    <div class="step-content">Log in to your dashboard and submit your bot requirements</div>
                  </div>
                  <div class="step">
                    <div class="step-number">2</div>
                    <div class="step-content">Our team will develop your custom MT5 Expert Advisor</div>
                  </div>
                  <div class="step">
                    <div class="step-number">3</div>
                    <div class="step-content">Download your bot files and activate with your license key</div>
                  </div>
                </div>

                <p style="text-align: center;">
                  <a href="${data.dashboardUrl || 'https://traderedge.pro/mt5-dashboard'}" class="cta">Go to Dashboard</a>
                </p>
              </div>
              <div class="footer">
                <p>Keep this email safe - you'll need your license key to activate the bot.</p>
                <p>MT5 Bot by TraderEdge Pro</p>
              </div>
            </div>
          </body>
          </html>
        `;
        break;

      case 'mt5_order_update':
        subject = `📦 Order Update: ${data.botName}`;
        html = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0a; color: #ffffff; margin: 0; padding: 40px 20px; }
              .container { max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a2e 0%, #0f0f1a 100%); border-radius: 16px; padding: 40px; border: 1px solid rgba(255,255,255,0.1); }
              .header { text-align: center; margin-bottom: 30px; }
              .logo { font-size: 28px; font-weight: bold; color: #3b82f6; }
              h1 { color: #3b82f6; margin: 0 0 10px 0; font-size: 24px; }
              .content { color: #a1a1aa; line-height: 1.6; }
              .status-box { background: rgba(59,130,246,0.1); border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center; }
              .status-label { font-size: 12px; color: rgba(255,255,255,0.7); text-transform: uppercase; }
              .status-value { font-size: 20px; font-weight: bold; color: #3b82f6; text-transform: capitalize; }
              .progress-bar { height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; margin-top: 12px; overflow: hidden; }
              .progress-fill { height: 100%; background: linear-gradient(90deg, #3b82f6, #8b5cf6); border-radius: 4px; }
              .cta { display: inline-block; background: linear-gradient(90deg, #3b82f6, #8b5cf6); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px; }
              .footer { text-align: center; margin-top: 30px; color: #71717a; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">MT5 Bot</div>
              </div>
              <h1>Order Status Updated</h1>
              <div class="content">
                <p>Hi ${data.name || 'Trader'},</p>
                <p>Your MT5 bot order <strong>${data.botName}</strong> has been updated.</p>
                
                <div class="status-box">
                  <div class="status-label">New Status</div>
                  <div class="status-value">${data.status}</div>
                  <div class="progress-bar">
                    <div class="progress-fill" style="width: ${data.progress || 0}%"></div>
                  </div>
                  <p style="margin-top: 8px; font-size: 14px;">${data.progress || 0}% Complete</p>
                </div>
                
                <p>${data.message || 'Check your dashboard for more details.'}</p>
                
                <p style="text-align: center;">
                  <a href="${data.dashboardUrl || 'https://traderedge.pro/mt5-dashboard'}" class="cta">View Order</a>
                </p>
              </div>
              <div class="footer">
                <p>MT5 Bot by TraderEdge Pro</p>
              </div>
            </div>
          </body>
          </html>
        `;
        break;

      case 'mt5_files_ready':
        subject = `🎉 Your MT5 Bot Files Are Ready: ${data.botName}`;
        html = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0a; color: #ffffff; margin: 0; padding: 40px 20px; }
              .container { max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a2e 0%, #0f0f1a 100%); border-radius: 16px; padding: 40px; border: 1px solid rgba(255,255,255,0.1); }
              .header { text-align: center; margin-bottom: 30px; }
              .logo { font-size: 28px; font-weight: bold; color: #10b981; }
              .success-icon { font-size: 48px; margin-bottom: 20px; }
              h1 { color: #10b981; margin: 0 0 10px 0; font-size: 24px; }
              .content { color: #a1a1aa; line-height: 1.6; }
              .files-box { background: rgba(16,185,129,0.1); border-radius: 12px; padding: 20px; margin: 20px 0; }
              .file-item { display: flex; align-items: center; gap: 12px; padding: 12px; background: rgba(255,255,255,0.05); border-radius: 8px; margin-bottom: 8px; }
              .file-icon { font-size: 24px; }
              .file-name { color: white; font-weight: 500; }
              .file-desc { font-size: 12px; color: #71717a; }
              .cta { display: inline-block; background: linear-gradient(90deg, #10b981, #059669); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px; }
              .footer { text-align: center; margin-top: 30px; color: #71717a; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="success-icon">🎉</div>
                <div class="logo">MT5 Bot</div>
              </div>
              <h1>Your Bot Files Are Ready!</h1>
              <div class="content">
                <p>Hi ${data.name || 'Trader'},</p>
                <p>Great news! New files have been uploaded for your MT5 bot <strong>${data.botName}</strong>.</p>
                
                <div class="files-box">
                  <h3 style="color: white; margin-top: 0;">Available Downloads:</h3>
                  ${data.hasCompiledBot ? `
                  <div class="file-item">
                    <span class="file-icon">🤖</span>
                    <div>
                      <div class="file-name">Compiled Bot (.ex5)</div>
                      <div class="file-desc">Ready to use in MT5 terminal</div>
                    </div>
                  </div>
                  ` : ''}
                  ${data.hasSourceCode ? `
                  <div class="file-item">
                    <span class="file-icon">📄</span>
                    <div>
                      <div class="file-name">Source Code (.mq5)</div>
                      <div class="file-desc">For modifications and recompiling</div>
                    </div>
                  </div>
                  ` : ''}
                  ${data.hasBacktestReport ? `
                  <div class="file-item">
                    <span class="file-icon">📊</span>
                    <div>
                      <div class="file-name">Backtest Report</div>
                      <div class="file-desc">Performance analysis and results</div>
                    </div>
                  </div>
                  ` : ''}
                </div>
                
                <p>Head to your dashboard to download your files and start trading!</p>
                
                <p style="text-align: center;">
                  <a href="${data.dashboardUrl || 'https://traderedge.pro/mt5-dashboard'}" class="cta">Download Files</a>
                </p>
              </div>
              <div class="footer">
                <p>MT5 Bot by TraderEdge Pro</p>
              </div>
            </div>
          </body>
          </html>
        `;
        break;

      case 'kickstarter_approved':
        subject = '🎉 Kickstarter Access Approved - Welcome to TraderEdge Pro!';
        html = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0a; color: #ffffff; margin: 0; padding: 40px 20px; }
              .container { max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a2e 0%, #0f0f1a 100%); border-radius: 16px; padding: 40px; border: 1px solid rgba(255,255,255,0.1); }
              .header { text-align: center; margin-bottom: 30px; }
              .logo { font-size: 28px; font-weight: bold; background: linear-gradient(90deg, #22c55e, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
              .success-icon { font-size: 48px; margin-bottom: 20px; }
              h1 { color: #22c55e; margin: 0 0 10px 0; font-size: 24px; }
              .content { color: #a1a1aa; line-height: 1.6; }
              .access-box { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center; }
              .access-label { font-size: 12px; color: rgba(255,255,255,0.8); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
              .access-duration { font-size: 28px; font-weight: bold; color: white; }
              .features { background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; margin: 20px 0; }
              .feature-item { display: flex; align-items: center; gap: 10px; padding: 8px 0; color: #a1a1aa; }
              .feature-icon { color: #22c55e; }
              .cta { display: inline-block; background: linear-gradient(90deg, #22c55e, #16a34a); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px; }
              .footer { text-align: center; margin-top: 30px; color: #71717a; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="success-icon">🎉</div>
                <div class="logo">TraderEdge Pro</div>
              </div>
              <h1>Kickstarter Access Approved!</h1>
              <div class="content">
                <p>Congratulations! Your affiliate purchase verification has been approved.</p>
                
                <div class="access-box">
                  <div class="access-label">Your Access Period</div>
                  <div class="access-duration">30 Days Free</div>
                  <p style="margin: 8px 0 0 0; font-size: 14px; color: rgba(255,255,255,0.8);">
                    Expires: ${data.expiresAt ? new Date(data.expiresAt).toLocaleDateString() : '30 days from now'}
                  </p>
                </div>

                <div class="features">
                  <h3 style="color: white; margin-top: 0;">What You Get:</h3>
                  <div class="feature-item">
                    <span class="feature-icon">✅</span>
                    <span>Risk Management Plan (1 month)</span>
                  </div>
                  <div class="feature-item">
                    <span class="feature-icon">✅</span>
                    <span>Trading Signals (1 week)</span>
                  </div>
                  <div class="feature-item">
                    <span class="feature-icon">✅</span>
                    <span>Basic Risk Calculator</span>
                  </div>
                  <div class="feature-item">
                    <span class="feature-icon">✅</span>
                    <span>Phase Tracking Dashboard</span>
                  </div>
                  <div class="feature-item">
                    <span class="feature-icon">✅</span>
                    <span>3 Prop Firm Analyzers</span>
                  </div>
                </div>
                
                <p>Start exploring your dashboard now and make the most of your Kickstarter access!</p>
                
                <p style="text-align: center;">
                  <a href="${data.dashboardUrl || 'https://traderedge.pro/dashboard'}" class="cta">Go to Dashboard</a>
                </p>
              </div>
              <div class="footer">
                <p>Partner: ${data.affiliatePartner || 'Affiliate Partner'}</p>
                <p>TraderEdge Pro - Your AI Trading Partner</p>
              </div>
            </div>
          </body>
          </html>
        `;
        break;

      case 'kickstarter_rejected':
        subject = '❌ Kickstarter Verification Could Not Be Approved';
        html = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0a; color: #ffffff; margin: 0; padding: 40px 20px; }
              .container { max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a2e 0%, #0f0f1a 100%); border-radius: 16px; padding: 40px; border: 1px solid rgba(255,255,255,0.1); }
              .header { text-align: center; margin-bottom: 30px; }
              .logo { font-size: 28px; font-weight: bold; color: #ef4444; }
              .error-icon { font-size: 48px; margin-bottom: 20px; }
              h1 { color: #ef4444; margin: 0 0 10px 0; font-size: 24px; }
              .content { color: #a1a1aa; line-height: 1.6; }
              .reason-box { background: rgba(239,68,68,0.1); border-left: 4px solid #ef4444; border-radius: 0 8px 8px 0; padding: 16px; margin: 20px 0; }
              .reason-label { font-size: 12px; color: #ef4444; text-transform: uppercase; margin-bottom: 8px; }
              .reason-text { color: white; }
              .cta { display: inline-block; background: #3b82f6; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px; margin-right: 10px; }
              .cta-secondary { display: inline-block; background: transparent; border: 1px solid rgba(255,255,255,0.2); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px; }
              .footer { text-align: center; margin-top: 30px; color: #71717a; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="error-icon">❌</div>
                <div class="logo">Verification Failed</div>
              </div>
              <h1>We Couldn't Verify Your Purchase</h1>
              <div class="content">
                <p>Unfortunately, we were unable to verify your affiliate purchase screenshot.</p>
                
                ${data.rejectionReason ? `
                <div class="reason-box">
                  <div class="reason-label">Reason</div>
                  <div class="reason-text">${data.rejectionReason}</div>
                </div>
                ` : ''}

                <p>This could happen if:</p>
                <ul>
                  <li>The screenshot doesn't clearly show the purchase confirmation</li>
                  <li>The affiliate partner couldn't be verified</li>
                  <li>The purchase was made before the affiliate link was used</li>
                </ul>
                
                <p>You can try submitting again with a clearer screenshot, or contact our support team for help.</p>
                
                <p style="text-align: center;">
                  <a href="${data.affiliateUrl || 'https://traderedge.pro/affiliates'}" class="cta">Try Again</a>
                  <a href="${data.supportUrl || 'https://traderedge.pro/contact'}" class="cta-secondary">Contact Support</a>
                </p>
              </div>
              <div class="footer">
                <p>TraderEdge Pro - Your AI Trading Partner</p>
              </div>
            </div>
          </body>
          </html>
        `;
        break;

      default:
        throw new Error('Invalid email type');
    }

    const emailResponse = await resend.emails.send({
      from: "TraderEdge Pro <noreply@traderedge.pro>",
      to: [to],
      subject,
      html,
    });

    console.log("Email sent successfully:", emailResponse);

    // Log email to database for diagnostics
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      if (supabaseUrl && supabaseKey) {
        await fetch(`${supabaseUrl}/rest/v1/email_logs`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": supabaseKey,
            "Authorization": `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({
            resend_id: emailResponse?.data?.id || null,
            to_email: to,
            subject,
            email_type: type,
            status: emailResponse?.error ? "failed" : "sent",
            error_message: emailResponse?.error?.message || null,
            metadata: data,
          }),
        });
      }
    } catch (logError) {
      console.error("Failed to log email:", logError);
    }

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    console.error("Error in send-notification function:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
