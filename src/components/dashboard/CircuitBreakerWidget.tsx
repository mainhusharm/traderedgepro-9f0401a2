import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { Shield, AlertTriangle, Lock, Unlock, Target, TrendingDown } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface CircuitBreakerWidgetProps {
  accountId: string;
}

interface CircuitBreakerStatus {
  is_locked: boolean;
  lock_reason: string | null;
  locked_until: string | null;
  breaker_type: string | null;
  daily_loss_pct: number;
  personal_limit_pct: number;
  daily_profit_pct: number;
  profit_target: number | null;
}

const CircuitBreakerWidget = ({ accountId }: CircuitBreakerWidgetProps) => {
  const [status, setStatus] = useState<CircuitBreakerStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkStatus();
    // Refresh every 30 seconds
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, [accountId]);

  const checkStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.functions.invoke('daily-circuit-breaker', {
        body: { account_id: accountId, user_id: user.id, check_only: true }
      });

      if (!error && data) {
        setStatus(data);
      }
    } catch (err) {
      console.error('Error checking circuit breaker:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardContent className="py-6">
          <div className="flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!status) return null;

  const lossUsagePct = status.personal_limit_pct > 0 
    ? (status.daily_loss_pct / status.personal_limit_pct) * 100 
    : 0;

  const isNearLimit = lossUsagePct >= 70 && !status.is_locked;
  const isLocked = status.is_locked;

  return (
    <Card className={`border-border/50 ${isLocked ? 'border-destructive/50 bg-destructive/5' : isNearLimit ? 'border-warning/50 bg-warning/5' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className={`w-5 h-5 ${isLocked ? 'text-destructive' : 'text-primary'}`} />
            Circuit Breaker
          </CardTitle>
          {isLocked ? (
            <Badge variant="destructive" className="flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Trading Paused
            </Badge>
          ) : (
            <Badge variant="outline" className="flex items-center gap-1 text-success border-success/50">
              <Unlock className="w-3 h-3" />
              Active
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Daily Loss Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="flex items-center gap-1 text-muted-foreground">
              <TrendingDown className="w-4 h-4" />
              Daily Loss Limit
            </span>
            <span className={lossUsagePct >= 80 ? 'text-destructive font-medium' : ''}>
              {status.daily_loss_pct.toFixed(2)}% / {status.personal_limit_pct}%
            </span>
          </div>
          <Progress 
            value={Math.min(lossUsagePct, 100)} 
            className={`h-2 ${lossUsagePct >= 80 ? '[&>div]:bg-destructive' : lossUsagePct >= 50 ? '[&>div]:bg-warning' : ''}`}
          />
        </div>

        {/* Profit Target (if set) */}
        {status.profit_target && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Target className="w-4 h-4" />
                Daily Profit Target
              </span>
              <span className="text-success">
                ${status.daily_profit_pct.toFixed(2)} / ${status.profit_target}
              </span>
            </div>
            <Progress 
              value={Math.min((status.daily_profit_pct / status.profit_target) * 100, 100)} 
              className="h-2 [&>div]:bg-success"
            />
          </div>
        )}

        {/* Lock Status */}
        {isLocked && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-destructive">
                  {status.breaker_type === 'profit_lock' ? '🎯 Target Reached!' : '⚠️ Limit Reached'}
                </p>
                <p className="text-xs text-muted-foreground">{status.lock_reason}</p>
                {status.locked_until && (
                  <p className="text-xs text-muted-foreground">
                    Resumes: {format(new Date(status.locked_until), 'MMM d, h:mm a')} 
                    ({formatDistanceToNow(new Date(status.locked_until), { addSuffix: true })})
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Near limit warning */}
        {isNearLimit && !isLocked && (
          <div className="p-3 rounded-lg bg-warning/10 border border-warning/30">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Approaching daily loss limit ({lossUsagePct.toFixed(0)}% used). 
                Trading will pause automatically at {status.personal_limit_pct}%.
              </p>
            </div>
          </div>
        )}

        <Button 
          variant="ghost" 
          size="sm" 
          onClick={checkStatus} 
          className="w-full text-xs"
        >
          Refresh Status
        </Button>
      </CardContent>
    </Card>
  );
};

export default CircuitBreakerWidget;
