import { useCallback, useEffect, useRef, useState } from 'react'
import { DOMAIN_PRIMARY_COLORS } from '@/shell/domain-colors'
import { SCENE_DOMAIN_ORDER, sceneDeliveryQueues } from '@/shell/runtime/mock-os-data'
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

type DomainState = {
  phase: LandingDeliveryPhase
  cursor: number
  animKey: number
}

function withJitter(baseDelayMs: number, jitterMs: number) {
  return baseDelayMs + Math.floor(Math.random() * (jitterMs + 1))
}

function createInitialStates(): Record<BusinessDomainId, DomainState> {
  return {
    hr: { phase: 'idle', cursor: 0, animKey: 0 },
    sales: { phase: 'idle', cursor: 0, animKey: 0 },
    marketing: { phase: 'idle', cursor: 0, animKey: 0 },
    finance: { phase: 'idle', cursor: 0, animKey: 0 },
  }
}

export function useLandingDeliveries() {
  const [states, setStates] = useState(createInitialStates)
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
          setStates((prev) => ({
            ...prev,
            [config.domainId]: { ...prev[config.domainId], phase: 'fetching' as const },
          }))
        },
        withJitter(config.initialDelayMs, INITIAL_SPAWN_JITTER_MS),
      )
    }
    return () => {
      mountedRef.current = false
      for (const id of timersRef.current) clearTimeout(id)
      timersRef.current.clear()
    }
  }, [schedule])

  const handlePhaseEnd = useCallback(
    (domainId: LandingSceneDomainId, completedPhase: LandingDeliveryPhase) => {
      const id = domainId as BusinessDomainId
      const queue = sceneDeliveryQueues[id]
      if (!queue) return

      if (completedPhase === 'fetching') {
        setStates((prev) => {
          if (prev[id].phase !== 'fetching') return prev
          return { ...prev, [id]: { ...prev[id], phase: 'delivering' as const } }
        })
      }

      if (completedPhase === 'delivering') {
        setStates((prev) => {
          if (prev[id].phase !== 'delivering') return prev
          return { ...prev, [id]: { ...prev[id], phase: 'scored' as const } }
        })

        schedule(() => {
          setStates((prev) => {
            const current = prev[id]
            const nextCursor = (current.cursor + 1) % queue.length
            return {
              ...prev,
              [id]: { phase: 'idle' as const, cursor: nextCursor, animKey: current.animKey + 1 },
            }
          })

          schedule(
            () => {
              setStates((prev) => ({
                ...prev,
                [id]: { ...prev[id], phase: 'fetching' as const },
              }))
            },
            withJitter(IDLE_MS, REPEAT_SPAWN_JITTER_MS),
          )
        }, SCORE_MS)
      }
    },
    [schedule],
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
