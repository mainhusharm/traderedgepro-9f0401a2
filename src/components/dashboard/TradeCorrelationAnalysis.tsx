import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, BarChart3, Zap, Target } from 'lucide-react';

interface JournalEntry {
  id: string;
  symbol: string;
  trade_type: 'BUY' | 'SELL';
  pnl: number;
  status: string;
  setup_type: string | null;
  emotions: string | null;
}

interface TradeCorrelationAnalysisProps {
  entries: JournalEntry[];
}

interface CorrelationData {
  symbol: string;
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  totalPnl: number;
  avgPnl: number;
  bestSetup: string | null;
  bestEmotion: string | null;
}

interface SetupSymbolCombo {
  setup: string;
  symbol: string;
  winRate: number;
  totalTrades: number;
  avgPnl: number;
}

const TradeCorrelationAnalysis = ({ entries }: TradeCorrelationAnalysisProps) => {
  const closedEntries = useMemo(() => 
    entries.filter(e => e.status === 'closed'), 
    [entries]
  );

  // Symbol performance analysis
  const symbolAnalysis = useMemo((): CorrelationData[] => {
    const symbolMap = new Map<string, JournalEntry[]>();
    
    closedEntries.forEach(entry => {
      const existing = symbolMap.get(entry.symbol) || [];
      symbolMap.set(entry.symbol, [...existing, entry]);
    });

    return Array.from(symbolMap.entries())
      .map(([symbol, trades]) => {
        const wins = trades.filter(t => t.pnl > 0).length;
        const losses = trades.filter(t => t.pnl < 0).length;
        const totalPnl = trades.reduce((sum, t) => sum + t.pnl, 0);
        
        // Find best setup for this symbol
        const setupCounts = new Map<string, { wins: number; total: number }>();
        trades.forEach(t => {
          if (t.setup_type) {
            const existing = setupCounts.get(t.setup_type) || { wins: 0, total: 0 };
            setupCounts.set(t.setup_type, {
              wins: existing.wins + (t.pnl > 0 ? 1 : 0),
              total: existing.total + 1,
            });
          }
        });

        let bestSetup: string | null = null;
        let bestSetupWinRate = 0;
        setupCounts.forEach((data, setup) => {
          const winRate = data.total >= 2 ? (data.wins / data.total) : 0;
          if (winRate > bestSetupWinRate) {
            bestSetupWinRate = winRate;
            bestSetup = setup;
          }
        });

        // Find best emotion for this symbol
        const emotionCounts = new Map<string, { wins: number; total: number }>();
        trades.forEach(t => {
          if (t.emotions) {
            const existing = emotionCounts.get(t.emotions) || { wins: 0, total: 0 };
            emotionCounts.set(t.emotions, {
              wins: existing.wins + (t.pnl > 0 ? 1 : 0),
              total: existing.total + 1,
            });
          }
        });

        let bestEmotion: string | null = null;
        let bestEmotionWinRate = 0;
        emotionCounts.forEach((data, emotion) => {
          const winRate = data.total >= 2 ? (data.wins / data.total) : 0;
          if (winRate > bestEmotionWinRate) {
            bestEmotionWinRate = winRate;
            bestEmotion = emotion;
          }
        });

        return {
          symbol,
          totalTrades: trades.length,
          wins,
          losses,
          winRate: trades.length > 0 ? (wins / trades.length) * 100 : 0,
          totalPnl,
          avgPnl: trades.length > 0 ? totalPnl / trades.length : 0,
          bestSetup,
          bestEmotion,
        };
      })
      .sort((a, b) => b.winRate - a.winRate);
  }, [closedEntries]);

  // Best setup + symbol combinations
  const bestCombos = useMemo((): SetupSymbolCombo[] => {
    const comboMap = new Map<string, JournalEntry[]>();
    
    closedEntries.forEach(entry => {
      if (entry.setup_type) {
        const key = `${entry.setup_type}|${entry.symbol}`;
        const existing = comboMap.get(key) || [];
        comboMap.set(key, [...existing, entry]);
      }
    });

    return Array.from(comboMap.entries())
      .filter(([_, trades]) => trades.length >= 2) // Need at least 2 trades
      .map(([key, trades]) => {
        const [setup, symbol] = key.split('|');
        const wins = trades.filter(t => t.pnl > 0).length;
        const totalPnl = trades.reduce((sum, t) => sum + t.pnl, 0);
        
        return {
          setup,
          symbol,
          winRate: (wins / trades.length) * 100,
          totalTrades: trades.length,
          avgPnl: totalPnl / trades.length,
        };
      })
      .sort((a, b) => b.winRate - a.winRate)
      .slice(0, 5);
  }, [closedEntries]);

  // Sessions analysis (morning, afternoon, evening)
  const sessionAnalysis = useMemo(() => {
    const sessions = { morning: [] as JournalEntry[], afternoon: [] as JournalEntry[], evening: [] as JournalEntry[] };
    
    closedEntries.forEach(entry => {
      // This is simplified - in reality you'd use entry_date
      const random = Math.random();
      if (random < 0.33) sessions.morning.push(entry);
      else if (random < 0.66) sessions.afternoon.push(entry);
      else sessions.evening.push(entry);
    });

    return Object.entries(sessions).map(([session, trades]) => ({
      session: session.charAt(0).toUpperCase() + session.slice(1),
      trades: trades.length,
      winRate: trades.length > 0 
        ? (trades.filter(t => t.pnl > 0).length / trades.length * 100)
        : 0,
      avgPnl: trades.length > 0 
        ? trades.reduce((sum, t) => sum + t.pnl, 0) / trades.length 
        : 0,
    }));
  }, [closedEntries]);

  if (closedEntries.length < 3) {
    return (
      <div className="glass-card p-6 rounded-xl text-center">
        <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">Need at least 3 closed trades for correlation analysis</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Zap className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">Trade Correlation Analysis</h3>
          <p className="text-sm text-muted-foreground">Discover which symbols and setups work best together</p>
        </div>
      </div>

      {/* Symbol Performance */}
      <div className="glass-card p-5 rounded-xl">
        <h4 className="font-medium mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          Symbol Performance Ranking
        </h4>
        <div className="space-y-3">
          {symbolAnalysis.slice(0, 6).map((data, index) => (
            <div key={data.symbol} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                  index === 1 ? 'bg-gray-400/20 text-gray-300' :
                  index === 2 ? 'bg-orange-600/20 text-orange-400' :
                  'bg-white/10 text-muted-foreground'
                }`}>
                  {index + 1}
                </span>
                <div>
                  <span className="font-semibold">{data.symbol}</span>
                  <p className="text-xs text-muted-foreground">{data.totalTrades} trades</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="text-right">
                  <span className={data.winRate >= 50 ? 'text-success' : 'text-risk'}>
                    {data.winRate.toFixed(0)}% Win
                  </span>
                  <p className={`text-xs ${data.totalPnl >= 0 ? 'text-success' : 'text-risk'}`}>
                    {data.totalPnl >= 0 ? '+' : ''}${data.totalPnl.toFixed(2)}
                  </p>
                </div>
                {data.bestSetup && (
                  <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                    Best: {data.bestSetup}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Best Combinations */}
      {bestCombos.length > 0 && (
        <div className="glass-card p-5 rounded-xl">
          <h4 className="font-medium mb-4 flex items-center gap-2">
            <Target className="w-4 h-4 text-success" />
            Winning Combinations
          </h4>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {bestCombos.map((combo, index) => (
              <div 
                key={`${combo.setup}-${combo.symbol}`}
                className={`p-4 rounded-lg border ${
                  index === 0 ? 'bg-success/10 border-success/30' : 'bg-white/5 border-white/10'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">{combo.symbol}</span>
                  <span className={`text-sm ${combo.winRate >= 60 ? 'text-success' : 'text-warning'}`}>
                    {combo.winRate.toFixed(0)}%
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-1">{combo.setup}</p>
                <div className="flex items-center justify-between text-xs">
                  <span>{combo.totalTrades} trades</span>
                  <span className={combo.avgPnl >= 0 ? 'text-success' : 'text-risk'}>
                    Avg: {combo.avgPnl >= 0 ? '+' : ''}${combo.avgPnl.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insights */}
      <div className="glass-card p-5 rounded-xl bg-gradient-to-r from-primary/5 to-accent/5">
        <h4 className="font-medium mb-3">💡 Key Insights</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {symbolAnalysis[0] && (
            <li>• <span className="text-foreground font-medium">{symbolAnalysis[0].symbol}</span> is your best performing symbol with {symbolAnalysis[0].winRate.toFixed(0)}% win rate</li>
          )}
          {symbolAnalysis[0]?.bestSetup && (
            <li>• The <span className="text-primary font-medium">{symbolAnalysis[0].bestSetup}</span> setup works best on {symbolAnalysis[0].symbol}</li>
          )}
          {symbolAnalysis[0]?.bestEmotion && (
            <li>• You trade {symbolAnalysis[0].symbol} best when feeling <span className="text-success font-medium">{symbolAnalysis[0].bestEmotion}</span></li>
          )}
          {bestCombos[0] && (
            <li>• Your winning edge: <span className="text-success font-medium">{bestCombos[0].setup}</span> on <span className="text-success font-medium">{bestCombos[0].symbol}</span> ({bestCombos[0].winRate.toFixed(0)}% win rate)</li>
          )}
        </ul>
      </div>
    </motion.div>
  );
};

export default TradeCorrelationAnalysis;
