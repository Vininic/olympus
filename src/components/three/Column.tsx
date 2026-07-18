import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Environment, ContactShadows } from "@react-three/drei";
import type { Group, Mesh } from "three";

const MARBLE = "#D8D0C2";
const GILT = "#C9B99A";
const GILT_LIGHT = "#D9C9A6";

/** A Doric column with fluting, a pediment fragment resting behind it (reads
 *  as "part of a temple", not just an isolated shaft), and a few orbiting
 *  gilt motes — the suite mark in three dimensions. Started as a plain
 *  cylinder (read as a black rod against the dark Summit background before
 *  an earlier pass gave it pale marble + gilt capital/base); this pass adds
 *  the fluting and pediment fragment for real presence instead of a bare
 *  lathe shape. Kept single-column (not a full peristyle) since this
 *  renders in a fixed 256×256 box in two places (Landing hero, Login
 *  panel) — a full temple facade would read as cramped at that size. */
function Fluting() {
  const grooves = useMemo(() => Array.from({ length: 16 }, (_, i) => (i / 16) * Math.PI * 2), []);
  return (
    <>
      {grooves.map((angle, i) => (
        <mesh key={i} position={[Math.sin(angle) * 0.6, 0, Math.cos(angle) * 0.6]} rotation={[0, angle, 0]}>
          <boxGeometry args={[0.05, 2.1, 0.03]} />
          <meshStandardMaterial color="#B8AE9C" roughness={0.6} metalness={0.1} />
        </mesh>
      ))}
    </>
  );
}

function MarbleColumn() {
  const groupRef = useRef<Group>(null);
  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.15;
  });

  return (
    <group ref={groupRef}>
      {/* Pediment fragment — a triangular entablature slice behind/above the
          column, implying it's one column of a larger temple facade. */}
      <mesh position={[0, 1.55, -0.5]} rotation={[0, 0, 0]} castShadow>
        <coneGeometry args={[1.1, 0.55, 3]} />
        <meshStandardMaterial color={MARBLE} metalness={0.1} roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.22, -0.5]} castShadow>
        <boxGeometry args={[2.2, 0.14, 0.5]} />
        <meshStandardMaterial color={GILT} metalness={0.65} roughness={0.32} emissive="#6E5C3A" emissiveIntensity={0.25} />
      </mesh>

      {/* Shaft — pale marble, lightly glossy, with fluted grooves */}
      <mesh position={[0, 0, 0]} castShadow>
        <cylinderGeometry args={[0.58, 0.66, 2.2, 48]} />
        <meshStandardMaterial color={MARBLE} metalness={0.15} roughness={0.55} emissive="#3A352E" emissiveIntensity={0.25} />
      </mesh>
      <Fluting />
      {/* Capital (two gilt discs) */}
      <mesh position={[0, 1.15, 0]} castShadow>
        <cylinderGeometry args={[0.75, 0.62, 0.16, 48]} />
        <meshStandardMaterial color={GILT} metalness={0.7} roughness={0.3} emissive="#6E5C3A" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[0, 1.31, 0]} castShadow>
        <cylinderGeometry args={[0.66, 0.78, 0.12, 48]} />
        <meshStandardMaterial color={GILT_LIGHT} metalness={0.7} roughness={0.28} emissive="#6E5C3A" emissiveIntensity={0.3} />
      </mesh>
      {/* Base */}
      <mesh position={[0, -1.16, 0]} castShadow>
        <cylinderGeometry args={[0.76, 0.66, 0.14, 48]} />
        <meshStandardMaterial color={GILT} metalness={0.6} roughness={0.35} emissive="#6E5C3A" emissiveIntensity={0.25} />
      </mesh>
    </group>
  );
}

function DivineMotes() {
  const count = 10;
  const refs = useRef<(Mesh | null)[]>([]);
  const data = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        radius: 1.5 + (i % 2) * 0.4,
        speed: 0.2 + (i % 3) * 0.08,
        phase: (i / count) * Math.PI * 2,
        height: (i % 3) * 0.5 - 0.3,
      })),
    [],
  );

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    data.forEach((d, i) => {
      const mesh = refs.current[i];
      if (!mesh) return;
      const a = d.phase + t * d.speed;
      mesh.position.set(Math.cos(a) * d.radius, d.height + Math.sin(t * 0.4 + d.phase) * 0.2, Math.sin(a) * d.radius);
    });
  });

  return (
    <group>
      {data.map((_, i) => (
        <mesh key={i} ref={(el) => { refs.current[i] = el; }}>
          <sphereGeometry args={[0.025, 8, 8]} />
          <meshStandardMaterial color={GILT_LIGHT} emissive={GILT_LIGHT} emissiveIntensity={1.4} toneMapped={false} />
        </mesh>
      ))}
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
          <DivineMotes />
        </Float>
        <ContactShadows position={[0, -1.35, 0]} opacity={0.3} scale={5} blur={2.4} far={2.5} />
        <Environment preset="studio" />
      </Canvas>
    </div>
  );
}
