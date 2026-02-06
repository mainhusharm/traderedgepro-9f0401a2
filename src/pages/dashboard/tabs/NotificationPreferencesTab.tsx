import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Bell,
  Mail,
  Smartphone,
  TrendingUp,
  Award,
  Calendar,
  MessageSquare,
  BarChart3,
  Shield,
  Volume2,
  VolumeX,
  Check,
  X,
  RefreshCw,
  Trash2,
  Settings,
  BellRing,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { format } from 'date-fns';

interface UserNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, any> | null;
  is_read: boolean;
  created_at: string;
}

interface NotificationPreferences {
  // Push Notifications
  push_enabled: boolean;
  push_signals: boolean;
  push_vip_signals: boolean;
  push_trade_updates: boolean;
  push_milestones: boolean;
  push_badges: boolean;
  push_guidance: boolean;
  push_economic_events: boolean;
  
  // Email Notifications
  email_enabled: boolean;
  email_performance_reports: boolean;
  email_weekly_summary: boolean;
  email_monthly_report: boolean;
  email_milestone_notifications: boolean;
  email_badge_notifications: boolean;
  email_signal_summary: boolean;
  email_trading_tips: boolean;
  email_promotional: boolean;
  
  // Sound
  sound_enabled: boolean;
}

const defaultPreferences: NotificationPreferences = {
  push_enabled: true,
  push_signals: true,
  push_vip_signals: true,
  push_trade_updates: true,
  push_milestones: true,
  push_badges: true,
  push_guidance: true,
  push_economic_events: false,
  
  email_enabled: true,
  email_performance_reports: true,
  email_weekly_summary: true,
  email_monthly_report: true,
  email_milestone_notifications: true,
  email_badge_notifications: true,
  email_signal_summary: false,
  email_trading_tips: false,
  email_promotional: false,
  
  sound_enabled: true,
};

