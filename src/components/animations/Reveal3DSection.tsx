import { useEffect, useRef, ReactNode } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface Reveal3DSectionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  stagger?: boolean;
  staggerCards?: boolean;
}

const Reveal3DSection = ({ children, className = '', delay = 0, stagger = true, staggerCards = false }: Reveal3DSectionProps) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current || !contentRef.current) return;

    const section = sectionRef.current;
    const content = contentRef.current;

    // Set initial state - rotated and scaled down
    gsap.set(content, {
      rotateX: 15,
      scale: 0.85,
      opacity: 0,
      transformPerspective: 1000,
      transformOrigin: 'center bottom',
    });

    // Create scroll-triggered animation with scrub for reversing
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top 85%',
        end: 'top 20%',
        toggleActions: 'play reverse play reverse',
        scrub: 0.5,
      }
    });

    tl.to(content, {
      rotateX: 0,
      scale: 1,
      opacity: 1,
      duration: 1,
      delay: delay,
      ease: 'power4.out',
    });

    // Stagger children if enabled
    if (stagger) {
      const revealChildren = content.querySelectorAll('[data-reveal]');
      if (revealChildren.length > 0) {
        gsap.set(revealChildren, {
          y: 30,
          opacity: 0,
        });

        gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: 'top 70%',
            end: 'top 30%',
            toggleActions: 'play reverse play reverse',
            scrub: 0.5,
          }
        }).to(revealChildren, {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.15,
          ease: 'power3.out',
        });
      }
    }

    // Stagger cards with individual reveal
    if (staggerCards) {
      const cards = content.querySelectorAll('[data-card]');
      if (cards.length > 0) {
        gsap.set(cards, {
          y: 60,
          opacity: 0,
          scale: 0.9,
        });

        gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: 'top 75%',
            end: 'top 25%',
            toggleActions: 'play reverse play reverse',
            scrub: 0.8,
          }
        }).to(cards, {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.6,
          stagger: 0.2,
          ease: 'power3.out',
        });
      }
    }

    return () => {
      ScrollTrigger.getAll().forEach(trigger => {
        if (trigger.vars.trigger === section) {
          trigger.kill();
        }
      });
    };
  }, [delay, stagger, staggerCards]);

  return (
    <div 
      ref={sectionRef} 
      className={`perspective-1000 ${className}`}
      style={{ perspective: '1000px' }}
    >
      <div ref={contentRef} style={{ transformStyle: 'preserve-3d' }}>
        {children}
      </div>
    </div>
  );
};

export default Reveal3DSection;
