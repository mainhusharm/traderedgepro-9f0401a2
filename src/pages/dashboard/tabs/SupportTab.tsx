import { useState } from 'react';
import { motion } from 'framer-motion';
import { HelpCircle, MessageCircle, Book, Video, Send, ChevronDown, Mail, Phone, Crown, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePlanFeatures } from '@/lib/hooks/usePlanFeatures';
import FeatureGate from '@/components/dashboard/FeatureGate';
import WhiteGloveSupport from '@/components/dashboard/WhiteGloveSupport';
import DedicatedAccountManager from '@/components/dashboard/DedicatedAccountManager';
import StrategyCustomization from '@/components/dashboard/StrategyCustomization';

const SupportTab = () => {
  const features = usePlanFeatures();
  const [ticketForm, setTicketForm] = useState({
    subject: '',
    category: 'general',
    priority: 'medium',
    description: ''
  });

  const faqs = [
    {
      question: 'How do I connect my prop firm account?',
      answer: 'Go to the Settings tab, select "Prop Firm Integration", and follow the setup wizard for your specific prop firm.'
    },
    {
      question: 'What is the signal confidence score?',
      answer: 'The confidence score (0-100%) indicates how strongly our AI recommends the trade based on multiple technical and fundamental factors.'
    },
    {
      question: 'How does the risk calculator work?',
      answer: 'Enter your account size and risk per trade. The calculator automatically determines the optimal lot size based on your stop loss.'
    },
    {
      question: 'Can I use TraderEdge Pro on multiple devices?',
      answer: 'Yes! Your account syncs across all devices. Simply log in with your credentials on any device.'
    }
  ];

  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const handleSubmitTicket = () => {
    // In production, this would send to support API
    console.log('Ticket submitted:', ticketForm);
    setTicketForm({ subject: '', category: 'general', priority: 'medium', description: '' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <HelpCircle className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Support Center</h2>
          <p className="text-sm text-muted-foreground">Get help with your account and trading</p>
        </div>
      </div>

      {/* Enterprise Features Section - Show for Pro/Enterprise */}
      {(features.whiteGloveSupport || features.dedicatedAccountManager || features.strategyCustomization) && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* White-Glove Support - Enterprise Only */}
          {features.whiteGloveSupport && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <WhiteGloveSupport />
            </motion.div>
          )}

          {/* Dedicated Account Manager - Enterprise Only */}
          {features.dedicatedAccountManager && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <DedicatedAccountManager />
            </motion.div>
          )}

          {/* Strategy Customization - Pro/Enterprise */}
          {features.strategyCustomization && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-2"
            >
              <StrategyCustomization />
            </motion.div>
          )}
        </div>
      )}

      {/* Show upgrade prompts for non-premium users */}
      {!features.whiteGloveSupport && (
        <FeatureGate feature="whiteGloveSupport" requiredPlan="enterprise">
          <div />
        </FeatureGate>
      )}

      {/* Quick Help */}
      <div className="grid md:grid-cols-3 gap-4">
        <motion.a
          href="#"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 rounded-xl hover:bg-white/5 transition-colors"
        >
          <MessageCircle className="w-8 h-8 text-primary mb-3" />
          <h3 className="font-semibold mb-1">Live Chat</h3>
          <p className="text-sm text-muted-foreground">Chat with our support team</p>
        </motion.a>

        <motion.a
          href="#"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6 rounded-xl hover:bg-white/5 transition-colors"
        >
          <Book className="w-8 h-8 text-success mb-3" />
          <h3 className="font-semibold mb-1">Documentation</h3>
          <p className="text-sm text-muted-foreground">Browse guides and tutorials</p>
        </motion.a>

        <motion.a
          href="#"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6 rounded-xl hover:bg-white/5 transition-colors"
        >
          <Video className="w-8 h-8 text-accent mb-3" />
          <h3 className="font-semibold mb-1">Video Tutorials</h3>
          <p className="text-sm text-muted-foreground">Watch step-by-step guides</p>
        </motion.a>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6 rounded-xl"
        >
          <h3 className="text-lg font-semibold mb-4">Frequently Asked Questions</h3>
          
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div key={index} className="border-b border-white/[0.05] last:border-0 pb-3 last:pb-0">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  className="w-full flex items-center justify-between text-left py-2"
                >
                  <span className="font-medium pr-4">{faq.question}</span>
                  <ChevronDown className={`w-5 h-5 text-muted-foreground shrink-0 transition-transform ${
                    expandedFaq === index ? 'rotate-180' : ''
                  }`} />
                </button>
                {expandedFaq === index && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="text-sm text-muted-foreground pb-2"
                  >
                    {faq.answer}
                  </motion.p>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Submit Ticket */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6 rounded-xl"
        >
          <h3 className="text-lg font-semibold mb-4">Submit a Ticket</h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input
                value={ticketForm.subject}
                onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                placeholder="Brief description of your issue"
                className="bg-white/5 border-white/10"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <select
                  value={ticketForm.category}
                  onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10"
                >
                  <option value="general">General</option>
                  <option value="technical">Technical</option>
                  <option value="billing">Billing</option>
                  <option value="signals">Signals</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Priority</Label>
                <select
                  value={ticketForm.priority}
                  onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <textarea
                value={ticketForm.description}
                onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                placeholder="Please describe your issue in detail..."
                className="w-full h-32 px-3 py-2 rounded-lg bg-white/5 border border-white/10 resize-none"
              />
            </div>

            <Button onClick={handleSubmitTicket} className="w-full btn-glow">
              <Send className="w-4 h-4 mr-2" />
              Submit Ticket
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Contact Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-card p-6 rounded-xl"
      >
        <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Mail className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email Support</p>
              <p className="font-semibold">support@traderedgepro.com</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
              <Phone className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Response Time</p>
              <p className="font-semibold">
                {features.whiteGloveSupport ? '1-6 hours (Priority)' : 'Within 24 hours'}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SupportTab;
