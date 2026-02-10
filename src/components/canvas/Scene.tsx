import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Preload, Environment } from '@react-three/drei';
import NeuralNetwork from './NeuralNetwork';

interface SceneProps {
  scrollProgressRef: React.MutableRefObject<number>;
  isVisible?: boolean;
}

const Scene = ({ scrollProgressRef, isVisible = true }: SceneProps) => {
  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none transition-all duration-700 ease-in-out"
      style={{
        opacity: isVisible ? 1 : 0,
        visibility: isVisible ? 'visible' : 'hidden',
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 6], fov: 45 }}
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
          <ambientLight intensity={0.4} />
          
          {/* Main directional light with shadows */}
          <directionalLight 
            position={[10, 10, 5]} 
            intensity={1} 
            color="#ffffff"
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-camera-far={50}
            shadow-camera-left={-10}
            shadow-camera-right={10}
            shadow-camera-top={10}
            shadow-camera-bottom={-10}
          />
          
          {/* Colored accent lights */}
          <pointLight position={[-5, 5, 5]} intensity={0.8} color="#00d2ff" />
          <pointLight position={[5, -5, 5]} intensity={0.5} color="#00ff88" />
          <pointLight position={[0, 0, -5]} intensity={0.3} color="#ff4757" />
          <spotLight position={[0, 5, 5]} intensity={0.5} angle={0.5} penumbra={1} color="#00d2ff" />
          
          {/* Neural Network with scroll-connected ref */}
          <NeuralNetwork scrollProgress={scrollProgressRef} />
          
          {/* Environment for reflections */}
          <Environment preset="night" />
          
          <Preload all />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default Scene;
