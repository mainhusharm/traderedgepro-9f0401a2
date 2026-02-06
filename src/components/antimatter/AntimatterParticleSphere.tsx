import { Suspense, useMemo, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Preload } from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'framer-motion';

interface ParticleSphereProps {
  scrollProgress: React.MutableRefObject<number>;
}

// Generate growth chart shape - 3D extruded bars with depth
const generateGrowthChartPoints = (count: number): Float32Array => {
  const points = new Float32Array(count * 3);

  // Allocate: 3 bars + arrow
  const barCount = Math.floor(count * 0.24);
  const arrowCount = count - barCount * 3;

  const barSpacing = 0.55;
  const barWidth = 0.38;
  const barDepth = 0.45; // Depth for 3D effect
  const baseY = -1.15;

  // Bar 1 (left) - 3D extruded
  for (let i = 0; i < barCount; i++) {
    const height = 0.75;
    const x = -barSpacing + (Math.random() - 0.5) * barWidth;
    const y = baseY + Math.random() * height;
    // Distribute particles throughout the depth
    const z = (Math.random() - 0.5) * barDepth;

    points[i * 3] = x * 1.35;
    points[i * 3 + 1] = y * 1.35;
    points[i * 3 + 2] = z;
  }

  // Bar 2 (center) - 3D extruded
  for (let i = 0; i < barCount; i++) {
    const idx = barCount + i;
    const height = 1.25;
    const x = 0 + (Math.random() - 0.5) * barWidth;
    const y = baseY + Math.random() * height;
    const z = (Math.random() - 0.5) * barDepth;

    points[idx * 3] = x * 1.35;
    points[idx * 3 + 1] = y * 1.35;
    points[idx * 3 + 2] = z;
  }

  // Bar 3 (right) - 3D extruded
  for (let i = 0; i < barCount; i++) {
    const idx = barCount * 2 + i;
    const height = 1.85;
    const x = barSpacing + (Math.random() - 0.5) * barWidth;
    const y = baseY + Math.random() * height;
    const z = (Math.random() - 0.5) * barDepth;

    points[idx * 3] = x * 1.35;
    points[idx * 3 + 1] = y * 1.35;
    points[idx * 3 + 2] = z;
  }

  // Arrow above bars (3D tube-like with depth)
  const arrowDepth = 0.35;
  for (let i = 0; i < arrowCount; i++) {
    const idx = barCount * 3 + i;
    const t = i / arrowCount;

    let x = 0;
    let y = 0;
    let z = 0;

    if (t < 0.7) {
      // Arrow shaft - cylindrical distribution
      const lt = t / 0.7;
      x = -0.75 + lt * 1.55;
      y = 0.25 + lt * 0.85;
      
      // Circular cross-section for 3D tube effect
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 0.12;
      x += Math.cos(angle) * radius * 0.5;
      y += Math.sin(angle) * radius * 0.5;
      z = (Math.random() - 0.5) * arrowDepth;
    } else {
      // Arrow head - 3D pyramid/cone
      const ht = (t - 0.7) / 0.3;
      const tipX = 0.85;
      const tipY = 1.25;

      if (ht < 0.5) {
        const h = ht / 0.5;
        x = tipX - h * 0.35;
        y = tipY + h * 0.22;
      } else {
        const h = (ht - 0.5) / 0.5;
        x = tipX - h * 0.35;
        y = tipY - h * 0.35;
      }

      // Add depth variation for 3D arrowhead
      const depthFactor = 1 - Math.abs(ht - 0.5) * 2; // More depth in middle
      z = (Math.random() - 0.5) * arrowDepth * (0.5 + depthFactor * 0.5);
      
      // Spread for volume
      x += (Math.random() - 0.5) * 0.08;
      y += (Math.random() - 0.5) * 0.08;
    }

    points[idx * 3] = x * 1.35;
    points[idx * 3 + 1] = y * 1.35;
    points[idx * 3 + 2] = z;
  }

  return points;
};

