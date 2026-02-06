import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Calculator, DollarSign, Target, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { toast } from 'sonner';
import { calculateLotSizeAndPL } from '@/services/tradingCalculator';

interface Signal {
  id: string;
  symbol: string;
  signal_type: 'BUY' | 'SELL';
  entry_price: number;
  stop_loss: number;
  take_profit: number;
  confidence_score: number;
}

interface PropAccount {
  id: string;
  account_name: string;
  prop_firm: string;
  current_equity: number;
  starting_balance: number;
  daily_dd_limit_pct: number;
  max_dd_limit_pct: number;
  daily_drawdown_used_pct: number;
  max_drawdown_used_pct: number;
  status: string;
}

interface TakeTradeModalProps {
  signal: Signal;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TakeTradeModal({ signal, isOpen, onClose, onSuccess }: TakeTradeModalProps) {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<PropAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [lotSize, setLotSize] = useState<string>('0.01');
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [calculatedRisk, setCalculatedRisk] = useState<any>(null);

  useEffect(() => {
    if (isOpen && user) {
      fetchAccounts();
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (selectedAccountId && signal) {
      calculateRisk();
      validateTrade();
    }
  }, [selectedAccountId, lotSize, signal]);

  const fetchAccounts = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('user_prop_accounts')
      .select('id, account_label, prop_firm_name, current_equity, starting_balance, daily_dd_limit_pct, max_dd_limit_pct, daily_drawdown_used_pct, max_drawdown_used_pct, status')
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
      daily_dd_limit_pct: d.daily_dd_limit_pct || 5,
      max_dd_limit_pct: d.max_dd_limit_pct || 10,
      daily_drawdown_used_pct: d.daily_drawdown_used_pct || 0,
      max_drawdown_used_pct: d.max_drawdown_used_pct || 0,
      status: d.status || 'active'
    }));
    setAccounts(mapped);
    if (mapped.length === 1) {
      setSelectedAccountId(mapped[0].id);
    }
  };

  const calculateRisk = () => {
    const account = accounts.find(a => a.id === selectedAccountId);
    if (!account) return;

    const result = calculateLotSizeAndPL({
      symbol: signal.symbol,
      entry_price: signal.entry_price,
      stop_loss: signal.stop_loss,
      take_profit: signal.take_profit,
    }, {
      accountSize: account.current_equity,
      riskPercentage: 1,
    });

    setCalculatedRisk(result);
    
    if (result.lotSize && lotSize === '0.01') {
      setLotSize(result.lotSize.toFixed(2));
    }
  };

  const validateTrade = async () => {
    if (!selectedAccountId || !user) return;

    setIsValidating(true);
    try {
      const { data, error } = await supabase.functions.invoke('validate-trade-for-user', {
        body: {
          userId: user.id,
          accountId: selectedAccountId,
          signalId: signal.id,
          lotSize: parseFloat(lotSize),
          entryPrice: signal.entry_price,
          stopLoss: signal.stop_loss,
          takeProfit: signal.take_profit,
          direction: signal.signal_type
        }
      });

      if (error) throw error;
      setValidationResult(data);
    } catch (error) {
      console.error('Validation error:', error);
      setValidationResult({ valid: false, errors: ['Failed to validate trade'] });
    } finally {
      setIsValidating(false);
    }
  };

  const handleTakeTrade = async () => {
    if (!user || !selectedAccountId) return;

    if (validationResult && !validationResult.valid) {
      toast.error('Trade validation failed. Please review the warnings.');
      return;
    }

    setIsLoading(true);
    try {
      // Create trade allocation
      const { error } = await supabase
        .from('user_trade_allocations')
        .insert([{
          user_id: user.id,
          account_id: selectedAccountId,
          signal_id: signal.id,
          lot_size: parseFloat(lotSize),
          entry_price: signal.entry_price,
          stop_loss: signal.stop_loss,
          take_profit_1: signal.take_profit,
          status: 'open',
          risk_amount: calculatedRisk?.potentialLoss || 0,
          risk_pct: 1
        }]);

      if (error) throw error;

      // Also create user signal action for tracking
      await supabase
        .from('user_signal_actions')
        .insert({
          user_id: user.id,
          signal_id: signal.id,
          action: 'taken',
        } as any);

      toast.success('Trade allocated successfully!', {
        description: `${signal.signal_type} ${signal.symbol} @ ${signal.entry_price}`
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error taking trade:', error);
      if (error.code === '23505') {
        toast.error('You have already taken this signal');
      } else {
        toast.error('Failed to allocate trade');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const selectedAccount = accounts.find(a => a.id === selectedAccountId);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-card border border-border rounded-xl w-full max-w-lg overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${signal.signal_type === 'BUY' ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                {signal.signal_type === 'BUY' ? (
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-400" />
                )}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Take Trade</h2>
                <p className="text-sm text-muted-foreground">
                  {signal.signal_type} {signal.symbol} @ {signal.entry_price}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Signal Details */}
            <div className="grid grid-cols-3 gap-3 p-3 bg-muted/30 rounded-lg">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Entry</p>
                <p className="font-medium text-foreground">{signal.entry_price}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Stop Loss</p>
                <p className="font-medium text-red-400">{signal.stop_loss}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Take Profit</p>
                <p className="font-medium text-emerald-400">{signal.take_profit}</p>
              </div>
            </div>

            {/* Account Selection */}
            <div className="space-y-2">
              <Label>Select Prop Account</Label>
              {accounts.length === 0 ? (
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <p className="text-sm text-yellow-400">
                    No active prop accounts found. Add an account in the Risk Protocol tab.
                  </p>
                </div>
              ) : (
                <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        <div className="flex items-center gap-2">
                          <span>{account.account_name}</span>
                          <Badge variant="outline" className="text-xs">
                            ${account.current_equity?.toLocaleString()}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Account Risk Status */}
            {selectedAccount && (
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="w-4 h-4 text-blue-400" />
                    <span className="text-xs text-muted-foreground">Daily DD Used</span>
                  </div>
                  <p className={`font-medium ${
                    (selectedAccount.daily_drawdown_used_pct || 0) > 70 ? 'text-red-400' : 
                    (selectedAccount.daily_drawdown_used_pct || 0) > 50 ? 'text-yellow-400' : 'text-emerald-400'
                  }`}>
                    {(selectedAccount.daily_drawdown_used_pct || 0).toFixed(1)}%
                  </p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="w-4 h-4 text-purple-400" />
                    <span className="text-xs text-muted-foreground">Max DD Used</span>
                  </div>
                  <p className={`font-medium ${
                    (selectedAccount.max_drawdown_used_pct || 0) > 70 ? 'text-red-400' : 
                    (selectedAccount.max_drawdown_used_pct || 0) > 50 ? 'text-yellow-400' : 'text-emerald-400'
                  }`}>
                    {(selectedAccount.max_drawdown_used_pct || 0).toFixed(1)}%
                  </p>
                </div>
              </div>
            )}

            {/* Lot Size Input */}
            <div className="space-y-2">
              <Label>Lot Size</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={lotSize}
                  onChange={(e) => setLotSize(e.target.value)}
                  className="flex-1"
                />
                {calculatedRisk && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLotSize(calculatedRisk.lotSize.toFixed(2))}
                    className="whitespace-nowrap"
                  >
                    <Calculator className="w-4 h-4 mr-1" />
                    Suggested: {calculatedRisk.lotSize.toFixed(2)}
                  </Button>
                )}
              </div>
            </div>

            {/* Risk Calculation */}
            {calculatedRisk && (
              <div className="grid grid-cols-2 gap-3 p-3 bg-muted/30 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground">Potential Loss</p>
                  <p className="font-medium text-red-400">
                    -${Math.abs(calculatedRisk.potentialLoss || 0).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Potential Profit</p>
                  <p className="font-medium text-emerald-400">
                    +${(calculatedRisk.potentialProfit || 0).toFixed(2)}
                  </p>
                </div>
              </div>
            )}

            {/* Validation Result */}
            {validationResult && (
              <div className={`p-3 rounded-lg border ${
                validationResult.valid 
                  ? 'bg-emerald-500/10 border-emerald-500/30' 
                  : 'bg-red-500/10 border-red-500/30'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {validationResult.valid ? (
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                  )}
                  <span className={`text-sm font-medium ${
                    validationResult.valid ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {validationResult.valid ? 'Trade Validated' : 'Validation Failed'}
                  </span>
                </div>
                {validationResult.warnings?.length > 0 && (
                  <ul className="text-xs text-yellow-400 space-y-1">
                    {validationResult.warnings.map((w: string, i: number) => (
                      <li key={i}>• {w}</li>
                    ))}
                  </ul>
                )}
                {validationResult.errors?.length > 0 && (
                  <ul className="text-xs text-red-400 space-y-1">
                    {validationResult.errors.map((e: string, i: number) => (
                      <li key={i}>• {e}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 p-4 border-t border-border">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleTakeTrade}
              disabled={!selectedAccountId || isLoading || isValidating || (validationResult && !validationResult.valid)}
              className={`flex-1 ${signal.signal_type === 'BUY' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span> Allocating...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Take {signal.signal_type}
                </span>
              )}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
