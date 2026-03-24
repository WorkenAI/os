import { assign, setup } from 'xstate'

import type { LandingDeliveryPhase, LandingSceneDomainId } from './types'

type BusinessDomainId = Extract<LandingSceneDomainId, 'hr' | 'sales' | 'marketing' | 'finance'>

type DomainState = {
  phase: LandingDeliveryPhase
  cursor: number
  animKey: number
}

export type LandingDeliveriesContext = {
  states: Record<BusinessDomainId, DomainState>
}

export type LandingDeliveriesEvent =
  | { type: 'domain.fetching'; domainId: BusinessDomainId }
  | { type: 'domain.delivering'; domainId: BusinessDomainId }
  | { type: 'domain.scored'; domainId: BusinessDomainId }
  | {
      type: 'domain.resetCursor'
      domainId: BusinessDomainId
      nextCursor: number
      nextAnimKey: number
    }

const initialStates = (): Record<BusinessDomainId, DomainState> => ({
  hr: { phase: 'idle', cursor: 0, animKey: 0 },
  sales: { phase: 'idle', cursor: 0, animKey: 0 },
  marketing: { phase: 'idle', cursor: 0, animKey: 0 },
  finance: { phase: 'idle', cursor: 0, animKey: 0 },
})

export const landingDeliveriesMachine = setup({
  types: {
    context: {} as LandingDeliveriesContext,
    events: {} as LandingDeliveriesEvent,
  },
  actions: {
    setFetching: assign({
      states: ({ context }, params: { domainId: BusinessDomainId }) => ({
        ...context.states,
        [params.domainId]: { ...context.states[params.domainId], phase: 'fetching' as const },
      }),
    }),
    setDelivering: assign({
      states: ({ context }, params: { domainId: BusinessDomainId }) => ({
        ...context.states,
        [params.domainId]: { ...context.states[params.domainId], phase: 'delivering' as const },
      }),
    }),
    setScored: assign({
      states: ({ context }, params: { domainId: BusinessDomainId }) => ({
        ...context.states,
        [params.domainId]: { ...context.states[params.domainId], phase: 'scored' as const },
      }),
    }),
    resetAfterScore: assign({
      states: (
        { context },
        params: { domainId: BusinessDomainId; nextCursor: number; nextAnimKey: number },
      ) => ({
        ...context.states,
        [params.domainId]: {
          phase: 'idle' as const,
          cursor: params.nextCursor,
          animKey: params.nextAnimKey,
        },
      }),
    }),
  },
}).createMachine({
  id: 'landingDeliveries',
  initial: 'ready',
  context: {
    states: initialStates(),
  },
  states: {
    ready: {
      on: {
        'domain.fetching': {
          actions: {
            type: 'setFetching',
            params: ({ event }) => ({ domainId: event.domainId }),
          },
        },
        'domain.delivering': {
          actions: {
            type: 'setDelivering',
            params: ({ event }) => ({ domainId: event.domainId }),
          },
        },
        'domain.scored': {
          actions: {
            type: 'setScored',
            params: ({ event }) => ({ domainId: event.domainId }),
          },
        },
        'domain.resetCursor': {
          actions: {
            type: 'resetAfterScore',
            params: ({ event }) => ({
              domainId: event.domainId,
              nextCursor: event.nextCursor,
              nextAnimKey: event.nextAnimKey,
            }),
          },
        },
      },
    },
  },
})
