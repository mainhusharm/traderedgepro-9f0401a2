import { useState, useEffect } from 'react';
import { Gift, Copy, Check, Users, DollarSign, Loader2, Share2, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';

interface ReferralCredit {
  id: string;
  credit_amount: number;
  status: string;
  created_at: string;
  expires_at: string;
}

const ReferralCreditsCard = () => {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [credits, setCredits] = useState<ReferralCredit[]>([]);
  const [totalAvailable, setTotalAvailable] = useState(0);
  const [totalReferrals, setTotalReferrals] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user) {
      fetchReferralData();
    }
  }, [user]);

  const fetchReferralData = async () => {
    if (!user) return;

    try {
      // Fetch referral code from profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('referral_code')
        .eq('user_id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') throw profileError;
      
      if (profileData?.referral_code) {
        setReferralCode(profileData.referral_code);
      } else {
        // Generate referral code if not exists
        const newCode = `REF-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
        await supabase
          .from('profiles')
          .update({ referral_code: newCode })
          .eq('user_id', user.id);
        setReferralCode(newCode);
      }

      // Fetch referral credits
      const { data: creditsData, error: creditsError } = await supabase
        .from('referral_credits')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (creditsError) throw creditsError;

      if (creditsData) {
        setCredits(creditsData);
        const available = creditsData
          .filter(c => c.status === 'available' && new Date(c.expires_at) > new Date())
          .reduce((sum, c) => sum + Number(c.credit_amount), 0);
        setTotalAvailable(available);
        setTotalReferrals(creditsData.length);
      }
    } catch (error) {
      console.error('Error fetching referral data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyReferralLink = () => {
    const link = `${window.location.origin}/auth?ref=${referralCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success('Referral link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const shareReferral = () => {
    const link = `${window.location.origin}/auth?ref=${referralCode}`;
    const text = `Join TraderEdge Pro and get AI-powered trading signals! Use my referral link:`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Join TraderEdge Pro',
        text,
        url: link,
      });
    } else {
      copyReferralLink();
    }
  };

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="w-5 h-5 text-success" />
          Referral Credits
        </CardTitle>
        <CardDescription>
          Earn $20 credit for each friend who subscribes to Pro or Enterprise
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-success/10 border border-success/20">
            <div className="flex items-center gap-2 text-success mb-1">
              <DollarSign className="w-4 h-4" />
              <span className="text-sm font-medium">Available Credits</span>
            </div>
            <p className="text-2xl font-bold">${totalAvailable}</p>
          </div>
          <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
            <div className="flex items-center gap-2 text-primary mb-1">
              <Users className="w-4 h-4" />
              <span className="text-sm font-medium">Referrals</span>
            </div>
            <p className="text-2xl font-bold">{totalReferrals}</p>
          </div>
        </div>

        {/* Referral Link */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Your Referral Link</label>
          <div className="flex gap-2">
            <Input
              readOnly
              value={`${window.location.origin}/auth?ref=${referralCode || ''}`}
              className="bg-white/5"
            />
            <Button variant="outline" size="icon" onClick={copyReferralLink}>
              {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
            </Button>
            <Button variant="outline" size="icon" onClick={shareReferral}>
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* How it works */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <h4 className="font-medium mb-3">How it works</h4>
          <ol className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center shrink-0 mt-0.5">1</span>
              <span>Share your unique referral link with friends</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center shrink-0 mt-0.5">2</span>
              <span>When they subscribe to Pro or Enterprise, you get $20 credit</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center shrink-0 mt-0.5">3</span>
              <span>Use credits towards your next Pro or Enterprise renewal</span>
            </li>
          </ol>
        </div>

        {/* Credit History */}
        {credits.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">Credit History</h4>
            <div className="space-y-2">
              {credits.slice(0, 5).map((credit) => (
                <div
                  key={credit.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/5"
                >
                  <div className="flex items-center gap-3">
                    <Gift className="w-4 h-4 text-success" />
                    <div>
                      <p className="text-sm font-medium">Referral Bonus</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(credit.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-success">+${credit.credit_amount}</span>
                    <Badge 
                      variant={credit.status === 'available' ? 'default' : 'secondary'}
                      className={credit.status === 'available' ? 'bg-success/20 text-success' : ''}
                    >
                      {credit.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReferralCreditsCard;
