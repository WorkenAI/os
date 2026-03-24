import type { ExecutionProjection, LeadIntakeCaseState, WorkenAiDelegationPolicy } from '../types'

function buildFinanceCard(state: LeadIntakeCaseState) {
  return {
    id: `${state.leadId}-finance`,
    title: state.company,
    subtitle: `${state.budgetLabel} · Discount exception`,
    badge: state.contactName,
  }
}

export function buildFinanceLeadProjection(
  state: LeadIntakeCaseState,
  policy: WorkenAiDelegationPolicy,
): ExecutionProjection {
  const financeCard = buildFinanceCard(state)

  const boardSpec = {
    root: 'container',
    elements: {
      container: {
        type: 'Stack',
        props: { direction: 'vertical', gap: 'md' },
        children: ['headline', 'summary', 'board'],
      },
      headline: {
        type: 'Heading',
        props: { level: '2', text: 'Finance approval queue' },
        children: [],
      },
      summary: {
        type: 'Text',
        props: {
          text: 'Finance sees only cases that have crossed the AI + sales routing threshold.',
          variant: 'muted',
        },
        children: [],
      },
      board: {
        type: 'Board',
        props: { title: 'Finance review' },
        children: ['lane-pending', 'lane-ready', 'lane-nurture'],
      },
      'lane-pending': {
        type: 'BoardLane',
        props: {
          title: 'Awaiting Finance',
          count: state.reviewStage === 'finance' ? 1 : 0,
          items: state.reviewStage === 'finance' ? [financeCard] : [],
        },
        children: [],
      },
      'lane-ready': {
        type: 'BoardLane',
        props: {
          title: 'Released to Sales',
          count: state.branch === 'follow_up' ? 1 : 0,
          items:
            state.branch === 'follow_up'
              ? [{ ...financeCard, badge: 'Approved discount path' }]
              : [],
        },
        children: [],
      },
      'lane-nurture': {
        type: 'BoardLane',
        props: {
          title: 'Nurture fallback',
          count: state.branch === 'nurture' ? 1 : 0,
          items:
            state.branch === 'nurture'
              ? [{ ...financeCard, badge: 'Finance requested changes' }]
              : [],
        },
        children: [],
      },
    },
  }

  const summary =
    state.reviewStage === 'finance'
      ? 'Finance approval is required before the personalized commercial follow-up can be sent.'
      : state.branch === 'follow_up'
        ? 'Finance approved the discount branch. Sales can proceed.'
        : 'No active finance review is required for this case.'

  return {
    title: 'Finance durable execution',
    summary,
    blocks: [
      {
        type: 'text',
        text: `Finance review policy: ${policy.review.requiredFor.includes('escalate_finance') ? 'enabled' : 'disabled'}.`,
      },
      {
        type: 'spec',
        spec: boardSpec,
      },
    ],
  }
}
