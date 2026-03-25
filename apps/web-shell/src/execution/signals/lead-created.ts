import { buildFinanceLeadProjection } from '../projectors/finance-case'
import { buildSalesLeadProjection } from '../projectors/sales-case'
import {
  type ExecutionCaseSnapshot,
  type ExecutionCheckpoint,
  type ExecutionDecision,
  type ExecutionProjection,
  type ExecutionSignalEnvelope,
  type ExecutionTimelineEvent,
  LEAD_CREATED_SIGNAL_TYPE,
  type LeadIntakeCaseState,
  type StoredExecutionCase,
  type WorkenActorRef,
  type WorkenAiDelegationPolicy,
  type WorkenOwnership,
} from '../types'

const NOW = () => new Date().toISOString()
const AI_ACTOR: WorkenActorRef = { kind: 'ai', id: 'worken-os-ai' }
const SYSTEM_ACTOR: WorkenActorRef = { kind: 'system', id: 'worken-os-system' }

function getReviewerActor(stage: 'sales' | 'finance'): WorkenActorRef {
  return {
    kind: 'human',
    id: `${stage}-reviewer`,
    roleId: stage === 'finance' ? 'accountant' : 'sales-rep',
    label: stage === 'finance' ? 'Finance reviewer' : 'Sales reviewer',
  }
}

function appendHandoff(
  ownership: WorkenOwnership | undefined,
  from: WorkenActorRef,
  to: WorkenActorRef,
  reason: string,
): WorkenOwnership['handoffHistory'] {
  return [
    ...(ownership?.handoffHistory ?? []),
    {
      from,
      to,
      at: NOW(),
      reason,
    },
  ]
}

export const DEFAULT_LEAD_CREATED_POLICY: WorkenAiDelegationPolicy = {
  enabled: true,
  allow: ['triage', 'draft_response', 'route_case', 'escalate_finance'],
  maxAutonomousSteps: 2,
  triggers: [
    { id: 'manual', type: 'manual', enabled: true },
    {
      id: 'integration-event',
      type: 'integration_event',
      enabled: true,
      eventType: LEAD_CREATED_SIGNAL_TYPE,
    },
  ],
  review: {
    defaultDecision: 'review',
    requiredFor: ['draft_response', 'escalate_finance'],
  },
}

function createTimelineEvent(
  id: string,
  kind: ExecutionTimelineEvent['kind'],
  title: string,
  actor: WorkenActorRef,
  sessionId?: string,
  description?: string,
): ExecutionTimelineEvent {
  return {
    id,
    kind,
    title,
    description,
    actor: actor.kind,
    actorId: actor.id,
    roleId: actor.roleId,
    sessionId,
    createdAt: NOW(),
  }
}

export function requiresDraftReview(policy: WorkenAiDelegationPolicy) {
  return policy.enabled && policy.review.requiredFor.includes('draft_response')
}

export function requiresFinanceEscalationReview(
  policy: WorkenAiDelegationPolicy,
  state: LeadIntakeCaseState,
) {
  return state.requiresFinanceReview && policy.review.requiredFor.includes('escalate_finance')
}

export function projectLeadCreatedCase(
  _domainId: string,
  state: LeadIntakeCaseState,
  policy: WorkenAiDelegationPolicy,
): ExecutionProjection {
  if (state.reviewStage === 'finance') {
    return buildFinanceLeadProjection(state, policy)
  }

  return buildSalesLeadProjection(state, policy)
}

