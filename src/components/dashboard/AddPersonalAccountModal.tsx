import { useState } from 'react';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { usePersonalAccounts } from '@/hooks/usePersonalAccounts';
import { Loader2, Info } from 'lucide-react';

interface AddPersonalAccountModalProps {
  open: boolean;
  onClose: () => void;
}

const BROKERS = [
  'IC Markets',
  'Pepperstone',
  'Oanda',
  'XM',
  'FXCM',
  'IG',
  'Saxo Bank',
  'Interactive Brokers',
  'TD Ameritrade',
  'Exness',
  'Other (Custom)',
];

const CURRENCIES = ['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'JPY', 'CHF'];

const ACCOUNT_TYPES = [
  { value: 'standard', label: 'Standard' },
  { value: 'ecn', label: 'ECN' },
  { value: 'raw', label: 'Raw Spread' },
  { value: 'micro', label: 'Micro' },
  { value: 'demo', label: 'Demo' },
];

// Field tooltips
const FIELD_TOOLTIPS = {
  broker: 'Select your broker or trading platform where this account is held.',
  accountLabel: 'A friendly name for this account (e.g., "Main Trading", "Swing Account"). Helps you identify accounts quickly.',
  accountNumber: 'Your broker account number for reference. This is optional and for your records only.',
  startingBalance: 'The initial amount you deposited into this account when you opened it.',
  currency: 'The base currency of your trading account.',
  accountType: 'Standard: Regular spreads. ECN: Direct market access. Raw: Lowest spreads with commission. Micro: Small lot sizes. Demo: Practice account.',
  leverage: 'The maximum leverage ratio your broker provides. Higher leverage = more risk and reward potential.',
  riskPerTrade: 'Percentage of your account balance to risk on each trade. 1-2% is recommended for most traders.',
  dailyLossLimit: 'Maximum percentage you allow yourself to lose in a single day. Helps prevent emotional overtrading.',
  monthlyIncomeGoal: 'Your target monthly income from this account. Used for income tracking and goal progress.',
  capitalFloor: 'The minimum balance you never want to go below. Trading should stop if this level is reached.',
  isPrimary: 'Primary account is used for default calculations and shown first in lists.',
};

const AddPersonalAccountModal = ({ open, onClose }: AddPersonalAccountModalProps) => {
  const { createAccount, accounts } = usePersonalAccounts();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAffiliateModal, setShowAffiliateModal] = useState(false);
  const [customBroker, setCustomBroker] = useState('');

  const [formData, setFormData] = useState({
    broker_name: '',
    account_label: '',
    account_number: '',
    currency: 'USD',
    starting_balance: '',
    leverage: '100',
    account_type: 'standard',
    is_primary: accounts.length === 0,
    risk_per_trade_pct: '1',
    daily_loss_limit_pct: '5',
    monthly_income_goal: '',
    capital_floor: '',
    is_affiliate: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const brokerName = formData.broker_name === 'Other (Custom)' ? customBroker : formData.broker_name;
      const result = await createAccount({
        broker_name: brokerName,
        account_label: formData.account_label || undefined,
        account_number: formData.account_number || undefined,
        currency: formData.currency,
        starting_balance: parseFloat(formData.starting_balance),
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
        setFormData({
          broker_name: '',
          account_label: '',
          account_number: '',
          currency: 'USD',
          starting_balance: '',
          leverage: '100',
          account_type: 'standard',
          is_primary: false,
          risk_per_trade_pct: '1',
          daily_loss_limit_pct: '5',
          monthly_income_goal: '',
          capital_floor: '',
          is_affiliate: false,
        });
        setCustomBroker('');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = (formData.broker_name && formData.broker_name !== 'Other (Custom)' || customBroker) && formData.starting_balance && parseFloat(formData.starting_balance) > 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Trading Account</DialogTitle>
          <DialogDescription>
            Add a personal trading account to track your real capital performance
          </DialogDescription>
        </DialogHeader>

        <TooltipProvider>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Broker Selection */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="broker">Broker *</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[250px]">
                    <p>{FIELD_TOOLTIPS.broker}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select
                value={formData.broker_name}
                onValueChange={(value) => setFormData({ ...formData, broker_name: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your broker" />
                </SelectTrigger>
                <SelectContent>
                  {BROKERS.map((broker) => (
                    <SelectItem key={broker} value={broker}>
                      {broker}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Custom Broker Input */}
              {formData.broker_name === 'Other (Custom)' && (
                <Input
                  placeholder="Enter your broker name"
                  value={customBroker}
                  onChange={(e) => setCustomBroker(e.target.value)}
                  className="mt-2"
                />
              )}
            </div>

            {/* Affiliate Status */}
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-lg border border-white/[0.08] p-3">
                <div className="flex items-center gap-2">
                  <div>
                    <Label>Are you under our affiliate program?</Label>
                    <p className="text-xs text-muted-foreground">
                      Get exclusive benefits as our affiliate partner
                    </p>
                  </div>
                </div>
                <Switch
                  checked={formData.is_affiliate}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_affiliate: checked })}
                />
              </div>
              {!formData.is_affiliate && (
                <button
                  type="button"
                  onClick={() => setShowAffiliateModal(true)}
                  className="text-xs text-primary hover:underline"
                >
                  Want to become our affiliate partner? Click here to learn how
                </button>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="label">Account Label</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[250px]">
                    <p>{FIELD_TOOLTIPS.accountLabel}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="label"
                placeholder="e.g., Main Trading, Swing Account"
                value={formData.account_label}
                onChange={(e) => setFormData({ ...formData, account_label: e.target.value })}
              />
            </div>

            {/* Account Number */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="number">Account Number</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[250px]">
                    <p>{FIELD_TOOLTIPS.accountNumber}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="number"
                placeholder="Optional - for your reference"
                value={formData.account_number}
                onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
              />
            </div>

            {/* Balance and Currency */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="balance">Starting Balance *</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[250px]">
                      <p>{FIELD_TOOLTIPS.startingBalance}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="balance"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="10000"
                  value={formData.starting_balance}
                  onChange={(e) => setFormData({ ...formData, starting_balance: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[250px]">
                      <p>{FIELD_TOOLTIPS.currency}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select
                  value={formData.currency}
                  onValueChange={(value) => setFormData({ ...formData, currency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((currency) => (
                      <SelectItem key={currency} value={currency}>
                        {currency}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Account Type and Leverage */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="type">Account Type</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[300px]">
                      <p>{FIELD_TOOLTIPS.accountType}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
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
                <div className="flex items-center gap-2">
                  <Label htmlFor="leverage">Leverage</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[250px]">
                      <p>{FIELD_TOOLTIPS.leverage}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
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
            </div>

            {/* Risk Settings */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="risk">Risk Per Trade (%)</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[250px]">
                      <p>{FIELD_TOOLTIPS.riskPerTrade}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
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
                <div className="flex items-center gap-2">
                  <Label htmlFor="dailyLimit">Daily Loss Limit (%)</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[250px]">
                      <p>{FIELD_TOOLTIPS.dailyLossLimit}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
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
                <div className="flex items-center gap-2">
                  <Label htmlFor="incomeGoal">Monthly Income Goal</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[250px]">
                      <p>{FIELD_TOOLTIPS.monthlyIncomeGoal}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
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
                <div className="flex items-center gap-2">
                  <Label htmlFor="capitalFloor">Capital Floor</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[250px]">
                      <p>{FIELD_TOOLTIPS.capitalFloor}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
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
              <div className="flex items-center gap-2">
                <div>
                  <Label htmlFor="primary">Set as Primary Account</Label>
                  <p className="text-xs text-muted-foreground">
                    Primary account is used for default calculations
                  </p>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[250px]">
                    <p>{FIELD_TOOLTIPS.isPrimary}</p>
                  </TooltipContent>
                </Tooltip>
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
              <Button type="submit" disabled={!isValid || isSubmitting} className="flex-1 btn-glow">
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Add Account
              </Button>
            </div>
          </form>
        </TooltipProvider>
      </DialogContent>

      {/* Affiliate Info Modal */}
      <Dialog open={showAffiliateModal} onOpenChange={setShowAffiliateModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              🤝 Become Our Affiliate Partner
            </DialogTitle>
            <DialogDescription>
              Join our affiliate program and get exclusive benefits
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
              <h4 className="font-semibold text-primary mb-2">Benefits of Being Our Affiliate</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>✓ Priority signal access</li>
                <li>✓ Reduced spreads with partner brokers</li>
                <li>✓ Exclusive trading resources</li>
                <li>✓ Direct support line</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold">How to Become Our Affiliate:</h4>
              <ol className="space-y-3 text-sm">
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 text-xs font-bold">1</span>
                  <div>
                    <p className="font-medium">Choose a Partner Broker</p>
                    <p className="text-muted-foreground">Select from IC Markets, Exness, Pepperstone, or XM</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 text-xs font-bold">2</span>
                  <div>
                    <p className="font-medium">Sign Up Using Our Link</p>
                    <p className="text-muted-foreground">Contact us via support to get your personalized affiliate link</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 text-xs font-bold">3</span>
                  <div>
                    <p className="font-medium">Open & Fund Your Account</p>
                    <p className="text-muted-foreground">Complete broker registration and make your first deposit</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 text-xs font-bold">4</span>
                  <div>
                    <p className="font-medium">Submit Verification</p>
                    <p className="text-muted-foreground">Send your account number to our support team for verification</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-success/20 text-success flex items-center justify-center shrink-0 text-xs font-bold">✓</span>
                  <div>
                    <p className="font-medium">Start Trading!</p>
                    <p className="text-muted-foreground">Enjoy all affiliate benefits immediately after verification</p>
                  </div>
                </li>
              </ol>
            </div>

            <div className="flex gap-3 pt-2">
              <Button 
                variant="outline" 
                onClick={() => setShowAffiliateModal(false)}
                className="flex-1"
              >
                Close
              </Button>
              <Button 
                onClick={() => {
                  setShowAffiliateModal(false);
                  // Navigate to support or affiliate page
                  window.open('/dashboard?tab=support', '_self');
                }}
                className="flex-1 btn-glow"
              >
                Contact Support
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};

export default AddPersonalAccountModal;
