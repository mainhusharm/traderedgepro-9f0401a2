import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { BarChart3, PieChartIcon, TrendingUp, Brain } from 'lucide-react';

interface JournalEntry {
  id: string;
  symbol: string;
  trade_type: 'BUY' | 'SELL';
  pnl: number;
  status: 'open' | 'closed' | 'cancelled';
  setup_type: string | null;
  emotions: string | null;
}

interface JournalAnalyticsProps {
  entries: JournalEntry[];
}

const COLORS = ['hsl(160, 84%, 45%)', 'hsl(0, 84%, 60%)', 'hsl(38, 92%, 50%)', 'hsl(190, 100%, 50%)', 'hsl(270, 70%, 60%)', 'hsl(25, 95%, 53%)'];

const JournalAnalytics = ({ entries }: JournalAnalyticsProps) => {
  const closedTrades = useMemo(() => entries.filter(e => e.status === 'closed'), [entries]);

  // Win rate by setup type
  const setupTypeStats = useMemo(() => {
    const stats: Record<string, { wins: number; losses: number; total: number; pnl: number }> = {};
    
    closedTrades.forEach(trade => {
      const setup = trade.setup_type || 'Unclassified';
      if (!stats[setup]) {
        stats[setup] = { wins: 0, losses: 0, total: 0, pnl: 0 };
      }
      stats[setup].total++;
      stats[setup].pnl += trade.pnl || 0;
      if (trade.pnl > 0) stats[setup].wins++;
      else if (trade.pnl < 0) stats[setup].losses++;
    });

    return Object.entries(stats)
      .map(([name, data]) => ({
        name: name.length > 12 ? name.slice(0, 12) + '...' : name,
        winRate: data.total > 0 ? Math.round((data.wins / data.total) * 100) : 0,
        trades: data.total,
        pnl: data.pnl
      }))
      .sort((a, b) => b.trades - a.trades)
      .slice(0, 6);
  }, [closedTrades]);

  // Win rate by emotion
  const emotionStats = useMemo(() => {
    const stats: Record<string, { wins: number; losses: number; total: number; pnl: number }> = {};
    
    closedTrades.forEach(trade => {
      const emotion = trade.emotions || 'Untracked';
      if (!stats[emotion]) {
        stats[emotion] = { wins: 0, losses: 0, total: 0, pnl: 0 };
      }
      stats[emotion].total++;
      stats[emotion].pnl += trade.pnl || 0;
      if (trade.pnl > 0) stats[emotion].wins++;
      else if (trade.pnl < 0) stats[emotion].losses++;
    });

    return Object.entries(stats)
      .map(([name, data]) => ({
        name,
        winRate: data.total > 0 ? Math.round((data.wins / data.total) * 100) : 0,
        trades: data.total,
        pnl: data.pnl
      }))
      .sort((a, b) => b.trades - a.trades);
  }, [closedTrades]);

  // Distribution for pie chart
  const emotionDistribution = useMemo(() => {
    return emotionStats.map((stat, index) => ({
      name: stat.name,
      value: stat.trades,
      color: COLORS[index % COLORS.length]
    }));
  }, [emotionStats]);

  // Insights
  const insights = useMemo(() => {
    const insights: string[] = [];
    
    // Best setup
    const bestSetup = setupTypeStats.reduce((best, current) => 
      current.winRate > best.winRate && current.trades >= 3 ? current : best, 
      { name: '', winRate: 0, trades: 0, pnl: 0 }
    );
    if (bestSetup.name && bestSetup.trades >= 3) {
      insights.push(`🎯 "${bestSetup.name}" is your best setup with ${bestSetup.winRate}% win rate`);
    }

    // Worst emotion
    const worstEmotion = emotionStats
      .filter(e => e.trades >= 3)
      .reduce((worst, current) => 
        current.winRate < worst.winRate ? current : worst,
        { name: '', winRate: 100, trades: 0, pnl: 0 }
      );
    if (worstEmotion.name && worstEmotion.name !== 'Untracked') {
      insights.push(`⚠️ Trading while "${worstEmotion.name}" leads to ${worstEmotion.winRate}% win rate - consider waiting`);
    }

    // Best emotion
    const bestEmotion = emotionStats
      .filter(e => e.trades >= 3 && e.name !== 'Untracked')
      .reduce((best, current) => 
        current.winRate > best.winRate ? current : best,
        { name: '', winRate: 0, trades: 0, pnl: 0 }
      );
    if (bestEmotion.name) {
      insights.push(`✨ Your best mindset is "${bestEmotion.name}" with ${bestEmotion.winRate}% win rate`);
    }

    return insights;
  }, [setupTypeStats, emotionStats]);

  if (closedTrades.length < 3) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-xl p-6 text-center"
      >
        <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-semibold mb-2">Not Enough Data</h3>
        <p className="text-sm text-muted-foreground">
          Complete at least 3 trades with setup types and emotions to see analytics
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Insights */}
      {insights.length > 0 && (
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-5 h-5 text-primary" />
            <h4 className="font-semibold">AI Insights</h4>
          </div>
          <div className="space-y-2">
            {insights.map((insight, i) => (
              <p key={i} className="text-sm text-muted-foreground">{insight}</p>
            ))}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Win Rate by Setup Type */}
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h4 className="font-semibold">Win Rate by Setup Type</h4>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={setupTypeStats} layout="vertical" margin={{ left: 0, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 10%, 15%)" />
                <XAxis type="number" domain={[0, 100]} tick={{ fill: 'hsl(220, 10%, 55%)', fontSize: 12 }} />
                <YAxis dataKey="name" type="category" width={100} tick={{ fill: 'hsl(220, 10%, 55%)', fontSize: 11 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(0, 0%, 4%)', 
                    border: '1px solid hsl(220, 10%, 15%)',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number, name: string) => [`${value}%`, 'Win Rate']}
                />
                <Bar 
                  dataKey="winRate" 
                  fill="hsl(190, 100%, 50%)" 
                  radius={[0, 4, 4, 0]}
                  label={{ position: 'right', fill: 'hsl(0, 0%, 95%)', fontSize: 12 }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Win Rate by Emotion */}
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h4 className="font-semibold">Win Rate by Emotion</h4>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={emotionStats} layout="vertical" margin={{ left: 0, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 10%, 15%)" />
                <XAxis type="number" domain={[0, 100]} tick={{ fill: 'hsl(220, 10%, 55%)', fontSize: 12 }} />
                <YAxis dataKey="name" type="category" width={80} tick={{ fill: 'hsl(220, 10%, 55%)', fontSize: 11 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(0, 0%, 4%)', 
                    border: '1px solid hsl(220, 10%, 15%)',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [`${value}%`, 'Win Rate']}
                />
                <Bar 
                  dataKey="winRate" 
                  radius={[0, 4, 4, 0]}
                >
                  {emotionStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.winRate >= 50 ? 'hsl(160, 84%, 45%)' : 'hsl(0, 84%, 60%)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Emotion Distribution */}
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <PieChartIcon className="w-5 h-5 text-primary" />
          <h4 className="font-semibold">Trading Emotion Distribution</h4>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={emotionDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {emotionDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(0, 0%, 4%)', 
                  border: '1px solid hsl(220, 10%, 15%)',
                  borderRadius: '8px'
                }}
                formatter={(value: number) => [`${value} trades`, 'Count']}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
};

export default JournalAnalytics;
