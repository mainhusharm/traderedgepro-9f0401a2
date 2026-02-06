import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Scale, Info } from 'lucide-react';

interface BreakevenCalculatorProps {
  riskRewardRatio: string;
}

const BreakevenCalculator = ({ riskRewardRatio }: BreakevenCalculatorProps) => {
  const analysis = useMemo(() => {
    const parts = riskRewardRatio.split(':').map(Number);
    const rr = parts[0] || 2;
    
    // Breakeven win rate formula: 1 / (1 + R:R)
    const breakevenWinRate = (1 / (1 + rr)) * 100;
    
    // Calculate expected value at different win rates
    const scenarios = [
      { winRate: 40, label: '40%' },
      { winRate: 50, label: '50%' },
      { winRate: 55, label: '55%' },
      { winRate: 60, label: '60%' },
    ].map(s => {
      const ev = (s.winRate / 100) * rr - ((100 - s.winRate) / 100) * 1;
      return { ...s, ev, profitable: ev > 0 };
    });

    return { rr, breakevenWinRate, scenarios };
  }, [riskRewardRatio]);

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Scale className="w-5 h-5 text-primary" />
          Breakeven Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 rounded-lg bg-muted/50 text-center">
          <p className="text-xs text-muted-foreground mb-1">Min Win Rate for Breakeven</p>
          <p className="text-3xl font-bold text-primary">{analysis.breakevenWinRate.toFixed(1)}%</p>
          <p className="text-xs text-muted-foreground mt-1">at {analysis.rr}:1 R:R</p>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Info className="w-3 h-3" />
            Expected Value per Trade (in R)
          </p>
          <div className="grid grid-cols-4 gap-2">
            {analysis.scenarios.map((s) => (
              <div 
                key={s.winRate} 
                className={`p-2 rounded-lg text-center ${s.profitable ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}
              >
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className={`text-sm font-semibold ${s.profitable ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {s.ev > 0 ? '+' : ''}{s.ev.toFixed(2)}R
                </p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Higher R:R = lower win rate needed to be profitable
        </p>
      </CardContent>
    </Card>
  );
};

export default BreakevenCalculator;
