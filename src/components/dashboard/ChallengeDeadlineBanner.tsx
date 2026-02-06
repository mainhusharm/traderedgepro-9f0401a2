import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Target, TrendingUp, AlertTriangle, Calendar } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';

interface ChallengeDeadlineBannerProps {
  accountId?: string;
}

interface ChallengeData {
  daysRemaining: number;
  profitProgress: number;
  profitNeeded: number;
  requiredDaily: number;
  deadline: string;
  tradingDaysLeft: number;
  minTradingDays: number;
  daysTradedSoFar: number;
}

const ChallengeDeadlineBanner = ({ accountId }: ChallengeDeadlineBannerProps) => {
  const { user } = useAuth();
  const [challengeData, setChallengeData] = useState<ChallengeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchChallengeData = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        let query = supabase
          .from('user_prop_accounts')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active');

        if (accountId) {
          query = query.eq('id', accountId);
        }

        const { data: accounts, error } = await query.limit(1);
        if (error) throw error;

        const acc = (accounts as any[] | null)?.[0] as any;

        if (acc && acc.challenge_deadline) {
          const now = new Date();
          const deadline = new Date(acc.challenge_deadline);
          const msRemaining = deadline.getTime() - now.getTime();
          const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));

          const currentProfit = (acc.current_equity || acc.starting_balance) - acc.starting_balance;
          const profitTarget = acc.profit_target || acc.profit_target_pct * acc.starting_balance / 100 || 0;
          const profitProgress = profitTarget > 0 
            ? (currentProfit / profitTarget) * 100 
            : 0;
          const profitNeeded = Math.max(0, profitTarget - currentProfit);
          const requiredDaily = daysRemaining > 0 ? profitNeeded / daysRemaining : profitNeeded;

          // Estimate trading days left (excluding weekends)
          const weekdays = countWeekdays(now, deadline);

          setChallengeData({
            daysRemaining,
            profitProgress: Math.min(100, profitProgress),
            profitNeeded,
            requiredDaily,
            deadline: deadline.toLocaleDateString(),
            tradingDaysLeft: weekdays,
            minTradingDays: acc.min_trading_days || 0,
            daysTradedSoFar: acc.days_traded || 0
          });
        }
      } catch (error) {
        console.error('Error fetching challenge data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChallengeData();
  }, [user, accountId]);

  if (isLoading || !challengeData) return null;

  const { daysRemaining, profitProgress, profitNeeded, requiredDaily, deadline, tradingDaysLeft, minTradingDays, daysTradedSoFar } = challengeData;

  // Determine urgency level
  const urgencyLevel = daysRemaining <= 3 ? 'critical' : daysRemaining <= 7 ? 'warning' : 'normal';
  const tradingDaysNeeded = Math.max(0, minTradingDays - daysTradedSoFar);

  const urgencyColors = {
    critical: 'from-red-500/20 to-red-900/20 border-red-500/50',
    warning: 'from-amber-500/20 to-amber-900/20 border-amber-500/50',
    normal: 'from-primary/20 to-primary/5 border-primary/30'
  };

  const urgencyTextColors = {
    critical: 'text-red-400',
    warning: 'text-amber-400',
    normal: 'text-primary'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card p-4 rounded-xl border bg-gradient-to-r ${urgencyColors[urgencyLevel]}`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Left: Days remaining */}
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center ${
            urgencyLevel === 'critical' ? 'bg-red-500/20' : 
            urgencyLevel === 'warning' ? 'bg-amber-500/20' : 'bg-primary/20'
          }`}>
            {urgencyLevel === 'critical' ? (
              <AlertTriangle className="w-6 h-6 text-red-400" />
            ) : (
              <Clock className={`w-6 h-6 ${urgencyTextColors[urgencyLevel]}`} />
            )}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Challenge Deadline</p>
            <p className={`text-2xl font-bold ${urgencyTextColors[urgencyLevel]}`}>
              {daysRemaining} {daysRemaining === 1 ? 'Day' : 'Days'} Left
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Ends {deadline}
            </p>
          </div>
        </div>

        {/* Middle: Progress to target */}
        <div className="flex-1 max-w-md">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Target className="w-4 h-4" />
              Progress to Profit Target
            </span>
            <span className="text-sm font-medium">{profitProgress.toFixed(1)}%</span>
          </div>
          <Progress 
            value={profitProgress} 
            className="h-3"
          />
          <p className="text-xs text-muted-foreground mt-1">
            ${profitNeeded.toLocaleString(undefined, { maximumFractionDigits: 0 })} still needed
          </p>
        </div>

        {/* Right: Required daily */}
        <div className="flex gap-4">
          <div className="text-center px-4 py-2 rounded-lg bg-background/50">
            <p className="text-xs text-muted-foreground">Required/Day</p>
            <p className={`text-lg font-bold ${urgencyTextColors[urgencyLevel]}`}>
              ${requiredDaily.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
          
          {minTradingDays > 0 && (
            <div className="text-center px-4 py-2 rounded-lg bg-background/50">
              <p className="text-xs text-muted-foreground">Trading Days</p>
              <p className="text-lg font-bold">
                {daysTradedSoFar}/{minTradingDays}
              </p>
              {tradingDaysNeeded > 0 && (
                <p className="text-xs text-amber-400">{tradingDaysNeeded} more needed</p>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Helper function to count weekdays between two dates
function countWeekdays(start: Date, end: Date): number {
  let count = 0;
  const current = new Date(start);
  while (current <= end) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
}

export default ChallengeDeadlineBanner;
