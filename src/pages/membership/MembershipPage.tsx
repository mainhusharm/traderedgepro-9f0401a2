import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Star, Zap, Crown, Coins, ArrowLeft, Shield, Gift, Rocket, Users, Loader2, ChevronDown, ChevronUp, TrendingUp, MessageSquare, Brain, BarChart3, Target, Award, Clock, Calendar, Bot, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CryptoPayment from '@/components/payments/CryptoPayment';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { validateCoupon, incrementCouponUsage, type Coupon } from '@/services/couponService';

const plans = [
  {
    id: 'kickstarter',
    name: 'Kickstarter',
    icon: Gift,
    price: 0,
    yearlyPrice: 0,
    period: 'month',
    description: 'Buy funded account via affiliate link',
    features: [
      'Risk Management Plan (1 month)',
      'Trading Signals (1 week)',
      'Basic Risk Calculator',
      'Phase Tracking Dashboard',
      '3 Prop Firm Analyzers',
      'Access via Affiliate Purchase',
    ],
    isAffiliate: true,
    popular: false,
    badge: 'FREE',
    badgeColor: 'bg-green-500',
  },
  {
    id: 'starter',
    name: 'Starter',
    icon: Zap,
    price: 99,
    yearlyPrice: 79,
    originalPrice: 99,
    discountedPrice: 49.50,
    period: 'month',
    description: 'Perfect for new traders',
    features: [
      'Up to 3 signals per day',
      'Basic AI reasoning',
      'Email notifications',
      'Risk calculator',
      'Community access',
      'Standard Phase Tracking',
      '5 Prop Firm Analyzers',
      'Auto Lot Size Calculator',
      'Trade Journal (Basic)',
      'Economic Calendar',
    ],
    popular: false,
    christmasOffer: true,
    badge: '50% OFF',
    badgeColor: 'bg-red-500',
  },
  {
    id: 'pro',
    name: 'Pro',
    icon: Star,
    price: 199,
    yearlyPrice: 159,
    period: 'month',
    description: 'For serious traders',
    features: [
      'Unlimited signals',
      '⭐ VIP Signals (3-4 Expert Review)',
      'Full AI reasoning & analysis',
      'Real-time push notifications',
      'Advanced risk management',
      '1-on-1 Expert Guidance Sessions',
      'Priority support (12-24h)',
      '1-on-1 onboarding call',
      'Performance analytics',
      'Private Community Access',
      'Multi Account Tracker',
      'Advanced Trading Journal',
      'Backtesting Tools',
      'AI Trading Coach (Nexus)',
      'Monthly Performance Reports',
      'Session Heatmaps',
    ],
    popular: true,
    badge: 'MOST POPULAR',
    badgeColor: 'bg-primary',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    icon: Crown,
    price: 499,
    yearlyPrice: 399,
    period: '3 months',
    description: 'For trading teams & professionals',
    features: [
      'Everything in Pro',
      '⭐ VIP Signals (Priority Access)',
      '⭐ 1-on-1 Expert Guidance (Unlimited)',
      'MT5 automation integration',
      'Multi-account management',
      'Custom API access',
      'White-glove support',
      'Strategy customization',
      'Dedicated account manager',
      '24/7 Priority Support (1-6h)',
      'VIP Private Community Access',
      'Professional Backtesting Suite',
      'Trade Correlation Analysis',
      'Custom Dashboards',
    ],
    popular: false,
    badge: 'BEST VALUE',
    badgeColor: 'bg-purple-500',
  }
];

