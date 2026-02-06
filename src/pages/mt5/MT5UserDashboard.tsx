import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  Package, FileText, CreditCard, Bell, MessageSquare, 
  Download, Settings, User, LogOut, Plus, Clock, 
  CheckCircle, AlertCircle, Send, Paperclip, RefreshCw,
  FileCode, File, ExternalLink, Volume2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import useNotificationSound from '@/hooks/useNotificationSound';
import useBrowserPushNotifications from '@/hooks/useBrowserPushNotifications';
import { useTheme } from '@/hooks/useTheme';

const MT5UserDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { settings, updateSettings } = useTheme();
  const [activeTab, setActiveTab] = useState('orders');
  const [newMessage, setNewMessage] = useState('');
  const [revisionOrder, setRevisionOrder] = useState<any>(null);
  const [revisionDetails, setRevisionDetails] = useState('');
  const [emailNotifications, setEmailNotifications] = useState<'all' | 'important' | 'none'>('all');

  // Fetch MT5 orders
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['mt5-orders', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mt5_orders')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch MT5 payments
  const { data: payments = [] } = useQuery({
    queryKey: ['mt5-payments', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mt5_payments')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch support tickets
  const { data: tickets = [] } = useQuery({
    queryKey: ['mt5-tickets', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mt5_support_tickets')
        .select('*, mt5_ticket_messages(*)')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch notifications
  const { data: notifications = [], refetch: refetchNotifications } = useQuery({
    queryKey: ['mt5-notifications', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mt5_notifications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Notification hooks
  const { playNotificationSound } = useNotificationSound();
  const { permission, requestPermission, showNotification, isSupported } = useBrowserPushNotifications();

  // Load saved email notification preference
  useEffect(() => {
    const saved = localStorage.getItem('mt5_email_notifications');
    if (saved && (saved === 'all' || saved === 'important' || saved === 'none')) {
      setEmailNotifications(saved);
    }
  }, []);

  // Request browser notification permission on mount
  useEffect(() => {
    if (isSupported && permission === 'default') {
      requestPermission();
    }
  }, [isSupported, permission, requestPermission]);

  // Real-time notifications subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('mt5-notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mt5_notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const notification = payload.new as any;
          
          // Play notification sound
          playNotificationSound();
          
          // Show browser push notification
          showNotification(notification.title, {
            body: notification.message,
            tag: 'mt5-order-update',
          });
          
          // Show toast for new notification
          toast(notification.title, {
            description: notification.message,
          });
          
          // Refetch to update the list
          refetchNotifications();
          queryClient.invalidateQueries({ queryKey: ['mt5-orders'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, refetchNotifications, queryClient, playNotificationSound, showNotification]);

  const unreadCount = notifications.filter((n: any) => !n.is_read).length;

  // Submit new order
  const submitOrder = useMutation({
    mutationFn: async (formData: any) => {
      const orderNumber = `MT5-${Date.now()}`;
      const { data, error } = await supabase
        .from('mt5_orders')
        .insert({
          user_id: user?.id,
          order_number: orderNumber,
          bot_name: formData.botName,
          plan_type: formData.planType,
          amount: formData.amount,
          trading_strategy: formData.tradingStrategy,
          risk_management: formData.riskManagement,
          technical_specs: formData.technicalSpecs,
          performance_targets: formData.performanceTargets,
          additional_requirements: formData.additionalRequirements,
          claude_prompt: formData.claudePrompt,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Order submitted successfully!');
      queryClient.invalidateQueries({ queryKey: ['mt5-orders'] });
      setActiveTab('orders');
    },
    onError: (error) => {
      toast.error('Failed to submit order');
      console.error(error);
    },
  });

  // Send support message
  const sendMessage = useMutation({
    mutationFn: async ({ ticketId, content }: { ticketId?: string; content: string }) => {
      let ticket = ticketId;
      
      // Create new ticket if none exists
      if (!ticket) {
        const ticketNumber = `TICKET-${Date.now()}`;
        const { data: newTicket, error: ticketError } = await supabase
          .from('mt5_support_tickets')
          .insert({
            user_id: user?.id,
            ticket_number: ticketNumber,
            subject: 'Support Request',
            status: 'open',
          })
          .select()
          .single();
        if (ticketError) throw ticketError;
        ticket = newTicket.id;
      }

      const { error } = await supabase
        .from('mt5_ticket_messages')
        .insert({
          ticket_id: ticket,
          sender_type: 'user',
          sender_id: user?.id,
          content,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Message sent!');
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['mt5-tickets'] });
    },
    onError: () => {
      toast.error('Failed to send message');
    },
  });

  // Submit revision request
  const submitRevision = useMutation({
    mutationFn: async ({ orderId, revisionDetails }: { orderId: string; revisionDetails: string }) => {
      const order = orders.find((o: any) => o.id === orderId);
      const currentRevisions = Array.isArray(order?.revision_requests) ? order.revision_requests : [];
      
      const newRevision = {
        id: `REV-${Date.now()}`,
        details: revisionDetails,
        status: 'pending',
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('mt5_orders')
        .update({ 
          revision_requests: [...currentRevisions, newRevision] as any,
          status: 'revision-requested'
        })
        .eq('id', orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Revision request submitted!');
      queryClient.invalidateQueries({ queryKey: ['mt5-orders'] });
    },
    onError: () => {
      toast.error('Failed to submit revision request');
    },
  });

  // Mark notification as read
  const markAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('mt5_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
      if (error) throw error;
    },
    onSuccess: () => {
      refetchNotifications();
    },
  });

  const handleLogout = async () => {
    await signOut();
    navigate('/mt5-signin');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-500';
      case 'in-progress': return 'bg-blue-500/20 text-blue-500';
      case 'pending': return 'bg-yellow-500/20 text-yellow-500';
      default: return 'bg-gray-500/20 text-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-white/10 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
              <span className="text-primary-foreground font-bold">MT5</span>
            </div>
            <span className="text-xl font-bold">Bot Development Portal</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground text-sm hidden md:block">{user?.email}</span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-4 md:grid-cols-8 gap-2 h-auto p-2 bg-white/5">
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              <span className="hidden md:inline">Orders</span>
            </TabsTrigger>
            <TabsTrigger value="submit" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span className="hidden md:inline">Submit</span>
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              <span className="hidden md:inline">Payments</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2 relative">
              <Bell className="w-4 h-4" />
              <span className="hidden md:inline">Alerts</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-[10px] rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="support" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden md:inline">Support</span>
            </TabsTrigger>
            <TabsTrigger value="downloads" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              <span className="hidden md:inline">Downloads</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden md:inline">Settings</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span className="hidden md:inline">Profile</span>
            </TabsTrigger>
          </TabsList>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">My Orders</h2>
              {orders.length === 0 && (
                <Button onClick={() => setActiveTab('submit')}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Order
                </Button>
              )}
            </div>

            {ordersLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : orders.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Package className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
                  <p className="text-muted-foreground mb-4">Submit your first bot development request</p>
                  <Button onClick={() => setActiveTab('submit')}>Create Order</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {orders.map((order: any) => (
                  <Card key={order.id} className="hover:border-primary/30 transition-colors">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-lg">{order.bot_name}</h3>
                          <p className="text-sm text-muted-foreground">{order.order_number}</p>
                        </div>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Plan</p>
                          <p className="font-medium capitalize">{order.plan_type}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Amount</p>
                          <p className="font-medium">${order.amount}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Progress</p>
                          <p className="font-medium">{order.progress}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Created</p>
                          <p className="font-medium">{new Date(order.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-4">
                        <motion.div
                          className="h-full bg-gradient-to-r from-primary to-accent"
                          initial={{ width: 0 }}
                          animate={{ width: `${order.progress}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                      
                      {/* Revision Request Section - Show when progress < 100 OR status is completed/delivered */}
                      {(order.progress < 100 || order.status === 'completed' || order.status === 'delivered' || order.ready_for_user) && (
                        <div className="pt-4 border-t border-white/10">
                          {revisionOrder?.id === order.id ? (
                            <div className="space-y-3">
                              <Textarea
                                placeholder="Describe the changes you need..."
                                value={revisionDetails}
                                onChange={(e) => setRevisionDetails(e.target.value)}
                                rows={3}
                              />
                              <div className="flex gap-2">
                                <Button 
                                  size="sm"
                                  onClick={() => {
                                    if (revisionDetails) {
                                      submitRevision.mutate({ orderId: order.id, revisionDetails });
                                      setRevisionOrder(null);
                                      setRevisionDetails('');
                                    }
                                  }}
                                  disabled={!revisionDetails || submitRevision.isPending}
                                >
                                  Submit Request
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => {
                                    setRevisionOrder(null);
                                    setRevisionDetails('');
                                  }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setRevisionOrder(order)}
                            >
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Request Revision
                            </Button>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Submit Requirements Tab */}
          <TabsContent value="submit" className="space-y-6">
            <h2 className="text-2xl font-bold">Submit Bot Requirements</h2>
            {orders.length >= 1 ? (
              <Card className="border-yellow-500/30 bg-yellow-500/5">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <AlertCircle className="w-12 h-12 text-yellow-500 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Order Limit Reached</h3>
                  <p className="text-muted-foreground text-center max-w-md">
                    You already have an active order. Each purchase includes one custom bot development. 
                    Please wait for your current order to be completed before purchasing another plan.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <SubmitRequirementsForm onSubmit={submitOrder.mutate} isLoading={submitOrder.isPending} />
            )}
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-6">
            <h2 className="text-2xl font-bold">Payment History</h2>
            <div className="grid gap-4">
              {payments.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <CreditCard className="w-12 h-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No payment records found</p>
                  </CardContent>
                </Card>
              ) : (
                payments.map((payment: any) => (
                  <Card key={payment.id}>
                    <CardContent className="p-6 flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{payment.plan_type} Plan</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(payment.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">${payment.amount}</p>
                        <Badge className={payment.status === 'completed' ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500'}>
                          {payment.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Support Tab */}
          <TabsContent value="support" className="space-y-6">
            <h2 className="text-2xl font-bold">Support Chat</h2>
            <Card className="h-[500px] flex flex-col">
              <CardContent className="flex-1 flex flex-col p-4">
                <ScrollArea className="flex-1 pr-4">
                  {tickets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                      <MessageSquare className="w-12 h-12 mb-4 opacity-50" />
                      <p>Start a conversation with our support team</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {tickets.flatMap((ticket: any) => 
                        ticket.mt5_ticket_messages?.map((msg: any) => (
                          <div
                            key={msg.id}
                            className={`flex ${msg.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-[70%] rounded-lg p-3 ${
                              msg.sender_type === 'user' 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-white/10'
                            }`}>
                              <p className="text-sm">{msg.content}</p>
                              <p className="text-xs opacity-70 mt-1">
                                {new Date(msg.created_at).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        )) || []
                      )}
                    </div>
                  )}
                </ScrollArea>
                <div className="flex gap-2 mt-4">
                  <Input
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && newMessage && sendMessage.mutate({ content: newMessage })}
                  />
                  <Button 
                    onClick={() => newMessage && sendMessage.mutate({ content: newMessage })}
                    disabled={!newMessage || sendMessage.isPending}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Downloads Tab */}
          <TabsContent value="downloads" className="space-y-6">
            <h2 className="text-2xl font-bold">Downloads</h2>
            <div className="grid gap-4">
              {orders.filter((o: any) => o.ready_for_user && (o.ai_generated_code || o.compiled_bot_url || o.source_code_url)).length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Download className="w-12 h-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No downloads available yet</p>
                    <p className="text-sm text-muted-foreground">Files will appear here when your bot is ready</p>
                  </CardContent>
                </Card>
              ) : (
                orders.filter((o: any) => o.ready_for_user && (o.ai_generated_code || o.compiled_bot_url || o.source_code_url)).map((order: any) => (
                  <Card key={order.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center justify-between">
                        <span>{order.bot_name}</span>
                        <Badge className="bg-green-500/20 text-green-500">
                          Ready
                        </Badge>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">{order.order_number}</p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* AI Generated Source Code Download */}
                      {order.ai_generated_code && (
                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileCode className="w-5 h-5 text-accent" />
                            <div>
                              <p className="font-medium">Source Code (.mq5)</p>
                              <p className="text-xs text-muted-foreground">MQL5 source - ready to compile</p>
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            onClick={() => {
                              const blob = new Blob([order.ai_generated_code], { type: 'text/plain' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `${order.bot_name.replace(/\s+/g, '_')}.mq5`;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                              URL.revokeObjectURL(url);
                              toast.success('Source code downloaded!');
                            }}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      )}
                      {order.compiled_bot_url && (
                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileCode className="w-5 h-5 text-primary" />
                            <div>
                              <p className="font-medium">Compiled Bot (.ex5)</p>
                              <p className="text-xs text-muted-foreground">Ready to use in MT5</p>
                            </div>
                          </div>
                          <Button size="sm" onClick={() => window.open(order.compiled_bot_url, '_blank')}>
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      )}
                      {order.source_code_url && (
                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                          <div className="flex items-center gap-3">
                            <File className="w-5 h-5 text-accent" />
                            <div>
                              <p className="font-medium">Additional Source Code</p>
                              <p className="text-xs text-muted-foreground">Extra files for modification</p>
                            </div>
                          </div>
                          <Button size="sm" variant="outline" onClick={() => window.open(order.source_code_url, '_blank')}>
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      )}
                      {order.backtest_report_url && (
                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-green-500" />
                            <div>
                              <p className="font-medium">Backtest Report</p>
                              <p className="text-xs text-muted-foreground">Performance analysis</p>
                            </div>
                          </div>
                          <Button size="sm" variant="outline" onClick={() => window.open(order.backtest_report_url, '_blank')}>
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <h2 className="text-2xl font-bold">Settings</h2>
            <Card>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <Select 
                    value={settings.theme} 
                    onValueChange={(value: 'dark' | 'light' | 'auto') => {
                      updateSettings({ theme: value });
                      toast.success(`Theme changed to ${value}`);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="auto">Auto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Email Notifications</Label>
                  <Select 
                    value={emailNotifications} 
                    onValueChange={(value: 'all' | 'important' | 'none') => {
                      setEmailNotifications(value);
                      localStorage.setItem('mt5_email_notifications', value);
                      toast.success(`Email notifications set to: ${value}`);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All notifications</SelectItem>
                      <SelectItem value="important">Important only</SelectItem>
                      <SelectItem value="none">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <h2 className="text-2xl font-bold">Profile</h2>
            <Card>
              <CardContent className="p-6 space-y-4">
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium">{user?.email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">User ID</Label>
                  <p className="font-mono text-sm">{user?.id}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Member Since</Label>
                  <p className="font-medium">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Notifications</h2>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  refetchNotifications();
                  queryClient.invalidateQueries({ queryKey: ['mt5-orders'] });
                  toast.success('Refreshed!');
                }}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
            {notifications.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Bell className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No notifications yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification: any) => (
                  <Card 
                    key={notification.id} 
                    className={`cursor-pointer transition-colors hover:border-primary/30 ${!notification.is_read ? 'border-primary/50 bg-primary/5' : ''}`}
                    onClick={() => {
                      if (!notification.is_read) {
                        markAsRead.mutate(notification.id);
                      }
                      // Navigate based on notification type
                      if (notification.type === 'delivery') {
                        setActiveTab('downloads');
                      } else if (notification.type === 'status_update') {
                        setActiveTab('orders');
                      }
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${!notification.is_read ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium truncate">{notification.title}</p>
                            <span className="text-xs text-muted-foreground shrink-0">
                              {new Date(notification.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                          {notification.type === 'delivery' && (
                            <Badge className="mt-2 bg-green-500/20 text-green-500 text-xs">
                              Click to view downloads
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

// Submit Requirements Form Component
const SubmitRequirementsForm = ({ onSubmit, isLoading }: { onSubmit: (data: any) => void; isLoading: boolean }) => {
  const [formData, setFormData] = useState({
    botName: '',
    planType: 'starter',
    strategy: '',
    timeframe: 'H1',
    stopLoss: 50,
    takeProfit: 100,
    lotSize: 0.01,
    maxDrawdown: 10,
    maxDailyLoss: 5,
    riskPerTrade: 1,
    maxOpenPositions: 3,
    monthlyReturn: 10,
    specialInstructions: '',
  });

  const planPrices = { starter: 299, pro: 599, elite: 1299 };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      botName: formData.botName,
      planType: formData.planType,
      amount: planPrices[formData.planType as keyof typeof planPrices],
      tradingStrategy: {
        description: formData.strategy,
        timeframe: formData.timeframe,
      },
      riskManagement: {
        stopLoss: formData.stopLoss,
        takeProfit: formData.takeProfit,
        lotSize: formData.lotSize,
        maxDrawdown: formData.maxDrawdown,
        maxDailyLoss: formData.maxDailyLoss,
        riskPerTrade: formData.riskPerTrade,
        maxOpenPositions: formData.maxOpenPositions,
      },
      performanceTargets: {
        monthlyReturn: formData.monthlyReturn,
      },
      additionalRequirements: {
        specialInstructions: formData.specialInstructions,
      },
      claudePrompt: `Create MT5 EA: ${formData.botName}, Strategy: ${formData.strategy}, Timeframe: ${formData.timeframe}, SL: ${formData.stopLoss}pips, TP: ${formData.takeProfit}pips`,
    };

    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="botName">Bot Name *</Label>
              <Input
                id="botName"
                value={formData.botName}
                onChange={(e) => setFormData({ ...formData, botName: e.target.value })}
                placeholder="My Trading Bot"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="planType">Plan Type *</Label>
              <Select value={formData.planType} onValueChange={(v) => setFormData({ ...formData, planType: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="starter">Starter ($299)</SelectItem>
                  <SelectItem value="pro">Pro ($599)</SelectItem>
                  <SelectItem value="elite">Elite ($1,299)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Trading Strategy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="strategy">Strategy Description *</Label>
            <Textarea
              id="strategy"
              value={formData.strategy}
              onChange={(e) => setFormData({ ...formData, strategy: e.target.value })}
              placeholder="Describe your trading strategy in detail..."
              rows={4}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="timeframe">Timeframe</Label>
            <Select value={formData.timeframe} onValueChange={(v) => setFormData({ ...formData, timeframe: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="M1">M1 (1 Minute)</SelectItem>
                <SelectItem value="M5">M5 (5 Minutes)</SelectItem>
                <SelectItem value="M15">M15 (15 Minutes)</SelectItem>
                <SelectItem value="H1">H1 (1 Hour)</SelectItem>
                <SelectItem value="H4">H4 (4 Hours)</SelectItem>
                <SelectItem value="D1">D1 (Daily)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Risk Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stopLoss">Stop Loss (pips) *</Label>
              <Input
                id="stopLoss"
                type="number"
                value={formData.stopLoss}
                onChange={(e) => setFormData({ ...formData, stopLoss: parseInt(e.target.value) })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="takeProfit">Take Profit (pips) *</Label>
              <Input
                id="takeProfit"
                type="number"
                value={formData.takeProfit}
                onChange={(e) => setFormData({ ...formData, takeProfit: parseInt(e.target.value) })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lotSize">Lot Size</Label>
              <Input
                id="lotSize"
                type="number"
                step="0.01"
                value={formData.lotSize}
                onChange={(e) => setFormData({ ...formData, lotSize: parseFloat(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxDrawdown">Max Drawdown (%)</Label>
              <Input
                id="maxDrawdown"
                type="number"
                value={formData.maxDrawdown}
                onChange={(e) => setFormData({ ...formData, maxDrawdown: parseInt(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxDailyLoss">Max Daily Loss (%)</Label>
              <Input
                id="maxDailyLoss"
                type="number"
                value={formData.maxDailyLoss}
                onChange={(e) => setFormData({ ...formData, maxDailyLoss: parseInt(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="riskPerTrade">Risk Per Trade (%)</Label>
              <Input
                id="riskPerTrade"
                type="number"
                value={formData.riskPerTrade}
                onChange={(e) => setFormData({ ...formData, riskPerTrade: parseInt(e.target.value) })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Additional Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.specialInstructions}
            onChange={(e) => setFormData({ ...formData, specialInstructions: e.target.value })}
            placeholder="Any special requirements or instructions..."
            rows={4}
          />
        </CardContent>
      </Card>

      <div className="flex items-center justify-between p-6 bg-white/5 rounded-lg">
        <div>
          <p className="text-muted-foreground">Total Amount</p>
          <p className="text-3xl font-bold">${planPrices[formData.planType as keyof typeof planPrices]}</p>
        </div>
        <Button type="submit" size="lg" disabled={isLoading}>
          {isLoading ? 'Submitting...' : 'Submit Order'}
        </Button>
      </div>
    </form>
  );
};

export default MT5UserDashboard;
