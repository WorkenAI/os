import type { ProcessDomainBridge } from './types.js'
import type { StateId } from '../process/types.js'

export function resolveDomainViewId(
  bridge: ProcessDomainBridge,
  stateId: StateId,
): string | null {
  const direct = bridge.stateToViewId?.[stateId]
  if (direct) return direct
  return bridge.fallbackViewId ?? null
}
