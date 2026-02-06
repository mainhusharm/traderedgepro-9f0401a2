import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

interface TradingCandlesticksProps {
  scrollProgress: React.MutableRefObject<number>;
}

interface CandleData {
  x: number;
  height: number;
  wickTop: number;
  wickBottom: number;
  isGreen: boolean;
  delay: number;
}

const Candlestick = ({ x, height, wickTop, wickBottom, isGreen, delay }: CandleData & { time: number }) => {
  const bodyRef = useRef<THREE.Mesh>(null);
  const wickRef = useRef<THREE.Mesh>(null);
  
  const color = isGreen ? '#00ff88' : '#ff4757';
  const emissiveColor = isGreen ? '#00ff88' : '#ff4757';
  
  return (
    <group position={[x, 0, 0]}>
      {/* Candle body */}
      <mesh ref={bodyRef} position={[0, height / 2, 0]}>
        <boxGeometry args={[0.15, Math.abs(height), 0.15]} />
        <meshStandardMaterial
          color={color}
          emissive={emissiveColor}
          emissiveIntensity={0.5}
          metalness={0.3}
          roughness={0.4}
        />
      </mesh>
      
      {/* Wick */}
      <mesh ref={wickRef} position={[0, (wickTop + wickBottom) / 2, 0]}>
        <boxGeometry args={[0.03, wickTop - wickBottom, 0.03]} />
        <meshStandardMaterial
          color={color}
          emissive={emissiveColor}
          emissiveIntensity={0.3}
        />
      </mesh>
    </group>
  );
};

const TradingCandlesticks = ({ scrollProgress }: TradingCandlesticksProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const particlesRef = useRef<THREE.Points>(null);

  // Generate candle data - ascending pattern
  const candles = useMemo<CandleData[]>(() => {
    const data: CandleData[] = [];
    let baseY = -1;
    
    for (let i = 0; i < 7; i++) {
      const isGreen = Math.random() > 0.3; // 70% green for uptrend
      const height = 0.3 + Math.random() * 0.5;
      const wickExtension = 0.1 + Math.random() * 0.2;
      
      if (isGreen) baseY += height * 0.3;
      else baseY -= height * 0.2;
      
      data.push({
        x: (i - 3) * 0.35,
        height: isGreen ? height : -height,
        wickTop: baseY + height + wickExtension,
        wickBottom: baseY - wickExtension,
        isGreen,
        delay: i * 0.1,
      });
    }
    return data;
  }, []);

  // Floating particles around candles
  const particleCount = 100;
  const particlePositions = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 4;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 3;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 2;
    }
    return positions;
  }, []);

  // Lerped values for smooth transitions
  const lerpedValues = useRef({
    positionX: 0,
    positionY: 0,
    scale: 1,
    rotationY: 0,
  });

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const scroll = scrollProgress.current;
    const lerp = THREE.MathUtils.lerp;

    // Scroll-based positioning
    let targetX = 0;
    let targetY = 0;
    let targetScale = 1;

    if (scroll < 0.15) {
      targetX = 0;
      targetY = 0;
      targetScale = 1;
    } else if (scroll < 0.3) {
      targetX = 2;
      targetY = -0.3;
      targetScale = 0.8;
    } else if (scroll < 0.45) {
      targetX = -2;
      targetY = 0;
      targetScale = 0.7;
    } else if (scroll < 0.6) {
      targetX = 2;
      targetY = 0.3;
      targetScale = 0.75;
    } else if (scroll < 0.75) {
      targetX = 2.2;
      targetY = -0.5;
      targetScale = 0.6;
    } else if (scroll < 0.9) {
      targetX = -2;
      targetY = 0.5;
      targetScale = 0.8;
    } else {
      targetX = 0;
      targetY = 0;
      targetScale = 1.1;
    }

    const lerpFactor = 0.05;
    lerpedValues.current.positionX = lerp(lerpedValues.current.positionX, targetX, lerpFactor);
    lerpedValues.current.positionY = lerp(lerpedValues.current.positionY, targetY, lerpFactor);
    lerpedValues.current.scale = lerp(lerpedValues.current.scale, targetScale, lerpFactor);
    lerpedValues.current.rotationY += 0.002;

    if (groupRef.current) {
      groupRef.current.position.x = lerpedValues.current.positionX;
      groupRef.current.position.y = lerpedValues.current.positionY;
      groupRef.current.rotation.y = lerpedValues.current.rotationY + Math.sin(time * 0.3) * 0.1;
      groupRef.current.rotation.x = Math.sin(time * 0.2) * 0.05;
      groupRef.current.scale.setScalar(lerpedValues.current.scale);
    }

    if (particlesRef.current) {
      particlesRef.current.rotation.y = time * 0.05;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.3}>
      <group ref={groupRef}>
        {/* Grid base */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]}>
          <planeGeometry args={[4, 3, 20, 15]} />
          <meshStandardMaterial
            color="#00d2ff"
            wireframe
            transparent
            opacity={0.15}
          />
        </mesh>

        {/* Candlesticks */}
        <group position={[0, 0, 0]}>
          {candles.map((candle, i) => (
            <Candlestick key={i} {...candle} time={0} />
          ))}
        </group>

        {/* Ascending trend line */}
        <mesh position={[0, 0.3, 0.2]} rotation={[0, 0, 0.4]}>
          <boxGeometry args={[3, 0.03, 0.03]} />
          <meshStandardMaterial
            color="#00ff88"
            emissive="#00ff88"
            emissiveIntensity={1}
            transparent
            opacity={0.8}
          />
        </mesh>

        {/* Floating particles */}
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
            opacity={0.6}
            sizeAttenuation
          />
        </points>

        {/* Glow ring */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <torusGeometry args={[2.2, 0.015, 16, 100]} />
          <meshStandardMaterial
            color="#00d2ff"
            emissive="#00d2ff"
            emissiveIntensity={1.5}
            transparent
            opacity={0.3}
          />
        </mesh>
      </group>
    </Float>
  );
};

export default TradingCandlesticks;