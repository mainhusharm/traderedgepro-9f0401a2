import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface AddPropAccountModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

// Pre-configured prop firm rules
const PROP_FIRM_PRESETS: Record<string, {
  daily_dd: number;
  max_dd: number;
  profit_target_pct: number;
  min_days: number;
  trailing_dd: boolean;
  consistency_rule: number | null;
  news_allowed: boolean;
  weekend_allowed: boolean;
}> = {
  'FTMO': {
    daily_dd: 5,
    max_dd: 10,
    profit_target_pct: 10,
    min_days: 4,
    trailing_dd: false,
    consistency_rule: null,
    news_allowed: true,
    weekend_allowed: true
  },
  'Funding Pips': {
    daily_dd: 5,
    max_dd: 10,
    profit_target_pct: 8,
    min_days: 0,
    trailing_dd: false,
    consistency_rule: null,
    news_allowed: true,
    weekend_allowed: true
  },
  'MyFundedFX': {
    daily_dd: 5,
    max_dd: 8,
    profit_target_pct: 8,
    min_days: 5,
    trailing_dd: true,
    consistency_rule: null,
    news_allowed: false,
    weekend_allowed: false
  },
  'The Funded Trader': {
    daily_dd: 5,
    max_dd: 10,
    profit_target_pct: 10,
    min_days: 3,
    trailing_dd: false,
    consistency_rule: 30,
    news_allowed: true,
    weekend_allowed: false
  },
  'E8 Funding': {
    daily_dd: 5,
    max_dd: 8,
    profit_target_pct: 8,
    min_days: 0,
    trailing_dd: false,
    consistency_rule: 30,
    news_allowed: true,
    weekend_allowed: true
  },
  'Custom': {
    daily_dd: 5,
    max_dd: 10,
    profit_target_pct: 10,
    min_days: 0,
    trailing_dd: false,
    consistency_rule: null,
    news_allowed: true,
    weekend_allowed: true
  }
};

