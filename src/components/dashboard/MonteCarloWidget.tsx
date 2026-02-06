import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown,
  RefreshCw,
  Target,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';

interface MonteCarloWidgetProps {
  accountId: string;
}

interface SimulationResult {
  profitTargetProbability: number;
  drawdownBreachProbability: number;
  medianFinalEquity: number;
  worstCase: number;
  bestCase: number;
  expectancy: number;
  profitFactor: number;
  riskOfRuin: number;
}

export function MonteCarloWidget({ accountId }: MonteCarloWidgetProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<SimulationResult | null>(null);
  const [tradeData, setTradeData] = useState<{ pnl: number; rMultiple: number }[]>([]);

  useEffect(() => {
    if (accountId && user) {
      fetchTradeData();
    }
  }, [accountId, user]);

  const fetchTradeData = async () => {
    try {
      setLoading(true);

      // Fetch historical trades for this account
      const { data: allocations } = await supabase
        .from('user_trade_allocations')
        .select('realized_pnl, r_multiple')
        .eq('account_id', accountId)
        .not('realized_pnl', 'is', null)
        .order('closed_at', { ascending: false })
        .limit(100);

      if (allocations && allocations.length >= 5) {
        const trades = allocations.map(a => ({
          pnl: a.realized_pnl || 0,
          rMultiple: a.r_multiple || 0
        }));
        setTradeData(trades);
        runSimulation(trades);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching trade data:', error);
      setLoading(false);
    }
  };

  const runSimulation = (trades: { pnl: number; rMultiple: number }[]) => {
    if (trades.length < 5) {
      setLoading(false);
      return;
    }

    setRunning(true);
    
    // Get account data
    supabase
      .from('user_prop_accounts')
      .select('current_equity, starting_balance, profit_target, max_dd_limit_pct')
      .eq('id', accountId)
      .single()
      .then(({ data: account }) => {
        if (!account) {
          setRunning(false);
          setLoading(false);
          return;
        }

        const startingEquity = account.current_equity || account.starting_balance;
        const profitTarget = account.profit_target;
        const maxDDLimit = (account.max_dd_limit_pct / 100) * account.starting_balance;

        // Calculate trade statistics
        const wins = trades.filter(t => t.pnl > 0);
        const losses = trades.filter(t => t.pnl < 0);
        const winRate = wins.length / trades.length;
        const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + t.pnl, 0) / wins.length : 0;
        const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((s, t) => s + t.pnl, 0) / losses.length) : 0;

        // Run Monte Carlo simulation (1000 iterations, 50 trades each)
        const iterations = 1000;
        const tradesPerSim = 50;
        const finalEquities: number[] = [];
        let profitTargetHits = 0;
        let drawdownBreaches = 0;

        for (let i = 0; i < iterations; i++) {
          let equity = startingEquity;
          let maxEquity = equity;

          for (let t = 0; t < tradesPerSim; t++) {
            // Random trade outcome based on historical distribution
            const isWin = Math.random() < winRate;
            const tradeResult = isWin 
              ? avgWin * (0.5 + Math.random()) // Vary win size
              : -avgLoss * (0.5 + Math.random()); // Vary loss size

            equity += tradeResult;
            maxEquity = Math.max(maxEquity, equity);

            // Check drawdown
            const currentDD = maxEquity - equity;
            if (currentDD >= maxDDLimit) {
              drawdownBreaches++;
              break;
            }

            // Check profit target
            if (equity - account.starting_balance >= profitTarget) {
              profitTargetHits++;
              break;
            }
          }

          finalEquities.push(equity);
        }

        // Calculate results
        finalEquities.sort((a, b) => a - b);
        const expectancy = (winRate * avgWin) - ((1 - winRate) * avgLoss);
        const profitFactor = avgLoss > 0 ? (winRate * avgWin) / ((1 - winRate) * avgLoss) : avgWin;

        setResults({
          profitTargetProbability: (profitTargetHits / iterations) * 100,
          drawdownBreachProbability: (drawdownBreaches / iterations) * 100,
          medianFinalEquity: finalEquities[Math.floor(iterations / 2)],
          worstCase: finalEquities[Math.floor(iterations * 0.05)], // 5th percentile
          bestCase: finalEquities[Math.floor(iterations * 0.95)], // 95th percentile
          expectancy,
          profitFactor,
          riskOfRuin: (drawdownBreaches / iterations) * 100
        });

        setRunning(false);
        setLoading(false);
      });
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

  if (tradeData.length < 5) {
    return (
      <Card className="bg-card/50 backdrop-blur-xl border-border/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Monte Carlo Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Need at least 5 completed trades for statistical analysis
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur-xl border-border/30">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Monte Carlo Analysis
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => runSimulation(tradeData)}
            disabled={running}
          >
            {running ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {results && (
          <>
            {/* Probability Gauges */}
            <div className="grid grid-cols-2 gap-4">
              {/* Profit Target Probability */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1">
                    <Target className="h-4 w-4 text-green-400" />
                    Hit Target
                  </span>
                  <span className={`font-mono font-bold ${
                    results.profitTargetProbability >= 60 ? 'text-green-400' :
                    results.profitTargetProbability >= 40 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {results.profitTargetProbability.toFixed(0)}%
                  </span>
                </div>
                <Progress 
                  value={results.profitTargetProbability} 
                  className="h-2"
                />
              </div>

              {/* Drawdown Risk */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                    DD Risk
                  </span>
                  <span className={`font-mono font-bold ${
                    results.drawdownBreachProbability <= 20 ? 'text-green-400' :
                    results.drawdownBreachProbability <= 40 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {results.drawdownBreachProbability.toFixed(0)}%
                  </span>
                </div>
                <Progress 
                  value={100 - results.drawdownBreachProbability} 
                  className="h-2"
                />
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground">Expectancy</p>
                <p className={`font-mono font-bold ${results.expectancy >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${results.expectancy.toFixed(2)}/trade
                </p>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground">Profit Factor</p>
                <p className={`font-mono font-bold ${results.profitFactor >= 1.5 ? 'text-green-400' : results.profitFactor >= 1 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {results.profitFactor.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Equity Range */}
            <div className="p-3 bg-muted/20 rounded-lg">
              <p className="text-xs text-muted-foreground mb-2">50-Trade Equity Projection</p>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1">
                  <TrendingDown className="h-3 w-3 text-red-400" />
                  <span className="font-mono">${results.worstCase.toFixed(0)}</span>
                </div>
                <div className="text-center">
                  <Badge variant="outline">${results.medianFinalEquity.toFixed(0)}</Badge>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-400" />
                  <span className="font-mono">${results.bestCase.toFixed(0)}</span>
                </div>
              </div>
              <div className="h-2 bg-muted rounded-full mt-2 relative overflow-hidden">
                <div 
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
                  style={{ 
                    left: '0%',
                    right: '0%'
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>5th %ile</span>
                <span>Median</span>
                <span>95th %ile</span>
              </div>
            </div>

            {/* Interpretation */}
            <div className={`p-3 rounded-lg text-xs ${
              results.profitTargetProbability >= 50 && results.drawdownBreachProbability <= 30
                ? 'bg-green-500/10 border border-green-500/20 text-green-300'
                : results.profitTargetProbability >= 30 && results.drawdownBreachProbability <= 50
                ? 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-300'
                : 'bg-red-500/10 border border-red-500/20 text-red-300'
            }`}>
              {results.profitTargetProbability >= 50 && results.drawdownBreachProbability <= 30 ? (
                <p>✅ Based on 1000 simulations, your strategy shows favorable probability of success. Keep following your rules.</p>
              ) : results.profitTargetProbability >= 30 && results.drawdownBreachProbability <= 50 ? (
                <p>⚠️ Moderate success probability. Consider reducing risk or improving win rate before scaling up.</p>
              ) : (
                <p>🔴 High risk of failure detected. Review your strategy and consider paper trading until metrics improve.</p>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
