import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { TrendingUp, Shield, Zap, BarChart3, Clock, DollarSign, Target, Layers, ArrowRight, CheckCircle2 } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';

const futuresProducts = [
  { symbol: 'ES', name: 'E-mini S&P 500', tickValue: '$12.50', margin: '$500' },
  { symbol: 'NQ', name: 'E-mini Nasdaq 100', tickValue: '$5.00', margin: '$400' },
  { symbol: 'CL', name: 'Crude Oil', tickValue: '$10.00', margin: '$300' },
  { symbol: 'GC', name: 'Gold', tickValue: '$10.00', margin: '$350' },
  { symbol: 'MES', name: 'Micro E-mini S&P', tickValue: '$1.25', margin: '$50' },
  { symbol: 'MNQ', name: 'Micro Nasdaq', tickValue: '$0.50', margin: '$40' },
];

const benefits = [
  { icon: Zap, title: 'High Leverage', description: 'Trade with leverage up to 50:1, maximizing capital efficiency' },
  { icon: Clock, title: '23/5 Market Hours', description: 'Nearly round-the-clock trading opportunities' },
  { icon: Shield, title: 'Regulated Markets', description: 'Trade on CME, NYMEX, and other regulated exchanges' },
  { icon: BarChart3, title: 'Deep Liquidity', description: 'Tight spreads and minimal slippage in major contracts' },
  { icon: DollarSign, title: 'Lower Costs', description: 'No overnight financing charges like forex or CFDs' },
  { icon: Target, title: 'Tax Benefits', description: 'Favorable 60/40 tax treatment in the United States' },
];

const signals = [
  { type: 'LONG', symbol: 'ES', entry: '4,892.50', target: '4,910.00', stop: '4,880.00', status: 'Active' },
  { type: 'SHORT', symbol: 'NQ', entry: '17,450.00', target: '17,380.00', stop: '17,490.00', status: 'Pending' },
  { type: 'LONG', symbol: 'GC', entry: '2,048.00', target: '2,065.00', stop: '2,038.00', status: 'Active' },
];

const FuturesPage = () => {
  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white overflow-hidden">
      {/* Ambient background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-0 w-[500px] h-[500px] bg-purple-500/8 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[120px]" />
      </div>

      <Header />

      {/* Hero */}
      <section className="relative pt-32 md:pt-40 pb-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300/80 mb-6">
                <TrendingUp className="w-3.5 h-3.5" />
                Futures Trading
              </span>

              <h1 className="text-4xl sm:text-5xl md:text-6xl tracking-tight leading-[1.15] mb-5">
                <span className="font-light text-white/50">Trade Futures with</span>
                <br />
                <span className="font-semibold italic bg-gradient-to-r from-purple-400 to-purple-200 bg-clip-text text-transparent">professional signals.</span>
              </h1>

              <p className="text-base md:text-lg text-white/40 max-w-xl leading-relaxed font-light mb-8">
                Get real-time futures trading signals for ES, NQ, CL, GC, and more.
                Maximize your edge in the world's most{' '}
                <span className="text-white/60 font-normal">liquid markets</span>.
              </p>

              <div className="flex flex-wrap gap-3">
                <Button asChild className="rounded-full px-6 bg-purple-500 hover:bg-purple-400 text-white font-medium">
                  <Link to="/membership">Start Trading</Link>
                </Button>
                <Button asChild variant="outline" className="rounded-full px-6 bg-transparent border-white/10 hover:border-purple-500/30 hover:bg-white/5 text-white font-normal">
                  <Link to="/features">Learn More</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Live Signals Preview */}
      <section className="relative py-16 px-6 border-y border-white/[0.06]">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-[200px_1fr] gap-8 md:gap-16">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <span className="text-xs font-medium tracking-[0.2em] uppercase text-white/20">
                Live Signals
              </span>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-4">
              {signals.map((signal, index) => (
                <motion.div
                  key={`${signal.symbol}-${index}`}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08 }}
                  className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-purple-500/20 transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        signal.type === 'LONG' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {signal.type}
                      </span>
                      <span className="text-lg font-semibold">{signal.symbol}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      signal.status === 'Active' ? 'bg-purple-500/20 text-purple-300' : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {signal.status}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white/30 font-light">Entry</span>
                      <span className="font-mono text-white/70">{signal.entry}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/30 font-light">Target</span>
                      <span className="font-mono text-green-400">{signal.target}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/30 font-light">Stop</span>
                      <span className="font-mono text-red-400">{signal.stop}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Supported Contracts */}
      <section className="relative py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-[200px_1fr] gap-8 md:gap-16">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <span className="text-xs font-medium tracking-[0.2em] uppercase text-white/20">
                Contracts
              </span>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {futuresProducts.map((product, index) => (
                <motion.div
                  key={product.symbol}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-purple-500/20 transition-all duration-300 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                      <span className="font-semibold text-purple-300 text-sm">{product.symbol}</span>
                    </div>
                    <div>
                      <p className="font-medium text-white text-sm">{product.name}</p>
                      <p className="text-xs text-white/30">Tick: {product.tickValue}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-white/30">Margin</p>
                    <p className="font-medium text-purple-300 text-sm">{product.margin}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="relative py-20 px-6 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-[200px_1fr] gap-8 md:gap-16">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <span className="text-xs font-medium tracking-[0.2em] uppercase text-white/20">
                Why Futures
              </span>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="p-6 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-purple-500/20 transition-all duration-300"
                >
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
                    <benefit.icon className="w-5 h-5 text-purple-400/80" />
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">{benefit.title}</h3>
                  <p className="text-sm text-white/30 font-light">{benefit.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features List */}
      <section className="relative py-20 px-6 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl tracking-tight mb-6">
                <span className="font-light text-white/50">Futures Trading</span>{' '}
                <span className="font-semibold italic bg-gradient-to-r from-purple-400 to-purple-200 bg-clip-text text-transparent">Features</span>
              </h2>
              <div className="space-y-4">
                {[
                  'Real-time signals for major futures contracts',
                  'AI-powered market analysis and predictions',
                  'Risk management with precise stop-loss levels',
                  'Multiple timeframe confirmation system',
                  'Economic calendar integration',
                  'Position sizing calculator for futures',
                ].map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-purple-400 shrink-0" />
                    <span className="text-white/50 font-light">{feature}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="p-6 rounded-xl bg-white/[0.02] border border-white/[0.05]"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                  <Layers className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="font-medium text-white">Multi-Contract Analysis</p>
                  <p className="text-xs text-white/30">Correlations & intermarket signals</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-white/30 font-light">ES/NQ Correlation</span>
                  <span className="text-green-400">+0.92</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/30 font-light">GC/DX Correlation</span>
                  <span className="text-red-400">-0.85</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/30 font-light">CL/ES Correlation</span>
                  <span className="text-green-400">+0.45</span>
                </div>
              </div>
            </motion.div>
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
                <span className="font-light text-white/50">Ready to trade</span>{' '}
                <span className="font-semibold italic bg-gradient-to-r from-purple-400 to-purple-200 bg-clip-text text-transparent">futures?</span>
              </h2>
              <p className="text-sm text-white/30 font-light">
                Get access to professional futures trading signals.
              </p>
            </div>
            <Button asChild className="rounded-full px-8 bg-purple-500 hover:bg-purple-400 text-white font-medium shrink-0">
              <Link to="/membership">
                Get Started Now
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

export default FuturesPage;
