import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAdminApi } from '@/hooks/useAdminApi';
import { callEdgeFunction } from '@/config/api';
import { 
  Brain, 
  Play, 
  Pause, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown,
  Target,
  Shield,
  Clock,
  CheckCircle2,
  XCircle,
  Send,
  Eye,
  ChevronDown,
  ChevronUp,
  Zap,
  BarChart3,
  Activity,
  Timer,
  Bell,
  BellOff,
  Trash2,
  Trophy,
  AlertTriangle,
  Rocket,
  DollarSign,
  Bitcoin,
  LineChart,
  MessageCircle
} from 'lucide-react';
import { ConfluenceScoreDisplay } from '@/components/signals/ConfluenceScoreDisplay';
import { KillZoneBadge } from '@/components/signals/KillZoneBadge';
import { SignalMessageChat, useSignalMessages } from '@/components/signals/SignalMessageChat';
import { DailySocialPostingCard } from '@/components/admin/DailySocialPostingCard';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface PriceData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  timestamp: string;
}

interface InstitutionalSignal {
  id: string;
  symbol: string;
  direction: 'BUY' | 'SELL';
  entry_price: number;
  stop_loss: number;
  take_profit_1: number;
  take_profit_2: number | null;
  take_profit_3: number | null;
  confidence: number;
  confluence_score: number;
  htf_bias: string;
  ltf_entry: string;
  analysis_mode: string;
  price_action_analysis: any;
  smc_analysis: any;
  ipda_targets: any;
  confluence_factors: string[];
  reasoning: string;
  kill_zone: string;
  send_to_users: boolean;
  sent_at: string | null;
  outcome: string;
  created_at: string;
  timeframe: string;
  htf_timeframe: string;
  ltf_timeframe: string;
  risk_reward_ratio: number;
  pips_to_sl: number;
  pips_to_tp1: number;
  // Risk management fields
  entry_triggered?: boolean;
  entry_triggered_at?: string;
  signal_status?: 'pending' | 'active' | 'won' | 'lost' | 'breakeven' | 'expired';
  current_price?: number;
  highest_price?: number;
  lowest_price?: number;
  trailing_stop?: number;
  breakeven_triggered?: boolean;
  partial_tp_triggered?: boolean;
  // Phase tracking fields
  trade_state?: 'pending' | 'active' | 'phase1' | 'phase2' | 'phase3' | 'closed';
  tp1_closed?: boolean;
  tp2_closed?: boolean;
  tp1_pnl?: number;
  tp2_pnl?: number;
  runner_pnl?: number;
  final_r_multiple?: number;
  remaining_position_pct?: number;
  max_adverse_excursion?: number;
  max_favorable_excursion?: number;
  atr_14?: number;
  volatility_regime?: string;
  news_within_30min?: boolean;
  entry_spread?: number;
}

interface BotConfig {
  id: string;
  is_running: boolean;
  pairs: string[];
  auto_broadcast?: boolean;
  send_to_users_enabled?: boolean;
  send_to_agents_enabled?: boolean;
  started_at?: string;
  stopped_at?: string;
  last_signal_at?: string;
  signals_sent_today?: number;
  strategy_config: {
    analysisMode: string;
    minConfluenceScore: number;
    killZoneOnly: boolean;
    killZones: string[];
    enabledForex?: boolean;
    enabledFutures?: boolean;
    enabledCrypto?: boolean;
    autoRunInterval?: number;
  };
}

interface SignalStats {
  total: number;
  pending: number;
  active: number;
  won: number;
  lost: number;
  breakeven: number;
  expired: number;
  winRate: number;
  profitFactor: number;
}

interface PostTradeAnalytics {
  avgMAE: number;
  avgMFE: number;
  avgRMultiple: number;
  expectancy: number;
  totalTrades: number;
}

