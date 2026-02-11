import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Building2, ArrowRight, Check, TrendingUp, Shield, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';

const propFirms = [
  { name: 'Topstep', split: '90-100%', highlight: true },
  { name: 'FundedNext', split: '80-95%', highlight: false },
  { name: 'FTMO', split: '80-90%', highlight: false },
  { name: 'Apex Trader Funding', split: '90-100%', highlight: false },
  { name: 'E8 Markets', split: '80-100%', highlight: false },
  { name: 'Funded Trading Plus', split: '80-100%', highlight: false },
];

const PropFirmsSection = () => {
  return (
    <section className="relative py-20 overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
              <Building2 className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-emerald-300/80 font-medium">Prop Firm Navigator</span>
            </div>

            <h2 className="text-3xl md:text-4xl font-light text-white mb-4">
              Find Your <span className="text-emerald-400 italic">Perfect Prop Firm</span>
            </h2>
            <p className="text-white/40 max-w-xl mx-auto">
              Not all prop firms are created equal. Compare profit splits, drawdown rules,
              and challenge requirements to find the one that matches your trading style.
            </p>
          </motion.div>

          {/* Quick Comparison Preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-medium text-white/60">Top Prop Firms by Profit Split</h3>
              <Scale className="w-4 h-4 text-white/30" />
            </div>

            <div className="space-y-3">
              {propFirms.map((firm, index) => (
                <motion.div
                  key={firm.name}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                    firm.highlight
                      ? 'bg-emerald-500/10 border border-emerald-500/20'
                      : 'bg-white/[0.02] hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {firm.highlight && (
                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <Check className="w-3 h-3 text-emerald-400" />
                      </div>
                    )}
                    <span className={`text-sm ${firm.highlight ? 'text-white font-medium' : 'text-white/60'}`}>
                      {firm.name}
                    </span>
                    {firm.highlight && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 uppercase tracking-wider">
                        Recommended
                      </span>
                    )}
                  </div>
                  <span className={`text-sm font-mono ${firm.highlight ? 'text-emerald-400' : 'text-white/40'}`}>
                    {firm.split}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Features + CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-between gap-6"
          >
            <div className="flex flex-wrap items-center gap-4 text-sm text-white/40">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400/60" />
                <span>Profit targets compared</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400/60" />
                <span>Drawdown limits analyzed</span>
              </div>
            </div>

            <Button
              asChild
              variant="outline"
              className="rounded-full px-6 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/50 group"
            >
              <Link to="/prop-comparison">
                Compare All Firms
                <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default PropFirmsSection;
