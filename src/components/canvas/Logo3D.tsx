import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

interface Logo3DProps {
  scale?: number;
  mousePosition?: React.MutableRefObject<{ x: number; y: number }>;
}

const Logo3D = ({ scale = 1, mousePosition }: Logo3DProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const chartLineRef = useRef<THREE.Mesh>(null);

  const lerpedRotation = useRef({ x: 0, y: 0 });

  // Shield shape - protection badge
  const shieldShape = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 1.2);
    shape.lineTo(1, 0.8);
    shape.lineTo(1, -0.3);
    shape.lineTo(0, -1.2);
    shape.lineTo(-1, -0.3);
    shape.lineTo(-1, 0.8);
    shape.closePath();
    return shape;
  }, []);

  // Bold ascending chart - trading success
  const chartGeometry = useMemo(() => {
    const points = [
      new THREE.Vector3(-0.6, -0.5, 0.15),
      new THREE.Vector3(-0.3, -0.25, 0.15),
      new THREE.Vector3(0, -0.35, 0.15),
      new THREE.Vector3(0.3, 0.15, 0.15),
      new THREE.Vector3(0.55, 0.6, 0.15),
    ];
    const curve = new THREE.CatmullRomCurve3(points);
    return new THREE.TubeGeometry(curve, 32, 0.06, 12, false);
  }, []);

  useFrame((state) => {
    const time = state.clock.elapsedTime;

    const targetRotationX = mousePosition?.current?.y ? mousePosition.current.y * 0.08 : 0;
    const targetRotationY = mousePosition?.current?.x ? mousePosition.current.x * 0.08 : 0;

    lerpedRotation.current.x = THREE.MathUtils.lerp(lerpedRotation.current.x, targetRotationX, 0.05);
    lerpedRotation.current.y = THREE.MathUtils.lerp(lerpedRotation.current.y, targetRotationY, 0.05);

    if (groupRef.current) {
      groupRef.current.rotation.x = lerpedRotation.current.x;
      groupRef.current.rotation.y = time * 0.08 + lerpedRotation.current.y;
    }

    if (chartLineRef.current) {
      const material = chartLineRef.current.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = 1.5 + Math.sin(time * 2) * 0.4;
    }
  });

  const extrudeSettings = {
    depth: 0.15,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.03,
    bevelSegments: 4,
  };

  return (
    <Float speed={1.2} rotationIntensity={0.03} floatIntensity={0.15}>
      <group ref={groupRef} scale={scale}>
        
        {/* Shield base - dark metallic */}
        <mesh>
          <extrudeGeometry args={[shieldShape, extrudeSettings]} />
          <meshStandardMaterial
            color="#080810"
            metalness={0.95}
            roughness={0.1}
            envMapIntensity={1.5}
          />
        </mesh>

        {/* Shield glowing border */}
        <mesh position={[0, 0, -0.01]} scale={1.05}>
          <extrudeGeometry args={[shieldShape, { ...extrudeSettings, depth: 0.02 }]} />
          <meshStandardMaterial
            color="#00d2ff"
            emissive="#00d2ff"
            emissiveIntensity={1}
            transparent
            opacity={0.9}
          />
        </mesh>

        {/* Chart line - main trading symbol */}
        <mesh ref={chartLineRef} geometry={chartGeometry}>
          <meshStandardMaterial
            color="#00d2ff"
            emissive="#00d2ff"
            emissiveIntensity={2}
            metalness={0.6}
            roughness={0.2}
          />
        </mesh>

        {/* Arrow head at chart top */}
        <mesh position={[0.55, 0.75, 0.15]} rotation={[0, 0, 0.4]}>
          <coneGeometry args={[0.12, 0.25, 4]} />
          <meshStandardMaterial
            color="#00ff88"
            emissive="#00ff88"
            emissiveIntensity={1.5}
            metalness={0.7}
            roughness={0.2}
          />
        </mesh>

        {/* Large checkmark - CLEARED */}
        <group position={[0, 0.25, 0.16]}>
          <mesh position={[-0.18, -0.08, 0]} rotation={[0, 0, -0.6]}>
            <boxGeometry args={[0.25, 0.08, 0.06]} />
            <meshStandardMaterial
              color="#00ff88"
              emissive="#00ff88"
              emissiveIntensity={1.2}
              metalness={0.7}
              roughness={0.2}
            />
          </mesh>
          <mesh position={[0.12, 0.08, 0]} rotation={[0, 0, 0.8]}>
            <boxGeometry args={[0.4, 0.08, 0.06]} />
            <meshStandardMaterial
              color="#00ff88"
              emissive="#00ff88"
              emissiveIntensity={1.2}
              metalness={0.7}
              roughness={0.2}
            />
          </mesh>
        </group>

        {/* Corner accent dots */}
        <mesh position={[0.85, 0.65, 0.1]}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshStandardMaterial color="#00d2ff" emissive="#00d2ff" emissiveIntensity={2.5} />
        </mesh>
        <mesh position={[-0.85, 0.65, 0.1]}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshStandardMaterial color="#00d2ff" emissive="#00d2ff" emissiveIntensity={2.5} />
        </mesh>

      </group>
    </Float>
  );
};

export default Logo3D;
