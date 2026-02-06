import { useState } from 'react';
import { 
  Settings, 
  Shield,
  Bell,
  Database,
  Key,
  Save,
  Mail,
  TestTube,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { callEdgeFunction } from '@/config/api';
import EmailTemplateManager from '@/components/admin/EmailTemplateManager';

const AdminSettingsTab = () => {
  const [isTestingReminders, setIsTestingReminders] = useState(false);
  const [settings, setSettings] = useState({
    // Signal Settings
    defaultConfidence: 75,
    autoPublishSignals: true,
    signalExpiryHours: 24,
    
    // Notification Settings
    emailNotifications: true,
    slackNotifications: false,
    discordWebhook: '',
    
    // Security Settings
    requireTwoFactor: false,
    sessionTimeoutMinutes: 60,
    maxLoginAttempts: 5,
    
    // Bot Settings
    maxSignalsPerDay: 10,
    minConfidenceThreshold: 70,
    allowWeekendSignals: false,
  });

  const handleSave = () => {
    // In a real app, this would save to the backend
    toast.success('Settings saved successfully');
  };

  const handleTestReminders = async () => {
    setIsTestingReminders(true);
    try {
      const { data, error } = await callEdgeFunction('subscription-reminders', {});
      
      if (error) throw error;
      
      const results = data?.results || [];
      const totalSent = results.reduce((sum: number, r: any) => sum + (r.sent || 0), 0);
      
      if (totalSent > 0) {
        toast.success(`Sent ${totalSent} reminder email(s)`);
      } else {
        toast.info('No subscriptions found expiring in 1, 3, or 7 days');
      }
      
      console.log('Reminder results:', results);
    } catch (error: any) {
      console.error('Error testing reminders:', error);
      toast.error('Failed to trigger reminders: ' + error.message);
    } finally {
      setIsTestingReminders(false);
    }
  };

  return (
    <Tabs defaultValue="general" className="space-y-6">
      <TabsList>
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="emails">Email Templates</TabsTrigger>
      </TabsList>

      <TabsContent value="general" className="space-y-6 max-w-4xl">
        {/* Signal Settings */}
        <Card className="bg-card/50 border-white/[0.08]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              Signal Settings
            </CardTitle>
            <CardDescription>Configure default signal parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Default Confidence (%)</Label>
                <Input
                  type="number"
                  value={settings.defaultConfidence}
                  onChange={(e) => setSettings({ ...settings, defaultConfidence: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Signal Expiry (hours)</Label>
                <Input
                  type="number"
                  value={settings.signalExpiryHours}
                  onChange={(e) => setSettings({ ...settings, signalExpiryHours: parseInt(e.target.value) })}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Auto-publish Signals</Label>
                <p className="text-sm text-muted-foreground">Automatically make signals public</p>
              </div>
              <Switch
                checked={settings.autoPublishSignals}
                onCheckedChange={(checked) => setSettings({ ...settings, autoPublishSignals: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Bot Settings */}
        <Card className="bg-card/50 border-white/[0.08]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-accent" />
              Bot Settings
            </CardTitle>
            <CardDescription>Configure automated bot behavior</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Max Signals Per Day</Label>
                <Input
                  type="number"
                  value={settings.maxSignalsPerDay}
                  onChange={(e) => setSettings({ ...settings, maxSignalsPerDay: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Min Confidence Threshold (%)</Label>
                <Input
                  type="number"
                  value={settings.minConfidenceThreshold}
                  onChange={(e) => setSettings({ ...settings, minConfidenceThreshold: parseInt(e.target.value) })}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Allow Weekend Signals</Label>
                <p className="text-sm text-muted-foreground">Generate signals on weekends</p>
              </div>
              <Switch
                checked={settings.allowWeekendSignals}
                onCheckedChange={(checked) => setSettings({ ...settings, allowWeekendSignals: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="bg-card/50 border-white/[0.08]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-warning" />
              Notification Settings
            </CardTitle>
            <CardDescription>Configure admin notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive email alerts</p>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Slack Notifications</Label>
                <p className="text-sm text-muted-foreground">Send alerts to Slack</p>
              </div>
              <Switch
                checked={settings.slackNotifications}
                onCheckedChange={(checked) => setSettings({ ...settings, slackNotifications: checked })}
              />
            </div>
            <div className="space-y-2">
              <Label>Discord Webhook URL</Label>
              <Input
                placeholder="https://discord.com/api/webhooks/..."
                value={settings.discordWebhook}
                onChange={(e) => setSettings({ ...settings, discordWebhook: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Email Testing */}
        <Card className="bg-card/50 border-white/[0.08]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              Email Testing
            </CardTitle>
            <CardDescription>Test email notifications and reminders</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Subscription Expiry Reminders</Label>
                <p className="text-sm text-muted-foreground">
                  Manually trigger reminder emails for expiring subscriptions (7, 3, 1 days)
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={handleTestReminders}
                disabled={isTestingReminders}
              >
                {isTestingReminders ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <TestTube className="w-4 h-4 mr-2" />
                    Test Reminders
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="bg-card/50 border-white/[0.08]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-risk" />
              Security Settings
            </CardTitle>
            <CardDescription>Configure security options</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Require Two-Factor Auth</Label>
                <p className="text-sm text-muted-foreground">For admin accounts</p>
              </div>
              <Switch
                checked={settings.requireTwoFactor}
                onCheckedChange={(checked) => setSettings({ ...settings, requireTwoFactor: checked })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Session Timeout (minutes)</Label>
                <Input
                  type="number"
                  value={settings.sessionTimeoutMinutes}
                  onChange={(e) => setSettings({ ...settings, sessionTimeoutMinutes: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Max Login Attempts</Label>
                <Input
                  type="number"
                  value={settings.maxLoginAttempts}
                  onChange={(e) => setSettings({ ...settings, maxLoginAttempts: parseInt(e.target.value) })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">
            <Save className="w-4 h-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </TabsContent>

      <TabsContent value="emails">
        <EmailTemplateManager />
      </TabsContent>
    </Tabs>
  );
};

export default AdminSettingsTab;