// Generate edge highlight particles (front and back edges for 3D pop)
const generateEdgeHighlights = (sourcePoints: Float32Array): Float32Array => {
  const edges = new Float32Array(sourcePoints.length);
  const count = sourcePoints.length / 3;
  
  for (let i = 0; i < count; i++) {
    const x = sourcePoints[i * 3];
    const y = sourcePoints[i * 3 + 1];
    const z = sourcePoints[i * 3 + 2];
    
    // Push particles to front or back edge based on their position
    const edgeZ = z > 0 ? z + 0.15 : z - 0.15;
    
    edges[i * 3] = x;
    edges[i * 3 + 1] = y;
    edges[i * 3 + 2] = edgeZ;
  }
  
  return edges;
};

// Generate depth layer for 3D effect (back face)
const generateDepthLayerPoints = (sourcePoints: Float32Array): Float32Array => {
  const depth = new Float32Array(sourcePoints.length);
  const count = sourcePoints.length / 3;
  
  for (let i = 0; i < count; i++) {
    depth[i * 3] = sourcePoints[i * 3] + 0.08;
    depth[i * 3 + 1] = sourcePoints[i * 3 + 1] - 0.05;
    depth[i * 3 + 2] = sourcePoints[i * 3 + 2] - 0.4;
  }
  
  return depth;
};

