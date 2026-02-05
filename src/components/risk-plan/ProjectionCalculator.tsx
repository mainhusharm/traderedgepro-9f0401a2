import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Calculator, Percent } from 'lucide-react';

interface ProjectionCalculatorProps {
  accountSize: number;
  riskPercentage: number;
  riskRewardRatio: string;
}

interface ProjectionRow {
  trade: number;
  balance: number;
  riskAmount: number;
  profit: number;
  cumulative: number;
}

const ProjectionCalculator = ({ accountSize, riskPercentage, riskRewardRatio }: ProjectionCalculatorProps) => {
  const [winRate, setWinRate] = useState(55);
  const [tradesCount, setTradesCount] = useState(20);

  const rewardMultiplier = useMemo(() => {
    const parts = riskRewardRatio.split(':').map(Number);
    return parts[0] || 2;
  }, [riskRewardRatio]);

  // Fixed risk projection (risk same $ amount each trade)
  const fixedProjection = useMemo(() => {
    const riskAmount = accountSize * (riskPercentage / 100);
    const profitPerWin = riskAmount * rewardMultiplier;
    const wins = Math.round(tradesCount * (winRate / 100));
    const losses = tradesCount - wins;
    
    const totalProfit = (wins * profitPerWin) - (losses * riskAmount);
    const finalBalance = accountSize + totalProfit;
    const percentageGain = ((finalBalance - accountSize) / accountSize) * 100;
    const expectancy = (winRate / 100) * profitPerWin - ((100 - winRate) / 100) * riskAmount;
    
    // Generate trade-by-trade simulation
    const trades: ProjectionRow[] = [];
    let currentBalance = accountSize;
    let cumulative = 0;
    
    for (let i = 1; i <= Math.min(tradesCount, 50); i++) {
      const isWin = i <= wins;
      const pnl = isWin ? profitPerWin : -riskAmount;
      cumulative += pnl;
      currentBalance = accountSize + cumulative;
      
      trades.push({
        trade: i,
        balance: currentBalance,
        riskAmount,
        profit: pnl,
        cumulative,
      });
    }
    
    return { totalProfit, finalBalance, percentageGain, expectancy, riskAmount, profitPerWin, wins, losses, trades };
  }, [accountSize, riskPercentage, rewardMultiplier, winRate, tradesCount]);

  // Compounding risk projection (risk % of current balance each trade)
  const compoundingProjection = useMemo(() => {
    const wins = Math.round(tradesCount * (winRate / 100));
    
    const trades: ProjectionRow[] = [];
    let currentBalance = accountSize;
    let cumulative = 0;
    
    // Simulate wins first, then losses for worst-case ordering
    for (let i = 1; i <= Math.min(tradesCount, 50); i++) {
      const isWin = i <= wins;
      const riskAmount = currentBalance * (riskPercentage / 100);
      const pnl = isWin ? riskAmount * rewardMultiplier : -riskAmount;
      
      currentBalance += pnl;
      cumulative = currentBalance - accountSize;
      
      trades.push({
        trade: i,
        balance: currentBalance,
        riskAmount,
        profit: pnl,
        cumulative,
      });
    }
    
    const totalProfit = currentBalance - accountSize;
    const percentageGain = ((currentBalance - accountSize) / accountSize) * 100;
    const avgRisk = accountSize * (riskPercentage / 100);
    const expectancy = (winRate / 100) * (avgRisk * rewardMultiplier) - ((100 - winRate) / 100) * avgRisk;
    
    return { totalProfit, finalBalance: currentBalance, percentageGain, expectancy, wins, losses: tradesCount - wins, trades };
  }, [accountSize, riskPercentage, rewardMultiplier, winRate, tradesCount]);

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calculator className="w-5 h-5 text-primary" />
          Earnings Projection
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Controls */}
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-muted-foreground">Win Rate</Label>
              <span className="text-sm font-semibold text-primary">{winRate}%</span>
            </div>
            <Slider
              value={[winRate]}
              onValueChange={(v) => setWinRate(v[0])}
              min={30}
              max={80}
              step={1}
              className="w-full"
            />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-muted-foreground">Number of Trades</Label>
              <span className="text-sm font-semibold">{tradesCount}</span>
            </div>
            <Slider
              value={[tradesCount]}
              onValueChange={(v) => setTradesCount(v[0])}
              min={10}
              max={100}
              step={5}
              className="w-full"
            />
          </div>
        </div>

        <Tabs defaultValue="fixed" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="fixed" className="text-xs sm:text-sm">Fixed Risk</TabsTrigger>
            <TabsTrigger value="compound" className="text-xs sm:text-sm">Compounding</TabsTrigger>
          </TabsList>

          <TabsContent value="fixed" className="space-y-4">
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <p className="text-xs text-muted-foreground mb-1">Risk/Trade</p>
                <p className="font-semibold">${fixedProjection.riskAmount.toFixed(0)}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <p className="text-xs text-muted-foreground mb-1">Profit/Win</p>
                <p className="font-semibold text-green-500">${fixedProjection.profitPerWin.toFixed(0)}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <p className="text-xs text-muted-foreground mb-1">Expectancy</p>
                <p className="font-semibold">${fixedProjection.expectancy.toFixed(2)}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <p className="text-xs text-muted-foreground mb-1">W/L Ratio</p>
                <p className="font-semibold">{fixedProjection.wins}/{fixedProjection.losses}</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Projected Final Balance</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded ${fixedProjection.percentageGain >= 0 ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                  {fixedProjection.percentageGain >= 0 ? '+' : ''}{fixedProjection.percentageGain.toFixed(1)}%
                </span>
              </div>
              <p className="text-2xl font-bold">${fixedProjection.finalBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {fixedProjection.totalProfit >= 0 ? '+' : ''}${fixedProjection.totalProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })} over {tradesCount} trades
              </p>
            </div>
          </TabsContent>

          <TabsContent value="compound" className="space-y-4">
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <p className="text-xs text-muted-foreground mb-1">Risk %</p>
                <p className="font-semibold">{riskPercentage}%</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <p className="text-xs text-muted-foreground mb-1">R:R Ratio</p>
                <p className="font-semibold">{rewardMultiplier}:1</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <p className="text-xs text-muted-foreground mb-1">Expectancy</p>
                <p className="font-semibold">${compoundingProjection.expectancy.toFixed(2)}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <p className="text-xs text-muted-foreground mb-1">W/L Ratio</p>
                <p className="font-semibold">{compoundingProjection.wins}/{compoundingProjection.losses}</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-green-600/5 border border-green-500/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Compounded Final Balance</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded ${compoundingProjection.percentageGain >= 0 ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                  {compoundingProjection.percentageGain >= 0 ? '+' : ''}{compoundingProjection.percentageGain.toFixed(1)}%
                </span>
              </div>
              <p className="text-2xl font-bold">${compoundingProjection.finalBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {compoundingProjection.totalProfit >= 0 ? '+' : ''}${compoundingProjection.totalProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })} over {tradesCount} trades
              </p>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Compounding adjusts risk amount based on current balance after each trade
            </p>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ProjectionCalculator;
