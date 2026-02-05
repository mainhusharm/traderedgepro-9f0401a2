import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { callEdgeFunction } from '@/config/api';
import { useAuth } from '@/lib/auth/AuthContext';
import { useAdminApi } from '@/hooks/useAdminApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Send, Bell, Users, Clock, CheckCircle, AlertCircle, Megaphone, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

interface Broadcast {
  id: string;
  title: string;
  message: string;
  notification_type: string;
  target_plans: string[];
  total_recipients: number;
  sent_at: string;
}

const NOTIFICATION_TYPES = [
  { value: 'announcement', label: 'Announcement', icon: Megaphone },
  { value: 'update', label: 'Platform Update', icon: Bell },
  { value: 'promotion', label: 'Promotion', icon: AlertCircle },
];

const PLAN_OPTIONS = [
  { value: 'all', label: 'All Users' },
  { value: 'Starter', label: 'Starter Plan' },
  { value: 'Pro', label: 'Pro Plan' },
  { value: 'Enterprise', label: 'Enterprise Plan' },
];

const BroadcastCenterTab = () => {
  const { user } = useAuth();
  const { callAdminApi } = useAdminApi();
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [notificationType, setNotificationType] = useState('announcement');
  const [targetPlan, setTargetPlan] = useState('all');
  const [recipientCount, setRecipientCount] = useState<number | null>(null);

  const fetchBroadcasts = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await callAdminApi('get_broadcasts', { page: 1, limit: 20 });
      setBroadcasts(result.broadcasts || []);
    } catch (error) {
      console.error('Error fetching broadcasts:', error);
      toast.error('Failed to load broadcasts');
    } finally {
      setIsLoading(false);
    }
  }, [callAdminApi]);

  useEffect(() => {
    fetchBroadcasts();
  }, [fetchBroadcasts]);

  useEffect(() => {
    // Estimate recipient count when target plan changes
    estimateRecipients();
  }, [targetPlan]);

  const estimateRecipients = async () => {
    try {
      let query = supabase
        .from('memberships')
        .select('user_id', { count: 'exact', head: true })
        .eq('status', 'active');

      if (targetPlan !== 'all') {
        query = query.eq('plan_name', targetPlan);
      }

      const { count, error } = await query;
      if (error) throw error;
      setRecipientCount(count || 0);
    } catch (error) {
      console.error('Error estimating recipients:', error);
      setRecipientCount(null);
    }
  };

  const handleSendBroadcast = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsSending(true);
    try {
      const { data, error } = await callEdgeFunction('send-admin-broadcast', {
        title,
        message,
        notification_type: notificationType,
        target_plans: targetPlan === 'all' ? [] : [targetPlan],
      });

      if (error) throw error;

      toast.success(`Broadcast sent to ${data.recipients_count} users!`);
      
      // Reset form
      setTitle('');
      setMessage('');
      setNotificationType('announcement');
      setTargetPlan('all');
      
      // Refresh broadcasts list
      fetchBroadcasts();
    } catch (error: any) {
      console.error('Error sending broadcast:', error);
      toast.error(error.message || 'Failed to send broadcast');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Megaphone className="w-6 h-6 text-primary" />
          Broadcast Center
        </h2>
        <p className="text-muted-foreground mt-1">
          Send in-app notifications to all users or filter by their plan
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compose Broadcast */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Compose Broadcast</CardTitle>
              <CardDescription>
                Create a new notification to send to users
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Notification Type</Label>
                  <Select value={notificationType} onValueChange={setNotificationType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {NOTIFICATION_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <type.icon className="w-4 h-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Target Audience</Label>
                  <Select value={targetPlan} onValueChange={setTargetPlan}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PLAN_OPTIONS.map((plan) => (
                        <SelectItem key={plan.value} value={plan.value}>
                          {plan.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  placeholder="Enter notification title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea
                  placeholder="Enter your message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {message.length}/500 characters
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  {recipientCount !== null ? (
                    <span>Estimated recipients: <strong className="text-foreground">{recipientCount}</strong></span>
                  ) : (
                    <span>Calculating...</span>
                  )}
                </div>
                <Button 
                  onClick={handleSendBroadcast} 
                  disabled={isSending || !title.trim() || !message.trim()}
                  className="gap-2"
                >
                  {isSending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Broadcast
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Broadcasts Sent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{broadcasts.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Notifications Delivered
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">
                {broadcasts.reduce((acc, b) => acc + b.total_recipients, 0)}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Broadcasts */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Broadcasts</CardTitle>
          <CardDescription>History of notifications sent to users</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : broadcasts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No broadcasts sent yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {broadcasts.map((broadcast) => (
                <div
                  key={broadcast.id}
                  className="flex items-start justify-between p-4 rounded-lg border border-white/10 hover:bg-white/5 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{broadcast.title}</h4>
                      <Badge variant="secondary" className="text-xs">
                        {broadcast.notification_type}
                      </Badge>
                      {broadcast.target_plans.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {broadcast.target_plans.join(', ')}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {broadcast.message}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <div className="flex items-center gap-1 text-success">
                      <CheckCircle className="w-4 h-4" />
                      {broadcast.total_recipients} sent
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground mt-1">
                      <Clock className="w-3 h-3" />
                      {format(new Date(broadcast.sent_at), 'MMM d, yyyy HH:mm')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BroadcastCenterTab;
