import { GeistSans } from 'geist/font/sans'
import type { Metadata, Viewport } from 'next'
import './globals.css'
import { PermissionsProvider } from '@/shell/permissions/context'

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
        <PermissionsProvider>{children}</PermissionsProvider>
      </body>
    </html>
  )
}
