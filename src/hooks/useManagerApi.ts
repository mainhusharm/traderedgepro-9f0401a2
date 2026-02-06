import { useCallback } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { callEdgeFunction } from '@/config/api';

export const useManagerApi = () => {
  const navigate = useNavigate();

  const callManagerApi = useCallback(async (action: string, data: Record<string, any> = {}) => {
    const sessionToken = sessionStorage.getItem('manager_session_token');
    
    if (!sessionToken) {
      toast.error('Session expired. Please login again.');
      navigate('/manager/login');
      return null;
    }

    try {
      const { data: response, error } = await callEdgeFunction('manager-api', {
        action,
        sessionToken,
        data,
      });

      if (error) {
        console.error('Manager API error:', error);
        toast.error('API request failed');
        return null;
      }

      if (!response?.success && response?.error === 'Invalid session') {
        sessionStorage.removeItem('manager_session_token');
        sessionStorage.removeItem('manager_info');
        toast.error('Session expired. Please login again.');
        navigate('/manager/login');
        return null;
      }

      return response;
    } catch (err) {
      console.error('Manager API call failed:', err);
      toast.error('Failed to connect to server');
      return null;
    }
  }, [navigate]);

  const logout = useCallback(async () => {
    await callManagerApi('logout');
    sessionStorage.removeItem('manager_session_token');
    sessionStorage.removeItem('manager_info');
    navigate('/manager/login');
  }, [callManagerApi, navigate]);

  return { callManagerApi, logout };
};
