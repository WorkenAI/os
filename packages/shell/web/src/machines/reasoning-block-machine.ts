import { assign, setup } from 'xstate'

export const reasoningBlockMachine = setup({
  types: {
    context: {} as { isOpen: boolean },
    events: {} as
      | { type: 'toggle' }
      | { type: 'sync'; isOpen: boolean },
  },
  actions: {
    toggle: assign({ isOpen: ({ context }) => !context.isOpen }),
    setOpen: assign({ isOpen: (_, params: { isOpen: boolean }) => params.isOpen }),
  },
}).createMachine({
  id: 'reasoningBlock',
  initial: 'ready',
  context: { isOpen: false },
  states: {
    ready: {
      on: {
        toggle: { actions: 'toggle' },
        sync: {
          actions: {
            type: 'setOpen',
            params: ({ event }) => ({ isOpen: event.isOpen }),
          },
        },
      },
    },
  },
})
