import type {
  DomainConversationFooterDefinition,
  DomainDefinition,
  DomainExecutionDefinition,
  DomainShellSurfaceDefinition,
  DomainShellSurfaceLayoutId,
  DomainViewDefinition,
  DomainViewId,
} from './types'

const DEFAULT_CONVERSATION_DISCLAIMER =
  'Worken OS can make mistakes. Double-check anything business-critical.'

export function defineDomain<const T extends DomainDefinition>(domain: T) {
  return domain
}

export function getDomainView(domain: DomainDefinition, viewId: string | null | undefined) {
  if (!viewId) return null
  return domain.views[viewId] ?? null
}

export function getDomainViewSpecId(domain: DomainDefinition, viewId: string | null | undefined) {
  const view = getDomainView(domain, viewId)
  return view?.specId ?? null
}

export function getDomainViewShell(
  domain: DomainDefinition,
  viewId: string | null | undefined,
): DomainShellSurfaceDefinition | null {
  return getDomainView(domain, viewId)?.shell ?? null
}

export function getDomainViewExecution(
  domain: DomainDefinition,
  viewId: string | null | undefined,
): DomainExecutionDefinition | null {
  return getDomainView(domain, viewId)?.execution ?? null
}

export function isLocalOnlyView(domain: DomainDefinition, viewId: string | null | undefined) {
  if (!viewId) return false
  return domain.surfaces.localOnlyViewIds.includes(viewId)
}

export function getShellSurfaceLayoutId(
  domain: DomainDefinition,
  viewId: string | null | undefined,
): DomainShellSurfaceLayoutId {
  return getDomainViewShell(domain, viewId)?.layoutId ?? 'default'
}

export function getConversationFooter(
  domain: DomainDefinition,
  viewId: string | null | undefined,
): Required<Pick<DomainConversationFooterDefinition, 'disclaimer'>> &
  Pick<DomainConversationFooterDefinition, 'hint'> {
  const footer = getDomainViewShell(domain, viewId)?.conversation
  return {
    disclaimer: footer?.disclaimer ?? DEFAULT_CONVERSATION_DISCLAIMER,
    hint: footer?.hint,
  }
}

export function getNavigationItemByViewId(
  domain: DomainDefinition,
  viewId: string | null | undefined,
) {
  if (!viewId) return null
  return domain.surfaces.navigation.find((item) => item.viewId === viewId) ?? null
}

export function getNavigationItemBySurfaceId(
  domain: DomainDefinition,
  surfaceId: string | null | undefined,
) {
  if (!surfaceId) return null
  return domain.surfaces.navigation.find((item) => item.id === surfaceId) ?? null
}

export function getViewLabel(domain: DomainDefinition, viewId: string | null | undefined) {
  return (
    getNavigationItemByViewId(domain, viewId)?.label ?? getDomainView(domain, viewId)?.title ?? null
  )
}

function interpolateTemplate(template: string, values: Record<string, string>) {
  return template.replaceAll(/\{(\w+)\}/g, (_, key: string) => values[key] ?? '')
}

export function buildLocalSurfaceAssistantText(
  domain: DomainDefinition,
  prompt: string,
  viewId: string | null | undefined,
) {
  const shell = getDomainViewShell(domain, viewId)
  const viewLabel = getViewLabel(domain, viewId) ?? domain.title

  return [
    interpolateTemplate(
      shell?.localAssistant?.introTemplate ?? 'Working inside the local surface {viewLabel}.',
      { domainTitle: domain.title, viewLabel },
    ),
    `Received request: "${prompt}".`,
    shell?.localAssistant?.capabilities ??
      `For ${domain.title}, a local-first surface is active without a server-rendered spec.`,
  ].join('\n\n')
}

export function getEntityForView(domain: DomainDefinition, viewId: string | null | undefined) {
  const entityId = getDomainView(domain, viewId)?.entityId
  return entityId ? (domain.entities[entityId] ?? null) : null
}

export function getDefaultViewId(domain: DomainDefinition) {
  return domain.surfaces.defaultViewId
}

export function listDomainViewIds(domain: DomainDefinition): DomainViewId[] {
  return Object.keys(domain.views)
}

export function listDomainViews(domain: DomainDefinition): DomainViewDefinition[] {
  return Object.values(domain.views)
}
