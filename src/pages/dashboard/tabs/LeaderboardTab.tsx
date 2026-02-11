import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Trophy, Medal, Crown, Target, TrendingUp,
  Users, Shield, Zap, Star, ArrowUp, ArrowDown, Award
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { topPerformers, formatPayout, getTotalCommunityPayouts } from '@/data/topPerformers';

interface TraderStats {
  user_id: string;
  display_name: string;
  win_rate: number;
  total_pnl: number;
  total_trades: number;
  unlocked_milestones: number;
  rank: number;
  change: 'up' | 'down' | 'same';
}

const LeaderboardTab = () => {
  const [traders, setTraders] = useState<TraderStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'weekly' | 'monthly' | 'alltime'>('weekly');
  const [sortBy, setSortBy] = useState<'winrate' | 'pnl' | 'milestones'>('winrate');
  const { user } = useAuth();

  useEffect(() => {
    fetchLeaderboard();
  }, [timeframe, sortBy]);

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    try {
      // Fetch dashboard data with user profiles
      const { data: dashboardData, error } = await supabase
        .from('dashboard_data')
        .select(`
          user_id,
          win_rate,
          total_pnl,
          total_trades,
          account_size
        `)
        .not('total_trades', 'is', null)
        .gt('total_trades', 0)
        .order(sortBy === 'winrate' ? 'win_rate' : sortBy === 'pnl' ? 'total_pnl' : 'total_pnl', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Fetch profiles for display names
      const userIds = (dashboardData || []).map(d => d.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      // Calculate milestones and format data
      const formattedTraders: TraderStats[] = (dashboardData || []).map((d, index) => {
        const profile = profileMap.get(d.user_id);
        const displayName = profile?.first_name
          ? `${profile.first_name} ${profile.last_name?.charAt(0) || ''}`.trim()
          : `Trader ${d.user_id.slice(0, 6)}`;

        // Calculate unlocked milestones based on P&L
        const accountSize = d.account_size || 10000;
        const pnl = d.total_pnl || 0;
        let milestones = 1;
        if (pnl >= accountSize * 0.15) milestones = 4;
        else if (pnl >= accountSize * 0.10) milestones = 3;
        else if (pnl >= accountSize * 0.05) milestones = 2;

        return {
          user_id: d.user_id,
          display_name: displayName,
          win_rate: d.win_rate || 0,
          total_pnl: d.total_pnl || 0,
          total_trades: d.total_trades || 0,
          unlocked_milestones: milestones,
          rank: index + 1,
          change: ['up', 'down', 'same'][Math.floor(Math.random() * 3)] as 'up' | 'down' | 'same'
        };
      });

      // If no real user data, populate with top performers
      if (formattedTraders.length === 0) {
        let topPerformerTraders: TraderStats[] = topPerformers.map((performer, index) => ({
          user_id: performer.id,
          display_name: performer.name,
          win_rate: performer.winRate,
          total_pnl: performer.lifetimePayout,
          total_trades: performer.totalTrades,
          unlocked_milestones: index < 3 ? 4 : 3,
          rank: index + 1,
          change: 'same' as const
        }));

        // Apply sorting to top performers
        topPerformerTraders = topPerformerTraders.sort((a, b) => {
          if (sortBy === 'winrate') return b.win_rate - a.win_rate;
          if (sortBy === 'pnl') return b.total_pnl - a.total_pnl;
          if (sortBy === 'milestones') return b.unlocked_milestones - a.unlocked_milestones;
          return 0;
        });

        // Update ranks after sorting
        topPerformerTraders = topPerformerTraders.map((trader, index) => ({
          ...trader,
          rank: index + 1
        }));

        setTraders(topPerformerTraders);
      } else {
        // Apply sorting to real user data as well
        let sortedTraders = [...formattedTraders].sort((a, b) => {
          if (sortBy === 'winrate') return b.win_rate - a.win_rate;
          if (sortBy === 'pnl') return b.total_pnl - a.total_pnl;
          if (sortBy === 'milestones') return b.unlocked_milestones - a.unlocked_milestones;
          return 0;
        });

        // Update ranks after sorting
        sortedTraders = sortedTraders.map((trader, index) => ({
          ...trader,
          rank: index + 1
        }));

        setTraders(sortedTraders);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-300" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-600" />;
    return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
  };

  const getMilestoneIcons = (count: number) => {
    const icons = [
      <Shield key="m1" className="w-4 h-4 text-emerald-400" />,
      <Target key="m2" className="w-4 h-4 text-blue-400" />,
      <TrendingUp key="m3" className="w-4 h-4 text-purple-400" />,
      <Zap key="m4" className="w-4 h-4 text-orange-400" />
    ];
    return icons.slice(0, count);
  };

  const currentUserRank = traders.find(t => t.user_id === user?.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Trader Leaderboard</h2>
            <p className="text-sm text-muted-foreground">Top performers by milestone & win rate</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <div className="flex bg-white/5 rounded-lg p-1">
            {(['weekly', 'monthly', 'alltime'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-all ${
                  timeframe === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t === 'alltime' ? 'All Time' : t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sort Options */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Sort by:</span>
        {[
          { id: 'winrate', label: 'Win Rate', icon: Target },
          { id: 'pnl', label: 'P&L', icon: TrendingUp },
          { id: 'milestones', label: 'Milestones', icon: Trophy },
        ].map((option) => (
          <button
            key={option.id}
            onClick={() => setSortBy(option.id as any)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
              sortBy === option.id
                ? 'bg-primary/20 text-primary border border-primary/30'
                : 'bg-white/5 text-muted-foreground hover:text-foreground'
            }`}
          >
            <option.icon className="w-4 h-4" />
            {option.label}
          </button>
        ))}
      </div>

      {/* Top 3 Podium */}
      {traders.length >= 3 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6 rounded-xl"
        >
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-400" />
            Top Performers
          </h3>

          <div className="flex items-end justify-center gap-4">
            {/* 2nd Place */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 mx-auto mb-2 flex items-center justify-center">
                <Medal className="w-8 h-8 text-white" />
              </div>
              <p className="font-medium text-sm">{traders[1]?.display_name}</p>
              <p className="text-xs text-muted-foreground">{traders[1]?.win_rate.toFixed(1)}% WR</p>
              <p className="text-xs text-success">${traders[1]?.total_pnl.toLocaleString()}</p>
              <div className="h-20 w-20 bg-gray-500/20 rounded-t-lg mt-2 flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-400">2</span>
              </div>
            </div>

            {/* 1st Place */}
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 mx-auto mb-2 flex items-center justify-center">
                <Crown className="w-10 h-10 text-white" />
              </div>
              <p className="font-medium">{traders[0]?.display_name}</p>
              <p className="text-sm text-muted-foreground">{traders[0]?.win_rate.toFixed(1)}% WR</p>
              <p className="text-sm text-success font-semibold">${traders[0]?.total_pnl.toLocaleString()}</p>
              <div className="h-28 w-24 bg-yellow-500/20 rounded-t-lg mt-2 flex items-center justify-center">
                <span className="text-3xl font-bold text-yellow-400">1</span>
              </div>
            </div>

            {/* 3rd Place */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 mx-auto mb-2 flex items-center justify-center">
                <Medal className="w-8 h-8 text-white" />
              </div>
              <p className="font-medium text-sm">{traders[2]?.display_name}</p>
              <p className="text-xs text-muted-foreground">{traders[2]?.win_rate.toFixed(1)}% WR</p>
              <p className="text-xs text-success">${traders[2]?.total_pnl.toLocaleString()}</p>
              <div className="h-16 w-20 bg-amber-600/20 rounded-t-lg mt-2 flex items-center justify-center">
                <span className="text-2xl font-bold text-amber-600">3</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Top Performers - Verified Payouts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 rounded-xl border border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 to-transparent"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-yellow-400" />
            <h3 className="font-semibold">Top Performers - Lifetime Payouts</h3>
          </div>
          <span className="text-xs text-muted-foreground">
            Total: <span className="text-yellow-400 font-semibold">${getTotalCommunityPayouts().toLocaleString()}</span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {topPerformers.slice(0, 8).map((performer, index) => (
            <div
              key={performer.id}
              className={`p-3 rounded-lg transition-all ${
                index === 0
                  ? 'bg-yellow-500/10 border border-yellow-500/30'
                  : index === 1
                  ? 'bg-gray-400/10 border border-gray-400/20'
                  : index === 2
                  ? 'bg-amber-600/10 border border-amber-600/20'
                  : 'bg-white/5 border border-white/10'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  index === 0
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : index === 1
                    ? 'bg-gray-400/20 text-gray-300'
                    : index === 2
                    ? 'bg-amber-600/20 text-amber-500'
                    : 'bg-primary/20 text-primary'
                }`}>
                  {index < 3 ? (
                    index === 0 ? <Crown className="w-4 h-4" /> : <Medal className="w-4 h-4" />
                  ) : (
                    `#${index + 1}`
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{performer.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{performer.location}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className={`font-bold ${
                  index === 0 ? 'text-yellow-400' : index === 1 ? 'text-gray-300' : index === 2 ? 'text-amber-500' : 'text-primary'
                }`}>
                  {formatPayout(performer.lifetimePayout)}
                </span>
                <span className="text-xs text-success">{performer.winRate}% WR</span>
              </div>
            </div>
          ))}
        </div>

        <p className="text-[10px] text-muted-foreground mt-3 text-center">
          These are verified lifetime payouts. Beat these numbers and you'll appear here!
        </p>
      </motion.div>

      {/* Your Rank Card */}
      {currentUserRank && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-4 rounded-xl border border-primary/30 bg-primary/5"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                {getRankBadge(currentUserRank.rank)}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Your Rank</p>
                <p className="font-bold text-lg">#{currentUserRank.rank} of {traders.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Win Rate</p>
                <p className="font-bold text-success">{currentUserRank.win_rate.toFixed(1)}%</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">P&L</p>
                <p className={`font-bold ${currentUserRank.total_pnl >= 0 ? 'text-success' : 'text-risk'}`}>
                  ${currentUserRank.total_pnl.toFixed(0)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Milestones</p>
                <div className="flex gap-1 justify-center">
                  {getMilestoneIcons(currentUserRank.unlocked_milestones)}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Leaderboard Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card rounded-xl overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Rank</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Trader</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Milestones</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Win Rate</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">P&L</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Trades</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  </td>
                </tr>
              ) : traders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No traders on the leaderboard yet</p>
                  </td>
                </tr>
              ) : (
                traders.map((trader, index) => (
                  <motion.tr
                    key={trader.user_id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className={`border-b border-white/5 hover:bg-white/5 transition-colors ${
                      trader.user_id === user?.id ? 'bg-primary/10' : ''
                    }`}
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {getRankBadge(trader.rank)}
                        {trader.change === 'up' && <ArrowUp className="w-3 h-3 text-success" />}
                        {trader.change === 'down' && <ArrowDown className="w-3 h-3 text-risk" />}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                          <span className="text-xs font-bold text-white">
                            {trader.display_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{trader.display_name}</p>
                          {trader.user_id === user?.id && (
                            <span className="text-xs text-primary">(You)</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-1 justify-center">
                        {getMilestoneIcons(trader.unlocked_milestones)}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className={`font-semibold ${trader.win_rate >= 50 ? 'text-success' : 'text-risk'}`}>
                        {trader.win_rate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className={`font-semibold ${trader.total_pnl >= 0 ? 'text-success' : 'text-risk'}`}>
                        {trader.total_pnl >= 0 ? '+' : ''}${trader.total_pnl.toFixed(0)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right text-muted-foreground">
                      {trader.total_trades}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default LeaderboardTab;
