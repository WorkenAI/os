import type { NextResponse } from 'next/server'
import { ACTIVE_ROLE_COOKIE, SHELL_SESSION_COOKIE } from '@worken/shell-web/permissions/shared'

export const ACTIVE_ROLE_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 60 * 60 * 24 * 365,
}

export function getActiveRoleIdFromCookie(cookieValue: string | undefined) {
  return cookieValue?.trim() || null
}

export function getShellSessionIdFromCookie(cookieValue: string | undefined) {
  return cookieValue?.trim() || null
}

export function setActiveRoleCookie(response: NextResponse, roleId: string) {
  response.cookies.set(ACTIVE_ROLE_COOKIE, roleId, ACTIVE_ROLE_COOKIE_OPTIONS)
}

export function setShellSessionCookie(response: NextResponse, sessionId: string) {
  response.cookies.set(SHELL_SESSION_COOKIE, sessionId, ACTIVE_ROLE_COOKIE_OPTIONS)
}
