import { Canvas, useFrame, useThree } from '@react-three/fiber'
import React, { useEffect, useRef, useState } from 'react'
import { firstQuestion, nextQuestion } from './questions'
import './styles.css'

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.(REDUCED_MOTION_QUERY).matches
}

function webglAvailable() {
  if (typeof document === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
  } catch {
    return false
  }
}

function CameraDrift({ pointer }) {
  const { camera } = useThree()
  useFrame(() => {
    camera.position.x += (pointer.x * 0.3 - camera.position.x) * 0.03
    camera.position.y += (-pointer.y * 0.3 - camera.position.y) * 0.03
    camera.rotation.z += (pointer.x * 0.052 - camera.rotation.z) * 0.03
  })
  return null
}

function InteractiveForms({ activeObject }) {
  const group = useRef(null)
  const stone = useRef(null)
  const ring = useRef(null)

  useFrame((_, delta) => {
    if (!group.current) return
    group.current.rotation.y += delta * 0.025

    const animate = (mesh, active, spin) => {
      if (!mesh.current) return
      const scale = active ? 1.2 : 1
      mesh.current.scale.x += (scale - mesh.current.scale.x) * Math.min(delta * 8, 1)
      mesh.current.scale.y += (scale - mesh.current.scale.y) * Math.min(delta * 8, 1)
      mesh.current.scale.z += (scale - mesh.current.scale.z) * Math.min(delta * 8, 1)
      mesh.current.rotation.y += delta * (active ? spin : 0.08)
    }

    animate(stone, activeObject === 'stone', 1.4)
    animate(ring, activeObject === 'ring', -1.8)
  })

  return (
    <group ref={group}>
      <mesh
        ref={stone}
        name="stone"
        position={[-1.9, 0.9, -1]}
      >
        <icosahedronGeometry args={[1.55, 1]} />
        <meshStandardMaterial color={activeObject === 'stone' ? '#3f8f6a' : '#8cb9a0'} emissive={activeObject === 'stone' ? '#174c35' : '#000000'} emissiveIntensity={activeObject === 'stone' ? 0.45 : 0} roughness={0.58} metalness={0.12} />
      </mesh>
      <mesh
        ref={ring}
        name="ring"
        position={[2.1, -0.9, -0.5]}
      >
        <torusGeometry args={[1.25, 0.34, 16, 48]} />
        <meshStandardMaterial color={activeObject === 'ring' ? '#d56a2a' : '#d69b6f'} emissive={activeObject === 'ring' ? '#6f260c' : '#000000'} emissiveIntensity={activeObject === 'ring' ? 0.45 : 0} roughness={0.46} metalness={0.28} />
      </mesh>
    </group>
  )
}

function AmbientScene({ activeObject, pointer }) {
  return (
    <div className="ambient-scene" data-testid="ambient-scene" aria-hidden="true">
      <Canvas camera={{ position: [0, 0, 7], fov: 42 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={1.4} />
        <directionalLight position={[3, 4, 5]} intensity={1.6} />
        <CameraDrift pointer={pointer} />
        <InteractiveForms activeObject={activeObject} />
      </Canvas>
    </div>
  )
}

function StaticFallback() {
  return <div className="scene-fallback" data-testid="scene-fallback" aria-hidden="true" />
}

class SceneBoundary extends React.Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? <StaticFallback /> : this.props.children }
}

export default function App() {
  const [question, setQuestion] = useState(firstQuestion)
  const [reducedMotion, setReducedMotion] = useState(prefersReducedMotion)
  const [activeObject, setActiveObject] = useState(null)
  const [pointer, setPointer] = useState({ x: 0, y: 0 })
  const fallback = reducedMotion || !webglAvailable()

  useEffect(() => {
    const query = window.matchMedia?.(REDUCED_MOTION_QUERY)
    if (!query) return undefined
    const update = () => setReducedMotion(query.matches)
    query.addEventListener?.('change', update)
    return () => query.removeEventListener?.('change', update)
  }, [])

  const advanceQuestion = () => {
    setQuestion(nextQuestion(question))
    setActiveObject((current) => current === 'stone' ? 'ring' : 'stone')
  }

  const updatePointer = (event) => {
    const x = (event.clientX / window.innerWidth - 0.5) * 2
    const y = (event.clientY / window.innerHeight - 0.5) * 2
    setPointer({ x: Math.max(-1, Math.min(1, x)), y: Math.max(-1, Math.min(1, y)) })
  }

  return (
    <main
      className={`app-shell${activeObject ? ` scene-${activeObject}` : ''}`}
      onPointerMove={reducedMotion ? undefined : updatePointer}
      onPointerLeave={reducedMotion ? undefined : () => setPointer({ x: 0, y: 0 })}
      style={{ '--card-tilt-x': `${pointer.y * -5}deg`, '--card-tilt-y': `${pointer.x * 5}deg`, '--card-shift-x': `${pointer.x * 16}px`, '--card-shift-y': `${pointer.y * 16}px` }}
    >
      {fallback ? <StaticFallback /> : <SceneBoundary><AmbientScene activeObject={activeObject} pointer={pointer} /></SceneBoundary>}
      <section className="question-card" aria-labelledby="app-title">
        <p className="eyebrow">A moment for yourself</p>
        <h1 id="app-title">Hygge</h1>
        <p className="intro">Slow down and notice what makes today feel good.</p>
        <div className="question-panel">
          <p className="question-label">Reflect on this</p>
          <h2>{question}</h2>
        </div>
        <div className="controls">
          <button type="button" onClick={advanceQuestion}>Another question</button>
        </div>
        <p className="scene-status" aria-live="polite">{activeObject === 'stone' ? 'A green stone pulse accompanies this question.' : activeObject === 'ring' ? 'A warm ring motion accompanies this question.' : 'The next question will bring the scene to life.'}</p>
      </section>
    </main>
  )
}
