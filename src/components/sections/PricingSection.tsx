import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Star, Zap, Crown, Gift, Coins, ChevronDown, ChevronUp, Rocket, type LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface Plan {
  id: string;
  name: string;
  icon: LucideIcon;
  price: number;
  yearlyPrice: number;
  originalPrice?: number;
  discountedPrice?: number;
  launchDiscount?: boolean;
  period: string;
  description: string;
  features: string[];
  isAffiliate?: boolean;
  popular?: boolean;
  christmasOffer?: boolean;
  badge?: string;
  badgeColor?: string;
}

const PricingSection = () => {
  const [isYearly, setIsYearly] = useState(false);
  const [expandedFeatures, setExpandedFeatures] = useState<Record<string, boolean>>({});
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);
  const navigate = useNavigate();

  const plans: Plan[] = [
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
      originalPrice: 199,
      launchDiscount: true,
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
      badge: '🚀 LAUNCH 20% OFF',
      badgeColor: 'bg-gradient-to-r from-primary to-purple-500',
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

  const handlePlanSelect = (plan: Plan) => {
    if (plan.isAffiliate) {
      navigate('/affiliates');
      return;
    }
    const price = getPrice(plan);
    const billing = isYearly ? 'yearly' : 'monthly';
    // For Pro plan with launch discount, include coupon code
    const couponParam = plan.launchDiscount ? '&coupon=PROLAUNCH20' : '';
    navigate(`/auth?plan=${plan.id}&price=${price}&billing=${billing}${couponParam}`);
  };

  const getPrice = (plan: Plan) => {
    if (plan.discountedPrice && plan.id === 'starter') {
      return plan.discountedPrice;
    }
    // Show launch discount for Pro plan
    if (plan.launchDiscount && plan.id === 'pro') {
      const basePrice = isYearly ? plan.yearlyPrice : plan.price;
      return Math.round(basePrice * 0.8 * 100) / 100; // 20% off
    }
    return isYearly ? plan.yearlyPrice : plan.price;
  };

  return (
    <section id="pricing" className="py-32 relative">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-radial from-primary/5 via-transparent to-transparent" />
      
      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="text-primary text-sm font-semibold tracking-wider uppercase mb-4 block">
            Pricing
          </span>
          <h2 className="text-4xl md:text-5xl font-bold gradient-text mb-6">
            Choose Your <span className="text-primary">Trading Edge</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
            Select the plan that fits your trading goals. All paid plans include our core AI technology.
          </p>

          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <span className={!isYearly ? 'text-foreground' : 'text-muted-foreground'}>
              Monthly
            </span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className="relative w-14 h-7 bg-muted/30 rounded-full transition-colors"
            >
              <div
                className={`absolute top-1 w-5 h-5 bg-primary rounded-full transition-all ${
                  isYearly ? 'left-8' : 'left-1'
                }`}
              />
            </button>
            <span className={isYearly ? 'text-foreground' : 'text-muted-foreground'}>
              Yearly
              <span className="ml-2 text-xs text-success">Save 20%</span>
            </span>
          </div>
        </motion.div>

        {/* Plans grid - 4 columns with hover effect */}
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6 max-w-7xl mx-auto pt-6">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              data-card
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
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
                ) : plan.launchDiscount && plan.id === 'pro' ? (
                  <div className="flex flex-col">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-primary">${getPrice(plan)}</span>
                      <span className="text-lg text-muted-foreground line-through">${isYearly ? plan.yearlyPrice : plan.price}</span>
                      <span className="text-muted-foreground">/{plan.period}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <Rocket className="w-3 h-3 text-primary" />
                      <span className="text-xs text-primary font-medium">Use code: PROLAUNCH20</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">
                      {plan.price === 0 ? 'FREE' : `$${isYearly ? plan.yearlyPrice : plan.price}`}
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
                onClick={() => handlePlanSelect(plan)}
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

        {/* Trust badges */}
        <motion.div
          className="flex flex-wrap justify-center items-center gap-8 mt-16"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          {['7-Day Free Trial', '100% Money Back', 'Cancel Anytime', 'Instant Access'].map((badge) => (
            <div key={badge} className="flex items-center gap-2 text-sm text-muted-foreground">
              <Zap className="w-4 h-4 text-primary" />
              {badge}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default PricingSection;
