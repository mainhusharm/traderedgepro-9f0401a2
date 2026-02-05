import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Flame, TrendingUp, TrendingDown, Zap, Trophy, AlertTriangle, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';

interface DailyResult {
  date: string;
  pnl: number;
  tradesCount: number;
  isWinningDay: boolean;
}

interface StreakData {
  currentStreak: number;
  streakType: 'winning' | 'losing' | 'none';
  longestWinStreak: number;
  longestLossStreak: number;
  recentDays: DailyResult[];
}

export const TradingStreakTracker = () => {
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    streakType: 'none',
    longestWinStreak: 0,
    longestLossStreak: 0,
    recentDays: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchStreakData();
    }
  }, [user]);

  const fetchStreakData = async () => {
    if (!user) return;

    try {
      // Fetch trades from journal grouped by day
      const { data: trades, error } = await supabase
        .from('trade_journal')
        .select('entry_date, pnl, status')
        .eq('user_id', user.id)
        .eq('status', 'closed')
        .not('pnl', 'is', null)
        .order('entry_date', { ascending: false });

      if (error) throw error;

      // Also fetch from signals
      const { data: signals } = await supabase
        .from('signals')
        .select('created_at, pnl, outcome')
        .eq('user_id', user.id)
        .not('pnl', 'is', null)
        .in('outcome', ['target_hit', 'stop_loss_hit']);

      // Combine and group by date
      const dailyResults: Record<string, { pnl: number; tradesCount: number }> = {};

      trades?.forEach((trade) => {
        const date = new Date(trade.entry_date).toISOString().split('T')[0];
        if (!dailyResults[date]) {
          dailyResults[date] = { pnl: 0, tradesCount: 0 };
        }
        dailyResults[date].pnl += trade.pnl || 0;
        dailyResults[date].tradesCount += 1;
      });

      signals?.forEach((signal) => {
        const date = new Date(signal.created_at).toISOString().split('T')[0];
        if (!dailyResults[date]) {
          dailyResults[date] = { pnl: 0, tradesCount: 0 };
        }
        dailyResults[date].pnl += signal.pnl || 0;
        dailyResults[date].tradesCount += 1;
      });

      // Convert to array and sort by date descending
      const sortedDays: DailyResult[] = Object.entries(dailyResults)
        .map(([date, data]) => ({
          date,
          pnl: data.pnl,
          tradesCount: data.tradesCount,
          isWinningDay: data.pnl > 0,
        }))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 14); // Last 14 days with trades

      // Calculate current streak
      let currentStreak = 0;
      let streakType: 'winning' | 'losing' | 'none' = 'none';

      if (sortedDays.length > 0) {
        const firstDayWinning = sortedDays[0].isWinningDay;
        streakType = firstDayWinning ? 'winning' : 'losing';

        for (const day of sortedDays) {
          if (day.isWinningDay === firstDayWinning) {
            currentStreak++;
          } else {
            break;
          }
        }
      }

      // Calculate longest streaks
      let longestWinStreak = 0;
      let longestLossStreak = 0;
      let tempWinStreak = 0;
      let tempLossStreak = 0;

      sortedDays.reverse().forEach((day) => {
        if (day.isWinningDay) {
          tempWinStreak++;
          tempLossStreak = 0;
          longestWinStreak = Math.max(longestWinStreak, tempWinStreak);
        } else {
          tempLossStreak++;
          tempWinStreak = 0;
          longestLossStreak = Math.max(longestLossStreak, tempLossStreak);
        }
      });

      setStreakData({
        currentStreak,
        streakType,
        longestWinStreak,
        longestLossStreak,
        recentDays: sortedDays.reverse().slice(0, 10),
      });
    } catch (error) {
      console.error('Error fetching streak data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStreakColor = () => {
    if (streakData.streakType === 'winning') return 'text-success';
    if (streakData.streakType === 'losing') return 'text-risk';
    return 'text-muted-foreground';
  };

  const getStreakBgColor = () => {
    if (streakData.streakType === 'winning') return 'bg-success/10 border-success/30';
    if (streakData.streakType === 'losing') return 'bg-risk/10 border-risk/30';
    return 'bg-white/5 border-white/10';
  };

  const getStreakIcon = () => {
    if (streakData.streakType === 'winning') {
      return streakData.currentStreak >= 5 ? (
        <Flame className="w-6 h-6 text-orange-400" />
      ) : (
        <TrendingUp className="w-6 h-6 text-success" />
      );
    }
    if (streakData.streakType === 'losing') {
      return <TrendingDown className="w-6 h-6 text-risk" />;
    }
    return <Zap className="w-6 h-6 text-muted-foreground" />;
  };

  const getStreakMessage = () => {
    if (streakData.streakType === 'winning') {
      if (streakData.currentStreak >= 5) return "🔥 You're on fire!";
      if (streakData.currentStreak >= 3) return "Great momentum!";
      return "Keep it going!";
    }
    if (streakData.streakType === 'losing') {
      if (streakData.currentStreak >= 3) return "Consider taking a break";
      return "Stay focused, recovery time";
    }
    return "Start trading to build streak";
  };

  if (isLoading) {
    return (
      <div className="glass-card p-6 rounded-xl animate-pulse">
        <div className="h-6 bg-white/10 rounded w-1/3 mb-4" />
        <div className="h-20 bg-white/10 rounded" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6 rounded-xl"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Flame className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Trading Streak</h3>
          <p className="text-xs text-muted-foreground">Consecutive winning/losing days</p>
        </div>
      </div>

      {/* Current Streak */}
      <div className={`p-4 rounded-xl border ${getStreakBgColor()} mb-6`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStreakIcon()}
            <div>
              <p className={`text-3xl font-bold ${getStreakColor()}`}>
                {streakData.currentStreak}
              </p>
              <p className="text-xs text-muted-foreground capitalize">
                {streakData.streakType === 'none' ? 'No streak' : `${streakData.streakType} day${streakData.currentStreak !== 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className={`text-sm font-medium ${getStreakColor()}`}>
              {getStreakMessage()}
            </p>
            {streakData.streakType === 'winning' && streakData.currentStreak >= 5 && (
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="mt-1"
              >
                <Flame className="w-5 h-5 text-orange-400 inline" />
                <Flame className="w-4 h-4 text-orange-400 inline -ml-1" />
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Streak Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-3 rounded-lg bg-success/10 border border-success/20">
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="w-4 h-4 text-success" />
            <span className="text-xs text-muted-foreground">Best Win Streak</span>
          </div>
          <p className="text-xl font-bold text-success">{streakData.longestWinStreak} days</p>
        </div>
        <div className="p-3 rounded-lg bg-risk/10 border border-risk/20">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-risk" />
            <span className="text-xs text-muted-foreground">Worst Loss Streak</span>
          </div>
          <p className="text-xl font-bold text-risk">{streakData.longestLossStreak} days</p>
        </div>
      </div>

      {/* Recent Days Visual */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Recent Trading Days</span>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {streakData.recentDays.length > 0 ? (
            streakData.recentDays.map((day, index) => (
              <motion.div
                key={day.date}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className={`relative group`}
              >
                <div
                  className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-medium ${
                    day.isWinningDay
                      ? 'bg-success/20 text-success border border-success/30'
                      : 'bg-risk/20 text-risk border border-risk/30'
                  }`}
                >
                  {day.isWinningDay ? '✓' : '✗'}
                </div>
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                  <div className="bg-background/95 backdrop-blur-sm border border-white/10 rounded-lg p-2 text-xs whitespace-nowrap shadow-lg">
                    <p className="font-medium">{new Date(day.date).toLocaleDateString()}</p>
                    <p className={day.pnl >= 0 ? 'text-success' : 'text-risk'}>
                      {day.pnl >= 0 ? '+' : ''}${day.pnl.toFixed(2)}
                    </p>
                    <p className="text-muted-foreground">{day.tradesCount} trade{day.tradesCount !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No completed trades yet</p>
          )}
        </div>
      </div>
    </motion.div>
  );
};
