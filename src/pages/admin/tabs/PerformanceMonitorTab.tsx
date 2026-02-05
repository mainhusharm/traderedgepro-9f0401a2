import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  RefreshCw, Users, Zap, Database, Radio, 
  TrendingUp, AlertTriangle, CheckCircle, Activity,
  Bot, CreditCard, MessageSquare, Signal
} from 'lucide-react';

interface SystemMetrics {
  activeUsers: number;
  totalUsers: number;
  edgeFunctionCalls: number;
  aiAgentsRunning: number;
  realtimeConnections: number;
  signalsToday: number;
  paymentsToday: number;
  ticketsOpen: number;
  errorRate: number;
}

interface CapacityMetric {
  current: number;
  max: number;
  percentage: number;
}

interface AIAgent {
  agent_name: string;
  is_active: boolean;
  total_runs: number;
  successful_runs: number;
  failed_runs: number;
  last_run_at: string | null;
}

export const PerformanceMonitorTab = () => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [capacity, setCapacity] = useState<Record<string, CapacityMetric>>({});
  const [aiAgents, setAiAgents] = useState<AIAgent[]>([]);
  const [activity, setActivity] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const { toast } = useToast();

  const fetchMetrics = async () => {
    setIsLoading(true);
    try {
      // Get admin session for auth
      const adminSession = sessionStorage.getItem('admin_session');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (adminSession) {
        headers['X-Admin-Session'] = adminSession;
      }

      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const response = await fetch(`${SUPABASE_URL}/functions/v1/system-metrics`, {
        method: 'POST',
        headers: {
          ...headers,
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ action: 'collect' }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch metrics');
      }

      const data = await response.json();
      
      if (data.error) throw new Error(data.error);

      setMetrics(data.metrics);
      setCapacity(data.capacity);
      setAiAgents(data.aiAgents || []);
      setActivity(data.activity || {});
      setLastRefresh(new Date());
    } catch (error: any) {
      console.error('Error fetching metrics:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch system metrics',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getCapacityColor = (percentage: number) => {
    if (percentage < 50) return 'bg-emerald-500';
    if (percentage < 80) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getHealthStatus = (errorRate: number) => {
    if (errorRate < 1) return { label: 'Healthy', color: 'bg-emerald-500', icon: CheckCircle };
    if (errorRate < 5) return { label: 'Warning', color: 'bg-amber-500', icon: AlertTriangle };
    return { label: 'Critical', color: 'bg-red-500', icon: AlertTriangle };
  };

  const healthStatus = metrics ? getHealthStatus(metrics.errorRate) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Performance Monitor</h2>
          <p className="text-muted-foreground">
            Real-time system health and capacity monitoring
          </p>
        </div>
        <div className="flex items-center gap-4">
          {lastRefresh && (
            <span className="text-sm text-muted-foreground">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </span>
          )}
          <Button onClick={fetchMetrics} disabled={isLoading} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Health Banner */}
      {healthStatus && (
        <Card className={`border-l-4 ${healthStatus.color.replace('bg-', 'border-')}`}>
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${healthStatus.color}`}>
                <healthStatus.icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-foreground">System Status: {healthStatus.label}</p>
                <p className="text-sm text-muted-foreground">
                  Error rate: {metrics?.errorRate.toFixed(2)}%
                </p>
              </div>
            </div>
            <Badge variant={healthStatus.label === 'Healthy' ? 'default' : 'destructive'}>
              {metrics?.aiAgentsRunning || 0} AI Agents Active
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold text-foreground">{metrics?.activeUsers || 0}</p>
                <p className="text-xs text-muted-foreground">of {metrics?.totalUsers || 0} total</p>
              </div>
              <Users className="h-8 w-8 text-primary opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Signals Today</p>
                <p className="text-2xl font-bold text-foreground">{activity.signalsToday || 0}</p>
                <p className="text-xs text-muted-foreground">trading signals</p>
              </div>
              <Signal className="h-8 w-8 text-emerald-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Payments Today</p>
                <p className="text-2xl font-bold text-foreground">{activity.paymentsToday || 0}</p>
                <p className="text-xs text-muted-foreground">transactions</p>
              </div>
              <CreditCard className="h-8 w-8 text-amber-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Open Tickets</p>
                <p className="text-2xl font-bold text-foreground">{metrics?.ticketsOpen || 0}</p>
                <p className="text-xs text-muted-foreground">awaiting response</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Capacity Meters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Capacity
          </CardTitle>
          <CardDescription>
            Current usage vs. estimated maximum capacity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Users Capacity */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">Concurrent Users</span>
              </div>
              <span className="text-muted-foreground">
                {capacity.users?.current || 0} / {capacity.users?.max?.toLocaleString() || '10,000'}
              </span>
            </div>
            <Progress 
              value={capacity.users?.percentage || 0} 
              className={`h-2 ${getCapacityColor(capacity.users?.percentage || 0)}`}
            />
            <p className="text-xs text-muted-foreground">
              {(capacity.users?.percentage || 0).toFixed(2)}% capacity used
            </p>
          </div>

          {/* Realtime Connections */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Radio className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">Realtime Connections</span>
              </div>
              <span className="text-muted-foreground">
                {capacity.realtime?.current || 0} / {capacity.realtime?.max || 500}
              </span>
            </div>
            <Progress 
              value={capacity.realtime?.percentage || 0} 
              className={`h-2 ${getCapacityColor(capacity.realtime?.percentage || 0)}`}
            />
            <p className="text-xs text-muted-foreground">
              WebSocket connections for live updates
            </p>
          </div>

          {/* Edge Functions */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">Edge Function Calls</span>
              </div>
              <span className="text-muted-foreground">
                {(capacity.edgeFunctions?.current || 0).toLocaleString()} / 500K daily
              </span>
            </div>
            <Progress 
              value={capacity.edgeFunctions?.percentage || 0} 
              className={`h-2 ${getCapacityColor(capacity.edgeFunctions?.percentage || 0)}`}
            />
            <p className="text-xs text-muted-foreground">
              Backend function invocations
            </p>
          </div>
        </CardContent>
      </Card>

      {/* AI Agents Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            AI Marketing Agents
          </CardTitle>
          <CardDescription>
            Status and performance of automated AI agents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {aiAgents.length > 0 ? (
              aiAgents.map((agent) => {
                const successRate = agent.total_runs > 0 
                  ? ((agent.successful_runs / agent.total_runs) * 100).toFixed(1) 
                  : '0';
                return (
                  <div 
                    key={agent.agent_name} 
                    className="p-4 rounded-lg border bg-card"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm text-foreground capitalize">
                        {agent.agent_name.replace(/_/g, ' ')}
                      </span>
                      <Badge variant={agent.is_active ? 'default' : 'secondary'}>
                        {agent.is_active ? 'Active' : 'Paused'}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <p>Total Runs: {agent.total_runs}</p>
                      <p>Success Rate: {successRate}%</p>
                      {agent.last_run_at && (
                        <p>Last Run: {new Date(agent.last_run_at).toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-muted-foreground col-span-full text-center py-4">
                No AI agents configured
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Estimated Limits Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Estimated Capacity Limits
          </CardTitle>
          <CardDescription>
            Based on your current architecture and infrastructure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Scenario</th>
                  <th className="text-center py-3 px-4 text-muted-foreground font-medium">Concurrent Users</th>
                  <th className="text-center py-3 px-4 text-muted-foreground font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-3 px-4 text-foreground">Static page browsing</td>
                  <td className="py-3 px-4 text-center text-foreground">10,000+</td>
                  <td className="py-3 px-4 text-center">
                    <Badge variant="default" className="bg-emerald-500">Healthy</Badge>
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4 text-foreground">Logged-in dashboard users</td>
                  <td className="py-3 px-4 text-center text-foreground">1,000 - 2,000</td>
                  <td className="py-3 px-4 text-center">
                    <Badge variant="default" className="bg-emerald-500">Healthy</Badge>
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4 text-foreground">Active trading (real-time signals)</td>
                  <td className="py-3 px-4 text-center text-foreground">300 - 500</td>
                  <td className="py-3 px-4 text-center">
                    <Badge variant="default" className="bg-emerald-500">Healthy</Badge>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-foreground">Simultaneous AI chat sessions</td>
                  <td className="py-3 px-4 text-center text-foreground">50 - 100</td>
                  <td className="py-3 px-4 text-center">
                    <Badge variant="outline" className="border-amber-500 text-amber-500">Monitor</Badge>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Current usage: <strong>{metrics?.totalUsers || 0} users</strong> = approximately{' '}
            <strong>{((metrics?.totalUsers || 0) / 10000 * 100).toFixed(2)}%</strong> capacity
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
