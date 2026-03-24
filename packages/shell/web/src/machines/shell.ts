import { assign, setup } from 'xstate'

export type ShellContext = {
  activeDomainId: string | null
  panels: {
    inspector: boolean
    commandBar: boolean
  }
  inspectorTarget: { entityType: string; id: string } | null
  breadcrumbs: string[]
  sidebarCollapsed: boolean
}

export type ShellEvent =
  | { type: 'domain.activate'; domainId: string }
  | { type: 'domain.deactivate' }
  | { type: 'panel.toggle'; panel: 'inspector' | 'commandBar' }
  | { type: 'panel.close'; panel: 'inspector' | 'commandBar' }
  | { type: 'inspector.open'; entityType: string; id: string }
  | { type: 'inspector.close' }
  | { type: 'breadcrumbs.set'; path: string[] }
  | { type: 'sidebar.collapse' }
  | { type: 'sidebar.expand' }

export const shellMachine = setup({
  types: {
    context: {} as ShellContext,
    events: {} as ShellEvent,
  },
  actions: {
    setDomain: assign({
      activeDomainId: (_, params: { domainId: string }) => params.domainId,
      breadcrumbs: (_, params: { domainId: string }) => [params.domainId],
      inspectorTarget: () => null,
      panels: ({ context }) => ({ ...context.panels, inspector: false }),
    }),
    clearDomain: assign({
      activeDomainId: () => null,
      breadcrumbs: () => [],
      inspectorTarget: () => null,
    }),
    togglePanel: assign({
      panels: ({ context }, params: { panel: 'inspector' | 'commandBar' }) => ({
        ...context.panels,
        [params.panel]: !context.panels[params.panel],
      }),
    }),
    closePanel: assign({
      panels: ({ context }, params: { panel: 'inspector' | 'commandBar' }) => ({
        ...context.panels,
        [params.panel]: false,
      }),
    }),
    openInspector: assign({
      inspectorTarget: (_, params: { entityType: string; id: string }) => ({
        entityType: params.entityType,
        id: params.id,
      }),
      panels: ({ context }) => ({ ...context.panels, inspector: true }),
    }),
    closeInspector: assign({
      inspectorTarget: () => null,
      panels: ({ context }) => ({ ...context.panels, inspector: false }),
    }),
    setBreadcrumbs: assign({
      breadcrumbs: (_, params: { path: string[] }) => params.path,
    }),
    collapseSidebar: assign({ sidebarCollapsed: () => true }),
    expandSidebar: assign({ sidebarCollapsed: () => false }),
  },
}).createMachine({
  id: 'shell',
  initial: 'idle',
  context: {
    activeDomainId: null,
    panels: { inspector: false, commandBar: false },
    inspectorTarget: null,
    breadcrumbs: [],
    sidebarCollapsed: false,
  },
  states: {
    idle: {
      on: {
        'domain.activate': {
          target: 'domainActive',
          actions: { type: 'setDomain', params: ({ event }) => ({ domainId: event.domainId }) },
        },
        'sidebar.collapse': { actions: 'collapseSidebar' },
        'sidebar.expand': { actions: 'expandSidebar' },
      },
    },
    domainActive: {
      on: {
        'domain.activate': {
          actions: { type: 'setDomain', params: ({ event }) => ({ domainId: event.domainId }) },
        },
        'sidebar.collapse': { actions: 'collapseSidebar' },
        'sidebar.expand': { actions: 'expandSidebar' },
        'domain.deactivate': {
          target: 'idle',
          actions: 'clearDomain',
        },
        'panel.toggle': {
          actions: { type: 'togglePanel', params: ({ event }) => ({ panel: event.panel }) },
        },
        'panel.close': {
          actions: { type: 'closePanel', params: ({ event }) => ({ panel: event.panel }) },
        },
        'inspector.open': {
          actions: {
            type: 'openInspector',
            params: ({ event }) => ({ entityType: event.entityType, id: event.id }),
          },
        },
        'inspector.close': {
          actions: 'closeInspector',
        },
        'breadcrumbs.set': {
          actions: { type: 'setBreadcrumbs', params: ({ event }) => ({ path: event.path }) },
        },
      },
    },
  },
})
