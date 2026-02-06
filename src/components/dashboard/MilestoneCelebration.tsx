import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Sparkles, Star, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';
import { useEffect } from 'react';
import { callEdgeFunction } from '@/config/api';
import { useAuth } from '@/lib/auth/AuthContext';

interface MilestoneCelebrationProps {
  isOpen: boolean;
  onClose: () => void;
  milestoneName: string;
  milestoneDescription: string;
  milestoneColor: string;
}

const MilestoneCelebration = ({
  isOpen,
  onClose,
  milestoneName,
  milestoneDescription,
  milestoneColor
}: MilestoneCelebrationProps) => {
  const { user } = useAuth();
  
  useEffect(() => {
    if (isOpen) {
      // Fire confetti
      const duration = 3000;
      const end = Date.now() + duration;

      const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b'];

      (function frame() {
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: colors
        });
        confetti({
          particleCount: 4,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: colors
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      }());

      // Send push notification for milestone
      if (user) {
        callEdgeFunction('send-milestone-push', {
          userId: user.id,
          milestoneName,
          milestoneValue: milestoneDescription,
          milestoneType: 'achievement',
        }).catch(err => console.error('Milestone push failed:', err));
      }
    }
  }, [isOpen, user, milestoneName, milestoneDescription]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          
          {/* Modal */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="relative glass-card p-8 rounded-2xl max-w-md w-full border border-white/20 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 text-muted-foreground"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Background glow */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
            </div>

            {/* Content */}
            <div className="relative text-center">
              {/* Animated Trophy */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', delay: 0.2, damping: 10 }}
                className="w-24 h-24 mx-auto mb-6 relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent rounded-2xl rotate-6 opacity-50" />
                <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent rounded-2xl -rotate-6 opacity-50" />
                <div className="relative w-full h-full bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center">
                  <Trophy className="w-12 h-12 text-white" />
                </div>
                
                {/* Sparkles */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                  className="absolute -top-2 -right-2"
                >
                  <Sparkles className="w-6 h-6 text-yellow-400" />
                </motion.div>
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                  className="absolute -bottom-2 -left-2"
                >
                  <Star className="w-5 h-5 text-yellow-400" />
                </motion.div>
              </motion.div>

              {/* Title */}
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl font-bold mb-2 gradient-text"
              >
                Milestone Unlocked!
              </motion.h2>

              {/* Milestone Name */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${milestoneColor} border border-current/30 bg-current/10 mb-4`}
              >
                <Trophy className="w-4 h-4" />
                <span className="font-semibold">{milestoneName}</span>
              </motion.div>

              {/* Description */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-muted-foreground mb-6"
              >
                {milestoneDescription}
              </motion.p>

              {/* Benefits */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-white/5 rounded-xl p-4 mb-6 text-left"
              >
                <p className="text-sm font-medium mb-2">🎁 New Benefits Unlocked:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>✓ Access to new confidence-level signals</li>
                  <li>✓ Extended signal analytics</li>
                  <li>✓ Milestone-specific strategies</li>
                </ul>
              </motion.div>

              {/* CTA */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <Button onClick={onClose} className="btn-glow w-full">
                  <Sparkles className="w-4 h-4 mr-2" />
                  View New Signals
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MilestoneCelebration;
