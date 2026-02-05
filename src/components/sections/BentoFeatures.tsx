import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Shield, Target, Users, BarChart3, Zap, Award, type LucideIcon } from 'lucide-react';
import { useRef, MouseEvent } from 'react';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  gradient: string;
  large?: boolean;
}

const FeatureCard = ({ icon: Icon, title, description, gradient, large }: FeatureCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const spotlightX = useSpring(mouseX, { stiffness: 500, damping: 50 });
  const spotlightY = useSpring(mouseY, { stiffness: 500, damping: 50 });

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  return (
    <motion.div
      ref={cardRef}
      data-card
      className={`glass-card p-8 relative group cursor-pointer overflow-hidden ${
        large ? 'md:col-span-2 md:row-span-2' : ''
      }`}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onMouseMove={handleMouseMove}
    >
      {/* Spotlight effect */}
      <motion.div
        className="absolute w-64 h-64 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, hsl(var(--primary) / 0.15), transparent 60%)',
          left: spotlightX,
          top: spotlightY,
          transform: 'translate(-50%, -50%)',
        }}
      />

      {/* Icon */}
      <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} mb-6`}>
        <Icon className="w-7 h-7 text-white" />
      </div>

      {/* Content */}
      <h3 className="text-xl font-bold text-foreground mb-3">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>

      {/* Hover arrow */}
      <motion.div
        className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity"
        initial={{ x: -10 }}
        animate={{ x: 0 }}
      >
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </div>
      </motion.div>
    </motion.div>
  );
};

const BentoFeatures = () => {
  const features = [
    {
      icon: Shield,
      title: 'Risk Guard Protocol',
      description: 'AI-powered drawdown protection that monitors every trade in real-time. Never breach your daily loss limit again.',
      gradient: 'from-blue-500 to-cyan-500',
      large: true,
    },
    {
      icon: Target,
      title: 'Precision Signals',
      description: '85%+ accuracy with AI-analyzed entries. Every signal comes with full reasoning.',
      gradient: 'from-emerald-500 to-green-500',
      large: true,
    },
    {
      icon: Users,
      title: '24/7 Nexus Coach',
      description: 'Your personal AI trading mentor, available anytime to answer questions and improve your strategy.',
      gradient: 'from-purple-500 to-violet-500',
    },
    {
      icon: BarChart3,
      title: 'Real Account Management',
      description: 'Professional management for personal capital accounts. Let our experts handle your trading while you focus on what matters.',
      gradient: 'from-amber-500 to-orange-500',
    },
    {
      icon: Zap,
      title: 'Instant Execution',
      description: 'Signals delivered in milliseconds. Copy with one click or automate with our MT5 integration.',
      gradient: 'from-cyan-500 to-blue-500',
    },
    {
      icon: Award,
      title: 'Challenge Clearing',
      description: 'Structured approach to pass Phase 1 & 2. We help you get funded, not just trade.',
      gradient: 'from-rose-500 to-pink-500',
    },
  ];

  return (
    <section id="features" className="py-32 relative">
      <div className="container mx-auto px-6">
        {/* Section header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="text-primary text-sm font-semibold tracking-wider uppercase mb-4 block">
            Features
          </span>
          <h2 className="text-4xl md:text-5xl font-bold gradient-text mb-6">
            Professional-Grade Tools
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Everything you need to pass your prop firm challenge, powered by cutting-edge AI technology.
          </p>
        </motion.div>

        {/* Bento grid - 2 large on top, 4 small below */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default BentoFeatures;
