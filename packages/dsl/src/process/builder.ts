import type { BusinessProcessDefinition } from './types.js'

/** Identity helper — preserves literal types for exhaustive checks in app code. */
export function defineProcess<const T extends BusinessProcessDefinition>(process: T): T {
  return process
}
