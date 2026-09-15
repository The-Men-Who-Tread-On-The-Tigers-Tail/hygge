import React, { useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { ACESFilmicToneMapping, PCFShadowMap } from 'three'
import CameraRig from './CameraRig'
import Lighting from './Lighting'
import Room from './Room'
import RoomProps from './RoomProps'
import { cameraConfig, palette } from './sceneConfig'

function ContextLossHandler({ onFailure }) {
  const gl = useThree((state) => state.gl)
  useEffect(() => {
    const canvas = gl.domElement
    const handleLoss = (event) => {
      event.preventDefault()
      onFailure?.(new Error('The 3D room lost its graphics context.'))
    }
    canvas.addEventListener('webglcontextlost', handleLoss)
    return () => canvas.removeEventListener('webglcontextlost', handleLoss)
  }, [gl, onFailure])
  return null
}

export default function HyggeWorld({ onFailure }) {
  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 1.5]}
      shadows={{ type: PCFShadowMap }}
      camera={{ position: [4, 4, 9], fov: cameraConfig.fov, near: 0.1, far: 60 }}
      gl={{ antialias: true, alpha: false, toneMapping: ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
      style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
      aria-hidden="true"
    >
      <color attach="background" args={[palette.background]} />
      <ContextLossHandler onFailure={onFailure} />
      <CameraRig />
      <Lighting />
      <Room />
      <RoomProps />
    </Canvas>
  )
}
