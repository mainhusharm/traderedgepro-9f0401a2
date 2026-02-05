import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { TrendingUp, Shield, Zap, BarChart3, Clock, DollarSign, Target, Layers, ArrowRight, CheckCircle2 } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';

const FuturesPage = () => {
  const futuresProducts = [
    { symbol: 'ES', name: 'E-mini S&P 500', tickValue: '$12.50', margin: '$500' },
    { symbol: 'NQ', name: 'E-mini Nasdaq 100', tickValue: '$5.00', margin: '$400' },
    { symbol: 'CL', name: 'Crude Oil', tickValue: '$10.00', margin: '$300' },
    { symbol: 'GC', name: 'Gold', tickValue: '$10.00', margin: '$350' },
    { symbol: 'MES', name: 'Micro E-mini S&P', tickValue: '$1.25', margin: '$50' },
    { symbol: 'MNQ', name: 'Micro Nasdaq', tickValue: '$0.50', margin: '$40' },
  ];

  const benefits = [
    {
      icon: Zap,
      title: 'High Leverage',
      description: 'Trade with leverage up to 50:1, maximizing your capital efficiency',
    },
    {
      icon: Clock,
      title: '23/5 Market Hours',
      description: 'Nearly round-the-clock trading opportunities in major markets',
    },
    {
      icon: Shield,
      title: 'Regulated Markets',
      description: 'Trade on CME, NYMEX, and other regulated exchanges',
    },
    {
      icon: BarChart3,
      title: 'Deep Liquidity',
      description: 'Tight spreads and minimal slippage in major contracts',
    },
    {
      icon: DollarSign,
      title: 'Lower Costs',
      description: 'No overnight financing charges like forex or CFDs',
    },
    {
      icon: Target,
      title: 'Tax Benefits',
      description: 'Favorable 60/40 tax treatment in the United States',
    },
  ];

  const signals = [
    { type: 'LONG', symbol: 'ES', entry: '4,892.50', target: '4,910.00', stop: '4,880.00', status: 'Active' },
    { type: 'SHORT', symbol: 'NQ', entry: '17,450.00', target: '17,380.00', stop: '17,490.00', status: 'Pending' },
    { type: 'LONG', symbol: 'GC', entry: '2,048.00', target: '2,065.00', stop: '2,038.00', status: 'Active' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-6">
          {/* Hero */}
          <motion.div 
            className="text-center mb-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm mb-6">
              <TrendingUp className="w-4 h-4" />
              Futures Trading
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Trade Futures with
              <br />
              <span className="gradient-text">Professional Signals</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Get real-time futures trading signals for ES, NQ, CL, GC, and more. 
              Maximize your edge in the world's most liquid markets.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button className="btn-glow px-8 py-6 text-lg" asChild>
                <Link to="/membership">Start Trading</Link>
              </Button>
              <Button variant="outline" size="lg" className="px-8 py-6 text-lg" asChild>
                <Link to="/features">Learn More</Link>
              </Button>
            </div>
          </motion.div>

          {/* Live Signals Preview */}
          <motion.div 
            className="mb-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="text-3xl font-bold text-center mb-4">Live Futures Signals</h2>
            <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
              Real-time trading signals with precise entry, target, and stop levels
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              {signals.map((signal, index) => (
                <motion.div
                  key={`${signal.symbol}-${index}`}
                  className="glass-card p-6 rounded-2xl"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        signal.type === 'LONG' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                      }`}>
                        {signal.type}
                      </span>
                      <span className="text-xl font-bold">{signal.symbol}</span>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${
                      signal.status === 'Active' ? 'bg-primary/20 text-primary' : 'bg-yellow-500/20 text-yellow-500'
                    }`}>
                      {signal.status}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Entry</span>
                      <span className="font-mono">{signal.entry}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Target</span>
                      <span className="font-mono text-green-500">{signal.target}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Stop Loss</span>
                      <span className="font-mono text-red-500">{signal.stop}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Products */}
          <motion.div 
            className="mb-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-3xl font-bold text-center mb-4">Supported Futures Contracts</h2>
            <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
              Trade the world's most popular futures contracts with our AI-powered signals
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {futuresProducts.map((product, index) => (
                <motion.div
                  key={product.symbol}
                  className="glass-card p-6 rounded-xl flex items-center justify-between"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.05 }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                      <span className="font-bold text-primary">{product.symbol}</span>
                    </div>
                    <div>
                      <p className="font-semibold">{product.name}</p>
                      <p className="text-sm text-muted-foreground">Tick: {product.tickValue}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Day Margin</p>
                    <p className="font-semibold text-primary">{product.margin}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Benefits */}
          <motion.div 
            className="mb-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h2 className="text-3xl font-bold text-center mb-4">Why Trade Futures?</h2>
            <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
              Discover the advantages of futures trading over other markets
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  className="glass-card p-6 rounded-2xl"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                >
                  <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center mb-4">
                    <benefit.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
                  <p className="text-muted-foreground text-sm">{benefit.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Features */}
          <motion.div 
            className="mb-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <div className="glass-card p-12 rounded-3xl">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="text-3xl font-bold mb-6">Futures Trading Features</h2>
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
                        <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl blur-3xl" />
                  <div className="relative glass-card p-8 rounded-2xl">
                    <div className="flex items-center gap-4 mb-6">
                      <Layers className="w-10 h-10 text-primary" />
                      <div>
                        <p className="font-semibold">Multi-Contract Analysis</p>
                        <p className="text-sm text-muted-foreground">Correlations & intermarket signals</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">ES/NQ Correlation</span>
                        <span className="text-green-500">+0.92</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">GC/DX Correlation</span>
                        <span className="text-red-500">-0.85</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">CL/ES Correlation</span>
                        <span className="text-green-500">+0.45</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <h2 className="text-3xl font-bold mb-4">Ready to Trade Futures?</h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Get access to professional futures trading signals and start trading like the pros.
            </p>
            <Button className="btn-glow px-8 py-6 text-lg" asChild>
              <Link to="/membership">
                Get Started Now <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FuturesPage;
