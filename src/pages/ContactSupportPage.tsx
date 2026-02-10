import { useState, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Mail, MessageSquare, Send, ArrowRight, Sparkles, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import Spline from '@splinetool/react-spline';
import { Link } from 'react-router-dom';

const contactMethods = [
  {
    icon: Mail,
    title: 'Email Support',
    description: 'Response within 24 hours',
    contact: 'support@traderedgepro.com',
  },
  {
    icon: MessageSquare,
    title: 'Live Chat',
    description: 'Available 24/7 for Pro+',
    contact: 'Start a chat',
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
    <div className="min-h-screen bg-[#0A0A0B] text-white overflow-hidden">
      {/* Ambient background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-0 w-[500px] h-[500px] bg-purple-500/8 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[120px]" />
      </div>

      <Header />

      {/* Hero */}
      <section className="relative pt-32 md:pt-40 pb-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300/80 mb-6">
                <HelpCircle className="w-3.5 h-3.5" />
                Support
              </span>

              <h1 className="text-4xl sm:text-5xl md:text-6xl tracking-tight leading-[1.15] mb-5">
                <span className="font-light text-white/50">We're here to</span>{' '}
                <span className="font-semibold italic bg-gradient-to-r from-purple-400 to-purple-200 bg-clip-text text-transparent">help.</span>
              </h1>

              <p className="text-base md:text-lg text-white/40 max-w-xl leading-relaxed font-light">
                Our support team is dedicated to helping you succeed.
                Reach out through any channel.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="relative py-8 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-4">
            {contactMethods.map((method, index) => (
              <motion.div
                key={method.title}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.08 }}
                className="p-6 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-purple-500/20 transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
                  <method.icon className="w-5 h-5 text-purple-400/80" />
                </div>
                <h3 className="text-lg font-medium mb-1">{method.title}</h3>
                <p className="text-sm text-white/30 font-light mb-2">{method.description}</p>
                <p className="text-purple-300 font-medium text-sm">{method.contact}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className="relative py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="p-6 md:p-8 rounded-xl bg-white/[0.02] border border-white/[0.05]"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                  <Send className="w-5 h-5 text-purple-400" />
                </div>
                <span className="font-medium text-white">Submit a Ticket</span>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="subject" className="text-sm text-white/40">Subject *</Label>
                  <Input
                    id="subject"
                    placeholder="Brief description of your issue"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="h-11 bg-white/[0.03] border-white/[0.08] rounded-lg focus:border-purple-500/30 focus:bg-white/[0.05] focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-white/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-sm text-white/40">Category *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger className="h-11 bg-white/[0.03] border-white/[0.08] rounded-lg">
                        <SelectValue placeholder="Select" />
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
                    <Label htmlFor="priority" className="text-sm text-white/40">Priority</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) => setFormData({ ...formData, priority: value })}
                    >
                      <SelectTrigger className="h-11 bg-white/[0.03] border-white/[0.08] rounded-lg">
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
                  <Label htmlFor="description" className="text-sm text-white/40">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Please describe your issue in detail..."
                    rows={5}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="bg-white/[0.03] border-white/[0.08] rounded-lg focus:border-purple-500/30 focus:bg-white/[0.05] focus-visible:ring-0 focus-visible:ring-offset-0 resize-none placeholder:text-white/20"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 rounded-lg bg-purple-500 hover:bg-purple-400 font-medium"
                >
                  {isSubmitting ? (
                    'Submitting...'
                  ) : (
                    <>
                      Submit Ticket
                      <Send className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>
            </motion.div>

            {/* Spline */}
            <motion.div
              className="hidden lg:block h-[480px] relative rounded-xl overflow-hidden bg-white/[0.02] border border-white/[0.05]"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Suspense fallback={<div className="w-full h-full bg-white/[0.02] animate-pulse" />}>
                <div className={`w-full h-full transition-opacity duration-1000 ${isSplineLoaded ? 'opacity-100' : 'opacity-0'}`}>
                  <Spline
                    scene="https://prod.spline.design/SdRpWyjoLSQGKVXs/scene.splinecode"
                    onLoad={() => setIsSplineLoaded(true)}
                  />
                </div>
              </Suspense>
              {/* Cover watermark */}
              <div className="absolute bottom-0 right-0 z-50 bg-[#0A0A0B] w-[220px] h-[84px] rounded-tl-xl flex items-center justify-center">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                  </div>
                  <span className="text-xs text-white/30">Response within 24h</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-6 md:p-8 rounded-xl bg-white/[0.02] border border-white/[0.05]"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <h2 className="text-xl font-medium mb-1">
                  <span className="font-light text-white/50">Need immediate</span>{' '}
                  <span className="font-semibold italic bg-gradient-to-r from-purple-400 to-purple-200 bg-clip-text text-transparent">help?</span>
                </h2>
                <p className="text-sm text-white/30 font-light">
                  Check our FAQ for quick answers to common questions.
                </p>
              </div>
              <Button asChild className="rounded-full px-6 bg-purple-500 hover:bg-purple-400 text-white font-medium shrink-0">
                <Link to="/faq">
                  View FAQ
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ContactSupportPage;
