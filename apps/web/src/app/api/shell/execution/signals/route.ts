import { cookies, headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { getDefaultExecutionSignalDefinition, isExecutionSignalType } from '@/execution/kernel'
import { emitExecutionSignal } from '@/execution/service'
import { buildBootstrapSignal } from '@/execution/signals'
import type { WorkenOsSignalType } from '@/execution/types'
import { ACTIVE_ROLE_COOKIE, SHELL_SESSION_COOKIE } from '@worken/shell-web/permissions/shared'
import {
  getActiveRoleIdFromCookie,
  getShellSessionIdFromCookie,
  setActiveRoleCookie,
  setShellSessionCookie,
} from '@worken/shell-web/server/auth/session'
import { resolveShellSession } from '@worken/shell-web/server/session/service'

type SignalBody = {
  signalType?: string
  domainId?: string
  viewId?: string
  source?: 'demo' | 'integration' | 'manual'
  payload?: Record<string, unknown>
  forceRestart?: boolean
}

function createJsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

function parseSignalType(value?: string | null): WorkenOsSignalType | null {
  if (value && !isExecutionSignalType(value)) return null
  if (value && isExecutionSignalType(value)) return value
  return getDefaultExecutionSignalDefinition()?.signalType ?? null
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as SignalBody
  const cookieStore = await cookies()
  const requestHeaders = await headers()
  const signalType = parseSignalType(body.signalType ?? null)

  if (!signalType) {
    return createJsonError(`Unsupported signal: ${body.signalType ?? 'unknown'}`, 404)
  }

  const runtimeSession = await resolveShellSession({
    requestedRoleId: getActiveRoleIdFromCookie(cookieStore.get(ACTIVE_ROLE_COOKIE)?.value),
    sessionId: getShellSessionIdFromCookie(cookieStore.get(SHELL_SESSION_COOKIE)?.value),
    headers: requestHeaders,
  })
  const signal = buildBootstrapSignal({
    signalType,
    domainId: body.domainId,
    viewId: body.viewId,
    actor: runtimeSession.shellSession.actor,
    session: runtimeSession.shellSession,
    payload: body.payload,
    source: body.source,
  })

  if (!signal) {
    return createJsonError('Unable to build execution signal', 400)
  }

  const caseRecord = await emitExecutionSignal({
    signal,
    forceRestart: body.forceRestart,
  })

  if (!caseRecord) {
    return createJsonError('Execution signal did not produce a case', 404)
  }

  const response = NextResponse.json({ runId: caseRecord.id, case: caseRecord, signal })
  setActiveRoleCookie(response, runtimeSession.currentRoleId)
  setShellSessionCookie(response, runtimeSession.shellSession.id)
  return response
}
