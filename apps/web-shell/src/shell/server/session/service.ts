import {
  WORKEN_ORGANIZATION_ID,
  WORKEN_PROJECT_ID,
  WORKEN_USER_ID,
  type WorkenOsSession,
  type WorkenWorkspaceRef,
} from '@/lib/worken-os-contract'
import { createLocalShellSession } from '@worken/shell-runtime'
import { getPolicySession, type PolicySession } from '@/shell/server/policy/service'
import { getStoredShellSession, upsertStoredShellSession } from '../persistence/session-repository'

type HeaderReader = {
  get(name: string): string | null | undefined
}

type ResolvedShellIdentity = {
  actorId: string
  workspace: WorkenWorkspaceRef
  source: 'request-headers' | 'local-demo'
}

export type ShellRuntimeSession = PolicySession & {
  shellSession: WorkenOsSession
}

export type ShellSessionPayload = {
  session: WorkenOsSession
  roles: PolicySession['roles']
  currentRoleId: string
}

const DEFAULT_LOCAL_ACTOR_ID = 'local-human'
const DEFAULT_LOCAL_ORGANIZATION_ID = 'local-org'
const DEFAULT_LOCAL_PROJECT_ID = 'local-project'

function trim(value: string | null | undefined) {
  return value?.trim() || null
}

function readShellIdentity(headers: HeaderReader | undefined): ResolvedShellIdentity {
  const actorId = trim(headers?.get(WORKEN_USER_ID))
  const organizationId = trim(headers?.get(WORKEN_ORGANIZATION_ID))
  const projectId = trim(headers?.get(WORKEN_PROJECT_ID))

  if (actorId && organizationId && projectId) {
    return {
      actorId,
      workspace: {
        organizationId,
        projectId,
      },
      source: 'request-headers',
    }
  }

  return {
    actorId: DEFAULT_LOCAL_ACTOR_ID,
    workspace: {
      organizationId: DEFAULT_LOCAL_ORGANIZATION_ID,
      projectId: DEFAULT_LOCAL_PROJECT_ID,
    },
    source: 'local-demo',
  }
}

export async function resolveShellSession(input: {
  requestedRoleId?: string | null
  sessionId?: string | null
  headers?: HeaderReader
}): Promise<ShellRuntimeSession> {
  const policySession = await getPolicySession(input.requestedRoleId)
  const identity = readShellIdentity(input.headers)
  const existing = input.sessionId ? await getStoredShellSession(input.sessionId) : null
  const shellSession = await upsertStoredShellSession(
    createLocalShellSession({
      identity: {
        actorId: identity.actorId,
        workspace: identity.workspace,
        source: identity.source,
      },
      currentRoleId: policySession.currentRoleId,
      existing,
    }),
  )

  return {
    ...policySession,
    shellSession,
  }
}

export function toShellSessionPayload(session: ShellRuntimeSession): ShellSessionPayload {
  return {
    session: session.shellSession,
    roles: session.roles,
    currentRoleId: session.currentRoleId,
  }
}
