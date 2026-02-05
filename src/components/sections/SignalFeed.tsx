import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Brain, Clock, Target, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface Signal {
  id: number;
  pair: string;
  type: 'BUY' | 'SELL';
  entry: string;
  stopLoss: string;
  takeProfit: string;
  confidence: number;
  reasoning: string;
  time: string;
  date: Date;
}

const SignalFeed = () => {
  const [activeSignal, setActiveSignal] = useState(0);
  const [showReasoning, setShowReasoning] = useState(false);

  // Generate dynamic timestamps based on current time
  const now = new Date();
  const signals: Signal[] = [
    {
      id: 1,
      pair: 'EUR/USD',
      type: 'SELL',
      entry: '1.0845',
      stopLoss: '1.0875',
      takeProfit: '1.0785',
      confidence: 87,
      reasoning: 'Bearish divergence on H4 RSI. Institutional order flow shows net selling pressure at 1.0860 resistance. Entry timed for optimal 1:2.5 RR after London session high formation.',
      time: '2 mins ago',
      date: new Date(now.getTime() - 2 * 60 * 1000),
    },
    {
      id: 2,
      pair: 'XAU/USD',
      type: 'BUY',
      entry: '2,342.50',
      stopLoss: '2,335.00',
      takeProfit: '2,365.00',
      confidence: 92,
      reasoning: 'Safe-haven flow detected with US yields declining. Support at 2,340 holding with bullish engulfing on H1. COT data shows increased long positioning.',
      time: '8 mins ago',
      date: new Date(now.getTime() - 8 * 60 * 1000),
    },
    {
      id: 3,
      pair: 'BTC/USD',
      type: 'BUY',
      entry: '67,450',
      stopLoss: '66,800',
      takeProfit: '69,200',
      confidence: 78,
      reasoning: 'Accumulation pattern near weekly support. On-chain metrics show whale buying. Funding rates neutral, suggesting room for upside move.',
      time: '15 mins ago',
      date: new Date(now.getTime() - 15 * 60 * 1000),
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSignal((prev) => (prev + 1) % signals.length);
      setShowReasoning(false);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const currentSignal = signals[activeSignal];

  return (
    <section className="py-32 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[150px]" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Content */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-primary text-sm font-semibold tracking-wider uppercase mb-4 block">
              Live Signals
            </span>
            <h2 className="text-4xl md:text-5xl font-bold gradient-text mb-6">
              AI-Powered Signal Intelligence
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Every signal comes with full AI reasoning. Understand exactly why Nexus recommends each trade, 
              with real-time analysis of 50+ market factors.
            </p>

            {/* Feature list */}
            <div className="space-y-4">
              {[
                { icon: Brain, text: 'Deep market analysis with AI reasoning' },
                { icon: Target, text: 'Precise entries with optimal RR ratios' },
                { icon: Clock, text: 'Real-time monitoring & adjustments' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  className="flex items-center gap-4"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-foreground">{item.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right: Signal Terminal */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="glass-card p-6 relative overflow-hidden">
              {/* Terminal header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-destructive" />
                  <div className="w-3 h-3 rounded-full bg-warning" />
                  <div className="w-3 h-3 rounded-full bg-success" />
                </div>
                <span className="text-xs text-muted-foreground font-mono">NEXUS_SIGNAL_FEED</span>
              </div>

              {/* Signal content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSignal.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Pair & Type */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <span className="text-3xl font-bold text-foreground">{currentSignal.pair}</span>
                      <span className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                        currentSignal.type === 'BUY' 
                          ? 'bg-success/20 text-success' 
                          : 'bg-destructive/20 text-destructive'
                      }`}>
                        {currentSignal.type === 'BUY' ? (
                          <span className="flex items-center gap-1">
                            <TrendingUp className="w-4 h-4" /> BUY
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <TrendingDown className="w-4 h-4" /> SELL
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Date & Time */}
                  <div className="flex items-center gap-4 mb-6 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>{format(currentSignal.date, 'MMM dd, yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>{format(currentSignal.date, 'HH:mm:ss')}</span>
                    </div>
                    <span className="text-xs text-primary/70 ml-auto">{currentSignal.time}</span>
                  </div>

                  {/* Price levels */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-muted/50 rounded-xl p-4">
                      <span className="text-xs text-muted-foreground block mb-1">Entry</span>
                      <span className="text-lg font-mono font-bold text-foreground">{currentSignal.entry}</span>
                    </div>
                    <div className="bg-destructive/10 rounded-xl p-4">
                      <span className="text-xs text-destructive block mb-1">Stop Loss</span>
                      <span className="text-lg font-mono font-bold text-destructive">{currentSignal.stopLoss}</span>
                    </div>
                    <div className="bg-success/10 rounded-xl p-4">
                      <span className="text-xs text-success block mb-1">Take Profit</span>
                      <span className="text-lg font-mono font-bold text-success">{currentSignal.takeProfit}</span>
                    </div>
                  </div>

                  {/* Confidence bar */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Confidence Score</span>
                      <span className="text-sm font-semibold text-primary">{currentSignal.confidence}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-primary to-accent"
                        initial={{ width: 0 }}
                        animate={{ width: `${currentSignal.confidence}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>

                  {/* AI Reasoning */}
                  <button
                    className="w-full py-3 rounded-xl bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/20 transition-colors"
                    onClick={() => setShowReasoning(!showReasoning)}
                  >
                    {showReasoning ? 'Hide' : 'Show'} Nexus AI Logic
                  </button>

                  <AnimatePresence>
                    {showReasoning && (
                      <motion.div
                        className="mt-4 p-4 rounded-xl bg-muted/30 border border-primary/20"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <div className="flex items-start gap-3">
                          <Brain className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {currentSignal.reasoning}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </AnimatePresence>

              {/* Signal indicators */}
              <div className="flex justify-center gap-2 mt-6">
                {signals.map((_, i) => (
                  <button
                    key={i}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      i === activeSignal ? 'bg-primary' : 'bg-muted-foreground/30'
                    }`}
                    onClick={() => {
                      setActiveSignal(i);
                      setShowReasoning(false);
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Decorative glow */}
            <div className="absolute -inset-4 bg-primary/5 rounded-3xl blur-2xl -z-10" />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default SignalFeed;
