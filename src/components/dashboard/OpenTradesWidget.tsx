import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, X, RefreshCw, DollarSign, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { callEdgeFunction } from '@/config/api';
import { toast } from 'sonner';
import { format } from 'date-fns';
import PostTradeReflectionModal from '@/components/dashboard/PostTradeReflectionModal';
import { usePostTradeReflection } from '@/hooks/usePostTradeReflection';

interface TradeAllocation {
  id: string;
  signal_id: string;
  account_id: string;
  lot_size: number;
  entry_price: number;
  stop_loss: number;
  take_profit_1: number;
  status: string;
  unrealized_pnl: number;
  realized_pnl: number;
  created_at: string;
  // Joined data
  symbol?: string;
  signal_type?: string;
  account_label?: string;
  prop_firm_name?: string;
}

interface OpenTradesWidgetProps {
  className?: string;
  accountId?: string;
}

export default function OpenTradesWidget({ className, accountId }: OpenTradesWidgetProps) {
  const { user } = useAuth();
  const [trades, setTrades] = useState<TradeAllocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [closingTradeId, setClosingTradeId] = useState<string | null>(null);
  const [closePrice, setClosePrice] = useState<string>('');
  const [showCloseModal, setShowCloseModal] = useState<string | null>(null);
  
  // Post-trade reflection state
  const { isOpen: reflectionOpen, tradeData, openReflection, closeReflection, setIsOpen: setReflectionOpen } = usePostTradeReflection();

  useEffect(() => {
    if (user) {
      fetchOpenTrades();
      const channel = supabase
        .channel('open-trades')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'user_trade_allocations',
          filter: `user_id=eq.${user.id}`
        }, () => {
          fetchOpenTrades();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, accountId]);

  const fetchOpenTrades = async () => {
    if (!user) return;

    try {
      // Fetch allocations
      const { data: allocData, error } = await supabase
        .from('user_trade_allocations')
        .select('id, signal_id, account_id, lot_size, entry_price, stop_loss, take_profit_1, status, unrealized_pnl, realized_pnl, created_at')
        .eq('user_id', user.id)
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const allocations = allocData || [];
      
      // Get signal info
      const signalIds = [...new Set(allocations.map(a => a.signal_id).filter(Boolean))];
      let signalMap: Record<string, { symbol: string; signal_type: string }> = {};
      
      if (signalIds.length > 0) {
        const { data: signalsData } = await supabase
          .from('institutional_signals')
          .select('id, symbol, direction')
          .in('id', signalIds);
        
        (signalsData || []).forEach(s => {
          signalMap[s.id] = { symbol: s.symbol, signal_type: (s as any).direction };
        });
      }
      
      // Get account info
      const accountIds = [...new Set(allocations.map(a => a.account_id).filter(Boolean))];
      let accountMap: Record<string, { account_label: string; prop_firm_name: string }> = {};
      
      if (accountIds.length > 0) {
        const { data: accountsData } = await supabase
          .from('user_prop_accounts')
          .select('id, account_label, prop_firm_name')
          .in('id', accountIds);
        
        (accountsData || []).forEach(a => {
          accountMap[a.id] = { account_label: a.account_label || 'Account', prop_firm_name: a.prop_firm_name || '' };
        });
      }
      
      const mapped: TradeAllocation[] = allocations.map(a => ({
        ...a,
        symbol: signalMap[a.signal_id]?.symbol,
        signal_type: signalMap[a.signal_id]?.signal_type,
        account_label: accountMap[a.account_id]?.account_label || 'Account',
        prop_firm_name: accountMap[a.account_id]?.prop_firm_name || ''
      }));
      
      setTrades(mapped);
    } catch (error) {
      console.error('Error fetching open trades:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncPnL = async () => {
    setIsSyncing(true);
    try {
      const { data, error } = await callEdgeFunction<{ updated?: number }>('sync-trade-pnl', {
        userId: user?.id,
        accountId,
      });

      if (error) throw error;
      
      toast.success(`Synced ${data?.updated || 0} trades`);
      fetchOpenTrades();
    } catch (error) {
      console.error('Error syncing P&L:', error);
      toast.error('Failed to sync P&L');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCloseTrade = async (trade: TradeAllocation, outcome: 'tp' | 'sl' | 'custom') => {
    if (!user) return;

    setClosingTradeId(trade.id);
    try {
      let finalPnl = 0;
      let exitPrice = trade.entry_price;
      const direction = trade.signal_type === 'BUY' ? 1 : -1;

      if (outcome === 'tp') {
        exitPrice = trade.take_profit_1;
        finalPnl = trade.lot_size * 10 * Math.abs(trade.take_profit_1 - trade.entry_price) * direction * 10000;
      } else if (outcome === 'sl') {
        exitPrice = trade.stop_loss;
        finalPnl = -trade.lot_size * 10 * Math.abs(trade.stop_loss - trade.entry_price) * 10000;
      } else if (outcome === 'custom' && closePrice) {
        exitPrice = parseFloat(closePrice);
        finalPnl = trade.lot_size * 10 * (exitPrice - trade.entry_price) * direction * 10000;
      }

      const { error: updateError } = await supabase
        .from('user_trade_allocations')
        .update({
          status: 'closed',
          realized_pnl: finalPnl,
          closed_at: new Date().toISOString(),
          exit_price: exitPrice
        })
        .eq('id', trade.id);

      if (updateError) throw updateError;

      await supabase
        .from('user_signal_actions')
        .update({
          outcome: outcome === 'tp' ? 'target_hit' : outcome === 'sl' ? 'stop_loss_hit' : 'custom',
          pnl: finalPnl
        })
        .eq('user_id', user.id)
        .eq('signal_id', trade.signal_id);

      const { data: dashboardRows, error: dashboardError } = await supabase
        .from('dashboard_data')
        .select('total_pnl, total_trades, winning_trades, losing_trades')
        .eq('user_id', user.id)
        .limit(1);

      if (dashboardError) throw dashboardError;

      const dashboard = (dashboardRows as any[] | null)?.[0];

      if (dashboard) {
        await supabase
          .from('dashboard_data')
          .update({
            total_pnl: (dashboard.total_pnl || 0) + finalPnl,
            total_trades: (dashboard.total_trades || 0) + 1,
            winning_trades: finalPnl > 0 ? (dashboard.winning_trades || 0) + 1 : dashboard.winning_trades,
            losing_trades: finalPnl < 0 ? (dashboard.losing_trades || 0) + 1 : dashboard.losing_trades,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);
      }

      toast.success(`Trade closed with ${finalPnl >= 0 ? '+' : ''}$${finalPnl.toFixed(2)}`);
      setShowCloseModal(null);
      setClosePrice('');
      fetchOpenTrades();
      
      // Open post-trade reflection modal
      openReflection({
        allocationId: trade.id,
        symbol: trade.symbol,
        pnl: finalPnl
      });
    } catch (error) {
      console.error('Error closing trade:', error);
      toast.error('Failed to close trade');
    } finally {
      setClosingTradeId(null);
    }
  };

  const totalUnrealizedPnl = trades.reduce((sum, t) => sum + (t.unrealized_pnl || 0), 0);

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
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Open Trades ({trades.length})
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={totalUnrealizedPnl >= 0 ? 'default' : 'destructive'}>
              {totalUnrealizedPnl >= 0 ? '+' : ''}{totalUnrealizedPnl.toFixed(2)}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSyncPnL}
              disabled={isSyncing}
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {trades.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No open trades</p>
            <p className="text-xs">Take signals to see them here</p>
          </div>
        ) : (
          <div className="space-y-2">
            {trades.map((trade) => (
              <motion.div
                key={trade.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-muted/30 rounded-lg border border-border"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded ${trade.signal_type === 'BUY' ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                      {trade.signal_type === 'BUY' ? (
                        <TrendingUp className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <TrendingDown className="w-3 h-3 text-red-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{trade.symbol || 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground">
                        {trade.account_label} • {trade.lot_size} lots
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium text-sm ${
                      (trade.unrealized_pnl || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {(trade.unrealized_pnl || 0) >= 0 ? '+' : ''}{(trade.unrealized_pnl || 0).toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(trade.created_at), 'MMM d, HH:mm')}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                  <div className="text-center">
                    <p className="text-muted-foreground">Entry</p>
                    <p className="font-mono">{trade.entry_price}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-red-400">SL</p>
                    <p className="font-mono">{trade.stop_loss}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-emerald-400">TP</p>
                    <p className="font-mono">{trade.take_profit_1}</p>
                  </div>
                </div>

                {showCloseModal === trade.id ? (
                  <div className="space-y-2 pt-2 border-t border-border">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                        onClick={() => handleCloseTrade(trade, 'tp')}
                        disabled={closingTradeId === trade.id}
                      >
                        TP Hit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-red-400 border-red-500/30 hover:bg-red-500/10"
                        onClick={() => handleCloseTrade(trade, 'sl')}
                        disabled={closingTradeId === trade.id}
                      >
                        <X className="w-3 h-3 mr-1" />
                        SL Hit
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Custom close price"
                        value={closePrice}
                        onChange={(e) => setClosePrice(e.target.value)}
                        className="flex-1 h-8 text-xs"
                      />
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleCloseTrade(trade, 'custom')}
                        disabled={!closePrice || closingTradeId === trade.id}
                      >
                        Close
                      </Button>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-full text-xs"
                      onClick={() => {
                        setShowCloseModal(null);
                        setClosePrice('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs"
                    onClick={() => setShowCloseModal(trade.id)}
                  >
                    <DollarSign className="w-3 h-3 mr-1" />
                    Close Trade
                  </Button>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
      
      {/* Post-Trade Reflection Modal */}
      {user && (
        <PostTradeReflectionModal
          open={reflectionOpen}
          onOpenChange={setReflectionOpen}
          userId={user.id}
          allocationId={tradeData.allocationId}
          symbol={tradeData.symbol}
          pnl={tradeData.pnl}
          onComplete={closeReflection}
        />
      )}
    </Card>
  );
}
