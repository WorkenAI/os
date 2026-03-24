import { leadReviewHook } from './hooks/review'
import { getRuntimeExecutionSignalDefinition } from './runtime-kernel'
import { buildBootstrapSignal } from './signals'
import {
  findCaseByCheckpointToken,
  getActiveSignalRunId,
  getProjectedCase,
  getSignalPolicy,
  getStoredCase,
  setActiveSignalRun,
  toExecutionResponse,
  updateSignalPolicy,
} from './store'
import type {
  ExecutionDecision,
  ExecutionSignalEnvelope,
  StoredExecutionCase,
  WorkenAiDelegationPolicy,
  WorkenOsSession,
  WorkenOsSignalType,
} from './types'
import { createWorkenOsWorld } from './world'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function getPendingCheckpointForDomain(caseRecord: StoredExecutionCase, domainId: string) {
  if (caseRecord.checkpoints.some((checkpoint) => checkpoint.requestedReviewer === domainId)) {
    const preferred = caseRecord.checkpoints.find(
      (checkpoint) => checkpoint.status === 'pending' && checkpoint.requestedReviewer === domainId,
    )
    if (preferred) return preferred
  }

  return caseRecord.checkpoints.find((checkpoint) => checkpoint.status === 'pending') ?? null
}

async function waitForProjectedCaseBySession(
  runId: string,
  domainId: string,
  session: WorkenOsSession,
  limit = 30,
) {
  for (let attempt = 0; attempt < limit; attempt += 1) {
    const projected = await getProjectedCase(runId, domainId, session)
    if (projected) return projected
    await wait(100)
  }

  return null
}

async function waitForSettledCaseBySession(
  runId: string,
  domainId: string,
  session: WorkenOsSession,
  limit = 40,
) {
  for (let attempt = 0; attempt < limit; attempt += 1) {
    const projected = await getProjectedCase(runId, domainId, session)
    if (projected && projected.status !== 'running') {
      return projected
    }
    await wait(150)
  }

  return getProjectedCase(runId, domainId, session)
}

async function waitForCheckpointResolution(
  token: string,
  domainId: string,
  session: WorkenOsSession,
  limit = 40,
) {
  for (let attempt = 0; attempt < limit; attempt += 1) {
    const caseRecord = await findCaseByCheckpointToken(token, session)
    if (!caseRecord) return null

    const checkpoint = caseRecord.checkpoints.find((item) => item.token === token)
    const nextPendingForDomain = caseRecord.checkpoints.find(
      (item) => item.status === 'pending' && item.requestedReviewer === domainId,
    )

    if (checkpoint && checkpoint.status !== 'pending' && !nextPendingForDomain) {
      return getProjectedCase(caseRecord.id, domainId, session)
    }

    await wait(150)
  }

  const caseRecord = await findCaseByCheckpointToken(token, session)
  return caseRecord ? getProjectedCase(caseRecord.id, domainId, session) : null
}

export async function ensureExecutionRun(input: {
  signalType: WorkenOsSignalType
  domainId: string
  viewId: string
  autoStart: boolean
  session: WorkenOsSession
  forceRestart?: boolean
}) {
  const activeRunId = input.forceRestart
    ? null
    : await getActiveSignalRunId(input.signalType, input.session)

  if (activeRunId) {
    const existing = await getProjectedCase(activeRunId, input.domainId, input.session)
    if (existing) {
      return existing
    }
  }

  if (!input.autoStart && !input.forceRestart) {
    return activeRunId ? getProjectedCase(activeRunId, input.domainId, input.session) : null
  }

  const bootstrapSignal = buildBootstrapSignal({
    signalType: input.signalType,
    domainId: input.domainId,
    viewId: input.viewId,
    actor: input.session.actor,
    session: input.session,
  })

  if (!bootstrapSignal) return null

  return emitExecutionSignal({
    signal: bootstrapSignal,
    forceRestart: input.forceRestart,
  })
}

