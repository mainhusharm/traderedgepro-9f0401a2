import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Check, X, Star, ExternalLink, Shield, DollarSign, Clock, AlertTriangle } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import SEO from '@/components/common/SEO';
import { useState } from 'react';

const propFirms = [
  {
    name: 'FTMO',
    logo: 'FTMO',
    rating: 4.8,
    accountSizes: ['$10K', '$25K', '$50K', '$100K', '$200K'],
    profitTarget: { phase1: '10%', phase2: '5%' },
    maxDailyLoss: '5%',
    maxOverallLoss: '10%',
    profitSplit: '80-90%',
    tradingDays: 'Min 4',
    timeLimit: '30 days per phase',
    price: '$155 - $1,080',
    features: ['Free retake', 'Swing trading', 'News trading allowed', 'Scaling plan'],
    cons: ['Strict rules', 'Higher prices'],
    recommended: true,
  },
  {
    name: 'The Funded Trader',
    logo: 'TFT',
    rating: 4.6,
    accountSizes: ['$5K', '$10K', '$25K', '$50K', '$100K', '$200K'],
    profitTarget: { phase1: '8%', phase2: '5%' },
    maxDailyLoss: '5%',
    maxOverallLoss: '10%',
    profitSplit: '80-90%',
    tradingDays: 'Min 3',
    timeLimit: 'Unlimited',
    price: '$65 - $949',
    features: ['Low prices', 'Unlimited time', 'Multiple account types', 'Good support'],
    cons: ['Newer firm', 'Limited track record'],
    recommended: false,
  },
  {
    name: 'Topstep',
    logo: 'TS',
    rating: 4.7,
    accountSizes: ['$50K', '$100K', '$150K'],
    profitTarget: { phase1: '$3K-$9K', phase2: 'N/A' },
    maxDailyLoss: '$1K-$3K',
    maxOverallLoss: '$2K-$4.5K',
    profitSplit: '90-100%',
    tradingDays: 'Min 5',
    timeLimit: 'Unlimited',
    price: '$165 - $375/mo',
    features: ['Futures focused', 'Monthly subscription', 'Great education', '100% first $10K'],
    cons: ['Subscription model', 'Futures only'],
    recommended: false,
  },
  {
    name: 'True Forex Funds',
    logo: 'TFF',
    rating: 4.5,
    accountSizes: ['$10K', '$25K', '$50K', '$100K', '$200K'],
    profitTarget: { phase1: '8%', phase2: '4%' },
    maxDailyLoss: '4%',
    maxOverallLoss: '8%',
    profitSplit: '80%',
    tradingDays: 'Min 5',
    timeLimit: '35 days / unlimited',
    price: '$99 - $899',
    features: ['Lower drawdown limits', 'Good reputation', 'Fast payouts', 'MT4/MT5'],
    cons: ['Lower profit split', 'Stricter drawdown'],
    recommended: false,
  },
  {
    name: 'MyForexFunds',
    logo: 'MFF',
    rating: 4.4,
    accountSizes: ['$5K', '$10K', '$20K', '$50K', '$100K'],
    profitTarget: { phase1: '8%', phase2: '5%' },
    maxDailyLoss: '5%',
    maxOverallLoss: '12%',
    profitSplit: '75-85%',
    tradingDays: 'Min 3',
    timeLimit: 'Unlimited',
    price: '$49 - $499',
    features: ['Very affordable', 'Generous drawdown', 'Fast verification', 'Active community'],
    cons: ['Lower profit split', 'Growing pains'],
    recommended: false,
  },
];

