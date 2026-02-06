import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { callEdgeFunction } from '@/config/api';

export const useAdminApi = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callAdminApi = useCallback(async (action: string, data?: any) => {
    setIsLoading(true);
    setError(null);

    try {
      const adminSessionRaw = sessionStorage.getItem('admin_session');
      const headers: Record<string, string> = {};

      if (adminSessionRaw) {
        // The admin-api expects the x-admin-session header to contain a JSON payload
        // like: { token, expiresAt }. We store that exact JSON string in sessionStorage,
        // so forward it as-is.
        headers['x-admin-session'] = adminSessionRaw;
      }

      if (!headers['x-admin-session']) {
        // Fall back to JWT-based auth (explicitly forward access token)
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Not authenticated');
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const { data: result, error } = await callEdgeFunction('admin-api', { action, data }, headers);
      if (error) throw error;
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { callAdminApi, isLoading, error };
};
