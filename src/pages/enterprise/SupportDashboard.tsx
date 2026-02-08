import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HeadphonesIcon,
  ArrowLeft,
  RefreshCw,
  Search,
  Filter,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  User,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Users,
  TrendingUp,
  BarChart2,
  Settings,
  Mail
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import Header from '@/components/layout/Header';
import { toast } from 'sonner';

// Mock data
const ticketsData = [
  { id: 'TKT-001', subject: 'Payment not processing', user: 'john@example.com', category: 'payment', priority: 'high', status: 'new', assignee: 'Sarah', created: '2 hours ago' },
  { id: 'TKT-002', subject: 'App crashing on login', user: 'jane@example.com', category: 'bug', priority: 'urgent', status: 'in_progress', assignee: 'Mike', created: '3 hours ago' },
  { id: 'TKT-003', subject: 'Need help with onboarding', user: 'bob@example.com', category: 'onboarding', priority: 'medium', status: 'new', assignee: null, created: '4 hours ago' },
  { id: 'TKT-004', subject: 'Cannot access dashboard', user: 'alice@example.com', category: 'login', priority: 'high', status: 'in_progress', assignee: 'Sarah', created: '5 hours ago' },
  { id: 'TKT-005', subject: 'Subscription renewal issue', user: 'charlie@example.com', category: 'payment', priority: 'medium', status: 'resolved', assignee: 'Tom', created: '1 day ago' },
  { id: 'TKT-006', subject: 'Feature request: Dark mode', user: 'dave@example.com', category: 'feature', priority: 'low', status: 'resolved', assignee: 'Mike', created: '2 days ago' },
];

const issueCategories = [
  { name: 'Payment Issues', count: 34, percentage: 28, color: '#ef4444' },
  { name: 'App Bugs', count: 28, percentage: 23, color: '#f59e0b' },
  { name: 'Onboarding', count: 25, percentage: 20, color: '#6366f1' },
  { name: 'Login Problems', count: 20, percentage: 16, color: '#22c55e' },
  { name: 'Other', count: 16, percentage: 13, color: '#8b5cf6' },
];

const responseTimeData = [
  { day: 'Mon', avgTime: 1.8 },
  { day: 'Tue', avgTime: 2.1 },
  { day: 'Wed', avgTime: 1.5 },
  { day: 'Thu', avgTime: 2.4 },
  { day: 'Fri', avgTime: 1.9 },
  { day: 'Sat', avgTime: 3.2 },
  { day: 'Sun', avgTime: 2.8 },
];

const teamMembers = [
  { name: 'Sarah Johnson', role: 'Support Lead', avatar: 'SJ', tickets: 12, rating: 4.8, status: 'online' },
  { name: 'Mike Williams', role: 'Support Agent', avatar: 'MW', tickets: 8, rating: 4.6, status: 'online' },
  { name: 'Tom Brown', role: 'Support Agent', avatar: 'TB', tickets: 6, rating: 4.9, status: 'away' },
  { name: 'Emily Davis', role: 'Support Agent', avatar: 'ED', tickets: 9, rating: 4.7, status: 'offline' },
];

const SupportDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRuleDialogOpen, setIsRuleDialogOpen] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const getFilteredTickets = () => {
    return ticketsData.filter(ticket => {
      const matchesSearch = ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || ticket.category === categoryFilter;
      const matchesTab = activeTab === 'all' ||
        (activeTab === 'new' && ticket.status === 'new') ||
        (activeTab === 'in_progress' && ticket.status === 'in_progress') ||
        (activeTab === 'resolved' && ticket.status === 'resolved');
      return matchesSearch && matchesCategory && matchesTab;
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <Badge className="bg-blue-500/20 text-blue-500"><AlertCircle className="w-3 h-3 mr-1" />New</Badge>;
      case 'in_progress':
        return <Badge className="bg-yellow-500/20 text-yellow-500"><Clock className="w-3 h-3 mr-1" />In Progress</Badge>;
      case 'resolved':
        return <Badge className="bg-green-500/20 text-green-500"><CheckCircle className="w-3 h-3 mr-1" />Resolved</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="destructive">Urgent</Badge>;
      case 'high':
        return <Badge className="bg-orange-500/20 text-orange-500">High</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500/20 text-yellow-500">Medium</Badge>;
      case 'low':
        return <Badge className="bg-gray-500/20 text-gray-500">Low</Badge>;
      default:
        return <Badge>{priority}</Badge>;
    }
  };

  const handleCreateRule = () => {
    toast.success('Automation rule created successfully');
    setIsRuleDialogOpen(false);
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
                <HeadphonesIcon className="w-6 h-6 text-purple-500" />
                Support Dashboard
              </h1>
              <p className="text-sm text-muted-foreground">
                Ticket management and support analytics
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={isRuleDialogOpen} onOpenChange={setIsRuleDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Settings className="w-4 h-4 mr-2" />
                  Create Rule
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Automation Rule</DialogTitle>
                  <DialogDescription>
                    Set up automatic ticket routing and responses
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Rule Name</Label>
                    <Input placeholder="e.g., Auto-assign payment issues" />
                  </div>
                  <div className="space-y-2">
                    <Label>When category is</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="payment">Payment Issues</SelectItem>
                        <SelectItem value="bug">App Bugs</SelectItem>
                        <SelectItem value="onboarding">Onboarding</SelectItem>
                        <SelectItem value="login">Login Problems</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Then assign to</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select team member" />
                      </SelectTrigger>
                      <SelectContent>
                        {teamMembers.map((member) => (
                          <SelectItem key={member.name} value={member.name}>{member.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Auto-response (optional)</Label>
                    <Textarea placeholder="Enter automatic response message..." />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsRuleDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreateRule}>Create Rule</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
                  <p className="text-sm text-muted-foreground">Open Tickets</p>
                  <p className="text-2xl font-bold">23</p>
                  <p className="text-xs text-red-500">+5 from yesterday</p>
                </div>
                <div className="p-3 rounded-full bg-blue-500/10">
                  <MessageSquare className="w-6 h-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Response Time</p>
                  <p className="text-2xl font-bold">2.4h</p>
                  <p className="text-xs text-green-500">-18% from last week</p>
                </div>
                <div className="p-3 rounded-full bg-green-500/10">
                  <Clock className="w-6 h-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Satisfaction Rate</p>
                  <p className="text-2xl font-bold">94%</p>
                  <p className="text-xs text-green-500">+2% from last week</p>
                </div>
                <div className="p-3 rounded-full bg-primary/10">
                  <ThumbsUp className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Resolution Rate</p>
                  <p className="text-2xl font-bold">87%</p>
                  <p className="text-xs text-green-500">+5% from last week</p>
                </div>
                <div className="p-3 rounded-full bg-purple-500/10">
                  <CheckCircle className="w-6 h-6 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Issue Categories */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg">Issue Categories</CardTitle>
              <CardDescription>Breakdown of support tickets by type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {issueCategories.map((category, index) => (
                  <div key={index}>
                    <div className="flex justify-between text-sm mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                        <span>{category.name}</span>
                      </div>
                      <span className="text-muted-foreground">{category.count} tickets ({category.percentage}%)</span>
                    </div>
                    <Progress value={category.percentage} className="h-2" style={{ '--progress-background': category.color } as any} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Response Time Chart */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg">Response Time Trend</CardTitle>
              <CardDescription>Average response time by day</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={responseTimeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="day" stroke="#888" />
                    <YAxis stroke="#888" tickFormatter={(value) => `${value}h`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                      formatter={(value: number) => [`${value} hours`, 'Avg Time']}
                    />
                    <Line type="monotone" dataKey="avgTime" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Team Assignment */}
        <Card className="glass-card mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Team Assignment</CardTitle>
            <CardDescription>Current workload and performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {teamMembers.map((member, index) => (
                <Card key={index} className="bg-white/5 border-white/10">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="relative">
                        <Avatar>
                          <AvatarFallback className="bg-primary/20 text-primary">{member.avatar}</AvatarFallback>
                        </Avatar>
                        <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background ${
                          member.status === 'online' ? 'bg-green-500' :
                          member.status === 'away' ? 'bg-yellow-500' : 'bg-gray-500'
                        }`} />
                      </div>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{member.role}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Active Tickets</span>
                      <span className="font-semibold">{member.tickets}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span className="text-muted-foreground">Rating</span>
                      <span className="font-semibold text-yellow-500">{member.rating}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tickets Table */}
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Ticket Management</CardTitle>
                <CardDescription>Track and manage support tickets</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tickets..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-[200px]"
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[150px]">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="payment">Payment</SelectItem>
                    <SelectItem value="bug">Bug</SelectItem>
                    <SelectItem value="onboarding">Onboarding</SelectItem>
                    <SelectItem value="login">Login</SelectItem>
                    <SelectItem value="feature">Feature</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="all">All Tickets</TabsTrigger>
                <TabsTrigger value="new">New</TabsTrigger>
                <TabsTrigger value="in_progress">In Progress</TabsTrigger>
                <TabsTrigger value="resolved">Resolved</TabsTrigger>
              </TabsList>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket ID</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assignee</TableHead>
                    <TableHead className="text-right">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getFilteredTickets().map((ticket) => (
                    <TableRow key={ticket.id} className="cursor-pointer hover:bg-white/5">
                      <TableCell className="font-mono">{ticket.id}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{ticket.subject}</TableCell>
                      <TableCell>{ticket.user}</TableCell>
                      <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                      <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                      <TableCell>
                        {ticket.assignee ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="w-6 h-6">
                              <AvatarFallback className="text-xs bg-primary/20 text-primary">
                                {ticket.assignee.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{ticket.assignee}</span>
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">Unassigned</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">{ticket.created}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default SupportDashboard;
