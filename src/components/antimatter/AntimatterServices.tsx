import { motion, useScroll, useTransform } from 'framer-motion';
import { Shield, Target, Zap, Brain, BarChart3, Award, ChevronRight } from 'lucide-react';
import { useRef, useState } from 'react';

const services = [
  {
    number: '01',
    icon: Shield,
    title: 'Risk Guard Protocol',
    description: 'Real-time drawdown monitoring that protects your account 24/7. Never breach your daily loss limits again.',
    features: ['Daily Loss Protection', 'Real-time Monitoring', 'Auto Position Sizing', 'Prop Firm Compliance'],
    tools: ['MetaTrader 5', 'TradingView', 'Discord'],
  },
  {
    number: '02',
    icon: Target,
    title: 'Precision Signals',
    description: '85%+ accuracy with comprehensive AI reasoning. Every signal includes full market analysis and risk metrics.',
    features: ['Multi-Timeframe Analysis', 'SMC/ICT Concepts', 'Institutional Flow', 'Entry Optimization'],
    tools: ['AI Analysis', 'Live Alerts', 'Mobile App'],
  },
  {
    number: '03',
    icon: Brain,
    title: 'Nexus AI Coach',
    description: 'Your 24/7 AI trading mentor that learns your style and helps you improve with personalized guidance.',
    features: ['Trade Journaling', 'Performance Analytics', 'Pattern Recognition', 'Strategy Optimization'],
    tools: ['ChatGPT', 'Custom AI', 'Analytics'],
  },
  {
    number: '04',
    icon: BarChart3,
    title: 'Live Dashboard',
    description: 'Professional-grade analytics dashboard to track every aspect of your trading performance.',
    features: ['Equity Curves', 'Win Rate Analytics', 'Drawdown Tracking', 'Challenge Progress'],
    tools: ['React', 'Supabase', 'Charts'],
  },
  {
    number: '05',
    icon: Zap,
    title: 'Instant Execution',
    description: 'Signals delivered in milliseconds. Copy with one click or automate with our MT5 integration.',
    features: ['Push Notifications', 'MT5 Integration', 'Copy Trading', 'Auto Position Sizing'],
    tools: ['WebSockets', 'MT5 API', 'Push'],
  },
  {
    number: '06',
    icon: Award,
    title: 'Challenge Clearing',
    description: 'Structured approach designed specifically to help you pass Phase 1 & 2 and get funded.',
    features: ['20+ Prop Firms', 'Phase Tracking', 'Milestone Rewards', 'Payout Verification'],
    tools: ['FTMO', 'TFT', 'E8'],
  },
];

const ServiceCard = ({ service, index, isExpanded, onToggle }: { 
  service: typeof services[0]; 
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}) => {
  return (
    <motion.div
      className="group border-b border-white/10 last:border-b-0"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <button
        onClick={onToggle}
        className="w-full py-8 flex items-start gap-6 text-left hover:bg-white/[0.02] transition-colors px-2"
      >
        {/* Number */}
        <span className="text-sm text-[#6366f1] font-medium mt-1">{service.number}</span>
        
        {/* Title */}
        <div className="flex-1">
          <h3 className="text-2xl md:text-3xl font-semibold text-white group-hover:text-[#a5b4fc] transition-colors">
            {service.title}
          </h3>
        </div>
        
        {/* Expand indicator */}
        <motion.div
          animate={{ rotate: isExpanded ? 90 : 0 }}
          transition={{ duration: 0.2 }}
          className="mt-2"
        >
          <ChevronRight className="w-6 h-6 text-muted-foreground" />
        </motion.div>
      </button>
      
      {/* Expanded content */}
      <motion.div
        initial={false}
        animate={{ 
          height: isExpanded ? 'auto' : 0,
          opacity: isExpanded ? 1 : 0
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="overflow-hidden"
      >
        <div className="pb-8 pl-14 pr-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Left - Description & Features */}
            <div>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                {service.description}
              </p>
              
              <div className="mb-4">
                <span className="text-xs text-muted-foreground uppercase tracking-wider mb-3 block">
                  Features
                </span>
                <div className="flex flex-wrap gap-2">
                  {service.features.map((feature, i) => (
                    <span 
                      key={i}
                      className="text-sm px-3 py-1.5 rounded-full bg-white/5 text-white/80 border border-white/10"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Right - Tools */}
            <div className="flex flex-col justify-end">
              <span className="text-xs text-muted-foreground uppercase tracking-wider mb-3 block">
                Tools
              </span>
              <div className="flex gap-4">
                {service.tools.map((tool, i) => (
                  <div 
                    key={i}
                    className="w-12 h-12 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center"
                  >
                    <span className="text-xs text-muted-foreground">{tool.slice(0, 2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const AntimatterServices = () => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
  const sectionRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });
  
  const headerY = useTransform(scrollYProgress, [0, 0.3], [60, 0]);
  const headerOpacity = useTransform(scrollYProgress, [0, 0.2], [0, 1]);

  return (
    <section ref={sectionRef} className="py-32 relative overflow-hidden bg-[#0a0a0f]">
      <div className="container mx-auto px-6">
        {/* Section header */}
        <motion.div 
          className="mb-16"
          style={{ y: headerY, opacity: headerOpacity }}
        >
          <motion.span 
            className="text-[#6366f1] text-sm font-medium tracking-[0.2em] uppercase mb-6 block"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            Our Services
          </motion.span>
          <motion.p 
            className="text-xl md:text-2xl text-muted-foreground max-w-3xl leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            We offer comprehensive trading solutions that transform your approach and drive funded success across every prop firm.
          </motion.p>
        </motion.div>
        
        {/* Services accordion */}
        <div className="max-w-4xl">
          {services.map((service, index) => (
            <ServiceCard 
              key={service.number} 
              service={service} 
              index={index}
              isExpanded={expandedIndex === index}
              onToggle={() => setExpandedIndex(expandedIndex === index ? null : index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default AntimatterServices;
