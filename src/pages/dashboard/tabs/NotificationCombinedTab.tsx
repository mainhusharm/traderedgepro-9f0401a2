import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  Bell, 
  BellOff,
  TrendingUp, 
  Award, 
  Target, 
  Calendar, 
  CheckCircle, 
  Clock,
  Search,
  Trash2,
  CheckCheck,
  Megaphone,
  AlertCircle,
  Settings,
  Volume2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: any;
  is_read: boolean;
  created_at: string;
}

interface NotificationPreferences {
  vip_signals: boolean;
  badges: boolean;
  milestones: boolean;
  sessions: boolean;
  email_notifications: boolean;
}

const NOTIFICATION_TYPES = [
  { value: 'all', label: 'All' },
  { value: 'signal', label: 'Signals' },
  { value: 'badge', label: 'Badges' },
  { value: 'milestone', label: 'Milestones' },
  { value: 'session', label: 'Sessions' },
  { value: 'announcement', label: 'Announcements' },
];

const NotificationCombinedTab = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('history');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchPreferences();
      setupRealtimeSubscription();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('user_notifications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setPreferences(data);
      } else {
        // Create default preferences
        const defaultPrefs = {
          user_id: user?.id,
          vip_signals: true,
          badges: true,
          milestones: true,
          sessions: true,
          email_notifications: true,
        };
        await supabase.from('notification_preferences').insert(defaultPrefs);
        setPreferences(defaultPrefs);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('user_notifications_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_notifications',
          filter: `user_id=eq.${user?.id}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const markAsRead = async (id: string) => {
    try {
      await supabase
        .from('user_notifications')
        .update({ is_read: true })
        .eq('id', id);

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await supabase
        .from('user_notifications')
        .update({ is_read: true })
        .eq('user_id', user?.id)
        .eq('is_read', false);

      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true }))
      );
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await supabase
        .from('user_notifications')
        .delete()
        .eq('id', id);

      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const updatePreference = async (key: keyof NotificationPreferences, value: boolean) => {
    if (!preferences) return;

    try {
      await supabase
        .from('notification_preferences')
        .update({ [key]: value })
        .eq('user_id', user?.id);

      setPreferences({ ...preferences, [key]: value });
      toast.success('Preference updated');
    } catch (error) {
      console.error('Error updating preference:', error);
      toast.error('Failed to update preference');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'signal':
      case 'vip_signal':
        return <TrendingUp className="w-5 h-5 text-primary" />;
      case 'badge':
        return <Award className="w-5 h-5 text-yellow-400" />;
      case 'milestone':
        return <Target className="w-5 h-5 text-success" />;
      case 'session':
        return <Calendar className="w-5 h-5 text-blue-400" />;
      case 'announcement':
      case 'update':
        return <Megaphone className="w-5 h-5 text-purple-400" />;
      case 'promotion':
        return <AlertCircle className="w-5 h-5 text-orange-400" />;
      default:
        return <Bell className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    const matchesType = filterType === 'all' || n.type === filterType || 
      (filterType === 'announcement' && ['announcement', 'update', 'promotion'].includes(n.type));
    const matchesSearch = 
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.message.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="w-6 h-6 text-primary" />
            Notifications
          </h2>
          <p className="text-muted-foreground mt-1">
            View your notification history and manage preferences
          </p>
        </div>
        {unreadCount > 0 && activeTab === 'history' && (
          <Button variant="outline" onClick={markAllAsRead} className="gap-2">
            <CheckCheck className="w-4 h-4" />
            Mark all as read ({unreadCount})
          </Button>
        )}
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="history" className="gap-2">
            <Bell className="w-4 h-4" />
            History
            {unreadCount > 0 && (
              <Badge className="ml-1 bg-primary/20 text-primary">{unreadCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="preferences" className="gap-2">
            <Settings className="w-4 h-4" />
            Preferences
          </TabsTrigger>
        </TabsList>

        {/* History Tab */}
        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Notification History</CardTitle>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 w-48"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filter Tabs */}
              <Tabs value={filterType} onValueChange={setFilterType} className="mb-4">
                <TabsList className="flex-wrap h-auto gap-1">
                  {NOTIFICATION_TYPES.map((type) => (
                    <TabsTrigger key={type.value} value={type.value} className="text-xs">
                      {type.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <BellOff className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No notifications found</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-2">
                    {filteredNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`flex items-start gap-4 p-4 rounded-lg border transition-colors cursor-pointer ${
                          notification.is_read
                            ? 'bg-transparent border-white/5 hover:bg-white/5'
                            : 'bg-primary/5 border-primary/20 hover:bg-primary/10'
                        }`}
                        onClick={() => !notification.is_read && markAsRead(notification.id)}
                      >
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className={`font-medium ${!notification.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                              {notification.title}
                            </h4>
                            {!notification.is_read && (
                              <span className="w-2 h-2 rounded-full bg-primary" />
                            )}
                            <Badge variant="outline" className="text-xs capitalize">
                              {notification.type.replace('_', ' ')}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {!notification.is_read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                              className="h-8 w-8 p-0"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-risk"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Volume2 className="w-5 h-5" />
                  Push Notifications
                </CardTitle>
                <CardDescription>
                  Choose which notifications you want to receive
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {preferences && (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="font-medium">VIP Signal Alerts</Label>
                        <p className="text-sm text-muted-foreground">
                          Get notified for new VIP trading signals
                        </p>
                      </div>
                      <Switch
                        checked={preferences.vip_signals}
                        onCheckedChange={(v) => updatePreference('vip_signals', v)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="font-medium">Badge Achievements</Label>
                        <p className="text-sm text-muted-foreground">
                          Get notified when you earn new badges
                        </p>
                      </div>
                      <Switch
                        checked={preferences.badges}
                        onCheckedChange={(v) => updatePreference('badges', v)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="font-medium">Milestone Celebrations</Label>
                        <p className="text-sm text-muted-foreground">
                          Get notified when you reach trading milestones
                        </p>
                      </div>
                      <Switch
                        checked={preferences.milestones}
                        onCheckedChange={(v) => updatePreference('milestones', v)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="font-medium">Session Reminders</Label>
                        <p className="text-sm text-muted-foreground">
                          Get notified about upcoming guidance sessions
                        </p>
                      </div>
                      <Switch
                        checked={preferences.sessions}
                        onCheckedChange={(v) => updatePreference('sessions', v)}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Email Notifications
                </CardTitle>
                <CardDescription>
                  Manage your email notification preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {preferences && (
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive email notifications for important updates
                      </p>
                    </div>
                    <Switch
                      checked={preferences.email_notifications}
                      onCheckedChange={(v) => updatePreference('email_notifications', v)}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NotificationCombinedTab;
