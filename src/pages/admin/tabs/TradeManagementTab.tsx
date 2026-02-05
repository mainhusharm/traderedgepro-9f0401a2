import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { callEdgeFunction } from '@/config/api';
import { 
  Activity, RefreshCw, TrendingUp, TrendingDown, Shield, 
  Target, Clock, AlertTriangle, Play, Pause, BarChart3
} from 'lucide-react';

interface ActiveTrade {
  id: string;
  symbol: string;
  direction: string;
  entry_price: number;
  current_sl: number;
  stop_loss: number;
  take_profit_1: number;
  take_profit_2: number;
  take_profit_3: number;
  trade_state: string;
  remaining_position_pct: number;
  tp1_closed: boolean;
  tp2_closed: boolean;
  tp1_pnl: number;
  tp2_pnl: number;
  activated_at: string;
  max_favorable_excursion: number;
  max_adverse_excursion: number;
}

interface DailyStats {
  date: string;
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  breakeven_trades: number;
  total_r_multiple: number;
  consecutive_losses: number;
  bot_paused: boolean;
  pause_reason: string;
}

interface TradeEvent {
  id: string;
  signal_id: string;
  event_type: string;
  phase: string;
  price_at_event: number;
  pnl_realized: number;
  r_multiple: number;
  created_at: string;
}

