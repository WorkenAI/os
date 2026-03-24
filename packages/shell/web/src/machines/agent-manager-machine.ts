import { assign, setup } from 'xstate'

export type InspectorTab = 'config' | 'audit' | 'chats'

export type AgentManagerMachineContext = {
  selectedAgentId: string | null
  inspectorTab: InspectorTab
}

export type AgentManagerMachineEvent =
  | { type: 'agent.select'; id: string }
  | { type: 'inspector.tab'; tab: InspectorTab }

export function createAgentManagerMachine(initialAgentId: string | null) {
  return setup({
    types: {
      context: {} as AgentManagerMachineContext,
      events: {} as AgentManagerMachineEvent,
    },
    actions: {
      setAgent: assign({
        selectedAgentId: (_, params: { id: string }) => params.id,
      }),
      setTab: assign({
        inspectorTab: (_, params: { tab: InspectorTab }) => params.tab,
      }),
    },
  }).createMachine({
    id: 'agentManager',
    initial: 'ready',
    context: {
      selectedAgentId: initialAgentId,
      inspectorTab: 'config',
    },
    states: {
      ready: {
        on: {
          'agent.select': {
            actions: {
              type: 'setAgent',
              params: ({ event }) => ({ id: event.id }),
            },
          },
          'inspector.tab': {
            actions: {
              type: 'setTab',
              params: ({ event }) => ({ tab: event.tab }),
            },
          },
        },
      },
    },
  })
}
