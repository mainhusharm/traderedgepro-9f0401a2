import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Award, Target, TrendingUp, Trophy, Crown, Zap, Shield, Star, Medal, Flame, Lock, Sparkles, Share2, ArrowLeft, Gift, type LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

interface TradingBadge {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  requirement: {
    type: 'trades' | 'winRate' | 'pnl' | 'milestone' | 'streak' | 'leaderboard' | 'referrals';
    value: number;
  };
  color: string;
  bgColor: string;
  unlocked: boolean;
  category: 'trading' | 'milestone' | 'leaderboard' | 'referral';
  progress: number;
}

const AchievementsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTrades: 0,
    winRate: 0,
    totalPnl: 0,
    currentMilestone: 1,
    winStreak: 0,
    leaderboardPosition: 0,
    totalReferrals: 0,
  });

  useEffect(() => {
    if (user) {
      fetchAllStats();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const fetchAllStats = async () => {
    if (!user) return;

    try {
      // Fetch dashboard data
      const { data: dashboardData } = await supabase
        .from('dashboard_data')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // Fetch signals
      const { data: signals } = await supabase
        .from('signals')
        .select('*')
        .eq('user_id', user.id)
        .eq('taken_by_user', true);

      // Fetch referrals
      const { data: referrals } = await supabase
        .from('referral_credits')
        .select('id')
        .eq('user_id', user.id);

      const totalTrades = signals?.length || dashboardData?.total_trades || 0;
      const winningTrades = signals?.filter(s => s.outcome === 'target_hit').length || dashboardData?.winning_trades || 0;
      const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
      const totalPnl = signals?.reduce((sum, s) => sum + (s.pnl || 0), 0) || dashboardData?.total_pnl || 0;

      const accessibleMilestones = JSON.parse(localStorage.getItem(`accessible_milestones_${user.email}`) || '["M1"]');
      const currentMilestone = accessibleMilestones.length;

      let winStreak = 0;
      if (signals) {
        const sortedSignals = signals.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        for (const signal of sortedSignals) {
          if (signal.outcome === 'target_hit') {
            winStreak++;
          } else {
            break;
          }
        }
      }

      const { data: allUsers } = await supabase
        .from('dashboard_data')
        .select('user_id, total_pnl')
        .order('total_pnl', { ascending: false });

      const leaderboardPosition = allUsers?.findIndex(u => u.user_id === user.id) + 1 || 0;

      setStats({
        totalTrades,
        winRate,
        totalPnl,
        currentMilestone,
        winStreak,
        leaderboardPosition: leaderboardPosition || 999,
        totalReferrals: referrals?.length || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getBadges = (): TradingBadge[] => [
    // Trading Badges
    {
      id: 'first-trade',
      name: 'First Trade',
      description: 'Execute your first trade',
      icon: Star,
      requirement: { type: 'trades', value: 1 },
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10 border-blue-500/20',
      unlocked: stats.totalTrades >= 1,
      category: 'trading',
      progress: Math.min((stats.totalTrades / 1) * 100, 100),
    },
    {
      id: 'trader-10',
      name: 'Active Trader',
      description: 'Complete 10 trades',
      icon: Zap,
      requirement: { type: 'trades', value: 10 },
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10 border-cyan-500/20',
      unlocked: stats.totalTrades >= 10,
      category: 'trading',
      progress: Math.min((stats.totalTrades / 10) * 100, 100),
    },
    {
      id: 'trader-50',
      name: 'Seasoned Trader',
      description: 'Complete 50 trades',
      icon: Target,
      requirement: { type: 'trades', value: 50 },
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10 border-purple-500/20',
      unlocked: stats.totalTrades >= 50,
      category: 'trading',
      progress: Math.min((stats.totalTrades / 50) * 100, 100),
    },
    {
      id: 'trader-100',
      name: 'Expert Trader',
      description: 'Complete 100 trades',
      icon: Trophy,
      requirement: { type: 'trades', value: 100 },
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10 border-amber-500/20',
      unlocked: stats.totalTrades >= 100,
      category: 'trading',
      progress: Math.min((stats.totalTrades / 100) * 100, 100),
    },
    {
      id: 'win-rate-60',
      name: 'Consistent',
      description: 'Achieve 60% win rate (min 10 trades)',
      icon: Shield,
      requirement: { type: 'winRate', value: 60 },
      color: 'text-green-400',
      bgColor: 'bg-green-500/10 border-green-500/20',
      unlocked: stats.winRate >= 60 && stats.totalTrades >= 10,
      category: 'trading',
      progress: stats.totalTrades >= 10 ? Math.min((stats.winRate / 60) * 100, 100) : 0,
    },
    {
      id: 'win-rate-75',
      name: 'Sharp Shooter',
      description: 'Achieve 75% win rate (min 10 trades)',
      icon: TrendingUp,
      requirement: { type: 'winRate', value: 75 },
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10 border-emerald-500/20',
      unlocked: stats.winRate >= 75 && stats.totalTrades >= 10,
      category: 'trading',
      progress: stats.totalTrades >= 10 ? Math.min((stats.winRate / 75) * 100, 100) : 0,
    },
    {
      id: 'streak-5',
      name: 'Hot Streak',
      description: '5 consecutive winning trades',
      icon: Flame,
      requirement: { type: 'streak', value: 5 },
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10 border-orange-500/20',
      unlocked: stats.winStreak >= 5,
      category: 'trading',
      progress: Math.min((stats.winStreak / 5) * 100, 100),
    },
    // Milestone Badges
    {
      id: 'milestone-1',
      name: 'Challenger',
      description: 'Unlock Milestone 1',
      icon: Medal,
      requirement: { type: 'milestone', value: 1 },
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10 border-emerald-500/20',
      unlocked: stats.currentMilestone >= 1,
      category: 'milestone',
      progress: Math.min((stats.currentMilestone / 1) * 100, 100),
    },
    {
      id: 'milestone-2',
      name: 'Contender',
      description: 'Unlock Milestone 2',
      icon: Award,
      requirement: { type: 'milestone', value: 2 },
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10 border-blue-500/20',
      unlocked: stats.currentMilestone >= 2,
      category: 'milestone',
      progress: Math.min((stats.currentMilestone / 2) * 100, 100),
    },
    {
      id: 'milestone-3',
      name: 'Champion',
      description: 'Unlock Milestone 3',
      icon: Trophy,
      requirement: { type: 'milestone', value: 3 },
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10 border-purple-500/20',
      unlocked: stats.currentMilestone >= 3,
      category: 'milestone',
      progress: Math.min((stats.currentMilestone / 3) * 100, 100),
    },
    {
      id: 'milestone-4',
      name: 'Legend',
      description: 'Unlock all 4 Milestones',
      icon: Crown,
      requirement: { type: 'milestone', value: 4 },
      color: 'text-yellow-400',
      bgColor: 'bg-gradient-to-br from-yellow-500/20 to-amber-500/20 border-yellow-500/30',
      unlocked: stats.currentMilestone >= 4,
      category: 'milestone',
      progress: Math.min((stats.currentMilestone / 4) * 100, 100),
    },
    // Leaderboard Badges
    {
      id: 'top-50',
      name: 'Rising Star',
      description: 'Reach Top 50 on leaderboard',
      icon: Star,
      requirement: { type: 'leaderboard', value: 50 },
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10 border-cyan-500/20',
      unlocked: stats.leaderboardPosition > 0 && stats.leaderboardPosition <= 50,
      category: 'leaderboard',
      progress: stats.leaderboardPosition > 0 ? Math.min(((51 - stats.leaderboardPosition) / 50) * 100, 100) : 0,
    },
    {
      id: 'top-10',
      name: 'Elite Trader',
      description: 'Reach Top 10 on leaderboard',
      icon: Trophy,
      requirement: { type: 'leaderboard', value: 10 },
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10 border-amber-500/20',
      unlocked: stats.leaderboardPosition > 0 && stats.leaderboardPosition <= 10,
      category: 'leaderboard',
      progress: stats.leaderboardPosition > 0 ? Math.min(((11 - stats.leaderboardPosition) / 10) * 100, 100) : 0,
    },
    {
      id: 'top-3',
      name: 'Trading Master',
      description: 'Reach Top 3 on leaderboard',
      icon: Crown,
      requirement: { type: 'leaderboard', value: 3 },
      color: 'text-yellow-400',
      bgColor: 'bg-gradient-to-br from-yellow-500/20 to-amber-500/20 border-yellow-500/30',
      unlocked: stats.leaderboardPosition > 0 && stats.leaderboardPosition <= 3,
      category: 'leaderboard',
      progress: stats.leaderboardPosition > 0 ? Math.min(((4 - stats.leaderboardPosition) / 3) * 100, 100) : 0,
    },
    // Referral Badges
    {
      id: 'first-referral',
      name: 'First Steps',
      description: 'Complete your first referral',
      icon: Gift,
      requirement: { type: 'referrals', value: 1 },
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10 border-blue-500/20',
      unlocked: stats.totalReferrals >= 1,
      category: 'referral',
      progress: Math.min((stats.totalReferrals / 1) * 100, 100),
    },
    {
      id: 'referral-5',
      name: 'Rising Influencer',
      description: 'Refer 5 friends',
      icon: Zap,
      requirement: { type: 'referrals', value: 5 },
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10 border-purple-500/20',
      unlocked: stats.totalReferrals >= 5,
      category: 'referral',
      progress: Math.min((stats.totalReferrals / 5) * 100, 100),
    },
    {
      id: 'referral-25',
      name: 'Community Builder',
      description: 'Refer 25 friends',
      icon: Trophy,
      requirement: { type: 'referrals', value: 25 },
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10 border-amber-500/20',
      unlocked: stats.totalReferrals >= 25,
      category: 'referral',
      progress: Math.min((stats.totalReferrals / 25) * 100, 100),
    },
  ];

  const badges = getBadges();
  const tradingBadges = badges.filter(b => b.category === 'trading');
  const milestoneBadges = badges.filter(b => b.category === 'milestone');
  const leaderboardBadges = badges.filter(b => b.category === 'leaderboard');
  const referralBadges = badges.filter(b => b.category === 'referral');
  const unlockedCount = badges.filter(b => b.unlocked).length;

  const handleShareBadge = (badge: TradingBadge) => {
    const shareText = `🎉 I just unlocked the "${badge.name}" badge on TraderEdge Pro! 🚀`;
    const shareUrl = 'https://traderedge.pro';
    
    if (navigator.share) {
      navigator.share({
        title: `${badge.name} Badge Unlocked!`,
        text: shareText,
        url: shareUrl,
      }).catch(() => {});
    } else {
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
      window.open(twitterUrl, '_blank', 'width=550,height=420');
      toast.success('Opening Twitter to share...');
    }
  };

  const renderBadgeCard = (badge: TradingBadge) => {
    const BadgeIcon = badge.icon;
    
    return (
      <motion.div
        key={badge.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "relative p-4 rounded-xl border transition-all duration-300",
          badge.unlocked 
            ? `${badge.bgColor} hover:scale-105` 
            : "bg-muted/30 border-muted opacity-60"
        )}
      >
        {badge.unlocked && (
          <>
            <div className="absolute -top-1 -right-1">
              <Sparkles className="w-4 h-4 text-yellow-500 animate-pulse" />
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="absolute top-2 right-2 h-6 w-6 p-0"
              onClick={() => handleShareBadge(badge)}
            >
              <Share2 className="w-3 h-3" />
            </Button>
          </>
        )}
        
        <div className="flex items-start gap-3">
          <div className={cn(
            "p-3 rounded-lg",
            badge.unlocked ? badge.bgColor : "bg-muted"
          )}>
            {badge.unlocked ? (
              <BadgeIcon className={cn("w-6 h-6", badge.color)} />
            ) : (
              <Lock className="w-6 h-6 text-muted-foreground" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className={cn(
                "font-semibold",
                !badge.unlocked && "text-muted-foreground"
              )}>
                {badge.name}
              </p>
              {badge.unlocked && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  ✓
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {badge.description}
            </p>
            
            {!badge.unlocked && (
              <div className="mt-2">
                <Progress value={badge.progress} className="h-1.5" />
                <p className="text-[10px] text-muted-foreground mt-1">
                  {badge.progress.toFixed(0)}% complete
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  const renderSection = (title: string, sectionBadges: TradingBadge[], icon: LucideIcon) => {
    const Icon = icon;
    const unlockedInSection = sectionBadges.filter(b => b.unlocked).length;
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Icon className="w-5 h-5 text-primary" />
            {title}
          </h2>
          <span className="text-sm text-muted-foreground">
            {unlockedInSection}/{sectionBadges.length} unlocked
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sectionBadges.map(renderBadgeCard)}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-24">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
              <Award className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold">Achievements</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Track your trading progress and unlock badges as you reach new milestones
            </p>
          </div>

          {/* Overall Progress */}
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="text-center md:text-left">
                  <h3 className="text-2xl font-bold">{unlockedCount}/{badges.length}</h3>
                  <p className="text-muted-foreground">Badges Unlocked</p>
                </div>
                <div className="flex-1 max-w-md w-full">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Overall Progress</span>
                    <span className="font-medium">{Math.round((unlockedCount / badges.length) * 100)}%</span>
                  </div>
                  <Progress value={(unlockedCount / badges.length) * 100} className="h-3" />
                </div>
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-lg font-bold">{stats.totalTrades}</p>
                    <p className="text-xs text-muted-foreground">Trades</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold">{stats.winRate.toFixed(0)}%</p>
                    <p className="text-xs text-muted-foreground">Win Rate</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold">M{stats.currentMilestone}</p>
                    <p className="text-xs text-muted-foreground">Milestone</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold">{stats.totalReferrals}</p>
                    <p className="text-xs text-muted-foreground">Referrals</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Badge Sections */}
          <div className="space-y-8">
            {renderSection('Trading Badges', tradingBadges, Target)}
            {renderSection('Milestone Badges', milestoneBadges, Medal)}
            {renderSection('Leaderboard Badges', leaderboardBadges, Trophy)}
            {renderSection('Referral Badges', referralBadges, Gift)}
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default AchievementsPage;
