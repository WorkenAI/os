import { assign, setup } from 'xstate'
import { DOMAIN_IDS } from '@worken/ir/domains/registry'

import type { LandingMotionPreset, LandingSceneDomainId, LandingSceneLayerId } from './types'

type ShellState = 'open' | 'closed' | 'fullscreen'
type DockLayerTransitionState = 'idle' | 'switching'

export type LandingWorkenOsContext = {
  activeDomainId: LandingSceneDomainId
  activeLayerId: LandingSceneLayerId
  shellState: ShellState
  motionPreset: LandingMotionPreset
  dockLayerTransitionState: DockLayerTransitionState
  lastActiveDomainByLayer: Record<LandingSceneLayerId, LandingSceneDomainId | null>
}

export type LandingWorkenOsEvent =
  | { type: 'domain.apply'; domainId: LandingSceneDomainId; activeLayerId: LandingSceneLayerId }
  | { type: 'layer.apply'; activeLayerId: LandingSceneLayerId; domainId: LandingSceneDomainId }
  | { type: 'dock.transition'; state: DockLayerTransitionState }
  | { type: 'shell.set'; shellState: ShellState; motionPreset: LandingMotionPreset }
  | { type: 'motion.set'; motionPreset: LandingMotionPreset }
  | { type: 'lastActive.remember'; layerId: LandingSceneLayerId; domainId: LandingSceneDomainId }
  | {
      type: 'visibleDomains.sync'
      fallbackDomain: LandingSceneDomainId
      layerId: LandingSceneLayerId
    }

export const landingWorkenOsMachine = setup({
  types: {
    context: {} as LandingWorkenOsContext,
    events: {} as LandingWorkenOsEvent,
  },
  actions: {
    applyDomain: assign(({ event }) => {
      if (event.type !== 'domain.apply') return {}
      return {
        activeDomainId: event.domainId,
        activeLayerId: event.activeLayerId,
      }
    }),
    applyLayer: assign(({ event }) => {
      if (event.type !== 'layer.apply') return {}
      return {
        activeLayerId: event.activeLayerId,
        activeDomainId: event.domainId,
      }
    }),
    setDockTransition: assign(({ event }) => {
      if (event.type !== 'dock.transition') return {}
      return { dockLayerTransitionState: event.state }
    }),
    setShell: assign(({ event }) => {
      if (event.type !== 'shell.set') return {}
      return { shellState: event.shellState, motionPreset: event.motionPreset }
    }),
    setMotionOnly: assign(({ event }) => {
      if (event.type !== 'motion.set') return {}
      return { motionPreset: event.motionPreset }
    }),
    rememberLayerDomain: assign(({ context, event }) => {
      if (event.type !== 'lastActive.remember') return {}
      return {
        lastActiveDomainByLayer: {
          ...context.lastActiveDomainByLayer,
          [event.layerId]: event.domainId,
        },
      }
    }),
    syncFallbackDomain: assign(({ context, event }) => {
      if (event.type !== 'visibleDomains.sync') return {}
      return {
        activeDomainId: event.fallbackDomain,
        activeLayerId: event.layerId,
        lastActiveDomainByLayer: {
          ...context.lastActiveDomainByLayer,
          [event.layerId]: event.fallbackDomain,
        },
      }
    }),
  },
}).createMachine({
  id: 'landingWorkenOs',
  initial: 'ready',
  context: {
    activeDomainId: DOMAIN_IDS[0] as LandingSceneDomainId,
    activeLayerId: 'roles',
    shellState: 'open',
    motionPreset: 'shell-open',
    dockLayerTransitionState: 'idle',
    lastActiveDomainByLayer: { roles: null, business: null },
  },
  states: {
    ready: {
      on: {
        'domain.apply': {
          actions: {
            type: 'applyDomain',
            params: ({ event }) => ({
              domainId: event.domainId,
              activeLayerId: event.activeLayerId,
            }),
          },
        },
        'layer.apply': {
          actions: {
            type: 'applyLayer',
            params: ({ event }) => ({
              domainId: event.domainId,
              activeLayerId: event.activeLayerId,
            }),
          },
        },
        'dock.transition': {
          actions: {
            type: 'setDockTransition',
            params: ({ event }) => ({ state: event.state }),
          },
        },
        'shell.set': {
          actions: {
            type: 'setShell',
            params: ({ event }) => ({
              shellState: event.shellState,
              motionPreset: event.motionPreset,
            }),
          },
        },
        'motion.set': {
          actions: {
            type: 'setMotionOnly',
            params: ({ event }) => ({ motionPreset: event.motionPreset }),
          },
        },
        'lastActive.remember': {
          actions: {
            type: 'rememberLayerDomain',
            params: ({ event }) => ({
              layerId: event.layerId,
              domainId: event.domainId,
            }),
          },
        },
        'visibleDomains.sync': {
          actions: {
            type: 'syncFallbackDomain',
            params: ({ event }) => ({
              fallbackDomain: event.fallbackDomain,
              layerId: event.layerId,
            }),
          },
        },
      },
    },
  },
})
