import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Settings,
  ArrowLeft,
  RefreshCw,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  TrendingUp,
  Server,
  Database,
  Workflow,
  Download,
  Filter,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import Header from '@/components/layout/Header';

// Mock data for automation performance
const automationData = [
  { name: 'Signal Generation', success: 95, failed: 5 },
  { name: 'Trade Execution', success: 92, failed: 8 },
  { name: 'Risk Analysis', success: 98, failed: 2 },
  { name: 'Report Generation', success: 88, failed: 12 },
  { name: 'Email Notifications', success: 99, failed: 1 },
  { name: 'Data Sync', success: 94, failed: 6 },
];

const revenueByProduct = [
  { name: 'Starter', value: 45000, color: '#6366f1' },
  { name: 'Pro', value: 125000, color: '#22c55e' },
  { name: 'Enterprise', value: 89000, color: '#f59e0b' },
];

const failureTypes = [
  { type: 'API Timeout', count: 23, percentage: 35 },
  { type: 'Database Connection', count: 18, percentage: 27 },
  { type: 'Workflow Syntax', count: 15, percentage: 23 },
  { type: 'Authentication', count: 10, percentage: 15 },
];

const transactionsData = [
  { id: 'TXN-001', product: 'Pro Plan', user: 'john@example.com', status: 'completed', amount: 199, time: '2 min ago' },
  { id: 'TXN-002', product: 'Starter Plan', user: 'jane@example.com', status: 'pending', amount: 49.5, time: '5 min ago' },
  { id: 'TXN-003', product: 'Enterprise', user: 'corp@example.com', status: 'completed', amount: 499, time: '12 min ago' },
  { id: 'TXN-004', product: 'Pro Plan', user: 'mike@example.com', status: 'failed', amount: 199, time: '15 min ago' },
  { id: 'TXN-005', product: 'Starter Plan', user: 'sarah@example.com', status: 'completed', amount: 49.5, time: '23 min ago' },
];

const systemHealthData = [
  { time: '00:00', cpu: 45, memory: 62, requests: 120 },
  { time: '04:00', cpu: 32, memory: 58, requests: 85 },
  { time: '08:00', cpu: 68, memory: 74, requests: 340 },
  { time: '12:00', cpu: 82, memory: 81, requests: 520 },
  { time: '16:00', cpu: 75, memory: 78, requests: 480 },
  { time: '20:00', cpu: 55, memory: 65, requests: 280 },
];

const OperationsDashboard = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setLastUpdated(new Date());
      setIsRefreshing(false);
    }, 1000);
  };

  const filteredTransactions = transactionsData.filter(txn => {
    const matchesSearch = txn.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      txn.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || txn.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500/20 text-green-500"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-500"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/20 text-red-500"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const exportData = () => {
    const csvContent = 'data:text/csv;charset=utf-8,' +
      'ID,Product,User,Status,Amount,Time\n' +
      filteredTransactions.map(t => `${t.id},${t.product},${t.user},${t.status},${t.amount},${t.time}`).join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `operations_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
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
                <Settings className="w-6 h-6 text-primary" />
                Operations Dashboard
              </h1>
              <p className="text-sm text-muted-foreground">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" onClick={exportData}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Automations</p>
                  <p className="text-2xl font-bold">47</p>
                  <p className="text-xs text-green-500">+5 this week</p>
                </div>
                <div className="p-3 rounded-full bg-primary/10">
                  <Workflow className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                  <p className="text-2xl font-bold">98.2%</p>
                  <p className="text-xs text-green-500">+0.3% from last week</p>
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
                  <p className="text-sm text-muted-foreground">Total Failures</p>
                  <p className="text-2xl font-bold">66</p>
                  <p className="text-xs text-red-500">-12 from last week</p>
                </div>
                <div className="p-3 rounded-full bg-red-500/10">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Revenue Generated</p>
                  <p className="text-2xl font-bold">$259K</p>
                  <p className="text-xs text-green-500">+18% this month</p>
                </div>
                <div className="p-3 rounded-full bg-amber-500/10">
                  <Zap className="w-6 h-6 text-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Automation Performance */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg">Automation Performance</CardTitle>
              <CardDescription>Success vs failure rates by automation type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={automationData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis type="number" stroke="#888" />
                    <YAxis dataKey="name" type="category" stroke="#888" width={120} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                    />
                    <Bar dataKey="success" fill="#22c55e" name="Success %" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="failed" fill="#ef4444" name="Failed %" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* System Health */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg">System Health</CardTitle>
              <CardDescription>CPU, Memory, and Request load over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={systemHealthData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="time" stroke="#888" />
                    <YAxis stroke="#888" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                    />
                    <Line type="monotone" dataKey="cpu" stroke="#6366f1" name="CPU %" strokeWidth={2} />
                    <Line type="monotone" dataKey="memory" stroke="#22c55e" name="Memory %" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Failures Overview */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <Card className="glass-card lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Failures Overview</CardTitle>
              <CardDescription>Error types breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {failureTypes.map((failure, index) => (
                  <div key={index}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{failure.type}</span>
                      <span className="text-muted-foreground">{failure.count} ({failure.percentage}%)</span>
                    </div>
                    <Progress value={failure.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Revenue by Product</CardTitle>
              <CardDescription>Distribution of revenue across plans</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-8">
                <div className="h-[200px] w-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={revenueByProduct}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {revenueByProduct.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                        formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-4">
                  {revenueByProduct.map((product, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: product.color }} />
                        <span>{product.name}</span>
                      </div>
                      <span className="font-semibold">${product.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transactions Table */}
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Recent Transactions</CardTitle>
                <CardDescription>Latest automation-processed transactions</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-[200px]"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[130px]">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((txn) => (
                  <TableRow key={txn.id}>
                    <TableCell className="font-mono">{txn.id}</TableCell>
                    <TableCell>{txn.product}</TableCell>
                    <TableCell>{txn.user}</TableCell>
                    <TableCell>{getStatusBadge(txn.status)}</TableCell>
                    <TableCell className="text-right">${txn.amount}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{txn.time}</TableCell>
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

export default OperationsDashboard;
