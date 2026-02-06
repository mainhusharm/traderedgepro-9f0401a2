import { Suspense, useRef, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Preload, Environment, PerformanceMonitor } from '@react-three/drei';
import Logo3D from './Logo3D';

interface LogoSceneProps {
  className?: string;
  scale?: number;
  interactive?: boolean;
}

const LogoScene = ({ className = '', scale = 2, interactive = true }: LogoSceneProps) => {
  const [dpr, setDpr] = useState(1.5);
  const mousePositionRef = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!interactive) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      mousePositionRef.current = {
        x: (e.clientX - centerX) / (rect.width / 2),
        y: -(e.clientY - centerY) / (rect.height / 2),
      };
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [interactive]);

  return (
    <div ref={containerRef} className={`${className}`}>
      <Canvas
        camera={{ position: [0, 0, 3.5], fov: 45 }}
        dpr={dpr}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          stencil: false,
        }}
        style={{ background: 'transparent' }}
      >
        <PerformanceMonitor
          onIncline={() => setDpr(2)}
          onDecline={() => setDpr(1)}
        />

        <Suspense fallback={null}>
          {/* Clean, focused lighting */}
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={0.7} color="#ffffff" />
          
          {/* Subtle accent lights */}
          <pointLight position={[-2, 2, 3]} intensity={0.4} color="#00d2ff" distance={8} />
          <pointLight position={[2, -1, 3]} intensity={0.3} color="#00ff88" distance={6} />

          {/* Main 3D Logo */}
          <Logo3D 
            scale={scale} 
            mousePosition={interactive ? mousePositionRef : undefined} 
          />

          {/* Environment for reflections */}
          <Environment preset="night" />

          <Preload all />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default LogoScene;
