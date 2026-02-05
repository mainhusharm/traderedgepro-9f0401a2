import { useState, useEffect } from 'react';
import { Bell, Mail, TrendingUp, RefreshCw, Package, Calendar, Loader2, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type DigestFrequency = 'none' | 'daily' | 'weekly';

interface EmailPreferences {
  marketing: boolean;
  signals: boolean;
  renewal_reminders: boolean;
  order_updates: boolean;
  digest_frequency: DigestFrequency;
}

const defaultPreferences: EmailPreferences = {
  marketing: true,
  signals: true,
  renewal_reminders: true,
  order_updates: true,
  digest_frequency: 'weekly',
};

const EmailPreferencesCard = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<EmailPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [savedPreferences, setSavedPreferences] = useState<EmailPreferences>(defaultPreferences);

  useEffect(() => {
    if (user) {
      fetchPreferences();
    }
  }, [user]);

  const fetchPreferences = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('email_preferences')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data?.email_preferences) {
        const rawPrefs = data.email_preferences as Record<string, unknown>;
        // Migrate old weekly_summary to new digest_frequency
        let digestFreq: DigestFrequency = 'weekly';
        if (rawPrefs.digest_frequency) {
          digestFreq = rawPrefs.digest_frequency as DigestFrequency;
        } else if (rawPrefs.weekly_summary === false) {
          digestFreq = 'none';
        }
        const prefs: EmailPreferences = {
          marketing: Boolean(rawPrefs.marketing ?? true),
          signals: Boolean(rawPrefs.signals ?? true),
          renewal_reminders: Boolean(rawPrefs.renewal_reminders ?? true),
          order_updates: Boolean(rawPrefs.order_updates ?? true),
          digest_frequency: digestFreq,
        };
        setPreferences(prefs);
        setSavedPreferences(prefs);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = (key: keyof Omit<EmailPreferences, 'digest_frequency'>) => {
    const newPreferences = { ...preferences, [key]: !preferences[key] };
    setPreferences(newPreferences);
    setHasChanges(JSON.stringify(newPreferences) !== JSON.stringify(savedPreferences));
  };

  const handleDigestChange = (value: DigestFrequency) => {
    const newPreferences = { ...preferences, digest_frequency: value };
    setPreferences(newPreferences);
    setHasChanges(JSON.stringify(newPreferences) !== JSON.stringify(savedPreferences));
  };

  const handleSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      const prefsJson = JSON.parse(JSON.stringify(preferences));
      const { error } = await supabase
        .from('profiles')
        .update({ email_preferences: prefsJson })
        .eq('user_id', user.id);

      if (error) throw error;

      setSavedPreferences(preferences);
      setHasChanges(false);
      toast.success('Email preferences saved');
    } catch (error: any) {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  };

  const preferenceItems = [
    {
      key: 'signals' as keyof Omit<EmailPreferences, 'digest_frequency'>,
      icon: TrendingUp,
      label: 'Trading Signals',
      description: 'Receive notifications for new trading signals',
      iconColor: 'text-success',
    },
    {
      key: 'renewal_reminders' as keyof Omit<EmailPreferences, 'digest_frequency'>,
      icon: RefreshCw,
      label: 'Renewal Reminders',
      description: 'Get reminders before your subscription expires',
      iconColor: 'text-warning',
    },
    {
      key: 'order_updates' as keyof Omit<EmailPreferences, 'digest_frequency'>,
      icon: Package,
      label: 'Order Updates',
      description: 'Notifications about your MT5 bot orders',
      iconColor: 'text-primary',
    },
    {
      key: 'marketing' as keyof Omit<EmailPreferences, 'digest_frequency'>,
      icon: Mail,
      label: 'Marketing & Promotions',
      description: 'Special offers, new features, and updates',
      iconColor: 'text-muted-foreground',
    },
  ];

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          Email Preferences
        </CardTitle>
        <CardDescription>
          Choose which emails you'd like to receive
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {preferenceItems.map((item) => (
          <div
            key={item.key}
            className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center ${item.iconColor}`}>
                <item.icon className="w-5 h-5" />
              </div>
              <div>
                <Label className="text-foreground font-medium">{item.label}</Label>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            </div>
            <Switch
              checked={preferences[item.key]}
              onCheckedChange={() => handleToggle(item.key)}
            />
          </div>
        ))}

        {/* Digest Frequency Selector */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-accent">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <Label className="text-foreground font-medium">Performance Digest</Label>
              <p className="text-sm text-muted-foreground">How often to receive performance summaries</p>
            </div>
          </div>
          <Select value={preferences.digest_frequency} onValueChange={handleDigestChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {hasChanges && (
          <div className="flex justify-end pt-4">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Save Preferences
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EmailPreferencesCard;
