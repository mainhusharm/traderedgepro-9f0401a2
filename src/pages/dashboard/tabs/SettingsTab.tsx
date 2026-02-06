import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, User, Shield, Bell, Palette, Database, Key, Save, Mail, BellRing, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useSignalNotifications } from '@/hooks/useSignalNotifications';
import useTheme from '@/hooks/useTheme';

const SettingsTab = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { isSupported, permission, isEnabled, enableNotifications, disableNotifications } = useSignalNotifications();
  const { settings: displaySettings, updateSettings: setDisplaySettings } = useTheme();
  
  const [activeSection, setActiveSection] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    country: 'United States'
  });

  const [riskSettings, setRiskSettings] = useState({
    riskPerTrade: 1,
    maxDailyRisk: 5,
    maxDrawdown: 10
  });

  const [notificationSettings, setNotificationSettings] = useState({
    signals: true,
    news: true,
    trades: true,
    email: false,
    push: true
  });

  const [emailPreferences, setEmailPreferences] = useState({
    performance_reports: true,
    milestone_notifications: true,
    badge_notifications: true,
    weekly_summary: true,
    monthly_report: true,
    trading_tips: false,
    promotional: false,
  });

  // Load settings from localStorage and database
  useEffect(() => {
    loadLocalSettings();
    if (user) {
      fetchUserPreferences();
    }
  }, [user]);

  const loadLocalSettings = () => {
    // Load risk settings
    const storedRisk = localStorage.getItem('risk_settings');
    if (storedRisk) {
      try {
        setRiskSettings(JSON.parse(storedRisk));
      } catch (e) {
        console.error('Error loading risk settings:', e);
      }
    }

    // Load notification settings
    const storedNotifications = localStorage.getItem('notification_settings');
    if (storedNotifications) {
      try {
        setNotificationSettings(JSON.parse(storedNotifications));
      } catch (e) {
        console.error('Error loading notification settings:', e);
      }
    }

    // Load questionnaire data for risk settings
    const questionnaireAnswers = localStorage.getItem('questionnaireAnswers');
    if (questionnaireAnswers) {
      try {
        const data = JSON.parse(questionnaireAnswers);
        if (data.riskPercentage) {
          setRiskSettings(prev => ({ ...prev, riskPerTrade: data.riskPercentage }));
        }
      } catch (e) {
        console.error('Error loading questionnaire data:', e);
      }
    }
  };

  const fetchUserPreferences = async () => {
    if (!user) return;
    
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('first_name, last_name, phone, country, email_preferences')
        .eq('user_id', user.id)
        .single();

      if (profileData) {
        setProfile({
          firstName: profileData.first_name || '',
          lastName: profileData.last_name || '',
          email: user.email || '',
          phone: profileData.phone || '',
          country: profileData.country || 'United States'
        });

        if (profileData.email_preferences) {
          setEmailPreferences(prev => ({
            ...prev,
            ...(profileData.email_preferences as object)
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    }
  };

  const sections = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'push-notifications', label: 'Push Notifications', icon: Smartphone },
    { id: 'email-preferences', label: 'Email Preferences', icon: Mail },
    { id: 'risk', label: 'Risk Management', icon: Shield },
    { id: 'display', label: 'Display', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'data', label: 'Data & Privacy', icon: Database },
    { id: 'api', label: 'API & Integrations', icon: Key },
  ];

  const handleSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      // Save to database
      await supabase
        .from('profiles')
        .update({
          first_name: profile.firstName,
          last_name: profile.lastName,
          phone: profile.phone,
          country: profile.country,
          email_preferences: emailPreferences,
        })
        .eq('user_id', user.id);

      // Save risk settings to localStorage
      localStorage.setItem('risk_settings', JSON.stringify(riskSettings));
      
      // Also update questionnaire answers for risk percentage
      const existingQuestionnaire = localStorage.getItem('questionnaireAnswers');
      if (existingQuestionnaire) {
        try {
          const data = JSON.parse(existingQuestionnaire);
          data.riskPercentage = riskSettings.riskPerTrade;
          localStorage.setItem('questionnaireAnswers', JSON.stringify(data));
        } catch (e) {
          console.error('Error updating questionnaire:', e);
        }
      }

      // Display settings are saved automatically by the hook

      // Save notification settings
      localStorage.setItem('notification_settings', JSON.stringify(notificationSettings));

      toast({
        title: "Settings saved",
        description: "Your settings have been updated successfully.",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePushToggle = async (enabled: boolean) => {
    if (enabled) {
      await enableNotifications();
    } else {
      disableNotifications();
    }
  };

  const handleExportData = async () => {
    if (!user) return;
    
    try {
      // Fetch all user data
      const [dashboardData, signals, journal, questionnaire] = await Promise.all([
        supabase.from('dashboard_data').select('*').eq('user_id', user.id),
        supabase.from('signals').select('*').eq('user_id', user.id),
        supabase.from('trade_journal').select('*').eq('user_id', user.id),
        supabase.from('questionnaires').select('*').eq('user_id', user.id),
      ]);

      const exportData = {
        exportedAt: new Date().toISOString(),
        dashboardData: dashboardData.data,
        signals: signals.data,
        tradeJournal: journal.data,
        questionnaire: questionnaire.data,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `traderedge-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Data exported",
        description: "Your trading data has been downloaded.",
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: "Export failed",
        description: "Failed to export data. Please try again.",
        variant: "destructive"
      });
    }
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input
                  value={profile.firstName}
                  onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                  className="bg-white/5 border-white/10"
                />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input
                  value={profile.lastName}
                  onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                  className="bg-white/5 border-white/10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={profile.email}
                disabled
                className="bg-white/5 border-white/10 opacity-50"
              />
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="bg-white/5 border-white/10"
              />
            </div>
          </div>
        );

      case 'push-notifications':
        return (
          <div className="space-y-6">
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-start gap-3">
                <BellRing className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-semibold text-primary mb-1">Real-Time Signal Alerts</h4>
                  <p className="text-sm text-muted-foreground">
                    Get instant browser notifications when new trading signals are published. Never miss a profitable trade opportunity.
                  </p>
                </div>
              </div>
            </div>

            {!isSupported ? (
              <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
                <p className="text-sm text-warning">
                  Your browser does not support push notifications. Try using Chrome, Firefox, or Edge.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 px-4 bg-white/5 rounded-lg">
                  <div>
                    <p className="font-medium">Enable Push Notifications</p>
                    <p className="text-xs text-muted-foreground">
                      {permission === 'denied' 
                        ? 'Notifications are blocked. Please enable in browser settings.'
                        : permission === 'granted'
                        ? 'Notifications are allowed by your browser'
                        : 'Click to request notification permission'}
                    </p>
                  </div>
                  <Switch
                    checked={isEnabled}
                    onCheckedChange={handlePushToggle}
                    disabled={permission === 'denied'}
                  />
                </div>

                {isEnabled && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-3 pl-4 border-l-2 border-primary/30"
                  >
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <p className="text-sm font-medium">New Signal Alerts</p>
                        <p className="text-xs text-muted-foreground">Get notified for new BUY/SELL signals</p>
                      </div>
                      <Switch
                        checked={notificationSettings.signals}
                        onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, signals: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <p className="text-sm font-medium">Trade Updates</p>
                        <p className="text-xs text-muted-foreground">Get notified when signals hit TP or SL</p>
                      </div>
                      <Switch
                        checked={notificationSettings.trades}
                        onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, trades: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <p className="text-sm font-medium">Market News</p>
                        <p className="text-xs text-muted-foreground">Important market events and news</p>
                      </div>
                      <Switch
                        checked={notificationSettings.news}
                        onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, news: checked })}
                      />
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            <div className="pt-4 border-t border-white/10">
              <h4 className="font-medium mb-2">Test Notifications</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (isEnabled) {
                    new Notification('Test Signal: EURUSD', {
                      body: '📈 BUY @ 1.0850 | SL: 1.0800 | TP: 1.0950',
                      icon: '/favicon.ico',
                    });
                    toast({ title: "Test notification sent!" });
                  } else {
                    toast({ title: "Enable notifications first", variant: "destructive" });
                  }
                }}
                disabled={!isEnabled}
              >
                Send Test Notification
              </Button>
            </div>
          </div>
        );

      case 'risk':
        return (
          <div className="space-y-6">
            <div className="p-4 rounded-lg bg-warning/10 border border-warning/20 mb-4">
              <p className="text-sm text-muted-foreground">
                These settings affect your lot size and risk calculations across all signals.
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between">
                <Label>Risk Per Trade</Label>
                <span className="text-primary font-semibold">{riskSettings.riskPerTrade}%</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="5"
                step="0.5"
                value={riskSettings.riskPerTrade}
                onChange={(e) => setRiskSettings({ ...riskSettings, riskPerTrade: parseFloat(e.target.value) })}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <p className="text-xs text-muted-foreground">
                Recommended: 1-2% for prop firm challenges
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between">
                <Label>Max Daily Risk</Label>
                <span className="text-warning font-semibold">{riskSettings.maxDailyRisk}%</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={riskSettings.maxDailyRisk}
                onChange={(e) => setRiskSettings({ ...riskSettings, maxDailyRisk: parseInt(e.target.value) })}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-warning"
              />
              <p className="text-xs text-muted-foreground">
                Most prop firms have 5% daily drawdown limit
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between">
                <Label>Max Drawdown</Label>
                <span className="text-risk font-semibold">{riskSettings.maxDrawdown}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="20"
                step="1"
                value={riskSettings.maxDrawdown}
                onChange={(e) => setRiskSettings({ ...riskSettings, maxDrawdown: parseInt(e.target.value) })}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-risk"
              />
              <p className="text-xs text-muted-foreground">
                Most prop firms have 10% total drawdown limit
              </p>
            </div>
          </div>
        );

      case 'display':
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Theme</Label>
              <div className="flex gap-3">
                {(['dark', 'light', 'auto'] as const).map((theme) => (
                  <button
                    key={theme}
                    onClick={() => setDisplaySettings({ theme })}
                    className={`px-4 py-2 rounded-lg capitalize ${
                      displaySettings.theme === theme
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    {theme}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Accent Color</Label>
              <div className="flex gap-3">
                {([
                  { name: 'cyan' as const, class: 'bg-[hsl(190,100%,50%)]' },
                  { name: 'green' as const, class: 'bg-emerald-500' },
                  { name: 'purple' as const, class: 'bg-purple-500' },
                  { name: 'orange' as const, class: 'bg-orange-500' }
                ]).map((color) => (
                  <button
                    key={color.name}
                    onClick={() => setDisplaySettings({ accentColor: color.name })}
                    className={`w-10 h-10 rounded-lg ${color.class} ${
                      displaySettings.accentColor === color.name ? 'ring-2 ring-white ring-offset-2 ring-offset-background' : ''
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">Compact Mode</p>
                <p className="text-xs text-muted-foreground">Reduce spacing and padding</p>
              </div>
              <Switch
                checked={displaySettings.compactMode}
                onCheckedChange={(checked) => setDisplaySettings({ compactMode: checked })}
              />
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">Show Animations</p>
                <p className="text-xs text-muted-foreground">Enable smooth transitions and effects</p>
              </div>
              <Switch
                checked={displaySettings.showAnimations}
                onCheckedChange={(checked) => setDisplaySettings({ showAnimations: checked })}
              />
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground mb-4">
              Control in-app notification preferences
            </p>
            {[
              { key: 'signals', label: 'Signal Alerts', desc: 'New trading signals' },
              { key: 'news', label: 'News Alerts', desc: 'Market news and updates' },
              { key: 'trades', label: 'Trade Confirmations', desc: 'Trade execution updates' },
              { key: 'email', label: 'Email Notifications', desc: 'Receive email notifications' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <Switch
                  checked={notificationSettings[item.key as keyof typeof notificationSettings]}
                  onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, [item.key]: checked })}
                />
              </div>
            ))}
          </div>
        );

      case 'email-preferences':
        return (
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground">
              Control which emails you receive from Trader Edge Pro.
            </p>
            
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-primary">Performance Reports</h4>
              <div className="space-y-3 pl-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Weekly Performance Reports</p>
                    <p className="text-xs text-muted-foreground">Receive a summary of your trading performance every Monday</p>
                  </div>
                  <Switch
                    checked={emailPreferences.weekly_summary}
                    onCheckedChange={(checked) => setEmailPreferences({ ...emailPreferences, weekly_summary: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Monthly Reports</p>
                    <p className="text-xs text-muted-foreground">Detailed monthly trading analytics</p>
                  </div>
                  <Switch
                    checked={emailPreferences.monthly_report}
                    onCheckedChange={(checked) => setEmailPreferences({ ...emailPreferences, monthly_report: checked })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-sm text-primary">Achievement Notifications</h4>
              <div className="space-y-3 pl-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Milestone Unlocks</p>
                    <p className="text-xs text-muted-foreground">Get notified when you unlock new trading milestones</p>
                  </div>
                  <Switch
                    checked={emailPreferences.milestone_notifications}
                    onCheckedChange={(checked) => setEmailPreferences({ ...emailPreferences, milestone_notifications: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Badge Achievements</p>
                    <p className="text-xs text-muted-foreground">Celebrate when you earn new trading badges</p>
                  </div>
                  <Switch
                    checked={emailPreferences.badge_notifications}
                    onCheckedChange={(checked) => setEmailPreferences({ ...emailPreferences, badge_notifications: checked })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-sm text-primary">Other</h4>
              <div className="space-y-3 pl-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Trading Tips & Insights</p>
                    <p className="text-xs text-muted-foreground">Educational content and market insights</p>
                  </div>
                  <Switch
                    checked={emailPreferences.trading_tips}
                    onCheckedChange={(checked) => setEmailPreferences({ ...emailPreferences, trading_tips: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Promotional Emails</p>
                    <p className="text-xs text-muted-foreground">Special offers and new feature announcements</p>
                  </div>
                  <Switch
                    checked={emailPreferences.promotional}
                    onCheckedChange={(checked) => setEmailPreferences({ ...emailPreferences, promotional: checked })}
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 'data':
        return (
          <div className="space-y-6">
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
              <h4 className="font-semibold text-primary mb-2">Export Your Data</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Download all your trading data including signals, journal entries, and performance metrics.
              </p>
              <Button variant="outline" onClick={handleExportData}>
                Export Data
              </Button>
            </div>
            
            <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
              <h4 className="font-semibold text-warning mb-2">Delete Account</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <Button variant="outline" className="text-risk border-risk/20 hover:bg-risk/10">
                Delete Account
              </Button>
            </div>
          </div>
        );

      case 'api':
        return (
          <div className="space-y-6">
            <div className="p-4 rounded-lg bg-muted/20 border border-muted/30">
              <h4 className="font-semibold mb-2">API Access</h4>
              <p className="text-sm text-muted-foreground mb-4">
                API access is available for Pro and Enterprise plans.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Webhook URL (for signal alerts)</Label>
              <Input
                placeholder="https://your-webhook-url.com"
                className="bg-white/5 border-white/10"
              />
              <p className="text-xs text-muted-foreground">
                Receive real-time signals via webhook (Coming soon)
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Settings className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Settings</h2>
          <p className="text-sm text-muted-foreground">Manage your account and preferences</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="space-y-2">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeSection === section.id
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
              }`}
            >
              <section.icon className="w-5 h-5" />
              <span className="text-sm font-medium">{section.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-3 glass-card p-6 rounded-xl"
        >
          <h3 className="text-lg font-semibold mb-6 capitalize flex items-center gap-2">
            {sections.find(s => s.id === activeSection)?.label}
          </h3>
          
          {renderSection()}

          <div className="mt-8 pt-6 border-t border-white/[0.05] flex justify-end">
            <Button onClick={handleSave} disabled={isSaving} className="btn-glow gap-2">
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SettingsTab;
