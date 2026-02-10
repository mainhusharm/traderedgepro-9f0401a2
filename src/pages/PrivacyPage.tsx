import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const sections = [
  {
    title: '1. Information We Collect',
    content: 'We collect information you provide directly:',
    list: [
      'Account information (name, email, password)',
      'Profile information (country, timezone, trading preferences)',
      'Payment information (processed securely via Stripe)',
      'Trading data (journal entries, performance metrics)',
      'Communications (support tickets, feedback)',
    ],
  },
  {
    title: '2. How We Use Your Information',
    list: [
      'Provide and improve our services',
      'Send trading signals and notifications',
      'Process payments and subscriptions',
      'Personalize your experience',
      'Provide customer support',
      'Send marketing communications (with your consent)',
    ],
  },
  {
    title: '3. Data Security',
    content: 'We implement industry-standard security measures to protect your data, including:',
    list: [
      'SSL/TLS encryption for all data in transit',
      'Encrypted storage for sensitive data',
      'Regular security audits and penetration testing',
      'Strict access controls for our team members',
    ],
  },
  {
    title: '4. Data Sharing',
    content: 'We do not sell your personal information. We may share data with:',
    list: [
      'Payment processors (Stripe, PayPal) for transactions',
      'Email service providers for communications',
      'Analytics providers (anonymized data only)',
      'Law enforcement when legally required',
    ],
  },
  {
    title: '5. Your Rights',
    content: 'You have the right to:',
    list: [
      'Access your personal data',
      'Request correction of inaccurate data',
      'Request deletion of your data',
      'Export your data in a portable format',
      'Opt-out of marketing communications',
      'Withdraw consent at any time',
    ],
  },
  {
    title: '6. Cookies',
    content: 'We use cookies and similar technologies to remember your preferences, analyze traffic, and improve your experience. You can control cookie settings in your browser.',
  },
  {
    title: '7. Data Retention',
    content: 'We retain your data for as long as your account is active or as needed to provide services. Upon account deletion, we remove personal data within 30 days, except where retention is required by law.',
  },
  {
    title: '8. Children\'s Privacy',
    content: 'Our Service is not intended for users under 18. We do not knowingly collect information from children.',
  },
  {
    title: '9. Contact Us',
    content: 'For privacy-related inquiries, contact our Data Protection Officer at privacy@traderedge.com',
  },
];

const PrivacyPage = () => {
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
                Legal
              </span>

              <h1 className="text-4xl sm:text-5xl md:text-6xl tracking-tight leading-[1.15] mb-5">
                <span className="font-light text-white/50">Privacy</span>{' '}
                <span className="font-semibold italic bg-gradient-to-r from-purple-400 to-purple-200 bg-clip-text text-transparent">Policy</span>
              </h1>

              <p className="text-sm text-white/30 font-light">
                Last updated: January 7, 2026
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="relative py-12 md:py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-[200px_1fr] gap-8 md:gap-16">
            <div />
            <div className="max-w-2xl space-y-10">
              {sections.map((section, index) => (
                <motion.div
                  key={section.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05, duration: 0.4 }}
                >
                  <h2 className="text-xl font-medium text-white mb-4">{section.title}</h2>
                  {section.content && (
                    <p className="text-white/40 leading-relaxed font-light mb-4">{section.content}</p>
                  )}
                  {section.list && (
                    <ul className="space-y-2">
                      {section.list.map((item, i) => (
                        <li key={i} className="flex items-start gap-3 text-white/40 font-light">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-400/60 mt-2 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PrivacyPage;
