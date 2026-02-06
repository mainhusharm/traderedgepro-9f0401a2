import { motion } from 'framer-motion';
import { Calendar, AlertTriangle, TrendingUp, Clock, Globe, ChevronRight, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEconomicEvents, EconomicEvent } from '@/hooks/useEconomicEvents';
import { useHighImpactNotifications } from '@/hooks/useHighImpactNotifications';
import { useState } from 'react';

const EconomicCalendar = () => {
  const { events, isLoading, refetch } = useEconomicEvents();
  const [selectedImpact, setSelectedImpact] = useState<'all' | 'high' | 'medium'>('all');

  // Enable push notifications for high-impact events
  useHighImpactNotifications(events);

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-risk/20 text-risk border-risk/30';
      case 'medium': return 'bg-warning/20 text-warning border-warning/30';
      default: return 'bg-muted/20 text-muted-foreground border-muted/30';
    }
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'high': return <AlertTriangle className="w-3 h-3" />;
      case 'medium': return <TrendingUp className="w-3 h-3" />;
      default: return <Clock className="w-3 h-3" />;
    }
  };

  const getCurrencyFlag = (currency: string) => {
    const flags: Record<string, string> = {
      'USD': '🇺🇸',
      'EUR': '🇪🇺',
      'GBP': '🇬🇧',
      'JPY': '🇯🇵',
      'AUD': '🇦🇺',
      'CAD': '🇨🇦',
      'CHF': '🇨🇭',
      'NZD': '🇳🇿',
    };
    return flags[currency] || '🌐';
  };

  const formatEventTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const filteredEvents = events.filter(event => {
    if (selectedImpact === 'all') return true;
    return event.impact === selectedImpact;
  });

  const upcomingHighImpact = events.filter(e => e.impact === 'high' && e.time > new Date()).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-xl p-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Economic Calendar</h3>
            <p className="text-xs text-muted-foreground">Today's market-moving events</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* High Impact Alert */}
      {upcomingHighImpact > 0 && (
        <div className="mb-4 p-3 bg-risk/10 border border-risk/30 rounded-lg flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-risk" />
          <div className="flex-1">
            <p className="text-sm font-medium text-risk">High Impact Events Ahead</p>
            <p className="text-xs text-muted-foreground">
              {upcomingHighImpact} high-impact event{upcomingHighImpact > 1 ? 's' : ''} upcoming - Consider reducing exposure
            </p>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-2 mb-4">
        {['all', 'high', 'medium'].map((filter) => (
          <button
            key={filter}
            onClick={() => setSelectedImpact(filter as 'all' | 'high' | 'medium')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
              selectedImpact === filter
                ? 'bg-primary text-primary-foreground'
                : 'bg-white/5 text-muted-foreground hover:bg-white/10'
            }`}
          >
            {filter === 'all' ? 'All Events' : `${filter} Impact`}
          </button>
        ))}
      </div>

      {/* Events List */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
          {filteredEvents.map((event) => {
            const isPast = event.time < new Date();
            return (
              <div
                key={event.id}
                className={`p-3 rounded-lg border ${isPast ? 'bg-white/5 border-white/10' : 'bg-white/[0.02] border-white/[0.08]'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">{getCurrencyFlag(event.currency)}</span>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{event.title}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium flex items-center gap-1 border ${getImpactColor(event.impact)}`}>
                          {getImpactIcon(event.impact)}
                          {event.impact.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        {event.country} • {event.currency}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatEventTime(event.time)}</p>
                    {isPast ? (
                      <p className="text-xs text-success">Released</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">Upcoming</p>
                    )}
                  </div>
                </div>

                {/* Forecast/Actual/Previous */}
                <div className="mt-2 pt-2 border-t border-white/5 grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Forecast</span>
                    <p className="font-medium">{event.forecast || '-'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Actual</span>
                    <p className={`font-medium ${event.actual ? 'text-primary' : ''}`}>
                      {event.actual || '-'}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Previous</span>
                    <p className="font-medium">{event.previous || '-'}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* View More */}
      <div className="mt-4 pt-3 border-t border-white/5">
        <Button 
          variant="ghost" 
          className="w-full text-sm text-muted-foreground hover:text-foreground"
          onClick={() => window.open('https://www.forexfactory.com/calendar', '_blank')}
        >
          View Full Calendar
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </motion.div>
  );
};

export default EconomicCalendar;
