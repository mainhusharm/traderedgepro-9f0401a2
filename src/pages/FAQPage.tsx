import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronDown, MessageCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import SEO from '@/components/common/SEO';

const faqs = [
  {
    category: 'Getting Started',
    questions: [
      {
        q: 'What exactly is TraderEdge Pro?',
        a: 'TraderEdge Pro is a performance system for funded traders — not just a signals service. We combine AI-powered decision support, risk enforcement, psychology frameworks, and prop firm rule compliance into one platform.'
      },
      {
        q: 'What trading experience level do I need?',
        a: 'TraderEdge Pro is designed for traders who already understand the basics but struggle with consistency and discipline. If you keep blowing challenges due to emotional decisions — this system is built for you.'
      },
      {
        q: 'Do I need a specific broker?',
        a: 'No, TraderEdge works with any broker. We provide signals and analysis - you execute trades on your preferred platform. We support MT4, MT5, and most major trading platforms.'
      },
    ]
  },
  {
    category: 'Signals & Performance',
    questions: [
      {
        q: 'What kind of results can I expect?',
        a: 'Results vary based on your execution and discipline. What we guarantee is a structured system that enforces risk management, prevents emotional trading, and keeps you compliant with prop firm rules.'
      },
      {
        q: 'How many signals do you provide daily?',
        a: 'We typically provide 3-8 high-quality signals per day across Forex and Gold markets. We focus on quality over quantity.'
      },
      {
        q: 'Why do most traders fail prop challenges?',
        a: 'Most traders fail because of overtrading after a loss, increasing lot size emotionally, or breaking rules under pressure. TraderEdge Pro is built specifically to prevent these behavioral mistakes.'
      },
    ]
  },
  {
    category: 'Billing & Subscription',
    questions: [
      {
        q: 'What payment methods do you accept?',
        a: 'We accept all major credit cards, PayPal, and cryptocurrency payments (ETH, SOL, USDT). All payments are processed securely.'
      },
      {
        q: 'Do you offer a free trial?',
        a: 'Yes! We offer a 7-day free trial so you can experience the full platform before committing. You can cancel anytime during the trial with no charge.'
      },
      {
        q: 'What is your refund policy?',
        a: 'We offer a 7-day free trial so you can fully evaluate the platform before purchasing. If you\'re not seeing value, reach out to our support team.'
      },
    ]
  },
];

const FAQPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const toggleItem = (key: string) => {
    setOpenItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const filteredFaqs = faqs.map(category => ({
    ...category,
    questions: category.questions.filter(
      q => q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
           q.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  const allQuestions = faqs.flatMap(cat => cat.questions);
  const faqSchema = {
    '@type': 'FAQPage',
    mainEntity: allQuestions.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white overflow-hidden">
      {/* Ambient background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-purple-500/8 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/3 left-0 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[120px]" />
      </div>

      <SEO
        title="Frequently Asked Questions | TraderEdge Pro"
        description="Find answers to common questions about TraderEdge Pro trading signals, prop firm features, pricing, and technical support."
        keywords="TraderEdge FAQ, trading signals help, prop firm questions"
        canonicalUrl="https://traderedgepro.com/faq"
        schema={faqSchema}
      />
      <Header />

      {/* Hero - Left aligned */}
      <section className="relative pt-32 md:pt-40 pb-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-[1fr_300px] gap-8 items-end">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300/80 mb-6">
                <MessageCircle className="w-3.5 h-3.5" />
                Support
              </span>

              <h1 className="text-4xl sm:text-5xl md:text-6xl tracking-tight leading-[1.15] mb-5">
                <span className="font-light text-white/50">Got</span>{' '}
                <span className="font-semibold italic bg-gradient-to-r from-purple-400 to-purple-200 bg-clip-text text-transparent">questions?</span>
                <br />
                <span className="font-light text-white/50">We have</span>{' '}
                <span className="font-semibold italic bg-gradient-to-r from-purple-400 to-purple-200 bg-clip-text text-transparent">answers.</span>
              </h1>

              <p className="text-base text-white/40 max-w-md leading-relaxed font-light">
                Everything you need to know about TraderEdge Pro.
              </p>
            </motion.div>

            {/* Search */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="relative"
            >
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 text-sm bg-white/[0.03] border-white/[0.08] rounded-lg focus:border-purple-500/30 focus:bg-white/[0.05] focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-white/30 transition-all duration-300 font-light"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Content - Two column layout */}
      <section className="relative py-12 md:py-16 px-6">
        <div className="max-w-6xl mx-auto">
          {filteredFaqs.map((category, catIndex) => (
            <motion.div
              key={category.category}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: catIndex * 0.1, duration: 0.5 }}
              className="grid md:grid-cols-[200px_1fr] gap-6 md:gap-16 mb-12 last:mb-0"
            >
              <div>
                <h2 className="text-xs font-medium tracking-[0.2em] uppercase text-white/20 md:pt-5">
                  {category.category}
                </h2>
              </div>

              <div className="space-y-2">
                {category.questions.map((item, qIndex) => {
                  const key = `${catIndex}-${qIndex}`;
                  const isOpen = openItems[key];

                  return (
                    <div
                      key={key}
                      className={`rounded-lg border transition-all duration-300 ${
                        isOpen
                          ? 'bg-white/[0.04] border-purple-500/20'
                          : 'bg-white/[0.02] border-white/[0.05] hover:border-white/10'
                      }`}
                    >
                      <button
                        onClick={() => toggleItem(key)}
                        className="w-full flex items-center justify-between p-4 text-left"
                      >
                        <span className={`text-sm pr-4 transition-colors ${
                          isOpen ? 'text-white font-medium' : 'text-white/60'
                        }`}>
                          {item.q}
                        </span>
                        <motion.div
                          className="shrink-0"
                          animate={{ rotate: isOpen ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown className={`w-4 h-4 transition-colors ${
                            isOpen ? 'text-purple-400' : 'text-white/20'
                          }`} />
                        </motion.div>
                      </button>

                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                            className="overflow-hidden"
                          >
                            <p className="px-4 pb-4 text-sm text-white/40 leading-relaxed font-light">
                              {item.a}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA - Compact inline */}
      <section className="relative py-16 md:py-20 px-6 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-6"
          >
            <div>
              <h2 className="text-xl md:text-2xl tracking-tight mb-1">
                <span className="font-light text-white/50">Still have</span>{' '}
                <span className="font-semibold italic bg-gradient-to-r from-purple-400 to-purple-200 bg-clip-text text-transparent">questions?</span>
              </h2>
              <p className="text-sm text-white/30 font-light">
                Our support team is here to help.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                asChild
                variant="outline"
                className="rounded-full px-6 bg-transparent border-white/10 hover:border-purple-500/30 hover:bg-white/5 text-white text-sm font-normal"
              >
                <Link to="/contact">Contact Support</Link>
              </Button>
              <Button
                asChild
                className="rounded-full px-6 bg-purple-500 hover:bg-purple-400 text-white text-sm font-medium"
              >
                <Link to="/membership">View Plans</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default FAQPage;
