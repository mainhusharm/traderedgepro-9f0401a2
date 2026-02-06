import { motion } from 'framer-motion';
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

const RiskDisclaimer = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="py-8 px-6"
    >
      <div className="max-w-4xl mx-auto">
        <div className="border border-yellow-500/30 bg-yellow-500/5 rounded-lg overflow-hidden">
          {/* Header - Always visible */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-yellow-500/10 transition-colors"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              <span className="font-medium text-yellow-500/90">Risk Disclaimer</span>
            </div>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-yellow-500/70" />
            ) : (
              <ChevronDown className="w-5 h-5 text-yellow-500/70" />
            )}
          </button>

          {/* Expanded Content */}
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-6 pb-6"
            >
              <div className="border-t border-yellow-500/20 pt-4 space-y-4 text-sm text-yellow-500/80">
                <p>
                  <strong>Risk Warning:</strong> Trading foreign exchange (Forex), Contracts for Difference (CFDs), 
                  and other financial instruments involves significant risk of loss and is not suitable for all investors. 
                  The high degree of leverage can work against you as well as for you.
                </p>
                <p>
                  Past performance is not indicative of future results. You should carefully consider your investment 
                  objectives, level of experience, and risk appetite before making any trading decisions. Only trade 
                  with capital you can afford to lose.
                </p>
                <p>
                  TraderEdge Pro provides educational signals and trading tools. All trading decisions and their 
                  outcomes are your sole responsibility. We do not guarantee any specific results or profits.
                </p>
                <div className="pt-2">
                  <Link 
                    to="/terms" 
                    className="text-yellow-500 hover:text-yellow-400 underline underline-offset-2"
                  >
                    Read Full Risk Disclosure & Terms
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.section>
  );
};

export default RiskDisclaimer;
