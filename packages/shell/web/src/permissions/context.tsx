'use client'

import { useMachine } from '@xstate/react'
import {
  createContext,
  type ReactNode,
  use,
  useCallback,
  useEffect,
  useMemo,
} from 'react'
import {
  canAccessDomain as canAccessDomainForSubject,
  canExecuteEntityAction as canExecuteEntityActionForSubject,
  canExecuteVerb as canExecuteVerbForSubject,
  canSeeEntity as canSeeEntityForSubject,
  canSeeSidebarItem as canSeeSidebarItemForSubject,
  getDomainPermissionsForSubject,
} from '@worken/shell-web/runtime/policy/selectors'
import { SHELL_PERMISSIONS_API } from './api-routes'
import { type PermissionSnapshot, toPermissionSnapshot } from './shared'
import { permissionsMachine } from '@worken/shell-web/machines/permissions-machine'
import {
  DEFAULT_ACTIVE_ROLE_ID,
  DEFAULT_ROLES,
  type DomainPermissions,
  type RoleDefinition,
} from './types'

type PermissionsApi = {
  currentRole: RoleDefinition
  roles: RoleDefinition[]
  setCurrentRoleId: (roleId: string) => void
  createRole: (role: RoleDefinition) => void
  updateRole: (roleId: string, updater: (role: RoleDefinition) => RoleDefinition) => void
  resetToDefaults: () => void
  canAccessDomain: (domainId: string) => boolean
  getDomainPermissions: (domainId: string) => DomainPermissions | null
  canSeeSidebarItem: (domainId: string, itemId: string) => boolean
  canSeeEntity: (domainId: string, entityType: string) => boolean
  canExecuteVerb: (domainId: string, verb: string) => boolean
  canExecuteEntityAction: (domainId: string, entityType: string, action: string) => boolean
  currentPermissionSnapshot: PermissionSnapshot
}

const PermissionsContext = createContext<PermissionsApi | null>(null)

type PermissionsSessionPayload = {
  roles: RoleDefinition[]
  currentRoleId: string
}

async function readJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })

  if (!response.ok) {
    throw new Error(`Permission request failed: ${response.status}`)
  }

  return (await response.json()) as T
}

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const defaultRoleId =
    DEFAULT_ROLES.find((role) => role.id === DEFAULT_ACTIVE_ROLE_ID)?.id ??
    DEFAULT_ROLES[0]?.id ??
    ''
  const [snapshot, send] = useMachine(permissionsMachine)
  const roles = snapshot.context.roles
  const currentRoleId = snapshot.context.currentRoleId

  const applySession = useCallback((session: PermissionsSessionPayload) => {
    send({ type: 'session.apply', roles: session.roles, currentRoleId: session.currentRoleId })
  }, [send])

  const refreshSession = useCallback(async () => {
    const session = await readJson<PermissionsSessionPayload>(SHELL_PERMISSIONS_API.session, {
      cache: 'no-store',
    })
    applySession(session)
  }, [applySession])

  useEffect(() => {
    void refreshSession()
  }, [refreshSession])

  const currentRole = useMemo(
    () =>
      roles.find((role) => role.id === currentRoleId) ??
      roles.find((role) => role.id === defaultRoleId) ??
      roles[0],
    [roles, currentRoleId, defaultRoleId],
  )
  const currentPermissionSnapshot = useMemo(() => toPermissionSnapshot(currentRole), [currentRole])

  const updateRole = useCallback(
    (roleId: string, updater: (role: RoleDefinition) => RoleDefinition) => {
      const nextRole = updater(roles.find((role) => role.id === roleId) ?? currentRole)
      send({ type: 'role.update', roleId, role: nextRole })
      void readJson<PermissionsSessionPayload>(`${SHELL_PERMISSIONS_API.roles}/${roleId}`, {
        method: 'PUT',
        body: JSON.stringify(nextRole),
      })
        .then(applySession)
        .catch(() => {
          void refreshSession()
        })
    },
    [applySession, currentRole, refreshSession, roles, send],
  )

  const createRole = useCallback(
    (role: RoleDefinition) => {
      send({ type: 'role.add', role })
      void readJson<PermissionsSessionPayload>(SHELL_PERMISSIONS_API.roles, {
        method: 'POST',
        body: JSON.stringify(role),
      })
        .then(applySession)
        .catch(() => {
          void refreshSession()
        })
    },
    [applySession, refreshSession, send],
  )

  const resetToDefaults = useCallback(() => {
    send({
      type: 'roles.reset',
      roles: DEFAULT_ROLES,
      currentRoleId: defaultRoleId,
    })
    void readJson<PermissionsSessionPayload>(SHELL_PERMISSIONS_API.resetRoles, {
      method: 'POST',
      body: JSON.stringify({}),
    })
      .then(applySession)
      .catch(() => {
        void refreshSession()
      })
  }, [applySession, defaultRoleId, refreshSession, send])

  const setActiveRole = useCallback(
    (roleId: string) => {
      send({ type: 'role.activate', roleId })
      void readJson<PermissionsSessionPayload>(SHELL_PERMISSIONS_API.activateRole, {
        method: 'POST',
        body: JSON.stringify({ roleId }),
      })
        .then(applySession)
        .catch(() => {
          void refreshSession()
        })
    },
    [applySession, refreshSession, send],
  )

  const canAccessDomain = useCallback(
    (domainId: string) => canAccessDomainForSubject(currentRole, domainId),
    [currentRole],
  )

  const getDomainPermissions = useCallback(
    (domainId: string): DomainPermissions | null =>
      getDomainPermissionsForSubject(currentRole, domainId),
    [currentRole],
  )

  const canSeeSidebarItem = useCallback(
    (domainId: string, itemId: string) =>
      canSeeSidebarItemForSubject(currentRole, domainId, itemId),
    [currentRole],
  )

  const canSeeEntity = useCallback(
    (domainId: string, entityType: string) =>
      canSeeEntityForSubject(currentRole, domainId, entityType),
    [currentRole],
  )

  const canExecuteVerb = useCallback(
    (domainId: string, verb: string) => canExecuteVerbForSubject(currentRole, domainId, verb),
    [currentRole],
  )

  const canExecuteEntityAction = useCallback(
    (domainId: string, entityType: string, action: string) =>
      canExecuteEntityActionForSubject(currentRole, domainId, entityType, action),
    [currentRole],
  )

  const api = useMemo<PermissionsApi>(
    () => ({
      currentRole,
      roles,
      setCurrentRoleId: setActiveRole,
      createRole,
      updateRole,
      resetToDefaults,
      canAccessDomain,
      getDomainPermissions,
      canSeeSidebarItem,
      canSeeEntity,
      canExecuteVerb,
      canExecuteEntityAction,
      currentPermissionSnapshot,
    }),
    [
      currentRole,
      roles,
      setActiveRole,
      createRole,
      updateRole,
      resetToDefaults,
      canAccessDomain,
      getDomainPermissions,
      canSeeSidebarItem,
      canSeeEntity,
      canExecuteVerb,
      canExecuteEntityAction,
      currentPermissionSnapshot,
    ],
  )

  return <PermissionsContext value={api}>{children}</PermissionsContext>
}

export function usePermissions() {
  const ctx = use(PermissionsContext)
  if (!ctx) throw new Error('usePermissions must be used inside PermissionsProvider')
  return ctx
}
