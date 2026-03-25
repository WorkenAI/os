'use client'

import type { CSSProperties } from 'react'
import { useEffect, useRef } from 'react'
import { hexToRgbCsv, resolveDomainPrimaryColor } from '@/shell/domain-colors'
import { ShellWindowControls } from '@/shell/layout/shell-window-controls'
import { WorkenMockRuntimeProvider } from '@/shell/runtime/mock-os-runtime'
import { ShellScreen } from '@/shell/runtime/screen/shell-screen'
import { ShellSessionProvider, useShellSession } from '@/shell/session/context'
import { WorkenOsWebMcpRegistrar } from '@/shell/webmcp/registrar'

function ShellWorkspaceBody({ domainId }: { domainId: string }) {
  const shellAccent = resolveDomainPrimaryColor(domainId)
  const {
    activateDomain,
    activeView,
    canAccessCurrentDomain,
    domain,
    executeSidebarAction,
    navigateToSpec,
    status,
    viewTitle,
  } = useShellSession()
  const activateDomainRef = useRef(activateDomain)

  useEffect(() => {
    activateDomainRef.current = activateDomain
  }, [activateDomain])

  useEffect(() => {
    void activateDomainRef.current(domainId)
  }, [domainId])

  if (status === 'error') {
    return (
      <div className="flex h-dvh items-center justify-center bg-(--bg-deep) px-6">
        <div className="max-w-md rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6 text-center">
          <p className="text-sm font-medium text-zinc-100">Could not open domain</p>
          <p className="mt-2 text-sm text-zinc-400">
            Check the domain URL or return home and pick an allowed section.
          </p>
        </div>
      </div>
    )
  }

  if (status === 'loading' || !domain) {
    return (
      <div className="flex h-dvh items-center justify-center bg-(--bg-deep)">
        <div className="flex flex-col items-center gap-3">
          <div
            className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"
            style={{ borderColor: 'var(--shell-accent)', borderTopColor: 'transparent' }}
          />
          <p className="text-sm text-zinc-500">Loading {domainId}...</p>
        </div>
      </div>
    )
  }

  if (!canAccessCurrentDomain) {
    return (
      <div className="flex h-dvh items-center justify-center bg-(--bg-deep) px-6">
        <div className="max-w-md rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6 text-center">
          <p className="text-sm font-medium text-zinc-100">Domain access restricted</p>
          <p className="mt-2 text-sm text-zinc-400">
            The current role cannot open {domain.title}. Change permissions in Admin or pick another
            domain.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="h-dvh"
      style={
        {
          '--shell-accent': shellAccent,
          '--shell-accent-rgb': hexToRgbCsv(shellAccent),
        } as CSSProperties
      }
    >
      <ShellScreen
        domain={domain}
        activeView={activeView}
        viewTitle={viewTitle}
        onNavigate={navigateToSpec}
        onAction={executeSidebarAction}
        windowControls={<ShellWindowControls />}
      />
    </div>
  )
}

export default function ShellWorkspaceClient({ domainId }: { domainId: string }) {
  return (
    <WorkenMockRuntimeProvider>
      <ShellSessionProvider key={domainId}>
        <WorkenOsWebMcpRegistrar />
        <ShellWorkspaceBody domainId={domainId} />
      </ShellSessionProvider>
    </WorkenMockRuntimeProvider>
  )
}
