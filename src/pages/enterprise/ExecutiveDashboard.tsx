import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Crown,
  ArrowLeft,
  RefreshCw,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  CreditCard,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Download,
  FileText,
  PiggyBank,
  Receipt,
  Wallet,
  Activity,
  Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import Header from '@/components/layout/Header';

// Mock data
const monthlyRevenue = [
  { month: 'Jan', current: 85000, previous: 72000 },
  { month: 'Feb', current: 92000, previous: 78000 },
  { month: 'Mar', current: 98000, previous: 85000 },
  { month: 'Apr', current: 105000, previous: 89000 },
  { month: 'May', current: 112000, previous: 95000 },
  { month: 'Jun', current: 125000, previous: 102000 },
  { month: 'Jul', current: 118000, previous: 108000 },
  { month: 'Aug', current: 132000, previous: 112000 },
  { month: 'Sep', current: 145000, previous: 118000 },
  { month: 'Oct', current: 155000, previous: 125000 },
  { month: 'Nov', current: 168000, previous: 138000 },
  { month: 'Dec', current: 185000, previous: 152000 },
];

const transactionHistory = [
  { date: '2026-02-08', type: 'Revenue', amount: 12500, category: 'Subscriptions' },
  { date: '2026-02-08', type: 'Revenue', amount: 4990, category: 'Enterprise' },
  { date: '2026-02-07', type: 'Expense', amount: -2500, category: 'Marketing' },
  { date: '2026-02-07', type: 'Revenue', amount: 8750, category: 'Subscriptions' },
  { date: '2026-02-06', type: 'Expense', amount: -1200, category: 'Infrastructure' },
  { date: '2026-02-06', type: 'Revenue', amount: 15200, category: 'Subscriptions' },
];

const invoices = [
  { id: 'INV-001', client: 'Tech Corp', amount: 4990, status: 'paid', date: '2026-02-05' },
  { id: 'INV-002', client: 'Trading LLC', amount: 1990, status: 'pending', date: '2026-02-08' },
  { id: 'INV-003', client: 'Finance Inc', amount: 4990, status: 'overdue', date: '2026-01-25' },
  { id: 'INV-004', client: 'Hedge Fund Co', amount: 4990, status: 'paid', date: '2026-02-01' },
];

const expenseCategories = [
  { name: 'Infrastructure', value: 35000, color: '#6366f1' },
  { name: 'Marketing', value: 28000, color: '#22c55e' },
  { name: 'Salaries', value: 45000, color: '#f59e0b' },
  { name: 'Support', value: 12000, color: '#ec4899' },
  { name: 'R&D', value: 18000, color: '#8b5cf6' },
];

const productPerformance = [
  { name: 'Starter Plan', revenue: 125000, users: 2500, growth: 12 },
  { name: 'Pro Plan', revenue: 450000, users: 2260, growth: 28 },
  { name: 'Enterprise', revenue: 285000, users: 57, growth: 45 },
];

const accountSummary = [
  { name: 'Operating Account', balance: 485000, type: 'checking', lastActivity: '2 hours ago' },
  { name: 'Savings Reserve', balance: 250000, type: 'savings', lastActivity: '1 week ago' },
  { name: 'Tax Reserve', balance: 125000, type: 'savings', lastActivity: '1 month ago' },
];

