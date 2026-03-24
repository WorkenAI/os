import { assign, setup } from 'xstate'

import { DOMAIN_IDS } from '@worken/ir/domains/registry'

export type RoleManagerMachineContext = {
  editingRoleId: string
  selectedDomainId: (typeof DOMAIN_IDS)[number] | ''
}

export type RoleManagerMachineEvent =
  | { type: 'editing.set'; roleId: string }
  | { type: 'domain.set'; domainId: (typeof DOMAIN_IDS)[number] | '' }

export function createRoleManagerMachine(
  initialEditingRoleId: string,
  initialDomainId: (typeof DOMAIN_IDS)[number] | '',
) {
  return setup({
    types: {
      context: {} as RoleManagerMachineContext,
      events: {} as RoleManagerMachineEvent,
    },
    actions: {
      setEditing: assign({
        editingRoleId: (_, params: { roleId: string }) => params.roleId,
      }),
      setDomain: assign({
        selectedDomainId: (_, params: { domainId: (typeof DOMAIN_IDS)[number] | '' }) =>
          params.domainId,
      }),
    },
  }).createMachine({
    id: 'roleManager',
    initial: 'ready',
    context: {
      editingRoleId: initialEditingRoleId,
      selectedDomainId: initialDomainId,
    },
    states: {
      ready: {
        on: {
          'editing.set': {
            actions: {
              type: 'setEditing',
              params: ({ event }) => ({ roleId: event.roleId }),
            },
          },
          'domain.set': {
            actions: {
              type: 'setDomain',
              params: ({ event }) => ({ domainId: event.domainId }),
            },
          },
        },
      },
    },
  })
}
