import type {
  ExecutionCaseSnapshot,
  ExecutionCheckpoint,
  ExecutionDecision,
  ExecutionProjection,
  ExecutionProjectionBlock,
  ExecutionRunStatus,
  ExecutionTimelineEvent,
  WorkenActorRef,
  WorkenAiActionClass,
  WorkenAiDelegationPolicy,
  WorkenAiReviewPolicy,
  WorkenAiTriggerRule,
  WorkenAiTriggerType,
  WorkenOsSession,
  WorkenOsWorldKind,
  WorkenOwnership,
} from '@/lib/worken-os-contract'

export const LEAD_CREATED_SIGNAL_TYPE = 'lead.created' as const

export type WorkenOsSignalType = string

export type LeadIntakeBranch = 'review_pending' | 'finance_pending' | 'follow_up' | 'nurture'

export type LeadIntakeReviewStage = 'sales' | 'finance' | null

export type ExecutionSignalEnvelope = {
  id: string
  type: WorkenOsSignalType
  source: 'demo' | 'integration' | 'manual'
  domainId: string
  viewId: string
  actor: WorkenActorRef
  session: WorkenOsSession
  payload: Record<string, unknown>
}

export type LeadIntakeCaseState = {
  leadId: string
  company: string
  contactName: string
  contactEmail: string
  budgetLabel: string
  budgetValue: number
  channel: string
  summary: string
  recommendation: string
  nextAction: string
  branch: LeadIntakeBranch
  reviewStage: LeadIntakeReviewStage
  requiresFinanceReview: boolean
}

export type StoredExecutionCase = ExecutionCaseSnapshot & {
  signalType: WorkenOsSignalType
  domainId: string
  viewId: string
  policy: WorkenAiDelegationPolicy
  state: LeadIntakeCaseState
  session: WorkenOsSession
  ownership: WorkenOwnership
}

export type StoredExecutionStore = {
  activeRunBySession: Record<string, Record<string, string>>
  cases: Record<string, StoredExecutionCase>
  policies: Record<string, WorkenAiDelegationPolicy>
  sessionPolicies: Record<string, Record<string, WorkenAiDelegationPolicy>>
}

export type ExecutionPolicyControlDefinition = {
  actionClass: WorkenAiActionClass
  label: string
  description: string
}

export type {
  ExecutionCaseSnapshot,
  ExecutionCheckpoint,
  ExecutionDecision,
  ExecutionProjection,
  ExecutionProjectionBlock,
  ExecutionRunStatus,
  ExecutionTimelineEvent,
  WorkenAiActionClass,
  WorkenAiDelegationPolicy,
  WorkenAiReviewPolicy,
  WorkenAiTriggerRule,
  WorkenAiTriggerType,
  WorkenActorRef,
  WorkenOsSession,
  WorkenOwnership,
  WorkenOsWorldKind,
}
