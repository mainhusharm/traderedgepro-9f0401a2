import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useActivityTracking } from '@/hooks/useActivityTracking';

interface Signal {
  id: string;
  symbol: string;
  signalType: 'BUY' | 'SELL';
  entryPrice: number;
  stopLoss: number | null;
  takeProfit: number | null;
  confidenceScore: number;
  aiReasoning: string | null;
  milestone: string;
  outcome: 'pending' | 'target_hit' | 'stop_loss_hit' | 'cancelled';
  isPublic: boolean;
  createdAt: string;
  tradeType?: string;
  timeframe?: string;
  killZone?: string;
  confluenceScore?: number;
}

interface UseRealTimeSignalsReturn {
  signals: Signal[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useRealTimeSignals = (limit: number = 50): UseRealTimeSignalsReturn => {
  const { user } = useAuth();
  const [signals, setSignals] = useState<Signal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { logSignalReceived } = useActivityTracking();
  const loggedSignals = useRef<Set<string>>(new Set());

  const fetchSignals = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch from institutional_signals - only those sent to users
      const { data, error: fetchError } = await supabase
        .from('institutional_signals' as any)
        .select('*')
        .eq('send_to_users', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (fetchError) throw fetchError;

      const formattedSignals: Signal[] = ((data as any[]) || []).map(s => ({
        id: s.id,
        symbol: s.symbol,
        signalType: s.direction as 'BUY' | 'SELL',
        entryPrice: s.entry_price,
        stopLoss: s.stop_loss,
        takeProfit: s.take_profit_1,
        confidenceScore: s.confidence || 75,
        aiReasoning: s.reasoning,
        milestone: s.timeframe === '15m' ? 'M1' : s.timeframe === '1H' ? 'M2' : 'M3',
        outcome: s.outcome as Signal['outcome'],
        isPublic: s.send_to_users || false,
        createdAt: s.created_at,
        tradeType: s.analysis_mode === 'scalp' ? 'scalp' : s.analysis_mode === 'swing' ? 'swing' : 'intraday',
        timeframe: s.timeframe,
        killZone: s.kill_zone,
        confluenceScore: s.confluence_score,
      }));

      setSignals(formattedSignals);
    } catch (err: any) {
      console.error('Error fetching signals:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchSignals();

    // Subscribe to real-time updates on institutional_signals
    const channel: RealtimeChannel = supabase
      .channel('institutional-signals-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'institutional_signals',
        },
        (payload) => {
          console.log('Institutional signal update received:', payload);
          
          if (payload.eventType === 'INSERT') {
            const newSignal = payload.new as any;
            // Only add if sent to users
            if (!newSignal.send_to_users) return;
            
            const formattedSignal: Signal = {
              id: newSignal.id,
              symbol: newSignal.symbol,
              signalType: newSignal.direction,
              entryPrice: newSignal.entry_price,
              stopLoss: newSignal.stop_loss,
              takeProfit: newSignal.take_profit_1,
              confidenceScore: newSignal.confidence || 75,
              aiReasoning: newSignal.reasoning,
              milestone: newSignal.timeframe === '15m' ? 'M1' : newSignal.timeframe === '1H' ? 'M2' : 'M3',
              outcome: newSignal.outcome,
              isPublic: newSignal.send_to_users || false,
              createdAt: newSignal.created_at,
              tradeType: newSignal.analysis_mode,
              timeframe: newSignal.timeframe,
              killZone: newSignal.kill_zone,
              confluenceScore: newSignal.confluence_score,
            };
            
            // Log signal received for activity tracking
            if (user && !loggedSignals.current.has(formattedSignal.id)) {
              loggedSignals.current.add(formattedSignal.id);
              logSignalReceived({
                signalId: formattedSignal.id,
                symbol: formattedSignal.symbol,
                signalType: formattedSignal.signalType
              });
            }
            
            setSignals(prev => [formattedSignal, ...prev.slice(0, limit - 1)]);
          } else if (payload.eventType === 'UPDATE') {
            const updatedSignal = payload.new as any;
            // If no longer sent to users, remove it
            if (!updatedSignal.send_to_users) {
              setSignals(prev => prev.filter(s => s.id !== updatedSignal.id));
              return;
            }
            // Otherwise update it
            setSignals(prev => prev.map(s => 
              s.id === updatedSignal.id 
                ? {
                    ...s,
                    outcome: updatedSignal.outcome,
                    stopLoss: updatedSignal.stop_loss,
                    takeProfit: updatedSignal.take_profit_1,
                  }
                : s
            ));
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as any).id;
            setSignals(prev => prev.filter(s => s.id !== deletedId));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchSignals, limit, user, logSignalReceived]);

  return {
    signals,
    isLoading,
    error,
    refetch: fetchSignals,
  };
};
