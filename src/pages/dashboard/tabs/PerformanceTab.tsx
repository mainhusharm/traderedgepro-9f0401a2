import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, TrendingDown, Target, Shield, Activity, PieChart, Calendar } from 'lucide-react';
import { SmartPositionSizer } from '@/components/dashboard/SmartPositionSizer';
import { WeekdayPerformance } from '@/components/dashboard/WeekdayPerformance';
import { EquityCurveChart } from '@/components/dashboard/EquityCurveChart';
import { MonthlyCalendarHeatmap } from '@/components/dashboard/MonthlyCalendarHeatmap';
import { TradingStreakTracker } from '@/components/dashboard/TradingStreakTracker';
import { MonteCarloWidget } from '@/components/dashboard/MonteCarloWidget';
import { ExpectancyWidget } from '@/components/dashboard/ExpectancyWidget';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { useQuery } from '@tanstack/react-query';

interface PerformanceTabProps {
  dashboardData: any;
}

interface WeeklyData {
  week: string;
  pnl: number;
  trades: number;
}

const PerformanceTab = ({ dashboardData }: PerformanceTabProps) => {
  const { user } = useAuth();
  const [weeklyPnL, setWeeklyPnL] = useState<WeeklyData[]>([]);
  const [isLoadingWeekly, setIsLoadingWeekly] = useState(true);

  // Fetch user's first prop account for widgets
  const { data: activeAccount } = useQuery({
    queryKey: ['user-first-prop-account', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('user_prop_accounts')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!user
  });

  // Fetch weekly P&L data from actual trades
  useEffect(() => {
    const fetchWeeklyData = async () => {
      if (!user) {
        setIsLoadingWeekly(false);
        return;
      }

      try {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        // Get first and last day of current month
        const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
        const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

        // Fetch signals for current month
        const { data: signals } = await supabase
          .from('signals')
          .select('created_at, pnl, outcome')
          .eq('user_id', user.id)
          .gte('created_at', firstDayOfMonth.toISOString())
          .lte('created_at', lastDayOfMonth.toISOString())
          .neq('outcome', 'pending');

        // Fetch journal entries for current month
        const { data: journalEntries } = await supabase
          .from('trade_journal')
          .select('entry_date, pnl, status')
          .eq('user_id', user.id)
          .gte('entry_date', firstDayOfMonth.toISOString().split('T')[0])
          .lte('entry_date', lastDayOfMonth.toISOString().split('T')[0])
          .eq('status', 'closed');

        // Combine all trades
        const allTrades: { date: Date; pnl: number }[] = [];

        signals?.forEach(s => {
          if (s.pnl !== null) {
            allTrades.push({ date: new Date(s.created_at), pnl: s.pnl });
          }
        });

        journalEntries?.forEach(j => {
          if (j.pnl !== null) {
            allTrades.push({ date: new Date(j.entry_date), pnl: j.pnl });
          }
        });

        // Group by week of month
        const weeklyData: WeeklyData[] = [
          { week: 'Week 1', pnl: 0, trades: 0 },
          { week: 'Week 2', pnl: 0, trades: 0 },
          { week: 'Week 3', pnl: 0, trades: 0 },
          { week: 'Week 4', pnl: 0, trades: 0 },
          { week: 'Week 5', pnl: 0, trades: 0 },
        ];

        allTrades.forEach(trade => {
          const dayOfMonth = trade.date.getDate();
          const weekIndex = Math.min(Math.floor((dayOfMonth - 1) / 7), 4);
          weeklyData[weekIndex].pnl += trade.pnl;
          weeklyData[weekIndex].trades += 1;
        });

        // Filter out weeks with no trades
        const filteredWeeks = weeklyData.filter(w => w.trades > 0 || weeklyData.indexOf(w) < 4);
        setWeeklyPnL(filteredWeeks.slice(0, 4)); // Max 4 weeks
      } catch (error) {
        console.error('Error fetching weekly data:', error);
      } finally {
        setIsLoadingWeekly(false);
      }
    };

    fetchWeeklyData();
  }, [user]);

  const monthlyTotal = useMemo(() => {
    return weeklyPnL.reduce((sum, week) => sum + week.pnl, 0);
  }, [weeklyPnL]);

  const maxWeeklyPnL = useMemo(() => {
    const values = weeklyPnL.map(w => Math.abs(w.pnl));
    return Math.max(...values, 100); // Minimum 100 for scale
  }, [weeklyPnL]);

  const metrics = [
    { label: 'Total P&L', value: `$${(dashboardData?.total_pnl || 0).toFixed(2)}`, icon: TrendingUp, color: 'success' },
    { label: 'Win Rate', value: `${(dashboardData?.win_rate || 0).toFixed(1)}%`, icon: Target, color: 'primary' },
    { label: 'Total Trades', value: dashboardData?.total_trades || 0, icon: Activity, color: 'accent' },
    { label: 'Profit Factor', value: (dashboardData?.profit_factor || 0).toFixed(2), icon: BarChart3, color: 'success' },
    { label: 'Max Drawdown', value: `${(dashboardData?.max_drawdown || 0).toFixed(2)}%`, icon: Shield, color: 'risk' },
    { label: 'Avg Win', value: `$${(dashboardData?.average_win || 0).toFixed(2)}`, icon: TrendingUp, color: 'success' },
    { label: 'Avg Loss', value: `$${(dashboardData?.average_loss || 0).toFixed(2)}`, icon: TrendingDown, color: 'risk' },
    { label: 'Current Drawdown', value: `${(dashboardData?.current_drawdown || 0).toFixed(2)}%`, icon: Shield, color: 'warning' },
  ];

  const tradeDistribution = [
    { label: 'Winning Trades', value: dashboardData?.winning_trades || 0, color: 'bg-success' },
    { label: 'Losing Trades', value: dashboardData?.losing_trades || 0, color: 'bg-risk' },
  ];

  const totalTrades = (dashboardData?.winning_trades || 0) + (dashboardData?.losing_trades || 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Performance Analytics</h2>
          <p className="text-sm text-muted-foreground">Track your trading performance metrics</p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="glass-card p-6 rounded-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${metric.color}/10`}>
                <metric.icon className={`w-5 h-5 text-${metric.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold mb-1">{metric.value}</p>
            <p className="text-sm text-muted-foreground">{metric.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Win/Loss Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6 rounded-xl"
        >
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-primary" />
            Trade Distribution
          </h3>
          
          <div className="flex items-center justify-center mb-6">
            {/* Simple pie chart visualization */}
            <div className="relative w-40 h-40">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  fill="transparent"
                  stroke="hsl(var(--risk))"
                  strokeWidth="20"
                />
                {totalTrades > 0 && (
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    fill="transparent"
                    stroke="hsl(var(--success))"
                    strokeWidth="20"
                    strokeDasharray={`${((dashboardData?.winning_trades || 0) / totalTrades) * 440} 440`}
                  />
                )}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-3xl font-bold">{(dashboardData?.win_rate || 0).toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground">Win Rate</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {tradeDistribution.map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${item.color}`} />
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                </div>
                <span className="font-semibold">{item.value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Monthly Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-6 rounded-xl"
        >
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Monthly Summary
          </h3>
          
          {isLoadingWeekly ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : weeklyPnL.every(w => w.trades === 0) ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <Calendar className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">No trades this month</p>
            </div>
          ) : (
            <div className="space-y-4">
              {weeklyPnL.map((week) => {
                const width = maxWeeklyPnL > 0 ? (Math.abs(week.pnl) / maxWeeklyPnL) * 100 : 0;
                
                return (
                  <div key={week.week} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {week.week} {week.trades > 0 && <span className="text-xs">({week.trades} trades)</span>}
                      </span>
                      <span className={week.pnl >= 0 ? 'text-success' : 'text-risk'}>
                        {week.pnl >= 0 ? '+' : ''}${week.pnl.toFixed(2)}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${week.pnl >= 0 ? 'bg-success' : 'bg-risk'}`}
                        style={{ width: `${Math.min(width, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-white/[0.05]">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Monthly Total</span>
              <span className={`text-xl font-bold ${monthlyTotal >= 0 ? 'text-success' : 'text-risk'}`}>
                {monthlyTotal >= 0 ? '+' : ''}${monthlyTotal.toFixed(2)}
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Equity Curve & Monthly Calendar */}
      <div className="grid lg:grid-cols-2 gap-8">
        <EquityCurveChart />
        <MonthlyCalendarHeatmap />
      </div>

      {/* Streak Tracker & Smart Position Sizer */}
      <div className="grid lg:grid-cols-2 gap-8">
        <TradingStreakTracker />
        <SmartPositionSizer />
      </div>

      {/* Weekday Performance - Full Width */}
      <WeekdayPerformance />

      {/* Statistical Edge Analysis */}
      {activeAccount && (
        <div className="grid lg:grid-cols-2 gap-8">
          <ExpectancyWidget accountId={activeAccount.id} />
          <MonteCarloWidget accountId={activeAccount.id} />
        </div>
      )}
    </div>
  );
};

export default PerformanceTab;
