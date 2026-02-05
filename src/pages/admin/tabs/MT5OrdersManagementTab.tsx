import { useState, useRef, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { callEdgeFunction } from '@/config/api';
import { useAdminApi } from '@/hooks/useAdminApi';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { 
  Package, Search, Filter, Eye, CheckCircle, XCircle, 
  Clock, AlertTriangle, MessageSquare, Download, Clipboard,
  Upload, FileCode, FileText, Key, Send
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Generate license key
const generateLicenseKey = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const segments = 4;
  const segmentLength = 4;
  const parts: string[] = [];
  
  for (let i = 0; i < segments; i++) {
    let segment = '';
    for (let j = 0; j < segmentLength; j++) {
      segment += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    parts.push(segment);
  }
  
  return `MT5-${parts.join('-')}`;
};

const MT5OrdersManagementTab = () => {
  const queryClient = useQueryClient();
  const { callAdminApi } = useAdminApi();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await callAdminApi('get_mt5_orders', { 
        page: 1, 
        limit: 100,
        status: statusFilter === 'all' ? undefined : statusFilter 
      });
      setOrders(result.orders || []);
    } catch (error) {
      console.error('Error fetching MT5 orders:', error);
    } finally {
      setIsLoading(false);
    }
  }, [callAdminApi, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Fetch MT5 support tickets
  const { data: tickets = [] } = useQuery({
    queryKey: ['admin-mt5-tickets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mt5_support_tickets')
        .select('*, mt5_ticket_messages(*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Update order mutation with notifications and emails
  const updateOrder = useMutation({
    mutationFn: async ({ orderId, updates, notifyUser = true, sendEmail = false }: { orderId: string; updates: any; notifyUser?: boolean; sendEmail?: boolean }) => {
      const order = orders.find((o: any) => o.id === orderId);
      
      const { error } = await supabase
        .from('mt5_orders')
        .update(updates)
        .eq('id', orderId);
      if (error) throw error;

      // Send notification and email to user
      if (notifyUser && order) {
        let title = 'Order Updated';
        let message = 'Your order has been updated.';
        let type = 'status_update';
        let emailType: 'mt5_order_update' | 'mt5_files_ready' | null = null;

        if (updates.status) {
          title = `Order Status: ${updates.status.charAt(0).toUpperCase() + updates.status.slice(1)}`;
          message = `Your order "${order.bot_name}" status has been updated to ${updates.status}.`;
          emailType = 'mt5_order_update';
        }
        if (updates.source_code_url || updates.compiled_bot_url || updates.backtest_report_url) {
          title = 'New Files Available';
          message = `New files have been uploaded for your order "${order.bot_name}". Check the Downloads tab.`;
          type = 'file_upload';
          emailType = 'mt5_files_ready';
        }

        // Create in-app notification
        await supabase.from('mt5_notifications').insert({
          user_id: order.user_id,
          order_id: orderId,
          type,
          title,
          message,
        });

        // Send email notification
        if (sendEmail && emailType) {
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('first_name')
              .eq('user_id', order.user_id)
              .single();

            // For email, we need to get user info
            // Email sending would require fetching from auth - skip for now if no email
            // This will send with empty email which the function will handle gracefully
            await callEdgeFunction('send-notification', {
              type: emailType,
              to: profile?.first_name ? '' : '', // Email would be fetched from auth in production
              data: {
                botName: order.bot_name,
                status: updates.status || order.status,
                progress: updates.progress || order.progress,
                name: profile?.first_name || 'Trader',
                hasCompiledBot: !!updates.compiled_bot_url || !!order.compiled_bot_url,
                hasSourceCode: !!updates.source_code_url || !!order.source_code_url,
                hasBacktestReport: !!updates.backtest_report_url || !!order.backtest_report_url,
              },
            });
          } catch (emailError) {
            console.error('Failed to send email:', emailError);
            // Don't fail the whole operation if email fails
          }
        }
      }
    },
    onSuccess: () => {
      toast.success('Order updated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-mt5-orders'] });
    },
    onError: () => {
      toast.error('Failed to update order');
    },
  });

  // Reply to ticket mutation
  const replyToTicket = useMutation({
    mutationFn: async ({ ticketId, message }: { ticketId: string; message: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('mt5_ticket_messages')
        .insert({
          ticket_id: ticketId,
          sender_type: 'admin',
          sender_id: user?.id,
          content: message,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Reply sent');
      queryClient.invalidateQueries({ queryKey: ['admin-mt5-tickets'] });
    },
  });

  const filteredOrders = orders.filter((order: any) => {
    const matchesSearch = 
      order.bot_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.order_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-500';
      case 'in-progress': return 'bg-blue-500/20 text-blue-500';
      case 'pending': return 'bg-yellow-500/20 text-yellow-500';
      case 'rejected': return 'bg-red-500/20 text-red-500';
      default: return 'bg-gray-500/20 text-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500/20 text-red-500';
      case 'high': return 'bg-orange-500/20 text-orange-500';
      default: return 'bg-gray-500/20 text-gray-500';
    }
  };

  const stats = {
    total: orders.length,
    pending: orders.filter((o: any) => o.status === 'pending').length,
    inProgress: orders.filter((o: any) => o.status === 'in-progress').length,
    completed: orders.filter((o: any) => o.status === 'completed').length,
    openTickets: tickets.filter((t: any) => t.status === 'open').length,
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Package className="w-8 h-8 text-primary" />
              <span className="text-2xl font-bold">{stats.total}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">Total Orders</p>
          </CardContent>
        </Card>
        <Card className="bg-yellow-500/10 border-yellow-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Clock className="w-8 h-8 text-yellow-500" />
              <span className="text-2xl font-bold text-yellow-500">{stats.pending}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">Pending</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/10 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <AlertTriangle className="w-8 h-8 text-blue-500" />
              <span className="text-2xl font-bold text-blue-500">{stats.inProgress}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">In Progress</p>
          </CardContent>
        </Card>
        <Card className="bg-green-500/10 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <span className="text-2xl font-bold text-green-500">{stats.completed}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">Completed</p>
          </CardContent>
        </Card>
        <Card className="bg-purple-500/10 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <MessageSquare className="w-8 h-8 text-purple-500" />
              <span className="text-2xl font-bold text-purple-500">{stats.openTickets}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">Open Tickets</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
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
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="hover:border-primary/30 transition-colors">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{order.bot_name}</h3>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                        {order.priority !== 'normal' && (
                          <Badge className={getPriorityColor(order.priority)}>
                            {order.priority}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{order.order_number}</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Plan:</span>
                          <span className="ml-2 font-medium capitalize">{order.plan_type}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Amount:</span>
                          <span className="ml-2 font-medium">${order.amount}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Progress:</span>
                          <span className="ml-2 font-medium">{order.progress}%</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Date:</span>
                          <span className="ml-2 font-medium">
                            {new Date(order.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* View Details */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)}>
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>{order.bot_name} - Details</DialogTitle>
                          </DialogHeader>
                          <OrderDetailsModal order={order} onUpdate={updateOrder.mutate} />
                        </DialogContent>
                      </Dialog>

                      {/* Quick Actions */}
                      {order.status === 'pending' && (
                        <Button 
                          size="sm" 
                          onClick={() => updateOrder.mutate({ 
                            orderId: order.id, 
                            updates: { status: 'in-progress', admin_status: 'approved' } 
                          })}
                        >
                          Start
                        </Button>
                      )}
                      {order.status === 'in-progress' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-green-500 border-green-500/20"
                          onClick={() => updateOrder.mutate({ 
                            orderId: order.id, 
                            updates: { status: 'completed', progress: 100, admin_status: 'closed' } 
                          })}
                        >
                          Complete
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
                        animate={{ width: `${order.progress}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Support Tickets Section */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            MT5 Support Tickets
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tickets.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No support tickets</p>
          ) : (
            <div className="space-y-4">
              {tickets.map((ticket: any) => (
                <TicketCard key={ticket.id} ticket={ticket} onReply={replyToTicket.mutate} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Order Details Modal Component with File Upload
const OrderDetailsModal = ({ order, onUpdate }: { order: any; onUpdate: (data: any) => void }) => {
  const [progress, setProgress] = useState(order.progress);
  const [isUploading, setIsUploading] = useState(false);
  const [isSendingLicense, setIsSendingLicense] = useState(false);
  const sourceCodeRef = useRef<HTMLInputElement>(null);
  const compiledBotRef = useRef<HTMLInputElement>(null);
  const backtestReportRef = useRef<HTMLInputElement>(null);

  const copyPrompt = () => {
    if (order.claude_prompt) {
      navigator.clipboard.writeText(order.claude_prompt);
      toast.success('Prompt copied to clipboard');
    }
  };

  const handleFileUpload = async (file: File, fileType: 'source' | 'compiled' | 'backtest') => {
    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${order.id}/${fileType}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('mt5-bot-files')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('mt5-bot-files')
        .getPublicUrl(fileName);

      // Update order with file URL
      const updateField = fileType === 'source' ? 'source_code_url' 
        : fileType === 'compiled' ? 'compiled_bot_url' 
        : 'backtest_report_url';

      onUpdate({ 
        orderId: order.id, 
        updates: { [updateField]: publicUrl } 
      });

      toast.success(`${fileType} file uploaded successfully`);
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(`Failed to upload ${fileType} file`);
    } finally {
      setIsUploading(false);
    }
  };

  const sendLicenseKey = async () => {
    setIsSendingLicense(true);
    try {
      const licenseKey = generateLicenseKey();
      
      // Update MT5 user with license key
      await supabase
        .from('mt5_users')
        .update({ 
          license_key: licenseKey,
          is_active: true,
          payment_verified: true 
        })
        .eq('user_id', order.user_id);

      // Get user email from profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('user_id', order.user_id)
        .single();

      // Get user email from auth
      const { data: { user } } = await supabase.auth.admin.getUserById(order.user_id);

      // Send license email via edge function
      await callEdgeFunction('send-notification', {
        type: 'mt5_license',
        to: user?.email || '',
        data: {
          licenseKey,
          planName: `MT5 ${order.plan_type}`,
          amount: order.amount,
          accountsAllowed: order.plan_type === 'elite' ? 'Unlimited' : order.plan_type === 'pro' ? '3' : '1',
          name: profile?.first_name || 'Trader',
        },
      });

      toast.success('License key generated and sent to user!');
    } catch (error: any) {
      console.error('License error:', error);
      toast.error('Failed to send license key');
    } finally {
      setIsSendingLicense(false);
    }
  };

  const revisionRequests = Array.isArray(order.revision_requests) ? order.revision_requests : [];

  return (
    <div className="space-y-6">
      <Tabs defaultValue="details">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="details">Order Details</TabsTrigger>
          <TabsTrigger value="files">Files & Delivery</TabsTrigger>
          <TabsTrigger value="revisions">
            Revisions {revisionRequests.length > 0 && `(${revisionRequests.length})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6 mt-4">
          {/* Order Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Order Number</Label>
              <p className="font-medium">{order.order_number}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Plan</Label>
              <p className="font-medium capitalize">{order.plan_type} - ${order.amount}</p>
            </div>
          </div>

          {/* Trading Strategy */}
          {order.trading_strategy && (
            <div>
              <Label className="text-muted-foreground">Trading Strategy</Label>
              <div className="mt-2 p-4 bg-white/5 rounded-lg">
                <p className="text-sm">{order.trading_strategy.description}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Timeframe: {order.trading_strategy.timeframe}
                </p>
              </div>
            </div>
          )}

          {/* Risk Management */}
          {order.risk_management && (
            <div>
              <Label className="text-muted-foreground">Risk Management</Label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                <div className="p-2 bg-white/5 rounded-lg text-center">
                  <p className="text-xs text-muted-foreground">Stop Loss</p>
                  <p className="font-medium">{order.risk_management.stopLoss} pips</p>
                </div>
                <div className="p-2 bg-white/5 rounded-lg text-center">
                  <p className="text-xs text-muted-foreground">Take Profit</p>
                  <p className="font-medium">{order.risk_management.takeProfit} pips</p>
                </div>
                <div className="p-2 bg-white/5 rounded-lg text-center">
                  <p className="text-xs text-muted-foreground">Max Drawdown</p>
                  <p className="font-medium">{order.risk_management.maxDrawdown}%</p>
                </div>
              </div>
            </div>
          )}

          {/* AI Prompt */}
          {order.claude_prompt && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-muted-foreground">AI Prompt</Label>
                <Button variant="ghost" size="sm" onClick={copyPrompt}>
                  <Clipboard className="w-4 h-4 mr-2" />
                  Copy
                </Button>
              </div>
              <div className="p-4 bg-white/5 rounded-lg max-h-32 overflow-y-auto">
                <p className="text-sm font-mono">{order.claude_prompt}</p>
              </div>
            </div>
          )}

          {/* Progress Slider */}
          <div>
            <Label className="text-muted-foreground">Update Progress: {progress}%</Label>
            <Slider
              value={[progress]}
              onValueChange={(v) => setProgress(v[0])}
              max={100}
              step={5}
              className="mt-2"
            />
            <Button 
              className="mt-4 w-full" 
              onClick={() => onUpdate({ orderId: order.id, updates: { progress } })}
            >
              Save Progress
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="files" className="space-y-6 mt-4">
          {/* File Upload Section */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload Bot Files
            </h3>
            
            {/* Source Code */}
            <div className="p-4 border border-white/10 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileCode className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="font-medium">Source Code (.mq5)</p>
                    <p className="text-xs text-muted-foreground">
                      {order.source_code_url ? 'Uploaded ✓' : 'Not uploaded'}
                    </p>
                  </div>
                </div>
                <div>
                  <input
                    ref={sourceCodeRef}
                    type="file"
                    accept=".mq5,.mql5"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'source')}
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={isUploading}
                    onClick={() => sourceCodeRef.current?.click()}
                  >
                    <Upload className="w-3 h-3 mr-2" />
                    Upload
                  </Button>
                </div>
              </div>
            </div>

            {/* Compiled Bot */}
            <div className="p-4 border border-white/10 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileCode className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="font-medium">Compiled Bot (.ex5)</p>
                    <p className="text-xs text-muted-foreground">
                      {order.compiled_bot_url ? 'Uploaded ✓' : 'Not uploaded'}
                    </p>
                  </div>
                </div>
                <div>
                  <input
                    ref={compiledBotRef}
                    type="file"
                    accept=".ex5"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'compiled')}
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={isUploading}
                    onClick={() => compiledBotRef.current?.click()}
                  >
                    <Upload className="w-3 h-3 mr-2" />
                    Upload
                  </Button>
                </div>
              </div>
            </div>

            {/* Backtest Report */}
            <div className="p-4 border border-white/10 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-purple-400" />
                  <div>
                    <p className="font-medium">Backtest Report (.pdf)</p>
                    <p className="text-xs text-muted-foreground">
                      {order.backtest_report_url ? 'Uploaded ✓' : 'Not uploaded'}
                    </p>
                  </div>
                </div>
                <div>
                  <input
                    ref={backtestReportRef}
                    type="file"
                    accept=".pdf,.html"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'backtest')}
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={isUploading}
                    onClick={() => backtestReportRef.current?.click()}
                  >
                    <Upload className="w-3 h-3 mr-2" />
                    Upload
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* License Key Section */}
          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <h3 className="font-semibold flex items-center gap-2 mb-3">
              <Key className="w-4 h-4 text-green-400" />
              License Key Delivery
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Generate and send a license key to the user via email. This will also activate their account.
            </p>
            <Button 
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={isSendingLicense}
              onClick={sendLicenseKey}
            >
              {isSendingLicense ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Generate & Send License Key
                </>
              )}
            </Button>
          </div>

          {/* Mark as Complete */}
          <Button 
            className="w-full"
            variant="outline"
            onClick={() => onUpdate({ 
              orderId: order.id, 
              updates: { status: 'completed', progress: 100, admin_status: 'closed' } 
            })}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Mark Order as Complete
          </Button>
        </TabsContent>

        {/* Revisions Tab */}
        <TabsContent value="revisions" className="space-y-6 mt-4">
          <h3 className="font-semibold">Revision History</h3>
          
          {revisionRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No revision requests yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {revisionRequests.map((revision: any, index: number) => (
                <Card key={revision.id || index} className={`border ${revision.status === 'pending' ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-white/10'}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge className={
                          revision.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                          revision.status === 'completed' ? 'bg-green-500/20 text-green-500' :
                          'bg-gray-500/20 text-gray-500'
                        }>
                          {revision.status || 'pending'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(revision.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <span className="text-xs font-mono text-muted-foreground">{revision.id}</span>
                    </div>
                    <p className="text-sm">{revision.details}</p>
                    
                    {revision.status === 'pending' && (
                      <div className="flex gap-2 mt-4">
                        <Button 
                          size="sm"
                          onClick={() => {
                            const updatedRevisions = revisionRequests.map((r: any) =>
                              r.id === revision.id ? { ...r, status: 'completed' } : r
                            );
                            onUpdate({ 
                              orderId: order.id, 
                              updates: { revision_requests: updatedRevisions as any, status: 'in-progress' },
                              notifyUser: true
                            });
                          }}
                        >
                          <CheckCircle className="w-3 h-3 mr-2" />
                          Mark Complete
                        </Button>
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const updatedRevisions = revisionRequests.map((r: any) =>
                              r.id === revision.id ? { ...r, status: 'rejected' } : r
                            );
                            onUpdate({ 
                              orderId: order.id, 
                              updates: { revision_requests: updatedRevisions as any },
                              notifyUser: true
                            });
                          }}
                        >
                          <XCircle className="w-3 h-3 mr-2" />
                          Decline
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Ticket Card Component
const TicketCard = ({ ticket, onReply }: { ticket: any; onReply: (data: any) => void }) => {
  const [replyText, setReplyText] = useState('');
  const [showReply, setShowReply] = useState(false);

  const handleReply = () => {
    if (replyText.trim()) {
      onReply({ ticketId: ticket.id, message: replyText });
      setReplyText('');
      setShowReply(false);
    }
  };

  return (
    <Card className="bg-white/5">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="font-medium">{ticket.subject}</p>
            <p className="text-xs text-muted-foreground">{ticket.ticket_number}</p>
          </div>
          <Badge className={ticket.status === 'open' ? 'bg-green-500/20 text-green-500' : 'bg-gray-500/20 text-gray-500'}>
            {ticket.status}
          </Badge>
        </div>

        {/* Messages */}
        <ScrollArea className="h-32 my-4">
          <div className="space-y-2">
            {ticket.mt5_ticket_messages?.map((msg: any) => (
              <div
                key={msg.id}
                className={`p-2 rounded-lg text-sm ${
                  msg.sender_type === 'admin' ? 'bg-primary/20 ml-4' : 'bg-white/10 mr-4'
                }`}
              >
                <p>{msg.content}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {msg.sender_type} • {new Date(msg.created_at).toLocaleTimeString()}
                </p>
              </div>
            ))}
          </div>
        </ScrollArea>

        {showReply ? (
          <div className="space-y-2">
            <Textarea
              placeholder="Type your reply..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={2}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleReply}>Send</Button>
              <Button size="sm" variant="outline" onClick={() => setShowReply(false)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setShowReply(true)}>
            Reply
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default MT5OrdersManagementTab;
