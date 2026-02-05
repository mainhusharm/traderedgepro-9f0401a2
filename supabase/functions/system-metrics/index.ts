import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-session, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface MetricData {
  activeUsers: number;
  totalUsers: number;
  edgeFunctionCalls: number;
  aiAgentsRunning: number;
  realtimeConnections: number;
  databaseSize: string;
  signalsToday: number;
  paymentsToday: number;
  ticketsOpen: number;
  errorRate: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action } = await req.json();

    if (action === 'collect') {
      // Get active users (profiles with recent activity - last 15 min)
      const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      const { count: activeUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('updated_at', fifteenMinAgo);

      // Get total users
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get AI agents status
      const { data: aiAgents } = await supabase
        .from('marketing_ai_automation')
        .select('is_active, total_runs, successful_runs, failed_runs, last_run_at')
        .eq('is_active', true);

      // Get signals created today
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const { count: signalsToday } = await supabase
        .from('signals')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', todayStart.toISOString());

      // Get payments today
      const { count: paymentsToday } = await supabase
        .from('payments')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', todayStart.toISOString());

      // Get open tickets
      const { count: ticketsOpen } = await supabase
        .from('support_tickets')
        .select('*', { count: 'exact', head: true })
        .in('status', ['open', 'in_progress']);

      // Get guidance sessions today
      const { count: sessionsToday } = await supabase
        .from('guidance_sessions')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', todayStart.toISOString());

      // Get active memberships count
      const { count: activeMemberships } = await supabase
        .from('memberships')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Calculate edge function calls from AI automation total runs
      const totalEdgeFunctionCalls = aiAgents?.reduce((sum, agent) => sum + (agent.total_runs || 0), 0) || 0;

      // Calculate error rate from AI automation
      const totalRuns = aiAgents?.reduce((sum, agent) => sum + (agent.total_runs || 0), 0) || 0;
      const failedRuns = aiAgents?.reduce((sum, agent) => sum + (agent.failed_runs || 0), 0) || 0;
      const errorRate = totalRuns > 0 ? (failedRuns / totalRuns) * 100 : 0;

      const metrics: MetricData = {
        activeUsers: activeUsers || 0,
        totalUsers: totalUsers || 0,
        edgeFunctionCalls: totalEdgeFunctionCalls,
        aiAgentsRunning: aiAgents?.length || 0,
        realtimeConnections: activeUsers || 0, // Estimate based on active users
        databaseSize: 'N/A', // Would need pg_database_size query
        signalsToday: signalsToday || 0,
        paymentsToday: paymentsToday || 0,
        ticketsOpen: ticketsOpen || 0,
        errorRate: Math.round(errorRate * 100) / 100,
      };

      // Store metrics snapshot
      await supabase.from('system_performance_logs').insert([
        { metric_type: 'users', metric_name: 'active_users', value: metrics.activeUsers },
        { metric_type: 'users', metric_name: 'total_users', value: metrics.totalUsers },
        { metric_type: 'edge_function', metric_name: 'total_calls', value: metrics.edgeFunctionCalls },
        { metric_type: 'ai_agents', metric_name: 'running_count', value: metrics.aiAgentsRunning },
        { metric_type: 'signals', metric_name: 'today_count', value: metrics.signalsToday },
        { metric_type: 'system', metric_name: 'error_rate', value: metrics.errorRate },
      ]);

      return new Response(JSON.stringify({ 
        success: true, 
        metrics,
        aiAgents,
        capacity: {
          users: { current: totalUsers || 0, max: 10000, percentage: ((totalUsers || 0) / 10000) * 100 },
          realtime: { current: activeUsers || 0, max: 500, percentage: ((activeUsers || 0) / 500) * 100 },
          edgeFunctions: { current: totalEdgeFunctionCalls, max: 500000, percentage: (totalEdgeFunctionCalls / 500000) * 100 },
        },
        activity: {
          signalsToday: signalsToday || 0,
          paymentsToday: paymentsToday || 0,
          sessionsToday: sessionsToday || 0,
          activeMemberships: activeMemberships || 0,
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'history') {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      const { data: history } = await supabase
        .from('system_performance_logs')
        .select('*')
        .gte('recorded_at', twentyFourHoursAgo)
        .order('recorded_at', { ascending: true });

      return new Response(JSON.stringify({ success: true, history }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'health-check') {
      // Quick health check
      const { data: agents } = await supabase
        .from('marketing_ai_automation')
        .select('agent_name, is_active, last_run_at, last_error');

      const { count: errorLogs } = await supabase
        .from('email_logs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'failed')
        .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());

      return new Response(JSON.stringify({ 
        success: true, 
        health: {
          status: (errorLogs || 0) < 5 ? 'healthy' : 'degraded',
          agents,
          recentErrors: errorLogs || 0,
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('System metrics error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
