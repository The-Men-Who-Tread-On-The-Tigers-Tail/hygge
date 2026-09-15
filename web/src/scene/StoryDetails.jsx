import React, { useEffect, useMemo } from 'react'
import { Object3D, SphereGeometry } from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { Box, Cylinder, Leaf } from './primitives'
import { PaintedMaterial } from './PaintedSurface'
import { TrailingIvy } from './CottageAccents'
import { palette as p, room, windowOpening as w } from './sceneConfig'

// Merge repeated organic shapes per colour, rather than one draw call per petal.
function Cluster({ shapes, color, sunlit = false, ...props }) {
  const geometry = useMemo(() => {
    const transform = new Object3D()
    const parts = shapes.map(({ position, scale, tilt = 0 }) => {
      transform.position.set(...position)
      transform.scale.set(...scale)
      transform.rotation.set(0, 0, tilt)
      transform.updateMatrix()
      return new SphereGeometry(1, 10, 7).applyMatrix4(transform.matrix)
    })
    const merged = mergeGeometries(parts)
    parts.forEach((part) => part.dispose())
    return merged
  }, [shapes])
  useEffect(() => () => geometry.dispose(), [geometry])
  return <mesh geometry={geometry} castShadow receiveShadow {...props}><PaintedMaterial color={color} roughness={1} emissive={sunlit ? color : '#000000'} emissiveIntensity={sunlit ? 0.24 : 0} /></mesh>
}

function Ring({ position, radius, tube = 0.015, color, scale = [1, 1, 1], rotation = [Math.PI / 2, 0, 0] }) {
  return <mesh position={position} rotation={rotation} scale={scale} castShadow receiveShadow><torusGeometry args={[radius, tube, 6, 24]} /><PaintedMaterial color={color} roughness={0.9} /></mesh>
}

export function CottageGarden() {
  const crowns = [
    { position: [-3.8, 0, -9.2], size: 1.1 },
    { position: [-1.6, 0, -8.4], size: 0.8 },
    { position: [1.3, 0, -9.6], size: 1.05 },
    { position: [4.1, 0, -8.8], size: 0.95 },
  ]
  return (
    <group name="layered-cottage-garden">
      <Box position={[0, -0.19, -7.5]} size={[22, 0.2, 10]} color="#a7b68a" />
      <Box position={[0, 3.5, -14]} size={[30, 12, 0.1]} color="#d5e4dc" castShadow={false} />
      <Cluster sunlit color="#a8bdb0" shapes={[-6, 0, 6].map((x, i) => ({ position: [x, 0.65, -13], scale: [5.3, 2.2 + i * 0.3, 0.7] }))} />
      <Cluster sunlit color="#91aa91" shapes={[-5, 1, 7].map((x, i) => ({ position: [x, 0.15, -11.8], scale: [4.2, 1.6 + i * 0.2, 0.65] }))} />
      {crowns.map(({ position, size }, i) => (
        <group key={i} position={position} scale={size}>
          <Cylinder position={[0, 1.35, 0]} rotation={[0, 0, i % 2 ? 0.08 : -0.05]} radius={0.095} bottom={0.14} height={2.7} color="#827b56" segments={9} />
          <Cylinder position={[0.28, 2.1, 0]} rotation={[0, 0, -0.7]} radius={0.06} height={1.1} color="#827b56" segments={8} />
          <Cluster sunlit color={i % 2 ? '#6f9168' : '#789873'} shapes={[
            { position: [-0.65, 2.65, 0], scale: [0.85, 0.65, 0.75] },
            { position: [0.2, 2.95, -0.1], scale: [1, 0.85, 0.8] },
            { position: [0.95, 2.62, 0.05], scale: [0.72, 0.62, 0.65] },
          ]} />
          <Cluster sunlit color={i % 2 ? '#99b57e' : '#a8bd87'} shapes={[
            { position: [-0.46, 3.12, 0.25], scale: [0.73, 0.5, 0.65] },
            { position: [0.34, 3.48, 0], scale: [0.69, 0.5, 0.64] },
          ]} />
        </group>
      ))}
      <Box position={[0, 0.55, -6.3]} size={[12, 0.09, 0.1]} color="#e2d5b7" />
      {[-4, -2, 0, 2, 4].map((x) => <Box key={x} position={[x, 0.46, -6.3]} rotation={[0, 0, x * 0.012]} size={[0.1, 1.06, 0.12]} color="#e2d5b7" />)}
      {['#7c9b65', '#a2b47b'].map((color, layer) => <Cluster key={color} sunlit color={color} shapes={[-4, -2.3, -0.6, 1.2, 3, 4.8].map((x, i) => ({ position: [x + layer * 0.3, 0.25, -5.6 + layer * 0.3], scale: [0.95, 0.48 + (i % 3) * 0.13, 0.6] }))} />)}
      <Cluster sunlit color="#dec78a" shapes={[-2.5, -1.9, 0.6, 1.1, 3.2].map((x, i) => ({ position: [x, 0.68 + (i % 2) * 0.1, -5.25], scale: [0.1, 0.075, 0.09] }))} />
    </group>
  )
}

