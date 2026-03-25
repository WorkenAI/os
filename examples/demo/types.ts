/** Minimal shapes for landing traffic/deliveries — mirrors web-shell visualization types without app coupling. */

export type LandingDeliveryItem = {
  id: string
  label: string
  entityType: string
  entityId: string
}

export type LandingSceneTrafficPacket = {
  id: string
  label: string
  route: string
  delayMs: number
  accent: string
}

export type LandingSceneTraffic = {
  rolePackets: LandingSceneTrafficPacket[]
}
