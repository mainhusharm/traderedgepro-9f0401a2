import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Globe, AlertTriangle, TrendingUp, Moon, Sun } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  getForexMarketStatus, 
  getFuturesMarketStatus, 
  TIMEZONES, 
  formatTimeInTimezone,
  formatDateInTimezone,
  type MarketStatus 
} from '@/services/marketHoursService';

const MarketHoursIndicator = () => {
  const [timezone, setTimezone] = useState(() => {
    return localStorage.getItem('preferred_timezone') || Intl.DateTimeFormat().resolvedOptions().timeZone;
  });
  const [forexStatus, setForexStatus] = useState<MarketStatus | null>(null);
  const [futuresStatus, setFuturesStatus] = useState<MarketStatus | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Update market status
    const updateStatus = () => {
      setForexStatus(getForexMarketStatus(timezone));
      setFuturesStatus(getFuturesMarketStatus());
      setCurrentTime(new Date());
    };

    updateStatus();
    const interval = setInterval(updateStatus, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [timezone]);

  useEffect(() => {
    localStorage.setItem('preferred_timezone', timezone);
  }, [timezone]);

  const getVolumeColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-success bg-success/10';
      case 'medium': return 'text-warning bg-warning/10';
      case 'low': return 'text-muted-foreground bg-muted/30';
      case 'closed': return 'text-destructive bg-destructive/10';
      default: return 'text-muted-foreground bg-muted/30';
    }
  };

  const getStatusIcon = (status: MarketStatus | null) => {
    if (!status) return <Clock className="w-4 h-4" />;
    if (!status.isOpen) return <Moon className="w-4 h-4" />;
    if (status.volumeLevel === 'high') return <TrendingUp className="w-4 h-4" />;
    return <Sun className="w-4 h-4" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-xl p-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Market Hours</h3>
        </div>
        
        {/* Timezone Selector */}
        <Select value={timezone} onValueChange={setTimezone}>
          <SelectTrigger className="w-[180px] h-8 text-xs bg-white/5 border-white/10">
            <SelectValue placeholder="Select timezone" />
          </SelectTrigger>
          <SelectContent>
            {TIMEZONES.map((tz) => (
              <SelectItem key={tz.value} value={tz.value} className="text-xs">
                {tz.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Current Time */}
      <div className="text-center mb-4 p-3 bg-white/5 rounded-lg">
        <p className="text-xs text-muted-foreground mb-1">Your Local Time</p>
        <p className="text-lg font-bold font-mono">{formatDateInTimezone(currentTime, timezone)}</p>
      </div>

      {/* Market Status Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Forex Status */}
        <div className={`rounded-lg p-3 ${forexStatus?.isOpen ? 'bg-success/10' : 'bg-muted/30'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium">Forex</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${getVolumeColor(forexStatus?.volumeLevel || 'closed')}`}>
              {forexStatus?.isOpen ? forexStatus.volumeLevel?.toUpperCase() : 'CLOSED'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon(forexStatus)}
            <span className="text-sm font-medium truncate">
              {forexStatus?.currentSession || 'Closed'}
            </span>
          </div>
        </div>

        {/* Futures Status */}
        <div className={`rounded-lg p-3 ${futuresStatus?.isOpen ? 'bg-success/10' : 'bg-muted/30'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium">Futures</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${getVolumeColor(futuresStatus?.volumeLevel || 'closed')}`}>
              {futuresStatus?.isOpen ? 'OPEN' : 'CLOSED'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon(futuresStatus)}
            <span className="text-sm font-medium truncate">
              {futuresStatus?.currentSession || 'Closed'}
            </span>
          </div>
        </div>
      </div>

      {/* Warning/Info */}
      {(forexStatus?.warning || futuresStatus?.warning) && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-3 p-3 rounded-lg bg-warning/10 border border-warning/20"
        >
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
            <div className="space-y-1">
              {forexStatus?.warning && (
                <p className="text-xs text-warning">{forexStatus.warning}</p>
              )}
              {futuresStatus?.warning && futuresStatus.warning !== forexStatus?.warning && (
                <p className="text-xs text-warning">{futuresStatus.warning}</p>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Active Sessions */}
      {forexStatus?.activeSessions && forexStatus.activeSessions.length > 0 && (
        <div className="mt-3 pt-3 border-t border-white/10">
          <p className="text-xs text-muted-foreground mb-2">Active Sessions</p>
          <div className="flex flex-wrap gap-2">
            {forexStatus.activeSessions.map((session) => (
              <span 
                key={session}
                className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium"
              >
                {session}
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default MarketHoursIndicator;
