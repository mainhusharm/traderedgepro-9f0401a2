import { motion } from 'framer-motion';
import { Target, TrendingUp, AlertTriangle, Shield } from 'lucide-react';

interface RiskMetrics {
  riskAmount: number;
  targetProfit: number;
  maxDailyLoss: number;
  maxTotalDrawdown: number;
}

interface RiskMetricsGridProps {
  metrics: RiskMetrics;
  riskPercentage: number;
  accountSize: number;
  riskRewardRatio: string;
}

const RiskMetricsGrid = ({ metrics, riskPercentage, accountSize, riskRewardRatio }: RiskMetricsGridProps) => {
  const cards = [
    {
      title: 'Risk Per Trade',
      value: metrics.riskAmount,
      subtitle: `${riskPercentage}% of $${accountSize.toLocaleString()}`,
      icon: Target,
      color: 'text-emerald-500',
      bgGradient: 'from-emerald-500/10 to-emerald-600/5',
      borderColor: 'border-emerald-500/20',
    },
    {
      title: 'Target Profit',
      value: metrics.targetProfit,
      subtitle: `${riskRewardRatio} Risk:Reward`,
      icon: TrendingUp,
      color: 'text-blue-500',
      bgGradient: 'from-blue-500/10 to-blue-600/5',
      borderColor: 'border-blue-500/20',
    },
    {
      title: 'Max Daily Loss',
      value: metrics.maxDailyLoss,
      subtitle: '5% Daily Limit',
      icon: AlertTriangle,
      color: 'text-amber-500',
      bgGradient: 'from-amber-500/10 to-amber-600/5',
      borderColor: 'border-amber-500/20',
    },
    {
      title: 'Max Drawdown',
      value: metrics.maxTotalDrawdown,
      subtitle: '10% Total Limit',
      icon: Shield,
      color: 'text-rose-500',
      bgGradient: 'from-rose-500/10 to-rose-600/5',
      borderColor: 'border-rose-500/20',
    },
  ];

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${card.bgGradient} border ${card.borderColor} p-4`}
        >
          <div className="flex items-start justify-between mb-3">
            <card.icon className={`w-5 h-5 ${card.color}`} />
          </div>
          <p className={`text-2xl font-bold ${card.color}`}>
            ${card.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{card.title}</p>
          <p className="text-xs text-muted-foreground/70 mt-0.5">{card.subtitle}</p>
        </motion.div>
      ))}
    </div>
  );
};

export default RiskMetricsGrid;
