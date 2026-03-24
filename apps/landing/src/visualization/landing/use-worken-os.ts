import { useMachine } from '@xstate/react'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import type { LandingMotionPreset, LandingSceneDomainId, LandingSceneLayerId } from './types'
import { landingWorkenOsMachine } from './landing-worken-os-machine'
import { getLandingMotionTimings } from './window-settings'

type ShellState = 'open' | 'closed' | 'fullscreen'

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
  const [snapshot, send] = useMachine(landingWorkenOsMachine)

  const activeDomain = snapshot.context.activeDomainId
  const activeLayerId = snapshot.context.activeLayerId
  const shellState = snapshot.context.shellState
  const motionPreset = snapshot.context.motionPreset
  const dockLayerTransitionState = snapshot.context.dockLayerTransitionState
  const lastActiveDomainByLayerRef = useRef(snapshot.context.lastActiveDomainByLayer)

  lastActiveDomainByLayerRef.current = snapshot.context.lastActiveDomainByLayer

  const { clearTimers, resetDockLayerTimeoutRef, resetWindowPresetTimeoutRef } = useStableTimers()

  useEffect(() => {
    if (!visibleDomainIdSet.has(activeDomain)) {
      const layerId = getDomainLayerId(fallbackDomain, domainLayerById)
      send({
        type: 'visibleDomains.sync',
        fallbackDomain,
        layerId,
      })
    }
  }, [activeDomain, domainLayerById, fallbackDomain, send, visibleDomainIdSet])

  useEffect(() => {
    const resolvedLayerId = getDomainLayerId(activeDomain, domainLayerById)
    send({
      type: 'lastActive.remember',
      layerId: resolvedLayerId,
      domainId: activeDomain,
    })
  }, [activeDomain, domainLayerById, send])

  const closeShell = useCallback(() => {
    clearTimers()
    send({ type: 'shell.set', shellState: 'closed', motionPreset: 'shell-closed' })
  }, [clearTimers, send])

  const openShell = useCallback(() => {
    clearTimers()
    send({ type: 'shell.set', shellState: 'open', motionPreset: 'shell-open' })
    onShellFocus?.()
  }, [clearTimers, onShellFocus, send])

  const enterFullscreen = useCallback(() => {
    clearTimers()
    send({ type: 'shell.set', shellState: 'fullscreen', motionPreset: 'shell-open' })
    onShellFocus?.()
  }, [clearTimers, onShellFocus, send])

  const exitFullscreen = useCallback(() => {
    clearTimers()
    send({ type: 'shell.set', shellState: 'open', motionPreset: 'shell-open' })
    onShellFocus?.()
  }, [clearTimers, onShellFocus, send])

  const selectDomain = useCallback(
    (domainId: LandingSceneDomainId) => {
      if (!visibleDomainIdSet.has(domainId)) return

      const nextLayerId = getDomainLayerId(domainId, domainLayerById)
      send({ type: 'domain.apply', domainId, activeLayerId: nextLayerId })
      if (nextLayerId !== activeLayerId) {
        send({ type: 'dock.transition', state: 'switching' })
        resetDockLayerTimeoutRef.current = setTimeout(() => {
          send({ type: 'dock.transition', state: 'idle' })
        }, motionTimings.reopenSettleDelayMs)
      }
      send({ type: 'lastActive.remember', layerId: nextLayerId, domainId })

      if (shellState === 'closed') {
        clearTimers()
        send({ type: 'shell.set', shellState: 'open', motionPreset: 'shell-reopening' })
        onShellFocus?.()

        resetWindowPresetTimeoutRef.current = setTimeout(() => {
          send({ type: 'motion.set', motionPreset: 'shell-open' })
        }, motionTimings.reopenSettleDelayMs)

        return
      }

      onShellFocus?.()
    },
    [
      activeLayerId,
      clearTimers,
      domainLayerById,
      motionTimings.reopenSettleDelayMs,
      onShellFocus,
      resetDockLayerTimeoutRef,
      resetWindowPresetTimeoutRef,
      send,
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
      send({ type: 'layer.apply', activeLayerId: layerId, domainId: nextDomainId })
      send({ type: 'dock.transition', state: 'switching' })
      resetDockLayerTimeoutRef.current = setTimeout(() => {
        send({ type: 'dock.transition', state: 'idle' })
      }, motionTimings.reopenSettleDelayMs)
      send({ type: 'lastActive.remember', layerId, domainId: nextDomainId })

      if (shellState === 'closed') {
        send({ type: 'shell.set', shellState: 'open', motionPreset: 'shell-reopening' })
        onShellFocus?.()

        resetWindowPresetTimeoutRef.current = setTimeout(() => {
          send({ type: 'motion.set', motionPreset: 'shell-open' })
        }, motionTimings.reopenSettleDelayMs)

        return
      }

      onShellFocus?.()
    },
    [
      activeLayerId,
      clearTimers,
      domainLayerById,
      motionTimings.reopenSettleDelayMs,
      onShellFocus,
      resetDockLayerTimeoutRef,
      resetWindowPresetTimeoutRef,
      send,
      shellState,
      visibleDomainIdSet,
      visibleDomains,
    ],
  )

  return {
    activeDomain,
    selectDomain,
    shell: {
      state: shellState as ShellState,
      close: closeShell,
      open: openShell,
      enterFullscreen,
      exitFullscreen,
    },
    motion: {
      preset: motionPreset as LandingMotionPreset,
    },
    dock: {
      activeLayerId,
      isLayerSwitching: dockLayerTransitionState === 'switching',
      selectLayer,
      visibleDomainsByLayer,
    },
  }
}
