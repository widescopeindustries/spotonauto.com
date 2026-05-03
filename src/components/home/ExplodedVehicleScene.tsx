import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { useAppStore } from '@/store/useAppStore'

function EngineBlock({ isExploded }: { isExploded: boolean }) {
  const ref = useRef<THREE.Group>(null)
  const currentPos = useRef(new THREE.Vector3(0, 0.3, 1.2))

  useFrame((_, delta) => {
    if (!ref.current) return
    const target = isExploded ? new THREE.Vector3(0, 1.5, 1.2) : new THREE.Vector3(0, 0.3, 1.2)
    currentPos.current.lerp(target, delta * 2)
    ref.current.position.copy(currentPos.current)
    if (isExploded) {
      ref.current.rotation.y += delta * 0.3
    }
  })

  return (
    <group ref={ref} position={[0, 0.3, 1.2]}>
      <mesh castShadow>
        <boxGeometry args={[0.8, 0.5, 0.6]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.35, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.15, 0.3, 16]} />
        <meshStandardMaterial color="#444" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[0.25, 0.35, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.12, 0.25, 16]} />
        <meshStandardMaterial color="#444" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[-0.25, 0.35, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.12, 0.25, 16]} />
        <meshStandardMaterial color="#444" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.35, 0.2]} castShadow>
        <cylinderGeometry args={[0.12, 0.12, 0.25, 16]} />
        <meshStandardMaterial color="#444" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.35, -0.2]} castShadow>
        <cylinderGeometry args={[0.12, 0.12, 0.25, 16]} />
        <meshStandardMaterial color="#444" metalness={0.9} roughness={0.2} />
      </mesh>
    </group>
  )
}

function Wheel({ position, isExploded, side }: {
  position: [number, number, number]
  isExploded: boolean
  side: 'left' | 'right'
}) {
  const ref = useRef<THREE.Group>(null)
  const currentPos = useRef(new THREE.Vector3(...position))

  const explodeDir = side === 'left' ? -1 : 1

  useFrame((_, delta) => {
    if (!ref.current) return
    const target = new THREE.Vector3(
      position[0] + explodeDir * (isExploded ? 1.2 : 0),
      position[1] + (isExploded ? 0.3 : 0),
      position[2]
    )
    currentPos.current.lerp(target, delta * 2)
    ref.current.position.copy(currentPos.current)
  })

  return (
    <group ref={ref} position={position}>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.35, 0.35, 0.2, 32]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.3} roughness={0.8} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.2, 0.2, 0.22, 16]} />
        <meshStandardMaterial color="#555" metalness={0.9} roughness={0.2} />
      </mesh>
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i} rotation={[0, 0, Math.PI / 2]} position={[
          Math.cos((i * Math.PI * 2) / 5) * 0.15,
          0,
          Math.sin((i * Math.PI * 2) / 5) * 0.15
        ]}>
          <cylinderGeometry args={[0.03, 0.03, 0.23, 8]} />
          <meshStandardMaterial color="#777" metalness={0.9} roughness={0.2} />
        </mesh>
      ))}
    </group>
  )
}

function SuspensionStrut({ position, isExploded }: {
  position: [number, number, number]
  isExploded: boolean
}) {
  const ref = useRef<THREE.Group>(null)
  const currentPos = useRef(new THREE.Vector3(...position))

  useFrame((_, delta) => {
    if (!ref.current) return
    const target = new THREE.Vector3(
      position[0] * (isExploded ? 1.5 : 1),
      position[1] + (isExploded ? 0.8 : 0),
      position[2] * (isExploded ? 1.3 : 1)
    )
    currentPos.current.lerp(target, delta * 2)
    ref.current.position.copy(currentPos.current)
  })

  return (
    <group ref={ref} position={position}>
      <mesh castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.6, 8]} />
        <meshStandardMaterial color="#FF6B00" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 0.15, 8]} />
        <meshStandardMaterial color="#ccc" metalness={0.9} roughness={0.2} />
      </mesh>
    </group>
  )
}

