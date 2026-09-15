import React, { useMemo } from 'react'
import { CatmullRomCurve3, DoubleSide, Shape, Vector3 } from 'three'
import { Box, Cylinder, Leaf } from './primitives'
import { palette as p, placement } from './sceneConfig'
import { PaintedMaterial } from './PaintedSurface'

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

function Cushion({ width, height, depth, color = p.sage, piping = false, ...props }) {
  const shape = useMemo(() => {
    const shape = new Shape()
    const x = width / 2 - 0.04
    const y = height / 2 - 0.04
    const r = Math.min(0.14, x / 2, y / 2)
    shape.moveTo(-x + r, -y)
    shape.lineTo(x - r, -y)
    shape.quadraticCurveTo(x, -y, x, -y + r)
    shape.lineTo(x, y - r)
    shape.quadraticCurveTo(x, y, x - r, y)
    shape.lineTo(-x + r, y)
    shape.quadraticCurveTo(-x, y, -x, y - r)
    shape.lineTo(-x, -y + r)
    shape.quadraticCurveTo(-x, -y, -x + r, -y)
    return shape
  }, [width, height])
  const seams = useMemo(() => piping ? [-1, 1].map((side) => new CatmullRomCurve3(
    shape.getSpacedPoints(64).slice(0, -1).map((point) => new Vector3(point.x * 0.96, point.y * 0.96, side * (depth / 2 + 0.002))), true,
  )) : [], [shape, depth, piping])
  return (
    <group {...props}>
      <mesh position={[0, 0, -depth / 2 + 0.04]} castShadow receiveShadow>
        <extrudeGeometry args={[shape, { depth: depth - 0.08, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 3, steps: 1, curveSegments: 6 }]} />
        <PaintedMaterial color={color} roughness={1} />
      </mesh>
      {seams.map((curve, i) => <mesh key={i} castShadow>
        <tubeGeometry args={[curve, 64, 0.006, 5, true]} />
        <PaintedMaterial color="#a7b398" roughness={1} />
      </mesh>)}
    </group>
  )
}

function Chair({ position = placement.chair, name = 'chair' }) {
  // Local -Z faces the table; the full upholstered back leans away from the seat.
  const facing = Math.atan2(position[0] - placement.table[0], position[2] - placement.table[2])
  return (
    <group name={name} position={position} rotation={[0, facing, 0]}>
      {[-0.49, 0.49].flatMap((x) => [-0.37, 0.37].map((z) => (
        <Cylinder key={`${x}-${z}`} position={[x, 0.365, z]} radius={0.065} bottom={0.045} height={0.695} color={p.oakDark} segments={12} />
      )))}
      <Box position={[0, 0.735, 0]} size={[1.36, 0.14, 1.02]} color={p.oak} />
      <Cushion piping position={[0, 0.88, -0.04]} rotation={[-Math.PI / 2, 0, 0]} width={1.12} height={1.01} depth={0.24} />
      <Cushion piping position={[0, 1.37, 0.43]} rotation={[0.14, 0, 0]} width={1.22} height={0.96} depth={0.26} />
      {[-0.64, 0.64].map((x) => (
        <group key={x}>
          {[-0.32, 0.34].map((z) => <Cylinder key={z} position={[x, 0.97, z]} radius={0.04} height={0.48} color={p.oak} segments={12} />)}
          <Cushion position={[x, 1.22, 0.03]} rotation={[-Math.PI / 2, 0, 0]} width={0.23} height={1.05} depth={0.21} />
        </group>
      ))}
      <Cushion position={[0.13, 1.18, 0.23]} rotation={[0.12, 0, -0.13]} width={0.55} height={0.39} depth={0.2} color={p.ceramic} />
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
      <Chair name="second-chair" position={[1.95, 0, 1.15]} />
      <Lamp />
      <Plant />
    </group>
  )
}
