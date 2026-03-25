import {
  DOMAIN_MANIFESTS,
  getDomain,
  isKnownDomainId,
  type DomainEntityDefinition,
  type DomainVerbDefinition,
  type ShellDomainId,
  type ShellIconKey,
  type SidebarNavItem,
} from '@worken/demo-data/shell-contract'

export type PermissionLevel = 'none' | 'read' | 'write' | 'admin'

export type DomainPermissions = {
  accessible: boolean
  sidebar: Record<string, boolean>
  entities: Record<
    string,
    {
      visible: boolean
      actions: Record<string, boolean>
    }
  >
  verbs: Record<string, boolean>
}

export type RoleDefinition = {
  id: string
  name: string
  description: string
  emoji: string
  color: string
  /** Lucide icon for shell UI — see {@link SHELL_ICON_BY_KEY}. */
  shellIcon: ShellIconKey
  /** Keys are exactly {@link DOMAIN_MANIFESTS} ids — derived via {@link mergeRoleDomains}, never hand-listed. */
  domains: Record<string, DomainPermissions>
}

export type TenantPermissionConfig = {
  tenantId: string
  roles: RoleDefinition[]
  defaultRoleId: string
}

export const DEFAULT_ACTIVE_ROLE_ID = 'hr-manager'

/** Declarative grant per registered shell domain (manifest-driven). */
type RegisteredDomainId = ShellDomainId
type DomainGrant = 'none' | 'read' | 'full'

export const DEFAULT_ROLES: RoleDefinition[] = [
  {
    id: 'admin',
    name: 'Administrator',
    description: 'Full access to all domains and actions',
    emoji: '🛡️',
    color: '#ef4444',
    shellIcon: 'shield',
    domains: allDomainsAtLevel('full'),
  },
  {
    id: 'developer',
    name: 'Developer',
    description: 'Code agent for reading the repo, preparing patches, and shipping capabilities',
    emoji: '🧑‍💻',
    color: '#60a5fa',
    shellIcon: 'code',
    domains: mergeRoleDomains({
      admin: 'read',
      developer: 'full',
      hr: 'read',
      sales: 'read',
      marketing: 'read',
    }),
  },
  {
    id: 'hr-manager',
    name: 'HR manager',
    description: 'Full access to HR; read-only on other domains',
    emoji: '👥',
    color: '#22d3ee',
    shellIcon: 'users',
    domains: mergeRoleDomains({
      admin: 'read',
      developer: 'read',
      hr: 'full',
      sales: 'read',
      marketing: 'read',
    }),
  },
  {
    id: 'sales-rep',
    name: 'Sales rep',
    description: 'Full access to Sales; read-only HR',
    emoji: '💼',
    color: '#a78bfa',
    shellIcon: 'briefcase',
    domains: mergeRoleDomains({
      admin: 'read',
      developer: 'read',
      hr: 'read',
      sales: 'full',
      marketing: 'read',
    }),
  },
  {
    id: 'marketing-specialist',
    name: 'Marketing specialist',
    description: 'Full access to Marketing; read-only Sales',
    emoji: '📢',
    color: '#34d399',
    shellIcon: 'megaphone',
    domains: mergeRoleDomains({
      admin: 'read',
      developer: 'read',
      hr: 'none',
      sales: 'read',
      marketing: 'full',
    }),
  },
  {
    id: 'accountant',
    name: 'Accountant',
    description: 'Cross-domain read for reporting (no dedicated Finance workspace)',
    emoji: '💰',
    color: '#f59e0b',
    shellIcon: 'wallet',
    domains: mergeRoleDomains({
      admin: 'read',
      developer: 'read',
      hr: 'none',
      sales: 'read',
      marketing: 'read',
    }),
  },
  {
    id: 'viewer',
    name: 'Viewer',
    description: 'Read-only across all domains',
    emoji: '👀',
    color: '#71717a',
    shellIcon: 'eye',
    domains: allDomainsAtLevel('read'),
  },
]

function noAccess(): DomainPermissions {
  return {
    accessible: false,
    sidebar: {},
    entities: {},
    verbs: {},
  }
}

function fullAccess(domainId: string): DomainPermissions {
  return {
    accessible: true,
    sidebar: allSidebarItems(domainId),
    entities: allEntities(domainId),
    verbs: allVerbs(domainId),
  }
}

function readOnlyAccess(domainId: string): DomainPermissions {
  return {
    accessible: true,
    sidebar: allSidebarItems(domainId),
    entities: readOnlyEntities(domainId),
    verbs: {},
  }
}

function allSidebarItems(domainId: string): Record<string, boolean> {
  if (!isKnownDomainId(domainId)) return {}
  return Object.fromEntries(
    getDomain(domainId).surfaces.navigation.map((item: SidebarNavItem) => [item.id, true]),
  )
}

function allEntities(
  domainId: string,
): Record<string, { visible: boolean; actions: Record<string, boolean> }> {
  if (!isKnownDomainId(domainId)) return {}
  const entities: Record<string, { visible: boolean; actions: Record<string, boolean> }> = {}
  for (const entity of Object.values(getDomain(domainId).entities) as DomainEntityDefinition[]) {
    entities[entity.id] = {
      visible: true,
      actions: Object.fromEntries(entity.actions.map((action: string) => [action, true])),
    }
  }
  return entities
}

function readOnlyEntities(
  domainId: string,
): Record<string, { visible: boolean; actions: Record<string, boolean> }> {
  if (!isKnownDomainId(domainId)) return {}
  const entities: Record<string, { visible: boolean; actions: Record<string, boolean> }> = {}
  for (const entity of Object.values(getDomain(domainId).entities) as DomainEntityDefinition[]) {
    entities[entity.id] = { visible: true, actions: {} }
  }
  return entities
}

function allVerbs(domainId: string): Record<string, boolean> {
  if (!isKnownDomainId(domainId)) return {}
  const verbs: Record<string, boolean> = {}
  for (const verb of Object.values(getDomain(domainId).verbs) as DomainVerbDefinition[]) {
    verbs[verb.id] = true
  }
  return verbs
}

/**
 * Build `RoleDefinition.domains` from the current {@link DOMAIN_MANIFESTS} only.
 * Unknown ids in `grants` are ignored; omitted ids default to `'none'`.
 */
function mergeRoleDomains(
  grants: Partial<Record<RegisteredDomainId, DomainGrant>>,
): RoleDefinition['domains'] {
  const result: RoleDefinition['domains'] = {}
  for (const domain of DOMAIN_MANIFESTS) {
    const id = domain.id as RegisteredDomainId
    const grant = grants[id] ?? 'none'
    result[id] =
      grant === 'full'
        ? fullAccess(id)
        : grant === 'read'
          ? readOnlyAccess(id)
          : noAccess()
  }
  return result
}

function allDomainsAtLevel(level: DomainGrant): RoleDefinition['domains'] {
  const grants: Partial<Record<RegisteredDomainId, DomainGrant>> = {}
  for (const d of DOMAIN_MANIFESTS) {
    grants[d.id as RegisteredDomainId] = level
  }
  return mergeRoleDomains(grants)
}
