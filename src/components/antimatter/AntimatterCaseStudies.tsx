import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { ArrowUpRight } from 'lucide-react';

const caseStudies = [
  {
    number: '01',
    title: 'FTMO Challenge',
    tags: ['100K Account', 'Phase 1 & 2'],
    image: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
  },
  {
    number: '02',
    title: 'The Funded Trader',
    tags: ['200K Account', 'First Payout'],
    image: 'linear-gradient(135deg, #0f3460 0%, #1a1a2e 50%, #16213e 100%)',
  },
  {
    number: '03',
    title: 'E8 Scaling',
    tags: ['50K → 400K', 'Multi Account'],
    image: 'linear-gradient(135deg, #16213e 0%, #0f3460 50%, #1a1a2e 100%)',
  },
  {
    number: '04',
    title: 'Risk Management',
    tags: ['Zero Breaches', '45 Days'],
    image: 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 50%, #16213e 100%)',
  },
  {
    number: '05',
    title: 'Consistent Payouts',
    tags: ['82% Win Rate', '6 Months'],
    image: 'linear-gradient(135deg, #0f3460 0%, #16213e 50%, #1a1a2e 100%)',
  },
];

const AntimatterCaseStudies = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });
  
  const x = useTransform(scrollYProgress, [0.1, 0.9], ['0%', '-40%']);

  return (
    <section ref={containerRef} className="py-32 relative overflow-hidden bg-[#0a0a0f]">
      <div className="container mx-auto px-6 mb-12">
        {/* Section header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="text-[#6366f1] text-sm font-medium tracking-[0.2em] uppercase mb-6 block">
            Case Studies
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-light text-white leading-tight">
            Proven results, measurable impact—explore
          </h2>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-light text-muted-foreground leading-tight mt-2">
            the <span className="text-[#a5b4fc] italic">transformations</span> we've delivered.
          </h2>
        </motion.div>
      </div>
      
      {/* Horizontal scrolling cards */}
      <div className="overflow-hidden">
        <motion.div 
          ref={scrollRef}
          className="flex gap-6 px-6 pb-8"
          style={{ x }}
        >
          {caseStudies.map((study, index) => (
            <motion.div
              key={study.number}
              className="flex-shrink-0 w-[350px] md:w-[400px] group cursor-pointer"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              {/* Image container */}
              <div 
                className="relative aspect-[4/5] rounded-2xl overflow-hidden mb-4"
                style={{ background: study.image }}
              >
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                
                {/* Number */}
                <div className="absolute top-6 left-6">
                  <span className="text-sm text-white/60">{study.number}</span>
                </div>
                
                {/* Arrow on hover */}
                <motion.div 
                  className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  whileHover={{ scale: 1.1 }}
                >
                  <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                    <ArrowUpRight className="w-5 h-5 text-white" />
                  </div>
                </motion.div>
                
                {/* Content at bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="text-2xl font-semibold text-white mb-3">{study.title}</h3>
                  <div className="flex flex-wrap gap-2">
                    {study.tags.map((tag, i) => (
                      <span 
                        key={i}
                        className="text-xs px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-white/80"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default AntimatterCaseStudies;
