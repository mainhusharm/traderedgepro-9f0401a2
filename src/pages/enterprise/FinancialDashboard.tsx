import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  DollarSign,
  ArrowLeft,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Download,
  FileText,
  CreditCard,
  Wallet,
  ShoppingCart,
  Package,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  PieChart as PieChartIcon,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import jsPDF from 'jspdf';
import Header from '@/components/layout/Header';

// Mock data
const revenueData = [
  { month: 'Jan', revenue: 42000, costs: 18000, profit: 24000 },
  { month: 'Feb', revenue: 48000, costs: 19000, profit: 29000 },
  { month: 'Mar', revenue: 55000, costs: 21000, profit: 34000 },
  { month: 'Apr', revenue: 52000, costs: 20000, profit: 32000 },
  { month: 'May', revenue: 68000, costs: 24000, profit: 44000 },
  { month: 'Jun', revenue: 75000, costs: 26000, profit: 49000 },
  { month: 'Jul', revenue: 82000, costs: 28000, profit: 54000 },
  { month: 'Aug', revenue: 79000, costs: 27000, profit: 52000 },
  { month: 'Sep', revenue: 88000, costs: 30000, profit: 58000 },
  { month: 'Oct', revenue: 95000, costs: 32000, profit: 63000 },
  { month: 'Nov', revenue: 102000, costs: 34000, profit: 68000 },
  { month: 'Dec', revenue: 115000, costs: 38000, profit: 77000 },
];

const customerAnalytics = [
  { name: 'Online', value: 68, color: '#6366f1' },
  { name: 'Offline', value: 32, color: '#22c55e' },
];

const recentOrders = [
  { id: 'ORD-001', customer: 'John Smith', product: 'Pro Plan', amount: 199, status: 'completed', date: '2026-02-08' },
  { id: 'ORD-002', customer: 'Sarah Johnson', product: 'Enterprise', amount: 499, status: 'pending', date: '2026-02-08' },
  { id: 'ORD-003', customer: 'Mike Williams', product: 'Starter', amount: 49.5, status: 'completed', date: '2026-02-07' },
  { id: 'ORD-004', customer: 'Emily Davis', product: 'Pro Plan', amount: 199, status: 'completed', date: '2026-02-07' },
  { id: 'ORD-005', customer: 'David Brown', product: 'Pro Plan', amount: 199, status: 'refunded', date: '2026-02-06' },
];

const expenseBreakdown = [
  { category: 'Infrastructure', amount: 12500, percentage: 35 },
  { category: 'Marketing', amount: 8500, percentage: 24 },
  { category: 'Salaries', amount: 9000, percentage: 25 },
  { category: 'Support', amount: 3500, percentage: 10 },
  { category: 'Others', amount: 2500, percentage: 6 },
];

