import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  Clock,
  Star,
  MessageSquare,
  TrendingUp,
  Users,
  CheckCircle,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { format, differenceInMinutes, subDays } from 'date-fns';

interface AgentStats {
  totalSessions: number;
  completedSessions: number;
  avgResponseTime: number; // in minutes
  avgRating: number;
  messagesHandled: number;
  activeToday: number;
}

interface SessionMetric {
  date: string;
  count: number;
}

interface RatingDistribution {
  rating: number;
  count: number;
  percentage: number;
}

interface RecentRating {
  id: string;
  rating: number;
  feedback: string | null;
  created_at: string;
  session_id: string;
}

const AgentPerformanceDashboard = () => {
  const [stats, setStats] = useState<AgentStats>({
    totalSessions: 0,
    completedSessions: 0,
    avgResponseTime: 0,
    avgRating: 0,
    messagesHandled: 0,
    activeToday: 0
  });
  const [weeklyData, setWeeklyData] = useState<SessionMetric[]>([]);
  const [ratingDistribution, setRatingDistribution] = useState<RatingDistribution[]>([]);
  const [recentRatings, setRecentRatings] = useState<RecentRating[]>([]);
  const [totalRatings, setTotalRatings] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAgentStats();
  }, []);

  const fetchAgentStats = async () => {
    try {
      const agentId = sessionStorage.getItem('agent_id');
      if (!agentId) {
        setIsLoading(false);
        return;
      }

      // Sessions assigned to this agent
      const { data: sessions, error: sessionsError } = await supabase
        .from('guidance_sessions')
        .select('*')
        .eq('assigned_agent_id', agentId)
        .order('created_at', { ascending: false });

      if (sessionsError) throw sessionsError;

      const sessionIds = (sessions || []).map(s => s.id);

      // Messages for those sessions
      const { data: messages, error: messagesError } = sessionIds.length
        ? await supabase
            .from('guidance_messages')
            .select('*')
            .in('session_id', sessionIds)
            .order('created_at', { ascending: true })
        : { data: [], error: null };

      if (messagesError) throw messagesError;

      // Ratings for this agent
      const { data: ratings, error: ratingsError } = await (supabase
        .from('session_ratings' as any)
        .select('*')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false }) as any);

      if (ratingsError) throw ratingsError;

      // Average rating + distribution
      let avgRating = 0;
      const typedRatings = (ratings || []) as { id: string; rating: number; session_id: string; feedback: string | null; created_at: string }[];

      if (typedRatings.length > 0) {
        const totalRating = typedRatings.reduce((sum, r) => sum + r.rating, 0);
        avgRating = Math.round((totalRating / typedRatings.length) * 10) / 10;

        const distribution = [1, 2, 3, 4, 5].map(star => {
          const count = typedRatings.filter(r => r.rating === star).length;
          return {
            rating: star,
            count,
            percentage: Math.round((count / typedRatings.length) * 100)
          };
        });

        setRatingDistribution(distribution);
        setTotalRatings(typedRatings.length);
        setRecentRatings(typedRatings.slice(0, 5));
      } else {
        setRatingDistribution([1, 2, 3, 4, 5].map(r => ({ rating: r, count: 0, percentage: 0 })));
        setTotalRatings(0);
        setRecentRatings([]);
      }

      // Avg response time: user message -> next agent message in same session
      const responseTimes: number[] = [];
      const msgs = (messages || []) as any[];
      const bySession = msgs.reduce((acc, msg) => {
        (acc[msg.session_id] ||= []).push(msg);
        return acc;
      }, {} as Record<string, any[]>);

      (Object.values(bySession) as any[][]).forEach((sessionMsgs) => {
        const sorted = sessionMsgs.slice().sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

        for (let i = 0; i < sorted.length; i++) {
          const msg = sorted[i];
          if (msg.sender_type !== 'user') continue;

          const nextAgent = sorted.slice(i + 1).find(m => m.sender_type === 'agent');
          if (!nextAgent) continue;

          const mins = differenceInMinutes(new Date(nextAgent.created_at), new Date(msg.created_at));
          if (mins > 0 && mins < 24 * 60) responseTimes.push(mins);
        }
      });

      const avgResponseTime = responseTimes.length > 0
        ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
        : 0;

      // Weekly session activity (created_at)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(new Date(), 6 - i);
        return format(date, 'yyyy-MM-dd');
      });

      const weeklyMetrics = last7Days.map(date => ({
        date,
        count: (sessions || []).filter(s => format(new Date(s.created_at), 'yyyy-MM-dd') === date).length
      }));

      const today = format(new Date(), 'yyyy-MM-dd');
      const activeToday = (sessions || []).filter(s => format(new Date(s.created_at), 'yyyy-MM-dd') === today).length;

      setStats({
        totalSessions: sessions?.length || 0,
        completedSessions: sessions?.filter(s => s.status === 'completed').length || 0,
        avgResponseTime,
        avgRating: avgRating || 0,
        messagesHandled: (messages || []).filter(m => m.sender_type === 'agent' && m.sender_id === agentId).length,
        activeToday,
      });

      setWeeklyData(weeklyMetrics);
    } catch (error) {
      console.error('Error fetching agent stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const completionRate = stats.totalSessions > 0
    ? Math.round((stats.completedSessions / stats.totalSessions) * 100)
    : 0;

  const maxCount = Math.max(...weeklyData.map(d => d.count), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">Performance Dashboard</h3>
          <p className="text-sm text-muted-foreground">Your session metrics and stats</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalSessions}</p>
                <p className="text-xs text-muted-foreground">Total Sessions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.completedSessions}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.avgResponseTime}m</p>
                <p className="text-xs text-muted-foreground">Avg Response</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Star className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.avgRating > 0 ? stats.avgRating.toFixed(1) : 'N/A'}</p>
                <p className="text-xs text-muted-foreground">Avg Rating</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Weekly Activity Chart */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              Weekly Session Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between h-32 gap-2">
              {weeklyData.map((day, i) => (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(day.count / maxCount) * 100}%` }}
                    transition={{ delay: i * 0.1, duration: 0.5 }}
                    className="w-full bg-gradient-to-t from-primary to-primary/50 rounded-t-md min-h-[4px]"
                    style={{ minHeight: day.count > 0 ? '8px' : '4px' }}
                  />
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(day.date), 'EEE')}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Completion Rate */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-success" />
              Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-4xl font-bold">{completionRate}%</span>
              <Badge variant="outline" className="text-success border-success">
                {completionRate >= 80 ? 'Excellent' : completionRate >= 60 ? 'Good' : 'Needs Work'}
              </Badge>
            </div>
            <Progress value={completionRate} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{stats.completedSessions} completed</span>
              <span>{stats.totalSessions - stats.completedSessions} pending</span>
            </div>
          </CardContent>
        </Card>

        {/* Rating Distribution */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-400" />
              Rating Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {totalRatings > 0 ? (
              <>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl font-bold">{stats.avgRating.toFixed(1)}</span>
                  <span className="text-sm text-muted-foreground">{totalRatings} ratings</span>
                </div>
                {ratingDistribution.slice().reverse().map((item, i) => (
                  <div key={item.rating} className="flex items-center gap-2">
                    <span className="text-xs w-6 text-muted-foreground">{item.rating}★</span>
                    <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.percentage}%` }}
                        transition={{ delay: i * 0.1, duration: 0.5 }}
                        className={`h-full rounded-full ${
                          item.rating >= 4 ? 'bg-yellow-400' :
                          item.rating >= 3 ? 'bg-yellow-600' : 'bg-orange-500'
                        }`}
                      />
                    </div>
                    <span className="text-xs w-8 text-right text-muted-foreground">{item.count}</span>
                  </div>
                ))}
              </>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <Star className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No ratings yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Ratings */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            Recent Ratings & Feedback
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentRatings.length > 0 ? (
            <div className="space-y-3">
              {recentRatings.map((rating, i) => (
                <motion.div
                  key={rating.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-3 rounded-lg bg-white/5 border border-white/10"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= rating.rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-muted-foreground/30'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(rating.created_at), 'MMM d, h:mm a')}
                    </span>
                  </div>
                  {rating.feedback ? (
                    <p className="text-sm text-muted-foreground italic">
                      "{rating.feedback}"
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground/50">No feedback provided</p>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No ratings received yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.messagesHandled}</p>
              <p className="text-sm text-muted-foreground">Messages Sent</p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
              <Activity className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.activeToday}</p>
              <p className="text-sm text-muted-foreground">Active Today</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AgentPerformanceDashboard;
