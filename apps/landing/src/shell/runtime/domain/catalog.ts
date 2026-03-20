import { getDomain } from '@/domains/registry'

export function getDomainMeta(domainId: string) {
  const domain = getDomain(domainId)
  return {
    title: domain.title,
    icon: domain.icon,
    accent: domain.accent,
  }
}

export function getDomainSidebarItems(domainId: string) {
  return getDomain(domainId).surfaces.navigation.map((item) => ({
    id: item.id,
    label: item.label,
    viewId: item.viewId,
  }))
}

export function getDomainEntities(domainId: string) {
  return Object.values(getDomain(domainId).entities).map((entity) => ({
    id: entity.id,
    label: entity.label,
    pluralLabel: entity.pluralLabel,
    actions: entity.actions,
  }))
}

export function getDomainVerbLabels(domainId: string) {
  return Object.values(getDomain(domainId).verbs).map((verb) => ({
    id: verb.id,
    label: verb.label,
  }))
}

export function resolveEntityTypeFromView(domainId: string, viewId: string | null | undefined) {
  if (!viewId) return null
  return getDomain(domainId).views[viewId]?.entityId ?? null
}
