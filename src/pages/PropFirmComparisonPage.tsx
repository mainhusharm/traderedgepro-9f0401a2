import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Check, Star, ArrowRight, ArrowUpRight, Sparkles, Shield } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import SEO from '@/components/common/SEO';
import { useState } from 'react';

const propFirms = [
  {
    name: 'FTMO',
    rating: 4.8,
    profitTarget: '10% / 5%',
    maxDrawdown: '10%',
    dailyDrawdown: '5%',
    profitSplit: '80-90%',
    price: 'From $155',
    features: ['Industry veteran', 'Scaling to $2M', 'Performance coach'],
    recommended: true,
  },
  {
    name: 'FundedNext',
    rating: 4.7,
    profitTarget: '10% / 5%',
    maxDrawdown: '10%',
    dailyDrawdown: '5%',
    profitSplit: '80-95%',
    price: 'From $32',
    features: ['Up to 95% split', 'Scale to $4M', '24hr payouts'],
    recommended: false,
  },
  {
    name: 'Topstep',
    rating: 4.8,
    profitTarget: '$3K-$9K',
    maxDrawdown: '$2K-$4.5K',
    dailyDrawdown: '$1K-$3K',
    profitSplit: '90-100%',
    price: 'From $165/mo',
    features: ['Futures specialist', '100% first $10K', 'US regulated'],
    recommended: false,
  },
  {
    name: 'Apex Trader Funding',
    rating: 4.6,
    profitTarget: '$3K-$20K',
    maxDrawdown: '$2.5K-$7.5K',
    dailyDrawdown: 'None',
    profitSplit: '90-100%',
    price: 'From $147/mo',
    features: ['No daily DD', 'Futures focus', 'Frequent discounts'],
    recommended: false,
  },
  {
    name: 'E8 Markets',
    rating: 4.5,
    profitTarget: '8% / 4%',
    maxDrawdown: '8%',
    dailyDrawdown: '4%',
    profitSplit: '80-100%',
    price: 'From $138',
    features: ['100% split option', 'Scale to $2.4M', 'Fast payouts'],
    recommended: false,
  },
  {
    name: 'Funded Trading Plus',
    rating: 4.5,
    profitTarget: '10% / 5%',
    maxDrawdown: '10%',
    dailyDrawdown: '4%',
    profitSplit: '80-100%',
    price: 'From $119',
    features: ['Instant funding', 'Scale to $2.5M', 'Flexible rules'],
    recommended: false,
  },
];

const tips = [
  { title: 'Match your style', desc: 'Choose rules that fit how you naturally trade.' },
  { title: 'Consider total cost', desc: 'Factor in fees vs potential funded account value.' },
  { title: 'Check payout history', desc: 'Look for firms with proven, consistent payouts.' },
  { title: 'Read everything', desc: 'Understand all rules before you start.' },
];

