import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Preload, Environment } from '@react-three/drei';
import TradingNexusCore from './TradingNexusCore';
import TradingParticles from './TradingParticles';
import { 
  CandlestickCluster, 
  TrendLineParticles, 
  DataNodes, 
  ShieldFragments,
  SuccessArrows 
} from './TradingElements';

interface TradingBackgroundSceneProps {
  scrollProgressRef: React.MutableRefObject<number>;
}

const TradingBackgroundScene = ({ scrollProgressRef }: TradingBackgroundSceneProps) => {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 7], fov: 45 }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance"
        }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          {/* Ambient lighting */}
          <ambientLight intensity={0.25} />

          {/* Main directional light */}
          <directionalLight position={[10, 10, 5]} intensity={0.4} color="#ffffff" />

          {/* Colored accent lights */}
          <pointLight position={[-6, 4, 4]} intensity={0.4} color="#00ff88" />
          <pointLight position={[6, -4, 4]} intensity={0.4} color="#00d2ff" />
          <pointLight position={[0, 0, -5]} intensity={0.2} color="#0066ff" />
          <pointLight position={[-4, -3, 3]} intensity={0.3} color="#ff6b00" />
          <pointLight position={[4, 3, 3]} intensity={0.3} color="#00d2ff" />

          {/* Central Trading Nexus Core */}
          <TradingNexusCore scrollProgress={scrollProgressRef} />

          {/* Full-width particle system */}
          <TradingParticles scrollProgress={scrollProgressRef} />

          {/* Left side trading elements */}
          <CandlestickCluster position={[-3.5, 1.5, -1]} scrollProgress={scrollProgressRef} />
          <TrendLineParticles position={[-4, -1, 0]} scrollProgress={scrollProgressRef} ascending />
          <ShieldFragments position={[-3, 0, 0.5]} scrollProgress={scrollProgressRef} />

          {/* Right side trading elements */}
          <DataNodes position={[3.5, 0.5, -0.5]} scrollProgress={scrollProgressRef} />
          <SuccessArrows position={[4, -1.5, 0]} scrollProgress={scrollProgressRef} />
          <TrendLineParticles position={[3.5, 1.5, 0]} scrollProgress={scrollProgressRef} ascending={false} />
          <CandlestickCluster position={[4, -0.5, -1]} scrollProgress={scrollProgressRef} />

          {/* Additional depth elements */}
          <DataNodes position={[-2.5, -2, 1]} scrollProgress={scrollProgressRef} />
          <ShieldFragments position={[2.5, 2, 0.5]} scrollProgress={scrollProgressRef} />

          {/* Environment for reflections */}
          <Environment preset="night" />

          <Preload all />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default TradingBackgroundScene;
