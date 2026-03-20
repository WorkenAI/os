import type { DomainDefinition } from '@/domains/types'
import type { JsonSchemaObject, WebMcpToolAnnotations } from './types'

type DomainSummary = {
  id: string
  title: string
  icon: string
}

type DomainViewSummary = {
  id: string
  title: string
  label: string
}

type DomainEntitySummary = {
  id: string
  label: string
  pluralLabel: string
}

type DomainVerbSummary = {
  id: string
  label: string
  entityIds: string[]
}

export type WorkenOsToolGenerationSnapshot = {
  currentRoleName: string
  accessibleDomains: DomainSummary[]
  currentDomain: {
    id: string
    title: string
    icon: string
    activeViewId: string | null
    activeViewTitle: string | null
    visibleViews: DomainViewSummary[]
    visibleEntities: DomainEntitySummary[]
    allowedVerbs: DomainVerbSummary[]
  } | null
}

type GeneratedToolAction =
  | { kind: 'get_context' }
  | { kind: 'list_domains' }
  | { kind: 'list_current_domain_capabilities' }
  | { kind: 'open_domain'; domainId?: string }
  | { kind: 'open_view'; viewId?: string }
  | { kind: 'execute_verb'; verbId?: string; entityType?: string }
  | { kind: 'open_inspector' }
  | { kind: 'send_message' }

export type GeneratedWorkenOsTool = {
  name: string
  description: string
  inputSchema?: JsonSchemaObject
  annotations?: WebMcpToolAnnotations
  action: GeneratedToolAction
}

export type WorkenOsSnapshotBuilderInput = {
  currentRoleName: string
  accessibleDomains: DomainDefinition[]
  currentDomain: DomainDefinition | null
  activeViewId: string | null
  canSeeSidebarItem: (domainId: string, itemId: string) => boolean
  canSeeEntity: (domainId: string, entityId: string) => boolean
  canExecuteVerb: (domainId: string, verbId: string) => boolean
}

const readOnlyAnnotations = { readOnlyHint: true } satisfies WebMcpToolAnnotations

const emptyObjectSchema = {
  type: 'object',
  properties: {},
  required: [],
  additionalProperties: false,
} satisfies JsonSchemaObject

export function createWorkenOsToolGenerationSnapshot(
  input: WorkenOsSnapshotBuilderInput,
): WorkenOsToolGenerationSnapshot {
  const currentDomain = input.currentDomain

  return {
    currentRoleName: input.currentRoleName,
    accessibleDomains: input.accessibleDomains.map((domain) => ({
      id: domain.id,
      title: domain.title,
      icon: domain.icon,
    })),
    currentDomain: currentDomain
      ? {
          id: currentDomain.id,
          title: currentDomain.title,
          icon: currentDomain.icon,
          activeViewId: input.activeViewId,
          activeViewTitle: input.activeViewId
            ? (currentDomain.views[input.activeViewId]?.title ?? null)
            : null,
          visibleViews: currentDomain.surfaces.navigation
            .filter((item) => input.canSeeSidebarItem(currentDomain.id, item.id))
            .map((item) => ({
              id: item.viewId,
              title: currentDomain.views[item.viewId]?.title ?? item.label,
              label: item.label,
            })),
          visibleEntities: Object.values(currentDomain.entities)
            .filter((entity) => input.canSeeEntity(currentDomain.id, entity.id))
            .map((entity) => ({
              id: entity.id,
              label: entity.label,
              pluralLabel: entity.pluralLabel,
            })),
          allowedVerbs: Object.values(currentDomain.verbs)
            .filter((verb) => input.canExecuteVerb(currentDomain.id, verb.id))
            .map((verb) => ({
              id: verb.id,
              label: verb.label,
              entityIds: verb.entityIds ?? [],
            })),
        }
      : null,
  }
}

