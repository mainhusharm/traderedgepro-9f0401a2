// Timezone Service
// Handles global timezone conversions for trading sessions

interface TradingSession {
  name: string;
  open: { hour: number; minute: number };
  close: { hour: number; minute: number };
  timezone: string;
  pairs: string[];
}

const TRADING_SESSIONS: TradingSession[] = [
  {
    name: 'Sydney',
    open: { hour: 22, minute: 0 },
    close: { hour: 7, minute: 0 },
    timezone: 'Australia/Sydney',
    pairs: ['AUDUSD', 'NZDUSD', 'AUDJPY', 'AUDNZD'],
  },
  {
    name: 'Tokyo',
    open: { hour: 0, minute: 0 },
    close: { hour: 9, minute: 0 },
    timezone: 'Asia/Tokyo',
    pairs: ['USDJPY', 'EURJPY', 'GBPJPY', 'AUDJPY'],
  },
  {
    name: 'London',
    open: { hour: 8, minute: 0 },
    close: { hour: 17, minute: 0 },
    timezone: 'Europe/London',
    pairs: ['EURUSD', 'GBPUSD', 'EURGBP', 'EURJPY'],
  },
  {
    name: 'New York',
    open: { hour: 13, minute: 0 },
    close: { hour: 22, minute: 0 },
    timezone: 'America/New_York',
    pairs: ['EURUSD', 'GBPUSD', 'USDCAD', 'USDJPY'],
  },
];

export const getActiveSession = (userTimezone: string = 'UTC'): TradingSession | null => {
  const now = new Date();
  const utcHour = now.getUTCHours();
  const utcMinute = now.getUTCMinutes();
  const currentTimeInMinutes = utcHour * 60 + utcMinute;

  for (const session of TRADING_SESSIONS) {
    const openMinutes = session.open.hour * 60 + session.open.minute;
    const closeMinutes = session.close.hour * 60 + session.close.minute;

    // Handle sessions that cross midnight
    if (closeMinutes < openMinutes) {
      if (currentTimeInMinutes >= openMinutes || currentTimeInMinutes < closeMinutes) {
        return session;
      }
    } else {
      if (currentTimeInMinutes >= openMinutes && currentTimeInMinutes < closeMinutes) {
        return session;
      }
    }
  }

  return null;
};

export const getMarketStatus = (userTimezone: string = 'UTC'): {
  isOpen: boolean;
  activeSession: string | null;
  nextOpen: string;
  sessionsStatus: Record<string, boolean>;
} => {
  const now = new Date();
  const day = now.getUTCDay();

  // Forex market is closed on weekends
  if (day === 0 || day === 6) {
    return {
      isOpen: false,
      activeSession: null,
      nextOpen: 'Sunday 22:00 UTC',
      sessionsStatus: {
        Sydney: false,
        Tokyo: false,
        London: false,
        'New York': false,
      },
    };
  }

  const activeSession = getActiveSession(userTimezone);
  const sessionsStatus: Record<string, boolean> = {};

  TRADING_SESSIONS.forEach(session => {
    const utcHour = now.getUTCHours();
    const utcMinute = now.getUTCMinutes();
    const currentTimeInMinutes = utcHour * 60 + utcMinute;
    const openMinutes = session.open.hour * 60 + session.open.minute;
    const closeMinutes = session.close.hour * 60 + session.close.minute;

    if (closeMinutes < openMinutes) {
      sessionsStatus[session.name] = 
        currentTimeInMinutes >= openMinutes || currentTimeInMinutes < closeMinutes;
    } else {
      sessionsStatus[session.name] = 
        currentTimeInMinutes >= openMinutes && currentTimeInMinutes < closeMinutes;
    }
  });

  return {
    isOpen: activeSession !== null,
    activeSession: activeSession?.name || null,
    nextOpen: activeSession ? 'Currently open' : 'Check session times',
    sessionsStatus,
  };
};

export const formatTimeInTimezone = (date: Date, timezone: string): string => {
  try {
    return date.toLocaleTimeString('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return date.toLocaleTimeString();
  }
};

export const getSessionOverlaps = (): { sessions: string[]; description: string }[] => {
  return [
    {
      sessions: ['Tokyo', 'Sydney'],
      description: 'Asian session overlap - High AUD, NZD, JPY volatility',
    },
    {
      sessions: ['London', 'Tokyo'],
      description: 'London-Tokyo overlap - EUR and JPY pairs active',
    },
    {
      sessions: ['London', 'New York'],
      description: 'Most volatile period - Major pairs highly active',
    },
  ];
};

export const getBestTradingHours = (preferredPairs: string[]): string => {
  const sessions = TRADING_SESSIONS.filter(session =>
    session.pairs.some(pair => preferredPairs.includes(pair))
  );

  if (sessions.length === 0) {
    return 'London-New York overlap (13:00-17:00 UTC)';
  }

  return sessions.map(s => s.name).join(' or ') + ' session hours';
};

export const COMMON_TIMEZONES = [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'New York (EST)' },
  { value: 'America/Chicago', label: 'Chicago (CST)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (PST)' },
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'Europe/Paris', label: 'Paris (CET)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong (HKT)' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Asia/Kolkata', label: 'Mumbai (IST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
];
