import { describe, expect, it } from 'vitest'
import { damp, dealPose, normalizePointer, REST_CARD_POSE } from './motion'

describe('bounded room motion', () => {
  it('normalizes against the room bounds and clamps outside coordinates', () => {
    const bounds = { left: 100, top: 50, width: 400, height: 200 }
    expect(normalizePointer(300, 150, bounds)).toEqual({ x: 0, y: 0 })
    expect(normalizePointer(-100, 500, bounds)).toEqual({ x: -1, y: 1 })
    expect(normalizePointer(0, 0, { left: 0, top: 0, width: 0, height: 0 })).toEqual({ x: 0, y: 0 })
  })

  it('damps consistently across frame rates and eventually stops exactly', () => {
    let slow = 0
    let fast = 0
    for (let i = 0; i < 30; i += 1) slow = damp(slow, 1, 1 / 30)
    for (let i = 0; i < 60; i += 1) fast = damp(fast, 1, 1 / 60)
    expect(slow).toBeCloseTo(fast, 10)
    expect(damp(0.99999, 1, 0.016)).toBe(1)
    expect(damp(0, 1, 0)).toBe(0)
    expect(damp(0, 1, -1)).toBe(0)
  })
})

describe('card-dealing path', () => {
  it('starts and ends on the table, with a perceptible lift in between', () => {
    expect(dealPose(0)).toEqual(REST_CARD_POSE)
    expect(dealPose(1)).toEqual(REST_CARD_POSE)
    expect(dealPose(0.5).y).toBeGreaterThan(0.5)
    expect(dealPose(2)).toEqual(REST_CARD_POSE)
    expect(dealPose(-1)).toEqual(REST_CARD_POSE)
  })

  it('does not accumulate height or spins under repeated mid-flight restarts', () => {
    let pose = REST_CARD_POSE
    for (let i = 0; i < 100; i += 1) {
      pose = dealPose(0.1, pose)
      expect(pose.y).toBeLessThan(0.8)
      expect(Math.abs(pose.x)).toBeLessThan(0.3)
      expect(Math.abs(pose.rx)).toBeLessThanOrEqual(Math.PI * 2)
    }
  })

  it('restarts from the current pose without a discontinuity and settles', () => {
    const interrupted = dealPose(0.3)
    expect(dealPose(0, interrupted)).toEqual(interrupted)
    expect(dealPose(1, interrupted)).toEqual(REST_CARD_POSE)
  })
})
