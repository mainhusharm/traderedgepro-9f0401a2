import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { Clock, Save, X, Edit2 } from 'lucide-react';
import { toast } from 'sonner';

interface TradingHoursConfigProps {
  accountId: string;
}

interface TradingHours {
  start: string;
  end: string;
  enabled: boolean;
}

interface TradingConfig {
  hours: TradingHours;
  newsBufferMinutes: number;
}

const TradingHoursConfig = ({ accountId }: TradingHoursConfigProps) => {
  const [hours, setHours] = useState<TradingHours>({ start: '08:00', end: '16:00', enabled: false });
  const [newsBufferMinutes, setNewsBufferMinutes] = useState<number>(30);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchConfig();
  }, [accountId]);

  const fetchConfig = async () => {
    try {
      const { data: account } = await supabase
        .from('user_prop_accounts')
        .select('allowed_trading_hours, news_buffer_minutes')
        .eq('id', accountId)
        .single();

      if (account) {
        if (account.allowed_trading_hours) {
          const config = account.allowed_trading_hours as any;
          setHours({
            start: config.start || '08:00',
            end: config.end || '16:00',
            enabled: config.enabled !== false,
          });
        }
        setNewsBufferMinutes(account.news_buffer_minutes || 30);
      }
    } catch (err) {
      console.error('Error fetching trading hours:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfig = async () => {
    setIsSaving(true);
    try {
      const configToSave = hours.enabled ? {
        start: hours.start,
        end: hours.end,
        enabled: true,
      } : null;

      const { error } = await supabase
        .from('user_prop_accounts')
        .update({ 
          allowed_trading_hours: configToSave,
          news_buffer_minutes: newsBufferMinutes
        })
        .eq('id', accountId);

      if (error) throw error;

      toast.success('Trading configuration updated');
      setIsEditing(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return null;
  }

  const isWithinHours = () => {
    if (!hours.enabled) return true;
    const now = new Date();
    const currentHour = now.getUTCHours();
    const currentMinute = now.getUTCMinutes();
    const currentTime = currentHour * 60 + currentMinute;

    const [startH, startM] = hours.start.split(':').map(Number);
    const [endH, endM] = hours.end.split(':').map(Number);
    const startTime = startH * 60 + startM;
    const endTime = endH * 60 + endM;

    return startTime <= endTime 
      ? (currentTime >= startTime && currentTime <= endTime)
      : (currentTime >= startTime || currentTime <= endTime);
  };

  const withinHours = isWithinHours();

  return (
    <Card className={`border-border/50 ${hours.enabled && !withinHours ? 'border-warning/50 bg-warning/5' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Trading Hours
          </CardTitle>
          {hours.enabled ? (
            withinHours ? (
              <Badge variant="outline" className="text-success border-success/50">
                Open
              </Badge>
            ) : (
              <Badge variant="outline" className="text-warning border-warning/50">
                Closed
              </Badge>
            )
          ) : (
            <Badge variant="secondary">Disabled</Badge>
          )}
        </div>
        <CardDescription>
          Restrict trading to specific hours
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEditing ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="hours-enabled">Enable trading hours restriction</Label>
              <Switch
                id="hours-enabled"
                checked={hours.enabled}
                onCheckedChange={(checked) => setHours({ ...hours, enabled: checked })}
              />
            </div>

            {hours.enabled && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Time (UTC)</Label>
                  <Input
                    type="time"
                    value={hours.start}
                    onChange={(e) => setHours({ ...hours, start: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Time (UTC)</Label>
                  <Input
                    type="time"
                    value={hours.end}
                    onChange={(e) => setHours({ ...hours, end: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2 pt-2 border-t border-border/50">
              <Label>News Buffer (minutes)</Label>
              <Input
                type="number"
                min={15}
                max={60}
                value={newsBufferMinutes}
                onChange={(e) => setNewsBufferMinutes(parseInt(e.target.value) || 30)}
                placeholder="30"
              />
              <p className="text-xs text-muted-foreground">
                Block new trades within {newsBufferMinutes} minutes of high-impact news
              </p>
            </div>

            <div className="flex gap-2">
              <Button onClick={saveConfig} disabled={isSaving} className="flex-1">
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {hours.enabled ? (
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <span className="text-sm">Trading Window (UTC)</span>
                <span className="font-mono font-medium">
                  {hours.start} - {hours.end}
                </span>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No trading hour restrictions set. Trading allowed 24/5.
              </p>
            )}

            {hours.enabled && !withinHours && (
              <div className="p-3 rounded-lg bg-warning/10 border border-warning/30 text-sm">
                Trading is currently blocked. Market opens at {hours.start} UTC.
              </div>
            )}

            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsEditing(true)}
              className="w-full"
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Configure Hours
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TradingHoursConfig;