const NotificationPreferencesTab = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('preferences');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    push: true,
    email: true,
  });

  useEffect(() => {
    if (user) {
      fetchPreferences();
      fetchNotifications();
      
      // Subscribe to real-time notifications
      const channel = supabase
        .channel(`user-notifications-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'user_notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            const newNotif = payload.new as UserNotification;
            setNotifications(prev => [newNotif, ...prev]);
            toast.info(newNotif.title, { description: newNotif.message.slice(0, 100) });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchPreferences = async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase
        .from('profiles')
        .select('email_preferences')
        .eq('user_id', user.id)
        .single();

      if (data?.email_preferences) {
        setPreferences(prev => ({
          ...prev,
          ...(data.email_preferences as object)
        }));
      }

      // Load push notification settings from localStorage
      const storedNotifications = localStorage.getItem('notification_settings');
      if (storedNotifications) {
        try {
          const parsed = JSON.parse(storedNotifications);
          setPreferences(prev => ({
            ...prev,
            push_signals: parsed.signals ?? true,
            push_trade_updates: parsed.trades ?? true,
            sound_enabled: parsed.sound ?? true,
          }));
        } catch (e) {
          console.error('Error parsing notification settings:', e);
        }
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNotifications = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotifications((data || []) as UserNotification[]);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const savePreferences = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      // Save email preferences to database
      await supabase
        .from('profiles')
        .update({
          email_preferences: {
            email_enabled: preferences.email_enabled,
            email_performance_reports: preferences.email_performance_reports,
            email_weekly_summary: preferences.email_weekly_summary,
            email_monthly_report: preferences.email_monthly_report,
            email_milestone_notifications: preferences.email_milestone_notifications,
            email_badge_notifications: preferences.email_badge_notifications,
            email_signal_summary: preferences.email_signal_summary,
            email_trading_tips: preferences.email_trading_tips,
            email_promotional: preferences.email_promotional,
          }
        })
        .eq('user_id', user.id);

      // Save push notification settings to localStorage
      localStorage.setItem('notification_settings', JSON.stringify({
        signals: preferences.push_signals,
        trades: preferences.push_trade_updates,
        news: preferences.push_economic_events,
        sound: preferences.sound_enabled,
      }));

      toast.success('Notification preferences saved');
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from('user_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    
    try {
      await supabase
        .from('user_notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const clearAllNotifications = async () => {
    if (!user) return;
    
    try {
      // Note: Depending on your needs, you might want to actually delete or just archive
      // For now, we'll just clear the local state
      setNotifications([]);
      toast.success('Notification history cleared');
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'signal': return <TrendingUp className="w-4 h-4 text-primary" />;
      case 'vip_signal': return <TrendingUp className="w-4 h-4 text-amber-500" />;
      case 'milestone': return <Award className="w-4 h-4 text-success" />;
      case 'badge': return <Award className="w-4 h-4 text-purple-500" />;
      case 'guidance': return <Calendar className="w-4 h-4 text-blue-500" />;
      case 'trade_update': return <BarChart3 className="w-4 h-4 text-warning" />;
      default: return <Bell className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Preferences
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            History
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="preferences" className="space-y-6 mt-6">
          {/* Push Notifications */}
          <Collapsible
            open={expandedCategories.push}
            onOpenChange={(open) => setExpandedCategories(prev => ({ ...prev, push: open }))}
          >
            <Card className="bg-card/50 border-white/[0.08]">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-white/5 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Smartphone className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Push Notifications</CardTitle>
                        <CardDescription>Real-time alerts on your device</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={preferences.push_enabled}
                        onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, push_enabled: checked }))}
                        onClick={(e) => e.stopPropagation()}
                      />
                      {expandedCategories.push ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4 pt-0">
                  {[
                    { key: 'push_signals', label: 'New Signals', desc: 'Get notified when new trading signals are published', icon: TrendingUp },
                    { key: 'push_vip_signals', label: 'VIP Signals', desc: 'Priority alerts for VIP signals (Pro & Enterprise)', icon: TrendingUp },
                    { key: 'push_trade_updates', label: 'Trade Updates', desc: 'Notifications when signals hit TP or SL', icon: BarChart3 },
                    { key: 'push_milestones', label: 'Milestones', desc: 'Celebrate your trading achievements', icon: Award },
                    { key: 'push_badges', label: 'Badge Unlocks', desc: 'Get notified when you earn new badges', icon: Award },
                    { key: 'push_guidance', label: 'Guidance Sessions', desc: 'Reminders for your 1-on-1 sessions', icon: Calendar },
                    { key: 'push_economic_events', label: 'Economic Events', desc: 'High-impact news and events', icon: MessageSquare },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between py-2 px-4 bg-white/5 rounded-lg">
                      <div className="flex items-center gap-3">
                        <item.icon className="w-4 h-4 text-primary" />
                        <div>
                          <p className="font-medium text-sm">{item.label}</p>
                          <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                      </div>
                      <Switch
                        checked={preferences[item.key as keyof NotificationPreferences] as boolean}
                        onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, [item.key]: checked }))}
                        disabled={!preferences.push_enabled}
                      />
                    </div>
                  ))}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Email Notifications */}
          <Collapsible
            open={expandedCategories.email}
            onOpenChange={(open) => setExpandedCategories(prev => ({ ...prev, email: open }))}
          >
            <Card className="bg-card/50 border-white/[0.08]">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-white/5 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                        <Mail className="w-5 h-5 text-success" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Email Notifications</CardTitle>
                        <CardDescription>Summaries and reports delivered to your inbox</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={preferences.email_enabled}
                        onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, email_enabled: checked }))}
                        onClick={(e) => e.stopPropagation()}
                      />
                      {expandedCategories.email ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4 pt-0">
                  {[
                    { key: 'email_performance_reports', label: 'Performance Reports', desc: 'Detailed analysis of your trading performance' },
                    { key: 'email_weekly_summary', label: 'Weekly Summary', desc: 'Weekly recap of signals and your trades' },
                    { key: 'email_monthly_report', label: 'Monthly Report', desc: 'Monthly performance and analytics report' },
                    { key: 'email_milestone_notifications', label: 'Milestone Alerts', desc: 'Celebrate when you hit trading milestones' },
                    { key: 'email_badge_notifications', label: 'Badge Achievements', desc: 'Get notified when you unlock new badges' },
                    { key: 'email_signal_summary', label: 'Daily Signal Summary', desc: 'End-of-day summary of all signals' },
                    { key: 'email_trading_tips', label: 'Trading Tips', desc: 'Educational content and trading strategies' },
                    { key: 'email_promotional', label: 'Promotional', desc: 'Special offers and announcements' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between py-2 px-4 bg-white/5 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                      <Switch
                        checked={preferences[item.key as keyof NotificationPreferences] as boolean}
                        onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, [item.key]: checked }))}
                        disabled={!preferences.email_enabled}
                      />
                    </div>
                  ))}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Sound Settings */}
          <Card className="bg-card/50 border-white/[0.08]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                    {preferences.sound_enabled ? (
                      <Volume2 className="w-5 h-5 text-warning" />
                    ) : (
                      <VolumeX className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">Notification Sounds</p>
                    <p className="text-sm text-muted-foreground">Play sound when receiving notifications</p>
                  </div>
                </div>
                <Switch
                  checked={preferences.sound_enabled}
                  onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, sound_enabled: checked }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={savePreferences} disabled={isSaving}>
              {isSaving ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Save Preferences
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card className="bg-card/50 border-white/[0.08]">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BellRing className="w-5 h-5 text-primary" />
                  Notification History
                </CardTitle>
                <CardDescription>
                  {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {unreadCount > 0 && (
                  <Button variant="outline" size="sm" onClick={markAllAsRead}>
                    <Check className="w-4 h-4 mr-2" />
                    Mark all read
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={fetchNotifications}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {notifications.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Bell className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>No notifications yet</p>
                  <p className="text-sm mt-1">You'll see your notification history here</p>
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="space-y-2">
                    {notifications.map((notification) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`p-4 rounded-lg border transition-colors cursor-pointer ${
                          notification.is_read 
                            ? 'bg-white/5 border-white/5' 
                            : 'bg-primary/5 border-primary/20'
                        }`}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className={`font-medium text-sm ${!notification.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                                {notification.title}
                              </p>
                              {!notification.is_read && (
                                <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {format(new Date(notification.created_at), 'MMM d, yyyy • h:mm a')}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NotificationPreferencesTab;
