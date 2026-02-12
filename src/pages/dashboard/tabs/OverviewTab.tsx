import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Target, Activity, Wallet, Shield, Clock, BarChart3, RefreshCw } from 'lucide-react';
import TradingBadges from '@/components/dashboard/TradingBadges';
import RiskCalculatorWidget from '@/components/dashboard/RiskCalculatorWidget';
import MarketHoursIndicator from '@/components/dashboard/MarketHoursIndicator';
import PersonalGuidanceBanner from '@/components/dashboard/PersonalGuidanceBanner';
import EconomicCalendar from '@/components/dashboard/EconomicCalendar';
import AccountHealthScore from '@/components/dashboard/AccountHealthScore';
import DailyTradingChecklist from '@/components/dashboard/DailyTradingChecklist';
import DailyEquityPrompt from '@/components/dashboard/DailyEquityPrompt';
import WeeklyLiveTradingRoom from '@/components/dashboard/WeeklyLiveTradingRoom';
import AIMarketScanner from '@/components/dashboard/AIMarketScanner';
import FeatureGate from '@/components/dashboard/FeatureGate';
import { Button } from '@/components/ui/button';

import { TradingSessionHeatmap } from '@/components/dashboard/TradingSessionHeatmap';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { usePlanFeatures } from '@/lib/hooks/usePlanFeatures';

interface OverviewTabProps {
  dashboardData: any;
}

interface RecentActivity {
  time: string;
  action: string;
  pair: string;
  type: 'BUY' | 'SELL';
  pnl?: string;
}

