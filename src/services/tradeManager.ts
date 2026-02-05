// Trade Management Service
// Handles trade tracking, journaling, and performance calculations

import { supabase } from '@/integrations/supabase/client';

export interface Trade {
  id: string;
  signalId?: string;
  userId: string;
  symbol: string;
  direction: 'BUY' | 'SELL';
  entryPrice: number;
  exitPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  lotSize: number;
  pnl?: number;
  status: 'open' | 'closed' | 'cancelled';
  outcome?: 'win' | 'loss' | 'breakeven';
  notes?: string;
  tags?: string[];
  createdAt: string;
  closedAt?: string;
}

export interface PerformanceMetrics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalPnl: number;
  averageWin: number;
  averageLoss: number;
  profitFactor: number;
  maxDrawdown: number;
  currentDrawdown: number;
  bestTrade: number;
  worstTrade: number;
  consecutiveWins: number;
  consecutiveLosses: number;
}

export const calculatePerformanceMetrics = (trades: Trade[]): PerformanceMetrics => {
  const closedTrades = trades.filter(t => t.status === 'closed' && t.pnl !== undefined);
  
  const winningTrades = closedTrades.filter(t => (t.pnl || 0) > 0);
  const losingTrades = closedTrades.filter(t => (t.pnl || 0) < 0);

  const totalPnl = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const grossProfit = winningTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + (t.pnl || 0), 0));

  const winRate = closedTrades.length > 0 
    ? (winningTrades.length / closedTrades.length) * 100 
    : 0;

  const averageWin = winningTrades.length > 0 
    ? grossProfit / winningTrades.length 
    : 0;

  const averageLoss = losingTrades.length > 0 
    ? grossLoss / losingTrades.length 
    : 0;

  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 999 : 0;

  // Calculate drawdown
  let peak = 0;
  let maxDrawdown = 0;
  let runningPnl = 0;

  closedTrades.forEach(trade => {
    runningPnl += trade.pnl || 0;
    if (runningPnl > peak) {
      peak = runningPnl;
    }
    const drawdown = peak - runningPnl;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  });

  const currentDrawdown = peak - runningPnl;

  // Find best and worst trades
  const pnls = closedTrades.map(t => t.pnl || 0);
  const bestTrade = pnls.length > 0 ? Math.max(...pnls) : 0;
  const worstTrade = pnls.length > 0 ? Math.min(...pnls) : 0;

  // Calculate consecutive wins/losses
  let consecutiveWins = 0;
  let consecutiveLosses = 0;
  let currentStreak = 0;
  let currentStreakType: 'win' | 'loss' | null = null;

  closedTrades.forEach(trade => {
    const isWin = (trade.pnl || 0) > 0;
    
    if (isWin) {
      if (currentStreakType === 'win') {
        currentStreak++;
      } else {
        currentStreak = 1;
        currentStreakType = 'win';
      }
      consecutiveWins = Math.max(consecutiveWins, currentStreak);
    } else {
      if (currentStreakType === 'loss') {
        currentStreak++;
      } else {
        currentStreak = 1;
        currentStreakType = 'loss';
      }
      consecutiveLosses = Math.max(consecutiveLosses, currentStreak);
    }
  });

  return {
    totalTrades: closedTrades.length,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    winRate,
    totalPnl,
    averageWin,
    averageLoss,
    profitFactor,
    maxDrawdown,
    currentDrawdown,
    bestTrade,
    worstTrade,
    consecutiveWins,
    consecutiveLosses,
  };
};

export const updateDashboardMetrics = async (
  userId: string,
  metrics: Partial<PerformanceMetrics>
): Promise<void> => {
  const { error } = await supabase
    .from('dashboard_data')
    .upsert({
      user_id: userId,
      total_pnl: metrics.totalPnl,
      win_rate: metrics.winRate,
      total_trades: metrics.totalTrades,
      winning_trades: metrics.winningTrades,
      losing_trades: metrics.losingTrades,
      average_win: metrics.averageWin,
      average_loss: metrics.averageLoss,
      profit_factor: metrics.profitFactor,
      max_drawdown: metrics.maxDrawdown,
      current_drawdown: metrics.currentDrawdown,
      last_active: new Date().toISOString(),
    }, { onConflict: 'user_id' });

  if (error) {
    console.error('Error updating dashboard metrics:', error);
    throw error;
  }
};

export const getTradesByDateRange = async (
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<Trade[]> => {
  // This would fetch from a trades table if we had one
  // For now, we'll return an empty array as placeholder
  return [];
};

export const getDailyPnL = (trades: Trade[], date: Date): number => {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  return trades
    .filter(t => {
      const tradeDate = new Date(t.closedAt || t.createdAt);
      return tradeDate >= dayStart && tradeDate <= dayEnd;
    })
    .reduce((sum, t) => sum + (t.pnl || 0), 0);
};

export const getWeeklyPnL = (trades: Trade[]): number[] => {
  const weeklyPnl: number[] = [];
  const now = new Date();

  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    weeklyPnl.push(getDailyPnL(trades, date));
  }

  return weeklyPnl;
};
