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
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getAccessibleDashboards, DashboardRole } from '@/lib/auth/EnterpriseDashboardRoute';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

interface DashboardCard {
  id: DashboardRole;
  title: string;
  description: string;
  icon: React.ElementType;
  path: string;
  color: string;
  stats: { label: string; value: string }[];
}

const dashboardCards: DashboardCard[] = [
  {
    id: 'operations',
    title: 'Operations Dashboard',
    description: 'Monitor automations, workflows, and operational performance',
    icon: Settings,
    path: '/enterprise/operations',
    color: 'from-blue-500 to-cyan-500',
    stats: [
      { label: 'Active Automations', value: '47' },
      { label: 'Success Rate', value: '98.2%' }
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
      { label: 'Total Revenue', value: '$847K' },
      { label: 'Net Profit', value: '+23%' }
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
      { label: 'Open Tickets', value: '23' },
      { label: 'Avg Response', value: '2.4h' }
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
      { label: 'Monthly Sales', value: '$156K' },
      { label: 'Conversion', value: '12.4%' }
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
      { label: 'Total Users', value: '12,847' },
      { label: 'MRR Growth', value: '+18%' }
    ]
  }
];

const EnterpriseDashboardLanding = () => {
  const navigate = useNavigate();
  const accessibleDashboards = getAccessibleDashboards();

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
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
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
                  <p className="text-xl font-bold">99.9%</p>
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
                  <p className="text-xl font-bold">$28.4K</p>
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
                  <p className="text-xl font-bold">3,847</p>
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
                  <p className="text-xl font-bold">12</p>
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
                          <p className="text-lg font-semibold">{stat.value}</p>
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
