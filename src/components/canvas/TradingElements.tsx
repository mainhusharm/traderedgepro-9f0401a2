import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface CandlestickClusterProps {
  position: [number, number, number];
  scrollProgress: React.MutableRefObject<number>;
}

export const CandlestickCluster = ({ position, scrollProgress }: CandlestickClusterProps) => {
  const groupRef = useRef<THREE.Group>(null);
  
  const candlesticks = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => ({
      x: i * 0.25 - 0.5,
      height: 0.3 + Math.random() * 0.4,
      isGreen: Math.random() > 0.4,
      wickHeight: 0.1 + Math.random() * 0.2,
    }));
  }, []);

  useFrame((state) => {
    if (!groupRef.current) return;
    const time = state.clock.getElapsedTime();
    const scroll = scrollProgress.current;
    
    groupRef.current.position.x = position[0] + Math.sin(time * 0.5) * 0.1;
    groupRef.current.position.y = position[1] + Math.cos(time * 0.3) * 0.15;
    groupRef.current.rotation.y = time * 0.2;
    groupRef.current.rotation.z = Math.sin(time * 0.4) * 0.1;
    
    // Move outward on scroll
    const scrollOffset = scroll * 2;
    groupRef.current.position.x += position[0] > 0 ? scrollOffset : -scrollOffset;
  });

  return (
    <group ref={groupRef} position={position}>
      {candlesticks.map((candle, i) => (
        <group key={i} position={[candle.x, 0, 0]}>
          {/* Body */}
          <mesh position={[0, candle.height / 2, 0]}>
            <boxGeometry args={[0.08, candle.height, 0.08]} />
            <meshStandardMaterial
              color={candle.isGreen ? '#00ff88' : '#ff4444'}
              emissive={candle.isGreen ? '#00ff88' : '#ff4444'}
              emissiveIntensity={0.5}
              transparent
              opacity={0.8}
            />
          </mesh>
          {/* Wick */}
          <mesh position={[0, candle.height + candle.wickHeight / 2, 0]}>
            <boxGeometry args={[0.02, candle.wickHeight, 0.02]} />
            <meshStandardMaterial
              color={candle.isGreen ? '#00ff88' : '#ff4444'}
              emissive={candle.isGreen ? '#00ff88' : '#ff4444'}
              emissiveIntensity={0.3}
              transparent
              opacity={0.6}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
};

interface TrendLineParticlesProps {
  position: [number, number, number];
  scrollProgress: React.MutableRefObject<number>;
  ascending?: boolean;
}

export const TrendLineParticles = ({ position, scrollProgress, ascending = true }: TrendLineParticlesProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const pointsRef = useRef<THREE.Points>(null);
  
  const particleCount = 50;
  const positions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const t = i / particleCount;
      pos[i * 3] = t * 2 - 1;
      pos[i * 3 + 1] = (ascending ? t : 1 - t) * 1.5 + (Math.random() - 0.5) * 0.1;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
    }
    return pos;
  }, [ascending]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const time = state.clock.getElapsedTime();
    const scroll = scrollProgress.current;
    
    groupRef.current.position.x = position[0] + Math.sin(time * 0.3) * 0.2;
    groupRef.current.position.y = position[1] + Math.cos(time * 0.4) * 0.1;
    
    // Spread out on scroll
    const scrollOffset = scroll * 1.5;
    groupRef.current.position.x += position[0] > 0 ? scrollOffset : -scrollOffset;
    
    if (pointsRef.current) {
      pointsRef.current.rotation.z = Math.sin(time * 0.5) * 0.1;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particleCount}
            array={positions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.04}
          color={ascending ? '#00ff88' : '#ff6b00'}
          transparent
          opacity={0.9}
          sizeAttenuation
        />
      </points>
    </group>
  );
};

interface DataNodesProps {
  position: [number, number, number];
  scrollProgress: React.MutableRefObject<number>;
}

