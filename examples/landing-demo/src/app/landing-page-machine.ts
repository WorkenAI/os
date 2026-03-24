import { assign, setup } from 'xstate'

import type { LandingSceneDomainId } from '@/visualization/landing/types'

export type LandingPageContext = {
  layerIndicatorStyle: { width: number; offset: number } | null
  pendingInspectorTarget: {
    domainId: LandingSceneDomainId
    entityType: string
    entityId: string
  } | null
}

export type LandingPageEvent =
  | { type: 'layerIndicator.set'; style: { width: number; offset: number } | null }
  | {
      type: 'inspector.pending.set'
      target: {
        domainId: LandingSceneDomainId
        entityType: string
        entityId: string
      } | null
    }

export const landingPageMachine = setup({
  types: {
    context: {} as LandingPageContext,
    events: {} as LandingPageEvent,
  },
  actions: {
    setLayerIndicator: assign({
      layerIndicatorStyle: (_, params: { style: { width: number; offset: number } | null }) =>
        params.style,
    }),
    setPendingInspector: assign({
      pendingInspectorTarget: (
        _,
        params: {
          target: {
            domainId: LandingSceneDomainId
            entityType: string
            entityId: string
          } | null
        },
      ) => params.target,
    }),
  },
}).createMachine({
  id: 'landingPage',
  initial: 'ready',
  context: {
    layerIndicatorStyle: null,
    pendingInspectorTarget: null,
  },
  states: {
    ready: {
      on: {
        'layerIndicator.set': {
          actions: {
            type: 'setLayerIndicator',
            params: ({ event }) => ({ style: event.style }),
          },
        },
        'inspector.pending.set': {
          actions: {
            type: 'setPendingInspector',
            params: ({ event }) => ({ target: event.target }),
          },
        },
      },
    },
  },
})