const InstitutionalBotTab = () => {
  const { callAdminApi } = useAdminApi();
  const [signals, setSignals] = useState<InstitutionalSignal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [botConfig, setBotConfig] = useState<BotConfig | null>(null);
  const [expandedSignal, setExpandedSignal] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState('signals');
  const [activeInstrumentTab, setActiveInstrumentTab] = useState('all');
  const [livePrices, setLivePrices] = useState<Record<string, PriceData>>({});
  const [signalStats, setSignalStats] = useState<SignalStats | null>(null);
  const [postTradeAnalytics, setPostTradeAnalytics] = useState<PostTradeAnalytics | null>(null);
  const [deletingSignal, setDeletingSignal] = useState<string | null>(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [runningBot, setRunningBot] = useState(false);
  const [runningMonitor, setRunningMonitor] = useState(false);
  const [testingTelegram, setTestingTelegram] = useState(false);
  const [expandedMessageSignal, setExpandedMessageSignal] = useState<string | null>(null);

  // Config state - use null/undefined to indicate "not loaded yet"
  const [analysisMode, setAnalysisMode] = useState<string | null>(null);
  const [minConfluence, setMinConfluence] = useState<number | null>(null);
  const [killZoneOnly, setKillZoneOnly] = useState<boolean | null>(null);
  const [enabledForex, setEnabledForex] = useState<boolean | null>(null);
  const [enabledFutures, setEnabledFutures] = useState<boolean | null>(null);
  const [enabledCrypto, setEnabledCrypto] = useState<boolean | null>(null);
  const [sendToUsersEnabled, setSendToUsersEnabled] = useState<boolean | null>(null);
  const [sendToAgentsEnabled, setSendToAgentsEnabled] = useState<boolean | null>(null);

  // Auto-run state
  const [autoRunInterval, setAutoRunInterval] = useState<number | null>(null);
  const [nextRunTime, setNextRunTime] = useState<Date | null>(null);
  const [configLoaded, setConfigLoaded] = useState(false);
  const autoRunTimerRef = useRef<NodeJS.Timeout | null>(null);
  const priceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Instrument categories with all pairs
  const FOREX_PAIRS = [
    // Majors
    'EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'USDCAD', 'AUDUSD', 'NZDUSD',
    // Crosses
    'GBPJPY', 'EURJPY', 'AUDJPY', 'CADJPY', 'CHFJPY', 'NZDJPY',
    'EURAUD', 'EURGBP', 'EURCHF', 'EURCAD', 'EURNZD',
    'GBPAUD', 'GBPCAD', 'GBPCHF', 'GBPNZD',
    'AUDCAD', 'AUDCHF', 'AUDNZD', 'CADCHF', 'NZDCAD', 'NZDCHF',
    // Commodities
    'XAUUSD', 'XAGUSD'
  ];
  
  const FUTURES_SYMBOLS = [
    'NQ',   // Nasdaq 100 E-mini
    'ES',   // S&P 500 E-mini
    'YM',   // Dow Jones E-mini
    'RTY',  // Russell 2000 E-mini
    'GC',   // Gold
    'SI',   // Silver
    'CL',   // Crude Oil
    'NG',   // Natural Gas
    'ZB',   // 30-Year T-Bond
    'ZN',   // 10-Year T-Note
  ];
  
  const CRYPTO_SYMBOLS = [
    'BTCUSD', 'ETHUSD', 'SOLUSD', 'BNBUSD', 'XRPUSD',
    'ADAUSD', 'DOGEUSD', 'AVAXUSD', 'LINKUSD', 'MATICUSD'
  ];

  // Helper function to determine instrument type
  const getInstrumentType = (symbol: string): 'forex' | 'futures' | 'crypto' => {
    if (FUTURES_SYMBOLS.includes(symbol)) return 'futures';
    if (CRYPTO_SYMBOLS.includes(symbol)) return 'crypto';
    return 'forex';
  };

  // Filter signals by instrument type
  const getFilteredSignals = useCallback(() => {
    if (activeInstrumentTab === 'all') return signals;
    return signals.filter(s => getInstrumentType(s.symbol) === activeInstrumentTab);
  }, [signals, activeInstrumentTab]);

  // Get message counts for all signals  
  const signalIds = useMemo(() => signals.map(s => s.id), [signals]);
  const messageCounts = useSignalMessages(signalIds);

  // Get signal counts by instrument type
  const getSignalCounts = useCallback(() => {
    return {
      all: signals.length,
      forex: signals.filter(s => getInstrumentType(s.symbol) === 'forex').length,
      futures: signals.filter(s => getInstrumentType(s.symbol) === 'futures').length,
      crypto: signals.filter(s => getInstrumentType(s.symbol) === 'crypto').length,
    };
  }, [signals]);

  // Get all unique pairs from signals including new instruments
  const getAllPairs = useCallback(() => {
    const pairs = new Set<string>();
    signals.forEach(s => pairs.add(s.symbol));
    // Add all pairs from all categories for live prices
    [...FOREX_PAIRS, ...FUTURES_SYMBOLS, ...CRYPTO_SYMBOLS].forEach(p => pairs.add(p));
    return Array.from(pairs);
  }, [signals]);

  // Group live prices by instrument type
  const getGroupedPrices = useCallback(() => {
    const forex: [string, PriceData][] = [];
    const futures: [string, PriceData][] = [];
    const crypto: [string, PriceData][] = [];
    
    Object.entries(livePrices).forEach(([symbol, price]) => {
      const type = getInstrumentType(symbol);
      if (type === 'forex') forex.push([symbol, price]);
      else if (type === 'futures') futures.push([symbol, price]);
      else if (type === 'crypto') crypto.push([symbol, price]);
    });
    
    return { forex, futures, crypto };
  }, [livePrices]);

  const fetchLivePrices = useCallback(async () => {
    const pairs = getAllPairs();
    if (pairs.length === 0) return;
    
    try {
      const { data, error } = await callEdgeFunction('get-live-prices', { symbols: pairs });
      
      if (!error && data?.prices) {
        setLivePrices(data.prices);
      }
    } catch (error) {
      console.error('Error fetching live prices:', error);
    }
  }, [getAllPairs]);

  // Setup price refresh timer
  useEffect(() => {
    fetchLivePrices();
    priceTimerRef.current = setInterval(fetchLivePrices, 30000);
    
    return () => {
      if (priceTimerRef.current) {
        clearInterval(priceTimerRef.current);
      }
    };
  }, [fetchLivePrices]);

  // Real-time entry detection and risk management
  useEffect(() => {
    if (signals.length === 0 || Object.keys(livePrices).length === 0) return;

    signals.forEach(signal => {
      const closedStatuses = ['won', 'lost', 'breakeven', 'expired'];
      if (signal.signal_status && closedStatuses.includes(signal.signal_status)) {
        return;
      }

      const priceData = livePrices[signal.symbol];
      if (!priceData) return;

      const currentPrice = priceData.price;
      const isBuy = signal.direction === 'BUY';
      
      // Check if entry is triggered
      const entryHit = isBuy 
        ? currentPrice <= signal.entry_price 
        : currentPrice >= signal.entry_price;

      if (signal.entry_triggered) {
        updateSignalRiskManagement(signal, currentPrice, isBuy);
        return;
      }

      if (entryHit && !signal.entry_triggered) {
        handleEntryTriggered(signal.id, currentPrice);
      }
    });
  }, [livePrices, signals]);

  const handleEntryTriggered = async (signalId: string, currentPrice: number) => {
    try {
      await supabase
        .from('institutional_signals' as any)
        .update({
          entry_triggered: true,
          entry_triggered_at: new Date().toISOString(),
          current_price: currentPrice,
          highest_price: currentPrice,
          lowest_price: currentPrice,
          signal_status: 'active',
          trade_state: 'active', // IMPORTANT: Also set trade_state for trade-management-monitor
          activated_at: new Date().toISOString(),
          original_sl: null, // Will be set by monitor or keep original
          current_sl: null, // Will be set by monitor
        })
        .eq('id', signalId);
      
      setSignals(prev => prev.map(s => 
        s.id === signalId 
          ? { ...s, entry_triggered: true, entry_triggered_at: new Date().toISOString(), signal_status: 'active' as const, trade_state: 'active', current_price: currentPrice }
          : s
      ));
      
      toast.success('Entry triggered!', { icon: '🎯' });
      fetchSignalStats();
      
      // Also create the entry_triggered message for users
      try {
        const signal = signals.find(s => s.id === signalId);
        if (signal) {
          await (supabase.from('signal_messages' as any).insert({
            signal_id: signalId,
            message_type: 'entry_triggered',
            title: '🎯 Trade Entry Triggered',
            content: `Your ${signal.direction} position on ${signal.symbol} has been activated at ${currentPrice.toFixed(5)}. 
    
📋 WHAT TO DO NOW:
• Risk 1-2% of your account on this trade
• Set your stop loss as shown in the signal
• Do NOT move your stop loss wider
• Set a price alert at 50% to TP1`,
            metadata: { symbol: signal.symbol, direction: signal.direction, entryPrice: currentPrice, phase: 'active' }
          } as any));
        }
      } catch (msgError) {
        console.error('Failed to create entry message:', msgError);
      }
    } catch (error) {
      console.error('Failed to update entry triggered:', error);
    }
  };

  const updateSignalRiskManagement = async (signal: InstitutionalSignal, currentPrice: number, isBuy: boolean) => {
    const updates: any = { current_price: currentPrice };
    
    // Track highest/lowest price
    if (isBuy) {
      if (!signal.highest_price || currentPrice > signal.highest_price) {
        updates.highest_price = currentPrice;
      }
    } else {
      if (!signal.lowest_price || currentPrice < signal.lowest_price) {
        updates.lowest_price = currentPrice;
      }
    }

    // Calculate progress to TP1
    const tpDistance = Math.abs(signal.take_profit_1 - signal.entry_price);
    const priceProgress = isBuy 
      ? (currentPrice - signal.entry_price) / tpDistance
      : (signal.entry_price - currentPrice) / tpDistance;

    // Breakeven trigger at 50% to TP
    if (priceProgress >= 0.5 && !signal.breakeven_triggered) {
      updates.breakeven_triggered = true;
      updates.trailing_stop = signal.entry_price;
      toast.info(`${signal.symbol}: Moved to breakeven!`, { icon: '🛡️' });
    }

    // Trailing stop at 75% to TP
    if (priceProgress >= 0.75 && signal.breakeven_triggered) {
      const trailDistance = tpDistance * 0.25;
      const newTrailingStop = isBuy 
        ? currentPrice - trailDistance
        : currentPrice + trailDistance;
      
      if (!signal.trailing_stop || 
          (isBuy && newTrailingStop > signal.trailing_stop) ||
          (!isBuy && newTrailingStop < signal.trailing_stop)) {
        updates.trailing_stop = newTrailingStop;
      }
    }

    // Check for TP1 hit
    const tpHit = isBuy ? currentPrice >= signal.take_profit_1 : currentPrice <= signal.take_profit_1;
    if (tpHit) {
      updates.signal_status = 'won';
      updates.outcome = 'target_1_hit';
      setSignals(prev => prev.map(s => 
        s.id === signal.id ? { ...s, signal_status: 'won' as const, outcome: 'target_1_hit' } : s
      ));
      toast.success(`${signal.symbol}: Take profit hit! 🎉`);
      fetchSignalStats();
    }

    // Check for SL hit
    const effectiveStop = signal.trailing_stop || signal.stop_loss;
    const slHit = isBuy ? currentPrice <= effectiveStop : currentPrice >= effectiveStop;
    if (slHit && signal.entry_triggered) {
      if (signal.breakeven_triggered) {
        updates.signal_status = 'breakeven';
        updates.outcome = 'breakeven';
        toast.info(`${signal.symbol}: Closed at breakeven`);
      } else {
        updates.signal_status = 'lost';
        updates.outcome = 'sl_hit';
        toast.error(`${signal.symbol}: Stop loss hit`);
      }
      setSignals(prev => prev.map(s => 
        s.id === signal.id ? { ...s, signal_status: updates.signal_status, outcome: updates.outcome } : s
      ));
      fetchSignalStats();
    }

    // Only update if there are changes beyond current_price
    if (Object.keys(updates).length > 1) {
      try {
        await supabase
          .from('institutional_signals' as any)
          .update(updates)
          .eq('id', signal.id);
      } catch (error) {
        console.error('Failed to update signal tracking:', error);
      }
    }
  };

  // Auto-run timer
  useEffect(() => {
    const interval = autoRunInterval ?? 15;
    
    if (isRunning && configLoaded) {
      if (autoRunTimerRef.current) {
        clearInterval(autoRunTimerRef.current);
      }
      
      setNextRunTime(new Date(Date.now() + interval * 60 * 1000));
      
      autoRunTimerRef.current = setInterval(() => {
        runBotNow();
        setNextRunTime(new Date(Date.now() + interval * 60 * 1000));
      }, interval * 60 * 1000);
    } else {
      if (autoRunTimerRef.current) {
        clearInterval(autoRunTimerRef.current);
        autoRunTimerRef.current = null;
      }
      setNextRunTime(null);
    }
    
    return () => {
      if (autoRunTimerRef.current) {
        clearInterval(autoRunTimerRef.current);
      }
    };
  }, [isRunning, autoRunInterval, configLoaded]);

  useEffect(() => {
    fetchSignals();
    fetchBotConfig();
    fetchSignalStats();
    fetchPostTradeAnalytics();

    const channel = supabase
      .channel('institutional-signals-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'institutional_signals'
        },
        (payload) => {
          console.log('Realtime update:', payload);
          if (payload.eventType === 'INSERT') {
            setSignals(prev => [payload.new as unknown as InstitutionalSignal, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setSignals(prev => prev.map(s => 
              s.id === (payload.new as any).id ? payload.new as unknown as InstitutionalSignal : s
            ));
          } else if (payload.eventType === 'DELETE') {
            setSignals(prev => prev.filter(s => s.id !== (payload.old as any).id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchSignals = async () => {
    try {
      const { data, error } = await supabase
        .from('institutional_signals' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setSignals((data as unknown as InstitutionalSignal[]) || []);
    } catch (error) {
      console.error('Error fetching signals:', error);
      toast.error('Failed to fetch signals');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBotConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('bot_status')
        .select('*')
        .eq('bot_type', 'institutional_signal_bot')
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        const botData = data as any;
        setBotConfig(botData as unknown as BotConfig);
        setIsRunning(botData?.is_running || false);
        setSendToUsersEnabled(botData?.send_to_users_enabled ?? false);
        setSendToAgentsEnabled(botData?.send_to_agents_enabled ?? false);
        
        const config = botData?.strategy_config as any;
        setAnalysisMode(config?.analysisMode ?? 'hybrid');
        setMinConfluence(config?.minConfluenceScore ?? 6);
        setKillZoneOnly(config?.killZoneOnly ?? true);
        setEnabledForex(config?.enabledForex ?? true);
        setEnabledFutures(config?.enabledFutures ?? true);
        setEnabledCrypto(config?.enabledCrypto ?? true);
        setAutoRunInterval(config?.autoRunInterval ?? 15);
        setConfigLoaded(true);
      } else {
        // No config exists yet - set defaults
        setAnalysisMode('hybrid');
        setMinConfluence(6);
        setKillZoneOnly(true);
        setEnabledForex(true);
        setEnabledFutures(true);
        setEnabledCrypto(true);
        setSendToUsersEnabled(false);
        setSendToAgentsEnabled(false);
        setAutoRunInterval(15);
        setConfigLoaded(true);
      }
    } catch (error) {
      console.error('Error fetching bot config:', error);
      // On error, still set defaults so UI is usable
      setAnalysisMode('hybrid');
      setMinConfluence(6);
      setKillZoneOnly(true);
      setEnabledForex(true);
      setEnabledFutures(true);
      setEnabledCrypto(true);
      setSendToUsersEnabled(false);
      setSendToAgentsEnabled(false);
      setAutoRunInterval(15);
      setConfigLoaded(true);
    }
  };

  const fetchSignalStats = async () => {
    try {
      const { data } = await supabase
        .from('institutional_signals' as any)
        .select('outcome, signal_status, trade_state');
      
      if (data) {
        const total = data.length;
        const pending = data.filter((s: any) => s.trade_state === 'pending' || (!s.trade_state && (s.outcome === 'pending' || !s.outcome))).length;
        const active = data.filter((s: any) => ['active', 'phase1', 'phase2', 'phase3'].includes(s.trade_state)).length;
        const won = data.filter((s: any) => s.outcome?.includes('target')).length;
        const lost = data.filter((s: any) => s.outcome === 'sl_hit' || s.outcome === 'stop_loss').length;
        const breakeven = data.filter((s: any) => s.outcome === 'breakeven').length;
        const expired = data.filter((s: any) => s.outcome === 'expired').length;
        const closed = won + lost + breakeven;
        const winRate = closed > 0 ? (won / closed) * 100 : 0;
        const profitFactor = lost > 0 ? won / lost : won;
        
        setSignalStats({ total, pending, active, won, lost, breakeven, expired, winRate, profitFactor });
      }
    } catch (error) {
      console.error('Error fetching signal stats:', error);
    }
  };

  const fetchPostTradeAnalytics = async () => {
    try {
      const { data } = await supabase
        .from('institutional_signals' as any)
        .select('max_adverse_excursion, max_favorable_excursion, final_r_multiple')
        .eq('trade_state', 'closed')
        .not('final_r_multiple', 'is', null);
      
      if (data && data.length > 0) {
        const closedTrades = data as any[];
        const avgMAE = closedTrades.reduce((sum, d) => sum + Math.abs(d.max_adverse_excursion || 0), 0) / closedTrades.length;
        const avgMFE = closedTrades.reduce((sum, d) => sum + (d.max_favorable_excursion || 0), 0) / closedTrades.length;
        const avgRMultiple = closedTrades.reduce((sum, d) => sum + (d.final_r_multiple || 0), 0) / closedTrades.length;
        
        // Calculate expectancy: (Win% x Avg Win) - (Loss% x Avg Loss)
        const winners = closedTrades.filter(t => (t.final_r_multiple || 0) > 0);
        const losers = closedTrades.filter(t => (t.final_r_multiple || 0) < 0);
        const winRate = winners.length / closedTrades.length;
        const avgWin = winners.length > 0 ? winners.reduce((sum, t) => sum + t.final_r_multiple, 0) / winners.length : 0;
        const avgLoss = losers.length > 0 ? Math.abs(losers.reduce((sum, t) => sum + t.final_r_multiple, 0) / losers.length) : 0;
        const expectancy = (winRate * avgWin) - ((1 - winRate) * avgLoss);
        
        setPostTradeAnalytics({
          avgMAE,
          avgMFE,
          avgRMultiple,
          expectancy,
          totalTrades: closedTrades.length
        });
      }
    } catch (error) {
      console.error('Error fetching post-trade analytics:', error);
    }
  };

  const runTradeMonitor = async () => {
    try {
      setRunningMonitor(true);
      toast.info('Running trade management monitor...');
      
      const { data, error } = await callEdgeFunction('trade-management-monitor', { action: 'monitor' });

      if (error) throw error;
      toast.success('Trade monitor cycle complete');
      fetchSignals();
      fetchSignalStats();
      fetchPostTradeAnalytics();
    } catch (error) {
      console.error('Error running monitor:', error);
      toast.error('Failed to run trade monitor');
    } finally {
      setRunningMonitor(false);
    }
  };

  const toggleBot = async () => {
    try {
      const newState = !isRunning;
      
      // Use admin API to bypass RLS for password-based admin sessions
      await callAdminApi('toggle_bot', {
        botType: 'institutional_signal_bot',
        isRunning: newState,
      });
      
      setIsRunning(newState);
      setBotConfig(prev => prev ? { ...prev, is_running: newState, started_at: newState ? new Date().toISOString() : prev.started_at } : null);
      toast.success(newState ? 'Institutional Bot started - will auto-analyze' : 'Institutional Bot stopped');
      
      // If starting, run immediately
      if (newState) {
        setTimeout(() => runBotNow(), 1000);
      }
    } catch (error) {
      console.error('Error toggling bot:', error);
      toast.error('Failed to toggle bot');
    }
  };

  const toggleAutoBroadcast = async () => {
    if (!botConfig) return;
    
    try {
      await callAdminApi('update_bot_config', {
        botType: 'institutional_signal_bot',
        updates: { auto_broadcast: !botConfig.auto_broadcast },
      });
      
      setBotConfig(prev => prev ? { ...prev, auto_broadcast: !prev.auto_broadcast } : null);
      toast.success(`Auto-broadcast ${!botConfig.auto_broadcast ? 'enabled' : 'disabled'}`);
    } catch (error) {
      toast.error('Failed to update auto-broadcast setting');
    }
  };

  const runBotNow = async () => {
    setRunningBot(true);
    try {
      toast.info('Running institutional bot...');
      
      const { data, error } = await callEdgeFunction('institutional-signal-bot', { action: 'run_bot' });

      if (error) throw error;
      
      toast.success(`Generated ${data?.signalsGenerated || 0} signals`);
      fetchSignals();
      fetchSignalStats();
      
      // Update last_signal_at
      await supabase
        .from('bot_status')
        .update({ last_signal_at: new Date().toISOString() })
        .eq('bot_type', 'institutional_signal_bot');
    } catch (error) {
      console.error('Error running bot:', error);
      toast.error('Failed to run bot');
    } finally {
      setRunningBot(false);
    }
  };

  const testTelegramAlert = async () => {
    setTestingTelegram(true);
    try {
      toast.info('Sending test Telegram alert...');
      
      const testSignal = {
        symbol: 'EURUSD',
        direction: 'BUY',
        entry_price: 1.0850,
        stop_loss: 1.0820,
        take_profit_1: 1.0900,
        take_profit_2: 1.0950,
        take_profit_3: 1.1000,
        confidence: 85,
        confluence_score: 8,
        risk_reward_ratio: 1.67,
        timeframe: '1H',
        kill_zone: 'London Open',
        htf_bias: 'Bullish',
        reasoning: 'This is a TEST signal to verify Telegram integration is working correctly. If you see this in your channel, the integration is configured properly!',
        confluence_factors: ['Order Block', 'FVG', 'HTF Bias Aligned', 'Kill Zone Active']
      };
      
      const { data, error } = await callEdgeFunction('send-agent-telegram-alert', { signal: testSignal });

      if (error) throw error;
      
      if (data?.success) {
        toast.success('✅ Test alert sent to Telegram channel!');
      } else {
        toast.error('Failed to send test alert: ' + (data?.error || 'Unknown error'));
      }
    } catch (error: any) {
      console.error('Error testing Telegram:', error);
      toast.error('Failed to send test alert: ' + (error?.message || 'Unknown error'));
    } finally {
      setTestingTelegram(false);
    }
  };

  const updateConfig = async () => {
    if (!configLoaded) {
      toast.error('Configuration not loaded yet');
      return;
    }
    
    try {
      // Build pairs array based on enabled instruments
      const enabledPairs: string[] = [];
      if (enabledForex) enabledPairs.push(...FOREX_PAIRS);
      if (enabledFutures) enabledPairs.push(...FUTURES_SYMBOLS);
      if (enabledCrypto) enabledPairs.push(...CRYPTO_SYMBOLS);
      
      const configToSave = {
        analysisMode: analysisMode ?? 'hybrid',
        minConfluenceScore: minConfluence ?? 6,
        killZoneOnly: killZoneOnly ?? true,
        killZones: ['london_open', 'ny_open'],
        enabledForex: enabledForex ?? true,
        enabledFutures: enabledFutures ?? true,
        enabledCrypto: enabledCrypto ?? true,
        autoRunInterval: autoRunInterval ?? 15
      };
      
      await callAdminApi('update_bot_config', {
        botType: 'institutional_signal_bot',
        updates: {
          pairs: enabledPairs,
          send_to_users_enabled: sendToUsersEnabled ?? false,
          send_to_agents_enabled: sendToAgentsEnabled ?? false,
          strategy_config: configToSave,
          updated_at: new Date().toISOString(),
        },
      });
      
      // Update local state
      setBotConfig(prev => prev ? {
        ...prev,
        send_to_users_enabled: sendToUsersEnabled ?? false,
        send_to_agents_enabled: sendToAgentsEnabled ?? false,
        strategy_config: configToSave
      } : null);
      
      toast.success('Configuration saved successfully');
    } catch (error) {
      console.error('Error updating config:', error);
      toast.error('Failed to update configuration');
    }
  };

  const toggleSendToUsers = async (signalId: string, currentState: boolean) => {
    try {
      // Use admin API with update_institutional_signal action for institutional_signals table
      await callAdminApi('update_institutional_signal', {
        signalId,
        updates: { 
          send_to_users: !currentState,
          agent_approved: !currentState ? true : false,
          sent_at: !currentState ? new Date().toISOString() : null
        }
      });
      
      setSignals(prev => prev.map(s => 
        s.id === signalId 
          ? { ...s, send_to_users: !currentState, agent_approved: !currentState, sent_at: !currentState ? new Date().toISOString() : null }
          : s
      ));
      
      toast.success(!currentState ? 'Signal sent to users' : 'Signal hidden from users');
    } catch (error) {
      console.error('Error toggling send to users:', error);
      toast.error('Failed to update signal');
    }
  };

  const handleDeleteSignal = async (signalId: string) => {
    setDeletingSignal(signalId);
    try {
      const { error } = await supabase
        .from('institutional_signals' as any)
        .delete()
        .eq('id', signalId);
      
      if (error) throw error;
      
      setSignals(prev => prev.filter(s => s.id !== signalId));
      toast.success('Signal deleted');
      fetchSignalStats();
    } catch (error) {
      toast.error('Failed to delete signal');
    } finally {
      setDeletingSignal(null);
    }
  };

  const handleDeleteAllSignals = async () => {
    setIsDeletingAll(true);
    try {
      const { error } = await supabase
        .from('institutional_signals' as any)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      if (error) throw error;
      
      setSignals([]);
      toast.success('All signals deleted');
      fetchSignalStats();
    } catch (error) {
      toast.error('Failed to delete signals');
    } finally {
      setIsDeletingAll(false);
    }
  };

  const updateOutcome = async (signalId: string, outcome: string) => {
    try {
      const updates: any = { outcome };
      
      // Auto-set signal_status based on outcome
      if (outcome.includes('target')) {
        updates.signal_status = 'won';
      } else if (outcome === 'sl_hit') {
        updates.signal_status = 'lost';
      } else if (outcome === 'breakeven') {
        updates.signal_status = 'breakeven';
      }

      const { error } = await supabase
        .from('institutional_signals' as any)
        .update(updates)
        .eq('id', signalId);

      if (error) throw error;
      
      setSignals(prev => prev.map(s => 
        s.id === signalId ? { ...s, ...updates } : s
      ));
      
      toast.success('Outcome updated');
      fetchSignalStats();
    } catch (error) {
      console.error('Error updating outcome:', error);
      toast.error('Failed to update outcome');
    }
  };

  const getOutcomeBadge = (signal: InstitutionalSignal) => {
    // Show status-based badge if available
    if (signal.signal_status === 'active') {
      return <Badge className="bg-blue-500/20 text-blue-400">Active</Badge>;
    }
    
    switch (signal.outcome) {
      case 'target_1_hit':
        return <Badge className="bg-success/20 text-success">TP1 Hit</Badge>;
      case 'target_2_hit':
        return <Badge className="bg-success/20 text-success">TP2 Hit</Badge>;
      case 'target_3_hit':
        return <Badge className="bg-success/20 text-success">TP3 Hit</Badge>;
      case 'sl_hit':
        return <Badge className="bg-destructive/20 text-destructive">SL Hit</Badge>;
      case 'breakeven':
        return <Badge className="bg-warning/20 text-warning">Breakeven</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const formatTimeUntilNextRun = () => {
    if (!nextRunTime) return '--';
    const diff = nextRunTime.getTime() - Date.now();
    if (diff <= 0) return 'Running...';
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const formatUptime = (startedAt?: string) => {
    if (!startedAt) return 'N/A';
    const start = new Date(startedAt);
    const now = new Date();
    const diff = now.getTime() - start.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const getLivePnL = (signal: InstitutionalSignal) => {
    const priceData = livePrices[signal.symbol];
    if (!priceData || !signal.entry_triggered) return null;
    
    const currentPrice = priceData.price;
    const isBuy = signal.direction === 'BUY';
    const pipMultiplier = signal.symbol.includes('JPY') ? 100 : 10000;
    const pips = isBuy 
      ? (currentPrice - signal.entry_price) * pipMultiplier
      : (signal.entry_price - currentPrice) * pipMultiplier;
    
    return pips;
  };

  // Calculate stats
  const stats = {
    total: signals.length,
    pending: signals.filter(s => s.outcome === 'pending' || !s.outcome).length,
    active: signals.filter(s => s.signal_status === 'active').length,
    wins: signals.filter(s => s.outcome?.includes('target')).length,
    losses: signals.filter(s => s.outcome === 'sl_hit').length,
    sentToUsers: signals.filter(s => s.send_to_users).length,
    avgConfluence: signals.length > 0 
      ? (signals.reduce((acc, s) => acc + s.confluence_score, 0) / signals.length).toFixed(1)
      : 0
  };

  return (
    <div className="space-y-6">
      {/* Win Rate Stats Banner */}
      {signalStats && (
        <Card className="bg-gradient-to-r from-primary/10 via-success/10 to-warning/10 border-primary/20">
          <CardContent className="py-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-primary/20">
                  <Trophy className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Win Rate</p>
                  <p className="text-2xl font-bold text-success">{signalStats.winRate.toFixed(1)}%</p>
                </div>
              </div>
              <div className="flex gap-6">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Won</p>
                  <p className="text-lg font-bold text-success">{signalStats.won}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Lost</p>
                  <p className="text-lg font-bold text-destructive">{signalStats.lost}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">B/E</p>
                  <p className="text-lg font-bold text-warning">{signalStats.breakeven}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Active</p>
                  <p className="text-lg font-bold text-blue-400">{signalStats.active}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Pending</p>
                  <p className="text-lg font-bold">{signalStats.pending}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-lg font-bold">{signalStats.total}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Profit Factor</p>
                  <p className="text-lg font-bold text-primary">{signalStats.profitFactor.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Auto-Run Status Banner */}
      {isRunning && (
        <Card className="bg-gradient-to-r from-success/10 to-primary/10 border-success/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="animate-pulse">
                  <Activity className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="font-medium text-sm">Bot Running Automatically</p>
                  <p className="text-xs text-muted-foreground">
                    Analyzing every {autoRunInterval} minutes • Uptime: {formatUptime(botConfig?.started_at)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Next analysis in</p>
                <p className="text-lg font-bold text-success">{formatTimeUntilNextRun()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Live Prices */}
      {Object.keys(livePrices).length > 0 && (
        <Card className="bg-card/50 border-white/[0.08]">
          <CardHeader className="pb-2 py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Live Market Prices
              <Badge variant="outline" className="text-xs ml-2">Updates every 30s</Badge>
              <span className="text-xs text-muted-foreground ml-auto">{Object.keys(livePrices).length} instruments</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {/* Forex Prices */}
            {getGroupedPrices().forex.length > 0 && (
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-3 h-3 text-green-400" />
                  <span className="text-xs font-medium text-green-400">FOREX</span>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-1.5">
                  {getGroupedPrices().forex.map(([symbol, price]) => (
                    <div key={symbol} className="p-1.5 rounded bg-background/50 border border-white/[0.05] text-center">
                      <span className="font-medium text-[10px] block truncate">{symbol}</span>
                      <p className="text-xs font-bold">{price.price?.toFixed(symbol.includes('JPY') ? 2 : 4)}</p>
                      <p className={`text-[9px] ${price.changePercent >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {price.changePercent >= 0 ? '+' : ''}{price.changePercent?.toFixed(2)}%
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Futures Prices */}
            {getGroupedPrices().futures.length > 0 && (
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <LineChart className="w-3 h-3 text-orange-400" />
                  <span className="text-xs font-medium text-orange-400">US FUTURES</span>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-1.5">
                  {getGroupedPrices().futures.map(([symbol, price]) => (
                    <div key={symbol} className="p-1.5 rounded bg-background/50 border border-white/[0.05] text-center">
                      <span className="font-medium text-[10px] block">{symbol}</span>
                      <p className="text-xs font-bold">{price.price?.toFixed(2)}</p>
                      <p className={`text-[9px] ${price.changePercent >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {price.changePercent >= 0 ? '+' : ''}{price.changePercent?.toFixed(2)}%
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Crypto Prices */}
            {getGroupedPrices().crypto.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Bitcoin className="w-3 h-3 text-yellow-400" />
                  <span className="text-xs font-medium text-yellow-400">CRYPTO</span>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-1.5">
                  {getGroupedPrices().crypto.map(([symbol, price]) => (
                    <div key={symbol} className="p-1.5 rounded bg-background/50 border border-white/[0.05] text-center">
                      <span className="font-medium text-[10px] block">{symbol.replace('USD', '')}</span>
                      <p className="text-xs font-bold">{price.price?.toFixed(price.price > 100 ? 0 : 2)}</p>
                      <p className={`text-[9px] ${price.changePercent >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {price.changePercent >= 0 ? '+' : ''}{price.changePercent?.toFixed(2)}%
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="bg-card/50 border-white/10">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Total Signals</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-white/10">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Active</p>
            <p className="text-2xl font-bold text-blue-400">{stats.active}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-white/10">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Wins</p>
            <p className="text-2xl font-bold text-success">{stats.wins}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-white/10">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Losses</p>
            <p className="text-2xl font-bold text-destructive">{stats.losses}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-white/10">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Sent to Users</p>
            <p className="text-2xl font-bold text-primary">{stats.sentToUsers}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-white/10">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Avg Confluence</p>
            <p className="text-2xl font-bold">{stats.avgConfluence}/10</p>
          </CardContent>
        </Card>
      </div>

      {/* Bot Control */}
      <Card className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20">
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-400" />
            Institutional Signal Bot
            {isRunning && (
              <Badge className="bg-success/20 text-success ml-2">● Running</Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-3 flex-wrap">
            <KillZoneBadge />
            
            {/* Auto-run interval */}
            <div className="flex items-center gap-2 bg-background/50 rounded-lg px-3 py-2">
              <Timer className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Auto-run:</span>
              <Select 
                value={(autoRunInterval ?? 15).toString()} 
                onValueChange={(v) => setAutoRunInterval(parseInt(v))}
              >
                <SelectTrigger className="w-20 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 min</SelectItem>
                  <SelectItem value="15">15 min</SelectItem>
                  <SelectItem value="30">30 min</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Auto-Broadcast Toggle */}
            <div className="flex items-center gap-2 bg-background/50 rounded-lg px-3 py-2">
              {botConfig?.auto_broadcast ? (
                <Bell className="w-4 h-4 text-success" />
              ) : (
                <BellOff className="w-4 h-4 text-muted-foreground" />
              )}
              <Label className="text-sm">Auto-Send</Label>
              <Switch
                checked={botConfig?.auto_broadcast || false}
                onCheckedChange={toggleAutoBroadcast}
              />
            </div>

            <Button
              variant={isRunning ? "destructive" : "default"}
              onClick={toggleBot}
              className="gap-2"
            >
              {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isRunning ? 'Stop Bot' : 'Start Bot'}
            </Button>
            <Button 
              variant="outline" 
              onClick={runBotNow} 
              className="gap-2"
              disabled={runningBot}
            >
              {runningBot ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Rocket className="w-4 h-4" />
              )}
              Run Now
            </Button>
            <Button 
              variant="outline" 
              onClick={runTradeMonitor} 
              className="gap-2"
              disabled={runningMonitor}
            >
              {runningMonitor ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Shield className="w-4 h-4" />
              )}
              Trade Monitor
            </Button>
            <Button 
              variant="outline" 
              onClick={testTelegramAlert} 
              className="gap-2"
              disabled={testingTelegram}
            >
              {testingTelegram ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <MessageCircle className="w-4 h-4" />
              )}
              Test Telegram
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="signals">Signals</TabsTrigger>
              <TabsTrigger value="config">Configuration</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="config" className="space-y-6">
              {!configLoaded ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Loading configuration...</span>
                </div>
              ) : (
                <>
                  {/* Signal Broadcasting Controls */}
                  <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Send className="w-4 h-4" />
                        Signal Broadcasting
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between p-4 rounded-lg bg-background/50 border border-white/10">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${sendToUsersEnabled ? 'bg-success/20' : 'bg-muted/20'}`}>
                              <Eye className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-medium">Send All Signals to Users</p>
                              <p className="text-xs text-muted-foreground">Automatically send all bot signals directly to users</p>
                            </div>
                          </div>
                          <Switch
                            checked={sendToUsersEnabled ?? false}
                            onCheckedChange={setSendToUsersEnabled}
                          />
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-lg bg-background/50 border border-white/10">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${sendToAgentsEnabled ? 'bg-primary/20' : 'bg-muted/20'}`}>
                              <Shield className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-medium">Send to Agents for Review</p>
                              <p className="text-xs text-muted-foreground">Send signals to agents who can review before sending to users</p>
                            </div>
                          </div>
                          <Switch
                            checked={sendToAgentsEnabled ?? false}
                            onCheckedChange={setSendToAgentsEnabled}
                          />
                        </div>
                      </div>
                      {sendToUsersEnabled && sendToAgentsEnabled && (
                        <p className="text-xs text-warning mt-3 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Both options enabled: Signals go to users AND agents for review
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Daily Social Posting */}
                  <DailySocialPostingCard />

                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Analysis Mode</label>
                      <Select value={analysisMode ?? 'hybrid'} onValueChange={setAnalysisMode}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="price_action">Price Action Only (HTF)</SelectItem>
                          <SelectItem value="smc">SMC/IPDA Only (LTF)</SelectItem>
                          <SelectItem value="hybrid">Hybrid (Recommended)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Min Confluence Score: {minConfluence ?? 6}/10
                      </label>
                      <Slider
                        value={[minConfluence ?? 6]}
                        onValueChange={([v]) => setMinConfluence(v)}
                        min={1}
                        max={10}
                        step={1}
                        className="py-4"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Kill Zone Only</label>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={killZoneOnly ?? true}
                          onCheckedChange={setKillZoneOnly}
                        />
                        <span className="text-sm text-muted-foreground">
                          {killZoneOnly ? 'Only trade during kill zones' : 'Trade anytime'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Instrument Categories */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium">Enabled Instruments</label>
                    <div className="grid md:grid-cols-3 gap-4">
                      <Card className={`p-4 cursor-pointer transition-all ${enabledForex ? 'border-green-500/50 bg-green-500/10' : 'border-white/10'}`} onClick={() => setEnabledForex(!enabledForex)}>
                        <div className="flex items-center gap-3">
                          <Switch checked={enabledForex ?? true} onCheckedChange={setEnabledForex} />
                          <DollarSign className="w-5 h-5 text-green-400" />
                          <div>
                            <p className="font-medium">Forex</p>
                            <p className="text-xs text-muted-foreground">{FOREX_PAIRS.length} pairs</p>
                          </div>
                        </div>
                      </Card>
                      <Card className={`p-4 cursor-pointer transition-all ${enabledFutures ? 'border-orange-500/50 bg-orange-500/10' : 'border-white/10'}`} onClick={() => setEnabledFutures(!enabledFutures)}>
                        <div className="flex items-center gap-3">
                          <Switch checked={enabledFutures ?? true} onCheckedChange={setEnabledFutures} />
                          <LineChart className="w-5 h-5 text-orange-400" />
                          <div>
                            <p className="font-medium">US Futures</p>
                            <p className="text-xs text-muted-foreground">{FUTURES_SYMBOLS.length} contracts</p>
                          </div>
                        </div>
                      </Card>
                      <Card className={`p-4 cursor-pointer transition-all ${enabledCrypto ? 'border-yellow-500/50 bg-yellow-500/10' : 'border-white/10'}`} onClick={() => setEnabledCrypto(!enabledCrypto)}>
                        <div className="flex items-center gap-3">
                          <Switch checked={enabledCrypto ?? true} onCheckedChange={setEnabledCrypto} />
                          <Bitcoin className="w-5 h-5 text-yellow-400" />
                          <div>
                            <p className="font-medium">Crypto</p>
                            <p className="text-xs text-muted-foreground">{CRYPTO_SYMBOLS.length} pairs</p>
                          </div>
                        </div>
                      </Card>
                    </div>
                  </div>

                  <Button onClick={updateConfig} className="gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Save Configuration
                  </Button>
                </>
              )}
            </TabsContent>

            <TabsContent value="signals" className="space-y-4">
              {/* Instrument Category Tabs */}
              <div className="flex flex-wrap items-center gap-2 p-1 bg-background/50 rounded-lg border border-white/[0.08]">
                <Button
                  variant={activeInstrumentTab === 'all' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveInstrumentTab('all')}
                  className="gap-2"
                >
                  <BarChart3 className="w-4 h-4" />
                  All ({getSignalCounts().all})
                </Button>
                <Button
                  variant={activeInstrumentTab === 'forex' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveInstrumentTab('forex')}
                  className="gap-2"
                >
                  <DollarSign className="w-4 h-4" />
                  Forex ({getSignalCounts().forex})
                </Button>
                <Button
                  variant={activeInstrumentTab === 'futures' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveInstrumentTab('futures')}
                  className="gap-2"
                >
                  <LineChart className="w-4 h-4" />
                  US Futures ({getSignalCounts().futures})
                </Button>
                <Button
                  variant={activeInstrumentTab === 'crypto' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveInstrumentTab('crypto')}
                  className="gap-2"
                >
                  <Bitcoin className="w-4 h-4" />
                  Crypto ({getSignalCounts().crypto})
                </Button>
              </div>

              <div className="flex justify-between items-center">
                <h3 className="font-medium">
                  {activeInstrumentTab === 'all' ? 'All Signals' : 
                   activeInstrumentTab === 'forex' ? 'Forex Signals' :
                   activeInstrumentTab === 'futures' ? 'US Futures Signals' : 'Crypto Signals'}
                </h3>
                <div className="flex gap-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" className="gap-2" disabled={signals.length === 0}>
                        <Trash2 className="w-4 h-4" />
                        Delete All
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete All Signals?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete all {signals.length} signals. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteAllSignals} disabled={isDeletingAll}>
                          {isDeletingAll ? 'Deleting...' : 'Delete All'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <Button variant="outline" size="sm" onClick={fetchSignals} className="gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                  </Button>
                </div>
              </div>

              {isLoading ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                </div>
              ) : getFilteredSignals().length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {activeInstrumentTab === 'all' 
                    ? 'No signals generated yet. Run the bot to generate signals.'
                    : `No ${activeInstrumentTab} signals yet. Configure the bot to analyze these instruments.`}
                </div>
              ) : (
                <div className="space-y-3">
                  {getFilteredSignals().map((signal) => {
                    const livePnL = getLivePnL(signal);
                    const isActive = signal.signal_status === 'active' || signal.entry_triggered;
                    
                    return (
                      <motion.div
                        key={signal.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <Card className={`bg-card/50 border-white/10 ${
                          signal.signal_status === 'won' ? 'border-success/30' :
                          signal.signal_status === 'lost' ? 'border-destructive/30' :
                          isActive ? 'border-blue-500/30 ring-1 ring-blue-500/20' : ''
                        }`}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-4 flex-wrap">
                                <div className="flex items-center gap-2">
                                  {signal.direction === 'BUY' ? (
                                    <TrendingUp className="w-5 h-5 text-success" />
                                  ) : (
                                    <TrendingDown className="w-5 h-5 text-destructive" />
                                  )}
                                  <span className="font-bold">{signal.symbol}</span>
                                  <Badge variant={signal.direction === 'BUY' ? 'default' : 'destructive'}>
                                    {signal.direction}
                                  </Badge>
                                  {/* Date/Time Badge */}
                                  <Badge variant="outline" className="text-xs text-muted-foreground">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {new Date(signal.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} {new Date(signal.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                  </Badge>
                                  {/* Instrument Type Badge */}
                                  <Badge 
                                    variant="outline" 
                                    className={
                                      getInstrumentType(signal.symbol) === 'forex' 
                                        ? 'border-green-500/30 text-green-400' 
                                        : getInstrumentType(signal.symbol) === 'futures'
                                        ? 'border-orange-500/30 text-orange-400'
                                        : 'border-yellow-500/30 text-yellow-400'
                                    }
                                  >
                                    {getInstrumentType(signal.symbol) === 'forex' && <DollarSign className="w-3 h-3 mr-1" />}
                                    {getInstrumentType(signal.symbol) === 'futures' && <LineChart className="w-3 h-3 mr-1" />}
                                    {getInstrumentType(signal.symbol) === 'crypto' && <Bitcoin className="w-3 h-3 mr-1" />}
                                    {getInstrumentType(signal.symbol).toUpperCase()}
                                  </Badge>
                                  {/* Timeframe Badge */}
                                  {(signal.timeframe || signal.ltf_timeframe) && (
                                    <Badge variant="outline" className="border-blue-500/30 text-blue-400">
                                      <Clock className="w-3 h-3 mr-1" />
                                      {signal.htf_timeframe && `${signal.htf_timeframe}/`}{signal.timeframe || signal.ltf_timeframe}
                                    </Badge>
                                  )}
                                </div>
                                <ConfluenceScoreDisplay score={signal.confluence_score} />
                                
                                {/* Trade State / Phase Badge */}
                                {signal.trade_state === 'phase1' && (
                                  <Badge className="bg-blue-500/20 text-blue-400">
                                    <Shield className="w-3 h-3 mr-1" />
                                    Risk-Free (BE)
                                  </Badge>
                                )}
                                {signal.trade_state === 'phase2' && (
                                  <Badge className="bg-green-500/20 text-green-400">
                                    <Target className="w-3 h-3 mr-1" />
                                    TP1 Closed {signal.tp1_pnl && `(+${signal.tp1_pnl.toFixed(2)}R)`}
                                  </Badge>
                                )}
                                {signal.trade_state === 'phase3' && (
                                  <Badge className="bg-purple-500/20 text-purple-400">
                                    <Zap className="w-3 h-3 mr-1" />
                                    Runner Active
                                  </Badge>
                                )}
                                {signal.trade_state === 'active' && (
                                  <Badge className="bg-yellow-500/20 text-yellow-400">
                                    <Activity className="w-3 h-3 mr-1" />
                                    Phase 0 (Initial Risk)
                                  </Badge>
                                )}
                                {(!signal.trade_state || signal.trade_state === 'pending') && !signal.entry_triggered && (
                                  <Badge variant="outline">Pending Entry</Badge>
                                )}
                                
                                {/* Partial Closes */}
                                {signal.tp1_closed && !signal.tp2_closed && (
                                  <Badge className="bg-success/20 text-success text-xs">
                                    TP1: +{(signal.tp1_pnl || 0.33).toFixed(2)}R
                                  </Badge>
                                )}
                                {signal.tp2_closed && (
                                  <Badge className="bg-success/20 text-success text-xs">
                                    TP2: +{(signal.tp2_pnl || 0.66).toFixed(2)}R
                                  </Badge>
                                )}
                                
                                {/* News/Volatility Warnings */}
                                {signal.news_within_30min && (
                                  <Badge className="bg-warning/20 text-warning text-xs">
                                    <AlertTriangle className="w-3 h-3 mr-1" />
                                    News
                                  </Badge>
                                )}
                                
                                {/* Live P&L */}
                                {livePnL !== null && (
                                  <Badge className={livePnL >= 0 ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}>
                                    {livePnL >= 0 ? '+' : ''}{livePnL.toFixed(1)} pips
                                  </Badge>
                                )}
                                
                                {/* Live Price */}
                                {livePrices[signal.symbol] && (
                                  <span className="text-sm text-muted-foreground">
                                    @ {livePrices[signal.symbol].price.toFixed(signal.symbol.includes('JPY') ? 3 : 5)}
                                  </span>
                                )}

                                {signal.risk_reward_ratio && (
                                  <Badge variant="outline" className="bg-green-500/10 text-green-400">
                                    RR: 1:{signal.risk_reward_ratio?.toFixed(1)}
                                  </Badge>
                                )}
                                {signal.kill_zone && (
                                  <Badge variant="outline" className="bg-purple-500/10 text-purple-400">
                                    {signal.kill_zone.replace('_', ' ')}
                                  </Badge>
                                )}
                              </div>

                              <div className="flex items-center gap-3">
                                {getOutcomeBadge(signal)}
                                
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-muted-foreground">Send:</span>
                                  <Switch
                                    checked={signal.send_to_users}
                                    onCheckedChange={() => toggleSendToUsers(signal.id, signal.send_to_users)}
                                  />
                                </div>

                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="sm" disabled={deletingSignal === signal.id}>
                                      <Trash2 className="w-4 h-4 text-destructive" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Signal?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This will permanently delete this {signal.symbol} signal.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDeleteSignal(signal.id)}>
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setExpandedSignal(expandedSignal === signal.id ? null : signal.id)}
                                >
                                  {expandedSignal === signal.id ? (
                                    <ChevronUp className="w-4 h-4" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4" />
                                  )}
                                </Button>
                              </div>
                            </div>

                            {/* Price Levels */}
                            <div className="grid grid-cols-6 gap-4 mt-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">Entry</p>
                                <p className="font-mono">{signal.entry_price?.toFixed(5)}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Stop Loss</p>
                                <p className={`font-mono ${signal.trailing_stop ? 'line-through text-muted-foreground' : 'text-destructive'}`}>
                                  {signal.stop_loss?.toFixed(5)}
                                </p>
                                {signal.trailing_stop && (
                                  <p className="font-mono text-warning">→ {signal.trailing_stop.toFixed(5)}</p>
                                )}
                              </div>
                              <div>
                                <p className="text-muted-foreground">TP1</p>
                                <p className="font-mono text-success">{signal.take_profit_1?.toFixed(5)}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">TP2</p>
                                <p className="font-mono text-success">{signal.take_profit_2?.toFixed(5) || '-'}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">TP3</p>
                                <p className="font-mono text-success">{signal.take_profit_3?.toFixed(5) || '-'}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">R:R</p>
                                <p className="font-mono text-primary font-bold">1:{signal.risk_reward_ratio?.toFixed(1) || 'N/A'}</p>
                              </div>
                            </div>

                            {/* Signal Message Chat */}
                            <div className="mt-4">
                              <SignalMessageChat
                                signalId={signal.id}
                                isExpanded={expandedMessageSignal === signal.id}
                                onToggle={() => setExpandedMessageSignal(
                                  expandedMessageSignal === signal.id ? null : signal.id
                                )}
                              />
                            </div>

                            {/* Expanded Details */}
                            {expandedSignal === signal.id && (
                              <div className="mt-4 pt-4 border-t border-white/10 space-y-4">
                                {/* Confluence Factors */}
                                <div>
                                  <h4 className="font-medium mb-2 flex items-center gap-2">
                                    <Target className="w-4 h-4" />
                                    Confluence Factors ({signal.confluence_score}/10)
                                  </h4>
                                  <div className="flex flex-wrap gap-2">
                                    {signal.confluence_factors?.map((factor, i) => (
                                      <Badge key={i} variant="outline" className="bg-success/10 text-success">
                                        <CheckCircle2 className="w-3 h-3 mr-1" />
                                        {factor.replace(/_/g, ' ')}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>

                                {/* Reasoning */}
                                <div>
                                  <h4 className="font-medium mb-2">Analysis Reasoning</h4>
                                  <p className="text-sm text-muted-foreground bg-black/20 p-3 rounded-lg">
                                    {signal.reasoning}
                                  </p>
                                </div>

                                {/* HTF/LTF Analysis */}
                                <div className="grid md:grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="font-medium mb-2">HTF Bias</h4>
                                    <Badge className={signal.htf_bias === 'bullish' ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}>
                                      {signal.htf_bias?.toUpperCase()}
                                    </Badge>
                                  </div>
                                  <div>
                                    <h4 className="font-medium mb-2">LTF Entry</h4>
                                    <Badge className={signal.ltf_entry === 'buy' ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}>
                                      {signal.ltf_entry?.toUpperCase()}
                                    </Badge>
                                  </div>
                                </div>

                                {/* Outcome Update */}
                                <div>
                                  <h4 className="font-medium mb-2">Update Outcome</h4>
                                  <Select value={signal.outcome || 'pending'} onValueChange={(v) => updateOutcome(signal.id, v)}>
                                    <SelectTrigger className="w-48">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="pending">Pending</SelectItem>
                                      <SelectItem value="target_1_hit">TP1 Hit</SelectItem>
                                      <SelectItem value="target_2_hit">TP2 Hit</SelectItem>
                                      <SelectItem value="target_3_hit">TP3 Hit</SelectItem>
                                      <SelectItem value="sl_hit">SL Hit</SelectItem>
                                      <SelectItem value="breakeven">Breakeven</SelectItem>
                                      <SelectItem value="manual_close">Manual Close</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <p className="text-xs text-muted-foreground">
                                  Created: {new Date(signal.created_at).toLocaleString()}
                                  {signal.entry_triggered_at && ` • Entry: ${new Date(signal.entry_triggered_at).toLocaleString()}`}
                                  {signal.sent_at && ` • Sent: ${new Date(signal.sent_at).toLocaleString()}`}
                                </p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              {/* Post-Trade Analytics Banner */}
              {postTradeAnalytics && postTradeAnalytics.totalTrades > 0 && (
                <Card className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-primary/10 border-blue-500/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-blue-400" />
                      Post-Trade Analytics ({postTradeAnalytics.totalTrades} closed trades)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-3 rounded-lg bg-background/50 text-center">
                        <p className="text-xs text-muted-foreground mb-1">Avg MAE</p>
                        <p className="text-xl font-bold text-destructive">
                          {postTradeAnalytics.avgMAE.toFixed(2)}R
                        </p>
                        <p className="text-xs text-muted-foreground">Max Adverse Excursion</p>
                      </div>
                      <div className="p-3 rounded-lg bg-background/50 text-center">
                        <p className="text-xs text-muted-foreground mb-1">Avg MFE</p>
                        <p className="text-xl font-bold text-success">
                          +{postTradeAnalytics.avgMFE.toFixed(2)}R
                        </p>
                        <p className="text-xs text-muted-foreground">Max Favorable Excursion</p>
                      </div>
                      <div className="p-3 rounded-lg bg-background/50 text-center">
                        <p className="text-xs text-muted-foreground mb-1">Avg R-Multiple</p>
                        <p className={`text-xl font-bold ${postTradeAnalytics.avgRMultiple >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {postTradeAnalytics.avgRMultiple >= 0 ? '+' : ''}{postTradeAnalytics.avgRMultiple.toFixed(2)}R
                        </p>
                        <p className="text-xs text-muted-foreground">Average per Trade</p>
                      </div>
                      <div className="p-3 rounded-lg bg-background/50 text-center">
                        <p className="text-xs text-muted-foreground mb-1">Expectancy</p>
                        <p className={`text-xl font-bold ${postTradeAnalytics.expectancy >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {postTradeAnalytics.expectancy >= 0 ? '+' : ''}{postTradeAnalytics.expectancy.toFixed(2)}R
                        </p>
                        <p className="text-xs text-muted-foreground">Expected Per Trade</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid md:grid-cols-2 gap-6">
                <Card className="bg-card/50 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-lg">Win Rate by Confluence</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[6, 7, 8, 9, 10].map(score => {
                      const signalsAtScore = signals.filter(s => s.confluence_score === score);
                      const wins = signalsAtScore.filter(s => s.outcome?.includes('target')).length;
                      const total = signalsAtScore.filter(s => s.outcome && s.outcome !== 'pending').length;
                      const winRate = total > 0 ? (wins / total) * 100 : 0;
                      
                      return (
                        <div key={score} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>Score {score}/10</span>
                            <span>{winRate.toFixed(0)}% ({wins}/{total})</span>
                          </div>
                          <Progress value={winRate} className="h-2" />
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                <Card className="bg-card/50 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-lg">Kill Zone Performance</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {['london_open', 'ny_open', 'london_close', 'asian', 'off_hours'].map(kz => {
                      const kzSignals = signals.filter(s => s.kill_zone === kz);
                      const wins = kzSignals.filter(s => s.outcome?.includes('target')).length;
                      const total = kzSignals.filter(s => s.outcome && s.outcome !== 'pending').length;
                      const winRate = total > 0 ? (wins / total) * 100 : 0;
                      
                      return (
                        <div key={kz} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="capitalize">{kz.replace('_', ' ')}</span>
                            <span>{winRate.toFixed(0)}% ({wins}/{total})</span>
                          </div>
                          <Progress value={winRate} className="h-2" />
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </div>

              {/* Trade State Distribution */}
              <Card className="bg-card/50 border-white/10">
                <CardHeader>
                  <CardTitle className="text-lg">Active Trade Phases</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {['pending', 'active', 'phase1', 'phase2', 'phase3'].map(state => {
                      const count = signals.filter(s => s.trade_state === state).length;
                      const labels: Record<string, string> = {
                        'pending': 'Pending Entry',
                        'active': 'Phase 0 (Initial)',
                        'phase1': 'Phase 1 (BE)',
                        'phase2': 'Phase 2 (Locked)',
                        'phase3': 'Phase 3 (Runner)'
                      };
                      const colors: Record<string, string> = {
                        'pending': 'bg-muted text-muted-foreground',
                        'active': 'bg-yellow-500/20 text-yellow-400',
                        'phase1': 'bg-blue-500/20 text-blue-400',
                        'phase2': 'bg-green-500/20 text-green-400',
                        'phase3': 'bg-purple-500/20 text-purple-400'
                      };
                      
                      return (
                        <div key={state} className={`p-3 rounded-lg ${colors[state]} text-center`}>
                          <p className="text-2xl font-bold">{count}</p>
                          <p className="text-xs">{labels[state]}</p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default InstitutionalBotTab;
