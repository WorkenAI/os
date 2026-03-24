import { assign, setup } from 'xstate'

export type InspectorSection = 'fields' | 'statuses' | 'triggers'

export type CrmManagerMachineContext = {
  selectedBindingId: string | null
  inspectorSection: InspectorSection
}

export type CrmManagerMachineEvent =
  | { type: 'binding.select'; id: string }
  | { type: 'inspector.section'; section: InspectorSection }

export function createCrmManagerMachine(initialBindingId: string | null) {
  return setup({
    types: {
      context: {} as CrmManagerMachineContext,
      events: {} as CrmManagerMachineEvent,
    },
    actions: {
      setBinding: assign({
        selectedBindingId: (_, params: { id: string }) => params.id,
      }),
      setSection: assign({
        inspectorSection: (_, params: { section: InspectorSection }) => params.section,
      }),
    },
  }).createMachine({
    id: 'crmManager',
    initial: 'ready',
    context: {
      selectedBindingId: initialBindingId,
      inspectorSection: 'fields',
    },
    states: {
      ready: {
        on: {
          'binding.select': {
            actions: {
              type: 'setBinding',
              params: ({ event }) => ({ id: event.id }),
            },
          },
          'inspector.section': {
            actions: {
              type: 'setSection',
              params: ({ event }) => ({ section: event.section }),
            },
          },
        },
      },
    },
  })
}
