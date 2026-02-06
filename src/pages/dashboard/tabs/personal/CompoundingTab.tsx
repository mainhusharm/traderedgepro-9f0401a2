import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Calculator,
  TrendingUp,
  Target,
  DollarSign,
  Calendar,
  Info,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { usePersonalAccounts } from '@/hooks/usePersonalAccounts';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
  ReferenceLine,
} from 'recharts';

const MILESTONES = [25000, 50000, 100000, 250000, 500000, 1000000];

const CompoundingTab = () => {
  const { totalPortfolioValue, primaryAccount } = usePersonalAccounts();
  
  // Calculator inputs
  const [startingBalance, setStartingBalance] = useState(totalPortfolioValue || 10000);
  const [monthlyReturn, setMonthlyReturn] = useState(5);
  const [timeHorizon, setTimeHorizon] = useState(24); // months
  const [withdrawalRate, setWithdrawalRate] = useState(0); // % of profits withdrawn monthly
  const [targetGoal, setTargetGoal] = useState(100000);

  // Calculate projections
  const projectionData = useMemo(() => {
    const compoundData: { month: number; compound: number; withdraw: number; label: string }[] = [];
    let compoundBalance = startingBalance;
    let withdrawBalance = startingBalance;
    let totalWithdrawn = 0;

    for (let month = 0; month <= timeHorizon; month++) {
      compoundData.push({
        month,
        compound: Math.round(compoundBalance),
        withdraw: Math.round(withdrawBalance),
        label: month % 6 === 0 ? `M${month}` : '',
      });

      // Calculate next month
      const compoundProfit = compoundBalance * (monthlyReturn / 100);
      compoundBalance += compoundProfit;

      const withdrawProfit = withdrawBalance * (monthlyReturn / 100);
      const withdrawnAmount = withdrawProfit * (withdrawalRate / 100);
      totalWithdrawn += withdrawnAmount;
      withdrawBalance += withdrawProfit - withdrawnAmount;
    }

    return {
      data: compoundData,
      finalCompound: Math.round(compoundBalance),
      finalWithdraw: Math.round(withdrawBalance),
      totalWithdrawn: Math.round(totalWithdrawn),
      compoundGain: Math.round(compoundBalance - startingBalance),
      withdrawGain: Math.round(withdrawBalance - startingBalance + totalWithdrawn),
    };
  }, [startingBalance, monthlyReturn, timeHorizon, withdrawalRate]);

  // Calculate time to reach goal
  const timeToGoal = useMemo(() => {
    if (startingBalance >= targetGoal) return 0;
    if (monthlyReturn <= 0) return Infinity;

    const monthlyRate = monthlyReturn / 100;
    const months = Math.log(targetGoal / startingBalance) / Math.log(1 + monthlyRate);
    return Math.ceil(months);
  }, [startingBalance, targetGoal, monthlyReturn]);

  // Calculate milestone times
  const milestoneTimes = useMemo(() => {
    return MILESTONES.filter(m => m > startingBalance).map(milestone => {
      if (monthlyReturn <= 0) return { milestone, months: Infinity };
      const months = Math.log(milestone / startingBalance) / Math.log(1 + monthlyReturn / 100);
      return { milestone, months: Math.ceil(months) };
    });
  }, [startingBalance, monthlyReturn]);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Compounding Calculator</h2>
        <p className="text-muted-foreground">Project your account growth and see the power of compound returns</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calculator Inputs */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calculator className="w-5 h-5 text-primary" />
              Calculator Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Starting Balance */}
            <div className="space-y-2">
              <Label>Starting Balance</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="number"
                  value={startingBalance}
                  onChange={(e) => setStartingBalance(Number(e.target.value) || 0)}
                  className="pl-9"
                />
              </div>
              <button
                onClick={() => setStartingBalance(totalPortfolioValue)}
                className="text-xs text-primary hover:underline"
              >
                Use current portfolio value
              </button>
            </div>

            {/* Monthly Return */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Monthly Return</Label>
                <span className="text-sm text-primary font-medium">{monthlyReturn}%</span>
              </div>
              <Slider
                value={[monthlyReturn]}
                onValueChange={([val]) => setMonthlyReturn(val)}
                min={1}
                max={15}
                step={0.5}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground">
                Annual: ~{((Math.pow(1 + monthlyReturn/100, 12) - 1) * 100).toFixed(0)}%
              </p>
            </div>

            {/* Time Horizon */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Time Horizon</Label>
                <span className="text-sm text-primary font-medium">{timeHorizon} months</span>
              </div>
              <Slider
                value={[timeHorizon]}
                onValueChange={([val]) => setTimeHorizon(val)}
                min={6}
                max={60}
                step={1}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground">
                {Math.floor(timeHorizon / 12)} years {timeHorizon % 12} months
              </p>
            </div>

            {/* Withdrawal Rate */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Monthly Profit Withdrawal</Label>
                <span className="text-sm text-accent font-medium">{withdrawalRate}%</span>
              </div>
              <Slider
                value={[withdrawalRate]}
                onValueChange={([val]) => setWithdrawalRate(val)}
                min={0}
                max={100}
                step={5}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground">
                0% = Full compound, 100% = Withdraw all profits
              </p>
            </div>

            {/* Target Goal */}
            <div className="space-y-2">
              <Label>Target Goal</Label>
              <div className="relative">
                <Target className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="number"
                  value={targetGoal}
                  onChange={(e) => setTargetGoal(Number(e.target.value) || 0)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results & Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Growth Projection</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={projectionData.data}>
                  <defs>
                    <linearGradient id="compoundGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="withdrawGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis 
                    dataKey="month" 
                    stroke="rgba(255,255,255,0.5)"
                    tickFormatter={(val) => `M${val}`}
                  />
                  <YAxis 
                    stroke="rgba(255,255,255,0.5)" 
                    tickFormatter={formatCurrency}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0,0,0,0.9)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                    labelFormatter={(label) => `Month ${label}`}
                  />
                  <Legend />
                  {targetGoal > 0 && (
                    <ReferenceLine 
                      y={targetGoal} 
                      stroke="#f59e0b" 
                      strokeDasharray="5 5"
                      label={{ value: `Goal: ${formatCurrency(targetGoal)}`, fill: '#f59e0b', position: 'right' }}
                    />
                  )}
                  <Area
                    type="monotone"
                    dataKey="compound"
                    name="Full Compound"
                    stroke="#22c55e"
                    fill="url(#compoundGradient)"
                    strokeWidth={2}
                  />
                  {withdrawalRate > 0 && (
                    <Area
                      type="monotone"
                      dataKey="withdraw"
                      name="With Withdrawals"
                      stroke="#a855f7"
                      fill="url(#withdrawGradient)"
                      strokeWidth={2}
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-success/20 bg-success/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-success" />
                <span className="text-sm text-muted-foreground">Full Compound Result</span>
              </div>
              <p className="text-2xl font-bold text-success">
                ${projectionData.finalCompound.toLocaleString()}
              </p>
              <p className="text-sm text-success/80 mt-1">
                +${projectionData.compoundGain.toLocaleString()} gain
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {withdrawalRate > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="border-accent/20 bg-accent/5">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <DollarSign className="w-5 h-5 text-accent" />
                  <span className="text-sm text-muted-foreground">With {withdrawalRate}% Withdrawal</span>
                </div>
                <p className="text-2xl font-bold text-accent">
                  ${projectionData.finalWithdraw.toLocaleString()}
                </p>
                <p className="text-sm text-accent/80 mt-1">
                  +${projectionData.totalWithdrawn.toLocaleString()} withdrawn
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-warning/20 bg-warning/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <Target className="w-5 h-5 text-warning" />
                <span className="text-sm text-muted-foreground">Time to Goal</span>
              </div>
              <p className="text-2xl font-bold text-warning">
                {timeToGoal === 0 ? 'Already there!' : 
                 timeToGoal === Infinity ? '∞' : 
                 `${timeToGoal} months`}
              </p>
              <p className="text-sm text-warning/80 mt-1">
                {timeToGoal > 0 && timeToGoal !== Infinity && (
                  `${Math.floor(timeToGoal / 12)}y ${timeToGoal % 12}m to reach ${formatCurrency(targetGoal)}`
                )}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-5 h-5 text-primary" />
                <span className="text-sm text-muted-foreground">ROI at {timeHorizon}m</span>
              </div>
              <p className="text-2xl font-bold text-primary">
                {((projectionData.finalCompound / startingBalance - 1) * 100).toFixed(0)}%
              </p>
              <p className="text-sm text-primary/80 mt-1">
                {(projectionData.finalCompound / startingBalance).toFixed(2)}x starting balance
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Milestones */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Milestone Projections
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {milestoneTimes.map(({ milestone, months }) => (
              <div
                key={milestone}
                className="p-4 rounded-lg border border-white/[0.08] bg-white/[0.02] text-center"
              >
                <p className="text-lg font-bold text-primary">{formatCurrency(milestone)}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {months === Infinity ? 'N/A' : `${months} months`}
                </p>
                {months !== Infinity && months <= timeHorizon && (
                  <span className="inline-block mt-2 px-2 py-0.5 text-xs bg-success/20 text-success rounded-full">
                    Within range
                  </span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Info Box */}
      <Card className="border-blue-500/20 bg-blue-500/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div className="text-sm text-blue-200/80">
              <p className="font-medium mb-1">Understanding Compound Growth</p>
              <p>
                Compound returns accelerate over time because you earn returns on your returns.
                A 5% monthly return compounds to ~80% annually, not 60%. The key is consistency
                and minimizing withdrawals during the growth phase.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompoundingTab;
