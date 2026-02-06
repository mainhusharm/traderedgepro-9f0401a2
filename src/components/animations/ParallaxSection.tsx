import { useEffect, useRef, ReactNode } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface ParallaxSectionProps {
  children: ReactNode;
  className?: string;
  speed?: number; // 0.5 = slower than scroll, 1.5 = faster than scroll
  direction?: 'up' | 'down';
}

const ParallaxSection = ({ 
  children, 
  className = '', 
  speed = 0.5,
  direction = 'up'
}: ParallaxSectionProps) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current || !contentRef.current) return;

    const section = sectionRef.current;
    const content = contentRef.current;
    const yMovement = direction === 'up' ? -100 * speed : 100 * speed;

    gsap.to(content, {
      y: yMovement,
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      },
    });

    return () => {
      ScrollTrigger.getAll().forEach(trigger => {
        if (trigger.vars.trigger === section) {
          trigger.kill();
        }
      });
    };
  }, [speed, direction]);

  return (
    <div ref={sectionRef} className={`overflow-hidden ${className}`}>
      <div ref={contentRef}>
        {children}
      </div>
    </div>
  );
};

export default ParallaxSection;
