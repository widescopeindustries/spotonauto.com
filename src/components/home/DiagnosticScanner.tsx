import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useAppStore } from '@/store/useAppStore'

function RotatingRings() {
  const groupRef = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    groupRef.current.children.forEach((ring, i) => {
      ring.rotation.x = Math.sin(clock.getElapsedTime() * 0.3 + i * 1.5) * 0.3
      ring.rotation.y += 0.005 * (i + 1)
      ring.rotation.z = Math.cos(clock.getElapsedTime() * 0.2 + i) * 0.2
    })
  })

  return (
    <group ref={groupRef}>
      {[1.2, 1.5, 1.8].map((radius, i) => (
        <mesh key={i} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[radius, 0.02, 16, 64]} />
          <meshStandardMaterial
            color={i === 1 ? '#5B8DB8' : '#FF6B00'}
            emissive={i === 1 ? '#5B8DB8' : '#FF6B00'}
            emissiveIntensity={0.8}
            transparent
            opacity={0.6}
          />
        </mesh>
      ))}
    </group>
  )
}

function BrainCore({ isScanning }: { isScanning: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const intensityRef = useRef(0.5)

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    meshRef.current.rotation.y += 0.01
    meshRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.5) * 0.1

    const targetIntensity = isScanning ? 2 : 0.5
    intensityRef.current += (targetIntensity - intensityRef.current) * 0.05
    const mat = meshRef.current.material as THREE.MeshStandardMaterial
    mat.emissiveIntensity = intensityRef.current
  })

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[0.6, 2]} />
      <meshStandardMaterial
        color="#111"
        emissive="#5B8DB8"
        emissiveIntensity={0.5}
        metalness={0.9}
        roughness={0.1}
        wireframe={false}
      />
    </mesh>
  )
}

function ScanParticles({ isScanning }: { isScanning: boolean }) {
  const pointsRef = useRef<THREE.Points>(null)
  const count = 80

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI
      const r = 1 + Math.random() * 2
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      pos[i * 3 + 2] = r * Math.cos(phi)
    }
    return pos
  }, [])

  const velocities = useMemo(() => {
    const vel = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI
      const speed = 0.02 + Math.random() * 0.03
      vel[i * 3] = speed * Math.sin(phi) * Math.cos(theta)
      vel[i * 3 + 1] = speed * Math.sin(phi) * Math.sin(theta)
      vel[i * 3 + 2] = speed * Math.cos(phi)
    }
    return vel
  }, [])

  useFrame(() => {
    if (!pointsRef.current || !isScanning) return
    const posArray = pointsRef.current.geometry.attributes.position.array as Float32Array
    for (let i = 0; i < count; i++) {
      posArray[i * 3] += velocities[i * 3]
      posArray[i * 3 + 1] += velocities[i * 3 + 1]
      posArray[i * 3 + 2] += velocities[i * 3 + 2]

      const dist = Math.sqrt(
        posArray[i * 3] ** 2 +
        posArray[i * 3 + 1] ** 2 +
        posArray[i * 3 + 2] ** 2
      )
      if (dist > 4) {
        const theta = Math.random() * Math.PI * 2
        const phi = Math.random() * Math.PI
        const r = 0.5 + Math.random() * 0.5
        posArray[i * 3] = r * Math.sin(phi) * Math.cos(theta)
        posArray[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
        posArray[i * 3 + 2] = r * Math.cos(phi)
      }
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true
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
        size={0.05}
        color="#FF6B00"
        transparent
        opacity={isScanning ? 0.9 : 0.2}
        sizeAttenuation
      />
    </points>
  )
}

function SceneContent() {
  const isScanning = useAppStore((s) => s.isScanning)

  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[2, 2, 2]} intensity={1} color="#5B8DB8" />
      <pointLight position={[-2, -2, 2]} intensity={0.5} color="#FF6B00" />

      <BrainCore isScanning={isScanning} />
      <RotatingRings />
      <ScanParticles isScanning={isScanning} />
    </>
  )
}

export default function DiagnosticScanner() {
  return (
    <div className="w-full h-[400px] md:h-[500px]">
      <Canvas
        camera={{ position: [0, 0, 4], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 1.5]}
      >
        <SceneContent />
      </Canvas>
    </div>
  )
}