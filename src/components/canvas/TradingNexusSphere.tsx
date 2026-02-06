import { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere, Trail, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

interface TradingNexusSphereProps {
  scrollProgress: React.MutableRefObject<number>;
  mousePosition: React.MutableRefObject<{ x: number; y: number }>;
  isIntroComplete: boolean;
}

const TradingNexusSphere = ({ scrollProgress, mousePosition, isIntroComplete }: TradingNexusSphereProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const innerMeshRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);
  const outerShellRef = useRef<THREE.Mesh>(null);
  const { viewport } = useThree();

  // Lerped values for smooth transitions
  const lerpedValues = useRef({
    positionX: 0,
    positionY: 0,
    positionZ: 0,
    scale: 0,
    distort: 0.3,
    rotationY: 0,
    rotationX: 0,
    mouseInfluenceX: 0,
    mouseInfluenceY: 0,
    introProgress: 0,
  });

  // Create orbital particle positions
  const particleCount = 500;
  const particlePositions = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 1.5 + Math.random() * 0.8;
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
    }
    return positions;
  }, []);

  // Data stream particles (vertical lines)
  const dataStreamCount = 100;
  const dataStreamPositions = useMemo(() => {
    const positions = new Float32Array(dataStreamCount * 3);
    for (let i = 0; i < dataStreamCount; i++) {
      const angle = (i / dataStreamCount) * Math.PI * 2;
      const radius = 2.2 + Math.random() * 0.3;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 3;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
    }
    return positions;
  }, []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const scroll = scrollProgress.current;
    const lerp = THREE.MathUtils.lerp;

    // Intro animation progress
    const introTarget = isIntroComplete ? 1 : 0;
    lerpedValues.current.introProgress = lerp(lerpedValues.current.introProgress, introTarget, 0.03);
    const intro = lerpedValues.current.introProgress;

    // Define scroll-based target values
    let targetX = 0;
    let targetY = 0;
    let targetZ = 0;
    let targetScale = 1.2;
    let targetDistort = 0.2;

    if (scroll < 0.1) {
      // Hero section - centered, prominent
      targetX = viewport.width > 10 ? 2 : 0;
      targetY = 0;
      targetZ = 0;
      targetScale = 1.2;
      targetDistort = 0.15;
    } else if (scroll < 0.25) {
      // Prop firms section - move right
      targetX = viewport.width > 10 ? 3 : 1.5;
      targetY = -0.5;
      targetZ = -1;
      targetScale = 0.9;
      targetDistort = 0.25;
    } else if (scroll < 0.4) {
      // Features section - move left
      targetX = viewport.width > 10 ? -3 : -1.5;
      targetY = 0.3;
      targetZ = -0.5;
      targetScale = 0.8;
      targetDistort = 0.4;
    } else if (scroll < 0.55) {
      // Signal feed - right side
      targetX = viewport.width > 10 ? 3.5 : 2;
      targetY = 0.5;
      targetZ = -1;
      targetScale = 0.7;
      targetDistort = 0.35;
    } else if (scroll < 0.7) {
      // Risk calculator - center-right
      targetX = viewport.width > 10 ? 2 : 1;
      targetY = -0.3;
      targetZ = -0.5;
      targetScale = 0.75;
      targetDistort = 0.3;
    } else if (scroll < 0.85) {
      // Pricing section - left
      targetX = viewport.width > 10 ? -2.5 : -1.5;
      targetY = 0.5;
      targetZ = -1;
      targetScale = 0.85;
      targetDistort = 0.25;
    } else {
      // CTA section - center, larger
      targetX = 0;
      targetY = 0;
      targetZ = 0.5;
      targetScale = 1.3;
      targetDistort = 0.1;
    }

    // Mouse influence (subtle parallax)
    const mouseX = mousePosition.current.x;
    const mouseY = mousePosition.current.y;
    lerpedValues.current.mouseInfluenceX = lerp(lerpedValues.current.mouseInfluenceX, mouseX * 0.3, 0.05);
    lerpedValues.current.mouseInfluenceY = lerp(lerpedValues.current.mouseInfluenceY, mouseY * 0.2, 0.05);

    // Smooth lerping for all values
    const lerpFactor = 0.04;
    lerpedValues.current.positionX = lerp(lerpedValues.current.positionX, targetX, lerpFactor);
    lerpedValues.current.positionY = lerp(lerpedValues.current.positionY, targetY, lerpFactor);
    lerpedValues.current.positionZ = lerp(lerpedValues.current.positionZ, targetZ, lerpFactor);
    lerpedValues.current.scale = lerp(lerpedValues.current.scale, targetScale * intro, lerpFactor);
    lerpedValues.current.distort = lerp(lerpedValues.current.distort, targetDistort, lerpFactor);
    lerpedValues.current.rotationY += 0.002;

    if (groupRef.current) {
      // Apply lerped position with mouse influence
      groupRef.current.position.x = lerpedValues.current.positionX + lerpedValues.current.mouseInfluenceX;
      groupRef.current.position.y = lerpedValues.current.positionY + lerpedValues.current.mouseInfluenceY;
      groupRef.current.position.z = lerpedValues.current.positionZ;
      
      // Apply rotation with scroll and mouse influence
      groupRef.current.rotation.y = lerpedValues.current.rotationY + scroll * Math.PI * 1.5;
      groupRef.current.rotation.x = Math.sin(time * 0.15) * 0.1 + lerpedValues.current.mouseInfluenceY * 0.2;
      
      // Apply scale with intro animation
      groupRef.current.scale.setScalar(lerpedValues.current.scale);
    }
    
    if (innerMeshRef.current) {
      innerMeshRef.current.rotation.y = -time * 0.2;
      innerMeshRef.current.rotation.z = time * 0.15;
      // Pulsing effect
      const pulse = 1 + Math.sin(time * 2) * 0.05;
      innerMeshRef.current.scale.setScalar(pulse);
    }

    if (particlesRef.current) {
      particlesRef.current.rotation.y = time * 0.08;
      particlesRef.current.rotation.x = time * 0.04;
    }

    if (ring1Ref.current) {
      ring1Ref.current.rotation.z = time * 0.3;
      ring1Ref.current.rotation.x = Math.sin(time * 0.5) * 0.1;
    }

    if (ring2Ref.current) {
      ring2Ref.current.rotation.z = -time * 0.2;
      ring2Ref.current.rotation.y = Math.cos(time * 0.3) * 0.15;
    }

    if (ring3Ref.current) {
      ring3Ref.current.rotation.z = time * 0.15;
      ring3Ref.current.rotation.x = time * 0.1;
    }

    if (outerShellRef.current) {
      const material = outerShellRef.current.material as THREE.MeshStandardMaterial;
      if (material) {
        material.opacity = 0.08 + Math.sin(time) * 0.03;
      }
    }
  });

  return (
    <Float speed={1} rotationIntensity={0.05} floatIntensity={0.2}>
      <group ref={groupRef}>
        {/* Outer glass shell */}
        <Sphere ref={outerShellRef} args={[2, 64, 64]}>
          <meshStandardMaterial
            color="#00d2ff"
            transparent
            opacity={0.08}
            roughness={0}
            metalness={1}
            side={THREE.BackSide}
          />
        </Sphere>

        {/* Main distorted sphere */}
        <Sphere args={[1.5, 64, 64]}>
          <MeshDistortMaterial
            color="#0088ff"
            transparent
            opacity={0.2}
            distort={lerpedValues.current.distort}
            speed={2.5}
            roughness={0.1}
            metalness={0.9}
          />
        </Sphere>

        {/* Inner glowing core */}
        <Sphere ref={innerMeshRef} args={[0.6, 32, 32]}>
          <meshStandardMaterial
            color="#00d2ff"
            emissive="#00d2ff"
            emissiveIntensity={1.5}
            transparent
            opacity={0.9}
          />
        </Sphere>

        {/* Central energy core */}
        <Sphere args={[0.3, 16, 16]}>
          <meshStandardMaterial
            color="#ffffff"
            emissive="#00ffff"
            emissiveIntensity={3}
          />
        </Sphere>

        {/* Orbital particles */}
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
            size={0.02}
            color="#00d2ff"
            transparent
            opacity={0.6}
            sizeAttenuation
            blending={THREE.AdditiveBlending}
          />
        </points>

        {/* Data stream particles */}
        <points>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={dataStreamCount}
              array={dataStreamPositions}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial
            size={0.03}
            color="#00ff88"
            transparent
            opacity={0.4}
            sizeAttenuation
            blending={THREE.AdditiveBlending}
          />
        </points>

        {/* Primary orbital ring */}
        <mesh ref={ring1Ref} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.8, 0.015, 16, 100]} />
          <meshStandardMaterial
            color="#00d2ff"
            emissive="#00d2ff"
            emissiveIntensity={2}
            transparent
            opacity={0.6}
          />
        </mesh>

        {/* Secondary orbital ring */}
        <mesh ref={ring2Ref} rotation={[Math.PI / 3, Math.PI / 4, 0]}>
          <torusGeometry args={[1.6, 0.012, 16, 100]} />
          <meshStandardMaterial
            color="#00ff88"
            emissive="#00ff88"
            emissiveIntensity={1.5}
            transparent
            opacity={0.5}
          />
        </mesh>

        {/* Tertiary orbital ring */}
        <mesh ref={ring3Ref} rotation={[Math.PI / 6, -Math.PI / 3, Math.PI / 5]}>
          <torusGeometry args={[2.1, 0.01, 16, 100]} />
          <meshStandardMaterial
            color="#ff6b00"
            emissive="#ff6b00"
            emissiveIntensity={1}
            transparent
            opacity={0.4}
          />
        </mesh>

        {/* Sparkles for magic effect */}
        <Sparkles
          count={50}
          scale={4}
          size={2}
          speed={0.4}
          color="#00d2ff"
        />
      </group>
    </Float>
  );
};

export default TradingNexusSphere;
