import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { getWorkenDataDir } from '@/lib/worken-data-path'
import {
  DEFAULT_ROLES,
  type DomainPermissions,
  type RoleDefinition,
} from '@worken/shell-web/permissions/types'

type PolicyStore = {
  roles: RoleDefinition[]
}

function getStorePath() {
  return path.join(getWorkenDataDir(), 'policy-store.json')
}

function getDefaultStore(): PolicyStore {
  return {
    roles: structuredClone(DEFAULT_ROLES),
  }
}

function normalizeBooleanRecord(
  record: Record<string, boolean> | undefined,
): Record<string, boolean> {
  if (!record) return {}
  return Object.fromEntries(
    Object.entries(record).filter(
      (entry): entry is [string, boolean] => typeof entry[1] === 'boolean',
    ),
  )
}

function mergeDomainPermissions(
  stored: DomainPermissions | undefined,
  fallback: DomainPermissions | undefined,
): DomainPermissions {
  const sidebar = {
    ...normalizeBooleanRecord(fallback?.sidebar),
    ...normalizeBooleanRecord(stored?.sidebar),
  }

  const verbs = {
    ...normalizeBooleanRecord(fallback?.verbs),
    ...normalizeBooleanRecord(stored?.verbs),
  }

  const entityIds = new Set([
    ...Object.keys(fallback?.entities ?? {}),
    ...Object.keys(stored?.entities ?? {}),
  ])

  const entities = Object.fromEntries(
    [...entityIds].map((entityId) => {
      const fallbackEntity = fallback?.entities[entityId]
      const storedEntity = stored?.entities[entityId]

      return [
        entityId,
        {
          visible: storedEntity?.visible ?? fallbackEntity?.visible ?? false,
          actions: {
            ...normalizeBooleanRecord(fallbackEntity?.actions),
            ...normalizeBooleanRecord(storedEntity?.actions),
          },
        },
      ]
    }),
  )

  return {
    accessible: stored?.accessible ?? fallback?.accessible ?? false,
    sidebar,
    entities,
    verbs,
  }
}

function mergeRoleDefinition(
  stored: RoleDefinition | undefined,
  fallback: RoleDefinition | undefined,
): RoleDefinition | null {
  if (!stored && !fallback) return null

  const domainIds = new Set([
    ...Object.keys(fallback?.domains ?? {}),
    ...Object.keys(stored?.domains ?? {}),
  ])

  const domains = Object.fromEntries(
    [...domainIds].map((domainId) => [
      domainId,
      mergeDomainPermissions(stored?.domains[domainId], fallback?.domains[domainId]),
    ]),
  )

  return {
    id: stored?.id ?? fallback?.id ?? 'unknown-role',
    name: stored?.name ?? fallback?.name ?? 'Unknown role',
    description: stored?.description ?? fallback?.description ?? '',
    emoji: stored?.emoji ?? fallback?.emoji ?? '👤',
    color: stored?.color ?? fallback?.color ?? '#71717a',
    domains,
  }
}

function normalizeRoles(roles: RoleDefinition[]): RoleDefinition[] {
  const storedById = new Map(roles.map((role) => [role.id, role]))
  const mergedDefaults = DEFAULT_ROLES.map((defaultRole) =>
    mergeRoleDefinition(storedById.get(defaultRole.id), defaultRole),
  ).filter((role): role is RoleDefinition => role !== null)

  const extraRoles = roles
    .filter((role) => !DEFAULT_ROLES.some((defaultRole) => defaultRole.id === role.id))
    .map((role) => mergeRoleDefinition(role, undefined))
    .filter((role): role is RoleDefinition => role !== null)

  const migratedDefaults = mergedDefaults.map((role) => {
    if (role.id !== 'hr-manager') return role

    const defaultHrManager = DEFAULT_ROLES.find((defaultRole) => defaultRole.id === 'hr-manager')
    if (!defaultHrManager) return role

    return {
      ...role,
      domains: {
        ...role.domains,
        marketing: {
          ...mergeDomainPermissions(role.domains.marketing, defaultHrManager.domains.marketing),
          accessible: true,
        },
        finance: {
          ...mergeDomainPermissions(role.domains.finance, defaultHrManager.domains.finance),
          accessible: true,
        },
      },
    }
  })

  return [...migratedDefaults, ...extraRoles]
}

async function ensureStoreDirectory() {
  await mkdir(path.dirname(getStorePath()), { recursive: true })
}

export async function readPolicyStore(): Promise<PolicyStore> {
  try {
    const raw = await readFile(getStorePath(), 'utf8')
    const parsed = JSON.parse(raw) as Partial<PolicyStore>
    if (!Array.isArray(parsed.roles) || parsed.roles.length === 0) {
      return getDefaultStore()
    }

    const normalizedStore = { roles: normalizeRoles(parsed.roles) }
    if (JSON.stringify(parsed.roles) !== JSON.stringify(normalizedStore.roles)) {
      await writePolicyStore(normalizedStore)
    }

    return normalizedStore
  } catch {
    return getDefaultStore()
  }
}

export async function writePolicyStore(store: PolicyStore) {
  await ensureStoreDirectory()
  await writeFile(
    getStorePath(),
    JSON.stringify({ roles: normalizeRoles(store.roles) }, null, 2),
    'utf8',
  )
}

export async function resetPolicyStore() {
  const nextStore = getDefaultStore()
  await writePolicyStore(nextStore)
  return nextStore
}
