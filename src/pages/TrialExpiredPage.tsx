import { motion } from 'framer-motion';
import { Clock, CheckCircle, ArrowRight, Zap, Shield, Bot, Users, BarChart3, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate, Link } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const TrialExpiredPage = () => {
  const navigate = useNavigate();

  const featuresYouTried = [
    { icon: Zap, label: 'VIP Trading Signals' },
    { icon: Bot, label: 'AI Trading Coach' },
    { icon: BarChart3, label: 'Performance Analytics' },
    { icon: Shield, label: 'Risk Management Tools' },
    { icon: Users, label: '1-on-1 Guidance Sessions' },
  ];

  const plans = [
    {
      id: 'starter',
      name: 'Starter Access',
      price: 99,
      yearlyPrice: 79,
      period: 'month',
      description: 'For traders preparing for prop firms',
      features: ['Up to 3 signals/day', 'Basic AI reasoning', 'Risk calculator', 'Email notifications'],
      color: 'cyan',
    },
    {
      id: 'pro',
      name: 'Funded Trader Core',
      price: 299,
      yearlyPrice: 239,
      period: 'month',
      description: 'The system serious traders use',
      features: ['Unlimited signals', 'VIP Signals', 'AI Trading Coach (Nexus)', '1-on-1 Guidance', 'Priority Support'],
      popular: true,
      color: 'primary',
    },
    {
      id: 'enterprise',
      name: 'Trader Desk',
      price: 899,
      yearlyPrice: 719,
      period: '3 months',
      description: 'Team accountability & leverage',
      features: ['Everything in Pro', 'MT5 automation', 'Unlimited 1-on-1 Guidance', '24/7 Priority support', 'Team Dashboard'],
      color: 'purple',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white overflow-hidden">
      {/* Ambient background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-0 w-[500px] h-[500px] bg-purple-500/8 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[120px]" />
      </div>

      <Header />

      {/* Hero - Left aligned like FAQ */}
      <section className="relative pt-32 md:pt-40 pb-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300/80 mb-6">
                <Clock className="w-3.5 h-3.5" />
                Trial Ended
              </span>

              <h1 className="text-4xl sm:text-5xl md:text-6xl tracking-tight leading-[1.15] mb-5">
                <span className="font-light text-white/50">Your trial has</span>
                <br />
                <span className="font-semibold italic bg-gradient-to-r from-amber-400 to-orange-300 bg-clip-text text-transparent">ended.</span>
              </h1>

              <p className="text-base text-white/40 max-w-md leading-relaxed font-light">
                We hope you enjoyed exploring TraderEdge Pro. Choose a plan to continue your journey.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features You Tried - Two column layout */}
      <section className="relative py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid md:grid-cols-[200px_1fr] gap-6 md:gap-16"
          >
            <div>
              <h2 className="text-xs font-medium tracking-[0.2em] uppercase text-white/20 md:pt-2">
                You Experienced
              </h2>
            </div>

            <div className="flex flex-wrap gap-3">
              {featuresYouTried.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 + index * 0.05 }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/[0.03] border border-white/[0.06] hover:border-purple-500/30 transition-colors"
                >
                  <feature.icon className="w-4 h-4 text-purple-400" />
                  <span className="text-sm text-white/70">{feature.label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards - Two column layout */}
      <section className="relative py-12 md:py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid md:grid-cols-[200px_1fr] gap-6 md:gap-16"
          >
            <div>
              <h2 className="text-xs font-medium tracking-[0.2em] uppercase text-white/20 md:pt-5">
                Choose Your Plan
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {plans.map((plan, index) => (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="relative group"
                >
                  {/* Gradient border */}
                  <div className={`absolute -inset-[1px] rounded-xl transition-opacity duration-300 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-primary via-purple-500 to-pink-500 opacity-100'
                      : plan.color === 'purple'
                      ? 'bg-gradient-to-r from-purple-500 to-violet-500 opacity-40 group-hover:opacity-70'
                      : 'bg-gradient-to-r from-cyan-500 to-blue-500 opacity-30 group-hover:opacity-60'
                  }`} />

                  {/* Glow effect for popular */}
                  {plan.popular && (
                    <div className="absolute -inset-4 rounded-2xl bg-primary/15 blur-xl -z-10" />
                  )}

                  <div className={`relative rounded-xl p-5 h-full flex flex-col ${
                    plan.popular ? 'bg-gradient-to-b from-primary/10 via-[#0A0A0B] to-[#0A0A0B]' : 'bg-[#0A0A0B]'
                  }`}>
                    {/* Badge */}
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="bg-gradient-to-r from-primary to-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                          POPULAR
                        </span>
                      </div>
                    )}

                    <div className="pt-2">
                      <h3 className="text-lg font-bold mb-1">{plan.name}</h3>
                      <p className="text-xs text-white/40 mb-3">{plan.description}</p>

                      <div className="mb-4">
                        <span className={`text-3xl font-bold ${
                          plan.popular
                            ? 'bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent'
                            : plan.color === 'purple'
                            ? 'bg-gradient-to-r from-purple-400 to-violet-400 bg-clip-text text-transparent'
                            : 'bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent'
                        }`}>
                          ${plan.price}
                        </span>
                        <span className="text-white/40 text-sm">/{plan.period}</span>
                      </div>

                      <ul className="space-y-2 mb-5 flex-1">
                        {plan.features.map((feature, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center">
                              <CheckCircle className="w-2.5 h-2.5 text-green-400" />
                            </div>
                            <span className="text-xs text-white/60">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <Button
                        className={`w-full h-10 text-sm font-medium transition-all duration-300 ${
                          plan.popular
                            ? 'bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 shadow-lg shadow-primary/20 text-white'
                            : plan.color === 'purple'
                            ? 'bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-500/90 hover:to-violet-500/90 text-white'
                            : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-500/90 hover:to-blue-500/90 text-white'
                        }`}
                        onClick={() => navigate(`/payment-flow?plan=${plan.id}&price=${plan.price}&billing=monthly`)}
                      >
                        <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                        Upgrade
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA - Compact inline like FAQ */}
      <section className="relative py-16 md:py-20 px-6 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-6"
          >
            <div>
              <h2 className="text-xl md:text-2xl tracking-tight mb-1">
                <span className="font-light text-white/50">Need more</span>{' '}
                <span className="font-semibold italic bg-gradient-to-r from-purple-400 to-purple-200 bg-clip-text text-transparent">time?</span>
              </h2>
              <p className="text-sm text-white/30 font-light">
                7-day satisfaction guarantee on all plans. Full refund, no questions asked.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                asChild
                variant="outline"
                className="rounded-full px-6 bg-transparent border-white/10 hover:border-purple-500/30 hover:bg-white/5 text-white text-sm font-normal"
              >
                <Link to="/membership">View All Plans</Link>
              </Button>
              <Button
                asChild
                className="rounded-full px-6 bg-purple-500 hover:bg-purple-400 text-white text-sm font-medium"
              >
                <Link to="/contact-support">Contact Support</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default TrialExpiredPage;
