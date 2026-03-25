import type { SemanticPath } from '../semantic/types.js'

/**
 * Maps a semantic path into `Spec.state` (JSON Pointer, RFC 6901).
 * Use for denormalized / derived fields (e.g. copy `object.title` to `/surface/headerTitle`).
 */
export type DataBindingRule = {
  /** Source path (`object.ownerId`, `actor.role`, …). */
  from: SemanticPath
  /** Target JSON Pointer — must start with `/`. */
  to: string
  /** When the source resolves to `undefined`, write this instead (optional). */
  ifUndefined?: unknown
}

export type DataBindingPlan = {
  rules: readonly DataBindingRule[]
}
