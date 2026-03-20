import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { LandingMotionPreset, LandingSceneDomainId, LandingSceneLayerId } from './types'
import { getLandingMotionTimings } from './window-settings'

type ShellState = 'open' | 'closed' | 'fullscreen'
type DockLayerTransitionState = 'idle' | 'switching'

type LandingDomainDescriptor = {
  id: LandingSceneDomainId
  layerId: LandingSceneLayerId
}

type UseWorkenOSOptions = {
  fallbackDomain: LandingSceneDomainId
  visibleDomains: LandingDomainDescriptor[]
  onShellFocus?: () => void
}

function getDomainLayerId(
  domainId: LandingSceneDomainId,
  domainLayerById: Map<LandingSceneDomainId, LandingSceneLayerId>,
): LandingSceneLayerId {
  return domainLayerById.get(domainId) ?? 'business'
}

function findFirstVisibleDomainInLayer(
  visibleDomains: LandingDomainDescriptor[],
  layerId: LandingSceneLayerId,
): LandingSceneDomainId | null {
  return visibleDomains.find((domain) => domain.layerId === layerId)?.id ?? null
}

function useStableTimers() {
  const resetWindowPresetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const resetDockLayerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimers = useCallback(() => {
    if (resetWindowPresetTimeoutRef.current) {
      clearTimeout(resetWindowPresetTimeoutRef.current)
      resetWindowPresetTimeoutRef.current = null
    }
    if (resetDockLayerTimeoutRef.current) {
      clearTimeout(resetDockLayerTimeoutRef.current)
      resetDockLayerTimeoutRef.current = null
    }
  }, [])

  useEffect(() => clearTimers, [clearTimers])

  return { clearTimers, resetDockLayerTimeoutRef, resetWindowPresetTimeoutRef }
}

