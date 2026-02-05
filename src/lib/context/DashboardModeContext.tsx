import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export type DashboardMode = 'prop_firm' | 'personal_capital';

interface DashboardModeContextType {
  mode: DashboardMode;
  setMode: (mode: DashboardMode) => void;
  isLoading: boolean;
  toggleMode: () => void;
}

const DashboardModeContext = createContext<DashboardModeContextType | undefined>(undefined);

export const DashboardModeProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [mode, setModeState] = useState<DashboardMode>('prop_firm');
  const [isLoading, setIsLoading] = useState(true);

  // Load user preference from database
  useEffect(() => {
    const loadPreference = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('preferred_dashboard_mode')
          .eq('user_id', user.id)
          .single();

        if (data?.preferred_dashboard_mode) {
          setModeState(data.preferred_dashboard_mode as DashboardMode);
        }
      } catch (error) {
        console.error('Error loading dashboard mode preference:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPreference();
  }, [user?.id]);

  // Update mode and persist to database
  const setMode = useCallback(async (newMode: DashboardMode) => {
    setModeState(newMode);
    
    if (!user?.id) return;

    try {
      await supabase
        .from('profiles')
        .update({ preferred_dashboard_mode: newMode })
        .eq('user_id', user.id);
    } catch (error) {
      console.error('Error saving dashboard mode preference:', error);
    }
  }, [user?.id]);

  const toggleMode = useCallback(() => {
    setMode(mode === 'prop_firm' ? 'personal_capital' : 'prop_firm');
  }, [mode, setMode]);

  return (
    <DashboardModeContext.Provider value={{ mode, setMode, isLoading, toggleMode }}>
      {children}
    </DashboardModeContext.Provider>
  );
};

export const useDashboardMode = () => {
  const context = useContext(DashboardModeContext);
  if (context === undefined) {
    throw new Error('useDashboardMode must be used within a DashboardModeProvider');
  }
  return context;
};
