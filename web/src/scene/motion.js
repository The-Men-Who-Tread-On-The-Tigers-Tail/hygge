export const REST_CARD_POSE = Object.freeze({ x: 0, y: 0.045, z: 0, rx: 0, rz: 0 })
export const DEAL_DURATION = 0.95

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

export function normalizePointer(clientX, clientY, bounds) {
  if (bounds.width <= 0 || bounds.height <= 0) return { x: 0, y: 0 }
  return {
    x: clamp((clientX - bounds.left) / bounds.width * 2 - 1, -1, 1),
    y: clamp((clientY - bounds.top) / bounds.height * 2 - 1, -1, 1),
  }
}

export function damp(current, target, delta) {
  if (!Number.isFinite(delta) || delta <= 0) return current
  const next = target + (current - target) * Math.exp(-8 * delta)
  return Math.abs(next - target) < 0.0001 ? target : next
}

export function dealPose(progress, start = REST_CARD_POSE) {
  const t = clamp(progress, 0, 1)
  if (t === 0) return { ...start }
  if (t === 1) return { ...REST_CARD_POSE }
  const eased = t * t * (3 - 2 * t)
  const lift = Math.sin(Math.PI * t)
  // Carry the interrupted pose, but only use the remaining excursion. Repeated
  // clicks must not stack impulses until the card rises through the ceiling.
  const arc = (key, peak) => {
    const rest = REST_CARD_POSE[key]
    return rest + (start[key] - rest) * (1 - eased) + (peak - start[key]) * lift
  }
  return {
    x: arc('x', -0.25),
    y: arc('y', REST_CARD_POSE.y + 0.65),
    z: arc('z', 0.18),
    rx: start.rx + (-Math.PI * 2 - start.rx) * eased,
    rz: arc('rz', 0.14),
  }
}