export function createLeadCreatedCase(input: {
  runId: string
  policy: WorkenAiDelegationPolicy
  signal: ExecutionSignalEnvelope
}): StoredExecutionCase {
  const payload = input.signal.payload as Partial<{
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
    requiresFinanceReview: boolean
  }>

  const state: LeadIntakeCaseState = {
    leadId: payload.leadId ?? `lead-${input.runId.slice(-6)}`,
    company: payload.company ?? 'Unnamed lead',
    contactName: payload.contactName ?? 'Unknown contact',
    contactEmail: payload.contactEmail ?? 'unknown@example.com',
    budgetLabel: payload.budgetLabel ?? '—',
    budgetValue: payload.budgetValue ?? 0,
    channel: payload.channel ?? input.signal.source,
    summary: payload.summary ?? 'External signal created a new execution case.',
    recommendation:
      payload.recommendation ?? 'AI prepared a follow-up recommendation for the incoming signal.',
    nextAction: payload.nextAction ?? 'Inspect the signal and decide the next routing step.',
    branch: requiresDraftReview(input.policy) ? 'review_pending' : 'finance_pending',
    reviewStage: requiresDraftReview(input.policy) ? 'sales' : null,
    requiresFinanceReview: payload.requiresFinanceReview ?? true,
  }
  const createdAt = NOW()

  return {
    id: input.runId,
    signalType: LEAD_CREATED_SIGNAL_TYPE,
    domainId: input.signal.domainId,
    viewId: input.signal.viewId,
    status: requiresDraftReview(input.policy) ? 'waiting_review' : 'running',
    createdAt,
    updatedAt: createdAt,
    policy: input.policy,
    state,
    session: input.signal.session,
    ownership: {
      currentOwner: input.signal.actor,
      assignee: input.signal.actor,
      sourceOfAuthority: 'human',
      claimedAt: createdAt,
    },
    projection: projectLeadCreatedCase(input.signal.domainId, state, input.policy),
    checkpoints: [],
    timeline: [
      createTimelineEvent(
        `case-${input.runId}`,
        'case_created',
        'Lead intake case created',
        SYSTEM_ACTOR,
        input.signal.session.id,
        state.summary,
      ),
      createTimelineEvent(
        `triage-${input.runId}`,
        'ai_delegated',
        'AI triaged the inbound lead',
        AI_ACTOR,
        input.signal.session.id,
        state.recommendation,
      ),
    ],
    metadata: {
      activeDomainId: input.signal.domainId,
      activeViewId: input.signal.viewId,
      sessionId: input.signal.session.id,
      workspace: input.signal.session.workspace,
    },
  }
}

export function withLeadProjection(
  record: StoredExecutionCase,
  domainId = record.domainId,
): StoredExecutionCase {
  return {
    ...record,
    projection: projectLeadCreatedCase(domainId, record.state, record.policy),
    updatedAt: NOW(),
  }
}

export function markLeadCheckpointPending(
  record: StoredExecutionCase,
  params: {
    id: string
    token: string
    title: string
    description: string
    stage: 'sales' | 'finance'
  },
) {
  const reviewer = getReviewerActor(params.stage)
  return withLeadProjection({
    ...record,
    status: 'waiting_review',
    ownership: {
      currentOwner: reviewer,
      assignee: reviewer,
      reviewer,
      sourceOfAuthority: 'policy',
      claimedAt: NOW(),
      handoffHistory: appendHandoff(
        record.ownership,
        record.ownership.currentOwner,
        reviewer,
        `${params.stage} review requested`,
      ),
    },
    state: {
      ...record.state,
      branch: params.stage === 'sales' ? 'review_pending' : 'finance_pending',
      reviewStage: params.stage,
    },
    checkpoints: [
      ...record.checkpoints.filter((checkpoint) => checkpoint.id !== params.id),
      {
        id: params.id,
        token: params.token,
        title: params.title,
        description: params.description,
        status: 'pending',
        requestedAt: NOW(),
        requestedBy: AI_ACTOR.kind,
        requestedById: AI_ACTOR.id,
        requestedReviewer: params.stage,
        sessionId: record.session.id,
      },
    ],
    timeline: [
      ...record.timeline,
      createTimelineEvent(
        `${params.stage}-review-${record.id}`,
        'ai_review_requested',
        params.title,
        AI_ACTOR,
        record.session.id,
        params.description,
      ),
    ],
  })
}

