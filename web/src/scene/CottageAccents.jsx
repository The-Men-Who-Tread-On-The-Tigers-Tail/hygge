import React, { useEffect, useMemo } from 'react'
import { CatmullRomCurve3, DoubleSide, Shape, ShapeGeometry, TubeGeometry, Vector3 } from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { PaintedMaterial } from './PaintedSurface'
import { Box, Cylinder } from './primitives'
import { palette as p, room } from './sceneConfig'

const curve = (points) => new CatmullRomCurve3(points.map((point) => new Vector3(...point)))

export function TrailingIvy() {
  const { leaf, veins, stems, attachments } = useMemo(() => {
    // Notched shoulders and a long pointed tip: a thin ivy blade, not an oval bead.
    const outline = new Shape()
    outline.moveTo(0, 0)
    outline.bezierCurveTo(-0.045, 0.065, -0.12, 0.005, -0.085, -0.065)
    outline.quadraticCurveTo(-0.045, -0.14, 0, -0.205)
    outline.quadraticCurveTo(0.045, -0.14, 0.085, -0.065)
    outline.bezierCurveTo(0.12, 0.005, 0.045, 0.065, 0, 0)
    const leaf = new ShapeGeometry(outline, 10)
    const veinParts = [
      [[0, 0, 0.003], [0, -0.09, 0.003], [0, -0.185, 0.003]],
      [[-0.065, -0.025, 0.003], [-0.035, -0.06, 0.003], [0, -0.09, 0.003]],
      [[0.065, -0.025, 0.003], [0.035, -0.06, 0.003], [0, -0.09, 0.003]],
    ].map((points) => new TubeGeometry(curve(points), 8, 0.0035, 4, false))
    const veins = mergeGeometries(veinParts)
    veinParts.forEach((part) => part.dispose())
    // Both runners start in the exposed soil, arch above the rim, then cross
    // the sill's front edge before descending (sill front is local z = .12).
    const runners = [-1, 1].map((side) => curve([
      [side * 0.04, 0.207, 0.01], [side * 0.07, 0.30, 0.12],
      [side * 0.10, 0.245, 0.23], [side * 0.13, 0.08, 0.29],
      [side * 0.11, -0.14, 0.31], [side * 0.16, -0.36, 0.32],
      [side * 0.13, side < 0 ? -0.55 : -0.43, 0.34],
    ]))
    const stems = runners.map((runner) => new TubeGeometry(runner, 40, 0.007, 6, false))
    const attachments = runners.flatMap((runner, branch) => [0.32, 0.59, 0.86].map((t, i) => ({
      position: runner.getPointAt(t).toArray(),
      tilt: (branch ? -1 : 1) * (i % 2 ? 0.65 : -0.5),
      color: (i + branch) % 2 ? p.leaf : p.darkGreen,
    })))
    return { leaf, veins, stems, attachments }
  }, [])
  useEffect(() => () => [leaf, veins, ...stems].forEach((geometry) => geometry.dispose()), [leaf, veins, stems])
  return <group name="two-rooted-heart-leaf-ivy-runners">
    <Cylinder position={[0, 0.207, 0]} radius={0.13} height={0.009} color={p.oakDark} segments={16} />
    {stems.map((geometry, i) => <mesh key={i} geometry={geometry} castShadow receiveShadow><PaintedMaterial color={p.darkGreen} roughness={1} /></mesh>)}
    {attachments.map(({ position, tilt, color }, i) => <group key={i} position={position} rotation={[0, i % 2 ? -0.12 : 0.12, tilt]}>
      <mesh geometry={leaf} castShadow receiveShadow={false}><PaintedMaterial color={color} side={DoubleSide} roughness={1} /></mesh>
      <mesh geometry={veins}><PaintedMaterial color={p.sage} roughness={1} /></mesh>
    </group>)}
  </group>
}

export function WallClock() {
  return <group name="oak-analog-wall-clock" position={[3.22, 3.83, room.back + 0.14]}>
    <Cylinder rotation={[Math.PI / 2, 0, 0]} radius={0.30} height={0.085} color={p.oakDark} segments={48} />
    <Cylinder position={[0, 0, 0.049]} rotation={[Math.PI / 2, 0, 0]} radius={0.267} height={0.014} color={p.ceramic} segments={48} />
    {Array.from({ length: 12 }, (_, i) => <group key={i} rotation={[0, 0, -i * Math.PI / 6]}>
      <Box position={[0, 0.228, 0.061]} size={[i % 3 ? 0.012 : 0.021, i % 3 ? 0.026 : 0.045, 0.008]} color={p.oakDark} />
    </group>)}
    {/* Static 10:10 hands; no ticking animation or emissive face. */}
    <group rotation={[0, 0, Math.PI / 3]}><Box position={[0, 0.064, 0.072]} size={[0.021, 0.14, 0.01]} color={p.darkGreen} /></group>
    <group rotation={[0, 0, -Math.PI / 3]}><Box position={[0, 0.094, 0.084]} size={[0.014, 0.195, 0.01]} color={p.darkGreen} /></group>
    <Cylinder position={[0, 0, 0.096]} rotation={[Math.PI / 2, 0, 0]} radius={0.021} height={0.014} color={p.brass} segments={12} />
  </group>
}

export function ShelfCandle() {
  return <group name="unlit-shelf-candle" position={[0.08, 0, 0.025]}>
    <Cylinder position={[0, 0.015, 0]} radius={0.083} height={0.03} color={p.terracotta} segments={20} />
    <Cylinder position={[0, 0.13, 0]} radius={0.058} height={0.20} color={p.ceramic} segments={20} />
    <Cylinder position={[0, 0.24, 0]} radius={0.005} height={0.025} color={p.oakDark} segments={6} />
  </group>
}
