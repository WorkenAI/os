'use client'

import {
  createContext,
  type ReactNode,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  canAccessDomain as canAccessDomainForSubject,
  canExecuteEntityAction as canExecuteEntityActionForSubject,
  canExecuteVerb as canExecuteVerbForSubject,
  canSeeEntity as canSeeEntityForSubject,
  canSeeSidebarItem as canSeeSidebarItemForSubject,
  getDomainPermissionsForSubject,
} from '@/shell/runtime/policy/selectors'
import { SHELL_PERMISSIONS_API } from './api-routes'
import { type PermissionSnapshot, toPermissionSnapshot } from './shared'
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
  const [roles, setRoles] = useState<RoleDefinition[]>(DEFAULT_ROLES)
  const [currentRoleId, setCurrentRoleId] = useState(defaultRoleId)

  const applySession = useCallback((session: PermissionsSessionPayload) => {
    setRoles(session.roles)
    setCurrentRoleId(session.currentRoleId)
  }, [])

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
      setRoles((prev) => prev.map((role) => (role.id === roleId ? nextRole : role)))
      void readJson<PermissionsSessionPayload>(`${SHELL_PERMISSIONS_API.roles}/${roleId}`, {
        method: 'PUT',
        body: JSON.stringify(nextRole),
      })
        .then(applySession)
        .catch(() => {
          void refreshSession()
        })
    },
    [applySession, currentRole, refreshSession, roles],
  )

  const createRole = useCallback(
    (role: RoleDefinition) => {
      setRoles((prev) => [...prev, role])
      void readJson<PermissionsSessionPayload>(SHELL_PERMISSIONS_API.roles, {
        method: 'POST',
        body: JSON.stringify(role),
      })
        .then(applySession)
        .catch(() => {
          void refreshSession()
        })
    },
    [applySession, refreshSession],
  )

  const resetToDefaults = useCallback(() => {
    setRoles(DEFAULT_ROLES)
    setCurrentRoleId(defaultRoleId)
    void readJson<PermissionsSessionPayload>(SHELL_PERMISSIONS_API.resetRoles, {
      method: 'POST',
      body: JSON.stringify({}),
    })
      .then(applySession)
      .catch(() => {
        void refreshSession()
      })
  }, [applySession, defaultRoleId, refreshSession])

  const setActiveRole = useCallback(
    (roleId: string) => {
      setCurrentRoleId(roleId)
      void readJson<PermissionsSessionPayload>(SHELL_PERMISSIONS_API.activateRole, {
        method: 'POST',
        body: JSON.stringify({ roleId }),
      })
        .then(applySession)
        .catch(() => {
          void refreshSession()
        })
    },
    [applySession, refreshSession],
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