export async function emitExecutionSignal(input: {
  signal: ExecutionSignalEnvelope
  forceRestart?: boolean
}) {
  const activeRunId = input.forceRestart
    ? null
    : await getActiveSignalRunId(input.signal.type, input.signal.session)
  if (activeRunId) {
    const existing = await getProjectedCase(
      activeRunId,
      input.signal.domainId,
      input.signal.session,
    )
    if (existing) return existing
  }

  const signalDefinition = getRuntimeExecutionSignalDefinition(input.signal.type)
  const world = createWorkenOsWorld()
  const policy = await getSignalPolicy(input.signal.type, input.signal.session)

  await world.ensureReady()
  const run = await world.startRun(signalDefinition.workflow, [
    {
      signalType: input.signal.type,
      domainId: input.signal.domainId,
      viewId: input.signal.viewId,
      policy,
      signal: input.signal,
    },
  ])

  await setActiveSignalRun(input.signal.type, input.signal.session, run.runId)

  if (!policy.review.requiredFor.includes('draft_response')) {
    return waitForSettledCaseBySession(run.runId, input.signal.domainId, input.signal.session)
  }

  return waitForProjectedCaseBySession(run.runId, input.signal.domainId, input.signal.session)
}

export async function getExecutionCaseForView(input: {
  signalType: WorkenOsSignalType
  domainId: string
  session: WorkenOsSession
}) {
  const activeRunId = await getActiveSignalRunId(input.signalType, input.session)
  if (!activeRunId) return null
  return getProjectedCase(activeRunId, input.domainId, input.session)
}

export async function applyExecutionVerb(input: {
  signalType: WorkenOsSignalType
  domainId: string
  viewId: string
  verb: string
  session: WorkenOsSession
}) {
  if (input.verb === 'create') {
    return ensureExecutionRun({
      signalType: input.signalType,
      domainId: input.domainId,
      viewId: input.viewId,
      autoStart: true,
      session: input.session,
      forceRestart: true,
    })
  }

  const activeRunId = await getActiveSignalRunId(input.signalType, input.session)
  if (!activeRunId) return null

  const current = await getStoredCase(activeRunId, input.session)
  if (!current) return null

  const checkpoint = getPendingCheckpointForDomain(current, input.domainId)
  if (!checkpoint) {
    return getProjectedCase(activeRunId, input.domainId, input.session)
  }

  const decisionByVerb: Partial<Record<string, ExecutionDecision>> = {
    approve: 'approve',
    edit: 'request_changes',
    reject: 'reject',
  }
  const decision = decisionByVerb[input.verb]
  if (!decision) {
    return getProjectedCase(activeRunId, input.domainId, input.session)
  }

  await leadReviewHook.resume(checkpoint.token, {
    decision,
    comment:
      decision === 'approve'
        ? 'Approved from Worken OS shell'
        : decision === 'request_changes'
          ? 'Requested changes from Worken OS shell'
          : 'Rejected from Worken OS shell',
  })

  return waitForCheckpointResolution(checkpoint.token, input.domainId, input.session)
}

export async function resolveCheckpointDecision(input: {
  token: string
  decision: ExecutionDecision
  comment?: string
  domainId: string
  session: WorkenOsSession
}) {
  await leadReviewHook.resume(input.token, {
    decision: input.decision,
    comment: input.comment,
  })

  return waitForCheckpointResolution(input.token, input.domainId, input.session)
}

export async function readSignalPolicyState(
  signalType: WorkenOsSignalType,
  session: WorkenOsSession,
) {
  return getSignalPolicy(signalType, session)
}

export async function writeSignalPolicyState(
  signalType: WorkenOsSignalType,
  policy: WorkenAiDelegationPolicy,
  session: WorkenOsSession,
) {
  return updateSignalPolicy(signalType, policy, session)
}

export async function readExecutionResponse(
  runId: string,
  domainId: string,
  session: WorkenOsSession,
) {
  const projected = await getProjectedCase(runId, domainId, session)
  return toExecutionResponse(projected)
}
