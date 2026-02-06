import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const ScrollFollowingLine = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const glowRef = useRef<SVGPathElement>(null);
  const dotRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    if (!pathRef.current || !glowRef.current || !dotRef.current) return;

    const path = pathRef.current;
    const glow = glowRef.current;
    const dot = dotRef.current;
    
    // Get the total length of the path
    const pathLength = path.getTotalLength();
    
    // Set up the initial state
    gsap.set([path, glow], {
      strokeDasharray: pathLength,
      strokeDashoffset: pathLength,
    });

    // Create the scroll animation
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: 'body',
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1,
      }
    });

    tl.to([path, glow], {
      strokeDashoffset: 0,
      ease: 'none',
      duration: 1,
    });

    // Animate the dot along the path
    gsap.to({}, {
      scrollTrigger: {
        trigger: 'body',
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.5,
        onUpdate: (self) => {
          const progress = self.progress;
          const point = path.getPointAtLength(progress * pathLength);
          gsap.set(dot, {
            attr: { cx: point.x, cy: point.y }
          });
        }
      }
    });

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  return (
    <svg
      ref={svgRef}
      className="fixed left-8 top-0 h-screen w-4 z-40 pointer-events-none hidden lg:block"
      viewBox="0 0 16 1000"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="hsl(var(--primary))" />
          <stop offset="50%" stopColor="#00ff88" />
          <stop offset="100%" stopColor="hsl(var(--accent))" />
        </linearGradient>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      
      {/* Background track */}
      <path
        d="M 8 20 L 8 980"
        fill="none"
        stroke="rgba(255,255,255,0.1)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      
      {/* Glow effect layer */}
      <path
        ref={glowRef}
        d="M 8 20 L 8 980"
        fill="none"
        stroke="url(#lineGradient)"
        strokeWidth="6"
        strokeLinecap="round"
        filter="url(#glow)"
        opacity="0.5"
      />
      
      {/* Main animated line */}
      <path
        ref={pathRef}
        d="M 8 20 L 8 980"
        fill="none"
        stroke="url(#lineGradient)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      
      {/* Animated dot */}
      <circle
        ref={dotRef}
        cx="8"
        cy="20"
        r="6"
        fill="hsl(var(--primary))"
        filter="url(#glow)"
      />
      
      {/* Start marker */}
      <circle
        cx="8"
        cy="20"
        r="3"
        fill="hsl(var(--primary))"
        opacity="0.5"
      />
      
      {/* End marker */}
      <circle
        cx="8"
        cy="980"
        r="3"
        fill="hsl(var(--accent))"
        opacity="0.5"
      />
    </svg>
  );
};

export default ScrollFollowingLine;
