import { useState, useEffect, useRef } from 'react';
import { Award, Target, TrendingUp, Trophy, Crown, Zap, Shield, Star, Medal, Flame, Lock, Sparkles, Share2, type LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { callEdgeFunction } from '@/config/api';
import { useAuth } from '@/lib/auth/AuthContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

interface TradingBadge {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  requirement: {
    type: 'trades' | 'winRate' | 'pnl' | 'milestone' | 'streak' | 'leaderboard';
    value: number;
  };
  color: string;
  bgColor: string;
  unlocked: boolean;
  category: 'trading' | 'milestone' | 'leaderboard';
}

const TradingBadges = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const previousUnlockedRef = useRef<Set<string>>(new Set());
  const [stats, setStats] = useState({
    totalTrades: 0,
    winRate: 0,
    totalPnl: 0,
    currentMilestone: 1,
    winStreak: 0,
    leaderboardPosition: 0,
  });

  useEffect(() => {
    if (user) {
      fetchTradingStats();
    }
  }, [user]);

  // Check for newly unlocked badges and show notifications
  const checkNewBadges = (badges: TradingBadge[]) => {
    const currentUnlocked = new Set(badges.filter(b => b.unlocked).map(b => b.id));
    
    badges.forEach(badge => {
      if (badge.unlocked && !previousUnlockedRef.current.has(badge.id)) {
        // New badge unlocked!
        showBadgeUnlockNotification(badge);
      }
    });

    previousUnlockedRef.current = currentUnlocked;
  };

  const showBadgeUnlockNotification = async (badge: TradingBadge) => {
    // Trigger confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    // Show toast notification
    toast.success(
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-lg", badge.bgColor)}>
          <badge.icon className={cn("w-5 h-5", badge.color)} />
        </div>
        <div>
          <p className="font-semibold">🎉 Badge Unlocked!</p>
          <p className="text-sm text-muted-foreground">{badge.name}: {badge.description}</p>
        </div>
      </div>,
      {
        duration: 5000,
      }
    );

    // Send push notification
    if (user) {
      try {
        await callEdgeFunction('send-badge-push', {
          userId: user.id,
          badgeName: badge.name,
          badgeDescription: badge.description,
        });
      } catch (error) {
        console.error('Failed to send badge push notification:', error);
      }
    }
  };

  const fetchTradingStats = async () => {
    if (!user) return;

    try {
      // Fetch from dashboard_data
      const { data: dashboardData } = await supabase
        .from('dashboard_data')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // Fetch signals taken by user
      const { data: signals } = await supabase
        .from('signals')
        .select('*')
        .eq('user_id', user.id)
        .eq('taken_by_user', true);

      const totalTrades = signals?.length || dashboardData?.total_trades || 0;
      const winningTrades = signals?.filter(s => s.outcome === 'target_hit').length || dashboardData?.winning_trades || 0;
      const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
      const totalPnl = signals?.reduce((sum, s) => sum + (s.pnl || 0), 0) || dashboardData?.total_pnl || 0;

      // Get milestone from localStorage
      const accessibleMilestones = JSON.parse(localStorage.getItem(`accessible_milestones_${user.email}`) || '["M1"]');
      const currentMilestone = accessibleMilestones.length;

      // Calculate win streak from recent signals
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

      // Get leaderboard position (simplified - based on total PnL ranking)
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
      });

      // Check for new badges after stats update
      const newBadges = getBadgesWithStats({
        totalTrades,
        winRate,
        totalPnl,
        currentMilestone,
        winStreak,
        leaderboardPosition: leaderboardPosition || 999,
      });
      checkNewBadges(newBadges);
    } catch (error) {
      console.error('Error fetching trading stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getBadgesWithStats = (currentStats: typeof stats): TradingBadge[] => [
    // Trading Badges
    {
      id: 'first-trade',
      name: 'First Trade',
      description: 'Execute your first trade',
      icon: Star,
      requirement: { type: 'trades', value: 1 },
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10 border-blue-500/20',
      unlocked: currentStats.totalTrades >= 1,
      category: 'trading',
    },
    {
      id: 'trader-10',
      name: 'Active Trader',
      description: 'Complete 10 trades',
      icon: Zap,
      requirement: { type: 'trades', value: 10 },
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10 border-cyan-500/20',
      unlocked: currentStats.totalTrades >= 10,
      category: 'trading',
    },
    {
      id: 'trader-50',
      name: 'Seasoned Trader',
      description: 'Complete 50 trades',
      icon: Target,
      requirement: { type: 'trades', value: 50 },
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10 border-purple-500/20',
      unlocked: currentStats.totalTrades >= 50,
      category: 'trading',
    },
    {
      id: 'trader-100',
      name: 'Expert Trader',
      description: 'Complete 100 trades',
      icon: Trophy,
      requirement: { type: 'trades', value: 100 },
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10 border-amber-500/20',
      unlocked: currentStats.totalTrades >= 100,
      category: 'trading',
    },
    {
      id: 'win-rate-60',
      name: 'Consistent',
      description: 'Achieve 60% win rate',
      icon: Shield,
      requirement: { type: 'winRate', value: 60 },
      color: 'text-green-400',
      bgColor: 'bg-green-500/10 border-green-500/20',
      unlocked: currentStats.winRate >= 60 && currentStats.totalTrades >= 10,
      category: 'trading',
    },
    {
      id: 'win-rate-75',
      name: 'Sharp Shooter',
      description: 'Achieve 75% win rate',
      icon: TrendingUp,
      requirement: { type: 'winRate', value: 75 },
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10 border-emerald-500/20',
      unlocked: currentStats.winRate >= 75 && currentStats.totalTrades >= 10,
      category: 'trading',
    },
    {
      id: 'streak-5',
      name: 'Hot Streak',
      description: '5 consecutive winning trades',
      icon: Flame,
      requirement: { type: 'streak', value: 5 },
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10 border-orange-500/20',
      unlocked: currentStats.winStreak >= 5,
      category: 'trading',
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
      unlocked: currentStats.currentMilestone >= 1,
      category: 'milestone',
    },
    {
      id: 'milestone-2',
      name: 'Contender',
      description: 'Unlock Milestone 2',
      icon: Award,
      requirement: { type: 'milestone', value: 2 },
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10 border-blue-500/20',
      unlocked: currentStats.currentMilestone >= 2,
      category: 'milestone',
    },
    {
      id: 'milestone-3',
      name: 'Champion',
      description: 'Unlock Milestone 3',
      icon: Trophy,
      requirement: { type: 'milestone', value: 3 },
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10 border-purple-500/20',
      unlocked: currentStats.currentMilestone >= 3,
      category: 'milestone',
    },
    {
      id: 'milestone-4',
      name: 'Legend',
      description: 'Unlock all 4 Milestones',
      icon: Crown,
      requirement: { type: 'milestone', value: 4 },
      color: 'text-yellow-400',
      bgColor: 'bg-gradient-to-br from-yellow-500/20 to-amber-500/20 border-yellow-500/30',
      unlocked: currentStats.currentMilestone >= 4,
      category: 'milestone',
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
      unlocked: currentStats.leaderboardPosition > 0 && currentStats.leaderboardPosition <= 50,
      category: 'leaderboard',
    },
    {
      id: 'top-10',
      name: 'Elite Trader',
      description: 'Reach Top 10 on leaderboard',
      icon: Trophy,
      requirement: { type: 'leaderboard', value: 10 },
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10 border-amber-500/20',
      unlocked: currentStats.leaderboardPosition > 0 && currentStats.leaderboardPosition <= 10,
      category: 'leaderboard',
    },
    {
      id: 'top-3',
      name: 'Trading Master',
      description: 'Reach Top 3 on leaderboard',
      icon: Crown,
      requirement: { type: 'leaderboard', value: 3 },
      color: 'text-yellow-400',
      bgColor: 'bg-gradient-to-br from-yellow-500/20 to-amber-500/20 border-yellow-500/30',
      unlocked: currentStats.leaderboardPosition > 0 && currentStats.leaderboardPosition <= 3,
      category: 'leaderboard',
    },
  ];

  const badges = getBadgesWithStats(stats);
  const tradingBadges = badges.filter(b => b.category === 'trading');
  const milestoneBadges = badges.filter(b => b.category === 'milestone');
  const leaderboardBadges = badges.filter(b => b.category === 'leaderboard');
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

  const renderBadgeSection = (title: string, sectionBadges: TradingBadge[], icon: LucideIcon) => {
    const Icon = icon;
    const unlockedInSection = sectionBadges.filter(b => b.unlocked).length;
    
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Icon className="w-4 h-4 text-primary" />
            {title}
          </h3>
          <span className="text-xs text-muted-foreground">
            {unlockedInSection}/{sectionBadges.length}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {sectionBadges.map((badge) => {
            const BadgeIcon = badge.icon;
            
            return (
              <div
                key={badge.id}
                className={cn(
                  "relative p-3 rounded-xl border transition-all duration-300",
                  badge.unlocked 
                    ? `${badge.bgColor} hover:scale-105` 
                    : "bg-muted/30 border-muted opacity-60"
                )}
              >
                {badge.unlocked && (
                  <>
                    <div className="absolute -top-1 -right-1">
                      <Sparkles className="w-3 h-3 text-yellow-500 animate-pulse" />
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute top-1 right-1 h-5 w-5 p-0"
                      onClick={() => handleShareBadge(badge)}
                    >
                      <Share2 className="w-2.5 h-2.5" />
                    </Button>
                  </>
                )}
                
                <div className="flex flex-col items-center text-center gap-2">
                  <div className={cn(
                    "p-2 rounded-lg",
                    badge.unlocked ? badge.bgColor : "bg-muted"
                  )}>
                    {badge.unlocked ? (
                      <BadgeIcon className={cn("w-5 h-5", badge.color)} />
                    ) : (
                      <Lock className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  
                  <div>
                    <p className={cn(
                      "text-xs font-semibold",
                      !badge.unlocked && "text-muted-foreground"
                    )}>
                      {badge.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground line-clamp-2">
                      {badge.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardContent className="p-8 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-500" />
          Trading Achievements
        </CardTitle>
        <CardDescription>
          Earn badges for your trading accomplishments
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Summary */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Your Achievements</p>
              <p className="text-sm text-muted-foreground">
                {unlockedCount} of {badges.length} badges unlocked
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">{Math.round((unlockedCount / badges.length) * 100)}%</p>
              <p className="text-xs text-muted-foreground">Complete</p>
            </div>
          </div>
          <Progress value={(unlockedCount / badges.length) * 100} className="h-2 mt-3" />
        </div>

        {/* Badge Sections */}
        {renderBadgeSection('Trading Badges', tradingBadges, Target)}
        {renderBadgeSection('Milestone Badges', milestoneBadges, Medal)}
        {renderBadgeSection('Leaderboard Badges', leaderboardBadges, Trophy)}
      </CardContent>
    </Card>
  );
};

export default TradingBadges;
