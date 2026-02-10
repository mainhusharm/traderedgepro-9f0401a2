import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, TrendingUp, Shield, Zap, Target, Bot, BarChart3, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Premium3DScene from '@/components/canvas/Premium3DScene';
import IntroLoader from '@/components/animations/IntroLoader';
import ScrollFollowingLine from '@/components/animations/ScrollFollowingLine';
import Reveal3DSection from '@/components/animations/Reveal3DSection';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import PropFirmLogos from '@/components/sections/PropFirmLogos';
import PricingSection from '@/components/sections/PricingSection';
import FAQSection from '@/components/sections/FAQSection';

gsap.registerPlugin(ScrollTrigger);

const PremiumLandingPage = () => {
  const navigate = useNavigate();
  const [isIntroComplete, setIsIntroComplete] = useState(false);
  const [isSceneReady, setIsSceneReady] = useState(false);
  const scrollProgressRef = useRef(0);
  const mousePositionRef = useRef({ x: 0, y: 0 });
  const mainRef = useRef<HTMLDivElement>(null);

  // Handle scroll progress
  useEffect(() => {
    if (!isIntroComplete) return;

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      scrollProgressRef.current = scrollTop / docHeight;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isIntroComplete]);

  // Handle mouse movement for parallax
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePositionRef.current = {
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      };
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // GSAP animations for hero content
  useEffect(() => {
    if (!isIntroComplete || !mainRef.current) return;

    const heroElements = mainRef.current.querySelectorAll('[data-hero-animate]');
    
    gsap.fromTo(heroElements, 
      { 
        opacity: 0, 
        y: 60,
        filter: 'blur(10px)',
      },
      { 
        opacity: 1, 
        y: 0,
        filter: 'blur(0px)',
        duration: 1,
        stagger: 0.15,
        ease: 'power4.out',
        delay: 0.3,
      }
    );
  }, [isIntroComplete]);

  const handleSceneReady = useCallback(() => {
    setIsSceneReady(true);
  }, []);

  const handleIntroComplete = useCallback(() => {
    setIsIntroComplete(true);
  }, []);

  const features = [
    {
      icon: Bot,
      title: 'AI-Powered Signals',
      description: 'Advanced machine learning analyzes markets 24/7 to deliver high-probability trade setups.',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Shield,
      title: 'Risk Management',
      description: 'Automated position sizing and drawdown protection tailored to your prop firm rules.',
      gradient: 'from-green-500 to-emerald-500',
    },
    {
      icon: Target,
      title: 'Precision Entries',
      description: 'Multi-timeframe confluence analysis for optimal entry and exit points.',
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      icon: BarChart3,
      title: 'Performance Analytics',
      description: 'Track your progress with detailed metrics and AI-powered improvement suggestions.',
      gradient: 'from-orange-500 to-red-500',
    },
  ];

  const stats = [
    { value: '24/7', label: 'AI Monitoring', sublabel: 'Never sleeps' },
    { value: '100%', label: 'Rule Compliance', sublabel: 'Always enforced' },
    { value: 'Pro', label: 'Grade System', sublabel: 'Discipline first' },
    { value: 'Live', label: 'Risk Control', sublabel: 'Real-time' },
  ];

  const steps = [
    { step: '01', title: 'Complete Questionnaire', description: 'Tell us about your trading style and prop firm requirements.' },
    { step: '02', title: 'Get Your Trading Plan', description: 'Receive a personalized risk management strategy.' },
    { step: '03', title: 'Receive AI Signals', description: 'Get real-time trade alerts matching your parameters.' },
    { step: '04', title: 'Pass Your Challenge', description: 'Execute trades confidently and clear your prop firm evaluation.' },
  ];

  return (
    <>
      {/* Intro Loader */}
      <AnimatePresence>
        {!isIntroComplete && (
          <IntroLoader 
            onComplete={handleIntroComplete}
            isSceneReady={isSceneReady}
          />
        )}
      </AnimatePresence>

      {/* 3D Background Scene */}
      <Premium3DScene
        scrollProgressRef={{ current: scrollProgressRef.current } as React.MutableRefObject<number>}
        mousePositionRef={mousePositionRef}
        isIntroComplete={isIntroComplete}
        onSceneReady={handleSceneReady}
      />

      {/* Scroll Following Line */}
      {isIntroComplete && <ScrollFollowingLine />}

      {/* Main Content */}
      <div 
        ref={mainRef}
        className={`relative z-10 transition-opacity duration-500 ${isIntroComplete ? 'opacity-100' : 'opacity-0'}`}
      >
        <Header />

        {/* Hero Section */}
        <section className="min-h-screen flex items-center justify-center px-6 pt-20">
          <div className="container mx-auto">
            <div className="max-w-4xl mx-auto text-center lg:text-left lg:max-w-none lg:grid lg:grid-cols-2 lg:gap-12 lg:items-center">
              <div>
                {/* Badge */}
                <motion.div 
                  data-hero-animate
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 backdrop-blur-sm mb-8"
                >
                  <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                  <span className="text-sm text-primary font-medium">AI-Powered Prop Firm Clearing</span>
                </motion.div>

                {/* Headline */}
                <h1 
                  data-hero-animate
                  className="text-5xl md:text-6xl lg:text-7xl font-black leading-tight mb-6"
                >
                  <span className="text-foreground">Clear Your</span>
                  <br />
                  <span className="text-foreground">Challenge</span>
                  <br />
                  <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent bg-[length:200%_100%] animate-gradient">
                    With AI Precision
                  </span>
                </h1>

                {/* Subheadline */}
                <p 
                  data-hero-animate
                  className="text-xl text-muted-foreground mb-8 max-w-xl"
                >
                  Join thousands of traders using AI-powered signals to pass prop firm challenges. 
                  Get personalized trade setups, risk management, and real-time alerts.
                </p>

                {/* CTAs */}
                <div data-hero-animate className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    size="lg" 
                    className="btn-glow text-lg px-8 py-6 font-semibold group"
                    onClick={() => navigate('/membership')}
                  >
                    Start Free Trial
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="text-lg px-8 py-6 border-white/20 hover:bg-white/5"
                    onClick={() => navigate('/features')}
                  >
                    See How It Works
                  </Button>
                </div>

                {/* Trust badges */}
                <div data-hero-animate className="flex items-center gap-6 mt-8 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-sm">No credit card required</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-sm">Cancel anytime</span>
                  </div>
                </div>
              </div>

              {/* Stats Grid (right side on desktop) */}
              <div className="hidden lg:grid grid-cols-2 gap-4 mt-12 lg:mt-0">
                {stats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    data-hero-animate
                    className="glass-card p-6 rounded-2xl border border-white/10 hover:border-primary/30 transition-colors"
                    whileHover={{ scale: 1.02, y: -5 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <p className="text-4xl font-black bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-1">
                      {stat.value}
                    </p>
                    <p className="text-foreground font-semibold">{stat.label}</p>
                    <p className="text-sm text-muted-foreground">{stat.sublabel}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Prop Firm Logos */}
        <Reveal3DSection className="py-16">
          <PropFirmLogos />
        </Reveal3DSection>

        {/* Features Section */}
        <Reveal3DSection className="py-24 px-6">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 data-reveal className="text-4xl md:text-5xl font-bold mb-4">
                Everything You Need to
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"> Succeed</span>
              </h2>
              <p data-reveal className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Our AI analyzes millions of data points to deliver high-probability trade setups tailored to your prop firm's rules.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  data-reveal
                  className="glass-card p-8 rounded-2xl border border-white/10 group hover:border-primary/30 transition-all duration-300"
                  whileHover={{ y: -10 }}
                >
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </Reveal3DSection>

        {/* How It Works Section */}
        <Reveal3DSection className="py-24 px-6">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 data-reveal className="text-4xl md:text-5xl font-bold mb-4">
                How It <span className="text-primary">Works</span>
              </h2>
              <p data-reveal className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Get started in minutes and start receiving AI-powered trade signals.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {steps.map((step, index) => (
                <motion.div
                  key={step.step}
                  data-reveal
                  className="relative"
                  whileHover={{ y: -5 }}
                >
                  {/* Connector line */}
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-primary/50 to-transparent" />
                  )}
                  
                  <div className="glass-card p-8 rounded-2xl border border-white/10 h-full">
                    <span className="text-6xl font-black bg-gradient-to-r from-primary/20 to-accent/20 bg-clip-text text-transparent">
                      {step.step}
                    </span>
                    <h3 className="text-xl font-bold mt-4 mb-2">{step.title}</h3>
                    <p className="text-muted-foreground">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </Reveal3DSection>

        {/* Signal Preview Section */}
        <Reveal3DSection className="py-24 px-6">
          <div className="container mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 data-reveal className="text-4xl md:text-5xl font-bold mb-6">
                  Real-Time
                  <span className="text-primary"> AI Signals</span>
                </h2>
                <p data-reveal className="text-xl text-muted-foreground mb-8">
                  Receive precise entry points, stop losses, and take profit levels calculated by our advanced AI system.
                </p>
                
                <ul data-reveal className="space-y-4">
                  {[
                    'Multi-timeframe analysis',
                    'Prop firm rule compliance',
                    'Risk-adjusted position sizing',
                    'Real-time Telegram alerts',
                  ].map((item, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Signal Card Preview */}
              <motion.div 
                data-reveal
                className="glass-card p-6 rounded-2xl border border-white/10"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">EUR/USD</h4>
                      <span className="text-sm text-green-500 font-semibold">BUY SIGNAL</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">92%</p>
                    <p className="text-xs text-muted-foreground">Confidence</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-white/5 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">Entry</p>
                    <p className="font-bold text-lg">1.0845</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">Stop Loss</p>
                    <p className="font-bold text-lg text-red-500">1.0820</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">Take Profit</p>
                    <p className="font-bold text-lg text-green-500">1.0895</p>
                  </div>
                </div>

                <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
                  <p className="text-sm">
                    <span className="text-primary font-semibold">AI Analysis:</span>
                    <span className="text-muted-foreground"> Bullish momentum confirmed with RSI divergence on H4. Key support holding at 1.0820. Target aligns with previous resistance zone.</span>
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </Reveal3DSection>

        {/* Pricing Section */}
        <Reveal3DSection>
          <PricingSection />
        </Reveal3DSection>

        {/* FAQ Section */}
        <Reveal3DSection>
          <FAQSection />
        </Reveal3DSection>

        {/* CTA Section */}
        <Reveal3DSection className="py-24 px-6">
          <div className="container mx-auto">
            <div className="glass-card p-12 md:p-16 rounded-3xl border border-primary/20 text-center relative overflow-hidden">
              {/* Background glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-accent/10" />
              
              <div className="relative z-10">
                <h2 data-reveal className="text-4xl md:text-5xl font-bold mb-6">
                  Ready to Pass Your
                  <span className="text-primary"> Challenge?</span>
                </h2>
                <p data-reveal className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                  Join thousands of successful traders who have cleared their prop firm evaluations with TraderEdge Pro.
                </p>
                <div data-reveal className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    size="lg" 
                    className="btn-glow text-lg px-10 py-6 font-semibold"
                    onClick={() => navigate('/membership')}
                  >
                    Get Started Now
                    <Zap className="ml-2 w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Reveal3DSection>

        <Footer />
      </div>
    </>
  );
};

export default PremiumLandingPage;
