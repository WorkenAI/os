import type {
  LandingMotionPreset,
  LandingSceneWindowStyle,
  LandingShellPreviewStyle,
} from './types'

const LANDING_MOTION_TIMINGS = {
  reopenSettleDelayMs: 760,
} as const

const LANDING_SCENE_WINDOW_STYLES: Record<LandingMotionPreset, LandingSceneWindowStyle> = {
  'shell-open': {
    perspective: '500px',
    transform: 'rotateX(55deg) translateY(30%) scale(1)',
    transformOrigin: 'center top',
    transition: 'transform 600ms cubic-bezier(0.22, 1, 0.36, 1), filter 600ms ease-out',
    contain: 'layout paint',
    filter: 'saturate(1) brightness(1)',
  },
  'shell-closed': {
    perspective: '500px',
    transform: 'rotateX(18deg) translateY(8%) scale(1.04)',
    transformOrigin: 'center top',
    transition: 'transform 600ms cubic-bezier(0.22, 1, 0.36, 1), filter 600ms ease-out',
    contain: 'layout paint',
    filter: 'saturate(1.08) brightness(1.04)',
  },
  'shell-reopening': {
    perspective: '500px',
    transform: 'rotateX(72deg) translateY(18%) scale(0.98)',
    transformOrigin: 'center top',
    transition: 'transform 680ms cubic-bezier(0.22, 1, 0.36, 1), filter 680ms ease-out',
    contain: 'layout paint',
    filter: 'saturate(1.02) brightness(0.98)',
  },
}

const LANDING_SHELL_PREVIEW_STYLES: Record<LandingMotionPreset, LandingShellPreviewStyle> = {
  'shell-open': {
    height: '600px',
    opacity: 1,
    pointerEvents: 'auto',
    transform: 'translateY(0) scale(1)',
    transition:
      'height 500ms cubic-bezier(0.22, 1, 0.36, 1), opacity 300ms ease-out, transform 500ms cubic-bezier(0.22, 1, 0.36, 1)',
  },
  'shell-closed': {
    height: '0px',
    opacity: 0,
    pointerEvents: 'none',
    transform: 'translateY(-32px) scale(0.96)',
    transition:
      'height 500ms cubic-bezier(0.22, 1, 0.36, 1), opacity 220ms ease-out, transform 500ms cubic-bezier(0.22, 1, 0.36, 1)',
  },
  'shell-reopening': {
    height: '600px',
    opacity: 1,
    pointerEvents: 'auto',
    transform: 'translateY(10px) scale(0.985)',
    transition:
      'height 680ms cubic-bezier(0.22, 1, 0.36, 1), opacity 360ms ease-out, transform 680ms cubic-bezier(0.22, 1, 0.36, 1)',
  },
}

export function getLandingSceneWindowStyle(
  preset: LandingMotionPreset = 'shell-open',
): LandingSceneWindowStyle {
  return LANDING_SCENE_WINDOW_STYLES[preset]
}

export function getLandingShellPreviewStyle(
  preset: LandingMotionPreset = 'shell-open',
): LandingShellPreviewStyle {
  return LANDING_SHELL_PREVIEW_STYLES[preset]
}

export function getLandingMotionTimings() {
  return LANDING_MOTION_TIMINGS
}
