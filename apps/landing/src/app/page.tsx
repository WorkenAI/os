'use client'

import type { CSSProperties } from 'react'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import Hero from '@/components/Hero'
import { ShellPreview } from '@/components/ShellPreview'
import { getShellSurfaceLayoutId } from '@/domains/manifest'
import { DOMAIN_MANIFESTS } from '@/domains/registry'
import type { DomainShellSurfaceLayoutId } from '@/domains/types'
import { useMouseTilt } from '@/hooks/MouseTilt'
import { cn } from '@/lib/utils'
import { withHexAlpha } from '@/shell/domain-colors'
import { RoleIcon } from '@/shell/icons/role-icon'
import { shellUiTokens } from '@/shell/layout/ui-tokens'
import { usePermissions } from '@/shell/permissions/context'
import { useWorkenMockRuntime, WorkenMockRuntimeProvider } from '@/shell/runtime/mock-os-runtime'
import { openShellInspector } from '@/shell/session/dispatch'
import { ShellThemeProvider, useShellTheme } from '@/shell/theme'
import { getLandingScene } from '@/visualization/landing/registry'
import type { LandingSceneDomainId, LandingSceneLayerId } from '@/visualization/landing/types'
import { useLandingDeliveries } from '@/visualization/landing/use-deliveries'
import { useWorkenOS } from '@/visualization/landing/use-worken-os'
import { getLandingShellPreviewStyle } from '@/visualization/landing/window-settings'

const ROLE_LAYER_LAYOUT_IDS = new Set<DomainShellSurfaceLayoutId>([
  'role-manager',
  'developer-studio',
])
const ROLE_LAYER_DOMAIN_IDS = new Set(['developer'])

const LANDING_DOMAINS = DOMAIN_MANIFESTS.map((domain) => ({
  id: domain.id,
  label: domain.title,
  icon: domain.icon,
  color: domain.accent.color,
  layerId: (ROLE_LAYER_LAYOUT_IDS.has(
    getShellSurfaceLayoutId(domain, domain.surfaces.defaultViewId),
  ) || ROLE_LAYER_DOMAIN_IDS.has(domain.id)
    ? 'roles'
    : 'business') as LandingSceneLayerId,
}))
type DomainId = (typeof LANDING_DOMAINS)[number]['id']
const landingScene = getLandingScene()

export default function Home() {
  return (
    <ShellThemeProvider>
      <WorkenMockRuntimeProvider>
        <HomeContent />
      </WorkenMockRuntimeProvider>
    </ShellThemeProvider>
  )
}

