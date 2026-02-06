import { useState, useCallback } from 'react';
import { callEdgeFunction } from '@/config/api';

export const useAccountantApi = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callAccountantApi = useCallback(async (action: string, data?: any) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: result, error: fnError } = await callEdgeFunction('accountant-api', { action, data });

      if (fnError) throw fnError;
      if (!result.success) throw new Error(result.error || 'API error');

      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { callAccountantApi, isLoading, error };
};
