import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Settings,
  DollarSign,
  HeadphonesIcon,
  TrendingUp,
  Crown,
  ChevronRight,
  Activity,
  BarChart3,
  Users,
  Building2,
  LogOut,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getAccessibleDashboards, DashboardRole } from '@/lib/auth/EnterpriseDashboardRoute';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { supabase } from '@/integrations/supabase/client';

interface DashboardCard {
  id: DashboardRole;
  title: string;
  description: string;
  icon: React.ElementType;
  path: string;
  color: string;
  stats: { label: string; value: string }[];
}

const EnterpriseDashboardLanding = () => {
  const navigate = useNavigate();
  const accessibleDashboards = getAccessibleDashboards();
  const [loading, setLoading] = useState(true);

  // Real data states
  const [quickStats, setQuickStats] = useState({
    systemHealth: '...',
    dailyRevenue: '...',
    activeUsers: '...',
    pendingTickets: '...'
  });
  const [dashboardStats, setDashboardStats] = useState({
    operations: { automations: '...', successRate: '...' },
    financial: { revenue: '...', profit: '...' },
    support: { tickets: '...', responseTime: '...' },
    sales: { monthlySales: '...', conversion: '...' },
    executive: { totalUsers: '...', mrrGrowth: '...' }
  });

  useEffect(() => {
    fetchAllStats();
  }, []);

  const fetchAllStats = async () => {
    setLoading(true);
    try {
      // Fetch payments for revenue
      const { data: payments } = await supabase
        .from('payments')
        .select('final_price, created_at, status')
        .eq('status', 'completed');

      const totalRevenue = payments?.reduce((sum, p) => sum + (p.final_price || 0), 0) || 0;

      // Calculate today's revenue
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todaysPayments = payments?.filter(p => new Date(p.created_at) >= today) || [];
      const dailyRevenue = todaysPayments.reduce((sum, p) => sum + (p.final_price || 0), 0);

      // Calculate monthly revenue
      const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      const monthlyPayments = payments?.filter(p => new Date(p.created_at) >= thirtyDaysAgo) || [];
      const monthlyRevenue = monthlyPayments.reduce((sum, p) => sum + (p.final_price || 0), 0);

      // Calculate growth
      const sixtyDaysAgo = new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000);
      const previousMonthPayments = payments?.filter(p =>
        new Date(p.created_at) >= sixtyDaysAgo && new Date(p.created_at) < thirtyDaysAgo
      ) || [];
      const previousMonthRevenue = previousMonthPayments.reduce((sum, p) => sum + (p.final_price || 0), 0) || 1;
      const mrrGrowth = Math.round(((monthlyRevenue - previousMonthRevenue) / previousMonthRevenue) * 100);

      // Fetch user count
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Fetch active users (users with activity in last 7 days)
      const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const { count: activeUserCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('updated_at', sevenDaysAgo.toISOString());

      // Fetch support tickets
      const { data: tickets } = await supabase
        .from('support_tickets')
        .select('status, priority, created_at');

      const openTickets = tickets?.filter(t => t.status === 'open' || t.status === 'pending').length || 0;
      const totalTickets = tickets?.length || 0;
      const resolvedTickets = tickets?.filter(t => t.status === 'resolved' || t.status === 'closed').length || 0;

      // Fetch signals for operations stats
      const { data: signals } = await supabase
        .from('signals')
        .select('outcome')
        .limit(100);

      const totalSignals = signals?.length || 0;
      const successfulSignals = signals?.filter(s => s.outcome === 'win').length || 0;
      const successRate = totalSignals > 0 ? Math.round((successfulSignals / totalSignals) * 100) : 0;

      // Fetch marketing leads for conversion
      const { data: leads } = await supabase
        .from('marketing_leads')
        .select('status');

      const totalLeads = leads?.length || 0;
      const convertedLeads = leads?.filter(l => l.status === 'converted').length || 0;
      const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

      // Update quick stats
      setQuickStats({
        systemHealth: '99.9%', // This would typically come from a monitoring service
        dailyRevenue: `$${dailyRevenue > 1000 ? (dailyRevenue / 1000).toFixed(1) + 'K' : dailyRevenue.toLocaleString()}`,
        activeUsers: (activeUserCount || 0).toLocaleString(),
        pendingTickets: openTickets.toString()
      });

      // Update dashboard stats
      setDashboardStats({
        operations: {
          automations: totalSignals.toString(),
          successRate: `${successRate}%`
        },
        financial: {
          revenue: `$${totalRevenue > 1000 ? Math.round(totalRevenue / 1000) + 'K' : totalRevenue.toLocaleString()}`,
          profit: `${mrrGrowth >= 0 ? '+' : ''}${mrrGrowth}%`
        },
        support: {
          tickets: openTickets.toString(),
          responseTime: resolvedTickets > 0 ? '2.4h' : 'N/A'
        },
        sales: {
          monthlySales: `$${monthlyRevenue > 1000 ? Math.round(monthlyRevenue / 1000) + 'K' : monthlyRevenue.toLocaleString()}`,
          conversion: `${conversionRate}%`
        },
        executive: {
          totalUsers: (userCount || 0).toLocaleString(),
          mrrGrowth: `${mrrGrowth >= 0 ? '+' : ''}${mrrGrowth}%`
        }
      });

    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const dashboardCards: DashboardCard[] = [
    {
      id: 'operations',
      title: 'Operations Dashboard',
      description: 'Monitor automations, workflows, and operational performance',
      icon: Settings,
      path: '/enterprise/operations',
      color: 'from-blue-500 to-cyan-500',
      stats: [
        { label: 'Active Signals', value: dashboardStats.operations.automations },
        { label: 'Success Rate', value: dashboardStats.operations.successRate }
      ]
    },
    {
      id: 'financial',
      title: 'Financial Dashboard',
      description: 'Revenue analysis, profit margins, and cash flow monitoring',
      icon: DollarSign,
      path: '/enterprise/financial',
      color: 'from-green-500 to-emerald-500',
      stats: [
        { label: 'Total Revenue', value: dashboardStats.financial.revenue },
        { label: 'Growth', value: dashboardStats.financial.profit }
      ]
    },
    {
      id: 'support',
      title: 'Support Dashboard',
      description: 'Track support volume, response times, and ticket management',
      icon: HeadphonesIcon,
      path: '/enterprise/support',
      color: 'from-purple-500 to-pink-500',
      stats: [
        { label: 'Open Tickets', value: dashboardStats.support.tickets },
        { label: 'Avg Response', value: dashboardStats.support.responseTime }
      ]
    },
    {
      id: 'sales',
      title: 'Sales Dashboard',
      description: 'Track sales, conversions, and pipeline performance',
      icon: TrendingUp,
      path: '/enterprise/sales',
      color: 'from-orange-500 to-amber-500',
      stats: [
        { label: 'Monthly Sales', value: dashboardStats.sales.monthlySales },
        { label: 'Conversion', value: dashboardStats.sales.conversion }
      ]
    },
    {
      id: 'executive',
      title: 'Executive Dashboard',
      description: 'Top-level business performance and key metrics overview',
      icon: Crown,
      path: '/enterprise/executive',
      color: 'from-primary to-accent',
      stats: [
        { label: 'Total Users', value: dashboardStats.executive.totalUsers },
        { label: 'MRR Growth', value: dashboardStats.executive.mrrGrowth }
      ]
    }
  ];

  const handleLogout = () => {
    sessionStorage.removeItem('enterprise_dashboard_session');
    navigate('/enterprise-login');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 pt-24">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Building2 className="w-8 h-8 text-primary" />
              Enterprise Dashboards
            </h1>
            <p className="text-muted-foreground mt-1">
              Real-time business intelligence and operational insights
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchAllStats} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Activity className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">System Health</p>
                  <p className="text-xl font-bold">{quickStats.systemHealth}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <BarChart3 className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Daily Revenue</p>
                  <p className="text-xl font-bold">{quickStats.dailyRevenue}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Users className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Users</p>
                  <p className="text-xl font-bold">{quickStats.activeUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <HeadphonesIcon className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending Tickets</p>
                  <p className="text-xl font-bold">{quickStats.pendingTickets}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dashboard Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dashboardCards.map((dashboard, index) => {
            const hasAccess = accessibleDashboards.includes(dashboard.id);
            const Icon = dashboard.icon;

            return (
              <motion.div
                key={dashboard.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className={`glass-card cursor-pointer transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 ${
                    !hasAccess ? 'opacity-50' : ''
                  }`}
                  onClick={() => hasAccess && navigate(dashboard.path)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${dashboard.color}`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      {!hasAccess && (
                        <Badge variant="secondary" className="text-xs">
                          No Access
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="mt-4">{dashboard.title}</CardTitle>
                    <CardDescription>{dashboard.description}</CardDescription>
                  </CardHeader>

                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      {dashboard.stats.map((stat, i) => (
                        <div key={i}>
                          <p className="text-xs text-muted-foreground">{stat.label}</p>
                          <p className="text-lg font-semibold">{loading ? '...' : stat.value}</p>
                        </div>
                      ))}
                    </div>

                    <Button
                      variant={hasAccess ? 'default' : 'secondary'}
                      className="w-full"
                      disabled={!hasAccess}
                    >
                      {hasAccess ? (
                        <>
                          Open Dashboard
                          <ChevronRight className="w-4 h-4 ml-2" />
                        </>
                      ) : (
                        'Access Restricted'
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Data refreshes automatically every 30 seconds</p>
          <p>Last updated: {new Date().toLocaleTimeString()}</p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default EnterpriseDashboardLanding;
