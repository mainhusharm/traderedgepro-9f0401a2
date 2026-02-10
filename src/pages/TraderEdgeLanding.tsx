import { useEffect, useRef, useState, useCallback, Suspense, lazy } from 'react';
import { AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Hero from '@/components/sections/Hero';
import PropFirmLogos from '@/components/sections/PropFirmLogos';
import BentoFeatures from '@/components/sections/BentoFeatures';
import VideoShowcase from '@/components/sections/VideoShowcase';
import SignalFeed from '@/components/sections/SignalFeed';
import RiskCalculator from '@/components/sections/RiskCalculator';
import HowItWorks from '@/components/sections/HowItWorks';
import PricingSection from '@/components/sections/PricingSection';
import FAQSection from '@/components/sections/FAQSection';
import CTASection from '@/components/sections/CTASection';
import IntroLoader from '@/components/animations/IntroLoader';
import ScrollFollowingLine from '@/components/animations/ScrollFollowingLine';
import Reveal3DSection from '@/components/animations/Reveal3DSection';
import GlowingDivider from '@/components/animations/GlowingDivider';
import TrustSignals from '@/components/sections/TrustSignals';
import WhyWereDifferent from '@/components/sections/WhyWereDifferent';

import CommunitySection from '@/components/sections/CommunitySection';
import RiskDisclaimer from '@/components/sections/RiskDisclaimer';
import CookieConsentBanner from '@/components/common/CookieConsentBanner';
import LaunchGiveawayPopup from '@/components/marketing/LaunchGiveawayPopup';
import LaunchOfferBanner from '@/components/marketing/LaunchOfferBanner';

// Lazy load 3D Scene for performance
const Scene = lazy(() => import('@/components/canvas/Scene'));

gsap.registerPlugin(ScrollTrigger);

// Loading placeholder for 3D scene
const SceneLoader = () => (
  <div className="fixed inset-0 bg-[#020202]" />
);

const TraderEdgeLanding = () => {
  const scrollProgressRef = useRef(0);
  const mainRef = useRef<HTMLDivElement>(null);
  const videoShowcaseRef = useRef<HTMLDivElement>(null);
  const [isIntroComplete, setIsIntroComplete] = useState(false);
  const [isSceneReady, setIsSceneReady] = useState(false);
  const [isSceneVisible, setIsSceneVisible] = useState(true);

  useEffect(() => {
    // Scene ready after brief delay
    const timer = setTimeout(() => setIsSceneReady(true), 800);
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

  // Use IntersectionObserver to detect when VideoShowcase leaves viewport
  useEffect(() => {
    const element = videoShowcaseRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Show sphere when VideoShowcase is intersecting (visible)
          // Hide sphere when VideoShowcase is not intersecting AND has scrolled past (top < 0)
          const isAboveViewport = entry.boundingClientRect.bottom < 0;
          setIsSceneVisible(!isAboveViewport);
        });
      },
      {
        threshold: 0,
      }
    );

    observer.observe(element);

    // Also add a scroll listener as backup
    const handleScrollVisibility = () => {
      if (element) {
        const rect = element.getBoundingClientRect();
        const isAboveViewport = rect.bottom < 0;
        setIsSceneVisible(!isAboveViewport);
      }
    };

    window.addEventListener('scroll', handleScrollVisibility, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScrollVisibility);
    };
  }, [isIntroComplete]);

  // GSAP entrance animations after intro
  useEffect(() => {
    if (!isIntroComplete || !mainRef.current) return;

    // Animate header
    gsap.fromTo('header',
      { opacity: 0, y: -50 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power4.out', delay: 0.2 }
    );

    // Animate hero content with stagger
    const heroElements = mainRef.current.querySelectorAll('[data-animate]');
    gsap.fromTo(heroElements,
      { opacity: 0, y: 40, filter: 'blur(8px)' },
      { 
        opacity: 1, 
        y: 0, 
        filter: 'blur(0px)',
        duration: 1,
        stagger: 0.12,
        ease: 'power4.out',
        delay: 0.4
      }
    );
  }, [isIntroComplete]);

  const handleIntroComplete = useCallback(() => {
    setIsIntroComplete(true);
  }, []);

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

      <div className="relative min-h-screen bg-[#020202] overflow-x-hidden">
        {/* Fixed 3D Background - Lazy Loaded */}
        <Suspense fallback={<SceneLoader />}>
          <Scene scrollProgressRef={scrollProgressRef} isVisible={isSceneVisible} />
        </Suspense>
        
        {/* Scroll Following Line */}
        {isIntroComplete && <ScrollFollowingLine />}
        
        {/* Content */}
        <div 
          ref={mainRef}
          className={`relative z-10 transition-opacity duration-500 ${isIntroComplete ? 'opacity-100' : 'opacity-0'}`}
        >
          <Header />
          
          {/* Launch Offer Banner */}
          <LaunchOfferBanner />
          
          <main>
            <Hero />
            
            <Reveal3DSection>
              <PropFirmLogos />
            </Reveal3DSection>
            
            <GlowingDivider />
            
            <Reveal3DSection delay={0.1}>
              <TrustSignals />
            </Reveal3DSection>
            
            <GlowingDivider />
            
            <Reveal3DSection delay={0.1} staggerCards>
              <BentoFeatures />
            </Reveal3DSection>
            
            <GlowingDivider />
            
            <div ref={videoShowcaseRef}>
              <Reveal3DSection delay={0.1}>
                <VideoShowcase />
              </Reveal3DSection>
            </div>
            
            <GlowingDivider />
            
            <Reveal3DSection delay={0.1}>
              <WhyWereDifferent />
            </Reveal3DSection>
            
            <GlowingDivider />
            
            <Reveal3DSection delay={0.1}>
              <SignalFeed />
            </Reveal3DSection>
            
            <GlowingDivider />
            
            <Reveal3DSection delay={0.1}>
              <RiskCalculator />
            </Reveal3DSection>
            
            <GlowingDivider />
            
            <Reveal3DSection delay={0.1}>
              <HowItWorks />
            </Reveal3DSection>
            
            <GlowingDivider />
            
            <Reveal3DSection delay={0.1}>
              <CommunitySection />
            </Reveal3DSection>
            
            <GlowingDivider />
            
            <Reveal3DSection delay={0.1} staggerCards>
              <PricingSection />
            </Reveal3DSection>
            
            <GlowingDivider />
            
            <Reveal3DSection delay={0.1}>
              <FAQSection />
            </Reveal3DSection>
            
            <GlowingDivider />
            
            <Reveal3DSection delay={0.1}>
              <CTASection />
            </Reveal3DSection>
            
            <RiskDisclaimer />
          </main>
          
          <Footer />
        </div>
      </div>
      
      {/* Cookie Consent Banner */}
      <CookieConsentBanner />
      
      {/* Launch Giveaway Popup */}
      {isIntroComplete && <LaunchGiveawayPopup />}
    </>
  );
};

export default TraderEdgeLanding;