const PropFirmComparisonPage = () => {
  const [selectedFirm, setSelectedFirm] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Compare Best Prop Firms 2026 | How to Pass Your Challenge"
        description="Compare FTMO, Funding Pips, and top prop trading firms. Find the best profit splits, drawdown limits, and challenge rules to get funded in 2026."
        keywords="prop firm comparison, best prop firms 2026, FTMO vs Funding Pips, prop trading firms, funded trading accounts, prop firm rules"
        canonicalUrl="https://traderedgepro.com/prop-comparison"
      />
      <Header />
      
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-6">
          {/* Hero */}
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm mb-6">
              <Shield className="w-4 h-4" />
              Prop Firm Guide
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Compare <span className="gradient-text">Prop Trading Firms</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Find the best prop firm for your trading style. Compare rules, profit splits, and account sizes.
            </p>
          </motion.div>

          {/* Quick Stats */}
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {[
              { icon: Shield, label: 'Firms Analyzed', value: '15+' },
              { icon: DollarSign, label: 'Capital Available', value: '$5M+' },
              { icon: Clock, label: 'Avg. Challenge Time', value: '14 days' },
              { icon: Star, label: 'Success Rate w/ TEP', value: '78%' },
            ].map((stat, index) => (
              <div key={stat.label} className="glass-card p-6 rounded-2xl text-center">
                <stat.icon className="w-8 h-8 text-primary mx-auto mb-3" />
                <p className="text-2xl font-bold gradient-text">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </motion.div>

          {/* Comparison Cards */}
          <motion.div 
            className="space-y-6 mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-2xl font-bold mb-6">Top Prop Firms Compared</h2>
            {propFirms.map((firm, index) => (
              <motion.div
                key={firm.name}
                className={`glass-card rounded-2xl overflow-hidden ${
                  firm.recommended ? 'ring-2 ring-primary' : ''
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                {firm.recommended && (
                  <div className="bg-primary text-primary-foreground text-center py-2 text-sm font-semibold">
                    ⭐ Most Popular Choice
                  </div>
                )}
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                    {/* Logo & Rating */}
                    <div className="flex items-center gap-4 lg:w-48 shrink-0">
                      <div className="w-16 h-16 bg-primary/20 rounded-xl flex items-center justify-center">
                        <span className="text-xl font-bold text-primary">{firm.logo}</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{firm.name}</h3>
                        <div className="flex items-center gap-1 text-yellow-500">
                          <Star className="w-4 h-4 fill-current" />
                          <span className="text-sm">{firm.rating}</span>
                        </div>
                      </div>
                    </div>

                    {/* Key Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Profit Target</p>
                        <p className="font-semibold text-sm">P1: {firm.profitTarget.phase1}</p>
                        <p className="font-semibold text-sm">P2: {firm.profitTarget.phase2}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Max Drawdown</p>
                        <p className="font-semibold text-sm">Daily: {firm.maxDailyLoss}</p>
                        <p className="font-semibold text-sm">Total: {firm.maxOverallLoss}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Profit Split</p>
                        <p className="font-semibold text-lg text-primary">{firm.profitSplit}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Price Range</p>
                        <p className="font-semibold text-sm">{firm.price}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 lg:flex-col">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedFirm(selectedFirm === firm.name ? null : firm.name)}
                      >
                        {selectedFirm === firm.name ? 'Hide Details' : 'View Details'}
                      </Button>
                      <Button size="sm" className="btn-glow">
                        Visit Site <ExternalLink className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {selectedFirm === firm.name && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-6 pt-6 border-t border-white/10"
                    >
                      <div className="grid md:grid-cols-3 gap-6">
                        <div>
                          <h4 className="font-semibold mb-3">Account Sizes</h4>
                          <div className="flex flex-wrap gap-2">
                            {firm.accountSizes.map((size) => (
                              <span key={size} className="px-3 py-1 bg-muted rounded-full text-sm">
                                {size}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <Check className="w-4 h-4 text-green-500" /> Pros
                          </h4>
                          <ul className="space-y-1 text-sm">
                            {firm.features.map((feature) => (
                              <li key={feature} className="flex items-center gap-2 text-muted-foreground">
                                <Check className="w-3 h-3 text-green-500" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-yellow-500" /> Cons
                          </h4>
                          <ul className="space-y-1 text-sm">
                            {firm.cons.map((con) => (
                              <li key={con} className="flex items-center gap-2 text-muted-foreground">
                                <X className="w-3 h-3 text-red-500" />
                                {con}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <div className="mt-4 flex gap-4 text-sm text-muted-foreground">
                        <span>Min Trading Days: {firm.tradingDays}</span>
                        <span>•</span>
                        <span>Time Limit: {firm.timeLimit}</span>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Comparison Table */}
          <motion.div 
            className="mb-16 overflow-x-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h2 className="text-2xl font-bold mb-6">Quick Comparison</h2>
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-4 px-4 font-semibold">Firm</th>
                  <th className="text-left py-4 px-4 font-semibold">Profit Split</th>
                  <th className="text-left py-4 px-4 font-semibold">Max Daily Loss</th>
                  <th className="text-left py-4 px-4 font-semibold">Max Total Loss</th>
                  <th className="text-left py-4 px-4 font-semibold">Min Price</th>
                  <th className="text-left py-4 px-4 font-semibold">Rating</th>
                </tr>
              </thead>
              <tbody>
                {propFirms.map((firm) => (
                  <tr key={firm.name} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-4 px-4 font-medium">{firm.name}</td>
                    <td className="py-4 px-4 text-primary font-semibold">{firm.profitSplit}</td>
                    <td className="py-4 px-4">{firm.maxDailyLoss}</td>
                    <td className="py-4 px-4">{firm.maxOverallLoss}</td>
                    <td className="py-4 px-4">{firm.price.split(' - ')[0]}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        {firm.rating}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>

          {/* Tips Section */}
          <motion.div 
            className="mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="glass-card p-8 rounded-3xl bg-gradient-to-br from-primary/10 to-transparent">
              <h2 className="text-2xl font-bold mb-6">Tips for Choosing a Prop Firm</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {[
                  { title: 'Match Your Style', desc: 'Choose rules that align with how you naturally trade' },
                  { title: 'Consider the Cost', desc: 'Factor in challenge fees vs potential funded account value' },
                  { title: 'Check the Track Record', desc: 'Look for firms with proven payout history' },
                  { title: 'Read the Fine Print', desc: 'Understand all rules before committing' },
                ].map((tip) => (
                  <div key={tip.title} className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center shrink-0">
                      <Check className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{tip.title}</h3>
                      <p className="text-sm text-muted-foreground">{tip.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <h2 className="text-3xl font-bold mb-4">Pass Your Challenge with TraderEdge Pro</h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Our signals and risk management tools help traders pass prop firm challenges with an 78% success rate.
            </p>
            <Button className="btn-glow px-8 py-6 text-lg" asChild>
              <Link to="/membership">Start Your Journey</Link>
            </Button>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PropFirmComparisonPage;
