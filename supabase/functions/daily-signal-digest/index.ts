import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const sendEmail = async (to: string, subject: string, html: string) => {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "TraderEdge Pro <signals@traderedgepro.com>",
      to: [to],
      subject,
      html,
    }),
  });
  return res.json();
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const { data: signals, error: signalsError } = await supabase
      .from('signals')
      .select('*')
      .gte('created_at', yesterday.toISOString())
      .lt('created_at', todayStart.toISOString())
      .order('created_at', { ascending: false });

    if (signalsError) throw signalsError;

    if (!signals || signals.length === 0) {
      return new Response(JSON.stringify({ message: 'No signals to digest' }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const totalSignals = signals.length;
    const vipSignals = signals.filter(s => s.is_vip).length;
    const targetHits = signals.filter(s => s.outcome === 'target_hit').length;
    const stopLossHits = signals.filter(s => s.outcome === 'stop_loss_hit').length;
    const pendingSignals = signals.filter(s => s.outcome === 'pending').length;
    const winRate = totalSignals > 0 ? ((targetHits / (totalSignals - pendingSignals)) * 100).toFixed(1) : '0';
    const totalPnL = signals.reduce((sum, s) => sum + (s.pnl || 0), 0);

    const { data: profiles } = await supabase.from('profiles').select('user_id, first_name, email_preferences');
    const { data: { users } } = await supabase.auth.admin.listUsers();

    let emailsSent = 0;
    for (const profile of profiles || []) {
      const emailPrefs = profile.email_preferences as Record<string, boolean> | null;
      if (!emailPrefs?.weekly_summary) continue;
      const user = users?.find(u => u.id === profile.user_id);
      if (!user?.email) continue;

      const html = `<div style="background:#0a0a0a;color:#fff;padding:40px;font-family:sans-serif;"><h1 style="color:#6366f1;">📊 Daily Signal Digest</h1><p>${yesterday.toLocaleDateString()}</p><p>Total: ${totalSignals} | Win Rate: ${winRate}% | P&L: $${totalPnL.toFixed(2)}</p></div>`;
      
      await sendEmail(user.email, `📊 Daily Digest - ${winRate}% Win Rate`, html);
      emailsSent++;
    }

    return new Response(JSON.stringify({ success: true, emails_sent: emailsSent }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
};

serve(handler);
