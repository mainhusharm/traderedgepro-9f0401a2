import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, ListChecks } from 'lucide-react';

interface TradingRulesCardProps {
  riskPercentage: number;
  tradesPerDay: string;
  tradingSession: string;
  riskRewardRatio: string;
}

const TradingRulesCard = ({ riskPercentage, tradesPerDay, tradingSession, riskRewardRatio }: TradingRulesCardProps) => {
  const rules = [
    `Never risk more than ${riskPercentage}% per trade`,
    `Maximum ${tradesPerDay} trades per day`,
    `Trade during ${tradingSession} session`,
    `Always use ${riskRewardRatio} minimum R:R`,
    'Set stop loss before entering trade',
    'Never move stop loss against position',
    'Take partials at 1R if needed',
  ];

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ListChecks className="w-5 h-5 text-primary" />
          Trading Rules
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2.5">
          {rules.map((rule, index) => (
            <li key={index} className="flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-muted-foreground">{rule}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

export default TradingRulesCard;
