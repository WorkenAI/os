import { cookies, headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { getDefaultExecutionSignalDefinition, isExecutionSignalType } from '@/execution/kernel'
import { readSignalPolicyState, writeSignalPolicyState } from '@/execution/service'
import type { WorkenOsSignalType } from '@/execution/types'
import { ACTIVE_ROLE_COOKIE, SHELL_SESSION_COOKIE } from '@worken/shell-web/permissions/shared'
import {
  getActiveRoleIdFromCookie,
  getShellSessionIdFromCookie,
  setActiveRoleCookie,
  setShellSessionCookie,
} from '@worken/shell-web/server/auth/session'
import { resolveShellSession } from '@worken/shell-web/server/session/service'

type PolicyBody = {
  signalType?: string
  policy?: Awaited<ReturnType<typeof readSignalPolicyState>>
}

function createJsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

function parseSignalType(raw: string | null): WorkenOsSignalType | null {
  if (raw && !isExecutionSignalType(raw)) return null
  if (raw && isExecutionSignalType(raw)) return raw
  return getDefaultExecutionSignalDefinition()?.signalType ?? null
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const signalType = parseSignalType(url.searchParams.get('signalType'))
  const cookieStore = await cookies()
  const requestHeaders = await headers()
  if (!signalType) {
    return createJsonError('No execution signals registered', 404)
  }
  const runtimeSession = await resolveShellSession({
    requestedRoleId: getActiveRoleIdFromCookie(cookieStore.get(ACTIVE_ROLE_COOKIE)?.value),
    sessionId: getShellSessionIdFromCookie(cookieStore.get(SHELL_SESSION_COOKIE)?.value),
    headers: requestHeaders,
  })
  const policy = await readSignalPolicyState(signalType, runtimeSession.shellSession)
  const response = NextResponse.json({ signalType, policy })
  setActiveRoleCookie(response, runtimeSession.currentRoleId)
  setShellSessionCookie(response, runtimeSession.shellSession.id)
  return response
}

export async function PUT(request: Request) {
  const body = (await request.json().catch(() => ({}))) as PolicyBody
  const signalType = parseSignalType(body.signalType ?? null)
  const cookieStore = await cookies()
  const requestHeaders = await headers()
  if (!signalType) {
    return createJsonError('No execution signals registered', 404)
  }

  if (!body.policy) {
    return createJsonError('policy is required')
  }

  const runtimeSession = await resolveShellSession({
    requestedRoleId: getActiveRoleIdFromCookie(cookieStore.get(ACTIVE_ROLE_COOKIE)?.value),
    sessionId: getShellSessionIdFromCookie(cookieStore.get(SHELL_SESSION_COOKIE)?.value),
    headers: requestHeaders,
  })
  const policy = await writeSignalPolicyState(signalType, body.policy, runtimeSession.shellSession)
  const response = NextResponse.json({ signalType, policy })
  setActiveRoleCookie(response, runtimeSession.currentRoleId)
  setShellSessionCookie(response, runtimeSession.shellSession.id)
  return response
}
