import React from 'react'
import { daylight } from './sceneConfig'

export default function Lighting() {
  return (
    <>
      <hemisphereLight args={['#fff3d9', '#b2aa8c', 1.65]} />
      <ambientLight intensity={0.22} />
      <directionalLight
        position={daylight.position}
        color="#fff0cf"
        intensity={daylight.intensity}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-camera-near={0.5}
        shadow-camera-far={35}
        shadow-bias={-0.0003}
        shadow-normalBias={0.025}
        shadow-radius={3}
      />
      <directionalLight position={[4, 4, 5]} color="#ffefd9" intensity={1.1} />
    </>
  )
}
