import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Bot, 
  MessageSquare, 
  FileText, 
  Users, 
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Activity,
  Zap,
  Heart,
  Send,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';

interface AgentActivity {
  id: string;
  agent: string;
  action: string;
  target: string;
  status: 'success' | 'error' | 'pending';
  timestamp: string;
  details?: string;
}

interface MarketingStats {
  totalLeads: number;
  qualifiedLeads: number;
  totalBlogPosts: number;
  publishedPosts: number;
  openTickets: number;
  resolvedTickets: number;
  socialPosts: number;
  engagementQueue: number;
  engagementsSent: number;
  tasksCompleted: number;
  pendingTasks: number;
}

const AI_AGENTS = [
  { id: 'receptionist', name: 'Riley', role: 'Receptionist', color: 'bg-blue-500' },
  { id: 'lead_gen', name: 'Luna', role: 'Lead Generation', color: 'bg-purple-500' },
  { id: 'social_media', name: 'Max', role: 'Social Media', color: 'bg-pink-500' },
  { id: 'seo_writer', name: 'Sage', role: 'SEO Writer', color: 'bg-green-500' },
  { id: 'customer_support', name: 'Casey', role: 'Customer Support', color: 'bg-orange-500' },
  { id: 'engagement', name: 'Echo', role: 'Engagement Expert', color: 'bg-cyan-500' },
  { id: 'legal', name: 'Lex', role: 'Legal & Compliance', color: 'bg-red-500' },
  { id: 'exec_assistant', name: 'Eva', role: 'Executive Assistant', color: 'bg-indigo-500' },
];

