import { DOMAIN_IDS } from '@worken/ir/domains/registry'

export type LandingSceneDomainId = (typeof DOMAIN_IDS)[number]
export type LandingSceneLayerId = 'roles' | 'business'
export type LandingMotionPreset = 'shell-open' | 'shell-closed' | 'shell-reopening'

export type LandingSceneTrafficPacket = {
  id: string
  label: string
  route: string
  delayMs: number
  accent: string
}

export type LandingDeliveryItem = {
  id: string
  label: string
  entityType: string
  entityId: string
}

export type LandingDeliveryPhase = 'idle' | 'fetching' | 'delivering' | 'scored'

export type LandingDelivery = {
  domainId: LandingSceneDomainId
  item: LandingDeliveryItem
  phase: LandingDeliveryPhase
  animKey: number
  route: string
  accent: string
  scoreLabel: string
}

export type LandingSceneTraffic = {
  rolePackets: LandingSceneTrafficPacket[]
}
