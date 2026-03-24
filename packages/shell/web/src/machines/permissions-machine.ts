import { assign, setup } from 'xstate'
import {
  DEFAULT_ACTIVE_ROLE_ID,
  DEFAULT_ROLES,
  type RoleDefinition,
} from '@worken/shell-web/permissions/types'

export type PermissionsMachineContext = {
  roles: RoleDefinition[]
  currentRoleId: string
}

export type PermissionsMachineEvent =
  | { type: 'session.apply'; roles: RoleDefinition[]; currentRoleId: string }
  | { type: 'role.activate'; roleId: string }
  | { type: 'roles.reset'; roles: RoleDefinition[]; currentRoleId: string }
  | { type: 'role.update'; roleId: string; role: RoleDefinition }
  | { type: 'role.add'; role: RoleDefinition }

const defaultRoleId =
  DEFAULT_ROLES.find((role) => role.id === DEFAULT_ACTIVE_ROLE_ID)?.id ?? DEFAULT_ROLES[0]?.id ?? ''

export const permissionsMachine = setup({
  types: {
    context: {} as PermissionsMachineContext,
    events: {} as PermissionsMachineEvent,
  },
  actions: {
    applySession: assign({
      roles: (_, params: { roles: RoleDefinition[]; currentRoleId: string }) => params.roles,
      currentRoleId: (_, params: { roles: RoleDefinition[]; currentRoleId: string }) =>
        params.currentRoleId,
    }),
    setCurrentRole: assign({
      currentRoleId: (_, params: { roleId: string }) => params.roleId,
    }),
    replaceRoles: assign({
      roles: (_, params: { roles: RoleDefinition[] }) => params.roles,
    }),
    upsertRole: assign({
      roles: ({ context }, params: { roleId: string; role: RoleDefinition }) =>
        context.roles.map((role) => (role.id === params.roleId ? params.role : role)),
    }),
    appendRole: assign({
      roles: ({ context }, params: { role: RoleDefinition }) => [...context.roles, params.role],
    }),
  },
}).createMachine({
  id: 'permissions',
  initial: 'ready',
  context: {
    roles: DEFAULT_ROLES,
    currentRoleId: defaultRoleId,
  },
  states: {
    ready: {
      on: {
        'session.apply': {
          actions: {
            type: 'applySession',
            params: ({ event }) => ({
              roles: event.roles,
              currentRoleId: event.currentRoleId,
            }),
          },
        },
        'role.activate': {
          actions: {
            type: 'setCurrentRole',
            params: ({ event }) => ({ roleId: event.roleId }),
          },
        },
        'roles.reset': {
          actions: {
            type: 'applySession',
            params: ({ event }) => ({
              roles: event.roles,
              currentRoleId: event.currentRoleId,
            }),
          },
        },
        'role.update': {
          actions: {
            type: 'upsertRole',
            params: ({ event }) => ({ roleId: event.roleId, role: event.role }),
          },
        },
        'role.add': {
          actions: {
            type: 'appendRole',
            params: ({ event }) => ({ role: event.role }),
          },
        },
      },
    },
  },
})
