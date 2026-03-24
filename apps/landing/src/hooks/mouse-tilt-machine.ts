import { assign, setup } from 'xstate'

export const mouseTiltMachine = setup({
  types: {
    context: {} as { x: number; y: number },
    events: {} as { type: 'tilt.set'; x: number; y: number } | { type: 'tilt.reset' },
  },
  actions: {
    setTilt: assign({
      x: (_, params: { x: number; y: number }) => params.x,
      y: (_, params: { x: number; y: number }) => params.y,
    }),
    resetTilt: assign({ x: () => 0, y: () => 0 }),
  },
}).createMachine({
  id: 'mouseTilt',
  initial: 'ready',
  context: { x: 0, y: 0 },
  states: {
    ready: {
      on: {
        'tilt.set': {
          actions: {
            type: 'setTilt',
            params: ({ event }) => ({ x: event.x, y: event.y }),
          },
        },
        'tilt.reset': { actions: 'resetTilt' },
      },
    },
  },
})
