import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { toast } from 'sonner';

export const usePaymentStatusCheck = () => {
  const { user } = useAuth();
  const userId = user?.id;

  const checkAndActivateMembership = useCallback(async () => {
    if (!userId) return;

    try {
      // Check for completed payments that might not have activated membership
      const { data: payments, error: paymentError } = await supabase
        .from('payments')
        .select('*, memberships!payments_membership_id_fkey(*)')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(1);

      if (paymentError) throw paymentError;

      if (payments && payments.length > 0) {
        const latestPayment = payments[0];
        
        // Check if membership needs activation
        const { data: membership, error: membershipError } = await supabase
          .from('memberships')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (membershipError && membershipError.code !== 'PGRST116') {
          throw membershipError;
        }

        // If membership is pending but payment is completed, activate it
        if (membership && membership.status === 'pending' && latestPayment.status === 'completed') {
          const { error: updateError } = await supabase
            .from('memberships')
            .update({ 
              status: 'active',
              starts_at: new Date().toISOString(),
              expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            })
            .eq('id', membership.id);

          if (!updateError) {
            toast.success('Your membership has been activated!');
          }
        }
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
    }
  }, [userId]);

  // Set up realtime subscription for payment status changes
  useEffect(() => {
    if (!userId) return;

    // Initial check
    checkAndActivateMembership();

    // Subscribe to payment status changes
    const channel = supabase
      .channel('payment-status-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'payments',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          if (payload.new && (payload.new as { status: string }).status === 'completed') {
            checkAndActivateMembership();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, checkAndActivateMembership]);

  return { checkAndActivateMembership };
};
