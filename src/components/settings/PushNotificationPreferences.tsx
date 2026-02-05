import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Bell, TrendingUp, Trophy, Award, Calendar, Loader2, Save, Volume2, VolumeX, Play, Upload, Trash2, Music, Moon, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { toast } from 'sonner';
import { notificationService, type QuietHoursConfig } from '@/services/notificationService';

interface NotificationPrefs {
  vip_signals: boolean;
  milestones: boolean;
  badges: boolean;
  sessions: boolean;
  email_notifications: boolean;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' }
];

const PushNotificationPreferences = () => {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<NotificationPrefs>({
    vip_signals: true,
    milestones: true,
    badges: true,
    sessions: true,
    email_notifications: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [volume, setVolume] = useState(0.5);
  const [customSounds, setCustomSounds] = useState<Record<string, boolean>>({});
  const [quietHours, setQuietHours] = useState<QuietHoursConfig>({
    enabled: false,
    startTime: '22:00',
    endTime: '07:00',
    days: [0, 1, 2, 3, 4, 5, 6]
  });
  const [previewAudio, setPreviewAudio] = useState<HTMLAudioElement | null>(null);
  const [previewingFile, setPreviewingFile] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchPreferences();
    }
    setSoundEnabled(notificationService.isSoundEnabled());
    setVolume(notificationService.getVolume());
    setQuietHours(notificationService.getQuietHours());
    updateCustomSoundsState();
  }, [user]);

  const updateCustomSoundsState = () => {
    const types = ['signal', 'achievement', 'session', 'alert', 'success'];
    const state: Record<string, boolean> = {};
    types.forEach(type => {
      state[type] = notificationService.hasCustomSound(type);
    });
    setCustomSounds(state);
  };

  const fetchPreferences = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();
      if (error && error.code !== 'PGRST116') return;
      if (data) {
        setPrefs({
          vip_signals: data.vip_signals,
          milestones: data.milestones,
          badges: data.badges,
          sessions: data.sessions,
          email_notifications: data.email_notifications,
        });
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = (key: keyof NotificationPrefs) => {
    setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
    setHasChanges(true);
  };

  const handleSoundToggle = (enabled: boolean) => {
    setSoundEnabled(enabled);
    notificationService.setSoundEnabled(enabled);
  };

  const handleVolumeChange = (values: number[]) => {
    const newVolume = values[0];
    setVolume(newVolume);
    notificationService.setVolume(newVolume);
  };

  const handleQuietHoursToggle = (enabled: boolean) => {
    const newConfig = { ...quietHours, enabled };
    setQuietHours(newConfig);
    notificationService.setQuietHours(newConfig);
  };

  const handleQuietHoursTimeChange = (field: 'startTime' | 'endTime', value: string) => {
    const newConfig = { ...quietHours, [field]: value };
    setQuietHours(newConfig);
    notificationService.setQuietHours(newConfig);
  };

  const handleQuietHoursDayToggle = (day: number) => {
    const newDays = quietHours.days.includes(day)
      ? quietHours.days.filter(d => d !== day)
      : [...quietHours.days, day].sort();
    const newConfig = { ...quietHours, days: newDays };
    setQuietHours(newConfig);
    notificationService.setQuietHours(newConfig);
  };

  const handleFileUpload = (type: string) => {
    setUploadingFor(type);
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !uploadingFor) return;
    if (!file.type.startsWith('audio/')) {
      toast.error('Please select an audio file');
      return;
    }
    if (file.size > 500 * 1024) {
      toast.error('Audio file must be less than 500KB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      notificationService.setCustomSound(uploadingFor, dataUrl);
      updateCustomSoundsState();
      toast.success(`Custom ${uploadingFor} sound uploaded`);
      setUploadingFor(null);
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const handleRemoveCustomSound = (type: string) => {
    notificationService.removeCustomSound(type);
    updateCustomSoundsState();
    toast.success(`Custom ${type} sound removed`);
  };

  // Preview sound on file drag
  const handleFileDragEnter = (e: React.DragEvent<HTMLDivElement>, type: string) => {
    e.preventDefault();
    const file = e.dataTransfer.items?.[0];
    if (file?.type.startsWith('audio/')) {
      setPreviewingFile(type);
    }
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>, type: string) => {
    e.preventDefault();
    handleFilePreviewEnd();
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith('audio/')) return;
    if (file.size > 500 * 1024) {
      toast.error('Audio file must be less than 500KB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      // Play preview
      const audio = notificationService.previewSound(dataUrl);
      audio.play().catch(() => {});
      notificationService.setCustomSound(type, dataUrl);
      updateCustomSoundsState();
      toast.success(`Custom ${type} sound uploaded`);
    };
    reader.readAsDataURL(file);
  };

  const handleFilePreviewEnd = () => {
    if (previewAudio) {
      previewAudio.pause();
      setPreviewAudio(null);
    }
    setPreviewingFile(null);
  };

  const playTestSound = (type: 'signal' | 'achievement' | 'trade' | 'alert') => {
    const wasEnabled = notificationService.isSoundEnabled();
    notificationService.setSoundEnabled(true);
    const testNotifications = {
      signal: { type: 'signal' as const, title: '🔔 Signal Sound', message: 'This is how signal notifications sound' },
      achievement: { type: 'achievement' as const, title: '🏆 Achievement Sound', message: 'This is how achievement notifications sound' },
      trade: { type: 'trade' as const, title: '✅ Trade Sound', message: 'This is how trade notifications sound' },
      alert: { type: 'alert' as const, title: '⚠️ Alert Sound', message: 'This is how alert notifications sound' },
    };
    notificationService.add(testNotifications[type]);
    if (!wasEnabled) {
      setTimeout(() => notificationService.setSoundEnabled(false), 100);
    }
  };

  const savePreferences = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          ...prefs,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (error) throw error;

      toast.success('Notification preferences saved');
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-background/50 border-border/50">
        <CardContent className="p-6 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const notificationTypes = [
    {
      key: 'vip_signals' as const,
      label: 'VIP Signals',
      description: 'Get notified when new VIP trading signals are posted',
      icon: TrendingUp,
      color: 'text-primary',
    },
    {
      key: 'milestones' as const,
      label: 'Milestones',
      description: 'Celebrate when you reach new trading milestones',
      icon: Trophy,
      color: 'text-success',
    },
    {
      key: 'badges' as const,
      label: 'Badges',
      description: 'Get notified when you unlock new trading badges',
      icon: Award,
      color: 'text-warning',
    },
    {
      key: 'sessions' as const,
      label: 'Guidance Sessions',
      description: 'Updates about your 1-on-1 guidance sessions',
      icon: Calendar,
      color: 'text-accent',
    },
  ];

  const testSounds = [
    { key: 'signal' as const, label: 'Signal', color: 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30', uploadKey: 'signal' },
    { key: 'achievement' as const, label: 'Achievement', color: 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30', uploadKey: 'achievement' },
    { key: 'trade' as const, label: 'Trade', color: 'bg-green-500/20 text-green-400 hover:bg-green-500/30', uploadKey: 'success' },
    { key: 'alert' as const, label: 'Alert', color: 'bg-red-500/20 text-red-400 hover:bg-red-500/30', uploadKey: 'alert' },
  ];

  return (
    <Card className="bg-background/50 border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          Push Notification Preferences
        </CardTitle>
        <CardDescription>
          Choose which types of push notifications you want to receive
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Sound Settings */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Sound Settings</h3>
          
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-background ${soundEnabled ? 'text-primary' : 'text-muted-foreground'}`}>
                {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </div>
              <div>
                <Label htmlFor="sound_enabled" className="font-medium cursor-pointer">
                  Notification Sounds
                </Label>
                <p className="text-sm text-muted-foreground">
                  Play sounds when notifications arrive
                </p>
              </div>
            </div>
            <Switch
              id="sound_enabled"
              checked={soundEnabled}
              onCheckedChange={handleSoundToggle}
            />
          </div>

          {/* Volume Slider */}
          <div className="p-4 rounded-lg bg-muted/20 border border-border/30">
            <div className="flex items-center gap-2 mb-3">
              <Volume2 className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Volume Level</span>
              <span className="text-xs text-muted-foreground ml-auto">{Math.round(volume * 100)}%</span>
            </div>
            <div className="flex items-center gap-3">
              <VolumeX className="w-4 h-4 text-muted-foreground" />
              <Slider value={[volume]} onValueChange={handleVolumeChange} max={1} min={0} step={0.05} className="flex-1" />
              <Volume2 className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>

          {/* Quiet Hours */}
          <div className="p-4 rounded-lg bg-muted/20 border border-border/30 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Moon className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Quiet Hours</span>
              </div>
              <Switch checked={quietHours.enabled} onCheckedChange={handleQuietHoursToggle} />
            </div>
            {quietHours.enabled && (
              <div className="space-y-3 pl-6 border-l-2 border-border/50">
                <div className="flex items-center gap-3 flex-wrap">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <Input type="time" value={quietHours.startTime} onChange={(e) => handleQuietHoursTimeChange('startTime', e.target.value)} className="w-28" />
                  <span className="text-sm text-muted-foreground">to</span>
                  <Input type="time" value={quietHours.endTime} onChange={(e) => handleQuietHoursTimeChange('endTime', e.target.value)} className="w-28" />
                </div>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map(({ value, label }) => (
                    <div key={value} className="flex items-center gap-1">
                      <Checkbox id={`day-${value}`} checked={quietHours.days.includes(value)} onCheckedChange={() => handleQuietHoursDayToggle(value)} />
                      <Label htmlFor={`day-${value}`} className="text-xs cursor-pointer">{label}</Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Test Sound Buttons */}
          <div className="p-4 rounded-lg bg-muted/20 border border-border/30">
            <div className="flex items-center gap-2 mb-3">
              <Play className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Preview Notification Sounds</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {testSounds.map((sound) => (
                <Button
                  key={sound.key}
                  variant="outline"
                  size="sm"
                  onClick={() => playTestSound(sound.key)}
                  className={`${sound.color} border-transparent`}
                >
                  <Play className="w-3 h-3 mr-1" />
                  {sound.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom Sounds with drag preview */}
          <div className="p-4 rounded-lg bg-muted/20 border border-border/30">
            <div className="flex items-center gap-2 mb-3">
              <Music className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Custom Notification Sounds</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">Drag audio files to preview, then drop to upload (max 500KB)</p>
            <div className="grid grid-cols-2 gap-2">
              {testSounds.map((sound) => (
                <div
                  key={sound.uploadKey}
                  className={`flex items-center gap-2 p-2 rounded border transition-colors ${previewingFile === sound.uploadKey ? 'border-primary bg-primary/10' : 'border-transparent'}`}
                  onDragOver={(e) => e.preventDefault()}
                  onDragEnter={(e) => handleFileDragEnter(e, sound.uploadKey)}
                  onDragLeave={handleFilePreviewEnd}
                  onDrop={(e) => handleFileDrop(e, sound.uploadKey)}
                >
                  <Button variant="outline" size="sm" onClick={() => handleFileUpload(sound.uploadKey)} className="flex-1 text-xs">
                    <Upload className="w-3 h-3 mr-1" />
                    {sound.label}
                    {customSounds[sound.uploadKey] && <span className="ml-1 text-primary">✓</span>}
                  </Button>
                  {customSounds[sound.uploadKey] && (
                    <Button variant="ghost" size="sm" onClick={() => handleRemoveCustomSound(sound.uploadKey)} className="px-2 text-destructive hover:text-destructive">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-border/50 pt-4 space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Notification Types</h3>
          
          {notificationTypes.map((type) => (
            <div
              key={type.key}
              className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-background ${type.color}`}>
                  <type.icon className="w-5 h-5" />
                </div>
                <div>
                  <Label htmlFor={type.key} className="font-medium cursor-pointer">
                    {type.label}
                  </Label>
                  <p className="text-sm text-muted-foreground">{type.description}</p>
                </div>
              </div>
              <Switch
                id={type.key}
                checked={prefs[type.key]}
                onCheckedChange={() => handleToggle(type.key)}
              />
            </div>
          ))}
        </div>

        <div className="border-t border-border/50 pt-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-background text-muted-foreground">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <Label htmlFor="email_notifications" className="font-medium cursor-pointer">
                  Email Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Also receive these notifications via email
                </p>
              </div>
            </div>
            <Switch
              id="email_notifications"
              checked={prefs.email_notifications}
              onCheckedChange={() => handleToggle('email_notifications')}
            />
          </div>
        </div>

        {hasChanges && (
          <Button onClick={savePreferences} disabled={isSaving} className="w-full">
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Preferences
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default PushNotificationPreferences;
