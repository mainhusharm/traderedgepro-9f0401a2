import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, Zap, Moon, Sun, Sunset } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KillZoneInfo {
  name: string;
  displayName: string;
  active: boolean;
  icon: typeof Clock;
  color: string;
  probability: number;
}

export const KillZoneBadge = () => {
  const [killZone, setKillZone] = useState<KillZoneInfo | null>(null);

  useEffect(() => {
    const updateKillZone = () => {
      const now = new Date();
      const utcHour = now.getUTCHours();
      
      // Convert to EST (UTC-5)
      const estHour = (utcHour - 5 + 24) % 24;

      let info: KillZoneInfo;

      // London Open: 2-5 AM EST
      if (estHour >= 2 && estHour < 5) {
        info = {
          name: 'london_open',
          displayName: 'London Open',
          active: true,
          icon: Sun,
          color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
          probability: 75
        };
      }
      // NY Open: 7-10 AM EST
      else if (estHour >= 7 && estHour < 10) {
        info = {
          name: 'ny_open',
          displayName: 'NY Open',
          active: true,
          icon: Zap,
          color: 'bg-green-500/20 text-green-400 border-green-500/30',
          probability: 80
        };
      }
      // London Close: 11 AM - 12 PM EST
      else if (estHour >= 11 && estHour < 12) {
        info = {
          name: 'london_close',
          displayName: 'London Close',
          active: true,
          icon: Sunset,
          color: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
          probability: 65
        };
      }
      // Asian Session: 7 PM - 4 AM EST
      else if (estHour >= 19 || estHour < 4) {
        info = {
          name: 'asian',
          displayName: 'Asian Session',
          active: true,
          icon: Moon,
          color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
          probability: 50
        };
      }
      // Off Hours
      else {
        info = {
          name: 'off_hours',
          displayName: 'Off Hours',
          active: false,
          icon: Clock,
          color: 'bg-muted/50 text-muted-foreground border-muted',
          probability: 40
        };
      }

      setKillZone(info);
    };

    updateKillZone();
    const interval = setInterval(updateKillZone, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  if (!killZone) return null;

  const Icon = killZone.icon;

  return (
    <Badge 
      variant="outline" 
      className={cn(
        'gap-1.5 px-3 py-1',
        killZone.color,
        killZone.active && 'animate-pulse'
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{killZone.displayName}</span>
      {killZone.active && (
        <span className="text-xs opacity-70">({killZone.probability}%)</span>
      )}
    </Badge>
  );
};