export const DataNodes = ({ position, scrollProgress }: DataNodesProps) => {
  const groupRef = useRef<THREE.Group>(null);
  
  const nodes = useMemo(() => {
    return Array.from({ length: 8 }, () => ({
      x: (Math.random() - 0.5) * 2,
      y: (Math.random() - 0.5) * 2,
      z: (Math.random() - 0.5) * 1,
      size: 0.03 + Math.random() * 0.04,
      speed: 0.5 + Math.random() * 0.5,
    }));
  }, []);

  useFrame((state) => {
    if (!groupRef.current) return;
    const time = state.clock.getElapsedTime();
    const scroll = scrollProgress.current;
    
    groupRef.current.rotation.y = time * 0.1;
    groupRef.current.rotation.x = Math.sin(time * 0.2) * 0.1;
    
    // Expand outward on scroll
    const scale = 1 + scroll * 0.5;
    groupRef.current.scale.setScalar(scale);
    
    groupRef.current.position.x = position[0] + (position[0] > 0 ? scroll * 1.5 : -scroll * 1.5);
  });

  return (
    <group ref={groupRef} position={position}>
      {nodes.map((node, i) => (
        <mesh key={i} position={[node.x, node.y, node.z]}>
          <sphereGeometry args={[node.size, 8, 8]} />
          <meshStandardMaterial
            color="#00d2ff"
            emissive="#00d2ff"
            emissiveIntensity={1}
            transparent
            opacity={0.8}
          />
        </mesh>
      ))}
    </group>
  );
};

interface ShieldFragmentsProps {
  position: [number, number, number];
  scrollProgress: React.MutableRefObject<number>;
}

export const ShieldFragments = ({ position, scrollProgress }: ShieldFragmentsProps) => {
  const groupRef = useRef<THREE.Group>(null);
  
  const fragments = useMemo(() => {
    return Array.from({ length: 4 }, (_, i) => ({
      angle: (i / 4) * Math.PI * 2,
      distance: 0.4 + Math.random() * 0.2,
      size: 0.15 + Math.random() * 0.1,
      rotationSpeed: 0.3 + Math.random() * 0.3,
    }));
  }, []);

  useFrame((state) => {
    if (!groupRef.current) return;
    const time = state.clock.getElapsedTime();
    const scroll = scrollProgress.current;
    
    groupRef.current.rotation.z = time * 0.15;
    groupRef.current.position.x = position[0] + Math.sin(time * 0.4) * 0.1;
    groupRef.current.position.y = position[1] + Math.cos(time * 0.3) * 0.1;
    
    // Spread on scroll
    groupRef.current.position.x += position[0] > 0 ? scroll * 1.2 : -scroll * 1.2;
  });

  return (
    <group ref={groupRef} position={position}>
      {fragments.map((frag, i) => (
        <mesh
          key={i}
          position={[
            Math.cos(frag.angle) * frag.distance,
            Math.sin(frag.angle) * frag.distance,
            0,
          ]}
          rotation={[0, 0, frag.angle]}
        >
          <planeGeometry args={[frag.size, frag.size * 1.2]} />
          <meshStandardMaterial
            color="#0066ff"
            emissive="#0066ff"
            emissiveIntensity={0.6}
            transparent
            opacity={0.5}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
};

interface SuccessArrowsProps {
  position: [number, number, number];
  scrollProgress: React.MutableRefObject<number>;
}

export const SuccessArrows = ({ position, scrollProgress }: SuccessArrowsProps) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const time = state.clock.getElapsedTime();
    const scroll = scrollProgress.current;
    
    groupRef.current.position.y = position[1] + Math.sin(time * 0.8) * 0.2;
    groupRef.current.position.x = position[0] + (position[0] > 0 ? scroll * 1.5 : -scroll * 1.5);
  });

  return (
    <group ref={groupRef} position={position}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, i * 0.25, 0]} rotation={[0, 0, 0]}>
          <coneGeometry args={[0.08, 0.2, 4]} />
          <meshStandardMaterial
            color="#00ff88"
            emissive="#00ff88"
            emissiveIntensity={0.8 - i * 0.2}
            transparent
            opacity={0.8 - i * 0.15}
          />
        </mesh>
      ))}
    </group>
  );
};
