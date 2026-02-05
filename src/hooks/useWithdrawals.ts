import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Withdrawal {
  id: string;
  user_id: string;
  account_id: string | null;
  amount: number;
  currency: string;
  withdrawal_date: string;
  withdrawal_type: string;
  notes: string | null;
  created_at: string;
}

export interface Deposit {
  id: string;
  user_id: string;
  account_id: string | null;
  amount: number;
  deposit_date: string;
  notes: string | null;
  created_at: string;
}

export interface CreateWithdrawalData {
  account_id?: string;
  amount: number;
  currency?: string;
  withdrawal_date?: string;
  withdrawal_type?: string;
  notes?: string;
}

export interface CreateDepositData {
  account_id?: string;
  amount: number;
  deposit_date?: string;
  notes?: string;
}

export const useWithdrawals = (accountId?: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWithdrawals = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      let query = supabase
        .from('user_withdrawals')
        .select('*')
        .eq('user_id', user.id)
        .order('withdrawal_date', { ascending: false });

      if (accountId) {
        query = query.eq('account_id', accountId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setWithdrawals((data as Withdrawal[]) || []);
    } catch (err: any) {
      console.error('Error fetching withdrawals:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, accountId]);

  const fetchDeposits = useCallback(async () => {
    if (!user?.id) return;

    try {
      let query = supabase
        .from('user_deposits')
        .select('*')
        .eq('user_id', user.id)
        .order('deposit_date', { ascending: false });

      if (accountId) {
        query = query.eq('account_id', accountId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setDeposits((data as Deposit[]) || []);
    } catch (err: any) {
      console.error('Error fetching deposits:', err);
    }
  }, [user?.id, accountId]);

  useEffect(() => {
    fetchWithdrawals();
    fetchDeposits();
  }, [fetchWithdrawals, fetchDeposits]);

  const createWithdrawal = async (data: CreateWithdrawalData) => {
    if (!user?.id) {
      toast({ title: 'Error', description: 'You must be logged in', variant: 'destructive' });
      return null;
    }

    try {
      const { data: newWithdrawal, error } = await supabase
        .from('user_withdrawals')
        .insert({
          user_id: user.id,
          account_id: data.account_id,
          amount: data.amount,
          currency: data.currency || 'USD',
          withdrawal_date: data.withdrawal_date || new Date().toISOString().split('T')[0],
          withdrawal_type: data.withdrawal_type || 'profit_take',
          notes: data.notes,
        })
        .select()
        .single();

      if (error) throw error;

      toast({ title: 'Success', description: 'Withdrawal recorded successfully' });
      fetchWithdrawals();
      return newWithdrawal as Withdrawal;
    } catch (err: any) {
      console.error('Error creating withdrawal:', err);
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
      return null;
    }
  };

  const createDeposit = async (data: CreateDepositData) => {
    if (!user?.id) {
      toast({ title: 'Error', description: 'You must be logged in', variant: 'destructive' });
      return null;
    }

    try {
      const { data: newDeposit, error } = await supabase
        .from('user_deposits')
        .insert({
          user_id: user.id,
          account_id: data.account_id,
          amount: data.amount,
          deposit_date: data.deposit_date || new Date().toISOString().split('T')[0],
          notes: data.notes,
        })
        .select()
        .single();

      if (error) throw error;

      toast({ title: 'Success', description: 'Deposit recorded successfully' });
      fetchDeposits();
      return newDeposit as Deposit;
    } catch (err: any) {
      console.error('Error creating deposit:', err);
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
      return null;
    }
  };

  const deleteWithdrawal = async (id: string) => {
    if (!user?.id) return false;

    try {
      const { error } = await supabase
        .from('user_withdrawals')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({ title: 'Success', description: 'Withdrawal deleted' });
      fetchWithdrawals();
      return true;
    } catch (err: any) {
      console.error('Error deleting withdrawal:', err);
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
      return false;
    }
  };

  const deleteDeposit = async (id: string) => {
    if (!user?.id) return false;

    try {
      const { error } = await supabase
        .from('user_deposits')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({ title: 'Success', description: 'Deposit deleted' });
      fetchDeposits();
      return true;
    } catch (err: any) {
      console.error('Error deleting deposit:', err);
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
      return false;
    }
  };

  // Calculate totals
  const totalWithdrawals = withdrawals.reduce((sum, w) => sum + Number(w.amount), 0);
  const totalDeposits = deposits.reduce((sum, d) => sum + Number(d.amount), 0);

  // Monthly totals
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthlyWithdrawals = withdrawals
    .filter(w => w.withdrawal_date.startsWith(currentMonth))
    .reduce((sum, w) => sum + Number(w.amount), 0);

  const monthlyDeposits = deposits
    .filter(d => d.deposit_date.startsWith(currentMonth))
    .reduce((sum, d) => sum + Number(d.amount), 0);

  return {
    withdrawals,
    deposits,
    isLoading,
    fetchWithdrawals,
    fetchDeposits,
    createWithdrawal,
    createDeposit,
    deleteWithdrawal,
    deleteDeposit,
    totalWithdrawals,
    totalDeposits,
    monthlyWithdrawals,
    monthlyDeposits,
  };
};
