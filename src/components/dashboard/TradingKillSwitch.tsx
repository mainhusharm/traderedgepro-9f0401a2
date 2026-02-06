import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Lock, Unlock, Timer } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
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

interface TradingKillSwitchProps {
  accountId: string;
  currentLockUntil?: string | null;
  lockReason?: string | null;
  onLockChange?: () => void;
  tableName?: 'user_prop_accounts' | 'user_personal_accounts';
}

const LOCK_DURATIONS = [
  { label: '30 minutes', minutes: 30 },
  { label: '1 hour', minutes: 60 },
  { label: '2 hours', minutes: 120 },
  { label: 'Rest of day', minutes: 'eod' as const },
];

export default function TradingKillSwitch({ 
  accountId, 
  currentLockUntil,
  lockReason,
  onLockChange,
  tableName = 'user_prop_accounts'
}: TradingKillSwitchProps) {
  const [isLocking, setIsLocking] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState<number | 'eod'>(30);
  
  const isLocked = currentLockUntil && new Date(currentLockUntil) > new Date();
  const lockEndTime = currentLockUntil ? new Date(currentLockUntil) : null;

  const handleLock = async () => {
    setIsLocking(true);
    try {
      let lockUntil: Date;
      
      if (selectedDuration === 'eod') {
        // End of trading day (21:00 UTC / NY close)
        lockUntil = new Date();
        lockUntil.setUTCHours(21, 0, 0, 0);
        if (lockUntil < new Date()) {
          lockUntil.setDate(lockUntil.getDate() + 1);
        }
      } else {
        lockUntil = new Date(Date.now() + selectedDuration * 60 * 1000);
      }

      const { error } = await supabase
        .from(tableName as any)
        .update({
          trading_locked_until: lockUntil.toISOString(),
          lock_reason: 'Manual kill switch activated - Taking a trading break'
        })
        .eq('id', accountId);

      if (error) throw error;

      toast.success('Trading paused', {
        description: `Trading locked until ${format(lockUntil, 'HH:mm')}`
      });
      
      onLockChange?.();
    } catch (error: any) {
      toast.error('Failed to activate kill switch', { description: error.message });
    } finally {
      setIsLocking(false);
    }
  };

  const handleUnlock = async () => {
    setIsLocking(true);
    try {
      const { error } = await supabase
        .from(tableName as any)
        .update({
          trading_locked_until: null,
          lock_reason: null
        })
        .eq('id', accountId);

      if (error) throw error;

      toast.success('Trading resumed');
      onLockChange?.();
    } catch (error: any) {
      toast.error('Failed to unlock', { description: error.message });
    } finally {
      setIsLocking(false);
    }
  };

  return (
    <Card className={`border ${isLocked ? 'border-destructive bg-destructive/5' : 'border-border'}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            {isLocked ? <Lock className="h-4 w-4 text-destructive" /> : <AlertTriangle className="h-4 w-4 text-amber-500" />}
            Kill Switch
          </div>
          <Badge variant={isLocked ? 'destructive' : 'outline'}>
            {isLocked ? 'LOCKED' : 'Ready'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLocked ? (
          <>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Timer className="h-4 w-4" />
                <span>Locked until {format(lockEndTime!, 'HH:mm')} ({formatDistanceToNow(lockEndTime!, { addSuffix: true })})</span>
              </div>
              {lockReason && (
                <p className="text-xs text-muted-foreground">{lockReason}</p>
              )}
            </div>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full"
                  disabled={isLocking}
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
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Feeling emotional? Stop trading and protect your account.
            </p>
            
            <div className="flex flex-wrap gap-2">
              {LOCK_DURATIONS.map((duration) => (
                <Button
                  key={duration.label}
                  variant={selectedDuration === duration.minutes ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedDuration(duration.minutes)}
                >
                  {duration.label}
                </Button>
              ))}
            </div>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  className="w-full"
                  disabled={isLocking}
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Stop Trading Now
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Activate Kill Switch?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will prevent you from taking any new trades for {
                      selectedDuration === 'eod' 
                        ? 'the rest of the trading day' 
                        : `${selectedDuration} minutes`
                    }. All open trades will remain unaffected.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleLock} className="bg-destructive hover:bg-destructive/90">
                    Confirm Lock
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </CardContent>
    </Card>
  );
}
