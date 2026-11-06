import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Float } from "@react-three/drei";
import type { Group, Mesh } from "three";

/** The widest thing the scene ever draws, measured from the origin: the orbit
 *  ring at 2.2 plus its tube, and the outermost mote orbit. The camera
 *  distance below is derived from this rather than guessed — the first version
 *  hard-coded z=7.2, which gives a visible half-height of 2.20 at fov 34, so
 *  the ring (2.35) and the outer motes (2.46) were being clipped by the
 *  frustum. That read as "the box is smaller than the model", because it was.
 *
 *  Assumes a square-or-wider container: r3f's `fov` is vertical, so on a
 *  container taller than it is wide the horizontal axis becomes the tighter
 *  one. Every caller uses `aspect-square`. */
const CONTENT_RADIUS = 2.5;
const FOV = 34;
const FRAME_MARGIN = 1.16;

function cameraDistance(radius = CONTENT_RADIUS): number {
  return (radius * FRAME_MARGIN) / Math.tan((FOV / 2) * (Math.PI / 180));
}

const MARBLE = "#D8D0C2";
const MARBLE_DEEP = "#B4AA98";
const GILT = "#C9B99A";
const GILT_LIGHT = "#E3D3AF";

/** react-three-fiber locks in the browser's default 300×150 when it measures
 *  the container before layout has settled, and only self-corrects on a later
 *  resize event. The previous piece fired one `resize` on the next animation
 *  frame; verified in the browser, that is still too early here — the hero has
 *  an entry transition and a `min(78vh, 680px)` container, so the real size
 *  lands after that frame and the canvas stayed 300×150 while its parent
 *  measured 900×680.
 *
 *  Observing the container instead of guessing a delay fixes it for good: any
 *  size change — first layout, window resize, the hero reflowing on a font
 *  swap — pushes r3f to re-measure. */
function useCanvasResizeFix<T extends HTMLElement>(ref: React.RefObject<T>) {
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const fire = () => window.dispatchEvent(new Event("resize"));
    const observer = new ResizeObserver(fire);
    observer.observe(node);
    document.fonts?.ready?.then(fire).catch(() => {});
    return () => observer.disconnect();
  }, [ref]);
}

/** The Alpha, built as a monument.
 *
 *  The piece this replaces was a single Doric column in a 256×256 box under
 *  the hero: small, generic, unrelated to anything else on the page, and
 *  carrying none of the brand. This one *is* the mark — the same two slopes,
 *  the same entablature, the same keystone — extruded into marble and lit like
 *  a monument, so the 3D anchor and the logo are one idea rather than two.
 *
 *  Two leaning slabs form the Λ, a gilt lintel crosses them into an Α, a gilt
 *  keystone burns at the apex, and a tilted ring orbits the whole thing. Every
 *  shape is a primitive: at hero scale, crisp geometry reads better than a
 *  detailed model rendered small. */
