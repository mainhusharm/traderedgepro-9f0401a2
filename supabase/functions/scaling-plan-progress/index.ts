import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Scaling plan configurations
const SCALING_PLANS = {
  conservative: {
    name: 'Conservative',
    weeks: [
      { week: 1, risk_pct: 0.25, min_win_rate: 45, max_dd: 1.5 },
      { week: 2, risk_pct: 0.5, min_win_rate: 48, max_dd: 2.0 },
      { week: 3, risk_pct: 0.75, min_win_rate: 50, max_dd: 2.5 },
      { week: 4, risk_pct: 1.0, min_win_rate: 50, max_dd: 3.0 },
      { week: 5, risk_pct: 1.25, min_win_rate: 52, max_dd: 3.5 },
      { week: 6, risk_pct: 1.5, min_win_rate: 52, max_dd: 4.0 },
      { week: 7, risk_pct: 1.75, min_win_rate: 53, max_dd: 4.5 },
      { week: 8, risk_pct: 2.0, min_win_rate: 55, max_dd: 5.0 },
    ],
  },
  moderate: {
    name: 'Moderate',
    weeks: [
      { week: 1, risk_pct: 0.5, min_win_rate: 48, max_dd: 2.0 },
      { week: 2, risk_pct: 0.75, min_win_rate: 50, max_dd: 2.5 },
      { week: 3, risk_pct: 1.0, min_win_rate: 50, max_dd: 3.0 },
      { week: 4, risk_pct: 1.25, min_win_rate: 52, max_dd: 3.5 },
      { week: 5, risk_pct: 1.5, min_win_rate: 53, max_dd: 4.0 },
      { week: 6, risk_pct: 2.0, min_win_rate: 55, max_dd: 5.0 },
    ],
  },
  aggressive: {
    name: 'Aggressive',
    weeks: [
      { week: 1, risk_pct: 0.75, min_win_rate: 50, max_dd: 2.5 },
      { week: 2, risk_pct: 1.0, min_win_rate: 52, max_dd: 3.0 },
      { week: 3, risk_pct: 1.5, min_win_rate: 53, max_dd: 4.0 },
      { week: 4, risk_pct: 2.0, min_win_rate: 55, max_dd: 5.0 },
    ],
  },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, account_id, user_id, plan_type } = await req.json();

    if (!account_id || !user_id) {
      return new Response(
        JSON.stringify({ error: 'account_id and user_id required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ACTION: Create new scaling plan
    if (action === 'create') {
      const selectedPlan = plan_type || 'moderate';
      const planConfig = SCALING_PLANS[selectedPlan as keyof typeof SCALING_PLANS] || SCALING_PLANS.moderate;
      
      // Deactivate existing plans
      await supabase
        .from('scaling_plans')
        .update({ is_active: false })
        .eq('account_id', account_id);

      // Create new plan
      const { data: newPlan, error } = await supabase
        .from('scaling_plans')
        .insert({
          user_id,
          account_id,
          plan_type: selectedPlan,
          current_week: 1,
          current_risk_target: planConfig.weeks[0].risk_pct,
          history: [{ event: 'plan_started', week: 1, timestamp: new Date().toISOString() }],
        })
        .select()
        .single();

      if (error) throw error;

      // Update account risk multiplier
      const riskMultiplier = planConfig.weeks[0].risk_pct / 2; // Relative to 2% base
      await supabase
        .from('user_prop_accounts')
        .update({
          current_risk_multiplier: riskMultiplier,
          scaling_week: 1,
        })
        .eq('id', account_id);

      return new Response(
        JSON.stringify({ 
          success: true, 
          plan: newPlan,
          plan_config: planConfig,
          message: `Started ${planConfig.name} scaling plan at ${planConfig.weeks[0].risk_pct}% risk`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ACTION: Check progress (called weekly)
    if (action === 'check_progress') {
      // Get current plan
      const { data: plan, error: planError } = await supabase
        .from('scaling_plans')
        .select('*')
        .eq('account_id', account_id)
        .eq('is_active', true)
        .maybeSingle();

      if (!plan) {
        return new Response(
          JSON.stringify({ success: false, message: 'No active scaling plan' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const planConfig = SCALING_PLANS[plan.plan_type as keyof typeof SCALING_PLANS] || SCALING_PLANS.moderate;
      const currentWeekConfig = planConfig.weeks.find(w => w.week === plan.current_week);
      
      if (!currentWeekConfig) {
        return new Response(
          JSON.stringify({ success: true, message: 'Plan completed!' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get last 7 days performance
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const { data: weeklyStats } = await supabase
        .from('trade_daily_stats')
        .select('*')
        .eq('account_id', account_id)
        .gte('date', weekAgo.toISOString().split('T')[0]);

      const stats = weeklyStats || [];
      const totalTrades = stats.reduce((sum, s) => sum + (s.trades_today || 0), 0);
      const winningTrades = stats.reduce((sum, s) => sum + (s.winning_trades || 0), 0);
      const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
      
      // Get current drawdown
      const { data: account } = await supabase
        .from('user_prop_accounts')
        .select('max_drawdown_used_pct')
        .eq('id', account_id)
        .single();

      const currentDD = account?.max_drawdown_used_pct || 0;

      // Evaluate progression
      const canProgress = 
        totalTrades >= 3 && // Minimum 3 trades this week
        winRate >= currentWeekConfig.min_win_rate &&
        currentDD <= currentWeekConfig.max_dd;

      const shouldRegress = currentDD > currentWeekConfig.max_dd + 1; // 1% over limit

      let resultMessage = '';
      let newWeek = plan.current_week;
      const history = plan.history || [];

      if (shouldRegress && plan.current_week > 1) {
        // Regress to week 1
        newWeek = 1;
        history.push({
          event: 'regression',
          from_week: plan.current_week,
          to_week: 1,
          reason: `Drawdown exceeded: ${currentDD.toFixed(2)}% > ${currentWeekConfig.max_dd}%`,
          timestamp: new Date().toISOString(),
        });
        resultMessage = `Regressed to Week 1 due to excessive drawdown`;

        await supabase
          .from('scaling_plans')
          .update({
            current_week: 1,
            current_risk_target: planConfig.weeks[0].risk_pct,
            last_regression_at: new Date().toISOString(),
            total_regressions: (plan.total_regressions || 0) + 1,
            history,
          })
          .eq('id', plan.id);

        await supabase
          .from('user_prop_accounts')
          .update({
            current_risk_multiplier: planConfig.weeks[0].risk_pct / 2,
            scaling_week: 1,
          })
          .eq('id', account_id);

      } else if (canProgress && plan.current_week < planConfig.weeks.length) {
        // Progress to next week
        newWeek = plan.current_week + 1;
        const nextWeekConfig = planConfig.weeks[newWeek - 1];
        
        history.push({
          event: 'progression',
          from_week: plan.current_week,
          to_week: newWeek,
          win_rate: winRate.toFixed(1),
          drawdown: currentDD.toFixed(2),
          timestamp: new Date().toISOString(),
        });
        resultMessage = `Progressed to Week ${newWeek}! New risk: ${nextWeekConfig.risk_pct}%`;

        await supabase
          .from('scaling_plans')
          .update({
            current_week: newWeek,
            current_risk_target: nextWeekConfig.risk_pct,
            last_progression_at: new Date().toISOString(),
            total_progressions: (plan.total_progressions || 0) + 1,
            history,
          })
          .eq('id', plan.id);

        await supabase
          .from('user_prop_accounts')
          .update({
            current_risk_multiplier: nextWeekConfig.risk_pct / 2,
            scaling_week: newWeek,
          })
          .eq('id', account_id);

        // Send celebration notification
        await supabase.from('user_notifications').insert({
          user_id,
          type: 'scaling_progress',
          title: '📈 Scaling Plan Progress!',
          message: resultMessage,
        });

      } else {
        resultMessage = `Week ${plan.current_week}: Need ${currentWeekConfig.min_win_rate}% win rate (current: ${winRate.toFixed(1)}%) and max ${currentWeekConfig.max_dd}% DD (current: ${currentDD.toFixed(2)}%)`;
      }

      return new Response(
        JSON.stringify({
          success: true,
          current_week: newWeek,
          win_rate: winRate,
          drawdown: currentDD,
          can_progress: canProgress,
          should_regress: shouldRegress,
          message: resultMessage,
          plan_config: planConfig,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ACTION: Get current status
    const { data: plan } = await supabase
      .from('scaling_plans')
      .select('*')
      .eq('account_id', account_id)
      .eq('is_active', true)
      .maybeSingle();

    if (!plan) {
      return new Response(
        JSON.stringify({ 
          has_plan: false, 
          available_plans: Object.entries(SCALING_PLANS).map(([key, value]) => ({
            id: key,
            name: value.name,
            weeks: value.weeks.length,
            final_risk: value.weeks[value.weeks.length - 1].risk_pct,
          }))
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const planConfig = SCALING_PLANS[plan.plan_type as keyof typeof SCALING_PLANS] || SCALING_PLANS.moderate;
    
    return new Response(
      JSON.stringify({
        has_plan: true,
        plan,
        plan_config: planConfig,
        current_week_config: planConfig.weeks.find(w => w.week === plan.current_week),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[SCALING-PLAN] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
