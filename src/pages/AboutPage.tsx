import { motion } from 'framer-motion';
import { Target, Users, Trophy, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const stats = [
  { value: '10K+', label: 'Active Traders' },
  { value: '85%', label: 'Win Rate' },
  { value: '500+', label: 'Funded Accounts' },
  { value: '24/7', label: 'Support' },
];

const team = [
  {
    name: 'Alex Chen',
    role: 'Founder & CEO',
    bio: '15+ years in quantitative trading. Former Goldman Sachs trader.',
  },
  {
    name: 'Sarah Williams',
    role: 'Chief Technology Officer',
    bio: 'Ex-Google engineer. Expert in AI/ML trading systems.',
  },
  {
    name: 'Michael Roberts',
    role: 'Head of Trading',
    bio: 'Professional prop trader. Managed $50M+ in assets.',
  },
  {
    name: 'Emily Zhang',
    role: 'Head of Customer Success',
    bio: 'Dedicated to helping traders achieve their goals.',
  },
];

const values = [
  {
    icon: Target,
    title: 'Precision',
    description: 'Every signal is carefully analyzed for maximum accuracy.',
  },
  {
    icon: Users,
    title: 'Community',
    description: 'We believe in lifting each other up through shared knowledge.',
  },
  {
    icon: Trophy,
    title: 'Excellence',
    description: 'We continuously improve our systems and strategies.',
  },
  {
    icon: Globe,
    title: 'Accessibility',
    description: 'Professional trading tools for everyone, everywhere.',
  },
];

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-[#020202]">
      <Header />
      
      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <motion.h1 
            className="text-4xl md:text-6xl font-bold mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            About <span className="gradient-text">TraderEdge</span>
          </motion.h1>
          <motion.p 
            className="text-xl text-muted-foreground max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            We're on a mission to democratize professional trading by providing 
            institutional-grade tools to retail traders worldwide.
          </motion.p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 px-6 border-y border-white/[0.08]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <p className="text-4xl font-bold gradient-text">{stat.value}</p>
                <p className="text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold mb-6 text-center">Our Story</h2>
            <div className="prose prose-invert mx-auto">
              <p className="text-lg text-muted-foreground mb-4">
                TraderEdge was born from frustration. As professional traders, we saw countless 
                retail traders fail not because of lack of skill, but because they didn't have 
                access to the same tools and analysis that institutions use.
              </p>
              <p className="text-lg text-muted-foreground mb-4">
                We founded TraderEdge in 2023 with a simple mission: level the playing field. 
                By combining cutting-edge AI technology with years of trading experience, we've 
                built a platform that gives every trader an edge.
              </p>
              <p className="text-lg text-muted-foreground">
                Today, we serve thousands of traders worldwide, helping them pass prop firm 
                challenges and achieve consistent profitability. But we're just getting started.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 px-6 bg-card/30">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                className="text-center p-6"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <value.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
                <p className="text-muted-foreground">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">Meet the Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <motion.div
                key={member.name}
                className="p-6 rounded-2xl bg-card/50 border border-white/[0.08] text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <h3 className="text-lg font-semibold">{member.name}</h3>
                <p className="text-primary text-sm mb-2">{member.role}</p>
                <p className="text-muted-foreground text-sm">{member.bio}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Join Our Community</h2>
          <p className="text-muted-foreground mb-8">
            Start your journey to consistent profitability today.
          </p>
          <Link to="/auth">
            <Button size="lg" className="bg-primary hover:bg-primary/90">
              Get Started Free
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AboutPage;