export function generateWorkenOsTools(
  snapshot: WorkenOsToolGenerationSnapshot,
): GeneratedWorkenOsTool[] {
  const tools: GeneratedWorkenOsTool[] = [
    {
      name: 'worken_os.get_context',
      description:
        'Read the current Worken OS shell context, including domain, view, role, and inspector.',
      inputSchema: emptyObjectSchema,
      annotations: readOnlyAnnotations,
      action: { kind: 'get_context' },
    },
    {
      name: 'worken_os.list_accessible_domains',
      description: 'List the domains currently accessible in Worken OS for the active role.',
      inputSchema: emptyObjectSchema,
      annotations: readOnlyAnnotations,
      action: { kind: 'list_domains' },
    },
  ]

  if (snapshot.accessibleDomains.length > 0) {
    tools.push({
      name: 'worken_os.open_domain',
      description: 'Open an accessible Worken OS domain.',
      inputSchema: {
        type: 'object',
        properties: {
          domainId: {
            type: 'string',
            enum: snapshot.accessibleDomains.map((domain) => domain.id),
            description: 'The Worken OS domain id to open.',
          },
        },
        required: ['domainId'],
        additionalProperties: false,
      },
      action: { kind: 'open_domain' },
    })

    for (const domain of snapshot.accessibleDomains) {
      tools.push({
        name: `worken_os.open_${sanitizeToolSegment(domain.id)}`,
        description: `Open the ${domain.title} domain in Worken OS.`,
        inputSchema: emptyObjectSchema,
        action: { kind: 'open_domain', domainId: domain.id },
      })
    }
  }

  if (!snapshot.currentDomain) {
    return tools
  }

  tools.push(
    {
      name: 'worken_os.list_current_domain_capabilities',
      description:
        'List visible views, entities, and actions available in the current Worken OS domain.',
      inputSchema: emptyObjectSchema,
      annotations: readOnlyAnnotations,
      action: { kind: 'list_current_domain_capabilities' },
    },
    {
      name: 'worken_os.send_message',
      description: 'Send a natural-language request to the current Worken OS assistant workspace.',
      inputSchema: {
        type: 'object',
        properties: {
          text: {
            type: 'string',
            description: 'User message to send to the current Worken OS assistant.',
          },
        },
        required: ['text'],
        additionalProperties: false,
      },
      action: { kind: 'send_message' },
    },
  )

  if (snapshot.currentDomain.visibleViews.length > 0) {
    tools.push({
      name: 'worken_os.open_current_view',
      description: `Open a visible view inside the ${snapshot.currentDomain.title} domain.`,
      inputSchema: {
        type: 'object',
        properties: {
          viewId: {
            type: 'string',
            enum: snapshot.currentDomain.visibleViews.map((view) => view.id),
            description: 'The id of the visible Worken OS view to open.',
          },
        },
        required: ['viewId'],
        additionalProperties: false,
      },
      action: { kind: 'open_view' },
    })
  }

  if (snapshot.currentDomain.allowedVerbs.length > 0) {
    tools.push({
      name: 'worken_os.execute_current_domain_verb',
      description: `Execute an allowed action inside the ${snapshot.currentDomain.title} domain.`,
      inputSchema: buildVerbInputSchema(
        snapshot.currentDomain.allowedVerbs,
        snapshot.currentDomain.visibleEntities,
      ),
      action: { kind: 'execute_verb' },
    })
  }

  if (snapshot.currentDomain.visibleEntities.length > 0) {
    tools.push({
      name: 'worken_os.open_inspector',
      description: 'Open a business entity in the Worken OS inspector panel.',
      inputSchema: {
        type: 'object',
        properties: {
          entityType: {
            type: 'string',
            enum: snapshot.currentDomain.visibleEntities.map((entity) => entity.id),
            description: 'Entity type to inspect.',
          },
          id: {
            type: 'string',
            description: 'Entity id to open in the inspector.',
          },
        },
        required: ['entityType', 'id'],
        additionalProperties: false,
      },
      action: { kind: 'open_inspector' },
    })
  }

  for (const view of snapshot.currentDomain.visibleViews) {
    tools.push({
      name: `worken_os.${sanitizeToolSegment(snapshot.currentDomain.id)}.open_${sanitizeToolSegment(view.id)}`,
      description: `Open the ${view.label} view in the ${snapshot.currentDomain.title} domain.`,
      inputSchema: emptyObjectSchema,
      action: { kind: 'open_view', viewId: view.id },
    })
  }

  for (const verb of snapshot.currentDomain.allowedVerbs) {
    const defaultEntityType = verb.entityIds.length === 1 ? verb.entityIds[0] : undefined
    tools.push({
      name: `worken_os.${sanitizeToolSegment(snapshot.currentDomain.id)}.run_${sanitizeToolSegment(verb.id)}`,
      description: `Run the ${verb.label} action in the ${snapshot.currentDomain.title} domain.`,
      inputSchema: buildVerbAliasInputSchema(
        verb,
        snapshot.currentDomain.visibleEntities,
        defaultEntityType,
      ),
      action: {
        kind: 'execute_verb',
        verbId: verb.id,
        entityType: defaultEntityType,
      },
    })
  }

  return tools
}

function buildVerbInputSchema(
  verbs: DomainVerbSummary[],
  entities: DomainEntitySummary[],
): JsonSchemaObject {
  return {
    type: 'object',
    properties: {
      verbId: {
        type: 'string',
        enum: verbs.map((verb) => verb.id),
        description: 'Allowed domain action to execute.',
      },
      entityType: {
        type: 'string',
        enum: entities.map((entity) => entity.id),
        description: 'Optional entity type context for the action.',
      },
    },
    required: ['verbId'],
    additionalProperties: false,
  }
}

function buildVerbAliasInputSchema(
  verb: DomainVerbSummary,
  entities: DomainEntitySummary[],
  defaultEntityType?: string,
): JsonSchemaObject {
  if (defaultEntityType || verb.entityIds.length === 0) {
    return emptyObjectSchema
  }

  const visibleEntityIds = new Set(entities.map((entity) => entity.id))
  const relevantEntityIds = verb.entityIds.filter((entityId) => visibleEntityIds.has(entityId))

  if (relevantEntityIds.length === 0) {
    return emptyObjectSchema
  }

  return {
    type: 'object',
    properties: {
      entityType: {
        type: 'string',
        enum: relevantEntityIds,
        description: 'Entity type context for this action.',
      },
    },
    required: ['entityType'],
    additionalProperties: false,
  }
}

function sanitizeToolSegment(value: string) {
  return value
    .replaceAll(/[^a-zA-Z0-9]+/g, '_')
    .replaceAll(/^_+|_+$/g, '')
    .toLowerCase()
}
