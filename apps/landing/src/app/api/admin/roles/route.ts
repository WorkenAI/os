import { cookies, headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { ACTIVE_ROLE_COOKIE, SHELL_SESSION_COOKIE } from '@/shell/permissions/shared'
import type { RoleDefinition } from '@/shell/permissions/types'
import {
  getActiveRoleIdFromCookie,
  getShellSessionIdFromCookie,
  setActiveRoleCookie,
  setShellSessionCookie,
} from '@/shell/server/auth/session'
import { createRoleDefinition } from '@/shell/server/policy/service'
import { resolveShellSession, toShellSessionPayload } from '@/shell/server/session/service'

export const dynamic = 'force-dynamic'

export async function GET() {
  const cookieStore = await cookies()
  const requestHeaders = await headers()
  const session = await resolveShellSession({
    requestedRoleId: getActiveRoleIdFromCookie(cookieStore.get(ACTIVE_ROLE_COOKIE)?.value),
    sessionId: getShellSessionIdFromCookie(cookieStore.get(SHELL_SESSION_COOKIE)?.value),
    headers: requestHeaders,
  })

  const response = NextResponse.json(toShellSessionPayload(session))
  setActiveRoleCookie(response, session.currentRoleId)
  setShellSessionCookie(response, session.shellSession.id)
  return response
}

function createJsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as RoleDefinition | null
  if (!body) {
    return createJsonError('Missing role payload')
  }

  try {
    const cookieStore = await cookies()
    const session = await createRoleDefinition(
      body,
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
    const message = error instanceof Error ? error.message : 'Unknown role create error'
    return createJsonError(message, 403)
  }
}
