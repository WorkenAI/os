import {
  getDefaultViewId,
  getDomainViewSpecId,
  type DomainDefinition,
} from '@worken/demo-data/shell-contract'
import type { DomainPermissions, RoleDefinition } from '@/shell/permissions/types'

export type PolicySubject = Pick<RoleDefinition, 'domains'>

export function getDomainPermissionsForSubject(
  subject: PolicySubject | null | undefined,
  domainId: string,
): DomainPermissions | null {
  return subject?.domains[domainId] ?? null
}

export function canAccessDomain(subject: PolicySubject | null | undefined, domainId: string) {
  return getDomainPermissionsForSubject(subject, domainId)?.accessible ?? false
}

export function canSeeSidebarItem(
  subject: PolicySubject | null | undefined,
  domainId: string,
  itemId: string,
) {
  const domainPermissions = getDomainPermissionsForSubject(subject, domainId)
  if (!domainPermissions?.accessible) return false
  return domainPermissions.sidebar[itemId] ?? false
}

export function canSeeEntity(
  subject: PolicySubject | null | undefined,
  domainId: string,
  entityType: string,
) {
  const domainPermissions = getDomainPermissionsForSubject(subject, domainId)
  if (!domainPermissions?.accessible) return false
  return domainPermissions.entities[entityType]?.visible ?? false
}

export function canExecuteVerb(
  subject: PolicySubject | null | undefined,
  domainId: string,
  verb: string,
) {
  const domainPermissions = getDomainPermissionsForSubject(subject, domainId)
  if (!domainPermissions?.accessible) return false
  return domainPermissions.verbs[verb] ?? false
}

export function canExecuteEntityAction(
  subject: PolicySubject | null | undefined,
  domainId: string,
  entityType: string,
  action: string,
) {
  const domainPermissions = getDomainPermissionsForSubject(subject, domainId)
  if (!domainPermissions?.accessible) return false
  return domainPermissions.entities[entityType]?.actions[action] ?? false
}

export function getVisibleNavigation(
  domain: DomainDefinition,
  subject: PolicySubject | null | undefined,
) {
  return domain.surfaces.navigation.filter((item) => canSeeSidebarItem(subject, domain.id, item.id))
}

export function getAllowedViewId(
  domain: DomainDefinition,
  subject: PolicySubject | null | undefined,
  requestedViewId?: string | null,
) {
  const visibleNavigation = getVisibleNavigation(domain, subject)
  const defaultViewId = getDefaultViewId(domain)
  const fallbackViewId = visibleNavigation[0]?.viewId ?? null

  if (!requestedViewId) {
    return visibleNavigation.find((item) => item.viewId === defaultViewId)?.viewId ?? fallbackViewId
  }

  return visibleNavigation.find((item) => item.viewId === requestedViewId)?.viewId ?? fallbackViewId
}

export function getAllowedSpecId(
  domain: DomainDefinition,
  subject: PolicySubject | null | undefined,
  requestedViewId?: string | null,
) {
  const viewId = getAllowedViewId(domain, subject, requestedViewId)
  return getDomainViewSpecId(domain, viewId)
}
