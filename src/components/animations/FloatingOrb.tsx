import { motion } from 'framer-motion';

interface FloatingOrbProps {
  size?: 'sm' | 'md' | 'lg';
  position?: 'left' | 'right' | 'center';
  color?: 'primary' | 'secondary' | 'accent';
  className?: string;
}

const FloatingOrb = ({ 
  size = 'md', 
  position = 'right',
  color = 'primary',
  className = '' 
}: FloatingOrbProps) => {
  const sizeClasses = {
    sm: 'w-32 h-32',
    md: 'w-64 h-64',
    lg: 'w-96 h-96'
  };

  const positionClasses = {
    left: 'left-0 -translate-x-1/2',
    right: 'right-0 translate-x-1/2',
    center: 'left-1/2 -translate-x-1/2'
  };

  const colorClasses = {
    primary: 'bg-primary/10',
    secondary: 'bg-secondary/10',
    accent: 'bg-accent/10'
  };

  return (
    <motion.div
      className={`absolute pointer-events-none ${positionClasses[position]} ${className}`}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 1 }}
    >
      <motion.div
        className={`${sizeClasses[size]} rounded-full ${colorClasses[color]} blur-3xl`}
        animate={{
          y: [0, -20, 0],
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />
    </motion.div>
  );
};

export default FloatingOrb;
