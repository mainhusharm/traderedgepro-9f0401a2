import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  ArrowLeft,
  RefreshCw,
  DollarSign,
  Users,
  Target,
  Phone,
  MessageCircle,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, LineChart, Line } from 'recharts';
import Header from '@/components/layout/Header';

// Mock data
const salesData = [
  { day: 'Mon', sales: 4500, conversions: 12 },
  { day: 'Tue', sales: 5200, conversions: 15 },
  { day: 'Wed', sales: 4800, conversions: 11 },
  { day: 'Thu', sales: 6100, conversions: 18 },
  { day: 'Fri', sales: 7200, conversions: 22 },
  { day: 'Sat', sales: 3800, conversions: 8 },
  { day: 'Sun', sales: 2900, conversions: 6 },
];

const pipelineStages = [
  { stage: 'Contacted', count: 45, value: 89500, color: '#6366f1' },
  { stage: 'Negotiation', count: 28, value: 56000, color: '#f59e0b' },
  { stage: 'Offer Sent', count: 15, value: 29850, color: '#8b5cf6' },
  { stage: 'Deal Closed', count: 32, value: 63680, color: '#22c55e' },
];

const deals = [
  { id: 'DL-001', name: 'Enterprise Corp', product: 'Enterprise Plan', value: 4990, stage: 'negotiation', probability: 75, owner: 'John', daysInStage: 3 },
  { id: 'DL-002', name: 'Tech Startup', product: 'Pro Plan', value: 1990, stage: 'offer_sent', probability: 90, owner: 'Sarah', daysInStage: 1 },
  { id: 'DL-003', name: 'Trading Firm', product: 'Enterprise Plan', value: 4990, stage: 'contacted', probability: 40, owner: 'Mike', daysInStage: 5 },
  { id: 'DL-004', name: 'Individual Trader', product: 'Starter Plan', value: 495, stage: 'closed', probability: 100, owner: 'Tom', daysInStage: 0 },
  { id: 'DL-005', name: 'Hedge Fund Inc', product: 'Enterprise Plan', value: 4990, stage: 'negotiation', probability: 60, owner: 'John', daysInStage: 7 },
];

const timelineProjects = [
  { name: 'Q1 Sales Target', progress: 78, deadline: 'Mar 31', status: 'on_track' },
  { name: 'New Product Launch', progress: 45, deadline: 'Feb 28', status: 'at_risk' },
  { name: 'Partner Onboarding', progress: 92, deadline: 'Feb 15', status: 'ahead' },
  { name: 'Enterprise Campaign', progress: 33, deadline: 'Apr 15', status: 'on_track' },
];

const performanceComparison = {
  last5Days: { sales: 28500, conversions: 67, avgDeal: 425 },
  lastWeek: { sales: 34500, conversions: 82, avgDeal: 421 },
};

