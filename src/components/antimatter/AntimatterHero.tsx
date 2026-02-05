import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRef } from 'react';
import AnimatedCounter from '@/components/animations/AnimatedCounter';

const AntimatterHero = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });
  
  const backgroundY = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);
  const textOpacity = useTransform(scrollYProgress, [0, 0.4], [1, 0]);

  const stats = [
    { value: 87, suffix: '%', label: 'Win', sublabel: 'Rate' },
    { value: '24/7', label: 'AI', sublabel: 'Monitoring' },
    { value: 100, suffix: '%', label: 'Rule', sublabel: 'Compliance' },
  ];

  return (
    <section 
      ref={containerRef}
      className="relative min-h-screen flex flex-col justify-between overflow-hidden"
    >
      {/* Large background text - Antimatter-style (filled, huge, low opacity) */}
      <motion.div 
        className="absolute inset-0 overflow-hidden pointer-events-none select-none"
        style={{ y: backgroundY }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, delay: 0.15 }}
      >
        <div className="absolute top-1/2 left-[-8vw] -translate-y-1/2 w-[120vw]">
          <span 
            className="block text-[28vw] md:text-[22vw] lg:text-[18vw] font-black uppercase tracking-[-0.08em] text-foreground/[0.05]"
            style={{ lineHeight: '0.85' }}
          >
            TRADEREDGE
            <br />
            PRO
          </span>
        </div>
      </motion.div>

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-transparent to-background z-[1]" />

      {/* Diagonal light beam effect - matching Antimatter AI */}
      <motion.div 
        className="absolute inset-0 pointer-events-none z-[2] overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2, delay: 0.2 }}
      >
        {/* Main spotlight cone from top-left */}
        <div 
          className="absolute"
          style={{
            top: '-30%',
            left: '-20%',
            width: '80%',
            height: '160%',
            background: `
              conic-gradient(
                from 140deg at 0% 0%,
                transparent 0deg,
                rgba(180, 190, 255, 0.08) 15deg,
                rgba(200, 210, 255, 0.2) 30deg,
                rgba(220, 225, 255, 0.35) 45deg,
                rgba(255, 255, 255, 0.5) 55deg,
                rgba(220, 225, 255, 0.35) 65deg,
                rgba(180, 190, 255, 0.15) 80deg,
                transparent 100deg
              )
            `,
            filter: 'blur(40px)',
          }}
        />
        
        {/* Bright core beam */}
        <div 
          className="absolute"
          style={{
            top: '-20%',
            left: '-15%',
            width: '60%',
            height: '140%',
            background: `
              conic-gradient(
                from 140deg at 0% 0%,
                transparent 0deg,
                transparent 40deg,
                rgba(255, 255, 255, 0.4) 50deg,
                rgba(255, 255, 255, 0.6) 55deg,
                rgba(255, 255, 255, 0.4) 60deg,
                transparent 70deg,
                transparent 360deg
              )
            `,
            filter: 'blur(25px)',
          }}
        />
        
        {/* Soft blue outer glow */}
        <div 
          className="absolute"
          style={{
            top: '-40%',
            left: '-30%',
            width: '100%',
            height: '180%',
            background: `
              conic-gradient(
                from 130deg at 0% 0%,
                transparent 0deg,
                rgba(100, 120, 200, 0.05) 20deg,
                rgba(140, 160, 220, 0.12) 40deg,
                rgba(180, 190, 240, 0.08) 70deg,
                transparent 100deg
              )
            `,
            filter: 'blur(60px)',
          }}
        />
      </motion.div>

      {/* Main content area - headline overlays the sphere */}
      <div className="flex-1 flex items-center justify-center relative z-10 pt-24 pb-8">
        <div className="container mx-auto px-6">

          {/* Main headline - centered, positioned over the 3D sphere */}
          <motion.div
            className="text-center max-w-5xl mx-auto"
            style={{ opacity: textOpacity }}
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-[5.5rem] leading-[1.05] tracking-[-0.02em]">
              <motion.span 
                className="font-light text-white"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.5 }}
              >
                Building{' '}
              </motion.span>
              <motion.span 
                className="italic font-normal text-[#a5b4fc]"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.6 }}
              >
                Funded
              </motion.span>
              <br />
              <motion.span 
                className="italic font-normal text-[#a5b4fc]"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.7 }}
              >
                Traders
              </motion.span>
              <motion.span 
                className="font-light text-white"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.8 }}
              >
                {' '}That{' '}
              </motion.span>
              <motion.span 
                className="font-semibold text-white"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.9 }}
              >
                Matter
              </motion.span>
            </h1>
          </motion.div>
        </div>
      </div>

      {/* Bottom section - description left, stats right */}
      <motion.div 
        className="relative z-10 pb-8 md:pb-12"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1, duration: 0.7 }}
      >
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
            {/* Left side - description and CTA */}
            <div className="max-w-sm">
              <p className="text-muted-foreground text-sm md:text-base mb-5 leading-relaxed">
                We empower traders with AI-powered signals that turn complex challenges into funded accounts and consistent payouts.
              </p>
              
              <motion.button 
                className="group inline-flex items-center gap-3 px-6 py-3 rounded-full font-medium text-sm transition-all duration-300 bg-gradient-to-r from-[#6366f1] to-[#818cf8] text-white hover:shadow-lg hover:shadow-[#6366f1]/30"
                onClick={() => navigate('/membership')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Start Your Journey
                <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </motion.button>
            </div>

            {/* Right side - Stats in a row */}
            <div className="flex items-end gap-6 md:gap-10">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  className="text-left"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.3 + index * 0.1, duration: 0.5 }}
                >
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl md:text-4xl font-bold text-white">
                      {typeof stat.value === 'number' ? (
                        <AnimatedCounter end={stat.value} duration={2} suffix={stat.suffix} />
                      ) : (
                        stat.value
                      )}
                    </span>
                    <div className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wide leading-tight">
                      <span className="block">{stat.label}</span>
                      <span className="block">{stat.sublabel}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default AntimatterHero;
