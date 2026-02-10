import { motion } from 'framer-motion';
import { ArrowRight, Shield, Users, Zap, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const stats = [
  { value: '24/7', label: 'AI Monitoring', icon: Zap },
  { value: '100%', label: 'Rule Compliance', icon: Shield },
  { value: '10K+', label: 'Active Traders', icon: Users },
  { value: 'Pro', label: 'Grade System', icon: Target },
];

const values = [
  {
    title: 'Precision',
    description: 'Every signal is carefully analyzed for maximum accuracy.',
  },
  {
    title: 'Community',
    description: 'We believe in lifting each other up through shared knowledge.',
  },
  {
    title: 'Excellence',
    description: 'We continuously improve our systems and strategies.',
  },
  {
    title: 'Accessibility',
    description: 'Professional trading tools for everyone, everywhere.',
  },
];

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white overflow-hidden">
      {/* Ambient background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-0 w-[500px] h-[500px] bg-purple-500/8 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[120px]" />
      </div>

      <Header />

      {/* Hero - Left aligned, compact */}
      <section className="relative pt-32 md:pt-40 pb-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300/80 mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                About Us
              </span>

              <h1 className="text-4xl sm:text-5xl md:text-6xl tracking-tight leading-[1.15] mb-5">
                <span className="font-light text-white/50">Built by</span>{' '}
                <span className="font-semibold italic bg-gradient-to-r from-purple-400 to-purple-200 bg-clip-text text-transparent">traders,</span>
                <br />
                <span className="font-light text-white/50">for</span>{' '}
                <span className="font-semibold italic bg-gradient-to-r from-purple-400 to-purple-200 bg-clip-text text-transparent">traders.</span>
              </h1>

              <p className="text-base md:text-lg text-white/40 max-w-xl leading-relaxed font-light">
                We're on a mission to give every trader the{' '}
                <span className="text-white/60 font-normal">discipline</span>,{' '}
                <span className="text-white/60 font-normal">tools</span>, and{' '}
                <span className="text-white/60 font-normal">structure</span>{' '}
                that institutions use.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats - Compact row */}
      <section className="relative py-12 px-6 border-y border-white/[0.06]">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08, duration: 0.4 }}
                className="flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                  <stat.icon className="w-4 h-4 text-purple-400/60" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-white">{stat.value}</p>
                  <p className="text-xs text-white/30 font-light">{stat.label}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Story - Two column layout */}
      <section className="relative py-20 md:py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-[200px_1fr] gap-8 md:gap-16">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <span className="text-xs font-medium tracking-[0.2em] uppercase text-white/20">
                Our Story
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-2xl"
            >
              <div className="space-y-6 text-base md:text-lg text-white/40 leading-relaxed font-light">
                <p>
                  TraderEdge was born from{' '}
                  <span className="italic bg-gradient-to-r from-purple-400 to-purple-300 bg-clip-text text-transparent font-medium">frustration</span>.
                  As professional traders, we saw countless retail traders fail not because of lack of skill,
                  but because they didn't have access to the same discipline systems that institutions use.
                </p>
                <p>
                  We founded TraderEdge with a simple mission:{' '}
                  <span className="italic bg-gradient-to-r from-purple-400 to-purple-200 bg-clip-text text-transparent font-medium">
                    level the playing field
                  </span>.
                  By combining cutting-edge AI with years of trading experience, we've built a platform
                  that gives every trader an edge.
                </p>
                <p>
                  Today, we serve{' '}
                  <span className="text-white/70 font-normal">thousands of traders</span>{' '}
                  worldwide, helping them achieve{' '}
                  <span className="italic bg-gradient-to-r from-purple-400 to-purple-300 bg-clip-text text-transparent font-medium">
                    consistent profitability
                  </span>.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values - Grid with label */}
      <section className="relative py-20 md:py-28 px-6 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-[200px_1fr] gap-8 md:gap-16">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <span className="text-xs font-medium tracking-[0.2em] uppercase text-white/20">
                Our Values
              </span>
            </motion.div>

            <div className="grid sm:grid-cols-2 gap-4">
              {values.map((value, index) => (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08, duration: 0.4 }}
                  className="p-6 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-purple-500/20 hover:bg-white/[0.03] transition-all duration-300"
                >
                  <h3 className="text-lg font-medium text-white mb-2">{value.title}</h3>
                  <p className="text-sm text-white/30 leading-relaxed font-light">{value.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA - Compact */}
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
                <span className="font-light text-white/50">Ready to trade with</span>{' '}
                <span className="font-semibold italic bg-gradient-to-r from-purple-400 to-purple-200 bg-clip-text text-transparent">discipline?</span>
              </h2>
              <p className="text-sm text-white/30 font-light">
                Join thousands of traders who trust TraderEdge Pro.
              </p>
            </div>
            <Button
              asChild
              size="lg"
              className="rounded-full px-8 bg-purple-500 hover:bg-purple-400 text-white font-medium shrink-0"
            >
              <Link to="/auth">
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

export default AboutPage;
