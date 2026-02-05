import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import SEO from '@/components/common/SEO';

const faqs = [
  {
    category: 'Getting Started',
    questions: [
      {
        q: 'How do I get started with TraderEdge?',
        a: 'Simply create a free account, complete the onboarding questionnaire to set up your trading preferences, and you\'ll immediately have access to our basic features. To unlock premium signals and advanced tools, upgrade to a paid plan.'
      },
      {
        q: 'What trading experience level do I need?',
        a: 'TraderEdge is designed for all experience levels. Beginners can follow our signals directly, while advanced traders can use our analytics and AI tools to enhance their existing strategies.'
      },
      {
        q: 'Do I need a specific broker to use TraderEdge?',
        a: 'No, TraderEdge works with any broker. We provide signals and analysis - you execute trades on your preferred platform. We support MT4, MT5, and most major trading platforms.'
      },
    ]
  },
  {
    category: 'Signals & Trading',
    questions: [
      {
        q: 'How accurate are your trading signals?',
        a: 'Our signals have a historical win rate of approximately 75-85%, depending on market conditions. However, past performance does not guarantee future results. We recommend proper risk management on all trades.'
      },
      {
        q: 'How many signals do you provide daily?',
        a: 'We typically provide 3-8 high-quality signals per day across Forex, Crypto, and Futures markets. We focus on quality over quantity - we only send signals when our AI identifies high-probability setups.'
      },
      {
        q: 'Can I customize which signals I receive?',
        a: 'Yes! You can filter signals by market (Forex, Crypto, Futures), currency pair, timeframe, and confidence level. You can also set notification preferences for different types of signals.'
      },
    ]
  },
  {
    category: 'Prop Firm Features',
    questions: [
      {
        q: 'Which prop firms do you support?',
        a: 'We support all major prop firms including FTMO, Funded Next, MyForexFunds, The5ers, True Forex Funds, and many more. Our rules engine is customizable for any prop firm.'
      },
      {
        q: 'How does the prop firm rules engine work?',
        a: 'Our system automatically tracks your account metrics and alerts you before you approach any rule limits (daily drawdown, max drawdown, etc.). It also filters signals that might violate your specific prop firm\'s rules.'
      },
      {
        q: 'Do you guarantee I will pass my prop firm challenge?',
        a: 'While we provide high-quality signals and comprehensive tools to maximize your chances of success, trading always involves risk and we cannot guarantee specific results. Success depends on proper execution and market conditions.'
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
        q: 'Can I cancel my subscription?',
        a: 'No, all subscriptions are non-cancellable. Once you subscribe, you are committed for the billing period you selected. Please review our plans carefully before purchasing.'
      },
      {
        q: 'Do you offer refunds?',
        a: 'No, we do not offer refunds. Due to the instant access nature of our digital products and trading signals, all sales are final. By subscribing, you acknowledge and accept this policy.'
      },
    ]
  },
  {
    category: 'Technical',
    questions: [
      {
        q: 'Is TraderEdge available on mobile?',
        a: 'Yes! TraderEdge is fully responsive and works on all devices. We\'re also developing native mobile apps for iOS and Android, coming soon.'
      },
      {
        q: 'How do I receive signal notifications?',
        a: 'You can receive notifications via email, browser push notifications, and Telegram (Pro+ plan). Configure your preferences in your account settings.'
      },
      {
        q: 'Is my data secure?',
        a: 'Absolutely. We use bank-level encryption (SSL/TLS) for all data transmission and store sensitive information using industry-standard encryption. We never share your personal data with third parties.'
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

  // Generate FAQ Schema for rich snippets
  const allQuestions = faqs.flatMap(cat => cat.questions);
  const faqSchema = {
    '@type': 'FAQPage',
    mainEntity: allQuestions.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  };

  return (
    <div className="min-h-screen bg-[#020202]">
      <SEO
        title="Frequently Asked Questions | TraderEdge Pro"
        description="Find answers to common questions about TraderEdge Pro trading signals, prop firm features, pricing, and technical support."
        keywords="TraderEdge FAQ, trading signals help, prop firm questions, trading support, funded trading FAQ"
        canonicalUrl="https://traderedgepro.com/faq"
        schema={faqSchema}
      />
      <Header />
      
      {/* Hero */}
      <section className="pt-32 pb-12 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1 
            className="text-4xl md:text-5xl font-bold mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Frequently Asked Questions
          </motion.h1>
          <motion.p 
            className="text-xl text-muted-foreground mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Find answers to common questions about TraderEdge
          </motion.p>

          {/* Search */}
          <motion.div
            className="relative max-w-xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 text-lg"
            />
          </motion.div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto space-y-8">
          {filteredFaqs.map((category, catIndex) => (
            <motion.div
              key={category.category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: catIndex * 0.1 }}
            >
              <h2 className="text-2xl font-semibold mb-4 text-primary">
                {category.category}
              </h2>
              <div className="space-y-3">
                {category.questions.map((item, qIndex) => {
                  const key = `${catIndex}-${qIndex}`;
                  const isOpen = openItems[key];

                  return (
                    <div
                      key={key}
                      className="rounded-xl border border-white/[0.08] overflow-hidden"
                    >
                      <button
                        onClick={() => toggleItem(key)}
                        className="w-full flex items-center justify-between p-5 text-left hover:bg-white/[0.02] transition-colors"
                      >
                        <span className="font-medium pr-4">{item.q}</span>
                        {isOpen ? (
                          <ChevronUp className="w-5 h-5 text-muted-foreground shrink-0" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
                        )}
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-5 text-muted-foreground">
                          {item.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default FAQPage;
