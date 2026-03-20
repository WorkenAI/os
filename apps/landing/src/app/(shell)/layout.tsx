import type { ReactNode } from 'react'
import { ShellMachineProvider } from '@/shell/machines/context'
import { ShellThemeProvider } from '@/shell/theme'

export default function ShellLayout({ children }: { children: ReactNode }) {
  return (
    <ShellMachineProvider>
      <ShellThemeProvider>{children}</ShellThemeProvider>
    </ShellMachineProvider>
  )
}
