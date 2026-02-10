import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { CheckCircle, Shield, Clock, HelpCircle, Mail, AlertCircle, Sparkles } from 'lucide-react';

const RefundPolicyPage = () => {
  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white overflow-hidden">
      {/* Ambient background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-0 w-[500px] h-[500px] bg-purple-500/8 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[120px]" />
      </div>

      <Header />

      {/* Hero */}
      <section className="relative pt-32 md:pt-40 pb-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300/80 mb-6">
                <Shield className="w-3.5 h-3.5" />
                Customer Protection
              </span>

              <h1 className="text-4xl sm:text-5xl md:text-6xl tracking-tight leading-[1.15] mb-5">
                <span className="font-light text-white/50">Refund</span>{' '}
                <span className="font-semibold italic bg-gradient-to-r from-purple-400 to-purple-200 bg-clip-text text-transparent">Policy</span>
              </h1>

              <p className="text-sm text-white/30 font-light">
                Last updated: February 10, 2026
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 7-Day Guarantee Banner - HIGHLIGHTED */}
      <section className="relative px-6 mb-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-8 md:p-10 rounded-2xl bg-gradient-to-br from-green-500/20 via-emerald-500/10 to-green-500/5 border border-green-500/30 relative overflow-hidden"
          >
            {/* Glow effect */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl" />

            <div className="relative z-10 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-500/20 border border-green-500/30 mb-6">
                <Sparkles className="w-8 h-8 text-green-400" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-green-300 mb-3">
                7-Day Satisfaction Guarantee
              </h2>
              <p className="text-lg text-white/70 max-w-2xl mx-auto mb-6">
                We're confident in the value we provide. If you're not completely satisfied with our services,
                request a full refund within <strong className="text-green-300">7 days</strong> of your purchase.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
                <div className="flex items-center gap-2 text-green-300">
                  <CheckCircle className="w-5 h-5" />
                  <span>No questions asked</span>
                </div>
                <div className="flex items-center gap-2 text-green-300">
                  <CheckCircle className="w-5 h-5" />
                  <span>Full refund</span>
                </div>
                <div className="flex items-center gap-2 text-green-300">
                  <CheckCircle className="w-5 h-5" />
                  <span>Processed within 48 hours</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="relative py-8 md:py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-[200px_1fr] gap-8 md:gap-16">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <span className="text-xs font-medium tracking-[0.2em] uppercase text-white/20">
                Details
              </span>
            </motion.div>

            <div className="max-w-2xl space-y-8">
              {/* How It Works */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="p-6 rounded-xl bg-purple-500/5 border border-purple-500/10"
              >
                <div className="flex items-center gap-3 mb-4">
                  <Clock className="w-5 h-5 text-purple-400" />
                  <h2 className="text-xl font-medium text-white">How the 7-Day Guarantee Works</h2>
                </div>
                <ol className="space-y-4">
                  {[
                    { step: '1', title: 'Subscribe & Explore', desc: 'Sign up for any TraderEdge Pro plan and explore all features.' },
                    { step: '2', title: 'Test Our Services', desc: 'Use our trading signals, AI tools, risk management features, and dashboard for up to 7 days.' },
                    { step: '3', title: 'Not Satisfied?', desc: 'If our services don\'t meet your expectations, contact us within 7 days of purchase.' },
                    { step: '4', title: 'Get Your Refund', desc: 'We\'ll process your full refund within 48 hours. No hassle, no questions.' },
                  ].map((item) => (
                    <li key={item.step} className="flex items-start gap-4">
                      <span className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-300 text-sm font-medium shrink-0">
                        {item.step}
                      </span>
                      <div>
                        <strong className="text-white/80 font-medium">{item.title}</strong>
                        <p className="text-white/40 font-light text-sm mt-1">{item.desc}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </motion.div>

              {/* What's Covered */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="p-6 rounded-xl bg-white/[0.02] border border-white/[0.06]"
              >
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <h2 className="text-xl font-medium text-white">What's Covered Under Our Guarantee</h2>
                </div>
                <ul className="space-y-3">
                  {[
                    'All subscription plans (Starter, Pro, Enterprise)',
                    'First-time purchases',
                    'Renewals within the 7-day window',
                    'Annual subscriptions (prorated if applicable)',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-white/50 font-light">
                      <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>

              {/* Eligibility Requirements */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="p-6 rounded-xl bg-white/[0.02] border border-white/[0.06]"
              >
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="w-5 h-5 text-purple-400" />
                  <h2 className="text-xl font-medium text-white">Eligibility Requirements</h2>
                </div>
                <p className="text-white/40 font-light mb-4">
                  To be eligible for a refund, please ensure:
                </p>
                <ul className="space-y-3">
                  {[
                    'Request is made within 7 days of your purchase date',
                    'This is your first refund request (one per customer)',
                    'You contact us via our official support channels',
                    'Your account is in good standing (no violations)',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-white/40 font-light">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400/60 mt-2 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>

              {/* After 7 Days */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="p-6 rounded-xl bg-amber-500/5 border border-amber-500/10"
              >
                <div className="flex items-center gap-3 mb-4">
                  <AlertCircle className="w-5 h-5 text-amber-400" />
                  <h2 className="text-xl font-medium text-amber-300">After the 7-Day Period</h2>
                </div>
                <p className="text-white/40 font-light mb-4">
                  After the 7-day satisfaction period, refunds may only be considered in cases of:
                </p>
                <ul className="space-y-2">
                  {[
                    'Documented technical issues that prevent service access',
                    'Duplicate charges or billing errors',
                    'Service delivery failures on our end',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-white/40 font-light">
                      <span className="text-amber-400">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="text-white/30 font-light text-sm mt-4">
                  Trading performance or personal dissatisfaction after the 7-day period is not grounds for refund,
                  as you've had ample time to evaluate our services.
                </p>
              </motion.div>

              {/* FAQ */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="p-6 rounded-xl bg-white/[0.02] border border-white/[0.06]"
              >
                <div className="flex items-center gap-3 mb-6">
                  <HelpCircle className="w-5 h-5 text-purple-400" />
                  <h2 className="text-xl font-medium text-white">Frequently Asked Questions</h2>
                </div>
                <div className="space-y-6">
                  {[
                    {
                      q: 'How do I request a refund?',
                      a: 'Simply email support@traderedgepro.com with your account email and "Refund Request" in the subject line. We\'ll process it within 48 hours.'
                    },
                    {
                      q: 'When does the 7-day period start?',
                      a: 'The 7-day period begins from the date of your successful payment, regardless of when you first log in.'
                    },
                    {
                      q: 'Will I lose access immediately after requesting a refund?',
                      a: 'Yes, once your refund is processed, your account will be deactivated. Make sure to export any data you need beforehand.'
                    },
                    {
                      q: 'Can I get a refund and then resubscribe later?',
                      a: 'Yes, you can resubscribe anytime. However, the 7-day guarantee only applies to your first purchase.'
                    },
                  ].map((item, i) => (
                    <div key={i}>
                      <h3 className="font-medium text-white mb-2">{item.q}</h3>
                      <p className="text-white/40 font-light text-sm">{item.a}</p>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* How to Request */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="p-6 rounded-xl bg-green-500/5 border border-green-500/10"
              >
                <div className="flex items-center gap-3 mb-4">
                  <Mail className="w-5 h-5 text-green-400" />
                  <h2 className="text-xl font-medium text-green-300">How to Request a Refund</h2>
                </div>
                <p className="text-white/40 font-light mb-4">
                  Contact our support team within 7 days of your purchase:
                </p>
                <div className="space-y-3">
                  <p className="text-white/50 font-light">
                    <strong className="text-white/70">Email:</strong>{' '}
                    <a href="mailto:support@traderedgepro.com" className="text-purple-400 hover:underline">
                      support@traderedgepro.com
                    </a>
                  </p>
                  <p className="text-white/50 font-light">
                    <strong className="text-white/70">Subject:</strong> Refund Request - [Your Email]
                  </p>
                  <p className="text-white/50 font-light">
                    <strong className="text-white/70">Response Time:</strong> Within 24 hours
                  </p>
                </div>
              </motion.div>

              {/* Final Statement */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center py-8"
              >
                <p className="text-white/40 font-light">
                  By completing your purchase, you acknowledge that you have read and agree to this Refund Policy and our{' '}
                  <Link to="/terms" className="text-purple-400 hover:underline">Terms of Service</Link>.
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default RefundPolicyPage;
