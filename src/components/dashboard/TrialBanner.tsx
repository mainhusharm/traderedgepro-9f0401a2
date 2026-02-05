import { motion } from 'framer-motion';
import { Clock, Zap, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface TrialBannerProps {
  expiresAt: Date;
  platform?: 'main' | 'mt5';
  onUpgrade?: () => void;
}

const TrialBanner = ({ expiresAt, platform = 'main', onUpgrade }: TrialBannerProps) => {
  const navigate = useNavigate();
  const [timeRemaining, setTimeRemaining] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [isDismissed, setIsDismissed] = useState(false);
  const [urgencyLevel, setUrgencyLevel] = useState<'normal' | 'warning' | 'critical'>('normal');

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime();
      const expiry = expiresAt.getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeRemaining({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining({ hours, minutes, seconds });

      // Set urgency level based on time remaining
      if (hours < 1) {
        setUrgencyLevel('critical');
      } else if (hours < 6) {
        setUrgencyLevel('warning');
      } else {
        setUrgencyLevel('normal');
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      navigate(platform === 'mt5' ? '/mt5-payment' : '/payment');
    }
  };

  if (isDismissed) return null;

  const getBannerStyles = () => {
    switch (urgencyLevel) {
      case 'critical':
        return 'bg-destructive/10 border-destructive/50 text-destructive';
      case 'warning':
        return 'bg-yellow-500/10 border-yellow-500/50 text-yellow-600 dark:text-yellow-400';
      default:
        return 'bg-primary/10 border-primary/50 text-primary';
    }
  };

  const formatTime = (value: number) => value.toString().padStart(2, '0');

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'relative flex items-center justify-between gap-4 px-4 py-3 rounded-lg border mb-4',
        getBannerStyles()
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          'flex items-center justify-center w-8 h-8 rounded-full',
          urgencyLevel === 'critical' ? 'bg-destructive/20' : 
          urgencyLevel === 'warning' ? 'bg-yellow-500/20' : 'bg-primary/20'
        )}>
          <Clock className="w-4 h-4" />
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
          <span className="font-semibold text-sm flex items-center gap-1">
            <Zap className="w-3 h-3" />
            Trial Mode
          </span>
          
          <div className="flex items-center gap-1 font-mono text-lg font-bold">
            <span className="bg-background/50 px-2 py-0.5 rounded">
              {formatTime(timeRemaining.hours)}
            </span>
            <span>:</span>
            <span className="bg-background/50 px-2 py-0.5 rounded">
              {formatTime(timeRemaining.minutes)}
            </span>
            <span>:</span>
            <span className="bg-background/50 px-2 py-0.5 rounded">
              {formatTime(timeRemaining.seconds)}
            </span>
          </div>
          
          <span className="text-xs opacity-75 hidden sm:inline">remaining</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant={urgencyLevel === 'critical' ? 'destructive' : 'default'}
          onClick={handleUpgrade}
          className="whitespace-nowrap"
        >
          Upgrade Now
        </Button>
        
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 opacity-50 hover:opacity-100"
          onClick={() => setIsDismissed(true)}
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
    </motion.div>
  );
};

export default TrialBanner;
