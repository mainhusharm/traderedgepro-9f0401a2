import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gift, Twitter, MessageCircle, Sparkles, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const TWITTER_URL = 'https://x.com/Traderredgepro';
const DISCORD_URL = 'https://discord.gg/EXB6R8d2';

const LaunchGiveawayPopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [followedX, setFollowedX] = useState(false);
  const [followedDiscord, setFollowedDiscord] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    // Use sessionStorage so it only shows once per browser session (closes when browser closes)
    const hasShownPopup = sessionStorage.getItem('launch_giveaway_shown_session');
    const hasSubmitted = localStorage.getItem('launch_giveaway_submitted');
    
    if (hasSubmitted || hasShownPopup) {
      return;
    }

    // Show popup after 5 seconds
    const timer = setTimeout(() => {
      setIsOpen(true);
      // Mark as shown for this session immediately
      sessionStorage.setItem('launch_giveaway_shown_session', 'true');
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    if (!followedX || !followedDiscord) {
      toast.error('Please follow us on both X and Discord to participate');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('launch_giveaway_entries')
        .insert({
          email: email.toLowerCase().trim(),
          followed_x: followedX,
          followed_discord: followedDiscord,
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('This email is already registered for the giveaway!');
        } else {
          throw error;
        }
        return;
      }

      setIsSubmitted(true);
      localStorage.setItem('launch_giveaway_submitted', 'true');
      toast.success('🎉 You\'re in! Good luck winning the Enterprise plan!');
      
      // Close after showing success
      setTimeout(() => {
        setIsOpen(false);
      }, 3000);
    } catch (error) {
      console.error('Error submitting giveaway entry:', error);
      toast.error('Failed to submit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFollowX = () => {
    window.open(TWITTER_URL, '_blank');
    setFollowedX(true);
  };

  const handleFollowDiscord = () => {
    window.open(DISCORD_URL, '_blank');
    setFollowedDiscord(true);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />

          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="relative w-full max-w-lg bg-gradient-to-br from-background via-background to-primary/5 border border-primary/20 rounded-2xl shadow-2xl shadow-primary/10 overflow-hidden">
              {/* Animated background */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
              
              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors z-10"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>

              <div className="relative p-8">
                {!isSubmitted ? (
                  <>
                    {/* Header */}
                    <div className="text-center mb-6">
                      <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full mb-4">
                        <Gift className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-primary">TraderEdge Pro Launch Offer</span>
                      </div>
                      
                      <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                        Win FREE Enterprise Plan! 🎁
                      </h2>
                      <p className="text-muted-foreground">
                        Enter your email for a chance to win our <span className="text-success font-semibold">Enterprise Plan worth $599/month</span> absolutely FREE!
                      </p>
                    </div>

                    {/* Pro Plan Discount Banner */}
                    <div className="bg-gradient-to-r from-success/10 via-success/5 to-success/10 border border-success/20 rounded-xl p-4 mb-6">
                      <div className="flex items-center gap-3">
                        <Sparkles className="w-5 h-5 text-success shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-success">Launch Special: 20% OFF Pro Plan</p>
                          <p className="text-xs text-muted-foreground">Use code <span className="font-mono font-bold text-foreground">PROLAUNCH20</span> at checkout</p>
                        </div>
                      </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <Input
                        type="email"
                        placeholder="Enter your email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-12 bg-background/50 border-white/10 focus:border-primary/50"
                        required
                      />

                      {/* Follow requirements */}
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground font-medium">To participate, follow us on:</p>
                        
                        <div className="flex flex-col sm:flex-row gap-3">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleFollowX}
                            className={`flex-1 gap-2 h-11 ${followedX ? 'border-success/50 bg-success/10 text-success' : 'border-white/10'}`}
                          >
                            {followedX ? <Check className="w-4 h-4" /> : <Twitter className="w-4 h-4" />}
                            {followedX ? 'Following X' : 'Follow on X'}
                          </Button>
                          
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleFollowDiscord}
                            className={`flex-1 gap-2 h-11 ${followedDiscord ? 'border-success/50 bg-success/10 text-success' : 'border-white/10'}`}
                          >
                            {followedDiscord ? <Check className="w-4 h-4" /> : <MessageCircle className="w-4 h-4" />}
                            {followedDiscord ? 'Joined Discord' : 'Join Discord'}
                          </Button>
                        </div>

                        <div className="flex items-start gap-2 pt-2">
                          <Checkbox
                            id="confirm"
                            checked={followedX && followedDiscord}
                            disabled
                            className="mt-0.5"
                          />
                          <label htmlFor="confirm" className="text-xs text-muted-foreground">
                            I confirm that I have followed TraderEdge Pro on X and joined the Discord server
                          </label>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        disabled={isSubmitting || !followedX || !followedDiscord}
                        className="w-full h-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-semibold"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Entering...
                          </>
                        ) : (
                          <>
                            <Gift className="w-4 h-4 mr-2" />
                            Enter Giveaway
                          </>
                        )}
                      </Button>
                    </form>

                    {/* Footer */}
                    <p className="text-center text-xs text-muted-foreground mt-4">
                      🗓️ Winner announced on <span className="font-semibold text-foreground">January 18, 2026</span>
                    </p>
                  </>
                ) : (
                  /* Success State */
                  <div className="text-center py-8">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-20 h-20 mx-auto mb-6 rounded-full bg-success/20 flex items-center justify-center"
                    >
                      <Check className="w-10 h-10 text-success" />
                    </motion.div>
                    <h3 className="text-2xl font-bold text-foreground mb-2">You're In! 🎉</h3>
                    <p className="text-muted-foreground mb-4">
                      Good luck! Winner will be announced on <span className="text-foreground font-semibold">January 18, 2026</span>
                    </p>
                    <p className="text-sm text-primary">
                      Don't forget: Use <span className="font-mono font-bold">PROLAUNCH20</span> for 20% off Pro Plan!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default LaunchGiveawayPopup;
