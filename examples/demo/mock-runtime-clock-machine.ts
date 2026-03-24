import { assign, setup } from 'xstate'

export const mockRuntimeClockMachine = setup({
  types: {
    context: {} as { now: number },
    events: {} as { type: 'tick' },
  },
  actions: {
    tickNow: assign({ now: () => Date.now() }),
  },
}).createMachine({
  id: 'mockRuntimeClock',
  initial: 'ready',
  context: { now: Date.now() },
  states: {
    ready: {
      on: {
        tick: { actions: 'tickNow' },
      },
    },
  },
})
