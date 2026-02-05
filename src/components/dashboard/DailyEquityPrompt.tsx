import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, X, CheckCircle, Clock, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { toast } from 'sonner';

interface PropAccount {
  id: string;
  account_name: string;
  prop_firm: string;
  current_equity: number;
  starting_balance: number;
  reported_equity: number;
  last_equity_update_at: string;
}

interface DailyEquityPromptProps {
  onClose?: () => void;
  forceShow?: boolean;
  accountId?: string;
}

export default function DailyEquityPrompt({ onClose, forceShow = false, accountId }: DailyEquityPromptProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [accounts, setAccounts] = useState<PropAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [equity, setEquity] = useState<string>('');
  const [balance, setBalance] = useState<string>('');
  const [openPnl, setOpenPnl] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [todayConfirmations, setTodayConfirmations] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      fetchAccounts();
      checkTodayConfirmations();
      checkIfShouldShow();
    }
  }, [user, forceShow]);

  const fetchAccounts = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('user_prop_accounts')
      .select('id, account_label, prop_firm_name, current_equity, starting_balance, reported_equity, last_equity_update_at')
      .eq('user_id', user.id)
      .in('status', ['active', 'evaluation', 'funded']);

    if (error) {
      console.error('Error fetching accounts:', error);
      return;
    }

    const mapped = (data || []).map(d => ({
      id: d.id,
      account_name: d.account_label || 'Account',
      prop_firm: d.prop_firm_name || '',
      current_equity: d.current_equity || 0,
      starting_balance: d.starting_balance || 0,
      reported_equity: d.reported_equity || 0,
      last_equity_update_at: d.last_equity_update_at || ''
    }));
    setAccounts(mapped);
    if (data && data.length === 1) {
      setSelectedAccountId(data[0].id);
      setEquity(data[0].current_equity?.toString() || '');
    }
  };

  const checkTodayConfirmations = async () => {
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('daily_equity_confirmations')
      .select('account_id')
      .eq('user_id', user.id)
      .eq('date', today);

    if (data) {
      setTodayConfirmations(new Set(data.map(c => c.account_id)));
    }
  };

  const checkIfShouldShow = () => {
    if (forceShow) {
      setIsOpen(true);
      return;
    }

    // Check if it's evening (after 5 PM local time) and haven't shown today
    const hour = new Date().getHours();
    const todayKey = `equity_prompt_shown_${new Date().toISOString().split('T')[0]}`;
    const hasShownToday = localStorage.getItem(todayKey);

    if (hour >= 17 && !hasShownToday) {
      setIsOpen(true);
      localStorage.setItem(todayKey, 'true');
    }
  };

  const handleAccountChange = (accountId: string) => {
    setSelectedAccountId(accountId);
    const account = accounts.find(a => a.id === accountId);
    if (account) {
      setEquity(account.current_equity?.toString() || '');
    }
  };

  const handleSubmit = async () => {
    if (!user || !selectedAccountId || !equity) return;

    setIsSubmitting(true);
    try {
      const equityValue = parseFloat(equity);
      const balanceValue = balance ? parseFloat(balance) : null;
      const openPnlValue = openPnl ? parseFloat(openPnl) : null;

      // Upsert daily confirmation
      const { error: confirmError } = await supabase
        .from('daily_equity_confirmations')
        .upsert({
          user_id: user.id,
          account_id: selectedAccountId,
          date: new Date().toISOString().split('T')[0],
          reported_equity: equityValue,
          reported_balance: balanceValue,
          open_pnl: openPnlValue,
          notes: notes || null
        }, {
          onConflict: 'user_id,account_id,date'
        });

      if (confirmError) throw confirmError;

      // Update prop account with reported equity
      const { error: updateError } = await supabase
        .from('user_prop_accounts')
        .update({
          reported_equity: equityValue,
          current_equity: equityValue,
          unrealized_pnl: openPnlValue || 0,
          last_equity_update_at: new Date().toISOString()
        })
        .eq('id', selectedAccountId);

      if (updateError) throw updateError;

      // Check for variance between theoretical and reported equity
      const account = accounts.find(a => a.id === selectedAccountId);
      if (account && account.current_equity) {
        const variance = ((equityValue - account.current_equity) / account.current_equity) * 100;
        if (Math.abs(variance) > 5) {
          toast.warning(`Equity variance detected: ${variance.toFixed(1)}%`, {
            description: 'This may indicate trades taken outside of signals or calculation differences.'
          });
        }
      }

      toast.success('Equity updated successfully!');
      setTodayConfirmations(prev => new Set([...prev, selectedAccountId]));
      
      // Reset form if there are more accounts
      if (accounts.length > 1) {
        const nextAccount = accounts.find(a => !todayConfirmations.has(a.id) && a.id !== selectedAccountId);
        if (nextAccount) {
          setSelectedAccountId(nextAccount.id);
          setEquity(nextAccount.current_equity?.toString() || '');
          setBalance('');
          setOpenPnl('');
          setNotes('');
          return;
        }
      }

      handleClose();
    } catch (error) {
      console.error('Error updating equity:', error);
      toast.error('Failed to update equity');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    onClose?.();
  };

  const selectedAccount = accounts.find(a => a.id === selectedAccountId);
  const accountsNeedingUpdate = accounts.filter(a => !todayConfirmations.has(a.id));

  if (!isOpen || accounts.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-card border border-border rounded-xl w-full max-w-md overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-primary/5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Daily Equity Update</h2>
                <p className="text-sm text-muted-foreground">
                  {accountsNeedingUpdate.length} account(s) need updating
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-sm text-blue-400">
                <Clock className="w-4 h-4 inline mr-1" />
                Enter your current equity from your trading platform to keep drawdown calculations accurate.
              </p>
            </div>

            {/* Account Selection */}
            <div className="space-y-2">
              <Label>Select Account</Label>
              <Select value={selectedAccountId} onValueChange={handleAccountChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      <div className="flex items-center gap-2">
                        <span>{account.account_name}</span>
                        {todayConfirmations.has(account.id) ? (
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Badge variant="outline" className="text-xs">Pending</Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Previous equity reference */}
            {selectedAccount && (
              <div className="p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Previous Equity</span>
                  <span className="font-medium">${selectedAccount.current_equity?.toLocaleString() || '—'}</span>
                </div>
                {selectedAccount.last_equity_update_at && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Last updated: {new Date(selectedAccount.last_equity_update_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}

            {/* Equity Input */}
            <div className="space-y-2">
              <Label>Current Equity *</Label>
              <Input
                type="number"
                placeholder="Enter current equity"
                value={equity}
                onChange={(e) => setEquity(e.target.value)}
              />
            </div>

            {/* Optional fields */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Balance (optional)</Label>
                <Input
                  type="number"
                  placeholder="Account balance"
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Open P&L (optional)</Label>
                <Input
                  type="number"
                  placeholder="Floating P&L"
                  value={openPnl}
                  onChange={(e) => setOpenPnl(e.target.value)}
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                placeholder="Any notes about today's trading..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>

            {/* P&L Preview */}
            {selectedAccount && equity && (
              <div className="p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Daily Change</span>
                  {(() => {
                    const change = parseFloat(equity) - (selectedAccount.current_equity || selectedAccount.starting_balance);
                    const isPositive = change >= 0;
                    return (
                      <div className="flex items-center gap-1">
                        {isPositive ? (
                          <TrendingUp className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-400" />
                        )}
                        <span className={`font-medium ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                          {isPositive ? '+' : ''}{change.toFixed(2)}
                        </span>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 p-4 border-t border-border">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Skip for Now
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!selectedAccountId || !equity || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span> Saving...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Update Equity
                </span>
              )}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
