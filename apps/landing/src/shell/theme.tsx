'use client'

import { createContext, type ReactNode, use, useCallback, useEffect, useState } from 'react'

export type ShellTheme = 'dark' | 'light'

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

  // Keep server and first client render deterministic to avoid hydration mismatch.
  const [uncontrolledTheme, setUncontrolledTheme] = useState<ShellTheme>('dark')
  const [storageLoaded, setStorageLoaded] = useState(false)

  const uncontrolledToggle = useCallback(() => {
    setUncontrolledTheme((theme) => (theme === 'dark' ? 'light' : 'dark'))
  }, [])

  const theme = controlledTheme ?? uncontrolledTheme
  const toggle = controlledToggle ?? uncontrolledToggle

  useEffect(() => {
    if (isControlled) return
    const storedTheme = localStorage.getItem(SHELL_THEME_STORAGE_KEY)
    setUncontrolledTheme(storedTheme === 'light' ? 'light' : 'dark')
    setStorageLoaded(true)
  }, [isControlled])

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
