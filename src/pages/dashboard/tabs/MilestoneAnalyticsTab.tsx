import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Trophy, Target, TrendingUp, Shield, Zap, BarChart3, 
  PieChart, Activity, CheckCircle, Lock, Calendar,
  ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';

interface MilestoneStats {
  id: string;
  name: string;
  description: string;
  winRate: number;
  totalTrades: number;
  wins: number;
  losses: number;
  pnl: number;
  avgWin: number;
  avgLoss: number;
  isUnlocked: boolean;
  color: string;
  bgColor: string;
  icon: React.ReactNode;
}

const MILESTONE_ICONS = {
  M1: <Shield className="w-5 h-5" />,
  M2: <Target className="w-5 h-5" />,
  M3: <TrendingUp className="w-5 h-5" />,
  M4: <Zap className="w-5 h-5" />,
};

const MILESTONE_COLORS = {
  M1: { color: 'text-emerald-400', bgColor: 'bg-emerald-900/20', borderColor: 'border-emerald-500/30' },
  M2: { color: 'text-blue-400', bgColor: 'bg-blue-900/20', borderColor: 'border-blue-500/30' },
  M3: { color: 'text-purple-400', bgColor: 'bg-purple-900/20', borderColor: 'border-purple-500/30' },
  M4: { color: 'text-orange-400', bgColor: 'bg-orange-900/20', borderColor: 'border-orange-500/30' },
};

