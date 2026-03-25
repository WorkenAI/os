import { toPermissionSnapshot } from '@/shell/permissions/shared'
import { DEFAULT_ACTIVE_ROLE_ID, type RoleDefinition } from '@/shell/permissions/types'
import {
  readPolicyStore,
  resetPolicyStore,
  writePolicyStore,
} from '../persistence/policy-repository'

export type PolicySession = {
  roles: RoleDefinition[]
  currentRoleId: string
  currentRole: RoleDefinition
}

function resolveCurrentRole(roles: RoleDefinition[], requestedRoleId?: string | null) {
  return (
    roles.find((role) => role.id === requestedRoleId) ??
    roles.find((role) => role.id === DEFAULT_ACTIVE_ROLE_ID) ??
    roles[0]
  )
}

function canManageRoles(role: RoleDefinition) {
  return Boolean(role.domains.admin?.accessible && role.domains.admin.verbs['manage-roles'])
}

export async function getPolicySession(requestedRoleId?: string | null): Promise<PolicySession> {
  const store = await readPolicyStore()
  const currentRole = resolveCurrentRole(store.roles, requestedRoleId)

  return {
    roles: store.roles,
    currentRoleId: currentRole.id,
    currentRole,
  }
}

export async function getPermissionSnapshotForRole(requestedRoleId?: string | null) {
  const session = await getPolicySession(requestedRoleId)
  return toPermissionSnapshot(session.currentRole)
}

export async function updateRoleDefinition(
  roleId: string,
  nextRole: RoleDefinition,
  requestedRoleId?: string | null,
) {
  const session = await getPolicySession(requestedRoleId)
  if (!canManageRoles(session.currentRole)) {
    throw new Error('Role management is not allowed for the active role')
  }

  const nextRoles = session.roles.map((role) => (role.id === roleId ? nextRole : role))
  await writePolicyStore({ roles: nextRoles })

  return getPolicySession(session.currentRoleId)
}

export async function createRoleDefinition(
  nextRole: RoleDefinition,
  requestedRoleId?: string | null,
) {
  const session = await getPolicySession(requestedRoleId)
  if (!canManageRoles(session.currentRole)) {
    throw new Error('Role management is not allowed for the active role')
  }

  if (session.roles.some((role) => role.id === nextRole.id)) {
    throw new Error('Role with this id already exists')
  }

  const nextRoles = [...session.roles, nextRole]
  await writePolicyStore({ roles: nextRoles })

  return getPolicySession(session.currentRoleId)
}

export async function resetRoleDefinitions(requestedRoleId?: string | null) {
  const session = await getPolicySession(requestedRoleId)
  if (!canManageRoles(session.currentRole)) {
    throw new Error('Role management is not allowed for the active role')
  }

  const nextStore = await resetPolicyStore()
  const currentRole = resolveCurrentRole(nextStore.roles, session.currentRoleId)

  return {
    roles: nextStore.roles,
    currentRoleId: currentRole.id,
    currentRole,
  }
}
