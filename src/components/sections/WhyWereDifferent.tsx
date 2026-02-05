import { motion } from 'framer-motion';
import { Check, X, Zap, Shield, Brain, HeartHandshake } from 'lucide-react';

const comparisons = [
  {
    guru: "Send signals then ghost you",
    us: "Full support with AI Nexus + Personal Expert Guidance",
  },
  {
    guru: "No reasoning behind entries",
    us: "Every signal includes AI reasoning and analysis",
  },
  {
    guru: "No risk management",
    us: "Built-in Risk Guard Protocol protects your account",
  },
  {
    guru: "Copy blindly or fail",
    us: "Smart Position Sizer calculates exact lot size",
  },
  {
    guru: "One-size-fits-all signals",
    us: "Tailored to YOUR prop firm rules",
  },
  {
    guru: "Discord chaos with 1000 messages",
    us: "Structured dashboard with journal & analytics",
  },
  {
    guru: "No accountability or tracking",
    us: "Performance tracking with verification badges",
  },
  {
    guru: "Pay and pray approach",
    us: "7-day free trial, cancel anytime",
  },
];

const highlights = [
  {
    icon: Brain,
    title: "AI Nexus",
    description: "24/7 AI trading coach that learns your style",
  },
  {
    icon: HeartHandshake,
    title: "Personal Guidance",
    description: "Real experts who care about your success",
  },
  {
    icon: Shield,
    title: "Risk Protection",
    description: "Never blow another account again",
  },
  {
    icon: Zap,
    title: "Instant Signals",
    description: "Real-time alerts with full analysis",
  },
];

const WhyWereDifferent = () => {
  return (
    <section className="py-24 px-6 relative overflow-hidden">
      {/* Background accent */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">Not Another Signal Service</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A Complete Trading Partner That Actually Cares
          </p>
        </motion.div>

        {/* Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="glass-card p-8 mb-16 overflow-hidden"
        >
          {/* Table Header */}
          <div className="grid grid-cols-2 gap-4 mb-6 pb-4 border-b border-border">
            <div className="text-center">
              <span className="text-lg font-semibold text-destructive/80">Signal "Gurus"</span>
            </div>
            <div className="text-center">
              <span className="text-lg font-semibold text-primary">TraderEdge Pro</span>
            </div>
          </div>

          {/* Comparison Rows */}
          <div className="space-y-4">
            {comparisons.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="grid grid-cols-2 gap-4 py-3 border-b border-border/50 last:border-0"
              >
                {/* Guru Column */}
                <div className="flex items-start gap-3">
                  <X className="w-5 h-5 text-destructive/70 shrink-0 mt-0.5" />
                  <span className="text-muted-foreground text-sm md:text-base">{item.guru}</span>
                </div>
                
                {/* TraderEdge Column */}
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-foreground text-sm md:text-base">{item.us}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Highlight Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {highlights.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="glass-card p-6 text-center group hover:border-primary/50 transition-all duration-300"
            >
              <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <item.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyWereDifferent;
