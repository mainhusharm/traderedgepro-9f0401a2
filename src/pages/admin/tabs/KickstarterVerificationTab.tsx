import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, XCircle, Clock, Eye, 
  ExternalLink, Loader2, Search, Filter
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { callEdgeFunction } from '@/config/api';
import { useAuth } from '@/lib/auth/AuthContext';
import { toast } from 'sonner';

interface Verification {
  id: string;
  user_id: string;
  user_email: string;
  affiliate_partner: string;
  screenshot_url: string | null;
  promo_code: string | null;
  submitted_at: string;
  verified_at: string | null;
  verified_by: string | null;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  access_granted: boolean;
  access_expires: string | null;
}

const KickstarterVerificationTab = () => {
  const { user } = useAuth();
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedVerification, setSelectedVerification] = useState<Verification | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchVerifications();
  }, []);

  const fetchVerifications = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase
        .from('kickstarter_verifications' as any)
        .select('*')
        .order('submitted_at', { ascending: false }) as any);

      if (error) throw error;
      setVerifications((data || []) as unknown as Verification[]);
    } catch (error) {
      console.error('Error fetching verifications:', error);
      toast.error('Failed to load verifications');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (verification: Verification) => {
    try {
      setProcessing(true);
      
      // Calculate access expiry (30 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const { error } = await supabase
        .from('kickstarter_verifications')
        .update({
          status: 'approved',
          verified_at: new Date().toISOString(),
          verified_by: user?.id,
          access_granted: true,
          access_expires: expiresAt.toISOString(),
        })
        .eq('id', verification.id);

      if (error) throw error;

      // Send approval email
      try {
        await callEdgeFunction('send-notification', {
          type: 'kickstarter_approved',
          to: verification.user_email,
          data: {
            affiliatePartner: verification.affiliate_partner,
            expiresAt: expiresAt.toISOString(),
          },
        });
      } catch (emailError) {
        console.error('Failed to send approval email:', emailError);
      }

      toast.success('Verification approved! User now has 30-day access.');
      fetchVerifications();
      setSelectedVerification(null);
    } catch (error) {
      console.error('Error approving verification:', error);
      toast.error('Failed to approve verification');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (verification: Verification) => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    try {
      setProcessing(true);

      const { error } = await supabase
        .from('kickstarter_verifications')
        .update({
          status: 'rejected',
          verified_at: new Date().toISOString(),
          verified_by: user?.id,
          rejection_reason: rejectionReason,
          access_granted: false,
        })
        .eq('id', verification.id);

      if (error) throw error;

      // Send rejection email
      try {
        await callEdgeFunction('send-notification', {
          type: 'kickstarter_rejected',
          to: verification.user_email,
          data: {
            rejectionReason: rejectionReason,
            affiliatePartner: verification.affiliate_partner,
          },
        });
      } catch (emailError) {
        console.error('Failed to send rejection email:', emailError);
      }

      toast.success('Verification rejected');
      fetchVerifications();
      setSelectedVerification(null);
      setRejectionReason('');
    } catch (error) {
      console.error('Error rejecting verification:', error);
      toast.error('Failed to reject verification');
    } finally {
      setProcessing(false);
    }
  };

  const filteredVerifications = verifications.filter(v => {
    const matchesSearch = v.user_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.affiliate_partner.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = verifications.filter(v => v.status === 'pending').length;
  const approvedCount = verifications.filter(v => v.status === 'approved').length;
  const rejectedCount = verifications.filter(v => v.status === 'rejected').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-500">Pending</Badge>;
      case 'approved':
        return <Badge className="bg-green-500/20 text-green-500">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/20 text-red-500">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Kickstarter Verifications</h2>
          <p className="text-sm text-muted-foreground">Review affiliate purchase screenshots</p>
        </div>
        <Button onClick={fetchVerifications} variant="outline" size="sm">
          <Loader2 className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-white/[0.08]">
          <CardContent className="p-4 flex items-center gap-4">
            <Clock className="w-8 h-8 text-yellow-500" />
            <div>
              <p className="text-2xl font-bold">{pendingCount}</p>
              <p className="text-xs text-muted-foreground">Pending Review</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-white/[0.08]">
          <CardContent className="p-4 flex items-center gap-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{approvedCount}</p>
              <p className="text-xs text-muted-foreground">Approved</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-white/[0.08]">
          <CardContent className="p-4 flex items-center gap-4">
            <XCircle className="w-8 h-8 text-red-500" />
            <div>
              <p className="text-2xl font-bold">{rejectedCount}</p>
              <p className="text-xs text-muted-foreground">Rejected</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-white/[0.08]">
          <CardContent className="p-4 flex items-center gap-4">
            <Filter className="w-8 h-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{verifications.length}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by email or affiliate partner..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'pending', 'approved', 'rejected'].map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(status)}
              className="capitalize"
            >
              {status}
            </Button>
          ))}
        </div>
      </div>

      {/* Verifications List */}
      <div className="space-y-4">
        {filteredVerifications.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Clock className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No verifications found</h3>
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== 'all' 
                  ? 'Try adjusting your filters'
                  : 'No affiliate verification requests yet'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredVerifications.map((verification) => (
            <motion.div
              key={verification.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="hover:border-primary/30 transition-colors">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold">{verification.user_email}</h3>
                        {getStatusBadge(verification.status)}
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span>Partner: <strong className="text-foreground">{verification.affiliate_partner}</strong></span>
                        {verification.promo_code && (
                          <span>Code: <strong className="text-foreground">{verification.promo_code}</strong></span>
                        )}
                        <span>Submitted: {new Date(verification.submitted_at).toLocaleDateString()}</span>
                      </div>
                      {verification.status === 'rejected' && verification.rejection_reason && (
                        <p className="text-sm text-red-500">
                          Rejection: {verification.rejection_reason}
                        </p>
                      )}
                      {verification.status === 'approved' && verification.access_expires && (
                        <p className="text-sm text-green-500">
                          Access expires: {new Date(verification.access_expires).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {verification.screenshot_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(verification.screenshot_url!, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View Screenshot
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedVerification(verification)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Review
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Review Dialog */}
      <Dialog open={!!selectedVerification} onOpenChange={() => setSelectedVerification(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Verification</DialogTitle>
            <DialogDescription>
              Review the affiliate purchase and approve or reject access
            </DialogDescription>
          </DialogHeader>
          {selectedVerification && (
            <div className="space-y-4">
              <div className="space-y-2 p-4 rounded-lg bg-muted/50">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-medium">{selectedVerification.user_email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Partner</span>
                  <span className="font-medium">{selectedVerification.affiliate_partner}</span>
                </div>
                {selectedVerification.promo_code && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Promo Code</span>
                    <span className="font-medium">{selectedVerification.promo_code}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Submitted</span>
                  <span className="font-medium">
                    {new Date(selectedVerification.submitted_at).toLocaleString()}
                  </span>
                </div>
              </div>

              {selectedVerification.screenshot_url && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Screenshot:</p>
                  <img
                    src={selectedVerification.screenshot_url}
                    alt="Purchase screenshot"
                    className="w-full rounded-lg border border-white/10"
                  />
                </div>
              )}

              {selectedVerification.status === 'pending' && (
                <>
                  <div>
                    <label className="text-sm text-muted-foreground">Rejection Reason (if rejecting)</label>
                    <Textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Enter reason for rejection..."
                      className="mt-2"
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleApprove(selectedVerification)}
                      disabled={processing}
                      className="flex-1"
                    >
                      {processing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                      Approve (30 days)
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleReject(selectedVerification)}
                      disabled={processing}
                      className="flex-1"
                    >
                      {processing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}
                      Reject
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default KickstarterVerificationTab;
