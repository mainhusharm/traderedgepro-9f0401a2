import { Crown, Zap, Star, Gift } from 'lucide-react';
import { usePlanFeatures } from '@/lib/hooks/usePlanFeatures';

const PlanBadge = () => {
  const features = usePlanFeatures();
  
  const planConfig = {
    free: {
      icon: Gift,
      label: 'Free',
      className: 'bg-muted text-muted-foreground'
    },
    starter: {
      icon: Zap,
      label: 'Starter',
      className: 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
    },
    pro: {
      icon: Star,
      label: 'Pro',
      className: 'bg-primary/20 text-primary border border-primary/30'
    },
    enterprise: {
      icon: Crown,
      label: 'Enterprise',
      className: 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
    }
  };
  
  const config = planConfig[features.planLevel];
  const Icon = config.icon;
  
  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${config.className}`}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </div>
  );
};

export default PlanBadge;
