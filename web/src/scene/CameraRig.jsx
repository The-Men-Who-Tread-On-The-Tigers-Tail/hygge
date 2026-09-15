import { useLayoutEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { MathUtils, Vector3 } from 'three'
import { cameraConfig } from './sceneConfig'

export default function CameraRig() {
  const { camera, size, invalidate } = useThree()

  useLayoutEffect(() => {
    const aspect = size.width / Math.max(size.height, 1)
    const target = new Vector3(...cameraConfig.target)
    const outward = new Vector3(...cameraConfig.direction).normalize()
    const right = new Vector3().crossVectors(new Vector3(0, 1, 0), outward).normalize()
    const up = new Vector3().crossVectors(outward, right).normalize()
    const tanVertical = Math.tan(MathUtils.degToRad(cameraConfig.fov / 2))
    const tanHorizontal = tanVertical * Math.max(aspect, 0.1)
    const { min, max } = cameraConfig.bounds
    let distance = 0

    // Fit the furnished corner; the surrounding shell extends beyond this frame.
    for (const x of [min[0], max[0]]) {
      for (const y of [min[1], max[1]]) {
        for (const z of [min[2], max[2]]) {
          const corner = new Vector3(x, y, z).sub(target)
          const depth = corner.dot(outward)
          distance = Math.max(distance,
            depth + Math.abs(corner.dot(right)) / tanHorizontal,
            depth + Math.abs(corner.dot(up)) / tanVertical)
        }
      }
    }
    camera.fov = cameraConfig.fov
    camera.aspect = aspect
    camera.position.copy(target).addScaledVector(outward, distance * 1.035)
    camera.lookAt(target)
    camera.updateProjectionMatrix()
    invalidate()
  }, [camera, size.width, size.height, invalidate])

  return null
}
