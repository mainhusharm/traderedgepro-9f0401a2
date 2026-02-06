import { motion } from 'framer-motion';
import { TrendingUp, Users, FileText, MessageSquare, Target, Share2, Clock, ArrowUpRight, Bot, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useMarketingStats, useLeads, useSupportTickets, useBlogPosts, useSocialPosts } from '@/hooks/useMarketingData';
import { Skeleton } from '@/components/ui/skeleton';
import AIAutomationPanel from '@/components/marketing/AIAutomationPanel';
const AI_EMPLOYEES = [
  { id: 'aria', name: 'ARIA', role: 'Executive Assistant', avatar: '👩‍💼', color: 'from-violet-500 to-purple-600', status: 'online' },
  { id: 'blake', name: 'BLAKE', role: 'Lead Generation', avatar: '🎯', color: 'from-emerald-500 to-teal-600', status: 'online' },
  { id: 'nova', name: 'NOVA', role: 'Receptionist', avatar: '👋', color: 'from-pink-500 to-rose-600', status: 'online' },
  { id: 'sage', name: 'SAGE', role: 'SEO Blog Writer', avatar: '✍️', color: 'from-amber-500 to-orange-600', status: 'busy' },
  { id: 'maya', name: 'MAYA', role: 'Social Media', avatar: '📱', color: 'from-cyan-500 to-blue-600', status: 'online' },
  { id: 'zoe', name: 'ZOE', role: 'Customer Support', avatar: '💬', color: 'from-indigo-500 to-purple-600', status: 'online' },
  { id: 'lexi', name: 'LEXI', role: 'Legal & Compliance', avatar: '⚖️', color: 'from-slate-500 to-gray-600', status: 'online' },
];

const MarketingOverviewTab = () => {
  const { stats, isLoading, refetch } = useMarketingStats();
  const { leads } = useLeads();
  const { tickets } = useSupportTickets();
  const { posts: blogPosts } = useBlogPosts();
  const { posts: socialPosts } = useSocialPosts();

  // Build recent activity from real data
  const recentActivity = [
    ...(tickets.slice(0, 2).map(t => ({ 
      agent: 'ZOE', 
      action: `Handled ticket: ${t.subject}`, 
      time: new Date(t.created_at).toLocaleString() 
    }))),
    ...(socialPosts.slice(0, 2).map(p => ({ 
      agent: 'MAYA', 
      action: `${p.status === 'published' ? 'Published' : 'Scheduled'} social post`, 
      time: new Date(p.created_at).toLocaleString() 
    }))),
    ...(blogPosts.slice(0, 1).map(p => ({ 
      agent: 'SAGE', 
      action: `${p.status === 'published' ? 'Published' : 'Drafted'}: "${p.title}"`, 
      time: new Date(p.created_at).toLocaleString() 
    }))),
    ...(leads.slice(0, 1).map(l => ({ 
      agent: 'BLAKE', 
      action: `Added lead: ${l.company_name}`, 
      time: new Date(l.created_at).toLocaleString() 
    }))),
  ].slice(0, 5);

  const displayStats = [
    { label: 'Total Leads', value: stats.totalLeads, change: `${stats.qualifiedLeads} qualified`, icon: Target, color: 'text-blue-400' },
    { label: 'Blog Posts', value: stats.totalPosts, change: `${stats.publishedPosts} published`, icon: FileText, color: 'text-amber-400' },
    { label: 'Support Tickets', value: stats.openTickets + stats.resolvedTickets, change: `${stats.resolvedTickets} resolved`, icon: MessageSquare, color: 'text-purple-400' },
    { label: 'Tasks Done', value: stats.tasksCompleted, change: 'completed', icon: TrendingUp, color: 'text-green-400' },
  ];

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Welcome to Marketing Command Center</h2>
              <p className="text-muted-foreground">Your AI team is working 24/7 to grow your business.</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={refetch} className="hidden md:flex">
                <RefreshCw className="w-4 h-4 mr-2" />Refresh
              </Button>
              <div className="hidden md:flex items-center gap-2">
                {AI_EMPLOYEES.slice(0, 4).map((ai, index) => (
                  <motion.div key={ai.id} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.1 }}
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${ai.color} flex items-center justify-center text-xl shadow-lg`}>
                    {ai.avatar}
                  </motion.div>
                ))}
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-sm font-bold">+3</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {displayStats.map((stat, index) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
            <Card className="bg-background/50 backdrop-blur border-white/10">
              <CardContent className="p-6">
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-3xl font-bold mt-1">{stat.value}</p>
                      <p className={`text-sm ${stat.color} mt-1 flex items-center gap-1`}>
                        <ArrowUpRight className="w-3 h-3" />{stat.change}
                      </p>
                    </div>
                    <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center ${stat.color}`}>
                      <stat.icon className="w-6 h-6" />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* AI Automation Panel */}
      <AIAutomationPanel />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-background/50 backdrop-blur border-white/10">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="flex items-center gap-2"><Bot className="w-5 h-5 text-primary" />AI Team Status</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {AI_EMPLOYEES.map((ai) => (
                <div key={ai.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                  <div className="relative">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${ai.color} flex items-center justify-center text-xl`}>{ai.avatar}</div>
                    <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background ${ai.status === 'online' ? 'bg-green-500' : 'bg-amber-500'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold">{ai.name}</p>
                      <Badge variant="outline" className="text-xs">{ai.role}</Badge>
                    </div>
                    <p className="text-xs text-green-400 mt-1">Ready to assist</p>
                  </div>
                  <div className="w-16 text-right">
                    <span className="text-xs text-muted-foreground">Active</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-background/50 backdrop-blur border-white/10">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="flex items-center gap-2"><Clock className="w-5 h-5 text-primary" />Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No recent activity. Start using the AI team!</p>
            ) : (
              recentActivity.map((activity, index) => {
                const ai = AI_EMPLOYEES.find(e => e.name === activity.agent);
                return (
                  <div key={index} className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${ai?.color} flex items-center justify-center text-sm shrink-0`}>{ai?.avatar}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm"><span className="font-medium">{activity.agent}</span> <span className="text-muted-foreground">{activity.action}</span></p>
                      <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Target, color: 'text-emerald-400', title: 'Generate Leads', sub: 'Ask BLAKE' },
          { icon: FileText, color: 'text-amber-400', title: 'Write Content', sub: 'Ask SAGE' },
          { icon: Share2, color: 'text-cyan-400', title: 'Social Posts', sub: 'Ask MAYA' },
          { icon: Users, color: 'text-indigo-400', title: 'Team Sync', sub: 'Coordinate AI' },
        ].map((action) => (
          <Card key={action.title} className="bg-background/50 backdrop-blur border-white/10 cursor-pointer hover:bg-white/5 transition-colors">
            <CardContent className="p-4 text-center">
              <action.icon className={`w-8 h-8 ${action.color} mx-auto mb-2`} />
              <p className="font-medium">{action.title}</p>
              <p className="text-xs text-muted-foreground">{action.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MarketingOverviewTab;
