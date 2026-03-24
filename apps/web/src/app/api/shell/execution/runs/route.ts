import { cookies, headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { getDefaultExecutionSignalDefinition, isExecutionSignalType } from '@/execution/kernel'
import { ensureExecutionRun } from '@/execution/service'
import type { WorkenOsSignalType } from '@/execution/types'
import { ACTIVE_ROLE_COOKIE, SHELL_SESSION_COOKIE } from '@worken/shell-web/permissions/shared'
import {
  getActiveRoleIdFromCookie,
  getShellSessionIdFromCookie,
  setActiveRoleCookie,
  setShellSessionCookie,
} from '@worken/shell-web/server/auth/session'
import { resolveShellSession } from '@worken/shell-web/server/session/service'

type StartExecutionRunBody = {
  signalType?: string
  domainId?: string
  viewId?: string
  autoStart?: boolean
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
  const body = (await request.json().catch(() => ({}))) as StartExecutionRunBody
  const cookieStore = await cookies()
  const requestHeaders = await headers()
  const runtimeSession = await resolveShellSession({
    requestedRoleId: getActiveRoleIdFromCookie(cookieStore.get(ACTIVE_ROLE_COOKIE)?.value),
    sessionId: getShellSessionIdFromCookie(cookieStore.get(SHELL_SESSION_COOKIE)?.value),
    headers: requestHeaders,
  })
  const signalType = parseSignalType(body.signalType ?? null)

  if (!signalType) {
    return createJsonError(`Unsupported signal: ${body.signalType ?? 'unknown'}`, 404)
  }

  if (!body.domainId || !body.viewId) {
    return createJsonError('domainId and viewId are required')
  }

  const caseRecord = await ensureExecutionRun({
    signalType,
    domainId: body.domainId,
    viewId: body.viewId,
    autoStart: body.autoStart ?? true,
    session: runtimeSession.shellSession,
    forceRestart: body.forceRestart,
  })

  if (!caseRecord) {
    return createJsonError('Execution run is not available', 404)
  }

  const response = NextResponse.json({ runId: caseRecord.id, case: caseRecord })
  setActiveRoleCookie(response, runtimeSession.currentRoleId)
  setShellSessionCookie(response, runtimeSession.shellSession.id)
  return response
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const cookieStore = await cookies()
  const requestHeaders = await headers()
  const signalType = parseSignalType(url.searchParams.get('signalType'))
  const domainId = url.searchParams.get('domainId')
  const viewId = url.searchParams.get('viewId')
  const autoStart = url.searchParams.get('autoStart') === 'true'

  if (!signalType) {
    return createJsonError(
      `Unsupported signal: ${url.searchParams.get('signalType') ?? 'unknown'}`,
      404,
    )
  }

  if (!domainId || !viewId) {
    return createJsonError('domainId and viewId are required')
  }

  const runtimeSession = await resolveShellSession({
    requestedRoleId: getActiveRoleIdFromCookie(cookieStore.get(ACTIVE_ROLE_COOKIE)?.value),
    sessionId: getShellSessionIdFromCookie(cookieStore.get(SHELL_SESSION_COOKIE)?.value),
    headers: requestHeaders,
  })
  const caseRecord = await ensureExecutionRun({
    signalType,
    domainId,
    viewId,
    autoStart,
    session: runtimeSession.shellSession,
  })

  if (!caseRecord) {
    const response = NextResponse.json({ runId: null, case: null })
    setActiveRoleCookie(response, runtimeSession.currentRoleId)
    setShellSessionCookie(response, runtimeSession.shellSession.id)
    return response
  }

  const response = NextResponse.json({ runId: caseRecord.id, case: caseRecord })
  setActiveRoleCookie(response, runtimeSession.currentRoleId)
  setShellSessionCookie(response, runtimeSession.shellSession.id)
  return response
}
