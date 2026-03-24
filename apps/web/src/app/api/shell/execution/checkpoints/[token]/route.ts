import { cookies, headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { resolveCheckpointDecision } from '@/execution/service'
import { ACTIVE_ROLE_COOKIE, SHELL_SESSION_COOKIE } from '@worken/shell-web/permissions/shared'
import {
  getActiveRoleIdFromCookie,
  getShellSessionIdFromCookie,
  setActiveRoleCookie,
  setShellSessionCookie,
} from '@worken/shell-web/server/auth/session'
import { resolveShellSession } from '@worken/shell-web/server/session/service'

type CheckpointDecisionBody = {
  decision?: 'approve' | 'reject' | 'request_changes'
  comment?: string
  domainId?: string
}

function createJsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const body = (await request.json().catch(() => ({}))) as CheckpointDecisionBody
  const cookieStore = await cookies()
  const requestHeaders = await headers()

  if (!body.decision) {
    return createJsonError('decision is required')
  }

  const runtimeSession = await resolveShellSession({
    requestedRoleId: getActiveRoleIdFromCookie(cookieStore.get(ACTIVE_ROLE_COOKIE)?.value),
    sessionId: getShellSessionIdFromCookie(cookieStore.get(SHELL_SESSION_COOKIE)?.value),
    headers: requestHeaders,
  })
  const caseRecord = await resolveCheckpointDecision({
    token,
    decision: body.decision,
    comment: body.comment,
    domainId: body.domainId ?? 'sales',
    session: runtimeSession.shellSession,
  })

  if (!caseRecord) {
    return createJsonError(`Unknown checkpoint token: ${token}`, 404)
  }

  const response = NextResponse.json({ runId: caseRecord.id, case: caseRecord })
  setActiveRoleCookie(response, runtimeSession.currentRoleId)
  setShellSessionCookie(response, runtimeSession.shellSession.id)
  return response
}
