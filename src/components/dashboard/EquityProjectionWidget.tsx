import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Target, Calendar, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface EquityProjectionWidgetProps {
  accountId: string;
  userId: string;
}

interface ProjectionData {
  currentEquity: number;
  startingBalance: number;
  profitTarget: number;
  winRate: number;
  avgRPerTrade: number;
  tradesPerDay: number;
  daysToTarget: number | null;
  projection30d: number;
  projection60d: number;
  projection90d: number;
}

export default function EquityProjectionWidget({ accountId, userId }: EquityProjectionWidgetProps) {
  const [data, setData] = useState<ProjectionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjectionData();
  }, [accountId, userId]);

  const fetchProjectionData = async () => {
    try {
      // Get account data
      const { data: account, error: accountError } = await supabase
        .from('user_prop_accounts')
        .select('current_equity, starting_balance, profit_target')
        .eq('id', accountId)
        .single();

      if (accountError) throw accountError;

      // Get trade history for calculations - cast to any to avoid type issues
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data: trades, error: tradesError } = await (supabase
        .from('user_trade_allocations' as any)
        .select('actual_pnl, created_at, status')
        .eq('user_id', userId)
        .eq('account_id', accountId)
        .eq('status', 'closed')
        .gte('created_at', thirtyDaysAgo) as any);

      if (tradesError) throw tradesError;

      const tradeList = (trades || []) as any[];
      if (tradeList.length < 5) {
        setData(null);
        setLoading(false);
        return;
      }

      // Calculate metrics
      const wins = tradeList.filter(t => (t.actual_pnl || 0) > 0).length;
      const winRate = (wins / tradeList.length) * 100;

      // Calculate average R (simplified: average P&L / risk amount, assuming 1% risk)
      const avgPnl = tradeList.reduce((sum, t) => sum + (t.actual_pnl || 0), 0) / tradeList.length;
      const riskAmount = (account.starting_balance || 10000) * 0.01; // 1% risk
      const avgRPerTrade = avgPnl / riskAmount;

      // Calculate trades per day
      const tradingDays = new Set(tradeList.map(t => t.created_at.split('T')[0])).size;
      const tradesPerDay = tradeList.length / Math.max(tradingDays, 1);

      // Calculate expected value per trade
      const expectedValuePerTrade = avgPnl;

      // Daily expected P&L
      const dailyExpectedPnL = expectedValuePerTrade * tradesPerDay;

      // Projections
      const currentEquity = account.current_equity || account.starting_balance || 10000;
      const projection30d = currentEquity + (dailyExpectedPnL * 22); // ~22 trading days
      const projection60d = currentEquity + (dailyExpectedPnL * 44);
      const projection90d = currentEquity + (dailyExpectedPnL * 66);

      // Days to profit target
      const profitTarget = account.profit_target || (account.starting_balance * 0.1);
      const remainingProfit = profitTarget - (currentEquity - (account.starting_balance || 10000));
      const daysToTarget = dailyExpectedPnL > 0 
        ? Math.ceil(remainingProfit / dailyExpectedPnL) 
        : null;

      setData({
        currentEquity,
        startingBalance: account.starting_balance || 10000,
        profitTarget,
        winRate,
        avgRPerTrade,
        tradesPerDay,
        daysToTarget: daysToTarget && daysToTarget > 0 ? daysToTarget : null,
        projection30d,
        projection60d,
        projection90d,
      });
    } catch (error) {
      console.error('Error fetching projection data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4" />
            Equity Projection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-16 bg-muted rounded" />
            <div className="h-8 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4" />
            Equity Projection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">Need at least 5 closed trades</p>
            <p className="text-xs text-muted-foreground mt-1">Projections will appear once you have more data</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isOnTrack = data.daysToTarget && data.daysToTarget <= 30;
  const progressToTarget = Math.min(100, ((data.currentEquity - data.startingBalance) / data.profitTarget) * 100);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Equity Projection
          </div>
          {data.daysToTarget && (
            <Badge variant={isOnTrack ? 'default' : 'secondary'}>
              {isOnTrack ? '🎯 On Track' : '📊 Building'}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current metrics */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 bg-muted/30 rounded-lg">
            <p className="text-xs text-muted-foreground">Win Rate</p>
            <p className="text-sm font-semibold">{data.winRate.toFixed(0)}%</p>
          </div>
          <div className="p-2 bg-muted/30 rounded-lg">
            <p className="text-xs text-muted-foreground">Avg R</p>
            <p className={`text-sm font-semibold ${data.avgRPerTrade >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data.avgRPerTrade >= 0 ? '+' : ''}{data.avgRPerTrade.toFixed(2)}R
            </p>
          </div>
          <div className="p-2 bg-muted/30 rounded-lg">
            <p className="text-xs text-muted-foreground">Trades/Day</p>
            <p className="text-sm font-semibold">{data.tradesPerDay.toFixed(1)}</p>
          </div>
        </div>

        {/* Time to target */}
        {data.daysToTarget && (
          <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Target: ${data.profitTarget.toLocaleString()}</span>
                  <span className="text-xs text-muted-foreground">{progressToTarget.toFixed(0)}%</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  ~{data.daysToTarget} trading days at current pace
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Projections */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <Zap className="h-3 w-3" />
            Projected Equity
          </p>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 border rounded-lg">
              <p className="text-xs text-muted-foreground">30 Days</p>
              <p className={`text-sm font-semibold ${data.projection30d >= data.currentEquity ? 'text-green-600' : 'text-red-600'}`}>
                ${data.projection30d.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="text-center p-2 border rounded-lg">
              <p className="text-xs text-muted-foreground">60 Days</p>
              <p className={`text-sm font-semibold ${data.projection60d >= data.currentEquity ? 'text-green-600' : 'text-red-600'}`}>
                ${data.projection60d.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="text-center p-2 border rounded-lg">
              <p className="text-xs text-muted-foreground">90 Days</p>
              <p className={`text-sm font-semibold ${data.projection90d >= data.currentEquity ? 'text-green-600' : 'text-red-600'}`}>
                ${data.projection90d.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground text-center">
            Based on last 30 days performance. Past results don't guarantee future returns.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
