import { getViewLabel } from '@/domains/manifest'
import type { DomainDefinition } from '@/domains/types'

export function buildShellBreadcrumbPath(
  domain: DomainDefinition,
  activeView: string | null | undefined,
) {
  return [domain.title, getViewLabel(domain, activeView) ?? 'No access']
}
