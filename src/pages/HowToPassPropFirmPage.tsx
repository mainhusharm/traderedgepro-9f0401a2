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
  Brain,
  Sparkles
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
          text: 'Most traders pass prop firm challenges in 10-30 trading days.',
        },
      },
      {
        '@type': 'Question',
        name: 'What is the average success rate for prop firm challenges?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'The industry average success rate is around 5-10%.',
        },
      },
    ],
  };

  const howToSchema = {
    '@type': 'HowTo',
    name: 'How to Pass Prop Firm Challenges in 2026',
    description: 'A comprehensive guide to passing proprietary trading firm challenges.',
    totalTime: 'P30D',
  };

  return (
    <div className="min-h-screen bg-[#020202]">
      <SEO
        title="How to Pass Prop Firm Challenges in 2026 (Complete Guide)"
        description="Learn proven strategies to pass FTMO, Funding Pips, and other prop firm challenges."
        keywords="how to pass prop firm challenges, prop firm challenge 2026, pass FTMO challenge"
        canonicalUrl="https://traderedgepro.com/how-to-pass-prop-firm-challenges"
        schema={[faqSchema, howToSchema]}
      />

      <Header />

      <main className="pt-32 pb-20">
        <article className="max-w-4xl mx-auto px-6">
          {/* Hero */}
          <motion.header
            className="mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm mb-8 border border-primary/20"
            >
              <BookOpen className="w-4 h-4" />
              Complete Guide for 2026
            </motion.div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-[1.1]">
              How to Pass Prop Firm
              <br />
              <span className="bg-gradient-to-r from-primary via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Challenges in 2026
              </span>
            </h1>

            <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
              The definitive guide to getting funded. Learn the exact strategies and discipline systems that help traders pass their challenges.
            </p>

            <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                15 min read
              </span>
              <span>Updated January 2026</span>
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
              { label: 'Active Community', value: 'Growing', gradient: 'from-primary to-purple-500' },
              { label: 'Rule Compliance', value: '100%', gradient: 'from-green-500 to-emerald-500' },
              { label: 'AI Monitoring', value: '24/7', gradient: 'from-cyan-500 to-blue-500' },
              { label: 'Discipline System', value: 'Pro-Grade', gradient: 'from-amber-500 to-orange-500' },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                className="relative group"
              >
                <div className={`absolute -inset-[1px] rounded-2xl bg-gradient-to-r ${stat.gradient} opacity-30 group-hover:opacity-50 transition-opacity`} />
                <div className="relative bg-[#0a0a0a] rounded-2xl p-4 text-center">
                  <p className={`text-xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}>{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Table of Contents */}
          <motion.nav
            className="mb-16 relative"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-r from-primary via-purple-500 to-pink-500 opacity-20" />
            <div className="relative bg-[#0a0a0a] rounded-3xl p-8">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold">Table of Contents</span>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                {[
                  'What is a Prop Firm Challenge?',
                  'Why Most Traders Fail',
                  'Choosing the Right Firm',
                  'Risk Management Blueprint',
                  'Using AI to Pass Faster',
                  'Step-by-Step Timeline',
                ].map((item, index) => (
                  <a
                    key={item}
                    href={`#section-${index + 1}`}
                    className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors p-2 rounded-lg hover:bg-white/5"
                  >
                    <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-1 rounded">0{index + 1}</span>
                    <span className="text-sm">{item}</span>
                  </a>
                ))}
              </div>
            </div>
          </motion.nav>

          {/* Content Sections */}
          <div className="space-y-20">
            {/* Section 1 */}
            <motion.section
              id="section-1"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center shadow-lg">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold">What is a Prop Firm Challenge?</h2>
              </div>

              <div className="relative mb-8">
                <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-primary to-purple-500 opacity-20" />
                <div className="relative bg-[#0a0a0a] rounded-2xl p-6">
                  <p className="text-muted-foreground leading-relaxed">
                    A <strong className="text-foreground">prop firm challenge</strong> is an evaluation process used by proprietary trading firms to identify skilled traders. Instead of risking your own capital, you trade the firm's money after proving your abilities.
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { title: 'Phase 1: Evaluation', items: ['Profit target: 8-10%', 'Daily drawdown: 4-5%', 'Total drawdown: 8-12%', 'Min trading days: 3-5'], gradient: 'from-cyan-500 to-blue-500' },
                  { title: 'Phase 2: Verification', items: ['Profit target: 4-5%', 'Same drawdown rules', 'Time: 60 days or unlimited', 'Upon passing: Funded account'], gradient: 'from-green-500 to-emerald-500' },
                ].map((phase) => (
                  <div key={phase.title} className="relative group">
                    <div className={`absolute -inset-[1px] rounded-2xl bg-gradient-to-r ${phase.gradient} opacity-30 group-hover:opacity-50 transition-opacity`} />
                    <div className="relative bg-[#0a0a0a] rounded-2xl p-6">
                      <h3 className={`font-semibold bg-gradient-to-r ${phase.gradient} bg-clip-text text-transparent mb-4`}>{phase.title}</h3>
                      <ul className="space-y-3 text-sm">
                        {phase.items.map((item) => (
                          <li key={item} className="flex items-center gap-2 text-muted-foreground">
                            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>

            {/* Section 2 */}
            <motion.section
              id="section-2"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold">Why Most Traders Fail</h2>
              </div>

              <p className="text-muted-foreground mb-8 leading-relaxed">
                The harsh reality: <strong className="text-foreground">90-95% of traders fail prop firm challenges</strong>. But most failures are due to preventable mistakes.
              </p>

              <div className="space-y-4">
                {[
                  { title: 'Over-Trading', problem: 'Rushing to hit targets', solution: 'Focus on 2-3 quality trades per day' },
                  { title: 'Poor Risk Management', problem: 'Risking too much per trade', solution: 'Never risk more than 1-2%' },
                  { title: 'Ignoring Drawdown Rules', problem: 'Focusing only on profits', solution: 'Set alerts at 50% of limits' },
                  { title: 'Emotional Trading', problem: 'Revenge trading after losses', solution: 'Stop after 2 consecutive losses' },
                ].map((item, index) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="relative group"
                  >
                    <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 opacity-20 group-hover:opacity-40 transition-opacity" />
                    <div className="relative bg-[#0a0a0a] rounded-2xl p-6">
                      <h3 className="font-semibold mb-4">{item.title}</h3>
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-start gap-2 text-red-400">
                          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                          <span>{item.problem}</span>
                        </div>
                        <div className="flex items-start gap-2 text-green-400">
                          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                          <span>{item.solution}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>

            {/* Section 3 */}
            <motion.section
              id="section-3"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold">Choosing the Right Firm</h2>
              </div>

              <div className="relative mb-8">
                <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 opacity-20" />
                <div className="relative bg-[#0a0a0a] rounded-2xl p-6 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-left">
                        <th className="py-4 pr-4 font-medium text-muted-foreground">Firm</th>
                        <th className="py-4 pr-4 font-medium text-muted-foreground">Target</th>
                        <th className="py-4 pr-4 font-medium text-muted-foreground">Drawdown</th>
                        <th className="py-4 font-medium text-muted-foreground">Split</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { name: 'FTMO', target: '10% / 5%', drawdown: '5% / 10%', split: '80-90%' },
                        { name: 'Funding Pips', target: '8% / 5%', drawdown: '5% / 10%', split: '80-90%' },
                        { name: 'True Forex Funds', target: '8% / 4%', drawdown: '4% / 8%', split: '80%' },
                      ].map((firm) => (
                        <tr key={firm.name} className="border-b border-white/5">
                          <td className="py-4 pr-4 font-medium">{firm.name}</td>
                          <td className="py-4 pr-4 text-muted-foreground">{firm.target}</td>
                          <td className="py-4 pr-4 text-muted-foreground">{firm.drawdown}</td>
                          <td className="py-4 text-cyan-400 font-medium">{firm.split}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                <strong className="text-cyan-400">Tip:</strong> Start with a smaller account ($25K-$50K) to reduce pressure.{' '}
                <Link to="/prop-comparison" className="text-primary hover:underline">
                  Compare all prop firms →
                </Link>
              </p>
            </motion.section>

            {/* Section 4 */}
            <motion.section
              id="section-4"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold">Risk Management Blueprint</h2>
              </div>

              <div className="relative mb-8">
                <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 opacity-30" />
                <div className="relative bg-[#0a0a0a] rounded-2xl p-6">
                  <h3 className="font-semibold mb-4">The 1% Rule</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Never risk more than 1% of your account on a single trade. For a $100,000 account, your maximum loss per trade is $1,000.
                  </p>
                  <div className="p-4 rounded-xl bg-white/5 font-mono text-sm border border-white/10">
                    <span className="text-muted-foreground">Lot Size = </span>
                    <span className="text-green-400">(Account × Risk%) ÷ (SL in Pips × Pip Value)</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { value: '2%', label: 'Daily Loss Limit', gradient: 'from-red-500 to-rose-500' },
                  { value: '2-3', label: 'Max Open Trades', gradient: 'from-amber-500 to-orange-500' },
                  { value: '1:2+', label: 'Risk:Reward', gradient: 'from-green-500 to-emerald-500' },
                  { value: '2-3%', label: 'Weekly Target', gradient: 'from-cyan-500 to-blue-500' },
                ].map((rule) => (
                  <div key={rule.label} className="relative group">
                    <div className={`absolute -inset-[1px] rounded-2xl bg-gradient-to-r ${rule.gradient} opacity-30 group-hover:opacity-50 transition-opacity`} />
                    <div className="relative bg-[#0a0a0a] rounded-2xl p-4 text-center">
                      <p className={`text-2xl font-bold bg-gradient-to-r ${rule.gradient} bg-clip-text text-transparent mb-1`}>{rule.value}</p>
                      <p className="text-xs text-muted-foreground">{rule.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>

            {/* Section 5 */}
            <motion.section
              id="section-5"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-lg">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold">Using AI to Pass Faster</h2>
              </div>

              <div className="grid md:grid-cols-3 gap-4 mb-8">
                {[
                  { icon: TrendingUp, title: 'Pattern Recognition', desc: 'Analyzes thousands of chart patterns', gradient: 'from-cyan-500 to-blue-500' },
                  { icon: Shield, title: 'Risk Protection', desc: 'Automated drawdown monitoring', gradient: 'from-green-500 to-emerald-500' },
                  { icon: Lightbulb, title: 'Emotion Removal', desc: 'AI signals remove fear and greed', gradient: 'from-amber-500 to-orange-500' },
                ].map((benefit) => (
                  <div key={benefit.title} className="relative group">
                    <div className={`absolute -inset-[1px] rounded-2xl bg-gradient-to-r ${benefit.gradient} opacity-30 group-hover:opacity-50 transition-opacity`} />
                    <div className="relative bg-[#0a0a0a] rounded-2xl p-6">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${benefit.gradient} flex items-center justify-center mb-4 shadow-lg`}>
                        <benefit.icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="font-semibold mb-2">{benefit.title}</h3>
                      <p className="text-sm text-muted-foreground">{benefit.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA Box */}
              <div className="relative">
                <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-r from-primary via-purple-500 to-pink-500 opacity-50" />
                <div className="absolute -inset-4 rounded-3xl bg-primary/20 blur-2xl" />
                <div className="relative bg-gradient-to-b from-primary/10 to-[#0a0a0a] rounded-3xl p-8">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center shrink-0 shadow-lg">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">TraderEdge Pro: Your AI Advantage</h3>
                      <p className="text-muted-foreground text-sm mb-4">
                        Our AI analyzes market structure and institutional order flow to deliver high-probability signals while enforcing discipline.
                      </p>
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button asChild className="bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 shadow-lg shadow-primary/25">
                          <Link to="/membership">
                            Start Free Trial <ArrowRight className="w-4 h-4 ml-2" />
                          </Link>
                        </Button>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>

            {/* Section 6 */}
            <motion.section
              id="section-6"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center shadow-lg">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold">Step-by-Step Timeline</h2>
              </div>

              <div className="space-y-6">
                {[
                  { week: 'Week 1-2', title: 'Phase 1', tasks: ['0.5-1% risk per trade', '1-2 quality trades per day', 'Hit 8-10% profit target'], gradient: 'from-cyan-500 to-blue-500' },
                  { week: 'Week 3-4', title: 'Phase 2', tasks: ['Lower risk to 0.5%', 'Focus on consistency', 'Hit 4-5% profit target'], gradient: 'from-green-500 to-emerald-500' },
                ].map((phase, index) => (
                  <motion.div
                    key={phase.week}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex gap-6"
                  >
                    <div className="flex flex-col items-center">
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${phase.gradient} flex items-center justify-center text-white font-bold shadow-lg`}>
                        {index + 1}
                      </div>
                      {index < 1 && <div className="w-px h-full bg-white/10 my-2" />}
                    </div>
                    <div className="flex-1 pb-6">
                      <span className={`text-xs font-medium tracking-widest uppercase bg-gradient-to-r ${phase.gradient} bg-clip-text text-transparent`}>{phase.week}</span>
                      <h3 className="font-semibold text-lg mb-3">{phase.title}</h3>
                      <div className="relative">
                        <div className={`absolute -inset-[1px] rounded-xl bg-gradient-to-r ${phase.gradient} opacity-20`} />
                        <div className="relative bg-[#0a0a0a] rounded-xl p-4">
                          <ul className="space-y-2">
                            {phase.tasks.map((task) => (
                              <li key={task} className="text-sm text-muted-foreground flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                                {task}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          </div>

          {/* Final CTA */}
          <motion.div
            className="mt-20"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="relative">
              <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-r from-primary via-purple-500 to-pink-500 opacity-50" />
              <div className="absolute -inset-4 rounded-3xl bg-primary/20 blur-3xl" />
              <div className="relative bg-gradient-to-b from-primary/10 to-[#0a0a0a] rounded-3xl p-8 md:p-12">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold mb-2">
                      Ready to pass your challenge?
                    </h2>
                    <p className="text-muted-foreground">
                      Join traders who trust TraderEdge Pro for discipline and consistency.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button asChild size="lg" className="h-12 px-8 bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 shadow-lg shadow-primary/25">
                        <Link to="/membership">
                          Start Free Trial
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Link>
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button asChild size="lg" variant="outline" className="h-12 px-8 border-white/20 hover:border-primary/50">
                        <Link to="/prop-comparison">
                          Compare Firms
                        </Link>
                      </Button>
                    </motion.div>
                  </div>
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

export default HowToPassPropFirmPage;
