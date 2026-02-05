import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, DollarSign, TrendingUp, Users, RefreshCw, IndianRupee } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useAccountantApi } from '@/hooks/useAccountantApi';
import { format } from 'date-fns';

interface Payment {
  id: string;
  user_id: string;
  plan_name: string;
  original_price: number;
  discount_amount: number;
  final_price: number;
  coupon_code: string | null;
  payment_method: string;
  payment_provider: string;
  status: string;
  created_at: string;
  affiliate_code: string | null;
  affiliate_commission: number | null;
}

interface PaymentsOverviewTabProps {
  showFullTable?: boolean;
}

// Approximate USD to INR rate (you can update this or fetch live rate)
const USD_TO_INR = 83.5;

const PaymentsOverviewTab = ({ showFullTable = false }: PaymentsOverviewTabProps) => {
  const { callAccountantApi, isLoading } = useAccountantApi();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [emailMap, setEmailMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await callAccountantApi('get_payments');
      setPayments(result.payments || []);

      // Get user emails
      const userIds = [...new Set((result.payments || []).map((p: Payment) => p.user_id))];
      if (userIds.length > 0) {
        const emailResult = await callAccountantApi('get_user_emails', { user_ids: userIds });
        setEmailMap(emailResult.emailMap || {});
      }
    } catch (error) {
      console.error('Failed to fetch payments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const completedPayments = payments.filter(p => p.status === 'completed');
  const totalRevenue = completedPayments.reduce((sum, p) => sum + (p.final_price || 0), 0);
  const totalAffiliateCommission = completedPayments.reduce((sum, p) => sum + (p.affiliate_commission || 0), 0);
  const netRevenue = totalRevenue - totalAffiliateCommission;

  const formatCurrency = (amount: number, showBoth = true) => {
    const usd = `$${amount.toFixed(2)}`;
    const inr = `₹${(amount * USD_TO_INR).toFixed(0)}`;
    return showBoth ? `${usd} (${inr})` : usd;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-emerald-500/20 text-emerald-400">Completed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-400">Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/20 text-red-400">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPaymentMethodBadge = (method: string) => {
    const colors: Record<string, string> = {
      stripe: 'bg-purple-500/20 text-purple-400',
      paypal: 'bg-blue-500/20 text-blue-400',
      crypto: 'bg-orange-500/20 text-orange-400',
    };
    return <Badge className={colors[method?.toLowerCase()] || 'bg-gray-500/20 text-gray-400'}>{method || 'N/A'}</Badge>;
  };

  const displayPayments = showFullTable ? payments : payments.slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
              <DollarSign className="w-5 h-5 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-500">${totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <IndianRupee className="w-3 h-3" />
                {(totalRevenue * USD_TO_INR).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Net Revenue</CardTitle>
              <TrendingUp className="w-5 h-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">${netRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <IndianRupee className="w-3 h-3" />
                {(netRevenue * USD_TO_INR).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Transactions</CardTitle>
              <CreditCard className="w-5 h-5 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-500">{completedPayments.length}</div>
              <p className="text-xs text-muted-foreground mt-1">{payments.length} total attempts</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Affiliate Payouts</CardTitle>
              <Users className="w-5 h-5 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">${totalAffiliateCommission.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <IndianRupee className="w-3 h-3" />
                {(totalAffiliateCommission * USD_TO_INR).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Payments Table */}
      <Card className="border-white/[0.08]">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">{showFullTable ? 'All Payments' : 'Recent Payments'}</CardTitle>
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-white/[0.08]">
                  <TableHead>User ID / Email</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Affiliate</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayPayments.map((payment) => (
                  <TableRow key={payment.id} className="border-white/[0.08]">
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground font-mono">{payment.user_id.slice(0, 8)}...</p>
                        <p className="text-sm">{emailMap[payment.user_id] || 'Loading...'}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{payment.plan_name}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium text-emerald-500">${payment.final_price?.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">₹{((payment.final_price || 0) * USD_TO_INR).toFixed(0)}</p>
                      </div>
                    </TableCell>
                    <TableCell>{getPaymentMethodBadge(payment.payment_method)}</TableCell>
                    <TableCell>{getStatusBadge(payment.status)}</TableCell>
                    <TableCell>
                      {payment.affiliate_code ? (
                        <div className="space-y-1">
                          <Badge variant="outline" className="text-xs">{payment.affiliate_code}</Badge>
                          {payment.affiliate_commission && (
                            <p className="text-xs text-orange-400">${payment.affiliate_commission}</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(payment.created_at), 'MMM dd, yyyy HH:mm')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {!showFullTable && payments.length > 10 && (
            <p className="text-center text-muted-foreground text-sm mt-4">
              Showing 10 of {payments.length} payments. Switch to Payments tab to see all.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentsOverviewTab;
