import { cookies, headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { ACTIVE_ROLE_COOKIE, SHELL_SESSION_COOKIE } from '@/shell/permissions/shared'
import {
  getActiveRoleIdFromCookie,
  getShellSessionIdFromCookie,
  setActiveRoleCookie,
  setShellSessionCookie,
} from '@/shell/server/auth/session'
import { getPolicySession } from '@/shell/server/policy/service'
import { resolveShellSession, toShellSessionPayload } from '@/shell/server/session/service'

export const dynamic = 'force-dynamic'

type ActiveRoleBody = {
  roleId?: string
}

function createJsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as ActiveRoleBody
  if (!body.roleId) {
    return createJsonError('Missing roleId')
  }

  const cookieStore = await cookies()
  const session = await getPolicySession(
    getActiveRoleIdFromCookie(cookieStore.get(ACTIVE_ROLE_COOKIE)?.value),
  )
  const nextRole = session.roles.find((role) => role.id === body.roleId)

  if (!nextRole) {
    return createJsonError(`Unknown role: ${body.roleId}`, 404)
  }

  const requestHeaders = await headers()
  const runtimeSession = await resolveShellSession({
    requestedRoleId: nextRole.id,
    sessionId: getShellSessionIdFromCookie(cookieStore.get(SHELL_SESSION_COOKIE)?.value),
    headers: requestHeaders,
  })
  const response = NextResponse.json(toShellSessionPayload(runtimeSession))
  setActiveRoleCookie(response, runtimeSession.currentRoleId)
  setShellSessionCookie(response, runtimeSession.shellSession.id)

  return response
}
