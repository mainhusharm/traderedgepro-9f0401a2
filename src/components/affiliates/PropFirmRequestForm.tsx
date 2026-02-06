import { useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, Send, Loader2, CheckCircle, Mail, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';

const requestSchema = z.object({
  userName: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  userEmail: z.string().trim().email("Please enter a valid email address").max(255),
  propFirmName: z.string().trim().min(2, "Prop firm name must be at least 2 characters").max(100),
});

const PropFirmRequestForm = () => {
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [propFirmName, setPropFirmName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    const validation = requestSchema.safeParse({ userName, userEmail, propFirmName });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { error } = await supabase.functions.invoke('notify-prop-firm-request', {
        body: {
          userName: userName.trim(),
          userEmail: userEmail.trim(),
          propFirmName: propFirmName.trim(),
        },
      });

      if (error) throw error;

      setIsSuccess(true);
      toast.success('Request submitted! We\'ll get back to you within 24-72 hours.');
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setUserName('');
        setUserEmail('');
        setPropFirmName('');
        setIsSuccess(false);
      }, 5000);
    } catch (error: any) {
      console.error('Submit error:', error);
      toast.error('Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card rounded-2xl p-8 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.1 }}
        >
          <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
        </motion.div>
        <h3 className="text-xl font-bold mb-2">Request Submitted!</h3>
        <p className="text-muted-foreground">
          We'll reach out to <span className="text-primary font-medium">{propFirmName}</span> and 
          notify you at <span className="text-primary font-medium">{userEmail}</span> within 24-72 hours.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
    >
      <Card className="glass-card border-primary/20 overflow-hidden">
        <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Can't Find Your Prop Firm?</h3>
              <p className="text-sm text-muted-foreground">
                Tell us which firm you want and we'll try to get an affiliate partnership!
              </p>
            </div>
          </div>
        </div>
        
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="userName" className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  Your Name
                </Label>
                <Input
                  id="userName"
                  placeholder="John Doe"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="bg-white/5 border-white/10"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="userEmail" className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  Your Email
                </Label>
                <Input
                  id="userEmail"
                  type="email"
                  placeholder="john@example.com"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="bg-white/5 border-white/10"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="propFirmName" className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                Prop Firm Name
              </Label>
              <Input
                id="propFirmName"
                placeholder="e.g., FTMO, MyForexFunds, The5ers..."
                value={propFirmName}
                onChange={(e) => setPropFirmName(e.target.value)}
                className="bg-white/5 border-white/10"
                required
              />
            </div>

            <div className="pt-2">
              <Button 
                type="submit" 
                disabled={isSubmitting || !userName || !userEmail || !propFirmName}
                className="w-full gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Request
                  </>
                )}
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground text-center">
              ⏱️ We typically respond within <span className="text-primary font-medium">24-72 hours</span>
            </p>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default PropFirmRequestForm;
