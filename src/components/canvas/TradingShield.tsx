import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, MeshReflectorMaterial } from '@react-three/drei';
import * as THREE from 'three';

interface TradingShieldProps {
  scrollProgress: React.MutableRefObject<number>;
}

const TradingShield = ({ scrollProgress }: TradingShieldProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const shieldRef = useRef<THREE.Mesh>(null);
  const pulseRingRef = useRef<THREE.Mesh>(null);

  // Create 3D shield geometry with depth
  const shieldGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    const w = 1.2;
    const h = 1.5;
    
    shape.moveTo(0, h);
    shape.quadraticCurveTo(w * 0.8, h * 0.9, w, h * 0.5);
    shape.quadraticCurveTo(w, 0, 0, -h * 0.3);
    shape.quadraticCurveTo(-w, 0, -w, h * 0.5);
    shape.quadraticCurveTo(-w * 0.8, h * 0.9, 0, h);
    
    const extrudeSettings = {
      steps: 2,
      depth: 0.3,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.05,
      bevelOffset: 0,
      bevelSegments: 5
    };
    
    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }, []);

  // Chart line points for 3D tubes
  const chartPoints = useMemo(() => [
    new THREE.Vector3(-0.7, -0.1, 0.35),
    new THREE.Vector3(-0.4, 0.1, 0.35),
    new THREE.Vector3(-0.1, -0.05, 0.35),
    new THREE.Vector3(0.2, 0.3, 0.35),
    new THREE.Vector3(0.5, 0.15, 0.35),
    new THREE.Vector3(0.7, 0.5, 0.35),
  ], []);

  const chartCurve = useMemo(() => {
    return new THREE.CatmullRomCurve3(chartPoints);
  }, [chartPoints]);

  // Lerped values
  const lerpedValues = useRef({
    positionX: 0,
    positionY: -0.8,
    scale: 1.2,
    rotationY: 0,
  });

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const scroll = scrollProgress.current;
    const lerp = THREE.MathUtils.lerp;

    let targetX = 0;
    let targetY = -0.5;
    let targetScale = 1.2;

    if (scroll < 0.15) {
      targetX = 0;
      targetY = -0.8;
      targetScale = 1.2;
    } else if (scroll < 0.3) {
      targetX = 2;
      targetY = 0;
      targetScale = 0.9;
    } else if (scroll < 0.45) {
      targetX = -2;
      targetY = 0;
      targetScale = 0.8;
    } else if (scroll < 0.6) {
      targetX = 2;
      targetY = 0.3;
      targetScale = 0.85;
    } else if (scroll < 0.75) {
      targetX = -2;
      targetY = -0.3;
      targetScale = 0.75;
    } else if (scroll < 0.9) {
      targetX = 2;
      targetY = 0.5;
      targetScale = 0.9;
    } else {
      targetX = 0;
      targetY = -0.5;
      targetScale = 1;
    }

    const lerpFactor = 0.05;
    lerpedValues.current.positionX = lerp(lerpedValues.current.positionX, targetX, lerpFactor);
    lerpedValues.current.positionY = lerp(lerpedValues.current.positionY, targetY, lerpFactor);
    lerpedValues.current.scale = lerp(lerpedValues.current.scale, targetScale, lerpFactor);
    lerpedValues.current.rotationY += 0.008; // Continuous rotation

    if (groupRef.current) {
      groupRef.current.position.x = lerpedValues.current.positionX;
      groupRef.current.position.y = lerpedValues.current.positionY;
      groupRef.current.rotation.y = lerpedValues.current.rotationY;
      groupRef.current.rotation.x = Math.sin(time * 0.3) * 0.1;
      groupRef.current.scale.setScalar(lerpedValues.current.scale);
    }

    if (pulseRingRef.current) {
      const pulse = Math.sin(time * 2) * 0.5 + 0.5;
      pulseRingRef.current.scale.setScalar(1 + pulse * 0.15);
      (pulseRingRef.current.material as THREE.MeshStandardMaterial).opacity = 0.5 - pulse * 0.3;
    }
  });

  return (
    <Float speed={1} rotationIntensity={0.05} floatIntensity={0.15}>
      <group ref={groupRef}>
        {/* Main 3D Shield with reflective material */}
        <mesh 
          ref={shieldRef} 
          geometry={shieldGeometry}
          castShadow
          receiveShadow
          position={[0, 0, -0.15]}
        >
          <meshPhysicalMaterial
            color="#0a2540"
            metalness={0.9}
            roughness={0.1}
            envMapIntensity={1.5}
            clearcoat={1}
            clearcoatRoughness={0.1}
            reflectivity={1}
          />
        </mesh>

        {/* Shield edge glow */}
        <mesh geometry={shieldGeometry} position={[0, 0, -0.14]}>
          <meshStandardMaterial
            color="#00d2ff"
            emissive="#00d2ff"
            emissiveIntensity={0.5}
            transparent
            opacity={0.3}
            side={THREE.BackSide}
          />
        </mesh>

        {/* 3D Chart line tube */}
        <mesh castShadow>
          <tubeGeometry args={[chartCurve, 64, 0.03, 8, false]} />
          <meshPhysicalMaterial
            color="#00ff88"
            emissive="#00ff88"
            emissiveIntensity={0.8}
            metalness={0.5}
            roughness={0.2}
          />
        </mesh>

        {/* Chart data points as 3D spheres */}
        {chartPoints.map((pos, i) => (
          <mesh key={i} position={pos} castShadow>
            <sphereGeometry args={[0.06, 16, 16]} />
            <meshPhysicalMaterial
              color="#00ff88"
              emissive="#00ff88"
              emissiveIntensity={1}
              metalness={0.8}
              roughness={0.1}
            />
          </mesh>
        ))}

        {/* Rotating pulse ring */}
        <mesh ref={pulseRingRef} position={[0, 0.3, 0.2]}>
          <torusGeometry args={[1.4, 0.02, 16, 100]} />
          <meshStandardMaterial
            color="#00d2ff"
            emissive="#00d2ff"
            emissiveIntensity={1}
            transparent
            opacity={0.5}
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>

        {/* Second rotating ring */}
        <mesh position={[0, 0.3, 0.1]} rotation={[Math.PI / 4, 0, 0]}>
          <torusGeometry args={[1.6, 0.015, 16, 100]} />
          <meshStandardMaterial
            color="#00a8cc"
            emissive="#00a8cc"
            emissiveIntensity={0.8}
            transparent
            opacity={0.4}
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>

        {/* Inner glow sphere */}
        <mesh position={[0, 0.3, 0.15]}>
          <sphereGeometry args={[0.3, 32, 32]} />
          <meshPhysicalMaterial
            color="#00d2ff"
            emissive="#00d2ff"
            emissiveIntensity={0.6}
            transparent
            opacity={0.4}
            metalness={0.5}
            roughness={0.3}
          />
        </mesh>
      </group>

      {/* Reflective floor plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.5, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <MeshReflectorMaterial
          blur={[300, 100]}
          resolution={1024}
          mixBlur={1}
          mixStrength={50}
          roughness={1}
          depthScale={1.2}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#050505"
          metalness={0.5}
          mirror={0.5}
        />
      </mesh>
    </Float>
  );
};

export default TradingShield;