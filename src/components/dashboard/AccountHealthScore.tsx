import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Heart, Shield, AlertTriangle, CheckCircle, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';

interface PropAccount {
  id: string;
  account_name: string;
  prop_firm: string;
  current_equity: number;
  starting_balance: number;
  profit_target_pct: number;
  daily_dd_limit_pct: number;
  max_dd_limit_pct: number;
  daily_drawdown_used_pct: number;
  max_drawdown_used_pct: number;
  trading_days_count: number;
  min_trading_days: number;
  status: string;
  recovery_mode_active: boolean;
}

interface HealthFactor {
  name: string;
  score: number;
  maxScore: number;
  description: string;
  status: 'good' | 'warning' | 'danger';
  icon: React.ReactNode;
}

interface AccountHealthScoreProps {
  accountId: string;
  className?: string;
}

// 3D Circular Gauge Component
function CircularGauge({ score, maxScore }: { score: number; maxScore: number }) {
  const percentage = (score / maxScore) * 100;
  const circumference = 2 * Math.PI * 85;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  const getGradientColors = () => {
    if (percentage >= 80) return { start: '#10b981', end: '#34d399', glow: 'rgba(16, 185, 129, 0.5)' };
    if (percentage >= 60) return { start: '#3b82f6', end: '#60a5fa', glow: 'rgba(59, 130, 246, 0.5)' };
    if (percentage >= 40) return { start: '#f59e0b', end: '#fbbf24', glow: 'rgba(245, 158, 11, 0.5)' };
    return { start: '#ef4444', end: '#f87171', glow: 'rgba(239, 68, 68, 0.5)' };
  };

  const colors = getGradientColors();

  return (
    <div className="relative w-48 h-48 mx-auto">
      {/* Outer glow ring */}
      <div 
        className="absolute inset-0 rounded-full blur-xl opacity-30"
        style={{ background: `radial-gradient(circle, ${colors.glow} 0%, transparent 70%)` }}
      />
      
      {/* 3D base shadow */}
      <div className="absolute inset-2 rounded-full bg-gradient-to-b from-background/50 to-background shadow-[inset_0_-8px_20px_rgba(0,0,0,0.4),inset_0_4px_10px_rgba(255,255,255,0.05)]" />
      
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
        <defs>
          <linearGradient id="healthGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.start} />
            <stop offset="100%" stopColor={colors.end} />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <filter id="innerShadow">
            <feOffset dx="0" dy="2"/>
            <feGaussianBlur stdDeviation="2"/>
            <feComposite in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1"/>
            <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.3 0"/>
            <feBlend in="SourceGraphic"/>
          </filter>
        </defs>
        
        {/* Background track with 3D effect */}
        <circle
          cx="100"
          cy="100"
          r="85"
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="12"
          strokeLinecap="round"
          filter="url(#innerShadow)"
          opacity="0.3"
        />
        
        {/* Animated progress ring */}
        <motion.circle
          cx="100"
          cy="100"
          r="85"
          fill="none"
          stroke="url(#healthGradient)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          filter="url(#glow)"
        />
        
        {/* Highlight arc for 3D effect */}
        <circle
          cx="100"
          cy="100"
          r="79"
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="2"
          strokeDasharray="60 300"
        />
      </svg>
      
      {/* Center content with 3D depth */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="relative">
          {/* Score glow */}
          <div 
            className="absolute inset-0 blur-lg opacity-50"
            style={{ color: colors.start }}
          >
            <span className="text-5xl font-bold">{score}</span>
          </div>
          <motion.span 
            className="text-5xl font-bold relative"
            style={{ color: colors.start }}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            {score}
          </motion.span>
        </div>
        <span className="text-xs text-muted-foreground mt-1">/ {maxScore}</span>
      </div>
    </div>
  );
}

// Futuristic Factor Bar
function FactorBar({ factor, index }: { factor: HealthFactor; index: number }) {
  const percentage = (factor.score / factor.maxScore) * 100;
  
  const getBarColor = () => {
    if (factor.status === 'good') return 'from-emerald-500 to-emerald-400';
    if (factor.status === 'warning') return 'from-amber-500 to-amber-400';
    return 'from-red-500 to-red-400';
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.8 + index * 0.1 }}
      className="group relative"
    >
      <div className="flex items-center gap-3 p-2 rounded-lg bg-gradient-to-r from-muted/30 to-transparent hover:from-muted/50 transition-all duration-300">
        {/* Icon with glow */}
        <div className={`relative p-1.5 rounded-md ${
          factor.status === 'good' ? 'bg-emerald-500/20' :
          factor.status === 'warning' ? 'bg-amber-500/20' : 'bg-red-500/20'
        }`}>
          {factor.icon}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium truncate">{factor.name}</span>
            <span className={`text-xs font-mono ${
              factor.status === 'good' ? 'text-emerald-400' :
              factor.status === 'warning' ? 'text-amber-400' : 'text-red-400'
            }`}>
              {factor.score}/{factor.maxScore}
            </span>
          </div>
          
          {/* 3D Progress bar */}
          <div className="relative h-1.5 rounded-full bg-muted/50 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent" />
            <motion.div
              className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${getBarColor()}`}
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ delay: 1 + index * 0.1, duration: 0.8, ease: "easeOut" }}
              style={{
                boxShadow: factor.status === 'good' 
                  ? '0 0 10px rgba(16, 185, 129, 0.5)' 
                  : factor.status === 'warning'
                  ? '0 0 10px rgba(245, 158, 11, 0.5)'
                  : '0 0 10px rgba(239, 68, 68, 0.5)'
              }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function AccountHealthScore({ accountId, className }: AccountHealthScoreProps) {
  const { user } = useAuth();
  const [account, setAccount] = useState<PropAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [recentStats, setRecentStats] = useState<any>(null);
  const [noAccount, setNoAccount] = useState(false);

  useEffect(() => {
    if (user && accountId) {
      setNoAccount(false);
      fetchAccountData();
    } else if (user && !accountId) {
      setIsLoading(false);
      setNoAccount(true);
    }
  }, [user, accountId]);

  const fetchAccountData = async () => {
    try {
      const { data: accountData, error: accountError } = await supabase
        .from('user_prop_accounts')
        .select('*')
        .eq('id', accountId)
        .single();

      if (accountError) throw accountError;
      
      const acc = accountData as any;
      const mapped: PropAccount = {
        id: acc.id,
        account_name: acc.account_label || 'Account',
        prop_firm: acc.prop_firm_name || '',
        current_equity: acc.current_equity || 0,
        starting_balance: acc.starting_balance || 0,
        profit_target_pct: acc.profit_target_pct || 10,
        daily_dd_limit_pct: acc.daily_dd_limit_pct || 5,
        max_dd_limit_pct: acc.max_dd_limit_pct || 10,
        daily_drawdown_used_pct: acc.daily_drawdown_used_pct || 0,
        max_drawdown_used_pct: acc.max_drawdown_used_pct || 0,
        trading_days_count: acc.days_traded || 0,
        min_trading_days: acc.min_trading_days || 0,
        status: acc.status || 'active',
        recovery_mode_active: acc.recovery_mode_active || false
      };
      setAccount(mapped);

      type StatsRow = { total_trades: number; winning_trades: number; total_pnl: number; consecutive_losses: number };
      const { data: statsData } = await (supabase.from('trade_daily_stats' as any).select('total_trades, winning_trades, total_pnl, consecutive_losses').eq('account_id', accountId).order('date', { ascending: false }).limit(7)) as { data: StatsRow[] | null };

      if (statsData && statsData.length > 0) {
        const totalTrades = statsData.reduce((sum, d) => sum + (d.total_trades || 0), 0);
        const winningTrades = statsData.reduce((sum, d) => sum + (d.winning_trades || 0), 0);
        const losingDays = statsData.filter(d => (d.total_pnl || 0) < 0).length;
        const consecutiveLosses = statsData[0]?.consecutive_losses || 0;
        
        setRecentStats({
          winRate: totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 50,
          losingDaysRatio: (losingDays / 7) * 100,
          consecutiveLosses
        });
      }
    } catch (error) {
      console.error('Error fetching account data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const healthFactors = useMemo<HealthFactor[]>(() => {
    if (!account) return [];

    const factors: HealthFactor[] = [];

    // Daily DD Factor (max 25 points)
    const dailyDDUsed = account.daily_drawdown_used_pct || 0;
    let dailyDDScore = 25;
    let dailyDDStatus: 'good' | 'warning' | 'danger' = 'good';
    if (dailyDDUsed > 70) {
      dailyDDScore = 5;
      dailyDDStatus = 'danger';
    } else if (dailyDDUsed > 50) {
      dailyDDScore = 15;
      dailyDDStatus = 'warning';
    } else if (dailyDDUsed > 30) {
      dailyDDScore = 20;
    }
    factors.push({
      name: 'Daily Drawdown',
      score: dailyDDScore,
      maxScore: 25,
      description: `${dailyDDUsed.toFixed(1)}% of limit used`,
      status: dailyDDStatus,
      icon: <Shield className="w-4 h-4 text-emerald-400" />
    });

    // Max DD Factor (max 25 points)
    const maxDDUsed = account.max_drawdown_used_pct || 0;
    let maxDDScore = 25;
    let maxDDStatus: 'good' | 'warning' | 'danger' = 'good';
    if (maxDDUsed > 70) {
      maxDDScore = 5;
      maxDDStatus = 'danger';
    } else if (maxDDUsed > 50) {
      maxDDScore = 15;
      maxDDStatus = 'warning';
    } else if (maxDDUsed > 30) {
      maxDDScore = 20;
    }
    factors.push({
      name: 'Max Drawdown',
      score: maxDDScore,
      maxScore: 25,
      description: `${maxDDUsed.toFixed(1)}% of limit used`,
      status: maxDDStatus,
      icon: <AlertTriangle className="w-4 h-4 text-amber-400" />
    });

    // Profit Progress Factor (max 25 points)
    const profitProgress = account.current_equity && account.starting_balance
      ? ((account.current_equity - account.starting_balance) / account.starting_balance) * 100
      : 0;
    const targetProgress = account.profit_target_pct 
      ? (profitProgress / account.profit_target_pct) * 100 
      : 0;
    let profitScore = Math.min(25, Math.round(targetProgress * 0.25));
    if (profitProgress < 0) profitScore = Math.max(0, 15 + profitProgress);
    factors.push({
      name: 'Profit Progress',
      score: Math.max(0, profitScore),
      maxScore: 25,
      description: `${profitProgress.toFixed(1)}% / ${account.profit_target_pct || 10}% target`,
      status: profitProgress >= (account.profit_target_pct || 10) * 0.5 ? 'good' : 
              profitProgress >= 0 ? 'warning' : 'danger',
      icon: <Zap className="w-4 h-4 text-blue-400" />
    });

    // Trading Days Factor (max 15 points)
    const tradingDays = account.trading_days_count || 0;
    const minDays = account.min_trading_days || 0;
    const daysProgress = minDays > 0 ? (tradingDays / minDays) * 100 : 100;
    let daysScore = Math.min(15, Math.round(daysProgress * 0.15));
    factors.push({
      name: 'Trading Days',
      score: daysScore,
      maxScore: 15,
      description: `${tradingDays}/${minDays} minimum days`,
      status: daysProgress >= 100 ? 'good' : daysProgress >= 50 ? 'warning' : 'danger',
      icon: <CheckCircle className="w-4 h-4 text-purple-400" />
    });

    // Recent Performance Factor (max 10 points)
    const winRate = recentStats?.winRate || 50;
    const consecutiveLosses = recentStats?.consecutiveLosses || 0;
    let perfScore = 10;
    let perfStatus: 'good' | 'warning' | 'danger' = 'good';
    if (consecutiveLosses >= 3 || winRate < 30) {
      perfScore = 2;
      perfStatus = 'danger';
    } else if (consecutiveLosses >= 2 || winRate < 45) {
      perfScore = 5;
      perfStatus = 'warning';
    } else if (winRate >= 55) {
      perfScore = 10;
    }
    factors.push({
      name: 'Recent Performance',
      score: perfScore,
      maxScore: 10,
      description: `${winRate.toFixed(0)}% win rate`,
      status: perfStatus,
      icon: <Heart className="w-4 h-4 text-pink-400" />
    });

    return factors;
  }, [account, recentStats]);

  const totalScore = healthFactors.reduce((sum, f) => sum + f.score, 0);
  const maxScore = healthFactors.reduce((sum, f) => sum + f.maxScore, 0);

  const getScoreLabel = (score: number) => {
    if (score >= 80) return { label: 'Excellent', color: 'text-emerald-400', bg: 'bg-emerald-500/20' };
    if (score >= 60) return { label: 'Good', color: 'text-blue-400', bg: 'bg-blue-500/20' };
    if (score >= 40) return { label: 'At Risk', color: 'text-amber-400', bg: 'bg-amber-500/20' };
    return { label: 'Critical', color: 'text-red-400', bg: 'bg-red-500/20' };
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-48 w-48 mx-auto rounded-full bg-muted" />
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-10 bg-muted rounded" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!account || noAccount) {
    return (
      <Card className={`${className} overflow-hidden`}>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <div className="relative w-24 h-24 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-muted to-muted/50 animate-pulse" />
              <Shield className="absolute inset-0 m-auto w-10 h-10 text-muted-foreground/50" />
            </div>
            <p className="text-muted-foreground mb-2">No prop account found</p>
            <p className="text-sm text-muted-foreground/70">
              Add a prop firm account to track your health score
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const scoreInfo = getScoreLabel(totalScore);

  return (
    <Card className={`${className} overflow-hidden relative`}>
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
      
      <CardContent className="p-6 relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Heart className="w-5 h-5 text-red-400" />
              <div className="absolute inset-0 blur-sm bg-red-400/50 animate-pulse" />
            </div>
            <span className="font-semibold">Account Health</span>
          </div>
          {account.recovery_mode_active && (
            <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
              <Shield className="w-3 h-3 mr-1" />
              Recovery
            </Badge>
          )}
        </div>

        {/* 3D Circular Gauge */}
        <CircularGauge score={totalScore} maxScore={maxScore} />

        {/* Status Badge */}
        <motion.div 
          className="flex justify-center mt-4 mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Badge className={`${scoreInfo.bg} ${scoreInfo.color} px-4 py-1 text-sm font-medium border-0`}>
            {scoreInfo.label}
          </Badge>
        </motion.div>

        {/* Separator with glow */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          </div>
        </div>

        {/* Factor Breakdown */}
        <div className="space-y-1">
          {healthFactors.map((factor, index) => (
            <FactorBar key={factor.name} factor={factor} index={index} />
          ))}
        </div>

        {/* Warning Section */}
        {totalScore < 60 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5 }}
            className="mt-4 p-3 rounded-lg bg-gradient-to-r from-amber-500/10 to-red-500/10 border border-amber-500/20"
          >
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-medium text-amber-400">Attention Needed</span>
            </div>
            <ul className="text-xs text-muted-foreground space-y-1">
              {healthFactors
                .filter(f => f.status === 'danger' || f.status === 'warning')
                .slice(0, 2)
                .map(f => (
                  <li key={f.name} className="flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-amber-400" />
                    Focus on {f.name.toLowerCase()}
                  </li>
                ))
              }
            </ul>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
