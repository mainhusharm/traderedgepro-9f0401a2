import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

interface TradingGridMatrixProps {
  scrollProgress: React.MutableRefObject<number>;
}

const TradingGridMatrix = ({ scrollProgress }: TradingGridMatrixProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const gridRef = useRef<THREE.LineSegments>(null);
  const nodesRef = useRef<THREE.InstancedMesh>(null);
  const pulseRef = useRef<THREE.Mesh>(null);

  // Create grid geometry
  const gridGeometry = useMemo(() => {
    const points: number[] = [];
    const size = 4;
    const divisions = 12;
    const step = size / divisions;

    // Horizontal lines
    for (let i = 0; i <= divisions; i++) {
      const y = -size / 2 + i * step;
      points.push(-size / 2, y, 0, size / 2, y, 0);
    }
    // Vertical lines
    for (let i = 0; i <= divisions; i++) {
      const x = -size / 2 + i * step;
      points.push(x, -size / 2, 0, x, size / 2, 0);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
    return geometry;
  }, []);

  // Node positions at grid intersections
  const nodePositions = useMemo(() => {
    const positions: THREE.Matrix4[] = [];
    const size = 4;
    const divisions = 12;
    const step = size / divisions;

    for (let i = 0; i <= divisions; i++) {
      for (let j = 0; j <= divisions; j++) {
        const x = -size / 2 + i * step;
        const y = -size / 2 + j * step;
        const matrix = new THREE.Matrix4();
        matrix.setPosition(x, y, 0);
        positions.push(matrix);
      }
    }
    return positions;
  }, []);

  // Lerped values for smooth transitions
  const lerpedValues = useRef({
    positionX: 2.5,
    positionY: 0,
    scale: 0.8,
    rotationY: 0,
  });

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const scroll = scrollProgress.current;
    const lerp = THREE.MathUtils.lerp;

    // Position on the right side, away from hero text
    let targetX = 2.5;
    let targetY = 0;
    let targetScale = 0.8;

    if (scroll < 0.15) {
      targetX = 2.5;
      targetY = 0;
      targetScale = 0.8;
    } else if (scroll < 0.3) {
      targetX = -2.5;
      targetY = -0.3;
      targetScale = 0.7;
    } else if (scroll < 0.45) {
      targetX = 2.5;
      targetY = 0;
      targetScale = 0.6;
    } else if (scroll < 0.6) {
      targetX = -2.5;
      targetY = 0.3;
      targetScale = 0.65;
    } else if (scroll < 0.75) {
      targetX = 2.5;
      targetY = -0.5;
      targetScale = 0.55;
    } else if (scroll < 0.9) {
      targetX = -2.5;
      targetY = 0.5;
      targetScale = 0.7;
    } else {
      targetX = 2.5;
      targetY = 0;
      targetScale = 0.75;
    }

    const lerpFactor = 0.05;
    lerpedValues.current.positionX = lerp(lerpedValues.current.positionX, targetX, lerpFactor);
    lerpedValues.current.positionY = lerp(lerpedValues.current.positionY, targetY, lerpFactor);
    lerpedValues.current.scale = lerp(lerpedValues.current.scale, targetScale, lerpFactor);
    lerpedValues.current.rotationY += 0.002;

    if (groupRef.current) {
      groupRef.current.position.x = lerpedValues.current.positionX;
      groupRef.current.position.y = lerpedValues.current.positionY;
      groupRef.current.rotation.y = Math.sin(time * 0.3) * 0.3;
      groupRef.current.rotation.x = Math.sin(time * 0.2) * 0.1;
      groupRef.current.scale.setScalar(lerpedValues.current.scale);
    }

    if (pulseRef.current) {
      const pulse = Math.sin(time * 2) * 0.5 + 0.5;
      pulseRef.current.scale.setScalar(1 + pulse * 0.3);
      (pulseRef.current.material as THREE.MeshBasicMaterial).opacity = 0.3 - pulse * 0.2;
    }

    // Animate nodes
    if (nodesRef.current) {
      const tempMatrix = new THREE.Matrix4();
      const tempPosition = new THREE.Vector3();
      
      nodePositions.forEach((matrix, i) => {
        tempPosition.setFromMatrixPosition(matrix);
        const wave = Math.sin(time * 2 + tempPosition.x + tempPosition.y) * 0.05;
        tempMatrix.copy(matrix);
        tempMatrix.setPosition(tempPosition.x, tempPosition.y, wave);
        nodesRef.current!.setMatrixAt(i, tempMatrix);
      });
      nodesRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <Float speed={1} rotationIntensity={0.05} floatIntensity={0.2}>
      <group ref={groupRef}>
        {/* Main grid */}
        <lineSegments ref={gridRef} geometry={gridGeometry}>
          <lineBasicMaterial color="#00d2ff" transparent opacity={0.4} />
        </lineSegments>

        {/* Glowing grid overlay */}
        <lineSegments geometry={gridGeometry}>
          <lineBasicMaterial color="#00d2ff" transparent opacity={0.1} linewidth={2} />
        </lineSegments>

        {/* Nodes at intersections */}
        <instancedMesh ref={nodesRef} args={[undefined, undefined, nodePositions.length]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshBasicMaterial color="#00d2ff" transparent opacity={0.8} />
        </instancedMesh>

        {/* Center pulse ring */}
        <mesh ref={pulseRef}>
          <ringGeometry args={[0.8, 0.85, 32]} />
          <meshBasicMaterial color="#00d2ff" transparent opacity={0.3} side={THREE.DoubleSide} />
        </mesh>

        {/* Inner glow */}
        <mesh>
          <circleGeometry args={[0.6, 32]} />
          <meshBasicMaterial color="#00d2ff" transparent opacity={0.1} />
        </mesh>

        {/* Outer frame */}
        <mesh>
          <ringGeometry args={[2.1, 2.15, 64]} />
          <meshBasicMaterial color="#00a8cc" transparent opacity={0.5} />
        </mesh>
      </group>
    </Float>
  );
};

export default TradingGridMatrix;
