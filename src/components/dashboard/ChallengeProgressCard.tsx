import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Target, 
  Calendar, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Trophy,
  ArrowRight,
  Shield
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { motion } from 'framer-motion';

interface PropAccount {
  id: string;
  prop_firm_name: string;
  account_type: string;
  account_size: number;
  account_label: string;
  starting_balance: number;
  current_equity: number;
  highest_equity: number;
  current_profit: number;
  profit_target: number;
  profit_target_pct: number;
  days_traded: number;
  min_trading_days: number;
  max_trading_days: number | null;
  challenge_start_date: string | null;
  challenge_deadline: string | null;
  daily_dd_limit_pct: number;
  max_dd_limit_pct: number;
  daily_drawdown_used_pct: number;
  max_drawdown_used_pct: number;
  is_trailing_dd: boolean;
  consistency_rule_pct: number | null;
  status: string;
  failure_reason: string | null;
  scaling_week: number;
  current_risk_multiplier: number;
}

interface ChallengeProgressCardProps {
  accountId?: string;
  onSelectAccount?: () => void;
}

export function ChallengeProgressCard({ accountId, onSelectAccount }: ChallengeProgressCardProps) {
  const { user } = useAuth();
  const [account, setAccount] = useState<PropAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [consistencyScore, setConsistencyScore] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchAccount();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('prop-account-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_prop_accounts',
        filter: accountId ? `id=eq.${accountId}` : `user_id=eq.${user.id}`
      }, () => {
        fetchAccount();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, accountId]);

  const fetchAccount = async () => {
    try {
      let query = supabase
        .from('user_prop_accounts')
        .select('*')
        .eq('user_id', user!.id);
      
      if (accountId) {
        query = query.eq('id', accountId);
      } else {
        query = query.eq('status', 'active');
      }

      const { data, error } = await query.order('created_at', { ascending: false }).limit(1).maybeSingle();

      if (error) throw error;
      setAccount(data);

      // Fetch consistency score if applicable
      if (data?.consistency_rule_pct) {
        const { data: dailyStats } = await supabase
          .from('user_daily_stats')
          .select('daily_pnl, contributed_pct_of_total')
          .eq('account_id', data.id)
          .order('date', { ascending: false })
          .limit(30);

        if (dailyStats && dailyStats.length > 0) {
          const maxContribution = Math.max(...dailyStats.map(s => s.contributed_pct_of_total || 0));
          const score = Math.max(0, 100 - (maxContribution / data.consistency_rule_pct) * 100);
          setConsistencyScore(score);
        }
      }
    } catch (error) {
      console.error('Error fetching prop account:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-card/50 backdrop-blur-xl border-border/30">
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!account) {
    return (
      <Card className="bg-card/50 backdrop-blur-xl border-border/30">
        <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
          <Shield className="w-12 h-12 text-muted-foreground" />
          <p className="text-muted-foreground">No active prop firm account</p>
          <Button onClick={onSelectAccount} variant="outline">
            Add Prop Account <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Calculate progress percentages
  const profitProgress = account.profit_target > 0 
    ? Math.min(100, (account.current_profit / account.profit_target) * 100) 
    : 0;
  
  const daysProgress = account.min_trading_days > 0 
    ? Math.min(100, (account.days_traded / account.min_trading_days) * 100) 
    : 100;

  const dailyDDProgress = (account.daily_drawdown_used_pct / account.daily_dd_limit_pct) * 100;
  const maxDDProgress = (account.max_drawdown_used_pct / account.max_dd_limit_pct) * 100;

  // Calculate days remaining
  const daysRemaining = account.challenge_deadline 
    ? Math.max(0, Math.ceil((new Date(account.challenge_deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  // Determine status color
  const getStatusColor = () => {
    if (account.status === 'passed') return 'bg-green-500';
    if (account.status === 'failed') return 'bg-red-500';
    if (maxDDProgress >= 90 || dailyDDProgress >= 90) return 'bg-red-500';
    if (maxDDProgress >= 70 || dailyDDProgress >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getDDColor = (pct: number) => {
    if (pct >= 90) return 'bg-red-500';
    if (pct >= 70) return 'bg-yellow-500';
    if (pct >= 50) return 'bg-orange-400';
    return 'bg-green-500';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="bg-card/50 backdrop-blur-xl border-border/30 overflow-hidden">
        {/* Status Banner */}
        {account.status === 'failed' && (
          <div className="bg-red-500/20 border-b border-red-500/30 px-4 py-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <span className="text-sm text-red-300">{account.failure_reason || 'Account failed'}</span>
          </div>
        )}
        {account.status === 'passed' && (
          <div className="bg-green-500/20 border-b border-green-500/30 px-4 py-2 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-green-400" />
            <span className="text-sm text-green-300">Challenge Passed! Ready for next phase.</span>
          </div>
        )}

        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {account.account_label || account.prop_firm_name}
                <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                ${account.account_size.toLocaleString()} {account.account_type.replace('_', ' ').toUpperCase()}
              </p>
            </div>
            <Badge variant={account.status === 'active' ? 'default' : account.status === 'passed' ? 'outline' : 'destructive'}>
              {account.status.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Profit Target Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                <span>Profit Target</span>
              </div>
              <span className="font-mono">
                ${account.current_profit?.toFixed(2) || '0.00'} / ${account.profit_target?.toFixed(2) || '0'}
              </span>
            </div>
            <Progress 
              value={profitProgress} 
              className="h-3"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{profitProgress.toFixed(1)}% complete</span>
              <span>${((account.profit_target || 0) - (account.current_profit || 0)).toFixed(2)} remaining</span>
            </div>
          </div>

          {/* Trading Days Progress */}
          {account.min_trading_days > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-400" />
                  <span>Minimum Trading Days</span>
                </div>
                <span className="font-mono">
                  {account.days_traded} / {account.min_trading_days}
                </span>
              </div>
              <Progress value={daysProgress} className="h-2" />
              {daysProgress >= 100 ? (
                <div className="flex items-center gap-1 text-xs text-green-400">
                  <CheckCircle className="h-3 w-3" />
                  Minimum days requirement met
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {account.min_trading_days - account.days_traded} more trading days needed
                </p>
              )}
            </div>
          )}

          {/* Deadline */}
          {daysRemaining !== null && (
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-400" />
                <span className="text-sm">Time Remaining</span>
              </div>
              <span className={`font-mono font-bold ${daysRemaining <= 7 ? 'text-red-400' : 'text-foreground'}`}>
                {daysRemaining} days
              </span>
            </div>
          )}

          {/* Drawdown Meters */}
          <div className="grid grid-cols-2 gap-4">
            {/* Daily Drawdown */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>Daily DD</span>
                <span className="font-mono">{account.daily_drawdown_used_pct?.toFixed(2) || '0'}%</span>
              </div>
              <div className="relative h-24 bg-muted/30 rounded-lg overflow-hidden">
                <div 
                  className={`absolute bottom-0 w-full transition-all duration-500 ${getDDColor(dailyDDProgress)}`}
                  style={{ height: `${Math.min(100, dailyDDProgress)}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white drop-shadow-lg">
                    {dailyDDProgress.toFixed(0)}%
                  </span>
                </div>
                <div className="absolute top-1 right-1 text-xs text-muted-foreground">
                  /{account.daily_dd_limit_pct}%
                </div>
              </div>
              <p className="text-xs text-center text-muted-foreground">
                {(account.daily_dd_limit_pct - account.daily_drawdown_used_pct).toFixed(2)}% remaining
              </p>
            </div>

            {/* Max Drawdown */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>{account.is_trailing_dd ? 'Trailing' : 'Max'} DD</span>
                <span className="font-mono">{account.max_drawdown_used_pct?.toFixed(2) || '0'}%</span>
              </div>
              <div className="relative h-24 bg-muted/30 rounded-lg overflow-hidden">
                <div 
                  className={`absolute bottom-0 w-full transition-all duration-500 ${getDDColor(maxDDProgress)}`}
                  style={{ height: `${Math.min(100, maxDDProgress)}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white drop-shadow-lg">
                    {maxDDProgress.toFixed(0)}%
                  </span>
                </div>
                <div className="absolute top-1 right-1 text-xs text-muted-foreground">
                  /{account.max_dd_limit_pct}%
                </div>
              </div>
              <p className="text-xs text-center text-muted-foreground">
                {(account.max_dd_limit_pct - account.max_drawdown_used_pct).toFixed(2)}% remaining
              </p>
            </div>
          </div>

          {/* Consistency Score */}
          {account.consistency_rule_pct && consistencyScore !== null && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-purple-400" />
                  <span>Consistency Score</span>
                </div>
                <span className={`font-mono ${consistencyScore >= 70 ? 'text-green-400' : consistencyScore >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {consistencyScore.toFixed(0)}%
                </span>
              </div>
              <Progress value={consistencyScore} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Max {account.consistency_rule_pct}% of profit can come from a single day
              </p>
            </div>
          )}

          {/* Scaling Plan Info */}
          {account.current_risk_multiplier < 1 && (
            <div className="flex items-center justify-between p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-400" />
                <span className="text-sm">Scaling Plan Active (Week {account.scaling_week})</span>
              </div>
              <Badge variant="outline" className="text-blue-400 border-blue-400/50">
                {(account.current_risk_multiplier * 100).toFixed(0)}% Risk
              </Badge>
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-2 pt-4 border-t border-border/30">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Current Equity</p>
              <p className="font-mono font-bold">${account.current_equity?.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">High Water</p>
              <p className="font-mono font-bold">${account.highest_equity?.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">P&L</p>
              <p className={`font-mono font-bold ${account.current_profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {account.current_profit >= 0 ? '+' : ''}{account.current_profit?.toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
