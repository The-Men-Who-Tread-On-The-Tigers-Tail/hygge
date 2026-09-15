import React, { useMemo } from 'react'
import { Object3D } from 'three'
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js'
import { daylight, placement } from './sceneConfig'

RectAreaLightUniformsLib.init()

export default function Lighting() {
  const bounceTarget = useMemo(() => {
    const target = new Object3D()
    target.position.set(0, 0, 0.6)
    return target
  }, [])
  const lampTarget = useMemo(() => {
    const target = new Object3D()
    target.position.set(placement.lamp[0] - 0.35, 0, placement.lamp[2] + 0.4)
    return target
  }, [])

  return (
    <>
      {/* Low-contrast room bounce, not a second unoccluded sun. */}
      <hemisphereLight args={['#f5f0e6', '#b2aa8c', 1.35]} />
      <ambientLight intensity={0.18} />
      {/* An overcast aperture has no collimated rays or sharp mullion stripes.
          Area lights do not cast shadows in WebGL; the dim ceiling bounce below
          supplies furniture occlusion without projecting a window across the room. */}
      <rectAreaLight
        position={daylight.position}
        rotation={[0, Math.PI, 0]}
        width={daylight.width}
        height={daylight.height}
        color="#fff4e2"
        intensity={daylight.intensity}
      />
      <primitive object={bounceTarget} />
      <spotLight
        position={[0.1, 4.35, 0.6]}
        target={bounceTarget}
        color="#f5ead8"
        intensity={16}
        distance={10}
        decay={2}
        angle={1.15}
        penumbra={1}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={0.3}
        shadow-camera-far={10}
        shadow-bias={-0.0002}
        shadow-normalBias={0.015}
        shadow-radius={5}
      />
      <primitive object={lampTarget} />
      {/* Just below the shade's opaque diffuser, so the existing shade geometry
          cannot swallow the light. Aim off the stem to avoid a pole-shaped void. */}
      <spotLight
        position={[placement.lamp[0], 1.92, placement.lamp[2]]}
        target={lampTarget}
        color="#ffd49b"
        intensity={4.5}
        distance={4.5}
        decay={2}
        angle={1.05}
        penumbra={1}
        castShadow
        shadow-mapSize={[512, 512]}
        shadow-camera-near={0.05}
        shadow-camera-far={4.5}
        shadow-bias={-0.0002}
        shadow-normalBias={0.01}
        shadow-radius={4}
      />
    </>
  )
}
