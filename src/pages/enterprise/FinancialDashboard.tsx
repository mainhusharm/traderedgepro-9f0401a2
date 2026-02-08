import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BarChart3,
  ShoppingCart,
  Users,
  TrendingUp,
  MessageSquare,
  FileText,
  Settings,
  LogOut,
  Search,
  Calendar,
  Plus,
  Download,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
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
import jsPDF from 'jspdf';
import { supabase } from '@/integrations/supabase/client';

const FinancialDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  // Real data states
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [customerStats, setCustomerStats] = useState({ active: 0, inactive: 0 });
  const [orderStats, setOrderStats] = useState({ completed: 0, pending: 0, refunded: 0 });
  const [growthRate, setGrowthRate] = useState(0);
  const [activePlans, setActivePlans] = useState(0);

  // Sidebar navigation items
  const sidebarItems = [
    { icon: LayoutDashboard, label: 'Dashboard', id: 'dashboard' },
    { icon: BarChart3, label: 'Analytics', id: 'analytics' },
    { icon: ShoppingCart, label: 'Orders', id: 'orders' },
    { icon: Users, label: 'Customers', id: 'customers' },
    { icon: TrendingUp, label: 'Revenue', id: 'revenue' },
    { icon: MessageSquare, label: 'Messages', id: 'messages', badge: 0 },
  ];

  const accountItems = [
    { icon: FileText, label: 'Reports', id: 'reports' },
    { icon: Settings, label: 'Settings', id: 'settings' },
  ];

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const fetchFinancialData = async () => {
    setLoading(true);
    try {
      // Fetch all payments
      const { data: payments } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });

      // Calculate totals
      const completedPayments = payments?.filter(p => p.status === 'completed') || [];
      const revenue = completedPayments.reduce((sum, p) => sum + (p.final_price || 0), 0);
      setTotalRevenue(revenue);
      setTotalOrders(completedPayments.length);

      // Estimate profit (assuming 70% margin)
      setTotalProfit(Math.round(revenue * 0.7));

      // Calculate growth rate
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

      const recentRevenue = completedPayments
        .filter(p => new Date(p.created_at) >= thirtyDaysAgo)
        .reduce((sum, p) => sum + (p.final_price || 0), 0);
      const previousRevenue = completedPayments
        .filter(p => new Date(p.created_at) >= sixtyDaysAgo && new Date(p.created_at) < thirtyDaysAgo)
        .reduce((sum, p) => sum + (p.final_price || 0), 0) || 1;

      setGrowthRate(Math.round(((recentRevenue - previousRevenue) / previousRevenue) * 100));

      // Group revenue by month
      const monthlyRevenue: { [key: string]: number } = {};
      completedPayments.forEach(p => {
        const month = new Date(p.created_at).toLocaleDateString('en-US', { month: 'short' });
        monthlyRevenue[month] = (monthlyRevenue[month] || 0) + (p.final_price || 0);
      });

      const revenueChartData = Object.entries(monthlyRevenue).map(([month, value]) => ({
        month,
        value: Math.round(value)
      })).slice(-8);
      setRevenueData(revenueChartData);

      // Order stats
      const completed = payments?.filter(p => p.status === 'completed').length || 0;
      const pending = payments?.filter(p => p.status === 'pending').length || 0;
      const refunded = payments?.filter(p => p.status === 'refunded').length || 0;
      setOrderStats({ completed, pending, refunded });

      // Recent orders with user info
      const { data: recentPayments } = await supabase
        .from('payments')
        .select('*, profiles(first_name, last_name)')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(5);

      const orders = recentPayments?.map(p => ({
        name: p.plan_name || 'Subscription',
        price: `$${p.final_price?.toFixed(2) || '0.00'}`,
        status: 'Complete',
        customer: p.profiles?.first_name || 'Customer'
      })) || [];
      setRecentOrders(orders);

      // Customer stats from memberships
      const { data: memberships } = await supabase
        .from('memberships')
        .select('status');

      const activeMemberships = memberships?.filter(m => m.status === 'active').length || 0;
      const inactiveMemberships = memberships?.filter(m => m.status !== 'active').length || 0;
      setCustomerStats({ active: activeMemberships, inactive: inactiveMemberships });
      setActivePlans(activeMemberships);

      // Count unread messages
      const { count: messageCount } = await supabase
        .from('support_tickets')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'open');

      sidebarItems[5].badge = messageCount || 0;

    } catch (error) {
      console.error('Error fetching financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const today = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    doc.setFontSize(20);
    doc.text(`Financial Report - ${today}`, 20, 20);
    doc.setFontSize(12);
    doc.text(`Total Revenue: $${totalRevenue.toLocaleString()}`, 20, 40);
    doc.text(`Total Orders: ${totalOrders.toLocaleString()}`, 20, 50);
    doc.text(`Total Profit: $${totalProfit.toLocaleString()}`, 20, 60);
    doc.text(`Active Subscriptions: ${activePlans}`, 20, 70);
    doc.text(`Growth Rate: ${growthRate}%`, 20, 80);
    doc.text('', 20, 90);
    doc.text('Order Breakdown:', 20, 100);
    doc.text(`  Completed: ${orderStats.completed}`, 20, 110);
    doc.text(`  Pending: ${orderStats.pending}`, 20, 120);
    doc.text(`  Refunded: ${orderStats.refunded}`, 20, 130);
    doc.save(`financial_report_${today.replace(' ', '_')}.pdf`);
  };

  const performancePercentage = Math.min(Math.round((totalRevenue / 100000) * 100), 100);

  return (
    <div className="min-h-screen bg-[#fef7f4] flex">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-100 flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-gray-800">TraderEdge Finance</span>
          </div>
        </div>

        <div className="p-3">
          <span className="text-xs text-gray-400 uppercase tracking-wider px-3">MENU</span>
        </div>

        <nav className="flex-1 px-2">
          {sidebarItems.map((item, index) => (
            <button
              key={index}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg mb-1 transition-colors ${
                activeTab === item.id
                  ? 'bg-red-50 text-red-500'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <Badge className="bg-red-500 text-white text-xs h-5 w-5 rounded-full p-0 flex items-center justify-center">
                  {item.badge}
                </Badge>
              )}
            </button>
          ))}

          <div className="my-4">
            <span className="text-xs text-gray-400 uppercase tracking-wider px-3">ACCOUNT</span>
          </div>

          {accountItems.map((item, index) => (
            <button
              key={index}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 ${
                activeTab === item.id ? 'bg-red-50 text-red-500' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.label}</span>
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
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white/50 backdrop-blur-sm px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search transactions..."
                className="pl-10 w-64 bg-white border-gray-200"
              />
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={fetchFinancialData} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar className="w-4 h-4" />
                <span>{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</span>
              </div>
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-red-100 text-red-600 text-xs">FN</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Financial Dashboard</h1>
            <p className="text-sm text-gray-500">Real-time financial metrics and analytics</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="w-8 h-8 animate-spin text-red-500" />
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <Card className="bg-white shadow-sm border-0">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Active Plans</p>
                        <p className="text-2xl font-bold text-gray-800">{activePlans}</p>
                        <p className="text-xs text-green-500 flex items-center gap-1 mt-1">
                          <ArrowUpRight className="w-3 h-3" />
                          Active subscriptions
                        </p>
                      </div>
                      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                        <Users className="w-5 h-5 text-red-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white shadow-sm border-0">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Total Orders</p>
                        <p className="text-2xl font-bold text-gray-800">{totalOrders.toLocaleString()}</p>
                        <p className="text-xs text-green-500 flex items-center gap-1 mt-1">
                          <ArrowUpRight className="w-3 h-3" />
                          {orderStats.completed} completed
                        </p>
                      </div>
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <ShoppingCart className="w-5 h-5 text-blue-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white shadow-sm border-0">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Total Revenue</p>
                        <p className="text-2xl font-bold text-gray-800">${totalRevenue.toLocaleString()}</p>
                        <p className={`text-xs flex items-center gap-1 mt-1 ${growthRate >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {growthRate >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          {growthRate >= 0 ? '+' : ''}{growthRate}% growth
                        </p>
                      </div>
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-green-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white shadow-sm border-0">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Est. Profit</p>
                        <p className="text-2xl font-bold text-gray-800">${totalProfit.toLocaleString()}</p>
                        <p className="text-xs text-green-500 flex items-center gap-1 mt-1">
                          <ArrowUpRight className="w-3 h-3" />
                          70% margin
                        </p>
                      </div>
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 text-purple-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-12 gap-6">
                {/* Total Revenue Chart */}
                <Card className="col-span-5 bg-white shadow-sm border-0">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-gray-800">${totalRevenue.toLocaleString()}</p>
                        <CardTitle className="text-sm font-medium text-gray-500">Revenue by Month</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[200px]">
                      {revenueData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={revenueData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                            <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                            <Bar dataKey="value" fill="#f87171" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">
                          No revenue data available
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Performance Gauge */}
                <Card className="col-span-3 bg-white shadow-sm border-0">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Performance</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center justify-center">
                    <div className="relative w-32 h-32">
                      <svg className="w-full h-full -rotate-90">
                        <circle cx="64" cy="64" r="56" fill="none" stroke="#fee2e2" strokeWidth="12" />
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          fill="none"
                          stroke="#f87171"
                          strokeWidth="12"
                          strokeDasharray={`${performancePercentage * 3.52} 352`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-xs text-gray-400">Target: $100K</span>
                        <span className="text-3xl font-bold text-gray-800">{performancePercentage}%</span>
                      </div>
                    </div>
                    <div className="mt-4 text-xs text-gray-500 text-center">
                      <p>Progress towards revenue goal</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Order Stats & Recent Orders */}
                <Card className="col-span-4 bg-white shadow-sm border-0">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2 mb-4">
                      <div className="flex-1 bg-green-50 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-green-500">{orderStats.completed}</p>
                        <p className="text-xs text-gray-500">Completed</p>
                      </div>
                      <div className="flex-1 bg-yellow-50 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-yellow-500">{orderStats.pending}</p>
                        <p className="text-xs text-gray-500">Pending</p>
                      </div>
                      <div className="flex-1 bg-red-50 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-red-500">{orderStats.refunded}</p>
                        <p className="text-xs text-gray-500">Refunded</p>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Recent Orders</p>
                      <div className="space-y-3">
                        {recentOrders.length > 0 ? recentOrders.map((order, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                                <ShoppingCart className="w-4 h-4 text-red-500" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-700">{order.name}</p>
                                <p className="text-xs text-gray-400">{order.customer}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-gray-700">{order.price}</p>
                              <Badge className="bg-green-100 text-green-600 text-xs">{order.status}</Badge>
                            </div>
                          </div>
                        )) : (
                          <p className="text-sm text-gray-400 text-center">No recent orders</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Reports */}
                <Card className="col-span-4 bg-white shadow-sm border-0">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Financial Reports</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-3">
                      <div className="flex-1 border border-gray-200 rounded-lg p-3">
                        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mb-2">
                          <FileText className="w-4 h-4 text-red-500" />
                        </div>
                        <p className="text-sm font-medium text-gray-700">Monthly Report</p>
                        <p className="text-xs text-gray-400">${totalRevenue.toLocaleString()}</p>
                      </div>
                      <div className="flex-1 border border-dashed border-gray-300 rounded-lg p-3 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50">
                        <Plus className="w-6 h-6 text-gray-400 mb-1" />
                        <p className="text-xs text-gray-400">Create New</p>
                      </div>
                    </div>
                    <Button onClick={generatePDF} variant="outline" className="w-full mt-4 text-sm">
                      <Download className="w-4 h-4 mr-2" />
                      Download PDF Report
                    </Button>
                  </CardContent>
                </Card>

                {/* Customer Stats */}
                <Card className="col-span-4 bg-white shadow-sm border-0">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Customer Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-8">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-gray-800">{customerStats.active}</p>
                        <p className="text-xs text-gray-500">Active</p>
                      </div>
                      <div className="text-center">
                        <p className="text-3xl font-bold text-gray-800">{customerStats.inactive}</p>
                        <p className="text-xs text-gray-500">Inactive</p>
                      </div>
                    </div>
                    <div className="flex gap-1 mt-4">
                      <div
                        className="h-2 bg-red-400 rounded-l-full"
                        style={{ width: `${(customerStats.active / (customerStats.active + customerStats.inactive || 1)) * 100}%` }}
                      />
                      <div
                        className="h-2 bg-gray-200 rounded-r-full"
                        style={{ width: `${(customerStats.inactive / (customerStats.active + customerStats.inactive || 1)) * 100}%` }}
                      />
                    </div>
                    <Button variant="link" className="text-xs text-blue-500 mt-3 p-0" onClick={() => navigate('/enterprise/sales')}>
                      View Sales Dashboard
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default FinancialDashboard;