function HomeContent() {
  const LandingScene = landingScene.Component
  const { canAccessDomain, getDomainPermissions } = usePermissions()
  const { theme, toggle } = useShellTheme()
  const { sceneTraffic } = useWorkenMockRuntime()
  const { deliveries, handlePhaseEnd } = useLandingDeliveries()
  const { ref: stageRef } = useMouseTilt()
  const previewFrameRef = useRef<HTMLDivElement | null>(null)
  const layerSwitchRef = useRef<HTMLDivElement | null>(null)
  const businessLayerButtonRef = useRef<HTMLButtonElement | null>(null)
  const rolesLayerButtonRef = useRef<HTMLButtonElement | null>(null)
  const [layerIndicatorStyle, setLayerIndicatorStyle] = useState<{
    width: number
    offset: number
  } | null>(null)
  const [pendingInspectorTarget, setPendingInspectorTarget] = useState<{
    domainId: LandingSceneDomainId
    entityType: string
    entityId: string
  } | null>(null)
  const canSelectDomain = (domainId: DomainId) => canAccessDomain(domainId)
  const accessibleDomains = useMemo(
    () => LANDING_DOMAINS.filter((domain) => canSelectDomain(domain.id)),
    [canAccessDomain],
  )
  const roleDockDomains = useMemo(
    () => LANDING_DOMAINS.filter((domain) => domain.layerId === 'roles'),
    [],
  )
  const businessDockDomains = useMemo(
    () => LANDING_DOMAINS.filter((domain) => domain.layerId === 'business'),
    [],
  )
  const fallbackDomain = useMemo(() => {
    const writableDomain = accessibleDomains.find((domain) => {
      const permissions = getDomainPermissions(domain.id)
      if (!permissions?.accessible) return false

      if (Object.values(permissions.verbs).some(Boolean)) return true

      return Object.values(permissions.entities).some((entityPermissions) =>
        Object.values(entityPermissions.actions).some(Boolean),
      )
    })

    return writableDomain?.id ?? accessibleDomains[0]?.id ?? LANDING_DOMAINS[0]!.id
  }, [accessibleDomains, getDomainPermissions])
  const { activeDomain, selectDomain, shell, motion, dock } = useWorkenOS({
    fallbackDomain,
    visibleDomains: accessibleDomains.map((domain) => ({ id: domain.id, layerId: domain.layerId })),
    onShellFocus: () =>
      previewFrameRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      }),
  })

  const handleDomainSelect = (domainId: DomainId) => {
    if (!canSelectDomain(domainId)) return
    selectDomain(domainId)
  }
  const handlePacketSelect = useCallback(
    (target: { domainId: LandingSceneDomainId; entityType: string; entityId: string }) => {
      if (!canSelectDomain(target.domainId)) return

      if (activeDomain !== target.domainId) {
        setPendingInspectorTarget(target)
        selectDomain(target.domainId)
        return
      }

      openShellInspector({ entityType: target.entityType, id: target.entityId })
    },
    [activeDomain, canSelectDomain, selectDomain],
  )
  const activeDomainAccentColor =
    LANDING_DOMAINS.find((domain) => domain.id === activeDomain)?.color ?? LANDING_DOMAINS[0]!.color
  const shellPreviewStyle = getLandingShellPreviewStyle(motion.preset)
  const isShellFullscreen = shell.state === 'fullscreen'
  const syncLayerIndicator = useCallback(() => {
    const layerSwitch = layerSwitchRef.current
    const activeButton =
      dock.activeLayerId === 'business'
        ? businessLayerButtonRef.current
        : rolesLayerButtonRef.current
    if (!layerSwitch || !activeButton) return
    const switchRect = layerSwitch.getBoundingClientRect()
    const buttonRect = activeButton.getBoundingClientRect()
    setLayerIndicatorStyle({
      width: buttonRect.width,
      offset: buttonRect.left - switchRect.left,
    })
  }, [dock.activeLayerId])

  useLayoutEffect(() => {
    syncLayerIndicator()
  }, [syncLayerIndicator])

  useEffect(() => {
    const handleResize = () => {
      syncLayerIndicator()
    }
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [syncLayerIndicator])

  useEffect(() => {
    if (!pendingInspectorTarget || activeDomain !== pendingInspectorTarget.domainId) return

    const openInspectorTimeout = window.setTimeout(() => {
      openShellInspector({
        entityType: pendingInspectorTarget.entityType,
        id: pendingInspectorTarget.entityId,
      })
      setPendingInspectorTarget(null)
    }, 80)

    return () => {
      window.clearTimeout(openInspectorTimeout)
    }
  }, [activeDomain, pendingInspectorTarget])

  return (
    <main
      className="relative flex min-h-screen flex-col bg-(--bg-deep)"
      style={{ '--shell-preview-width': shellUiTokens.previewWidth } as CSSProperties}
    >
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div
          className="absolute top-1/4 left-1/4 h-[600px] w-[600px] rounded-full opacity-40 blur-[120px] animate-[blob-float_20s_ease-in-out_infinite]"
          style={{
            background:
              'radial-gradient(circle, rgba(34, 211, 238, 0.5) 0%, rgba(167, 139, 250, 0.3) 50%, transparent 70%)',
          }}
        />
        <div
          className="absolute right-1/4 bottom-1/4 h-[500px] w-[500px] rounded-full opacity-30 blur-[100px] animate-[blob-float-slow_25s_ease-in-out_infinite]"
          style={{
            background:
              'radial-gradient(circle, rgba(167, 139, 250, 0.5) 0%, rgba(52, 211, 153, 0.3) 50%, transparent 70%)',
          }}
        />
      </div>

      {/* Top bar */}
      <nav className="sticky top-0 z-50 shrink-0 border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-lg">
        <div
          className={cn(
            'mx-auto flex min-w-0 items-center justify-between px-4',
            shellUiTokens.topNavHeightClass,
            shellUiTokens.topNavMaxWidthClass,
          )}
        >
          <a href="/" className="flex shrink-0 items-center gap-2 md:gap-3">
            <div
              className="flex h-6 w-6 items-center justify-center rounded-md md:h-8 md:w-8 md:rounded-lg"
              style={{
                backgroundColor: 'var(--brand-solid, #7c6cf5)',
                backgroundImage:
                  'var(--brand-gradient, linear-gradient(135deg, #22d3ee 0%, #a78bfa 100%))',
              }}
            >
              <span className="text-xs font-bold text-white md:text-sm">W</span>
            </div>
            <span className="hidden text-sm font-semibold text-zinc-200 sm:block md:text-base">
              Worken OS
            </span>
          </a>

          <div className="ml-auto flex min-w-0 max-w-full items-center gap-0.5 overflow-x-auto rounded-lg border border-zinc-800/50 bg-zinc-900/50 p-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden md:gap-2 md:rounded-2xl md:p-2">
            <div className="relative h-7 shrink-0 md:h-10">
              <div
                className={cn(
                  'flex items-center gap-0.5 transition-all duration-300 ease-out',
                  dock.activeLayerId === 'roles'
                    ? 'relative translate-x-0 opacity-100'
                    : 'absolute inset-0 -translate-x-2 opacity-0 pointer-events-none',
                )}
              >
                {roleDockDomains.map((d) => {
                  const isActive = activeDomain === d.id
                  return (
                    <button
                      key={d.id}
                      onClick={() => handleDomainSelect(d.id)}
                      disabled={!canSelectDomain(d.id)}
                      className={cn(
                        'flex h-7 items-center gap-1.5 rounded-md border border-transparent px-2.5 text-xs transition-all md:h-10 md:gap-2.5 md:rounded-lg md:px-4 md:text-sm',
                        isActive ? 'font-medium shadow-sm' : 'text-zinc-500 hover:text-zinc-300',
                        !canSelectDomain(d.id) &&
                          'cursor-not-allowed opacity-45 hover:text-zinc-500',
                        dock.isLayerSwitching && 'duration-300',
                      )}
                      style={
                        isActive
                          ? {
                              color: d.color,
                              borderColor: withHexAlpha(d.color, '66'),
                              background: `linear-gradient(135deg, ${withHexAlpha(d.color, '2e')}, ${withHexAlpha(d.color, '12')})`,
                              boxShadow: `0 0 0 1px ${withHexAlpha(d.color, '2e')} inset`,
                            }
                          : undefined
                      }
                    >
                      <RoleIcon roleId={d.id} className="h-3.5 w-3.5 md:h-4 md:w-4" />
                      <span className="hidden sm:inline">{d.label}</span>
                    </button>
                  )
                })}
              </div>

              <div
                className={cn(
                  'flex items-center gap-0.5 transition-all duration-300 ease-out',
                  dock.activeLayerId === 'business'
                    ? 'relative translate-x-0 opacity-100'
                    : 'absolute inset-0 translate-x-2 opacity-0 pointer-events-none',
                )}
              >
                {businessDockDomains.map((d) => {
                  const isActive = activeDomain === d.id
                  return (
                    <button
                      key={d.id}
                      onClick={() => handleDomainSelect(d.id)}
                      disabled={!canSelectDomain(d.id)}
                      className={cn(
                        'flex h-7 items-center gap-1.5 rounded-md border border-transparent px-2.5 text-xs transition-all md:h-10 md:gap-2.5 md:rounded-lg md:px-4 md:text-sm',
                        isActive ? 'font-medium shadow-sm' : 'text-zinc-500 hover:text-zinc-300',
                        !canSelectDomain(d.id) &&
                          'cursor-not-allowed opacity-45 hover:text-zinc-500',
                        dock.isLayerSwitching && 'duration-300',
                      )}
                      style={
                        isActive
                          ? {
                              color: d.color,
                              borderColor: withHexAlpha(d.color, '66'),
                              background: `linear-gradient(135deg, ${withHexAlpha(d.color, '2e')}, ${withHexAlpha(d.color, '12')})`,
                              boxShadow: `0 0 0 1px ${withHexAlpha(d.color, '2e')} inset`,
                            }
                          : undefined
                      }
                    >
                      <RoleIcon roleId={d.id} className="h-3.5 w-3.5 md:h-4 md:w-4" />
                      <span className="hidden sm:inline">{d.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div
              ref={layerSwitchRef}
              className="relative flex shrink-0 items-center rounded-md border border-zinc-800/70 bg-zinc-950/80 p-0.5 md:rounded-xl md:p-1"
            >
              <div
                className="pointer-events-none absolute top-0.5 bottom-0.5 left-0 rounded-[5px] bg-zinc-800/80 transition-[transform,width] duration-300 ease-out md:top-1 md:bottom-1 md:rounded-lg"
                style={
                  layerIndicatorStyle
                    ? {
                        width: `${layerIndicatorStyle.width}px`,
                        transform: `translateX(${layerIndicatorStyle.offset}px)`,
                      }
                    : undefined
                }
              />
              <button
                ref={businessLayerButtonRef}
                type="button"
                onClick={() => dock.selectLayer('business')}
                className={cn(
                  'relative z-10 rounded-[5px] px-2 py-1 text-[10px] tracking-[0.2em] uppercase transition-colors duration-200 md:rounded-lg md:px-4 md:py-2 md:text-xs',
                  dock.activeLayerId === 'business'
                    ? 'text-zinc-200'
                    : 'text-zinc-500 hover:text-zinc-300',
                )}
              >
                Business
              </button>
              <button
                ref={rolesLayerButtonRef}
                type="button"
                onClick={() => dock.selectLayer('roles')}
                className={cn(
                  'relative z-10 rounded-[5px] px-2 py-1 text-[10px] tracking-[0.2em] uppercase transition-colors duration-200 md:rounded-lg md:px-4 md:py-2 md:text-xs',
                  dock.activeLayerId === 'roles'
                    ? 'text-zinc-200'
                    : 'text-zinc-500 hover:text-zinc-300',
                )}
              >
                Dev
              </button>
            </div>
          </div>
        </div>
      </nav>

      <Hero />

      {/* Shell preview */}
      <section
        className={cn(
          'relative flex shrink-0 flex-col items-center px-4 py-5',
          isShellFullscreen && 'fixed inset-0 z-50 px-0 py-0',
        )}
      >
        {isShellFullscreen ? (
          <div className="absolute inset-0 bg-(--bg-deep)" />
        ) : (
          <div
            className="pointer-events-none absolute left-1/2 top-0 h-[154px] w-[400px] -translate-x-1/2 rounded-full opacity-15 blur-3xl"
            style={{
              background: `radial-gradient(circle, ${activeDomainAccentColor}80, transparent 70%)`,
            }}
          />
        )}

        <div
          data-readme-shell-preview="shell"
          className={cn(
            'relative w-full overflow-hidden',
            isShellFullscreen ? 'h-dvh max-w-none' : 'max-w-(--shell-preview-width)',
          )}
          style={
            isShellFullscreen
              ? {
                  height: '100dvh',
                  opacity: 1,
                  pointerEvents: 'auto',
                  transform: 'none',
                  transition:
                    'height 500ms cubic-bezier(0.22, 1, 0.36, 1), opacity 300ms ease-out, transform 500ms cubic-bezier(0.22, 1, 0.36, 1)',
                }
              : shellPreviewStyle
          }
        >
          <div
            ref={previewFrameRef}
            className={cn(
              'isolate overflow-hidden border border-zinc-800/60 transition-opacity duration-300',
              isShellFullscreen
                ? 'h-dvh rounded-none shadow-none'
                : `${shellUiTokens.previewHeightClass} rounded-xl bg-(--bg-deep) shadow-2xl shadow-black/40 [clip-path:inset(0_round_0.75rem)]`,
            )}
          >
            <ShellPreview
              key={activeDomain}
              domainId={activeDomain}
              showChrome
              theme={theme}
              onToggleTheme={toggle}
              onRequestHide={shell.close}
              onToggleFullscreen={isShellFullscreen ? shell.exitFullscreen : shell.enterFullscreen}
              isFullscreen={isShellFullscreen}
            />
          </div>
        </div>
      </section>

      <section
        ref={stageRef}
        className="relative z-10 flex h-[560px] items-center justify-center overflow-hidden md:h-[660px]"
        style={{ perspective: '2000px' }}
      >
        <LandingScene
          activeDomainId={activeDomain}
          activeLayerId={dock.activeLayerId}
          isLayerSwitching={dock.isLayerSwitching}
          onDomainSelect={handleDomainSelect}
          onPacketSelect={handlePacketSelect}
          onDeliveryEnd={handlePhaseEnd}
          traffic={sceneTraffic}
          deliveries={deliveries}
          windowPreset={motion.preset}
        />
      </section>

      <div className="relative mb-3 text-center text-xs tracking-[0.2em] text-zinc-500 uppercase">
        AI native
      </div>
    </main>
  )
}
