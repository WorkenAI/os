'use client'

import type { CSSProperties } from 'react'
import { useEffect, useRef } from 'react'
import { hexToRgbCsv, resolveDomainPrimaryColor } from '@worken/shell-web/domain-colors'
import { ShellWindowControls } from '@worken/shell-web/layout/shell-window-controls'
import { ShellMachineProvider } from '@worken/shell-web/machines/context'
import { ShellScreen } from '@worken/shell-web/runtime/screen/shell-screen'
import { ShellSessionProvider, useShellSession } from '@worken/shell-web/session/context'
import { type ShellTheme, ShellThemeProvider } from '@worken/shell-web/theme'
import { WorkenOsWebMcpRegistrar } from '@worken/shell-web/webmcp/registrar'

export function ShellPreview({
  domainId,
  initialViewId,
  showChrome,
  theme,
  onToggleTheme,
  onRequestHide,
  onToggleFullscreen,
  isFullscreen = false,
}: {
  domainId: string
  /** Opens this view on first load when permitted (e.g. admin → spaces). */
  initialViewId?: string | null
  showChrome?: boolean
  theme?: ShellTheme
  onToggleTheme?: () => void
  onRequestHide?: () => void
  onToggleFullscreen?: () => void
  isFullscreen?: boolean
}) {
  return (
    <ShellMachineProvider>
      <ShellSessionProvider key={domainId} initialViewId={initialViewId}>
        <WorkenOsWebMcpRegistrar />
        <ShellThemeProvider theme={theme} toggle={onToggleTheme}>
          <ShellPreviewFrame
            domainId={domainId}
            initialViewId={initialViewId}
            showChrome={showChrome}
            onRequestHide={onRequestHide}
            onToggleFullscreen={onToggleFullscreen}
            isFullscreen={isFullscreen}
          />
        </ShellThemeProvider>
      </ShellSessionProvider>
    </ShellMachineProvider>
  )
}

function ShellPreviewFrame({
  domainId,
  initialViewId,
  showChrome,
  onRequestHide,
  onToggleFullscreen,
  isFullscreen,
}: {
  domainId: string
  initialViewId?: string | null
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
        initialViewId={initialViewId}
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
  initialViewId,
  showChrome,
  onRequestHide,
  onToggleFullscreen,
  isFullscreen,
}: {
  domainId: string
  initialViewId?: string | null
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
    void activateDomainRef.current(domainId, { initialViewId: initialViewId ?? undefined })
  }, [domainId, initialViewId])

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
