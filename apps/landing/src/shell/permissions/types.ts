import { DOMAIN_MANIFESTS, getDomain } from '@/domains/registry'
import type { DomainEntityDefinition, DomainVerbDefinition, SidebarNavItem } from '@/domains/types'

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
  domains: Record<string, DomainPermissions>
}

export type TenantPermissionConfig = {
  tenantId: string
  roles: RoleDefinition[]
  defaultRoleId: string
}

export const DEFAULT_ACTIVE_ROLE_ID = 'hr-manager'

export const DEFAULT_ROLES: RoleDefinition[] = [
  {
    id: 'admin',
    name: 'Administrator',
    description: 'Full access to all domains and actions',
    emoji: '🛡️',
    color: '#ef4444',
    domains: {
      admin: fullAccess('admin'),
      developer: fullAccess('developer'),
      hr: fullAccess('hr'),
      sales: fullAccess('sales'),
      marketing: fullAccess('marketing'),
      finance: fullAccess('finance'),
    },
  },
  {
    id: 'developer',
    name: 'Developer',
    description: 'Code agent for reading the repo, preparing patches, and shipping capabilities',
    emoji: '🧑‍💻',
    color: '#60a5fa',
    domains: {
      admin: readOnlyAccess('admin'),
      developer: fullAccess('developer'),
      hr: readOnlyAccess('hr'),
      sales: readOnlyAccess('sales'),
      marketing: readOnlyAccess('marketing'),
      finance: readOnlyAccess('finance'),
    },
  },
  {
    id: 'hr-manager',
    name: 'HR manager',
    description: 'Full access to HR; read-only on other domains',
    emoji: '👥',
    color: '#22d3ee',
    domains: {
      admin: readOnlyAccess('admin'),
      developer: readOnlyAccess('developer'),
      hr: fullAccess('hr'),
      sales: readOnlyAccess('sales'),
      marketing: readOnlyAccess('marketing'),
      finance: readOnlyAccess('finance'),
    },
  },
  {
    id: 'sales-rep',
    name: 'Sales rep',
    description: 'Full access to Sales; read-only HR',
    emoji: '💼',
    color: '#a78bfa',
    domains: {
      admin: readOnlyAccess('admin'),
      developer: readOnlyAccess('developer'),
      hr: readOnlyAccess('hr'),
      sales: fullAccess('sales'),
      marketing: readOnlyAccess('marketing'),
      finance: noAccess(),
    },
  },
  {
    id: 'marketing-specialist',
    name: 'Marketing specialist',
    description: 'Full access to Marketing; read-only Sales',
    emoji: '📢',
    color: '#34d399',
    domains: {
      admin: readOnlyAccess('admin'),
      developer: readOnlyAccess('developer'),
      hr: noAccess(),
      sales: readOnlyAccess('sales'),
      marketing: fullAccess('marketing'),
      finance: noAccess(),
    },
  },
  {
    id: 'accountant',
    name: 'Accountant',
    description: 'Full access to Finance',
    emoji: '💰',
    color: '#f59e0b',
    domains: {
      admin: readOnlyAccess('admin'),
      developer: readOnlyAccess('developer'),
      hr: noAccess(),
      sales: readOnlyAccess('sales'),
      marketing: noAccess(),
      finance: fullAccess('finance'),
    },
  },
  {
    id: 'viewer',
    name: 'Viewer',
    description: 'Read-only across all domains',
    emoji: '👀',
    color: '#71717a',
    domains: {
      admin: readOnlyAccess('admin'),
      developer: readOnlyAccess('developer'),
      hr: readOnlyAccess('hr'),
      sales: readOnlyAccess('sales'),
      marketing: readOnlyAccess('marketing'),
      finance: readOnlyAccess('finance'),
    },
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
  return Object.fromEntries(
    getDomain(domainId).surfaces.navigation.map((item: SidebarNavItem) => [item.id, true]),
  )
}

function allEntities(
  domainId: string,
): Record<string, { visible: boolean; actions: Record<string, boolean> }> {
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
  const entities: Record<string, { visible: boolean; actions: Record<string, boolean> }> = {}
  for (const entity of Object.values(getDomain(domainId).entities) as DomainEntityDefinition[]) {
    entities[entity.id] = { visible: true, actions: {} }
  }
  return entities
}

function allVerbs(domainId: string): Record<string, boolean> {
  const verbs: Record<string, boolean> = {}
  for (const verb of Object.values(getDomain(domainId).verbs) as DomainVerbDefinition[]) {
    verbs[verb.id] = true
  }
  return verbs
}
