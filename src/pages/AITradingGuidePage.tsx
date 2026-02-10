import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Brain,
  Zap,
  Shield,
  TrendingUp,
  Target,
  BarChart3,
  Clock,
  CheckCircle2,
  ArrowRight,
  Bot,
  LineChart,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import SEO from '@/components/common/SEO';

const AITradingGuidePage = () => {
  const faqSchema = {
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Can AI really help pass prop firm challenges?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, AI trading tools can significantly improve your chances of passing prop firm challenges by removing emotional bias and ensuring consistent risk management.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is using AI trading signals allowed by prop firms?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, using AI trading signals is 100% compliant with all major prop firm rules as long as you manually execute trades.',
        },
      },
    ],
  };

  const articleSchema = {
    '@type': 'Article',
    headline: 'AI Trading for Prop Firms: How to Use AI to Pass Your Challenge',
    description: 'Learn how AI trading signals can help you pass prop firm challenges faster.',
    author: { '@type': 'Organization', name: 'TraderEdge Pro' },
    datePublished: '2026-01-15',
  };

  return (
    <div className="min-h-screen bg-[#020202]">
      <SEO
        title="AI Trading for Prop Firms: Pass Your Challenge with AI Signals"
        description="Discover how AI trading can help you pass prop firm challenges. Automated risk management and disciplined execution."
        keywords="ai trading prop firm, ai to pass prop firm challenges, ai trading signals"
        canonicalUrl="https://traderedgepro.com/ai-prop-firm-trading"
        schema={[faqSchema, articleSchema]}
      />

      <Header />

      <main className="pt-32 pb-20">
        <article className="container mx-auto px-6 max-w-4xl">
          {/* Hero */}
          <motion.header
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 rounded-full text-purple-400 text-sm mb-8 border border-purple-500/20"
            >
              <Brain className="w-4 h-4" />
              AI-Powered Trading
            </motion.div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Use{' '}
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-primary bg-clip-text text-transparent">
                AI Trading
              </span>{' '}
              to Pass Prop Firm Challenges
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              How artificial intelligence is revolutionizing prop firm trading. Get AI-powered signals, automated risk management, and disciplined execution.
            </p>

            <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                12 min read
              </span>
              <span>Pro-Grade System</span>
            </div>
          </motion.header>

          {/* AI vs Manual Comparison */}
          <motion.section
            className="mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="text-2xl font-bold mb-6 text-center">AI Trading vs Manual Trading</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Manual Trading */}
              <div className="relative group">
                <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-red-500 to-rose-500 opacity-30 group-hover:opacity-50 transition-opacity" />
                <div className="relative bg-[#0a0a0a] rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center shadow-lg">
                      <AlertTriangle className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-semibold text-lg">Manual Trading Challenges</h3>
                  </div>
                  <ul className="space-y-3">
                    {[
                      'Emotional decision making (fear, greed, FOMO)',
                      'Limited analysis speed and capacity',
                      'Inconsistent execution and discipline',
                      'Unable to monitor markets 24/7',
                      'Subjective pattern recognition',
                      'Average 5-10% challenge pass rate',
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="w-1.5 h-1.5 bg-red-400 rounded-full mt-2 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* AI Trading */}
              <div className="relative group">
                <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 opacity-30 group-hover:opacity-50 transition-opacity" />
                <div className="relative bg-[#0a0a0a] rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
                      <Brain className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-semibold text-lg">AI Trading Advantages</h3>
                  </div>
                  <ul className="space-y-3">
                    {[
                      'Emotion-free, data-driven decisions',
                      'Analyzes thousands of data points instantly',
                      'Consistent execution with clear rules',
                      'Monitors all pairs across all sessions',
                      'Pattern recognition across multiple timeframes',
                      'Discipline-first approach with TraderEdge Pro',
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </motion.section>

          {/* How AI Trading Works */}
          <motion.section
            className="mb-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold mb-6">How AI Trading Works for Prop Firms</h2>
            <p className="text-muted-foreground leading-relaxed mb-8">
              AI trading systems use machine learning to analyze market data and identify high-probability opportunities. Here's how TraderEdge Pro's AI works:
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { icon: LineChart, title: 'Multi-Timeframe Analysis', desc: 'AI scans H4, H1, M15, and M5 charts simultaneously.', gradient: 'from-cyan-500 to-blue-500' },
                { icon: Target, title: 'Institutional Order Flow', desc: 'Detects large institutional positions and liquidity zones.', gradient: 'from-primary to-purple-500' },
                { icon: BarChart3, title: 'Pattern Recognition', desc: 'Identifies chart patterns and candlestick formations.', gradient: 'from-green-500 to-emerald-500' },
                { icon: Shield, title: 'Risk Calculation', desc: 'Calculates optimal position sizes and stop losses.', gradient: 'from-amber-500 to-orange-500' },
                { icon: Zap, title: 'Real-Time Signals', desc: 'Delivers signals in milliseconds when setups meet criteria.', gradient: 'from-violet-500 to-purple-500' },
                { icon: Bot, title: 'Confidence Scoring', desc: 'Each signal includes a confidence score based on confluence.', gradient: 'from-pink-500 to-rose-500' },
              ].map((feature) => (
                <motion.div
                  key={feature.title}
                  whileHover={{ y: -5 }}
                  className="relative group"
                >
                  <div className={`absolute -inset-[1px] rounded-2xl bg-gradient-to-r ${feature.gradient} opacity-30 group-hover:opacity-50 transition-opacity`} />
                  <div className="relative bg-[#0a0a0a] rounded-2xl p-6 h-full">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 shadow-lg`}>
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* AI Signal Example */}
          <motion.section
            className="mb-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold mb-6">What AI Trading Signals Look Like</h2>
            <p className="text-muted-foreground mb-6">
              Every TraderEdge Pro signal comes with complete trade details and AI reasoning:
            </p>

            <div className="relative">
              <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 opacity-40" />
              <div className="relative bg-[#0a0a0a] rounded-3xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                      <TrendingUp className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">SIGNAL</span>
                      <h3 className="font-bold text-xl">EUR/USD - BUY</h3>
                    </div>
                  </div>
                  <span className="px-4 py-2 bg-primary/20 text-primary rounded-full text-sm font-semibold border border-primary/30">
                    High Confidence
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {[
                    { label: 'Entry', value: '1.0845', color: 'text-foreground' },
                    { label: 'Stop Loss', value: '1.0815', color: 'text-red-400' },
                    { label: 'Take Profit 1', value: '1.0905', color: 'text-green-400' },
                    { label: 'Risk:Reward', value: '1:2', color: 'text-primary' },
                  ].map((item) => (
                    <div key={item.label} className="bg-white/5 p-4 rounded-xl border border-white/10">
                      <span className="text-xs text-muted-foreground block mb-1">{item.label}</span>
                      <span className={`font-mono font-semibold text-lg ${item.color}`}>{item.value}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-primary/10 p-5 rounded-xl border border-primary/20">
                  <span className="text-xs text-primary font-semibold block mb-2">AI REASONING</span>
                  <p className="text-sm text-muted-foreground">
                    Bullish order block identified on H4 at 1.0840 with strong demand zone confluence. London session breakout above Asian high confirms institutional buying. RSI divergence on H1 supports continuation.
                  </p>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Why AI Works */}
          <motion.section
            className="mb-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold mb-6">Why AI is Perfect for Prop Firm Challenges</h2>
            <div className="space-y-4">
              {[
                { title: 'Consistent Risk Management', desc: 'AI never exceeds risk parameters—the #1 reason traders fail challenges.', gradient: 'from-green-500 to-emerald-500' },
                { title: 'No Emotional Trading', desc: 'Fear, greed, and FOMO are eliminated. AI executes based on data, not feelings.', gradient: 'from-cyan-500 to-blue-500' },
                { title: 'High-Probability Setups Only', desc: 'AI filters thousands of setups and only signals when confluence factors align.', gradient: 'from-primary to-purple-500' },
                { title: '24/7 Market Monitoring', desc: 'Miss no opportunities. AI monitors all pairs across all trading sessions.', gradient: 'from-amber-500 to-orange-500' },
                { title: 'Faster Learning Curve', desc: 'Each signal includes AI reasoning, teaching you why setups work.', gradient: 'from-violet-500 to-purple-500' },
              ].map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="relative group"
                >
                  <div className={`absolute -inset-[1px] rounded-2xl bg-gradient-to-r ${item.gradient} opacity-20 group-hover:opacity-40 transition-opacity`} />
                  <div className="relative bg-[#0a0a0a] rounded-2xl p-6 flex gap-4">
                    <div className={`w-12 h-12 bg-gradient-to-br ${item.gradient} rounded-xl flex items-center justify-center shrink-0 shadow-lg`}>
                      <span className="text-white font-bold">{index + 1}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Results Stats */}
          <motion.section
            className="mb-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold mb-8 text-center">Real Results from AI Trading</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { value: '24/7', label: 'AI Monitoring', gradient: 'from-cyan-500 to-blue-500' },
                { value: '100%', label: 'Rule Compliance', gradient: 'from-green-500 to-emerald-500' },
                { value: 'Pro', label: 'Grade Discipline', gradient: 'from-primary to-purple-500' },
                { value: 'Live', label: 'Risk Control', gradient: 'from-amber-500 to-orange-500' },
              ].map((stat) => (
                <div key={stat.label} className="relative group">
                  <div className={`absolute -inset-[1px] rounded-2xl bg-gradient-to-r ${stat.gradient} opacity-30 group-hover:opacity-50 transition-opacity`} />
                  <div className="relative bg-[#0a0a0a] rounded-2xl p-6 text-center">
                    <p className={`text-3xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent mb-1`}>{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>

          {/* Compliance */}
          <motion.section
            className="mb-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <div className="relative">
              <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-r from-green-500 to-emerald-500 opacity-40" />
              <div className="absolute -inset-4 rounded-3xl bg-green-500/10 blur-2xl" />
              <div className="relative bg-[#0a0a0a] rounded-3xl p-8">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shrink-0 shadow-lg">
                    <Shield className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-xl mb-2">100% Prop Firm Compliant</h3>
                    <p className="text-muted-foreground mb-4">
                      We provide AI-generated trading signals that YOU review and execute manually. This is 100% compliant with all major prop firms:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {['FTMO', 'Funding Pips', 'E8 Funding', 'True Forex Funds', 'The Funded Trader'].map((firm) => (
                        <span key={firm} className="px-3 py-1.5 bg-green-500/20 text-green-400 rounded-full text-sm border border-green-500/30">
                          {firm}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          {/* FAQ */}
          <motion.section
            className="mb-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold mb-6">AI Trading FAQs</h2>
            <div className="space-y-4">
              {[
                { q: 'Can AI really help pass prop firm challenges?', a: 'Yes! AI removes emotion, ensures consistent risk management, and identifies high-probability setups.', gradient: 'from-primary to-purple-500' },
                { q: 'Is using AI signals allowed by prop firms?', a: 'Absolutely. As long as you manually execute trades (not auto-trading), using signals is 100% compliant.', gradient: 'from-green-500 to-emerald-500' },
                { q: 'How is AI different from regular trading signals?', a: 'AI signals analyze multiple timeframes, institutional order flow, and dozens of confluence factors simultaneously.', gradient: 'from-cyan-500 to-blue-500' },
                { q: 'Do I need coding knowledge to use AI trading?', a: 'No. TraderEdge Pro delivers ready-to-execute signals with entry, stop loss, and take profit levels.', gradient: 'from-amber-500 to-orange-500' },
              ].map((faq) => (
                <div key={faq.q} className="relative group">
                  <div className={`absolute -inset-[1px] rounded-2xl bg-gradient-to-r ${faq.gradient} opacity-20 group-hover:opacity-40 transition-opacity`} />
                  <div className="relative bg-[#0a0a0a] rounded-2xl p-6">
                    <h3 className="font-semibold mb-2">{faq.q}</h3>
                    <p className="text-sm text-muted-foreground">{faq.a}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="relative">
              <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-r from-purple-500 via-primary to-pink-500 opacity-50" />
              <div className="absolute -inset-4 rounded-3xl bg-primary/20 blur-3xl" />
              <div className="relative bg-gradient-to-b from-primary/10 to-[#0a0a0a] rounded-3xl p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold mb-4">Start Trading with AI Today</h2>
                <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                  Join traders using AI-powered signals to pass their prop firm challenges. 7-day free trial, no credit card required.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button asChild size="lg" className="h-12 px-8 bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 shadow-lg shadow-primary/25">
                      <Link to="/membership">
                        Start Free Trial <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button asChild size="lg" variant="outline" className="h-12 px-8 border-white/20 hover:border-primary/50">
                      <Link to="/how-to-pass-prop-firm-challenges">
                        Read Complete Guide
                      </Link>
                    </Button>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </article>
      </main>

      <Footer />
    </div>
  );
};

export default AITradingGuidePage;
