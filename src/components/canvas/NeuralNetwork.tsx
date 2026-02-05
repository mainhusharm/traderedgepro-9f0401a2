import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, MeshReflectorMaterial } from '@react-three/drei';
import * as THREE from 'three';

interface NeuralNetworkProps {
  scrollProgress: React.MutableRefObject<number>;
}

const NeuralNetwork = ({ scrollProgress }: NeuralNetworkProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const outerRingRef = useRef<THREE.Mesh>(null);

  // Neural network node positions in 3D layers
  const nodes = useMemo(() => {
    const layers = [
      // Input layer
      [
        { x: -1.2, y: 0.8, z: 0 },
        { x: -1.2, y: 0.3, z: 0 },
        { x: -1.2, y: -0.2, z: 0 },
        { x: -1.2, y: -0.7, z: 0 },
      ],
      // Hidden layer 1
      [
        { x: -0.4, y: 0.6, z: 0.2 },
        { x: -0.4, y: 0.1, z: 0.2 },
        { x: -0.4, y: -0.4, z: 0.2 },
      ],
      // Hidden layer 2
      [
        { x: 0.4, y: 0.5, z: 0.3 },
        { x: 0.4, y: 0, z: 0.3 },
        { x: 0.4, y: -0.5, z: 0.3 },
      ],
      // Output layer
      [
        { x: 1.2, y: 0.3, z: 0.1 },
        { x: 1.2, y: -0.2, z: 0.1 },
      ],
    ];
    return layers;
  }, []);

  // Create connections between nodes
  const connections = useMemo(() => {
    const conns: { start: THREE.Vector3; end: THREE.Vector3 }[] = [];
    
    for (let l = 0; l < nodes.length - 1; l++) {
      const currentLayer = nodes[l];
      const nextLayer = nodes[l + 1];
      
      currentLayer.forEach(node => {
        nextLayer.forEach(nextNode => {
          conns.push({
            start: new THREE.Vector3(node.x, node.y, node.z),
            end: new THREE.Vector3(nextNode.x, nextNode.y, nextNode.z),
          });
        });
      });
    }
    return conns;
  }, [nodes]);

  // Lerped values
  const lerpedValues = useRef({
    positionX: 0,
    positionY: -0.5,
    scale: 1.3,
    rotationY: 0,
  });

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const scroll = scrollProgress.current;
    const lerp = THREE.MathUtils.lerp;

    let targetX = 0;
    let targetY = -0.5;
    let targetScale = 1.3;

    if (scroll < 0.15) {
      targetX = 0;
      targetY = -0.6;
      targetScale = 1.3;
    } else if (scroll < 0.3) {
      targetX = 2;
      targetY = 0;
      targetScale = 1;
    } else if (scroll < 0.45) {
      targetX = -2;
      targetY = 0;
      targetScale = 0.9;
    } else if (scroll < 0.6) {
      targetX = 2;
      targetY = 0.3;
      targetScale = 0.95;
    } else if (scroll < 0.75) {
      targetX = -2;
      targetY = -0.3;
      targetScale = 0.85;
    } else if (scroll < 0.9) {
      targetX = 2;
      targetY = 0.5;
      targetScale = 1;
    } else {
      targetX = 0;
      targetY = -0.3;
      targetScale = 1.1;
    }

    const lerpFactor = 0.05;
    lerpedValues.current.positionX = lerp(lerpedValues.current.positionX, targetX, lerpFactor);
    lerpedValues.current.positionY = lerp(lerpedValues.current.positionY, targetY, lerpFactor);
    lerpedValues.current.scale = lerp(lerpedValues.current.scale, targetScale, lerpFactor);
    lerpedValues.current.rotationY += 0.006;

    if (groupRef.current) {
      groupRef.current.position.x = lerpedValues.current.positionX;
      groupRef.current.position.y = lerpedValues.current.positionY;
      groupRef.current.rotation.y = lerpedValues.current.rotationY;
      groupRef.current.rotation.x = Math.sin(time * 0.2) * 0.1;
      groupRef.current.scale.setScalar(lerpedValues.current.scale);
    }

    if (coreRef.current) {
      const pulse = Math.sin(time * 2) * 0.1 + 1;
      coreRef.current.scale.setScalar(pulse);
    }

    if (outerRingRef.current) {
      outerRingRef.current.rotation.z = time * 0.5;
    }
  });

  return (
    <Float speed={1} rotationIntensity={0.05} floatIntensity={0.15}>
      <group ref={groupRef}>
        {/* Neural network nodes */}
        {nodes.map((layer, layerIndex) =>
          layer.map((node, nodeIndex) => (
            <mesh
              key={`node-${layerIndex}-${nodeIndex}`}
              position={[node.x, node.y, node.z]}
              castShadow
            >
              <sphereGeometry args={[0.08, 24, 24]} />
              <meshPhysicalMaterial
                color={layerIndex === nodes.length - 1 ? '#1a3a4a' : '#0d2a3a'}
                emissive={layerIndex === nodes.length - 1 ? '#1a3a4a' : '#0d2a3a'}
                emissiveIntensity={0.3}
                metalness={0.9}
                roughness={0.1}
                clearcoat={1}
                transparent
                opacity={0.6}
              />
            </mesh>
          ))
        )}

        {/* Connections between nodes */}
        {connections.map((conn, i) => {
          const curve = new THREE.LineCurve3(conn.start, conn.end);
          return (
            <mesh key={`conn-${i}`} castShadow>
              <tubeGeometry args={[curve, 1, 0.008, 8, false]} />
              <meshPhysicalMaterial
                color="#0a1a25"
                emissive="#0a1a25"
                emissiveIntensity={0.15}
                transparent
                opacity={0.3}
                metalness={0.8}
                roughness={0.2}
              />
            </mesh>
          );
        })}

        {/* Central AI core */}
        <mesh ref={coreRef} position={[0, 0, 0.15]} castShadow>
          <icosahedronGeometry args={[0.25, 2]} />
          <meshPhysicalMaterial
            color="#1a3a4a"
            emissive="#1a3a4a"
            emissiveIntensity={0.4}
            metalness={0.95}
            roughness={0.05}
            clearcoat={1}
            clearcoatRoughness={0.1}
            transparent
            opacity={0.7}
          />
        </mesh>

        {/* Outer rotating ring */}
        <mesh ref={outerRingRef} position={[0, 0, 0.15]}>
          <torusGeometry args={[1.5, 0.02, 16, 100]} />
          <meshPhysicalMaterial
            color="#0d2535"
            emissive="#0d2535"
            emissiveIntensity={0.3}
            metalness={0.9}
            roughness={0.1}
            transparent
            opacity={0.4}
          />
        </mesh>

        {/* Second ring at angle */}
        <mesh position={[0, 0, 0.15]} rotation={[Math.PI / 3, 0, 0]}>
          <torusGeometry args={[1.3, 0.015, 16, 100]} />
          <meshPhysicalMaterial
            color="#0a1f2a"
            emissive="#0a1f2a"
            emissiveIntensity={0.25}
            metalness={0.9}
            roughness={0.1}
            transparent
            opacity={0.35}
          />
        </mesh>

        {/* Third ring */}
        <mesh position={[0, 0, 0.15]} rotation={[Math.PI / 2, Math.PI / 4, 0]}>
          <torusGeometry args={[1.1, 0.012, 16, 100]} />
          <meshPhysicalMaterial
            color="#0a2530"
            emissive="#0a2530"
            emissiveIntensity={0.2}
            metalness={0.9}
            roughness={0.1}
            transparent
            opacity={0.3}
          />
        </mesh>

        {/* Glow sphere behind */}
        <mesh position={[0, 0, -0.2]}>
          <sphereGeometry args={[0.8, 32, 32]} />
          <meshPhysicalMaterial
            color="#050a10"
            emissive="#0a1a25"
            emissiveIntensity={0.1}
            transparent
            opacity={0.2}
            metalness={0.5}
            roughness={0.5}
          />
        </mesh>
      </group>

      {/* Reflective floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.5, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <MeshReflectorMaterial
          blur={[300, 100]}
          resolution={1024}
          mixBlur={1}
          mixStrength={30}
          roughness={1}
          depthScale={1.2}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#020305"
          metalness={0.3}
          mirror={0.3}
        />
      </mesh>
    </Float>
  );
};

export default NeuralNetwork;