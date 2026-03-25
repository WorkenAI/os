import type { ProcessUiSurface, ProcessUiDefinition } from './types.js'
import type { StateId } from '../process/types.js'

function mergeSurfaces(
  base: readonly ProcessUiSurface[],
  overlay: readonly ProcessUiSurface[] | undefined,
): ProcessUiSurface[] {
  if (!overlay?.length) return [...base]
  const byMatch = new Map<string, ProcessUiSurface>()
  for (const s of base) {
    byMatch.set(s.matchStateId, s)
  }
  for (const s of overlay) {
    byMatch.set(s.matchStateId, s)
  }
  return [...byMatch.values()]
}

/**
 * Resolves the most specific surface for `stateId`: exact match, else `'*'`.
 */
export function resolveProcessSurface(
  surfaces: readonly ProcessUiSurface[],
  stateId: StateId,
): ProcessUiSurface | null {
  const exact = surfaces.find((s) => s.matchStateId === stateId)
  if (exact) return exact
  return surfaces.find((s) => s.matchStateId === '*') ?? null
}

export function resolveProcessSurfaceForRole(
  def: ProcessUiDefinition,
  stateId: StateId,
  role?: string | undefined,
): ProcessUiSurface | null {
  const base = def.surfaces
  const overlay = role ? def.byRole?.[role] : undefined
  const merged = mergeSurfaces(base, overlay)
  return resolveProcessSurface(merged, stateId)
}