const ParticleSphere = ({ scrollProgress }: ParticleSphereProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const innerParticlesRef = useRef<THREE.Points>(null);
  const depthParticlesRef = useRef<THREE.Points>(null);
  const outerParticlesRef = useRef<THREE.Points>(null);
  
  const hoverState = useRef({ target: 0, strength: 0 });
  const mousePos = useRef({ x: 0, y: 0, worldX: 0, worldY: 0 });

  // Generate sphere and growth chart positions
  const { spherePositions, chartPositions, depthPositions, outerPositions } = useMemo(() => {
    const innerCount = 6000;
    const spherePos = new Float32Array(innerCount * 3);
    
    // Sphere positions
    for (let i = 0; i < innerCount; i++) {
      const phi = Math.acos(1 - 2 * (i + 0.5) / innerCount);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      const radius = 1.85 + (Math.random() - 0.5) * 0.1;
      
      spherePos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      spherePos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      spherePos[i * 3 + 2] = radius * Math.cos(phi);
    }
    
    // Growth chart positions
    const chartPos = generateGrowthChartPoints(innerCount);
    
    // Depth layer (purple, offset behind)
    const depthPos = generateDepthLayerPoints(chartPos);
    
    // Outer particles
    const outerCount = 1200;
    const outerPos = new Float32Array(outerCount * 3);
    
    for (let i = 0; i < outerCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 2.2 + Math.random() * 0.5;
      
      outerPos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      outerPos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      outerPos[i * 3 + 2] = radius * Math.cos(phi);
    }
    
    return { spherePositions: spherePos, chartPositions: chartPos, depthPositions: depthPos, outerPositions: outerPos };
  }, []);

  const lerpedValues = useRef({
    rotationY: 0,
    positionX: 0,
    positionY: 0,
    scale: 1,
    morphFactor: 0,
  });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -(e.clientY / window.innerHeight) * 2 + 1;

      // Store normalized mouse position
      mousePos.current.x = x;
      mousePos.current.y = y;
      
      // Convert to approximate world coordinates (for repulsion effect)
      // Adjust based on camera FOV and distance
      mousePos.current.worldX = x * 5;
      mousePos.current.worldY = y * 5;

      const centerX = lerpedValues.current.positionX / 5;
      const centerY = 0.08 + lerpedValues.current.positionY / 5;
      const dx = x - centerX;
      const dy = y - centerY;

      const radius = 0.9;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const strength = Math.max(0, Math.min(1, 1 - dist / radius));
      hoverState.current.target = strength;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const scroll = scrollProgress.current;
    
    hoverState.current.strength += (hoverState.current.target - hoverState.current.strength) * 0.12;
    const hover = hoverState.current.strength;
    
    // Calculate scroll position in pixels
    const scrollPx = scroll * (document.documentElement.scrollHeight - window.innerHeight);
    
    // Define section boundaries (approximate pixel values)
    // Hero: 0-50px
    // PropFirmLogos: 50-600px (chart morph)
    // TrustSignals: 600-1200px (chart)
    // BentoFeatures (Professional-Grade Tools): 1200-2000px (back to sphere, zoom in)
    // WhyWereDifferent: 2000-2600px (sphere, zoom out)
    // SignalFeed: 2600-3200px (sphere, zoom in)
    // RiskCalculator: 3200-3800px (sphere, zoom out)
    // And continue alternating...
    
    // Chart morph zone (PropFirmLogos + TrustSignals)
    const chartStartPx = 50;
    const chartEndPx = 250;
    const chartToSphereStartPx = 1000;
    const chartToSphereEndPx = 1400;
    
    // Calculate morph factor: 0 = sphere, 1 = chart
    let targetMorph = 0;
    if (scrollPx < chartToSphereStartPx) {
      // Morph to chart
      targetMorph = Math.max(0, Math.min(1, (scrollPx - chartStartPx) / (chartEndPx - chartStartPx)));
    } else {
      // Morph back to sphere
      const backToSphere = Math.max(0, Math.min(1, (scrollPx - chartToSphereStartPx) / (chartToSphereEndPx - chartToSphereStartPx)));
      targetMorph = 1 - backToSphere;
    }
    
    // Alternating zoom effect for sections after BentoFeatures
    // Each section is roughly 600-800px
    const sectionHeight = 700;
    const zoomStartPx = 1400;
    let zoomFactor = 1.0;
    
    if (scrollPx > zoomStartPx) {
      const sectionProgress = scrollPx - zoomStartPx;
      const sectionIndex = Math.floor(sectionProgress / sectionHeight);
      const withinSection = (sectionProgress % sectionHeight) / sectionHeight;
      
      // Smooth in-out easing within each section
      const eased = withinSection < 0.5 
        ? 2 * withinSection * withinSection 
        : 1 - Math.pow(-2 * withinSection + 2, 2) / 2;
      
      // Alternate between zoom in (1.3) and zoom out (0.7)
      if (sectionIndex % 2 === 0) {
        // Zoom in section
        zoomFactor = 1.0 + eased * 0.35;
      } else {
        // Zoom out section
        zoomFactor = 1.0 - eased * 0.25;
      }
    }
    
    // Position: left when chart, center when sphere
    const chartInfluence = Math.max(0, Math.min(1, (scrollPx - chartStartPx) / (chartEndPx - chartStartPx)));
    const sphereInfluence = scrollPx > chartToSphereStartPx 
      ? Math.max(0, Math.min(1, (scrollPx - chartToSphereStartPx) / (chartToSphereEndPx - chartToSphereStartPx)))
      : 0;
    
    const targetPosX = -3.2 * chartInfluence * (1 - sphereInfluence);
    const targetPosY = -scroll * 1.5;
    const targetScale = (0.95 + chartInfluence * 0.12 * (1 - sphereInfluence)) * zoomFactor;
    const targetRotY = scroll * Math.PI * 0.15;
    
    lerpedValues.current.positionX += (targetPosX - lerpedValues.current.positionX) * 0.05;
    lerpedValues.current.positionY += (targetPosY - lerpedValues.current.positionY) * 0.03;
    lerpedValues.current.scale += (targetScale - lerpedValues.current.scale) * 0.06;
    lerpedValues.current.rotationY += (targetRotY - lerpedValues.current.rotationY) * 0.02;
    lerpedValues.current.morphFactor += (targetMorph - lerpedValues.current.morphFactor) * 0.05;
    
    // Get mouse world position adjusted for group position
    const mouseWorldX = mousePos.current.worldX - lerpedValues.current.positionX;
    const mouseWorldY = mousePos.current.worldY - lerpedValues.current.positionY;
    
    if (groupRef.current) {
      // Fixed 3D tilt when morphed (like reference image) + hover rotation
      const morphedRotation = lerpedValues.current.morphFactor;
      
      // Base rotation: fixed angle when chart, adds hover-based rotation
      const baseRotY = morphedRotation * 0.38 + hover * 0.15;
      const baseRotX = -morphedRotation * 0.25 + hover * 0.08;
      
      // Add continuous axis rotation when in sphere mode
      const axisRotation = (1 - morphedRotation) * time * 0.15;
      
      groupRef.current.rotation.y = lerpedValues.current.rotationY + baseRotY + axisRotation;
      groupRef.current.rotation.x = baseRotX;
      groupRef.current.rotation.z = 0;
      
      groupRef.current.position.x = lerpedValues.current.positionX;
      groupRef.current.position.y = lerpedValues.current.positionY;
      
      const baseScale = lerpedValues.current.scale;
      const hoverScale = 1 + hover * 0.04;
      const s = baseScale * hoverScale;
      groupRef.current.scale.set(s, s, s);
    }
    
    
    // Mouse repulsion settings
    const repulsionRadius = 0.6;
    const repulsionStrength = 0.5;
    
    // Morph particles between sphere and chart WITH mouse repulsion
    if (innerParticlesRef.current) {
      const positions = innerParticlesRef.current.geometry.attributes.position.array as Float32Array;
      const morphFactor = lerpedValues.current.morphFactor;
      const count = positions.length / 3;
      
      for (let i = 0; i < count; i++) {
        const sphereX = spherePositions[i * 3];
        const sphereY = spherePositions[i * 3 + 1];
        const sphereZ = spherePositions[i * 3 + 2];
        
        const chartX = chartPositions[i * 3];
        const chartY = chartPositions[i * 3 + 1];
        const chartZ = chartPositions[i * 3 + 2];
        
        // Smooth easing
        const easedMorph = morphFactor * morphFactor * (3 - 2 * morphFactor);
        
        // Base interpolated position
        let targetX = sphereX * (1 - easedMorph) + chartX * easedMorph;
        let targetY = sphereY * (1 - easedMorph) + chartY * easedMorph;
        let targetZ = sphereZ * (1 - easedMorph) + chartZ * easedMorph;
        
        // Apply mouse repulsion
        const dx = targetX - mouseWorldX;
        const dy = targetY - mouseWorldY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < repulsionRadius && dist > 0.01) {
          const force = (1 - dist / repulsionRadius) * repulsionStrength;
          const angle = Math.atan2(dy, dx);
          targetX += Math.cos(angle) * force;
          targetY += Math.sin(angle) * force;
          targetZ += (Math.random() - 0.5) * force * 0.3; // Add some z scatter
        }
        
        positions[i * 3] = targetX;
        positions[i * 3 + 1] = targetY;
        positions[i * 3 + 2] = targetZ;
      }
      
      innerParticlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
    
    // Update depth layer (purple back particles) WITH mouse repulsion
    if (depthParticlesRef.current) {
      const positions = depthParticlesRef.current.geometry.attributes.position.array as Float32Array;
      const morphFactor = lerpedValues.current.morphFactor;
      const count = positions.length / 3;
      
      for (let i = 0; i < count; i++) {
        // Sphere depth (just offset sphere)
        const sphereX = spherePositions[i * 3] + 0.1;
        const sphereY = spherePositions[i * 3 + 1] - 0.05;
        const sphereZ = spherePositions[i * 3 + 2] - 0.3;
        
        const chartX = depthPositions[i * 3];
        const chartY = depthPositions[i * 3 + 1];
        const chartZ = depthPositions[i * 3 + 2];
        
        const easedMorph = morphFactor * morphFactor * (3 - 2 * morphFactor);
        
        let targetX = sphereX * (1 - easedMorph) + chartX * easedMorph;
        let targetY = sphereY * (1 - easedMorph) + chartY * easedMorph;
        let targetZ = sphereZ * (1 - easedMorph) + chartZ * easedMorph;
        
        // Apply mouse repulsion to depth layer too
        const dx = targetX - mouseWorldX;
        const dy = targetY - mouseWorldY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < repulsionRadius && dist > 0.01) {
          const force = (1 - dist / repulsionRadius) * repulsionStrength * 0.7;
          const angle = Math.atan2(dy, dx);
          targetX += Math.cos(angle) * force;
          targetY += Math.sin(angle) * force;
          targetZ += (Math.random() - 0.5) * force * 0.2;
        }
        
        positions[i * 3] = targetX;
        positions[i * 3 + 1] = targetY;
        positions[i * 3 + 2] = targetZ;
      }
      
      depthParticlesRef.current.geometry.attributes.position.needsUpdate = true;
      
      // Fade in depth layer when morphed
      const mat = depthParticlesRef.current.material as THREE.PointsMaterial;
      mat.opacity = 0.45 * morphFactor;
    }
    
    if (outerParticlesRef.current) {
      // Fade out outer particles when morphing
      const mat = outerParticlesRef.current.material as THREE.PointsMaterial;
      mat.opacity = 0.2 * (1 - lerpedValues.current.morphFactor);
      outerParticlesRef.current.rotation.y = -time * 0.01;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0.2, 0]}>
      {/* Purple depth layer (behind main particles) - larger, glowing */}
      <points ref={depthParticlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={spherePositions.length / 3}
            array={new Float32Array(spherePositions)}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.035}
          color="#a5b4fc"
          transparent
          opacity={0}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
      
      {/* Main white particles - larger, more glow */}
      <points ref={innerParticlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={spherePositions.length / 3}
            array={new Float32Array(spherePositions)}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.028}
          color="#ffffff"
          transparent
          opacity={0.95}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
      
      {/* Outer halo - larger particles, more glow */}
      <points ref={outerParticlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={outerPositions.length / 3}
            array={outerPositions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.018}
          color="#c7d2fe"
          transparent
          opacity={0.35}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
};

