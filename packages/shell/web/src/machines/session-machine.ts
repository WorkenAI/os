import type { ChatMessage } from '@json-render/react'
import { assign, setup } from 'xstate'

import type { StoredExecutionCase } from '@/execution/types'
import type { DomainDefinition } from '@worken/ir/domains/types'

export type SessionStatus =
  | 'idle'
  | 'loading'
  | 'bootstrapping'
  | 'ready'
  | 'forbidden'
  | 'error'

export type OrderedMessageRef = { source: 'manual' | 'chat'; id: string }

export type SessionMachineContext = {
  domain: DomainDefinition | null
  activeView: string | null
  executionCase: StoredExecutionCase | null
  manualMessages: Record<string, ChatMessage>
  messageOrder: OrderedMessageRef[]
  status: SessionStatus
  error: string | null
  isManualStreaming: boolean
}

export type SessionMachineEvent =
  | { type: 'session.clearConversation' }
  | { type: 'session.manual.upsert'; message: ChatMessage }
  | { type: 'session.execution.set'; case: StoredExecutionCase | null }
  | { type: 'session.error.set'; message: string | null }
  | { type: 'session.manualStreaming.set'; value: boolean }
  | { type: 'session.domain.set'; domain: DomainDefinition | null }
  | { type: 'session.view.set'; viewId: string | null }
  | { type: 'session.status.set'; status: SessionStatus }
  | { type: 'session.manualOrder.append'; ref: OrderedMessageRef }
  | { type: 'session.manualOrder.extend'; refs: OrderedMessageRef[] }

export const sessionMachine = setup({
  types: {
    context: {} as SessionMachineContext,
    events: {} as SessionMachineEvent,
  },
  actions: {
    clearConversation: assign({
      manualMessages: () => ({}),
      messageOrder: () => [],
      executionCase: () => null,
      error: () => null,
    }),
    upsertManualMessage: assign({
      manualMessages: ({ context }, params: { message: ChatMessage }) => ({
        ...context.manualMessages,
        [params.message.id]: params.message,
      }),
    }),
    setExecutionCase: assign({
      executionCase: (_, params: { case: StoredExecutionCase | null }) => params.case,
    }),
    setError: assign({
      error: (_, params: { message: string | null }) => params.message,
    }),
    setManualStreaming: assign({
      isManualStreaming: (_, params: { value: boolean }) => params.value,
    }),
    setDomain: assign({
      domain: (_, params: { domain: DomainDefinition | null }) => params.domain,
    }),
    setActiveView: assign({
      activeView: (_, params: { viewId: string | null }) => params.viewId,
    }),
    setStatus: assign({
      status: (_, params: { status: SessionStatus }) => params.status,
    }),
    appendMessageOrder: assign({
      messageOrder: ({ context }, params: { ref: OrderedMessageRef }) => [
        ...context.messageOrder,
        params.ref,
      ],
    }),
    extendMessageOrder: assign({
      messageOrder: ({ context }, params: { refs: OrderedMessageRef[] }) => [
        ...context.messageOrder,
        ...params.refs,
      ],
    }),
  },
}).createMachine({
  id: 'shellSession',
  initial: 'ready',
  context: {
    domain: null,
    activeView: null,
    executionCase: null,
    manualMessages: {},
    messageOrder: [],
    status: 'idle',
    error: null,
    isManualStreaming: false,
  },
  states: {
    ready: {
      on: {
        'session.clearConversation': { actions: 'clearConversation' },
        'session.manual.upsert': {
          actions: {
            type: 'upsertManualMessage',
            params: ({ event }) => ({ message: event.message }),
          },
        },
        'session.execution.set': {
          actions: {
            type: 'setExecutionCase',
            params: ({ event }) => ({ case: event.case }),
          },
        },
        'session.error.set': {
          actions: {
            type: 'setError',
            params: ({ event }) => ({ message: event.message }),
          },
        },
        'session.manualStreaming.set': {
          actions: {
            type: 'setManualStreaming',
            params: ({ event }) => ({ value: event.value }),
          },
        },
        'session.domain.set': {
          actions: {
            type: 'setDomain',
            params: ({ event }) => ({ domain: event.domain }),
          },
        },
        'session.view.set': {
          actions: {
            type: 'setActiveView',
            params: ({ event }) => ({ viewId: event.viewId }),
          },
        },
        'session.status.set': {
          actions: {
            type: 'setStatus',
            params: ({ event }) => ({ status: event.status }),
          },
        },
        'session.manualOrder.append': {
          actions: {
            type: 'appendMessageOrder',
            params: ({ event }) => ({ ref: event.ref }),
          },
        },
        'session.manualOrder.extend': {
          actions: {
            type: 'extendMessageOrder',
            params: ({ event }) => ({ refs: event.refs }),
          },
        },
      },
    },
  },
})
