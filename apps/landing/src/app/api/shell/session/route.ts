import { cookies, headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { ACTIVE_ROLE_COOKIE, SHELL_SESSION_COOKIE } from '@/shell/permissions/shared'
import {
  getActiveRoleIdFromCookie,
  getShellSessionIdFromCookie,
  setActiveRoleCookie,
  setShellSessionCookie,
} from '@/shell/server/auth/session'
import { resolveShellSession, toShellSessionPayload } from '@/shell/server/session/service'

export const dynamic = 'force-dynamic'

export async function GET() {
  const cookieStore = await cookies()
  const requestedRoleId = getActiveRoleIdFromCookie(cookieStore.get(ACTIVE_ROLE_COOKIE)?.value)
  const requestHeaders = await headers()
  const session = await resolveShellSession({
    requestedRoleId,
    sessionId: getShellSessionIdFromCookie(cookieStore.get(SHELL_SESSION_COOKIE)?.value),
    headers: requestHeaders,
  })

  const response = NextResponse.json(toShellSessionPayload(session))
  setActiveRoleCookie(response, session.currentRoleId)
  setShellSessionCookie(response, session.shellSession.id)
  return response
}
