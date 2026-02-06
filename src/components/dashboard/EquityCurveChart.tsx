import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface EquityPoint {
  date: string;
  equity: number;
  pnl: number;
  drawdown: number;
}

export const EquityCurveChart = () => {
  const { user } = useAuth();
  const [equityData, setEquityData] = useState<EquityPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [initialBalance, setInitialBalance] = useState(10000);

  useEffect(() => {
    const fetchEquityData = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        // Get initial balance from questionnaire
        const { data: questionnaire } = await supabase
          .from('questionnaires')
          .select('account_size')
          .eq('user_id', user.id)
          .maybeSingle();

        const startingBalance = questionnaire?.account_size || 10000;
        setInitialBalance(startingBalance);

        // Get all closed signals with outcomes
        const { data: signals, error } = await supabase
          .from('signals')
          .select('created_at, pnl, outcome')
          .eq('user_id', user.id)
          .neq('outcome', 'pending')
          .order('created_at', { ascending: true });

        if (error) throw error;

        // Also get journal entries
        const { data: journalEntries } = await supabase
          .from('trade_journal')
          .select('entry_date, pnl, status')
          .eq('user_id', user.id)
          .eq('status', 'closed')
          .order('entry_date', { ascending: true });

        // Combine and sort all trades
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

        // Sort by date
        allTrades.sort((a, b) => a.date.getTime() - b.date.getTime());

        // Build equity curve
        let runningEquity = startingBalance;
        let peakEquity = startingBalance;
        const equityPoints: EquityPoint[] = [
          {
            date: 'Start',
            equity: startingBalance,
            pnl: 0,
            drawdown: 0
          }
        ];

        allTrades.forEach((trade, idx) => {
          runningEquity += trade.pnl;
          peakEquity = Math.max(peakEquity, runningEquity);
          const drawdown = peakEquity > 0 ? ((peakEquity - runningEquity) / peakEquity) * 100 : 0;

          equityPoints.push({
            date: trade.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            equity: parseFloat(runningEquity.toFixed(2)),
            pnl: trade.pnl,
            drawdown: parseFloat(drawdown.toFixed(2))
          });
        });

        setEquityData(equityPoints);
      } catch (error) {
        console.error('Error fetching equity data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEquityData();
  }, [user]);

  const stats = useMemo(() => {
    if (equityData.length === 0) return null;
    
    const lastPoint = equityData[equityData.length - 1];
    const totalPnl = lastPoint.equity - initialBalance;
    const returnPercent = (totalPnl / initialBalance) * 100;
    const maxDrawdown = Math.max(...equityData.map(d => d.drawdown));

    return {
      currentEquity: lastPoint.equity,
      totalPnl,
      returnPercent,
      maxDrawdown
    };
  }, [equityData, initialBalance]);

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
            <Activity className="h-5 w-5 text-primary" />
            Equity Curve
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Account growth over time with drawdown visualization
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {equityData.length <= 1 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Activity className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p>No trading history yet</p>
              <p className="text-xs">Complete trades to see your equity curve</p>
            </div>
          ) : (
            <>
              {/* Stats Row */}
              {stats && (
                <div className="grid grid-cols-4 gap-3">
                  <div className="p-3 rounded-lg bg-white/5 text-center">
                    <p className="text-xs text-muted-foreground">Current Equity</p>
                    <p className="text-lg font-bold">${stats.currentEquity.toLocaleString()}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5 text-center">
                    <p className="text-xs text-muted-foreground">Total P&L</p>
                    <p className={`text-lg font-bold ${stats.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {stats.totalPnl >= 0 ? '+' : ''}${stats.totalPnl.toFixed(2)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5 text-center">
                    <p className="text-xs text-muted-foreground">Return</p>
                    <p className={`text-lg font-bold ${stats.returnPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {stats.returnPercent >= 0 ? '+' : ''}{stats.returnPercent.toFixed(2)}%
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5 text-center">
                    <p className="text-xs text-muted-foreground">Max Drawdown</p>
                    <p className="text-lg font-bold text-orange-400">{stats.maxDrawdown.toFixed(2)}%</p>
                  </div>
                </div>
              )}

              {/* Equity Chart */}
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={equityData}>
                    <defs>
                      <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="drawdownGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--risk))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--risk))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                    />
                    <YAxis 
                      yAxisId="equity"
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                      domain={['dataMin - 500', 'dataMax + 500']}
                    />
                    <YAxis 
                      yAxisId="drawdown"
                      orientation="right"
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      tickFormatter={(v) => `${v}%`}
                      domain={[0, 'dataMax + 2']}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number, name: string) => {
                        if (name === 'equity') return [`$${value.toLocaleString()}`, 'Equity'];
                        if (name === 'drawdown') return [`${value.toFixed(2)}%`, 'Drawdown'];
                        return [value, name];
                      }}
                    />
                    <ReferenceLine 
                      yAxisId="equity"
                      y={initialBalance} 
                      stroke="hsl(var(--muted-foreground))" 
                      strokeDasharray="3 3" 
                    />
                    <Area
                      yAxisId="equity"
                      type="monotone"
                      dataKey="equity"
                      stroke="hsl(var(--primary))"
                      fill="url(#equityGradient)"
                      strokeWidth={2}
                    />
                    <Area
                      yAxisId="drawdown"
                      type="monotone"
                      dataKey="drawdown"
                      stroke="hsl(var(--risk))"
                      fill="url(#drawdownGradient)"
                      strokeWidth={1}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Legend */}
              <div className="flex items-center justify-center gap-6 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary"></div>
                  <span className="text-muted-foreground">Equity</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-risk"></div>
                  <span className="text-muted-foreground">Drawdown</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-0.5 border-t border-dashed border-muted-foreground"></div>
                  <span className="text-muted-foreground">Starting Balance</span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
