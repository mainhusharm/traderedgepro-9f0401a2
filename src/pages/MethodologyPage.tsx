import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Shield,
  Brain,
  Target,
  TrendingUp,
  Clock,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  Layers,
  Filter,
  Gauge,
  Lock
} from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';

const MethodologyPage = () => {
  const principles = [
    {
      icon: Filter,
      title: "Quality Over Quantity",
      description: "We don't send 20 signals a day. We send 2-4. Every signal must pass our multi-layer validation before reaching you. Most services optimize for volume. We optimize for precision."
    },
    {
      icon: Shield,
      title: "Risk-First Architecture",
      description: "Every signal comes with pre-calculated position sizes based on YOUR account rules. We factor in your current drawdown, daily limits, and prop firm constraints before you even see the trade."
    },
    {
      icon: Clock,
      title: "Session-Aware Analysis",
      description: "Markets behave differently during London vs New York vs Asian sessions. Our system understands session dynamics, liquidity patterns, and optimal entry windows for each time zone."
    },
    {
      icon: Layers,
      title: "Multi-Timeframe Confluence",
      description: "Signals require alignment across multiple timeframes. A setup on the 15-minute chart means nothing if the 4-hour and daily are in conflict. We wait for confluence."
    }
  ];

  const process = [
    {
      step: "01",
      title: "Market Structure Analysis",
      description: "We identify the current market regime — trending, ranging, or transitional. This determines which setups are valid and which to avoid.",
      detail: "Different market conditions require different approaches. We don't force trades in unfavorable conditions."
    },
    {
      step: "02",
      title: "Key Level Identification",
      description: "Institutional levels, liquidity zones, and high-probability reaction points are mapped before any signal is considered.",
      detail: "These aren't arbitrary lines. They're levels where significant market participants are likely to act."
    },
    {
      step: "03",
      title: "Entry Validation",
      description: "A potential setup must meet strict criteria before becoming a signal. Most setups are rejected at this stage.",
      detail: "We look for confirmation patterns, volume analysis, and timing alignment. Patience is built into the system."
    },
    {
      step: "04",
      title: "Risk Calibration",
      description: "Position sizing is calculated specifically for your account size, risk tolerance, and current prop firm standing.",
      detail: "No generic lot sizes. Every recommendation is personalized to your specific situation."
    }
  ];

  const differentiators = [
    {
      title: "We Show Our Reasoning",
      description: "Every signal includes the analysis behind it. You understand WHY, not just what. This builds your own trading intuition over time."
    },
    {
      title: "Prop Firm Rule Integration",
      description: "Our system knows the rules of major prop firms. It won't let you take a trade that would violate your challenge parameters."
    },
    {
      title: "Psychology Guardrails",
      description: "After a loss, the system adjusts. After a win streak, it reminds you to stay disciplined. It's designed to counteract human behavioral patterns."
    },
    {
      title: "Continuous Refinement",
      description: "Our methodology evolves based on market conditions and aggregated performance data. What worked in 2024 may not work in 2026. We adapt."
    }
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-40 left-1/4 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[120px]" />
      </div>

      <Header />

      {/* Hero Section */}
      <section className="relative pt-32 md:pt-40 pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300/80 mb-6">
              <Brain className="w-3.5 h-3.5" />
              Our Approach
            </span>

            <h1 className="text-4xl sm:text-5xl md:text-6xl tracking-tight leading-[1.1] mb-6">
              <span className="font-light text-white/50">Built for discipline,</span>
              <br />
              <span className="font-semibold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">not impulse.</span>
            </h1>

            <p className="text-lg text-white/40 max-w-2xl leading-relaxed font-light mb-8">
              TraderEdge Pro isn't a prediction engine. It's a decision-support system designed to keep you
              disciplined when markets try to make you emotional.
            </p>

            <div className="flex flex-wrap gap-4">
              <Button asChild size="lg" className="rounded-full bg-indigo-500 hover:bg-indigo-400 text-white">
                <Link to="/membership">
                  See Plans
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full border-white/20 text-white hover:bg-white/5">
                <Link to="/case-studies">
                  View Results
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Core Principles */}
      <section className="relative py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-light text-white mb-4">
              Core Principles
            </h2>
            <p className="text-white/40 max-w-xl">
              The foundation of everything we build. These aren't features — they're non-negotiables.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {principles.map((principle, index) => (
              <motion.div
                key={principle.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-4">
                  <principle.icon className="w-6 h-6 text-indigo-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{principle.title}</h3>
                <p className="text-white/50 leading-relaxed">{principle.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* The Process */}
      <section className="relative py-20 px-6 bg-gradient-to-b from-transparent via-indigo-500/[0.02] to-transparent">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-light text-white mb-4">
              From Analysis to Signal
            </h2>
            <p className="text-white/40 max-w-xl">
              Every signal goes through this process. No shortcuts, no exceptions.
            </p>
          </motion.div>

          <div className="space-y-8">
            {process.map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex gap-6"
              >
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center">
                    <span className="text-2xl font-bold text-indigo-400">{item.step}</span>
                  </div>
                </div>
                <div className="flex-1 pt-2">
                  <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-white/60 mb-2">{item.description}</p>
                  <p className="text-sm text-white/40 italic">{item.detail}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* What Makes Us Different */}
      <section className="relative py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-light text-white mb-4">
              What Makes This Different
            </h2>
            <p className="text-white/40 max-w-xl">
              Not better predictions. Better decisions.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {differentiators.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex gap-4"
              >
                <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-white/50">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Important Note */}
      <section className="relative py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-8 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20"
          >
            <div className="flex gap-4">
              <Lock className="w-6 h-6 text-amber-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">A Note on Transparency</h3>
                <p className="text-white/60 leading-relaxed">
                  We intentionally don't publish our exact algorithmic logic or specific indicator combinations.
                  This protects the edge for our members. What we do share is the philosophy, the process,
                  and most importantly — the reasoning behind every signal you receive.
                </p>
                <p className="text-white/60 leading-relaxed mt-3">
                  You'll always understand <span className="text-white">why</span> a trade makes sense,
                  even if the underlying technical analysis remains proprietary.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-light text-white mb-4">
              Ready to trade with discipline?
            </h2>
            <p className="text-white/40 mb-8">
              Start your 7-day free trial. No credit card required.
            </p>
            <Button asChild size="lg" className="rounded-full bg-white text-black hover:bg-white/90 px-8">
              <Link to="/membership">
                Get Started
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default MethodologyPage;
