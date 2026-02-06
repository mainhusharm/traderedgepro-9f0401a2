import { useState, useEffect, useCallback } from 'react';
import { callEdgeFunction } from '@/config/api';

export interface EconomicEvent {
  id: string;
  title: string;
  country: string;
  currency: string;
  impact: 'high' | 'medium' | 'low';
  time: Date;
  actual?: string;
  forecast?: string;
  previous?: string;
}

export const useEconomicEvents = () => {
  const [events, setEvents] = useState<EconomicEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await callEdgeFunction('economic-calendar', {});

      if (error) {
        console.error('Error fetching economic calendar:', error);
        setError('Failed to fetch economic events');
        // Fall back to simulated data
        setEvents(generateSimulatedEvents());
        return;
      }

      if (data && Array.isArray(data.events)) {
        const mappedEvents: EconomicEvent[] = data.events.map((event: any, index: number) => ({
          id: `event-${index}`,
          title: event.name || event.title || 'Economic Event',
          country: event.country || 'US',
          currency: event.currency || 'USD',
          impact: mapImpact(event.impact || event.importance),
          time: new Date(event.date || event.time || Date.now()),
          actual: event.actual,
          forecast: event.forecast,
          previous: event.previous,
        }));
        setEvents(mappedEvents);
      } else {
        // If API returns different format or no events, use simulated
        console.log('Using simulated events - API format unexpected');
        setEvents(generateSimulatedEvents());
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to fetch economic events');
      setEvents(generateSimulatedEvents());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
    // Refresh every 5 minutes
    const interval = setInterval(fetchEvents, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchEvents]);

  return { events, isLoading, error, refetch: fetchEvents };
};

function mapImpact(impact: string | number): 'high' | 'medium' | 'low' {
  if (typeof impact === 'number') {
    if (impact >= 3) return 'high';
    if (impact >= 2) return 'medium';
    return 'low';
  }
  const lowerImpact = (impact || '').toLowerCase();
  if (lowerImpact.includes('high') || lowerImpact === '3') return 'high';
  if (lowerImpact.includes('medium') || lowerImpact === '2') return 'medium';
  return 'low';
}

function generateSimulatedEvents(): EconomicEvent[] {
  const now = new Date();
  return [
    {
      id: '1',
      title: 'Federal Reserve Interest Rate Decision',
      country: 'US',
      currency: 'USD',
      impact: 'high',
      time: new Date(now.getTime() + 2 * 60 * 60 * 1000),
      forecast: '5.50%',
      previous: '5.25%',
    },
    {
      id: '2',
      title: 'Non-Farm Payrolls',
      country: 'US',
      currency: 'USD',
      impact: 'high',
      time: new Date(now.getTime() + 4 * 60 * 60 * 1000),
      forecast: '180K',
      previous: '175K',
    },
    {
      id: '3',
      title: 'ECB President Lagarde Speech',
      country: 'EU',
      currency: 'EUR',
      impact: 'medium',
      time: new Date(now.getTime() + 6 * 60 * 60 * 1000),
    },
    {
      id: '4',
      title: 'UK CPI (YoY)',
      country: 'UK',
      currency: 'GBP',
      impact: 'high',
      time: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      forecast: '4.2%',
      previous: '4.0%',
    },
    {
      id: '5',
      title: 'Japan GDP (QoQ)',
      country: 'JP',
      currency: 'JPY',
      impact: 'medium',
      time: new Date(now.getTime() + 30 * 60 * 60 * 1000),
      forecast: '0.5%',
      previous: '0.4%',
    },
  ];
}
