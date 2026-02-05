import { motion } from 'framer-motion';

interface GlowingDividerProps {
  className?: string;
}

const GlowingDivider = ({ className = '' }: GlowingDividerProps) => {
  return (
    <div className={`relative w-full py-8 ${className}`}>
      {/* Main line */}
      <motion.div
        className="relative h-px w-full overflow-hidden"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.8 }}
      >
        {/* Base line */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        
        {/* Animated glow */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/60 to-transparent"
          initial={{ x: '-100%' }}
          whileInView={{ x: '100%' }}
          viewport={{ once: true }}
          transition={{ duration: 1.5, ease: 'easeInOut', delay: 0.3 }}
        />
      </motion.div>
      
      {/* Center dot */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        initial={{ scale: 0, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <div className="relative">
          <div className="h-2 w-2 rounded-full bg-primary/80" />
          <div className="absolute inset-0 h-2 w-2 rounded-full bg-primary/40 animate-ping" />
        </div>
      </motion.div>
    </div>
  );
};

export default GlowingDivider;
