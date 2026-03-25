import { randomUUID } from 'node:crypto'
import type { WorkenActorRef, WorkenOsSession, WorkenWorkspaceRef } from './contract.js'

export type LocalShellIdentity = {
  actorId: string
  workspace: WorkenWorkspaceRef
  /** `cli` — interactive shell; web uses `request-headers` or `local-demo`. */
  source: 'cli' | 'request-headers' | 'local-demo'
}

const DEFAULT_LOCAL_ACTOR_ID = 'local-human'
const DEFAULT_LOCAL_ORGANIZATION_ID = 'local-org'
const DEFAULT_LOCAL_PROJECT_ID = 'local-project'

/**
 * Default identity when no env overrides (aligned with web-shell local demo).
 */
export function defaultLocalShellIdentity(): LocalShellIdentity {
  return {
    actorId: DEFAULT_LOCAL_ACTOR_ID,
    workspace: {
      organizationId: DEFAULT_LOCAL_ORGANIZATION_ID,
      projectId: DEFAULT_LOCAL_PROJECT_ID,
    },
    source: 'cli',
  }
}

function buildActor(identity: LocalShellIdentity, roleId: string): WorkenActorRef {
  return {
    kind: 'human',
    id: identity.actorId,
    roleId,
  }
}

/**
 * Create or refresh a {@link WorkenOsSession} for local/CLI shells (no cookie persistence).
 */
export function createLocalShellSession(input: {
  identity?: LocalShellIdentity
  currentRoleId: string
  existing?: WorkenOsSession | null
}): WorkenOsSession {
  const identity = input.identity ?? defaultLocalShellIdentity()
  const now = new Date().toISOString()
  const actor = buildActor(identity, input.currentRoleId)

  if (input.existing) {
    return {
      ...input.existing,
      actor,
      currentRoleId: input.currentRoleId,
      workspace: identity.workspace,
      scope: 'shell',
      status: 'active',
      lastSeenAt: now,
      metadata: {
        ...(input.existing.metadata ?? {}),
        source: identity.source,
      },
    }
  }

  return {
    id: randomUUID(),
    actor,
    workspace: identity.workspace,
    currentRoleId: input.currentRoleId,
    scope: 'shell',
    status: 'active',
    startedAt: now,
    lastSeenAt: now,
    metadata: {
      source: identity.source,
    },
  }
}
