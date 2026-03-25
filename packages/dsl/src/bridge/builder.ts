import type { ProcessDomainBridge, WorkspaceDomainBridge } from './types.js'

export function defineProcessDomainBridge<const T extends ProcessDomainBridge>(bridge: T): T {
  return bridge
}

export function defineWorkspaceDomainBridge<const T extends WorkspaceDomainBridge>(bridge: T): T {
  return bridge
}
