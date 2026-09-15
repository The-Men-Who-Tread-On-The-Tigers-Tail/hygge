import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { placement } from './sceneConfig'
import { DEAL_DURATION, dealPose, REST_CARD_POSE } from './motion'

function Card({ back = false }) {
  return (
    <>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.62, 0.008, 0.82]} />
        <meshStandardMaterial color={back ? '#71836a' : '#f7f3e9'} roughness={0.95} />
      </mesh>
      {!back && <>
        <mesh position={[0, 0.005, -0.25]}>
          <boxGeometry args={[0.43, 0.002, 0.035]} />
          <meshStandardMaterial color="#526a51" roughness={1} />
        </mesh>
        {[-0.07, 0.04, 0.15].map((z) => (
          <mesh key={z} position={[-0.015, 0.005, z]}>
            <boxGeometry args={[z === 0.15 ? 0.25 : 0.4, 0.002, 0.013]} />
            <meshStandardMaterial color="#98a18d" roughness={1} />
          </mesh>
        ))}
      </>}
    </>
  )
}

export default function QuestionDeck({ motion }) {
  const card = useRef(null)
  const { invalidate } = useThree()
  const lastSequence = useRef(motion.current.advanceSequence)
  const elapsed = useRef(DEAL_DURATION)
  const start = useRef(REST_CARD_POSE)
  const pose = useRef(REST_CARD_POSE)

  useFrame((_, delta) => {
    if (!card.current) return
    const { advanceSequence, reducedMotion } = motion.current
    const started = advanceSequence !== lastSequence.current
    if (started) {
      lastSequence.current = advanceSequence
      start.current = { ...pose.current }
      elapsed.current = 0
    }
    // A demand-loop delta includes time spent idle; do not consume it on start.
    elapsed.current = reducedMotion ? DEAL_DURATION : started ? 0 : Math.min(DEAL_DURATION, elapsed.current + delta)
    pose.current = dealPose(elapsed.current / DEAL_DURATION, start.current)
    const { x, y, z, rx, rz } = pose.current
    card.current.position.set(x, y, z)
    card.current.rotation.set(rx, 0, rz)
    if (elapsed.current < DEAL_DURATION) invalidate()
  })

  return (
    <group name="question-deck" position={[placement.table[0] + 0.22, 1.445, placement.table[2] + 0.5]} rotation={[0, 0.16, 0]}>
      {[0, 1, 2, 3].map((i) => <group key={i} position={[i * 0.003, i * 0.01, 0]}><Card back={i === 0} /></group>)}
      <group ref={card} name="dealt-card" position={[0, REST_CARD_POSE.y, 0]}>
        <Card />
      </group>
    </group>
  )
}
