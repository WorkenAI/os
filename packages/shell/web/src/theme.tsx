'use client'

import { useMachine } from '@xstate/react'
import { createContext, type ReactNode, use, useEffect } from 'react'

import { type ShellTheme, themeMachine } from '@worken/shell-web/machines/theme-machine'

export type { ShellTheme }

type ShellThemeApi = {
  theme: ShellTheme
  toggle: () => void
}

export const SHELL_THEME_STORAGE_KEY = 'worken-os:shell-theme'

const ShellThemeContext = createContext<ShellThemeApi | null>(null)

export function ShellThemeProvider({
  children,
  theme: controlledTheme,
  toggle: controlledToggle,
}: {
  children: ReactNode
  theme?: ShellTheme
  toggle?: () => void
}) {
  const isControlled = controlledTheme !== undefined
  const [snapshot, send] = useMachine(themeMachine)

  const uncontrolledTheme = snapshot.context.theme
  const storageLoaded = snapshot.context.storageLoaded

  const theme = controlledTheme ?? uncontrolledTheme
  const toggle =
    controlledToggle ??
    (() => {
      send({ type: 'theme.toggle' })
    })

  useEffect(() => {
    if (isControlled) return
    const storedTheme = localStorage.getItem(SHELL_THEME_STORAGE_KEY)
    send({ type: 'theme.set', theme: storedTheme === 'light' ? 'light' : 'dark' })
    send({ type: 'storage.loaded' })
  }, [isControlled, send])

  useEffect(() => {
    if (isControlled) return
    if (!storageLoaded) return
    localStorage.setItem(SHELL_THEME_STORAGE_KEY, theme)
  }, [isControlled, storageLoaded, theme])

  useEffect(() => {
    document.documentElement.setAttribute('data-shell-theme', theme)
  }, [theme])

  return (
    <ShellThemeContext value={{ theme, toggle }}>
      <div data-shell-theme={theme} className="h-full">
        {children}
      </div>
    </ShellThemeContext>
  )
}

export function useShellTheme(): ShellThemeApi {
  const ctx = use(ShellThemeContext)
  if (!ctx) throw new Error('useShellTheme must be used inside ShellThemeProvider')
  return ctx
}
