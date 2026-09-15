import React, { useMemo } from 'react'
import { DoubleSide } from 'three'
import { Box, Cylinder, Leaf } from './primitives'
import { BlanketBasket, TeaTray } from './StoryDetails'
import { ShelfCandle, WallClock } from './CottageAccents'
import { palette as p, room, windowOpening as w } from './sceneConfig'

function CurtainPanel({ x }) {
  const { positions, normals, indices } = useMemo(() => {
    const positions = [], normals = [], indices = []
    const segments = 32
    const width = 0.53
    for (let row = 0; row < 2; row += 1) {
      for (let i = 0; i <= segments; i += 1) {
        const t = i / segments
        const phase = t * Math.PI * 8
        const slope = 0.055 * Math.PI * 8 / width * Math.cos(phase)
        const length = Math.hypot(slope, 1)
        positions.push((t - 0.5) * width, row ? 0 : -3.36 + 0.018 * Math.cos(phase), 0.055 * Math.sin(phase))
        normals.push(-slope / length, 0, 1 / length)
        if (!row && i < segments) indices.push(i, i + 1, i + segments + 1, i + 1, i + segments + 2, i + segments + 1)
      }
    }
    return { positions: new Float32Array(positions), normals: new Float32Array(normals), indices }
  }, [])
  return (
    <group position={[x, w.top + 0.18, room.back + 0.36]}>
      <mesh castShadow receiveShadow>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-normal" args={[normals, 3]} />
          <bufferAttribute attach="index" args={[new Uint16Array(indices), 1]} />
        </bufferGeometry>
        <meshStandardMaterial color="#d8c9ab" side={DoubleSide} roughness={1} />
      </mesh>
      {[-0.2, -0.1, 0, 0.1, 0.2].map((offset) => (
        <mesh key={offset} position={[offset, 0.035, 0]}>
          <torusGeometry args={[0.037, 0.009, 6, 12]} />
          <meshStandardMaterial color={p.oakDark} roughness={0.85} />
        </mesh>
      ))}
    </group>
  )
}

function Vase({ position, color = p.ceramic, greenery = false }) {
  return (
    <group position={position}>
      <Cylinder position={[0, 0.035, 0]} radius={0.12} height={0.07} color={color} />
      <Leaf position={[0, 0.18, 0]} scale={[0.18, 0.19, 0.18]} color={color} />
      <Cylinder position={[0, 0.35, 0]} radius={0.075} bottom={0.105} height={0.18} color={color} />
      <Cylinder position={[0, 0.443, 0]} radius={0.06} height={0.006} color={p.oakDark} />
      {greenery && [0, 1, 2].map((i) => (
        <group key={i} position={[0, 0.44, 0]} rotation={[0, i * 2.1, -0.28]}>
          <Cylinder position={[0, 0.2, 0]} radius={0.009} height={0.43} color={p.darkGreen} segments={8} />
          <Leaf position={[0.07, 0.3, 0]} rotation={[0, 0, -0.6]} scale={[0.09, 0.17, 0.025]} color={p.sage} />
        </group>
      ))}
    </group>
  )
}

function Books({ position, heightScale = 1 }) {
  return (
    <group position={position} scale={[1, heightScale, 1]}>
      {[p.darkGreen, p.ceramic, p.terracotta, p.sage].map((color, i) => {
        const height = [0.42, 0.48, 0.38, 0.45][i]
        return (
          <group key={color} position={[i * 0.115, height / 2, 0]}>
            <Box size={[0.095, height, 0.24]} color={color} />
            {[-1, 1].map((end) => <Box key={end} position={[0, end * (height / 2 - 0.055), 0.124]} size={[0.088, 0.018, 0.008]} color={p.oakLight} />)}
            <Box position={[0, 0.035, 0.125]} size={[0.061, 0.098, 0.008]} color={p.ceramic} />
            {[-0.012, 0.017].map((y) => <Box key={y} position={[0, 0.035 + y, 0.131]} size={[0.036, 0.007, 0.004]} color={p.oakDark} />)}
          </group>
        )
      })}
    </group>
  )
}

function Shelf({ position, rotation = [0, 0, 0], width = 1.65, children }) {
  return (
    <group position={position} rotation={rotation}>
      <Box size={[width, 0.09, 0.38]} color={p.oakLight} />
      {[-width * 0.33, width * 0.33].map((x) => <Box key={x} position={[x, -0.13, -0.1]} size={[0.055, 0.22, 0.17]} color={p.oak} />)}
      <group position={[0, 0.045, 0]}>{children}</group>
    </group>
  )
}

function Sideboard() {
  return (
    <group name="oak-sideboard" position={[3.2, 0, room.back + 0.48]}>
      {[-0.72, 0.72].flatMap((x) => [-0.23, 0.23].map((z) => <Cylinder key={`${x}-${z}`} position={[x, 0.145, z]} radius={0.045} height={0.255} color={p.oakDark} segments={10} />))}
      <Box position={[0, 0.68, -0.27]} size={[1.8, 0.86, 0.055]} color={p.oakDark} />
      {[0.29, 1.1].map((y) => <Box key={y} position={[0, y, 0]} size={[1.86, 0.09, 0.68]} color={p.oakLight} />)}
      {[-0.87, 0.12, 0.87].map((x) => <Box key={x} position={[x, 0.69, 0]} size={[0.07, 0.74, 0.61]} color={p.oak} />)}
      <Box position={[-0.38, 0.69, 0.3]} size={[0.91, 0.7, 0.06]} color={p.oakLight} />
      <Cylinder position={[-0.08, 0.77, 0.35]} rotation={[Math.PI / 2, 0, 0]} radius={0.035} height={0.04} color={p.brass} segments={12} />
      <Box position={[0.49, 0.65, 0]} size={[0.69, 0.055, 0.58]} color={p.oak} />
      <Books position={[0.26, 0.335, 0.08]} heightScale={0.55} />
      <Box position={[0.48, 0.71, 0.06]} size={[0.46, 0.065, 0.34]} color={p.sage} />
      <Box position={[0.5, 0.765, 0.06]} size={[0.4, 0.045, 0.3]} color={p.ceramic} />
      <Vase position={[0.52, 1.145, 0]} color={p.terracotta} greenery />
      <TeaTray />
    </group>
  )
}

export default function RoomDetails() {
  return (
    <group name="room-details">
      <group name="linen-curtains">
        <Cylinder position={[(w.left + w.right) / 2, w.top + 0.23, room.back + 0.36]} rotation={[0, 0, Math.PI / 2]} radius={0.024} height={w.right - w.left + 1.32} color={p.oakDark} segments={12} />
        {[w.left - 0.32, w.right + 0.32].map((x) => <CurtainPanel key={x} x={x} />)}
      </group>
      <Shelf position={[3.22, 2.88, room.back + 0.3]}>
        <Books position={[-0.53, 0, 0]} />
        <ShelfCandle />
        <Vase position={[0.48, 0, 0]} />
      </Shelf>
      <Shelf position={[-room.width / 2 + 0.29, 3.45, -0.6]} rotation={[0, Math.PI / 2, 0]} width={1.45}>
        <Books position={[-0.46, 0, 0]} />
        <Vase position={[0.4, 0, 0]} color={p.terracotta} />
      </Shelf>
      <WallClock />
      <Sideboard />
      <BlanketBasket />
    </group>
  )
}