function AlphaMonument() {
  const groupRef = useRef<Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.12;
  });

  return (
    <group ref={groupRef} position={[0, -0.15, 0]}>
      {/* left slope */}
      <mesh position={[-0.62, 0, 0]} rotation={[0, 0, 0.3]} castShadow receiveShadow>
        <boxGeometry args={[0.34, 3.1, 0.34]} />
        <meshStandardMaterial color={MARBLE} metalness={0.12} roughness={0.5} emissive="#4A443A" emissiveIntensity={0.18} />
      </mesh>
      {/* right slope */}
      <mesh position={[0.62, 0, 0]} rotation={[0, 0, -0.3]} castShadow receiveShadow>
        <boxGeometry args={[0.34, 3.1, 0.34]} />
        <meshStandardMaterial color={MARBLE_DEEP} metalness={0.12} roughness={0.5} emissive="#4A443A" emissiveIntensity={0.18} />
      </mesh>

      {/* the entablature — the stroke that makes it an Alpha */}
      <mesh position={[0, -0.28, 0]} castShadow>
        <boxGeometry args={[1.5, 0.2, 0.4]} />
        <meshStandardMaterial color={GILT} metalness={0.72} roughness={0.28} emissive="#6E5C3A" emissiveIntensity={0.35} />
      </mesh>

      {/* keystone at the apex */}
      <mesh position={[0, 1.72, 0]} castShadow>
        <icosahedronGeometry args={[0.24, 0]} />
        <meshStandardMaterial
          color={GILT_LIGHT}
          emissive={GILT_LIGHT}
          emissiveIntensity={1.1}
          metalness={0.5}
          roughness={0.25}
          toneMapped={false}
        />
      </mesh>

      {/* plinth */}
      <mesh position={[0, -1.62, 0]} receiveShadow>
        <cylinderGeometry args={[1.25, 1.4, 0.16, 6]} />
        <meshStandardMaterial color={MARBLE_DEEP} metalness={0.1} roughness={0.7} />
      </mesh>
    </group>
  );
}

/** A gilt ring on a fixed tilt, turning against the monument's own rotation —
 *  the counter-motion is what gives the composition depth at a glance. */
function OrbitRing() {
  const ref = useRef<Mesh>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.z -= delta * 0.18;
  });
  return (
    <mesh ref={ref} rotation={[1.32, 0, 0]}>
      <torusGeometry args={[2.2, 0.018, 12, 128]} />
      <meshStandardMaterial color={GILT} emissive={GILT} emissiveIntensity={0.7} toneMapped={false} />
    </mesh>
  );
}

function Motes({ count = 14 }: { count?: number }) {
  const refs = useRef<(Mesh | null)[]>([]);
  const data = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        radius: 1.45 + (i % 4) * 0.28,
        speed: 0.14 + (i % 3) * 0.06,
        phase: (i / count) * Math.PI * 2,
        height: ((i % 5) - 2) * 0.42,
        drift: 0.18 + (i % 3) * 0.08,
      })),
    [count],
  );

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    data.forEach((d, i) => {
      const mesh = refs.current[i];
      if (!mesh) return;
      const a = d.phase + t * d.speed;
      mesh.position.set(
        Math.cos(a) * d.radius,
        d.height + Math.sin(t * 0.35 + d.phase) * d.drift,
        Math.sin(a) * d.radius,
      );
    });
  });

  return (
    <group>
      {data.map((_, i) => (
        <mesh key={i} ref={(el) => { refs.current[i] = el; }}>
          <sphereGeometry args={[0.028, 8, 8]} />
          <meshStandardMaterial color={GILT_LIGHT} emissive={GILT_LIGHT} emissiveIntensity={1.5} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

/** Hero-scale by default: it fills its container instead of sitting in a fixed
 *  256px box, so the caller decides the composition. `compact` trims the ring
 *  and the mote count for the small slot on the login panel. */
export function Monolith3D({ compact = false, className }: { compact?: boolean; className?: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  useCanvasResizeFix(hostRef);

  return (
    <div ref={hostRef} className={className ?? "h-full w-full"}>
      <Canvas
        shadows
        dpr={[1, 1.75]}
        camera={{
          position: [0, 0.4, cameraDistance(compact ? CONTENT_RADIUS - 0.35 : CONTENT_RADIUS)],
          fov: FOV,
        }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[3, 6, 4]} intensity={1.35} castShadow />
        <directionalLight position={[-4, 1, 2]} intensity={0.45} color="#E6D3A8" />
        <pointLight position={[0, 1.8, 2.5]} intensity={0.5} color="#F0E4C6" />
        <Float floatIntensity={0.35} speed={1.1} rotationIntensity={0}>
          <AlphaMonument />
          {!compact && <OrbitRing />}
          <Motes count={compact ? 8 : 14} />
        </Float>
        <Environment preset="studio" />
      </Canvas>
    </div>
  );
}
