import { useState } from 'react';
import { 
  Settings, 
  Key,
  Twitter,
  Instagram,
  Youtube,
  Linkedin,
  MessageCircle,
  Send,
  Save,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const platformConfigs = [
  { 
    id: 'twitter', 
    name: 'X (Twitter)', 
    icon: Twitter, 
    color: 'text-foreground',
    fields: [
      { key: 'consumer_key', label: 'Consumer Key', type: 'text' },
      { key: 'consumer_secret', label: 'Consumer Secret', type: 'password' },
      { key: 'access_token', label: 'Access Token', type: 'password' },
      { key: 'access_token_secret', label: 'Access Token Secret', type: 'password' },
    ]
  },
  { 
    id: 'instagram', 
    name: 'Instagram', 
    icon: Instagram, 
    color: 'text-pink-500',
    fields: [
      { key: 'access_token', label: 'Access Token', type: 'password' },
      { key: 'business_id', label: 'Business Account ID', type: 'text' },
    ]
  },
  { 
    id: 'youtube', 
    name: 'YouTube', 
    icon: Youtube, 
    color: 'text-red-500',
    fields: [
      { key: 'client_id', label: 'Client ID', type: 'text' },
      { key: 'client_secret', label: 'Client Secret', type: 'password' },
      { key: 'refresh_token', label: 'Refresh Token', type: 'password' },
    ]
  },
  { 
    id: 'linkedin', 
    name: 'LinkedIn', 
    icon: Linkedin, 
    color: 'text-blue-600',
    fields: [
      { key: 'access_token', label: 'Access Token', type: 'password' },
      { key: 'person_urn', label: 'Person URN', type: 'text' },
    ]
  },
  { 
    id: 'discord', 
    name: 'Discord', 
    icon: MessageCircle, 
    color: 'text-indigo-500',
    fields: [
      { key: 'webhook_url', label: 'Webhook URL', type: 'password' },
    ]
  },
  { 
    id: 'telegram', 
    name: 'Telegram', 
    icon: Send, 
    color: 'text-blue-400',
    fields: [
      { key: 'bot_token', label: 'Bot Token', type: 'password' },
      { key: 'channel_id', label: 'Channel ID', type: 'text' },
    ]
  },
];

const MarketingSettingsTab = () => {
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState<Record<string, Record<string, string>>>({});

  const togglePassword = (key: string) => {
    setShowPasswords(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleInputChange = (platformId: string, fieldKey: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [platformId]: {
        ...prev[platformId],
        [fieldKey]: value
      }
    }));
  };

  const handleSave = (platformId: string) => {
    console.log('Saving config for', platformId, formData[platformId]);
    // This would save to Supabase secrets via edge function
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Settings className="w-7 h-7 text-primary" />
          Marketing Settings
        </h1>
        <p className="text-muted-foreground">Configure your social media platforms and AI preferences</p>
      </div>

      <Tabs defaultValue="platforms" className="w-full">
        <TabsList>
          <TabsTrigger value="platforms">Platform Connections</TabsTrigger>
          <TabsTrigger value="ai">AI Settings</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="platforms" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {platformConfigs.map(platform => {
              const Icon = platform.icon;
              return (
                <Card key={platform.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Icon className={`w-5 h-5 ${platform.color}`} />
                      {platform.name}
                    </CardTitle>
                    <CardDescription>
                      Configure your {platform.name} API credentials
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {platform.fields.map(field => (
                      <div key={field.key} className="space-y-2">
                        <Label htmlFor={`${platform.id}-${field.key}`}>{field.label}</Label>
                        <div className="relative">
                          <Input
                            id={`${platform.id}-${field.key}`}
                            type={field.type === 'password' && !showPasswords[`${platform.id}-${field.key}`] ? 'password' : 'text'}
                            placeholder={`Enter ${field.label.toLowerCase()}`}
                            value={formData[platform.id]?.[field.key] || ''}
                            onChange={(e) => handleInputChange(platform.id, field.key, e.target.value)}
                          />
                          {field.type === 'password' && (
                            <button
                              type="button"
                              onClick={() => togglePassword(`${platform.id}-${field.key}`)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {showPasswords[`${platform.id}-${field.key}`] ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    <Button onClick={() => handleSave(platform.id)} className="w-full">
                      <Save className="w-4 h-4 mr-2" />
                      Save & Connect
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="ai" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Content Generation</CardTitle>
              <CardDescription>Configure how AI generates content for your marketing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-accent/50">
                <div>
                  <p className="font-medium">Auto-generate content suggestions</p>
                  <p className="text-sm text-muted-foreground">AI will suggest content ideas daily</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-accent/50">
                <div>
                  <p className="font-medium">Smart scheduling</p>
                  <p className="text-sm text-muted-foreground">AI optimizes posting times for engagement</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-accent/50">
                <div>
                  <p className="font-medium">Content humanization</p>
                  <p className="text-sm text-muted-foreground">Add natural variations to avoid AI detection</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Brand Voice</CardTitle>
              <CardDescription>Define how AI should communicate on your behalf</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Brand Description</Label>
                <Input 
                  placeholder="We help traders pass prop firm challenges with proven signals..."
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Key Topics to Focus On</Label>
                <Input 
                  placeholder="Prop firms, trading education, risk management, success stories..."
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Tone of Voice</Label>
                <div className="flex gap-2 mt-2">
                  <Badge variant="default" className="cursor-pointer">Professional</Badge>
                  <Badge variant="outline" className="cursor-pointer">Friendly</Badge>
                  <Badge variant="outline" className="cursor-pointer">Educational</Badge>
                  <Badge variant="outline" className="cursor-pointer">Motivational</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose what updates you want to receive</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-accent/50">
                <div>
                  <p className="font-medium">New lead notifications</p>
                  <p className="text-sm text-muted-foreground">Get notified when new leads are captured</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-accent/50">
                <div>
                  <p className="font-medium">Escalated queries</p>
                  <p className="text-sm text-muted-foreground">Notify when customer queries need attention</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-accent/50">
                <div>
                  <p className="font-medium">Post performance</p>
                  <p className="text-sm text-muted-foreground">Daily summary of social media performance</p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-accent/50">
                <div>
                  <p className="font-medium">AI activity logs</p>
                  <p className="text-sm text-muted-foreground">Detailed logs of what AI employees are doing</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MarketingSettingsTab;
