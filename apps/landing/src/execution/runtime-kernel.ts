import { getExecutionSignalDefinition } from './kernel'
import {
  applyLeadDecision,
  createLeadCreatedCase,
  markLeadCheckpointPending,
  projectLeadCreatedCase,
  withLeadProjection,
} from './signals/lead-created'
import type {
  ExecutionSignalEnvelope,
  StoredExecutionCase,
  WorkenAiDelegationPolicy,
  WorkenOsSignalType,
} from './types'
import { runDomainCaseWorkflow } from './workflows/run-domain-case'

type SignalCheckpointInput = {
  id: string
  token: string
  title: string
  description: string
  stage: 'sales' | 'finance'
}

type ExecutionSignalDriver = {
  createCase: (input: {
    runId: string
    policy: WorkenAiDelegationPolicy
    signal: ExecutionSignalEnvelope
  }) => StoredExecutionCase
  projectCase: (caseRecord: StoredExecutionCase, domainId: string) => StoredExecutionCase
  markCheckpointPending: (
    caseRecord: StoredExecutionCase,
    params: SignalCheckpointInput,
  ) => StoredExecutionCase
  applyDecision: (
    caseRecord: StoredExecutionCase,
    stage: 'sales' | 'finance',
    decision: 'approve' | 'reject' | 'request_changes',
    comment?: string,
  ) => StoredExecutionCase
  finalizeCase: (caseRecord: StoredExecutionCase) => StoredExecutionCase
}

type RuntimeExecutionSignalDefinition = ReturnType<typeof getExecutionSignalDefinition> & {
  workflow: typeof runDomainCaseWorkflow
  driver: ExecutionSignalDriver
}

export function getRuntimeExecutionSignalDefinition(
  signalType: WorkenOsSignalType,
): RuntimeExecutionSignalDefinition {
  const signal = getExecutionSignalDefinition(signalType)

  return {
    ...signal,
    workflow: runDomainCaseWorkflow,
    driver: {
      createCase: createLeadCreatedCase,
      projectCase: (caseRecord, domainId) => ({
        ...caseRecord,
        projection: projectLeadCreatedCase(domainId, caseRecord.state, caseRecord.policy),
      }),
      markCheckpointPending: markLeadCheckpointPending,
      applyDecision: applyLeadDecision,
      finalizeCase: (caseRecord) =>
        withLeadProjection({
          ...caseRecord,
          status: caseRecord.state.branch === 'finance_pending' ? 'waiting_review' : 'completed',
        }),
    },
  }
}
