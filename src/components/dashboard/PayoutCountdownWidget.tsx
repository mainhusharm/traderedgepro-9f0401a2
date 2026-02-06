import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Calendar, TrendingUp, CheckCircle2, Clock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';

interface PayoutCountdownWidgetProps {
  accountId?: string;
}

interface PayoutData {
  daysUntilEligible: number;
  minTradingDays: number;
  daysTradedSoFar: number;
  isEligible: boolean;
  currentProfit: number;
  payoutSplitPercent: number;
  estimatedPayout: number;
  firstPayoutDate: string | null;
}

const PayoutCountdownWidget = ({ accountId }: PayoutCountdownWidgetProps) => {
  const { user } = useAuth();
  const [payoutData, setPayoutData] = useState<PayoutData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPayoutData = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        let query = supabase
          .from('user_prop_accounts')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .in('account_type', ['Funded', 'Live', 'Funded Account']);

        if (accountId) {
          query = query.eq('id', accountId);
        }

        const { data: accounts } = await query.limit(1).single();

        if (accounts) {
          const currentProfit = Math.max(0, (accounts.current_equity || accounts.starting_balance) - accounts.starting_balance);
          const daysTradedSoFar = accounts.days_traded || 0;
          const minTradingDays = accounts.min_trading_days || 14; // Default 14 days for funded
          const payoutSplitPercent = accounts.payout_split || 80; // Default 80%

          const daysUntilEligible = Math.max(0, minTradingDays - daysTradedSoFar);
          const isEligible = daysUntilEligible === 0 && currentProfit > 0;
          const estimatedPayout = currentProfit * (payoutSplitPercent / 100);

          // Calculate first payout date (assuming trading started when account was created)
          let firstPayoutDate = null;
          if (accounts.created_at && daysUntilEligible > 0) {
            const startDate = new Date(accounts.created_at);
            const payoutDate = new Date(startDate);
            // Add calendar days (roughly, not accounting for weekends)
            payoutDate.setDate(payoutDate.getDate() + minTradingDays + 7); // +7 for processing
            firstPayoutDate = payoutDate.toLocaleDateString();
          }

          setPayoutData({
            daysUntilEligible,
            minTradingDays,
            daysTradedSoFar,
            isEligible,
            currentProfit,
            payoutSplitPercent,
            estimatedPayout,
            firstPayoutDate
          });
        }
      } catch (error) {
        console.error('Error fetching payout data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPayoutData();
  }, [user, accountId]);

  if (isLoading) {
    return (
      <div className="glass-card p-6 rounded-xl animate-pulse">
        <div className="h-6 bg-muted/20 rounded w-1/3 mb-4" />
        <div className="h-20 bg-muted/20 rounded" />
      </div>
    );
  }

  if (!payoutData) {
    return (
      <div className="glass-card p-6 rounded-xl">
        <div className="text-center text-muted-foreground">
          <DollarSign className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p>No funded account found</p>
          <p className="text-sm">Pass your challenge to track payouts</p>
        </div>
      </div>
    );
  }

  const { 
    daysUntilEligible, 
    minTradingDays, 
    daysTradedSoFar, 
    isEligible, 
    currentProfit, 
    payoutSplitPercent, 
    estimatedPayout,
    firstPayoutDate 
  } = payoutData;

  const tradingProgress = minTradingDays > 0 ? (daysTradedSoFar / minTradingDays) * 100 : 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6 rounded-xl"
    >
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <DollarSign className="w-5 h-5 text-success" />
        Payout Status
      </h3>

      {isEligible ? (
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-8 h-8 text-success" />
          </div>
          <p className="text-lg font-semibold text-success mb-1">Payout Eligible!</p>
          <p className="text-muted-foreground text-sm mb-4">
            You've met the minimum trading day requirement
          </p>
          <div className="bg-success/10 rounded-xl p-4">
            <p className="text-sm text-muted-foreground">Estimated Payout ({payoutSplitPercent}% split)</p>
            <p className="text-3xl font-bold text-success">
              ${estimatedPayout.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              From ${currentProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })} profit
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Countdown display */}
          <div className="text-center py-3">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Clock className="w-8 h-8 text-primary" />
            </div>
            <p className="text-3xl font-bold text-primary">
              {daysUntilEligible} {daysUntilEligible === 1 ? 'Day' : 'Days'}
            </p>
            <p className="text-muted-foreground text-sm">until payout eligible</p>
          </div>

          {/* Trading days progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Trading Days
              </span>
              <span className="font-medium">{daysTradedSoFar} / {minTradingDays}</span>
            </div>
            <Progress value={tradingProgress} className="h-2" />
          </div>

          {/* Estimated payout preview */}
          <div className="border-t border-border/50 pt-4 mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                Current Profit
              </span>
              <span className={`font-medium ${currentProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                ${currentProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Payout Split
              </span>
              <span className="font-medium">{payoutSplitPercent}% to you</span>
            </div>
            {currentProfit > 0 && (
              <div className="flex items-center justify-between text-sm mt-2 pt-2 border-t border-border/30">
                <span className="text-muted-foreground font-medium">Projected Payout</span>
                <span className="font-bold text-success">
                  ${estimatedPayout.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
            )}
          </div>

          {firstPayoutDate && (
            <p className="text-xs text-center text-muted-foreground pt-2">
              First eligible payout: ~{firstPayoutDate}
            </p>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default PayoutCountdownWidget;
