import { useMemo } from 'react';
import { useSubscription } from '@/lib/context/SubscriptionContext';

export interface PlanFeatures {
  // Signals
  signalsPerDay: number;
  unlimitedSignals: boolean;
  
  // AI
  basicAiReasoning: boolean;
  fullAiReasoning: boolean;
  advancedAiCoach: boolean;
  
  // Notifications
  emailNotifications: boolean;
  pushNotifications: boolean;
  
  // Risk Management
  basicRiskCalculator: boolean;
  advancedRiskManagement: boolean;
  
  // Community & Support
  communityAccess: boolean;
  prioritySupport: boolean;
  whiteGloveSupport: boolean;
  onboardingCall: boolean;
  dedicatedAccountManager: boolean;
  
  // Analytics & Tools
  performanceAnalytics: boolean;
  mt5Integration: boolean;
  multiAccountManagement: boolean;
  customApiAccess: boolean;
  strategyCustomization: boolean;
  personalGuidance: boolean;
  
  // Plan info
  planName: string;
  planLevel: 'free' | 'starter' | 'pro' | 'enterprise';
}

const FREE_FEATURES: PlanFeatures = {
  signalsPerDay: 1,
  unlimitedSignals: false,
  basicAiReasoning: false,
  fullAiReasoning: false,
  advancedAiCoach: false,
  emailNotifications: false,
  pushNotifications: false,
  basicRiskCalculator: false,
  advancedRiskManagement: false,
  communityAccess: false,
  prioritySupport: false,
  whiteGloveSupport: false,
  onboardingCall: false,
  dedicatedAccountManager: false,
  performanceAnalytics: false,
  mt5Integration: false,
  multiAccountManagement: false,
  customApiAccess: false,
  strategyCustomization: false,
  personalGuidance: false,
  planName: 'Free',
  planLevel: 'free',
};

const STARTER_FEATURES: PlanFeatures = {
  signalsPerDay: 3,
  unlimitedSignals: false,
  basicAiReasoning: true,
  fullAiReasoning: false,
  advancedAiCoach: false,
  emailNotifications: true,
  pushNotifications: false,
  basicRiskCalculator: true,
  advancedRiskManagement: false,
  communityAccess: true,
  prioritySupport: false,
  whiteGloveSupport: false,
  onboardingCall: false,
  dedicatedAccountManager: false,
  performanceAnalytics: false,
  mt5Integration: false,
  multiAccountManagement: false,
  customApiAccess: false,
  strategyCustomization: false,
  personalGuidance: false,
  planName: 'Starter',
  planLevel: 'starter',
};

const PRO_FEATURES: PlanFeatures = {
  signalsPerDay: -1, // unlimited
  unlimitedSignals: true,
  basicAiReasoning: true,
  fullAiReasoning: true,
  advancedAiCoach: false,
  emailNotifications: true,
  pushNotifications: true,
  basicRiskCalculator: true,
  advancedRiskManagement: true,
  communityAccess: true,
  prioritySupport: true,
  whiteGloveSupport: false,
  onboardingCall: true,
  dedicatedAccountManager: false,
  performanceAnalytics: true,
  mt5Integration: false,
  multiAccountManagement: false,
  customApiAccess: false,
  strategyCustomization: true, // Now enabled for Pro
  personalGuidance: true, // 1-on-1 expert guidance
  planName: 'Pro',
  planLevel: 'pro',
};

const ENTERPRISE_FEATURES: PlanFeatures = {
  signalsPerDay: -1, // unlimited
  unlimitedSignals: true,
  basicAiReasoning: true,
  fullAiReasoning: true,
  advancedAiCoach: true,
  emailNotifications: true,
  pushNotifications: true,
  basicRiskCalculator: true,
  advancedRiskManagement: true,
  communityAccess: true,
  prioritySupport: true,
  whiteGloveSupport: true,
  onboardingCall: true,
  dedicatedAccountManager: true,
  performanceAnalytics: true,
  mt5Integration: true,
  multiAccountManagement: true,
  customApiAccess: true,
  strategyCustomization: true,
  personalGuidance: true, // 1-on-1 expert guidance
  planName: 'Enterprise',
  planLevel: 'enterprise',
};

export const usePlanFeatures = (): PlanFeatures => {
  const { membership, isActive } = useSubscription();
  
  return useMemo(() => {
    if (!isActive || !membership) {
      return FREE_FEATURES;
    }
    
    const planName = membership.planName.toLowerCase();
    
    if (planName.includes('enterprise')) {
      return ENTERPRISE_FEATURES;
    }
    
    if (planName.includes('pro')) {
      return PRO_FEATURES;
    }
    
    if (planName.includes('starter') || planName.includes('kickstarter')) {
      return STARTER_FEATURES;
    }
    
    return FREE_FEATURES;
  }, [membership, isActive]);
};

export const getPlanFeaturesForPlan = (planName: string): PlanFeatures => {
  const name = planName.toLowerCase();
  
  if (name.includes('enterprise')) return ENTERPRISE_FEATURES;
  if (name.includes('pro')) return PRO_FEATURES;
  if (name.includes('starter') || name.includes('kickstarter')) return STARTER_FEATURES;
  
  return FREE_FEATURES;
};
