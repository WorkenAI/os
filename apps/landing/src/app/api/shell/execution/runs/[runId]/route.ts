import { cookies, headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { readExecutionResponse } from '@/execution/service'
import { ACTIVE_ROLE_COOKIE, SHELL_SESSION_COOKIE } from '@worken/shell-web/permissions/shared'
import {
  getActiveRoleIdFromCookie,
  getShellSessionIdFromCookie,
  setActiveRoleCookie,
  setShellSessionCookie,
} from '@worken/shell-web/server/auth/session'
import { resolveShellSession } from '@worken/shell-web/server/session/service'

function createJsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export async function GET(request: Request, { params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params
  const url = new URL(request.url)
  const domainId = url.searchParams.get('domainId') ?? 'sales'
  const cookieStore = await cookies()
  const requestHeaders = await headers()
  const runtimeSession = await resolveShellSession({
    requestedRoleId: getActiveRoleIdFromCookie(cookieStore.get(ACTIVE_ROLE_COOKIE)?.value),
    sessionId: getShellSessionIdFromCookie(cookieStore.get(SHELL_SESSION_COOKIE)?.value),
    headers: requestHeaders,
  })

  const executionCase = await readExecutionResponse(runId, domainId, runtimeSession.shellSession)
  if (!executionCase) {
    return createJsonError(`Unknown run: ${runId}`, 404)
  }

  const response = NextResponse.json({ runId, case: executionCase })
  setActiveRoleCookie(response, runtimeSession.currentRoleId)
  setShellSessionCookie(response, runtimeSession.shellSession.id)
  return response
}
