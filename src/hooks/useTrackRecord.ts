import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TrackRecordStats {
  totalSignals: number;
  winningSignals: number;
  losingSignals: number;
  pendingSignals: number;
  winRate: number;
  totalPnl: number;
  avgPnlPerTrade: number;
  startDate: string | null;
}

export interface MonthlyPerformance {
  month: string;
  year: number;
  totalSignals: number;
  wins: number;
  losses: number;
  winRate: number;
  pnl: number;
}

export interface SignalRecord {
  id: string;
  symbol: string;
  signal_type: string;
  entry_price: number;
  stop_loss: number;
  take_profit: number;
  outcome: string | null;
  pnl: number | null;
  created_at: string;
  confidence_score: number | null;
}

export const useTrackRecord = () => {
  const [stats, setStats] = useState<TrackRecordStats>({
    totalSignals: 0,
    winningSignals: 0,
    losingSignals: 0,
    pendingSignals: 0,
    winRate: 0,
    totalPnl: 0,
    avgPnlPerTrade: 0,
    startDate: null,
  });
  const [monthlyPerformance, setMonthlyPerformance] = useState<MonthlyPerformance[]>([]);
  const [recentSignals, setRecentSignals] = useState<SignalRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrackRecord = async () => {
      try {
        setIsLoading(true);

        // Fetch all signals for public track record
        const { data: signals, error: signalsError } = await supabase
          .from('signals')
          .select('*')
          .order('created_at', { ascending: false });

        if (signalsError) throw signalsError;

        if (!signals || signals.length === 0) {
          setStats({
            totalSignals: 0,
            winningSignals: 0,
            losingSignals: 0,
            pendingSignals: 0,
            winRate: 0,
            totalPnl: 0,
            avgPnlPerTrade: 0,
            startDate: null,
          });
          setMonthlyPerformance([]);
          setRecentSignals([]);
          return;
        }

        // Calculate overall stats
        const totalSignals = signals.length;
        const winningSignals = signals.filter(s => s.outcome === 'target_hit').length;
        const losingSignals = signals.filter(s => s.outcome === 'stop_loss_hit').length;
        const pendingSignals = signals.filter(s => !s.outcome || s.outcome === 'pending').length;
        const closedSignals = winningSignals + losingSignals;
        const winRate = closedSignals > 0 ? (winningSignals / closedSignals) * 100 : 0;
        
        // Calculate PnL (assuming pnl column exists, otherwise estimate)
        const totalPnl = signals.reduce((acc, s) => acc + (s.pnl || 0), 0);
        const avgPnlPerTrade = closedSignals > 0 ? totalPnl / closedSignals : 0;

        // Get the oldest signal date
        const oldestSignal = signals[signals.length - 1];
        const startDate = oldestSignal?.created_at || null;

        setStats({
          totalSignals,
          winningSignals,
          losingSignals,
          pendingSignals,
          winRate,
          totalPnl,
          avgPnlPerTrade,
          startDate,
        });

        // Calculate monthly performance
        const monthlyData: { [key: string]: MonthlyPerformance } = {};
        
        signals.forEach(signal => {
          const date = new Date(signal.created_at);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          const monthName = date.toLocaleDateString('en-US', { month: 'short' });
          
          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = {
              month: monthName,
              year: date.getFullYear(),
              totalSignals: 0,
              wins: 0,
              losses: 0,
              winRate: 0,
              pnl: 0,
            };
          }
          
          monthlyData[monthKey].totalSignals++;
          if (signal.outcome === 'target_hit') monthlyData[monthKey].wins++;
          if (signal.outcome === 'stop_loss_hit') monthlyData[monthKey].losses++;
          monthlyData[monthKey].pnl += signal.pnl || 0;
        });

        // Calculate win rates for each month
        Object.values(monthlyData).forEach(month => {
          const closed = month.wins + month.losses;
          month.winRate = closed > 0 ? (month.wins / closed) * 100 : 0;
        });

        setMonthlyPerformance(
          Object.entries(monthlyData)
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([, data]) => data)
        );

        // Set recent signals
        setRecentSignals(signals.slice(0, 20) as SignalRecord[]);

      } catch (err) {
        console.error('Error fetching track record:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch track record');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrackRecord();
  }, []);

  return { stats, monthlyPerformance, recentSignals, isLoading, error };
};
