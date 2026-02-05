import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface TradingParticlesProps {
  scrollProgress: React.MutableRefObject<number>;
}

const TradingParticles = ({ scrollProgress }: TradingParticlesProps) => {
  const leftParticlesRef = useRef<THREE.Points>(null);
  const rightParticlesRef = useRef<THREE.Points>(null);
  const centralParticlesRef = useRef<THREE.Points>(null);

  const leftCount = 150;
  const rightCount = 150;
  const centralCount = 100;

  // Left side particles - ascending trend
  const leftPositions = useMemo(() => {
    const positions = new Float32Array(leftCount * 3);
    for (let i = 0; i < leftCount; i++) {
      positions[i * 3] = -3 - Math.random() * 2; // x: left side
      positions[i * 3 + 1] = (Math.random() - 0.5) * 6; // y: full height
      positions[i * 3 + 2] = (Math.random() - 0.5) * 3; // z: some depth
    }
    return positions;
  }, []);

  const leftColors = useMemo(() => {
    const colors = new Float32Array(leftCount * 3);
    for (let i = 0; i < leftCount; i++) {
      const isGreen = Math.random() > 0.3;
      if (isGreen) {
        colors[i * 3] = 0;
        colors[i * 3 + 1] = 1;
        colors[i * 3 + 2] = 0.53;
      } else {
        colors[i * 3] = 0;
        colors[i * 3 + 1] = 0.82;
        colors[i * 3 + 2] = 1;
      }
    }
    return colors;
  }, []);

  // Right side particles - data flow
  const rightPositions = useMemo(() => {
    const positions = new Float32Array(rightCount * 3);
    for (let i = 0; i < rightCount; i++) {
      positions[i * 3] = 3 + Math.random() * 2; // x: right side
      positions[i * 3 + 1] = (Math.random() - 0.5) * 6; // y: full height
      positions[i * 3 + 2] = (Math.random() - 0.5) * 3; // z: some depth
    }
    return positions;
  }, []);

  const rightColors = useMemo(() => {
    const colors = new Float32Array(rightCount * 3);
    for (let i = 0; i < rightCount; i++) {
      const type = Math.random();
      if (type > 0.6) {
        // Cyan
        colors[i * 3] = 0;
        colors[i * 3 + 1] = 0.82;
        colors[i * 3 + 2] = 1;
      } else if (type > 0.3) {
        // Green
        colors[i * 3] = 0;
        colors[i * 3 + 1] = 1;
        colors[i * 3 + 2] = 0.53;
      } else {
        // Orange (alerts)
        colors[i * 3] = 1;
        colors[i * 3 + 1] = 0.42;
        colors[i * 3 + 2] = 0;
      }
    }
    return colors;
  }, []);

  // Central connecting particles
  const centralPositions = useMemo(() => {
    const positions = new Float32Array(centralCount * 3);
    for (let i = 0; i < centralCount; i++) {
      const angle = (i / centralCount) * Math.PI * 2;
      const radius = 2 + Math.random() * 1.5;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 4;
      positions[i * 3 + 2] = Math.sin(angle) * radius * 0.5;
    }
    return positions;
  }, []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const scroll = scrollProgress.current;

    // Left particles - flow upward and spread on scroll
    if (leftParticlesRef.current) {
      const positions = leftParticlesRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < leftCount; i++) {
        // Upward flow
        positions[i * 3 + 1] += 0.008;
        if (positions[i * 3 + 1] > 3) positions[i * 3 + 1] = -3;
        
        // Spread on scroll
        positions[i * 3] = -3 - Math.random() * 2 - scroll * 2;
      }
      leftParticlesRef.current.geometry.attributes.position.needsUpdate = true;
      leftParticlesRef.current.rotation.y = time * 0.05;
    }

    // Right particles - flow downward and spread on scroll
    if (rightParticlesRef.current) {
      const positions = rightParticlesRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < rightCount; i++) {
        // Downward flow (data stream)
        positions[i * 3 + 1] -= 0.006;
        if (positions[i * 3 + 1] < -3) positions[i * 3 + 1] = 3;
        
        // Spread on scroll
        positions[i * 3] = 3 + Math.random() * 2 + scroll * 2;
      }
      rightParticlesRef.current.geometry.attributes.position.needsUpdate = true;
      rightParticlesRef.current.rotation.y = -time * 0.05;
    }

    // Central particles - orbit and scale
    if (centralParticlesRef.current) {
      centralParticlesRef.current.rotation.y = time * 0.1;
      centralParticlesRef.current.rotation.x = Math.sin(time * 0.2) * 0.1;
      
      // Expand on scroll
      const scale = 1 + scroll * 0.8;
      centralParticlesRef.current.scale.setScalar(scale);
    }
  });

  return (
    <group>
      {/* Left side particles */}
      <points ref={leftParticlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={leftCount}
            array={leftPositions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={leftCount}
            array={leftColors}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.04}
          vertexColors
          transparent
          opacity={0.7}
          sizeAttenuation
        />
      </points>

      {/* Right side particles */}
      <points ref={rightParticlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={rightCount}
            array={rightPositions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={rightCount}
            array={rightColors}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.04}
          vertexColors
          transparent
          opacity={0.7}
          sizeAttenuation
        />
      </points>

      {/* Central connecting particles */}
      <points ref={centralParticlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={centralCount}
            array={centralPositions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.03}
          color="#00d2ff"
          transparent
          opacity={0.5}
          sizeAttenuation
        />
      </points>
    </group>
  );
};

export default TradingParticles;
