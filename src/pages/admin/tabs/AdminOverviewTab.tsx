import { motion } from 'framer-motion';
import { 
  Users, 
  Activity, 
  DollarSign, 
  TrendingUp,
  UserPlus,
  Bot,
  MessageSquare,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import LiveChatMonitor from '@/components/admin/LiveChatMonitor';

interface AdminStats {
  users: { total: number; newThisWeek: number; activeMembers: number };
  signals: { total: number; today: number };
  payments: { totalRevenue: number; completedCount: number };
  bots: any[];
  tickets: { pending: number };
}

interface AdminOverviewTabProps {
  stats: AdminStats | null;
  onRefresh: () => void;
  onTabChange?: (tab: string) => void;
}

const AdminOverviewTab = ({ stats, onRefresh, onTabChange }: AdminOverviewTabProps) => {
  const statCards = [
    {
      title: 'Total Users',
      value: stats?.users.total || 0,
      icon: Users,
      change: `+${stats?.users.newThisWeek || 0} this week`,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Active Members',
      value: stats?.users.activeMembers || 0,
      icon: UserPlus,
      change: 'Paid subscriptions',
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      title: 'Total Signals',
      value: stats?.signals.total || 0,
      icon: Activity,
      change: `${stats?.signals.today || 0} today`,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      title: 'Total Revenue',
      value: `$${(stats?.payments.totalRevenue || 0).toFixed(2)}`,
      icon: DollarSign,
      change: `${stats?.payments.completedCount || 0} payments`,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
  ];

  const runningBots = stats?.bots?.filter(b => b.is_running).length || 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Dashboard Overview</h2>
          <p className="text-sm text-muted-foreground">Monitor your platform at a glance</p>
        </div>
        <Button onClick={onRefresh} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="bg-card/50 border-white/[0.08]">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className={`text-2xl font-bold mt-1 ${stat.color}`}>
                      {stat.value}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Live Chat Monitor */}
        <LiveChatMonitor onSelectSession={(sessionId) => {
          console.log('Navigate to session:', sessionId);
          onTabChange?.('guidance');
        }} />

        {/* Bot Status */}
        <Card className="bg-card/50 border-white/[0.08]">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bot className="w-5 h-5 text-accent" />
              Bot Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.bots?.map((bot) => (
                <div key={bot.bot_type} className="flex items-center justify-between">
                  <span className="capitalize text-sm">{bot.bot_type} Bot</span>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${bot.is_running ? 'bg-success animate-pulse' : 'bg-muted-foreground'}`} />
                    <span className={`text-xs ${bot.is_running ? 'text-success' : 'text-muted-foreground'}`}>
                      {bot.is_running ? 'Running' : 'Stopped'}
                    </span>
                  </div>
                </div>
              ))}
              {(!stats?.bots || stats.bots.length === 0) && (
                <p className="text-sm text-muted-foreground">No bots configured</p>
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-white/[0.08]">
              <p className="text-sm text-muted-foreground">
                {runningBots} of {stats?.bots?.length || 0} bots active
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Support Tickets */}
        <Card className="bg-card/50 border-white/[0.08]">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-warning" />
              Support Tickets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-warning">{stats?.tickets.pending || 0}</p>
                <p className="text-sm text-muted-foreground">Pending tickets</p>
              </div>
              <div className="p-3 rounded-xl bg-warning/10">
                <MessageSquare className="w-8 h-8 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-card/50 border-white/[0.08]">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              variant="outline" 
              className="w-full justify-start" 
              size="sm"
              onClick={() => onTabChange?.('signals')}
            >
              <Activity className="w-4 h-4 mr-2" />
              Create New Signal
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start" 
              size="sm"
              onClick={() => onTabChange?.('users')}
            >
              <Users className="w-4 h-4 mr-2" />
              View All Users
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start" 
              size="sm"
              onClick={() => onTabChange?.('tickets')}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Check Tickets
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminOverviewTab;
