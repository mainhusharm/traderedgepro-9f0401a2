import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const logoUrl = "https://raw.githubusercontent.com/anchalw11/photos/main/freepik_create_a_professional_3d_rendered_trading_platform_84327.png";
const appUrl = "https://traderedgepro.lovable.app";

interface SignalData {
  id?: string;
  symbol: string;
  signal_type: 'BUY' | 'SELL';
  entry_price: number;
  stop_loss?: number | null;
  take_profit?: number | null;
  ai_reasoning?: string | null;
  is_vip?: boolean;
}

interface SignalNotificationRequest {
  signal?: SignalData;
  userIds?: string[];
  symbol?: string;
  signal_type?: 'BUY' | 'SELL';
  entry_price?: number;
  stop_loss?: number;
  take_profit?: number;
  ai_reasoning?: string;
  is_vip?: boolean;
  signal_id?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: SignalNotificationRequest = await req.json();
    
    const signalData = body.signal || body;
    
    const symbol = signalData.symbol || 'Unknown';
    const signalType = signalData.signal_type || 'BUY';
    const entryPrice = signalData.entry_price ?? 0;
    const stopLoss = signalData.stop_loss ?? null;
    const takeProfit = signalData.take_profit ?? null;
    const aiReasoning = signalData.ai_reasoning || null;
    const isVip = signalData.is_vip || false;
    const signalId = (body.signal as any)?.id || body.signal_id || null;
    
