'use client'

import type { SemanticIR } from '@worken/semantic-ir'
import type { CSSProperties } from 'react'
import { useEffect, useRef } from 'react'
import baselineIr from '@/generated/semantic-ir-baseline.json'
import { hexToRgbCsv, resolveDomainPrimaryColor } from '@/shell/domain-colors'
import { ShellWindowControls } from '@/shell/layout/shell-window-controls'
import { ShellMachineProvider } from '@/shell/machines/context'
import { ShellScreen } from '@/shell/runtime/screen/shell-screen'
import { SemanticIrProvider } from '@/shell/runtime/semantic/semantic-ir-context'
import { ShellSessionProvider, useShellSession } from '@/shell/session/context'
import { type ShellTheme, ShellThemeProvider } from '@/shell/theme'
import { WorkenOsWebMcpRegistrar } from '@/shell/webmcp/registrar'

export function ShellPreview({
  domainId,
  showChrome,
  theme,
  onToggleTheme,
  onRequestHide,
  onToggleFullscreen,
  isFullscreen = false,
}: {
  domainId: string
  showChrome?: boolean
  theme?: ShellTheme
  onToggleTheme?: () => void
  onRequestHide?: () => void
  onToggleFullscreen?: () => void
  isFullscreen?: boolean
}) {
  return (
    <SemanticIrProvider ir={baselineIr as SemanticIR}>
      <ShellMachineProvider>
        <ShellSessionProvider key={domainId}>
          <WorkenOsWebMcpRegistrar />
          <ShellThemeProvider theme={theme} toggle={onToggleTheme}>
            <ShellPreviewFrame
              domainId={domainId}
              showChrome={showChrome}
              onRequestHide={onRequestHide}
              onToggleFullscreen={onToggleFullscreen}
              isFullscreen={isFullscreen}
            />
          </ShellThemeProvider>
        </ShellSessionProvider>
      </ShellMachineProvider>
    </SemanticIrProvider>
  )
}

function ShellPreviewFrame({
  domainId,
  showChrome,
  onRequestHide,
  onToggleFullscreen,
  isFullscreen,
}: {
  domainId: string
  showChrome?: boolean
  onRequestHide?: () => void
  onToggleFullscreen?: () => void
  isFullscreen?: boolean
}) {
  const shellAccent = resolveDomainPrimaryColor(domainId)

  return (
    <div
      className="h-full"
      style={
        {
          '--shell-accent': shellAccent,
          '--shell-accent-rgb': hexToRgbCsv(shellAccent),
        } as CSSProperties
      }
    >
      <ShellScreenWithPreviewChrome
        domainId={domainId}
        showChrome={showChrome}
        onRequestHide={onRequestHide}
        onToggleFullscreen={onToggleFullscreen}
        isFullscreen={isFullscreen}
      />
    </div>
  )
}

function ShellScreenWithPreviewChrome({
  domainId,
  showChrome,
  onRequestHide,
  onToggleFullscreen,
  isFullscreen,
}: {
  domainId: string
  showChrome?: boolean
  onRequestHide?: () => void
  onToggleFullscreen?: () => void
  isFullscreen?: boolean
}) {
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
      <div className="flex h-full items-center justify-center px-6 text-center">
        <div className="max-w-sm rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-5">
          <p className="text-sm font-medium text-zinc-100">Could not open shell</p>
          <p className="mt-2 text-sm text-zinc-400">
            Check the selected domain and try again.
          </p>
        </div>
      </div>
    )
  }

  if (!domain || status === 'loading') {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div
            className="h-6 w-6 animate-spin rounded-full border-2 border-t-transparent"
            style={{ borderColor: 'var(--shell-accent)', borderTopColor: 'transparent' }}
          />
          <p className="text-xs text-zinc-500">Loading {domainId}...</p>
        </div>
      </div>
    )
  }

  if (!canAccessCurrentDomain) {
    return (
      <div className="flex h-full items-center justify-center px-6 text-center">
        <div className="max-w-sm rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-5">
          <p className="text-sm font-medium text-zinc-100">{domain.title} unavailable</p>
          <p className="mt-2 text-sm text-zinc-400">
            The active role does not allow opening this domain.
          </p>
        </div>
      </div>
    )
  }

  return (
    <ShellScreen
      domain={domain}
      activeView={activeView}
      viewTitle={viewTitle}
      onNavigate={navigateToSpec}
      onAction={executeSidebarAction}
      windowControls={
        showChrome ? (
          <ShellWindowControls
            onClose={onRequestHide}
            onMinimize={isFullscreen ? onToggleFullscreen : onRequestHide}
            onZoom={onToggleFullscreen}
            minimizeLabel={isFullscreen ? 'Return shell to windowed mode' : 'Hide shell preview'}
            zoomLabel={
              isFullscreen
                ? 'Exit fullscreen'
                : `Open ${domainId} shell fullscreen`
            }
          />
        ) : undefined
      }
    />
  )
}