// Feature comparison data
const featureCategories = [
  {
    name: 'Trading Signals',
    icon: TrendingUp,
    features: [
      { name: 'Daily Signals', k: '1 week access', s: '3/day', p: 'Unlimited', e: 'Unlimited + Priority' },
      { name: 'VIP Signals (Expert Reviewed)', k: '❌', s: '❌', p: '✅ 3-4 Expert Review', e: '✅ Priority Access' },
      { name: 'Real-time Push Notifications', k: '❌', s: 'Email only', p: '✅', e: '✅' },
      { name: 'AI Trade Reasoning', k: 'Basic', s: 'Basic', p: 'Full Analysis', e: 'Full + Custom' },
      { name: 'Signal History', k: '1 week', s: '30 days', p: 'Unlimited', e: 'Unlimited' },
    ]
  },
  {
    name: 'Risk Management',
    icon: Shield,
    features: [
      { name: 'Risk Management Plan', k: '1 month', s: '1 month', p: '1 month', e: '3 months' },
      { name: 'Auto Lot Size Calculator', k: 'Basic', s: '✅', p: '✅ Advanced', e: '✅ Advanced' },
      { name: 'Daily Drawdown Alerts', k: '❌', s: '✅', p: '✅', e: '✅' },
      { name: 'Risk Protocol Builder', k: '❌', s: 'Basic', p: '✅ Advanced', e: '✅ Custom' },
      { name: 'Position Sizing Tool', k: '❌', s: 'Basic', p: '✅', e: '✅ Multi-account' },
    ]
  },
  {
    name: 'Analytics & Journal',
    icon: BarChart3,
    features: [
      { name: 'Trading Journal', k: '❌', s: 'Basic', p: '✅ Advanced', e: '✅ Professional' },
      { name: 'Performance Analytics', k: '❌', s: 'Basic Stats', p: '✅ Full Dashboard', e: '✅ Custom Reports' },
      { name: 'Equity Curve Tracking', k: '❌', s: '❌', p: '✅', e: '✅' },
      { name: 'Session Heatmaps', k: '❌', s: '❌', p: '✅', e: '✅' },
      { name: 'Trade Correlation Analysis', k: '❌', s: '❌', p: '❌', e: '✅' },
      { name: 'Monthly/Weekly Reports', k: '❌', s: '❌', p: '✅', e: '✅ + Custom' },
    ]
  },
  {
    name: 'AI & Automation',
    icon: Brain,
    features: [
      { name: 'AI Trading Coach (Nexus)', k: '❌', s: '❌', p: '✅ Basic', e: '✅ Advanced' },
      { name: 'MT5 Bot Integration', k: '❌', s: '❌', p: '❌', e: '✅' },
      { name: 'Backtesting Tools', k: 'Basic', s: 'Basic', p: 'Standard', e: 'Professional Suite' },
      { name: 'Custom API Access', k: '❌', s: '❌', p: '❌', e: '✅' },
      { name: 'Strategy Automation', k: '❌', s: '❌', p: '❌', e: '✅' },
    ]
  },
  {
    name: 'Prop Firm Tools',
    icon: Target,
    features: [
      { name: 'Prop Firm Analyzers', k: '3 firms', s: '5 firms', p: '15 firms', e: '15+ firms' },
      { name: 'Phase Tracking Dashboard', k: 'Basic', s: '✅', p: '✅ Multi-account', e: '✅ Advanced' },
      { name: 'Challenge Progress Tracking', k: '✅', s: '✅', p: '✅', e: '✅ Team View' },
      { name: 'Prop Firm Rules Database', k: '✅', s: '✅', p: '✅', e: '✅ + Custom' },
    ]
  },
  {
    name: 'Support & Guidance',
    icon: MessageSquare,
    features: [
      { name: 'Support Response Time', k: 'Affiliate', s: '24-48h', p: '12-24h', e: '1-6h 24/7' },
      { name: '1-on-1 Expert Guidance', k: '❌', s: '❌', p: '✅ Sessions', e: '✅ Unlimited' },
      { name: '1-on-1 Onboarding Call', k: '❌', s: '❌', p: '✅', e: '✅' },
      { name: 'Dedicated Account Manager', k: '❌', s: '❌', p: '❌', e: '✅' },
      { name: 'Community Access', k: '❌', s: '❌', p: '✅ Private', e: '✅ VIP' },
    ]
  },
  {
    name: 'Achievements & Gamification',
    icon: Award,
    features: [
      { name: 'Trading Badges', k: '❌', s: 'Basic', p: '✅ All Badges', e: '✅ All + Exclusive' },
      { name: 'Trading Streaks', k: '❌', s: '✅', p: '✅', e: '✅' },
      { name: 'Milestone Celebrations', k: '❌', s: '❌', p: '✅', e: '✅' },
      { name: 'Leaderboard Access', k: '❌', s: '❌', p: '✅', e: '✅ + Team' },
    ]
  },
];