interface AntimatterParticleSphereProps {
  scrollProgressRef: React.MutableRefObject<number>;
}

const AntimatterParticleSphere = ({ scrollProgressRef }: AntimatterParticleSphereProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 150);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div 
      className="fixed inset-0 z-0 pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: isVisible ? 1 : 0 }}
      transition={{ duration: 1.2, ease: "easeOut" }}
    >
      {/* Primary ambient glow - large and bright */}
      <motion.div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px]"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: isVisible ? 1 : 0, scale: 1 }}
        transition={{ duration: 1.5, delay: 0.2 }}
        style={{
          background: `
            radial-gradient(
              ellipse at center,
              rgba(99, 102, 241, 0.35) 0%,
              rgba(79, 70, 229, 0.22) 20%,
              rgba(55, 48, 163, 0.12) 45%,
              transparent 70%
            )
          `,
          filter: 'blur(60px)',
        }}
      />
      
      {/* Bright core glow - intense center */}
      <motion.div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: isVisible ? 1 : 0 }}
        transition={{ duration: 1.2, delay: 0.4 }}
        style={{
          background: `
            radial-gradient(
              circle at center,
              rgba(199, 210, 254, 0.45) 0%,
              rgba(165, 180, 252, 0.3) 25%,
              rgba(129, 140, 248, 0.15) 50%,
              transparent 75%
            )
          `,
          filter: 'blur(40px)',
        }}
      />
      
      {/* Inner hot core */}
      <motion.div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: isVisible ? 1 : 0 }}
        transition={{ duration: 1, delay: 0.5 }}
        style={{
          background: `
            radial-gradient(
              circle at center,
              rgba(255, 255, 255, 0.25) 0%,
              rgba(199, 210, 254, 0.2) 40%,
              transparent 70%
            )
          `,
          filter: 'blur(25px)',
        }}
      />
      
      {/* Tertiary subtle glow top-left */}
      <motion.div 
        className="absolute -top-40 -left-40 w-[700px] h-[700px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: isVisible ? 0.9 : 0 }}
        transition={{ duration: 1.2, delay: 0.3 }}
        style={{
          background: `
            radial-gradient(
              ellipse at center,
              rgba(139, 92, 246, 0.25) 0%,
              rgba(99, 102, 241, 0.12) 50%,
              transparent 80%
            )
          `,
          filter: 'blur(80px)',
        }}
      />
      
      {/* 3D Canvas */}
      <motion.div 
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: isVisible ? 1 : 0, scale: 1 }}
        transition={{ duration: 1, delay: 0.3 }}
      >
        <Canvas
          camera={{ position: [0, 0, 10], fov: 38 }}
          dpr={[1, 2]}
          gl={{ 
            antialias: true, 
            alpha: true,
            powerPreference: "high-performance"
          }}
          style={{ background: 'transparent' }}
        >
          <Suspense fallback={null}>
            <ambientLight intensity={0.25} />
            <pointLight position={[-10, 10, 8]} intensity={0.5} color="#ffffff" />
            <pointLight position={[5, -5, 5]} intensity={0.25} color="#a5b4fc" />
            <pointLight position={[0, 0, 8]} intensity={0.2} color="#818cf8" />
            
            <ParticleSphere scrollProgress={scrollProgressRef} />
            
            <Preload all />
          </Suspense>
        </Canvas>
      </motion.div>
    </motion.div>
  );
};

export default AntimatterParticleSphere;