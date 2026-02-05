import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { callEdgeFunction } from '@/config/api';
import { toast } from 'sonner';
import { 
  Check, 
  X, 
  RefreshCw, 
  Search, 
  ExternalLink, 
  Clock, 
  CheckCircle2, 
  XCircle,
  DollarSign,
  CreditCard,
  Bitcoin,
  Loader2,
  FileText,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';

interface Payment {
  id: string;
  user_id: string;
  plan_name: string;
  original_price: number;
  discount_amount: number;
  final_price: number;
  payment_method: string;
  transaction_id: string | null;
  affiliate_code: string | null;
  coupon_code: string | null;
  status: string;
  created_at: string;
  completed_at: string | null;
  terms_accepted_at: string | null;
  terms_ip_address: string | null;
  paypal_payer_email: string | null;
  dispute_warning_shown: boolean;
  profiles: {
    first_name: string | null;
    last_name: string | null;
  } | null;
}

interface UserActivity {
  id: string;
  activity_type: string;
  activity_details: unknown;
  created_at: string;
  ip_address: string | null;
}

export const AllPaymentsReviewTab = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'failed'>('all');
  const [methodFilter, setMethodFilter] = useState<'all' | 'crypto' | 'paypal' | 'trial'>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [userActivity, setUserActivity] = useState<UserActivity[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, [statusFilter, methodFilter]);

  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (methodFilter !== 'all') {
        if (methodFilter === 'crypto') {
          query = query.eq('payment_method', 'crypto');
        } else if (methodFilter === 'paypal') {
          query = query.eq('payment_method', 'paypal');
        } else if (methodFilter === 'trial') {
          query = query.eq('payment_method', 'trial');
        }
      }

      const { data, error } = await query.limit(100);

      if (error) throw error;
      setPayments((data || []).map((p: any) => ({ ...p, profiles: null })) as unknown as Payment[]);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Failed to fetch payments');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserActivity = async (userId: string) => {
    setLoadingActivity(true);
    setSelectedUser(userId);
    try {
      const { data, error } = await supabase
        .from('user_activity_log')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setUserActivity((data || []).map((a: any) => ({
        ...a,
        ip_address: a.ip_address || null
      })) as UserActivity[]);
    } catch (error) {
      console.error('Error fetching user activity:', error);
      toast.error('Failed to fetch user activity');
    } finally {
      setLoadingActivity(false);
    }
  };

  const handleApprovePayment = async (payment: Payment) => {
    setProcessingId(payment.id);
    try {
      // Update payment status
      const { error: paymentError } = await supabase
        .from('payments')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', payment.id);

      if (paymentError) throw paymentError;

      // Activate membership
      const { error: membershipError } = await supabase
        .from('memberships')
        .update({ 
          status: 'active',
          starts_at: new Date().toISOString()
        })
        .eq('user_id', payment.user_id)
        .eq('status', 'pending');

      if (membershipError) throw membershipError;

      // Send activation email
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name')
          .eq('user_id', payment.user_id)
          .single();

        const { data: userData } = await supabase.auth.admin.getUserById(payment.user_id);

        if (userData?.user?.email) {
          await callEdgeFunction('send-membership-activation', {
            email: userData.user.email,
            planName: payment.plan_name,
            firstName: profile?.first_name || 'Trader',
          });
        }
      } catch (emailErr) {
        console.warn('Failed to send activation email:', emailErr);
      }

      toast.success('Payment approved and membership activated');
      fetchPayments();
    } catch (error) {
      console.error('Error approving payment:', error);
      toast.error('Failed to approve payment');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectPayment = async (payment: Payment) => {
    setProcessingId(payment.id);
    try {
      // Update payment status
      const { error: paymentError } = await supabase
        .from('payments')
        .update({ status: 'failed' })
        .eq('id', payment.id);

      if (paymentError) throw paymentError;

      // Cancel pending membership
      const { error: membershipError } = await supabase
        .from('memberships')
        .update({ status: 'cancelled' })
        .eq('user_id', payment.user_id)
        .eq('status', 'pending');

      if (membershipError) throw membershipError;

      // Send rejection email
      try {
        const { data: userData } = await supabase.auth.admin.getUserById(payment.user_id);
        if (userData?.user?.email) {
          await callEdgeFunction('send-payment-rejection', {
            email: userData.user.email,
            planName: payment.plan_name,
          });
        }
      } catch (emailErr) {
        console.warn('Failed to send rejection email:', emailErr);
      }

      toast.success('Payment rejected');
      fetchPayments();
    } catch (error) {
      console.error('Error rejecting payment:', error);
      toast.error('Failed to reject payment');
    } finally {
      setProcessingId(null);
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'crypto':
        return <Bitcoin className="w-4 h-4" />;
      case 'paypal':
        return <CreditCard className="w-4 h-4" />;
      default:
        return <DollarSign className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-success/10 text-success border-success/30"><CheckCircle2 className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredPayments = payments.filter(p => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      p.plan_name?.toLowerCase().includes(searchLower) ||
      p.transaction_id?.toLowerCase().includes(searchLower) ||
      p.paypal_payer_email?.toLowerCase().includes(searchLower) ||
      p.profiles?.first_name?.toLowerCase().includes(searchLower) ||
      p.profiles?.last_name?.toLowerCase().includes(searchLower)
    );
  });

  const stats = {
    pending: payments.filter(p => p.status === 'pending').length,
    completed: payments.filter(p => p.status === 'completed').length,
    totalValue: payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + (p.final_price || 0), 0),
    pendingValue: payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + (p.final_price || 0), 0)
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">All Payments Review</h2>
        <p className="text-muted-foreground">Manage and verify all payment submissions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.completed}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">${stats.pendingValue.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">Pending Value</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">${stats.totalValue.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">Total Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="glass-card">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, plan, transaction ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                All Status
              </Button>
              <Button
                variant={statusFilter === 'pending' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('pending')}
              >
                Pending
              </Button>
              <Button
                variant={statusFilter === 'completed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('completed')}
              >
                Completed
              </Button>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={methodFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMethodFilter('all')}
              >
                All Methods
              </Button>
              <Button
                variant={methodFilter === 'crypto' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMethodFilter('crypto')}
              >
                <Bitcoin className="w-3 h-3 mr-1" />
                Crypto
              </Button>
              <Button
                variant={methodFilter === 'paypal' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMethodFilter('paypal')}
              >
                <CreditCard className="w-3 h-3 mr-1" />
                PayPal
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={fetchPayments}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card className="glass-card">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground">Date</th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground">Customer</th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground">Plan</th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground">Amount</th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground">Method</th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground">Transaction</th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="p-4">
                      <div className="text-sm">
                        {format(new Date(payment.created_at), 'MMM d, yyyy')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(payment.created_at), 'h:mm a')}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm font-medium">
                        {payment.profiles?.first_name} {payment.profiles?.last_name}
                      </div>
                      {payment.paypal_payer_email && (
                        <div className="text-xs text-muted-foreground">
                          {payment.paypal_payer_email}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <Badge variant="outline">{payment.plan_name}</Badge>
                      {payment.coupon_code && (
                        <div className="text-xs text-success mt-1">
                          Coupon: {payment.coupon_code}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="text-sm font-bold text-primary">
                        ${payment.final_price?.toFixed(2)}
                      </div>
                      {payment.discount_amount > 0 && (
                        <div className="text-xs text-muted-foreground line-through">
                          ${payment.original_price?.toFixed(2)}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {getMethodIcon(payment.payment_method)}
                        <span className="text-sm capitalize">{payment.payment_method}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      {payment.transaction_id ? (
                        <div className="flex items-center gap-1">
                          <code className="text-xs bg-black/30 px-2 py-1 rounded">
                            {payment.transaction_id.slice(0, 12)}...
                          </code>
                          {payment.payment_method === 'crypto' && (
                            <a
                              href={`https://etherscan.io/tx/${payment.transaction_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:text-primary/80"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">N/A</span>
                      )}
                    </td>
                    <td className="p-4">
                      {getStatusBadge(payment.status)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {payment.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-success/10 hover:bg-success/20 text-success border-success/30"
                              onClick={() => handleApprovePayment(payment)}
                              disabled={processingId === payment.id}
                            >
                              {processingId === payment.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Check className="w-3 h-3" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-destructive/10 hover:bg-destructive/20 text-destructive border-destructive/30"
                              onClick={() => handleRejectPayment(payment)}
                              disabled={processingId === payment.id}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </>
                        )}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => fetchUserActivity(payment.user_id)}
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <FileText className="w-5 h-5" />
                                User Activity Evidence
                              </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                                <h4 className="font-medium mb-2">Payment Details</h4>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  <div><strong>Plan:</strong> {payment.plan_name}</div>
                                  <div><strong>Amount:</strong> ${payment.final_price}</div>
                                  <div><strong>Method:</strong> {payment.payment_method}</div>
                                  <div><strong>Date:</strong> {format(new Date(payment.created_at), 'PPpp')}</div>
                                  {payment.terms_accepted_at && (
                                    <div className="col-span-2">
                                      <strong>Terms Accepted:</strong> {format(new Date(payment.terms_accepted_at), 'PPpp')}
                                      {payment.terms_ip_address && ` from IP: ${payment.terms_ip_address}`}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div>
                                <h4 className="font-medium mb-2">Activity Log ({userActivity.length} entries)</h4>
                                {loadingActivity ? (
                                  <div className="text-center py-4">
                                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                                  </div>
                                ) : userActivity.length === 0 ? (
                                  <p className="text-muted-foreground text-sm">No activity logged yet</p>
                                ) : (
                                  <div className="space-y-2 max-h-60 overflow-auto">
                                    {userActivity.map((activity) => (
                                      <div 
                                        key={activity.id} 
                                        className="p-3 rounded-lg bg-white/5 border border-white/10 text-sm"
                                      >
                                        <div className="flex justify-between items-start">
                                          <Badge variant="outline" className="capitalize">
                                            {activity.activity_type.replace('_', ' ')}
                                          </Badge>
                                          <span className="text-xs text-muted-foreground">
                                            {format(new Date(activity.created_at), 'MMM d, h:mm a')}
                                          </span>
                                        </div>
                                        {activity.ip_address && (
                                          <div className="text-xs text-muted-foreground mt-1">
                                            IP: {activity.ip_address}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredPayments.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No payments found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AllPaymentsReviewTab;
