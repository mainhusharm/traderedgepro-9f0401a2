import { motion, useScroll, useTransform } from 'framer-motion';
import { Settings, Zap, Trophy, ArrowRight } from 'lucide-react';
import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const steps = [
  {
    number: "01",
    icon: Settings,
    title: "Setup & Configure",
    description: "Connect your account, select your prop firm, and customize your risk parameters.",
    details: ["Choose from 20+ prop firms", "Set your daily loss limits", "Enable push notifications"],
  },
  {
    number: "02",
    icon: Zap,
    title: "AI-Powered Execution",
    description: "Nexus AI scans markets 24/7, delivering high-probability signals with full reasoning.",
    details: ["Real-time market analysis", "Automated risk management", "One-click trade execution"],
  },
  {
    number: "03",
    icon: Trophy,
    title: "Get Funded",
    description: "Pass your challenge phases and receive your funded account with consistent payouts.",
    details: ["Structured challenge approach", "Milestone tracking", "Payout verification"],
  }
];

const HowItWorks = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start end", "end start"] });
  const lineHeight = useTransform(scrollYProgress, [0.1, 0.6], ["0%", "100%"]);

  return (
    <section id="how-it-works" className="relative py-24 overflow-hidden" ref={containerRef}>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent" />
      
      <div className="container mx-auto px-4">
        <motion.div className="text-center mb-20 max-w-2xl mx-auto" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">How It Works</span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Three Steps to <span className="text-primary">Get Funded</span></h2>
          <p className="text-muted-foreground">From setup to funded trader in as little as 2 weeks.</p>
        </motion.div>

        <div className="relative max-w-4xl mx-auto">
          {/* Animated vertical line */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2">
            <div className="h-full bg-border/30" />
            <motion.div className="absolute top-0 left-0 w-full bg-gradient-to-b from-primary via-primary to-transparent" style={{ height: lineHeight }} />
          </div>

          <div className="space-y-12 md:space-y-24">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                className={`relative flex flex-col md:flex-row items-center gap-8 ${index % 2 === 1 ? 'md:flex-row-reverse' : ''}`}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: index * 0.15 }}
              >
                {/* Circle */}
                <motion.div className="relative z-10 flex-shrink-0" whileInView={{ scale: [0.8, 1.1, 1] }} viewport={{ once: true }} transition={{ delay: index * 0.15 + 0.3 }}>
                  <div className="w-16 h-16 rounded-full bg-card border border-primary/30 flex items-center justify-center relative">
                    <motion.div className="absolute inset-0 rounded-full bg-primary/20" animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }} transition={{ duration: 2, repeat: Infinity, delay: index * 0.5 }} />
                    <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.6 }}>
                      <step.icon className="w-7 h-7 text-primary" />
                    </motion.div>
                  </div>
                </motion.div>

                {/* Card */}
                <motion.div className={`flex-1 glass-card rounded-2xl p-6 md:p-8 max-w-md ${index % 2 === 1 ? 'md:text-right' : ''}`} whileHover={{ y: -5 }}>
                  <div className={`flex items-center gap-3 mb-4 ${index % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>
                    <span className="text-4xl font-bold text-primary/20">{step.number}</span>
                    <h3 className="text-xl font-semibold text-foreground">{step.title}</h3>
                  </div>
                  <p className="text-muted-foreground mb-4">{step.description}</p>
                  <ul className={`space-y-2 ${index % 2 === 1 ? 'md:text-right' : ''}`}>
                    {step.details.map((detail, i) => (
                      <li key={i} className={`flex items-center gap-2 text-sm text-muted-foreground ${index % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>
                        <ArrowRight className="w-3 h-3 text-primary flex-shrink-0" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div className="text-center mt-16 relative z-10" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <motion.button 
            onClick={() => navigate('/membership')}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-primary text-primary-foreground font-medium cursor-pointer" 
            whileHover={{ scale: 1.02 }} 
            whileTap={{ scale: 0.98 }}
          >
            Start Free Trial <ArrowRight className="w-4 h-4" />
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks;
