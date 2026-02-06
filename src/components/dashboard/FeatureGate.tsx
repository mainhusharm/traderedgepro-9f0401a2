import { ReactNode } from 'react';
import { Lock, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { usePlanFeatures, PlanFeatures } from '@/lib/hooks/usePlanFeatures';

interface FeatureGateProps {
  children: ReactNode;
  feature: keyof Omit<PlanFeatures, 'planName' | 'planLevel' | 'signalsPerDay'>;
  requiredPlan?: 'starter' | 'pro' | 'enterprise';
  fallback?: ReactNode;
  showUpgradePrompt?: boolean;
}

const FeatureGate = ({ 
  children, 
  feature, 
  requiredPlan = 'pro',
  fallback,
  showUpgradePrompt = true 
}: FeatureGateProps) => {
  const features = usePlanFeatures();
  const navigate = useNavigate();
  
  const hasAccess = features[feature] === true;
  
  if (hasAccess) {
    return <>{children}</>;
  }
  
  if (fallback) {
    return <>{fallback}</>;
  }
  
  if (!showUpgradePrompt) {
    return null;
  }
  
  const planLabels = {
    starter: 'Starter',
    pro: 'Pro',
    enterprise: 'Enterprise'
  };
  
  return (
    <div className="glass-card p-8 rounded-xl text-center space-y-4">
      <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
        <Lock className="w-8 h-8 text-primary" />
      </div>
      <h3 className="text-xl font-bold">Upgrade Required</h3>
      <p className="text-muted-foreground max-w-md mx-auto">
        This feature requires the {planLabels[requiredPlan]} plan or higher. 
        Upgrade now to unlock full access.
      </p>
      <Button onClick={() => navigate('/membership')} className="btn-glow">
        <Crown className="w-4 h-4 mr-2" />
        Upgrade to {planLabels[requiredPlan]}
      </Button>
    </div>
  );
};

export default FeatureGate;