export function AddPropAccountModal({ open, onClose, onSuccess }: AddPropAccountModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    propFirm: 'FTMO',
    accountType: 'challenge_phase1',
    accountSize: 100000,
    accountLabel: '',
    dailyDD: 5,
    maxDD: 10,
    profitTargetPct: 10,
    minDays: 4,
    trailingDD: false,
    consistencyRule: null as number | null,
    newsAllowed: true,
    weekendAllowed: true,
    maxLotSize: null as number | null,
    maxRiskPerTrade: 2
  });

  const handleFirmChange = (firm: string) => {
    const preset = PROP_FIRM_PRESETS[firm];
    setFormData(prev => ({
      ...prev,
      propFirm: firm,
      dailyDD: preset.daily_dd,
      maxDD: preset.max_dd,
      profitTargetPct: preset.profit_target_pct,
      minDays: preset.min_days,
      trailingDD: preset.trailing_dd,
      consistencyRule: preset.consistency_rule,
      newsAllowed: preset.news_allowed,
      weekendAllowed: preset.weekend_allowed
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setLoading(true);

      const profitTarget = formData.accountSize * (formData.profitTargetPct / 100);

      const { error } = await supabase.from('user_prop_accounts').insert({
        user_id: user.id,
        prop_firm_name: formData.propFirm,
        account_type: formData.accountType,
        account_size: formData.accountSize,
        account_label: formData.accountLabel || `${formData.propFirm} ${formData.accountSize / 1000}k`,
        starting_balance: formData.accountSize,
        current_equity: formData.accountSize,
        highest_equity: formData.accountSize,
        daily_starting_equity: formData.accountSize,
        daily_dd_limit_pct: formData.dailyDD,
        max_dd_limit_pct: formData.maxDD,
        is_trailing_dd: formData.trailingDD,
        profit_target: profitTarget,
        profit_target_pct: formData.profitTargetPct,
        min_trading_days: formData.minDays,
        consistency_rule_pct: formData.consistencyRule,
        news_trading_allowed: formData.newsAllowed,
        weekend_holding_allowed: formData.weekendAllowed,
        max_lot_size: formData.maxLotSize,
        max_risk_per_trade_pct: formData.maxRiskPerTrade,
        challenge_start_date: new Date().toISOString().split('T')[0],
        scaling_week: 1,
        current_risk_multiplier: 0.5 // Start at 50% risk
      });

      if (error) throw error;

      toast.success('Prop account added successfully!');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error adding prop account:', error);
      toast.error('Failed to add prop account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => !loading && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Prop Firm Account</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Prop Firm Selection */}
          <div className="space-y-2">
            <Label>Prop Firm</Label>
            <Select value={formData.propFirm} onValueChange={handleFirmChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(PROP_FIRM_PRESETS).map(firm => (
                  <SelectItem key={firm} value={firm}>{firm}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Account Type */}
          <div className="space-y-2">
            <Label>Account Type</Label>
            <Select 
              value={formData.accountType} 
              onValueChange={(v) => setFormData(prev => ({ ...prev, accountType: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="challenge_phase1">Challenge Phase 1</SelectItem>
                <SelectItem value="challenge_phase2">Challenge Phase 2</SelectItem>
                <SelectItem value="funded">Funded Account</SelectItem>
                <SelectItem value="evaluation">Evaluation</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Account Size */}
          <div className="space-y-2">
            <Label>Account Size ($)</Label>
            <Select 
              value={formData.accountSize.toString()} 
              onValueChange={(v) => setFormData(prev => ({ ...prev, accountSize: parseInt(v) }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5000">$5,000</SelectItem>
                <SelectItem value="10000">$10,000</SelectItem>
                <SelectItem value="25000">$25,000</SelectItem>
                <SelectItem value="50000">$50,000</SelectItem>
                <SelectItem value="100000">$100,000</SelectItem>
                <SelectItem value="200000">$200,000</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Account Label */}
          <div className="space-y-2">
            <Label>Account Label (Optional)</Label>
            <Input
              placeholder="e.g., FTMO 100k Challenge #1"
              value={formData.accountLabel}
              onChange={(e) => setFormData(prev => ({ ...prev, accountLabel: e.target.value }))}
            />
          </div>

          {/* Drawdown Rules */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Daily DD Limit (%)</Label>
              <Input
                type="number"
                step="0.1"
                value={formData.dailyDD}
                onChange={(e) => setFormData(prev => ({ ...prev, dailyDD: parseFloat(e.target.value) }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Max DD Limit (%)</Label>
              <Input
                type="number"
                step="0.1"
                value={formData.maxDD}
                onChange={(e) => setFormData(prev => ({ ...prev, maxDD: parseFloat(e.target.value) }))}
              />
            </div>
          </div>

          {/* Profit & Days */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Profit Target (%)</Label>
              <Input
                type="number"
                step="0.1"
                value={formData.profitTargetPct}
                onChange={(e) => setFormData(prev => ({ ...prev, profitTargetPct: parseFloat(e.target.value) }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Min Trading Days</Label>
              <Input
                type="number"
                value={formData.minDays}
                onChange={(e) => setFormData(prev => ({ ...prev, minDays: parseInt(e.target.value) || 0 }))}
              />
            </div>
          </div>

          {/* Risk Settings */}
          <div className="space-y-2">
            <Label>Max Risk Per Trade (%)</Label>
            <Input
              type="number"
              step="0.1"
              value={formData.maxRiskPerTrade}
              onChange={(e) => setFormData(prev => ({ ...prev, maxRiskPerTrade: parseFloat(e.target.value) }))}
            />
          </div>

          {/* Toggles */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Trailing Drawdown</Label>
              <Switch
                checked={formData.trailingDD}
                onCheckedChange={(v) => setFormData(prev => ({ ...prev, trailingDD: v }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>News Trading Allowed</Label>
              <Switch
                checked={formData.newsAllowed}
                onCheckedChange={(v) => setFormData(prev => ({ ...prev, newsAllowed: v }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Weekend Holding Allowed</Label>
              <Switch
                checked={formData.weekendAllowed}
                onCheckedChange={(v) => setFormData(prev => ({ ...prev, weekendAllowed: v }))}
              />
            </div>
          </div>

          {/* Consistency Rule */}
          <div className="space-y-2">
            <Label>Consistency Rule (% max profit/day, leave empty if none)</Label>
            <Input
              type="number"
              placeholder="e.g., 30"
              value={formData.consistencyRule ?? ''}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                consistencyRule: e.target.value ? parseInt(e.target.value) : null 
              }))}
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Add Account
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
