import { getRun, start } from '@workflow/core/runtime'
import type { WorkenOsWorldKind } from './types'

type WorkflowRuntime = typeof import('@workflow/core/runtime')

let workflowRuntimePromise: Promise<WorkflowRuntime> | null = null
let worldInstance: ReturnType<WorkflowRuntime['getWorld']> | null = null
let startPromise: Promise<void> | null = null

function resolveWorkflowWorldKind(target = process.env.WORKFLOW_TARGET_WORLD): WorkenOsWorldKind {
  if (target?.includes('world-postgres')) return 'postgres'
  if (target?.includes('world-vercel')) return 'vercel'
  return 'local'
}

function isStoppableWorld(value: unknown): value is { stop: () => Promise<void> } {
  if (!value || typeof value !== 'object') return false
  return typeof (value as Record<string, unknown>).stop === 'function'
}

async function getWorkflowRuntime() {
  if (!workflowRuntimePromise) {
    workflowRuntimePromise = import('@workflow/core/runtime')
  }

  return workflowRuntimePromise
}

async function ensureWorkflowWorldStarted() {
  if (!worldInstance) {
    worldInstance = (await getWorkflowRuntime()).getWorld()
  }

  if (!startPromise) {
    startPromise = (async () => {
      if (worldInstance?.start) {
        await worldInstance.start()
      }
    })().catch((error) => {
      startPromise = null
      throw error
    })
  }

  await startPromise
}

async function stopWorkflowWorld() {
  if (!worldInstance) return

  if (isStoppableWorld(worldInstance)) {
    await worldInstance.stop()
  }

  worldInstance = null
  startPromise = null
}

export type WorkenOsWorld = {
  kind: WorkenOsWorldKind
  ensureReady: () => Promise<void>
  startRun: <TArgs extends unknown[], TResult>(
    workflowFn: (...args: TArgs) => Promise<TResult>,
    args: TArgs,
  ) => Promise<{ runId: string }>
  getRunStatus: (runId: string) => Promise<string>
  stop: () => Promise<void>
}

export function createWorkenOsWorld(): WorkenOsWorld {
  return {
    kind: resolveWorkflowWorldKind(process.env.WORKFLOW_TARGET_WORLD),
    ensureReady: async () => ensureWorkflowWorldStarted(),
    startRun: async (workflowFn, args) => {
      await ensureWorkflowWorldStarted()
      const run = await start(workflowFn, args)
      return { runId: run.runId }
    },
    getRunStatus: async (runId) => {
      const run = getRun(runId)
      return String(await run.status)
    },
    stop: async () => stopWorkflowWorld(),
  }
}
