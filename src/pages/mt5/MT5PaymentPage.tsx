import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, Check, Shield, Coins, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import MT5Header from '@/components/layout/MT5Header';
import CryptoPayment from '@/components/payments/CryptoPayment';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { validateCoupon, incrementCouponUsage, type Coupon } from '@/services/couponService';

const PLAN_PRICE = 299;
const PLAN_NAME = 'Custom Bot Development';

const MT5PaymentPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState<'crypto' | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [isProcessingFree, setIsProcessingFree] = useState(false);
  const [isTrialCoupon, setIsTrialCoupon] = useState(false);
  const [trialDurationHours, setTrialDurationHours] = useState(24);

  const finalPrice = Math.max(0, PLAN_PRICE - discount);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    
    setIsApplyingCoupon(true);
    
    try {
      const result = await validateCoupon(couponCode, PLAN_PRICE, `MT5 ${PLAN_NAME}`);
      
      if (result.valid && result.coupon && result.discount !== undefined) {
        setDiscount(result.discount);
        setAppliedCoupon(result.coupon);
        setCouponApplied(true);
        setIsTrialCoupon(result.isTrialCoupon || false);
        setTrialDurationHours(result.trialDurationHours || 24);
        
        if (result.isTrialCoupon) {
          toast.success(`Trial coupon applied! ${result.trialDurationHours || 24}-hour full access`);
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
      setIsApplyingCoupon(false);
    }
  };

  const handleFreeCheckout = async () => {
    if (!user) {
      toast.error('Please sign in to continue');
      navigate('/mt5-signin');
      return;
    }

    setIsProcessingFree(true);

    try {
      const trialExpiresAt = isTrialCoupon 
        ? new Date(Date.now() + trialDurationHours * 60 * 60 * 1000).toISOString() 
        : null;

      // Create or update MT5 user record with payment verified
      const { data: existingMt5User } = await supabase
        .from('mt5_users')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingMt5User) {
        await supabase
          .from('mt5_users')
          .update({ 
            payment_verified: true, 
            plan_type: 'custom',
            is_trial: isTrialCoupon,
            trial_expires_at: trialExpiresAt,
            trial_coupon_code: isTrialCoupon ? couponCode.toUpperCase() : null,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('mt5_users')
          .insert({
            user_id: user.id,
            email: user.email,
            plan_type: 'custom',
            payment_verified: true,
            is_active: true,
            is_trial: isTrialCoupon,
            trial_expires_at: trialExpiresAt,
            trial_coupon_code: isTrialCoupon ? couponCode.toUpperCase() : null
          });
      }

      // Create MT5 payment record with $0
      const { error: paymentError } = await supabase
        .from('mt5_payments')
        .insert({
          user_id: user.id,
          plan_type: 'custom',
          amount: 0,
          payment_method: 'coupon',
          transaction_id: `FREE-${Date.now()}`,
          status: 'verified'
        });

      if (paymentError) throw paymentError;

      // Increment coupon usage if applied
      if (appliedCoupon) {
        await incrementCouponUsage(appliedCoupon.id);
      }

      toast.success('Order confirmed! Redirecting to your dashboard...');
      navigate('/mt5-dashboard');
    } catch (error: any) {
      console.error('Free checkout error:', error);
      toast.error('Failed to process order. Please try again.');
    } finally {
      setIsProcessingFree(false);
    }
  };

  const handlePaymentComplete = async (transactionId: string) => {
    if (!user) {
      toast.error('Please sign in to complete payment');
      navigate('/mt5-signin');
      return;
    }

    try {
      // Create MT5 payment record
      const { error: paymentError } = await supabase
        .from('mt5_payments')
        .insert({
          user_id: user.id,
          plan_type: 'custom',
          amount: finalPrice,
          payment_method: 'crypto',
          transaction_id: transactionId,
          status: 'pending'
        });

      if (paymentError) throw paymentError;

      // Increment coupon usage if applied
      if (appliedCoupon) {
        await incrementCouponUsage(appliedCoupon.id);
      }

      toast.success('Payment submitted! Redirecting to your dashboard...');
      navigate('/mt5-dashboard');
    } catch (error: any) {
      console.error('Payment record error:', error);
      toast.error('Failed to record payment. Please contact support.');
    }
  };

  if (paymentMethod === 'crypto') {
    return (
      <div className="min-h-screen bg-[#020202]">
        <MT5Header />
        <section className="pt-32 pb-20 px-6">
          <div className="max-w-md mx-auto">
            <Button
              variant="ghost"
              onClick={() => setPaymentMethod(null)}
              className="mb-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            
            <Card className="bg-card/50 border-white/[0.08]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-primary" />
                  Crypto Payment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CryptoPayment
                  amount={finalPrice}
                  planName={`MT5 ${PLAN_NAME}`}
                  onPaymentComplete={handlePaymentComplete}
                  onBack={() => setPaymentMethod(null)}
                />
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020202]">
      <MT5Header />
      
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-lg mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <Bot className="w-12 h-12 text-accent mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">Complete Your Purchase</h1>
            <p className="text-muted-foreground">Custom Bot Development - One-time payment</p>
          </motion.div>

          <Card className="bg-card/50 border-white/[0.08]">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Plan Details */}
              <div className="p-4 rounded-xl bg-accent/5 border border-accent/20">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-semibold">{PLAN_NAME}</p>
                    <p className="text-sm text-muted-foreground">One-time purchase</p>
                  </div>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-success" />
                    Custom MT5 EA built to your specs
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-success" />
                    3 revision rounds included
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-success" />
                    Full MQL5 source code
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-success" />
                    Priority support & 7-day delivery
                  </li>
                </ul>
              </div>

              {/* Coupon */}
              <div>
                <Label htmlFor="coupon">Coupon Code (Optional)</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="coupon"
                    placeholder="Enter code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    disabled={couponApplied}
                  />
                  <Button 
                    variant="outline" 
                    onClick={handleApplyCoupon}
                    disabled={couponApplied || isApplyingCoupon}
                  >
                    {isApplyingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : couponApplied ? <Check className="w-4 h-4" /> : 'Apply'}
                  </Button>
                </div>
                {couponApplied && (
                  <p className="text-sm text-success mt-2">
                    Coupon applied: -${discount}
                  </p>
                )}
              </div>

              {/* Price Summary */}
              <div className="space-y-2 pt-4 border-t border-white/[0.08]">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{PLAN_NAME}</span>
                  <span>${PLAN_PRICE}.00</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-success">
                    <span>Discount</span>
                    <span>-${discount}.00</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-bold pt-2">
                  <span>Total</span>
                  <span>${finalPrice}.00</span>
                </div>
              </div>

              {finalPrice === 0 ? (
                <Button 
                  className="w-full bg-success hover:bg-success/90 h-12"
                  onClick={handleFreeCheckout}
                  disabled={isProcessingFree}
                >
                  {isProcessingFree ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  {isProcessingFree ? 'Processing...' : 'Continue'}
                </Button>
              ) : (
                <Button 
                  className="w-full bg-accent hover:bg-accent/90 h-12"
                  onClick={() => setPaymentMethod('crypto')}
                >
                  <Coins className="w-4 h-4 mr-2" />
                  Pay ${finalPrice} with Crypto
                </Button>
              )}

              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Shield className="w-4 h-4" />
                <span>{finalPrice === 0 ? 'Secure checkout' : 'Secure payment with ETH or SOL'}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default MT5PaymentPage;
