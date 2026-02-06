import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Coins, 
  Check, 
  X, 
  Clock, 
  ExternalLink, 
  Search,
  Filter,
  Loader2,
  Eye,
  DollarSign,
  RefreshCw,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { callEdgeFunction } from '@/config/api';
import { toast } from 'sonner';

interface Payment {
  id: string;
  user_id: string;
  plan_name: string;
  original_price: number;
  discount_amount: number;
  final_price: number;
  payment_method: string;
  transaction_id: string | null;
  status: string;
  coupon_code: string | null;
  affiliate_code: string | null;
  affiliate_commission: number;
  created_at: string;
  completed_at: string | null;
}

const CryptoPaymentReviewTab = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'failed'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  useEffect(() => {
    fetchPayments();
  }, [filter]);

  const fetchPayments = async () => {
    try {
      let query = supabase
        .from('payments')
        .select('*')
        .eq('payment_method', 'crypto')
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPayments(data || []);
    } catch (error: any) {
      console.error('Error fetching payments:', error);
      toast.error('Failed to load payments');
    } finally {
      setIsLoading(false);
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

      // Get membership and activate it
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data: membership, error: membershipError } = await supabase
        .from('memberships')
        .update({ 
          status: 'active',
          starts_at: new Date().toISOString(),
          expires_at: expiresAt
        })
        .eq('user_id', payment.user_id)
        .eq('status', 'pending')
        .select()
        .maybeSingle();

      if (membershipError) console.error('Membership update error:', membershipError);

      // Get user email and send activation notification
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', payment.user_id)
        .single();

      // Get auth user email
      const { data: authData } = await supabase.auth.admin.getUserById(payment.user_id);
      const userEmail = authData?.user?.email;

      if (userEmail) {
        // Send activation email
        await callEdgeFunction('send-membership-activation', {
          email: userEmail,
          planName: payment.plan_name,
          expiresAt: expiresAt,
        });
      }

      // Handle affiliate commission if applicable
      if (payment.affiliate_code) {
        await processAffiliateCommission(payment);
      }

      toast.success('Payment approved, membership activated, and email sent');
      fetchPayments();
    } catch (error: unknown) {
      console.error('Error approving payment:', error);
      toast.error('Failed to approve payment');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectPayment = async (payment: Payment, reason?: string) => {
    setProcessingId(payment.id);
    try {
      const { error } = await supabase
        .from('payments')
        .update({ status: 'failed' })
        .eq('id', payment.id);

      if (error) throw error;

      // Also update membership to cancelled
      await supabase
        .from('memberships')
        .update({ status: 'cancelled' })
        .eq('user_id', payment.user_id)
        .eq('status', 'pending');

      // Get user email and send rejection notification
      const { data: authData } = await supabase.auth.admin.getUserById(payment.user_id);
      const userEmail = authData?.user?.email;

      if (userEmail) {
        await callEdgeFunction('send-payment-rejection', {
          email: userEmail,
          planName: payment.plan_name,
          rejectionReason: reason || 'Transaction could not be verified on the blockchain.',
        });
      }

      toast.success('Payment rejected and notification sent');
      fetchPayments();
    } catch (error: unknown) {
      console.error('Error rejecting payment:', error);
      toast.error('Failed to reject payment');
    } finally {
      setProcessingId(null);
    }
  };

  const processAffiliateCommission = async (payment: Payment) => {
    try {
      // Find affiliate by code
      const { data: affiliate } = await supabase
        .from('affiliates')
        .select('*')
        .eq('affiliate_code', payment.affiliate_code)
        .single();

      if (!affiliate) return;

      const commissionAmount = (payment.final_price * affiliate.commission_rate) / 100;

      // Create referral record
      await supabase
        .from('affiliate_referrals')
        .insert({
          affiliate_id: affiliate.id,
          referred_user_id: payment.user_id,
          payment_id: payment.id,
          commission_amount: commissionAmount,
          commission_status: 'approved'
        });

      // Update affiliate earnings
      await supabase
        .from('affiliates')
        .update({
          total_referrals: affiliate.total_referrals + 1,
          total_earnings: affiliate.total_earnings + commissionAmount,
          pending_earnings: affiliate.pending_earnings + commissionAmount
        })
        .eq('id', affiliate.id);

      // Update payment with commission
      await supabase
        .from('payments')
        .update({ affiliate_commission: commissionAmount })
        .eq('id', payment.id);

    } catch (error) {
      console.error('Error processing affiliate commission:', error);
    }
  };

  // Auto-verify payment on blockchain
  const handleAutoVerify = async (payment: Payment) => {
    if (!payment.transaction_id) {
      toast.error('No transaction hash available');
      return;
    }

    setVerifyingId(payment.id);
    try {
      // Determine network from transaction hash format
      let network = 'ethereum';
      if (payment.transaction_id.startsWith('T') || payment.transaction_id.length === 64) {
        network = 'tron';
      } else if (!payment.transaction_id.startsWith('0x')) {
        network = 'bitcoin';
      }

      const { data, error } = await callEdgeFunction('verify-crypto-payment', {
        paymentId: payment.id,
        transactionHash: payment.transaction_id,
        network: network,
        expectedAmount: payment.final_price,
        expectedAddress: '', // Will use default addresses in edge function
      });

      if (error) throw error;

      if (data.verified) {
        toast.success(`Payment verified automatically! ${data.confirmations} confirmations`);
        fetchPayments();
      } else if (data.status === 'pending') {
        toast.warning(`Transaction pending: ${data.message}`);
      } else if (data.status === 'not_found') {
        toast.error('Transaction not found on blockchain');
      } else {
        toast.error(data.message || 'Verification failed');
      }
    } catch (error) {
      console.error('Auto-verification error:', error);
      toast.error('Auto-verification failed');
    } finally {
      setVerifyingId(null);
    }
  };

  const filteredPayments = payments.filter(p => {
    if (!searchTerm) return true;
    return (
      p.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.plan_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.user_id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const stats = {
    pending: payments.filter(p => p.status === 'pending').length,
    completed: payments.filter(p => p.status === 'completed').length,
    totalValue: payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.final_price, 0)
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
          <Coins className="w-5 h-5 text-warning" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Crypto Payment Review</h2>
          <p className="text-sm text-muted-foreground">Review and approve crypto payments</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card p-4 rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-warning" />
            <span className="text-sm text-muted-foreground">Pending</span>
          </div>
          <p className="text-2xl font-bold text-warning">{stats.pending}</p>
        </div>
        <div className="glass-card p-4 rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <Check className="w-5 h-5 text-success" />
            <span className="text-sm text-muted-foreground">Completed</span>
          </div>
          <p className="text-2xl font-bold text-success">{stats.completed}</p>
        </div>
        <div className="glass-card p-4 rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-5 h-5 text-primary" />
            <span className="text-sm text-muted-foreground">Total Value</span>
          </div>
          <p className="text-2xl font-bold">${stats.totalValue.toFixed(2)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by TX hash, plan, or user..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white/5 border-white/10"
          />
        </div>

        <div className="flex items-center gap-2 bg-white/5 rounded-lg p-1">
          {['all', 'pending', 'completed', 'failed'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-3 py-1.5 rounded-md text-sm capitalize transition-colors ${
                filter === f ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Payments Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.08]">
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Date</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Plan</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Amount</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">TX Hash</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Affiliate</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    No payments found
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => (
                  <tr key={payment.id} className="border-b border-white/[0.05] hover:bg-white/[0.02]">
                    <td className="p-4">
                      <p className="text-sm">{new Date(payment.created_at).toLocaleDateString()}</p>
                      <p className="text-xs text-muted-foreground">{new Date(payment.created_at).toLocaleTimeString()}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-medium">{payment.plan_name}</p>
                      {payment.coupon_code && (
                        <p className="text-xs text-success">Coupon: {payment.coupon_code}</p>
                      )}
                    </td>
                    <td className="p-4">
                      <p className="font-bold">${payment.final_price.toFixed(2)}</p>
                      {payment.discount_amount > 0 && (
                        <p className="text-xs text-muted-foreground line-through">${payment.original_price.toFixed(2)}</p>
                      )}
                    </td>
                    <td className="p-4">
                      {payment.transaction_id ? (
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-black/30 px-2 py-1 rounded">
                            {payment.transaction_id.slice(0, 12)}...
                          </code>
                          <a
                            href={`https://etherscan.io/tx/${payment.transaction_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:text-primary/80"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </td>
                    <td className="p-4">
                      {payment.affiliate_code ? (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                          {payment.affiliate_code}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        payment.status === 'completed' ? 'bg-success/20 text-success' :
                        payment.status === 'pending' ? 'bg-warning/20 text-warning' :
                        'bg-risk/20 text-risk'
                      }`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {payment.status === 'pending' && (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAutoVerify(payment)}
                            disabled={verifyingId === payment.id || !payment.transaction_id}
                            className="text-primary border-primary/20 hover:bg-primary/10"
                            title="Auto-verify on blockchain"
                          >
                            {verifyingId === payment.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <RefreshCw className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleApprovePayment(payment)}
                            disabled={processingId === payment.id}
                            className="text-success border-success/20 hover:bg-success/10"
                            title="Approve manually"
                          >
                            {processingId === payment.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRejectPayment(payment)}
                            disabled={processingId === payment.id}
                            className="text-risk border-risk/20 hover:bg-risk/10"
                            title="Reject"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CryptoPaymentReviewTab;
