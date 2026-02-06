import { useState, useEffect } from 'react';
import { MousePointerClick, Users, TrendingUp, Target, Loader2, Eye, UserCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';

interface ClickStats {
  totalClicks: number;
  uniqueClicks: number;
  conversions: number;
  conversionRate: number;
  recentClicks: { date: string; clicks: number }[];
}

const ReferralClickStats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<ClickStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchClickStats();
    }
  }, [user]);

  const fetchClickStats = async () => {
    if (!user) return;

    try {
      const { data: clicks, error } = await supabase
        .from('referral_clicks')
        .select('*')
        .eq('referrer_user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const allClicks = clicks || [];
      const totalClicks = allClicks.length;
      
      // Count unique fingerprints
      const uniqueFingerprints = new Set(allClicks.map(c => c.visitor_fingerprint).filter(Boolean));
      const uniqueClicks = uniqueFingerprints.size || totalClicks;
      
      // Count conversions
      const conversions = allClicks.filter(c => c.converted).length;
      const conversionRate = totalClicks > 0 ? (conversions / totalClicks) * 100 : 0;

      // Group by date for last 7 days
      const last7Days: Record<string, number> = {};
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateKey = date.toISOString().split('T')[0];
        last7Days[dateKey] = 0;
      }

      allClicks.forEach(click => {
        const dateKey = new Date(click.created_at).toISOString().split('T')[0];
        if (last7Days[dateKey] !== undefined) {
          last7Days[dateKey]++;
        }
      });

      const recentClicks = Object.entries(last7Days).map(([date, clicks]) => ({
        date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
        clicks,
      }));

      setStats({
        totalClicks,
        uniqueClicks,
        conversions,
        conversionRate,
        recentClicks,
      });
    } catch (error) {
      console.error('Error fetching click stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MousePointerClick className="w-5 h-5 text-primary" />
          Link Click Analytics
        </CardTitle>
        <CardDescription>Track views and conversions from your referral link</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
            <Eye className="w-5 h-5 mx-auto mb-2 text-blue-500" />
            <p className="text-2xl font-bold text-blue-500">{stats.totalClicks}</p>
            <p className="text-xs text-muted-foreground">Total Clicks</p>
          </div>
          
          <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center">
            <Users className="w-5 h-5 mx-auto mb-2 text-purple-500" />
            <p className="text-2xl font-bold text-purple-500">{stats.uniqueClicks}</p>
            <p className="text-xs text-muted-foreground">Unique Visitors</p>
          </div>
          
          <div className="p-4 rounded-xl bg-success/10 border border-success/20 text-center">
            <UserCheck className="w-5 h-5 mx-auto mb-2 text-success" />
            <p className="text-2xl font-bold text-success">{stats.conversions}</p>
            <p className="text-xs text-muted-foreground">Conversions</p>
          </div>
          
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
            <Target className="w-5 h-5 mx-auto mb-2 text-amber-500" />
            <p className="text-2xl font-bold text-amber-500">{stats.conversionRate.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">Conversion Rate</p>
          </div>
        </div>

        {/* Mini Chart */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Last 7 Days</h4>
          <div className="flex items-end justify-between gap-1 h-20">
            {stats.recentClicks.map((day, index) => {
              const maxClicks = Math.max(...stats.recentClicks.map(d => d.clicks), 1);
              const height = (day.clicks / maxClicks) * 100;
              
              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-1">
                  <div 
                    className="w-full rounded-t bg-primary/60 transition-all hover:bg-primary"
                    style={{ height: `${Math.max(height, 4)}%` }}
                    title={`${day.clicks} clicks`}
                  />
                  <span className="text-[10px] text-muted-foreground">{day.date}</span>
                </div>
              );
            })}
          </div>
        </div>

        {stats.totalClicks === 0 && (
          <div className="text-center py-4 px-6 rounded-xl bg-muted/50 border border-muted">
            <MousePointerClick className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No clicks yet. Share your referral link to start tracking!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReferralClickStats;
