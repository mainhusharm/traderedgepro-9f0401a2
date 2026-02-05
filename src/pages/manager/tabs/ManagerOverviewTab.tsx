import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Activity, Calendar, TrendingUp, TrendingDown, Clock, CheckCircle, AlertCircle, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useManagerApi } from '@/hooks/useManagerApi';

interface AgentStat {
  id: string;
  agent_id: string;
  total_signals_posted: number;
  winning_signals: number;
  losing_signals: number;
  breakeven_signals: number;
  clients_handled: number;
  admin_agents: {
    name: string;
    email: string;
    is_online: boolean;
  };
}

const ManagerOverviewTab = () => {
  const { callManagerApi } = useManagerApi();
  const [analytics, setAnalytics] = useState<{
    agentStats: AgentStat[];
    sessionCounts: { status: string }[];
    signalStats: { outcome: string; agent_approved: boolean }[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    const response = await callManagerApi('get_analytics');
    if (response?.success) {
      setAnalytics({
        agentStats: response.agentStats || [],
        sessionCounts: response.sessionCounts || [],
        signalStats: response.signalStats || [],
      });
    }
    setIsLoading(false);
  };

  const getOnlineAgents = () => analytics?.agentStats?.filter(a => a.admin_agents?.is_online)?.length || 0;
  const getTotalAgents = () => analytics?.agentStats?.length || 0;
  const getPendingSessions = () => analytics?.sessionCounts?.filter(s => s.status === 'pending')?.length || 0;
  const getCompletedSessions = () => analytics?.sessionCounts?.filter(s => s.status === 'completed')?.length || 0;
  const getApprovedSignals = () => analytics?.signalStats?.filter(s => s.agent_approved)?.length || 0;
  const getWinningSignals = () => analytics?.signalStats?.filter(s => s.outcome?.includes('target'))?.length || 0;

  const stats = [
    {
      title: 'Online Agents',
      value: `${getOnlineAgents()}/${getTotalAgents()}`,
      icon: Users,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Pending Sessions',
      value: getPendingSessions(),
      icon: Clock,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
    },
    {
      title: 'Completed Sessions',
      value: getCompletedSessions(),
      icon: CheckCircle,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Approved Signals (30d)',
      value: getApprovedSignals(),
      icon: Activity,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Winning Signals',
      value: getWinningSignals(),
      icon: TrendingUp,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="bg-card/50 border-white/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.title}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Agent Performance Table */}
      <Card className="bg-card/50 border-white/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-400" />
            Agent Performance Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left py-3 px-4 text-sm text-muted-foreground font-medium">Agent</th>
                  <th className="text-center py-3 px-4 text-sm text-muted-foreground font-medium">Status</th>
                  <th className="text-center py-3 px-4 text-sm text-muted-foreground font-medium">Signals</th>
                  <th className="text-center py-3 px-4 text-sm text-muted-foreground font-medium">Wins</th>
                  <th className="text-center py-3 px-4 text-sm text-muted-foreground font-medium">Losses</th>
                  <th className="text-center py-3 px-4 text-sm text-muted-foreground font-medium">Win Rate</th>
                  <th className="text-center py-3 px-4 text-sm text-muted-foreground font-medium">Clients</th>
                </tr>
              </thead>
              <tbody>
                {analytics?.agentStats?.map((agent) => {
                  const winRate = agent.total_signals_posted > 0
                    ? ((agent.winning_signals / agent.total_signals_posted) * 100).toFixed(1)
                    : '0';
                  return (
                    <tr key={agent.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">{agent.admin_agents?.name || 'Unknown'}</p>
                          <p className="text-xs text-muted-foreground">{agent.admin_agents?.email}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                          agent.admin_agents?.is_online
                            ? 'bg-green-500/10 text-green-400'
                            : 'bg-gray-500/10 text-gray-400'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            agent.admin_agents?.is_online ? 'bg-green-400' : 'bg-gray-400'
                          }`} />
                          {agent.admin_agents?.is_online ? 'Online' : 'Offline'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-medium">{agent.total_signals_posted || 0}</td>
                      <td className="py-3 px-4 text-center text-green-400">{agent.winning_signals || 0}</td>
                      <td className="py-3 px-4 text-center text-red-400">{agent.losing_signals || 0}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`font-medium ${Number(winRate) >= 70 ? 'text-green-400' : Number(winRate) >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {winRate}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">{agent.clients_handled || 0}</td>
                    </tr>
                  );
                })}
                {(!analytics?.agentStats || analytics.agentStats.length === 0) && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      No agent data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ManagerOverviewTab;
