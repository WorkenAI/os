import { assign, setup } from 'xstate'

export const conversationInputMachine = setup({
  types: {
    context: {} as { value: string },
    events: {} as { type: 'input.change'; value: string } | { type: 'input.clear' },
  },
  actions: {
    setValue: assign({
      value: (_, params: { value: string }) => params.value,
    }),
    clear: assign({ value: () => '' }),
  },
}).createMachine({
  id: 'conversationInput',
  initial: 'ready',
  context: { value: '' },
  states: {
    ready: {
      on: {
        'input.change': {
          actions: {
            type: 'setValue',
            params: ({ event }) => ({ value: event.value }),
          },
        },
        'input.clear': { actions: 'clear' },
      },
    },
  },
})
