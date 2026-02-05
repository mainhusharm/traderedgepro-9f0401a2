import { motion, useAnimationFrame } from 'framer-motion';
import { useRef, useState } from 'react';

const propFirms = [
  'FTMO',
  'The Funded Trader',
  'E8 Funding',
  'My Forex Funds',
  'True Forex Funds',
  'Funded Next',
  'The5%ers',
  'Surge Trading',
  'Apex Trader',
  'Topstep',
];

const AntimatterTrust = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [offset1, setOffset1] = useState(0);
  const [offset2, setOffset2] = useState(0);

  // Continuous scroll animation
  useAnimationFrame((time) => {
    setOffset1((time * 0.03) % 100);
    setOffset2((time * 0.025) % 100);
  });

  return (
    <section ref={sectionRef} className="py-32 relative overflow-hidden bg-[#0a0a0f]">
      {/* Background glow */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-[#6366f1]/5 rounded-full blur-[150px]" />
      </div>
      
      <div className="container mx-auto px-6 relative z-10">
        {/* Section header */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="text-[#6366f1] text-sm font-medium tracking-[0.2em] uppercase mb-4 block">
            Trusted by Industry Leaders
          </span>
          <h2 className="text-3xl md:text-4xl font-light text-white">
            Powering Innovation for Traders Worldwide
          </h2>
        </motion.div>
        
        {/* Infinite scrolling logos - Row 1 */}
        <div className="relative mb-6 overflow-hidden">
          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#0a0a0f] to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#0a0a0f] to-transparent z-10" />
          
          <motion.div 
            className="flex gap-8"
            style={{ x: `-${offset1}%` }}
          >
            {[...propFirms, ...propFirms, ...propFirms].map((firm, index) => (
              <div 
                key={`${firm}-${index}`}
                className="flex-shrink-0 px-8 py-4 rounded-xl border border-white/10 bg-white/[0.02] backdrop-blur-sm"
              >
                <span className="text-lg font-medium text-white/60 whitespace-nowrap">
                  {firm}
                </span>
              </div>
            ))}
          </motion.div>
        </div>
        
        {/* Infinite scrolling logos - Row 2 (reverse direction) */}
        <div className="relative overflow-hidden">
          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#0a0a0f] to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#0a0a0f] to-transparent z-10" />
          
          <motion.div 
            className="flex gap-8"
            style={{ x: `${offset2 - 50}%` }}
          >
            {[...propFirms.slice().reverse(), ...propFirms.slice().reverse(), ...propFirms.slice().reverse()].map((firm, index) => (
              <div 
                key={`${firm}-rev-${index}`}
                className="flex-shrink-0 px-8 py-4 rounded-xl border border-white/10 bg-white/[0.02] backdrop-blur-sm"
              >
                <span className="text-lg font-medium text-white/60 whitespace-nowrap">
                  {firm}
                </span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AntimatterTrust;
