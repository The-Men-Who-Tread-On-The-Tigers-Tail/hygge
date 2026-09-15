import React from 'react'
import { PaintedMaterial } from './PaintedSurface'

export function Box({ size, color, roughness = 0.85, ...props }) {
  return (
    <mesh castShadow receiveShadow {...props}>
      <boxGeometry args={size} />
      <PaintedMaterial color={color} roughness={roughness} />
    </mesh>
  )
}

export function Cylinder({ radius = 0.1, bottom = radius, height = 1, color, segments = 32, ...props }) {
  return (
    <mesh castShadow receiveShadow {...props}>
      <cylinderGeometry args={[radius, bottom, height, segments]} />
      <PaintedMaterial color={color} roughness={0.75} />
    </mesh>
  )
}

export function Leaf({ color, ...props }) {
  return (
    <mesh castShadow receiveShadow {...props}>
      <sphereGeometry args={[1, 12, 8]} />
      <PaintedMaterial color={color} roughness={0.95} />
    </mesh>
  )
}
