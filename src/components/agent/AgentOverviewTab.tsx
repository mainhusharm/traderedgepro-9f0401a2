import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  TrendingUp,
  TrendingDown,
  Target,
  Minus,
  Circle,
  Crown,
  Activity,
  Clock,
  MessageSquare,
  BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { callEdgeFunction } from '@/config/api';
import { formatDistanceToNow } from 'date-fns';

interface Agent {
  id: string;
  name: string | null;
  email: string;
  is_online: boolean | null;
  last_seen_at: string | null;
  status: string;
}

interface AgentStats {
  agent_id: string;
  total_signals_posted: number;
  winning_signals: number;
  losing_signals: number;
  breakeven_signals: number;
  clients_handled: number;
  last_signal_at: string | null;
}

interface CombinedAgentData extends Agent {
  stats: AgentStats | null;
}

const AgentOverviewTab = () => {
  const [agents, setAgents] = useState<CombinedAgentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [teamStats, setTeamStats] = useState({
    totalSignals: 0,
    totalWins: 0,
    totalLosses: 0,
    onlineAgents: 0,
  });

  useEffect(() => {
    fetchAgents();

    // Poll periodically (agent portal uses session tokens, so DB realtime isn't available client-side)
    const interval = window.setInterval(fetchAgents, 15000);
    return () => window.clearInterval(interval);
  }, []);

  const fetchAgents = async () => {
    try {
      const sessionToken = sessionStorage.getItem('agent_session_token');
      if (!sessionToken) {
        throw new Error('Missing agent session. Please log in again.');
      }

      const { data, error } = await callEdgeFunction('agent-api', {
        action: 'get_team_overview',
        data: { sessionToken },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setAgents((data?.agents || []) as CombinedAgentData[]);
      setTeamStats(
        data?.teamStats || {
          totalSignals: 0,
          totalWins: 0,
          totalLosses: 0,
          onlineAgents: 0,
        }
      );
    } catch (error: any) {
      console.error('Error fetching agents:', error);
      toast.error(error?.message || 'Failed to fetch team data');
      setAgents([]);
      setTeamStats({ totalSignals: 0, totalWins: 0, totalLosses: 0, onlineAgents: 0 });
    } finally {
      setIsLoading(false);
    }
  };

  const getWinRate = (wins: number, losses: number) => {
    const total = wins + losses;
    if (total === 0) return 0;
    return ((wins / total) * 100).toFixed(1);
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Team Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-gradient-to-br from-primary/10 to-blue-500/10 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{teamStats.onlineAgents}/{agents.length}</p>
                  <p className="text-xs text-muted-foreground">Agents Online</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Activity className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{teamStats.totalSignals}</p>
                  <p className="text-xs text-muted-foreground">Total Signals</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-success/10 to-emerald-500/10 border-success/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <TrendingUp className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-success">{teamStats.totalWins}</p>
                  <p className="text-xs text-muted-foreground">Total Wins</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Target className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-400">
                    {getWinRate(teamStats.totalWins, teamStats.totalLosses)}%
                  </p>
                  <p className="text-xs text-muted-foreground">Team Win Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Agents List */}
      <Card className="bg-card/50 border-white/[0.08]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Team Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((agent, index) => (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <Avatar className="w-12 h-12">
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {getInitials(agent.name, agent.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-card ${
                          agent.is_online ? 'bg-success' : 'bg-muted'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold truncate">
                            {agent.name || agent.email.split('@')[0]}
                          </p>
                          {agent.is_online && (
                            <Badge className="bg-success/10 text-success border-success text-[10px]">
                              Online
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{agent.email}</p>
                        {agent.last_seen_at && !agent.is_online && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Last seen {formatDistanceToNow(new Date(agent.last_seen_at))} ago
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-white/10">
                      <div className="text-center">
                        <p className="text-lg font-bold">{agent.stats?.total_signals_posted || 0}</p>
                        <p className="text-[10px] text-muted-foreground">Signals</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-success">{agent.stats?.winning_signals || 0}</p>
                        <p className="text-[10px] text-muted-foreground">Wins</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-risk">{agent.stats?.losing_signals || 0}</p>
                        <p className="text-[10px] text-muted-foreground">Losses</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-primary">
                          {getWinRate(agent.stats?.winning_signals || 0, agent.stats?.losing_signals || 0)}%
                        </p>
                        <p className="text-[10px] text-muted-foreground">Win %</p>
                      </div>
                    </div>

                    {/* Additional Stats */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        <span>{agent.stats?.clients_handled || 0} clients</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Minus className="w-3 h-3" />
                        <span>{agent.stats?.breakeven_signals || 0} BE</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {agents.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>No active agents found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentOverviewTab;
