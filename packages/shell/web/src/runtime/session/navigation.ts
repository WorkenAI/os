import { getViewLabel } from '@worken/ir/domains/manifest'
import type { DomainDefinition } from '@worken/ir/domains/types'

export function buildShellBreadcrumbPath(
  domain: DomainDefinition,
  activeView: string | null | undefined,
) {
  return [domain.title, getViewLabel(domain, activeView) ?? 'No access']
}
