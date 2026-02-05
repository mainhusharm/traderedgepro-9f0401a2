import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Target, 
  Shield, 
  Clock, 
  TrendingUp,
  BookOpen,
  Lightbulb,
  ArrowRight,
  Star,
  Users,
  Brain
} from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import SEO from '@/components/common/SEO';

const HowToPassPropFirmPage = () => {
  const faqSchema = {
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How long does it take to pass a prop firm challenge?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Most traders pass prop firm challenges in 10-30 trading days. With proper risk management and a solid strategy like those provided by TraderEdge Pro, many traders complete Phase 1 within 2 weeks and Phase 2 within 1-2 additional weeks.',
        },
      },
      {
        '@type': 'Question',
        name: 'What is the average success rate for prop firm challenges?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'The industry average success rate is around 5-10%. However, traders using AI-powered tools and proper risk management like TraderEdge Pro achieve success rates of 78% or higher.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I use AI trading signals to pass prop firm challenges?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, using AI trading signals is 100% compliant with prop firm rules as long as you manually execute trades. TraderEdge Pro provides AI-powered signals that you review and execute yourself, keeping you in full compliance.',
        },
      },
      {
        '@type': 'Question',
        name: 'What is the best prop firm for beginners?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'FTMO and Funding Pips are excellent choices for beginners due to their clear rules, reasonable profit targets, and good support. Both offer free retakes and have proven track records of paying traders.',
        },
      },
      {
        '@type': 'Question',
        name: 'How much money do I need to start a prop firm challenge?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Challenge fees range from $50 for smaller accounts ($5K-$10K) to $500-$1000 for larger accounts ($100K-$200K). We recommend starting with a $25K-$50K challenge which typically costs $150-$300.',
        },
      },
    ],
  };

  const howToSchema = {
    '@type': 'HowTo',
    name: 'How to Pass Prop Firm Challenges in 2026',
    description: 'A comprehensive step-by-step guide to passing proprietary trading firm challenges and getting funded.',
    totalTime: 'P30D',
    estimatedCost: {
      '@type': 'MonetaryAmount',
      currency: 'USD',
      value: '200',
    },
    step: [
      {
        '@type': 'HowToStep',
        name: 'Choose the Right Prop Firm',
        text: 'Select a prop firm that matches your trading style, timezone, and risk tolerance. Consider factors like profit targets, drawdown limits, and profit split.',
      },
      {
        '@type': 'HowToStep',
        name: 'Develop Your Trading Strategy',
        text: 'Create or adopt a proven trading strategy with clear entry/exit rules. Focus on high-probability setups that align with prop firm rules.',
      },
      {
        '@type': 'HowToStep',
        name: 'Master Risk Management',
        text: 'Never risk more than 1-2% per trade. Calculate position sizes based on your account size and drawdown limits.',
      },
      {
        '@type': 'HowToStep',
        name: 'Practice on Demo',
        text: 'Trade your strategy on a demo account for at least 2-4 weeks to build confidence and refine your approach.',
      },
      {
        '@type': 'HowToStep',
        name: 'Start Your Challenge',
        text: 'Begin with a smaller account size to reduce pressure. Focus on consistency over hitting profit targets quickly.',
      },
      {
        '@type': 'HowToStep',
        name: 'Track and Analyze',
        text: 'Keep a detailed trading journal. Review your trades weekly and adjust your strategy based on performance data.',
      },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="How to Pass Prop Firm Challenges in 2026 (Complete Guide)"
        description="Learn proven strategies to pass FTMO, Funding Pips, and other prop firm challenges. Get AI-powered trading signals with 87% win rate to help you get funded faster."
        keywords="how to pass prop firm challenges, prop firm challenge 2026, pass FTMO challenge, get funded trading, prop firm tips, trading challenge strategies, funded trader"
        canonicalUrl="https://traderedgepro.com/how-to-pass-prop-firm-challenges"
        schema={[faqSchema, howToSchema]}
      />
      
      <Header />
      
      <main className="pt-32 pb-20">
        <article className="container mx-auto px-6 max-w-4xl">
          {/* Hero Section */}
          <motion.header
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm mb-6">
              <BookOpen className="w-4 h-4" />
              Complete Guide for 2026
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              How to Pass <span className="gradient-text">Prop Firm Challenges</span> in 2026
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              The definitive guide to getting funded with prop trading firms. Learn the exact strategies, risk management techniques, and tools that helped over 10,000 traders pass their challenges.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                15 min read
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                Updated January 2026
              </span>
              <span className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500" />
                78% Success Rate
              </span>
            </div>
          </motion.header>

          {/* Quick Stats */}
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {[
              { label: 'Traders Helped', value: '10,000+' },
              { label: 'Success Rate', value: '78%' },
              { label: 'Avg. Days to Pass', value: '14' },
              { label: 'Total Funded', value: '$50M+' },
            ].map((stat) => (
              <div key={stat.label} className="glass-card p-4 rounded-xl text-center">
                <p className="text-2xl font-bold gradient-text">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </motion.div>

          {/* Table of Contents */}
          <motion.nav
            className="glass-card p-6 rounded-2xl mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-lg font-semibold mb-4">Table of Contents</h2>
            <ul className="grid md:grid-cols-2 gap-2 text-sm">
              {[
                'What is a Prop Firm Challenge?',
                'Why Most Traders Fail (And How to Avoid It)',
                'Choosing the Right Prop Firm',
                'Essential Trading Strategies',
                'Risk Management Blueprint',
                'Using AI to Pass Faster',
                'Common Mistakes to Avoid',
                'Step-by-Step Challenge Timeline',
                'FAQs About Prop Firm Challenges',
              ].map((item, index) => (
                <li key={item}>
                  <a href={`#section-${index + 1}`} className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                    <span className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs text-primary">{index + 1}</span>
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </motion.nav>

          {/* Content Sections */}
          <div className="prose prose-invert prose-lg max-w-none">
            {/* Section 1 */}
            <motion.section
              id="section-1"
              className="mb-16"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <Target className="w-8 h-8 text-primary" />
                What is a Prop Firm Challenge?
              </h2>
              <div className="glass-card p-6 rounded-2xl mb-6">
                <p className="text-muted-foreground leading-relaxed">
                  A <strong>prop firm challenge</strong> is an evaluation process used by proprietary trading firms to identify skilled traders. Instead of risking your own capital, you trade the firm's money after proving your abilities through a simulated challenge.
                </p>
              </div>
              <p className="text-muted-foreground leading-relaxed mb-4">
                The typical prop firm challenge structure in 2026 consists of two phases:
              </p>
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="glass-card p-5 rounded-xl">
                  <h3 className="font-semibold text-primary mb-2">Phase 1: Evaluation</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                      Profit target: 8-10%
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                      Max daily drawdown: 4-5%
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                      Max total drawdown: 8-12%
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                      Minimum trading days: 3-5
                    </li>
                  </ul>
                </div>
                <div className="glass-card p-5 rounded-xl">
                  <h3 className="font-semibold text-primary mb-2">Phase 2: Verification</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                      Profit target: 4-5%
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                      Same drawdown rules
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                      Time limit: 60 days or unlimited
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                      Upon passing: Funded account
                    </li>
                  </ul>
                </div>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Once you pass both phases, you receive a <strong>funded trading account</strong> and keep 70-90% of the profits you generate. This is why prop firm challenges have become the #1 path for skilled traders to access significant capital without risking their own money.
              </p>
            </motion.section>

            {/* Section 2 */}
            <motion.section
              id="section-2"
              className="mb-16"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <AlertTriangle className="w-8 h-8 text-yellow-500" />
                Why Most Traders Fail (And How to Avoid It)
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                The harsh reality: <strong>90-95% of traders fail prop firm challenges</strong>. But here's the good news—most failures are due to preventable mistakes, not lack of skill. Let's analyze the top reasons and how to overcome them.
              </p>
              <div className="space-y-4 mb-6">
                {[
                  {
                    title: 'Over-Trading to Hit Targets',
                    problem: 'Traders rush to hit profit targets, taking excessive trades and breaking rules.',
                    solution: 'Focus on quality over quantity. 2-3 high-probability trades per day is plenty.',
                  },
                  {
                    title: 'Poor Risk Management',
                    problem: 'Risking too much per trade leads to quick account blowups.',
                    solution: 'Never risk more than 1-2% per trade. Calculate position sizes religiously.',
                  },
                  {
                    title: 'Ignoring Drawdown Rules',
                    problem: 'Traders focus on profits while forgetting about daily/total drawdown limits.',
                    solution: 'Set alerts at 50% of your drawdown limit. Stop trading when triggered.',
                  },
                  {
                    title: 'Trading Without a Plan',
                    problem: 'Entering trades based on gut feeling rather than a tested strategy.',
                    solution: 'Use a proven strategy with clear entry/exit rules. TraderEdge Pro provides AI-validated signals.',
                  },
                  {
                    title: 'Emotional Trading',
                    problem: 'Revenge trading after losses, fear of missing out, greed.',
                    solution: 'Set daily loss limits. Walk away after 2 consecutive losses. Use automation.',
                  },
                ].map((item) => (
                  <div key={item.title} className="glass-card p-5 rounded-xl">
                    <h3 className="font-semibold text-lg mb-3">{item.title}</h3>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-start gap-2 text-red-400">
                        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                        <span><strong>Problem:</strong> {item.problem}</span>
                      </div>
                      <div className="flex items-start gap-2 text-green-400">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                        <span><strong>Solution:</strong> {item.solution}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>

            {/* Section 3 */}
            <motion.section
              id="section-3"
              className="mb-16"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <Shield className="w-8 h-8 text-primary" />
                Choosing the Right Prop Firm
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Not all prop firms are created equal. The right choice depends on your trading style, timezone, and risk tolerance. Here are the top prop firms we recommend in 2026:
              </p>
              <div className="overflow-x-auto mb-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4">Prop Firm</th>
                      <th className="text-left py-3 px-4">Profit Target</th>
                      <th className="text-left py-3 px-4">Max Drawdown</th>
                      <th className="text-left py-3 px-4">Profit Split</th>
                      <th className="text-left py-3 px-4">Best For</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: 'FTMO', target: '10% / 5%', drawdown: '5% daily / 10% total', split: '80-90%', best: 'Established traders' },
                      { name: 'Funding Pips', target: '8% / 5%', drawdown: '5% daily / 10% total', split: '80-90%', best: 'Scalpers & swing traders' },
                      { name: 'True Forex Funds', target: '8% / 4%', drawdown: '4% daily / 8% total', split: '80%', best: 'Conservative traders' },
                      { name: 'The Funded Trader', target: '8% / 5%', drawdown: '5% daily / 10% total', split: '80-90%', best: 'Beginners' },
                    ].map((firm) => (
                      <tr key={firm.name} className="border-b border-white/5">
                        <td className="py-3 px-4 font-medium">{firm.name}</td>
                        <td className="py-3 px-4 text-muted-foreground">{firm.target}</td>
                        <td className="py-3 px-4 text-muted-foreground">{firm.drawdown}</td>
                        <td className="py-3 px-4 text-primary">{firm.split}</td>
                        <td className="py-3 px-4 text-muted-foreground">{firm.best}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="glass-card p-6 rounded-2xl bg-gradient-to-r from-primary/10 to-transparent">
                <p className="text-sm">
                  <strong className="text-primary">Pro Tip:</strong> Start with a smaller account size ($25K-$50K) to reduce pressure. You can always scale up to larger accounts after proving your consistency. Compare all prop firms on our{' '}
                  <Link to="/prop-comparison" className="text-primary hover:underline">
                    Prop Firm Comparison page
                  </Link>.
                </p>
              </div>
            </motion.section>

            {/* Section 4 */}
            <motion.section
              id="section-4"
              className="mb-16"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-green-500" />
                Essential Trading Strategies for Prop Firm Challenges
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Your trading strategy must balance profitability with risk management. Here are the most effective strategies for passing prop firm challenges in 2026:
              </p>
              <div className="space-y-6">
                <div className="glass-card p-6 rounded-2xl">
                  <h3 className="text-xl font-semibold mb-3">1. Session Trading (London/New York Open)</h3>
                  <p className="text-muted-foreground mb-4">
                    Trade during high-liquidity sessions when major markets overlap. Focus on the London open (2-4 AM EST) or New York open (8-10 AM EST) for the best price action.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">High Win Rate</span>
                    <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs">Predictable Volatility</span>
                    <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs">Clear Structure</span>
                  </div>
                </div>
                <div className="glass-card p-6 rounded-2xl">
                  <h3 className="text-xl font-semibold mb-3">2. Supply & Demand Zones</h3>
                  <p className="text-muted-foreground mb-4">
                    Identify institutional buying and selling zones. Enter trades when price returns to these zones with confirmation signals.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">High R:R Ratio</span>
                    <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs">Clear Stop Loss</span>
                    <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs">Works All Timeframes</span>
                  </div>
                </div>
                <div className="glass-card p-6 rounded-2xl">
                  <h3 className="text-xl font-semibold mb-3">3. AI-Powered Signal Following</h3>
                  <p className="text-muted-foreground mb-4">
                    Use AI trading signals that analyze multiple timeframes, market structure, and institutional order flow. TraderEdge Pro's AI identifies high-probability setups with entry, stop loss, and take profit levels.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">87% Win Rate</span>
                    <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs">Removes Emotion</span>
                    <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs">24/7 Analysis</span>
                  </div>
                </div>
              </div>
            </motion.section>

            {/* Section 5 */}
            <motion.section
              id="section-5"
              className="mb-16"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <Shield className="w-8 h-8 text-blue-500" />
                Risk Management Blueprint
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Risk management is the #1 factor in passing prop firm challenges. Here's the exact blueprint our successful traders follow:
              </p>
              <div className="glass-card p-6 rounded-2xl mb-6">
                <h3 className="font-semibold text-lg mb-4">The 1% Rule</h3>
                <p className="text-muted-foreground mb-4">
                  Never risk more than 1% of your account on a single trade. For a $100,000 account, your maximum loss per trade is $1,000.
                </p>
                <div className="bg-muted/30 p-4 rounded-xl font-mono text-sm">
                  <p className="text-muted-foreground mb-2">Position Size Formula:</p>
                  <p className="text-primary">Lot Size = (Account × Risk%) ÷ (Stop Loss in Pips × Pip Value)</p>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { title: 'Daily Loss Limit', value: '2%', desc: 'Stop trading after losing 2% in a day' },
                  { title: 'Max Open Trades', value: '2-3', desc: 'Limit exposure across correlated pairs' },
                  { title: 'Risk:Reward Ratio', value: '1:2+', desc: 'Only take trades with 2R potential' },
                  { title: 'Weekly Target', value: '2-3%', desc: 'Sustainable growth, not home runs' },
                ].map((rule) => (
                  <div key={rule.title} className="glass-card p-4 rounded-xl">
                    <p className="text-2xl font-bold text-primary mb-1">{rule.value}</p>
                    <p className="font-semibold text-sm mb-1">{rule.title}</p>
                    <p className="text-xs text-muted-foreground">{rule.desc}</p>
                  </div>
                ))}
              </div>
            </motion.section>

            {/* Section 6 - AI */}
            <motion.section
              id="section-6"
              className="mb-16"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <Brain className="w-8 h-8 text-purple-500" />
                Using AI to Pass Prop Firm Challenges Faster
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                In 2026, AI-powered trading tools have become essential for serious traders. Here's how AI can dramatically improve your chances of passing:
              </p>
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                {[
                  {
                    icon: TrendingUp,
                    title: 'Pattern Recognition',
                    desc: 'AI analyzes thousands of chart patterns in milliseconds, identifying high-probability setups humans might miss.',
                  },
                  {
                    icon: Shield,
                    title: 'Risk Protection',
                    desc: 'Automated drawdown monitoring and position size calculations prevent rule violations.',
                  },
                  {
                    icon: Lightbulb,
                    title: 'Emotion Removal',
                    desc: 'AI-generated signals remove fear and greed from trading decisions.',
                  },
                ].map((benefit) => (
                  <div key={benefit.title} className="glass-card p-5 rounded-xl text-center">
                    <benefit.icon className="w-8 h-8 text-primary mx-auto mb-3" />
                    <h3 className="font-semibold mb-2">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground">{benefit.desc}</p>
                  </div>
                ))}
              </div>
              <div className="glass-card p-6 rounded-2xl bg-gradient-to-r from-purple-500/10 to-primary/10 border border-primary/20">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center shrink-0">
                    <Star className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">TraderEdge Pro: Your AI Trading Advantage</h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      Our AI analyzes market structure, institutional order flow, and multi-timeframe confluence to deliver high-probability trading signals. Traders using TraderEdge Pro have an <strong>78% success rate</strong> on prop firm challenges.
                    </p>
                    <Link to="/membership">
                      <Button className="btn-glow">
                        Start Your Free Trial <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </motion.section>

            {/* Section 7 - Common Mistakes */}
            <motion.section
              id="section-7"
              className="mb-16"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <AlertTriangle className="w-8 h-8 text-red-500" />
                Common Mistakes to Avoid
              </h2>
              <div className="space-y-3">
                {[
                  'Trading during high-impact news events without proper preparation',
                  'Holding trades over the weekend (swap costs + gap risk)',
                  'Scaling into losing positions (averaging down)',
                  'Moving stop losses to avoid taking a loss',
                  'Trading too many pairs simultaneously',
                  'Not tracking your performance and adjusting',
                  'Ignoring correlation between open positions',
                  'Treating demo differently than you would real money',
                ].map((mistake, index) => (
                  <div key={mistake} className="flex items-center gap-3 glass-card p-4 rounded-xl">
                    <span className="w-6 h-6 bg-red-500/20 rounded-full flex items-center justify-center text-red-400 text-sm font-semibold">
                      {index + 1}
                    </span>
                    <span className="text-muted-foreground">{mistake}</span>
                  </div>
                ))}
              </div>
            </motion.section>

            {/* Section 8 - Timeline */}
            <motion.section
              id="section-8"
              className="mb-16"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <Clock className="w-8 h-8 text-primary" />
                Step-by-Step Challenge Timeline
              </h2>
              <div className="space-y-4">
                {[
                  { week: 'Week 1', title: 'Foundation', tasks: ['Start challenge with 0.5-1% risk per trade', 'Focus on 1-2 quality trades per day', 'Target 3-4% profit by end of week'] },
                  { week: 'Week 2', title: 'Build Momentum', tasks: ['Maintain consistent risk management', 'Hit 6-7% profit (if Phase 1)', 'Pass Phase 1 by day 10-14'] },
                  { week: 'Week 3', title: 'Phase 2 Start', tasks: ['Begin verification phase', 'Lower risk to 0.5% per trade', 'Focus on consistency over speed'] },
                  { week: 'Week 4', title: 'Completion', tasks: ['Hit 5% profit target', 'Pass verification', 'Receive funded account'] },
                ].map((phase, index) => (
                  <div key={phase.week} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold">
                        {index + 1}
                      </div>
                      {index < 3 && <div className="w-0.5 h-full bg-primary/30 my-2" />}
                    </div>
                    <div className="glass-card p-5 rounded-xl flex-1 mb-2">
                      <span className="text-primary text-sm font-semibold">{phase.week}</span>
                      <h3 className="font-semibold text-lg mb-2">{phase.title}</h3>
                      <ul className="space-y-1">
                        {phase.tasks.map((task) => (
                          <li key={task} className="text-sm text-muted-foreground flex items-center gap-2">
                            <CheckCircle2 className="w-3 h-3 text-green-500" />
                            {task}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>

            {/* Section 9 - FAQ */}
            <motion.section
              id="section-9"
              className="mb-16"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <Lightbulb className="w-8 h-8 text-yellow-500" />
                Frequently Asked Questions
              </h2>
              <div className="space-y-4">
                {[
                  {
                    q: 'How long does it take to pass a prop firm challenge?',
                    a: 'Most traders pass in 10-30 trading days. With proper risk management and a solid strategy, many complete Phase 1 within 2 weeks and Phase 2 within 1-2 additional weeks.',
                  },
                  {
                    q: 'What is the average success rate for prop firm challenges?',
                    a: 'The industry average is around 5-10%. However, traders using AI-powered tools and proper risk management achieve success rates of 78% or higher with TraderEdge Pro.',
                  },
                  {
                    q: 'Can I use AI trading signals to pass prop firm challenges?',
                    a: 'Yes! Using AI signals is 100% compliant as long as you manually execute trades. TraderEdge Pro provides signals you review and execute yourself.',
                  },
                  {
                    q: 'What is the best prop firm for beginners?',
                    a: 'FTMO and Funding Pips are excellent choices for beginners due to clear rules, reasonable targets, and good support.',
                  },
                  {
                    q: 'How much money do I need to start?',
                    a: 'Challenge fees range from $50 for smaller accounts to $500-$1000 for larger ones. We recommend starting with a $25K-$50K challenge ($150-$300).',
                  },
                ].map((faq) => (
                  <div key={faq.q} className="glass-card p-5 rounded-xl">
                    <h3 className="font-semibold mb-2">{faq.q}</h3>
                    <p className="text-muted-foreground text-sm">{faq.a}</p>
                  </div>
                ))}
              </div>
            </motion.section>
          </div>

          {/* CTA Section */}
          <motion.div
            className="text-center glass-card p-8 rounded-3xl bg-gradient-to-r from-primary/10 to-accent/10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold mb-4">Ready to Pass Your Prop Firm Challenge?</h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              Join 10,000+ traders who passed their challenges with TraderEdge Pro's AI-powered signals and risk management tools.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/membership">
                <Button size="lg" className="btn-glow">
                  Start Free Trial <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link to="/prop-comparison">
                <Button size="lg" variant="outline">
                  Compare Prop Firms
                </Button>
              </Link>
            </div>
          </motion.div>
        </article>
      </main>

      <Footer />
    </div>
  );
};

export default HowToPassPropFirmPage;
