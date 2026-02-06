import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, DollarSign, TrendingUp, RefreshCw, IndianRupee } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useAccountantApi } from '@/hooks/useAccountantApi';
import { format } from 'date-fns';

interface Affiliate {
  id: string;
  user_id: string;
  affiliate_code: string;
  commission_rate: number;
  total_referrals: number;
  total_earnings: number;
  pending_earnings: number;
  paid_earnings: number;
  status: string;
  payout_method: string;
  payout_address: string;
  created_at: string;
}

interface Referral {
  id: string;
  affiliate_id: string;
  referred_user_id: string;
  payment_id: string;
  commission_amount: number;
  commission_status: string;
  created_at: string;
  paid_at: string | null;
}

const USD_TO_INR = 83.5;

const AffiliateSalesTab = () => {
  const { callAccountantApi, isLoading } = useAccountantApi();
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await callAccountantApi('get_affiliate_data');
      setAffiliates(result.affiliates || []);
      setReferrals(result.referrals || []);
    } catch (error) {
      console.error('Failed to fetch affiliate data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalEarnings = affiliates.reduce((sum, a) => sum + (a.total_earnings || 0), 0);
  const pendingEarnings = affiliates.reduce((sum, a) => sum + (a.pending_earnings || 0), 0);
  const paidEarnings = affiliates.reduce((sum, a) => sum + (a.paid_earnings || 0), 0);
  const totalReferrals = affiliates.reduce((sum, a) => sum + (a.total_referrals || 0), 0);

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return <Badge className="bg-emerald-500/20 text-emerald-400">Active</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-400">Pending</Badge>;
      case 'paid':
        return <Badge className="bg-blue-500/20 text-blue-400">Paid</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Earnings</CardTitle>
              <DollarSign className="w-5 h-5 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-500">${totalEarnings.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <IndianRupee className="w-3 h-3" />
                {(totalEarnings * USD_TO_INR).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Payouts</CardTitle>
              <TrendingUp className="w-5 h-5 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">${pendingEarnings.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <IndianRupee className="w-3 h-3" />
                {(pendingEarnings * USD_TO_INR).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Paid Out</CardTitle>
              <DollarSign className="w-5 h-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">${paidEarnings.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <IndianRupee className="w-3 h-3" />
                {(paidEarnings * USD_TO_INR).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Referrals</CardTitle>
              <Users className="w-5 h-5 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-500">{totalReferrals}</div>
              <p className="text-xs text-muted-foreground mt-1">{affiliates.length} affiliates</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Affiliates Table */}
      <Card className="border-white/[0.08]">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Affiliates</CardTitle>
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
          ) : affiliates.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No affiliates found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-white/[0.08]">
                  <TableHead>Affiliate Code</TableHead>
                  <TableHead>Commission Rate</TableHead>
                  <TableHead>Referrals</TableHead>
                  <TableHead>Total Earned</TableHead>
                  <TableHead>Pending</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {affiliates.map((affiliate) => (
                  <TableRow key={affiliate.id} className="border-white/[0.08]">
                    <TableCell className="font-mono font-medium">{affiliate.affiliate_code}</TableCell>
                    <TableCell>{affiliate.commission_rate}%</TableCell>
                    <TableCell>{affiliate.total_referrals}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium text-emerald-500">${(affiliate.total_earnings || 0).toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">₹{((affiliate.total_earnings || 0) * USD_TO_INR).toFixed(0)}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-yellow-400">${(affiliate.pending_earnings || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-blue-400">${(affiliate.paid_earnings || 0).toFixed(2)}</TableCell>
                    <TableCell>{getStatusBadge(affiliate.status)}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(affiliate.created_at), 'MMM dd, yyyy')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recent Referrals */}
      <Card className="border-white/[0.08]">
        <CardHeader>
          <CardTitle className="text-lg">Recent Referrals</CardTitle>
        </CardHeader>
        <CardContent>
          {referrals.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No referrals found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-white/[0.08]">
                  <TableHead>Affiliate ID</TableHead>
                  <TableHead>Referred User</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Paid At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {referrals.slice(0, 20).map((referral) => (
                  <TableRow key={referral.id} className="border-white/[0.08]">
                    <TableCell className="font-mono text-xs">{referral.affiliate_id.slice(0, 8)}...</TableCell>
                    <TableCell className="font-mono text-xs">{referral.referred_user_id.slice(0, 8)}...</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium text-emerald-500">${(referral.commission_amount || 0).toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">₹{((referral.commission_amount || 0) * USD_TO_INR).toFixed(0)}</p>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(referral.commission_status)}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(referral.created_at), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {referral.paid_at ? format(new Date(referral.paid_at), 'MMM dd, yyyy') : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AffiliateSalesTab;
