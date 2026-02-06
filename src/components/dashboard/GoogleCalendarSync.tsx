import { useState, useCallback } from 'react';
import { Calendar, ExternalLink, Check, Loader2, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface GuidanceSession {
  id: string;
  session_number: string;
  topic: string;
  description: string | null;
  scheduled_at: string | null;
  preferred_date: string | null;
}

interface GoogleCalendarSyncProps {
  session: GuidanceSession;
  className?: string;
}

const GoogleCalendarSync = ({ session, className }: GoogleCalendarSyncProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  const generateGoogleCalendarUrl = useCallback(() => {
    const sessionDate = session.scheduled_at || session.preferred_date;
    if (!sessionDate) return null;

    const startDate = new Date(sessionDate);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour duration

    const formatDateForGoogle = (date: Date) => {
      return date.toISOString().replace(/-|:|\.\d+/g, '').slice(0, -1) + 'Z';
    };

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: `Trading Guidance: ${session.topic}`,
      dates: `${formatDateForGoogle(startDate)}/${formatDateForGoogle(endDate)}`,
      details: `Session: ${session.session_number}\n\n${session.description || 'No description provided.'}\n\nJoin your guidance session through the Trader Edge Pro dashboard.`,
      location: 'Trader Edge Pro Dashboard',
      sf: 'true',
      output: 'xml',
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }, [session]);

  const handleAddToCalendar = () => {
    const url = generateGoogleCalendarUrl();
    if (!url) {
      toast.error('No scheduled date available for this session');
      return;
    }

    setIsAdding(true);
    
    // Open Google Calendar in new tab
    window.open(url, '_blank', 'noopener,noreferrer');
    
    setTimeout(() => {
      setIsAdding(false);
      setIsAdded(true);
      toast.success('Opening Google Calendar...');
    }, 500);
  };

  const sessionDate = session.scheduled_at || session.preferred_date;

  if (!sessionDate) {
    return null;
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleAddToCalendar}
      disabled={isAdding}
      className={className}
    >
      {isAdding ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : isAdded ? (
        <Check className="w-4 h-4 mr-2 text-success" />
      ) : (
        <Calendar className="w-4 h-4 mr-2" />
      )}
      {isAdded ? 'Added' : 'Add to Calendar'}
    </Button>
  );
};

export const GoogleCalendarCard = () => {
  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          Google Calendar
        </CardTitle>
        <CardDescription>
          Sync your guidance sessions with Google Calendar
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Click "Add to Calendar" on any scheduled session to add it to your Google Calendar.
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link2 className="w-3 h-3" />
            <span>Sessions are automatically formatted with all details</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GoogleCalendarSync;
