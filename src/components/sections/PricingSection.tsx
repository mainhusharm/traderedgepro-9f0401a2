import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Star, Zap, Crown, Gift, Coins, ChevronDown, ChevronUp, Sparkles, type LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface Plan {
  id: string;
  name: string;
  icon: LucideIcon;
  price: number;
  yearlyPrice: number;
  period: string;
  description: string;
  features: string[];
  isAffiliate?: boolean;
  popular?: boolean;
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

  const handlePlanSelect = (plan: Plan) => {
    if (plan.isAffiliate) {
      navigate('/affiliates');
      return;
    }
    const price = getPrice(plan);
    const billing = isYearly ? 'yearly' : 'monthly';
    navigate(`/auth?plan=${plan.id}&price=${price}&billing=${billing}`);
  };

  const getPrice = (plan: Plan) => {
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
            Invest in Your <span className="text-primary">Trading Future</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-4">
            One blown prop challenge costs you more than an entire year of Trader Edge Pro.
          </p>
          <p className="text-muted-foreground/70 text-sm max-w-xl mx-auto mb-8">
            Stop losing accounts to emotional decisions. Our performance system pays for itself after preventing just one failed challenge.
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

        {/* Plans grid - 4 columns with enhanced animations */}
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-8 max-w-7xl mx-auto pt-8">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              data-card
              initial={{ opacity: 0, y: 40, rotateX: -10 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
              viewport={{ once: true }}
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
                    whileInView={{ y: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.15 + 0.3, type: "spring" }}
                    className={`absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 text-white text-xs font-bold rounded-full shadow-lg z-30 whitespace-nowrap ${
                      plan.popular
                        ? 'bg-gradient-to-r from-primary to-purple-500'
                        : plan.id === 'enterprise'
                        ? 'bg-gradient-to-r from-purple-500 to-violet-500'
                        : plan.badgeColor
                    }`}
                  >
                    {plan.badge}
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
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
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
                      {plan.price === 0 ? 'FREE' : `$${isYearly ? plan.yearlyPrice : plan.price}`}
                    </span>
                    {plan.price > 0 && <span className="text-muted-foreground text-sm">/{plan.period}</span>}
                  </motion.div>
                  {isYearly && plan.price > 0 && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
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
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
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
                    onClick={() => handlePlanSelect(plan)}
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