export function useWorkenOS({ fallbackDomain, visibleDomains, onShellFocus }: UseWorkenOSOptions) {
  const domainLayerById = useMemo(
    () => new Map(visibleDomains.map((domain) => [domain.id, domain.layerId])),
    [visibleDomains],
  )
  const visibleDomainIds = useMemo(
    () => visibleDomains.map((domain) => domain.id),
    [visibleDomains],
  )
  const visibleDomainsByLayer = useMemo(
    () => ({
      roles: visibleDomains
        .filter((domain) => domain.layerId === 'roles')
        .map((domain) => domain.id),
      business: visibleDomains
        .filter((domain) => domain.layerId === 'business')
        .map((domain) => domain.id),
    }),
    [visibleDomains],
  )
  const visibleDomainIdSet = useMemo(() => new Set(visibleDomainIds), [visibleDomainIds])
  const motionTimings = useMemo(() => getLandingMotionTimings(), [])
  const [activeLayerId, setActiveLayerId] = useState<LandingSceneLayerId>(() =>
    getDomainLayerId(fallbackDomain, domainLayerById),
  )
  const [activeDomain, setActiveDomain] = useState<LandingSceneDomainId>(fallbackDomain)
  const [shellState, setShellState] = useState<ShellState>('open')
  const [motionPreset, setMotionPreset] = useState<LandingMotionPreset>('shell-open')
  const [dockLayerTransitionState, setDockLayerTransitionState] =
    useState<DockLayerTransitionState>('idle')
  const { clearTimers, resetDockLayerTimeoutRef, resetWindowPresetTimeoutRef } = useStableTimers()
  const lastActiveDomainByLayerRef = useRef<
    Record<LandingSceneLayerId, LandingSceneDomainId | null>
  >({
    roles: null,
    business: null,
  })

  useEffect(() => {
    if (!visibleDomainIdSet.has(activeDomain)) {
      setActiveDomain(fallbackDomain)
      setActiveLayerId(getDomainLayerId(fallbackDomain, domainLayerById))
    }
  }, [activeDomain, domainLayerById, fallbackDomain, visibleDomainIdSet])

  useEffect(() => {
    const resolvedLayerId = getDomainLayerId(activeDomain, domainLayerById)
    setActiveLayerId((currentLayerId) =>
      currentLayerId === resolvedLayerId ? currentLayerId : resolvedLayerId,
    )
    lastActiveDomainByLayerRef.current[resolvedLayerId] = activeDomain
  }, [activeDomain, domainLayerById])

  const closeShell = useCallback(() => {
    clearTimers()
    setShellState('closed')
    setMotionPreset('shell-closed')
  }, [clearTimers])

  const openShell = useCallback(() => {
    clearTimers()
    setShellState('open')
    setMotionPreset('shell-open')
    onShellFocus?.()
  }, [clearTimers, onShellFocus])

  const enterFullscreen = useCallback(() => {
    clearTimers()
    setShellState('fullscreen')
    setMotionPreset('shell-open')
    onShellFocus?.()
  }, [clearTimers, onShellFocus])

  const exitFullscreen = useCallback(() => {
    clearTimers()
    setShellState('open')
    setMotionPreset('shell-open')
    onShellFocus?.()
  }, [clearTimers, onShellFocus])

  const selectDomain = useCallback(
    (domainId: LandingSceneDomainId) => {
      if (!visibleDomainIdSet.has(domainId)) return

      const nextLayerId = getDomainLayerId(domainId, domainLayerById)
      if (nextLayerId !== activeLayerId) {
        setActiveLayerId(nextLayerId)
        setDockLayerTransitionState('switching')
        resetDockLayerTimeoutRef.current = setTimeout(() => {
          setDockLayerTransitionState('idle')
        }, motionTimings.reopenSettleDelayMs)
      }
      lastActiveDomainByLayerRef.current[nextLayerId] = domainId
      setActiveDomain(domainId)

      if (shellState === 'closed') {
        clearTimers()
        setMotionPreset('shell-reopening')
        setShellState('open')
        onShellFocus?.()

        resetWindowPresetTimeoutRef.current = setTimeout(() => {
          setMotionPreset('shell-open')
        }, motionTimings.reopenSettleDelayMs)

        return
      }

      onShellFocus?.()
    },
    [
      clearTimers,
      domainLayerById,
      activeLayerId,
      onShellFocus,
      motionTimings,
      resetDockLayerTimeoutRef,
      resetWindowPresetTimeoutRef,
      shellState,
      visibleDomainIdSet,
    ],
  )

  const selectLayer = useCallback(
    (layerId: LandingSceneLayerId) => {
      if (layerId === activeLayerId) return

      const rememberedDomainId = lastActiveDomainByLayerRef.current[layerId]
      const fallbackLayerDomainId = findFirstVisibleDomainInLayer(visibleDomains, layerId)
      const nextDomainId =
        rememberedDomainId &&
        visibleDomainIdSet.has(rememberedDomainId) &&
        getDomainLayerId(rememberedDomainId, domainLayerById) === layerId
          ? rememberedDomainId
          : fallbackLayerDomainId
      if (!nextDomainId) return

      clearTimers()
      setActiveLayerId(layerId)
      setActiveDomain(nextDomainId)
      setDockLayerTransitionState('switching')
      resetDockLayerTimeoutRef.current = setTimeout(() => {
        setDockLayerTransitionState('idle')
      }, motionTimings.reopenSettleDelayMs)
      lastActiveDomainByLayerRef.current[layerId] = nextDomainId

      if (shellState === 'closed') {
        setMotionPreset('shell-reopening')
        setShellState('open')
        onShellFocus?.()

        resetWindowPresetTimeoutRef.current = setTimeout(() => {
          setMotionPreset('shell-open')
        }, motionTimings.reopenSettleDelayMs)

        return
      }

      onShellFocus?.()
    },
    [
      activeLayerId,
      clearTimers,
      domainLayerById,
      motionTimings,
      onShellFocus,
      resetDockLayerTimeoutRef,
      resetWindowPresetTimeoutRef,
      shellState,
      visibleDomainIdSet,
      visibleDomains,
    ],
  )

  return {
    activeDomain,
    selectDomain,
    shell: {
      state: shellState,
      close: closeShell,
      open: openShell,
      enterFullscreen,
      exitFullscreen,
    },
    motion: {
      preset: motionPreset,
    },
    dock: {
      activeLayerId,
      isLayerSwitching: dockLayerTransitionState === 'switching',
      selectLayer,
      visibleDomainsByLayer,
    },
  }
}
