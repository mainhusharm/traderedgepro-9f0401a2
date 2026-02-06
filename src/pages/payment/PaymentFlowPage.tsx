import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Coins, Shield, Check, Loader2, Gift, Bitcoin, CreditCard, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CryptoPayment from '@/components/payments/CryptoPayment';
import PayPalPayment from '@/components/payments/PayPalPayment';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { validateCoupon, incrementCouponUsage, type Coupon } from '@/services/couponService';
import { callEdgeFunction } from '@/config/api';

interface PlanDetails {
  id: string;
  name: string;
  price: number;
  period: string;
  billingPeriod: string;
}

// Base monthly prices - yearly is 12x with 20% discount
const PLAN_DETAILS: Record<string, PlanDetails> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 49.50, // Monthly price
    period: 'month',
    billingPeriod: 'monthly'
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 199, // Monthly price
    period: 'month',
    billingPeriod: 'monthly'
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 499, // Quarterly price
    period: '3 months',
    billingPeriod: 'quarterly'
  }
};

// Calculate yearly prices (12 months with 20% discount)
const getYearlyPrice = (planId: string): number => {
  const monthlyPrices: Record<string, number> = {
    starter: 49.50 * 12 * 0.8, // $475.20 per year
    pro: 199 * 12 * 0.8,       // $1,910.40 per year  
    enterprise: 499 * 4 * 0.8  // $1,596.80 per year (4 quarters)
  };
  return monthlyPrices[planId] || 0;
};

const PaymentFlowPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  
  const [selectedPlan, setSelectedPlan] = useState<PlanDetails | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'crypto' | 'paypal'>('crypto');
  const [isReferredUser, setIsReferredUser] = useState(false);
  const [referralCouponApplied, setReferralCouponApplied] = useState(false);
  const [treasureHuntCouponApplied, setTreasureHuntCouponApplied] = useState(false);

  // Get plan from URL params or location state
  useEffect(() => {
    const planFromUrl = searchParams.get('plan');
    const priceFromUrl = searchParams.get('price');
    const billingFromUrl = searchParams.get('billing') || 'monthly';
    const codeFromUrl = searchParams.get('code');
    const planFromState = (location.state as any)?.plan;
    const priceFromState = (location.state as any)?.price;

    // If treasure hunt winner code is present, force Pro plan
    let planId = planFromUrl || planFromState;
    if (codeFromUrl && codeFromUrl.startsWith('TREASURE-WINNER')) {
      planId = 'pro';
    }
    
    if (planId && PLAN_DETAILS[planId]) {
      const plan = { ...PLAN_DETAILS[planId] };
      
      // Handle yearly pricing - calculate 12-month price with 20% discount
      if (billingFromUrl === 'yearly') {
        plan.billingPeriod = 'yearly';
        plan.period = 'year';
        plan.price = getYearlyPrice(planId);
      } else if (priceFromUrl || priceFromState) {
        // Only override price if NOT yearly (yearly uses calculated price)
        plan.price = parseFloat(priceFromUrl || priceFromState);
      }
      
      setSelectedPlan(plan);
    } else if (!planId) {
      // No plan selected, redirect to membership
      navigate('/membership');
    }
  }, [searchParams, location.state, navigate]);

  // Auto-apply treasure hunt winner coupon from URL
  useEffect(() => {
    const autoApplyCoupon = async () => {
      const codeFromUrl = searchParams.get('code');
      
      if (!codeFromUrl || !selectedPlan || couponApplied || treasureHuntCouponApplied) return;
      
      // Auto-apply the coupon from URL
      try {
        const result = await validateCoupon(codeFromUrl, selectedPlan.price, selectedPlan.name);
        
        if (result.valid && result.coupon && result.discount !== undefined) {
          setDiscount(result.discount);
          setAppliedCoupon(result.coupon);
          setCouponApplied(true);
          setCouponCode(codeFromUrl);
          setTreasureHuntCouponApplied(true);
          
          if (result.discount === selectedPlan.price) {
            toast.success('🏆 Treasure Hunt Prize Applied! Your Pro account is FREE!');
          } else {
            toast.success(`Coupon applied! $${result.discount.toFixed(2)} off`);
          }
        } else {
          toast.error(result.error || 'Invalid coupon code');
        }
      } catch (error) {
        console.error('Auto coupon validation error:', error);
      }
    };
    
    autoApplyCoupon();
  }, [searchParams, selectedPlan, couponApplied, treasureHuntCouponApplied]);

  // Check auth status and referral status
  useEffect(() => {
    if (!authLoading && !user) {
      // Not logged in, redirect to signup with plan params
      const planId = searchParams.get('plan') || (location.state as any)?.plan;
      const price = searchParams.get('price') || (location.state as any)?.price;
      const billing = searchParams.get('billing') || 'monthly';
      
      navigate(`/signup?plan=${planId}&price=${price}&billing=${billing}`);
      return;
    }

    // Check if user was referred and auto-apply referral coupon
    const checkReferralStatus = async () => {
      if (!user || !selectedPlan || couponApplied || referralCouponApplied) return;

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('referred_by')
          .eq('user_id', user.id)
          .single();

        if (profile?.referred_by) {
          setIsReferredUser(true);
          
          // Auto-apply REFERRAL15 coupon
          const result = await validateCoupon('REFERRAL15', selectedPlan.price, selectedPlan.name);
          
          if (result.valid && result.coupon && result.discount !== undefined) {
            setDiscount(result.discount);
            setAppliedCoupon(result.coupon);
            setCouponApplied(true);
            setCouponCode('REFERRAL15');
            setReferralCouponApplied(true);
            toast.success('🎉 Referral discount applied! You get 15% off');
          }
        }
      } catch (error) {
        console.error('Error checking referral status:', error);
      }
    };

    checkReferralStatus();
  }, [user, authLoading, navigate, searchParams, location.state, selectedPlan, couponApplied, referralCouponApplied]);

  const getFinalPrice = () => {
    if (!selectedPlan) return 0;
    return Math.max(0, selectedPlan.price - discount);
  };

  const [isTrialCoupon, setIsTrialCoupon] = useState(false);
  const [trialDurationHours, setTrialDurationHours] = useState(24);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim() || !selectedPlan) return;

    setIsValidatingCoupon(true);
    try {
      const result = await validateCoupon(couponCode, selectedPlan.price, selectedPlan.name);
      
      if (result.valid && result.coupon && result.discount !== undefined) {
        setDiscount(result.discount);
        setAppliedCoupon(result.coupon);
        setCouponApplied(true);
        setIsTrialCoupon(result.isTrialCoupon || false);
        setTrialDurationHours(result.trialDurationHours || 24);
        
        if (result.isTrialCoupon) {
          toast.success(`Trial coupon applied! You'll get ${result.trialDurationHours || 24}-hour full access`);
        } else {
          toast.success(`Coupon applied! $${result.discount.toFixed(2)} off`);
        }
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

  const handleFreeCheckout = async () => {
    if (!user || !selectedPlan) {
      toast.error('Please sign in to continue');
      navigate('/auth');
      return;
    }

    setIsProcessing(true);

    try {
      let expiresAt = new Date();
      let planName = selectedPlan.name;
      
      // Handle trial coupon - set expiration based on trial duration
      if (isTrialCoupon) {
        expiresAt = new Date(Date.now() + trialDurationHours * 60 * 60 * 1000);
        planName = 'Enterprise Trial'; // Give full access during trial
      } else {
        if (selectedPlan.id === 'enterprise') {
          expiresAt.setMonth(expiresAt.getMonth() + 3);
        } else if (selectedPlan.billingPeriod === 'yearly') {
          expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        } else {
          expiresAt.setMonth(expiresAt.getMonth() + 1);
        }
      }

      // Create membership record
      const { data: membership, error: membershipError } = await supabase
        .from('memberships')
        .insert({
          user_id: user.id,
          plan_name: planName,
          plan_price: 0,
          billing_period: isTrialCoupon ? 'monthly' : selectedPlan.billingPeriod,
          status: 'active',
          starts_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          is_trial: isTrialCoupon,
          trial_coupon_code: isTrialCoupon ? couponCode.toUpperCase() : null
        })
        .select()
        .single();

      if (membershipError) throw membershipError;

      // Create payment record
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          user_id: user.id,
          membership_id: membership.id,
          plan_name: planName,
          original_price: selectedPlan.price,
          discount_amount: discount,
          final_price: 0,
          payment_method: isTrialCoupon ? 'trial' : 'coupon',
          coupon_code: couponCode,
          status: 'completed',
          completed_at: new Date().toISOString()
        });

      if (paymentError) throw paymentError;

      // Increment coupon usage
      if (appliedCoupon) {
        await incrementCouponUsage(appliedCoupon.id);
      }

      // Send activation email
      try {
        await callEdgeFunction('send-membership-activation', {
          email: user.email,
          planName: planName,
          isTrial: isTrialCoupon,
          trialHours: trialDurationHours
        });
      } catch (emailError) {
        console.error('Failed to send activation email:', emailError);
      }

      if (isTrialCoupon) {
        toast.success(`Your ${trialDurationHours}-hour trial has been activated!`);
      } else {
        toast.success('Your membership has been activated!');
      }
      // Redirect to questionnaire flow instead of dashboard
      navigate('/successful-payment');
    } catch (error: unknown) {
      console.error('Checkout error:', error);
      toast.error('Failed to process. Please contact support.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentComplete = async (transactionId: string, payerEmail?: string) => {
    if (!user || !selectedPlan) {
      toast.error('Please sign in to complete payment');
      navigate('/auth');
      return;
    }

    setIsProcessing(true);

    try {
      const expiresAt = new Date();
      if (selectedPlan.id === 'enterprise') {
        expiresAt.setMonth(expiresAt.getMonth() + 3);
      } else if (selectedPlan.billingPeriod === 'yearly') {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      } else {
        expiresAt.setMonth(expiresAt.getMonth() + 1);
      }

      // Create membership record
      const { data: membership, error: membershipError } = await supabase
        .from('memberships')
        .insert({
          user_id: user.id,
          plan_name: selectedPlan.name,
          plan_price: getFinalPrice(),
          billing_period: selectedPlan.billingPeriod,
          status: 'pending',
          starts_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString()
        })
        .select()
        .single();

      if (membershipError) throw membershipError;

      // Create payment record with terms acceptance
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          user_id: user.id,
          membership_id: membership.id,
          plan_name: selectedPlan.name,
          original_price: selectedPlan.price,
          discount_amount: discount,
          final_price: getFinalPrice(),
          payment_method: paymentMethod,
          coupon_code: couponApplied ? couponCode : null,
          transaction_id: transactionId,
          status: 'pending',
          terms_accepted_at: new Date().toISOString(),
          paypal_payer_email: payerEmail || null,
          dispute_warning_shown: paymentMethod === 'paypal'
        });

      if (paymentError) throw paymentError;

      // Increment coupon usage if applied
      if (appliedCoupon) {
        await incrementCouponUsage(appliedCoupon.id);
      }

      // Send payment receipt email
      try {
        await supabase.functions.invoke('send-payment-receipt', {
          body: {
            email: user.email,
            planName: selectedPlan.name,
            amount: getFinalPrice(),
            paymentMethod: paymentMethod === 'crypto' ? 'Cryptocurrency' : 'PayPal',
            transactionId: transactionId
          }
        });
      } catch (emailError) {
        console.error('Failed to send receipt email:', emailError);
      }

      toast.success('Payment submitted successfully!');
      navigate('/successful-payment');
    } catch (error: unknown) {
      console.error('Payment record error:', error);
      toast.error('Failed to record payment. Please contact support.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (authLoading || !selectedPlan) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-20 pt-32 max-w-xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/membership')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Plans
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-primary" />
                Complete Your Purchase
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Order Summary */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <Gift className="w-4 h-4 text-primary" />
                  <span className="font-medium">Order Summary</span>
                </div>
                
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
                
                <div className="pt-3 border-t border-white/10 flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-primary">${getFinalPrice()}</span>
                </div>
              </div>

              {/* Plan Features Preview */}
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                <p className="text-sm font-medium mb-2">What's included:</p>
                <ul className="space-y-1">
                  {[
                    'Risk Management Plan',
                    'Trading Signals',
                    'Phase Tracking Dashboard',
                    'Risk Calculator',
                    selectedPlan.id !== 'starter' && 'AI Trading Coach',
                    selectedPlan.id === 'enterprise' && 'Priority 24/7 Support'
                  ].filter(Boolean).slice(0, 4).map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="w-3 h-3 text-success" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Treasure Hunt Winner Banner */}
              {treasureHuntCouponApplied && getFinalPrice() === 0 && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                      <Gift className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <p className="font-medium text-amber-400">🏆 Treasure Hunt Winner!</p>
                      <p className="text-sm text-muted-foreground">Congratulations! Your Pro account is completely FREE!</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Referral Discount Banner */}
              {referralCouponApplied && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-primary/20 to-success/20 border border-primary/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <Gift className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-primary">Referral Discount Applied! 🎉</p>
                      <p className="text-sm text-muted-foreground">You were referred by a friend - enjoy 15% off!</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Coupon Code */}
              {!couponApplied && (
                <div>
                  <Label htmlFor="coupon">Have a coupon code?</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      id="coupon"
                      placeholder="Enter code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="bg-white/5 border-white/10"
                    />
                    <Button variant="outline" onClick={handleApplyCoupon} disabled={isValidatingCoupon}>
                      {isValidatingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                    </Button>
                  </div>
                </div>
              )}

              {couponApplied && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-success/10 border border-success/20">
                  <div className="flex items-center gap-2 text-success text-sm">
                    <Check className="w-4 h-4" />
                    {isTrialCoupon 
                      ? `Trial coupon "${couponCode.toUpperCase()}" applied - ${trialDurationHours}-hour full access!`
                      : treasureHuntCouponApplied && getFinalPrice() === 0
                        ? `🏆 Winner code applied - FREE Pro Account!`
                        : `Coupon "${couponCode.toUpperCase()}" applied - $${discount} off`}
                  </div>
                  {!treasureHuntCouponApplied && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setCouponApplied(false);
                        setCouponCode('');
                        setDiscount(0);
                        setAppliedCoupon(null);
                        setIsTrialCoupon(false);
                        setReferralCouponApplied(false);
                        toast.success('Coupon removed');
                      }}
                      className="text-muted-foreground hover:text-destructive h-7 px-2"
                    >
                      Remove
                    </Button>
                  )}
                </div>
              )}

              {/* Payment Section */}
              {getFinalPrice() === 0 ? (
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={handleFreeCheckout}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : isTrialCoupon ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Start {trialDurationHours}-Hour Free Trial
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Continue - Activate Membership
                    </>
                  )}
                </Button>
              ) : (
                <div className="space-y-4">
                  {/* Payment Method Selector */}
                  <div>
                    <Label className="text-sm mb-3 block">Select Payment Method</Label>
                    <div className="grid grid-cols-1 gap-3">
                      <button
                        onClick={() => setPaymentMethod('crypto')}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          paymentMethod === 'crypto'
                            ? 'border-primary bg-primary/10'
                            : 'border-white/10 hover:border-white/30'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                              <Bitcoin className="w-5 h-5 text-success" />
                            </div>
                            <div>
                              <p className="font-medium flex items-center gap-2">
                                Cryptocurrency
                                <Badge className="bg-success/20 text-success text-xs">Recommended</Badge>
                              </p>
                              <p className="text-xs text-muted-foreground">
                                BTC, ETH, SOL, USDT, USDC, LTC • Zero dispute risk
                              </p>
                            </div>
                          </div>
                          <Shield className="w-5 h-5 text-success" />
                        </div>
                      </button>

                      <button
                        onClick={() => setPaymentMethod('paypal')}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          paymentMethod === 'paypal'
                            ? 'border-primary bg-primary/10'
                            : 'border-white/10 hover:border-white/30'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                              <CreditCard className="w-5 h-5 text-blue-500" />
                            </div>
                            <div>
                              <p className="font-medium">PayPal</p>
                              <p className="text-xs text-muted-foreground">
                                International cards accepted
                              </p>
                            </div>
                          </div>
                          <AlertTriangle className="w-4 h-4 text-warning" />
                        </div>
                        {paymentMethod === 'paypal' && (
                          <div className="mt-3 p-2 rounded-lg bg-warning/10 border border-warning/20">
                            <p className="text-xs text-warning">
                              ⚠️ Subject to strict no-refund policy. Disputes for delivered services may result in account termination.
                            </p>
                          </div>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Payment Component */}
                  {paymentMethod === 'crypto' ? (
                    <CryptoPayment
                      amount={getFinalPrice()}
                      planName={selectedPlan.name}
                      onPaymentComplete={(txId) => handlePaymentComplete(txId)}
                      onBack={() => navigate('/membership')}
                    />
                  ) : (
                    <PayPalPayment
                      amount={getFinalPrice()}
                      planName={selectedPlan.name}
                      onPaymentComplete={(txId, email) => handlePaymentComplete(txId, email)}
                      onBack={() => setPaymentMethod('crypto')}
                    />
                  )}
                </div>
              )}

              {/* Security Notice */}
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Shield className="w-4 h-4" />
                <span>Secure payment • All sales final</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
      
      <Footer />
    </div>
  );
};

export default PaymentFlowPage;
