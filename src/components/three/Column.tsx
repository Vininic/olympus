import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Environment, ContactShadows } from "@react-three/drei";
import type { Group } from "three";

/** A Doric column — the suite mark in three dimensions. The body used to be the
 *  marble-dark theme color (#2E2A26), which against the dark Summit Atelier
 *  background read as a black cylinder. It's now pale warm stone with a gilt
 *  capital/base and a studio environment for gloss, so it reads as marble. */
function MarbleColumn() {
  const groupRef = useRef<Group>(null);
  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.15;
  });

  return (
    <group ref={groupRef}>
      {/* Shaft — pale marble, lightly glossy */}
      <mesh position={[0, 0, 0]} castShadow>
        <cylinderGeometry args={[0.58, 0.66, 2.2, 48]} />
        <meshStandardMaterial color="#D8D0C2" metalness={0.15} roughness={0.55} emissive="#3A352E" emissiveIntensity={0.25} />
      </mesh>
      {/* Capital (two gilt discs) */}
      <mesh position={[0, 1.15, 0]} castShadow>
        <cylinderGeometry args={[0.75, 0.62, 0.16, 48]} />
        <meshStandardMaterial color="#C9B99A" metalness={0.7} roughness={0.3} emissive="#6E5C3A" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[0, 1.31, 0]} castShadow>
        <cylinderGeometry args={[0.66, 0.78, 0.12, 48]} />
        <meshStandardMaterial color="#D9C9A6" metalness={0.7} roughness={0.28} emissive="#6E5C3A" emissiveIntensity={0.3} />
      </mesh>
      {/* Base */}
      <mesh position={[0, -1.16, 0]} castShadow>
        <cylinderGeometry args={[0.76, 0.66, 0.14, 48]} />
        <meshStandardMaterial color="#C9B99A" metalness={0.6} roughness={0.35} emissive="#6E5C3A" emissiveIntensity={0.25} />
      </mesh>
    </group>
  );
}

export function Column3D() {
  return (
    <div className="h-64 w-64">
      <Canvas shadows dpr={[1, 1.75]} camera={{ position: [0, 0.2, 3.6], fov: 40 }} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={0.55} />
        <directionalLight position={[3, 5, 4]} intensity={1.3} castShadow />
        <directionalLight position={[-3, 1, 2]} intensity={0.4} color="#E6D3A8" />
        <pointLight position={[0, 0.5, 2.5]} intensity={0.35} color="#F0E4C6" />
        <Float floatIntensity={0.5} speed={1.2} rotationIntensity={0}>
          <MarbleColumn />
        </Float>
        <ContactShadows position={[0, -1.35, 0]} opacity={0.3} scale={5} blur={2.4} far={2.5} />
        <Environment preset="studio" />
      </Canvas>
    </div>
  );
}
