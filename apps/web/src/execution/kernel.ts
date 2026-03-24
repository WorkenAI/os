import { DEFAULT_LEAD_CREATED_POLICY } from './signals/lead-created'
import leadCreatedBootstrapPayload from './signals/lead-created.demo.json'
import type {
  ExecutionPolicyControlDefinition,
  WorkenAiDelegationPolicy,
  WorkenOsSignalType,
} from './types'
import { LEAD_CREATED_SIGNAL_TYPE } from './types'

export type ExecutionSignalDefinition = {
  signalType: WorkenOsSignalType
  title: string
  autoStart: boolean
  defaultDomainId: string
  defaultViewId: string
  defaultPolicy: WorkenAiDelegationPolicy
  policyControls: ExecutionPolicyControlDefinition[]
  bootstrapPayload: Record<string, unknown>
}

const executionSignals: Record<WorkenOsSignalType, ExecutionSignalDefinition> = {
  [LEAD_CREATED_SIGNAL_TYPE]: {
    signalType: LEAD_CREATED_SIGNAL_TYPE,
    title: 'Sales lead intake',
    autoStart: true,
    defaultDomainId: 'sales',
    defaultViewId: 'pipeline-board',
    defaultPolicy: DEFAULT_LEAD_CREATED_POLICY,
    policyControls: [
      {
        actionClass: 'draft_response',
        label: 'Require review for outbound drafts',
        description: 'Pause before AI sends a customer-facing draft response.',
      },
      {
        actionClass: 'escalate_finance',
        label: 'Require review for escalation actions',
        description: 'Pause before the workflow escalates pricing or discount decisions.',
      },
    ],
    bootstrapPayload: leadCreatedBootstrapPayload,
  },
}

export function getExecutionSignalDefinition(signalType: WorkenOsSignalType) {
  return executionSignals[signalType]
}

export function listExecutionSignals() {
  return Object.values(executionSignals)
}

export function getDefaultExecutionSignalDefinition() {
  return listExecutionSignals()[0] ?? null
}

export function isExecutionSignalType(value: string): value is WorkenOsSignalType {
  return value in executionSignals
}
