import { getWorkflowMetadata } from '@workflow/core'
import { createReviewToken, leadReviewHook } from '../hooks/review'
import { requiresDraftReview, requiresFinanceEscalationReview } from '../signals/lead-created'
import {
  advanceExecutionDecision,
  finalizeExecutionCase,
  markExecutionCheckpoint,
  saveInitialExecutionCase,
} from '../store'
import type { ExecutionDecision, ExecutionSignalEnvelope, WorkenAiDelegationPolicy } from '../types'

type DomainCaseWorkflowInput = {
  signalType: string
  domainId: string
  viewId: string
  policy: WorkenAiDelegationPolicy
  signal: ExecutionSignalEnvelope
}

export async function runDomainCaseWorkflow(input: DomainCaseWorkflowInput) {
  'use workflow'

  const { workflowRunId } = getWorkflowMetadata()
  const seeded = await seedCaseStep({
    runId: workflowRunId,
    signalType: input.signalType,
    policy: input.policy,
    signal: input.signal,
  })

  let activeCase = seeded

  if (requiresDraftReview(input.policy)) {
    const token = createReviewToken(workflowRunId, 'sales')
    activeCase = await openCheckpointStep({
      runId: workflowRunId,
      stage: 'sales',
      token,
      title: 'Review AI triage before outreach',
      description: activeCase.state.nextAction,
      session: input.signal.session,
    })

    using hook = leadReviewHook.create({ token })
    const decision = await hook
    activeCase = await applyDecisionStep({
      runId: workflowRunId,
      stage: 'sales',
      decision: decision.decision,
      comment: decision.comment,
      session: input.signal.session,
    })
  } else {
    activeCase = await applyDecisionStep({
      runId: workflowRunId,
      stage: 'sales',
      decision: 'approve',
      comment: 'Auto-approved by policy',
      session: input.signal.session,
    })
  }

  if (activeCase.state.requiresFinanceReview) {
    if (requiresFinanceEscalationReview(input.policy, activeCase.state)) {
      const token = createReviewToken(workflowRunId, 'finance')
      activeCase = await openCheckpointStep({
        runId: workflowRunId,
        stage: 'finance',
        token,
        title: 'Finance review for custom discount',
        description: 'Approve or request changes before Sales sends the personalized offer.',
        session: input.signal.session,
      })

      using hook = leadReviewHook.create({ token })
      const decision = await hook
      activeCase = await applyDecisionStep({
        runId: workflowRunId,
        stage: 'finance',
        decision: decision.decision,
        comment: decision.comment,
        session: input.signal.session,
      })
    } else {
      activeCase = await applyDecisionStep({
        runId: workflowRunId,
        stage: 'finance',
        decision: 'approve',
        comment: 'Auto-approved by policy',
        session: input.signal.session,
      })
    }
  }

  await finalizeCaseStep(workflowRunId, input.signal.session)

  return {
    runId: workflowRunId,
    status: activeCase.status,
  }
}

async function seedCaseStep(input: {
  runId: string
  signalType: string
  policy: WorkenAiDelegationPolicy
  signal: ExecutionSignalEnvelope
}) {
  'use step'

  return saveInitialExecutionCase({
    runId: input.runId,
    signalType: input.signalType,
    policy: input.policy,
    signal: input.signal,
  })
}

async function openCheckpointStep(input: {
  runId: string
  stage: 'sales' | 'finance'
  token: string
  title: string
  description: string
  session: ExecutionSignalEnvelope['session']
}) {
  'use step'

  const updated = await markExecutionCheckpoint(input)
  if (!updated) {
    throw new Error(`Execution case not found for run ${input.runId}`)
  }

  return updated
}

async function applyDecisionStep(input: {
  runId: string
  stage: 'sales' | 'finance'
  decision: ExecutionDecision
  comment?: string
  session: ExecutionSignalEnvelope['session']
}) {
  'use step'

  const updated = await advanceExecutionDecision(input)
  if (!updated) {
    throw new Error(`Execution case not found for run ${input.runId}`)
  }

  return updated
}

async function finalizeCaseStep(runId: string, session: ExecutionSignalEnvelope['session']) {
  'use step'

  return finalizeExecutionCase(runId, session)
}
