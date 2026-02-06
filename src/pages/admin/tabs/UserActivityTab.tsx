import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { callEdgeFunction } from '@/config/api';
import { useToast } from '@/hooks/use-toast';
import { useAdminApi } from '@/hooks/useAdminApi';
import { 
  RefreshCw, UserPlus, CreditCard, Gift, Bot, Mail, 
  CheckCircle, Clock, Filter, Search
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';

interface ActivityNotification {
  id: string;
  activity_type: string;
  portal: string;
  user_id: string | null;
  user_email: string;
  user_name: string | null;
  plan_name: string | null;
  amount: number | null;
  coupon_code: string | null;
  is_trial: boolean;
  details: Record<string, unknown>;
  email_sent: boolean;
  email_sent_at: string | null;
  created_at: string;
}

const activityConfig: Record<string, { label: string; icon: typeof UserPlus; color: string }> = {
  'signup': { label: 'Signup', icon: UserPlus, color: 'bg-blue-500' },
  'purchase': { label: 'Purchase', icon: CreditCard, color: 'bg-emerald-500' },
  'trial_activation': { label: 'Trial', icon: Gift, color: 'bg-amber-500' },
  'mt5_signup': { label: 'MT5 Signup', icon: Bot, color: 'bg-purple-500' },
  'mt5_trial': { label: 'MT5 Trial', icon: Gift, color: 'bg-orange-500' },
  'mt5_purchase': { label: 'MT5 Purchase', icon: CreditCard, color: 'bg-teal-500' },
};

export const UserActivityTab = () => {
  const [activities, setActivities] = useState<ActivityNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'main' | 'mt5'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSendingEmails, setIsSendingEmails] = useState(false);
  const { toast } = useToast();
  const { callAdminApi } = useAdminApi();

  const fetchActivities = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await callAdminApi('get_user_activity', { 
        page: 1, 
        limit: 100,
        portal: filter === 'all' ? undefined : filter 
      });
      setActivities((result.activities as ActivityNotification[]) || []);
    } catch (error: unknown) {
      console.error('Error fetching activities:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch user activities',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [callAdminApi, filter, toast]);

  useEffect(() => {
    fetchActivities();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('user-activity-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_activity_notifications',
        },
        (payload) => {
          const newActivity = payload.new as ActivityNotification;
          setActivities((prev) => [newActivity, ...prev]);
          
          // Show toast notification
          const config = activityConfig[newActivity.activity_type];
          toast({
            title: config?.label || 'New Activity',
            description: `${newActivity.user_email} - ${newActivity.portal === 'mt5' ? 'MT5 Portal' : 'Main Website'}`,
          });

          // Trigger email alert
          sendEmailAlert(newActivity);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filter]);

  const sendEmailAlert = async (notification: ActivityNotification) => {
    try {
      await callEdgeFunction('send-activity-alert', { action: 'send_alert', notification });
    } catch (error) {
      console.error('Failed to send email alert:', error);
    }
  };

  const processUnsentEmails = async () => {
    setIsSendingEmails(true);
    try {
      const { data: responseData, error: responseError } = await callEdgeFunction('send-activity-alert', { action: 'process_pending' });

      if (responseError) throw responseError;

      toast({
        title: 'Success',
        description: `Processed ${responseData?.processed || 0} pending email alerts`,
      });

      fetchActivities();
    } catch (error: unknown) {
      console.error('Error processing emails:', error);
      toast({
        title: 'Error',
        description: 'Failed to process pending emails',
        variant: 'destructive',
      });
    } finally {
      setIsSendingEmails(false);
    }
  };

  const filteredActivities = activities.filter((activity) => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      activity.user_email.toLowerCase().includes(search) ||
      activity.user_name?.toLowerCase().includes(search) ||
      activity.coupon_code?.toLowerCase().includes(search) ||
      activity.plan_name?.toLowerCase().includes(search)
    );
  });

  const stats = {
    total: activities.length,
    signups: activities.filter((a) => a.activity_type.includes('signup')).length,
    purchases: activities.filter((a) => a.activity_type.includes('purchase')).length,
    trials: activities.filter((a) => a.is_trial).length,
    pendingEmails: activities.filter((a) => !a.email_sent).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">User Activity</h2>
          <p className="text-muted-foreground">
            Track signups and purchases across all portals
          </p>
        </div>
        <div className="flex items-center gap-3">
          {stats.pendingEmails > 0 && (
            <Button 
              onClick={processUnsentEmails} 
              disabled={isSendingEmails}
              variant="outline"
              className="border-amber-500 text-amber-500 hover:bg-amber-500/10"
            >
              <Mail className={`h-4 w-4 mr-2 ${isSendingEmails ? 'animate-pulse' : ''}`} />
              Send {stats.pendingEmails} Pending Emails
            </Button>
          )}
          <Button onClick={fetchActivities} disabled={isLoading} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-foreground">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total Activities</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-500">{stats.signups}</p>
              <p className="text-sm text-muted-foreground">Signups</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-emerald-500">{stats.purchases}</p>
              <p className="text-sm text-muted-foreground">Purchases</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-amber-500">{stats.trials}</p>
              <p className="text-sm text-muted-foreground">Trial Activations</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-500">{stats.pendingEmails}</p>
              <p className="text-sm text-muted-foreground">Pending Emails</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email, name, or coupon..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
                <TabsList>
                  <TabsTrigger value="all">All Portals</TabsTrigger>
                  <TabsTrigger value="main">Main Website</TabsTrigger>
                  <TabsTrigger value="mt5">MT5 Portal</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Real-time feed of signups and purchases
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No activity found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Type</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Portal</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">User</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Plan</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Coupon</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Email Sent</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredActivities.map((activity) => {
                    const config = activityConfig[activity.activity_type] || {
                      label: activity.activity_type,
                      icon: UserPlus,
                      color: 'bg-gray-500',
                    };
                    const Icon = config.icon;

                    return (
                      <tr key={activity.id} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-lg ${config.color}`}>
                              <Icon className="h-3.5 w-3.5 text-white" />
                            </div>
                            <span className="text-sm font-medium text-foreground">{config.label}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={activity.portal === 'mt5' ? 'secondary' : 'outline'}>
                            {activity.portal === 'mt5' ? 'MT5' : 'Main'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="text-sm font-medium text-foreground">{activity.user_name || 'N/A'}</p>
                            <p className="text-xs text-muted-foreground">{activity.user_email}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-foreground">{activity.plan_name || '-'}</span>
                        </td>
                        <td className="py-3 px-4">
                          {activity.amount ? (
                            <span className="text-sm font-semibold text-emerald-500">
                              ${activity.amount.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {activity.coupon_code ? (
                            <Badge variant={activity.is_trial ? 'default' : 'secondary'} className={activity.is_trial ? 'bg-amber-500' : ''}>
                              {activity.coupon_code}
                            </Badge>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {activity.email_sent ? (
                            <div className="flex items-center gap-1 text-emerald-500">
                              <CheckCircle className="h-4 w-4" />
                              <span className="text-xs">Sent</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-amber-500">
                              <Clock className="h-4 w-4" />
                              <span className="text-xs">Pending</span>
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(activity.created_at), 'MMM d, HH:mm')}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
