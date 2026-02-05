import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, TrendingUp, TrendingDown, Target, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DayPerformance {
  day: string;
  dayIndex: number;
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  totalPnl: number;
  avgPnl: number;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const WeekdayPerformance = () => {
  const { user } = useAuth();
  const [trades, setTrades] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTrades = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('trade_journal')
          .select('entry_date, pnl, status')
          .eq('user_id', user.id)
          .eq('status', 'closed');

        if (error) throw error;
        setTrades(data || []);
      } catch (error) {
        console.error('Error fetching trades:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrades();
  }, [user]);

  const dayPerformance = useMemo(() => {
    const performance: DayPerformance[] = DAYS.map((day, index) => ({
      day,
      dayIndex: index,
      totalTrades: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      totalPnl: 0,
      avgPnl: 0
    }));

    trades.forEach(trade => {
      const date = new Date(trade.entry_date);
      const dayIndex = date.getDay();
      const pnl = trade.pnl || 0;

      performance[dayIndex].totalTrades++;
      performance[dayIndex].totalPnl += pnl;

      if (pnl > 0) {
        performance[dayIndex].wins++;
      } else if (pnl < 0) {
        performance[dayIndex].losses++;
      }
    });

    performance.forEach(day => {
      if (day.totalTrades > 0) {
        day.winRate = (day.wins / day.totalTrades) * 100;
        day.avgPnl = day.totalPnl / day.totalTrades;
      }
    });

    // Return only trading days (Mon-Fri typically)
    return performance.filter(d => d.dayIndex >= 1 && d.dayIndex <= 5);
  }, [trades]);

  const chartData = dayPerformance.map(d => ({
    name: SHORT_DAYS[d.dayIndex],
    pnl: parseFloat(d.totalPnl.toFixed(2)),
    winRate: parseFloat(d.winRate.toFixed(1)),
    trades: d.totalTrades
  }));

  const bestDay = useMemo(() => {
    return dayPerformance
      .filter(d => d.totalTrades >= 3)
      .sort((a, b) => b.winRate - a.winRate)[0];
  }, [dayPerformance]);

  const worstDay = useMemo(() => {
    return dayPerformance
      .filter(d => d.totalTrades >= 3)
      .sort((a, b) => a.winRate - b.winRate)[0];
  }, [dayPerformance]);

  const mostProfitableDay = useMemo(() => {
    return dayPerformance
      .filter(d => d.totalTrades >= 3)
      .sort((a, b) => b.totalPnl - a.totalPnl)[0];
  }, [dayPerformance]);

  if (isLoading) {
    return (
      <Card className="glass-card border-white/10">
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="glass-card border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Weekday Performance
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Identify your most profitable trading days
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {trades.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p>No closed trades yet</p>
              <p className="text-xs">Complete some trades to see weekday analysis</p>
            </div>
          ) : (
            <>
              {/* P&L Chart */}
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                    />
                    <YAxis 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      tickFormatter={(v) => `$${v}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number, name: string) => {
                        if (name === 'pnl') return [`$${value.toFixed(2)}`, 'Total P&L'];
                        return [value, name];
                      }}
                    />
                    <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`}
                          fill={entry.pnl >= 0 ? 'hsl(var(--success))' : 'hsl(var(--risk))'}
                          fillOpacity={0.8}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Day Stats Grid */}
              <div className="grid grid-cols-5 gap-2">
                {dayPerformance.map((day) => (
                  <div
                    key={day.dayIndex}
                    className={`p-3 rounded-lg text-center ${
                      day.winRate >= 60 ? 'bg-green-500/10 border border-green-500/30' :
                      day.winRate >= 50 ? 'bg-yellow-500/10 border border-yellow-500/30' :
                      day.totalTrades > 0 ? 'bg-red-500/10 border border-red-500/30' :
                      'bg-white/5 border border-white/10'
                    }`}
                  >
                    <p className="text-xs font-medium mb-1">{SHORT_DAYS[day.dayIndex]}</p>
                    <p className="text-lg font-bold">
                      {day.totalTrades > 0 ? `${day.winRate.toFixed(0)}%` : '-'}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{day.totalTrades} trades</p>
                  </div>
                ))}
              </div>

              {/* Insights */}
              <div className="grid grid-cols-3 gap-3">
                {bestDay && (
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-green-400" />
                      <span className="text-xs text-green-400">Best Day</span>
                    </div>
                    <p className="font-semibold">{bestDay.day}</p>
                    <p className="text-xs text-muted-foreground">
                      {bestDay.winRate.toFixed(0)}% win rate
                    </p>
                  </div>
                )}

                {worstDay && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingDown className="h-4 w-4 text-red-400" />
                      <span className="text-xs text-red-400">Avoid</span>
                    </div>
                    <p className="font-semibold">{worstDay.day}</p>
                    <p className="text-xs text-muted-foreground">
                      {worstDay.winRate.toFixed(0)}% win rate
                    </p>
                  </div>
                )}

                {mostProfitableDay && (
                  <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="h-4 w-4 text-primary" />
                      <span className="text-xs text-primary">Most Profit</span>
                    </div>
                    <p className="font-semibold">{mostProfitableDay.day}</p>
                    <p className="text-xs text-muted-foreground">
                      ${mostProfitableDay.totalPnl.toFixed(0)} total
                    </p>
                  </div>
                )}
              </div>

              {/* Trading Tip */}
              {bestDay && worstDay && bestDay.dayIndex !== worstDay.dayIndex && (
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-sm">
                    💡 <strong>Tip:</strong> You perform best on {bestDay.day}s ({bestDay.winRate.toFixed(0)}% win rate). 
                    Consider being more selective on {worstDay.day}s where your win rate drops to {worstDay.winRate.toFixed(0)}%.
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
