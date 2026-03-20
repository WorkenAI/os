'use client'

import { useMachine } from '@xstate/react'
import { createContext, type ReactNode, use, useEffect, useMemo } from 'react'
import { clearShellDispatcher, setShellDispatcher } from '../shell-dispatch'
import { type ShellContext, type ShellEvent, shellMachine } from './shell'

type ShellMachineApi = {
  state: ShellContext
  send: (event: ShellEvent) => void
  isActive: boolean
}

const ShellMachineContext = createContext<ShellMachineApi | null>(null)

export function ShellMachineProvider({ children }: { children: ReactNode }) {
  const [snapshot, send] = useMachine(shellMachine)

  const api = useMemo<ShellMachineApi>(
    () => ({
      state: snapshot.context,
      send,
      isActive: snapshot.value === 'domainActive',
    }),
    [snapshot, send],
  )

  useEffect(() => {
    setShellDispatcher(send)
    return () => clearShellDispatcher()
  }, [send])

  return <ShellMachineContext value={api}>{children}</ShellMachineContext>
}

export function useShell() {
  const ctx = use(ShellMachineContext)
  if (!ctx) throw new Error('useShell must be used inside ShellMachineProvider')
  return ctx
}
