import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Bot, Zap, Shield, Code, Settings, Check, FileText, Upload, MessageSquare, Rocket, HelpCircle, Clock, RefreshCw, Headphones, Lock, Cpu, Sparkles, Eye, EyeOff, Fingerprint, Brain, Target, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import MT5Header from '@/components/layout/MT5Header';
import Footer from '@/components/layout/Footer';

const plan = {
  name: 'Custom Bot Development',
  price: 299,
  description: 'Your strategy, professionally built',
  features: [
    'Custom MT5 Expert Advisor built to your specs',
    '3 revision rounds included',
    'Full MQL5 source code provided',
    'Priority support throughout development',
    '7-day delivery target',
    'Lifetime ownership of your bot',
    'Free bug fixes for 30 days',
    'Detailed documentation included',
  ],
};

const features = [
  {
    icon: Brain,
    title: 'Proprietary AI Engine',
    description: 'Built on technology that exists nowhere else. Our system understands trading logic at a fundamental level.',
  },
  {
    icon: Shield,
    title: 'Institutional-Grade Risk',
    description: 'Every bot includes professional position sizing, dynamic stop-loss, and drawdown protection systems.',
  },
  {
    icon: RefreshCw,
    title: '3 Precision Revisions',
    description: 'Not quite right? Request up to 3 revision rounds to perfect your trading machine.',
  },
  {
    icon: Lock,
    title: 'Your Code, Forever',
    description: 'Full MQL5 source code ownership. No subscriptions. No vendor lock-in.',
  },
];

const secretTechFeatures = [
  {
    icon: Fingerprint,
    title: 'Pattern Recognition Beyond Charts',
    description: 'Our system identifies market structures that traditional analysis cannot see.',
  },
  {
    icon: Cpu,
    title: 'Adaptive Code Generation',
    description: 'Each bot is uniquely crafted. No templates. No copy-paste. Pure custom engineering.',
  },
  {
    icon: EyeOff,
    title: 'Stealth Execution Logic',
    description: 'Built-in techniques to minimize market impact and protect your edge.',
  },
  {
    icon: Target,
    title: 'Precision Entry Architecture',
    description: 'Millisecond-accurate entry timing built into every trading signal.',
  },
];

const howItWorksSteps = [
  {
    step: 1,
    icon: FileText,
    title: 'Submit Your Vision',
    description: 'Describe your trading strategy in detail. The more we understand, the more powerful your bot becomes.',
  },
  {
    step: 2,
    icon: Brain,
    title: 'Our Engine Takes Over',
    description: 'Proprietary systems transform your strategy into optimized, production-ready MQL5 code.',
  },
  {
    step: 3,
    icon: Settings,
    title: 'Expert Refinement',
    description: 'Senior developers review, stress-test, and optimize every line of code.',
  },
  {
    step: 4,
    icon: MessageSquare,
    title: 'Your Feedback Matters',
    description: 'Review the bot and request up to 3 revision rounds until perfection is achieved.',
  },
  {
    step: 5,
    icon: Rocket,
    title: 'Deploy & Dominate',
    description: 'Download your compiled bot, source code, and documentation. Start trading immediately.',
  },
];

const faqs = [
  {
    question: 'How long does it take to develop my custom bot?',
    answer: 'We target 7 business days for initial delivery. Complex strategies may take slightly longer. You\'ll receive progress updates throughout the development process.',
  },
  {
    question: 'Do I need coding knowledge to use the bot?',
    answer: 'No coding knowledge required! We provide a ready-to-use .ex5 file that you simply install in your MT5 platform. We also include detailed setup instructions.',
  },
  {
    question: 'What\'s included in the 3 revisions?',
    answer: 'Revisions can include adjustments to entry/exit logic, risk parameters, indicators, timeframes, or any other aspect of the bot. Major strategy changes may count as multiple revisions.',
  },
  {
    question: 'Do I get the source code?',
    answer: 'Yes! You receive the complete MQL5 source code (.mq5 file), giving you full ownership and the ability to modify or extend the bot yourself in the future.',
  },
  {
    question: 'What brokers does the bot work with?',
    answer: 'Our bots work with any MT5-compatible broker. We can optimize for your specific broker\'s spread and execution characteristics if you provide the details.',
  },
  {
    question: 'Is there a subscription or recurring fee?',
    answer: 'No! The $299 is a one-time payment with lifetime ownership. You get free bug fixes for 30 days. Only major new features would be offered as optional paid upgrades.',
  },
  {
    question: 'What makes your technology different?',
    answer: 'We\'ve developed proprietary systems over years of research that cannot be replicated. The specific methods remain confidential, but the results speak for themselves.',
  },
  {
    question: 'Can you build any strategy?',
    answer: 'We can build most algorithmic strategies including indicator-based, price action, grid, martingale, scalping, swing trading, and more. Contact us if you\'re unsure about your strategy.',
  },
];

