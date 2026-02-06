import { useState, useEffect } from 'react';
import { Bell, BellOff, Volume2, VolumeX, Smartphone, Mail, TestTube, Loader2, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';

interface NotificationSettings {
  push_enabled: boolean;
  push_signals: boolean;
  push_vip_signals: boolean;
  push_milestones: boolean;
  push_badges: boolean;
  push_guidance: boolean;
  push_economic: boolean;
  email_enabled: boolean;
  email_reports: boolean;
  email_digest: boolean;
  email_tips: boolean;
  email_promotional: boolean;
  sound_enabled: boolean;
}

const defaultSettings: NotificationSettings = {
  push_enabled: true,
  push_signals: true,
  push_vip_signals: true,
  push_milestones: true,
  push_badges: true,
  push_guidance: true,
  push_economic: false,
  email_enabled: true,
  email_reports: true,
  email_digest: true,
  email_tips: true,
  email_promotional: false,
  sound_enabled: true,
};

export const NotificationSettingsPanel = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    // Load settings from localStorage and profile
    const stored = localStorage.getItem('notification_settings');
    if (stored) {
      try {
        setSettings({ ...defaultSettings, ...JSON.parse(stored) });
      } catch (e) {
        console.error('Error parsing notification settings:', e);
      }
    }

    // Check push permission
    if ('Notification' in window) {
      setPushPermission(Notification.permission);
    }
  }, []);

  const handleToggle = async (key: keyof NotificationSettings) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    localStorage.setItem('notification_settings', JSON.stringify(newSettings));

    // If enabling push, request permission
    if (key === 'push_enabled' && !settings.push_enabled) {
      if ('Notification' in window && Notification.permission === 'default') {
        const result = await Notification.requestPermission();
        setPushPermission(result);
        if (result !== 'granted') {
          toast.error('Push notifications were denied');
          setSettings(prev => ({ ...prev, push_enabled: false }));
          return;
        }
      }
    }

    // Update profile if email settings changed
    if (key.startsWith('email_') && user) {
      setIsSaving(true);
      try {
        await supabase.from('profiles').update({
          email_preferences: {
            performance_reports: newSettings.email_reports,
            weekly_summary: newSettings.email_digest,
            trading_tips: newSettings.email_tips,
            promotional: newSettings.email_promotional,
          }
        }).eq('user_id', user.id);
      } catch (e) {
        console.error('Error saving email preferences:', e);
      }
      setIsSaving(false);
    }

    toast.success('Setting updated');
  };

  const testPushNotification = async () => {
    if (!('Notification' in window)) {
      toast.error('Push notifications not supported');
      return;
    }

    if (Notification.permission !== 'granted') {
      const result = await Notification.requestPermission();
      setPushPermission(result);
      if (result !== 'granted') {
        toast.error('Please enable notifications first');
        return;
      }
    }

    setIsTesting(true);

    try {
      // Use backend edge function to send a real push notification
      const { data, error } = await supabase.functions.invoke('send-web-push', {
        body: {
          title: '🔔 Test Notification',
          body: 'Push notifications are working correctly!',
          data: { url: '/dashboard' },
        },
      });

      if (error) {
        console.error('Push test error:', error);
        toast.error(`Push failed: ${error.message || 'Unknown error'}`);
      } else if (data?.error) {
        console.error('Push test backend error:', data);
        toast.error(`Push failed: ${data.error}`);
      } else {
        toast.success('Test notification sent! Check your system notifications.');
      }
    } catch (err: unknown) {
      console.error('Push test exception:', err);
      const msg = err instanceof Error ? err.message : 'Unknown error';
      toast.error(`Push failed: ${msg}`);
    } finally {
      setIsTesting(false);
    }
  };

  const testSound = () => {
    const audio = new Audio('data:audio/wav;base64,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');
    audio.volume = 0.5;
    audio.play();
    toast.success('Sound test played');
  };

  return (
    <div className="space-y-6">
      {/* Push Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            Push Notifications
          </CardTitle>
          <CardDescription>
            Receive instant alerts on your device
            {pushPermission === 'denied' && (
              <span className="text-destructive block mt-1">
                Notifications are blocked. Enable them in browser settings.
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Push Notifications</Label>
              <p className="text-sm text-muted-foreground">Master toggle for all push alerts</p>
            </div>
            <Switch checked={settings.push_enabled} onCheckedChange={() => handleToggle('push_enabled')} />
          </div>
          
          {settings.push_enabled && (
            <>
              <Separator />
              <div className="space-y-3">
                {[
                  { key: 'push_signals' as const, label: 'Trading Signals', desc: 'New signal alerts' },
                  { key: 'push_vip_signals' as const, label: 'VIP Signals', desc: 'Expert-reviewed signals' },
                  { key: 'push_milestones' as const, label: 'Milestones', desc: 'Achievement unlocks' },
                  { key: 'push_badges' as const, label: 'Badges', desc: 'New badge earned' },
                  { key: 'push_guidance' as const, label: 'Guidance Sessions', desc: 'Session reminders' },
                  { key: 'push_economic' as const, label: 'Economic Events', desc: 'High-impact news alerts' },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between py-1">
                    <div>
                      <Label className="font-normal">{item.label}</Label>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch checked={settings[item.key]} onCheckedChange={() => handleToggle(item.key)} />
                  </div>
                ))}
              </div>
              <Separator />
              <Button variant="outline" size="sm" onClick={testPushNotification} disabled={isTesting}>
                {isTesting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <TestTube className="w-4 h-4 mr-2" />}
                Test Push Notification
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Notifications
          </CardTitle>
          <CardDescription>Manage your email preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Email Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive updates via email</p>
            </div>
            <Switch checked={settings.email_enabled} onCheckedChange={() => handleToggle('email_enabled')} />
          </div>
          
          {settings.email_enabled && (
            <>
              <Separator />
              <div className="space-y-3">
                {[
                  { key: 'email_reports' as const, label: 'Performance Reports', desc: 'Weekly/monthly summaries' },
                  { key: 'email_digest' as const, label: 'Daily Digest', desc: 'Daily signal summary' },
                  { key: 'email_tips' as const, label: 'Trading Tips', desc: 'Educational content' },
                  { key: 'email_promotional' as const, label: 'Promotional', desc: 'Offers and updates' },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between py-1">
                    <div>
                      <Label className="font-normal">{item.label}</Label>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch checked={settings[item.key]} onCheckedChange={() => handleToggle(item.key)} />
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Sound */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {settings.sound_enabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            Sound
          </CardTitle>
          <CardDescription>Audio alerts for notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Sound</Label>
              <p className="text-sm text-muted-foreground">Play sound for VIP signals</p>
            </div>
            <Switch checked={settings.sound_enabled} onCheckedChange={() => handleToggle('sound_enabled')} />
          </div>
          {settings.sound_enabled && (
            <>
              <Separator />
              <Button variant="outline" size="sm" onClick={testSound}>
                <Volume2 className="w-4 h-4 mr-2" />
                Test Sound
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {isSaving && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Saving...
        </div>
      )}
    </div>
  );
};

export default NotificationSettingsPanel;
