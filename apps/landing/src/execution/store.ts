import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { getWorkenDataDir } from '@/lib/worken-data-path'
import { getExecutionSignalDefinition, listExecutionSignals } from './kernel'
import { getRuntimeExecutionSignalDefinition } from './runtime-kernel'
import { toExecutionSnapshot } from './signals/lead-created'
import type {
  ExecutionDecision,
  ExecutionSignalEnvelope,
  StoredExecutionCase,
  StoredExecutionStore,
  WorkenAiDelegationPolicy,
  WorkenOsSession,
  WorkenOsSignalType,
} from './types'

function getStorePath() {
  return path.join(getWorkenDataDir(), 'execution-store.json')
}

type PersistedExecutionStore = Partial<StoredExecutionStore> & {
  activeRunBySignal?: Record<string, string>
}

function getDefaultStore(): StoredExecutionStore {
  return {
    activeRunBySession: {},
    cases: {},
    policies: Object.fromEntries(
      listExecutionSignals().map((signal) => [signal.signalType, signal.defaultPolicy]),
    ),
    sessionPolicies: {},
  }
}

async function ensureStoreDirectory() {
  await mkdir(path.dirname(getStorePath()), { recursive: true })
}

export async function readExecutionStore(): Promise<StoredExecutionStore> {
  try {
    const raw = await readFile(getStorePath(), 'utf8')
    const parsed = JSON.parse(raw) as PersistedExecutionStore

    return {
      ...getDefaultStore(),
      ...parsed,
      activeRunBySession: parsed.activeRunBySession ?? {},
      cases: parsed.cases ?? {},
      policies: {
        ...getDefaultStore().policies,
        ...(parsed.policies ?? {}),
      },
      sessionPolicies: parsed.sessionPolicies ?? {},
    }
  } catch {
    return getDefaultStore()
  }
}

export async function writeExecutionStore(store: StoredExecutionStore) {
  await ensureStoreDirectory()
  await writeFile(getStorePath(), JSON.stringify(store, null, 2), 'utf8')
}

function getSessionScopeId(session: WorkenOsSession) {
  return session.id
}

export async function getSignalPolicy(
  signalType: WorkenOsSignalType,
  session: WorkenOsSession,
): Promise<WorkenAiDelegationPolicy> {
  const store = await readExecutionStore()
  const sessionId = getSessionScopeId(session)
  return (
    store.sessionPolicies[sessionId]?.[signalType] ??
    store.policies[signalType] ??
    getExecutionSignalDefinition(signalType).defaultPolicy
  )
}

export async function updateSignalPolicy(
  signalType: WorkenOsSignalType,
  policy: WorkenAiDelegationPolicy,
  session: WorkenOsSession,
) {
  const store = await readExecutionStore()
  const sessionId = getSessionScopeId(session)
  store.sessionPolicies[sessionId] = {
    ...(store.sessionPolicies[sessionId] ?? {}),
    [signalType]: policy,
  }
  await writeExecutionStore(store)
  return policy
}

export async function setActiveSignalRun(
  signalType: WorkenOsSignalType,
  session: WorkenOsSession,
  runId: string,
) {
  const store = await readExecutionStore()
  const sessionId = getSessionScopeId(session)
  store.activeRunBySession[sessionId] = {
    ...(store.activeRunBySession[sessionId] ?? {}),
    [signalType]: runId,
  }
  await writeExecutionStore(store)
}

export async function getActiveSignalRunId(
  signalType: WorkenOsSignalType,
  session: WorkenOsSession,
) {
  const store = await readExecutionStore()
  return store.activeRunBySession[getSessionScopeId(session)]?.[signalType] ?? null
}

export async function getStoredCase(
  runId: string,
  session?: WorkenOsSession,
): Promise<StoredExecutionCase | null> {
  const store = await readExecutionStore()
  const caseRecord = store.cases[runId] ?? null
  if (!caseRecord) return null
  if (session && caseRecord.session.id !== session.id) return null
  return caseRecord
}

export async function getProjectedCase(
  runId: string,
  domainId: string,
  session?: WorkenOsSession,
): Promise<StoredExecutionCase | null> {
  const stored = await getStoredCase(runId, session)
  if (!stored) return null
  return getRuntimeExecutionSignalDefinition(stored.signalType).driver.projectCase(stored, domainId)
}

export async function saveInitialExecutionCase(input: {
  runId: string
  signalType: WorkenOsSignalType
  policy: WorkenAiDelegationPolicy
  signal: ExecutionSignalEnvelope
}) {
  const store = await readExecutionStore()
  const created = getRuntimeExecutionSignalDefinition(input.signalType).driver.createCase(input)
  store.cases[input.runId] = created
  const sessionId = getSessionScopeId(input.signal.session)
  store.activeRunBySession[sessionId] = {
    ...(store.activeRunBySession[sessionId] ?? {}),
    [input.signalType]: input.runId,
  }
  await writeExecutionStore(store)
  return created
}

export async function markExecutionCheckpoint(params: {
  runId: string
  stage: 'sales' | 'finance'
  token: string
  title: string
  description: string
  session: WorkenOsSession
}) {
  const store = await readExecutionStore()
  const existing = store.cases[params.runId]
  if (!existing || existing.session.id !== params.session.id) return null

  const updated = getRuntimeExecutionSignalDefinition(
    existing.signalType,
  ).driver.markCheckpointPending(existing, {
    id: `${params.stage}-review`,
    token: params.token,
    title: params.title,
    description: params.description,
    stage: params.stage,
  })

  store.cases[params.runId] = updated
  await writeExecutionStore(store)
  return updated
}

export async function advanceExecutionDecision(params: {
  runId: string
  stage: 'sales' | 'finance'
  decision: ExecutionDecision
  comment?: string
  session: WorkenOsSession
}) {
  const store = await readExecutionStore()
  const existing = store.cases[params.runId]
  if (!existing || existing.session.id !== params.session.id) return null

  const updated = getRuntimeExecutionSignalDefinition(existing.signalType).driver.applyDecision(
    existing,
    params.stage,
    params.decision,
    params.comment,
  )
  store.cases[params.runId] = updated
  await writeExecutionStore(store)
  return updated
}

export async function finalizeExecutionCase(runId: string, session: WorkenOsSession) {
  const store = await readExecutionStore()
  const existing = store.cases[runId]
  if (!existing || existing.session.id !== session.id) return null

  const updated = getRuntimeExecutionSignalDefinition(existing.signalType).driver.finalizeCase(
    existing,
  )
  store.cases[runId] = updated
  await writeExecutionStore(store)
  return updated
}

export async function findCaseByCheckpointToken(token: string, session: WorkenOsSession) {
  const store = await readExecutionStore()
  return (
    Object.values(store.cases).find(
      (caseRecord) =>
        caseRecord.session.id === session.id &&
        caseRecord.checkpoints.some((checkpoint) => checkpoint.token === token),
    ) ?? null
  )
}

export function toExecutionResponse(caseRecord: StoredExecutionCase | null) {
  return caseRecord ? toExecutionSnapshot(caseRecord) : null
}