const MT5BotsPage = () => {
  return (
    <div className="min-h-screen bg-[#020202]">
      <MT5Header />
      
      {/* Hero */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-accent/5 via-transparent to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/10 rounded-full blur-3xl" />
        
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Badge className="mb-4 bg-accent/10 text-accent border-accent/20 backdrop-blur-sm">
              <Sparkles className="w-3 h-3 mr-1" />
              Proprietary Technology
            </Badge>
            <h1 className="text-4xl md:text-7xl font-bold mb-6 leading-tight">
              The Future of
              <span className="gradient-text block">Automated Trading</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-4">
              We've built something that doesn't exist anywhere else.
            </p>
            <p className="text-lg text-muted-foreground/80 max-w-2xl mx-auto mb-8">
              A proprietary bot-building engine developed over years of research. 
              The technology behind your custom MT5 Expert Advisor—exclusively ours.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link to="/mt5-signup">
                <Button size="lg" className="bg-accent hover:bg-accent/90 h-14 px-8 text-lg">
                  <Zap className="w-5 h-5 mr-2" />
                  Get Your Bot - $299
                </Button>
              </Link>
              <a href="#secret-tech">
                <Button size="lg" variant="outline" className="h-14 px-8">
                  <EyeOff className="w-5 h-5 mr-2" />
                  What Makes Us Different
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Secret Tech Section */}
      <section id="secret-tech" className="py-24 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-accent/5 via-primary/5 to-accent/5" />
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-4 bg-white/5 text-white/80 border-white/10">
              <Lock className="w-3 h-3 mr-1" />
              Proprietary Systems
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Technology That
              <span className="text-accent"> Can't Be Copied</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Years of research. Countless iterations. A system refined in silence.
              We don't reveal how it works—only what it delivers.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
            {secretTechFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group p-8 rounded-2xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.08] hover:border-accent/30 transition-all duration-500"
              >
                <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mb-6 group-hover:bg-accent/20 transition-colors">
                  <feature.icon className="w-7 h-7 text-accent" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>

          {/* The Master Plan */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative p-8 md:p-12 rounded-3xl bg-gradient-to-br from-accent/10 via-primary/5 to-accent/10 border border-accent/20 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/20 rounded-full blur-3xl" />
            
            <div className="relative z-10 text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/20 mb-6">
                <Brain className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-2xl md:text-3xl font-bold mb-4">
                The Master Plan
              </h3>
              <p className="text-lg text-muted-foreground mb-6">
                While others use generic templates and outdated methods, we've been quietly 
                building something revolutionary. A bot-building engine so advanced, 
                it transforms your trading vision into precision-engineered code.
              </p>
              <p className="text-muted-foreground/80 mb-8">
                This technology was built for one purpose: to give serious traders 
                an unfair advantage. <span className="text-accent font-medium">And it's only available here.</span>
              </p>
              <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success" />
                  <span>Exclusively Ours</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success" />
                  <span>Cannot Be Replicated</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success" />
                  <span>Battle-Tested</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats/Social Proof */}
      <section className="py-16 px-6 border-y border-white/[0.08]">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '500+', label: 'Bots Delivered' },
              { value: '98%', label: 'Client Satisfaction' },
              { value: '24/7', label: 'Trading Automation' },
              { value: '7 Days', label: 'Average Delivery' },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <p className="text-4xl md:text-5xl font-bold text-accent mb-2">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              What You Get
            </Badge>
            <h2 className="text-3xl font-bold">Every Bot Comes With</h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                className="p-6 rounded-2xl bg-background/50 border border-white/[0.08] hover:border-primary/30 transition-colors"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <feature.icon className="w-10 h-10 text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing - Single Plan */}
      <section id="pricing" className="py-20 px-6 bg-gradient-to-b from-card/30 to-transparent">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge className="mb-4 bg-accent/10 text-accent border-accent/20">
              Simple Pricing
            </Badge>
            <h2 className="text-3xl font-bold mb-4">One Plan, Everything Included</h2>
            <p className="text-muted-foreground">
              No hidden fees. No subscriptions. Just your custom bot, professionally built.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <Card className="bg-gradient-to-br from-accent/10 to-primary/10 border-accent/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent/20 rounded-full blur-2xl" />
              <CardHeader className="text-center pb-4 relative z-10">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/20 mx-auto mb-4">
                  <Bot className="w-8 h-8 text-accent" />
                </div>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <p className="text-muted-foreground">{plan.description}</p>
                <div className="mt-4">
                  <span className="text-5xl font-bold">${plan.price}</span>
                  <span className="text-muted-foreground ml-2">one-time</span>
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-success" />
                      </div>
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/mt5-signup">
                  <Button className="w-full bg-accent hover:bg-accent/90 h-12 text-lg">
                    Start Your Bot Development
                  </Button>
                </Link>
                <p className="text-center text-xs text-muted-foreground mt-4">
                  Pay securely with crypto (ETH or SOL)
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              Simple Process
            </Badge>
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From your strategy vision to a working MT5 bot in 5 simple steps.
            </p>
          </motion.div>

          <div className="relative">
            {/* Connecting Line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-accent via-primary to-accent/20 hidden lg:block" />

            <div className="space-y-12">
              {howItWorksSteps.map((step, index) => (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex flex-col lg:flex-row items-center gap-8 ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}
                >
                  <div className={`flex-1 ${index % 2 === 1 ? 'lg:text-right' : ''}`}>
                    <div className={`inline-flex items-center gap-2 mb-2 ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>
                      <span className="text-sm font-medium text-accent">Step {step.step}</span>
                    </div>
                    <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                    <p className="text-muted-foreground">{step.description}</p>
                  </div>
                  
                  <div className="relative z-10 w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-primary flex items-center justify-center shrink-0">
                    <step.icon className="w-8 h-8 text-white" />
                  </div>

                  <div className="flex-1 hidden lg:block" />
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Link to="/mt5-signup">
              <Button size="lg" className="bg-accent hover:bg-accent/90">
                Start Your Bot Development - $299
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-6 bg-card/30">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge className="mb-4 bg-accent/10 text-accent border-accent/20">
              <HelpCircle className="w-3 h-3 mr-1" />
              FAQ
            </Badge>
            <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-muted-foreground">
              Everything you need to know about our custom bot development service.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="bg-card/50 border border-white/[0.08] rounded-xl px-6"
                >
                  <AccordionTrigger className="text-left hover:no-underline py-4">
                    <span className="font-medium">{faq.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-4">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <p className="text-muted-foreground mb-4">Still have questions?</p>
            <Link to="/contact">
              <Button variant="outline">Contact Support</Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="p-12 rounded-3xl bg-gradient-to-br from-accent/10 via-primary/5 to-accent/10 border border-accent/20 relative overflow-hidden"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-accent/30 rounded-full blur-3xl" />
            <div className="relative z-10">
              <Zap className="w-12 h-12 text-accent mx-auto mb-4" />
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Trade Smarter?</h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto text-lg">
                Stop spending hours watching charts. Let our proprietary technology 
                build you a custom MT5 bot that trades with precision, 24/7.
              </p>
              <Link to="/mt5-signup">
                <Button size="lg" className="bg-accent hover:bg-accent/90 h-14 px-8 text-lg">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Get Started Today - $299
                </Button>
              </Link>
              <p className="text-xs text-muted-foreground mt-6">
                Join 500+ traders already using our custom bots
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default MT5BotsPage;
