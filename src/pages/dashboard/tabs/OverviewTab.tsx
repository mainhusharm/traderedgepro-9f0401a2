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
import { Button } from '@/components/ui/button';

import { TradingSessionHeatmap } from '@/components/dashboard/TradingSessionHeatmap';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';

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
      {/* Account Health & Quick Actions Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AccountHealthScore accountId={selectedAccountId} />
        </div>
        <div className="space-y-4">
          <DailyTradingChecklist accountId={selectedAccountId} />
          <Button 
            onClick={() => setShowEquityPrompt(true)}
            className="w-full"
            variant="outline"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Update Daily Equity
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="glass-card p-6 rounded-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                stat.isPositive ? 'bg-success/10' : 'bg-risk/10'
              }`}>
                <stat.icon className={`w-5 h-5 ${stat.isPositive ? 'text-success' : 'text-risk'}`} />
              </div>
              {stat.change && (
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  stat.isPositive ? 'bg-success/10 text-success' : 'bg-risk/10 text-risk'
                }`}>
                  {stat.change}
                </span>
              )}
            </div>
            <p className="text-2xl font-bold mb-1">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
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

      {/* Recent Activity, Account Summary & Risk Calculator - Single Column Landscape */}
      <div className="grid grid-cols-1 gap-6">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6 rounded-xl"
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Recent Activity
          </h3>
          {isLoadingActivity ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : recentActivity.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No recent activity</p>
              <p className="text-xs">Start trading to see your activity here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between py-3 border-b border-white/[0.05] last:border-0">
                  <div className="flex items-center gap-4">
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      activity.type === 'BUY' ? 'bg-success/10 text-success' : 'bg-risk/10 text-risk'
                    }`}>
                      {activity.type}
                    </div>
                    <div>
                      <p className="font-medium">{activity.pair}</p>
                      <p className="text-sm text-muted-foreground">{activity.action}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {activity.pnl && (
                      <p className={`font-medium ${activity.pnl.startsWith('+') ? 'text-success' : 'text-risk'}`}>{activity.pnl}</p>
                    )}
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Account Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-6 rounded-xl"
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" />
            Account Summary
          </h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-white/[0.05]">
              <span className="text-muted-foreground">Prop Firm</span>
              <span className="font-semibold">{dashboardData?.prop_firm || 'Not Set'}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-white/[0.05]">
              <span className="text-muted-foreground">Account Type</span>
              <span className="font-semibold">{dashboardData?.account_type || 'Not Set'}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-white/[0.05]">
              <span className="text-muted-foreground">Account Size</span>
              <span className="font-semibold">${(dashboardData?.account_size || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-white/[0.05]">
              <span className="text-muted-foreground">Current Equity</span>
              <span className="font-semibold text-success">${(dashboardData?.current_equity || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-muted-foreground">Daily P&L</span>
              <span className={`font-semibold ${(dashboardData?.daily_pnl || 0) >= 0 ? 'text-success' : 'text-risk'}`}>
                {(dashboardData?.daily_pnl || 0) >= 0 ? '+' : ''}${(dashboardData?.daily_pnl || 0).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Progress to Profit Target */}
          <div className="mt-6 pt-4 border-t border-white/[0.05]">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Progress to Profit Target</span>
              <span className="font-medium">75%</span>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary to-success rounded-full w-3/4 transition-all" />
            </div>
          </div>
        </motion.div>

        {/* Risk Calculator Widget */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <RiskCalculatorWidget />
        </motion.div>
      </div>

      {/* Market Hours & Economic Calendar - Single Column */}
      <div className="grid grid-cols-1 gap-6">
        <MarketHoursIndicator />
        <EconomicCalendar />
      </div>

      {/* Trading Session Heatmap */}
      <TradingSessionHeatmap />

      {/* Personal Guidance Banner */}
      <PersonalGuidanceBanner variant="full" />

      {/* Trading Badges */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <TradingBadges />
      </motion.div>
    </div>
  );
};

export default OverviewTab;
