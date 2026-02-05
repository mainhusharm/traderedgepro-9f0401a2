import { useMemo } from 'react';
import { format, formatInTimeZone, toZonedTime } from 'date-fns-tz';

export const useUserTimezone = () => {
  const timezone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return 'UTC';
    }
  }, []);

  const formatToUserTimezone = (dateString: string, formatStr: string = 'MMM d, yyyy h:mm a') => {
    try {
      const date = new Date(dateString);
      // Format in user's local timezone
      return format(date, formatStr);
    } catch {
      return dateString;
    }
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatToUserTimezone(dateString, 'MMM d');
  };

  const getTimezoneAbbr = () => {
    try {
      const date = new Date();
      const timeString = date.toLocaleTimeString('en-US', { timeZoneName: 'short' });
      const match = timeString.match(/[A-Z]{2,4}$/);
      return match ? match[0] : timezone;
    } catch {
      return timezone;
    }
  };

  return {
    timezone,
    formatToUserTimezone,
    formatRelativeTime,
    getTimezoneAbbr,
  };
};
