import { assign, setup } from 'xstate'

export type BusinessFlowHoverContext = {
  hoveredDomainId: string | null
}

export type BusinessFlowHoverEvent =
  | { type: 'hover.enter'; domainId: string }
  | { type: 'hover.leave' }

export const businessFlowHoverMachine = setup({
  types: {
    context: {} as BusinessFlowHoverContext,
    events: {} as BusinessFlowHoverEvent,
  },
  actions: {
    setHovered: assign({
      hoveredDomainId: (_, params: { domainId: string | null }) => params.domainId,
    }),
  },
}).createMachine({
  id: 'businessFlowHover',
  initial: 'ready',
  context: { hoveredDomainId: null },
  states: {
    ready: {
      on: {
        'hover.enter': {
          actions: {
            type: 'setHovered',
            params: ({ event }) => ({ domainId: event.domainId }),
          },
        },
        'hover.leave': {
          actions: {
            type: 'setHovered',
            params: () => ({ domainId: null }),
          },
        },
      },
    },
  },
})
