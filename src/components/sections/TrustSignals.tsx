import { motion } from 'framer-motion';
import { Shield, Lock, Award, CheckCircle } from 'lucide-react';
import AnimatedCounter from '@/components/animations/AnimatedCounter';

const securityBadges = [
  { icon: Shield, label: 'Bank-Grade Security' },
  { icon: Lock, label: '256-bit Encryption' },
  { icon: Award, label: 'Verified Signals' },
  { icon: CheckCircle, label: 'Risk Protected' },
];

const featuredIn = [
  'TradingView', 'FXStreet', 'Investing.com', 'ForexFactory'
];

const TrustSignals = () => {
  return (
    <section className="relative py-16 overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Live Signal Counter */}
        <motion.div 
          className="flex justify-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="glass-card px-8 py-4 rounded-full inline-flex items-center gap-4">
            <div className="relative">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <div className="absolute inset-0 w-3 h-3 rounded-full bg-green-500 animate-ping opacity-75" />
              <div className="absolute -inset-1 rounded-full bg-green-500/20 animate-pulse" />
            </div>
            <span className="text-muted-foreground text-sm">Live Signals Sent:</span>
            <span className="text-2xl font-bold text-foreground">
              <AnimatedCounter end={127456} duration={2.5} suffix="+" />
            </span>
          </div>
        </motion.div>

        {/* Security Badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {securityBadges.map((badge, index) => (
            <motion.div
              key={badge.label}
              className="glass-card p-6 rounded-xl text-center group cursor-pointer"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ 
                y: -5,
                rotateX: 5,
                rotateY: 5,
              }}
              style={{ transformStyle: 'preserve-3d', perspective: 1000 }}
            >
              <motion.div
                className="inline-flex p-3 rounded-full bg-primary/10 mb-3 group-hover:bg-primary/20 transition-colors"
                whileHover={{ scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 400 }}
              >
                <badge.icon className="w-6 h-6 text-primary" />
              </motion.div>
              <p className="text-sm text-muted-foreground font-medium">{badge.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Featured In */}
        <motion.div 
          className="text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-4">
            Trusted by traders featured in
          </p>
          <div className="flex flex-wrap justify-center gap-8">
            {featuredIn.map((name, index) => (
              <motion.span 
                key={name}
                className="text-muted-foreground/60 font-medium hover:text-primary transition-colors cursor-default"
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
              >
                {name}
              </motion.span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TrustSignals;
