import { useState, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Mail, MessageSquare, Phone, Send, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import Spline from '@splinetool/react-spline';

const contactMethods = [
  {
    icon: Mail,
    title: 'Email Support',
    description: 'Get a response within 24 hours',
    contact: 'support@traderedge.com',
  },
  {
    icon: MessageSquare,
    title: 'Live Chat',
    description: 'Available 24/7 for Pro+ members',
    contact: 'Start a chat',
  },
  {
    icon: Phone,
    title: 'Phone Support',
    description: 'Enterprise members only',
    contact: '+1 (555) 123-4567',
  },
];

const ContactSupportPage = () => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSplineLoaded, setIsSplineLoaded] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    category: '',
    priority: 'medium',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.subject || !formData.category || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      if (user) {
        const { error } = await supabase
          .from('support_tickets')
          .insert({
            user_id: user.id,
            subject: formData.subject,
            category: formData.category,
            priority: formData.priority,
            description: formData.description,
          });

        if (error) throw error;
      }

      toast.success('Support ticket submitted successfully!');
      setFormData({ subject: '', category: '', priority: 'medium', description: '' });
    } catch (error) {
      console.error('Error submitting ticket:', error);
      toast.error('Failed to submit ticket. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020202]">
      <Header />
      
      {/* Hero */}
      <section className="pt-32 pb-12 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <HelpCircle className="w-16 h-16 text-primary mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              How Can We Help?
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Our support team is here to help you succeed. Reach out through any of the channels below.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {contactMethods.map((method, index) => (
              <motion.div
                key={method.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-card/50 border-white/[0.08] text-center h-full">
                  <CardContent className="pt-6">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <method.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-1">{method.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{method.description}</p>
                    <p className="text-primary">{method.contact}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form with Spline - Two column layout */}
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-12 items-start">
            {/* Left side - Support Ticket Form */}
            <div className="w-full lg:w-1/2">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="bg-card/50 border-white/[0.08]">
                  <CardHeader>
                    <CardTitle>Submit a Support Ticket</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="subject">Subject *</Label>
                        <Input
                          id="subject"
                          placeholder="Brief description of your issue"
                          value={formData.subject}
                          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="category">Category *</Label>
                          <Select
                            value={formData.category}
                            onValueChange={(value) => setFormData({ ...formData, category: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="general">General</SelectItem>
                              <SelectItem value="technical">Technical</SelectItem>
                              <SelectItem value="billing">Billing</SelectItem>
                              <SelectItem value="signals">Signals</SelectItem>
                              <SelectItem value="account">Account</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="priority">Priority</Label>
                          <Select
                            value={formData.priority}
                            onValueChange={(value) => setFormData({ ...formData, priority: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="urgent">Urgent</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description">Description *</Label>
                        <Textarea
                          id="description"
                          placeholder="Please describe your issue in detail..."
                          rows={6}
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                      </div>

                      <Button type="submit" className="w-full" disabled={isSubmitting}>
                        <Send className="w-4 h-4 mr-2" />
                        {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Right side - Spline Animation */}
            <div className="w-full lg:w-1/2 h-[500px] lg:h-[600px] relative">
              <motion.div
                className="sticky top-24 w-full h-full relative rounded-2xl overflow-hidden"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Suspense fallback={<div className="w-full h-full bg-muted/10 rounded-2xl animate-pulse" />}>
                  <div className={`w-full h-full transition-opacity duration-1000 ${isSplineLoaded ? 'opacity-100' : 'opacity-0'}`}>
                    <Spline
                      scene="https://prod.spline.design/SdRpWyjoLSQGKVXs/scene.splinecode"
                      onLoad={() => setIsSplineLoaded(true)}
                    />
                  </div>
                </Suspense>
                {!isSplineLoaded && (
                  <div className="absolute inset-0 bg-gradient-radial from-primary/5 via-transparent to-transparent rounded-2xl" />
                )}
                {/* Brand badge covering Spline watermark (bottom-right) */}
                <div className="absolute bottom-0 right-0 z-50 flex flex-col justify-center bg-background pointer-events-none w-[220px] h-[84px] sm:w-[260px] sm:h-[96px] px-6 py-4 sm:px-7 sm:py-5 rounded-tl-3xl">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                      <HelpCircle className="w-3 h-3 text-primary" />
                    </div>
                    <span className="text-sm text-muted-foreground font-medium">Support</span>
                  </div>
                  <span className="text-xs text-muted-foreground/60 pl-7">Response within 24 hours</span>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ContactSupportPage;
