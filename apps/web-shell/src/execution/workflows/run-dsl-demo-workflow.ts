import type { StateId } from '@worken/dsl'
import { applyProcessTransition } from '@worken/dsl'
import { getWorkflowMetadata } from '@workflow/core'
import { demoApprovalProcess } from '../dsl-demo/demo-process'

export type DslDemoWorkflowInput = {
  /** Event ids to apply in order, starting from `demoApprovalProcess.initial`. */
  events: string[]
}

/**
 * Demo: each DSL transition is a **workflow step** (`'use step'`).
 * Run via `createWorkenOsWorld().startRun(runDslDemoWorkflow, [input])`.
 */
export async function runDslDemoWorkflow(input: DslDemoWorkflowInput) {
  'use workflow'

  const { workflowRunId } = getWorkflowMetadata()
  let state: StateId = demoApprovalProcess.initial

  const trace: { transitionId: string; from: string; to: string; eventId: string }[] = []

  for (const eventId of input.events) {
    const row = await dslTransitionStep({
      workflowRunId,
      fromState: state,
      eventId,
    })
    trace.push(row)
    state = row.to
  }

  return {
    runId: workflowRunId,
    finalState: state,
    trace,
  }
}

async function dslTransitionStep(input: {
  workflowRunId: string
  fromState: string
  eventId: string
}) {
  'use step'

  const result = applyProcessTransition(demoApprovalProcess, input.fromState, input.eventId)
  if (!result.ok) {
    throw new Error(`[${input.workflowRunId}] ${result.code}: ${result.message}`)
  }

  return {
    transitionId: result.transitionId,
    from: result.from,
    to: result.to,
    eventId: result.eventId,
  }
}