const MembershipPage = () => {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<typeof plans[0] | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [expandedFeatures, setExpandedFeatures] = useState<Record<string, boolean>>({});
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSelectPlan = (plan: typeof plans[0]) => {
    if (plan.isAffiliate) {
      navigate('/affiliates');
      return;
    }

    const price = getPrice(plan);
    
    if (!user) {
      navigate(`/signup?plan=${plan.id}&price=${price}&billing=${billingPeriod}`);
      return;
    }
    
    navigate(`/payment-flow?plan=${plan.id}&price=${price}&billing=${billingPeriod}`);
  };

  const getPrice = (plan: typeof plans[0]) => {
    if (plan.discountedPrice && plan.id === 'starter') {
      return plan.discountedPrice;
    }
    return billingPeriod === 'yearly' ? plan.yearlyPrice : plan.price;
  };

  const getOriginalPrice = (plan: typeof plans[0]) => {
    return billingPeriod === 'yearly' ? plan.yearlyPrice : plan.price;
  };

  const getFinalPrice = () => {
    if (!selectedPlan) return 0;
    return Math.max(0, getPrice(selectedPlan) - discount);
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim() || !selectedPlan) return;

    setIsValidatingCoupon(true);
    try {
      const result = await validateCoupon(couponCode, getPrice(selectedPlan), selectedPlan.name);
      
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

  const handlePaymentComplete = async (transactionId: string) => {
    if (!user || !selectedPlan) {
      toast.error('Please sign in to complete payment');
      navigate('/auth');
      return;
    }

    try {
      const expiresAt = new Date();
      if (selectedPlan.id === 'enterprise') {
        expiresAt.setMonth(expiresAt.getMonth() + 3);
      } else if (billingPeriod === 'yearly') {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      } else {
        expiresAt.setMonth(expiresAt.getMonth() + 1);
      }

      const { data: membership, error: membershipError } = await supabase
        .from('memberships')
        .insert({
          user_id: user.id,
          plan_name: selectedPlan.name,
          plan_price: getFinalPrice(),
          billing_period: selectedPlan.id === 'enterprise' ? 'quarterly' : billingPeriod,
          status: 'pending',
          starts_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString()
        })
        .select()
        .single();

      if (membershipError) throw membershipError;

      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          user_id: user.id,
          membership_id: membership.id,
          plan_name: selectedPlan.name,
          original_price: getOriginalPrice(selectedPlan),
          discount_amount: discount,
          final_price: getFinalPrice(),
          payment_method: 'crypto',
          coupon_code: couponApplied ? couponCode : null,
          transaction_id: transactionId,
          status: 'pending'
        });

      if (paymentError) throw paymentError;

      if (appliedCoupon) {
        await incrementCouponUsage(appliedCoupon.id);
      }

      navigate('/payment-success');
    } catch (error: any) {
      console.error('Payment record error:', error);
      toast.error('Failed to record payment. Please contact support.');
    }
  };

  // Show crypto payment flow
  if (showPayment && selectedPlan) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-20 pt-32 max-w-xl">
          <Button
            variant="ghost"
            onClick={() => {
              setShowPayment(false);
              setSelectedPlan(null);
              setDiscount(0);
              setCouponApplied(false);
              setCouponCode('');
            }}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Plans
          </Button>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-primary" />
                Complete Your Purchase
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{selectedPlan.name} Plan</span>
                  <span>${getPrice(selectedPlan)}/{selectedPlan.period}</span>
                </div>
                {selectedPlan.discountedPrice && selectedPlan.id === 'starter' && (
                  <div className="flex justify-between text-success">
                    <span>Christmas Special</span>
                    <span className="line-through text-muted-foreground">${selectedPlan.originalPrice}</span>
                  </div>
                )}
                {discount > 0 && (
                  <div className="flex justify-between text-success">
                    <span>Coupon Discount</span>
                    <span>-${discount}</span>
                  </div>
                )}
                <div className="pt-3 border-t border-white/10 flex justify-between font-bold">
                  <span>Total</span>
                  <span>${getFinalPrice()}</span>
                </div>
              </div>

              {!couponApplied && (
                <div>
                  <Label htmlFor="coupon">Coupon Code</Label>
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
                onBack={() => {
                  setShowPayment(false);
                  setSelectedPlan(null);
                }}
              />

              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Shield className="w-4 h-4" />
                <span>Secure payment with ETH or SOL</span>
              </div>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-20 pt-32">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm mb-6">
            <Rocket className="w-4 h-4" />
            Choose Your Plan
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Choose Your <span className="text-primary">Trading Edge</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Select the plan that fits your trading goals. All paid plans include our core AI technology.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <span className={billingPeriod === 'monthly' ? 'text-foreground' : 'text-muted-foreground'}>
              Monthly
            </span>
            <button
              onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
              className="relative w-14 h-7 bg-white/10 rounded-full transition-colors"
            >
              <div
                className={`absolute top-1 w-5 h-5 bg-primary rounded-full transition-all ${
                  billingPeriod === 'yearly' ? 'left-8' : 'left-1'
                }`}
              />
            </button>
            <span className={billingPeriod === 'yearly' ? 'text-foreground' : 'text-muted-foreground'}>
              Yearly
              <span className="ml-2 text-xs text-success">Save 20%</span>
            </span>
          </div>
        </motion.div>

        {/* Plans Grid - 4 columns with hover effect */}
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6 max-w-7xl mx-auto pt-6">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onMouseEnter={() => setHoveredPlan(plan.id)}
              onMouseLeave={() => setHoveredPlan(null)}
              className={`relative glass-card p-6 rounded-2xl flex flex-col transition-all duration-300 cursor-pointer overflow-visible ${
                plan.popular ? 'border-primary ring-2 ring-primary' : 'border-white/10'
              } ${hoveredPlan === plan.id ? 'scale-[1.08] shadow-[0_25px_50px_-12px_rgba(99,102,241,0.35)] z-20' : hoveredPlan ? 'scale-[0.98] opacity-80' : 'scale-100'}`}
              style={{ 
                transformOrigin: 'center center',
              }}
            >
              {/* Badge - positioned well outside the card with high z-index */}
              {plan.badge && (
                <div 
                  className={`absolute -top-5 left-1/2 -translate-x-1/2 px-5 py-2 ${plan.badgeColor} text-white text-xs font-bold rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.4)] z-30 whitespace-nowrap border-2 border-white/20`}
                  style={{ transform: 'translateX(-50%) translateY(0)' }}
                >
                  {plan.badge}
                </div>
              )}

              <div className="flex items-center gap-3 mb-4 mt-2">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  plan.popular ? 'bg-primary' : 'bg-white/10'
                }`}>
                  <plan.icon className={`w-5 h-5 ${plan.popular ? 'text-primary-foreground' : 'text-primary'}`} />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  <p className="text-xs text-muted-foreground">{plan.description}</p>
                </div>
              </div>

              <div className="mb-6">
                {plan.discountedPrice && plan.id === 'starter' ? (
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-success">${plan.discountedPrice}</span>
                    <span className="text-lg text-muted-foreground line-through">${plan.originalPrice}</span>
                    <span className="text-muted-foreground">/{plan.period}</span>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">
                      {plan.price === 0 ? 'FREE' : `$${billingPeriod === 'yearly' ? plan.yearlyPrice : plan.price}`}
                    </span>
                    {plan.price > 0 && <span className="text-muted-foreground">/{plan.period}</span>}
                  </div>
                )}
              </div>

              <ul className="space-y-2 mb-4 flex-1">
                {plan.features.slice(0, 6).map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-success shrink-0 mt-0.5" />
                    <span className="text-xs">{feature}</span>
                  </li>
                ))}
              </ul>

              {plan.features.length > 6 && (
                <Collapsible 
                  open={expandedFeatures[plan.id]} 
                  onOpenChange={(open) => setExpandedFeatures(prev => ({ ...prev, [plan.id]: open }))}
                >
                  <CollapsibleContent className="mb-4">
                    <ul className="space-y-2">
                      {plan.features.slice(6).map((feature) => (
                        <li key={feature} className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-success shrink-0 mt-0.5" />
                          <span className="text-xs">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CollapsibleContent>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground hover:text-foreground mb-4">
                      {expandedFeatures[plan.id] ? (
                        <>
                          <ChevronUp className="w-3 h-3 mr-1" />
                          Show less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3 h-3 mr-1" />
                          +{plan.features.length - 6} more features
                        </>
                      )}
                    </Button>
                  </CollapsibleTrigger>
                </Collapsible>
              )}

              <Button
                onClick={() => handleSelectPlan(plan)}
                variant={plan.popular ? 'default' : 'outline'}
                className="w-full"
              >
                {plan.isAffiliate ? (
                  <>
                    <Gift className="w-4 h-4 mr-2" />
                    Get Started Free
                  </>
                ) : (
                  <>
                    <Coins className="w-4 h-4 mr-2" />
                    Get Started
                  </>
                )}
              </Button>
            </motion.div>
          ))}
        </div>

        {/* VIP Signals Promotion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-16 max-w-4xl mx-auto"
        >
          <Card className="bg-gradient-to-br from-amber-500/10 via-purple-500/10 to-primary/10 border-amber-500/30">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex-shrink-0">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-purple-500 flex items-center justify-center">
                    <Crown className="w-10 h-10 text-white" />
                  </div>
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-2xl font-bold mb-2 flex items-center justify-center md:justify-start gap-2">
                    <Star className="w-5 h-5 text-amber-500" />
                    VIP Signals - Higher Accuracy
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Our VIP signals are reviewed by <span className="text-amber-500 font-semibold">3-4 professional traders</span> before being sent to you. 
                    This multi-expert consensus approach ensures higher accuracy and confidence in every trade recommendation.
                  </p>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-success" />
                      <span>Multi-Expert Review</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-success" />
                      <span>Higher Win Rate</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-success" />
                      <span>Detailed Consensus Notes</span>
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <Badge className="bg-gradient-to-r from-amber-500 to-purple-500 text-white px-4 py-2">
                    Pro & Enterprise Only
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* 1-on-1 Guidance Promotion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="mt-8 max-w-4xl mx-auto"
        >
          <Card className="bg-gradient-to-br from-primary/10 via-blue-500/10 to-cyan-500/10 border-primary/30">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex-shrink-0">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center">
                    <Users className="w-10 h-10 text-white" />
                  </div>
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-2xl font-bold mb-2">1-on-1 Expert Guidance</h3>
                  <p className="text-muted-foreground mb-4">
                    Get personalized mentorship from our trading experts. Discuss your strategy, review your trades, 
                    and receive tailored advice to improve your trading performance.
                  </p>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-success" />
                      <span>Private Sessions</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-success" />
                      <span>Strategy Review</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-success" />
                      <span>Risk Management Tips</span>
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <Badge className="bg-gradient-to-r from-primary to-cyan-500 text-white px-4 py-2">
                    Pro & Enterprise
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Disclaimer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 max-w-4xl mx-auto"
        >
          <Card className="bg-muted/30 border-muted">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-semibold mb-1">Important Disclaimer</p>
                  <p>
                    Trading involves substantial risk of loss. We are <span className="font-medium">not responsible</span> for any profits or losses 
                    that may result from following our signals. Results depend on market conditions, your risk management, and execution. 
                    Losses are a natural part of trading – stay disciplined, manage your risk, and stay strong. Past performance does not guarantee future results.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Feature Comparison - Expanded */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-20"
        >
          <h2 className="text-3xl font-bold text-center mb-4">Compare All Features</h2>
          <p className="text-center text-muted-foreground mb-8">See exactly what's included in each plan</p>
          
          <div className="space-y-8 max-w-6xl mx-auto">
            {featureCategories.map((category) => (
              <Card key={category.name} className="bg-card/50 border-white/[0.08] overflow-hidden">
                <CardHeader className="py-4 bg-white/5">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <category.icon className="w-5 h-5 text-primary" />
                    {category.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left py-3 px-4 font-medium text-sm">Feature</th>
                          <th className="text-center py-3 px-4 font-medium text-sm w-[120px]">
                            <span className="text-green-500">Kickstarter</span>
                          </th>
                          <th className="text-center py-3 px-4 font-medium text-sm w-[120px]">
                            <span className="text-red-400">Starter</span>
                          </th>
                          <th className="text-center py-3 px-4 font-medium text-sm w-[120px]">
                            <span className="text-primary">Pro</span>
                          </th>
                          <th className="text-center py-3 px-4 font-medium text-sm w-[120px]">
                            <span className="text-purple-400">Enterprise</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {category.features.map((feature, idx) => (
                          <tr key={feature.name} className={`border-b border-white/5 ${idx % 2 === 0 ? 'bg-white/[0.02]' : ''}`}>
                            <td className="py-3 px-4 text-sm">{feature.name}</td>
                            <td className="py-3 px-4 text-center text-sm text-muted-foreground">{feature.k}</td>
                            <td className="py-3 px-4 text-center text-sm text-muted-foreground">{feature.s}</td>
                            <td className="py-3 px-4 text-center text-sm font-medium text-primary">{feature.p}</td>
                            <td className="py-3 px-4 text-center text-sm text-purple-400">{feature.e}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* FAQ Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-16"
        >
          <p className="text-muted-foreground">
            Have questions? Check our{' '}
            <Link to="/faq" className="text-primary hover:underline">FAQ</Link>
            {' '}or{' '}
            <Link to="/contact" className="text-primary hover:underline">contact us</Link>
          </p>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default MembershipPage;
