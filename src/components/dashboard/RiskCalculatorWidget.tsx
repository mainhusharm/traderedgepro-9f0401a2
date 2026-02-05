import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calculator, DollarSign, Target, TrendingUp, AlertTriangle, RefreshCw, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { calculateLotSizeAndPL, InstrumentType, detectInstrumentType } from '@/services/tradingCalculator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface RiskCalculatorWidgetProps {
  className?: string;
  signal?: {
    symbol: string;
    entry_price: number;
    stop_loss: number | null;
    take_profit: number | null;
  } | null;
}

const RiskCalculatorWidget = ({ className = '', signal }: RiskCalculatorWidgetProps) => {
  const { user } = useAuth();
  const [userSettings, setUserSettings] = useState({
    accountSize: 10000,
    riskPercentage: 1,
  });
  const [manualEntry, setManualEntry] = useState({
    symbol: '',
    entryPrice: '',
    stopLoss: '',
    takeProfit: '',
  });
  const [instrumentType, setInstrumentType] = useState<InstrumentType>('forex');
  const [isLoading, setIsLoading] = useState(true);

  // Load user settings from database
  useEffect(() => {
    const loadUserSettings = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch from questionnaires table
        const { data: questionnaire } = await supabase
          .from('questionnaires')
          .select('account_size, risk_percentage')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (questionnaire) {
          setUserSettings({
            accountSize: questionnaire.account_size || 10000,
            riskPercentage: questionnaire.risk_percentage || 1,
          });
        }

        // Also check dashboard_data for current equity
        const { data: dashboard } = await supabase
          .from('dashboard_data')
          .select('account_size, current_equity')
          .eq('user_id', user.id)
          .single();

        if (dashboard?.current_equity || dashboard?.account_size) {
          setUserSettings(prev => ({
            ...prev,
            accountSize: dashboard.current_equity || dashboard.account_size || prev.accountSize,
          }));
        }
      } catch (error) {
        console.error('Error loading user settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserSettings();
  }, [user]);

  // Update manual entry and detect instrument type when signal prop changes
  useEffect(() => {
    if (signal) {
      setManualEntry({
        symbol: signal.symbol || '',
        entryPrice: signal.entry_price?.toString() || '',
        stopLoss: signal.stop_loss?.toString() || '',
        takeProfit: signal.take_profit?.toString() || '',
      });
      // Auto-detect instrument type from symbol
      if (signal.symbol) {
        setInstrumentType(detectInstrumentType(signal.symbol));
      }
    }
  }, [signal]);

  // Auto-detect instrument type when symbol changes
  useEffect(() => {
    if (manualEntry.symbol) {
      setInstrumentType(detectInstrumentType(manualEntry.symbol));
    }
  }, [manualEntry.symbol]);

  const calculations = useMemo(() => {
    const signalData = {
      symbol: manualEntry.symbol || 'EURUSD',
      entry_price: parseFloat(manualEntry.entryPrice) || 0,
      stop_loss: parseFloat(manualEntry.stopLoss) || 0,
      take_profit: parseFloat(manualEntry.takeProfit) || 0,
    };

    return calculateLotSizeAndPL(signalData, {
      accountSize: userSettings.accountSize,
      riskPercentage: userSettings.riskPercentage,
    });
  }, [manualEntry, userSettings]);

  const refreshSettings = async () => {
    if (!user) return;
    setIsLoading(true);
    
    try {
      const { data: questionnaire } = await supabase
        .from('questionnaires')
        .select('account_size, risk_percentage')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (questionnaire) {
        setUserSettings({
          accountSize: questionnaire.account_size || 10000,
          riskPercentage: questionnaire.risk_percentage || 1,
        });
      }
    } catch (error) {
      console.error('Error refreshing settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get formula explanation based on instrument type
  const getFormulaExplanation = () => {
    switch (instrumentType) {
      case 'forex':
        return {
          title: 'Forex Lot Size Formula',
          formula: 'Lot Size = Risk Amount ÷ (SL Pips × Pip Value)',
          example: `$${calculations.dollarAmount.toFixed(2)} ÷ (${calculations.stopLossPips} pips × $10) = ${calculations.lotSize} lots`,
        };
      case 'futures':
        return {
          title: 'Futures Contract Formula',
          formula: 'Contracts = Risk Amount ÷ (SL Ticks × Tick Value)',
          example: `$${calculations.dollarAmount.toFixed(2)} ÷ (${calculations.stopLossPips} ticks × $12.50) = ${calculations.lotSize} contracts`,
        };
      case 'crypto':
        return {
          title: 'Crypto Position Formula',
          formula: 'Position = Risk Amount ÷ Stop Loss %',
          example: `$${calculations.dollarAmount.toFixed(2)} ÷ (SL% of entry) = ${calculations.lotSize} units`,
        };
    }
  };

  const formulaInfo = getFormulaExplanation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card rounded-xl p-5 ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Calculator className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Risk Calculator</h3>
            <p className="text-xs text-muted-foreground">Real-time position sizing</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={refreshSettings}
          disabled={isLoading}
          className="h-8 w-8 p-0"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Instrument Type Selector */}
      <div className="mb-4">
        <Label className="text-xs mb-1.5 block">Instrument Type</Label>
        <Select value={instrumentType} onValueChange={(v) => setInstrumentType(v as InstrumentType)}>
          <SelectTrigger className="h-9 bg-white/5 border-white/10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="forex">Forex</SelectItem>
            <SelectItem value="futures">Futures</SelectItem>
            <SelectItem value="crypto">Crypto</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Account Info */}
      <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-white/5 rounded-lg">
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Account Balance</p>
          <p className="text-lg font-bold text-primary">${userSettings.accountSize.toLocaleString()}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Risk Per Trade</p>
          <p className="text-lg font-bold text-warning">{userSettings.riskPercentage}%</p>
        </div>
      </div>

      {/* Trade Parameters */}
      <div className="space-y-3 mb-4">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Symbol</Label>
            <Input
              value={manualEntry.symbol}
              onChange={(e) => setManualEntry({ ...manualEntry, symbol: e.target.value.toUpperCase() })}
              className="h-8 text-sm bg-white/5 border-white/10"
              placeholder={instrumentType === 'forex' ? 'EURUSD' : instrumentType === 'futures' ? 'ES' : 'BTCUSD'}
            />
          </div>
          <div>
            <Label className="text-xs">Entry Price</Label>
            <Input
              type="number"
              step="0.00001"
              value={manualEntry.entryPrice}
              onChange={(e) => setManualEntry({ ...manualEntry, entryPrice: e.target.value })}
              className="h-8 text-sm bg-white/5 border-white/10"
              placeholder={instrumentType === 'crypto' ? '45000' : '1.0850'}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Stop Loss</Label>
            <Input
              type="number"
              step="0.00001"
              value={manualEntry.stopLoss}
              onChange={(e) => setManualEntry({ ...manualEntry, stopLoss: e.target.value })}
              className="h-8 text-sm bg-white/5 border-white/10"
              placeholder={instrumentType === 'crypto' ? '44000' : '1.0800'}
            />
          </div>
          <div>
            <Label className="text-xs">Take Profit</Label>
            <Input
              type="number"
              step="0.00001"
              value={manualEntry.takeProfit}
              onChange={(e) => setManualEntry({ ...manualEntry, takeProfit: e.target.value })}
              className="h-8 text-sm bg-white/5 border-white/10"
              placeholder={instrumentType === 'crypto' ? '47000' : '1.0950'}
            />
          </div>
        </div>
      </div>

      {/* Formula Explanation */}
      <div className="mb-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Info className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-primary">{formulaInfo.title}</span>
        </div>
        <p className="text-xs text-muted-foreground font-mono mb-1">{formulaInfo.formula}</p>
        {calculations.calculationBreakdown && calculations.calculationBreakdown !== 'Invalid input data' && (
          <p className="text-xs text-foreground/80 font-mono break-all">
            {calculations.calculationBreakdown}
          </p>
        )}
      </div>

      {/* Calculations */}
      <div className="space-y-2">
        <div className="flex items-center justify-between py-2 px-3 bg-primary/10 rounded-lg">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">{calculations.positionLabel}</span>
          </div>
          <span className="text-lg font-bold text-primary">{calculations.lotSize}</span>
        </div>

        <div className="flex items-center justify-between py-2 px-3 bg-success/10 rounded-lg">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-success" />
            <span className="text-sm">Potential Profit</span>
          </div>
          <span className="font-semibold text-success">+${calculations.potentialProfit.toFixed(2)}</span>
        </div>

        <div className="flex items-center justify-between py-2 px-3 bg-destructive/10 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            <span className="text-sm">Potential Loss</span>
          </div>
          <span className="font-semibold text-destructive">-${calculations.potentialLoss.toFixed(2)}</span>
        </div>

        <div className="flex items-center justify-between py-2 px-3 bg-white/5 rounded-lg">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">Risk:Reward</span>
          </div>
          <span className={`font-semibold ${calculations.matchesUserPreference ? 'text-success' : 'text-warning'}`}>
            1:{calculations.riskReward}
          </span>
        </div>

        {/* Pips/Points Info */}
        <div className="flex items-center justify-between py-2 px-3 bg-white/5 rounded-lg text-xs">
          <span className="text-muted-foreground">
            SL: {calculations.stopLossPips} {instrumentType === 'forex' ? 'pips' : instrumentType === 'futures' ? 'ticks' : 'pts'}
          </span>
          <span className="text-muted-foreground">
            TP: {calculations.takeProfitPips} {instrumentType === 'forex' ? 'pips' : instrumentType === 'futures' ? 'ticks' : 'pts'}
          </span>
        </div>
      </div>

      {/* Tip */}
      <div className="mt-4 p-3 bg-muted/30 rounded-lg">
        <p className="text-xs text-muted-foreground">
          💡 Based on {userSettings.riskPercentage}% risk of ${userSettings.accountSize.toLocaleString()} = <span className="font-semibold text-primary">${calculations.dollarAmount.toFixed(2)}</span> per trade
        </p>
      </div>
    </motion.div>
  );
};

export default RiskCalculatorWidget;