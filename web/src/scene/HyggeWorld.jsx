import React, { useEffect, useRef } from 'react'
import { createRoot, extend } from '@react-three/fiber'
import * as THREE from 'three'
import CameraRig from './CameraRig'
import Lighting from './Lighting'
import Room from './Room'
import RoomProps from './RoomProps'
import { cameraConfig, palette } from './sceneConfig'

extend(THREE)

class WorldErrorBoundary extends React.Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(error) { this.props.onFailure?.(error) }
  render() { return this.state.failed ? null : this.props.children }
}

export default function HyggeWorld({ onFailure }) {
  const container = useRef(null)

  useEffect(() => {
    const host = container.current
    // Own the canvas lifecycle so failed async Fiber configuration is caught.
    // A fresh element per effect also isolates StrictMode's setup/cleanup cycle.
    const canvas = document.createElement('canvas')
    canvas.style.cssText = 'display:block;width:100%;height:100%;pointer-events:none'
    host.appendChild(canvas)
    let active = true
    let root
    let renderer
    let observer
    const fail = (error) => { if (active) onFailure?.(error) }
    const contextLost = (event) => {
      event.preventDefault()
      fail(new Error('The 3D room lost its graphics context.'))
    }
    canvas.addEventListener('webglcontextlost', contextLost)

    async function initialize() {
      try {
        renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false })
        renderer.toneMappingExposure = 1.05
        root = createRoot(canvas)
        const { width, height } = host.getBoundingClientRect()
        await root.configure({
          gl: renderer,
          frameloop: 'demand',
          dpr: [1, 1.5],
          shadows: { type: THREE.PCFShadowMap },
          camera: { position: [4, 4, 9], fov: cameraConfig.fov, near: 0.1, far: 60 },
          size: { width, height, top: 0, left: 0 },
          onCreated: () => { canvas.dataset.sceneReady = 'true' },
        })
        if (!active) return
        const store = root.render(
          <WorldErrorBoundary onFailure={fail}>
            <color attach="background" args={[palette.background]} />
            <CameraRig />
            <Lighting />
            <Room />
            <RoomProps />
          </WorldErrorBoundary>,
        )
        observer = new ResizeObserver(([entry]) => {
          const { width: nextWidth, height: nextHeight } = entry.contentRect
          if (active && nextWidth > 0 && nextHeight > 0) {
            store.getState().setSize(nextWidth, nextHeight, 0, 0)
          }
        })
        observer.observe(host)
      } catch (error) {
        fail(error)
      }
    }
    initialize()

    return () => {
      active = false
      observer?.disconnect()
      canvas.removeEventListener('webglcontextlost', contextLost)
      if (root) root.unmount()
      else {
        renderer?.dispose()
        renderer?.forceContextLoss()
      }
      canvas.remove()
    }
  }, [onFailure])

  return <div ref={container} style={{ width: '100%', height: '100%', pointerEvents: 'none' }} aria-hidden="true" />
}
