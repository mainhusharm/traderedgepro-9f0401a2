import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Calculator, 
  TrendingUp, 
  TrendingDown,
  Percent,
  DollarSign,
  Loader2,
  Info
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ExpectancyWidgetProps {
  accountId: string;
}

interface ExpectancyData {
  totalTrades: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  expectancy: number;
  expectancyR: number;
  profitFactor: number;
  payoffRatio: number;
  requiredWinRate: number;
}

export function ExpectancyWidget({ accountId }: ExpectancyWidgetProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ExpectancyData | null>(null);

  useEffect(() => {
    if (accountId && user) {
      calculateExpectancy();
    }
  }, [accountId, user]);

  const calculateExpectancy = async () => {
    try {
      setLoading(true);

      // Fetch completed trades
      const { data: allocations } = await supabase
        .from('user_trade_allocations')
        .select('realized_pnl, r_multiple')
        .eq('account_id', accountId)
        .not('realized_pnl', 'is', null)
        .order('closed_at', { ascending: false })
        .limit(100);

      if (!allocations || allocations.length < 3) {
        setLoading(false);
        return;
      }

      const wins = allocations.filter(a => (a.realized_pnl || 0) > 0);
      const losses = allocations.filter(a => (a.realized_pnl || 0) < 0);

      const totalTrades = allocations.length;
      const winRate = wins.length / totalTrades;
      const lossRate = 1 - winRate;

      const avgWin = wins.length > 0 
        ? wins.reduce((s, a) => s + (a.realized_pnl || 0), 0) / wins.length 
        : 0;
      const avgLoss = losses.length > 0 
        ? Math.abs(losses.reduce((s, a) => s + (a.realized_pnl || 0), 0) / losses.length)
        : 0;

      const avgWinR = wins.length > 0
        ? wins.reduce((s, a) => s + (a.r_multiple || 0), 0) / wins.length
        : 0;
      const avgLossR = losses.length > 0
        ? Math.abs(losses.reduce((s, a) => s + (a.r_multiple || 0), 0) / losses.length)
        : 0;

      // Expectancy = (Win% × Avg Win) - (Loss% × Avg Loss)
      const expectancy = (winRate * avgWin) - (lossRate * avgLoss);
      const expectancyR = (winRate * avgWinR) - (lossRate * avgLossR);

      // Profit Factor = (Total Wins) / (Total Losses)
      const totalWins = wins.reduce((s, a) => s + (a.realized_pnl || 0), 0);
      const totalLosses = Math.abs(losses.reduce((s, a) => s + (a.realized_pnl || 0), 0));
      const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins;

      // Payoff Ratio = Avg Win / Avg Loss
      const payoffRatio = avgLoss > 0 ? avgWin / avgLoss : avgWin;

      // Required Win Rate for breakeven = 1 / (1 + Payoff Ratio)
      const requiredWinRate = payoffRatio > 0 ? (1 / (1 + payoffRatio)) * 100 : 50;

      setData({
        totalTrades,
        winRate: winRate * 100,
        avgWin,
        avgLoss,
        expectancy,
        expectancyR,
        profitFactor,
        payoffRatio,
        requiredWinRate
      });

    } catch (error) {
      console.error('Error calculating expectancy:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-card/50 backdrop-blur-xl border-border/30">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="bg-card/50 backdrop-blur-xl border-border/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Trade Expectancy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Need at least 3 completed trades to calculate expectancy
          </p>
        </CardContent>
      </Card>
    );
  }

  const isPositiveExpectancy = data.expectancy > 0;
  const hasEdge = data.winRate > data.requiredWinRate;

  return (
    <TooltipProvider>
      <Card className="bg-card/50 backdrop-blur-xl border-border/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              Trade Expectancy
            </span>
            <Badge 
              className={isPositiveExpectancy 
                ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                : 'bg-red-500/20 text-red-400 border-red-500/30'
              }
            >
              {isPositiveExpectancy ? '+Edge' : 'No Edge'}
            </Badge>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Main Expectancy Display */}
          <div className={`p-4 rounded-lg text-center ${
            isPositiveExpectancy 
              ? 'bg-green-500/10 border border-green-500/20' 
              : 'bg-red-500/10 border border-red-500/20'
          }`}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="cursor-help">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1">
                    Expected Value Per Trade
                    <Info className="h-3 w-3" />
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    {isPositiveExpectancy ? (
                      <TrendingUp className="h-6 w-6 text-green-400" />
                    ) : (
                      <TrendingDown className="h-6 w-6 text-red-400" />
                    )}
                    <span className={`text-3xl font-mono font-bold ${
                      isPositiveExpectancy ? 'text-green-400' : 'text-red-400'
                    }`}>
                      ${data.expectancy.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    ({data.expectancyR.toFixed(2)}R per trade)
                  </p>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-xs">
                  Expectancy = (Win% × Avg Win) - (Loss% × Avg Loss)<br/>
                  This is your average expected profit/loss per trade.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Win Rate */}
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-1 mb-1">
                <Percent className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Win Rate</span>
              </div>
              <div className="flex items-center justify-between">
                <span className={`font-mono font-bold ${
                  data.winRate >= 50 ? 'text-green-400' : 'text-yellow-400'
                }`}>
                  {data.winRate.toFixed(1)}%
                </span>
                <span className="text-xs text-muted-foreground">
                  ({data.totalTrades} trades)
                </span>
              </div>
            </div>

            {/* Profit Factor */}
            <div className="p-3 bg-muted/30 rounded-lg">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="cursor-help">
                    <div className="flex items-center gap-1 mb-1">
                      <DollarSign className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Profit Factor</span>
                    </div>
                    <span className={`font-mono font-bold ${
                      data.profitFactor >= 1.5 ? 'text-green-400' : 
                      data.profitFactor >= 1 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {data.profitFactor.toFixed(2)}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Total wins ÷ Total losses. Above 1.5 is good.</p>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Average Win */}
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-1 mb-1">
                <TrendingUp className="h-3 w-3 text-green-400" />
                <span className="text-xs text-muted-foreground">Avg Win</span>
              </div>
              <span className="font-mono text-green-400">
                ${data.avgWin.toFixed(2)}
              </span>
            </div>

            {/* Average Loss */}
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-1 mb-1">
                <TrendingDown className="h-3 w-3 text-red-400" />
                <span className="text-xs text-muted-foreground">Avg Loss</span>
              </div>
              <span className="font-mono text-red-400">
                -${data.avgLoss.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Edge Analysis */}
          <div className={`p-3 rounded-lg ${
            hasEdge 
              ? 'bg-green-500/10 border border-green-500/20' 
              : 'bg-yellow-500/10 border border-yellow-500/20'
          }`}>
            <div className="flex items-center justify-between text-sm">
              <span>Breakeven Win Rate:</span>
              <span className="font-mono">{data.requiredWinRate.toFixed(1)}%</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span>Your Win Rate:</span>
              <span className={`font-mono font-bold ${
                hasEdge ? 'text-green-400' : 'text-yellow-400'
              }`}>
                {data.winRate.toFixed(1)}%
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              {hasEdge ? (
                <span className="text-green-300">✅ You're {(data.winRate - data.requiredWinRate).toFixed(1)}% above breakeven</span>
              ) : (
                <span className="text-yellow-300">⚠️ Need {(data.requiredWinRate - data.winRate).toFixed(1)}% more to reach breakeven</span>
              )}
            </div>
          </div>

          {/* Payoff Ratio */}
          <div className="text-xs text-center text-muted-foreground">
            <span>Payoff Ratio (Avg Win/Loss): </span>
            <span className="font-mono font-bold text-foreground">
              {data.payoffRatio.toFixed(2)}:1
            </span>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
