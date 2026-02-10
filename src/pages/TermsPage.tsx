import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { FileText, AlertTriangle, Shield, CheckCircle, Activity, Scale, Clock, Sparkles } from 'lucide-react';

const TermsPage = () => {
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
                <FileText className="w-3.5 h-3.5" />
                Legal
              </span>

              <h1 className="text-4xl sm:text-5xl md:text-6xl tracking-tight leading-[1.15] mb-5">
                <span className="font-light text-white/50">Terms of</span>{' '}
                <span className="font-semibold italic bg-gradient-to-r from-purple-400 to-purple-200 bg-clip-text text-transparent">Service</span>
              </h1>

              <p className="text-sm text-white/30 font-light">
                Last updated: February 10, 2026
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 7-Day Guarantee Notice */}
      <section className="relative px-6 mb-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 rounded-xl bg-green-500/10 border border-green-500/20"
          >
            <div className="flex items-start gap-4">
              <Sparkles className="w-6 h-6 text-green-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-green-300 mb-2">7-Day Satisfaction Guarantee</h3>
                <p className="text-green-200/70 text-sm font-light">
                  We offer a <strong>7-day satisfaction guarantee</strong> on all subscriptions.
                  If you're not happy with our services, request a full refund within 7 days of purchase.
                </p>
                <Link to="/refund-policy" className="text-green-400 text-sm mt-2 inline-block hover:underline">
                  Read our full Refund Policy →
                </Link>
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
                Terms
              </span>
            </motion.div>

            <div className="max-w-2xl space-y-10">
              {/* Section 1 */}
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div className="flex items-center gap-3 mb-4">
                  <FileText className="w-5 h-5 text-purple-400" />
                  <h2 className="text-xl font-medium text-white">1. Acceptance of Terms</h2>
                </div>
                <p className="text-white/40 leading-relaxed font-light">
                  By accessing or using TraderEdge Pro ("the Service"), you agree to be bound by these Terms of Service.
                  If you do not agree to these terms, please do not use our Service.
                </p>
              </motion.div>

              {/* Section 2 - Our Services */}
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="w-5 h-5 text-purple-400" />
                  <h2 className="text-xl font-medium text-white">2. Our Services</h2>
                </div>
                <p className="text-white/40 leading-relaxed font-light mb-4">
                  TraderEdge Pro provides the following <strong className="text-white/60">digital trading services</strong>:
                </p>
                <div className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <ul className="space-y-3">
                    {[
                      { service: 'Trading Signals', desc: 'Real-time buy/sell signals delivered through our dashboard with entry, stop-loss, and take-profit levels' },
                      { service: 'AI Trading Coach (Nexus)', desc: 'Personalized AI-powered trading guidance and strategy recommendations' },
                      { service: 'Risk Management Tools', desc: 'Position sizing calculator, drawdown alerts, and risk protocol builder' },
                      { service: 'Analytics Dashboard', desc: 'Performance tracking, equity curves, session heatmaps, and trade journal' },
                      { service: 'Prop Firm Tools', desc: 'Challenge tracking, firm analyzers, and phase monitoring' },
                      { service: 'Educational Content', desc: 'Market analysis, trading strategies, and weekly live trading rooms' },
                      { service: 'Community Access', desc: 'Private community, expert guidance sessions, and support' },
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
                        <div>
                          <strong className="text-white/60 font-medium">{item.service}:</strong>{' '}
                          <span className="text-white/40 font-light">{item.desc}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>

              {/* Section 3 - Refund Policy */}
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div className="p-6 rounded-xl bg-green-500/10 border border-green-500/20">
                  <div className="flex items-center gap-3 mb-4">
                    <Sparkles className="w-5 h-5 text-green-400" />
                    <h2 className="text-xl font-medium text-green-300">3. Refund Policy</h2>
                  </div>

                  <h3 className="text-white/80 font-medium mb-3">7-Day Satisfaction Guarantee</h3>
                  <p className="text-white/50 font-light mb-4">
                    We offer a <strong className="text-green-300">7-day satisfaction guarantee</strong> on all subscription plans.
                    If you're not satisfied with our services for any reason, you may request a full refund within 7 days of your purchase date.
                  </p>

                  <h3 className="text-white/80 font-medium mb-3 mt-6">Refunds After 7 Days</h3>
                  <p className="text-white/50 font-light mb-4">
                    After the 7-day period, refunds are only available if there is a <strong className="text-white/70">valid problem with our services</strong>.
                    Valid problems include:
                  </p>
                  <ul className="space-y-2 mb-4">
                    {[
                      'Technical issues preventing access to the dashboard or signals',
                      'Signal delivery failures (signals not appearing in your account)',
                      'AI Trading Coach (Nexus) not responding or unavailable',
                      'Analytics tools not loading or displaying incorrect data',
                      'Account access issues caused by our systems',
                      'Duplicate charges or billing errors',
                      'Features advertised in your plan not available',
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-white/40 font-light">
                        <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>

                  <h3 className="text-white/80 font-medium mb-3 mt-6">Not Eligible for Refund After 7 Days</h3>
                  <ul className="space-y-2">
                    {[
                      'Trading losses or signals that didn\'t perform as expected',
                      'Personal change of mind or no longer wanting the service',
                      'Not using the service or forgetting about your subscription',
                      'Dissatisfaction with trading results',
                      'Issues caused by your broker or trading platform',
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-white/40 font-light">
                        <span className="text-amber-400 mt-0.5">✗</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>

              {/* Section 4 - Disputes */}
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div className="p-6 rounded-xl bg-amber-500/5 border border-amber-500/10">
                  <div className="flex items-center gap-3 mb-4">
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                    <h2 className="text-xl font-medium text-amber-300">4. Dispute Resolution</h2>
                  </div>
                  <p className="text-white/50 font-light mb-4">
                    Before filing any payment dispute, please contact our support team first. We're committed to resolving
                    any legitimate issues quickly and fairly.
                  </p>
                  <p className="text-white/40 font-light">
                    Filing a chargeback without first contacting support may result in account suspension.
                    We maintain comprehensive service delivery records to protect against fraudulent disputes.
                  </p>
                </div>
              </motion.div>

              {/* Section 5 - Activity Tracking */}
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div className="flex items-center gap-3 mb-4">
                  <Activity className="w-5 h-5 text-purple-400" />
                  <h2 className="text-xl font-medium text-white">5. Service Delivery Records</h2>
                </div>
                <p className="text-white/40 leading-relaxed font-light mb-4">
                  To ensure quality service and handle refund requests fairly, we maintain records of:
                </p>
                <ul className="space-y-2">
                  {[
                    'All trading signals delivered to your account',
                    'Dashboard access and feature usage',
                    'AI coach interactions and recommendations',
                    'Support ticket history and resolutions',
                    'Subscription and payment history',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-white/40 font-light">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400/60 mt-2 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>

              {/* Section 6 - Billing */}
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div className="flex items-center gap-3 mb-4">
                  <Clock className="w-5 h-5 text-purple-400" />
                  <h2 className="text-xl font-medium text-white">6. Subscription & Billing</h2>
                </div>
                <ul className="space-y-2">
                  {[
                    'Subscriptions auto-renew unless cancelled before the renewal date',
                    'You may cancel future renewals at any time from your profile',
                    'Access continues until the end of your current billing period',
                    'Refunds for cancellations are subject to our refund policy above',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-white/40 font-light">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400/60 mt-2 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>

              {/* Section 7 - Risk Disclaimer */}
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div className="flex items-center gap-3 mb-4">
                  <Scale className="w-5 h-5 text-purple-400" />
                  <h2 className="text-xl font-medium text-white">7. Risk Disclaimer</h2>
                </div>
                <p className="text-white/40 leading-relaxed font-light">
                  Trading forex, futures, and CFDs involves substantial risk of loss and is not suitable for all investors.
                  Our signals and tools are for informational purposes only and should not be considered financial advice.
                  Past performance does not guarantee future results. You are solely responsible for your trading decisions
                  and any resulting profits or losses.
                </p>
              </motion.div>

              {/* Contact */}
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <h2 className="text-xl font-medium text-white mb-4">8. Contact Information</h2>
                <p className="text-white/40 font-light">
                  <strong className="text-white/60">Support:</strong>{' '}
                  <a href="mailto:support@traderedgepro.com" className="text-purple-400 hover:underline">support@traderedgepro.com</a>
                </p>
                <p className="text-white/40 font-light mt-2">
                  <strong className="text-white/60">Refund Requests:</strong>{' '}
                  <a href="mailto:support@traderedgepro.com" className="text-purple-400 hover:underline">support@traderedgepro.com</a>
                  {' '}(Subject: Refund Request)
                </p>
              </motion.div>

              {/* Acknowledgment */}
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div className="p-6 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <h3 className="font-medium text-white mb-4">By Using TraderEdge Pro, You Acknowledge:</h3>
                  <ul className="space-y-2">
                    {[
                      'You have read and understood these Terms of Service',
                      'You understand our 7-day satisfaction guarantee policy',
                      'You accept that refunds after 7 days require valid service issues',
                      'Trading involves risk and results are not guaranteed',
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-white/50 font-light">
                        <span className="text-purple-400">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
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

export default TermsPage;
