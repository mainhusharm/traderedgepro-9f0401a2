import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Bot, ArrowUpRight, Code, Shield, Zap, Lock, Brain, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MT5BotsSection = () => {
  const features = [
    {
      icon: Brain,
      title: 'Proprietary AI Engine',
      description: 'Technology that exists nowhere else. Built over years of research.',
    },
    {
      icon: Code,
      title: 'Full Source Code',
      description: 'Complete MQL5 ownership. No subscriptions. No vendor lock-in.',
    },
    {
      icon: Shield,
      title: 'Institutional-Grade Risk',
      description: 'Professional position sizing and drawdown protection built-in.',
    },
    {
      icon: Zap,
      title: '7-Day Delivery',
      description: 'From your strategy to working bot in one week.',
    },
  ];

  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background accent */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/[0.02] to-transparent" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 mb-6">
              <Bot className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-purple-300/80 font-medium">Secondary Platform</span>
            </div>

            <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-white mb-4">
              Custom MT5 Bots
            </h2>
            <p className="text-xl text-purple-400 font-light italic mb-6">
              Your strategy, professionally built.
            </p>

            <p className="text-white/50 leading-relaxed mb-4">
              Beyond signals, we offer a separate service: custom MT5 Expert Advisor development.
              Using proprietary technology developed over years, we transform your trading strategy
              into precision-engineered automated systems.
            </p>

            <p className="text-white/40 text-sm leading-relaxed mb-8">
              This isn't template-based development. Each bot is uniquely crafted using our
              AI-powered code generation engine — technology that cannot be replicated.
            </p>

            {/* CTA */}
            <div className="flex flex-wrap gap-4">
              <Button
                asChild
                className="rounded-full px-6 bg-purple-500 hover:bg-purple-400 text-white group"
              >
                <Link to="/mt5-bots">
                  Explore MT5 Bots
                  <ArrowUpRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </Button>
              <div className="flex items-center gap-2 text-sm text-white/40">
                <Lock className="w-4 h-4" />
                <span>$299 one-time</span>
              </div>
            </div>
          </motion.div>

          {/* Right - Features Grid */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-2 gap-4"
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-purple-500/20 transition-all duration-300 group"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4 group-hover:bg-purple-500/20 transition-colors">
                  <feature.icon className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="text-sm font-semibold text-white mb-1.5">{feature.title}</h3>
                <p className="text-xs text-white/40 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}

            {/* Stats overlay */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.7 }}
              className="col-span-2 p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-transparent border border-purple-500/20"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-2xl font-semibold text-purple-400">500+</p>
                    <p className="text-xs text-white/40">Bots Delivered</p>
                  </div>
                  <div className="w-px h-10 bg-white/10" />
                  <div>
                    <p className="text-2xl font-semibold text-purple-400">98%</p>
                    <p className="text-xs text-white/40">Satisfaction</p>
                  </div>
                  <div className="w-px h-10 bg-white/10" />
                  <div>
                    <p className="text-2xl font-semibold text-purple-400">24/7</p>
                    <p className="text-xs text-white/40">Automation</p>
                  </div>
                </div>
                <Sparkles className="w-6 h-6 text-purple-500/30" />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default MT5BotsSection;
