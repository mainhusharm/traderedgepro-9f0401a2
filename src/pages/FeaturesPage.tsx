import { motion } from 'framer-motion';
import {
  Activity,
  Shield,
  Bot,
  TrendingUp,
  Zap,
  Users,
  Target,
  BarChart3,
  Bell,
  Clock,
  Globe,
  Lock,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import SEO from '@/components/common/SEO';

const features = [
  {
    icon: Activity,
    title: 'Real-Time Trading Signals',
    description: 'Get instant alerts for high-probability setups across Forex and Gold markets.',
  },
  {
    icon: Bot,
    title: 'AI-Powered Analysis',
    description: 'Our AI analyzes market conditions 24/7, identifying patterns humans miss.',
  },
  {
    icon: Shield,
    title: 'Prop Firm Compliance',
    description: 'Built-in rules engine protects your funded accounts from violations.',
  },
  {
    icon: TrendingUp,
    title: 'Performance Analytics',
    description: 'Track win rate, profit factor, and drawdown with beautiful visualizations.',
  },
  {
    icon: Target,
    title: 'Risk Management Tools',
    description: 'Calculate optimal position sizes and set risk limits to protect capital.',
  },
  {
    icon: BarChart3,
    title: 'Trade Journal',
    description: 'Log and analyze every trade with our intelligent journaling system.',
  },
  {
    icon: Bell,
    title: 'Smart Notifications',
    description: 'Receive alerts via push, email, or Telegram - never miss an opportunity.',
  },
  {
    icon: Clock,
    title: 'Market Hours Tracking',
    description: 'Know exactly when major sessions open and close globally.',
  },
  {
    icon: Globe,
    title: 'Multi-Timezone Support',
    description: 'View everything in your local timezone with worldwide coverage.',
  },
  {
    icon: Users,
    title: 'Community & Support',
    description: 'Join serious traders and get 24/7 support from our team.',
  },
  {
    icon: Zap,
    title: 'Lightning Fast Execution',
    description: 'Signals reach you in milliseconds, giving you the edge you need.',
  },
  {
    icon: Lock,
    title: 'Bank-Level Security',
    description: 'Your data is protected with enterprise-grade encryption.',
  },
];

const FeaturesPage = () => {
  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white overflow-hidden">
      {/* Ambient background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-0 w-[500px] h-[500px] bg-purple-500/8 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[120px]" />
      </div>

      <SEO
        title="AI Trading Features to Pass Prop Firm Challenges"
        description="Powerful AI trading features including real-time signals, prop firm compliance tools, risk management, and 24/7 market analysis to help you get funded."
        keywords="AI trading features, prop firm tools, trading signals, risk management, prop firm compliance, trading analytics, market analysis"
        canonicalUrl="https://traderedgepro.com/features"
      />
      <Header />

      {/* Hero - Left aligned */}
      <section className="relative pt-32 md:pt-40 pb-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300/80 mb-6">
                <Zap className="w-3.5 h-3.5" />
                Platform Features
              </span>

              <h1 className="text-4xl sm:text-5xl md:text-6xl tracking-tight leading-[1.15] mb-5">
                <span className="font-light text-white/50">Powerful features for</span>
                <br />
                <span className="font-semibold italic bg-gradient-to-r from-purple-400 to-purple-200 bg-clip-text text-transparent">serious traders.</span>
              </h1>

              <p className="text-base md:text-lg text-white/40 max-w-xl leading-relaxed font-light mb-8">
                Everything you need to pass prop firm challenges and trade{' '}
                <span className="text-white/60 font-normal">profitably</span>, all in one platform.
              </p>

              <Button asChild className="rounded-full px-6 bg-purple-500 hover:bg-purple-400 text-white font-medium">
                <Link to="/auth">
                  Get Started Free
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative py-16 md:py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05, duration: 0.4 }}
                className="group p-6 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-purple-500/20 hover:bg-white/[0.03] transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
                  <feature.icon className="w-5 h-5 text-purple-400/80" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-white/30 leading-relaxed font-light">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-20 md:py-28 px-6 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-6"
          >
            <div>
              <h2 className="text-2xl md:text-3xl tracking-tight mb-2">
                <span className="font-light text-white/50">Ready to transform your</span>{' '}
                <span className="font-semibold italic bg-gradient-to-r from-purple-400 to-purple-200 bg-clip-text text-transparent">trading?</span>
              </h2>
              <p className="text-sm text-white/30 font-light">
                Join thousands of traders achieving consistent profitability.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="outline" className="rounded-full px-6 bg-transparent border-white/10 hover:border-purple-500/30 hover:bg-white/5 text-white font-normal">
                <Link to="/membership">View Pricing</Link>
              </Button>
              <Button asChild className="rounded-full px-6 bg-purple-500 hover:bg-purple-400 text-white font-medium">
                <Link to="/auth">Start Free Trial</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default FeaturesPage;
