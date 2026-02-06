import { useState, useEffect } from 'react';
import { TrendingUp, Users, DollarSign, Target, Loader2, BarChart3, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface MonthlyData {
  month: string;
  referrals: number;
  earnings: number;
}

interface AnalyticsData {
  totalReferrals: number;
  successfulReferrals: number;
  pendingReferrals: number;
  conversionRate: number;
  totalEarnings: number;
  monthlyData: MonthlyData[];
  averagePerMonth: number;
}

const ReferralAnalytics = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user]);

  const fetchAnalytics = async () => {
    if (!user) return;

    try {
      // Fetch all referral credits for this user
      const { data: creditsData, error } = await supabase
        .from('referral_credits')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const credits = creditsData || [];
      
      // Calculate analytics
      const totalReferrals = credits.length;
      const successfulReferrals = credits.filter(c => c.status === 'available' || c.status === 'used').length;
      const pendingReferrals = credits.filter(c => c.status === 'pending').length;
      const conversionRate = totalReferrals > 0 ? (successfulReferrals / totalReferrals) * 100 : 0;
      const totalEarnings = credits.reduce((sum, c) => sum + Number(c.credit_amount), 0);

      // Group by month
      const monthlyMap: Record<string, { referrals: number; earnings: number }> = {};
      
      credits.forEach(credit => {
        const date = new Date(credit.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyMap[monthKey]) {
          monthlyMap[monthKey] = { referrals: 0, earnings: 0 };
        }
        monthlyMap[monthKey].referrals += 1;
        monthlyMap[monthKey].earnings += Number(credit.credit_amount);
      });

      // Generate last 6 months data
      const monthlyData: MonthlyData[] = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthName = date.toLocaleDateString('en-US', { month: 'short' });
        
        monthlyData.push({
          month: monthName,
          referrals: monthlyMap[monthKey]?.referrals || 0,
          earnings: monthlyMap[monthKey]?.earnings || 0,
        });
      }

      const averagePerMonth = totalReferrals / Math.max(Object.keys(monthlyMap).length, 1);

      setAnalytics({
        totalReferrals,
        successfulReferrals,
        pendingReferrals,
        conversionRate,
        totalEarnings,
        monthlyData,
        averagePerMonth,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoading(false);
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

  if (!analytics) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Referrals</p>
                <p className="text-2xl font-bold">{analytics.totalReferrals}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <Target className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Conversion Rate</p>
                <p className="text-2xl font-bold">{analytics.conversionRate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <DollarSign className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Earned</p>
                <p className="text-2xl font-bold">${analytics.totalEarnings}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <TrendingUp className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Monthly Avg</p>
                <p className="text-2xl font-bold">{analytics.averagePerMonth.toFixed(1)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Referral Trends */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="w-5 h-5 text-primary" />
              Referral Trends
            </CardTitle>
            <CardDescription>Monthly referral performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.monthlyData}>
                  <defs>
                    <linearGradient id="colorReferrals" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="referrals"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorReferrals)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Earnings Trends */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="w-5 h-5 text-success" />
              Earnings Trends
            </CardTitle>
            <CardDescription>Monthly earnings from referrals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    formatter={(value) => [`$${value}`, 'Earnings']}
                  />
                  <Bar
                    dataKey="earnings"
                    fill="hsl(var(--success))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Breakdown */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            Referral Status Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-success/10 border border-success/20 text-center">
              <p className="text-3xl font-bold text-success">{analytics.successfulReferrals}</p>
              <p className="text-sm text-muted-foreground mt-1">Successful</p>
            </div>
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
              <p className="text-3xl font-bold text-amber-500">{analytics.pendingReferrals}</p>
              <p className="text-sm text-muted-foreground mt-1">Pending</p>
            </div>
            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 text-center">
              <p className="text-3xl font-bold text-primary">{analytics.totalReferrals}</p>
              <p className="text-sm text-muted-foreground mt-1">Total</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReferralAnalytics;
