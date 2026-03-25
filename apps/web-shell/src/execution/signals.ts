import { getDefaultExecutionSignalDefinition, getExecutionSignalDefinition } from './kernel'
import type { ExecutionSignalEnvelope, WorkenOsSignalType } from './types'

function createSignalId() {
  return `signal-${crypto.randomUUID()}`
}

export function getDefaultSignalType() {
  return getDefaultExecutionSignalDefinition()?.signalType ?? null
}

export function buildBootstrapSignal(input: {
  signalType?: WorkenOsSignalType
  domainId?: string
  viewId?: string
  actor: ExecutionSignalEnvelope['actor']
  session: ExecutionSignalEnvelope['session']
  payload?: Record<string, unknown>
  source?: ExecutionSignalEnvelope['source']
}) {
  const catalogEntry = input.signalType
    ? getExecutionSignalDefinition(input.signalType)
    : getDefaultExecutionSignalDefinition()

  if (!catalogEntry) return null

  return {
    id: createSignalId(),
    type: catalogEntry.signalType,
    source: input.source ?? 'demo',
    domainId: input.domainId ?? catalogEntry.defaultDomainId,
    viewId: input.viewId ?? catalogEntry.defaultViewId,
    actor: input.actor,
    session: input.session,
    payload: input.payload ?? structuredClone(catalogEntry.bootstrapPayload),
  } satisfies ExecutionSignalEnvelope
}
