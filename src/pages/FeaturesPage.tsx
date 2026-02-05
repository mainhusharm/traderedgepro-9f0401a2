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
  Lock
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
    description: 'Get instant alerts for high-probability trading setups across Forex, Crypto, and Futures markets with detailed entry, stop-loss, and take-profit levels.',
    color: 'text-primary',
  },
  {
    icon: Bot,
    title: 'AI-Powered Analysis',
    description: 'Our advanced AI analyzes market conditions 24/7, identifying patterns and opportunities that human traders might miss.',
    color: 'text-accent',
  },
  {
    icon: Shield,
    title: 'Prop Firm Compliance',
    description: 'Built-in rules engine ensures your trades stay within prop firm guidelines, protecting your funded accounts from violations.',
    color: 'text-success',
  },
  {
    icon: TrendingUp,
    title: 'Performance Analytics',
    description: 'Track your win rate, profit factor, drawdown, and other key metrics with beautiful visualizations and insights.',
    color: 'text-warning',
  },
  {
    icon: Target,
    title: 'Risk Management Tools',
    description: 'Calculate optimal position sizes, set risk limits, and protect your capital with our comprehensive risk management suite.',
    color: 'text-risk',
  },
  {
    icon: BarChart3,
    title: 'Trade Journal',
    description: 'Log and analyze every trade with our intelligent journal that helps identify patterns in your trading behavior.',
    color: 'text-primary',
  },
  {
    icon: Bell,
    title: 'Smart Notifications',
    description: 'Receive alerts via push notifications, email, or Telegram so you never miss a trading opportunity.',
    color: 'text-accent',
  },
  {
    icon: Clock,
    title: 'Market Hours Tracking',
    description: 'Know exactly when major sessions open and close with our global market hours tracker.',
    color: 'text-success',
  },
  {
    icon: Globe,
    title: 'Multi-Timezone Support',
    description: 'View everything in your local timezone with support for all major trading centers worldwide.',
    color: 'text-warning',
  },
  {
    icon: Users,
    title: 'Community & Support',
    description: 'Join a community of serious traders and get 24/7 support from our dedicated team.',
    color: 'text-primary',
  },
  {
    icon: Zap,
    title: 'Lightning Fast Execution',
    description: 'Our infrastructure ensures signals reach you in milliseconds, giving you the edge you need.',
    color: 'text-accent',
  },
  {
    icon: Lock,
    title: 'Bank-Level Security',
    description: 'Your data is protected with enterprise-grade encryption and security protocols.',
    color: 'text-success',
  },
];

const FeaturesPage = () => {
  return (
    <div className="min-h-screen bg-[#020202]">
      <SEO
        title="AI Trading Features to Pass Prop Firm Challenges"
        description="Powerful AI trading features including real-time signals, prop firm compliance tools, risk management, and 24/7 market analysis to help you get funded."
        keywords="AI trading features, prop firm tools, trading signals, risk management, prop firm compliance, trading analytics, market analysis"
        canonicalUrl="https://traderedgepro.com/features"
      />
      <Header />
      
      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <motion.h1 
            className="text-4xl md:text-6xl font-bold mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Powerful Features for
            <span className="gradient-text block">Serious Traders</span>
          </motion.h1>
          <motion.p 
            className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Everything you need to pass prop firm challenges and trade profitably, 
            all in one powerful platform.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Link to="/auth">
              <Button size="lg" className="bg-primary hover:bg-primary/90">
                Get Started Free
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                className="p-6 rounded-2xl bg-card/50 border border-white/[0.08] hover:border-primary/30 transition-all"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <div className={`w-12 h-12 rounded-xl bg-background flex items-center justify-center mb-4 ${feature.color}`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="p-12 rounded-3xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
            <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Trading?</h2>
            <p className="text-muted-foreground mb-8">
              Join thousands of traders who are already using TraderEdge to achieve consistent profitability.
            </p>
            <div className="flex gap-4 justify-center">
              <Link to="/auth">
                <Button size="lg" className="bg-primary hover:bg-primary/90">
                  Start Free Trial
                </Button>
              </Link>
              <Link to="/membership">
                <Button size="lg" variant="outline">
                  View Pricing
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default FeaturesPage;
