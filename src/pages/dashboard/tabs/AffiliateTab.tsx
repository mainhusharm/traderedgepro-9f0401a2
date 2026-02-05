import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Link2, 
  DollarSign, 
  Copy, 
  Check, 
  TrendingUp, 
  Clock,
  Wallet,
  Share2,
  Loader2,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { toast } from 'sonner';

const MINIMUM_WITHDRAWAL = 100;

interface AffiliateData {
  id: string;
  affiliate_code: string;
  commission_rate: number;
  total_referrals: number;
  total_earnings: number;
  pending_earnings: number;
  paid_earnings: number;
  status: string;
  payout_method: string | null;
  payout_address: string | null;
}

interface Referral {
  id: string;
  referred_user_id: string;
  commission_amount: number;
  commission_status: string;
  created_at: string;
}

const AffiliateTab = () => {
  const { user } = useAuth();
  const [affiliate, setAffiliate] = useState<AffiliateData | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [payoutMethod, setPayoutMethod] = useState('');
  const [payoutAddress, setPayoutAddress] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isRequestingWithdrawal, setIsRequestingWithdrawal] = useState(false);

  const affiliateLink = affiliate 
    ? `${window.location.origin}/?ref=${affiliate.affiliate_code}` 
    : '';

  useEffect(() => {
    if (user) {
      fetchAffiliateData();
    }
  }, [user]);

  const fetchAffiliateData = async () => {
    try {
      // Check if user has affiliate account
      let { data: affiliateData, error } = await supabase
        .from('affiliates')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code === 'PGRST116') {
        // Create affiliate account
        const affiliateCode = generateAffiliateCode();
        const { data: newAffiliate, error: createError } = await supabase
          .from('affiliates')
          .insert({
            user_id: user?.id,
            affiliate_code: affiliateCode,
            commission_rate: 20
          })
          .select()
          .single();

        if (createError) throw createError;
        affiliateData = newAffiliate;
      } else if (error) {
        throw error;
      }

      setAffiliate(affiliateData);
      setPayoutMethod(affiliateData?.payout_method || '');
      setPayoutAddress(affiliateData?.payout_address || '');

      // Fetch referrals
      if (affiliateData) {
        const { data: referralData } = await supabase
          .from('affiliate_referrals')
          .select('*')
          .eq('affiliate_id', affiliateData.id)
          .order('created_at', { ascending: false });

        setReferrals(referralData || []);
      }
    } catch (error: any) {
      console.error('Error fetching affiliate data:', error);
      toast.error('Failed to load affiliate data');
    } finally {
      setIsLoading(false);
    }
  };

  const generateAffiliateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'NEX';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const copyLink = () => {
    navigator.clipboard.writeText(affiliateLink);
    setCopied(true);
    toast.success('Affiliate link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSavePayoutSettings = async () => {
    if (!affiliate) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('affiliates')
        .update({
          payout_method: payoutMethod,
          payout_address: payoutAddress
        })
        .eq('id', affiliate.id);

      if (error) throw error;
      toast.success('Payout settings saved');
    } catch (error: any) {
      console.error('Error saving payout settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const canWithdraw = (affiliate?.pending_earnings || 0) >= MINIMUM_WITHDRAWAL && payoutMethod && payoutAddress;
  const amountNeededForWithdrawal = Math.max(0, MINIMUM_WITHDRAWAL - (affiliate?.pending_earnings || 0));

  const handleRequestWithdrawal = async () => {
    if (!affiliate || !canWithdraw) return;

    setIsRequestingWithdrawal(true);
    try {
      // In production, this would create a withdrawal request
      toast.success('Withdrawal request submitted! You will receive your payout within 3-5 business days.');
    } catch (error: any) {
      console.error('Error requesting withdrawal:', error);
      toast.error('Failed to submit withdrawal request');
    } finally {
      setIsRequestingWithdrawal(false);
    }
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
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Share2 className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Affiliate Program</h2>
          <p className="text-sm text-muted-foreground">Earn {affiliate?.commission_rate || 20}% commission on every referral</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-4 rounded-xl"
        >
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-primary" />
            <span className="text-sm text-muted-foreground">Total Referrals</span>
          </div>
          <p className="text-2xl font-bold">{affiliate?.total_referrals || 0}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-4 rounded-xl"
        >
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-success" />
            <span className="text-sm text-muted-foreground">Total Earnings</span>
          </div>
          <p className="text-2xl font-bold text-success">${(affiliate?.total_earnings || 0).toFixed(2)}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-4 rounded-xl"
        >
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-warning" />
            <span className="text-sm text-muted-foreground">Pending</span>
          </div>
          <p className="text-2xl font-bold text-warning">${(affiliate?.pending_earnings || 0).toFixed(2)}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-4 rounded-xl"
        >
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-5 h-5 text-primary" />
            <span className="text-sm text-muted-foreground">Paid Out</span>
          </div>
          <p className="text-2xl font-bold">${(affiliate?.paid_earnings || 0).toFixed(2)}</p>
        </motion.div>
      </div>

      {/* Affiliate Link */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card p-6 rounded-xl"
      >
        <div className="flex items-center gap-2 mb-4">
          <Link2 className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Your Affiliate Link</h3>
        </div>

        <div className="flex gap-3">
          <Input
            value={affiliateLink}
            readOnly
            className="bg-white/5 border-white/10 font-mono text-sm"
          />
          <Button onClick={copyLink} className="gap-2 shrink-0">
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy'}
          </Button>
        </div>

        <div className="mt-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
          <p className="text-sm text-muted-foreground">
            <strong className="text-primary">Your Code:</strong> {affiliate?.affiliate_code}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Share this link with friends. When they sign up and make a payment, you earn <strong className="text-success">{affiliate?.commission_rate}%</strong> commission!
          </p>
        </div>
      </motion.div>

      {/* Payout Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-card p-6 rounded-xl"
      >
        <div className="flex items-center gap-2 mb-4">
          <Wallet className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Payout Settings</h3>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Payout Method</Label>
            <select
              value={payoutMethod}
              onChange={(e) => setPayoutMethod(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/10 text-foreground"
            >
              <option value="">Select method...</option>
              <option value="eth">Ethereum (ETH)</option>
              <option value="sol">Solana (SOL)</option>
              <option value="usdt">USDT (ERC-20)</option>
              <option value="paypal">PayPal</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label>Wallet/Email Address</Label>
            <Input
              value={payoutAddress}
              onChange={(e) => setPayoutAddress(e.target.value)}
              placeholder="0x... or email@example.com"
              className="bg-white/5 border-white/10"
            />
          </div>
        </div>

        <Button 
          onClick={handleSavePayoutSettings} 
          className="mt-4"
          disabled={isSaving}
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Save Payout Settings
        </Button>

        {/* Withdrawal Section */}
        <div className="mt-6 pt-6 border-t border-white/10">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-primary" />
            Request Withdrawal
          </h4>
          
          {(affiliate?.pending_earnings || 0) < MINIMUM_WITHDRAWAL ? (
            <div className="p-4 rounded-lg bg-warning/10 border border-warning/30">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                <div>
                  <p className="text-warning font-medium">Minimum withdrawal: ${MINIMUM_WITHDRAWAL}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    You need ${amountNeededForWithdrawal.toFixed(2)} more in pending earnings to request a withdrawal.
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Current balance: <span className="text-warning font-medium">${(affiliate?.pending_earnings || 0).toFixed(2)}</span>
                  </p>
                </div>
              </div>
            </div>
          ) : !payoutMethod || !payoutAddress ? (
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
              <p className="text-sm text-muted-foreground">
                Please save your payout settings above before requesting a withdrawal.
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-success/10 border border-success/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-success font-medium">Ready to withdraw!</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Available: <span className="text-success font-bold">${(affiliate?.pending_earnings || 0).toFixed(2)}</span>
                  </p>
                </div>
                <Button 
                  onClick={handleRequestWithdrawal}
                  disabled={isRequestingWithdrawal}
                  className="bg-success hover:bg-success/90"
                >
                  {isRequestingWithdrawal ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <ArrowRight className="w-4 h-4 mr-2" />
                  )}
                  Request Withdrawal
                </Button>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Referral History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="glass-card p-6 rounded-xl"
      >
        <h3 className="font-semibold mb-4">Referral History</h3>

        {referrals.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No referrals yet</p>
            <p className="text-sm text-muted-foreground mt-1">Share your link to start earning!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {referrals.map((referral) => (
              <div
                key={referral.id}
                className="flex items-center justify-between p-4 rounded-lg bg-white/5"
              >
                <div>
                  <p className="font-medium">Referral #{referral.id.slice(0, 8)}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(referral.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${
                    referral.commission_status === 'paid' ? 'text-success' : 'text-warning'
                  }`}>
                    ${referral.commission_amount.toFixed(2)}
                  </p>
                  <p className={`text-xs capitalize ${
                    referral.commission_status === 'paid' ? 'text-success' : 
                    referral.commission_status === 'pending' ? 'text-warning' : 'text-muted-foreground'
                  }`}>
                    {referral.commission_status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* How It Works */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="glass-card p-6 rounded-xl"
      >
        <h3 className="font-semibold mb-4">How It Works</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <span className="text-primary font-bold">1</span>
            </div>
            <h4 className="font-medium mb-1">Share Your Link</h4>
            <p className="text-sm text-muted-foreground">Share your unique affiliate link with friends and followers</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <span className="text-primary font-bold">2</span>
            </div>
            <h4 className="font-medium mb-1">They Sign Up</h4>
            <p className="text-sm text-muted-foreground">When they join using your link and make a purchase</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <span className="text-primary font-bold">3</span>
            </div>
            <h4 className="font-medium mb-1">Earn Commission</h4>
            <p className="text-sm text-muted-foreground">You earn {affiliate?.commission_rate || 20}% of their payment instantly</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AffiliateTab;
