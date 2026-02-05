import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowUpRight, Mail, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRef, useState, useEffect } from 'react';

const AntimatterCTA = () => {
  const navigate = useNavigate();
  const sectionRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState('');
  
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });
  
  const y = useTransform(scrollYProgress, [0, 1], ['80px', '-80px']);
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0.9]);

  // Live clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: false 
      }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section ref={sectionRef} className="py-32 relative overflow-hidden bg-[#0a0a0f]">
      {/* Background glow */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[800px] bg-[#6366f1]/10 rounded-full blur-[200px]" />
      </div>
      
      <motion.div 
        className="container mx-auto px-6 relative z-10"
        style={{ y, opacity }}
      >
        <div className="max-w-5xl mx-auto">
          {/* Main headline */}
          <motion.h2 
            className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-light text-white leading-tight mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            We turn bold trading ideas into{' '}
            <br className="hidden md:block" />
            <span className="text-[#a5b4fc]">powerful</span>
            <span className="italic"> funded </span>
            <span className="text-[#a5b4fc]">realities.</span>
          </motion.h2>
          
          {/* CTA Button */}
          <motion.div
            className="mb-24"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <motion.button 
              className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#6366f1] to-[#818cf8] text-white rounded-full font-medium text-base hover:shadow-lg hover:shadow-[#6366f1]/25 transition-all duration-300"
              onClick={() => navigate('/membership')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Let's work together
              <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                <ArrowUpRight className="w-4 h-4" />
              </span>
            </motion.button>
          </motion.div>
        </div>
        
        {/* Footer info */}
        <motion.div 
          className="border-t border-white/10 pt-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Email */}
            <div>
              <a 
                href="mailto:support@traderedgepro.com" 
                className="text-white/60 hover:text-[#a5b4fc] transition-colors text-sm"
              >
                support@traderedgepro.com
              </a>
            </div>
            
            {/* Social */}
            <div>
              <a 
                href="https://discord.gg/traderedge" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/60 hover:text-[#a5b4fc] transition-colors text-sm"
              >
                Discord
              </a>
            </div>
            
            {/* Location */}
            <div>
              <p className="text-white/60 text-sm">Based Globally</p>
              <p className="text-white/40 text-sm mt-1">Serving traders worldwide</p>
            </div>
            
            {/* Live time */}
            <div className="text-right">
              <p className="text-4xl font-mono text-white tracking-wider">{currentTime}</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default AntimatterCTA;
