import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  DollarSign,
  FileText,
  Loader2,
  AlertCircle,
  Trophy,
  ExternalLink,
  PartyPopper
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { toast } from 'sonner';
import { SuccessCelebrationModal } from './SuccessCelebrationModal';

interface PayoutRequirement {
  name: string;
  status: 'passed' | 'failed' | 'pending';
  currentValue: string;
  requiredValue: string;
}

interface PayoutEligibilityCardProps {
  accountId: string;
}

export function PayoutEligibilityCard({ accountId }: PayoutEligibilityCardProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [eligible, setEligible] = useState(false);
  const [requirements, setRequirements] = useState<PayoutRequirement[]>([]);
  const [payoutAmount, setPayoutAmount] = useState(0);
  const [userShare, setUserShare] = useState(0);
  const [payoutSplit, setPayoutSplit] = useState(80);
  const [accountPassed, setAccountPassed] = useState(false);
  const [payoutReceived, setPayoutReceived] = useState(false);
  const [propFirmName, setPropFirmName] = useState('');

  useEffect(() => {
    if (accountId && user) {
      checkEligibility();
    }
  }, [accountId, user]);

  const checkEligibility = async () => {
    try {
      setLoading(true);

      // Fetch account details
      const { data: account, error: accountError } = await supabase
        .from('user_prop_accounts')
        .select('*')
        .eq('id', accountId)
        .single();

      if (accountError || !account) {
        throw new Error('Account not found');
      }

      // Check if already passed or received payout
      setAccountPassed(account.status === 'passed');
      // Use payout_amount as indicator that payout was received
      setPayoutReceived(account.status === 'passed' && !!account.payout_amount);

      // Fetch open trades
      const { data: openTrades } = await supabase
        .from('user_trade_allocations')
        .select('id')
        .eq('account_id', accountId)
        .in('status', ['pending', 'active', 'partial']);

      const allTradesClosed = !openTrades || openTrades.length === 0;

      // Fetch daily stats for consistency check
      let consistencyPassed = true;
      if (account.consistency_rule_pct) {
        const { data: dailyStats } = await supabase
          .from('user_daily_stats')
          .select('contributed_pct_of_total')
          .eq('account_id', accountId);

        if (dailyStats) {
          const maxContribution = Math.max(...dailyStats.map(s => s.contributed_pct_of_total || 0), 0);
          consistencyPassed = maxContribution <= account.consistency_rule_pct;
        }
      }

      // Build requirements list
      const reqs: PayoutRequirement[] = [
        {
          name: 'Profit Target',
          status: account.current_profit >= account.profit_target ? 'passed' : 'pending',
          currentValue: `$${account.current_profit?.toFixed(2) || '0'}`,
          requiredValue: `$${account.profit_target?.toFixed(2) || '0'}`
        },
        {
          name: 'Minimum Trading Days',
          status: account.days_traded >= account.min_trading_days ? 'passed' : 'pending',
          currentValue: `${account.days_traded} days`,
          requiredValue: `${account.min_trading_days} days`
        },
        {
          name: 'Daily Drawdown',
          status: account.daily_drawdown_used_pct < account.daily_dd_limit_pct ? 'passed' : 'failed',
          currentValue: `${account.daily_drawdown_used_pct?.toFixed(2) || '0'}%`,
          requiredValue: `< ${account.daily_dd_limit_pct}%`
        },
        {
          name: 'Max Drawdown',
          status: account.max_drawdown_used_pct < account.max_dd_limit_pct ? 'passed' : 'failed',
          currentValue: `${account.max_drawdown_used_pct?.toFixed(2) || '0'}%`,
          requiredValue: `< ${account.max_dd_limit_pct}%`
        },
        {
          name: 'All Trades Closed',
          status: allTradesClosed ? 'passed' : 'pending',
          currentValue: allTradesClosed ? 'Yes' : `${openTrades?.length} open`,
          requiredValue: 'Yes'
        }
      ];

      // Add consistency rule if applicable
      if (account.consistency_rule_pct) {
        reqs.push({
          name: 'Consistency Rule',
          status: consistencyPassed ? 'passed' : 'failed',
          currentValue: consistencyPassed ? 'Passed' : 'Failed',
          requiredValue: `Max ${account.consistency_rule_pct}% from single day`
        });
      }

      setRequirements(reqs);

      // Check if all passed
      const allPassed = reqs.every(r => r.status === 'passed');
      setEligible(allPassed);

      // Store prop firm name
      setPropFirmName(account.prop_firm_name || 'your prop firm');

      // Calculate estimated payout amount
      if (allPassed && account.current_profit > 0) {
        const profit = account.current_profit;
        const userSplitPct = account.payout_split || 80;
        setPayoutSplit(userSplitPct);
        const userSplit = userSplitPct / 100;
        setPayoutAmount(profit);
        setUserShare(profit * userSplit);
      }

    } catch (error) {
      console.error('Error checking eligibility:', error);
      toast.error('Failed to check payout eligibility');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPassed = async () => {
    try {
      await supabase
        .from('user_prop_accounts')
        .update({ status: 'passed' })
        .eq('id', accountId);
      
      setAccountPassed(true);
      toast.success('🎉 Congratulations! Account marked as passed!');
    } catch (error) {
      console.error('Error marking as passed:', error);
      toast.error('Failed to update account status');
    }
  };

  const handleSuccessReported = () => {
    setPayoutReceived(true);
    checkEligibility();
  };

  if (loading) {
    return (
      <Card className="bg-card/50 backdrop-blur-xl border-border/30">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = (status: PayoutRequirement['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-400" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-400" />;
    }
  };

  return (
    <Card className="bg-card/50 backdrop-blur-xl border-border/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Payout Readiness
          {payoutReceived && (
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 ml-2">
              <Trophy className="h-3 w-3 mr-1" />
              PAYOUT RECEIVED
            </Badge>
          )}
          {!payoutReceived && accountPassed && (
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 ml-2">
              CHALLENGE PASSED
            </Badge>
          )}
          {!payoutReceived && !accountPassed && eligible && (
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 ml-2">
              READY FOR PAYOUT
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Requirements Checklist */}
        <div className="space-y-3">
          {requirements.map((req, index) => (
            <div 
              key={index}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                req.status === 'passed' 
                  ? 'bg-green-500/5 border-green-500/20' 
                  : req.status === 'failed'
                  ? 'bg-red-500/5 border-red-500/20'
                  : 'bg-muted/30 border-border/30'
              }`}
            >
              <div className="flex items-center gap-3">
                {getStatusIcon(req.status)}
                <div>
                  <p className="font-medium text-sm">{req.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Required: {req.requiredValue}
                  </p>
                </div>
              </div>
              <span className={`font-mono text-sm ${
                req.status === 'passed' ? 'text-green-400' : 
                req.status === 'failed' ? 'text-red-400' : 'text-foreground'
              }`}>
                {req.currentValue}
              </span>
            </div>
          ))}
        </div>

        {/* Estimated Payout Amount */}
        {eligible && payoutAmount > 0 && (
          <div className="p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Total Profit</span>
              <span className="font-mono">${payoutAmount.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Firm Share ({100 - payoutSplit}%)</span>
              <span className="font-mono text-muted-foreground">-${(payoutAmount * ((100 - payoutSplit) / 100)).toFixed(2)}</span>
            </div>
            <div className="border-t border-green-500/20 pt-2 mt-2">
              <div className="flex items-center justify-between">
                <span className="font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-400" />
                  Estimated Payout
                </span>
                <span className="font-mono text-xl text-green-400 font-bold">${userShare.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Already received payout */}
        {payoutReceived && (
          <div className="flex items-center gap-2 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <PartyPopper className="h-5 w-5 text-green-400 flex-shrink-0" />
            <p className="text-sm text-green-300">
              Amazing work! You've successfully received your payout from {propFirmName}! 🎉
            </p>
          </div>
        )}

        {/* Eligible - show instructions */}
        {eligible && !payoutReceived && (
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-lg">
              <div className="flex items-start gap-3">
                <Trophy className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p className="font-medium text-green-400">
                    Congratulations! You've met all payout requirements!
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Log into your <span className="font-semibold">{propFirmName}</span> dashboard to request your payout directly from them.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              {!accountPassed && (
                <Button 
                  onClick={handleMarkAsPassed}
                  variant="outline"
                  className="flex-1"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark Challenge Passed
                </Button>
              )}
              <Button 
                onClick={() => setShowSuccessModal(true)}
                className="flex-1 bg-gradient-to-r from-yellow-600 to-green-600 hover:from-yellow-700 hover:to-green-700"
              >
                <PartyPopper className="h-4 w-4 mr-2" />
                Report Payout Received
              </Button>
            </div>
          </div>
        )}

        {/* Not yet eligible */}
        {!eligible && !payoutReceived && (
          <div className="flex items-center gap-2 p-4 bg-muted/30 rounded-lg">
            <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <p className="text-sm text-muted-foreground">
              Complete all requirements above to become eligible for payout from your prop firm.
            </p>
          </div>
        )}

        {/* Success Celebration Modal */}
        <SuccessCelebrationModal
          open={showSuccessModal}
          onOpenChange={setShowSuccessModal}
          accountId={accountId}
          firmName={propFirmName}
          onSuccess={handleSuccessReported}
        />
      </CardContent>
    </Card>
  );
}
