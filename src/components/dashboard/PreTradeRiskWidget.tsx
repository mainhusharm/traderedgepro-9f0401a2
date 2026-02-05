import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle, Clock, Calendar, TrendingDown, Activity, Zap, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { callEdgeFunction } from '@/config/api';
import { useAuth } from '@/lib/auth/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface PropAccount {
  id: string;
  account_label: string;
  prop_firm_name: string;
  daily_dd_limit_pct: number;
  max_dd_limit_pct: number;
  daily_drawdown_used_pct: number;
  max_drawdown_used_pct: number;
  recovery_mode_active: boolean;
  max_open_trades: number;
  news_trading_allowed: boolean;
  weekend_holding_allowed: boolean;
}

interface OpenTrade {
  id: string;
  lot_size: number;
}

interface EconomicEvent {
  name: string;
  currency: string;
  impact: string;
  time: string;
}

interface PreTradeRiskWidgetProps {
  accountId?: string;
  className?: string;
}

export const PreTradeRiskWidget = ({ accountId, className }: PreTradeRiskWidgetProps) => {
  const { user } = useAuth();
  const [account, setAccount] = useState<PropAccount | null>(null);
  const [openTrades, setOpenTrades] = useState<OpenTrade[]>([]);
  const [upcomingNews, setUpcomingNews] = useState<EconomicEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [weekendCountdown, setWeekendCountdown] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchData();
      checkWeekendCountdown();
    }
  }, [user, accountId]);

  const fetchData = async () => {
    if (!user) return;

    try {
      // Fetch account
      let query = supabase
        .from('user_prop_accounts' as any)
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active');
      
      if (accountId) {
        query = query.eq('id', accountId);
      }
      
      const { data: accounts } = await query.limit(1).single();
      if (accounts) {
        setAccount(accounts as any);
        
        // Fetch open trades for this account
        const { data: trades } = await supabase
          .from('user_trade_allocations' as any)
          .select('id, lot_size')
          .eq('account_id', (accounts as any).id)
          .in('status', ['active', 'partial', 'pending']);
        
        setOpenTrades((trades || []) as any);
      }

      // Fetch upcoming high-impact news
      try {
        const { data: calendarData } = await callEdgeFunction('economic-calendar', { days: 1 });
        
        if (calendarData?.events) {
          const now = new Date();
          const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
          
          const upcoming = calendarData.events
            .filter((e: any) => {
              const eventTime = new Date(e.date || e.time);
              return e.impact === 'high' && eventTime > now && eventTime < oneHourFromNow;
            })
            .slice(0, 3);
          
          setUpcomingNews(upcoming);
        }
      } catch (e) {
        console.log('Could not fetch economic calendar:', e);
      }
    } catch (error) {
      console.error('Error fetching pre-trade data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkWeekendCountdown = () => {
    const now = new Date();
    const dayOfWeek = now.getUTCDay();
    const hour = now.getUTCHours();
    
    // Only show countdown on Friday
    if (dayOfWeek === 5) {
      const marketClose = new Date(now);
      marketClose.setUTCHours(21, 0, 0, 0); // Assuming 9 PM UTC market close
      
      if (now < marketClose) {
        const diffMs = marketClose.getTime() - now.getTime();
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        setWeekendCountdown(`${hours}h ${minutes}m until market close`);
      }
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-8 bg-muted rounded"></div>
            <div className="h-8 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!account) {
    return null;
  }

  const dailyDDRemaining = Math.max(0, account.daily_dd_limit_pct - (account.daily_drawdown_used_pct || 0));
  const maxDDRemaining = Math.max(0, account.max_dd_limit_pct - (account.max_drawdown_used_pct || 0));
  const dailyDDUsed = ((account.daily_drawdown_used_pct || 0) / account.daily_dd_limit_pct) * 100;
  const maxDDUsed = ((account.max_drawdown_used_pct || 0) / account.max_dd_limit_pct) * 100;
  
  const getDDColor = (usedPct: number) => {
    if (usedPct >= 90) return 'text-destructive';
    if (usedPct >= 70) return 'text-warning';
    if (usedPct >= 50) return 'text-yellow-500';
    return 'text-success';
  };

  const getProgressColor = (usedPct: number) => {
    if (usedPct >= 90) return 'bg-destructive';
    if (usedPct >= 70) return 'bg-warning';
    if (usedPct >= 50) return 'bg-yellow-500';
    return 'bg-success';
  };

  const openTradesCount = openTrades.length;
  const totalOpenLots = openTrades.reduce((sum, t) => sum + (t.lot_size || 0), 0);

  return (
    <Card className={`border-primary/20 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Shield className="w-5 h-5 text-primary" />
          Pre-Trade Risk Check
          {account.recovery_mode_active && (
            <Badge variant="destructive" className="ml-auto animate-pulse">
              🛡️ Recovery Mode
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Recovery Mode Warning */}
        {account.recovery_mode_active && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-3 rounded-lg bg-destructive/10 border border-destructive/30"
          >
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
              <div>
                <p className="font-semibold text-destructive">Recovery Mode Active</p>
                <p className="text-sm text-muted-foreground">
                  Risk is limited to 0.5% per trade. Trade carefully to exit recovery mode (3 winning days needed).
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Drawdown Meters */}
        <div className="grid grid-cols-2 gap-4">
          {/* Daily DD */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Daily DD</span>
              <span className={`text-sm font-bold ${getDDColor(dailyDDUsed)}`}>
                {dailyDDRemaining.toFixed(2)}% left
              </span>
            </div>
            <div className="relative h-3 bg-muted rounded-full overflow-hidden">
              <div 
                className={`absolute inset-y-0 left-0 ${getProgressColor(dailyDDUsed)} transition-all`}
                style={{ width: `${Math.min(100, dailyDDUsed)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {account.daily_drawdown_used_pct?.toFixed(2) || '0.00'}% / {account.daily_dd_limit_pct}% used
            </p>
          </div>

          {/* Max DD */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Max DD</span>
              <span className={`text-sm font-bold ${getDDColor(maxDDUsed)}`}>
                {maxDDRemaining.toFixed(2)}% left
              </span>
            </div>
            <div className="relative h-3 bg-muted rounded-full overflow-hidden">
              <div 
                className={`absolute inset-y-0 left-0 ${getProgressColor(maxDDUsed)} transition-all`}
                style={{ width: `${Math.min(100, maxDDUsed)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {account.max_drawdown_used_pct?.toFixed(2) || '0.00'}% / {account.max_dd_limit_pct}% used
            </p>
          </div>
        </div>

        {/* Open Positions */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            <span className="text-sm">Open Positions</span>
          </div>
          <div className="text-right">
            <p className="font-semibold">
              {openTradesCount}{account.max_open_trades ? `/${account.max_open_trades}` : ''} trades
            </p>
            <p className="text-xs text-muted-foreground">{totalOpenLots.toFixed(2)} lots</p>
          </div>
        </div>

        {/* Upcoming News */}
        {upcomingNews.length > 0 && !account.news_trading_allowed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-3 rounded-lg bg-warning/10 border border-warning/30"
          >
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-warning mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-warning">High-Impact News Ahead</p>
                <div className="mt-1 space-y-1">
                  {upcomingNews.map((event, i) => (
                    <p key={i} className="text-xs text-muted-foreground">
                      {event.currency}: {event.name}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Weekend Countdown */}
        {weekendCountdown && !account.weekend_holding_allowed && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/30">
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-sm">{weekendCountdown}</span>
          </div>
        )}

        {/* Quick Status Badges */}
        <div className="flex flex-wrap gap-2">
          {dailyDDUsed >= 90 && (
            <Badge variant="destructive">Daily DD Critical</Badge>
          )}
          {maxDDUsed >= 90 && (
            <Badge variant="destructive">Max DD Critical</Badge>
          )}
          {account.max_open_trades && openTradesCount >= account.max_open_trades && (
            <Badge variant="secondary">Max Trades Reached</Badge>
          )}
          {dailyDDUsed < 50 && maxDDUsed < 50 && !account.recovery_mode_active && (
            <Badge className="bg-success/10 text-success border-success/30">Good to Trade</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PreTradeRiskWidget;
