'use client'

import { useParams } from 'next/navigation'
import type { CSSProperties } from 'react'
import { useEffect, useRef } from 'react'
import { hexToRgbCsv, resolveDomainPrimaryColor } from '@worken/shell-web/domain-colors'
import { ShellWindowControls } from '@worken/shell-web/layout/shell-window-controls'
import { WorkenMockRuntimeProvider } from '@worken/demo/mock-os-runtime'
import { ShellScreen } from '@worken/shell-web/runtime/screen/shell-screen'
import { ShellSessionProvider, useShellSession } from '@worken/shell-web/session/context'
import { WorkenOsWebMcpRegistrar } from '@worken/shell-web/webmcp/registrar'

function DomainPageInner({ domainId }: { domainId: string }) {
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

export default function DomainPage() {
  const params = useParams<{ domain: string }>()
  const domainId = params.domain

  return (
    <WorkenMockRuntimeProvider>
      <ShellSessionProvider key={domainId}>
        <WorkenOsWebMcpRegistrar />
        <DomainPageInner domainId={domainId} />
      </ShellSessionProvider>
    </WorkenMockRuntimeProvider>
  )
}
