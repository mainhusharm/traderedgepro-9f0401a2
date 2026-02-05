import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, Timer, ShieldAlert, Unlock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, formatDistanceToNow } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useDashboardMode } from '@/lib/context/DashboardModeContext';

interface TradingLockedOverlayProps {
  lockUntil: Date;
  lockReason: string | null;
  accountId: string;
  onUnlock?: () => void;
}

export default function TradingLockedOverlay({ 
  lockUntil, 
  lockReason, 
  accountId,
  onUnlock 
}: TradingLockedOverlayProps) {
  const { mode } = useDashboardMode();
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [isUnlocking, setIsUnlocking] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = lockUntil.getTime() - Date.now();
      
      if (difference <= 0) {
        return { hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        hours: Math.floor(difference / (1000 * 60 * 60)),
        minutes: Math.floor((difference / (1000 * 60)) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);
      
      // If time is up, trigger unlock
      if (newTimeLeft.hours === 0 && newTimeLeft.minutes === 0 && newTimeLeft.seconds === 0) {
        onUnlock?.();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [lockUntil, onUnlock]);

  const handleUnlock = async () => {
    setIsUnlocking(true);
    try {
      const tableName = mode === 'prop_firm' ? 'user_prop_accounts' : 'user_personal_accounts';
      
      const { error } = await supabase
        .from(tableName as any)
        .update({
          trading_locked_until: null,
          lock_reason: null
        })
        .eq('id', accountId);

      if (error) throw error;

      toast.success('Trading resumed');
      onUnlock?.();
    } catch (error: any) {
      toast.error('Failed to unlock', { description: error.message });
    } finally {
      setIsUnlocking(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-background/80"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="max-w-md w-full mx-4"
      >
        <div className="bg-destructive/10 border border-destructive/30 rounded-2xl p-8 text-center space-y-6">
          {/* Lock Icon with Animation */}
          <motion.div
            animate={{ 
              scale: [1, 1.05, 1],
              rotate: [0, -5, 5, 0]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse"
            }}
            className="w-20 h-20 mx-auto rounded-full bg-destructive/20 flex items-center justify-center"
          >
            <ShieldAlert className="w-10 h-10 text-destructive" />
          </motion.div>

          {/* Title */}
          <div>
            <h2 className="text-2xl font-bold text-destructive mb-2">Trading Locked</h2>
            <p className="text-muted-foreground text-sm">
              Kill switch activated to protect your account
            </p>
          </div>

          {/* Countdown Timer */}
          <div className="bg-muted/30 rounded-xl p-4">
            <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm mb-3">
              <Timer className="w-4 h-4" />
              <span>Unlocks in</span>
            </div>
            <div className="flex justify-center gap-3">
              <div className="bg-background/50 rounded-lg px-4 py-2 min-w-[60px]">
                <div className="text-2xl font-bold text-foreground tabular-nums">
                  {String(timeLeft.hours).padStart(2, '0')}
                </div>
                <div className="text-xs text-muted-foreground">Hours</div>
              </div>
              <div className="text-2xl font-bold text-muted-foreground self-start pt-2">:</div>
              <div className="bg-background/50 rounded-lg px-4 py-2 min-w-[60px]">
                <div className="text-2xl font-bold text-foreground tabular-nums">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </div>
                <div className="text-xs text-muted-foreground">Mins</div>
              </div>
              <div className="text-2xl font-bold text-muted-foreground self-start pt-2">:</div>
              <div className="bg-background/50 rounded-lg px-4 py-2 min-w-[60px]">
                <div className="text-2xl font-bold text-foreground tabular-nums">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </div>
                <div className="text-xs text-muted-foreground">Secs</div>
              </div>
            </div>
          </div>

          {/* Lock Time Info */}
          <div className="text-sm text-muted-foreground">
            <p>Until {format(lockUntil, 'HH:mm')} ({formatDistanceToNow(lockUntil, { addSuffix: true })})</p>
            {lockReason && (
              <p className="mt-2 italic text-xs">{lockReason}</p>
            )}
          </div>

          {/* Unlock Early Button */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full border-destructive/30 text-destructive hover:bg-destructive/10"
                disabled={isUnlocking}
              >
                <Unlock className="h-4 w-4 mr-2" />
                Unlock Early
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to unlock?</AlertDialogTitle>
                <AlertDialogDescription>
                  You activated the kill switch to protect yourself. Consider whether you're ready to trade again with a clear mindset.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Stay Locked</AlertDialogCancel>
                <AlertDialogAction onClick={handleUnlock}>
                  Yes, Unlock
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Motivational Message */}
          <p className="text-xs text-muted-foreground">
            Taking a break shows discipline. Use this time to review your strategy and come back stronger.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
