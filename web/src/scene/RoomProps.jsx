import React from 'react'
import { DoubleSide } from 'three'
import { Box, Cylinder, Leaf } from './primitives'
import { palette as p, placement } from './sceneConfig'

function Mug() {
  return (
    <group name="mug" position={[0.48, 1.455, -0.18]}>
      <Cylinder radius={0.22} height={0.035} position={[0, 0, 0]} color={p.ceramic} />
      <Cylinder radius={0.14} bottom={0.115} height={0.24} position={[0, 0.14, 0]} color={p.ceramic} />
      <Cylinder radius={0.118} height={0.008} position={[0, 0.263, 0]} color="#694d34" />
      <mesh position={[0.16, 0.15, 0]} rotation={[0, 0, -0.2]} castShadow>
        <torusGeometry args={[0.09, 0.025, 10, 24]} />
        <meshStandardMaterial color={p.ceramic} roughness={0.4} />
      </mesh>
    </group>
  )
}

function Table() {
  return (
    <group name="table" position={placement.table}>
      <Cylinder position={[0, 1.36, 0]} radius={1.18} height={0.15} color={p.oakLight} segments={64} />
      <Cylinder position={[0, 1.245, 0]} radius={0.92} height={0.13} color={p.oak} />
      {[-0.68, 0.68].flatMap((x) => [-0.58, 0.58].map((z) => <Box key={`${x}-${z}`} position={[x, 0.63, z]} size={[0.13, 1.22, 0.13]} color={p.oak} />))}
      <Mug />
      <group name="books" position={[-0.33, 1.45, -0.15]} rotation={[0, -0.16, 0]}>
        <Box size={[0.5, 0.045, 0.67]} color={p.darkGreen} />
        <Box position={[0, 0.035, 0]} size={[0.46, 0.03, 0.62]} color={p.ceramic} />
        <Box position={[0, 0.06, 0]} size={[0.5, 0.02, 0.67]} color={p.sage} />
      </group>
    </group>
  )
}

function Chair() {
  return (
    <group name="chair" position={placement.chair} rotation={[0, -0.6, 0]}>
      <Box position={[0, 0.78, 0]} size={[0.87, 0.12, 0.85]} color={p.oak} />
      <Box position={[0, 0.865, 0]} size={[0.79, 0.1, 0.74]} color={p.sage} />
      {[-0.34, 0.34].flatMap((x) => [-0.31, 0.31].map((z) => <Box key={`${x}-${z}`} position={[x, 0.4, z]} size={[0.09, 0.76, 0.09]} color={p.oakDark} />))}
      {[-0.36, 0.36].map((x) => <Box key={x} position={[x, 1.14, 0.36]} size={[0.09, 1.35, 0.09]} color={p.oak} />)}
      <Box position={[0, 1.66, 0.36]} size={[0.82, 0.25, 0.1]} color={p.oakLight} />
      {[-0.18, 0, 0.18].map((x) => <Box key={x} position={[x, 1.28, 0.36]} size={[0.045, 0.57, 0.065]} color={p.oak} />)}
    </group>
  )
}

function Lamp() {
  return (
    <group name="floor-lamp" position={placement.lamp}>
      <Cylinder position={[0, 0.065, 0]} radius={0.36} height={0.09} color={p.oakDark} />
      <Cylinder position={[0, 1.18, 0]} radius={0.035} height={2.2} color={p.brass} />
      <mesh position={[0, 2.28, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.29, 0.56, 0.65, 40, 1, true]} />
        <meshStandardMaterial color="#f7dfae" emissive="#efbc69" emissiveIntensity={0.16} roughness={0.9} side={DoubleSide} />
      </mesh>
      <Cylinder position={[0, 1.96, 0]} radius={0.56} height={0.025} color="#e8c68d" />
    </group>
  )
}

function Plant() {
  return (
    <group name="plant" position={placement.plant}>
      <Cylinder position={[0, 0.065, 0]} radius={0.39} height={0.06} color={p.terracotta} />
      <Cylinder position={[0, 0.33, 0]} radius={0.35} bottom={0.25} height={0.5} color={p.terracotta} />
      <Cylinder position={[0, 0.575, 0]} radius={0.36} height={0.09} color="#ca8968" />
      <Cylinder position={[0, 0.623, 0]} radius={0.31} height={0.012} color="#695942" />
      <Cylinder position={[0, 1.13, 0]} radius={0.028} height={1.02} color={p.darkGreen} />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <group key={i} position={[0, 0.86 + i * 0.12, 0]} rotation={[0, i * 2.4, 0]}>
          <Cylinder position={[0.12, 0.06, 0]} radius={0.014} height={0.3} rotation={[0, 0, -1]} color={p.darkGreen} />
          <Leaf position={[0.3, 0.13, 0]} rotation={[0, 0, -0.7]} scale={[0.16, 0.36, 0.065]} color={i % 2 ? p.leaf : p.darkGreen} />
        </group>
      ))}
    </group>
  )
}

export default function RoomProps() {
  return (
    <group name="room-props">
      <group name="woven-rug" position={[0, 0.035, 0.65]} rotation={[0, -0.09, 0]}>
        <Box size={[3.6, 0.025, 3.25]} color={p.rug} />
        {[-1.43, -1.32, 1.32, 1.43].map((z) => <Box key={z} position={[0, 0.016, z]} size={[3.45, 0.006, 0.035]} color="#a39879" />)}
        {Array.from({ length: 23 }, (_, i) => [-1, 1].map((side) => <Box key={`${i}-${side}`} position={[-1.67 + i * 0.15, 0, side * 1.67]} size={[0.035, 0.017, 0.13]} color={p.rug} />))}
      </group>
      <Table />
      <Chair />
      <Lamp />
      <Plant />
    </group>
  )
}
