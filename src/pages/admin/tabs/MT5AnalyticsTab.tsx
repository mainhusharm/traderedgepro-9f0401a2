import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, Clock, DollarSign, CheckCircle, 
  XCircle, Loader2, BarChart3, PieChart, Target
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

interface AnalyticsData {
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  cancelledOrders: number;
  completionRate: number;
  avgDevelopmentDays: number;
  totalRevenue: number;
  pendingRevenue: number;
  monthlyRevenue: { month: string; revenue: number }[];
  ordersByStatus: { status: string; count: number }[];
  ordersByPlan: { plan: string; count: number; revenue: number }[];
  recentActivity: { date: string; completions: number; revenue: number }[];
}

const MT5AnalyticsTab = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      // Fetch all orders
      const { data: orders, error: ordersError } = await supabase
        .from('mt5_orders')
        .select('*');

      if (ordersError) throw ordersError;

      // Fetch all payments
      const { data: payments, error: paymentsError } = await supabase
        .from('mt5_payments')
        .select('*');

      if (paymentsError) throw paymentsError;

      // Calculate metrics
      const totalOrders = orders?.length || 0;
      const completedOrders = orders?.filter(o => o.status === 'completed').length || 0;
      const pendingOrders = orders?.filter(o => ['pending', 'in-progress'].includes(o.status)).length || 0;
      const cancelledOrders = orders?.filter(o => o.status === 'cancelled').length || 0;
      const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

      // Calculate average development time (in days)
      const completedWithDates = orders?.filter(o => o.status === 'completed' && o.created_at) || [];
      let avgDays = 0;
      if (completedWithDates.length > 0) {
        const totalDays = completedWithDates.reduce((sum, order) => {
          const created = new Date(order.created_at);
          const updated = new Date(order.updated_at);
          const days = Math.ceil((updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
          return sum + days;
        }, 0);
        avgDays = totalDays / completedWithDates.length;
      }

      // Calculate revenue
      const verifiedPayments = payments?.filter(p => p.status === 'verified') || [];
      const pendingPayments = payments?.filter(p => p.status === 'pending') || [];
      const totalRevenue = verifiedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const pendingRevenue = pendingPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

      // Orders by status
      const statusCounts: Record<string, number> = {};
      orders?.forEach(o => {
        statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
      });
      const ordersByStatus = Object.entries(statusCounts).map(([status, count]) => ({ status, count }));

      // Orders by plan
      const planData: Record<string, { count: number; revenue: number }> = {};
      orders?.forEach(o => {
        if (!planData[o.plan_type]) {
          planData[o.plan_type] = { count: 0, revenue: 0 };
        }
        planData[o.plan_type].count += 1;
        planData[o.plan_type].revenue += o.amount || 0;
      });
      const ordersByPlan = Object.entries(planData).map(([plan, data]) => ({ 
        plan, 
        count: data.count, 
        revenue: data.revenue 
      }));

      // Monthly revenue (last 6 months)
      const monthlyData: Record<string, number> = {};
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = date.toLocaleString('default', { month: 'short', year: '2-digit' });
        monthlyData[monthKey] = 0;
      }
      verifiedPayments.forEach(p => {
        const date = new Date(p.created_at);
        const monthKey = date.toLocaleString('default', { month: 'short', year: '2-digit' });
        if (monthlyData.hasOwnProperty(monthKey)) {
          monthlyData[monthKey] += p.amount || 0;
        }
      });
      const monthlyRevenue = Object.entries(monthlyData).map(([month, revenue]) => ({ month, revenue }));

      // Recent activity (last 7 days)
      const recentActivity: { date: string; completions: number; revenue: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayCompletions = orders?.filter(o => 
          o.status === 'completed' && 
          o.updated_at.startsWith(dateStr)
        ).length || 0;
        const dayRevenue = verifiedPayments.filter(p => 
          p.created_at.startsWith(dateStr)
        ).reduce((sum, p) => sum + (p.amount || 0), 0);
        recentActivity.push({
          date: new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' }),
          completions: dayCompletions,
          revenue: dayRevenue,
        });
      }

      setAnalytics({
        totalOrders,
        completedOrders,
        pendingOrders,
        cancelledOrders,
        completionRate,
        avgDevelopmentDays: avgDays,
        totalRevenue,
        pendingRevenue,
        monthlyRevenue,
        ordersByStatus,
        ordersByPlan,
        recentActivity,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!analytics) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in-progress': return 'bg-blue-500';
      case 'pending': return 'bg-yellow-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold">MT5 Bot Development Analytics</h2>
        <p className="text-sm text-muted-foreground">Order completion rates, development time, and revenue metrics</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-card/50 border-white/[0.08]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completion Rate</p>
                  <p className="text-3xl font-bold text-green-500 mt-1">
                    {analytics.completionRate.toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {analytics.completedOrders} of {analytics.totalOrders} orders
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-green-500/10">
                  <Target className="w-6 h-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-card/50 border-white/[0.08]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg. Development Time</p>
                  <p className="text-3xl font-bold text-blue-500 mt-1">
                    {analytics.avgDevelopmentDays.toFixed(1)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">days per order</p>
                </div>
                <div className="p-3 rounded-xl bg-blue-500/10">
                  <Clock className="w-6 h-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-card/50 border-white/[0.08]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-3xl font-bold text-green-500 mt-1">
                    ${analytics.totalRevenue.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">verified payments</p>
                </div>
                <div className="p-3 rounded-xl bg-green-500/10">
                  <DollarSign className="w-6 h-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-card/50 border-white/[0.08]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Revenue</p>
                  <p className="text-3xl font-bold text-yellow-500 mt-1">
                    ${analytics.pendingRevenue.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">awaiting verification</p>
                </div>
                <div className="p-3 rounded-xl bg-yellow-500/10">
                  <Loader2 className="w-6 h-6 text-yellow-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders by Status */}
        <Card className="bg-card/50 border-white/[0.08]">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <PieChart className="w-5 h-5 text-primary" />
              Orders by Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.ordersByStatus.map((item) => (
                <div key={item.status} className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(item.status)}`} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="capitalize text-sm">{item.status}</span>
                      <span className="text-sm font-medium">{item.count}</span>
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full ${getStatusColor(item.status)}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${(item.count / analytics.totalOrders) * 100}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Revenue by Plan */}
        <Card className="bg-card/50 border-white/[0.08]">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-accent" />
              Revenue by Plan Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.ordersByPlan.map((item, index) => {
                const maxRevenue = Math.max(...analytics.ordersByPlan.map(p => p.revenue));
                const colors = ['bg-primary', 'bg-accent', 'bg-purple-500', 'bg-cyan-500'];
                return (
                  <div key={item.plan} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="capitalize text-sm">{item.plan}</span>
                      <span className="text-sm font-medium">${item.revenue.toLocaleString()}</span>
                    </div>
                    <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full ${colors[index % colors.length]}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${(item.revenue / maxRevenue) * 100}%` }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">{item.count} orders</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Revenue Trend */}
      <Card className="bg-card/50 border-white/[0.08]">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            Monthly Revenue Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between gap-4 h-48">
            {analytics.monthlyRevenue.map((item, index) => {
              const maxRevenue = Math.max(...analytics.monthlyRevenue.map(m => m.revenue));
              const height = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;
              return (
                <div key={item.month} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex-1 flex flex-col justify-end">
                    <motion.div
                      className="w-full bg-gradient-to-t from-primary to-accent rounded-t-lg"
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(height, 5)}%` }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">{item.month}</span>
                  <span className="text-xs font-medium">${item.revenue.toLocaleString()}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-white/[0.08]">
          <CardContent className="p-4 flex items-center gap-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{analytics.completedOrders}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-white/[0.08]">
          <CardContent className="p-4 flex items-center gap-4">
            <Loader2 className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{analytics.pendingOrders}</p>
              <p className="text-xs text-muted-foreground">In Progress</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-white/[0.08]">
          <CardContent className="p-4 flex items-center gap-4">
            <XCircle className="w-8 h-8 text-red-500" />
            <div>
              <p className="text-2xl font-bold">{analytics.cancelledOrders}</p>
              <p className="text-xs text-muted-foreground">Cancelled</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-white/[0.08]">
          <CardContent className="p-4 flex items-center gap-4">
            <BarChart3 className="w-8 h-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{analytics.totalOrders}</p>
              <p className="text-xs text-muted-foreground">Total Orders</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MT5AnalyticsTab;
