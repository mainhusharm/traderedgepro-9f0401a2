import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';

interface DayData {
  date: Date;
  pnl: number;
  trades: number;
}

export const MonthlyCalendarHeatmap = () => {
  const { user } = useAuth();
  const [trades, setTrades] = useState<any[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTrades = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        // Get signals
        const { data: signals } = await supabase
          .from('signals')
          .select('created_at, pnl, outcome')
          .eq('user_id', user.id)
          .neq('outcome', 'pending');

        // Get journal entries
        const { data: journalEntries } = await supabase
          .from('trade_journal')
          .select('entry_date, pnl, status')
          .eq('user_id', user.id)
          .eq('status', 'closed');

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

        setTrades(allTrades);
      } catch (error) {
        console.error('Error fetching trades:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrades();
  }, [user]);

  const calendarData = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    // Group trades by day
    const dayMap = new Map<string, DayData>();
    
    trades.forEach(trade => {
      const tradeDate = new Date(trade.date);
      if (tradeDate.getMonth() === month && tradeDate.getFullYear() === year) {
        const key = tradeDate.toDateString();
        const existing = dayMap.get(key) || { date: tradeDate, pnl: 0, trades: 0 };
        existing.pnl += trade.pnl;
        existing.trades += 1;
        dayMap.set(key, existing);
      }
    });

    // Build calendar grid
    const weeks: (DayData | null)[][] = [];
    let currentWeek: (DayData | null)[] = [];

    // Add empty cells for days before the first of month
    for (let i = 0; i < startDayOfWeek; i++) {
      currentWeek.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const key = date.toDateString();
      const dayData = dayMap.get(key) || { date, pnl: 0, trades: 0 };
      
      currentWeek.push(dayData);

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    // Add remaining days
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);
    }

    return weeks;
  }, [trades, currentMonth]);

  const monthStats = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const monthTrades = trades.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === month && d.getFullYear() === year;
    });

    const totalPnl = monthTrades.reduce((sum, t) => sum + t.pnl, 0);
    const winningDays = new Set<string>();
    const losingDays = new Set<string>();

    monthTrades.forEach(t => {
      const key = new Date(t.date).toDateString();
      if (t.pnl > 0) winningDays.add(key);
      else if (t.pnl < 0) losingDays.add(key);
    });

    return {
      totalPnl,
      totalTrades: monthTrades.length,
      tradingDays: new Set(monthTrades.map(t => new Date(t.date).toDateString())).size,
      winningDays: winningDays.size,
      losingDays: losingDays.size
    };
  }, [trades, currentMonth]);

  const getCellColor = (pnl: number, trades: number): string => {
    if (trades === 0) return 'bg-white/5';
    if (pnl > 100) return 'bg-green-500/80';
    if (pnl > 50) return 'bg-green-500/60';
    if (pnl > 0) return 'bg-green-500/40';
    if (pnl > -50) return 'bg-red-500/40';
    if (pnl > -100) return 'bg-red-500/60';
    return 'bg-red-500/80';
  };

  const navigateMonth = (direction: number) => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + direction, 1));
  };

  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Monthly P&L Calendar
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigateMonth(-1)}>
                ←
              </Button>
              <span className="text-sm font-medium min-w-[120px] text-center">
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <Button variant="ghost" size="sm" onClick={() => navigateMonth(1)}>
                →
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Month Stats */}
          <div className="grid grid-cols-5 gap-2 text-center text-xs">
            <div className="p-2 rounded-lg bg-white/5">
              <p className="text-muted-foreground">Total P&L</p>
              <p className={`font-bold ${monthStats.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                ${monthStats.totalPnl.toFixed(0)}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-white/5">
              <p className="text-muted-foreground">Trades</p>
              <p className="font-bold">{monthStats.totalTrades}</p>
            </div>
            <div className="p-2 rounded-lg bg-white/5">
              <p className="text-muted-foreground">Trading Days</p>
              <p className="font-bold">{monthStats.tradingDays}</p>
            </div>
            <div className="p-2 rounded-lg bg-green-500/10">
              <p className="text-green-400">Green Days</p>
              <p className="font-bold text-green-400">{monthStats.winningDays}</p>
            </div>
            <div className="p-2 rounded-lg bg-red-500/10">
              <p className="text-red-400">Red Days</p>
              <p className="font-bold text-red-400">{monthStats.losingDays}</p>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="space-y-1">
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1">
              {DAYS.map(day => (
                <div key={day} className="text-center text-xs text-muted-foreground py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar weeks */}
            {calendarData.map((week, weekIdx) => (
              <div key={weekIdx} className="grid grid-cols-7 gap-1">
                {week.map((day, dayIdx) => (
                  <div
                    key={dayIdx}
                    className={`aspect-square rounded-md flex flex-col items-center justify-center relative group cursor-pointer transition-all hover:scale-105 ${
                      day ? getCellColor(day.pnl, day.trades) : 'bg-transparent'
                    }`}
                  >
                    {day && (
                      <>
                        <span className="text-xs font-medium">{day.date.getDate()}</span>
                        {day.trades > 0 && (
                          <span className="text-[9px] opacity-70">{day.trades}</span>
                        )}
                        
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                          <div className="bg-background border border-border rounded-lg p-2 shadow-lg text-xs whitespace-nowrap">
                            <p className="font-medium">{day.date.toLocaleDateString()}</p>
                            <p className={day.pnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                              P&L: ${day.pnl.toFixed(2)}
                            </p>
                            <p className="text-muted-foreground">{day.trades} trade(s)</p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-2 text-xs pt-2">
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-red-500/80"></div>
              <span>&lt;-$100</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-red-500/40"></div>
              <span>-$50</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-white/5"></div>
              <span>$0</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-green-500/40"></div>
              <span>+$50</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-green-500/80"></div>
              <span>&gt;+$100</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
