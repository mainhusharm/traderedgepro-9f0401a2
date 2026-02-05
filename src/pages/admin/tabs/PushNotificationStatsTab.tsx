import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RefreshCw, Bell, CheckCircle, XCircle, AlertCircle, Clock, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAdminApi } from '@/hooks/useAdminApi';
import { format } from 'date-fns';

interface PushLog {
  id: string;
  user_id: string | null;
  notification_type: string;
  title: string;
  body: string | null;
  status: string;
  error_message: string | null;
  endpoint: string | null;
  created_at: string;
  delivered_at: string | null;
}

const PushNotificationStatsTab = () => {
  const { callAdminApi } = useAdminApi();
  const [logs, setLogs] = useState<PushLog[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    delivered: 0,
    failed: 0,
    noSubscription: 0,
    expired: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await callAdminApi('get_push_stats', {});

      const pushLogs = (result.recentLogs || []) as PushLog[];
      setLogs(filter === 'all' ? pushLogs : pushLogs.filter(l => l.status === filter));

      // Set stats from API
      setStats({
        total: result.totalSubscriptions || 0,
        delivered: result.stats?.sent || 0,
        failed: result.stats?.failed || 0,
        noSubscription: 0,
        expired: 0,
      });
    } catch (error) {
      console.error('Error fetching push logs:', error);
    } finally {
      setIsLoading(false);
    }
  }, [callAdminApi, filter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-destructive" />;
      case 'no_subscription':
        return <AlertCircle className="w-4 h-4 text-warning" />;
      case 'expired':
        return <Clock className="w-4 h-4 text-muted-foreground" />;
      default:
        return <Send className="w-4 h-4 text-primary" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      delivered: 'default',
      failed: 'destructive',
      no_subscription: 'secondary',
      expired: 'outline',
      pending: 'secondary',
    };
    return (
      <Badge variant={variants[status] || 'secondary'} className="text-xs">
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      vip_signal: 'text-primary',
      milestone: 'text-success',
      badge: 'text-warning',
      session: 'text-accent',
      test: 'text-muted-foreground',
    };
    return colors[type] || 'text-foreground';
  };

  const successRate = stats.total > 0 
    ? ((stats.delivered / stats.total) * 100).toFixed(1) 
    : '0';

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-background/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Bell className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Sent</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-background/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <CheckCircle className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-success">{stats.delivered}</p>
                <p className="text-xs text-muted-foreground">Delivered</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-background/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <XCircle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold text-destructive">{stats.failed}</p>
                <p className="text-xs text-muted-foreground">Failed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-background/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <AlertCircle className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold text-warning">{stats.noSubscription}</p>
                <p className="text-xs text-muted-foreground">No Sub</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-background/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <Send className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold text-accent">{successRate}%</p>
                <p className="text-xs text-muted-foreground">Success Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Logs Table */}
      <Card className="bg-background/50 border-border/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Push Notification Logs
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {['all', 'delivered', 'failed', 'no_subscription', 'expired'].map((f) => (
                <Button
                  key={f}
                  size="sm"
                  variant={filter === f ? 'default' : 'ghost'}
                  onClick={() => setFilter(f)}
                  className="text-xs"
                >
                  {f === 'all' ? 'All' : f.replace('_', ' ')}
                </Button>
              ))}
            </div>
            <Button size="sm" variant="outline" onClick={fetchLogs} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            {logs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No push notification logs found
              </div>
            ) : (
              <div className="space-y-2">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="mt-1">{getStatusIcon(log.status)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-medium text-sm ${getTypeColor(log.notification_type)}`}>
                          [{log.notification_type}]
                        </span>
                        <span className="text-sm truncate">{log.title}</span>
                        {getStatusBadge(log.status)}
                      </div>
                      {log.body && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{log.body}</p>
                      )}
                      {log.error_message && (
                        <p className="text-xs text-destructive mt-1">{log.error_message}</p>
                      )}
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        <span>{format(new Date(log.created_at), 'MMM d, HH:mm:ss')}</span>
                        {log.user_id && (
                          <span className="font-mono">{log.user_id.slice(0, 8)}...</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default PushNotificationStatsTab;
