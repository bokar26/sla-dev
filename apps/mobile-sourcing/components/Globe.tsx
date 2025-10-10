import React, { useRef, useEffect, useState, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { Canvas, useFrame } from "@react-three/fiber/native";
import * as THREE from "three";

// Custom hook for dynamic square sizing (adapted for React Native)
function useSquareSize(size: number, pad = 0) {
  return Math.max(200, size - pad);
}

interface GlobeData {
  lat: number;
  lng: number;
  name: string;
  status: 'new' | 'existing';
}

interface GlobeProps {
  data?: GlobeData[];
  cycleMs?: number;
  size?: number;
  autoRotate?: boolean;
}

function RotatingGlobe({ data = [], cycleMs = 2200, autoRotate = true }: { data: GlobeData[]; cycleMs: number; autoRotate: boolean }) {
  const mesh = useRef<THREE.Mesh>(null!);
  const [idx, setIdx] = useState(0);
  const [popToggle, setPopToggle] = useState(false);

  // Filter out factories with invalid coordinates
  const validFactories = data.filter(f => 
    Number.isFinite(f.lat) && Number.isFinite(f.lng) && 
    f.lat !== 0 && f.lng !== 0
  );

  // Cycle through factories one at a time
  useEffect(() => {
    if (!validFactories?.length) return;
    const t = setInterval(() => setIdx(i => (i + 1) % validFactories.length), cycleMs);
    return () => clearInterval(t);
  }, [validFactories?.length, cycleMs]);

  const selected = validFactories?.length ? [validFactories[idx]] : [];

  // Simple "pop" by toggling altitude; transition handles animation
  useEffect(() => {
    setPopToggle(true);
    const down = setTimeout(() => setPopToggle(false), Math.max(600, cycleMs - 800));
    return () => clearTimeout(down);
  }, [idx, cycleMs]);

  const pointAltitude = useMemo(
    () => (popToggle ? 0.2 : 0.02),
    [popToggle]
  );

  useFrame((_, delta) => {
    if (mesh.current && autoRotate) {
      mesh.current.rotation.y += delta * 0.8; // Slightly faster for thinking animation
    }
  });

  return (
    <group>
      {/* Earth sphere */}
      <mesh ref={mesh}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial 
          color="#4CC38A"
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>
      
      {/* Atmosphere */}
      <mesh>
        <sphereGeometry args={[1.15, 32, 32]} />
        <meshBasicMaterial 
          color="#87CEEB"
          transparent
          opacity={0.3}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Points for selected factories */}
      {selected.map((factory, i) => (
        <mesh key={i} position={[
          Math.cos(factory.lat * Math.PI / 180) * Math.cos(factory.lng * Math.PI / 180) * (1 + pointAltitude),
          Math.sin(factory.lat * Math.PI / 180) * (1 + pointAltitude),
          Math.cos(factory.lat * Math.PI / 180) * Math.sin(factory.lng * Math.PI / 180) * (1 + pointAltitude)
        ]}>
          <sphereGeometry args={[0.02, 16, 16]} />
          <meshStandardMaterial 
            color={factory.status === 'new' ? '#3B82F6' : '#EF4444'}
            emissive={factory.status === 'new' ? '#3B82F6' : '#EF4444'}
            emissiveIntensity={0.3}
          />
        </mesh>
      ))}
    </group>
  );
}

export default function Globe({ data = [], cycleMs = 2200, size = 220, autoRotate = true }: GlobeProps) {
  // Mock data for the globe animation - just a few points to show rotation
  const mockData = [
    { lat: 20, lng: 78, name: "Searching...", status: "new" as const },
    { lat: 35, lng: 139, name: "Finding matches...", status: "new" as const },
    { lat: 40, lng: -74, name: "Analyzing...", status: "new" as const },
  ];

  const displayData = data.length > 0 ? data : mockData;
  const globeSize = useSquareSize(size, 16);

  return (
    <View style={{ width: size, height: size, alignSelf: "center" }}>
      <Canvas
        style={{ width: globeSize, height: globeSize }}
        camera={{ position: [0, 0, 2.4], fov: 75 }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[3, 3, 3]} intensity={1} />
        <pointLight position={[-3, -3, -3]} intensity={0.5} />
        <RotatingGlobe data={displayData} cycleMs={cycleMs} autoRotate={autoRotate} />
      </Canvas>
    </View>
  );
}