const PropFirmComparisonPage = () => {
  const [hoveredFirm, setHoveredFirm] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white overflow-hidden">
      {/* Ambient background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-0 w-[500px] h-[500px] bg-purple-500/8 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[120px]" />
      </div>

      <SEO
        title="Compare Best Prop Firms 2026 | TraderEdge Pro"
        description="Compare FTMO, Funding Pips, and top prop trading firms. Find the best profit splits, drawdown limits, and challenge rules."
        keywords="prop firm comparison, best prop firms 2026, FTMO vs Funding Pips, prop trading firms"
        canonicalUrl="https://traderedgepro.com/prop-comparison"
      />
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
                <Shield className="w-3.5 h-3.5" />
                Prop Firm Guide
              </span>

              <h1 className="text-4xl sm:text-5xl md:text-6xl tracking-tight leading-[1.15] mb-5">
                <span className="font-light text-white/50">Find the right firm</span>
                <br />
                <span className="font-semibold italic bg-gradient-to-r from-purple-400 to-purple-200 bg-clip-text text-transparent">for your style.</span>
              </h1>

              <p className="text-base md:text-lg text-white/40 max-w-xl leading-relaxed font-light">
                Compare rules, profit splits, and costs from the industry's{' '}
                <span className="text-white/60 font-normal">top prop trading firms</span>.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Comparison Cards */}
      <section className="relative py-8 px-6">
        <div className="max-w-6xl mx-auto space-y-4">
          {propFirms.map((firm, index) => (
            <motion.div
              key={firm.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              onMouseEnter={() => setHoveredFirm(firm.name)}
              onMouseLeave={() => setHoveredFirm(null)}
              className={`relative rounded-xl bg-white/[0.02] border transition-all duration-300 ${
                firm.recommended
                  ? 'border-purple-500/30 bg-purple-500/[0.03]'
                  : 'border-white/[0.05] hover:border-purple-500/20'
              }`}
            >
              {/* Top Pick Badge */}
              {firm.recommended && (
                <div className="absolute -top-3 left-6 px-3 py-1 bg-purple-500 text-white text-xs font-medium rounded-full">
                  TOP PICK
                </div>
              )}

              <div className="p-5 grid md:grid-cols-7 gap-4 items-center">
                {/* Firm Info */}
                <div className="md:col-span-2 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center font-semibold text-purple-300">
                    {firm.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">{firm.name}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span className="text-sm text-white/40">{firm.rating}</span>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="hidden md:block">
                  <p className="text-xs text-white/30 mb-1">Profit Target</p>
                  <p className="font-medium text-sm">{firm.profitTarget}</p>
                </div>
                <div className="hidden md:block">
                  <p className="text-xs text-white/30 mb-1">Max Drawdown</p>
                  <p className="font-medium text-sm">{firm.maxDrawdown}</p>
                </div>
                <div className="hidden md:block">
                  <p className="text-xs text-white/30 mb-1">Profit Split</p>
                  <p className="font-semibold text-purple-300 text-sm">{firm.profitSplit}</p>
                </div>
                <div className="hidden md:block">
                  <p className="text-xs text-white/30 mb-1">Starting Price</p>
                  <p className="font-medium text-sm">{firm.price}</p>
                </div>

                {/* Action */}
                <div className="flex justify-end">
                  <Button variant="ghost" size="sm" className="rounded-full text-white/60 hover:text-purple-300 hover:bg-purple-500/10">
                    Visit
                    <ArrowUpRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>

                {/* Mobile Stats */}
                <div className="col-span-full md:hidden grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 rounded-lg bg-white/[0.03]">
                    <span className="text-white/30 text-xs">Target: </span>
                    <span className="font-medium">{firm.profitTarget}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-white/[0.03]">
                    <span className="text-white/30 text-xs">Max DD: </span>
                    <span className="font-medium">{firm.maxDrawdown}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-white/[0.03]">
                    <span className="text-white/30 text-xs">Split: </span>
                    <span className="font-semibold text-purple-300">{firm.profitSplit}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-white/[0.03]">
                    <span className="text-white/30 text-xs">Price: </span>
                    <span className="font-medium">{firm.price}</span>
                  </div>
                </div>

                {/* Features - Show on hover */}
                {hoveredFirm === firm.name && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="col-span-full flex flex-wrap gap-2 pt-4 border-t border-white/[0.05]"
                  >
                    {firm.features.map((feature) => (
                      <span
                        key={feature}
                        className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-white/[0.03] text-white/50 border border-white/[0.06]"
                      >
                        <Check className="w-3 h-3 text-green-400" />
                        {feature}
                      </span>
                    ))}
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Tips */}
      <section className="relative py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-[200px_1fr] gap-8 md:gap-16">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="flex items-start gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-400 mt-0.5" />
              <span className="text-xs font-medium tracking-[0.2em] uppercase text-white/20">
                Before You Choose
              </span>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-4">
              {tips.map((tip, index) => (
                <motion.div
                  key={tip.title}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08 }}
                  className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-amber-500/20 transition-all duration-300 flex items-start gap-4"
                >
                  <span className="text-xl font-semibold text-amber-400/60">0{index + 1}</span>
                  <div>
                    <h3 className="font-medium text-white mb-1">{tip.title}</h3>
                    <p className="text-sm text-white/30 font-light">{tip.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-20 md:py-28 px-6 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-6"
          >
            <div>
              <h2 className="text-2xl md:text-3xl tracking-tight mb-2">
                <span className="font-light text-white/50">Ready to pass your</span>{' '}
                <span className="font-semibold italic bg-gradient-to-r from-purple-400 to-purple-200 bg-clip-text text-transparent">challenge?</span>
              </h2>
              <p className="text-sm text-white/30 font-light">
                TraderEdge Pro helps you stay disciplined and compliant.
              </p>
            </div>
            <Button asChild className="rounded-full px-8 bg-purple-500 hover:bg-purple-400 text-white font-medium shrink-0">
              <Link to="/membership">
                Get Started
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PropFirmComparisonPage;
