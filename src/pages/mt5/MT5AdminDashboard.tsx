import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  Package, FileCode, Clock, CheckCircle, XCircle, 
  RefreshCw, Send, Eye, Download, Upload, AlertTriangle,
  LogOut, Search, Filter, MessageSquare, Loader2, Copy, Check,
  Users, CreditCard, DollarSign, TrendingUp, Settings,
  Trash2, Edit, MoreVertical, FileText, BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const MT5AdminDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('orders');
  const [isAdmin, setIsAdmin] = useState(false);

  // Check admin role
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        navigate('/auth');
        return;
      }
      
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();
      
      if (!data) {
        toast.error('Access denied. Admin only.');
        navigate('/');
      } else {
        setIsAdmin(true);
      }
    };
    checkAdmin();
  }, [user, navigate]);

  // Fetch all MT5 orders
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['mt5-admin-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mt5_orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: isAdmin,
  });

  // Fetch all MT5 users
  const { data: mt5Users = [] } = useQuery({
    queryKey: ['mt5-admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mt5_users')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: isAdmin,
  });

  // Fetch all MT5 payments
  const { data: payments = [] } = useQuery({
    queryKey: ['mt5-admin-payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mt5_payments')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: isAdmin,
  });

  // Fetch support tickets
  const { data: tickets = [] } = useQuery({
    queryKey: ['mt5-admin-tickets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mt5_support_tickets')
        .select('*, mt5_ticket_messages(*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: isAdmin,
  });

  // Update order mutation
  const updateOrder = useMutation({
    mutationFn: async ({ orderId, updates }: { orderId: string; updates: any }) => {
      const { error } = await supabase
        .from('mt5_orders')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', orderId);
      if (error) throw error;

      const order = orders.find((o: any) => o.id === orderId);
      if (order && updates.status) {
        await supabase.from('mt5_notifications').insert({
          user_id: order.user_id,
          order_id: orderId,
          type: 'status_update',
          title: `Order Status: ${updates.status}`,
          message: `Your bot "${order.bot_name}" status has been updated to ${updates.status}.`
        });
      }
    },
    onSuccess: () => {
      toast.success('Order updated');
      queryClient.invalidateQueries({ queryKey: ['mt5-admin-orders'] });
    },
    onError: () => toast.error('Failed to update order'),
  });

  // Verify payment mutation
  const verifyPayment = useMutation({
    mutationFn: async (paymentId: string) => {
      const payment = payments.find((p: any) => p.id === paymentId);
      if (!payment) throw new Error('Payment not found');

      await supabase
        .from('mt5_payments')
        .update({ 
          status: 'verified', 
          verified_at: new Date().toISOString(),
          verified_by: user?.id
        })
        .eq('id', paymentId);

      // Update MT5 user payment status
      await supabase
        .from('mt5_users')
        .update({ payment_verified: true })
        .eq('user_id', payment.user_id);

      // Notify user
      await supabase.from('mt5_notifications').insert({
        user_id: payment.user_id,
        type: 'payment_verified',
        title: 'Payment Verified! ✓',
        message: 'Your payment has been verified. You can now submit your bot requirements.'
      });
    },
    onSuccess: () => {
      toast.success('Payment verified!');
      queryClient.invalidateQueries({ queryKey: ['mt5-admin-payments'] });
      queryClient.invalidateQueries({ queryKey: ['mt5-admin-users'] });
    },
    onError: () => toast.error('Failed to verify payment'),
  });

  // Generate AI code mutation
  const generateCode = useMutation({
    mutationFn: async (orderId: string) => {
      const order = orders.find((o: any) => o.id === orderId);
      if (!order) throw new Error('Order not found');

      const { data, error } = await supabase.functions.invoke('generate-mt5-bot', {
        body: {
          orderId,
          action: 'generate',
          requirements: {
            botName: order.bot_name,
            tradingStrategy: order.trading_strategy || {},
            riskManagement: order.risk_management || {},
            technicalSpecs: order.technical_specs || {},
            additionalRequirements: typeof order.additional_requirements === 'object' && order.additional_requirements !== null ? (order.additional_requirements as any).notes || '' : ''
          }
        }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('AI code generated!');
      queryClient.invalidateQueries({ queryKey: ['mt5-admin-orders'] });
    },
    onError: (error: any) => toast.error(error.message || 'Failed to generate code'),
  });

  // Request revision from AI
  const requestRevision = useMutation({
    mutationFn: async ({ orderId, revisionDetails }: { orderId: string; revisionDetails: string }) => {
      const order = orders.find((o: any) => o.id === orderId);
      if (!order) throw new Error('Order not found');

      const { data, error } = await supabase.functions.invoke('generate-mt5-bot', {
        body: {
          orderId,
          action: 'revise',
          requirements: {
            currentCode: (order as any).ai_generated_code,
            revisionRequest: revisionDetails
          }
        }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Code revised by AI!');
      queryClient.invalidateQueries({ queryKey: ['mt5-admin-orders'] });
    },
    onError: (error: any) => toast.error(error.message || 'Failed to revise code'),
  });

  // Approve and send to user
  const approveForUser = useMutation({
    mutationFn: async (orderId: string) => {
      const order = orders.find((o: any) => o.id === orderId);
      if (!order) throw new Error('Order not found');

      await supabase
        .from('mt5_orders')
        .update({
          status: 'delivered',
          ready_for_user: true,
          delivery_date: new Date().toISOString(),
          progress: 100,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      await supabase.from('mt5_notifications').insert({
        user_id: order.user_id,
        order_id: orderId,
        type: 'delivery',
        title: 'Your Bot is Ready! 🎉',
        message: `Your custom bot "${order.bot_name}" is ready for download. Check your Downloads tab.`
      });
    },
    onSuccess: () => {
      toast.success('Bot delivered to user!');
      queryClient.invalidateQueries({ queryKey: ['mt5-admin-orders'] });
    },
    onError: () => toast.error('Failed to deliver'),
  });

  // Reply to ticket
  const replyToTicket = useMutation({
    mutationFn: async ({ ticketId, content }: { ticketId: string; content: string }) => {
      await supabase.from('mt5_ticket_messages').insert({
        ticket_id: ticketId,
        sender_type: 'admin',
        sender_id: user?.id,
        content
      });
    },
    onSuccess: () => {
      toast.success('Reply sent!');
      queryClient.invalidateQueries({ queryKey: ['mt5-admin-tickets'] });
    },
    onError: () => toast.error('Failed to send reply'),
  });

  const filteredOrders = orders.filter((order: any) => {
    const matchesSearch = 
      order.bot_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.order_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      'pending': 'bg-yellow-500/20 text-yellow-500',
      'ai-generated': 'bg-blue-500/20 text-blue-500',
      'in-review': 'bg-purple-500/20 text-purple-500',
      'revision-needed': 'bg-orange-500/20 text-orange-500',
      'approved': 'bg-green-500/20 text-green-500',
      'delivered': 'bg-emerald-500/20 text-emerald-500',
      'verified': 'bg-green-500/20 text-green-500',
    };
    return styles[status] || 'bg-gray-500/20 text-gray-500';
  };

  const stats = {
    totalOrders: orders.length,
    pendingOrders: orders.filter((o: any) => o.status === 'pending').length,
    deliveredOrders: orders.filter((o: any) => o.status === 'delivered').length,
    totalUsers: mt5Users.length,
    verifiedUsers: mt5Users.filter((u: any) => u.payment_verified).length,
    totalRevenue: payments.filter((p: any) => p.status === 'verified').reduce((acc: number, p: any) => acc + (p.amount || 0), 0),
    pendingPayments: payments.filter((p: any) => p.status === 'pending').length,
    openTickets: tickets.filter((t: any) => t.status === 'open').length,
  };

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-white/10 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-sm">MT5</span>
            </div>
            <div>
              <span className="text-xl font-bold">MT5 Admin Dashboard</span>
              <p className="text-xs text-muted-foreground">Bot Development Management</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => signOut()}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{stats.totalOrders}</p>
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                </div>
                <Package className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-green-500/10 border-green-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-green-500">${stats.totalRevenue}</p>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-blue-500/10 border-blue-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-blue-500">{stats.totalUsers}</p>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-orange-500/10 border-orange-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-orange-500">{stats.openTickets}</p>
                  <p className="text-sm text-muted-foreground">Open Tickets</p>
                </div>
                <MessageSquare className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-5 gap-2 h-auto p-2 bg-white/5">
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              <span className="hidden md:inline">Orders</span>
              {stats.pendingOrders > 0 && (
                <Badge variant="destructive" className="ml-1 text-xs">{stats.pendingOrders}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              <span className="hidden md:inline">Payments</span>
              {stats.pendingPayments > 0 && (
                <Badge variant="destructive" className="ml-1 text-xs">{stats.pendingPayments}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden md:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="tickets" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden md:inline">Support</span>
              {stats.openTickets > 0 && (
                <Badge variant="destructive" className="ml-1 text-xs">{stats.openTickets}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden md:inline">Analytics</span>
            </TabsTrigger>
          </TabsList>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by bot name or order number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="ai-generated">AI Generated</SelectItem>
                  <SelectItem value="in-review">In Review</SelectItem>
                  <SelectItem value="revision-needed">Revision Needed</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Orders List */}
            {ordersLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredOrders.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Package className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No orders found</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order: any) => (
                  <OrderCard 
                    key={order.id} 
                    order={order}
                    onGenerateCode={() => generateCode.mutate(order.id)}
                    onUpdateStatus={(status: string) => updateOrder.mutate({ orderId: order.id, updates: { status } })}
                    onUpdateProgress={(progress: number) => updateOrder.mutate({ orderId: order.id, updates: { progress } })}
                    onRequestRevision={(details: string) => requestRevision.mutate({ orderId: order.id, revisionDetails: details })}
                    onApproveForUser={() => approveForUser.mutate(order.id)}
                    onUpdateOrder={(updates: any) => updateOrder.mutate({ orderId: order.id, updates })}
                    isGenerating={generateCode.isPending}
                    isRevising={requestRevision.isPending}
                    getStatusBadge={getStatusBadge}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Management</CardTitle>
                <CardDescription>Review and verify crypto payments</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          No payments found
                        </TableCell>
                      </TableRow>
                    ) : (
                      payments.map((payment: any) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-mono text-xs">{payment.user_id.slice(0, 8)}...</TableCell>
                          <TableCell className="font-bold">${payment.amount}</TableCell>
                          <TableCell>{payment.payment_method}</TableCell>
                          <TableCell className="font-mono text-xs max-w-[150px] truncate">
                            {payment.transaction_id || 'N/A'}
                          </TableCell>
                          <TableCell>{new Date(payment.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Badge className={getStatusBadge(payment.status)}>{payment.status}</Badge>
                          </TableCell>
                          <TableCell>
                            {payment.status === 'pending' && (
                              <Button
                                size="sm"
                                onClick={() => verifyPayment.mutate(payment.id)}
                                disabled={verifyPayment.isPending}
                              >
                                {verifyPayment.isPending ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                )}
                                Verify
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>MT5 Bot Users</CardTitle>
                <CardDescription>{stats.verifiedUsers} verified of {stats.totalUsers} total users</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mt5Users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No users found
                        </TableCell>
                      </TableRow>
                    ) : (
                      mt5Users.map((u: any) => (
                        <TableRow key={u.id}>
                          <TableCell>{u.email || 'N/A'}</TableCell>
                          <TableCell className="capitalize">{u.plan_type}</TableCell>
                          <TableCell>
                            {u.payment_verified ? (
                              <Badge className="bg-green-500/20 text-green-500">Verified</Badge>
                            ) : (
                              <Badge className="bg-yellow-500/20 text-yellow-500">Pending</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {u.is_active ? (
                              <Badge className="bg-green-500/20 text-green-500">Active</Badge>
                            ) : (
                              <Badge className="bg-red-500/20 text-red-500">Inactive</Badge>
                            )}
                          </TableCell>
                          <TableCell>{new Date(u.created_at).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Support Tickets Tab */}
          <TabsContent value="tickets" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Support Tickets</CardTitle>
                <CardDescription>{stats.openTickets} open tickets need attention</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {tickets.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No support tickets</p>
                  </div>
                ) : (
                  tickets.map((ticket: any) => (
                    <TicketCard 
                      key={ticket.id} 
                      ticket={ticket} 
                      onReply={(content: string) => replyToTicket.mutate({ ticketId: ticket.id, content })}
                      isReplying={replyToTicket.isPending}
                    />
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Order Distribution</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {[
                      { label: 'Pending', count: orders.filter((o: any) => o.status === 'pending').length, color: 'bg-yellow-500' },
                      { label: 'AI Generated', count: orders.filter((o: any) => o.status === 'ai-generated').length, color: 'bg-blue-500' },
                      { label: 'In Review', count: orders.filter((o: any) => o.status === 'in-review').length, color: 'bg-purple-500' },
                      { label: 'Delivered', count: orders.filter((o: any) => o.status === 'delivered').length, color: 'bg-green-500' },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${item.color}`} />
                        <span className="flex-1">{item.label}</span>
                        <span className="font-bold">{item.count}</span>
                        <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${item.color}`} 
                            style={{ width: `${orders.length ? (item.count / orders.length) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Revenue Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center py-6">
                    <p className="text-4xl font-bold text-green-500">${stats.totalRevenue}</p>
                    <p className="text-sm text-muted-foreground mt-2">Total Verified Revenue</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                    <div className="text-center">
                      <p className="text-xl font-bold">{payments.filter((p: any) => p.status === 'verified').length}</p>
                      <p className="text-xs text-muted-foreground">Verified Payments</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-yellow-500">{stats.pendingPayments}</p>
                      <p className="text-xs text-muted-foreground">Pending Payments</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

// Order Card Component
const OrderCard = ({ 
  order, 
  onGenerateCode, 
  onUpdateStatus,
  onUpdateProgress,
  onRequestRevision,
  onApproveForUser,
  onUpdateOrder,
  isGenerating,
  isRevising,
  getStatusBadge 
}: any) => {
  const [revisionInput, setRevisionInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [progress, setProgress] = useState(order.progress || 0);
  const [showDetails, setShowDetails] = useState(false);

  const copyCode = () => {
    if (order.ai_generated_code) {
      navigator.clipboard.writeText(order.ai_generated_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Code copied to clipboard');
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="hover:border-primary/30 transition-colors">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
            {/* Order Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-semibold text-lg">{order.bot_name}</h3>
                <Badge className={getStatusBadge(order.status)}>{order.status}</Badge>
                {order.ready_for_user && (
                  <Badge className="bg-emerald-500/20 text-emerald-500">Sent to User</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-3">{order.order_number}</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                <div>
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="ml-2 font-medium">${order.amount}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Revisions Left:</span>
                  <span className="ml-2 font-medium">{order.revisions_remaining ?? 3}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Progress:</span>
                  <span className="ml-2 font-medium">{order.progress || 0}%</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Created:</span>
                  <span className="ml-2 font-medium">{new Date(order.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Strategy Summary */}
              {order.trading_strategy && (
                <div className="p-3 bg-white/5 rounded-lg text-sm mb-4">
                  <p className="text-muted-foreground">
                    <strong>Strategy:</strong> {order.trading_strategy.type || 'Custom'} | 
                    <strong> Timeframe:</strong> {order.trading_strategy.timeframe || 'N/A'} |
                    <strong> Pairs:</strong> {order.trading_strategy.pairs?.join(', ') || 'N/A'}
                  </p>
                </div>
              )}

              {/* Progress Control */}
              <div className="flex items-center gap-4 mb-4">
                <Label className="text-sm">Update Progress:</Label>
                <Slider
                  value={[progress]}
                  onValueChange={(v) => setProgress(v[0])}
                  max={100}
                  step={10}
                  className="flex-1 max-w-[200px]"
                />
                <span className="text-sm font-bold">{progress}%</span>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => onUpdateProgress(progress)}
                >
                  Save
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              {order.status === 'pending' && (
                <Button
                  size="sm"
                  onClick={onGenerateCode}
                  disabled={isGenerating}
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileCode className="w-4 h-4 mr-2" />}
                  Generate AI Code
                </Button>
              )}

              {order.ai_generated_code && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Eye className="w-4 h-4 mr-2" />
                      View Code
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh]">
                    <DialogHeader>
                      <DialogTitle className="flex items-center justify-between">
                        <span>AI Generated Code - {order.bot_name}</span>
                        <Button size="sm" variant="outline" onClick={copyCode}>
                          {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                          {copied ? 'Copied!' : 'Copy'}
                        </Button>
                      </DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="h-[50vh]">
                      <pre className="p-4 bg-black/50 rounded-lg text-sm overflow-x-auto">
                        <code className="text-green-400">{order.ai_generated_code}</code>
                      </pre>
                    </ScrollArea>
                    
                    {/* Revision Request */}
                    <div className="pt-4 border-t border-white/10">
                      <Label>Request AI Revision</Label>
                      <Textarea
                        placeholder="Describe the changes you want the AI to make..."
                        value={revisionInput}
                        onChange={(e) => setRevisionInput(e.target.value)}
                        className="mt-2"
                        rows={3}
                      />
                      <Button
                        className="mt-2"
                        size="sm"
                        onClick={() => {
                          onRequestRevision(revisionInput);
                          setRevisionInput('');
                        }}
                        disabled={!revisionInput || isRevising}
                      >
                        {isRevising ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                        Request Revision
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              {order.status === 'ai-generated' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onUpdateStatus('in-review')}
                >
                  Start Review
                </Button>
              )}

              {(order.status === 'in-review' || order.status === 'approved') && !order.ready_for_user && (
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={onApproveForUser}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Deliver to User
                </Button>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-accent"
                initial={{ width: 0 }}
                animate={{ width: `${order.progress || 0}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Ticket Card Component
const TicketCard = ({ ticket, onReply, isReplying }: any) => {
  const [replyContent, setReplyContent] = useState('');
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="border-white/10">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold">{ticket.subject}</h4>
              <Badge className={ticket.status === 'open' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-green-500/20 text-green-500'}>
                {ticket.status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{ticket.ticket_number} • {new Date(ticket.created_at).toLocaleDateString()}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
            {expanded ? 'Hide' : 'View'} Messages
          </Button>
        </div>

        {expanded && (
          <div className="mt-4 space-y-4">
            <ScrollArea className="h-[200px] border border-white/10 rounded-lg p-3">
              {ticket.mt5_ticket_messages?.map((msg: any) => (
                <div
                  key={msg.id}
                  className={`mb-3 p-2 rounded-lg ${
                    msg.sender_type === 'admin' ? 'bg-primary/20 ml-8' : 'bg-white/10 mr-8'
                  }`}
                >
                  <p className="text-xs text-muted-foreground mb-1">
                    {msg.sender_type === 'admin' ? 'Admin' : 'User'} • {new Date(msg.created_at).toLocaleTimeString()}
                  </p>
                  <p className="text-sm">{msg.content}</p>
                </div>
              ))}
            </ScrollArea>

            <div className="flex gap-2">
              <Input
                placeholder="Type your reply..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
              />
              <Button
                onClick={() => {
                  if (replyContent) {
                    onReply(replyContent);
                    setReplyContent('');
                  }
                }}
                disabled={!replyContent || isReplying}
              >
                {isReplying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MT5AdminDashboard;
