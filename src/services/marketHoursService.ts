// Market Hours Service - Tracks forex, futures market sessions and volume

export interface MarketSession {
  name: string;
  timezone: string;
  open: string; // HH:MM in local time
  close: string;
  pairs: string[];
  volumeLevel: 'high' | 'medium' | 'low';
}

export interface MarketStatus {
  isOpen: boolean;
  currentSession: string | null;
  volumeLevel: 'high' | 'medium' | 'low' | 'closed';
  nextOpen: Date | null;
  warning: string | null;
  activeSessions: string[];
}

// Major forex trading sessions
const FOREX_SESSIONS: MarketSession[] = [
  {
    name: 'Sydney',
    timezone: 'Australia/Sydney',
    open: '07:00',
    close: '16:00',
    pairs: ['AUDUSD', 'NZDUSD', 'AUDJPY'],
    volumeLevel: 'low'
  },
  {
    name: 'Tokyo',
    timezone: 'Asia/Tokyo',
    open: '09:00',
    close: '18:00',
    pairs: ['USDJPY', 'EURJPY', 'GBPJPY', 'AUDJPY'],
    volumeLevel: 'medium'
  },
  {
    name: 'London',
    timezone: 'Europe/London',
    open: '08:00',
    close: '17:00',
    pairs: ['EURUSD', 'GBPUSD', 'EURGBP', 'USDCHF'],
    volumeLevel: 'high'
  },
  {
    name: 'New York',
    timezone: 'America/New_York',
    open: '08:00',
    close: '17:00',
    pairs: ['EURUSD', 'GBPUSD', 'USDCAD', 'USDJPY'],
    volumeLevel: 'high'
  }
];

// Futures market hours (CME)
const FUTURES_SESSIONS = {
  name: 'CME Futures',
  timezone: 'America/Chicago',
  // Sunday 5pm - Friday 4pm CT with daily break 4pm-5pm CT
  weekdayOpen: '17:00',
  weekdayClose: '16:00',
  dailyBreakStart: '16:00',
  dailyBreakEnd: '17:00'
};

export const TIMEZONES = [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'New York (EST/EDT)' },
  { value: 'America/Chicago', label: 'Chicago (CST/CDT)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (PST/PDT)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong (HKT)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' }
];

function parseTimeInTimezone(time: string, timezone: string): Date {
  const now = new Date();
  const [hours, minutes] = time.split(':').map(Number);
  
  // Create date string for the timezone
  const dateStr = now.toLocaleDateString('en-CA', { timeZone: timezone }); // YYYY-MM-DD format
  const fullDateTime = `${dateStr}T${time}:00`;
  
  // Parse in the target timezone (approximate)
  const tzDate = new Date(fullDateTime);
  
  return tzDate;
}

function isTimeInRange(time: Date, openTime: string, closeTime: string, timezone: string): boolean {
  const timeFormatter = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: timezone
  });
  
  const currentTime = timeFormatter.format(time);
  const [currentHour, currentMin] = currentTime.split(':').map(Number);
  const [openHour, openMin] = openTime.split(':').map(Number);
  const [closeHour, closeMin] = closeTime.split(':').map(Number);
  
  const currentMinutes = currentHour * 60 + currentMin;
  const openMinutes = openHour * 60 + openMin;
  const closeMinutes = closeHour * 60 + closeMin;
  
  return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
}

