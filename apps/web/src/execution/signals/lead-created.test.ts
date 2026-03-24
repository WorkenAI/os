import { describe, expect, it } from 'bun:test'
import { LEAD_CREATED_SIGNAL_TYPE } from '../types'
import {
  applyLeadDecision,
  createLeadCreatedCase,
  DEFAULT_LEAD_CREATED_POLICY,
  markLeadCheckpointPending,
  requiresDraftReview,
  requiresFinanceEscalationReview,
} from './lead-created'

function buildSignal(id: string) {
  return {
    id: `signal-${id}`,
    type: LEAD_CREATED_SIGNAL_TYPE,
    source: 'demo' as const,
    domainId: 'sales',
    viewId: 'pipeline-board',
    actor: {
      kind: 'human' as const,
      id: `user-${id}`,
      roleId: 'sales-rep',
    },
    session: {
      id: `session-${id}`,
      actor: {
        kind: 'human' as const,
        id: `user-${id}`,
        roleId: 'sales-rep',
      },
      workspace: {
        organizationId: 'org-test',
        projectId: 'project-test',
      },
      currentRoleId: 'sales-rep',
      scope: 'shell' as const,
      status: 'active' as const,
      startedAt: '2026-03-17T00:00:00.000Z',
      lastSeenAt: '2026-03-17T00:00:00.000Z',
    },
    payload: {
      leadId: id,
      company: 'Alpha Platform Inc',
      contactName: 'Irina Smirnova',
      contactEmail: 'irina@alpha.example',
      budgetLabel: '$1.8M',
      budgetValue: 1_800_000,
      channel: 'Website demo request',
      summary: 'Large inbound lead requesting an enterprise pilot and custom commercial terms.',
      recommendation:
        'AI suggests qualifying the lead, preparing a follow-up, and routing a custom discount to Finance review.',
      nextAction: 'Prepare a personalized follow-up and send the discount to Finance review.',
      requiresFinanceReview: true,
    },
  }
}

describe('lead-created durable signal flow', () => {
  it('starts in sales review when review policy requires draft approval', () => {
    const created = createLeadCreatedCase({
      runId: 'run-1',
      policy: DEFAULT_LEAD_CREATED_POLICY,
      signal: buildSignal('lead-1'),
    })

    expect(requiresDraftReview(DEFAULT_LEAD_CREATED_POLICY)).toBe(true)
    expect(created.status).toBe('waiting_review')
    expect(created.state.reviewStage).toBe('sales')
    expect(created.session.id).toBe('session-lead-1')
    expect(created.ownership.currentOwner.id).toBe('user-lead-1')
  })

  it('routes approved enterprise leads into finance review', () => {
    const created = createLeadCreatedCase({
      runId: 'run-2',
      policy: DEFAULT_LEAD_CREATED_POLICY,
      signal: buildSignal('lead-2'),
    })

    const withCheckpoint = markLeadCheckpointPending(created, {
      id: 'sales-review',
      token: 'sales-token',
      title: 'Sales review',
      description: 'Review outbound plan',
      stage: 'sales',
    })
    const approved = applyLeadDecision(withCheckpoint, 'sales', 'approve')

    expect(approved.state.branch).toBe('finance_pending')
    expect(requiresFinanceEscalationReview(DEFAULT_LEAD_CREATED_POLICY, approved.state)).toBe(true)
    expect(approved.ownership.currentOwner.id).toBe('finance-reviewer')
  })

  it('completes in follow-up after finance approval', () => {
    const created = createLeadCreatedCase({
      runId: 'run-3',
      policy: DEFAULT_LEAD_CREATED_POLICY,
      signal: buildSignal('lead-3'),
    })

    const withSalesReview = markLeadCheckpointPending(created, {
      id: 'sales-review',
      token: 'sales-token',
      title: 'Sales review',
      description: 'Review outbound plan',
      stage: 'sales',
    })
    const routed = applyLeadDecision(withSalesReview, 'sales', 'approve')
    const withFinanceReview = markLeadCheckpointPending(routed, {
      id: 'finance-review',
      token: 'finance-token',
      title: 'Finance review',
      description: 'Approve discount',
      stage: 'finance',
    })
    const approved = applyLeadDecision(withFinanceReview, 'finance', 'approve')

    expect(approved.status).toBe('completed')
    expect(approved.state.branch).toBe('follow_up')
    expect(approved.state.reviewStage).toBeNull()
    expect(approved.ownership.currentOwner.id).toBe('user-lead-3')
  })
})
