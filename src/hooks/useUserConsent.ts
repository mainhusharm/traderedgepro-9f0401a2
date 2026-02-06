import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';

interface UserConsent {
  id: string;
  user_id: string;
  terms_accepted: boolean;
  privacy_accepted: boolean;
  risk_disclosure_accepted: boolean;
  electronic_signature_accepted: boolean;
  signed_at: string;
}

const CONSENT_CACHE_KEY = 'user_consent_signed';

export const useUserConsent = () => {
  const { user } = useAuth();
  const [consent, setConsent] = useState<UserConsent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSignedConsent, setHasSignedConsent] = useState(false);

  useEffect(() => {
    if (user) {
      // Check sessionStorage first for faster loading
      const cachedConsent = sessionStorage.getItem(`${CONSENT_CACHE_KEY}_${user.id}`);
      if (cachedConsent === 'true') {
        setHasSignedConsent(true);
        setIsLoading(false);
        // Still fetch in background to ensure accuracy
        fetchConsent(true);
      } else {
        fetchConsent(false);
      }
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const fetchConsent = async (isBackgroundFetch: boolean) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_consents')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Error fetching consent:', error);
      }

      if (data) {
        setConsent(data as UserConsent);
        // Check if all consents are signed
        const allSigned = data.terms_accepted && 
                         data.privacy_accepted && 
                         data.risk_disclosure_accepted && 
                         data.electronic_signature_accepted;
        setHasSignedConsent(allSigned);
        // Cache the result in sessionStorage
        if (allSigned) {
          sessionStorage.setItem(`${CONSENT_CACHE_KEY}_${user.id}`, 'true');
        }
      }
    } catch (error) {
      console.error('Error fetching consent:', error);
    } finally {
      if (!isBackgroundFetch) {
        setIsLoading(false);
      }
    }
  };

  const signConsent = async (consents: {
    terms: boolean;
    privacy: boolean;
    riskDisclosure: boolean;
    electronicSignature: boolean;
  }) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase
        .from('user_consents')
        .upsert({
          user_id: user.id,
          terms_accepted: consents.terms,
          privacy_accepted: consents.privacy,
          risk_disclosure_accepted: consents.riskDisclosure,
          electronic_signature_accepted: consents.electronicSignature,
          ip_address: null, // Could be fetched server-side
          user_agent: navigator.userAgent,
          signed_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (error) throw error;

      setConsent(data as UserConsent);
      setHasSignedConsent(true);
      return data;
    } catch (error) {
      console.error('Error signing consent:', error);
      throw error;
    }
  };

  return {
    consent,
    isLoading,
    hasSignedConsent,
    signConsent,
    refetch: () => fetchConsent(false)
  };
};