const MarketingAIOverviewTab = () => {
  const [stats, setStats] = useState<MarketingStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<AgentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch all stats in parallel
      const [
        leadsRes,
        postsRes,
        ticketsRes,
        socialRes,
        engagementQueueRes,
        engagementHistoryRes,
        tasksRes
      ] = await Promise.all([
        supabase.from('marketing_leads_v2').select('status'),
        supabase.from('marketing_blog_posts_v2').select('status'),
        supabase.from('marketing_support_tickets').select('status, ai_confidence, created_at, customer_name, subject'),
        supabase.from('marketing_social_posts').select('status, created_at, content, platforms'),
        (supabase.from('marketing_engagement_queue' as any).select('status, created_at, platform, post_content, sentiment') as any),
        (supabase.from('marketing_engagement_history' as any).select('action_type, created_at, platform, reply_content, was_auto') as any),
        supabase.from('marketing_tasks_v2').select('status, assigned_to, title, created_at')
      ]);

      const leads = leadsRes.data || [];
      const posts = postsRes.data || [];
      const tickets = ticketsRes.data || [];
      const social = socialRes.data || [];
      const queue = engagementQueueRes.data || [];
      const history = engagementHistoryRes.data || [];
      const tasks = tasksRes.data || [];

      setStats({
        totalLeads: leads.length,
        qualifiedLeads: leads.filter(l => l.status === 'qualified' || l.status === 'negotiating').length,
        totalBlogPosts: posts.length,
        publishedPosts: posts.filter(p => p.status === 'published').length,
        openTickets: tickets.filter(t => t.status !== 'resolved').length,
        resolvedTickets: tickets.filter(t => t.status === 'resolved').length,
        socialPosts: social.length,
        engagementQueue: queue.filter(q => q.status === 'pending').length,
        engagementsSent: history.length,
        tasksCompleted: tasks.filter(t => t.status === 'done').length,
        pendingTasks: tasks.filter(t => t.status !== 'done').length
      });

      // Build activity feed from various sources
      const activities: AgentActivity[] = [];

      // Add ticket activities (Casey - Support)
      tickets.slice(0, 5).forEach(t => {
        activities.push({
          id: `ticket-${Math.random()}`,
          agent: 'Casey',
          action: 'Handled support ticket',
          target: (t as any).subject || 'Support request',
          status: (t as any).ai_confidence && (t as any).ai_confidence > 0.7 ? 'success' : 'pending',
          timestamp: (t as any).created_at,
          details: `Customer: ${(t as any).customer_name}`
        });
      });

      // Add social post activities (Max - Social Media)
      social.slice(0, 5).forEach(s => {
        activities.push({
          id: `social-${Math.random()}`,
          agent: 'Max',
          action: s.status === 'published' ? 'Published post' : 'Drafted post',
          target: (s.platforms || []).join(', ') || 'Social media',
          status: s.status === 'published' ? 'success' : 'pending',
          timestamp: s.created_at,
          details: (s.content || '').substring(0, 50) + '...'
        });
      });

      // Add engagement activities (Echo - Engagement)
      history.slice(0, 5).forEach(h => {
        activities.push({
          id: `engagement-${Math.random()}`,
          agent: 'Echo',
          action: h.action_type === 'reply' ? 'Sent reply' : h.action_type === 'like' ? 'Liked post' : 'Engaged',
          target: h.platform || 'Social',
          status: 'success',
          timestamp: h.created_at,
          details: h.was_auto ? 'Auto-generated' : 'Manual'
        });
      });

      // Add blog activities (Sage - SEO Writer)
      posts.slice(0, 3).forEach(p => {
        activities.push({
          id: `blog-${Math.random()}`,
          agent: 'Sage',
          action: p.status === 'published' ? 'Published article' : 'Drafted article',
          target: 'Blog',
          status: p.status === 'published' ? 'success' : 'pending',
          timestamp: (p as any).created_at || new Date().toISOString()
        });
      });

      // Sort by timestamp
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setRecentActivity(activities.slice(0, 15));
    } catch (error) {
      console.error('Error fetching marketing data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getAgentColor = (agentName: string) => {
    const agent = AI_AGENTS.find(a => a.name === agentName);
    return agent?.color || 'bg-gray-500';
  };

  const statCards = [
    { 
      title: 'Total Leads', 
      value: stats?.totalLeads || 0, 
      subValue: `${stats?.qualifiedLeads || 0} qualified`,
      icon: Users, 
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10'
    },
    { 
      title: 'Blog Posts', 
      value: stats?.totalBlogPosts || 0, 
      subValue: `${stats?.publishedPosts || 0} published`,
      icon: FileText, 
      color: 'text-green-400',
      bgColor: 'bg-green-500/10'
    },
    { 
      title: 'Support Tickets', 
      value: stats?.openTickets || 0, 
      subValue: `${stats?.resolvedTickets || 0} resolved`,
      icon: MessageSquare, 
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10'
    },
    { 
      title: 'Engagements', 
      value: stats?.engagementsSent || 0, 
      subValue: `${stats?.engagementQueue || 0} in queue`,
      icon: Heart, 
      color: 'text-pink-400',
      bgColor: 'bg-pink-500/10'
    },
    { 
      title: 'Social Posts', 
      value: stats?.socialPosts || 0, 
      subValue: 'Total created',
      icon: Send, 
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10'
    },
    { 
      title: 'Tasks', 
      value: stats?.tasksCompleted || 0, 
      subValue: `${stats?.pendingTasks || 0} pending`,
      icon: CheckCircle, 
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10'
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Bot className="w-5 h-5 text-purple-400" />
            Marketing AI Overview
          </h2>
          <p className="text-sm text-muted-foreground">
            Monitor all AI agents and their activities
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchData} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => navigate('/marketing')} variant="default" size="sm">
            <ExternalLink className="w-4 h-4 mr-2" />
            Open Marketing Dashboard
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="bg-card/50 border-white/[0.08]">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                  <div>
                    <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.title}</p>
                    <p className="text-xs text-muted-foreground/60">{stat.subValue}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Agents Status */}
        <Card className="bg-card/50 border-white/[0.08]">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              AI Team Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {AI_AGENTS.map((agent) => (
                <div key={agent.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full ${agent.color} flex items-center justify-center text-white text-xs font-bold`}>
                      {agent.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{agent.name}</p>
                      <p className="text-xs text-muted-foreground">{agent.role}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/20">
                    Active
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity Feed */}
        <Card className="lg:col-span-2 bg-card/50 border-white/[0.08]">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-400" />
              Recent Agent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/[0.08]">
                    <TableHead className="w-24">Agent</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead className="w-20">Status</TableHead>
                    <TableHead className="w-28">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentActivity.map((activity) => (
                    <TableRow key={activity.id} className="border-white/[0.08]">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full ${getAgentColor(activity.agent)} flex items-center justify-center text-white text-xs font-bold`}>
                            {activity.agent[0]}
                          </div>
                          <span className="text-xs font-medium">{activity.agent}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{activity.action}</p>
                          <p className="text-xs text-muted-foreground">{activity.target}</p>
                          {activity.details && (
                            <p className="text-xs text-muted-foreground/60 truncate max-w-[200px]">{activity.details}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            activity.status === 'success' 
                              ? 'bg-success/10 text-success border-success/20' 
                              : activity.status === 'error'
                              ? 'bg-destructive/10 text-destructive border-destructive/20'
                              : 'bg-warning/10 text-warning border-warning/20'
                          }`}
                        >
                          {activity.status === 'success' && <CheckCircle className="w-3 h-3 mr-1" />}
                          {activity.status === 'error' && <AlertTriangle className="w-3 h-3 mr-1" />}
                          {activity.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                          {activity.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                  {recentActivity.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        No recent activity
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Performance Summary */}
      <Card className="bg-card/50 border-white/[0.08]">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            AI Performance Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-white/5">
              <p className="text-2xl font-bold text-success">{stats?.resolvedTickets || 0}</p>
              <p className="text-sm text-muted-foreground">Tickets Auto-Resolved</p>
              <p className="text-xs text-success">By Casey (Support)</p>
            </div>
            <div className="p-4 rounded-lg bg-white/5">
              <p className="text-2xl font-bold text-purple-400">{stats?.engagementsSent || 0}</p>
              <p className="text-sm text-muted-foreground">Engagements Sent</p>
              <p className="text-xs text-purple-400">By Echo (Engagement)</p>
            </div>
            <div className="p-4 rounded-lg bg-white/5">
              <p className="text-2xl font-bold text-blue-400">{stats?.socialPosts || 0}</p>
              <p className="text-sm text-muted-foreground">Posts Created</p>
              <p className="text-xs text-blue-400">By Max (Social)</p>
            </div>
            <div className="p-4 rounded-lg bg-white/5">
              <p className="text-2xl font-bold text-green-400">{stats?.publishedPosts || 0}</p>
              <p className="text-sm text-muted-foreground">Articles Published</p>
              <p className="text-xs text-green-400">By Sage (SEO)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MarketingAIOverviewTab;