function ChassisBody({ isExploded }: { isExploded: boolean }) {
  const ref = useRef<THREE.Group>(null)
  const currentScale = useRef(1)

  useFrame((_, delta) => {
    if (!ref.current) return
    const targetScale = isExploded ? 0.85 : 1
    currentScale.current += (targetScale - currentScale.current) * delta * 2
    ref.current.scale.setScalar(currentScale.current)
  })

  return (
    <group ref={ref}>
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.8, 0.6, 3.8]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.6} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.95, -0.3]} castShadow>
        <boxGeometry args={[1.6, 0.4, 2.2]} />
        <meshStandardMaterial color="#151515" metalness={0.5} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[1.6, 0.1, 3.4]} />
        <meshStandardMaterial color="#222" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.6, 1.6]} castShadow>
        <boxGeometry args={[1.7, 0.35, 0.5]} />
        <meshStandardMaterial color="#111" metalness={0.7} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.6, -1.6]} castShadow>
        <boxGeometry args={[1.7, 0.35, 0.5]} />
        <meshStandardMaterial color="#111" metalness={0.7} roughness={0.4} />
      </mesh>
    </group>
  )
}

function Transmission({ isExploded }: { isExploded: boolean }) {
  const ref = useRef<THREE.Group>(null)
  const currentPos = useRef(new THREE.Vector3(0, 0.25, -1))

  useFrame((_, delta) => {
    if (!ref.current) return
    const target = isExploded ? new THREE.Vector3(0, -0.8, -1) : new THREE.Vector3(0, 0.25, -1)
    currentPos.current.lerp(target, delta * 2)
    ref.current.position.copy(currentPos.current)
  })

  return (
    <group ref={ref} position={[0, 0.25, -1]}>
      <mesh castShadow>
        <boxGeometry args={[0.6, 0.5, 0.7]} />
        <meshStandardMaterial color="#333" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0, -0.4]} castShadow>
        <cylinderGeometry args={[0.15, 0.15, 0.3, 16]} />
        <meshStandardMaterial color="#555" metalness={0.9} roughness={0.2} />
      </mesh>
    </group>
  )
}

function FloatingParticles() {
  const pointsRef = useRef<THREE.Points>(null)
  const count = 200

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 15
      pos[i * 3 + 1] = (Math.random() - 0.5) * 10
      pos[i * 3 + 2] = (Math.random() - 0.5) * 15
    }
    return pos
  }, [])

  useFrame(({ clock }) => {
    if (!pointsRef.current) return
    pointsRef.current.rotation.y = clock.getElapsedTime() * 0.02
    pointsRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.01) * 0.1
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        color="#5B8DB8"
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  )
}

function SceneContent() {
  const isExploded = useAppStore((s) => s.isExploded)

  return (
    <>
      <ambientLight intensity={0.15} />
      <spotLight
        position={[8, 12, 8]}
        angle={0.2}
        penumbra={1}
        intensity={3}
        color="#FF6B00"
        castShadow
      />
      <spotLight
        position={[-8, 8, -5]}
        angle={0.3}
        penumbra={0.8}
        intensity={2}
        color="#5B8DB8"
      />
      <pointLight position={[-5, 2, 5]} intensity={0.8} color="#FF6B00" />
      <pointLight position={[5, -2, -5]} intensity={0.5} color="#5B8DB8" />

      <group position={[0, -0.5, 0]}>
        <ChassisBody isExploded={isExploded} />
        <EngineBlock isExploded={isExploded} />
        <Transmission isExploded={isExploded} />
        <Wheel position={[-1, 0, 1.2]} isExploded={isExploded} side="left" />
        <Wheel position={[1, 0, 1.2]} isExploded={isExploded} side="right" />
        <Wheel position={[-1, 0, -1.2]} isExploded={isExploded} side="left" />
        <Wheel position={[1, 0, -1.2]} isExploded={isExploded} side="right" />
        <SuspensionStrut position={[-0.8, 0.5, 1.2]} isExploded={isExploded} />
        <SuspensionStrut position={[0.8, 0.5, 1.2]} isExploded={isExploded} />
        <SuspensionStrut position={[-0.8, 0.5, -1.2]} isExploded={isExploded} />
        <SuspensionStrut position={[0.8, 0.5, -1.2]} isExploded={isExploded} />
      </group>

      <FloatingParticles />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial
          color="#050507"
          metalness={0.8}
          roughness={0.2}
          transparent
          opacity={0.3}
        />
      </mesh>

      <OrbitControls
        enablePan={false}
        enableZoom={false}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 1.8}
        autoRotate
        autoRotateSpeed={0.5}
      />
    </>
  )
}

export default function ExplodedVehicleScene() {
  return (
    <div className="absolute inset-0 z-0">
      <Canvas
        camera={{ position: [0, 2, 8], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 1.5]}
      >
        <SceneContent />
      </Canvas>
    </div>
  )
}