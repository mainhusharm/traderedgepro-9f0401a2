import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, ExternalLink, Crown, Clock, Video, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePlanFeatures } from '@/lib/hooks/usePlanFeatures';
import { useNavigate } from 'react-router-dom';

interface BookingCalendarProps {
  className?: string;
}

const BookingCalendar = ({ className = '' }: BookingCalendarProps) => {
  const features = usePlanFeatures();
  const navigate = useNavigate();
  const [calendlyUrl, setCalendlyUrl] = useState('');
  const [showEmbed, setShowEmbed] = useState(false);

  // Default Calendly URL - this would be set by admin
  const defaultCalendlyUrl = 'https://calendly.com/traderedge/1-on-1-guidance';

  const sessionTypes = [
    {
      title: 'Strategy Review',
      duration: '30 min',
      description: 'Review your trading strategy and get personalized feedback',
      icon: Target,
    },
    {
      title: 'Performance Analysis',
      duration: '45 min',
      description: 'Deep dive into your trading metrics and identify improvements',
      icon: BarChart3,
    },
    {
      title: 'Risk Management',
      duration: '30 min',
      description: 'Optimize your risk parameters for prop firm challenges',
      icon: Shield,
    },
    {
      title: 'Psychology Session',
      duration: '60 min',
      description: 'Work on trading mindset and emotional management',
      icon: Brain,
    },
  ];

  if (!features.personalGuidance) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`glass-card p-6 rounded-xl ${className}`}
      >
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <Crown className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-xl font-bold mb-2">1-on-1 Personal Guidance</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Get direct access to our trading experts for personalized coaching, strategy reviews, and mentorship.
          </p>
          <Button 
            onClick={() => navigate('/membership')}
            className="bg-gradient-to-r from-primary to-accent"
          >
            <Crown className="w-4 h-4 mr-2" />
            Upgrade to Pro or Enterprise
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`space-y-6 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
          <Calendar className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">Book 1-on-1 Guidance</h3>
          <p className="text-sm text-muted-foreground">Schedule a session with our trading experts</p>
        </div>
      </div>

      {/* Session Types */}
      <div className="grid md:grid-cols-2 gap-4">
        {sessionTypes.map((session) => (
          <div 
            key={session.title}
            className="glass-card p-4 rounded-xl hover:border-primary/30 border border-transparent transition-all cursor-pointer"
            onClick={() => setShowEmbed(true)}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <session.icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-medium">{session.title}</h4>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {session.duration}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{session.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Book Button */}
      <div className="glass-card p-5 rounded-xl bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <Video className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold">Ready to level up your trading?</h4>
              <p className="text-sm text-muted-foreground">Book your personalized session now</p>
            </div>
          </div>
          <Button 
            onClick={() => navigate('/dashboard?tab=guidance')}
            className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Book Now
          </Button>
        </div>
      </div>

      {/* Custom Calendly URL Input */}
      <div className="glass-card p-4 rounded-xl">
        <div className="flex items-center gap-3 mb-3">
          <Label className="text-sm">Or use a custom booking link:</Label>
        </div>
        <div className="flex gap-2">
          <Input
            value={calendlyUrl}
            onChange={(e) => setCalendlyUrl(e.target.value)}
            placeholder="https://calendly.com/your-link"
            className="bg-white/5 border-white/10"
          />
          <Button 
            variant="outline"
            onClick={() => calendlyUrl && window.open(calendlyUrl, '_blank')}
            disabled={!calendlyUrl}
          >
            Open
          </Button>
        </div>
      </div>

      {/* Embed Modal */}
      {showEmbed && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-background rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
          >
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-semibold">Schedule Your Session</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowEmbed(false)}>
                ✕
              </Button>
            </div>
            <div className="p-6 text-center">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground mb-4">
                Click the button below to book your session
              </p>
              <Button 
                onClick={() => {
                  setShowEmbed(false);
                  navigate('/dashboard?tab=guidance');
                }}
                className="bg-gradient-to-r from-primary to-accent"
              >
                Book Session
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Benefits */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-4 glass-card rounded-xl">
          <User className="w-8 h-8 mx-auto mb-2 text-primary" />
          <p className="text-sm font-medium">Expert Mentors</p>
          <p className="text-xs text-muted-foreground">Funded prop traders</p>
        </div>
        <div className="text-center p-4 glass-card rounded-xl">
          <Video className="w-8 h-8 mx-auto mb-2 text-success" />
          <p className="text-sm font-medium">Video Calls</p>
          <p className="text-xs text-muted-foreground">Screen sharing enabled</p>
        </div>
        <div className="text-center p-4 glass-card rounded-xl">
          <Clock className="w-8 h-8 mx-auto mb-2 text-warning" />
          <p className="text-sm font-medium">Flexible Timing</p>
          <p className="text-xs text-muted-foreground">24/7 availability</p>
        </div>
      </div>
    </motion.div>
  );
};

// Import icons at the top level
import { Target, BarChart3, Shield, Brain } from 'lucide-react';

export default BookingCalendar;
