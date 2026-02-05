import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere } from '@react-three/drei';
import * as THREE from 'three';

interface NexusSphereProps {
  scrollProgress: React.MutableRefObject<number>;
}

const NexusSphere = ({ scrollProgress }: NexusSphereProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const innerMeshRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);

  // Lerped values for smooth transitions
  const lerpedValues = useRef({
    positionX: 0,
    positionY: 0,
    scale: 1,
    distort: 0.3,
    rotationY: 0,
    colorHue: 0.52, // Cyan hue
  });

  // Create particle positions
  const particleCount = 200;
  const particlePositions = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 1.2 + Math.random() * 0.3;
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
    }
    return positions;
  }, []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const scroll = scrollProgress.current;
    const lerp = THREE.MathUtils.lerp;

    // Define scroll-based target values - SMALLER sphere sizes
    let targetX = 0;
    let targetY = 0;
    let targetScale = 0.6;
    let targetDistort = 0.2;
    let targetHue = 0.52; // Cyan

    if (scroll < 0.15) {
      // Hero section - centered, small
      targetX = 0;
      targetY = 0;
      targetScale = 0.6;
      targetDistort = 0.2;
      targetHue = 0.52;
    } else if (scroll < 0.3) {
      // Prop firms section - move right
      targetX = 1.5;
      targetY = -0.3;
      targetScale = 0.5;
      targetDistort = 0.3;
      targetHue = 0.52;
    } else if (scroll < 0.45) {
      // Features section - move left
      targetX = -1.8;
      targetY = 0;
      targetScale = 0.4;
      targetDistort = 0.6;
      targetHue = 0.55;
    } else if (scroll < 0.6) {
      // Signal feed - right side
      targetX = 1.5;
      targetY = 0.3;
      targetScale = 0.45;
      targetDistort = 0.4;
      targetHue = 0.45;
    } else if (scroll < 0.75) {
      // Risk calculator - bottom right
      targetX = 1.8;
      targetY = -0.5;
      targetScale = 0.35;
      targetDistort = 0.5;
      targetHue = 0.5;
    } else if (scroll < 0.9) {
      // Pricing section - left
      targetX = -1.5;
      targetY = 0.5;
      targetScale = 0.5;
      targetDistort = 0.3;
      targetHue = 0.48;
    } else {
      // CTA section - center, slightly larger
      targetX = 0;
      targetY = 0;
      targetScale = 0.7;
      targetDistort = 0.15;
      targetHue = 0.52;
    }

    // Smooth lerping for all values (this is the key to fluid motion)
    const lerpFactor = 0.05;
    lerpedValues.current.positionX = lerp(lerpedValues.current.positionX, targetX, lerpFactor);
    lerpedValues.current.positionY = lerp(lerpedValues.current.positionY, targetY, lerpFactor);
    lerpedValues.current.scale = lerp(lerpedValues.current.scale, targetScale, lerpFactor);
    lerpedValues.current.distort = lerp(lerpedValues.current.distort, targetDistort, lerpFactor);
    lerpedValues.current.colorHue = lerp(lerpedValues.current.colorHue, targetHue, lerpFactor);
    lerpedValues.current.rotationY += 0.003; // Continuous slow rotation

    if (groupRef.current) {
      // Apply lerped position
      groupRef.current.position.x = lerpedValues.current.positionX;
      groupRef.current.position.y = lerpedValues.current.positionY;
      
      // Apply rotation (continuous + scroll influence)
      groupRef.current.rotation.y = lerpedValues.current.rotationY + scroll * Math.PI * 2;
      groupRef.current.rotation.x = Math.sin(time * 0.2) * 0.1;
      
      // Apply scale
      groupRef.current.scale.setScalar(lerpedValues.current.scale);
    }
    
    if (innerMeshRef.current) {
      innerMeshRef.current.rotation.y = -time * 0.15;
      innerMeshRef.current.rotation.z = time * 0.1;
    }

    if (particlesRef.current) {
      particlesRef.current.rotation.y = time * 0.05;
      particlesRef.current.rotation.x = time * 0.03;
    }

    if (ring1Ref.current) {
      ring1Ref.current.rotation.z = time * 0.2;
    }

    if (ring2Ref.current) {
      ring2Ref.current.rotation.z = -time * 0.15;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.3}>
      <group ref={groupRef}>
        {/* Outer glass sphere with dynamic distort */}
        <Sphere args={[1.5, 64, 64]}>
          <MeshDistortMaterial
            color="#00d2ff"
            transparent
            opacity={0.15}
            distort={lerpedValues.current.distort}
            speed={2}
            roughness={0}
            metalness={0.8}
          />
        </Sphere>

        {/* Inner glowing core */}
        <Sphere ref={innerMeshRef} args={[0.8, 32, 32]}>
          <meshStandardMaterial
            color="#00d2ff"
            emissive="#00d2ff"
            emissiveIntensity={0.8}
            transparent
            opacity={0.6}
          />
        </Sphere>

        {/* Inner particles */}
        <points ref={particlesRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={particleCount}
              array={particlePositions}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial
            size={0.03}
            color="#00d2ff"
            transparent
            opacity={0.8}
            sizeAttenuation
          />
        </points>

        {/* Glow effect ring */}
        <mesh ref={ring1Ref} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.8, 0.02, 16, 100]} />
          <meshStandardMaterial
            color="#00d2ff"
            emissive="#00d2ff"
            emissiveIntensity={2}
            transparent
            opacity={0.5}
          />
        </mesh>

        {/* Second ring at angle */}
        <mesh ref={ring2Ref} rotation={[Math.PI / 3, Math.PI / 4, 0]}>
          <torusGeometry args={[1.6, 0.015, 16, 100]} />
          <meshStandardMaterial
            color="#00a8cc"
            emissive="#00a8cc"
            emissiveIntensity={1.5}
            transparent
            opacity={0.4}
          />
        </mesh>
      </group>
    </Float>
  );
};

export default NexusSphere;