    console.log('Processing signal notification:', { symbol, signalType, entryPrice, stopLoss, takeProfit, isVip });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch profiles with active memberships
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select(`
        user_id,
        first_name,
        email_preferences
      `);

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      throw profilesError;
    }

    // Fetch users with active memberships
    const { data: memberships, error: membershipsError } = await supabase
      .from('memberships')
      .select('user_id')
      .eq('status', 'active');

    if (membershipsError) {
      console.error("Error fetching memberships:", membershipsError);
      throw membershipsError;
    }

    const activeMemberUserIds = new Set((memberships || []).map(m => m.user_id));
    console.log(`Found ${activeMemberUserIds.size} users with active memberships`);

    // Fetch all auth users with pagination
    const userEmailMap = new Map<string, string>();
    let page = 1;
    const perPage = 100;
    let hasMore = true;
    
    while (hasMore) {
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers({
        page: page,
        perPage: perPage
      });
      
      if (authError) {
        console.error("Error fetching auth users:", authError);
        throw authError;
      }
      
      authUsers.users.forEach(user => {
        userEmailMap.set(user.id, user.email || '');
      });
      
      // Check if there are more pages
      hasMore = authUsers.users.length === perPage;
      page++;
    }
    
    console.log(`Found ${userEmailMap.size} auth users total`);

    const subscribedUsers = (profiles || []).filter(profile => {
      const prefs = profile.email_preferences as { signals?: boolean } | null;
      const email = userEmailMap.get(profile.user_id);
      const hasActiveMembership = activeMemberUserIds.has(profile.user_id);
      // Only include users with signals enabled AND have a valid email AND active membership
      return prefs?.signals !== false && email && hasActiveMembership;
    });
    
    console.log(`Found ${subscribedUsers.length} users with signals enabled, valid emails, and active memberships`);

    console.log(`Sending signal notification to ${subscribedUsers.length} users`);

    const signalColor = signalType === 'BUY' ? '#22c55e' : '#ef4444';
    const signalBgColor = signalType === 'BUY' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)';
    const signalIcon = signalType === 'BUY' ? '📈' : '📉';
    const vipBadge = isVip ? '⭐ VIP ' : '';
    
    const displayStopLoss = stopLoss !== null ? stopLoss : 'N/A';
    const displayTakeProfit = takeProfit !== null ? takeProfit : 'N/A';

    const emailPromises = subscribedUsers.map(async (profile) => {
      const email = userEmailMap.get(profile.user_id);
      if (!email) return;

      try {
        await supabase
          .from('user_notifications')
          .insert({
            user_id: profile.user_id,
            type: isVip ? 'vip_signal' : 'signal',
            title: `${vipBadge}New ${signalType} Signal: ${symbol}`,
            message: `Entry: ${entryPrice} | SL: ${displayStopLoss} | TP: ${displayTakeProfit}`,
            data: {
              signal_id: signalId,
              symbol: symbol,
              signal_type: signalType,
              entry_price: entryPrice,
              stop_loss: stopLoss,
              take_profit: takeProfit,
              is_vip: isVip
            },
            is_read: false
          });

        const emailResult = await resend.emails.send({
          from: "TraderEdge Pro <signals@traderedgepro.com>",
          to: [email],
          subject: `${signalIcon} ${vipBadge}New ${signalType} Signal: ${symbol}`,
          html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>New Trading Signal</title>
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
              <td style="padding: 32px;">
                <div style="text-align: center; margin-bottom: 24px;">
                  ${isVip ? `<span style="display: inline-block; padding: 6px 14px; background: linear-gradient(135deg, #f59e0b 0%, #eab308 100%); color: #18181b; font-size: 11px; font-weight: 600; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px;">⭐ VIP Signal</span>` : `<span style="display: inline-block; padding: 6px 14px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; font-size: 11px; font-weight: 600; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px;">New Signal</span>`}
                </div>
                
                <h1 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 700; text-align: center; color: #fafafa;">${symbol}</h1>
                <p style="margin: 0 0 24px 0; font-size: 16px; text-align: center;">
                  <span style="display: inline-block; padding: 6px 16px; background: ${signalBgColor}; color: ${signalColor}; font-weight: 600; border-radius: 6px;">${signalType}</span>
                </p>
                
                <!-- Signal Details -->
                <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                  <tr>
                    <td style="padding: 20px; background: rgba(255,255,255,0.05); border: 1px solid #27272a; border-radius: 12px; border-left: 4px solid ${signalColor};">
                      <table width="100%" border="0" cellpadding="0" cellspacing="0">
                        <tr><td style="font-size: 13px; color: #a1a1aa; padding-bottom: 12px;">Entry Price</td><td style="font-size: 15px; font-weight: 600; text-align: right; color: #fafafa; padding-bottom: 12px;">${entryPrice}</td></tr>
                        <tr><td style="font-size: 13px; color: #a1a1aa; padding-bottom: 12px;">Take Profit</td><td style="font-size: 15px; font-weight: 600; text-align: right; color: #22c55e; padding-bottom: 12px;">${displayTakeProfit}</td></tr>
                        <tr><td style="font-size: 13px; color: #a1a1aa;">Stop Loss</td><td style="font-size: 15px; font-weight: 600; text-align: right; color: #ef4444;">${displayStopLoss}</td></tr>
                      </table>
                    </td>
                  </tr>
                </table>
                
                ${aiReasoning ? `
                <div style="background: rgba(255,255,255,0.03); border: 1px solid #27272a; border-radius: 10px; padding: 16px; margin-bottom: 24px;">
                  <p style="margin: 0 0 8px 0; font-size: 12px; color: #71717a; text-transform: uppercase; letter-spacing: 0.5px;">Analysis</p>
                  <p style="margin: 0; font-size: 14px; color: #d4d4d8; line-height: 1.6;">${aiReasoning}</p>
                </div>
                ` : ''}
                
                <!-- CTA Button -->
                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center">
                      <a href="${appUrl}/dashboard?tab=signals" style="display: inline-block; background-color: #fafafa; color: #18181b; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: 600; font-size: 14px;">
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
          <p style="margin: 0; font-size: 11px; color: #52525b;">
            <a href="${appUrl}/dashboard?tab=settings" style="color: #8b5cf6; text-decoration: none;">Manage notification preferences</a>
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
        
        const resendId = (emailResult as { data?: { id?: string } })?.data?.id;
        if (resendId) {
          await supabase
            .from('email_logs')
            .insert({
              resend_id: resendId,
              to_email: email,
              subject: `${signalIcon} ${vipBadge}New ${signalType} Signal: ${symbol}`,
              email_type: 'signal_notification',
              status: 'sent',
              metadata: {
                signal_id: signalId,
                symbol: symbol,
                signal_type: signalType,
                is_vip: isVip
              }
            });
        }
        
        console.log(`Email sent to ${email}`);
      } catch (emailError) {
        console.error(`Failed to send email to ${email}:`, emailError);
        
        await supabase
          .from('email_logs')
          .insert({
            to_email: email,
            subject: `${signalIcon} ${vipBadge}New ${signalType} Signal: ${symbol}`,
            email_type: 'signal_notification',
            status: 'failed',
            error_message: emailError instanceof Error ? emailError.message : 'Unknown error',
            metadata: {
              signal_id: signalId,
              symbol: symbol,
              signal_type: signalType,
              is_vip: isVip
            }
          });
      }
    });

    await Promise.all(emailPromises);

    return new Response(JSON.stringify({ success: true, sent: subscribedUsers.length }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending signal notifications:", error);
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
