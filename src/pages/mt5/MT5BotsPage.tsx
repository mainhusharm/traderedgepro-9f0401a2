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
    <div className="min-h-screen bg-[#0A0A0B] text-white overflow-hidden">
      {/* Ambient background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-0 w-[500px] h-[500px] bg-purple-500/8 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[120px]" />
      </div>

      <MT5Header />

      {/* Hero */}
      <section className="relative pt-32 md:pt-40 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300/80 mb-6">
                <Bot className="w-3.5 h-3.5" />
                Custom MT5 Expert Advisors
              </span>

              <h1 className="text-4xl sm:text-5xl md:text-6xl tracking-tight leading-[1.15] mb-5">
                <span className="font-light text-white/50">The Future of</span>
                <br />
                <span className="font-semibold italic bg-gradient-to-r from-purple-400 to-purple-200 bg-clip-text text-transparent">Automated Trading.</span>
              </h1>

              <p className="text-base md:text-lg text-white/40 max-w-xl leading-relaxed font-light mb-4">
                We've built something that doesn't exist anywhere else.
              </p>
              <p className="text-sm text-white/30 max-w-xl leading-relaxed font-light mb-8">
                A proprietary bot-building engine developed over years of research.
                The technology behind your custom MT5 Expert Advisor—
                <span className="text-white/50 font-normal">exclusively ours</span>.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild className="rounded-full px-6 bg-purple-500 hover:bg-purple-400 text-white font-medium">
                  <Link to="/mt5-signup">
                    <Zap className="w-4 h-4 mr-2" />
                    Get Your Bot - $299
                  </Link>
                </Button>
                <Button asChild variant="outline" className="rounded-full px-6 bg-transparent border-white/10 hover:border-purple-500/30 hover:bg-white/5 text-white font-normal">
                  <a href="#secret-tech">
                    <EyeOff className="w-4 h-4 mr-2" />
                    What Makes Us Different
                  </a>
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Secret Tech Section */}
      <section id="secret-tech" className="relative py-20 px-6 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-[200px_1fr] gap-8 md:gap-16 mb-12">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <span className="text-xs font-medium tracking-[0.2em] uppercase text-white/20">
                Proprietary
              </span>
            </motion.div>

            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="max-w-2xl mb-12"
              >
                <h2 className="text-3xl tracking-tight mb-4">
                  <span className="font-light text-white/50">Technology That</span>{' '}
                  <span className="font-semibold italic bg-gradient-to-r from-purple-400 to-purple-200 bg-clip-text text-transparent">Can't Be Copied</span>
                </h2>
                <p className="text-base text-white/40 font-light">
                  Years of research. Countless iterations. A system refined in silence.
                  We don't reveal how it works—only what it delivers.
                </p>
              </motion.div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {secretTechFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="p-6 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-purple-500/20 transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
                  <feature.icon className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-white/40 font-light">{feature.description}</p>
              </motion.div>
            ))}
          </div>

          {/* The Master Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 p-8 rounded-xl bg-purple-500/5 border border-purple-500/10"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                <Brain className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-medium text-white">The Master Plan</h3>
            </div>
            <p className="text-white/40 font-light mb-4 max-w-3xl">
              While others use generic templates and outdated methods, we've been quietly
              building something revolutionary. A bot-building engine so advanced,
              it transforms your trading vision into precision-engineered code.
            </p>
            <p className="text-white/30 font-light mb-6 max-w-3xl">
              This technology was built for one purpose: to give serious traders
              an unfair advantage. <span className="text-purple-400 font-normal">And it's only available here.</span>
            </p>
            <div className="flex flex-wrap items-center gap-6 text-sm text-white/40">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400" />
                <span>Exclusively Ours</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400" />
                <span>Cannot Be Replicated</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400" />
                <span>Battle-Tested</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats/Social Proof */}
      <section className="relative py-16 px-6 border-y border-white/[0.06]">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: '500+', label: 'Bots Delivered' },
              { value: '98%', label: 'Client Satisfaction' },
              { value: '24/7', label: 'Trading Automation' },
              { value: '7 Days', label: 'Average Delivery' },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="p-6 rounded-xl bg-white/[0.02] border border-white/[0.05] text-center hover:border-purple-500/20 transition-all duration-300"
              >
                <p className="text-3xl font-semibold text-purple-400 mb-1">{stat.value}</p>
                <p className="text-sm text-white/30 font-light">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-[200px_1fr] gap-8 md:gap-16">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <span className="text-xs font-medium tracking-[0.2em] uppercase text-white/20">
                What You Get
              </span>
            </motion.div>

            <div>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-2xl tracking-tight mb-8"
              >
                <span className="font-light text-white/50">Every Bot</span>{' '}
                <span className="font-semibold italic bg-gradient-to-r from-purple-400 to-purple-200 bg-clip-text text-transparent">Comes With</span>
              </motion.h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {features.map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    className="p-6 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-purple-500/20 transition-all duration-300"
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.08 }}
                  >
                    <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
                      <feature.icon className="w-5 h-5 text-purple-400" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">{feature.title}</h3>
                    <p className="text-sm text-white/40 font-light">{feature.description}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing - Single Plan */}
      <section id="pricing" className="relative py-20 px-6 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-[200px_1fr] gap-8 md:gap-16">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <span className="text-xs font-medium tracking-[0.2em] uppercase text-white/20">
                Pricing
              </span>
            </motion.div>

            <div className="max-w-xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mb-8"
              >
                <h2 className="text-2xl tracking-tight mb-3">
                  <span className="font-light text-white/50">One Plan,</span>{' '}
                  <span className="font-semibold italic bg-gradient-to-r from-purple-400 to-purple-200 bg-clip-text text-transparent">Everything Included</span>
                </h2>
                <p className="text-sm text-white/40 font-light">
                  No hidden fees. No subscriptions. Just your custom bot, professionally built.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="p-6 rounded-xl bg-purple-500/5 border border-purple-500/10"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                    <Bot className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white">{plan.name}</h3>
                    <p className="text-sm text-white/40 font-light">{plan.description}</p>
                  </div>
                </div>

                <div className="mb-6">
                  <span className="text-4xl font-semibold text-white">${plan.price}</span>
                  <span className="text-white/40 font-light ml-2">one-time</span>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-green-400" />
                      </div>
                      <span className="text-sm text-white/50 font-light">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button asChild className="w-full h-12 bg-purple-500 hover:bg-purple-400 text-white font-medium rounded-lg">
                  <Link to="/mt5-signup">Start Your Bot Development</Link>
                </Button>
                <p className="text-center text-xs text-white/30 font-light mt-4">
                  Pay securely with crypto (ETH or SOL)
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="relative py-20 px-6 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-[200px_1fr] gap-8 md:gap-16 mb-12">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <span className="text-xs font-medium tracking-[0.2em] uppercase text-white/20">
                Process
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-2xl"
            >
              <h2 className="text-2xl tracking-tight mb-3">
                <span className="font-light text-white/50">How It</span>{' '}
                <span className="font-semibold italic bg-gradient-to-r from-purple-400 to-purple-200 bg-clip-text text-transparent">Works</span>
              </h2>
              <p className="text-sm text-white/40 font-light">
                From your strategy vision to a working MT5 bot in 5 simple steps.
              </p>
            </motion.div>
          </div>

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
      <section id="faq" className="relative py-20 px-6 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-[200px_1fr] gap-8 md:gap-16">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <span className="text-xs font-medium tracking-[0.2em] uppercase text-white/20">
                FAQ
              </span>
            </motion.div>

            <div className="max-w-2xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mb-8"
              >
                <h2 className="text-2xl tracking-tight mb-3">
                  <span className="font-light text-white/50">Frequently Asked</span>{' '}
                  <span className="font-semibold italic bg-gradient-to-r from-purple-400 to-purple-200 bg-clip-text text-transparent">Questions</span>
                </h2>
                <p className="text-sm text-white/40 font-light">
                  Everything you need to know about our custom bot development service.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <Accordion type="single" collapsible className="space-y-3">
                  {faqs.map((faq, index) => (
                    <AccordionItem
                      key={index}
                      value={`item-${index}`}
                      className="bg-white/[0.02] border border-white/[0.05] rounded-xl px-5 hover:border-purple-500/20 transition-all duration-300"
                    >
                      <AccordionTrigger className="text-left hover:no-underline py-4">
                        <span className="font-medium text-white">{faq.question}</span>
                      </AccordionTrigger>
                      <AccordionContent className="text-white/40 font-light pb-4">
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
                className="mt-8 flex items-center gap-4"
              >
                <p className="text-white/40 font-light">Still have questions?</p>
                <Button asChild variant="outline" className="bg-white/[0.02] border-white/[0.08] hover:bg-white/[0.05] hover:border-purple-500/30">
                  <Link to="/contact">Contact Support</Link>
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-20 px-6 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-8 md:p-12 rounded-xl bg-white/[0.02] border border-white/[0.05]"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
              <div className="max-w-xl">
                <h2 className="text-2xl md:text-3xl tracking-tight mb-3">
                  <span className="font-light text-white/50">Ready to Trade</span>{' '}
                  <span className="font-semibold italic bg-gradient-to-r from-purple-400 to-purple-200 bg-clip-text text-transparent">Smarter?</span>
                </h2>
                <p className="text-sm text-white/40 font-light">
                  Stop spending hours watching charts. Let our proprietary technology
                  build you a custom MT5 bot that trades with precision, 24/7.
                </p>
                <p className="text-xs text-white/30 font-light mt-4">
                  Join 500+ traders already using our custom bots
                </p>
              </div>
              <Button asChild className="rounded-full px-8 bg-purple-500 hover:bg-purple-400 text-white font-medium shrink-0">
                <Link to="/mt5-signup">
                  Get Started - $299
                  <TrendingUp className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default MT5BotsPage;
