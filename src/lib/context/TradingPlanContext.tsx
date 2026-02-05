import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';

interface TradingPlanData {
  propFirm: string;
  accountType: string;
  accountSize: number;
  challengeStep: string;
  riskPercentage: number;
  riskRewardRatio: string;
  tradesPerDay: string;
  tradingExperience: string;
  tradingSession: string;
  forexAssets: string[];
  cryptoAssets: string[];
  customForexPairs: string[];
}

interface TradingPlanContextType {
  tradingPlan: TradingPlanData | null;
  isLoading: boolean;
  error: string | null;
  saveTradingPlan: (data: Partial<TradingPlanData>) => Promise<void>;
  refreshTradingPlan: () => Promise<void>;
}

const defaultTradingPlan: TradingPlanData = {
  propFirm: '',
  accountType: 'evaluation',
  accountSize: 10000,
  challengeStep: 'phase1',
  riskPercentage: 1,
  riskRewardRatio: '1:2',
  tradesPerDay: '1-2',
  tradingExperience: 'beginner',
  tradingSession: 'any',
  forexAssets: [],
  cryptoAssets: [],
  customForexPairs: [],
};

const TradingPlanContext = createContext<TradingPlanContextType | undefined>(undefined);

export const TradingPlanProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const userId = user?.id;
  const [tradingPlan, setTradingPlan] = useState<TradingPlanData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      fetchTradingPlan();
    } else {
      setTradingPlan(null);
      setIsLoading(false);
    }
  }, [userId]);

  const fetchTradingPlan = async () => {
    if (!userId) return;

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('questionnaires')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (data) {
        setTradingPlan({
          propFirm: data.prop_firm,
          accountType: data.account_type,
          accountSize: data.account_size,
          challengeStep: data.challenge_step || 'phase1',
          riskPercentage: data.risk_percentage || 1,
          riskRewardRatio: data.risk_reward_ratio || '1:2',
          tradesPerDay: data.trades_per_day || '1-2',
          tradingExperience: data.trading_experience || 'beginner',
          tradingSession: data.trading_session || 'any',
          forexAssets: data.forex_assets || [],
          cryptoAssets: data.crypto_assets || [],
          customForexPairs: data.custom_forex_pairs || [],
        });
      } else {
        setTradingPlan(null);
      }
    } catch (err: any) {
      console.error('Error fetching trading plan:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const saveTradingPlan = async (data: Partial<TradingPlanData>) => {
    if (!user) throw new Error('Not authenticated');

    try {
      setIsLoading(true);
      setError(null);

      const updatedPlan = { ...defaultTradingPlan, ...tradingPlan, ...data };

      const { error: saveError } = await supabase
        .from('questionnaires')
        .upsert({
          user_id: user.id,
          prop_firm: updatedPlan.propFirm,
          account_type: updatedPlan.accountType,
          account_size: updatedPlan.accountSize,
          challenge_step: updatedPlan.challengeStep,
          risk_percentage: updatedPlan.riskPercentage,
          risk_reward_ratio: updatedPlan.riskRewardRatio,
          trades_per_day: updatedPlan.tradesPerDay,
          trading_experience: updatedPlan.tradingExperience,
          trading_session: updatedPlan.tradingSession,
          forex_assets: updatedPlan.forexAssets,
          crypto_assets: updatedPlan.cryptoAssets,
          custom_forex_pairs: updatedPlan.customForexPairs,
          completed: true,
        }, { onConflict: 'user_id' });

      if (saveError) throw saveError;

      setTradingPlan(updatedPlan);
    } catch (err: any) {
      console.error('Error saving trading plan:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshTradingPlan = async () => {
    await fetchTradingPlan();
  };

  return (
    <TradingPlanContext.Provider
      value={{
        tradingPlan,
        isLoading,
        error,
        saveTradingPlan,
        refreshTradingPlan,
      }}
    >
      {children}
    </TradingPlanContext.Provider>
  );
};

export const useTradingPlan = () => {
  const context = useContext(TradingPlanContext);
  if (context === undefined) {
    throw new Error('useTradingPlan must be used within a TradingPlanProvider');
  }
  return context;
};
