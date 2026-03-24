'use client'

import { useMemo } from 'react'
import { usePermissions } from '@worken/shell-web/permissions/context'
import { useShellTheme } from '@worken/shell-web/theme'

/**
 * Client-side entry point for Worken OS web apps: role permissions and shell chrome theme.
 * Requires `PermissionsProvider` and `ShellThemeProvider` (see root layout).
 *
 * For shell routes, use `useShellSession()` inside `ShellSessionProvider` (e.g. `(shell)` layout).
 */
export function useOS() {
  const permissions = usePermissions()
  const theme = useShellTheme()

  return useMemo(
    () => ({
      permissions,
      theme,
    }),
    [permissions, theme],
  )
}
