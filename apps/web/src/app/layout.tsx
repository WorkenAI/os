import { GeistSans } from 'geist/font/sans'
import type { Metadata, Viewport } from 'next'
import './globals.css'
import { PermissionsProvider } from '@worken/shell-web/permissions/context'
import { ShellThemeProvider } from '@worken/shell-web/theme'

export const metadata: Metadata = {
  title: 'Worken OS — the operating system for people and agents',
  description: 'A new era of collaboration. One platform for people and AI agents.',
}

export const viewport: Viewport = {
  themeColor: '#050508',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={GeistSans.variable}>
      <body className={`min-h-screen overflow-x-hidden antialiased ${GeistSans.className}`}>
        <PermissionsProvider>
          <ShellThemeProvider>
          <div className="relative min-h-screen">
            <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
              <div
                className="absolute top-1/2 left-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20 blur-[80px] animate-[blob-pulse_8s_ease-in-out_infinite]"
                style={{
                  background:
                    'radial-gradient(circle, rgba(34, 211, 238, 0.4) 0%, transparent 60%)',
                }}
              />
            </div>
            <div className="relative z-10">{children}</div>
          </div>
          </ShellThemeProvider>
        </PermissionsProvider>
      </body>
    </html>
  )
}
