import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { mkdtemp, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { DEFAULT_LEAD_CREATED_POLICY } from './signals/lead-created'
import {
  getActiveSignalRunId,
  getSignalPolicy,
  saveInitialExecutionCase,
  updateSignalPolicy,
} from './store'
import { LEAD_CREATED_SIGNAL_TYPE, type WorkenOsSession } from './types'

let previousCwd = process.cwd()
let tempDir = ''

function buildSession(id: string): WorkenOsSession {
  return {
    id,
    actor: {
      kind: 'human',
      id: `user-${id}`,
      roleId: 'sales-rep',
    },
    workspace: {
      organizationId: 'org-test',
      projectId: 'project-test',
    },
    currentRoleId: 'sales-rep',
    scope: 'shell',
    status: 'active',
    startedAt: '2026-03-17T00:00:00.000Z',
    lastSeenAt: '2026-03-17T00:00:00.000Z',
  }
}

function buildSignal(id: string, session: WorkenOsSession) {
  return {
    id: `signal-${id}`,
    type: LEAD_CREATED_SIGNAL_TYPE,
    source: 'demo' as const,
    domainId: 'sales',
    viewId: 'pipeline-board',
    actor: session.actor,
    session,
    payload: {
      leadId: id,
      company: 'Alpha Platform Inc',
    },
  }
}

describe.serial('execution store session scoping', () => {
  beforeEach(async () => {
    previousCwd = process.cwd()
    tempDir = await mkdtemp(path.join(os.tmpdir(), 'worken-os-execution-store-'))
    process.chdir(tempDir)
  })

  afterEach(async () => {
    process.chdir(previousCwd)
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true })
      tempDir = ''
    }
  })

  it('isolates active runs and policies by durable session', async () => {
    const sessionA = buildSession('session-a')
    const sessionB = buildSession('session-b')

    await saveInitialExecutionCase({
      runId: 'run-a',
      signalType: LEAD_CREATED_SIGNAL_TYPE,
      policy: DEFAULT_LEAD_CREATED_POLICY,
      signal: buildSignal('lead-a', sessionA),
    })
    await saveInitialExecutionCase({
      runId: 'run-b',
      signalType: LEAD_CREATED_SIGNAL_TYPE,
      policy: DEFAULT_LEAD_CREATED_POLICY,
      signal: buildSignal('lead-b', sessionB),
    })

    expect(await getActiveSignalRunId(LEAD_CREATED_SIGNAL_TYPE, sessionA)).toBe('run-a')
    expect(await getActiveSignalRunId(LEAD_CREATED_SIGNAL_TYPE, sessionB)).toBe('run-b')

    const customPolicy = {
      ...DEFAULT_LEAD_CREATED_POLICY,
      maxAutonomousSteps: DEFAULT_LEAD_CREATED_POLICY.maxAutonomousSteps + 2,
    }
    await updateSignalPolicy(LEAD_CREATED_SIGNAL_TYPE, customPolicy, sessionA)

    expect((await getSignalPolicy(LEAD_CREATED_SIGNAL_TYPE, sessionA)).maxAutonomousSteps).toBe(
      customPolicy.maxAutonomousSteps,
    )
    expect((await getSignalPolicy(LEAD_CREATED_SIGNAL_TYPE, sessionB)).maxAutonomousSteps).toBe(
      DEFAULT_LEAD_CREATED_POLICY.maxAutonomousSteps,
    )
  })
})
