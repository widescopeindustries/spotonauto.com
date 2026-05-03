"use client";
import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import SceneErrorBoundary from './SceneErrorBoundary'

function DustParticles() {
  const pointsRef = useRef<THREE.Points>(null)
  const count = 300

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20
      pos[i * 3 + 1] = Math.random() * 8
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20
    }
    return pos
  }, [])

  const velocities = useMemo(() => {
    const vel = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      vel[i * 3] = (Math.random() - 0.5) * 0.005
      vel[i * 3 + 1] = Math.random() * 0.003 + 0.001
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.005
    }
    return vel
  }, [])

  useFrame(() => {
    if (!pointsRef.current) return
    const posArray = pointsRef.current.geometry.attributes.position.array as Float32Array
    for (let i = 0; i < count; i++) {
      posArray[i * 3] += velocities[i * 3]
      posArray[i * 3 + 1] += velocities[i * 3 + 1]
      posArray[i * 3 + 2] += velocities[i * 3 + 2]

      if (posArray[i * 3 + 1] > 8) {
        posArray[i * 3 + 1] = 0
        posArray[i * 3] = (Math.random() - 0.5) * 20
        posArray[i * 3 + 2] = (Math.random() - 0.5) * 20
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
        size={0.04}
        color="#888"
        transparent
        opacity={0.4}
        sizeAttenuation
      />
    </points>
  )
}

function LightBeams() {
  const beamsRef = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    if (!beamsRef.current) return
    beamsRef.current.children.forEach((beam, i) => {
      const mesh = beam as THREE.Mesh
      if (mesh.material) {
        const mat = mesh.material as THREE.MeshBasicMaterial
        mat.opacity = 0.03 + Math.sin(clock.getElapsedTime() * 0.5 + i) * 0.02
      }
    })
  })

  return (
    <group ref={beamsRef}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[i * 3 - 3, 4, -2]} rotation={[0.3, i * 0.5, 0]}>
          <cylinderGeometry args={[0.8, 2.5, 10, 16, 1, true]} />
          <meshBasicMaterial
            color="#FF6B00"
            transparent
            opacity={0.04}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  )
}

function Workbench() {
  return (
    <group position={[-4, 0, -2]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[3, 0.1, 1.5]} />
        <meshStandardMaterial color="#333" metalness={0.3} roughness={0.8} />
      </mesh>
      <mesh position={[0, -0.5, 0]} castShadow>
        <boxGeometry args={[2.8, 1, 1.3]} />
        <meshStandardMaterial color="#222" metalness={0.2} roughness={0.9} />
      </mesh>
      <mesh position={[-1, 0.15, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.15, 0.2, 16]} />
        <meshStandardMaterial color="#555" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0.5, 0.15, 0.3]} castShadow>
        <boxGeometry args={[0.3, 0.1, 0.5]} />
        <meshStandardMaterial color="#FF6B00" metalness={0.6} roughness={0.4} />
      </mesh>
    </group>
  )
}

function ToolRack() {
  return (
    <group position={[4, 1, -3]}>
      <mesh castShadow>
        <boxGeometry args={[0.1, 3, 2]} />
        <meshStandardMaterial color="#444" metalness={0.5} roughness={0.6} />
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[0.15, 0.5 - i * 0.5, 0.5]} castShadow>
          <boxGeometry args={[0.3, 0.05, 0.05]} />
          <meshStandardMaterial color="#666" metalness={0.9} roughness={0.2} />
        </mesh>
      ))}
    </group>
  )
}

function GarageFloor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
      <planeGeometry args={[40, 40]} />
      <meshStandardMaterial
        color="#111"
        metalness={0.6}
        roughness={0.7}
      />
    </mesh>
  )
}

function SceneContent() {
  return (
    <>
      <fog attach="fog" args={['#050507', 6, 25]} />
      <ambientLight intensity={0.1} />
      <spotLight
        position={[0, 8, 2]}
        angle={0.4}
        penumbra={0.8}
        intensity={2}
        color="#FF6B00"
        castShadow
      />
      <pointLight position={[-3, 3, 3]} intensity={0.6} color="#5B8DB8" />
      <pointLight position={[5, 2, -2]} intensity={0.4} color="#FF6B00" />

      <GarageFloor />
      <Workbench />
      <ToolRack />
      <LightBeams />
      <DustParticles />
    </>
  )
}

export default function GarageWorkshopScene() {
  return (
    <div className="absolute inset-0 z-0">
      <SceneErrorBoundary>
        <Canvas
          camera={{ position: [0, 3, 10], fov: 50 }}
          gl={{ antialias: true, alpha: true }}
          dpr={[1, 1.5]}
        >
          <SceneContent />
        </Canvas>
      </SceneErrorBoundary>
    </div>
  )
}