export function applyLeadDecision(
  record: StoredExecutionCase,
  stage: 'sales' | 'finance',
  decision: ExecutionDecision,
  comment?: string,
) {
  const checkpoint = record.checkpoints.find((item) => item.id === `${stage}-review`)
  const nextTimeline = [
    ...record.timeline,
    createTimelineEvent(
      `${stage}-${decision}-${record.id}`,
      'decision_recorded',
      `${stage === 'sales' ? 'Sales' : 'Finance'} review: ${decision}`,
      record.session.actor,
      record.session.id,
      comment,
    ),
  ]

  const nextCheckpointStatus: ExecutionCheckpoint['status'] =
    decision === 'approve' ? 'approved' : decision === 'reject' ? 'rejected' : 'changes_requested'

  const nextCheckpoints: ExecutionCheckpoint[] = record.checkpoints.map((item) =>
    item.id === checkpoint?.id
      ? {
          ...item,
          status: nextCheckpointStatus,
          decision,
          resolvedAt: NOW(),
        }
      : item,
  )

  if (decision !== 'approve') {
    return withLeadProjection({
      ...record,
      status: 'completed',
      ownership: {
        currentOwner: record.session.actor,
        assignee: record.session.actor,
        sourceOfAuthority: 'human',
        claimedAt: NOW(),
        handoffHistory: appendHandoff(
          record.ownership,
          record.ownership.currentOwner,
          record.session.actor,
          `${stage} review ended with ${decision}`,
        ),
      },
      state: {
        ...record.state,
        branch: 'nurture',
        reviewStage: null,
        nextAction: 'Lead moved to nurture until budget is clarified.',
      },
      checkpoints: nextCheckpoints,
      timeline: [
        ...nextTimeline,
        createTimelineEvent(
          `nurture-${record.id}`,
          'case_completed',
          'Lead moved to nurture branch',
          SYSTEM_ACTOR,
          record.session.id,
        ),
      ],
    })
  }

  if (stage === 'sales') {
    const nextOwner = record.state.requiresFinanceReview
      ? getReviewerActor('finance')
      : record.session.actor
    return withLeadProjection({
      ...record,
      status: 'running',
      ownership: {
        currentOwner: nextOwner,
        assignee: nextOwner,
        reviewer: record.state.requiresFinanceReview ? nextOwner : undefined,
        sourceOfAuthority: record.state.requiresFinanceReview ? 'policy' : 'human',
        claimedAt: NOW(),
        handoffHistory: appendHandoff(
          record.ownership,
          record.ownership.currentOwner,
          nextOwner,
          record.state.requiresFinanceReview
            ? 'Finance review required after sales approval'
            : 'Sales owns follow-up after approval',
        ),
      },
      state: {
        ...record.state,
        branch: record.state.requiresFinanceReview ? 'finance_pending' : 'follow_up',
        reviewStage: null,
        nextAction: record.state.requiresFinanceReview
          ? 'Route custom discount to Finance review.'
          : 'Send a personalized follow-up with a pilot offer.',
      },
      checkpoints: nextCheckpoints,
      timeline: [
        ...nextTimeline,
        createTimelineEvent(
          `route-${record.id}`,
          'projection_updated',
          record.state.requiresFinanceReview
            ? 'Lead routed to Finance review'
            : 'Lead routed to follow-up',
          SYSTEM_ACTOR,
          record.session.id,
        ),
      ],
    })
  }

  return withLeadProjection({
    ...record,
    status: 'completed',
    ownership: {
      currentOwner: record.session.actor,
      assignee: record.session.actor,
      sourceOfAuthority: 'human',
      claimedAt: NOW(),
      handoffHistory: appendHandoff(
        record.ownership,
        record.ownership.currentOwner,
        record.session.actor,
        'Finance returned follow-up ownership to the session actor',
      ),
    },
    state: {
      ...record.state,
      branch: 'follow_up',
      reviewStage: null,
      nextAction: 'Finance approved the discount. Sales can send the personalized follow-up.',
    },
    checkpoints: nextCheckpoints,
    timeline: [
      ...nextTimeline,
      createTimelineEvent(
        `follow-up-${record.id}`,
        'case_completed',
        'Lead is ready for personalized follow-up',
        SYSTEM_ACTOR,
        record.session.id,
      ),
    ],
  })
}

export function toExecutionSnapshot(caseRecord: StoredExecutionCase): ExecutionCaseSnapshot {
  return {
    id: caseRecord.id,
    signalType: caseRecord.signalType,
    domainId: caseRecord.domainId,
    viewId: caseRecord.viewId,
    status: caseRecord.status,
    createdAt: caseRecord.createdAt,
    updatedAt: caseRecord.updatedAt,
    projection: caseRecord.projection,
    checkpoints: caseRecord.checkpoints,
    timeline: caseRecord.timeline,
    session: caseRecord.session,
    ownership: caseRecord.ownership,
    metadata: caseRecord.metadata,
  }
}
