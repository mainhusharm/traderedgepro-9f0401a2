import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

const PropFirmLogos = () => {
  const firms = [
    { name: 'FTMO', abbr: 'FTMO' },
    { name: 'Funding Pips', abbr: 'FP' },
    { name: 'MyFundedFX', abbr: 'MFX' },
    { name: 'FundedNext', abbr: 'FN' },
    { name: 'E8 Funding', abbr: 'E8' },
  ];

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-6">
        {/* Two column layout - empty left for 3D element, content on right */}
        <div className="flex flex-col lg:flex-row items-center gap-12">
          {/* Left spacer for 3D particle element */}
          <div className="hidden lg:block lg:w-1/3" />
          
          {/* Right side - Content */}
          <div className="w-full lg:w-2/3">
            <motion.div
              className="text-center lg:text-left mb-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 text-primary text-sm font-medium mb-4">
                <CheckCircle className="w-4 h-4" />
                Verified Compatibility
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold gradient-text">
                Optimized for Leading Prop Firms
              </h2>
            </motion.div>

            <motion.div
              className="flex flex-wrap justify-center lg:justify-start items-center gap-4 md:gap-6"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ staggerChildren: 0.1 }}
            >
              {firms.map((firm, index) => (
                <motion.div
                  key={firm.name}
                  className="group relative"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                >
                  <div className="glass-card px-6 py-5 transition-all duration-300 group-hover:border-primary/30">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center">
                        <span className="text-lg font-bold text-primary">{firm.abbr}</span>
                      </div>
                      <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                        {firm.name}
                      </span>
                    </div>
                  </div>
                  
                  {/* Glow on hover */}
                  <div className="absolute inset-0 bg-primary/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PropFirmLogos;