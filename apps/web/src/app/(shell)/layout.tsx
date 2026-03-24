import type { ReactNode } from 'react'
import { ShellMachineProvider } from '@worken/shell-web/machines/context'
import { ShellThemeProvider } from '@worken/shell-web/theme'

export default function ShellLayout({ children }: { children: ReactNode }) {
  return (
    <ShellMachineProvider>
      <ShellThemeProvider>{children}</ShellThemeProvider>
    </ShellMachineProvider>
  )
}