function Flowers({ position }) {
  const heads = [[-0.1, 0.51, 0], [0.11, 0.63, -0.03], [0.04, 0.42, 0.1]]
  return (
    <group position={position}>
      <Cylinder position={[0, 0.09, 0]} radius={0.145} bottom={0.105} height={0.18} color={p.terracotta} segments={16} />
      <Ring position={[0, 0.17, 0]} radius={0.142} color="#ce9370" />
      <Cylinder position={[0, 0.176, 0]} radius={0.125} height={0.009} color="#746344" />
      {heads.map(([x, y, z], i) => <group key={i}>
        <Cylinder position={[x / 2, (y + 0.17) / 2, z / 2]} rotation={[0, 0, -x / (y - 0.17)]} radius={0.008} height={y - 0.17} color={p.darkGreen} segments={6} />
        <Cluster color={['#d79b88', '#ead49a', '#c58073'][i]} shapes={Array.from({ length: 5 }, (_, petal) => {
          const angle = petal * Math.PI * 2 / 5
          return { position: [x + Math.cos(angle) * 0.055, y + Math.sin(angle) * 0.055, z], scale: [0.048, 0.048, 0.025] }
        })} />
        <Leaf position={[x, y, z + 0.022]} scale={[0.026, 0.026, 0.016]} color="#bc9146" />
      </group>)}
      <Cluster color={p.leaf} shapes={[-1, 1].map((side) => ({ position: [side * 0.1, 0.3, 0.025], scale: [0.1, 0.035, 0.045], tilt: side * 0.5 }))} />
    </group>
  )
}

export function WindowPlants() {
  return <group name="window-herbs-and-trailing-ivy">
    <Flowers position={[w.right - 0.43, w.bottom - 0.015, room.back + 0.37]} />
    <group position={[w.left + 0.1, w.bottom - 0.015, room.back + 0.37]}>
      <Cylinder position={[0, 0.11, 0]} radius={0.15} bottom={0.1} height={0.22} color="#819b88" segments={16} />
      <Ring position={[0, 0.21, 0]} radius={0.147} color="#b1bd9b" />
      <TrailingIvy />
    </group>
  </group>
}

