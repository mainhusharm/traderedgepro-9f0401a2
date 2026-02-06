import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Circle, Calendar, Shield, Target, BookOpen, Trophy, AlertTriangle, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { toast } from 'sonner';

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  checked: boolean;
  key: 'calendar_reviewed' | 'drawdown_checked' | 'positions_verified' | 'rules_confirmed';
}

interface DailyTradingChecklistProps {
  accountId?: string;
  className?: string;
}

export default function DailyTradingChecklist({ accountId, className }: DailyTradingChecklistProps) {
  const { user } = useAuth();
  const [items, setItems] = useState<ChecklistItem[]>([
    {
      id: '1',
      key: 'calendar_reviewed',
      label: 'Economic Calendar',
      description: 'Reviewed high-impact news events',
      icon: <Calendar className="w-4 h-4" />,
      checked: false
    },
    {
      id: '2',
      key: 'drawdown_checked',
      label: 'Drawdown Check',
      description: 'Verified current DD levels are safe',
      icon: <Shield className="w-4 h-4" />,
      checked: false
    },
    {
      id: '3',
      key: 'positions_verified',
      label: 'Positions Verified',
      description: 'No leftover positions from yesterday',
      icon: <Target className="w-4 h-4" />,
      checked: false
    },
    {
      id: '4',
      key: 'rules_confirmed',
      label: 'Rules Confirmed',
      description: 'Aware of all prop firm rules',
      icon: <BookOpen className="w-4 h-4" />,
      checked: false
    }
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const [checklistId, setChecklistId] = useState<string | null>(null);
  const [requireChecklist, setRequireChecklist] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [updatingEnforcement, setUpdatingEnforcement] = useState(false);

  useEffect(() => {
    if (user) {
      fetchTodayChecklist();
      if (accountId) {
        fetchEnforcementSetting();
      }
    }
  }, [user, accountId]);

  const fetchEnforcementSetting = async () => {
    if (!accountId) return;
    
    const { data: account } = await supabase
      .from('user_prop_accounts')
      .select('require_checklist_before_trading')
      .eq('id', accountId)
      .single();

    if (account) {
      setRequireChecklist(account.require_checklist_before_trading || false);
    }
  };

  const fetchTodayChecklist = async () => {
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('daily_trading_checklists')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching checklist:', error);
    }

    if (data) {
      setChecklistId(data.id);
      setItems(prev => prev.map(item => ({
        ...item,
        checked: data[item.key] || false
      })));
    }

    setIsLoading(false);
  };

  const toggleEnforcement = async (checked: boolean) => {
    if (!accountId) return;
    
    setUpdatingEnforcement(true);
    try {
      const { error } = await supabase
        .from('user_prop_accounts')
        .update({ require_checklist_before_trading: checked })
        .eq('id', accountId);

      if (error) throw error;

      setRequireChecklist(checked);
      toast.success(checked 
        ? 'Checklist required before trading' 
        : 'Checklist requirement disabled'
      );
    } catch (error) {
      console.error('Error updating enforcement:', error);
      toast.error('Failed to update setting');
    } finally {
      setUpdatingEnforcement(false);
    }
  };

  const toggleItem = async (item: ChecklistItem) => {
    if (!user) return;

    const newChecked = !item.checked;
    const today = new Date().toISOString().split('T')[0];

    // Optimistically update UI
    setItems(prev => prev.map(i => 
      i.id === item.id ? { ...i, checked: newChecked } : i
    ));

    try {
      if (checklistId) {
        // Update existing checklist
        const updateData: any = {
          [item.key]: newChecked,
        };

        // Check if all items are now checked
        const allChecked = items.every(i => 
          i.id === item.id ? newChecked : i.checked
        );
        if (allChecked) {
          updateData.completed_at = new Date().toISOString();
        } else {
          updateData.completed_at = null;
        }

        await supabase
          .from('daily_trading_checklists')
          .update(updateData)
          .eq('id', checklistId);
      } else {
        // Create new checklist
        const { data, error } = await supabase
          .from('daily_trading_checklists')
          .insert({
            user_id: user.id,
            account_id: accountId || null,
            date: today,
            [item.key]: newChecked
          })
          .select()
          .single();

        if (error) throw error;
        setChecklistId(data.id);
      }

      // Show celebration if all items completed
      const allNowChecked = items.every(i => 
        i.id === item.id ? newChecked : i.checked
      );
      if (allNowChecked && newChecked) {
        toast.success('🎯 Daily checklist complete!', {
          description: 'You\'re ready to trade with discipline.'
        });
      }
    } catch (error) {
      console.error('Error updating checklist:', error);
      // Revert on error
      setItems(prev => prev.map(i => 
        i.id === item.id ? { ...i, checked: !newChecked } : i
      ));
      toast.error('Failed to update checklist');
    }
  };

  const completedCount = items.filter(i => i.checked).length;
  const progress = (completedCount / items.length) * 100;
  const isComplete = completedCount === items.length;

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Daily Trading Checklist
          </CardTitle>
          <div className="flex items-center gap-2">
            {isComplete ? (
              <Badge className="bg-emerald-500/20 text-emerald-400">
                <Trophy className="w-3 h-3 mr-1" />
                Complete
              </Badge>
            ) : (
              <Badge variant="outline">
                {completedCount}/{items.length}
              </Badge>
            )}
            {accountId && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
        <Progress value={progress} className="h-1.5 mt-2" />
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Enforcement Toggle */}
        {showSettings && accountId && (
          <div className="p-3 rounded-lg bg-muted/30 border border-border mb-3">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="enforce-checklist" className="text-sm font-medium">
                  Require before trading
                </Label>
                <p className="text-xs text-muted-foreground">
                  Block trades until checklist is complete
                </p>
              </div>
              <Switch
                id="enforce-checklist"
                checked={requireChecklist}
                onCheckedChange={toggleEnforcement}
                disabled={updatingEnforcement}
              />
            </div>
          </div>
        )}

        {items.map((item, index) => (
          <motion.button
            key={item.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => toggleItem(item)}
            className={`
              w-full flex items-start gap-3 p-3 rounded-lg text-left transition-all
              ${item.checked 
                ? 'bg-emerald-500/10 border border-emerald-500/30' 
                : 'bg-muted/30 border border-transparent hover:border-border'
              }
            `}
          >
            <div className={`mt-0.5 ${item.checked ? 'text-emerald-400' : 'text-muted-foreground'}`}>
              {item.checked ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <Circle className="w-5 h-5" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className={item.checked ? 'text-emerald-400' : 'text-muted-foreground'}>
                  {item.icon}
                </span>
                <span className={`font-medium ${item.checked ? 'text-foreground' : 'text-foreground'}`}>
                  {item.label}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {item.description}
              </p>
            </div>
          </motion.button>
        ))}

        {!isComplete && (
          <div className={`mt-3 p-3 rounded-lg ${requireChecklist ? 'bg-red-500/10 border border-red-500/30' : 'bg-yellow-500/10 border border-yellow-500/30'}`}>
            <div className={`flex items-center gap-2 text-sm ${requireChecklist ? 'text-red-400' : 'text-yellow-400'}`}>
              <AlertTriangle className="w-4 h-4" />
              <span>
                {requireChecklist 
                  ? 'Trading blocked until checklist is complete' 
                  : 'Complete your checklist before trading'
                }
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
