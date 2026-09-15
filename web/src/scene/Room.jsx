import React from 'react'
import { DoubleSide, FrontSide } from 'three'
import { Box } from './primitives'
import RoomDetails from './RoomDetails'
import { BotanicalArt, CottageGarden, WindowPlants } from './StoryDetails'
import { ceilingHeight, palette as p, room, windowOpening as w } from './sceneConfig'

function Window() {
  const center = (w.left + w.right) / 2
  const width = w.right - w.left
  const height = w.top - w.bottom
  return (
    <group name="open-window" position={[0, 0, room.back + 0.08]}>
      {[w.left, w.right].map((x) => <Box key={x} position={[x, (w.top + w.bottom) / 2, 0]} size={[0.12, height + 0.2, 0.26]} color={p.trim} />)}
      {[w.bottom, w.top].map((y) => <Box key={y} position={[center, y, 0]} size={[width + 0.22, 0.12, 0.26]} color={p.trim} />)}
      <Box position={[center, w.bottom - 0.08, 0.13]} size={[width + 0.38, 0.13, 0.56]} color={p.oakLight} />
      <Box position={[center, (w.top + w.bottom) / 2, 0]} size={[0.065, height, 0.12]} color={p.trim} />
      <Box position={[center, 2.85, 0]} size={[width, 0.065, 0.12]} color={p.trim} />
      {/* One inward-open casement makes the empty opening legible. */}
      <group position={[w.left, w.bottom, 0.03]} rotation={[0, -0.5, 0]}>
        {[0, width / 2].map((x) => <Box key={x} position={[x, height / 2, 0]} size={[0.055, height, 0.065]} color={p.trim} />)}
        {[0, height].map((y) => <Box key={y} position={[width / 4, y, 0]} size={[width / 2, 0.055, 0.065]} color={p.trim} />)}
        <Box position={[width / 2 - 0.08, height / 2, 0.06]} size={[0.03, 0.17, 0.04]} color={p.brass} />
      </group>
    </group>
  )
}

export default function Room() {
  const half = room.width / 2
  const fullWidth = half + room.right
  const floorCenter = [(room.right - half) / 2, 0, room.back + room.depth / 2]
  const plankCount = Math.ceil(fullWidth / 0.4)
  return (
    <group name="room">
      <CottageGarden />
      {/* Interior-facing ceiling: invisible from the elevated camera above it,
          but opaque to shadow rays from either side. Never hide the room with
          a double-sided roof just to stop exterior light. */}
      <mesh
        name="interior-ceiling"
        position={[floorCenter[0], ceilingHeight, floorCenter[2]]}
        rotation={[Math.PI / 2, 0, 0]}
        castShadow
        receiveShadow
      >
        <planeGeometry args={[fullWidth, room.depth]} />
        <meshStandardMaterial color={p.plaster} roughness={1} side={FrontSide} shadowSide={DoubleSide} />
      </mesh>
      {/* Extend the shell past the camera: this is an interior, not a floating model. */}
      <Box position={[floorCenter[0], -0.13, floorCenter[2]]} size={[fullWidth, 0.24, room.depth]} color={p.oak} />
      {Array.from({ length: plankCount }, (_, i) => (
        <Box key={i} position={[-half + 0.2 + i * 0.4, 0, floorCenter[2]]} size={[0.392, 0.035, room.depth]} color={i % 3 === 0 ? '#d4b58b' : i % 3 === 1 ? '#cfad80' : '#d9bb92'} />
      ))}
      <Box position={[-half, room.height / 2, floorCenter[2]]} size={[0.16, room.height, room.depth]} color={p.sideWall} />
      {/* Four separate wall pieces leave a real, unoccluded window aperture. */}
      <Box position={[(-half + w.left) / 2, room.height / 2, room.back]} size={[w.left + half, room.height, 0.18]} color={p.plaster} />
      <Box position={[(room.right + w.right) / 2, room.height / 2, room.back]} size={[room.right - w.right, room.height, 0.18]} color={p.plaster} />
      <Box position={[(w.left + w.right) / 2, w.bottom / 2, room.back]} size={[w.right - w.left, w.bottom, 0.18]} color={p.plaster} />
      <Box position={[(w.left + w.right) / 2, (w.top + room.height) / 2, room.back]} size={[w.right - w.left, room.height - w.top, 0.18]} color={p.plaster} />
      <Box position={[floorCenter[0], 0.13, room.back + 0.12]} size={[fullWidth, 0.22, 0.08]} color={p.trim} />
      <Box position={[-half + 0.12, 0.13, floorCenter[2]]} size={[0.08, 0.22, room.depth]} color={p.trim} />
      <Window />
      <WindowPlants />
      <RoomDetails />
      <BotanicalArt />
    </group>
  )
}