export function getForexMarketStatus(userTimezone: string = 'UTC'): MarketStatus {
  const now = new Date();
  const dayOfWeek = now.getUTCDay(); // 0 = Sunday, 6 = Saturday
  
  // Check if it's weekend (Forex closed from Friday 5pm EST to Sunday 5pm EST)
  const nyTime = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    hour12: false,
    weekday: 'short',
    timeZone: 'America/New_York'
  }).format(now);
  
  const [weekday, hour] = [nyTime.slice(0, 3), parseInt(nyTime.slice(-2))];
  
  // Weekend check
  if (weekday === 'Sat' || (weekday === 'Sun' && hour < 17) || (weekday === 'Fri' && hour >= 17)) {
    // Calculate next open time (Sunday 5pm EST)
    const nextOpen = new Date(now);
    if (weekday === 'Fri') {
      nextOpen.setDate(nextOpen.getDate() + 2); // Move to Sunday
    } else if (weekday === 'Sat') {
      nextOpen.setDate(nextOpen.getDate() + 1); // Move to Sunday
    }
    // Set to 5pm EST (22:00 UTC in winter, 21:00 UTC in summer)
    nextOpen.setUTCHours(22, 0, 0, 0);
    
    return {
      isOpen: false,
      currentSession: null,
      volumeLevel: 'closed',
      nextOpen,
      warning: '⚠️ Forex market is closed for the weekend',
      activeSessions: []
    };
  }
  
  // Check active sessions
  const activeSessions: string[] = [];
  let highestVolume: 'high' | 'medium' | 'low' = 'low';
  
  for (const session of FOREX_SESSIONS) {
    if (isTimeInRange(now, session.open, session.close, session.timezone)) {
      activeSessions.push(session.name);
      if (session.volumeLevel === 'high') highestVolume = 'high';
      else if (session.volumeLevel === 'medium' && highestVolume !== 'high') highestVolume = 'medium';
    }
  }
  
  // Determine overlap periods (highest volume)
  const isLondonNYOverlap = activeSessions.includes('London') && activeSessions.includes('New York');
  const isTokyoLondonOverlap = activeSessions.includes('Tokyo') && activeSessions.includes('London');
  
  let warning: string | null = null;
  
  if (activeSessions.length === 0) {
    warning = '📉 Low liquidity period - consider waiting for a major session to open';
    highestVolume = 'low';
  } else if (highestVolume === 'low') {
    warning = '📊 Sydney session only - lower volume expected';
  } else if (isLondonNYOverlap) {
    warning = '🔥 London-New York overlap - highest volume period!';
    highestVolume = 'high';
  } else if (isTokyoLondonOverlap) {
    warning = '📈 Tokyo-London overlap - good trading volume';
    highestVolume = 'high';
  }
  
  return {
    isOpen: true,
    currentSession: activeSessions.join(' & ') || 'Low Volume',
    volumeLevel: activeSessions.length > 0 ? highestVolume : 'low',
    nextOpen: null,
    warning,
    activeSessions
  };
}

export function getFuturesMarketStatus(): MarketStatus {
  const now = new Date();
  
  // Get Chicago time
  const chicagoTime = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    weekday: 'short',
    timeZone: 'America/Chicago'
  }).format(now);
  
  const parts = chicagoTime.split(' ');
  const weekday = parts[0].replace(',', '');
  const [hour, minute] = parts[1].split(':').map(Number);
  const currentMinutes = hour * 60 + minute;
  
  // Futures closed: Friday 4pm CT - Sunday 5pm CT
  // Daily break: 4pm - 5pm CT
  
  const isFridayAfter4pm = weekday === 'Fri' && currentMinutes >= 16 * 60;
  const isSaturday = weekday === 'Sat';
  const isSundayBefore5pm = weekday === 'Sun' && currentMinutes < 17 * 60;
  const isDailyBreak = currentMinutes >= 16 * 60 && currentMinutes < 17 * 60;
  
  if (isFridayAfter4pm || isSaturday || isSundayBefore5pm) {
    return {
      isOpen: false,
      currentSession: null,
      volumeLevel: 'closed',
      nextOpen: null,
      warning: '⚠️ CME Futures closed for the weekend',
      activeSessions: []
    };
  }
  
  if (isDailyBreak) {
    return {
      isOpen: false,
      currentSession: null,
      volumeLevel: 'closed',
      nextOpen: null,
      warning: '⏸️ Daily trading break (4pm - 5pm CT)',
      activeSessions: []
    };
  }
  
  return {
    isOpen: true,
    currentSession: 'CME Futures',
    volumeLevel: 'high',
    nextOpen: null,
    warning: null,
    activeSessions: ['CME Futures']
  };
}

export function formatTimeInTimezone(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: timezone
  }).format(date);
}

export function formatDateInTimezone(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: timezone
  }).format(date);
}
