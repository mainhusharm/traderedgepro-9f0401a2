import { Suspense, useRef, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Preload, Environment, Stars, PerformanceMonitor } from '@react-three/drei';
import TradingNexusSphere from './TradingNexusSphere';

interface Premium3DSceneProps {
  scrollProgressRef: React.MutableRefObject<number>;
  mousePositionRef: React.MutableRefObject<{ x: number; y: number }>;
  isIntroComplete: boolean;
  onSceneReady?: () => void;
}

const Premium3DScene = ({ scrollProgressRef, mousePositionRef, isIntroComplete, onSceneReady }: Premium3DSceneProps) => {
  const [dpr, setDpr] = useState(1.5);

  useEffect(() => {
    // Signal scene is ready after a brief delay
    const timer = setTimeout(() => {
      onSceneReady?.();
    }, 500);
    return () => clearTimeout(timer);
  }, [onSceneReady]);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 50 }}
        dpr={dpr}
        gl={{ 
          antialias: true, 
          alpha: true,
          powerPreference: "high-performance",
          stencil: false,
        }}
        style={{ background: 'transparent' }}
      >
        <PerformanceMonitor
          onIncline={() => setDpr(2)}
          onDecline={() => setDpr(1)}
        />
        
        <Suspense fallback={null}>
          {/* Ambient lighting */}
          <ambientLight intensity={0.2} />
          
          {/* Main directional light */}
          <directionalLight position={[10, 10, 5]} intensity={0.4} color="#ffffff" />
          
          {/* Colored accent lights for dramatic effect */}
          <pointLight position={[-8, 5, 5]} intensity={0.6} color="#00d2ff" distance={20} />
          <pointLight position={[8, -5, 5]} intensity={0.4} color="#0066ff" distance={20} />
          <pointLight position={[0, 8, -5]} intensity={0.3} color="#00ff88" distance={15} />
          <pointLight position={[0, -8, 5]} intensity={0.2} color="#ff6b00" distance={15} />
          
          {/* Spotlight for dramatic hero effect */}
          <spotLight
            position={[0, 10, 10]}
            angle={0.3}
            penumbra={1}
            intensity={0.5}
            color="#ffffff"
          />
          
          {/* Background stars */}
          <Stars
            radius={100}
            depth={50}
            count={3000}
            factor={4}
            saturation={0}
            fade
            speed={0.5}
          />
          
          {/* Main 3D Sphere */}
          <TradingNexusSphere 
            scrollProgress={scrollProgressRef}
            mousePosition={mousePositionRef}
            isIntroComplete={isIntroComplete}
          />
          
          {/* Environment for reflections */}
          <Environment preset="night" />
          
          <Preload all />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default Premium3DScene;
