import type { SemanticIR, SurfaceIRNode } from '@worken/semantic-ir'
import type { DomainDefinition, DomainShellSurfaceLayoutId } from '@/domains/types'

const WEB_SHELL = 'web-shell'

/**
 * Semantic IR → Web Shell: surfaces authored with `projectionTarget === "web-shell"`
 * can drive the shell layout registry. This is the bridge between **Semantic Protocol
 * projections** (docs/spec/semantic-protocol.md) and the **Next.js shell** runtime
 * (`surface-registry`).
 */
export function getWebShellSurfaces(ir: SemanticIR): SurfaceIRNode[] {
  return Object.values(ir.surfaces).filter((s) => s.projectionTarget === WEB_SHELL)
}

export function resolveShellLayoutFromIr(
  ir: SemanticIR,
  surfaceId: string | null | undefined,
): DomainShellSurfaceLayoutId | null {
  if (!surfaceId) return null
  const s = ir.surfaces[surfaceId]
  if (!s || s.projectionTarget !== WEB_SHELL) return null
  const id = s.shellLayoutId
  if (typeof id !== 'string' || id.length === 0) return null
  return id as DomainShellSurfaceLayoutId
}

/**
 * If the active domain view's `specId` matches a Semantic IR surface id for `web-shell`,
 * return that surface's `shellLayoutId` for the shell registry.
 */
export function resolveShellLayoutFromDomainViewAndIr(
  ir: SemanticIR | null | undefined,
  domain: DomainDefinition,
  viewId: string | null | undefined,
): DomainShellSurfaceLayoutId | null {
  if (!ir || !viewId) return null
  const specId = domain.views[viewId]?.specId
  return resolveShellLayoutFromIr(ir, specId ?? undefined)
}