const ExecutiveDashboard = () => {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState('this-year');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const totalRevenue = monthlyRevenue.reduce((acc, m) => acc + m.current, 0);
  const previousRevenue = monthlyRevenue.reduce((acc, m) => acc + m.previous, 0);
  const revenueGrowth = ((totalRevenue - previousRevenue) / previousRevenue * 100).toFixed(1);
  const totalExpenses = expenseCategories.reduce((acc, e) => acc + e.value, 0);
  const netProfit = totalRevenue - totalExpenses * 12;
  const savingsRate = ((netProfit / totalRevenue) * 100).toFixed(1);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8 pt-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/enterprise')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Crown className="w-6 h-6 text-primary" />
                Executive Dashboard
              </h1>
              <p className="text-sm text-muted-foreground">
                Top-level business performance and key metrics
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[150px]">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="this-month">This Month</SelectItem>
                <SelectItem value="this-quarter">This Quarter</SelectItem>
                <SelectItem value="this-year">This Year</SelectItem>
                <SelectItem value="all-time">All Time</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Key Executive Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="glass-card border-primary/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-3xl font-bold text-primary">${(totalRevenue / 1000000).toFixed(2)}M</p>
                  <div className="flex items-center gap-1 text-green-500 text-xs mt-1">
                    <ArrowUpRight className="w-3 h-3" />
                    +{revenueGrowth}% YoY
                  </div>
                </div>
                <div className="p-3 rounded-full bg-primary/10">
                  <DollarSign className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Net Profit</p>
                  <p className="text-3xl font-bold text-green-500">${(netProfit / 1000000).toFixed(2)}M</p>
                  <div className="flex items-center gap-1 text-green-500 text-xs mt-1">
                    <TrendingUp className="w-3 h-3" />
                    {savingsRate}% margin
                  </div>
                </div>
                <div className="p-3 rounded-full bg-green-500/10">
                  <TrendingUp className="w-6 h-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-3xl font-bold">12,847</p>
                  <div className="flex items-center gap-1 text-green-500 text-xs mt-1">
                    <ArrowUpRight className="w-3 h-3" />
                    +847 this month
                  </div>
                </div>
                <div className="p-3 rounded-full bg-blue-500/10">
                  <Users className="w-6 h-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Monthly Savings</p>
                  <p className="text-3xl font-bold">$47.5K</p>
                  <div className="flex items-center gap-1 text-green-500 text-xs mt-1">
                    <PiggyBank className="w-3 h-3" />
                    +12% from target
                  </div>
                </div>
                <div className="p-3 rounded-full bg-amber-500/10">
                  <PiggyBank className="w-6 h-6 text-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Chart & Product Performance */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <Card className="glass-card lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Revenue Comparison</CardTitle>
              <CardDescription>Current vs Previous Year</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyRevenue}>
                    <defs>
                      <linearGradient id="currentGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="previousGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#64748b" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#64748b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="month" stroke="#888" />
                    <YAxis stroke="#888" tickFormatter={(value) => `$${value / 1000}k`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                      formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                    />
                    <Area
                      type="monotone"
                      dataKey="current"
                      stroke="#6366f1"
                      fill="url(#currentGradient)"
                      strokeWidth={2}
                      name="2026"
                    />
                    <Area
                      type="monotone"
                      dataKey="previous"
                      stroke="#64748b"
                      fill="url(#previousGradient)"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="2025"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Product Performance */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg">Product Performance</CardTitle>
              <CardDescription>Revenue by product tier</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {productPerformance.map((product, index) => (
                  <div key={index} className="p-3 rounded-lg bg-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{product.name}</span>
                      <Badge className="bg-green-500/20 text-green-500">
                        +{product.growth}%
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-xl font-bold">${(product.revenue / 1000).toFixed(0)}K</span>
                      <span className="text-muted-foreground">{product.users.toLocaleString()} users</span>
                    </div>
                    <Progress value={(product.revenue / 500000) * 100} className="mt-2 h-1" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Expenses & Transaction History */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Expense Breakdown */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg">Expense Breakdown</CardTitle>
              <CardDescription>Monthly operating costs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-8">
                <div className="h-[200px] w-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseCategories}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {expenseCategories.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                        formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-3">
                  {expenseCategories.map((expense, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: expense.color }} />
                        <span className="text-sm">{expense.name}</span>
                      </div>
                      <span className="font-semibold">${expense.value.toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="pt-3 border-t border-white/10">
                    <div className="flex justify-between">
                      <span className="font-medium">Total</span>
                      <span className="font-bold">${totalExpenses.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transaction History */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg">Transaction History</CardTitle>
              <CardDescription>Recent financial activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[180px] mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={transactionHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="date" stroke="#888" tickFormatter={(value) => value.split('-')[2]} />
                    <YAxis stroke="#888" tickFormatter={(value) => `$${Math.abs(value) / 1000}k`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                      formatter={(value: number) => [`$${Math.abs(value).toLocaleString()}`, '']}
                    />
                    <Bar
                      dataKey="amount"
                      fill={(entry: any) => entry.amount >= 0 ? '#22c55e' : '#ef4444'}
                    >
                      {transactionHistory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.amount >= 0 ? '#22c55e' : '#ef4444'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {transactionHistory.slice(0, 4).map((txn, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-white/5">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${txn.amount >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                        {txn.amount >= 0 ?
                          <ArrowUpRight className="w-4 h-4 text-green-500" /> :
                          <ArrowDownRight className="w-4 h-4 text-red-500" />
                        }
                      </div>
                      <div>
                        <p className="text-sm font-medium">{txn.category}</p>
                        <p className="text-xs text-muted-foreground">{txn.date}</p>
                      </div>
                    </div>
                    <span className={`font-semibold ${txn.amount >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {txn.amount >= 0 ? '+' : ''}${txn.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Invoices & Account Summary */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Invoice Management */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg">Invoice Management</CardTitle>
              <CardDescription>Track outstanding and paid invoices</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-mono">{invoice.id}</TableCell>
                      <TableCell>{invoice.client}</TableCell>
                      <TableCell>${invoice.amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge className={
                          invoice.status === 'paid' ? 'bg-green-500/20 text-green-500' :
                          invoice.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                          'bg-red-500/20 text-red-500'
                        }>
                          {invoice.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Account Summary */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg">Account Summary</CardTitle>
              <CardDescription>Financial accounts overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {accountSummary.map((account, index) => (
                  <div key={index} className="p-4 rounded-lg bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${account.type === 'checking' ? 'bg-primary/10' : 'bg-green-500/10'}`}>
                          {account.type === 'checking' ?
                            <CreditCard className="w-5 h-5 text-primary" /> :
                            <PiggyBank className="w-5 h-5 text-green-500" />
                          }
                        </div>
                        <div>
                          <p className="font-medium">{account.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{account.type}</p>
                        </div>
                      </div>
                      <span className="text-xl font-bold">${account.balance.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Activity className="w-3 h-3" />
                      Last activity: {account.lastActivity}
                    </div>
                  </div>
                ))}
                <div className="pt-4 border-t border-white/10">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total Balance</span>
                    <span className="text-2xl font-bold text-primary">
                      ${accountSummary.reduce((acc, a) => acc + a.balance, 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ExecutiveDashboard;
