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
import ComparisonSection from '@/components/sections/ComparisonSection';
import LeadCapture from '@/components/sections/LeadCapture';
import CommunitySection from '@/components/sections/CommunitySection';
import PricingSection from '@/components/sections/PricingSection';
import FAQSection from '@/components/sections/FAQSection';
import CTASection from '@/components/sections/CTASection';
import RiskDisclaimer from '@/components/sections/RiskDisclaimer';
import MT5BotsSection from '@/components/sections/MT5BotsSection';
import PropFirmsSection from '@/components/sections/PropFirmsSection';

gsap.registerPlugin(ScrollTrigger);

const AntimatterLanding = () => {
  const mainRef = useRef<HTMLDivElement>(null);
  const videoShowcaseRef = useRef<HTMLDivElement>(null);
  const scrollProgressRef = useRef(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSphereVisible, setIsSphereVisible] = useState(true);

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

  // Track scroll position to hide sphere after VideoShowcase section
  useEffect(() => {
    const handleScrollVisibility = () => {
      const element = videoShowcaseRef.current;
      const scrollPercent = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);

      if (element) {
        const rect = element.getBoundingClientRect();
        // Hide sphere when VideoShowcase section's bottom reaches 30% of viewport from top
        const shouldHide = rect.bottom < window.innerHeight * 0.3;
        setIsSphereVisible(!shouldHide);
      } else {
        // Fallback: hide after scrolling ~30% of the page
        setIsSphereVisible(scrollPercent < 0.30);
      }
    };

    handleScrollVisibility();
    window.addEventListener('scroll', handleScrollVisibility, { passive: true });
    const timer = setTimeout(handleScrollVisibility, 500);

    return () => {
      window.removeEventListener('scroll', handleScrollVisibility);
      clearTimeout(timer);
    };
  }, [isLoaded]);

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
        name: 'What is TraderEdge Pro?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: "TraderEdge Pro is a performance system for funded traders — combining AI decision support, risk enforcement, and psychology frameworks. You stay in control while our system ensures disciplined trading.",
        },
      },
      {
        '@type': 'Question',
        name: 'Does this violate Prop Firm rules?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: "No. TraderEdge Pro is 100% compliant with all major prop firm rules. You're manually executing trades — there's no account sharing or automated trading that could violate terms.",
        },
      },
      {
        '@type': 'Question',
        name: "What's the minimum account size?",
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Our system works with any account size. The AI calculates optimal position sizes based on your specific risk parameters and prop firm rules.',
        },
      },
      {
        '@type': 'Question',
        name: "Why do most traders fail prop challenges?",
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Most traders fail due to emotional decisions — overtrading after losses, breaking rules under pressure, inconsistent risk management. TraderEdge Pro is built to prevent these behavioral mistakes.',
        },
      },
    ],
  };

  return (
    <>
      <SEO
        title="The Performance System for Funded Traders | TraderEdge Pro"
        description="Stop blowing prop firm challenges. TraderEdge Pro combines AI decision support, risk discipline, and psychology frameworks to help you pass challenges and stay funded."
        keywords="prop firm challenge, pass prop firm challenge, FTMO challenge, funded trading account, trading discipline, AI trading, prop firm rules, get funded trading, trading psychology"
        canonicalUrl="https://traderedgepro.com"
        schema={faqSchema}
      />
      {/* Dark background - matches Antimatter */}
        <div className="relative min-h-screen bg-[#0a0a0f] overflow-x-hidden">
        {/* 3D Sphere - visibility controlled based on scroll position */}
        <div
          style={{
            opacity: isSphereVisible ? 1 : 0,
            visibility: isSphereVisible ? 'visible' : 'hidden',
            transition: 'opacity 0.5s ease-out, visibility 0.5s ease-out',
          }}
        >
          <AntimatterParticleSphere scrollProgressRef={scrollProgressRef} />
        </div>
        
        {/* Content */}
        <motion.div 
          ref={mainRef}
          className={`relative z-10 transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: isLoaded ? 1 : 0 }}
        >
          <Header />

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
            <div ref={videoShowcaseRef} data-reveal className="antimatter-section">
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
            
            {/* Comparison Section */}
            <div data-reveal className="antimatter-section">
              <ComparisonSection />
            </div>

            {/* How It Works */}
            <div data-reveal className="antimatter-section">
              <HowItWorks />
            </div>

            {/* Prop Firms Comparison */}
            <div data-reveal className="antimatter-section">
              <PropFirmsSection />
            </div>

            {/* Community */}
            <div data-reveal className="antimatter-section">
              <CommunitySection />
            </div>

            {/* MT5 Bots - Secondary Platform */}
            <div data-reveal className="antimatter-section">
              <MT5BotsSection />
            </div>
            
            {/* Lead Capture */}
            <div data-reveal className="antimatter-section">
              <LeadCapture />
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