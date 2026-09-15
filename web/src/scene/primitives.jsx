import React from 'react'

export function Box({ size, color, roughness = 0.85, ...props }) {
  return (
    <mesh castShadow receiveShadow {...props}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={roughness} />
    </mesh>
  )
}

export function Cylinder({ radius = 0.1, bottom = radius, height = 1, color, segments = 32, ...props }) {
  return (
    <mesh castShadow receiveShadow {...props}>
      <cylinderGeometry args={[radius, bottom, height, segments]} />
      <meshStandardMaterial color={color} roughness={0.75} />
    </mesh>
  )
}

export function Leaf({ color, ...props }) {
  return (
    <mesh castShadow receiveShadow {...props}>
      <sphereGeometry args={[1, 12, 8]} />
      <meshStandardMaterial color={color} roughness={0.95} />
    </mesh>
  )
}
