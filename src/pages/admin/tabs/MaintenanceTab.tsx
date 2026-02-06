import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Construction, Power, Clock, AlertTriangle } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

const MaintenanceTab = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [maintenanceStartedAt, setMaintenanceStartedAt] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('id', 'main')
        .single();

      if (error) throw error;

      setMaintenanceMode(data?.maintenance_mode || false);
      setMaintenanceMessage(data?.maintenance_message || 'We are currently performing scheduled maintenance. Please check back soon.');
      setMaintenanceStartedAt(data?.maintenance_started_at || null);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMaintenanceMode = async () => {
    const newValue = !maintenanceMode;
    setIsSaving(true);

    try {
      const updateData: any = {
        maintenance_mode: newValue,
        maintenance_message: maintenanceMessage,
        updated_at: new Date().toISOString(),
      };

      if (newValue) {
        updateData.maintenance_started_at = new Date().toISOString();
        updateData.maintenance_started_by = user?.id;
      } else {
        updateData.maintenance_started_at = null;
        updateData.maintenance_started_by = null;
      }

      const { error } = await supabase
        .from('site_settings')
        .update(updateData)
        .eq('id', 'main');

      if (error) throw error;

      setMaintenanceMode(newValue);
      setMaintenanceStartedAt(newValue ? updateData.maintenance_started_at : null);
      
      toast.success(
        newValue 
          ? 'Maintenance mode enabled - users will see maintenance page' 
          : 'Maintenance mode disabled - site is now live'
      );
    } catch (error: any) {
      console.error('Error updating maintenance mode:', error);
      toast.error(error.message || 'Failed to update maintenance mode');
    } finally {
      setIsSaving(false);
    }
  };

  const saveMessage = async () => {
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('site_settings')
        .update({
          maintenance_message: maintenanceMessage,
          updated_at: new Date().toISOString(),
        })
        .eq('id', 'main');

      if (error) throw error;
      toast.success('Maintenance message saved');
    } catch (error: any) {
      console.error('Error saving message:', error);
      toast.error(error.message || 'Failed to save message');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Construction className="w-6 h-6 text-warning" />
          Maintenance Mode
        </h2>
        <p className="text-muted-foreground mt-1">
          Enable maintenance mode to temporarily disable user access to the site
        </p>
      </div>

      {/* Current Status Card */}
      <Card className={maintenanceMode ? 'border-warning/50 bg-warning/5' : ''}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                maintenanceMode ? 'bg-warning/20' : 'bg-success/20'
              }`}>
                <Power className={`w-6 h-6 ${maintenanceMode ? 'text-warning' : 'text-success'}`} />
              </div>
              <div>
                <CardTitle>Site Status</CardTitle>
                <CardDescription>
                  {maintenanceMode ? 'Site is currently in maintenance mode' : 'Site is live and accessible'}
                </CardDescription>
              </div>
            </div>
            <Badge 
              className={maintenanceMode 
                ? 'bg-warning/20 text-warning border-warning/30' 
                : 'bg-success/20 text-success border-success/30'
              }
            >
              {maintenanceMode ? 'Maintenance' : 'Live'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Switch
                id="maintenance-mode"
                checked={maintenanceMode}
                onCheckedChange={toggleMaintenanceMode}
                disabled={isSaving}
              />
              <Label htmlFor="maintenance-mode" className="font-medium">
                Enable Maintenance Mode
              </Label>
            </div>
            {maintenanceMode && maintenanceStartedAt && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                Started {formatDistanceToNow(new Date(maintenanceStartedAt), { addSuffix: true })}
              </div>
            )}
          </div>

          {maintenanceMode && (
            <div className="mt-4 p-4 rounded-lg bg-warning/10 border border-warning/20">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-warning">Site is in maintenance mode</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    All users (except admins) will see a maintenance page instead of the normal site.
                    Make sure to disable maintenance mode when you're done.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Message Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Maintenance Message</CardTitle>
          <CardDescription>
            Customize the message users will see during maintenance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Message</Label>
            <Textarea
              value={maintenanceMessage}
              onChange={(e) => setMaintenanceMessage(e.target.value)}
              placeholder="Enter maintenance message..."
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {maintenanceMessage.length}/500 characters
            </p>
          </div>
          <Button onClick={saveMessage} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Message'}
          </Button>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
          <CardDescription>
            How the maintenance page will appear to users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-[#020202] rounded-lg p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-warning/20 rounded-full flex items-center justify-center">
              <Construction className="w-8 h-8 text-warning" />
            </div>
            <h3 className="text-xl font-bold mb-2">Under Maintenance</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              {maintenanceMessage}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MaintenanceTab;
