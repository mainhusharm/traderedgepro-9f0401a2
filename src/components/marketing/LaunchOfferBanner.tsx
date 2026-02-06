import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Rocket, X, ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LaunchOfferBanner = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();

  // Check if user dismissed the banner
  useEffect(() => {
    const dismissed = sessionStorage.getItem('launch_banner_dismissed');
    if (dismissed) {
      setIsVisible(false);
    }
  }, []);

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsVisible(false);
    sessionStorage.setItem('launch_banner_dismissed', 'true');
  };

  const handleClick = () => {
    navigate('/auth?plan=pro&price=159.20&billing=monthly&coupon=PROLAUNCH20');
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-20 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-xl"
      >
        <motion.div
          onClick={handleClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="relative cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-[#0f0f18]/90 backdrop-blur-xl shadow-2xl shadow-indigo-500/10 hover:shadow-indigo-500/20 transition-all duration-500"
          whileHover={{ scale: 1.02, y: -2 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          {/* Gradient border glow */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          
          {/* Animated gradient background */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 via-purple-600/5 to-indigo-600/10"
            animate={{ 
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
            }}
            transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
            style={{ backgroundSize: '200% 100%' }}
          />

          {/* Subtle shimmer line */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
            animate={{ x: ['-200%', '200%'] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          />

          <div className="relative flex items-center justify-between gap-4 px-5 py-3">
            {/* Left: Icon + Text */}
            <div className="flex items-center gap-4">
              <motion.div
                className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30"
                animate={{ 
                  rotate: isHovered ? 12 : 0,
                  scale: isHovered ? 1.1 : 1 
                }}
                transition={{ duration: 0.3 }}
              >
                <Sparkles className="w-4 h-4 text-white" />
              </motion.div>
              
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                <span className="text-sm font-semibold text-white">
                  Launch Offer
                </span>
                <div className="flex items-center gap-2">
                  <motion.span
                    className="px-3 py-1 text-xs font-bold bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-full shadow-lg shadow-indigo-500/30"
                    animate={{ scale: [1, 1.03, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    20% OFF
                  </motion.span>
                  <span className="hidden sm:inline text-xs text-white/50">
                    Use code <span className="font-mono font-bold text-indigo-400">PROLAUNCH20</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Right: CTA + Close */}
            <div className="flex items-center gap-3">
              <motion.div
                className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/15 transition-colors"
                animate={{ x: isHovered ? 2 : 0 }}
              >
                <span className="text-xs font-semibold text-white">Claim</span>
                <ArrowRight className="w-3 h-3 text-white" />
              </motion.div>
              
              <button
                onClick={handleDismiss}
                className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4 text-white/40 hover:text-white/70 transition-colors" />
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default LaunchOfferBanner;