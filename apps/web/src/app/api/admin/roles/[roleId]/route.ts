import { cookies, headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { ACTIVE_ROLE_COOKIE, SHELL_SESSION_COOKIE } from '@worken/shell-web/permissions/shared'
import type { RoleDefinition } from '@worken/shell-web/permissions/types'
import {
  getActiveRoleIdFromCookie,
  getShellSessionIdFromCookie,
  setActiveRoleCookie,
  setShellSessionCookie,
} from '@worken/shell-web/server/auth/session'
import { updateRoleDefinition } from '@worken/shell-web/server/policy/service'
import { resolveShellSession, toShellSessionPayload } from '@worken/shell-web/server/session/service'

export const dynamic = 'force-dynamic'

function createJsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export async function PUT(request: Request, { params }: { params: Promise<{ roleId: string }> }) {
  const { roleId } = await params
  const body = (await request.json().catch(() => null)) as RoleDefinition | null
  if (!body) {
    return createJsonError('Missing role payload')
  }

  try {
    const cookieStore = await cookies()
    const session = await updateRoleDefinition(
      roleId,
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
    const message = error instanceof Error ? error.message : 'Unknown role update error'
    return createJsonError(message, 403)
  }
}
