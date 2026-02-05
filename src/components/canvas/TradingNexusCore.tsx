import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere } from '@react-three/drei';
import * as THREE from 'three';

interface TradingNexusCoreProps {
  scrollProgress: React.MutableRefObject<number>;
}

const TradingNexusCore = ({ scrollProgress }: TradingNexusCoreProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const outerMeshRef = useRef<THREE.Mesh>(null);
  const innerMeshRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);

  const lerpedValues = useRef({
    positionX: 0,
    positionY: 0,
    scale: 0.7,
    distort: 0.25,
    rotationY: 0,
    colorHue: 0.52,
  });

  // Core particles
  const particleCount = 300;
  const particlePositions = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 1.3 + Math.random() * 0.4;
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
    }
    return positions;
  }, []);

  // Particle colors (multi-colored)
  const particleColors = useMemo(() => {
    const colors = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const type = Math.random();
      if (type > 0.7) {
        // Green
        colors[i * 3] = 0;
        colors[i * 3 + 1] = 1;
        colors[i * 3 + 2] = 0.53;
      } else if (type > 0.3) {
        // Cyan
        colors[i * 3] = 0;
        colors[i * 3 + 1] = 0.82;
        colors[i * 3 + 2] = 1;
      } else {
        // Blue
        colors[i * 3] = 0;
        colors[i * 3 + 1] = 0.4;
        colors[i * 3 + 2] = 1;
      }
    }
    return colors;
  }, []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const scroll = scrollProgress.current;
    const lerp = THREE.MathUtils.lerp;

    // Dynamic positioning based on scroll
    let targetX = 0;
    let targetY = 0;
    let targetScale = 0.7;
    let targetDistort = 0.25;

    if (scroll < 0.15) {
      targetX = 0;
      targetY = 0;
      targetScale = 0.7;
      targetDistort = 0.25;
    } else if (scroll < 0.3) {
      targetX = 1.5;
      targetY = -0.3;
      targetScale = 0.55;
      targetDistort = 0.35;
    } else if (scroll < 0.45) {
      targetX = -1.8;
      targetY = 0;
      targetScale = 0.45;
      targetDistort = 0.5;
    } else if (scroll < 0.6) {
      targetX = 1.5;
      targetY = 0.3;
      targetScale = 0.5;
      targetDistort = 0.4;
    } else if (scroll < 0.75) {
      targetX = 1.8;
      targetY = -0.5;
      targetScale = 0.4;
      targetDistort = 0.45;
    } else if (scroll < 0.9) {
      targetX = -1.5;
      targetY = 0.5;
      targetScale = 0.55;
      targetDistort = 0.3;
    } else {
      targetX = 0;
      targetY = 0;
      targetScale = 0.75;
      targetDistort = 0.2;
    }

    // Smooth transitions
    const lerpFactor = 0.04;
    lerpedValues.current.positionX = lerp(lerpedValues.current.positionX, targetX, lerpFactor);
    lerpedValues.current.positionY = lerp(lerpedValues.current.positionY, targetY, lerpFactor);
    lerpedValues.current.scale = lerp(lerpedValues.current.scale, targetScale, lerpFactor);
    lerpedValues.current.distort = lerp(lerpedValues.current.distort, targetDistort, lerpFactor);
    lerpedValues.current.rotationY += 0.002;

    if (groupRef.current) {
      groupRef.current.position.x = lerpedValues.current.positionX;
      groupRef.current.position.y = lerpedValues.current.positionY;
      groupRef.current.rotation.y = lerpedValues.current.rotationY + scroll * Math.PI * 2;
      groupRef.current.rotation.x = Math.sin(time * 0.15) * 0.08;
      groupRef.current.scale.setScalar(lerpedValues.current.scale);
    }

    if (innerMeshRef.current) {
      innerMeshRef.current.rotation.y = -time * 0.12;
      innerMeshRef.current.rotation.z = time * 0.08;
    }

    if (particlesRef.current) {
      particlesRef.current.rotation.y = time * 0.04;
      particlesRef.current.rotation.x = time * 0.02;
    }

    if (ring1Ref.current) ring1Ref.current.rotation.z = time * 0.25;
    if (ring2Ref.current) ring2Ref.current.rotation.z = -time * 0.18;
    if (ring3Ref.current) ring3Ref.current.rotation.z = time * 0.12;
  });

  return (
    <Float speed={1.2} rotationIntensity={0.08} floatIntensity={0.25}>
      <group ref={groupRef}>
        {/* Outer glass sphere */}
        <Sphere args={[1.6, 64, 64]} ref={outerMeshRef}>
          <MeshDistortMaterial
            color="#00d2ff"
            transparent
            opacity={0.12}
            distort={lerpedValues.current.distort}
            speed={1.5}
            roughness={0}
            metalness={0.9}
          />
        </Sphere>

        {/* Secondary layer */}
        <Sphere args={[1.35, 48, 48]}>
          <meshStandardMaterial
            color="#0066ff"
            transparent
            opacity={0.08}
            roughness={0.2}
            metalness={0.8}
          />
        </Sphere>

        {/* Inner glowing core */}
        <Sphere ref={innerMeshRef} args={[0.85, 32, 32]}>
          <meshStandardMaterial
            color="#00d2ff"
            emissive="#00d2ff"
            emissiveIntensity={0.9}
            transparent
            opacity={0.7}
          />
        </Sphere>

        {/* Energy core */}
        <Sphere args={[0.4, 16, 16]}>
          <meshStandardMaterial
            color="#ffffff"
            emissive="#00ff88"
            emissiveIntensity={1.2}
            transparent
            opacity={0.9}
          />
        </Sphere>

        {/* Multi-colored particles */}
        <points ref={particlesRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={particleCount}
              array={particlePositions}
              itemSize={3}
            />
            <bufferAttribute
              attach="attributes-color"
              count={particleCount}
              array={particleColors}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial
            size={0.035}
            vertexColors
            transparent
            opacity={0.85}
            sizeAttenuation
          />
        </points>

        {/* Primary ring */}
        <mesh ref={ring1Ref} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[2, 0.025, 16, 100]} />
          <meshStandardMaterial
            color="#00d2ff"
            emissive="#00d2ff"
            emissiveIntensity={2.5}
            transparent
            opacity={0.6}
          />
        </mesh>

        {/* Secondary ring */}
        <mesh ref={ring2Ref} rotation={[Math.PI / 3, Math.PI / 4, 0]}>
          <torusGeometry args={[1.7, 0.018, 16, 100]} />
          <meshStandardMaterial
            color="#00ff88"
            emissive="#00ff88"
            emissiveIntensity={2}
            transparent
            opacity={0.5}
          />
        </mesh>

        {/* Tertiary ring */}
        <mesh ref={ring3Ref} rotation={[Math.PI / 2.5, -Math.PI / 6, 0]}>
          <torusGeometry args={[2.2, 0.012, 16, 100]} />
          <meshStandardMaterial
            color="#0066ff"
            emissive="#0066ff"
            emissiveIntensity={1.8}
            transparent
            opacity={0.4}
          />
        </mesh>
      </group>
    </Float>
  );
};

export default TradingNexusCore;
