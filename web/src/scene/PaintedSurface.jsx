import { createContext, useContext, useEffect, useMemo } from 'react'
import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three'

const PaintTexture = createContext(null)

function createPaintTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 256
  const context = canvas.getContext('2d')
  if (!context) return null
  let seed = 217
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return seed / 4294967296
  }
  context.fillStyle = '#f7f5ee'
  context.fillRect(0, 0, 256, 256)
  // Broad translucent brush marks, wrapped at the edges for a seamless tile.
  for (let i = 0; i < 160; i += 1) {
    const x = random() * 256
    const y = random() * 256
    const length = 12 + random() * 62
    context.strokeStyle = i % 3 ? 'rgba(166,151,122,0.02)' : 'rgba(255,255,255,0.22)'
    context.lineWidth = 1 + random() * 8
    const slope = (random() - 0.5) * 9
    for (const dx of [-256, 0, 256]) for (const dy of [-256, 0, 256]) {
      context.beginPath()
      context.moveTo(x + dx, y + dy)
      context.quadraticCurveTo(x + dx + length / 2, y + dy + slope, x + dx + length, y + dy)
      context.stroke()
    }
  }
  const texture = new CanvasTexture(canvas)
  texture.wrapS = texture.wrapT = RepeatWrapping
  texture.repeat.set(2, 2)
  texture.colorSpace = SRGBColorSpace
  texture.name = 'shared-painted-paper'
  return texture
}

export function PaintedSurfaceProvider({ children }) {
  const texture = useMemo(createPaintTexture, [])
  useEffect(() => () => texture?.dispose(), [texture])
  return <PaintTexture.Provider value={texture}>{children}</PaintTexture.Provider>
}

export function PaintedMaterial(props) {
  const texture = useContext(PaintTexture)
  return <meshStandardMaterial map={texture} {...props} />
}
