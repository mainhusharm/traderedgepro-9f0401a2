import { motion } from 'framer-motion';
import { X, Check, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ComparisonSection = () => {
  const navigate = useNavigate();

  const withoutItems = [
    'Emotional trading decisions',
    'Overtrading after losses',
    'Breaking prop firm rules under pressure',
    'Repeated challenge failures',
    'Inconsistent risk management',
    'Trading without structure',
  ];

  const withItems = [
    'AI-enforced risk discipline',
    'Structured trade decisions',
    'Automatic rule compliance monitoring',
    'Higher challenge survival rate',
    'Consistent position sizing',
    'Professional trading habits',
  ];

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          className="text-center mb-16 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            The Difference
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Stop Losing to <span className="text-primary">Yourself</span>
          </h2>
          <p className="text-muted-foreground">
            Most traders don't lose to the market. They lose to their own behavior. Here's what changes with TraderEdge Pro.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Without */}
          <motion.div
            className="glass-card rounded-2xl p-8 border border-red-500/20 relative overflow-hidden"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500/50 to-red-500/0" />
            <h3 className="text-xl font-semibold text-red-400 mb-6 flex items-center gap-2">
              <X className="w-5 h-5" />
              Without TraderEdge Pro
            </h3>
            <ul className="space-y-4">
              {withoutItems.map((item, index) => (
                <motion.li
                  key={item}
                  className="flex items-start gap-3 text-muted-foreground"
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + index * 0.05 }}
                >
                  <X className="w-5 h-5 text-red-500/70 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* With */}
          <motion.div
            className="glass-card rounded-2xl p-8 border border-green-500/20 relative overflow-hidden"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500/50 to-green-500/0" />
            <h3 className="text-xl font-semibold text-green-400 mb-6 flex items-center gap-2">
              <Check className="w-5 h-5" />
              With TraderEdge Pro
            </h3>
            <ul className="space-y-4">
              {withItems.map((item, index) => (
                <motion.li
                  key={item}
                  className="flex items-start gap-3 text-foreground"
                  initial={{ opacity: 0, x: 10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                >
                  <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* CTA */}
        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <p className="text-muted-foreground mb-4">
            Ready to trade with discipline instead of emotion?
          </p>
          <motion.button
            onClick={() => navigate('/membership')}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-primary text-primary-foreground font-medium"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Start Your Transformation <ArrowRight className="w-4 h-4" />
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};

export default ComparisonSection;
