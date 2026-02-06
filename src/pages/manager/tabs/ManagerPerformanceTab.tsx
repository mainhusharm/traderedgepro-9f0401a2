import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Target, Award, BarChart3, X, Users, CheckCircle, XCircle, MinusCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useManagerApi } from '@/hooks/useManagerApi';

interface AgentStats {
  id: string;
  admin_agents: { name: string; email: string; is_online: boolean } | null;
  total_signals_posted: number;
  winning_signals: number;
  losing_signals: number;
  clients_handled: number;
}

const ManagerPerformanceTab = () => {
  const { callManagerApi } = useManagerApi();
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<AgentStats | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    const response = await callManagerApi('get_analytics');
    if (response?.success) {
      setAnalytics(response);
    }
    setIsLoading(false);
  };

  const calculateTeamStats = () => {
    if (!analytics?.agentStats) return { totalSignals: 0, wins: 0, losses: 0, winRate: 0 };
    
    let totalSignals = 0;
    let wins = 0;
    let losses = 0;
    
    analytics.agentStats.forEach((agent: AgentStats) => {
      totalSignals += agent.total_signals_posted || 0;
      wins += agent.winning_signals || 0;
      losses += agent.losing_signals || 0;
    });

    // Win rate based on decided signals only (wins + losses)
    const decidedSignals = wins + losses;
    return {
      totalSignals,
      wins,
      losses,
      winRate: decidedSignals > 0 ? ((wins / decidedSignals) * 100).toFixed(1) : '0'
    };
  };

  const calculateAgentWinRate = (agent: AgentStats) => {
    const decidedSignals = (agent.winning_signals || 0) + (agent.losing_signals || 0);
    return decidedSignals > 0 
      ? ((agent.winning_signals / decidedSignals) * 100).toFixed(1) 
      : '0';
  };

  const teamStats = calculateTeamStats();

  const stats = [
    {
      title: 'Total Team Signals',
      value: teamStats.totalSignals,
      icon: BarChart3,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Winning Signals',
      value: teamStats.wins,
      icon: TrendingUp,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Losing Signals',
      value: teamStats.losses,
      icon: TrendingDown,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
    },
    {
      title: 'Team Win Rate',
      value: `${teamStats.winRate}%`,
      icon: Target,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
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
      {/* Team Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="bg-card/50 border-white/5">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-3xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Top Performers */}
      <Card className="bg-card/50 border-white/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-400" />
            Top Performers (Last 30 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics?.agentStats
              ?.sort((a: AgentStats, b: AgentStats) => {
                const aWinRate = (a.winning_signals || 0) + (a.losing_signals || 0) > 0 
                  ? (a.winning_signals / ((a.winning_signals || 0) + (a.losing_signals || 0))) 
                  : 0;
                const bWinRate = (b.winning_signals || 0) + (b.losing_signals || 0) > 0 
                  ? (b.winning_signals / ((b.winning_signals || 0) + (b.losing_signals || 0))) 
                  : 0;
                return bWinRate - aWinRate;
              })
              ?.slice(0, 10)
              ?.map((agent: AgentStats, index: number) => {
                const winRate = calculateAgentWinRate(agent);
                const breakeven = (agent.total_signals_posted || 0) - (agent.winning_signals || 0) - (agent.losing_signals || 0);
                
                return (
                  <motion.div
                    key={agent.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                    onClick={() => setSelectedAgent(agent)}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                        index === 1 ? 'bg-gray-400/20 text-gray-300' :
                        index === 2 ? 'bg-orange-500/20 text-orange-400' :
                        'bg-white/10 text-muted-foreground'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{agent.admin_agents?.name || agent.admin_agents?.email || 'Unknown Agent'}</p>
                        <p className="text-xs text-muted-foreground">
                          {agent.total_signals_posted || 0} signals • {agent.clients_handled || 0} clients
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="hidden sm:flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1 text-green-400">
                          <CheckCircle className="w-4 h-4" />
                          {agent.winning_signals || 0}
                        </span>
                        <span className="flex items-center gap-1 text-red-400">
                          <XCircle className="w-4 h-4" />
                          {agent.losing_signals || 0}
                        </span>
                        {breakeven > 0 && (
                          <span className="flex items-center gap-1 text-yellow-400">
                            <MinusCircle className="w-4 h-4" />
                            {breakeven}
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-bold ${Number(winRate) >= 60 ? 'text-green-400' : Number(winRate) >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {winRate}%
                        </p>
                        <p className="text-xs text-muted-foreground">Win Rate</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}

            {(!analytics?.agentStats || analytics.agentStats.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                No performance data available
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Agent Detail Modal */}
      <Dialog open={!!selectedAgent} onOpenChange={() => setSelectedAgent(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              {selectedAgent?.admin_agents?.name || selectedAgent?.admin_agents?.email || 'Agent Details'}
            </DialogTitle>
          </DialogHeader>
          
          {selectedAgent && (
            <div className="space-y-6">
              {/* Win Rate Circle */}
              <div className="flex justify-center">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-white/10"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${Number(calculateAgentWinRate(selectedAgent)) * 3.52} 352`}
                      className={Number(calculateAgentWinRate(selectedAgent)) >= 60 ? 'text-green-500' : Number(calculateAgentWinRate(selectedAgent)) >= 40 ? 'text-yellow-500' : 'text-red-500'}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold">{calculateAgentWinRate(selectedAgent)}%</span>
                    <span className="text-xs text-muted-foreground">Win Rate</span>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-white/5 text-center">
                  <p className="text-2xl font-bold">{selectedAgent.total_signals_posted || 0}</p>
                  <p className="text-xs text-muted-foreground">Total Signals</p>
                </div>
                <div className="p-4 rounded-lg bg-white/5 text-center">
                  <p className="text-2xl font-bold">{selectedAgent.clients_handled || 0}</p>
                  <p className="text-xs text-muted-foreground">Clients Handled</p>
                </div>
                <div className="p-4 rounded-lg bg-green-500/10 text-center">
                  <p className="text-2xl font-bold text-green-400">{selectedAgent.winning_signals || 0}</p>
                  <p className="text-xs text-muted-foreground">Wins</p>
                </div>
                <div className="p-4 rounded-lg bg-red-500/10 text-center">
                  <p className="text-2xl font-bold text-red-400">{selectedAgent.losing_signals || 0}</p>
                  <p className="text-xs text-muted-foreground">Losses</p>
                </div>
              </div>

              {/* Breakeven / Pending */}
              {(() => {
                const breakeven = (selectedAgent.total_signals_posted || 0) - (selectedAgent.winning_signals || 0) - (selectedAgent.losing_signals || 0);
                return breakeven > 0 ? (
                  <div className="p-4 rounded-lg bg-yellow-500/10 text-center">
                    <p className="text-2xl font-bold text-yellow-400">{breakeven}</p>
                    <p className="text-xs text-muted-foreground">Breakeven / Pending</p>
                  </div>
                ) : null;
              })()}

              {/* Email */}
              {selectedAgent.admin_agents?.email && (
                <div className="text-center text-sm text-muted-foreground">
                  {selectedAgent.admin_agents.email}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManagerPerformanceTab;
