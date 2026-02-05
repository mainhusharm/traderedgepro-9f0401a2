import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { Target, Save, X, Edit2, DollarSign, Lock } from 'lucide-react';
import { toast } from 'sonner';

interface ProfitTargetConfigProps {
  accountId: string;
}

const ProfitTargetConfig = ({ accountId }: ProfitTargetConfigProps) => {
  const [target, setTarget] = useState<number | null>(null);
  const [lockAfterTarget, setLockAfterTarget] = useState(false);
  const [personalLossLimit, setPersonalLossLimit] = useState(3);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchConfig();
  }, [accountId]);

  const fetchConfig = async () => {
    try {
      const { data: account } = await supabase
        .from('user_prop_accounts')
        .select('daily_profit_target, lock_after_target, personal_daily_loss_limit_pct')
        .eq('id', accountId)
        .single();

      if (account) {
        setTarget(account.daily_profit_target);
        setLockAfterTarget(account.lock_after_target || false);
        setPersonalLossLimit(account.personal_daily_loss_limit_pct || 3);
      }
    } catch (err) {
      console.error('Error fetching config:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfig = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('user_prop_accounts')
        .update({ 
          daily_profit_target: target,
          lock_after_target: lockAfterTarget,
          personal_daily_loss_limit_pct: personalLossLimit,
        })
        .eq('id', accountId);

      if (error) throw error;

      toast.success('Settings saved');
      setIsEditing(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return null;
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Daily Targets & Limits
          </CardTitle>
          {lockAfterTarget && target && (
            <Badge variant="outline" className="text-warning border-warning/50">
              <Lock className="w-3 h-3 mr-1" />
              Auto-Lock
            </Badge>
          )}
        </div>
        <CardDescription>
          Set profit targets and personal loss limits
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEditing ? (
          <div className="space-y-4">
            {/* Daily Profit Target */}
            <div className="space-y-2">
              <Label>Daily Profit Target ($)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                <Input
                  type="number"
                  placeholder="e.g., 500"
                  value={target || ''}
                  onChange={(e) => setTarget(e.target.value ? parseFloat(e.target.value) : null)}
                  className="pl-9"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Leave empty to disable daily profit target
              </p>
            </div>

            {/* Lock after target */}
            {target && (
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="lock-target">Lock trading after target</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically pause trading when target is reached
                  </p>
                </div>
                <Switch
                  id="lock-target"
                  checked={lockAfterTarget}
                  onCheckedChange={setLockAfterTarget}
                />
              </div>
            )}

            {/* Personal Daily Loss Limit */}
            <div className="space-y-2 pt-2 border-t border-border/50">
              <Label>Personal Daily Loss Limit (%)</Label>
              <Input
                type="number"
                step="0.5"
                min="0.5"
                max="5"
                value={personalLossLimit}
                onChange={(e) => setPersonalLossLimit(parseFloat(e.target.value) || 3)}
              />
              <p className="text-xs text-muted-foreground">
                Trading will pause when this loss is reached (before firm's 5% limit)
              </p>
            </div>

            <div className="flex gap-2">
              <Button onClick={saveConfig} disabled={isSaving} className="flex-1">
                <Save className="w-4 h-4 mr-2" />
                Save Settings
              </Button>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-muted/30">
                <div className="text-xs text-muted-foreground mb-1">Profit Target</div>
                <div className="font-medium">
                  {target ? `$${target}` : 'Not set'}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-muted/30">
                <div className="text-xs text-muted-foreground mb-1">Loss Limit</div>
                <div className="font-medium text-destructive">
                  {personalLossLimit}%
                </div>
              </div>
            </div>

            {target && lockAfterTarget && (
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/30 text-sm">
                <Lock className="w-4 h-4 inline mr-1" />
                Trading will auto-pause when ${target} profit is reached
              </div>
            )}

            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsEditing(true)}
              className="w-full"
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Configure Targets
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfitTargetConfig;
