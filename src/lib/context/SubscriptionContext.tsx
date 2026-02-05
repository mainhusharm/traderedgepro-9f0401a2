import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';

interface Membership {
  id: string;
  planName: string;
  planPrice: number;
  status: 'active' | 'inactive' | 'pending' | 'cancelled' | 'expired';
  billingPeriod: 'monthly' | 'yearly' | 'lifetime';
  startsAt: string | null;
  expiresAt: string | null;
  isTrial?: boolean;
  trialCouponCode?: string;
}

interface TrialTimeRemaining {
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
}

interface SubscriptionContextType {
  membership: Membership | null;
  isLoading: boolean;
  isPremium: boolean;
  isActive: boolean;
  daysRemaining: number | null;
  isTrial: boolean;
  trialExpired: boolean;
  trialExpiresAt: Date | null;
  trialTimeRemaining: TrialTimeRemaining | null;
  refreshMembership: () => Promise<void>;
  createMembership: (planName: string, planPrice: number, billingPeriod: string) => Promise<string>;
  createTrialMembership: (planName: string, trialDurationHours: number, couponCode: string) => Promise<string>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const userId = user?.id;
  const [membership, setMembership] = useState<Membership | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [trialTimeRemaining, setTrialTimeRemaining] = useState<TrialTimeRemaining | null>(null);

  useEffect(() => {
    if (userId) {
      fetchMembership();
    } else {
      setMembership(null);
      setIsLoading(false);
    }
  }, [userId]);

  // Trial countdown timer
  useEffect(() => {
    if (!membership?.isTrial || !membership?.expiresAt) {
      setTrialTimeRemaining(null);
      return;
    }

    const updateCountdown = () => {
      const now = new Date().getTime();
      const expiresAt = new Date(membership.expiresAt!).getTime();
      const diff = expiresAt - now;

      if (diff <= 0) {
        setTrialTimeRemaining({ hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 });
        // Refresh membership to get updated status
        fetchMembership();
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      const totalSeconds = Math.floor(diff / 1000);

      setTrialTimeRemaining({ hours, minutes, seconds, totalSeconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [membership?.isTrial, membership?.expiresAt]);

  const fetchMembership = async () => {
    if (!userId) return;

    try {
      setIsLoading(true);

      // Get the most recent ACTIVE membership first, fallback to most recent overall
      const { data: activeMembership, error: activeError } = await supabase
        .from('memberships')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (activeError && activeError.code !== 'PGRST116') {
        throw activeError;
      }

      // If we found an active membership, use it
      if (activeMembership) {
        setMembership({
          id: activeMembership.id,
          planName: activeMembership.plan_name,
          planPrice: activeMembership.plan_price,
          status: activeMembership.status as Membership['status'],
          billingPeriod: activeMembership.billing_period as Membership['billingPeriod'],
          startsAt: activeMembership.starts_at,
          expiresAt: activeMembership.expires_at,
          isTrial: activeMembership.is_trial || false,
          trialCouponCode: activeMembership.trial_coupon_code,
        });
      } else {
        // Fallback to most recent membership of any status
        const { data, error } = await supabase
          .from('memberships')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        if (data) {
          setMembership({
            id: data.id,
            planName: data.plan_name,
            planPrice: data.plan_price,
            status: data.status as Membership['status'],
            billingPeriod: data.billing_period as Membership['billingPeriod'],
            startsAt: data.starts_at,
            expiresAt: data.expires_at,
            isTrial: data.is_trial || false,
            trialCouponCode: data.trial_coupon_code,
          });
        } else {
          setMembership(null);
        }
      }
    } catch (err) {
      console.error('Error fetching membership:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const createMembership = async (planName: string, planPrice: number, billingPeriod: string) => {
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('memberships')
      .insert({
        user_id: user.id,
        plan_name: planName,
        plan_price: planPrice,
        billing_period: billingPeriod,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;
    
    await fetchMembership();
    return data.id;
  };

  const createTrialMembership = async (planName: string, trialDurationHours: number, couponCode: string) => {
    if (!user) throw new Error('Not authenticated');

    const now = new Date();
    const expiresAt = new Date(now.getTime() + trialDurationHours * 60 * 60 * 1000);

    const { data, error } = await supabase
      .from('memberships')
      .insert({
        user_id: user.id,
        plan_name: planName,
        plan_price: 0,
        billing_period: 'monthly',
        status: 'active',
        is_trial: true,
        trial_coupon_code: couponCode,
        starts_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    
    await fetchMembership();
    return data.id;
  };

  const isPremium = membership?.status === 'active' && 
    ['Pro', 'Pro+', 'Enterprise', 'Enterprise Trial', 'Pro Trial'].includes(membership.planName);

  const isActive = membership?.status === 'active';

  const isTrial = membership?.isTrial || false;

  const trialExpired = isTrial && membership?.expiresAt 
    ? new Date(membership.expiresAt) < new Date() 
    : false;

  const trialExpiresAt = membership?.isTrial && membership?.expiresAt 
    ? new Date(membership.expiresAt) 
    : null;

  const daysRemaining = membership?.expiresAt
    ? Math.max(0, Math.ceil((new Date(membership.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <SubscriptionContext.Provider
      value={{
        membership,
        isLoading,
        isPremium,
        isActive,
        daysRemaining,
        isTrial,
        trialExpired,
        trialExpiresAt,
        trialTimeRemaining,
        refreshMembership: fetchMembership,
        createMembership,
        createTrialMembership,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