const OverviewTab = ({ dashboardData }: OverviewTabProps) => {
  const { user } = useAuth();
  const planFeatures = usePlanFeatures();
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoadingActivity, setIsLoadingActivity] = useState(true);
  const [showEquityPrompt, setShowEquityPrompt] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string | undefined>();

  // Fetch user's active account for components
  useEffect(() => {
    const fetchActiveAccount = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('user_prop_accounts')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .limit(1);

      if (error) {
        console.error('Error fetching active account:', error);
        return;
      }

      const row = (data as any[] | null)?.[0];
      if (row?.id) setSelectedAccountId(row.id);
    };
    fetchActiveAccount();
  }, [user]);

  // Fetch real recent activity from signals and trade journal
  useEffect(() => {
    const fetchRecentActivity = async () => {
      if (!user) {
        setIsLoadingActivity(false);
        return;
      }

      try {
        // Fetch recent signals - filtered by user_id
        const { data: signals } = await supabase
          .from('signals')
          .select('symbol, signal_type, created_at, outcome, pnl')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        // Fetch recent journal entries
        const { data: journalEntries } = await supabase
          .from('trade_journal')
          .select('symbol, trade_type, created_at, status, pnl')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        const activities: RecentActivity[] = [];

        // Convert signals to activities
        signals?.forEach(signal => {
          const timeAgo = getTimeAgo(new Date(signal.created_at));
          const action = signal.outcome === 'target_hit' ? 'Take profit hit' :
                        signal.outcome === 'stop_loss_hit' ? 'Stop loss hit' :
                        'Signal received';
          activities.push({
            time: timeAgo,
            action,
            pair: signal.symbol,
            type: signal.signal_type as 'BUY' | 'SELL',
            pnl: signal.pnl ? `${signal.pnl >= 0 ? '+' : ''}$${signal.pnl.toFixed(0)}` : undefined,
          });
        });

        // Convert journal entries to activities
        journalEntries?.forEach(entry => {
          const timeAgo = getTimeAgo(new Date(entry.created_at));
          const action = entry.status === 'closed' ? 'Trade closed' : 'Trade opened';
          activities.push({
            time: timeAgo,
            action,
            pair: entry.symbol,
            type: entry.trade_type as 'BUY' | 'SELL',
            pnl: entry.status === 'closed' && entry.pnl ? `${entry.pnl >= 0 ? '+' : ''}$${entry.pnl.toFixed(0)}` : undefined,
          });
        });

        // Sort by recency (this is approximate since we converted to strings)
        setRecentActivity(activities.slice(0, 6));
      } catch (error) {
        console.error('Error fetching recent activity:', error);
      } finally {
        setIsLoadingActivity(false);
      }
    };

    fetchRecentActivity();
  }, [user]);

  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const stats = [
    {
      label: 'Account Balance',
      value: `$${(dashboardData?.current_equity || dashboardData?.account_size || 0).toLocaleString()}`,
      change: dashboardData?.daily_pnl ? `${dashboardData.daily_pnl >= 0 ? '+' : ''}$${dashboardData.daily_pnl.toFixed(0)} today` : '',
      isPositive: (dashboardData?.daily_pnl || 0) >= 0,
      icon: Wallet
    },
    {
      label: 'Total P&L',
      value: `$${(dashboardData?.total_pnl || 0).toLocaleString()}`,
      change: '',
      isPositive: (dashboardData?.total_pnl || 0) >= 0,
      icon: TrendingUp
    },
    {
      label: 'Win Rate',
      value: `${(dashboardData?.win_rate || 0).toFixed(1)}%`,
      change: '',
      isPositive: (dashboardData?.win_rate || 0) >= 50,
      icon: Target
    },
    {
      label: 'Total Trades',
      value: dashboardData?.total_trades || 0,
      change: '',
      isPositive: true,
      icon: Activity
    },
    {
      label: 'Winning Trades',
      value: dashboardData?.winning_trades || 0,
      change: '',
      isPositive: true,
      icon: TrendingUp
    },
    {
      label: 'Losing Trades',
      value: dashboardData?.losing_trades || 0,
      change: '',
      isPositive: false,
      icon: TrendingDown
    },
    {
      label: 'Max Drawdown',
      value: `${(dashboardData?.max_drawdown || 0).toFixed(1)}%`,
      change: (dashboardData?.max_drawdown || 0) < 5 ? 'Within limits' : 'Watch closely',
      isPositive: (dashboardData?.max_drawdown || 0) < 5,
      icon: Shield
    },
    {
      label: 'Profit Factor',
      value: (dashboardData?.profit_factor || 0).toFixed(2),
      change: (dashboardData?.profit_factor || 0) > 1.5 ? 'Good' : '',
      isPositive: (dashboardData?.profit_factor || 0) > 1,
      icon: BarChart3
    }
  ];

  return (
    <div className="space-y-8">
      {/* Stats Grid - Premium Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ y: -3, transition: { type: 'spring', stiffness: 400, damping: 25 } }}
            className="relative group"
          >
            {/* Outer glow on hover */}
            <div className={`absolute -inset-[1px] rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm ${
              stat.isPositive ? 'bg-gradient-to-r from-success/30 to-emerald-500/30' : 'bg-gradient-to-r from-risk/30 to-red-500/30'
            }`} />

            <div className={`relative p-5 rounded-2xl border transition-all duration-300 overflow-hidden ${
              stat.isPositive
                ? 'bg-gradient-to-br from-[#0a120e] to-[#080c0a] border-success/20 hover:border-success/40'
                : 'bg-gradient-to-br from-[#120a0a] to-[#0c0808] border-risk/20 hover:border-risk/40'
            }`}>
              {/* Top accent line */}
              <div className={`absolute top-0 inset-x-0 h-px ${
                stat.isPositive
                  ? 'bg-gradient-to-r from-transparent via-success/40 to-transparent'
                  : 'bg-gradient-to-r from-transparent via-risk/40 to-transparent'
              }`} />

              {/* Subtle corner glow */}
              <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-20 ${
                stat.isPositive ? 'bg-success' : 'bg-risk'
              }`} />

              {/* Shimmer effect on hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent" />
              </div>

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-lg ${
                    stat.isPositive
                      ? 'bg-gradient-to-br from-success/20 to-success/5 border border-success/30 shadow-success/10'
                      : 'bg-gradient-to-br from-risk/20 to-risk/5 border border-risk/30 shadow-risk/10'
                  }`}>
                    <stat.icon className={`w-5 h-5 ${stat.isPositive ? 'text-success' : 'text-risk'}`} />
                  </div>
                  {stat.change && (
                    <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg border ${
                      stat.isPositive ? 'bg-success/10 text-success border-success/20' : 'bg-risk/10 text-risk border-risk/20'
                    }`}>
                      {stat.change}
                    </span>
                  )}
                </div>
                <p className={`text-2xl font-bold mb-1 ${
                  (stat.label === 'Total P&L' || stat.label === 'Win Rate')
                    ? stat.isPositive ? 'text-success' : 'text-risk'
                    : 'bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent'
                }`}>{stat.value}</p>
                <p className="text-xs text-white/40 font-medium">{stat.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Equity Update Modal */}
      {showEquityPrompt && (
        <DailyEquityPrompt 
          accountId={selectedAccountId}
          onClose={() => setShowEquityPrompt(false)}
        />
      )}

      {/* Recent Activity & Account Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative group"
        >
          {/* Outer glow on hover */}
          <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-primary/20 via-blue-500/20 to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />

          <div className="relative bg-gradient-to-br from-[#0c0c14] to-[#08080c] border border-white/[0.08] rounded-2xl p-6 hover:border-primary/30 transition-all duration-300 overflow-hidden">
            {/* Top accent line */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

            <h3 className="text-base font-semibold mb-5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center shadow-lg shadow-primary/10">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <span className="bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">Recent Activity</span>
            </h3>
            {isLoadingActivity ? (
              <div className="flex justify-center py-10">
                <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
              </div>
            ) : recentActivity.length === 0 ? (
              <div className="text-center py-10">
                <div className="relative w-16 h-16 mx-auto mb-4">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/10 to-blue-500/10 animate-pulse" />
                  <div className="absolute inset-1 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center">
                    <Activity className="w-6 h-6 text-white/30" />
                  </div>
                </div>
                <p className="text-sm font-medium text-white/60">No recent activity</p>
                <p className="text-xs mt-1.5 text-white/30">Start trading to see your activity here</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentActivity.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-3 px-4 -mx-2 rounded-xl hover:bg-white/[0.03] transition-colors border border-transparent hover:border-white/[0.06]"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border ${
                        activity.type === 'BUY'
                          ? 'bg-success/15 text-success border-success/30'
                          : 'bg-risk/15 text-risk border-risk/30'
                      }`}>
                        {activity.type}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-white">{activity.pair}</p>
                        <p className="text-xs text-white/40">{activity.action}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {activity.pnl && (
                        <p className={`font-bold text-sm ${activity.pnl.startsWith('+') ? 'text-success' : 'text-risk'}`}>
                          {activity.pnl}
                        </p>
                      )}
                      <p className="text-xs text-white/30">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Account Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="relative group"
        >
          {/* Outer glow on hover */}
          <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-purple-500/20 via-violet-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />

          <div className="relative bg-gradient-to-br from-[#0c0a14] to-[#080810] border border-white/[0.08] rounded-2xl p-6 hover:border-purple-500/30 transition-all duration-300 overflow-hidden">
            {/* Top accent line */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />

            <h3 className="text-base font-semibold mb-5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/5 border border-purple-500/30 flex items-center justify-center shadow-lg shadow-purple-500/10">
                <Wallet className="w-5 h-5 text-purple-400" />
              </div>
              <span className="bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">Account Summary</span>
            </h3>

            <div className="space-y-1">
              {[
                { label: 'Prop Firm', value: dashboardData?.prop_firm || 'Not Set' },
                { label: 'Account Type', value: dashboardData?.account_type || 'Not Set' },
                { label: 'Account Size', value: `$${(dashboardData?.account_size || 0).toLocaleString()}` },
                { label: 'Current Equity', value: `$${(dashboardData?.current_equity || 0).toLocaleString()}`, highlight: true },
                { label: 'Daily P&L', value: `${(dashboardData?.daily_pnl || 0) >= 0 ? '+' : ''}$${(dashboardData?.daily_pnl || 0).toFixed(2)}`, isPositive: (dashboardData?.daily_pnl || 0) >= 0 },
              ].map((item, index) => (
                <div
                  key={item.label}
                  className="flex justify-between items-center py-3 px-4 -mx-2 rounded-xl hover:bg-white/[0.03] transition-colors border border-transparent hover:border-white/[0.06]"
                >
                  <span className="text-sm text-white/40">{item.label}</span>
                  <span className={`font-semibold text-sm ${
                    item.highlight ? 'text-success' : item.isPositive !== undefined ? (item.isPositive ? 'text-success' : 'text-risk') : 'text-white'
                  }`}>{item.value}</span>
                </div>
              ))}
            </div>

            {/* Progress to Profit Target */}
            <div className="mt-6 pt-5 border-t border-white/[0.06]">
              <div className="flex justify-between text-sm mb-3">
                <span className="text-white/40">Progress to Profit Target</span>
                <span className="font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">75%</span>
              </div>
              <div className="relative w-full h-2.5 bg-white/[0.05] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '75%' }}
                  transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-primary via-purple-500 to-violet-500 rounded-full relative"
                >
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                </motion.div>
                {/* Glow under progress bar */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary via-purple-500 to-violet-500 rounded-full blur-lg opacity-30" style={{ width: '75%' }} />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Risk Calculator Widget */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="lg:col-span-2"
        >
          <RiskCalculatorWidget />
        </motion.div>
      </div>

      {/* Account Health & Daily Checklist Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <AccountHealthScore accountId={selectedAccountId} />
        </motion.div>
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <DailyTradingChecklist accountId={selectedAccountId} />
          <Button
            onClick={() => setShowEquityPrompt(true)}
            className="w-full relative overflow-hidden group bg-white/[0.03] border border-white/[0.08] hover:border-primary/30 hover:bg-primary/5 transition-all duration-300"
            variant="outline"
          >
            <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" />
            <RefreshCw className="w-4 h-4 mr-2 group-hover:rotate-180 transition-transform duration-500" />
            Update Daily Equity
          </Button>
        </motion.div>
      </div>

      {/* Market Hours & Economic Calendar - Premium styled section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <MarketHoursIndicator />
        </motion.div>
        {planFeatures.performanceAnalytics && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <EconomicCalendar />
          </motion.div>
        )}
      </div>

      {/* Pro Features - AI Market Scanner & Weekly Live Trading Room */}
      {(planFeatures.aiMarketScanner || planFeatures.weeklyLiveTradingRoom) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {planFeatures.aiMarketScanner && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="relative group"
            >
              {/* Premium glow effect */}
              <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-primary/10 to-purple-500/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="relative">
                <AIMarketScanner />
              </div>
            </motion.div>
          )}
          {planFeatures.weeklyLiveTradingRoom && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="relative group"
            >
              {/* Premium glow effect */}
              <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="relative">
                <WeeklyLiveTradingRoom />
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Trading Session Heatmap */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="relative group"
      >
        <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-indigo-500/5 to-cyan-500/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        <div className="relative">
          <TradingSessionHeatmap />
        </div>
      </motion.div>

      {/* Personal Guidance Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
      >
        <PersonalGuidanceBanner variant="full" />
      </motion.div>

      {/* Trading Badges */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1 }}
        className="relative group"
      >
        <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-amber-500/5 to-yellow-500/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        <div className="relative">
          <TradingBadges />
        </div>
      </motion.div>
    </div>
  );
};

export default OverviewTab;
