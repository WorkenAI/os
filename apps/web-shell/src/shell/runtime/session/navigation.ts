import { getViewLabel, type DomainDefinition } from '@worken/demo-data/shell-contract'

export function buildShellBreadcrumbPath(
  domain: DomainDefinition,
  activeView: string | null | undefined,
) {
  return [domain.title, getViewLabel(domain, activeView) ?? 'No access']
}
