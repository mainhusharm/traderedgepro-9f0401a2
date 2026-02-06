import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, user_id, account_id } = await req.json();
    
    if (action === 'get_weekly_summary') {
      // Get mistake patterns for the current week
      const weekStart = getWeekStart(new Date());
      
      const { data: patterns, error } = await supabase
        .from('trading_mistake_patterns')
        .select('*')
        .eq('user_id', user_id)
        .eq('account_id', account_id)
        .eq('week_start', weekStart);

      if (error) {
        throw error;
      }

      // Calculate summary stats
      const summary = {
        total_mistakes: patterns?.reduce((sum, p) => sum + p.count, 0) || 0,
        total_pnl_impact: patterns?.reduce((sum, p) => sum + (p.total_pnl_impact || 0), 0) || 0,
        patterns: patterns || [],
        worst_mistake: patterns?.sort((a, b) => (a.total_pnl_impact || 0) - (b.total_pnl_impact || 0))[0] || null
      };

      return new Response(JSON.stringify(summary), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'get_historical') {
      // Get mistake patterns for the last 8 weeks
      const eightWeeksAgo = new Date();
      eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);
      
      const { data: patterns, error } = await supabase
        .from('trading_mistake_patterns')
        .select('*')
        .eq('user_id', user_id)
        .eq('account_id', account_id)
        .gte('week_start', eightWeeksAgo.toISOString().split('T')[0])
        .order('week_start', { ascending: true });

      if (error) {
        throw error;
      }

      // Group by week
      const weeklyData = (patterns || []).reduce((acc: any, p) => {
        if (!acc[p.week_start]) {
          acc[p.week_start] = {
            week: p.week_start,
            mistakes: [],
            total_count: 0,
            total_pnl_impact: 0
          };
        }
        acc[p.week_start].mistakes.push(p);
        acc[p.week_start].total_count += p.count;
        acc[p.week_start].total_pnl_impact += p.total_pnl_impact || 0;
        return acc;
      }, {});

      return new Response(JSON.stringify({
        weeks: Object.values(weeklyData),
        trend: calculateTrend(Object.values(weeklyData))
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'analyze_trade') {
      // Pre-trade analysis for potential mistakes
      const { symbol, lot_size, entry_time } = await req.json();
      const warnings: string[] = [];
      
      // Get account settings
      const { data: account } = await supabase
        .from('user_prop_accounts')
        .select('average_lot_size, allowed_trading_hours, cooling_off_enabled, last_loss_count')
        .eq('id', account_id)
        .single();

      // Check for oversized position
      if (account?.average_lot_size && lot_size > account.average_lot_size * 1.5) {
        warnings.push(`Position size ${lot_size} is ${Math.round((lot_size / account.average_lot_size - 1) * 100)}% larger than your average`);
      }

      // Check for cooling off
      if (account?.cooling_off_enabled && account?.last_loss_count >= 3) {
        warnings.push('You are on a losing streak. Consider taking a break.');
      }

      // Check recent trades for FOMO/Revenge patterns
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { data: recentTrades } = await supabase
        .from('user_trade_allocations')
        .select('pnl, status, closed_at')
        .eq('user_id', user_id)
        .eq('status', 'closed')
        .gte('closed_at', fiveMinAgo)
        .limit(1);

      if (recentTrades && recentTrades.length > 0) {
        warnings.push('You just closed a trade. Taking a moment to review before entering again can improve decision quality.');
        if (recentTrades[0].pnl < 0) {
          warnings.push('⚠️ Your last trade was a loss. This new entry may be revenge trading.');
        }
      }

      return new Response(JSON.stringify({
        warnings,
        risk_level: warnings.length > 2 ? 'high' : warnings.length > 0 ? 'medium' : 'low'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[detect-trading-mistakes] Error:', error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

function calculateTrend(weeks: any[]): string {
  if (weeks.length < 2) return 'insufficient_data';
  const recent = weeks.slice(-2);
  const older = weeks.slice(0, -2);
  
  const recentAvg = recent.reduce((sum, w) => sum + w.total_count, 0) / recent.length;
  const olderAvg = older.length > 0 ? older.reduce((sum, w) => sum + w.total_count, 0) / older.length : recentAvg;
  
  if (recentAvg < olderAvg * 0.7) return 'improving';
  if (recentAvg > olderAvg * 1.3) return 'worsening';
  return 'stable';
}
