import { assign, setup } from 'xstate'

import type { StoredExecutionCase, WorkenAiDelegationPolicy } from '@/execution/types'

export type WorkspaceId = 'docs' | 'runtime' | 'integrations' | 'visuals'

export type DeveloperStudioMachineContext = {
  activeWorkspaceId: WorkspaceId
}

export type DeveloperStudioMachineEvent = { type: 'workspace.set'; id: WorkspaceId }

export const developerStudioMachine = setup({
  types: {
    context: {} as DeveloperStudioMachineContext,
    events: {} as DeveloperStudioMachineEvent,
  },
  actions: {
    setWorkspace: assign({
      activeWorkspaceId: (_, params: { id: WorkspaceId }) => params.id,
    }),
  },
}).createMachine({
  id: 'developerStudio',
  initial: 'ready',
  context: { activeWorkspaceId: 'docs' },
  states: {
    ready: {
      on: {
        'workspace.set': {
          actions: {
            type: 'setWorkspace',
            params: ({ event }) => ({ id: event.id }),
          },
        },
      },
    },
  },
})

export type DeveloperInspectorContext = {
  policy: WorkenAiDelegationPolicy | null
  activeCase: StoredExecutionCase | null
  isSaving: boolean
}

export type DeveloperInspectorEvent =
  | { type: 'policy.set'; policy: WorkenAiDelegationPolicy | null }
  | { type: 'case.set'; case: StoredExecutionCase | null }
  | { type: 'saving.set'; value: boolean }

export const developerStudioInspectorMachine = setup({
  types: {
    context: {} as DeveloperInspectorContext,
    events: {} as DeveloperInspectorEvent,
  },
  actions: {
    setPolicy: assign({
      policy: (_, params: { policy: WorkenAiDelegationPolicy | null }) => params.policy,
    }),
    setCase: assign({
      activeCase: (_, params: { case: StoredExecutionCase | null }) => params.case,
    }),
    setSaving: assign({
      isSaving: (_, params: { value: boolean }) => params.value,
    }),
  },
}).createMachine({
  id: 'developerStudioInspector',
  initial: 'ready',
  context: {
    policy: null,
    activeCase: null,
    isSaving: false,
  },
  states: {
    ready: {
      on: {
        'policy.set': {
          actions: {
            type: 'setPolicy',
            params: ({ event }) => ({ policy: event.policy }),
          },
        },
        'case.set': {
          actions: {
            type: 'setCase',
            params: ({ event }) => ({ case: event.case }),
          },
        },
        'saving.set': {
          actions: {
            type: 'setSaving',
            params: ({ event }) => ({ value: event.value }),
          },
        },
      },
    },
  },
})
