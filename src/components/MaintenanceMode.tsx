import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Construction, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MaintenanceModeProps {
  children: React.ReactNode;
}

const MaintenanceMode = ({ children }: MaintenanceModeProps) => {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkMaintenanceMode();
    checkAdminStatus();
    
    // Subscribe to realtime changes
    const channel = supabase
      .channel('site_settings_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'site_settings',
          filter: 'id=eq.main',
        },
        (payload) => {
          const settings = payload.new as any;
          setIsMaintenanceMode(settings.maintenance_mode);
          setMaintenanceMessage(settings.maintenance_message);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const checkMaintenanceMode = async () => {
    try {
      // Skip if Supabase is not configured
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) {
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('site_settings')
        .select('maintenance_mode, maintenance_message')
        .eq('id', 'main')
        .single();

      if (error) throw error;
      
      setIsMaintenanceMode(data?.maintenance_mode || false);
      setMaintenanceMessage(data?.maintenance_message || 'We are currently performing scheduled maintenance.');
    } catch (error) {
      console.error('Error checking maintenance mode:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkAdminStatus = async () => {
    try {
      // Skip if Supabase is not configured
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) {
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin',
      });

      setIsAdmin(data || false);
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#020202] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Admins can bypass maintenance mode
  if (isMaintenanceMode && !isAdmin) {
    return (
      <div className="min-h-screen bg-[#020202] flex items-center justify-center p-4">
        <div className="max-w-lg w-full text-center">
          <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-warning/20 to-warning/5 rounded-full flex items-center justify-center">
            <Construction className="w-12 h-12 text-warning" />
          </div>
          
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-warning to-yellow-300 bg-clip-text text-transparent">
            Under Maintenance
          </h1>
          
          <p className="text-lg text-muted-foreground mb-8">
            {maintenanceMessage}
          </p>

          <div className="space-y-4">
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Check Again
            </Button>
            
            <p className="text-sm text-muted-foreground">
              We apologize for any inconvenience. Our team is working hard to improve your experience.
            </p>
          </div>

          <div className="mt-12 pt-8 border-t border-white/10">
            <p className="text-xs text-muted-foreground">
              If you have any questions, please contact our support team.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default MaintenanceMode;