export function BotanicalArt() {
  return <group name="framed-botanical-landscape" position={[-3.09, 2.35, -0.6]} rotation={[0, Math.PI / 2, -0.025]}>
    <Box size={[0.88, 1.14, 0.06]} color={p.oakDark} />
    <Box position={[0, 0, 0.04]} size={[0.77, 1.03, 0.02]} color={p.ceramic} />
    <Box position={[0, 0.035, 0.055]} size={[0.61, 0.79, 0.009]} color="#c8d9ca" />
    <Leaf position={[0.17, 0.28, 0.067]} scale={[0.073, 0.073, 0.007]} color="#e8cc83" />
    <Leaf position={[-0.06, -0.17, 0.069]} scale={[0.245, 0.21, 0.008]} color="#93aa8c" />
    <Leaf position={[0.06, -0.27, 0.08]} scale={[0.24, 0.13, 0.008]} color="#728e72" />
    <Box position={[-0.035, -0.065, 0.095]} rotation={[0, 0, -0.15]} size={[0.012, 0.53, 0.009]} color={p.darkGreen} />
    <Cluster color={p.darkGreen} shapes={[-1, 1, -1, 1].map((side, i) => ({ position: [-0.025 + side * 0.057, -0.17 + i * 0.105, 0.1], scale: [0.072, 0.03, 0.006], tilt: side * 0.65 }))} />
    <Box position={[0, -0.455, 0.056]} size={[0.18, 0.011, 0.008]} color={p.oakLight} />
  </group>
}

export function TeaTray() {
  return <group name="sideboard-tea-for-two" position={[-0.36, 1.145, 0.04]}>
    <Cylinder position={[0, 0.017, 0]} radius={0.34} height={0.034} scale={[1.2, 1, 0.7]} color={p.oakDark} />
    <Leaf position={[-0.11, 0.155, -0.035]} scale={[0.14, 0.12, 0.115]} color="#afc0ae" />
    <Cylinder position={[-0.11, 0.264, -0.035]} radius={0.09} height={0.028} color="#8aa58e" />
    <Leaf position={[-0.11, 0.291, -0.035]} scale={[0.025, 0.023, 0.025]} color={p.oakDark} />
    <Cylinder position={[0.025, 0.17, -0.035]} rotation={[0, 0, -0.82]} radius={0.025} bottom={0.049} height={0.16} color="#afc0ae" segments={12} />
    <Ring position={[-0.235, 0.16, -0.035]} radius={0.072} tube={0.019} rotation={[0, 0, 0]} color="#8aa58e" />
    {[[-0.02, 0.14], [0.23, 0.025]].map(([x, z], i) => <group key={i} position={[x, 0.034, z]}>
      <Cylinder position={[0, 0.009, 0]} radius={0.083} height={0.018} color={p.ceramic} />
      <Cylinder position={[0, 0.059, 0]} radius={0.054} bottom={0.042} height={0.086} color={i ? '#c79275' : p.ceramic} segments={16} />
      <Cylinder position={[0, 0.103, 0]} radius={0.043} height={0.004} color="#806443" segments={16} />
      <Ring position={[0.06, 0.065, 0]} radius={0.028} tube={0.009} rotation={[0, 0, 0]} color={p.ceramic} />
    </group>)}
  </group>
}

export function BlanketBasket() {
  return <group name="woven-basket-and-folded-throw" position={[3.95, 0.025, room.back + 1.24]} rotation={[0, -0.12, 0]}>
    <Cylinder position={[0, 0.22, 0]} radius={0.34} bottom={0.27} height={0.44} color="#b99866" segments={16} />
    {[0.08, 0.16, 0.24, 0.32, 0.42].map((y) => <Ring key={y} position={[0, y, 0]} radius={0.27 + y * 0.16} tube={0.016} color="#d1b381" />)}
    <Ring position={[0, 0.49, 0]} radius={0.25} tube={0.027} rotation={[0, 0, 0]} scale={[1, 0.75, 1]} color="#b99866" />
    <Box position={[0.025, 0.445, 0.025]} size={[0.41, 0.07, 0.44]} color="#d2b090" />
    <Box position={[0.025, 0.34, 0.257]} rotation={[-0.1, 0, 0]} size={[0.41, 0.24, 0.047]} color="#d2b090" />
    {[-0.11, 0.13].map((x) => <Box key={x} position={[x, 0.34, 0.284]} rotation={[-0.1, 0, 0]} size={[0.025, 0.24, 0.006]} color={p.ceramic} />)}
    {[-0.14, -0.06, 0.02, 0.1, 0.18].map((x) => <Cylinder key={x} position={[x, 0.205, 0.272]} radius={0.006} height={0.045} color={p.ceramic} segments={5} />)}
  </group>
}
