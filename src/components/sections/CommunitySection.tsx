import { motion } from 'framer-motion';
import { MessageCircle, Twitter, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CommunitySection = () => {
  return (
    <section className="py-24 px-6 relative overflow-hidden">
      <div className="max-w-4xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="gradient-text">Join Our Community</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Connect with thousands of traders and get instant updates
          </p>
        </motion.div>

        {/* Community Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Discord Card */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="glass-card p-8 text-center group hover:border-[#5865F2]/50 transition-all duration-300"
          >
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-[#5865F2]/20 flex items-center justify-center group-hover:bg-[#5865F2]/30 transition-colors">
              <MessageCircle className="w-8 h-8 text-[#5865F2]" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Discord Community</h3>
            <div className="flex items-center justify-center gap-2 text-muted-foreground mb-4">
              <Users className="w-4 h-4" />
              <span>Join 5,000+ traders</span>
            </div>
            <p className="text-muted-foreground mb-6">
              Get real-time discussions, trade ideas, and connect with fellow funded traders.
            </p>
            <Button 
              className="w-full bg-[#5865F2] hover:bg-[#5865F2]/90 text-white"
              onClick={() => window.open('https://discord.gg/EXB6R8d2', '_blank')}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Join Discord
            </Button>
          </motion.div>

          {/* Twitter/X Card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="glass-card p-8 text-center group hover:border-foreground/50 transition-all duration-300"
          >
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-foreground/10 flex items-center justify-center group-hover:bg-foreground/20 transition-colors">
              <Twitter className="w-8 h-8 text-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Twitter / X</h3>
            <div className="flex items-center justify-center gap-2 text-muted-foreground mb-4">
              <Users className="w-4 h-4" />
              <span>Daily insights</span>
            </div>
            <p className="text-muted-foreground mb-6">
              Follow for market analysis, trading tips, and real-time signal updates.
            </p>
            <Button 
              className="w-full bg-foreground hover:bg-foreground/90 text-background"
              onClick={() => window.open('https://x.com/Traderredgepro', '_blank')}
            >
              <Twitter className="w-4 h-4 mr-2" />
              Follow on X
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default CommunitySection;
