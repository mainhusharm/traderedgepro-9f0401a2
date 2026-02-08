import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutGrid,
  Clock,
  Copy,
  FileText,
  LogOut,
  ArrowUpRight,
  ArrowDownRight,
  Send,
  Globe,
  ChevronRight,
  RefreshCw,
  TrendingUp,
  Users,
  CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { supabase } from '@/integrations/supabase/client';

interface Transaction {
  name: string;
  date: string;
  amount: string;
  type: 'credit' | 'debit';
}

interface Invoice {
  name: string;
  invoiceId: string;
  avatar: string;
  amount: string;
}

const ExecutiveDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  // Real data states
  const [totalBalance, setTotalBalance] = useState(0);
  const [totalDeposits, setTotalDeposits] = useState(0);
  const [totalWithdrawals, setTotalWithdrawals] = useState(0);
  const [savingsData, setSavingsData] = useState<any[]>([]);
  const [transactionData, setTransactionData] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [lastTransactions, setLastTransactions] = useState<Transaction[]>([]);
  const [expenseBreakdown, setExpenseBreakdown] = useState({
    subscriptions: 0,
    refunds: 0,
    operations: 0,
    marketing: 0
  });
  const [userGrowth, setUserGrowth] = useState(0);
  const [revenueGrowth, setRevenueGrowth] = useState(0);

  // Sidebar items
  const sidebarItems = [
    { icon: LayoutGrid, id: 'dashboard' },
    { icon: Clock, id: 'history' },
    { icon: Copy, id: 'reports' },
    { icon: FileText, id: 'documents' },
  ];

  useEffect(() => {
    fetchExecutiveData();
  }, []);

  const fetchExecutiveData = async () => {
    setLoading(true);
    try {
      // Fetch all payments for financial overview
      const { data: payments } = await supabase
        .from('payments')
        .select('*, profiles(first_name, last_name)')
        .order('created_at', { ascending: false });

      // Calculate totals
      const completed = payments?.filter(p => p.status === 'completed') || [];
      const refunded = payments?.filter(p => p.status === 'refunded') || [];

      const deposits = completed.reduce((sum, p) => sum + (p.final_price || 0), 0);
      const withdrawals = refunded.reduce((sum, p) => sum + (p.final_price || 0), 0);

      setTotalDeposits(deposits);
      setTotalWithdrawals(withdrawals);
      setTotalBalance(deposits - withdrawals);

      // Calculate growth rates
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

      const recentRevenue = completed
        .filter(p => new Date(p.created_at) >= thirtyDaysAgo)
        .reduce((sum, p) => sum + (p.final_price || 0), 0);
      const previousRevenue = completed
        .filter(p => new Date(p.created_at) >= sixtyDaysAgo && new Date(p.created_at) < thirtyDaysAgo)
        .reduce((sum, p) => sum + (p.final_price || 0), 0) || 1;

      setRevenueGrowth(Math.round(((recentRevenue - previousRevenue) / previousRevenue) * 100));

      // Savings/Revenue by day of week
      const dayNames = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];
      const savingsByDay = dayNames.map((day, index) => {
        const dayPayments = completed.filter(p => {
          const d = new Date(p.created_at);
          return d.getDay() === (index + 6) % 7; // Map to actual day
        });
        return {
          day,
          value: dayPayments.reduce((sum, p) => sum + (p.final_price || 0), 0) / 100
        };
      });
      setSavingsData(savingsByDay);

      // Transaction chart data (income vs expenses by day)
      const txnByDay = dayNames.map((day, index) => {
        const dayCompleted = completed.filter(p => {
          const d = new Date(p.created_at);
          return d.getDay() === (index + 6) % 7;
        });
        const dayRefunded = refunded.filter(p => {
          const d = new Date(p.created_at);
          return d.getDay() === (index + 6) % 7;
        });
        return {
          day,
          insert: dayCompleted.reduce((sum, p) => sum + (p.final_price || 0), 0) / 100,
          expense: dayRefunded.reduce((sum, p) => sum + (p.final_price || 0), 0) / 100
        };
      });
      setTransactionData(txnByDay);

      // Create invoices from recent payments
      const recentInvoices = completed.slice(0, 4).map((p, index) => ({
        name: p.profiles?.first_name
          ? `${p.profiles.first_name} ${p.profiles.last_name || ''}`
          : `Customer #${index + 1}`,
        invoiceId: `#${p.id?.substring(0, 6).toUpperCase() || 'INV'}`,
        avatar: p.profiles?.first_name
          ? `${p.profiles.first_name[0]}${p.profiles.last_name?.[0] || ''}`
          : 'CU',
        amount: `$${p.final_price?.toFixed(2) || '0.00'}`
      }));
      setInvoices(recentInvoices);

      // Last transactions
      const recentTxns: Transaction[] = payments?.slice(0, 5).map(p => ({
        name: p.profiles?.first_name
          ? `${p.profiles.first_name} ${p.profiles.last_name || ''}`
          : 'Customer',
        date: new Date(p.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }),
        amount: `${p.status === 'completed' ? '+' : '-'}$${p.final_price?.toFixed(2) || '0.00'} USD`,
        type: p.status === 'completed' ? 'credit' : 'debit'
      })) || [];
      setLastTransactions(recentTxns);

      // Expense breakdown by plan type
      const starterPayments = completed.filter(p => p.plan_name?.toLowerCase().includes('starter')).reduce((sum, p) => sum + (p.final_price || 0), 0);
      const proPayments = completed.filter(p => p.plan_name?.toLowerCase().includes('pro')).reduce((sum, p) => sum + (p.final_price || 0), 0);
      const elitePayments = completed.filter(p => p.plan_name?.toLowerCase().includes('elite')).reduce((sum, p) => sum + (p.final_price || 0), 0);
      const otherPayments = deposits - starterPayments - proPayments - elitePayments;

      setExpenseBreakdown({
        subscriptions: starterPayments,
        refunds: withdrawals,
        operations: proPayments,
        marketing: elitePayments || otherPayments
      });

      // User growth
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const { count: recentUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo.toISOString());

      const { count: previousUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sixtyDaysAgo.toISOString())
        .lt('created_at', thirtyDaysAgo.toISOString());

      const growth = previousUsers ? Math.round(((recentUsers || 0) - previousUsers) / previousUsers * 100) : 0;
      setUserGrowth(growth);

    } catch (error) {
      console.error('Error fetching executive data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Dark Sidebar */}
      <aside className="w-16 bg-[#1a1a2e] flex flex-col items-center py-6">
        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mb-8">
          <TrendingUp className="w-5 h-5 text-white" />
        </div>

        <nav className="flex-1 flex flex-col items-center gap-4">
          {sidebarItems.map((item, index) => (
            <button
              key={index}
              onClick={() => setActiveTab(item.id)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                activeTab === item.id
                  ? 'bg-white/20 text-white'
                  : 'text-gray-500 hover:bg-white/10 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
            </button>
          ))}
        </nav>

        <button
          onClick={() => {
            sessionStorage.removeItem('enterprise_dashboard_session');
            navigate('/enterprise-login');
          }}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-500 hover:bg-white/10 hover:text-white"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Executive Dashboard</h1>
              <p className="text-sm text-gray-500">TraderEdge Financial Overview</p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchExecutiveData} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="w-8 h-8 animate-spin text-gray-500" />
            </div>
          ) : (
            <div className="grid grid-cols-12 gap-6">
              {/* Left Column - Account Overview */}
              <div className="col-span-3 space-y-4">
                {/* Current Amount */}
                <Card className="bg-white shadow-sm border-0 rounded-2xl">
                  <CardContent className="p-4">
                    <p className="text-3xl font-bold text-gray-800">${totalBalance.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">Total Balance</p>
                    <p className={`text-xs flex items-center gap-1 mt-1 ${revenueGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {revenueGrowth >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {revenueGrowth >= 0 ? '+' : ''}{revenueGrowth}% this month
                    </p>
                  </CardContent>
                </Card>

                {/* Deposits & Withdraw */}
                <div className="space-y-3">
                  <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <ArrowUpRight className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-800">${totalDeposits.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">Total Revenue</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <ArrowDownRight className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-800">${totalWithdrawals.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">Refunds</p>
                    </div>
                  </div>
                </div>

                {/* Quick Links */}
                <Card className="bg-white shadow-sm border-0 rounded-2xl">
                  <CardContent className="p-4 space-y-3">
                    <p className="text-xs text-gray-500">Quick Navigation</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-between"
                      onClick={() => navigate('/enterprise/financial')}
                    >
                      <span>Financial Dashboard</span>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-between"
                      onClick={() => navigate('/enterprise/sales')}
                    >
                      <span>Sales Dashboard</span>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </Button>
                  </CardContent>
                </Card>

                {/* Recent Invoices */}
                <Card className="bg-white shadow-sm border-0 rounded-2xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-700">Recent Payments</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {invoices.length > 0 ? invoices.map((invoice, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">{invoice.avatar}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium text-gray-700">{invoice.name}</p>
                            <p className="text-xs text-gray-400">ID: {invoice.invoiceId}</p>
                          </div>
                        </div>
                        <p className="text-sm font-medium text-green-600">{invoice.amount}</p>
                      </div>
                    )) : (
                      <p className="text-sm text-gray-400 text-center">No recent payments</p>
                    )}
                    <Button variant="link" className="w-full text-xs text-blue-500 p-0" onClick={() => navigate('/enterprise/financial')}>
                      View All Payments
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Center Column - Financial Dashboard */}
              <div className="col-span-5 space-y-4">
                <Card className="bg-white shadow-sm border-0 rounded-2xl">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-semibold text-gray-800">Revenue Analytics</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Revenue Chart */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-gray-700">Revenue Trend</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">By Day</span>
                          <ChevronRight className="w-3 h-3 text-gray-400" />
                        </div>
                      </div>
                      <div className="h-[150px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={savingsData}>
                            <defs>
                              <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#1a1a2e" stopOpacity={0.1} />
                                <stop offset="95%" stopColor="#1a1a2e" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                            <YAxis hide />
                            <Tooltip formatter={(value) => [`$${(Number(value) * 100).toFixed(0)}`, 'Revenue']} />
                            <Area type="monotone" dataKey="value" stroke="#1a1a2e" fill="url(#savingsGradient)" strokeWidth={2} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Transaction Chart */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-gray-700">Income vs Refunds</p>
                        <div className="flex items-center gap-4 text-xs">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-gray-800 rounded-full" />
                            <span className="text-gray-500">Income</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-gray-300 rounded-full" />
                            <span className="text-gray-500">Refunds</span>
                          </div>
                        </div>
                      </div>
                      <div className="h-[150px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={transactionData}>
                            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                            <YAxis hide />
                            <Tooltip formatter={(value) => [`$${(Number(value) * 100).toFixed(0)}`, '']} />
                            <Bar dataKey="insert" fill="#1a1a2e" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="expense" fill="#d1d5db" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Revenue by Plan */}
                    <div className="mt-6 pt-4 border-t border-gray-100">
                      <p className="text-sm font-medium text-gray-700 mb-3">Revenue by Plan Type</p>
                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          <p className="text-lg font-bold text-gray-800">${expenseBreakdown.subscriptions.toLocaleString()}</p>
                          <p className="text-xs text-gray-400">Starter Plans</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-gray-800">${expenseBreakdown.operations.toLocaleString()}</p>
                          <p className="text-xs text-gray-400">Pro Plans</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-gray-800">${expenseBreakdown.marketing.toLocaleString()}</p>
                          <p className="text-xs text-gray-400">Elite Plans</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-red-500">${expenseBreakdown.refunds.toLocaleString()}</p>
                          <p className="text-xs text-gray-400">Refunds</p>
                        </div>
                      </div>
                    </div>

                    {/* Growth Banner */}
                    <div className="mt-6 bg-gradient-to-r from-gray-100 to-gray-50 rounded-xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                          <Users className="w-6 h-6 text-gray-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">User Growth</p>
                          <p className={`text-sm font-bold ${userGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {userGrowth >= 0 ? '+' : ''}{userGrowth}% this month
                          </p>
                        </div>
                      </div>
                      <Button size="sm" className="bg-gray-800 hover:bg-gray-900 text-white" onClick={() => navigate('/enterprise/operations')}>
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Cards & Transactions */}
              <div className="col-span-4 space-y-4">
                {/* Stats Cards */}
                <div className="flex gap-4">
                  <Card className="flex-1 bg-[#1a1a2e] text-white shadow-sm border-0 rounded-2xl">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-4">
                        <CreditCard className="w-8 h-8 text-white/60" />
                        <span className="text-xs opacity-60">REVENUE</span>
                      </div>
                      <p className="text-lg font-bold mb-1">${totalDeposits.toLocaleString()}</p>
                      <p className="text-xs opacity-60">Total Collected</p>
                    </CardContent>
                  </Card>

                  <Card className="flex-1 bg-gray-100 shadow-sm border-0 rounded-2xl">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-4">
                        <Users className="w-8 h-8 text-gray-400" />
                        <span className="text-xs text-gray-400">USERS</span>
                      </div>
                      <p className="text-lg font-bold text-gray-800 mb-1">{userGrowth >= 0 ? '+' : ''}{userGrowth}%</p>
                      <p className="text-xs text-gray-500">Growth Rate</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-3">
                  <Card className="flex-1 bg-white shadow-sm border-0 rounded-xl cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/enterprise/financial')}>
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Send className="w-5 h-5 text-blue-600" />
                      </div>
                      <p className="text-sm font-medium text-gray-700">View Financial</p>
                      <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
                    </CardContent>
                  </Card>

                  <Card className="flex-1 bg-white shadow-sm border-0 rounded-xl cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/enterprise/support')}>
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <Globe className="w-5 h-5 text-purple-600" />
                      </div>
                      <p className="text-sm font-medium text-gray-700">View Support</p>
                      <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
                    </CardContent>
                  </Card>
                </div>

                {/* Last Transactions */}
                <Card className="bg-white shadow-sm border-0 rounded-2xl">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-gray-700">Recent Transactions</CardTitle>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {lastTransactions.length > 0 ? lastTransactions.map((transaction, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback className={`text-xs ${
                              transaction.type === 'credit' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                            }`}>
                              {transaction.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium text-gray-700">{transaction.name}</p>
                            <p className="text-xs text-gray-400">{transaction.date}</p>
                          </div>
                        </div>
                        <p className={`text-sm font-semibold ${
                          transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.amount}
                        </p>
                      </div>
                    )) : (
                      <p className="text-sm text-gray-400 text-center py-4">No recent transactions</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ExecutiveDashboard;