const TradeManagementTab = () => {
  const [activeTrades, setActiveTrades] = useState<ActiveTrade[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null);
  const [recentEvents, setRecentEvents] = useState<TradeEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMonitorRunning, setIsMonitorRunning] = useState(false);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      // Fetch active trades
      const { data: trades } = await (supabase
        .from('institutional_signals' as any)
        .select('*')
        .in('trade_state', ['active', 'phase1', 'phase2', 'phase3'])
        .order('activated_at', { ascending: false }) as any);

      setActiveTrades((trades as unknown as ActiveTrade[]) || []);

      // Fetch today's stats
      const today = new Date().toISOString().split('T')[0];
      const { data: stats } = await supabase
        .from('trade_daily_stats')
        .select('*')
        .eq('date', today)
        .maybeSingle();

      setDailyStats(stats as unknown as DailyStats);

      // Fetch recent events
      const { data: events } = await (supabase
        .from('trade_management_events' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20) as any);

      setRecentEvents((events as unknown as TradeEvent[]) || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const runMonitor = async () => {
    try {
      setIsMonitorRunning(true);
      toast.info('Running trade management monitor...');
      
      const { data, error } = await callEdgeFunction('trade-management-monitor', { action: 'monitor' });

      if (error) throw error;
      toast.success('Monitor cycle complete');
      fetchData();
    } catch (error) {
      console.error('Error running monitor:', error);
      toast.error('Failed to run monitor');
    } finally {
      setIsMonitorRunning(false);
    }
  };

  const getPhaseColor = (state: string) => {
    switch (state) {
      case 'active': return 'bg-yellow-500/20 text-yellow-400';
      case 'phase1': return 'bg-blue-500/20 text-blue-400';
      case 'phase2': return 'bg-green-500/20 text-green-400';
      case 'phase3': return 'bg-purple-500/20 text-purple-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getPhaseLabel = (state: string) => {
    switch (state) {
      case 'active': return 'Initial Risk';
      case 'phase1': return 'Risk-Free (BE)';
      case 'phase2': return 'Profit Locked';
      case 'phase3': return 'Runner + Trail';
      default: return state;
    }
  };

  const winRate = dailyStats && dailyStats.total_trades > 0
    ? ((dailyStats.winning_trades / dailyStats.total_trades) * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary" />
            Professional Trade Management
          </h2>
          <p className="text-muted-foreground">Institutional-grade trade lifecycle management</p>
        </div>
        <Button onClick={runMonitor} disabled={isMonitorRunning} className="gap-2">
          {isMonitorRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          Run Monitor
        </Button>
      </div>

      {/* Daily Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Today's Trades</p>
            <p className="text-2xl font-bold">{dailyStats?.total_trades || 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Wins</p>
            <p className="text-2xl font-bold text-success">{dailyStats?.winning_trades || 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Losses</p>
            <p className="text-2xl font-bold text-destructive">{dailyStats?.losing_trades || 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Breakeven</p>
            <p className="text-2xl font-bold text-warning">{dailyStats?.breakeven_trades || 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Win Rate</p>
            <p className="text-2xl font-bold">{winRate}%</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Total R</p>
            <p className={`text-2xl font-bold ${(dailyStats?.total_r_multiple || 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
              {(dailyStats?.total_r_multiple || 0) > 0 ? '+' : ''}{(dailyStats?.total_r_multiple || 0).toFixed(2)}R
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bot Status Warning */}
      {dailyStats?.bot_paused && (
        <Card className="bg-destructive/10 border-destructive/30">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <div>
              <p className="font-medium text-destructive">Bot Paused</p>
              <p className="text-sm text-muted-foreground">{dailyStats.pause_reason}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Trades */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Active Trades ({activeTrades.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : activeTrades.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No active trades</p>
          ) : (
            <div className="space-y-4">
              {activeTrades.map((trade) => (
                <div key={trade.id} className="p-4 rounded-lg bg-background/50 border border-border/30">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {trade.direction === 'BUY' ? (
                        <TrendingUp className="w-5 h-5 text-success" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-destructive" />
                      )}
                      <span className="font-bold">{trade.symbol}</span>
                      <Badge className={getPhaseColor(trade.trade_state)}>
                        {getPhaseLabel(trade.trade_state)}
                      </Badge>
                      <Badge variant="outline">{trade.remaining_position_pct}% remaining</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {trade.activated_at ? new Date(trade.activated_at).toLocaleTimeString() : '-'}
                    </div>
                  </div>

                  <div className="grid grid-cols-5 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Entry</p>
                      <p className="font-mono">{trade.entry_price}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Current SL</p>
                      <p className="font-mono text-destructive">{trade.current_sl || trade.stop_loss}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">TP1 {trade.tp1_closed && '✓'}</p>
                      <p className="font-mono text-success">{trade.take_profit_1}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">TP2 {trade.tp2_closed && '✓'}</p>
                      <p className="font-mono text-success">{trade.take_profit_2}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">TP3</p>
                      <p className="font-mono text-success">{trade.take_profit_3}</p>
                    </div>
                  </div>

                  {/* Progress to targets */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span>SL</span>
                      <span>Entry</span>
                      <span>TP1</span>
                      <span>TP2</span>
                      <span>TP3</span>
                    </div>
                    <Progress value={trade.tp1_closed ? (trade.tp2_closed ? 80 : 50) : 25} className="h-2" />
                  </div>

                  {/* Locked Profits */}
                  {(trade.tp1_pnl || trade.tp2_pnl) && (
                    <div className="mt-3 flex gap-4">
                      {trade.tp1_pnl && (
                        <Badge className="bg-success/20 text-success">
                          TP1 Locked: +{trade.tp1_pnl.toFixed(2)}R
                        </Badge>
                      )}
                      {trade.tp2_pnl && (
                        <Badge className="bg-success/20 text-success">
                          TP2 Locked: +{trade.tp2_pnl.toFixed(2)}R
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Events */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Recent Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {recentEvents.map((event) => (
              <div key={event.id} className="flex items-center justify-between p-2 rounded bg-background/30 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">{event.event_type.replace(/_/g, ' ')}</Badge>
                  <span className="text-muted-foreground">{event.phase}</span>
                </div>
                <div className="flex items-center gap-4">
                  {event.r_multiple !== 0 && (
                    <span className={event.r_multiple > 0 ? 'text-success' : 'text-destructive'}>
                      {event.r_multiple > 0 ? '+' : ''}{event.r_multiple.toFixed(2)}R
                    </span>
                  )}
                  <span className="text-muted-foreground text-xs">
                    {new Date(event.created_at).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TradeManagementTab;
