import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { usePersonalAccounts, PersonalAccount } from '@/hooks/usePersonalAccounts';
import { Loader2 } from 'lucide-react';

interface EditPersonalAccountModalProps {
  open: boolean;
  onClose: () => void;
  account: PersonalAccount | null;
}

const ACCOUNT_TYPES = [
  { value: 'standard', label: 'Standard' },
  { value: 'ecn', label: 'ECN' },
  { value: 'raw', label: 'Raw Spread' },
  { value: 'micro', label: 'Micro' },
  { value: 'demo', label: 'Demo' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'closed', label: 'Closed' },
];

const EditPersonalAccountModal = ({ open, onClose, account }: EditPersonalAccountModalProps) => {
  const { updateAccount } = usePersonalAccounts();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    account_label: '',
    account_number: '',
    leverage: '100',
    account_type: 'standard',
    status: 'active',
    is_primary: false,
    risk_per_trade_pct: '1',
    daily_loss_limit_pct: '5',
    monthly_income_goal: '',
    capital_floor: '',
  });

  useEffect(() => {
    if (account) {
      setFormData({
        account_label: account.account_label || '',
        account_number: account.account_number || '',
        leverage: account.leverage.toString(),
        account_type: account.account_type,
        status: account.status,
        is_primary: account.is_primary,
        risk_per_trade_pct: account.risk_per_trade_pct.toString(),
        daily_loss_limit_pct: account.daily_loss_limit_pct.toString(),
        monthly_income_goal: account.monthly_income_goal?.toString() || '',
        capital_floor: account.capital_floor?.toString() || '',
      });
    }
  }, [account]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return;
    
    setIsSubmitting(true);

    try {
      const result = await updateAccount(account.id, {
        account_label: formData.account_label || undefined,
        account_number: formData.account_number || undefined,
        leverage: parseInt(formData.leverage),
        account_type: formData.account_type,
        is_primary: formData.is_primary,
        risk_per_trade_pct: parseFloat(formData.risk_per_trade_pct),
        daily_loss_limit_pct: parseFloat(formData.daily_loss_limit_pct),
        monthly_income_goal: formData.monthly_income_goal ? parseFloat(formData.monthly_income_goal) : undefined,
        capital_floor: formData.capital_floor ? parseFloat(formData.capital_floor) : undefined,
      });

      if (result) {
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!account) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Account</DialogTitle>
          <DialogDescription>
            Update settings for {account.account_label || account.broker_name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Account Label */}
          <div className="space-y-2">
            <Label htmlFor="label">Account Label</Label>
            <Input
              id="label"
              placeholder="e.g., Main Trading, Swing Account"
              value={formData.account_label}
              onChange={(e) => setFormData({ ...formData, account_label: e.target.value })}
            />
          </div>

          {/* Account Number */}
          <div className="space-y-2">
            <Label htmlFor="number">Account Number</Label>
            <Input
              id="number"
              placeholder="Optional - for your reference"
              value={formData.account_number}
              onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
            />
          </div>

          {/* Account Type, Leverage, Status */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="type">Account Type</Label>
              <Select
                value={formData.account_type}
                onValueChange={(value) => setFormData({ ...formData, account_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="leverage">Leverage</Label>
              <Select
                value={formData.leverage}
                onValueChange={(value) => setFormData({ ...formData, leverage: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[30, 50, 100, 200, 500].map((lev) => (
                    <SelectItem key={lev} value={lev.toString()}>
                      1:{lev}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Risk Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="risk">Risk Per Trade (%)</Label>
              <Input
                id="risk"
                type="number"
                min="0.1"
                max="10"
                step="0.1"
                value={formData.risk_per_trade_pct}
                onChange={(e) => setFormData({ ...formData, risk_per_trade_pct: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dailyLimit">Daily Loss Limit (%)</Label>
              <Input
                id="dailyLimit"
                type="number"
                min="1"
                max="20"
                step="0.5"
                value={formData.daily_loss_limit_pct}
                onChange={(e) => setFormData({ ...formData, daily_loss_limit_pct: e.target.value })}
              />
            </div>
          </div>

          {/* Income Goal and Capital Floor */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="incomeGoal">Monthly Income Goal</Label>
              <Input
                id="incomeGoal"
                type="number"
                min="0"
                placeholder="Optional"
                value={formData.monthly_income_goal}
                onChange={(e) => setFormData({ ...formData, monthly_income_goal: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="capitalFloor">Capital Floor</Label>
              <Input
                id="capitalFloor"
                type="number"
                min="0"
                placeholder="Minimum balance"
                value={formData.capital_floor}
                onChange={(e) => setFormData({ ...formData, capital_floor: e.target.value })}
              />
            </div>
          </div>

          {/* Primary Account Toggle */}
          <div className="flex items-center justify-between rounded-lg border border-white/[0.08] p-3">
            <div>
              <Label htmlFor="primary">Set as Primary Account</Label>
              <p className="text-xs text-muted-foreground">
                Primary account is used for default calculations
              </p>
            </div>
            <Switch
              id="primary"
              checked={formData.is_primary}
              onCheckedChange={(checked) => setFormData({ ...formData, is_primary: checked })}
            />
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1 btn-glow">
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditPersonalAccountModal;
