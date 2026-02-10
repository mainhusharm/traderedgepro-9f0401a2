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
    name: 'Starter Access',
    icon: Zap,
    price: 99,
    yearlyPrice: 79,
    period: 'month',
    description: 'For traders preparing for prop firms',
    features: [
      'Up to 3 signals per day',
      'Basic AI reasoning',
      'Email notifications',
      'Risk calculator',
      'Standard Phase Tracking',
      '5 Prop Firm Analyzers',
      'Auto Lot Size Calculator',
      'Trade Journal (Basic)',
    ],
    popular: false,
  },
  {
    id: 'pro',
    name: 'Funded Trader Core',
    icon: Star,
    price: 299,
    yearlyPrice: 239,
    period: 'month',
    description: 'The system serious traders use',
    features: [
      'Unlimited signals',
      '⭐ VIP Signals (3-4 Expert Review)',
      'Full AI reasoning & analysis',
      'Real-time push notifications',
      'Advanced risk management',
      '1-on-1 Expert Guidance Sessions',
      'Priority support (12-24h)',
      '1-on-1 onboarding call',
      'Private Community Access',
      'Multi Account Tracker',
      'Advanced Trading Journal',
      'Backtesting Tools',
      'AI Trading Coach (Nexus)',
      'Monthly Performance Reports',
      'Session Heatmaps',
      'Weekly Live Trading Room',
      'AI Market Scanner',
      'Economic Calendar',
    ],
    popular: true,
    badge: 'MOST POPULAR',
    badgeColor: 'bg-primary',
  },
  {
    id: 'enterprise',
    name: 'Trader Desk',
    icon: Crown,
    price: 899,
    yearlyPrice: 719,
    period: '3 months',
    description: 'Team accountability & leverage',
    features: [
      'Everything in Pro',
      '⭐ VIP Signals (Priority Delivery)',
      '⭐ 1-on-1 Expert Guidance (Unlimited)',
      'Team Dashboard (up to 5 users)',
      'Custom Signal Parameters',
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
      'White-label Reports',
      'Quarterly Strategy Review Call',
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
      { name: 'VIP Signals (Expert Reviewed)', k: '❌', s: '❌', p: '✅ 3-4 Expert Review', e: '✅ Priority Delivery' },
      { name: 'Real-time Push Notifications', k: '❌', s: 'Email only', p: '✅', e: '✅' },
      { name: 'AI Trade Reasoning', k: 'Basic', s: 'Basic', p: 'Full Analysis', e: 'Full + Custom' },
      { name: 'Signal History', k: '1 week', s: '30 days', p: 'Unlimited', e: 'Unlimited' },
      { name: 'AI Market Scanner', k: '❌', s: '❌', p: '✅', e: '✅' },
      { name: 'Custom Signal Parameters', k: '❌', s: '❌', p: '❌', e: '✅' },
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
      { name: 'Performance Analytics', k: '❌', s: '❌', p: '✅ Full Dashboard', e: '✅ Custom Reports' },
      { name: 'Equity Curve Tracking', k: '❌', s: '❌', p: '✅', e: '✅' },
      { name: 'Session Heatmaps', k: '❌', s: '❌', p: '✅', e: '✅' },
      { name: 'Trade Correlation Analysis', k: '❌', s: '❌', p: '❌', e: '✅' },
      { name: 'Monthly/Weekly Reports', k: '❌', s: '❌', p: '✅', e: '✅ White-label' },
    ]
  },
  {
    name: 'AI & Automation',
    icon: Brain,
    features: [
      { name: 'AI Trading Coach (Nexus)', k: '❌', s: '❌', p: '✅', e: '✅ Advanced' },
      { name: 'MT5 Bot Integration', k: '❌', s: '❌', p: '❌', e: '✅' },
      { name: 'Backtesting Tools', k: '❌', s: '❌', p: '✅ Standard', e: '✅ Professional Suite' },
      { name: 'Custom API Access', k: '❌', s: '❌', p: '❌', e: '✅' },
      { name: 'Strategy Customization', k: '❌', s: '❌', p: '❌', e: '✅' },
    ]
  },
  {
    name: 'Prop Firm Tools',
    icon: Target,
    features: [
      { name: 'Prop Firm Analyzers', k: '3 firms', s: '5 firms', p: '15 firms', e: '15+ firms' },
      { name: 'Phase Tracking Dashboard', k: 'Basic', s: '✅', p: '✅ Multi-account', e: '✅ Team View' },
      { name: 'Challenge Progress Tracking', k: '✅', s: '✅', p: '✅', e: '✅ Team View' },
      { name: 'Prop Firm Rules Database', k: '✅', s: '✅', p: '✅', e: '✅ + Custom' },
      { name: 'Economic Calendar', k: '❌', s: '❌', p: '✅', e: '✅' },
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
      { name: 'Weekly Live Trading Room', k: '❌', s: '❌', p: '✅', e: '✅' },
      { name: 'Quarterly Strategy Review Call', k: '❌', s: '❌', p: '❌', e: '✅' },
    ]
  },
  {
    name: 'Team & Enterprise',
    icon: Users,
    features: [
      { name: 'Team Dashboard', k: '❌', s: '❌', p: '❌', e: '✅ Up to 5 users' },
      { name: 'White-label Reports', k: '❌', s: '❌', p: '❌', e: '✅' },
      { name: 'Multi-account Management', k: '❌', s: '❌', p: '❌', e: '✅' },
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
    <div className="min-h-screen bg-[#0A0A0B] text-white overflow-hidden">
      {/* Ambient background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-0 w-[500px] h-[500px] bg-purple-500/8 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[120px]" />
      </div>

      <Header />

      <main className="relative max-w-7xl mx-auto px-6 pt-32 pb-20">
        {/* Header - Premium */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mb-20"
        >
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300/80 mb-6">
            <Coins className="w-3.5 h-3.5" />
            Pricing
          </span>
          <h1 className="text-4xl md:text-6xl tracking-tight leading-[1.15] mb-6">
            <span className="font-light text-white/50">One price.</span>
            <br />
            <span className="font-semibold italic bg-gradient-to-r from-purple-400 to-purple-200 bg-clip-text text-transparent">Everything included.</span>
          </h1>
          <p className="text-lg text-white/40 max-w-xl mb-10 font-light">
            One blown prop challenge costs more than a year of TraderEdge Pro.{' '}
            <span className="text-white/60 font-normal">Invest in discipline.</span>
          </p>

          {/* Billing Toggle - Minimal */}
          <div className="inline-flex items-center gap-4 p-1 rounded-full border border-white/10">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all ${
                billingPeriod === 'monthly'
                  ? 'bg-white text-black'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                billingPeriod === 'yearly'
                  ? 'bg-white text-black'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Yearly
              <span className={`text-xs ${billingPeriod === 'yearly' ? 'text-green-600' : 'text-green-400'}`}>
                -20%
              </span>
            </button>
          </div>
        </motion.div>

        {/* Plans Grid - 4 columns with enhanced animations */}
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-8 max-w-7xl mx-auto pt-8">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 40, rotateX: -10 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{
                delay: index * 0.15,
                type: "spring",
                stiffness: 100,
                damping: 15
              }}
              whileHover={{
                y: -12,
                transition: { type: "spring", stiffness: 400, damping: 25 }
              }}
              onMouseEnter={() => setHoveredPlan(plan.id)}
              onMouseLeave={() => setHoveredPlan(null)}
              className={`group relative rounded-2xl flex flex-col cursor-pointer overflow-visible
                ${plan.popular ? 'z-10' : ''}
                ${hoveredPlan && hoveredPlan !== plan.id ? 'opacity-60 scale-[0.97]' : 'opacity-100 scale-100'}
              `}
              style={{
                transformOrigin: 'center center',
                transformStyle: 'preserve-3d',
                perspective: '1000px',
              }}
            >
              {/* Animated gradient border */}
              <div className={`absolute -inset-[1px] rounded-2xl transition-all duration-500 pointer-events-none ${
                plan.popular
                  ? 'bg-gradient-to-r from-primary via-purple-500 to-pink-500 opacity-100'
                  : plan.id === 'enterprise'
                  ? 'bg-gradient-to-r from-purple-500 via-violet-500 to-indigo-500 opacity-100'
                  : plan.id === 'kickstarter'
                  ? 'bg-gradient-to-r from-green-400 via-emerald-500 to-teal-400 opacity-100'
                  : 'bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 opacity-60 group-hover:opacity-100'
              }`}
              style={{
                animation: plan.popular || plan.id === 'kickstarter' ? 'gradient-rotate 3s linear infinite' : undefined,
                backgroundSize: '200% 200%',
              }}
              />

              {/* Glow effect for cards */}
              {plan.popular && (
                <motion.div
                  className="absolute -inset-4 rounded-3xl bg-primary/20 blur-2xl -z-10"
                  animate={{
                    opacity: [0.3, 0.6, 0.3],
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              )}
              {plan.id === 'kickstarter' && (
                <motion.div
                  className="absolute -inset-4 rounded-3xl bg-green-500/15 blur-2xl -z-10"
                  animate={{
                    opacity: [0.2, 0.4, 0.2],
                    scale: [1, 1.03, 1],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              )}
              {plan.id === 'enterprise' && (
                <motion.div
                  className="absolute -inset-4 rounded-3xl bg-purple-500/15 blur-2xl -z-10"
                  animate={{
                    opacity: [0.2, 0.5, 0.2],
                    scale: [1, 1.04, 1],
                  }}
                  transition={{
                    duration: 3.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              )}

              {/* Card content */}
              <div className={`relative rounded-2xl p-6 flex flex-col h-full transition-all duration-300 ${
                plan.popular
                  ? 'bg-gradient-to-b from-primary/10 via-background to-background'
                  : 'bg-background'
              }`}>

                {/* Shimmer effect on hover */}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 overflow-hidden pointer-events-none">
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                </div>

                {/* Badge with animation */}
                {plan.badge && (
                  <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: index * 0.15 + 0.3, type: "spring" }}
                    className={`absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 text-white text-xs font-bold rounded-full shadow-lg z-30 whitespace-nowrap ${
                      plan.popular
                        ? 'bg-gradient-to-r from-primary to-purple-500'
                        : plan.id === 'enterprise'
                        ? 'bg-gradient-to-r from-purple-500 to-violet-500'
                        : plan.badgeColor
                    }`}
                  >
                    <motion.span
                      animate={plan.popular ? {
                        textShadow: ['0 0 10px rgba(255,255,255,0.5)', '0 0 20px rgba(255,255,255,0.8)', '0 0 10px rgba(255,255,255,0.5)']
                      } : {}}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {plan.badge}
                    </motion.span>
                  </motion.div>
                )}

                {/* Icon and Title */}
                <div className="flex items-center gap-3 mb-4 mt-2">
                  <motion.div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                      plan.popular
                        ? 'bg-gradient-to-br from-primary to-purple-500 shadow-lg shadow-primary/25'
                        : plan.id === 'enterprise'
                        ? 'bg-gradient-to-br from-purple-500 to-violet-500 shadow-lg shadow-purple-500/25'
                        : plan.id === 'kickstarter'
                        ? 'bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg shadow-green-500/25'
                        : 'bg-gradient-to-br from-cyan-500/80 to-blue-500/80 shadow-lg shadow-cyan-500/20'
                    }`}
                    whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <plan.icon className="w-6 h-6 text-white" />
                  </motion.div>
                  <div>
                    <h3 className="text-xl font-bold">{plan.name}</h3>
                    <p className="text-xs text-muted-foreground">{plan.description}</p>
                  </div>
                </div>

                {/* Price with animation */}
                <div className="mb-6">
                  <motion.div
                    className="flex items-baseline gap-1"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: index * 0.15 + 0.2 }}
                  >
                    <span className={`text-4xl font-bold ${
                      plan.popular
                        ? 'bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent'
                        : plan.id === 'enterprise'
                        ? 'bg-gradient-to-r from-purple-400 to-violet-400 bg-clip-text text-transparent'
                        : plan.id === 'kickstarter'
                        ? 'bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent'
                        : 'bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent'
                    }`}>
                      {plan.price === 0 ? 'FREE' : `$${billingPeriod === 'yearly' ? plan.yearlyPrice : plan.price}`}
                    </span>
                    {plan.price > 0 && <span className="text-muted-foreground text-sm">/{plan.period}</span>}
                  </motion.div>
                  {billingPeriod === 'yearly' && plan.price > 0 && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs text-success mt-1"
                    >
                      Save ${((plan.price - plan.yearlyPrice) * 12).toFixed(0)}/year
                    </motion.p>
                  )}
                </div>

                {/* Features list with staggered animation */}
                <ul className="space-y-2.5 mb-4 flex-1">
                  {plan.features.slice(0, 6).map((feature, featureIndex) => (
                    <motion.li
                      key={feature}
                      className="flex items-start gap-2"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 + featureIndex * 0.05 + 0.3 }}
                    >
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                        plan.popular ? 'bg-success/20' : 'bg-success/10'
                      }`}>
                        <Check className="w-3 h-3 text-success" />
                      </div>
                      <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">{feature}</span>
                    </motion.li>
                  ))}
                </ul>

                {plan.features.length > 6 && (
                  <Collapsible
                    open={expandedFeatures[plan.id]}
                    onOpenChange={(open) => setExpandedFeatures(prev => ({ ...prev, [plan.id]: open }))}
                  >
                    <CollapsibleContent className="mb-4">
                      <ul className="space-y-2.5">
                        {plan.features.slice(6).map((feature) => (
                          <li key={feature} className="flex items-start gap-2">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                              plan.popular ? 'bg-success/20' : 'bg-success/10'
                            }`}>
                              <Check className="w-3 h-3 text-success" />
                            </div>
                            <span className="text-sm text-muted-foreground">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CollapsibleContent>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground hover:text-foreground mb-4 group/btn">
                        {expandedFeatures[plan.id] ? (
                          <>
                            <ChevronUp className="w-3 h-3 mr-1 transition-transform group-hover/btn:-translate-y-0.5" />
                            Show less
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-3 h-3 mr-1 transition-transform group-hover/btn:translate-y-0.5" />
                            +{plan.features.length - 6} more features
                          </>
                        )}
                      </Button>
                    </CollapsibleTrigger>
                  </Collapsible>
                )}

                {/* CTA Button with enhanced styling */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    onClick={() => handleSelectPlan(plan)}
                    className={`w-full h-12 font-semibold transition-all duration-300 ${
                      plan.popular
                        ? 'bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 text-white'
                        : plan.id === 'enterprise'
                        ? 'bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-500/90 hover:to-violet-500/90 text-white shadow-lg shadow-purple-500/20'
                        : plan.id === 'kickstarter'
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-500/90 hover:to-emerald-500/90 text-white shadow-lg shadow-green-500/20'
                        : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-500/90 hover:to-blue-500/90 text-white shadow-lg shadow-cyan-500/20'
                    }`}
                  >
                    {plan.isAffiliate ? (
                      <>
                        <Gift className="w-4 h-4 mr-2" />
                        Get Started Free
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Get Started
                      </>
                    )}
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Add keyframes for gradient animation */}
        <style>{`
          @keyframes gradient-rotate {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
        `}</style>

        {/* Premium Benefits */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-32 max-w-5xl mx-auto"
        >
          <span className="text-xs font-medium tracking-[0.2em] uppercase text-white/20 mb-12 block">
            Premium Benefits
          </span>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-6 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-amber-500/20 transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <Crown className="w-5 h-5 text-amber-400" />
                </div>
                <span className="text-xs px-2 py-1 rounded-full border border-amber-500/30 text-amber-400">Pro & Enterprise</span>
              </div>
              <h3 className="text-xl font-medium text-white mb-2">VIP Signals</h3>
              <p className="text-white/40 font-light leading-relaxed">
                Every VIP signal is reviewed by 3-4 professional traders before delivery. Multi-expert consensus ensures higher confidence.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-purple-500/20 transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-purple-400" />
                </div>
                <span className="text-xs px-2 py-1 rounded-full border border-purple-500/30 text-purple-400">Exclusive</span>
              </div>
              <h3 className="text-xl font-medium text-white mb-2">1-on-1 Guidance</h3>
              <p className="text-white/40 font-light leading-relaxed">
                Get personalized mentorship from our trading experts. Private sessions, strategy review, and tailored advice.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Feature Comparison - Clean Table */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-32"
        >
          <div className="max-w-5xl mx-auto mb-16">
            <span className="text-xs font-medium tracking-[0.2em] uppercase text-white/20 mb-4 block">
              Compare Plans
            </span>
            <h2 className="text-3xl md:text-4xl tracking-tight">
              <span className="font-light text-white/50">Everything included,</span>
              <br />
              <span className="font-semibold italic bg-gradient-to-r from-purple-400 to-purple-200 bg-clip-text text-transparent">at a glance.</span>
            </h2>
          </div>

          <div className="max-w-6xl mx-auto space-y-8">
            {featureCategories.map((category, catIndex) => (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: catIndex * 0.05 }}
              >
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
                  <category.icon className="w-5 h-5 text-primary" />
                  <h3 className="font-medium">{category.name}</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-xs font-medium tracking-widest uppercase text-muted-foreground">
                        <th className="text-left py-3 pr-4 w-1/3">Feature</th>
                        <th className="text-center py-3 px-2 w-[100px]">Free</th>
                        <th className="text-center py-3 px-2 w-[100px]">Starter</th>
                        <th className="text-center py-3 px-2 w-[100px]">Pro</th>
                        <th className="text-center py-3 px-2 w-[100px]">Enterprise</th>
                      </tr>
                    </thead>
                    <tbody>
                      {category.features.map((feature, idx) => (
                        <tr key={feature.name} className="border-t border-white/[0.04]">
                          <td className="py-4 pr-4 text-sm">{feature.name}</td>
                          <td className="py-4 px-2 text-center text-sm text-muted-foreground">{feature.k}</td>
                          <td className="py-4 px-2 text-center text-sm text-muted-foreground">{feature.s}</td>
                          <td className="py-4 px-2 text-center text-sm text-primary font-medium">{feature.p}</td>
                          <td className="py-4 px-2 text-center text-sm text-muted-foreground">{feature.e}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Trust Strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-32 max-w-5xl mx-auto"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 py-8 border-y border-white/10">
            {[
              { label: '7-day free trial', value: 'Try risk-free' },
              { label: 'Instant access', value: 'Start immediately' },
              { label: 'Cancel anytime', value: 'No lock-in' },
            ].map((item) => (
              <div key={item.label} className="text-center md:text-left">
                <p className="text-sm font-medium mb-1">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.value}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Disclaimer - Minimal */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.65 }}
          className="mt-16 max-w-3xl mx-auto text-center"
        >
          <p className="text-xs text-muted-foreground leading-relaxed">
            Trading involves substantial risk of loss. We are not responsible for any profits or losses
            that may result from following our signals. Past performance does not guarantee future results.
          </p>
        </motion.div>

        {/* Footer CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-32 max-w-5xl mx-auto"
        >
          <div className="p-8 rounded-xl bg-white/[0.02] border border-white/[0.05] flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <p className="text-white/40 font-light mb-1">Questions?</p>
              <h2 className="text-2xl tracking-tight">
                <span className="font-light text-white/50">We're here to</span>{' '}
                <span className="font-semibold italic bg-gradient-to-r from-purple-400 to-purple-200 bg-clip-text text-transparent">help.</span>
              </h2>
            </div>
            <div className="flex gap-4">
              <Button asChild variant="outline" size="lg" className="rounded-full px-8 bg-white/[0.02] border-white/[0.08] hover:bg-white/[0.05] hover:border-purple-500/30">
                <Link to="/faq">View FAQ</Link>
              </Button>
              <Button asChild size="lg" className="rounded-full px-8 bg-purple-500 hover:bg-purple-400 text-white">
                <Link to="/contact">Contact Us</Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default MembershipPage;