const FinancialDashboard = () => {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState('this-month');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const generatePDF = () => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(24);
    doc.setTextColor(99, 102, 241);
    doc.text('Financial Report', 20, 20);

    doc.setFontSize(10);
    doc.setTextColor(128, 128, 128);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 20, 28);

    // Summary Section
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Financial Summary', 20, 45);

    doc.setFontSize(11);
    doc.text(`Total Revenue: $847,560`, 20, 55);
    doc.text(`Total Costs: $295,000`, 20, 63);
    doc.text(`Net Profit: $552,560`, 20, 71);
    doc.text(`Profit Margin: 65.2%`, 20, 79);

    // Monthly breakdown
    doc.setFontSize(14);
    doc.text('Monthly Revenue', 20, 100);

    doc.setFontSize(9);
    revenueData.forEach((item, index) => {
      doc.text(
        `${item.month}: Revenue $${item.revenue.toLocaleString()} | Costs $${item.costs.toLocaleString()} | Profit $${item.profit.toLocaleString()}`,
        20,
        110 + index * 7
      );
    });

    // Expense breakdown
    doc.setFontSize(14);
    doc.text('Expense Breakdown', 20, 200);

    doc.setFontSize(9);
    expenseBreakdown.forEach((item, index) => {
      doc.text(`${item.category}: $${item.amount.toLocaleString()} (${item.percentage}%)`, 20, 210 + index * 7);
    });

    doc.save(`financial_report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const calculateGaugeValue = () => {
    // Performance score based on profit margin
    return 78; // Mock value
  };

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
                <DollarSign className="w-6 h-6 text-green-500" />
                Financial Dashboard
              </h1>
              <p className="text-sm text-muted-foreground">
                Revenue, costs, and profit analysis
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
                <SelectItem value="this-week">This Week</SelectItem>
                <SelectItem value="this-month">This Month</SelectItem>
                <SelectItem value="this-quarter">This Quarter</SelectItem>
                <SelectItem value="this-year">This Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={generatePDF}>
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* Key Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Available Balance</p>
                  <p className="text-2xl font-bold">$284,560</p>
                  <div className="flex items-center gap-1 text-green-500 text-xs">
                    <ArrowUpRight className="w-3 h-3" />
                    +12.5% from last month
                  </div>
                </div>
                <div className="p-3 rounded-full bg-green-500/10">
                  <Wallet className="w-6 h-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                  <p className="text-2xl font-bold">1,847</p>
                  <div className="flex items-center gap-1 text-green-500 text-xs">
                    <ArrowUpRight className="w-3 h-3" />
                    +8.2% from last month
                  </div>
                </div>
                <div className="p-3 rounded-full bg-blue-500/10">
                  <ShoppingCart className="w-6 h-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Sales</p>
                  <p className="text-2xl font-bold">$847,560</p>
                  <div className="flex items-center gap-1 text-green-500 text-xs">
                    <ArrowUpRight className="w-3 h-3" />
                    +18.3% from last month
                  </div>
                </div>
                <div className="p-3 rounded-full bg-primary/10">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Stock Value</p>
                  <p className="text-2xl font-bold">$125,000</p>
                  <div className="flex items-center gap-1 text-yellow-500 text-xs">
                    <ArrowDownRight className="w-3 h-3" />
                    -2.1% from last month
                  </div>
                </div>
                <div className="p-3 rounded-full bg-amber-500/10">
                  <Package className="w-6 h-6 text-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Chart & Performance */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <Card className="glass-card lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Revenue vs Costs</CardTitle>
              <CardDescription>Monthly breakdown with profit margins</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorCosts" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
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
                      dataKey="revenue"
                      stroke="#6366f1"
                      fill="url(#colorRevenue)"
                      strokeWidth={2}
                      name="Revenue"
                    />
                    <Area
                      type="monotone"
                      dataKey="costs"
                      stroke="#ef4444"
                      fill="url(#colorCosts)"
                      strokeWidth={2}
                      name="Costs"
                    />
                    <Area
                      type="monotone"
                      dataKey="profit"
                      stroke="#22c55e"
                      fill="url(#colorProfit)"
                      strokeWidth={2}
                      name="Profit"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg">Performance Score</CardTitle>
              <CardDescription>Overall financial health</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center">
              <div className="relative w-48 h-48">
                <svg className="w-full h-full -rotate-90">
                  <circle
                    cx="96"
                    cy="96"
                    r="80"
                    fill="none"
                    stroke="#333"
                    strokeWidth="16"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="80"
                    fill="none"
                    stroke="url(#gaugeGradient)"
                    strokeWidth="16"
                    strokeDasharray={`${calculateGaugeValue() * 5.024} 502.4`}
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#22c55e" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold">{calculateGaugeValue()}%</span>
                  <span className="text-sm text-muted-foreground">Health Score</span>
                </div>
              </div>
              <div className="mt-4 text-center">
                <Badge className="bg-green-500/20 text-green-500">Excellent</Badge>
                <p className="text-sm text-muted-foreground mt-2">
                  Profit margins are above target
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Customer Analytics & Expenses */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg">Customer Analytics</CardTitle>
              <CardDescription>Online vs Offline customer distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-8">
                <div className="h-[200px] w-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={customerAnalytics}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {customerAnalytics.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-4">
                  {customerAnalytics.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span>{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{item.value}%</span>
                        <Users className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                  <div className="pt-4 border-t border-white/10">
                    <p className="text-sm text-muted-foreground">
                      Total Active Customers: <span className="text-foreground font-semibold">12,847</span>
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg">Expense Breakdown</CardTitle>
              <CardDescription>Cost distribution by category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {expenseBreakdown.map((expense, index) => (
                  <div key={index}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{expense.category}</span>
                      <span className="text-muted-foreground">
                        ${expense.amount.toLocaleString()} ({expense.percentage}%)
                      </span>
                    </div>
                    <Progress value={expense.percentage} className="h-2" />
                  </div>
                ))}
                <div className="pt-4 border-t border-white/10">
                  <div className="flex justify-between">
                    <span className="font-medium">Total Expenses</span>
                    <span className="font-bold">$36,000</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Orders */}
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Recent Orders</CardTitle>
                <CardDescription>Latest transactions with real-time updates</CardDescription>
              </div>
              <Badge className="bg-green-500/20 text-green-500">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                Live
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono">{order.id}</TableCell>
                    <TableCell>{order.customer}</TableCell>
                    <TableCell>{order.product}</TableCell>
                    <TableCell>${order.amount}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          order.status === 'completed'
                            ? 'bg-green-500/20 text-green-500'
                            : order.status === 'pending'
                            ? 'bg-yellow-500/20 text-yellow-500'
                            : 'bg-red-500/20 text-red-500'
                        }
                      >
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">{order.date}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default FinancialDashboard;
