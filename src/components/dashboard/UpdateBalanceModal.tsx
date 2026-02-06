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
import { usePersonalAccounts, PersonalAccount } from '@/hooks/usePersonalAccounts';
import { Loader2, TrendingUp, TrendingDown } from 'lucide-react';

interface UpdateBalanceModalProps {
  open: boolean;
  onClose: () => void;
  account: PersonalAccount | null;
}

const UpdateBalanceModal = ({ open, onClose, account }: UpdateBalanceModalProps) => {
  const { updateBalance } = usePersonalAccounts();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newBalance, setNewBalance] = useState('');

  useEffect(() => {
    if (account) {
      setNewBalance(account.current_balance.toString());
    }
  }, [account]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return;
    
    setIsSubmitting(true);

    try {
      const result = await updateBalance(account.id, parseFloat(newBalance));
      if (result) {
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!account) return null;

  const currentBalance = Number(account.current_balance);
  const parsedNewBalance = parseFloat(newBalance) || 0;
  const difference = parsedNewBalance - currentBalance;
  const percentChange = currentBalance > 0 ? (difference / currentBalance) * 100 : 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Update Balance</DialogTitle>
          <DialogDescription>
            Update the current balance for {account.account_label || account.broker_name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Balance Display */}
          <div className="bg-muted/30 rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Current Balance</p>
            <p className="text-2xl font-bold">${currentBalance.toLocaleString()}</p>
          </div>

          {/* New Balance Input */}
          <div className="space-y-2">
            <Label htmlFor="balance">New Balance</Label>
            <Input
              id="balance"
              type="number"
              min="0"
              step="0.01"
              placeholder="Enter new balance"
              value={newBalance}
              onChange={(e) => setNewBalance(e.target.value)}
              autoFocus
            />
          </div>

          {/* Change Preview */}
          {parsedNewBalance !== currentBalance && parsedNewBalance > 0 && (
            <div className={`rounded-lg p-3 flex items-center gap-3 ${
              difference >= 0 ? 'bg-success/10' : 'bg-risk/10'
            }`}>
              {difference >= 0 ? (
                <TrendingUp className="w-5 h-5 text-success" />
              ) : (
                <TrendingDown className="w-5 h-5 text-risk" />
              )}
              <div>
                <p className={`font-medium ${difference >= 0 ? 'text-success' : 'text-risk'}`}>
                  {difference >= 0 ? '+' : ''}${difference.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {percentChange >= 0 ? '+' : ''}{percentChange.toFixed(2)}% change
                </p>
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!newBalance || parseFloat(newBalance) < 0 || isSubmitting} 
              className="flex-1 btn-glow"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Update Balance
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateBalanceModal;
