import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, AlertTriangle, Shield, Layers } from 'lucide-react';

interface AggregateRiskWidgetProps {
  accountId: string;
  userId: string;
}

interface CurrencyExposure {
  currency: string;
  netExposure: number;
  positions: number;
}

interface CorrelationWarning {
  symbols: string[];
  direction: string;
  totalLots: number;
}

export default function AggregateRiskWidget({ accountId, userId }: AggregateRiskWidgetProps) {
  const [totalRiskPct, setTotalRiskPct] = useState(0);
  const [totalOpenLots, setTotalOpenLots] = useState(0);
  const [currencyExposures, setCurrencyExposures] = useState<CurrencyExposure[]>([]);
  const [correlationWarnings, setCorrelationWarnings] = useState<CorrelationWarning[]>([]);
  const [maxRiskAllowed, setMaxRiskAllowed] = useState(5);
  const [isLoading, setIsLoading] = useState(true);

  const CORRELATED_PAIRS: Record<string, string[]> = {
    'EURUSD': ['GBPUSD', 'AUDUSD', 'NZDUSD'],
    'GBPUSD': ['EURUSD', 'AUDUSD', 'NZDUSD'],
    'USDJPY': ['USDCHF', 'USDCAD'],
    'USDCHF': ['USDJPY', 'USDCAD'],
    'AUDUSD': ['NZDUSD', 'EURUSD'],
    'NZDUSD': ['AUDUSD', 'EURUSD'],
    'XAUUSD': ['EURUSD', 'XAGUSD'],
  };

  useEffect(() => {
    if (accountId && userId) {
      fetchRiskData();
    }
  }, [accountId, userId]);

  const fetchRiskData = async () => {
    try {
      // Get account info
      const { data: account } = await supabase
        .from('user_prop_accounts')
        .select('*')
        .eq('id', accountId)
        .single();

      if (!account) return;
      
      const accountData = account as any;
      setMaxRiskAllowed(accountData.max_correlated_exposure_pct || 5);

      // Get open allocations
      const { data: allocations } = await supabase
        .from('user_trade_allocations' as any)
        .select('lot_size, entry_price, stop_loss, signal_id')
        .eq('user_id', userId)
        .eq('account_id', accountId)
        .in('status', ['pending', 'active', 'partial', 'open']);

      if (!allocations || allocations.length === 0) {
        setIsLoading(false);
        return;
      }

      // Get signal data for symbols
      const signalIds = (allocations as any[]).map(a => a.signal_id).filter(Boolean);
      let signalMap: Record<string, { symbol: string; direction: string }> = {};

      if (signalIds.length > 0) {
        const { data: signals } = await supabase
          .from('institutional_signals')
          .select('id, symbol, direction')
          .in('id', signalIds);

        (signals || []).forEach((s: any) => {
          signalMap[s.id] = { symbol: s.symbol, direction: s.direction };
        });
      }

      // Calculate total lots and risk
      let totalLots = 0;
      let totalRiskUSD = 0;
      const currencyMap: Record<string, { net: number; count: number }> = {};
      const symbolDirectionMap: Record<string, { lots: number; direction: string }> = {};

      for (const alloc of (allocations as any[])) {
        totalLots += alloc.lot_size || 0;
        
        // Rough risk calculation
        const pipValue = 10; // Standard lot pip value
        const stopPips = Math.abs((alloc.entry_price - alloc.stop_loss) / 0.0001);
        const riskForTrade = (alloc.lot_size || 0) * pipValue * stopPips;
        totalRiskUSD += riskForTrade;

        const signalData = signalMap[alloc.signal_id];
        if (signalData) {
          const { symbol, direction } = signalData;
          
          // Currency exposure
          const base = symbol.substring(0, 3);
          const quote = symbol.substring(3, 6);
          
          if (!currencyMap[base]) currencyMap[base] = { net: 0, count: 0 };
          if (!currencyMap[quote]) currencyMap[quote] = { net: 0, count: 0 };
          
          const multiplier = direction === 'BUY' ? 1 : -1;
          currencyMap[base].net += (alloc.lot_size || 0) * multiplier;
          currencyMap[base].count += 1;
          currencyMap[quote].net -= (alloc.lot_size || 0) * multiplier;
          currencyMap[quote].count += 1;

          // Track for correlation
          const key = `${symbol}_${direction}`;
          if (!symbolDirectionMap[key]) {
            symbolDirectionMap[key] = { lots: 0, direction };
          }
          symbolDirectionMap[key].lots += alloc.lot_size || 0;
        }
      }

      // Calculate risk percentage
      const accountInfo = account as any;
      const riskPct = accountInfo.current_equity > 0 
        ? (totalRiskUSD / accountInfo.current_equity) * 100 
        : 0;

      // Build currency exposures
      const exposures: CurrencyExposure[] = Object.entries(currencyMap)
        .filter(([_, data]) => Math.abs(data.net) > 0.01)
        .map(([currency, data]) => ({
          currency,
          netExposure: data.net,
          positions: data.count
        }))
        .sort((a, b) => Math.abs(b.netExposure) - Math.abs(a.netExposure));

      // Find correlation warnings
      const warnings: CorrelationWarning[] = [];
      const processedPairs = new Set<string>();

      for (const [key, data] of Object.entries(symbolDirectionMap)) {
        const [symbol, direction] = key.split('_');
        const correlated = CORRELATED_PAIRS[symbol] || [];
        
        for (const corrSymbol of correlated) {
          const corrKey = `${corrSymbol}_${direction}`;
          if (symbolDirectionMap[corrKey] && !processedPairs.has(`${symbol}-${corrSymbol}`)) {
            warnings.push({
              symbols: [symbol, corrSymbol],
              direction,
              totalLots: data.lots + symbolDirectionMap[corrKey].lots
            });
            processedPairs.add(`${symbol}-${corrSymbol}`);
            processedPairs.add(`${corrSymbol}-${symbol}`);
          }
        }
      }

      setTotalOpenLots(totalLots);
      setTotalRiskPct(riskPct);
      setCurrencyExposures(exposures.slice(0, 4));
      setCorrelationWarnings(warnings);
    } catch (error) {
      console.error('Error fetching risk data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskColor = (pct: number) => {
    if (pct < 2) return 'text-emerald-400';
    if (pct < 4) return 'text-amber-400';
    return 'text-red-400';
  };

  const getRiskBgColor = (pct: number) => {
    if (pct < 2) return 'bg-emerald-500';
    if (pct < 4) return 'bg-amber-500';
    return 'bg-red-500';
  };

  if (isLoading) {
    return (
      <Card>
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
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            Aggregate Risk
          </CardTitle>
          <Badge variant={totalRiskPct < 2 ? 'default' : totalRiskPct < 4 ? 'secondary' : 'destructive'}>
            {totalOpenLots.toFixed(2)} lots open
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total Risk Display */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total Open Risk</span>
            <span className={`font-bold ${getRiskColor(totalRiskPct)}`}>
              {totalRiskPct.toFixed(2)}%
            </span>
          </div>
          <Progress 
            value={Math.min(100, (totalRiskPct / maxRiskAllowed) * 100)} 
            className={`h-2 ${getRiskBgColor(totalRiskPct)}`}
          />
          <p className="text-xs text-muted-foreground text-right">
            Max: {maxRiskAllowed}%
          </p>
        </div>

        {/* Currency Exposure */}
        {currencyExposures.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Currency Exposure
            </p>
            <div className="grid grid-cols-2 gap-2">
              {currencyExposures.map((exp) => (
                <div 
                  key={exp.currency} 
                  className="p-2 rounded-lg bg-muted/30 text-center"
                >
                  <p className="text-xs text-muted-foreground">{exp.currency}</p>
                  <p className={`font-bold ${exp.netExposure > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {exp.netExposure > 0 ? '+' : ''}{exp.netExposure.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Correlation Warnings */}
        {correlationWarnings.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium flex items-center gap-2 text-amber-400">
              <AlertTriangle className="w-4 h-4" />
              Correlation Alert
            </p>
            {correlationWarnings.map((warning, i) => (
              <div 
                key={i}
                className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs"
              >
                <span className="font-medium">{warning.symbols.join(' & ')}</span>
                <span className="text-muted-foreground"> ({warning.direction})</span>
                <span className="float-right">{warning.totalLots.toFixed(2)} lots</span>
              </div>
            ))}
          </div>
        )}

        {/* Safe State */}
        {totalRiskPct < 2 && correlationWarnings.length === 0 && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm">
            <Shield className="w-4 h-4" />
            Risk exposure within safe limits
          </div>
        )}
      </CardContent>
    </Card>
  );
}
