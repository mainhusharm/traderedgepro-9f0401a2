import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CookieConsentBanner from '@/components/common/CookieConsentBanner';
import SEO from '@/components/common/SEO';
import AntimatterHero from '@/components/antimatter/AntimatterHero';
import AntimatterParticleSphere from '@/components/antimatter/AntimatterParticleSphere';

// Import all sections from home page
import PropFirmLogos from '@/components/sections/PropFirmLogos';
import TrustSignals from '@/components/sections/TrustSignals';
import BentoFeatures from '@/components/sections/BentoFeatures';
import VideoShowcase from '@/components/sections/VideoShowcase';
import WhyWereDifferent from '@/components/sections/WhyWereDifferent';
import SignalFeed from '@/components/sections/SignalFeed';
import RiskCalculator from '@/components/sections/RiskCalculator';
import HowItWorks from '@/components/sections/HowItWorks';
import CommunitySection from '@/components/sections/CommunitySection';
import PricingSection from '@/components/sections/PricingSection';
import FAQSection from '@/components/sections/FAQSection';
import CTASection from '@/components/sections/CTASection';
import RiskDisclaimer from '@/components/sections/RiskDisclaimer';
import LaunchOfferBanner from '@/components/marketing/LaunchOfferBanner';

gsap.registerPlugin(ScrollTrigger);

const AntimatterLanding = () => {
  const mainRef = useRef<HTMLDivElement>(null);
  const scrollProgressRef = useRef(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      scrollProgressRef.current = window.scrollY / scrollHeight;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // GSAP scroll-triggered animations
  useEffect(() => {
    if (!isLoaded || !mainRef.current) return;

    // Animate header entrance
    gsap.fromTo('header',
      { opacity: 0, y: -30 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: 0.1 }
    );

    // Reveal animations for sections
    const sections = mainRef.current.querySelectorAll('[data-reveal]');
    sections.forEach((section) => {
      gsap.fromTo(section,
        { opacity: 0, y: 60 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          }
        }
      );
    });

    // Stagger animations for cards
    const cardGroups = mainRef.current.querySelectorAll('[data-stagger-cards]');
    cardGroups.forEach((group) => {
      const cards = group.querySelectorAll('[data-card]');
      gsap.fromTo(cards,
        { opacity: 0, y: 40, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: group,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          }
        }
      );
    });

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, [isLoaded]);

  const faqSchema = {
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Is this an EA or Signal service?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: "TraderEdge Pro is a signal service powered by AI. Unlike EAs, our signals don't auto-trade—you receive recommendations with full AI reasoning, and you decide whether to execute.",
        },
      },
      {
        '@type': 'Question',
        name: 'Does this violate Prop Firm rules?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: "No. TraderEdge Pro is 100% compliant with all major prop firm rules. You're manually executing trades based on our signals—there's no account sharing or automated trading.",
        },
      },
      {
        '@type': 'Question',
        name: "What's the minimum account size?",
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Our signals work with any account size. Our AI calculates optimal position sizes based on your specific risk parameters.',
        },
      },
      {
        '@type': 'Question',
        name: "What's your win rate?",
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Our verified win rate is 87% across all signals over the past 12 months with full transparency in our public track record.',
        },
      },
    ],
  };

  return (
    <>
      <SEO
        title="Pass Your Prop Firm Challenge with AI | TraderEdge Pro"
        description="Get a funded trading account with AI precision. Pass your FTMO challenge with 87% win rate trading signals, prop firm drawdown protection, and 24/7 AI coaching."
        keywords="prop firm challenge, pass prop firm challenge, FTMO challenge, funded trading account, trading signals, AI trading, prop firm drawdown protection, get funded trading"
        canonicalUrl="https://traderedgepro.com"
        schema={faqSchema}
      />
      {/* Dark background - matches Antimatter */}
        <div className="relative min-h-screen bg-[#0a0a0f] overflow-x-hidden">
        <AntimatterParticleSphere scrollProgressRef={scrollProgressRef} />
        
        {/* Content */}
        <motion.div 
          ref={mainRef}
          className={`relative z-10 transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: isLoaded ? 1 : 0 }}
        >
          <Header />
          
          {/* Launch Offer Banner */}
          <LaunchOfferBanner />
          
          <main>
            {/* Hero Section */}
            <AntimatterHero />
            
            {/* Prop Firm Logos */}
            <div data-reveal className="antimatter-section">
              <PropFirmLogos />
            </div>
            
            {/* Trust Signals */}
            <div data-reveal className="antimatter-section">
              <TrustSignals />
            </div>
            
            {/* Features Grid */}
            <div data-reveal data-stagger-cards className="antimatter-section">
              <BentoFeatures />
            </div>
            
            {/* Video Showcase */}
            <div data-reveal className="antimatter-section">
              <VideoShowcase />
            </div>
            
            {/* Why We're Different */}
            <div data-reveal className="antimatter-section">
              <WhyWereDifferent />
            </div>
            
            {/* Live Signal Feed */}
            <div data-reveal className="antimatter-section">
              <SignalFeed />
            </div>
            
            {/* Risk Calculator */}
            <div data-reveal className="antimatter-section">
              <RiskCalculator />
            </div>
            
            {/* How It Works */}
            <div data-reveal className="antimatter-section">
              <HowItWorks />
            </div>
            
            {/* Community */}
            <div data-reveal className="antimatter-section">
              <CommunitySection />
            </div>
            
            {/* Pricing */}
            <div data-reveal data-stagger-cards className="antimatter-section">
              <PricingSection />
            </div>
            
            {/* FAQ */}
            <div data-reveal className="antimatter-section">
              <FAQSection />
            </div>
            
            {/* Final CTA */}
            <div data-reveal className="antimatter-section">
              <CTASection />
            </div>
            
            {/* Risk Disclaimer */}
            <RiskDisclaimer />
          </main>
          
          <Footer />
        </motion.div>
      </div>
      
      <CookieConsentBanner />
    </>
  );
};

export default AntimatterLanding;