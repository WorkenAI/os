/** Local contracts previously imported from `@worken/core` (header names + session/execution types). */

export const WORKEN_USER_ID = 'Worken-User'
export const WORKEN_ORGANIZATION_ID = 'Worken-Organization'
export const WORKEN_PROJECT_ID = 'Worken-Project'

export type WorkenWorkspaceRef = {
  organizationId: string
  projectId: string
}

export type WorkenActorRef = {
  kind: 'human' | 'ai' | 'system'
  id: string
  roleId?: string
  label?: string
}

export type WorkenOsSession = {
  id: string
  actor: WorkenActorRef
  workspace: WorkenWorkspaceRef
  currentRoleId: string
  scope: string
  status: string
  startedAt: string
  lastSeenAt: string
  metadata?: Record<string, unknown>
}

export type WorkenOsWorldKind = 'postgres' | 'vercel' | 'local'

export type WorkenAiActionClass =
  | 'triage'
  | 'draft_response'
  | 'route_case'
  | 'escalate_finance'
  | (string & {})

export type WorkenAiTriggerType = 'manual' | 'integration_event' | (string & {})

export type WorkenAiTriggerRule =
  | {
      id: string
      type: 'manual'
      enabled: boolean
    }
  | {
      id: string
      type: 'integration_event'
      enabled: boolean
      eventType: string
    }

export type WorkenAiReviewPolicy = {
  defaultDecision: string
  requiredFor: WorkenAiActionClass[]
}

export type WorkenAiDelegationPolicy = {
  enabled: boolean
  allow: WorkenAiActionClass[]
  maxAutonomousSteps: number
  triggers: WorkenAiTriggerRule[]
  review: WorkenAiReviewPolicy
}

export type WorkenOwnershipHandoff = {
  from: WorkenActorRef
  to: WorkenActorRef
  at: string
  reason: string
}

export type WorkenOwnership = {
  currentOwner: WorkenActorRef
  assignee: WorkenActorRef
  reviewer?: WorkenActorRef
  sourceOfAuthority: 'human' | 'policy'
  claimedAt: string
  handoffHistory?: WorkenOwnershipHandoff[]
}

export type ExecutionRunStatus = 'waiting_review' | 'running' | 'completed' | (string & {})

export type ExecutionDecision = 'approve' | 'reject' | 'request_changes'

export type ExecutionCheckpointStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'changes_requested'

export type ExecutionCheckpoint = {
  id: string
  token: string
  title: string
  description: string
  status: ExecutionCheckpointStatus
  requestedAt: string
  requestedBy: string
  requestedById: string
  requestedReviewer?: string
  sessionId?: string
  decision?: ExecutionDecision
  resolvedAt?: string
}

export type ExecutionTimelineEventKind =
  | 'case_created'
  | 'ai_delegated'
  | 'ai_review_requested'
  | 'decision_recorded'
  | 'projection_updated'
  | 'case_completed'
  | (string & {})

export type ExecutionTimelineEvent = {
  id: string
  kind: ExecutionTimelineEventKind
  title: string
  description?: string
  actor: WorkenActorRef['kind']
  actorId: string
  roleId?: string
  sessionId?: string
  createdAt: string
}

export type ExecutionProjectionBlock =
  | { type: 'text'; text: string }
  | { type: 'spec'; spec: unknown }

export type ExecutionProjection = {
  title?: string
  summary: string
  blocks: ExecutionProjectionBlock[]
}

export type ExecutionCaseSnapshot = {
  id: string
  signalType: string
  domainId: string
  viewId: string
  status: ExecutionRunStatus
  createdAt: string
  updatedAt: string
  projection: ExecutionProjection
  checkpoints: ExecutionCheckpoint[]
  timeline: ExecutionTimelineEvent[]
  session: WorkenOsSession
  ownership: WorkenOwnership
  metadata?: Record<string, unknown>
}
