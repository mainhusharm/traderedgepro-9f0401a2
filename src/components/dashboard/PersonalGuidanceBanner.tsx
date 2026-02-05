import { motion } from 'framer-motion';
import { Users, Crown, Calendar, MessageCircle, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePlanFeatures } from '@/lib/hooks/usePlanFeatures';
import { useNavigate } from 'react-router-dom';

interface PersonalGuidanceBannerProps {
  variant?: 'compact' | 'full' | 'card';
  className?: string;
}

const PersonalGuidanceBanner = ({ variant = 'full', className = '' }: PersonalGuidanceBannerProps) => {
  const features = usePlanFeatures();
  const navigate = useNavigate();
  const hasAccess = features.planLevel === 'pro' || features.planLevel === 'enterprise';

  if (variant === 'compact') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-primary/20 to-purple-500/20 border border-primary/30 ${className}`}
      >
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
          <Users className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">1-on-1 Expert Guidance</p>
          <p className="text-xs text-muted-foreground">
            {hasAccess ? 'Schedule your personal session' : 'Available on Pro & Enterprise'}
          </p>
        </div>
        {hasAccess ? (
          <Button size="sm" className="gap-1 btn-glow" onClick={() => navigate('/dashboard?tab=guidance')}>
            <Calendar className="w-4 h-4" />
            Book
          </Button>
        ) : (
          <Button size="sm" variant="outline" onClick={() => navigate('/membership')} className="gap-1">
            Upgrade
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </motion.div>
    );
  }

  if (variant === 'card') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`glass-card rounded-2xl p-6 relative overflow-hidden ${className}`}
      >
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-purple-500/10 to-transparent" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg">1-on-1 Expert Guidance</h3>
              <p className="text-sm text-muted-foreground">Personal coaching sessions</p>
            </div>
            {hasAccess && (
              <span className="ml-auto px-3 py-1 rounded-full bg-success/20 text-success text-xs font-semibold">
                ✓ Included
              </span>
            )}
          </div>

          <ul className="space-y-2 mb-5">
            {[
              'Weekly video calls with trading experts',
              'Personalized trade reviews & feedback',
              'Custom strategy development',
              'Direct messaging support'
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="w-4 h-4 text-primary" />
                {item}
              </li>
            ))}
          </ul>

          {hasAccess ? (
            <Button className="w-full gap-2 btn-glow" onClick={() => navigate('/dashboard?tab=guidance')}>
              <Calendar className="w-4 h-4" />
              Schedule Your Session
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20">
                <Crown className="w-5 h-5 text-warning" />
                <span className="text-sm text-warning font-medium">Pro & Enterprise exclusive feature</span>
              </div>
              <Button 
                className="w-full gap-2" 
                variant="outline"
                onClick={() => navigate('/membership')}
              >
                Upgrade to Access
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  // Full variant
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-2xl ${className}`}
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-purple-500/20 to-primary/20" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />
      
      <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row items-center gap-8">
        {/* Icon */}
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center shrink-0 shadow-lg shadow-primary/30">
          <Users className="w-10 h-10 text-white" />
        </div>

        {/* Content */}
        <div className="flex-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
            <Crown className="w-5 h-5 text-warning" />
            <span className="text-sm font-semibold text-warning uppercase tracking-wider">Pro & Enterprise Exclusive</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-3">
            1-on-1 Personal Guidance with Trading Experts
          </h2>
          <p className="text-muted-foreground mb-4 max-w-2xl">
            Get personalized coaching, strategy reviews, and direct access to our professional trading team. 
            Accelerate your journey to becoming a funded trader with expert mentorship.
          </p>
          
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-primary" />
              Weekly Sessions
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MessageCircle className="w-4 h-4 text-primary" />
              Direct Support
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Sparkles className="w-4 h-4 text-primary" />
              Custom Strategies
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="shrink-0">
          {hasAccess ? (
            <Button size="lg" className="gap-2 btn-glow shadow-lg" onClick={() => navigate('/dashboard?tab=guidance')}>
              <Calendar className="w-5 h-5" />
              Book Session
            </Button>
          ) : (
            <Button 
              size="lg" 
              className="gap-2 bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90"
              onClick={() => navigate('/membership')}
            >
              Upgrade Now
              <ArrowRight className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default PersonalGuidanceBanner;
