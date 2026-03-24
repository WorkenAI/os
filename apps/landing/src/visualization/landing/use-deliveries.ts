import { useMachine } from '@xstate/react'
import { useCallback, useEffect, useRef } from 'react'
import { DOMAIN_PRIMARY_COLORS } from '@worken/shell-web/domain-colors'
import { SCENE_DOMAIN_ORDER, sceneDeliveryQueues } from '@worken/demo/mock-os-data'
import { landingDeliveriesMachine } from './landing-deliveries-machine'
import type { LandingDelivery, LandingDeliveryPhase, LandingSceneDomainId } from './types'

type BusinessDomainId = (typeof SCENE_DOMAIN_ORDER)[number]

const SCORE_MS = 1_800
const IDLE_MS = 600
const INITIAL_SPAWN_JITTER_MS = 1_200
const REPEAT_SPAWN_JITTER_MS = 1_600

const DOMAIN_DELIVERY_CONFIG: ReadonlyArray<{
  domainId: BusinessDomainId
  route: string
  scoreLabel: string
  initialDelayMs: number
  department: { x: number; y: number; s: number }
}> = [
  {
    domainId: 'hr',
    route: 'hr',
    scoreLabel: 'Hire',
    initialDelayMs: 0,
    department: { x: -270, y: -152, s: 0.95 },
  },
  {
    domainId: 'sales',
    route: 'sales',
    scoreLabel: 'Client',
    initialDelayMs: 5_000,
    department: { x: 282, y: -152, s: 0.95 },
  },
  {
    domainId: 'marketing',
    route: 'marketing',
    scoreLabel: 'Customer',
    initialDelayMs: 10_000,
    department: { x: -272, y: 184, s: 0.95 },
  },
  {
    domainId: 'finance',
    route: 'finance',
    scoreLabel: 'Payment',
    initialDelayMs: 15_000,
    department: { x: 282, y: 184, s: 0.95 },
  },
]

function withJitter(baseDelayMs: number, jitterMs: number) {
  return baseDelayMs + Math.floor(Math.random() * (jitterMs + 1))
}

export function useLandingDeliveries() {
  const [snapshot, send] = useMachine(landingDeliveriesMachine)
  const states = snapshot.context.states
  const statesRef = useRef(states)
  statesRef.current = states

  const timersRef = useRef(new Set<ReturnType<typeof setTimeout>>())
  const mountedRef = useRef(true)

  const schedule = useCallback((fn: () => void, delayMs: number) => {
    const id = setTimeout(() => {
      timersRef.current.delete(id)
      if (mountedRef.current) fn()
    }, delayMs)
    timersRef.current.add(id)
  }, [])

  useEffect(() => {
    mountedRef.current = true
    for (const config of DOMAIN_DELIVERY_CONFIG) {
      schedule(
        () => {
          send({ type: 'domain.fetching', domainId: config.domainId })
        },
        withJitter(config.initialDelayMs, INITIAL_SPAWN_JITTER_MS),
      )
    }
    return () => {
      mountedRef.current = false
      for (const id of timersRef.current) clearTimeout(id)
      timersRef.current.clear()
    }
  }, [schedule, send])

  const handlePhaseEnd = useCallback(
    (domainId: LandingSceneDomainId, completedPhase: LandingDeliveryPhase) => {
      const id = domainId as BusinessDomainId
      const queue = sceneDeliveryQueues[id]
      if (!queue) return

      if (completedPhase === 'fetching') {
        if (statesRef.current[id].phase !== 'fetching') return
        send({ type: 'domain.delivering', domainId: id })
      }

      if (completedPhase === 'delivering') {
        if (statesRef.current[id].phase !== 'delivering') return
        send({ type: 'domain.scored', domainId: id })

        schedule(() => {
          const current = statesRef.current[id]
          const nextCursor = (current.cursor + 1) % queue.length
          send({
            type: 'domain.resetCursor',
            domainId: id,
            nextCursor,
            nextAnimKey: current.animKey + 1,
          })

          schedule(
            () => {
              send({ type: 'domain.fetching', domainId: id })
            },
            withJitter(IDLE_MS, REPEAT_SPAWN_JITTER_MS),
          )
        }, SCORE_MS)
      }
    },
    [schedule, send],
  )

  const deliveries: LandingDelivery[] = DOMAIN_DELIVERY_CONFIG.map((config) => {
    const state = states[config.domainId]
    const queue = sceneDeliveryQueues[config.domainId]
    const item = queue[state.cursor % queue.length]!
    return {
      domainId: config.domainId,
      item,
      phase: state.phase,
      animKey: state.animKey,
      route: config.route,
      accent: DOMAIN_PRIMARY_COLORS[config.domainId],
      scoreLabel: config.scoreLabel,
    }
  })

  return { deliveries, handlePhaseEnd }
}
