import type { ProcessId, StateId } from '../process/types.js'

/**
 * Mirrors shell view kinds without importing app code.
 * Extend via declaration merging in consumers if needed.
 */
export type UiViewKind =
  | 'dashboard'
  | 'table'
  | 'board'
  | 'analytics'
  | 'list'
  | 'detail'
  | 'local'

export type UiWidgetRegion = 'header' | 'primary' | 'secondary' | 'rail' | 'footer'

export type UiWidgetRef = {
  id: string
  region: UiWidgetRegion
  /** Optional ordering within the region. */
  order?: number
}

/**
 * Presentation layer for one process state (or wildcard).
 * `matchStateId: '*'` is the fallback when no exact state match exists.
 */
export type ProcessUiSurface = {
  matchStateId: StateId | '*'
  title?: string
  view: {
    kind: UiViewKind
    /** Spec id resolved by the host renderer (e.g. domain specs). */
    specId?: string
    /** Entity id for table/board/list contexts. */
    entityId?: string
  }
  /** Shell layout hint — host maps to concrete surfaces. */
  layoutId?: string
  widgets?: readonly UiWidgetRef[]
}

export type RoleId = string

/**
 * UI bindings for a single process. Keep process data (`BusinessProcessDefinition`)
 * separate from this object so the same process can ship with multiple skins / roles.
 */
export type ProcessUiDefinition = {
  processId: ProcessId
  surfaces: readonly ProcessUiSurface[]
  /**
   * Optional per-role overrides: merge order base surfaces → role surfaces (later wins).
   */
  byRole?: Partial<Record<RoleId, readonly ProcessUiSurface[]>>
}