const SalesDashboard = () => {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState('last-7-days');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const getStageBadge = (stage: string) => {
    switch (stage) {
      case 'contacted':
        return <Badge className="bg-blue-500/20 text-blue-500">Contacted</Badge>;
      case 'negotiation':
        return <Badge className="bg-yellow-500/20 text-yellow-500">Negotiation</Badge>;
      case 'offer_sent':
        return <Badge className="bg-purple-500/20 text-purple-500">Offer Sent</Badge>;
      case 'closed':
        return <Badge className="bg-green-500/20 text-green-500">Closed</Badge>;
      default:
        return <Badge>{stage}</Badge>;
    }
  };

  const totalPipelineValue = pipelineStages.reduce((acc, stage) => acc + stage.value, 0);

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
                <TrendingUp className="w-6 h-6 text-orange-500" />
                Sales Dashboard
              </h1>
              <p className="text-sm text-muted-foreground">
                Track sales, conversions, and pipeline performance
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
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="last-7-days">Last 7 Days</SelectItem>
                <SelectItem value="last-30-days">Last 30 Days</SelectItem>
                <SelectItem value="this-quarter">This Quarter</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Daily Sales</p>
                  <p className="text-2xl font-bold">$34,500</p>
                  <div className="flex items-center gap-1 text-green-500 text-xs">
                    <ArrowUpRight className="w-3 h-3" />
                    +12.5% vs last week
                  </div>
                </div>
                <div className="p-3 rounded-full bg-green-500/10">
                  <DollarSign className="w-6 h-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Conversions</p>
                  <p className="text-2xl font-bold">92</p>
                  <div className="flex items-center gap-1 text-green-500 text-xs">
                    <ArrowUpRight className="w-3 h-3" />
                    +8 from yesterday
                  </div>
                </div>
                <div className="p-3 rounded-full bg-primary/10">
                  <Target className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pipeline Value</p>
                  <p className="text-2xl font-bold">${totalPipelineValue.toLocaleString()}</p>
                  <div className="flex items-center gap-1 text-green-500 text-xs">
                    <ArrowUpRight className="w-3 h-3" />
                    +$15K this week
                  </div>
                </div>
                <div className="p-3 rounded-full bg-orange-500/10">
                  <TrendingUp className="w-6 h-6 text-orange-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Leads</p>
                  <p className="text-2xl font-bold">120</p>
                  <div className="flex items-center gap-1 text-yellow-500 text-xs">
                    <ArrowDownRight className="w-3 h-3" />
                    -3 from yesterday
                  </div>
                </div>
                <div className="p-3 rounded-full bg-blue-500/10">
                  <Users className="w-6 h-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sales Chart & Pipeline */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <Card className="glass-card lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Sales Trend</CardTitle>
              <CardDescription>Daily sales and conversions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesData}>
                    <defs>
                      <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="day" stroke="#888" />
                    <YAxis yAxisId="left" stroke="#888" tickFormatter={(value) => `$${value / 1000}k`} />
                    <YAxis yAxisId="right" orientation="right" stroke="#888" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                      formatter={(value: number, name: string) => [
                        name === 'sales' ? `$${value.toLocaleString()}` : value,
                        name === 'sales' ? 'Sales' : 'Conversions'
                      ]}
                    />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="sales"
                      stroke="#f59e0b"
                      fill="url(#salesGradient)"
                      strokeWidth={2}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="conversions"
                      stroke="#22c55e"
                      strokeWidth={2}
                      dot={{ fill: '#22c55e' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Deal Stage Pipeline */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg">Deal Pipeline</CardTitle>
              <CardDescription>Deals by stage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pipelineStages.map((stage, index) => (
                  <div key={index}>
                    <div className="flex justify-between text-sm mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.color }} />
                        <span>{stage.stage}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold">{stage.count} deals</span>
                        <span className="text-muted-foreground ml-2">${stage.value.toLocaleString()}</span>
                      </div>
                    </div>
                    <Progress
                      value={(stage.value / totalPipelineValue) * 100}
                      className="h-2"
                    />
                  </div>
                ))}
                <div className="pt-4 border-t border-white/10">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total Pipeline</span>
                    <span className="text-xl font-bold text-primary">${totalPipelineValue.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Circles & Timeline */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Performance Comparison */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg">Performance Comparison</CardTitle>
              <CardDescription>Last 5 days vs Last week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {/* Contact Rate Circle */}
                <div className="flex flex-col items-center">
                  <div className="relative w-24 h-24">
                    <svg className="w-full h-full -rotate-90">
                      <circle cx="48" cy="48" r="40" fill="none" stroke="#333" strokeWidth="8" />
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        fill="none"
                        stroke="#6366f1"
                        strokeWidth="8"
                        strokeDasharray={`${72 * 2.51} 251`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold">72%</span>
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground mt-2">Contact Rate</span>
                </div>

                {/* Conversion Rate Circle */}
                <div className="flex flex-col items-center">
                  <div className="relative w-24 h-24">
                    <svg className="w-full h-full -rotate-90">
                      <circle cx="48" cy="48" r="40" fill="none" stroke="#333" strokeWidth="8" />
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        fill="none"
                        stroke="#22c55e"
                        strokeWidth="8"
                        strokeDasharray={`${12.4 * 2.51} 251`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold">12.4%</span>
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground mt-2">Conversion</span>
                </div>

                {/* Win Rate Circle */}
                <div className="flex flex-col items-center">
                  <div className="relative w-24 h-24">
                    <svg className="w-full h-full -rotate-90">
                      <circle cx="48" cy="48" r="40" fill="none" stroke="#333" strokeWidth="8" />
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="8"
                        strokeDasharray={`${45 * 2.51} 251`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold">45%</span>
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground mt-2">Win Rate</span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 rounded-lg bg-white/5">
                  <p className="text-muted-foreground">Last 5 Days</p>
                  <p className="text-lg font-semibold">${performanceComparison.last5Days.sales.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{performanceComparison.last5Days.conversions} conversions</p>
                </div>
                <div className="p-3 rounded-lg bg-white/5">
                  <p className="text-muted-foreground">Last Week</p>
                  <p className="text-lg font-semibold">${performanceComparison.lastWeek.sales.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{performanceComparison.lastWeek.conversions} conversions</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline Projects */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg">Project Timeline</CardTitle>
              <CardDescription>Track progress on sales initiatives</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {timelineProjects.map((project, index) => (
                  <div key={index} className="p-3 rounded-lg bg-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{project.name}</span>
                      <Badge className={
                        project.status === 'ahead' ? 'bg-green-500/20 text-green-500' :
                        project.status === 'on_track' ? 'bg-blue-500/20 text-blue-500' :
                        'bg-red-500/20 text-red-500'
                      }>
                        {project.status === 'ahead' ? 'Ahead' :
                         project.status === 'on_track' ? 'On Track' : 'At Risk'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <Progress value={project.progress} className="flex-1 h-2" />
                      <span className="text-sm font-medium">{project.progress}%</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      Due: {project.deadline}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Deal Cards */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg">Active Deals</CardTitle>
            <CardDescription>Track individual deal progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {deals.map((deal) => (
                <Card key={deal.id} className="bg-white/5 border-white/10 cursor-pointer hover:border-primary/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-medium">{deal.name}</p>
                        <p className="text-sm text-muted-foreground">{deal.product}</p>
                      </div>
                      {getStageBadge(deal.stage)}
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-2xl font-bold text-primary">${deal.value.toLocaleString()}</span>
                      <div className="flex items-center gap-1 text-sm">
                        <span className={deal.probability >= 70 ? 'text-green-500' : deal.probability >= 40 ? 'text-yellow-500' : 'text-red-500'}>
                          {deal.probability}%
                        </span>
                        <span className="text-muted-foreground">likely</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="text-xs bg-primary/20 text-primary">{deal.owner[0]}</AvatarFallback>
                        </Avatar>
                        <span className="text-muted-foreground">{deal.owner}</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {deal.daysInStage}d in stage
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default SalesDashboard;