const MilestoneAnalyticsTab = () => {
  const [milestoneStats, setMilestoneStats] = useState<MilestoneStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [overallStats, setOverallStats] = useState({
    totalPnl: 0,
    winRate: 0,
    totalTrades: 0,
    profitFactor: 0,
  });
  const [unlockedMilestones, setUnlockedMilestones] = useState<string[]>(['M1']);
  const { user } = useAuth();

  useEffect(() => {
    fetchAnalytics();
  }, [user]);

  const fetchAnalytics = async () => {
    if (!user) return;
    
    try {
      // Fetch signals with outcomes
      const { data: signals } = await supabase
        .from('signals')
        .select('*')
        .eq('user_id', user.id)
        .not('outcome', 'is', null);

      // Fetch dashboard data
      const { data: dashboard } = await supabase
        .from('dashboard_data')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // Fetch questionnaire for account size
      const { data: questionnaire } = await supabase
        .from('questionnaires')
        .select('account_size')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const accountSize = questionnaire?.account_size || 10000;
      const totalPnl = dashboard?.total_pnl || 0;

      // Calculate unlocked milestones
      const unlocked = calculateUnlockedMilestones(totalPnl, accountSize);
      setUnlockedMilestones(unlocked);

      // Calculate stats per milestone
      const stats = calculateMilestoneStats(signals || [], unlocked);
      setMilestoneStats(stats);

      // Set overall stats
      setOverallStats({
        totalPnl: dashboard?.total_pnl || 0,
        winRate: dashboard?.win_rate || 0,
        totalTrades: dashboard?.total_trades || 0,
        profitFactor: dashboard?.profit_factor || 0,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateUnlockedMilestones = (pnl: number, accSize: number): string[] => {
    const thresholds = [
      { id: 'M1', profit: 0 },
      { id: 'M2', profit: accSize * 0.05 },
      { id: 'M3', profit: accSize * 0.10 },
      { id: 'M4', profit: accSize * 0.15 },
    ];

    const unlocked: string[] = [];
    for (const threshold of thresholds) {
      if (pnl >= threshold.profit) {
        unlocked.push(threshold.id);
      }
    }
    
    return unlocked.length > 0 ? unlocked : ['M1'];
  };

  const calculateMilestoneStats = (signals: any[], unlocked: string[]): MilestoneStats[] => {
    const milestones = ['M1', 'M2', 'M3', 'M4'];
    const names = {
      M1: 'Milestone 1',
      M2: 'Milestone 2', 
      M3: 'Milestone 3',
      M4: 'Milestone 4',
    };
    const descriptions = {
      M1: '1-Step Challenge (~90% WR)',
      M2: '2-Step Challenge (~60% WR)',
      M3: '3-Step Challenge (~40% WR)',
      M4: 'Evaluation/Instant (~25-30% WR)',
    };

    return milestones.map(id => {
      const milestoneSignals = signals.filter(s => s.milestone === id);
      const wins = milestoneSignals.filter(s => s.outcome === 'target_hit').length;
      const losses = milestoneSignals.filter(s => s.outcome === 'stop_loss_hit').length;
      const totalTrades = wins + losses;
      const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
      const pnl = milestoneSignals.reduce((sum, s) => sum + (s.pnl || 0), 0);
      const avgWin = wins > 0 
        ? milestoneSignals.filter(s => s.outcome === 'target_hit').reduce((sum, s) => sum + (s.pnl || 0), 0) / wins 
        : 0;
      const avgLoss = losses > 0
        ? Math.abs(milestoneSignals.filter(s => s.outcome === 'stop_loss_hit').reduce((sum, s) => sum + (s.pnl || 0), 0) / losses)
        : 0;

      const colors = MILESTONE_COLORS[id as keyof typeof MILESTONE_COLORS];

      return {
        id,
        name: names[id as keyof typeof names],
        description: descriptions[id as keyof typeof descriptions],
        winRate,
        totalTrades,
        wins,
        losses,
        pnl,
        avgWin,
        avgLoss,
        isUnlocked: unlocked.includes(id),
        color: colors.color,
        bgColor: colors.bgColor,
        icon: MILESTONE_ICONS[id as keyof typeof MILESTONE_ICONS],
      };
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Trophy className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Milestone Analytics</h2>
          <p className="text-sm text-muted-foreground">Track your performance across all milestones</p>
        </div>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total P&L', value: `$${overallStats.totalPnl.toFixed(2)}`, icon: TrendingUp, isPositive: overallStats.totalPnl >= 0 },
          { label: 'Overall Win Rate', value: `${overallStats.winRate.toFixed(1)}%`, icon: Target, isPositive: overallStats.winRate >= 50 },
          { label: 'Total Trades', value: overallStats.totalTrades, icon: Activity, isPositive: true },
          { label: 'Profit Factor', value: overallStats.profitFactor.toFixed(2), icon: BarChart3, isPositive: overallStats.profitFactor >= 1 },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="glass-card p-6 rounded-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.isPositive ? 'bg-success/10' : 'bg-risk/10'}`}>
                <stat.icon className={`w-5 h-5 ${stat.isPositive ? 'text-success' : 'text-risk'}`} />
              </div>
              {typeof stat.value === 'string' && stat.value.startsWith('$') && (
                stat.isPositive ? 
                  <ArrowUpRight className="w-4 h-4 text-success" /> : 
                  <ArrowDownRight className="w-4 h-4 text-risk" />
              )}
            </div>
            <p className={`text-2xl font-bold mb-1 ${stat.isPositive ? 'text-success' : 'text-risk'}`}>{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Milestones Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-6 rounded-xl"
      >
        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          Milestone Progression
        </h3>
        
        <div className="flex items-center justify-between">
          {milestoneStats.map((milestone, index) => (
            <div key={milestone.id} className="flex items-center">
              <div className={`flex flex-col items-center ${milestone.isUnlocked ? '' : 'opacity-50'}`}>
                <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${milestone.bgColor} border ${milestone.isUnlocked ? milestone.color.replace('text-', 'border-') : 'border-gray-600'}`}>
                  {milestone.isUnlocked ? (
                    <span className={milestone.color}>{milestone.icon}</span>
                  ) : (
                    <Lock className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>
                <p className={`text-sm font-medium mt-2 ${milestone.color}`}>{milestone.id}</p>
                <p className="text-xs text-muted-foreground">{milestone.isUnlocked ? 'Unlocked' : 'Locked'}</p>
              </div>
              {index < milestoneStats.length - 1 && (
                <div className={`w-12 h-0.5 mx-2 ${milestone.isUnlocked && milestoneStats[index + 1].isUnlocked ? 'bg-primary' : 'bg-white/10'}`} />
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Milestone Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {milestoneStats.map((milestone, index) => (
          <motion.div
            key={milestone.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + index * 0.1 }}
            className={`glass-card p-6 rounded-xl relative overflow-hidden ${!milestone.isUnlocked && 'opacity-60'}`}
          >
            {!milestone.isUnlocked && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-10">
                <div className="text-center">
                  <Lock className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Locked</p>
                </div>
              </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${milestone.bgColor}`}>
                  <span className={milestone.color}>{milestone.icon}</span>
                </div>
                <div>
                  <h4 className={`font-semibold ${milestone.color}`}>{milestone.name}</h4>
                  <p className="text-xs text-muted-foreground">{milestone.description}</p>
                </div>
              </div>
              {milestone.isUnlocked && (
                <CheckCircle className="w-5 h-5 text-success" />
              )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <p className="text-2xl font-bold">{milestone.winRate.toFixed(0)}%</p>
                <p className="text-xs text-muted-foreground">Win Rate</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{milestone.totalTrades}</p>
                <p className="text-xs text-muted-foreground">Total Trades</p>
              </div>
              <div className="text-center">
                <p className={`text-2xl font-bold ${milestone.pnl >= 0 ? 'text-success' : 'text-risk'}`}>
                  ${milestone.pnl.toFixed(0)}
                </p>
                <p className="text-xs text-muted-foreground">P&L</p>
              </div>
            </div>

            {/* Win/Loss Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-success">Wins: {milestone.wins}</span>
                <span className="text-risk">Losses: {milestone.losses}</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden flex">
                {milestone.totalTrades > 0 && (
                  <>
                    <div 
                      className="h-full bg-success transition-all"
                      style={{ width: `${(milestone.wins / milestone.totalTrades) * 100}%` }}
                    />
                    <div 
                      className="h-full bg-risk transition-all"
                      style={{ width: `${(milestone.losses / milestone.totalTrades) * 100}%` }}
                    />
                  </>
                )}
              </div>
            </div>

            {/* Avg Win/Loss */}
            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/5">
              <div>
                <p className="text-xs text-muted-foreground">Avg Win</p>
                <p className="text-sm font-semibold text-success">${milestone.avgWin.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Avg Loss</p>
                <p className="text-sm font-semibold text-risk">${milestone.avgLoss.toFixed(2)}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Win Rate Comparison Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="glass-card p-6 rounded-xl"
      >
        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <PieChart className="w-5 h-5 text-primary" />
          Win Rate by Milestone
        </h3>
        
        <div className="space-y-4">
          {milestoneStats.map((milestone) => (
            <div key={milestone.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={milestone.color}>{milestone.icon}</span>
                  <span className="text-sm font-medium">{milestone.name}</span>
                </div>
                <span className={`text-sm font-semibold ${milestone.color}`}>
                  {milestone.winRate.toFixed(0)}%
                </span>
              </div>
              <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${milestone.winRate}%` }}
                  transition={{ duration: 1, delay: 0.8 }}
                  className={`h-full rounded-full ${milestone.bgColor.replace('/20', '')}`}
                  style={{ 
                    background: `linear-gradient(90deg, ${
                      milestone.id === 'M1' ? '#10b981' :
                      milestone.id === 'M2' ? '#3b82f6' :
                      milestone.id === 'M3' ? '#8b5cf6' : '#f97316'
                    } 0%, ${
                      milestone.id === 'M1' ? '#059669' :
                      milestone.id === 'M2' ? '#2563eb' :
                      milestone.id === 'M3' ? '#7c3aed' : '#ea580c'
                    } 100%)`
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default MilestoneAnalyticsTab;
