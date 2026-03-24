import type { ComponentType, CSSProperties } from 'react'
import type {
  LandingDelivery,
  LandingDeliveryPhase,
  LandingSceneDomainId,
  LandingSceneLayerId,
  LandingMotionPreset,
  LandingSceneTraffic,
} from '@worken/demo/landing-scene-types'

export type {
  LandingDelivery,
  LandingDeliveryItem,
  LandingDeliveryPhase,
  LandingSceneDomainId,
  LandingSceneLayerId,
  LandingMotionPreset,
  LandingSceneTraffic,
  LandingSceneTrafficPacket,
} from '@worken/demo/landing-scene-types'

export type LandingSceneWindowStyle = Pick<
  CSSProperties,
  'contain' | 'filter' | 'perspective' | 'transform' | 'transformOrigin' | 'transition'
>
export type LandingShellPreviewStyle = Pick<
  CSSProperties,
  'height' | 'opacity' | 'pointerEvents' | 'transform' | 'transition'
>

export type LandingSceneProps = {
  activeDomainId?: LandingSceneDomainId
  activeLayerId?: LandingSceneLayerId
  isLayerSwitching?: boolean
  onDomainSelect?: (domainId: LandingSceneDomainId) => void
  onPacketSelect?: (target: {
    domainId: LandingSceneDomainId
    entityType: string
    entityId: string
  }) => void
  onDeliveryEnd?: (domainId: LandingSceneDomainId, phase: LandingDeliveryPhase) => void
  windowPreset?: LandingMotionPreset
  traffic?: LandingSceneTraffic
  deliveries?: LandingDelivery[]
}

export type LandingSceneDefinition = {
  id: string
  title: string
  Component: ComponentType<LandingSceneProps>
}
