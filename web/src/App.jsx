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

function InteractiveForms({ activeObject, onObjectActivate }) {
  const group = useRef(null)
  const pulse = useRef(0)
  useEffect(() => { pulse.current = activeObject ? 1 : 0 }, [activeObject])
  useFrame((_, delta) => {
    if (!group.current) return
    group.current.rotation.y += delta * 0.018
    if (pulse.current > 0) {
      group.current.scale.setScalar(1 + pulse.current * 0.035)
      pulse.current = Math.max(0, pulse.current - delta * 2.5)
    } else group.current.scale.setScalar(1)
  })
  return (
    <group ref={group}>
      <mesh
        name="stone"
        position={[-1.8, 0.8, -1]}
        onPointerOver={(event) => { event.stopPropagation(); document.body.style.cursor = 'pointer' }}
        onPointerOut={() => { document.body.style.cursor = '' }}
        onClick={() => onObjectActivate('stone')}
      >
        <icosahedronGeometry args={[1.4, 1]} />
        <meshStandardMaterial color={activeObject === 'stone' ? '#8daa96' : '#b9cdbd'} roughness={0.78} />
      </mesh>
      <mesh
        name="ring"
        position={[2, -0.8, -0.5]}
        onPointerOver={(event) => { event.stopPropagation(); document.body.style.cursor = 'pointer' }}
        onPointerOut={() => { document.body.style.cursor = '' }}
        onClick={() => onObjectActivate('ring')}
      >
        <torusGeometry args={[1.1, 0.28, 12, 32]} />
        <meshStandardMaterial color={activeObject === 'ring' ? '#c28d67' : '#d6b18f'} roughness={0.72} />
      </mesh>
    </group>
  )
}

function AmbientScene({ activeObject, pointer, onObjectActivate }) {
  return (
    <div className="ambient-scene" data-testid="ambient-scene" aria-hidden="true">
      <Canvas camera={{ position: [0, 0, 7], fov: 42 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={1.4} />
        <directionalLight position={[3, 4, 5]} intensity={1.6} />
        <CameraDrift pointer={pointer} />
        <InteractiveForms activeObject={activeObject} onObjectActivate={onObjectActivate} />
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

  const activateObject = (name) => {
    setActiveObject(name)
    window.setTimeout(() => setActiveObject((current) => current === name ? null : current), 360)
  }

  const updatePointer = (event) => {
    const x = (event.clientX / window.innerWidth - 0.5) * 2
    const y = (event.clientY / window.innerHeight - 0.5) * 2
    setPointer({ x: Math.max(-1, Math.min(1, x)), y: Math.max(-1, Math.min(1, y)) })
  }

  return (
    <main
      className="app-shell"
      onPointerMove={reducedMotion ? undefined : updatePointer}
      onPointerLeave={reducedMotion ? undefined : () => setPointer({ x: 0, y: 0 })}
      style={{ '--card-tilt-x': `${pointer.y * -5}deg`, '--card-tilt-y': `${pointer.x * 5}deg`, '--card-shift-x': `${pointer.x * 16}px`, '--card-shift-y': `${pointer.y * 16}px` }}
    >
      {fallback ? <StaticFallback /> : <SceneBoundary><AmbientScene activeObject={activeObject} pointer={pointer} onObjectActivate={activateObject} /></SceneBoundary>}
      <section className="question-card" aria-labelledby="app-title">
        <p className="eyebrow">A moment for yourself</p>
        <h1 id="app-title">Hygge</h1>
        <p className="intro">Slow down and notice what makes today feel good.</p>
        <div className="question-panel">
          <p className="question-label">Reflect on this</p>
          <h2>{question}</h2>
        </div>
        <div className="controls" aria-label="Scene controls">
          <button type="button" onClick={() => setQuestion(nextQuestion(question))}>Another question</button>
          <button type="button" className={activeObject === 'stone' ? 'object-control is-active' : 'object-control'} onClick={() => activateObject('stone')} onKeyDown={(event) => { if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); activateObject('stone') } }}>Wake the stone</button>
          <button type="button" className={activeObject === 'ring' ? 'object-control is-active' : 'object-control'} onClick={() => activateObject('ring')} onKeyDown={(event) => { if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); activateObject('ring') } }}>Turn the ring</button>
        </div>
      </section>
    </main>
  )
}
