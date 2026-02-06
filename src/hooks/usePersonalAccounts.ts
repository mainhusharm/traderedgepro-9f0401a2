import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PersonalAccount {
  id: string;
  user_id: string;
  broker_name: string;
  account_label: string | null;
  account_number: string | null;
  currency: string;
  starting_balance: number;
  current_balance: number;
  highest_balance: number;
  leverage: number;
  account_type: string;
  is_primary: boolean;
  risk_per_trade_pct: number;
  daily_loss_limit_pct: number;
  monthly_income_goal: number | null;
  capital_floor: number | null;
  status: string;
  created_at: string;
  updated_at: string;
  trading_locked_until: string | null;
  lock_reason: string | null;
}

export interface CreatePersonalAccountData {
  broker_name: string;
  account_label?: string;
  account_number?: string;
  currency?: string;
  starting_balance: number;
  current_balance?: number;
  leverage?: number;
  account_type?: string;
  is_primary?: boolean;
  risk_per_trade_pct?: number;
  daily_loss_limit_pct?: number;
  monthly_income_goal?: number;
  capital_floor?: number;
}

export const usePersonalAccounts = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<PersonalAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAccounts = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error: fetchError } = await supabase
        .from('user_personal_accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setAccounts((data as PersonalAccount[]) || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching personal accounts:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // Real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('personal_accounts_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_personal_accounts',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchAccounts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchAccounts]);

  const createAccount = async (data: CreatePersonalAccountData) => {
    if (!user?.id) {
      toast({ title: 'Error', description: 'You must be logged in', variant: 'destructive' });
      return null;
    }

    try {
      // If this is set as primary, unset other primary accounts first
      if (data.is_primary) {
        await supabase
          .from('user_personal_accounts')
          .update({ is_primary: false })
          .eq('user_id', user.id);
      }

      const { data: newAccount, error: createError } = await supabase
        .from('user_personal_accounts')
        .insert({
          user_id: user.id,
          broker_name: data.broker_name,
          account_label: data.account_label,
          account_number: data.account_number,
          currency: data.currency || 'USD',
          starting_balance: data.starting_balance,
          current_balance: data.current_balance || data.starting_balance,
          highest_balance: data.current_balance || data.starting_balance,
          leverage: data.leverage || 100,
          account_type: data.account_type || 'standard',
          is_primary: data.is_primary || accounts.length === 0,
          risk_per_trade_pct: data.risk_per_trade_pct || 1,
          daily_loss_limit_pct: data.daily_loss_limit_pct || 5,
          monthly_income_goal: data.monthly_income_goal,
          capital_floor: data.capital_floor,
        })
        .select()
        .single();

      if (createError) throw createError;

      toast({ title: 'Success', description: 'Account created successfully' });
      return newAccount as PersonalAccount;
    } catch (err: any) {
      console.error('Error creating account:', err);
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
      return null;
    }
  };

  const updateAccount = async (id: string, data: Partial<CreatePersonalAccountData>) => {
    if (!user?.id) return null;

    try {
      // If setting as primary, unset others first
      if (data.is_primary) {
        await supabase
          .from('user_personal_accounts')
          .update({ is_primary: false })
          .eq('user_id', user.id)
          .neq('id', id);
      }

      const { data: updated, error: updateError } = await supabase
        .from('user_personal_accounts')
        .update(data)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) throw updateError;

      toast({ title: 'Success', description: 'Account updated successfully' });
      return updated as PersonalAccount;
    } catch (err: any) {
      console.error('Error updating account:', err);
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
      return null;
    }
  };

  const deleteAccount = async (id: string) => {
    if (!user?.id) return false;

    try {
      const { error: deleteError } = await supabase
        .from('user_personal_accounts')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      toast({ title: 'Success', description: 'Account deleted successfully' });
      return true;
    } catch (err: any) {
      console.error('Error deleting account:', err);
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
      return false;
    }
  };

  const updateBalance = async (id: string, newBalance: number) => {
    const account = accounts.find(a => a.id === id);
    if (!account) return null;

    const updates: Partial<PersonalAccount> = {
      current_balance: newBalance,
    };

    // Update highest balance if new balance is higher
    if (newBalance > (account.highest_balance || 0)) {
      updates.highest_balance = newBalance;
    }

    return updateAccount(id, updates as any);
  };

  const primaryAccount = accounts.find(a => a.is_primary) || accounts[0] || null;
  
  const totalPortfolioValue = accounts
    .filter(a => a.status === 'active')
    .reduce((sum, a) => sum + Number(a.current_balance), 0);

  const totalProfit = accounts
    .filter(a => a.status === 'active')
    .reduce((sum, a) => sum + (Number(a.current_balance) - Number(a.starting_balance)), 0);

  return {
    accounts,
    isLoading,
    error,
    fetchAccounts,
    createAccount,
    updateAccount,
    deleteAccount,
    updateBalance,
    primaryAccount,
    totalPortfolioValue,
    totalProfit,
  };
};
