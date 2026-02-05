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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useWithdrawals } from '@/hooks/useWithdrawals';
import { usePersonalAccounts } from '@/hooks/usePersonalAccounts';
import { Loader2 } from 'lucide-react';

interface RecordWithdrawalModalProps {
  open: boolean;
  onClose: () => void;
}

const WITHDRAWAL_TYPES = [
  { value: 'profit_take', label: 'Profit Taking' },
  { value: 'regular', label: 'Regular Withdrawal' },
  { value: 'emergency', label: 'Emergency' },
  { value: 'income', label: 'Monthly Income' },
];

const RecordWithdrawalModal = ({ open, onClose }: RecordWithdrawalModalProps) => {
  const { createWithdrawal } = useWithdrawals();
  const { accounts } = usePersonalAccounts();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    account_id: '',
    amount: '',
    withdrawal_type: 'profit_take',
    withdrawal_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await createWithdrawal({
        account_id: formData.account_id || undefined,
        amount: parseFloat(formData.amount),
        withdrawal_type: formData.withdrawal_type,
        withdrawal_date: formData.withdrawal_date,
        notes: formData.notes || undefined,
      });

      if (result) {
        onClose();
        setFormData({
          account_id: '',
          amount: '',
          withdrawal_type: 'profit_take',
          withdrawal_date: new Date().toISOString().split('T')[0],
          notes: '',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = formData.amount && parseFloat(formData.amount) > 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record Withdrawal</DialogTitle>
          <DialogDescription>
            Track a withdrawal from your trading account
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Account Selection */}
          {accounts.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="account">From Account</Label>
              <Select
                value={formData.account_id}
                onValueChange={(value) => setFormData({ ...formData, account_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select account (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.account_label || account.broker_name} (${Number(account.current_balance).toLocaleString()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount *</Label>
            <Input
              id="amount"
              type="number"
              min="0"
              step="0.01"
              placeholder="1000"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            />
          </div>

          {/* Withdrawal Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Withdrawal Type</Label>
            <Select
              value={formData.withdrawal_type}
              onValueChange={(value) => setFormData({ ...formData, withdrawal_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WITHDRAWAL_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.withdrawal_date}
              onChange={(e) => setFormData({ ...formData, withdrawal_date: e.target.value })}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Optional notes..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
            />
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid || isSubmitting} className="flex-1 btn-glow">
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Record Withdrawal
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RecordWithdrawalModal;
