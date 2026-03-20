import { cookies, headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { ACTIVE_ROLE_COOKIE, SHELL_SESSION_COOKIE } from '@/shell/permissions/shared'
import {
  getActiveRoleIdFromCookie,
  getShellSessionIdFromCookie,
  setActiveRoleCookie,
  setShellSessionCookie,
} from '@/shell/server/auth/session'
import { resetRoleDefinitions } from '@/shell/server/policy/service'
import { resolveShellSession, toShellSessionPayload } from '@/shell/server/session/service'

export const dynamic = 'force-dynamic'

function createJsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export async function POST() {
  try {
    const cookieStore = await cookies()
    const session = await resetRoleDefinitions(
      getActiveRoleIdFromCookie(cookieStore.get(ACTIVE_ROLE_COOKIE)?.value),
    )
    const requestHeaders = await headers()
    const runtimeSession = await resolveShellSession({
      requestedRoleId: session.currentRoleId,
      sessionId: getShellSessionIdFromCookie(cookieStore.get(SHELL_SESSION_COOKIE)?.value),
      headers: requestHeaders,
    })

    const response = NextResponse.json(toShellSessionPayload(runtimeSession))
    setActiveRoleCookie(response, runtimeSession.currentRoleId)
    setShellSessionCookie(response, runtimeSession.shellSession.id)
    return response
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown reset error'
    return createJsonError(message, 403)
  }
}
