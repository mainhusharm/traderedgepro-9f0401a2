import { useState, useEffect, useRef } from 'react';
import { Award, Star, Zap, Crown, Rocket, Trophy, Lock, Sparkles, Loader2, Share2, type LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AchievementBadge {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  requiredReferrals: number;
  color: string;
  bgColor: string;
  unlocked: boolean;
}

const ReferralBadges = () => {
  const { user } = useAuth();
  const [totalReferrals, setTotalReferrals] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState('Trader');
  const previousBadgeCount = useRef(0);

  useEffect(() => {
    if (user) {
      fetchReferralCount();
      fetchUserName();
    }
  }, [user]);

  const fetchUserName = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('first_name')
      .eq('user_id', user.id)
      .single();
    if (data?.first_name) {
      setUserName(data.first_name);
    }
  };

  const fetchReferralCount = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('referral_credits')
        .select('id')
        .eq('user_id', user.id);

      if (error) throw error;
      const newCount = data?.length || 0;
      
      // Check if new badges were unlocked
      const newBadges = getBadges(newCount);
      const oldBadges = getBadges(previousBadgeCount.current);
      const newlyUnlocked = newBadges.filter(b => b.unlocked).length - oldBadges.filter(b => b.unlocked).length;
      
      if (newlyUnlocked > 0 && previousBadgeCount.current > 0) {
        const unlockedBadge = newBadges.find(b => b.unlocked && !oldBadges.find(ob => ob.id === b.id && ob.unlocked));
        if (unlockedBadge && user.email) {
          sendBadgeNotification(unlockedBadge, newCount);
        }
      }
      
      previousBadgeCount.current = newCount;
      setTotalReferrals(newCount);
    } catch (error) {
      console.error('Error fetching referral count:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendBadgeNotification = async (badge: AchievementBadge, referrals: number) => {
    if (!user?.email) return;
    
    try {
      await supabase.functions.invoke('send-badge-notification', {
        body: {
          email: user.email,
          firstName: userName,
          badgeName: badge.name,
          badgeDescription: badge.description,
          totalReferrals: referrals,
        },
      });
    } catch (error) {
      console.error('Failed to send badge notification:', error);
    }
  };

  const getBadges = (referralCount: number): AchievementBadge[] => [
    {
      id: 'first-referral',
      name: 'First Steps',
      description: 'Complete your first referral',
      icon: Star,
      requiredReferrals: 1,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10 border-blue-500/20',
      unlocked: referralCount >= 1,
    },
    {
      id: 'rising-star',
      name: 'Rising Star',
      description: 'Refer 5 friends successfully',
      icon: Zap,
      requiredReferrals: 5,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10 border-purple-500/20',
      unlocked: referralCount >= 5,
    },
    {
      id: 'influencer',
      name: 'Influencer',
      description: 'Achieve 10 successful referrals',
      icon: Rocket,
      requiredReferrals: 10,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10 border-amber-500/20',
      unlocked: referralCount >= 10,
    },
    {
      id: 'champion',
      name: 'Champion',
      description: 'Reach 25 referrals milestone',
      icon: Trophy,
      requiredReferrals: 25,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10 border-orange-500/20',
      unlocked: referralCount >= 25,
    },
    {
      id: 'legend',
      name: 'Legend',
      description: 'Legendary 50 referrals achievement',
      icon: Crown,
      requiredReferrals: 50,
      color: 'text-yellow-500',
      bgColor: 'bg-gradient-to-br from-yellow-500/20 to-amber-500/20 border-yellow-500/30',
      unlocked: referralCount >= 50,
    },
  ];

  const badges = getBadges(totalReferrals);
  const unlockedCount = badges.filter(b => b.unlocked).length;
  const nextBadge = badges.find(b => !b.unlocked);
  const progressToNext = nextBadge 
    ? Math.min((totalReferrals / nextBadge.requiredReferrals) * 100, 100)
    : 100;

  const handleShareBadge = (badge: AchievementBadge) => {
    const shareText = `🎉 I just unlocked the "${badge.name}" badge on TraderEdge Pro! ${totalReferrals} referrals and counting! 🚀`;
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

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardContent className="p-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-500" />
          Achievement Badges
        </CardTitle>
        <CardDescription>
          Unlock badges by referring more friends
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Summary */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-medium">Your Progress</p>
              <p className="text-sm text-muted-foreground">
                {unlockedCount} of {badges.length} badges unlocked
              </p>
            </div>
            <div className="flex items-center gap-1">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  className={cn(
                    "w-3 h-3 rounded-full",
                    badge.unlocked ? "bg-primary" : "bg-muted"
                  )}
                />
              ))}
            </div>
          </div>
          
          {nextBadge && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Next: {nextBadge.name}
                </span>
                <span className="font-medium">
                  {totalReferrals}/{nextBadge.requiredReferrals}
                </span>
              </div>
              <Progress value={progressToNext} className="h-2" />
            </div>
          )}
        </div>

        {/* Badge Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {badges.map((badge) => {
            const Icon = badge.icon;
            
            return (
              <div
                key={badge.id}
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
                    "p-2 rounded-lg",
                    badge.unlocked ? badge.bgColor : "bg-muted"
                  )}>
                    {badge.unlocked ? (
                      <Icon className={cn("w-6 h-6", badge.color)} />
                    ) : (
                      <Lock className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={cn(
                        "font-semibold truncate",
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
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {badge.description}
                    </p>
                    <p className={cn(
                      "text-xs mt-1 font-medium",
                      badge.unlocked ? badge.color : "text-muted-foreground"
                    )}>
                      {badge.requiredReferrals} referral{badge.requiredReferrals > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                {!badge.unlocked && (
                  <div className="mt-3">
                    <Progress 
                      value={Math.min((totalReferrals / badge.requiredReferrals) * 100, 100)} 
                      className="h-1.5"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1 text-right">
                      {badge.requiredReferrals - totalReferrals} more needed
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Encouragement Message */}
        {totalReferrals === 0 && (
          <div className="text-center py-4 px-6 rounded-xl bg-muted/50 border border-muted">
            <Sparkles className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <p className="font-medium">Start Your Journey</p>
            <p className="text-sm text-muted-foreground">
              Refer your first friend to unlock the "First Steps" badge!
            </p>
          </div>
        )}

        {unlockedCount === badges.length && (
          <div className="text-center py-4 px-6 rounded-xl bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/20">
            <Crown className="w-8 h-8 mx-auto text-yellow-500 mb-2" />
            <p className="font-medium text-yellow-500">Legendary Status!</p>
            <p className="text-sm text-muted-foreground">
              You've unlocked all achievement badges. You're a true champion!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReferralBadges;
