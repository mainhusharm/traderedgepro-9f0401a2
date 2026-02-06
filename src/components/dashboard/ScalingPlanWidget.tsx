import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, Play, CheckCircle, AlertTriangle, ChevronRight, Rocket, Target } from 'lucide-react';
import { toast } from 'sonner';

interface ScalingPlanWidgetProps {
  accountId: string;
}

interface PlanConfig {
  name: string;
  weeks: { week: number; risk_pct: number; min_win_rate: number; max_dd: number }[];
}

interface ScalingPlanStatus {
  has_plan: boolean;
  plan?: {
    current_week: number;
    plan_type: string;
    current_risk_target: number;
    total_progressions: number;
    total_regressions: number;
    started_at: string;
    last_progression_at: string | null;
    history: any[];
  };
  plan_config?: PlanConfig;
  current_week_config?: { week: number; risk_pct: number; min_win_rate: number; max_dd: number };
  available_plans?: { id: string; name: string; weeks: number; final_risk: number }[];
}

const ScalingPlanWidget = ({ accountId }: ScalingPlanWidgetProps) => {
  const [status, setStatus] = useState<ScalingPlanStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, [accountId]);

  const fetchStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.functions.invoke('scaling-plan-progress', {
        body: { account_id: accountId, user_id: user.id }
      });

      if (!error && data) {
        setStatus(data);
      }
    } catch (err) {
      console.error('Error fetching scaling plan:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const startPlan = async (planType: string) => {
    setIsCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('scaling-plan-progress', {
        body: { action: 'create', account_id: accountId, user_id: user.id, plan_type: planType }
      });

      if (error) throw error;

      toast.success(data.message || 'Scaling plan started!');
      setShowDialog(false);
      fetchStatus();
    } catch (err: any) {
      toast.error(err.message || 'Failed to start plan');
    } finally {
      setIsCreating(false);
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

  // No plan - show setup
  if (!status?.has_plan) {
    return (
      <Card className="border-border/50 border-dashed">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Scaling Plan
          </CardTitle>
          <CardDescription>
            Gradually increase risk as you prove consistency
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button className="w-full gap-2">
                <Play className="w-4 h-4" />
                Start Scaling Plan
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Choose a Scaling Plan</DialogTitle>
                <DialogDescription>
                  Select how aggressively you want to scale your risk
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 mt-4">
                {status?.available_plans?.map((plan) => (
                  <Button
                    key={plan.id}
                    variant="outline"
                    className="w-full justify-between h-auto py-4"
                    onClick={() => startPlan(plan.id)}
                    disabled={isCreating}
                  >
                    <div className="text-left">
                      <div className="font-medium">{plan.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {plan.weeks} weeks to {plan.final_risk}% risk
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    );
  }

  // Active plan
  const plan = status.plan!;
  const config = status.plan_config!;
  const currentWeekConfig = status.current_week_config!;
  const progressPct = (plan.current_week / config.weeks.length) * 100;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Rocket className="w-5 h-5 text-primary" />
            Scaling Plan
          </CardTitle>
          <Badge variant="outline" className="bg-primary/10">
            Week {plan.current_week}/{config.weeks.length}
          </Badge>
        </div>
        <CardDescription>{config.name} Plan</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Plan Progress</span>
            <span>{progressPct.toFixed(0)}%</span>
          </div>
          <Progress value={progressPct} className="h-2" />
        </div>

        {/* Current week requirements */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded-lg bg-muted/30">
            <div className="text-lg font-bold text-primary">{currentWeekConfig.risk_pct}%</div>
            <div className="text-xs text-muted-foreground">Risk/Trade</div>
          </div>
          <div className="p-2 rounded-lg bg-muted/30">
            <div className="text-lg font-bold">{currentWeekConfig.min_win_rate}%</div>
            <div className="text-xs text-muted-foreground">Min Win Rate</div>
          </div>
          <div className="p-2 rounded-lg bg-muted/30">
            <div className="text-lg font-bold">{currentWeekConfig.max_dd}%</div>
            <div className="text-xs text-muted-foreground">Max DD</div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm pt-2 border-t border-border/50">
          <div className="flex items-center gap-1 text-success">
            <CheckCircle className="w-4 h-4" />
            {plan.total_progressions} progressions
          </div>
          {plan.total_regressions > 0 && (
            <div className="flex items-center gap-1 text-destructive">
              <AlertTriangle className="w-4 h-4" />
              {plan.total_regressions} regressions
            </div>
          )}
        </div>

        {/* Week roadmap */}
        <div className="flex items-center gap-1 overflow-x-auto py-2">
          {config.weeks.map((week) => (
            <div
              key={week.week}
              className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                week.week < plan.current_week
                  ? 'bg-success/20 text-success'
                  : week.week === plan.current_week
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/30 text-muted-foreground'
              }`}
              title={`Week ${week.week}: ${week.risk_pct}% risk`}
            >
              {week.week < plan.current_week ? <CheckCircle className="w-4 h-4" /> : week.week}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ScalingPlanWidget;
