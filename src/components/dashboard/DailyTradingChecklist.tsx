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
    <Card className={`${className} relative overflow-hidden group`}>
      {/* Premium gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-emerald-500/5" />

      {/* Subtle border glow on hover */}
      <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-r from-primary/20 via-emerald-500/20 to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-sm" />

      {/* Top accent line */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <CardHeader className="pb-3 relative">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-emerald-500/10 border border-primary/20 flex items-center justify-center">
              <Target className="w-4 h-4 text-primary" />
            </div>
            <span className="bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
              Daily Trading Checklist
            </span>
          </CardTitle>
          <div className="flex items-center gap-2">
            {isComplete ? (
              <Badge className="bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-400 border border-emerald-500/30">
                <Trophy className="w-3 h-3 mr-1" />
                Complete
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-white/[0.03] border-white/[0.1]">
                <span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent font-semibold">
                  {completedCount}/{items.length}
                </span>
              </Badge>
            )}
            {accountId && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-white/[0.05]"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Premium progress bar */}
        <div className="relative mt-3">
          <div className="w-full h-2 bg-white/[0.05] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary via-purple-500 to-emerald-500 rounded-full relative"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
            </motion.div>
          </div>
          {/* Glow under progress */}
          <div
            className="absolute inset-0 bg-gradient-to-r from-primary via-purple-500 to-emerald-500 rounded-full blur-lg opacity-30"
            style={{ width: `${progress}%` }}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-2 relative">
        {/* Enforcement Toggle */}
        {showSettings && accountId && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 rounded-xl bg-gradient-to-r from-white/[0.03] to-transparent border border-white/[0.08] mb-3"
          >
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
          </motion.div>
        )}

        {items.map((item, index) => (
          <motion.button
            key={item.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ x: 4 }}
            onClick={() => toggleItem(item)}
            className={`
              relative w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all overflow-hidden group/item
              ${item.checked
                ? 'bg-gradient-to-r from-emerald-500/10 to-green-500/5 border border-emerald-500/30'
                : 'bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.04]'
              }
            `}
          >
            {/* Shimmer on hover */}
            <div className="absolute inset-0 opacity-0 group-hover/item:opacity-100 transition-opacity duration-500">
              <div className="absolute inset-0 -translate-x-full group-hover/item:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent" />
            </div>

            {/* Checkbox */}
            <div className={`relative mt-0.5 ${item.checked ? 'text-emerald-400' : 'text-muted-foreground'}`}>
              {item.checked ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <CheckCircle className="w-5 h-5" />
                  {/* Glow effect */}
                  <div className="absolute inset-0 bg-emerald-400 blur-md opacity-50" />
                </motion.div>
              ) : (
                <Circle className="w-5 h-5" />
              )}
            </div>

            <div className="flex-1 relative z-10">
              <div className="flex items-center gap-2">
                <span className={`transition-colors ${item.checked ? 'text-emerald-400' : 'text-muted-foreground group-hover/item:text-foreground'}`}>
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

            {/* Check indicator */}
            {item.checked && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
              </motion.div>
            )}
          </motion.button>
        ))}

        {!isComplete && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-4 p-4 rounded-xl relative overflow-hidden ${
              requireChecklist
                ? 'bg-gradient-to-r from-red-500/10 to-orange-500/5 border border-red-500/30'
                : 'bg-gradient-to-r from-amber-500/10 to-yellow-500/5 border border-amber-500/30'
            }`}
          >
            {/* Animated gradient background */}
            <div className={`absolute inset-0 ${
              requireChecklist
                ? 'bg-gradient-to-r from-red-500/5 to-transparent'
                : 'bg-gradient-to-r from-amber-500/5 to-transparent'
            }`} />

            <div className={`flex items-center gap-2 text-sm relative z-10 ${requireChecklist ? 'text-red-400' : 'text-amber-400'}`}>
              <AlertTriangle className="w-4 h-4" />
              <span className="font-medium">
                {requireChecklist
                  ? 'Trading blocked until checklist is complete'
                  : 'Complete your checklist before trading'
                }
              </span>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
