import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Settings,
  Workflow,
  ListTodo,
  AlertTriangle,
  BarChart3,
  Users,
  Receipt,
  LogOut,
  Search,
  Bell,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { supabase } from '@/integrations/supabase/client';

const OperationsDashboard = () => {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  // Real data states
  const [revenue, setRevenue] = useState(0);
  const [revenueGrowth, setRevenueGrowth] = useState(0);
  const [automationData, setAutomationData] = useState<any[]>([]);
  const [failuresData, setFailuresData] = useState<any[]>([]);
  const [transactionsData, setTransactionsData] = useState<any[]>([]);
  const [reportedCases, setReportedCases] = useState({ issues: 0, errors: 0, failures: 0 });
  const [totalUsers, setTotalUsers] = useState(0);
  const [activeSignals, setActiveSignals] = useState(0);

  // Sidebar navigation items
  const sidebarItems = [
    { icon: LayoutDashboard, label: 'Dashboard', id: 'dashboard' },
    { icon: Settings, label: 'Automations', id: 'automations' },
    { icon: Workflow, label: 'Workflows', id: 'workflows' },
    { icon: ListTodo, label: 'Tasks', id: 'tasks' },
    { icon: AlertTriangle, label: 'Failures', id: 'failures' },
    { icon: BarChart3, label: 'Analytics', id: 'analytics' },
    { icon: Users, label: 'Team', id: 'team' },
    { icon: Receipt, label: 'Transactions', id: 'transactions' },
  ];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch total revenue from payments
      const { data: payments } = await supabase
        .from('payments')
        .select('final_price, created_at')
        .eq('status', 'completed');

      const totalRevenue = payments?.reduce((sum, p) => sum + (p.final_price || 0), 0) || 0;
      setRevenue(totalRevenue);

      // Calculate revenue growth (compare last 30 days vs previous 30 days)
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

      const recentRevenue = payments?.filter(p => new Date(p.created_at) >= thirtyDaysAgo).reduce((sum, p) => sum + (p.final_price || 0), 0) || 0;
      const previousRevenue = payments?.filter(p => new Date(p.created_at) >= sixtyDaysAgo && new Date(p.created_at) < thirtyDaysAgo).reduce((sum, p) => sum + (p.final_price || 0), 0) || 1;
      const growth = ((recentRevenue - previousRevenue) / previousRevenue * 100);
      setRevenueGrowth(Math.round(growth));

      // Fetch automation/signal data by day of week
      const { data: signals } = await supabase
        .from('signals')
        .select('created_at, outcome')
        .order('created_at', { ascending: false })
        .limit(500);

      // Group signals by day
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const signalsByDay = dayNames.map(day => ({ day, value: 0 }));
      signals?.forEach(signal => {
        const dayIndex = new Date(signal.created_at).getDay();
        signalsByDay[dayIndex].value++;
      });
      setAutomationData(signalsByDay);
      setActiveSignals(signals?.length || 0);

      // Fetch support tickets for failures/issues
      const { data: tickets } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      const failuresList = tickets?.map(ticket => ({
        type: ticket.subject || 'Unknown Issue',
        time: new Date(ticket.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        status: ticket.status === 'resolved' ? 'resolved' : ticket.priority === 'urgent' ? 'error' : ticket.priority === 'high' ? 'warning' : 'pending'
      })) || [];
      setFailuresData(failuresList.slice(0, 6));

      // Count issues by status
      const issues = tickets?.filter(t => t.priority === 'low' || t.priority === 'medium').length || 0;
      const errors = tickets?.filter(t => t.priority === 'high').length || 0;
      const failures = tickets?.filter(t => t.priority === 'urgent').length || 0;
      setReportedCases({ issues, errors, failures });

      // Fetch recent transactions/payments
      const { data: recentPayments } = await supabase
        .from('payments')
        .select('*, profiles(first_name, last_name)')
        .order('created_at', { ascending: false })
        .limit(10);

      const txnData = recentPayments?.map(p => ({
        product: p.plan_name || 'Subscription',
        user: p.profiles?.first_name ? `${p.profiles.first_name} ${p.profiles.last_name?.charAt(0) || ''}.` : 'User',
        status: p.status === 'completed' ? 'Completed' : 'In-Progress',
        date: new Date(p.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
        amount: `$${p.final_price?.toFixed(2) || '0.00'}`
      })) || [];
      setTransactionsData(txnData);

      // Fetch total users
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      setTotalUsers(userCount || 0);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'text-green-500';
      case 'In-Progress': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  const getFailureIcon = (status: string) => {
    switch (status) {
      case 'resolved': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const revenuePercentage = Math.min(Math.round((revenue / 500000) * 100), 100);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      {/* Sidebar */}
      <aside className={`${sidebarCollapsed ? 'w-16' : 'w-56'} bg-white border-r border-gray-200 flex flex-col transition-all duration-300`}>
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </div>
            {!sidebarCollapsed && <span className="font-semibold text-gray-800">TraderEdge Ops</span>}
          </div>
        </div>

        <nav className="flex-1 p-2">
          {sidebarItems.map((item, index) => (
            <button
              key={index}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors ${
                activeTab === item.id
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {!sidebarCollapsed && <span className="text-sm font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-2 border-t border-gray-100">
          <button
            onClick={() => {
              sessionStorage.removeItem('enterprise_dashboard_session');
              navigate('/enterprise-login');
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50"
          >
            <LogOut className="w-5 h-5" />
            {!sidebarCollapsed && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search operations..."
                className="pl-10 w-64 bg-gray-50 border-gray-200"
              />
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={fetchDashboardData} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <button className="relative">
                <Bell className="w-5 h-5 text-gray-500" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>
              <div className="flex items-center gap-2">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">OP</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">Operations</span>
                <span className="text-xs text-gray-400">Admin</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <div className="grid grid-cols-12 gap-6">
              {/* Operational Overview */}
              <Card className="col-span-3 bg-white shadow-sm border-gray-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Operational Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Revenue Generated</span>
                        <Badge className={`${revenueGrowth >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'} text-xs`}>
                          {revenueGrowth >= 0 ? '+' : ''}{revenueGrowth}%
                        </Badge>
                      </div>
                      <p className="text-2xl font-bold text-gray-800">${revenue.toLocaleString()}</p>
                      <p className="text-xs text-gray-400">From {transactionsData.length} transactions</p>
                    </div>

                    <div>
                      <span className="text-xs text-gray-500">Total Users</span>
                      <p className="text-xl font-bold text-gray-800">{totalUsers.toLocaleString()}</p>
                    </div>

                    <div className="flex items-center justify-center">
                      <div className="relative w-32 h-32">
                        <svg className="w-full h-full -rotate-90">
                          <circle cx="64" cy="64" r="56" fill="none" stroke="#e5e7eb" strokeWidth="12" />
                          <circle
                            cx="64"
                            cy="64"
                            r="56"
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth="12"
                            strokeDasharray={`${revenuePercentage * 3.52} 352`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-xs text-gray-400">Goal</span>
                          <span className="text-2xl font-bold text-gray-800">{revenuePercentage}%</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-center text-xs text-gray-500">Revenue Target: $500K</p>
                  </div>
                </CardContent>
              </Card>

              {/* Signal/Automation Performance */}
              <Card className="col-span-5 bg-white shadow-sm border-gray-100">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-600">Signal Activity</CardTitle>
                    <Badge className="bg-blue-100 text-blue-600 text-xs">{activeSignals} Signals</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={automationData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                    <span className="text-xs text-gray-500">Signals by Day of Week</span>
                  </div>
                </CardContent>
              </Card>

              {/* Support Tickets Overview */}
              <Card className="col-span-4 bg-white shadow-sm border-gray-100">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-600">Support Tickets</CardTitle>
                    <span className="text-xs text-gray-400">Recent Activity</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {failuresData.length > 0 ? failuresData.map((failure, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getFailureIcon(failure.status)}
                          <span className="text-sm text-gray-700 truncate max-w-[180px]">{failure.type}</span>
                        </div>
                        <span className="text-xs text-gray-400">{failure.time}</span>
                      </div>
                    )) : (
                      <p className="text-sm text-gray-500 text-center py-4">No recent tickets</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Reported Cases */}
              <Card className="col-span-4 bg-white shadow-sm border-gray-100">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-600">Ticket Summary</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6 mb-4">
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-1">
                        <span className="text-lg font-bold text-gray-700">{reportedCases.issues}</span>
                      </div>
                      <span className="text-xs text-gray-500">Low/Med</span>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mb-1">
                        <span className="text-lg font-bold text-orange-600">{reportedCases.errors}</span>
                      </div>
                      <span className="text-xs text-gray-500">High</span>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-1">
                        <span className="text-lg font-bold text-red-600">{reportedCases.failures}</span>
                      </div>
                      <span className="text-xs text-gray-500">Urgent</span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => navigate('/enterprise/support')}
                  >
                    View All Tickets
                  </Button>
                </CardContent>
              </Card>

              {/* Transactions */}
              <Card className="col-span-8 bg-white shadow-sm border-gray-100">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-600">Recent Transactions</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => navigate('/enterprise/financial')}>
                      View All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-5 text-xs text-gray-500 pb-2 border-b border-gray-100">
                      <span>Plan</span>
                      <span>Customer</span>
                      <span>Status</span>
                      <span>Date</span>
                      <span>Amount</span>
                    </div>
                    {transactionsData.length > 0 ? transactionsData.slice(0, 5).map((txn, index) => (
                      <div key={index} className="grid grid-cols-5 items-center py-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                              {txn.product.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium text-gray-700">{txn.product}</span>
                        </div>
                        <span className="text-sm text-gray-500">{txn.user}</span>
                        <span className={`text-sm font-medium ${getStatusColor(txn.status)}`}>
                          {txn.status}
                        </span>
                        <span className="text-sm text-gray-500">{txn.date}</span>
                        <span className="text-sm font-medium text-gray-700">{txn.amount}</span>
                      </div>
                    )) : (
                      <p className="text-sm text-gray-500 text-center py-4">No transactions found</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default OperationsDashboard;
