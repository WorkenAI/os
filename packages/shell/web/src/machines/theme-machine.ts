import { assign, setup } from 'xstate'

export type ShellTheme = 'dark' | 'light'

export type ThemeMachineContext = {
  theme: ShellTheme
  storageLoaded: boolean
}

export type ThemeMachineEvent =
  | { type: 'theme.toggle' }
  | { type: 'theme.set'; theme: ShellTheme }
  | { type: 'storage.loaded' }

export const themeMachine = setup({
  types: {
    context: {} as ThemeMachineContext,
    events: {} as ThemeMachineEvent,
  },
  actions: {
    flipTheme: assign({
      theme: ({ context }) => (context.theme === 'dark' ? 'light' : 'dark'),
    }),
    setTheme: assign({
      theme: (_, params: { theme: ShellTheme }) => params.theme,
    }),
    markStorageLoaded: assign({ storageLoaded: () => true }),
  },
}).createMachine({
  id: 'shellTheme',
  initial: 'ready',
  context: {
    theme: 'dark',
    storageLoaded: false,
  },
  states: {
    ready: {
      on: {
        'theme.toggle': { actions: 'flipTheme' },
        'theme.set': {
          actions: {
            type: 'setTheme',
            params: ({ event }) => ({ theme: event.theme }),
          },
        },
        'storage.loaded': { actions: 'markStorageLoaded' },
      },
    },
  },
})
