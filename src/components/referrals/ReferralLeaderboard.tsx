import { useState, useEffect } from 'react';
import { Trophy, Medal, Crown, Users, TrendingUp, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface LeaderboardEntry {
  rank: number;
  firstName: string | null;
  lastName: string | null;
  referralCount: number;
  totalEarnings: number;
}

const ReferralLeaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      // Fetch top referrers from referral_credits table
      const { data: creditsData, error } = await supabase
        .from('referral_credits')
        .select('user_id, credit_amount')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Aggregate by user
      const userStats: Record<string, { count: number; total: number }> = {};
      creditsData?.forEach(credit => {
        if (!userStats[credit.user_id]) {
          userStats[credit.user_id] = { count: 0, total: 0 };
        }
        userStats[credit.user_id].count += 1;
        userStats[credit.user_id].total += Number(credit.credit_amount);
      });

      // Get user profiles for top 10
      const userIds = Object.keys(userStats);
      if (userIds.length === 0) {
        setLeaderboard([]);
        setIsLoading(false);
        return;
      }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', userIds);

      // Build leaderboard
      const entries: LeaderboardEntry[] = userIds
        .map(userId => {
          const profile = profiles?.find(p => p.user_id === userId);
          return {
            rank: 0,
            firstName: profile?.first_name || null,
            lastName: profile?.last_name || null,
            referralCount: userStats[userId].count,
            totalEarnings: userStats[userId].total,
          };
        })
        .sort((a, b) => b.referralCount - a.referralCount)
        .slice(0, 10)
        .map((entry, index) => ({ ...entry, rank: index + 1 }));

      setLeaderboard(entries);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Medal className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">{rank}</span>;
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/30';
      case 2:
        return 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-gray-400/30';
      case 3:
        return 'bg-gradient-to-r from-amber-600/20 to-orange-600/20 border-amber-600/30';
      default:
        return 'bg-white/5 border-white/10';
    }
  };

  const getInitials = (firstName: string | null, lastName: string | null) => {
    const first = firstName?.[0]?.toUpperCase() || '';
    const last = lastName?.[0]?.toUpperCase() || '';
    return first + last || '?';
  };

  const getDisplayName = (firstName: string | null, lastName: string | null) => {
    if (firstName && lastName) {
      return `${firstName} ${lastName[0]}.`;
    }
    if (firstName) return firstName;
    return 'Anonymous';
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
          <Trophy className="w-5 h-5 text-yellow-500" />
          Top Referrers
        </CardTitle>
        <CardDescription>
          Users with the most successful referrals
        </CardDescription>
      </CardHeader>
      <CardContent>
        {leaderboard.length > 0 ? (
          <div className="space-y-3">
            {leaderboard.map((entry) => (
              <div
                key={entry.rank}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all hover:scale-[1.01] ${getRankBg(entry.rank)}`}
              >
                <div className="w-8 flex items-center justify-center">
                  {getRankIcon(entry.rank)}
                </div>
                
                <Avatar className="w-10 h-10">
                  <AvatarFallback className={`${entry.rank <= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    {getInitials(entry.firstName, entry.lastName)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {getDisplayName(entry.firstName, entry.lastName)}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-3 h-3" />
                    <span>{entry.referralCount} referrals</span>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-bold text-success">${entry.totalEarnings}</p>
                  <p className="text-xs text-muted-foreground">earned</p>
                </div>

                {entry.rank <= 3 && (
                  <Badge variant="outline" className={`
                    ${entry.rank === 1 ? 'border-yellow-500 text-yellow-500' : ''}
                    ${entry.rank === 2 ? 'border-gray-400 text-gray-400' : ''}
                    ${entry.rank === 3 ? 'border-amber-600 text-amber-600' : ''}
                  `}>
                    #{entry.rank}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <TrendingUp className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No Referrals Yet</h3>
            <p className="text-sm text-muted-foreground">
              Be the first to refer friends and climb the leaderboard!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReferralLeaderboard;
