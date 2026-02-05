import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle, Shield, CreditCard, Settings, type LucideIcon } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

interface FAQItem {
  category: string;
  icon: LucideIcon;
  color: string;
  question: string;
  answer: string;
}

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs: FAQItem[] = [
    {
      category: 'Product',
      icon: HelpCircle,
      color: 'text-blue-400',
      question: 'Is this an EA or Signal service?',
      answer: 'TraderEdge Pro is a signal service powered by AI. Unlike EAs, our signals don\'t auto-trade—you receive recommendations with full AI reasoning, and you decide whether to execute. This keeps you in full control while leveraging our advanced market analysis.',
    },
    {
      category: 'Compliance',
      icon: Shield,
      color: 'text-emerald-400',
      question: 'Does this violate Prop Firm rules?',
      answer: 'No. TraderEdge Pro is 100% compliant with all major prop firm rules. You\'re manually executing trades based on our signals—there\'s no account sharing, pass-your-challenge services, or automated trading that could violate terms. We\'re verified compatible with FTMO, Funding Pips, E8, and more.',
    },
    {
      category: 'Requirements',
      icon: Settings,
      color: 'text-purple-400',
      question: 'What\'s the minimum account size?',
      answer: 'Our signals work with any account size. Whether you\'re trading a $5,000 challenge or a $200,000 funded account, our AI calculates optimal position sizes based on your specific risk parameters. The risk calculator ensures you never exceed your prop firm\'s limits.',
    },
    {
      category: 'Billing',
      icon: CreditCard,
      color: 'text-amber-400',
      question: 'What is your cancellation and refund policy?',
      answer: 'All sales are final. Due to the nature of digital products and instant access to premium trading signals, we do not offer cancellations or refunds. Please review our plans carefully before subscribing.',
    },
    {
      category: 'Product',
      icon: HelpCircle,
      color: 'text-blue-400',
      question: 'How are signals delivered?',
      answer: 'Signals are delivered instantly via our web dashboard, mobile app, email, and push notifications. Each signal includes entry price, stop loss, take profit, confidence score, and complete AI reasoning explaining why the trade was recommended.',
    },
    {
      category: 'Compliance',
      icon: Shield,
      color: 'text-emerald-400',
      question: 'What\'s your win rate?',
      answer: 'Our verified win rate is 87% across all signals over the past 12 months. However, results vary based on execution timing and which signals you choose to take. We provide full transparency with our public track record and performance analytics.',
    },
  ];

  // Generate FAQ Schema for SEO
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <section id="faq" className="py-32 relative">
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>
      <div className="container mx-auto px-6">
        {/* Centered layout */}
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-primary text-sm font-semibold tracking-wider uppercase mb-4 block">
              FAQ
            </span>
            <h2 className="text-4xl md:text-5xl font-bold gradient-text mb-6">
              Frequently Asked Questions
            </h2>
            <p className="text-muted-foreground text-lg">
              Everything you need to know about TraderEdge Pro.
            </p>
          </motion.div>

          <div>
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                className="mb-4"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <button
                  className={`w-full glass-card p-6 text-left transition-all ${
                    openIndex === index ? 'ring-1 ring-primary/30' : ''
                  }`}
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0`}>
                        <faq.icon className={`w-5 h-5 ${faq.color}`} />
                      </div>
                      <div>
                        <span className={`text-xs font-medium ${faq.color} block mb-1`}>{faq.category}</span>
                        <h3 className="text-lg font-semibold text-foreground">{faq.question}</h3>
                      </div>
                    </div>
                    <motion.div
                      animate={{ rotate: openIndex === index ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="shrink-0 mt-1"
                    >
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    </motion.div>
                  </div>

                  <AnimatePresence>
                    {openIndex === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <p className="text-muted-foreground mt-4 pl-14 leading-relaxed">
                          {faq.answer}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              </motion.div>
            ))}
          </div>

          {/* Support CTA */}
          <motion.div
            className="text-center mt-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <p className="text-muted-foreground mb-4">Still have questions?</p>
            <a 
              href="#" 
              className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
            >
              Contact our support team
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;