import type { ExecutionProjection, LeadIntakeCaseState, WorkenAiDelegationPolicy } from '../types'

function buildLeadCard(state: LeadIntakeCaseState) {
  return {
    id: state.leadId,
    title: state.company,
    subtitle: `${state.contactName} · ${state.budgetLabel}`,
    badge: state.channel,
  }
}

export function buildSalesLeadProjection(
  state: LeadIntakeCaseState,
  policy: WorkenAiDelegationPolicy,
): ExecutionProjection {
  const leadCard = buildLeadCard(state)

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
        props: { level: '2', text: 'Durable lead intake' },
        children: [],
      },
      summary: {
        type: 'Text',
        props: {
          text: `${state.recommendation} Next step: ${state.nextAction}`,
          variant: 'muted',
        },
        children: [],
      },
      board: {
        type: 'Board',
        props: { title: 'Lead orchestration board' },
        children: ['lane-new', 'lane-review', 'lane-finance', 'lane-follow-up', 'lane-nurture'],
      },
      'lane-new': {
        type: 'BoardLane',
        props: {
          title: 'New lead',
          count: 1,
          items: state.branch === 'review_pending' ? [leadCard] : [],
        },
        children: [],
      },
      'lane-review': {
        type: 'BoardLane',
        props: {
          title: 'Sales review',
          count: state.reviewStage === 'sales' ? 1 : 0,
          items: state.reviewStage === 'sales' ? [leadCard] : [],
        },
        children: [],
      },
      'lane-finance': {
        type: 'BoardLane',
        props: {
          title: 'Finance review',
          count: state.branch === 'finance_pending' ? 1 : 0,
          items: state.branch === 'finance_pending' ? [leadCard] : [],
        },
        children: [],
      },
      'lane-follow-up': {
        type: 'BoardLane',
        props: {
          title: 'Follow-up',
          count: state.branch === 'follow_up' ? 1 : 0,
          items:
            state.branch === 'follow_up' ? [{ ...leadCard, badge: 'AI + human approved' }] : [],
        },
        children: [],
      },
      'lane-nurture': {
        type: 'BoardLane',
        props: {
          title: 'Nurture',
          count: state.branch === 'nurture' ? 1 : 0,
          items:
            state.branch === 'nurture' ? [{ ...leadCard, badge: 'Needs more budget clarity' }] : [],
        },
        children: [],
      },
    },
  }

  const approvalHint =
    state.reviewStage === 'sales'
      ? 'AI is waiting for review: approve continues the route; edit/request changes sends the lead to nurture.'
      : state.branch === 'finance_pending'
        ? 'Sales review done. Lead awaits Finance’s final decision.'
        : state.branch === 'follow_up'
          ? 'Follow-up can go out: orchestration finished.'
          : 'Lead moved to nurture.'

  return {
    title: 'Sales durable execution',
    summary: approvalHint,
    blocks: [
      {
        type: 'text',
        text: `${state.summary}\n\nReview policy: ${policy.review.requiredFor.join(', ') || 'none'}.`,
      },
      {
        type: 'spec',
        spec: boardSpec,
      },
    ],
  }
}
