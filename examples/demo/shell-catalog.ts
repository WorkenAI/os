/**
 * Single source of truth: which shell workspaces exist, their landing layer, and demo traffic accents.
 * Domain manifests live in `./domains/`; `domains/catalog.ts` maps these ids to modules.
 */
export const SHELL_DOMAIN_CATALOG = [
  { id: 'admin', landingLayer: 'roles' as const, trafficAccent: '#ef4444' },
  { id: 'developer', landingLayer: 'roles' as const, trafficAccent: '#60a5fa' },
  { id: 'hr', landingLayer: 'business' as const },
  { id: 'sales', landingLayer: 'business' as const },
  { id: 'marketing', landingLayer: 'business' as const },
] as const

export type ShellDomainCatalogEntry = (typeof SHELL_DOMAIN_CATALOG)[number]
export type ShellDomainId = ShellDomainCatalogEntry['id']

export const SHELL_DOMAIN_IDS: readonly ShellDomainId[] = SHELL_DOMAIN_CATALOG.map((e) => e.id)

/** Alias for redirects / tooling — same ids as {@link SHELL_DOMAIN_IDS}. */
export const REGISTERED_SHELL_DOMAIN_IDS = SHELL_DOMAIN_IDS

export type ShellLandingLayerId = 'roles' | 'business'

export function shellCatalogIdsByLayer(layer: 'business'): readonly ShellBusinessDomainId[]
export function shellCatalogIdsByLayer(layer: 'roles'): readonly ShellRoleLayerDomainId[]
export function shellCatalogIdsByLayer(layer: ShellLandingLayerId): readonly ShellDomainId[] {
  return SHELL_DOMAIN_CATALOG.filter((e) => e.landingLayer === layer).map((e) => e.id)
}

export type ShellBusinessDomainId = Extract<
  ShellDomainCatalogEntry,
  { landingLayer: 'business' }
>['id']

export type ShellRoleLayerDomainId = Extract<
  ShellDomainCatalogEntry,
  { landingLayer: 'roles' }
>['id']
