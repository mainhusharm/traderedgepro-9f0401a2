import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { motion, AnimatePresence } from 'framer-motion';
import { useIntroSound } from '@/hooks/useIntroSound';
import LogoScene from '@/components/canvas/LogoScene';

interface IntroLoaderProps {
  onComplete: () => void;
  isSceneReady: boolean;
}

const IntroLoader = ({ onComplete, isSceneReady }: IntroLoaderProps) => {
  const loaderRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const brandRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [phase, setPhase] = useState<'loading' | 'launching' | 'done'>('loading');
  const { generateAndPlaySound, stopSound } = useIntroSound();
  const soundStartedRef = useRef(false);

  // Start sound
  useEffect(() => {
    if (!soundStartedRef.current && progress > 10) {
      soundStartedRef.current = true;
      generateAndPlaySound();
    }
  }, [progress, generateAndPlaySound]);

  // Progress simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        // Accelerate towards end
        const increment = prev < 70 ? Math.random() * 8 + 4 : Math.random() * 15 + 8;
        return Math.min(prev + increment, 100);
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Launch animation when complete
  useEffect(() => {
    if (progress >= 100 && isSceneReady && phase === 'loading') {
      setPhase('launching');
      
      const tl = gsap.timeline({
        onComplete: () => {
          setPhase('done');
          setIsVisible(false);
          onComplete();
        }
      });

      // Progress bar expands and shoots up
      tl.to(progressBarRef.current, {
        width: '100vw',
        height: '100vh',
        borderRadius: 0,
        duration: 0.6,
        ease: 'power3.inOut',
      })
      // Brand fades out
      .to(brandRef.current, {
        opacity: 0,
        scale: 1.1,
        duration: 0.3,
        ease: 'power2.in',
      }, '-=0.5')
      // Overlay wipes up to reveal hero
      .to(overlayRef.current, {
        yPercent: -100,
        duration: 0.8,
        ease: 'power4.inOut',
      }, '-=0.2')
      // Final fade
      .to(loaderRef.current, {
        opacity: 0,
        duration: 0.3,
        ease: 'power2.out',
      }, '-=0.3');
    }
  }, [progress, isSceneReady, phase, onComplete]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={loaderRef}
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden"
        initial={{ opacity: 1 }}
      >
        {/* Background */}
        <div className="absolute inset-0 bg-background" />
        
        {/* Animated grid lines */}
        <div className="absolute inset-0 opacity-[0.02]">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(to right, hsl(var(--primary)) 1px, transparent 1px),
              linear-gradient(to bottom, hsl(var(--primary)) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px'
          }} />
        </div>

        {/* Reveal overlay */}
        <div
          ref={overlayRef}
          className="absolute inset-0 bg-gradient-to-b from-primary/20 via-primary/10 to-background z-10"
        />

        {/* Content */}
        <div ref={brandRef} className="relative z-20 flex flex-col items-center">
          {/* 3D Logo */}
          <motion.div
            className="mb-6 relative w-40 h-40 md:w-52 md:h-52"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <div className="absolute inset-0 bg-gradient-radial from-primary/30 via-transparent to-transparent rounded-full blur-xl" />
            <LogoScene className="w-full h-full" scale={1.3} interactive={false} />
          </motion.div>

          {/* Brand text */}
          <motion.h1
            className="text-3xl md:text-4xl font-bold tracking-tight mb-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <span className="bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text text-transparent">
              TraderEdge
            </span>
            <span className="text-primary ml-1">Pro</span>
          </motion.h1>

          <motion.p
            className="text-muted-foreground/60 text-xs tracking-[0.3em] uppercase mb-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            Initializing
          </motion.p>

          {/* Progress bar container */}
          <motion.div
            className="relative w-64 md:w-80"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            {/* Glow trail behind the bar */}
            <div 
              className="absolute -inset-4 rounded-full blur-xl pointer-events-none transition-all duration-150"
              style={{
                background: `radial-gradient(ellipse at ${Math.min(progress, 100)}% 50%, hsl(var(--primary) / 0.4) 0%, transparent 70%)`,
                transform: `scaleX(${0.3 + (progress / 100) * 0.7})`,
              }}
            />
            
            {/* Track */}
            <div className="relative h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
              {/* Progress fill */}
              <div
                ref={progressBarRef}
                className="h-full bg-gradient-to-r from-primary via-emerald-400 to-primary rounded-full relative origin-left"
                style={{ 
                  width: `${Math.min(progress, 100)}%`,
                  transition: 'width 0.15s ease-out',
                }}
              >
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shimmer_1s_infinite]" />
              </div>
              
              {/* Glowing head at the end of progress */}
              <motion.div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full"
                style={{
                  left: `calc(${Math.min(progress, 100)}% - 6px)`,
                  background: 'radial-gradient(circle, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.5) 50%, transparent 70%)',
                  boxShadow: '0 0 20px 8px hsl(var(--primary) / 0.6), 0 0 40px 16px hsl(var(--primary) / 0.3)',
                }}
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.8, 1, 0.8],
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            </div>

            {/* Trail particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute top-1/2 w-1 h-1 rounded-full bg-primary/60"
                  style={{
                    left: `${Math.max(0, Math.min(progress, 100) - 5 - i * 4)}%`,
                  }}
                  animate={{
                    opacity: [0, 0.8, 0],
                    y: [-2, -8 - i * 2, -12],
                    scale: [0.5, 1, 0.3],
                  }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    delay: i * 0.15,
                    ease: 'easeOut',
                  }}
                />
              ))}
            </div>

            {/* Percentage */}
            <div className="flex justify-between items-center mt-4 text-xs relative z-10">
              <span className="text-muted-foreground/40 font-mono">
                {phase === 'launching' ? 'Launching...' : 'Loading systems'}
              </span>
              <span className="text-primary font-mono font-medium">
                {Math.round(Math.min(progress, 100))}%
              </span>
            </div>
          </motion.div>

          {/* Decorative dots */}
          <motion.div
            className="flex gap-1.5 mt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-primary/30"
                animate={{ 
                  opacity: [0.3, 1, 0.3],
                  scale: [1, 1.2, 1]
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.15,
                }}
              />
            ))}
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default IntroLoader;
