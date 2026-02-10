import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { RefreshCw, ArrowUp, Clock, Check, AlertTriangle, Coins, Shield, Sparkles, Gift, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CryptoPayment from '@/components/payments/CryptoPayment';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { useSubscription } from '@/lib/context/SubscriptionContext';
import { validateCoupon, incrementCouponUsage, type Coupon } from '@/services/couponService';

interface ReferralCredit {
  id: string;
  credit_amount: number;
  status: string;
  expires_at: string;
}

const plans = [
  { id: 'starter', name: 'Starter', price: 99, period: 'month', features: ['1 month signals', 'Standard support'], supportsCredits: false },
  { id: 'pro', name: 'Pro', price: 199, period: 'month', features: ['1 month signals', 'AI Coach', 'Priority support'], supportsCredits: true },
  { id: 'enterprise', name: 'Enterprise', price: 499, period: '3 months', features: ['3 months signals', 'API access', '24/7 support'], supportsCredits: true },
];

const RenewalPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { membership, refreshMembership } = useSubscription();
  
  const [selectedPlan, setSelectedPlan] = useState<typeof plans[0] | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [isUpgrade, setIsUpgrade] = useState(false);
  
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  
  // Referral credits
  const [availableCredits, setAvailableCredits] = useState<ReferralCredit[]>([]);
  const [totalCredits, setTotalCredits] = useState(0);
  const [useCredits, setUseCredits] = useState(true);
  const [creditsLoading, setCreditsLoading] = useState(true);

  useEffect(() => {
    const action = searchParams.get('action');
    const planId = searchParams.get('plan');
    
    if (action === 'upgrade' && planId) {
      const plan = plans.find(p => p.id === planId);
      if (plan) {
        setSelectedPlan(plan);
        setIsUpgrade(true);
      }
    } else if (membership) {
      // Default to current plan for renewal
      const currentPlan = plans.find(p => p.name === membership.planName);
      if (currentPlan) {
        setSelectedPlan(currentPlan);
      }
    }
  }, [searchParams, membership]);

  // Fetch available referral credits
  useEffect(() => {
    if (user) {
      fetchReferralCredits();
    }
  }, [user]);

  const fetchReferralCredits = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('referral_credits')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'available')
        .gt('expires_at', new Date().toISOString());

      if (error) throw error;

      if (data) {
        setAvailableCredits(data);
        const total = data.reduce((sum, c) => sum + Number(c.credit_amount), 0);
        setTotalCredits(total);
      }
    } catch (error) {
      console.error('Error fetching credits:', error);
    } finally {
      setCreditsLoading(false);
    }
  };

  if (!user) {
    navigate('/auth?redirect=/renew');
    return null;
  }

  const canUseCredits = selectedPlan?.supportsCredits && totalCredits > 0;
  const creditsToApply = canUseCredits && useCredits ? Math.min(totalCredits, selectedPlan?.price || 0) : 0;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim() || !selectedPlan) return;

    setIsValidatingCoupon(true);
    try {
      const result = await validateCoupon(couponCode, selectedPlan.price, selectedPlan.name);
      
      if (result.valid && result.coupon && result.discount !== undefined) {
        setDiscount(result.discount);
        setAppliedCoupon(result.coupon);
        setCouponApplied(true);
        toast.success(`Coupon applied! $${result.discount.toFixed(2)} off`);
      } else {
        toast.error(result.error || 'Invalid coupon code');
      }
    } catch (error) {
      console.error('Coupon validation error:', error);
      toast.error('Failed to validate coupon');
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const getFinalPrice = () => {
    if (!selectedPlan) return 0;
    const totalDiscount = discount + creditsToApply;
    return Math.max(0, selectedPlan.price - totalDiscount);
  };

  const handlePaymentComplete = async (transactionId: string) => {
    if (!user || !selectedPlan) return;

    try {
      const expiresAt = new Date();
      if (selectedPlan.id === 'enterprise') {
        expiresAt.setMonth(expiresAt.getMonth() + 3);
      } else {
        expiresAt.setMonth(expiresAt.getMonth() + 1);
      }

      // Create new membership
      const { data: newMembership, error: membershipError } = await supabase
        .from('memberships')
        .insert({
          user_id: user.id,
          plan_name: selectedPlan.name,
          plan_price: getFinalPrice(),
          billing_period: selectedPlan.id === 'enterprise' ? 'quarterly' : 'monthly',
          status: 'pending',
          starts_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString()
        })
        .select()
        .single();

      if (membershipError) throw membershipError;

      // Create payment record
      await supabase
        .from('payments')
        .insert({
          user_id: user.id,
          membership_id: newMembership.id,
          plan_name: selectedPlan.name,
          original_price: selectedPlan.price,
          discount_amount: discount + creditsToApply,
          final_price: getFinalPrice(),
          payment_method: 'crypto',
          coupon_code: couponApplied ? couponCode : null,
          transaction_id: transactionId,
          status: 'pending'
        });

      // Mark used referral credits as used
      if (creditsToApply > 0) {
        let remainingToApply = creditsToApply;
        for (const credit of availableCredits) {
          if (remainingToApply <= 0) break;
          
          const creditAmount = Number(credit.credit_amount);
          if (creditAmount <= remainingToApply) {
            // Use entire credit
            await supabase
              .from('referral_credits')
              .update({ status: 'used', used_at: new Date().toISOString() })
              .eq('id', credit.id);
            remainingToApply -= creditAmount;
          }
        }
      }

      // Increment coupon usage if applied
      if (appliedCoupon) {
        await incrementCouponUsage(appliedCoupon.id);
      }

      await refreshMembership();
      navigate('/payment-success');
    } catch (error: any) {
      console.error('Renewal error:', error);
      toast.error('Failed to process renewal. Please contact support.');
    }
  };

  const currentPlanIndex = membership ? plans.findIndex(p => p.name === membership.planName) : -1;

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white overflow-hidden">
      {/* Ambient background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-purple-500/8 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/3 left-0 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[120px]" />
      </div>

      <Header />

      <main className="relative container mx-auto px-4 py-20 pt-32 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300/80 mb-6">
            {isUpgrade ? <ArrowUp className="w-3.5 h-3.5" /> : <RefreshCw className="w-3.5 h-3.5" />}
            {isUpgrade ? 'Upgrade Your Plan' : 'Renew Subscription'}
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl tracking-tight leading-[1.15] mb-5">
            <span className="font-light text-white/50">{isUpgrade ? 'Upgrade to' : 'Continue your'}</span>
            <br />
            <span className="font-semibold italic bg-gradient-to-r from-purple-400 to-purple-200 bg-clip-text text-transparent">
              {isUpgrade ? 'more features.' : 'trading journey.'}
            </span>
          </h1>
          <p className="text-base text-white/40 max-w-md mx-auto leading-relaxed font-light">
            {isUpgrade
              ? 'Unlock more powerful features and take your trading to the next level.'
              : "Don't lose access to your premium features. Renew now and keep trading with confidence."}
          </p>
        </motion.div>

        {/* Current Status */}
        {membership && (
          <Card className="glass-card mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    membership.status === 'active' ? 'bg-success/20' : 'bg-warning/20'
                  }`}>
                    {membership.status === 'active' ? (
                      <Check className="w-6 h-6 text-success" />
                    ) : (
                      <AlertTriangle className="w-6 h-6 text-warning" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold">Current Plan: {membership.planName}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {membership.expiresAt 
                        ? `Expires: ${new Date(membership.expiresAt).toLocaleDateString()}`
                        : 'No expiry set'}
                    </div>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  membership.status === 'active' 
                    ? 'bg-success/20 text-success' 
                    : 'bg-warning/20 text-warning'
                }`}>
                  {membership.status}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Available Credits Banner */}
        {!creditsLoading && totalCredits > 0 && (
          <Card className="glass-card mb-8 border-success/30 bg-success/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
                  <Gift className="w-6 h-6 text-success" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-success">You have ${totalCredits} in referral credits!</h3>
                  <p className="text-sm text-muted-foreground">
                    Available for Pro and Enterprise plan renewals
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!showPayment ? (
          <>
            {/* Plan Selection */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {plans.map((plan, index) => {
                const isCurrentPlan = membership?.planName === plan.name;
                const canSelect = !isCurrentPlan || !isUpgrade;
                const isDowngrade = currentPlanIndex > index;

                return (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card 
                      className={`glass-card cursor-pointer transition-all h-full ${
                        selectedPlan?.id === plan.id 
                          ? 'border-primary ring-2 ring-primary' 
                          : 'border-white/10 hover:border-white/20'
                      } ${!canSelect ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={() => canSelect && setSelectedPlan(plan)}
                    >
                      <CardHeader className="pb-2">
                        {isCurrentPlan && (
                          <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full w-fit mb-2">
                            Current Plan
                          </span>
                        )}
                        <CardTitle className="text-lg">{plan.name}</CardTitle>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-bold">${plan.price}</span>
                          <span className="text-muted-foreground text-sm">/{plan.period}</span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {plan.features.map(feature => (
                            <li key={feature} className="flex items-center gap-2 text-sm">
                              <Check className="w-4 h-4 text-success" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                        {isDowngrade && isUpgrade && (
                          <p className="text-xs text-warning mt-3">Cannot downgrade during upgrade</p>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            {/* Proceed Button */}
            {selectedPlan && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-4"
              >
                <Button 
                  size="lg" 
                  onClick={() => setShowPayment(true)}
                  className="px-8"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {isUpgrade ? `Upgrade to ${selectedPlan.name}` : `Renew ${selectedPlan.name}`} - ${selectedPlan.price}
                </Button>
                <p className="text-sm text-muted-foreground">
                  Secure payment with cryptocurrency
                </p>
              </motion.div>
            )}
          </>
        ) : selectedPlan && (
          <Card className="glass-card max-w-xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-primary" />
                Complete {isUpgrade ? 'Upgrade' : 'Renewal'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Referral Credits Notice */}
              {canUseCredits && (
                <div className="p-4 rounded-xl bg-success/10 border border-success/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Gift className="w-5 h-5 text-success" />
                      <div>
                        <p className="font-medium text-success">Referral Credits Available</p>
                        <p className="text-sm text-muted-foreground">
                          You have ${totalCredits} in credits to use
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={useCredits}
                      onCheckedChange={setUseCredits}
                    />
                  </div>
                </div>
              )}

              {/* Order Summary */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{selectedPlan.name} Plan</span>
                  <span>${selectedPlan.price}/{selectedPlan.period}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-success">
                    <span>Coupon Discount</span>
                    <span>-${discount}</span>
                  </div>
                )}
                {creditsToApply > 0 && (
                  <div className="flex justify-between text-success">
                    <span className="flex items-center gap-1">
                      <Gift className="w-3 h-3" />
                      Referral Credits
                    </span>
                    <span>-${creditsToApply}</span>
                  </div>
                )}
                <div className="pt-3 border-t border-white/10 flex justify-between font-bold">
                  <span>Total</span>
                  <span>${getFinalPrice()}</span>
                </div>
              </div>

              {/* Coupon */}
              {!couponApplied && (
                <div>
                  <Label htmlFor="coupon">Have a coupon?</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      id="coupon"
                      placeholder="Enter code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                    />
                    <Button variant="outline" onClick={handleApplyCoupon} disabled={isValidatingCoupon}>
                      {isValidatingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                    </Button>
                  </div>
                </div>
              )}

              <CryptoPayment
                amount={getFinalPrice()}
                planName={selectedPlan.name}
                onPaymentComplete={handlePaymentComplete}
                onBack={() => setShowPayment(false)}
              />

              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Shield className="w-4 h-4" />
                <span>Secure payment with ETH or SOL</span>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default RenewalPage;
