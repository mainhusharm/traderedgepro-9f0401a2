import { Canvas } from '@react-three/fiber';
import { Suspense, useRef, useEffect, useState } from 'react';
import { Environment, Preload } from '@react-three/drei';
import Logo3DAntimatter from './Logo3DAntimatter';

interface LogoSceneAntimatterProps {
  className?: string;
  scale?: number;
  interactive?: boolean;
}

const LogoSceneAntimatter = ({ className = '', scale = 1, interactive = true }: LogoSceneAntimatterProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mousePosition = useRef({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!interactive) return;

    const handleMouseMove = (event: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        mousePosition.current = {
          x: (event.clientX - centerX) / rect.width,
          y: (event.clientY - centerY) / rect.height,
        };
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [interactive]);

  if (!isVisible) {
    return <div className={className} ref={containerRef} />;
  }

  return (
    <div ref={containerRef} className={className}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 40 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 5, 5]} intensity={0.8} color="#ffffff" />
          <pointLight position={[-3, -3, 2]} intensity={0.4} color="#818cf8" />
          <pointLight position={[3, 3, 2]} intensity={0.3} color="#a5b4fc" />

          <Logo3DAntimatter 
            scale={scale} 
            mousePosition={interactive ? mousePosition : undefined} 
          />

          <Environment preset="night" />
          <Preload all />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default LogoSceneAntimatter;
