import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';

interface HourPerformance {
  hour: number;
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  totalPnl: number;
}

export const TradingSessionHeatmap = () => {
  const { user } = useAuth();
  const [hourlyData, setHourlyData] = useState<HourPerformance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTradeData = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const { data: trades, error } = await supabase
          .from('trade_journal')
          .select('entry_date, pnl, status')
          .eq('user_id', user.id)
          .eq('status', 'closed');

        if (error) throw error;

        // Initialize hourly performance
        const hourlyPerformance: HourPerformance[] = Array.from({ length: 24 }, (_, hour) => ({
          hour,
          totalTrades: 0,
          wins: 0,
          losses: 0,
          winRate: 0,
          totalPnl: 0
        }));

        // Analyze trades by hour
        trades?.forEach(trade => {
          const entryDate = new Date(trade.entry_date);
          const hour = entryDate.getHours();
          const pnl = trade.pnl || 0;

          hourlyPerformance[hour].totalTrades++;
          hourlyPerformance[hour].totalPnl += pnl;

          if (pnl > 0) {
            hourlyPerformance[hour].wins++;
          } else if (pnl < 0) {
            hourlyPerformance[hour].losses++;
          }
        });

        // Calculate win rates
        hourlyPerformance.forEach(hp => {
          if (hp.totalTrades > 0) {
            hp.winRate = (hp.wins / hp.totalTrades) * 100;
          }
        });

        setHourlyData(hourlyPerformance);
      } catch (error) {
        console.error('Error fetching trade data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTradeData();
  }, [user]);

  const getHeatmapColor = (winRate: number, totalTrades: number): string => {
    if (totalTrades === 0) return 'bg-muted/30';
    if (winRate >= 70) return 'bg-green-500/80';
    if (winRate >= 55) return 'bg-green-500/50';
    if (winRate >= 45) return 'bg-yellow-500/50';
    if (winRate >= 30) return 'bg-red-500/50';
    return 'bg-red-500/80';
  };

  const formatHour = (hour: number): string => {
    return `${hour.toString().padStart(2, '0')}:00`;
  };

  const getSessionLabel = (hour: number): string => {
    if (hour >= 0 && hour < 7) return 'Sydney';
    if (hour >= 7 && hour < 9) return 'Tokyo';
    if (hour >= 9 && hour < 13) return 'London';
    if (hour >= 13 && hour < 17) return 'NY/London';
    if (hour >= 17 && hour < 22) return 'New York';
    return 'Sydney';
  };

  const bestHours = hourlyData
    .filter(h => h.totalTrades >= 3)
    .sort((a, b) => b.winRate - a.winRate)
    .slice(0, 3);

  const worstHours = hourlyData
    .filter(h => h.totalTrades >= 3)
    .sort((a, b) => a.winRate - b.winRate)
    .slice(0, 3);

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
            <Clock className="h-5 w-5 text-primary" />
            Trading Session Heatmap
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Heatmap Grid */}
          <div className="grid grid-cols-6 gap-2">
            {hourlyData.map((hourData) => (
              <div
                key={hourData.hour}
                className={`relative p-3 rounded-lg ${getHeatmapColor(hourData.winRate, hourData.totalTrades)} 
                  transition-all hover:scale-105 cursor-pointer group`}
              >
                <div className="text-center">
                  <p className="text-xs font-mono text-foreground/80">{formatHour(hourData.hour)}</p>
                  <p className="text-lg font-bold text-foreground">
                    {hourData.totalTrades > 0 ? `${hourData.winRate.toFixed(0)}%` : '-'}
                  </p>
                  <p className="text-xs text-foreground/60">{hourData.totalTrades} trades</p>
                </div>
                
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 
                  transition-opacity z-10 pointer-events-none">
                  <div className="bg-background border border-border rounded-lg p-2 shadow-lg text-xs whitespace-nowrap">
                    <p className="font-semibold">{getSessionLabel(hourData.hour)} Session</p>
                    <p>Wins: {hourData.wins} | Losses: {hourData.losses}</p>
                    <p className={hourData.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                      P&L: ${hourData.totalPnl.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-green-500/80"></div>
              <span>70%+</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-green-500/50"></div>
              <span>55-70%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-yellow-500/50"></div>
              <span>45-55%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-red-500/50"></div>
              <span>30-45%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-red-500/80"></div>
              <span>&lt;30%</span>
            </div>
          </div>

          {/* Best & Worst Hours */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-green-400" />
                <h4 className="font-semibold text-green-400">Best Hours</h4>
              </div>
              {bestHours.length > 0 ? (
                <ul className="space-y-1 text-sm">
                  {bestHours.map(h => (
                    <li key={h.hour} className="flex justify-between">
                      <span>{formatHour(h.hour)} ({getSessionLabel(h.hour)})</span>
                      <span className="font-mono">{h.winRate.toFixed(0)}%</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Need more trades (3+) to analyze</p>
              )}
            </div>

            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="h-4 w-4 text-red-400" />
                <h4 className="font-semibold text-red-400">Avoid Hours</h4>
              </div>
              {worstHours.length > 0 ? (
                <ul className="space-y-1 text-sm">
                  {worstHours.map(h => (
                    <li key={h.hour} className="flex justify-between">
                      <span>{formatHour(h.hour)} ({getSessionLabel(h.hour)})</span>
                      <span className="font-mono">{h.winRate.toFixed(0)}%</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Need more trades (3+) to analyze</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
