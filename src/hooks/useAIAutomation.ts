import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { callEdgeFunction } from '@/config/api';
import { toast } from 'sonner';

export interface AIAutomation {
  id: string;
  agent_id: string;
  agent_name: string;
  is_active: boolean;
  interval_minutes: number;
  last_run_at: string | null;
  next_run_at: string | null;
  total_runs: number;
  successful_runs: number;
  failed_runs: number;
  last_error: string | null;
  config: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export const useAIAutomation = () => {
  const [automations, setAutomations] = useState<AIAutomation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchAutomations = useCallback(async () => {
    const { data, error } = await supabase
      .from('marketing_ai_automation')
      .select('*')
      .order('agent_name');

    if (error) {
      console.error('Error fetching automations:', error);
    } else {
      setAutomations((data || []) as AIAutomation[]);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchAutomations();

    const channel = supabase
      .channel('automation-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'marketing_ai_automation' }, fetchAutomations)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchAutomations]);

  const startAll = async () => {
    setIsProcessing(true);
    try {
      const { error } = await callEdgeFunction('marketing-automation', { action: 'start-all' });
      if (error) throw error;
      toast.success('All AI agents activated! 🚀');
      await fetchAutomations();
    } catch (error: any) {
      toast.error('Failed to start agents');
      console.error(error);
    }
    setIsProcessing(false);
  };

  const stopAll = async () => {
    setIsProcessing(true);
    try {
      const { error } = await callEdgeFunction('marketing-automation', { action: 'stop-all' });
      if (error) throw error;
      toast.success('All AI agents stopped');
      await fetchAutomations();
    } catch (error: any) {
      toast.error('Failed to stop agents');
      console.error(error);
    }
    setIsProcessing(false);
  };

  const toggleAgent = async (agentId: string) => {
    setIsProcessing(true);
    try {
      const { data, error } = await callEdgeFunction('marketing-automation', { action: 'toggle-agent', agentId });
      if (error) throw error;
      const agent = automations.find(a => a.agent_id === agentId);
      toast.success(`${agent?.agent_name} ${data.is_active ? 'activated' : 'stopped'}`);
      await fetchAutomations();
    } catch (error: any) {
      toast.error('Failed to toggle agent');
      console.error(error);
    }
    setIsProcessing(false);
  };

  const runAgent = async (agentId: string) => {
    setIsProcessing(true);
    try {
      const { data, error } = await callEdgeFunction('marketing-automation', { action: 'run-agent', agentId });
      if (error) throw error;
      if (data.success) {
        toast.success(data.message || 'Task completed');
      } else {
        toast.error(data.error || 'Task failed');
      }
      await fetchAutomations();
    } catch (error: any) {
      toast.error('Failed to run agent');
      console.error(error);
    }
    setIsProcessing(false);
  };

  const updateConfig = async (agentId: string, intervalMinutes: number, settings: Record<string, any>) => {
    setIsProcessing(true);
    try {
      const { error } = await callEdgeFunction('marketing-automation', {
        action: 'update-config',
        agentId,
        config: { interval_minutes: intervalMinutes, settings }
      });
      if (error) throw error;
      toast.success('Configuration updated');
      await fetchAutomations();
    } catch (error: any) {
      toast.error('Failed to update config');
      console.error(error);
    }
    setIsProcessing(false);
  };

  const activeCount = automations.filter(a => a.is_active).length;
  const allActive = automations.length > 0 && activeCount === automations.length;

  return {
    automations,
    isLoading,
    isProcessing,
    startAll,
    stopAll,
    toggleAgent,
    runAgent,
    updateConfig,
    activeCount,
    allActive,
    refetch: fetchAutomations
  };
};
