import type { DataBindingPlan } from '@worken/dsl'
import type { ProcessNodeKind } from '@worken/dsl'
import type { UiViewKind } from '@worken/dsl'
import type { UiWidgetRegion } from '@worken/dsl'

export type WorkenAppProcessState = {
  kind: ProcessNodeKind
  label: string
  description?: string
  tag?: string
  actor?: string
}

export type WorkenAppProcessEvent = {
  label: string
  description?: string
}

export type WorkenAppTransition = {
  id: string
  from: string
  to: string
  /** Required when more than one transition leaves `from`. */
  on?: string
  label?: string
}

export type WorkenAppUiSurface = {
  matchStateId: string | '*'
  title?: string
  view: {
    kind: UiViewKind
    specId?: string
    entityId?: string
  }
  layoutId?: string
  widgets?: ReadonlyArray<{ id: string; region: UiWidgetRegion; order?: number }>
}

/**
 * One business process: nested states/events/transitions + UI + optional shell bridge.
 * `id` must equal the key under {@link WorkenAppDefinition.processes}.
 */
export type WorkenAppProcess = {
  id: string
  version: string
  title: string
  description?: string
  initial: string
  actors?: Record<string, { label: string; description?: string }>
  states: Record<string, WorkenAppProcessState>
  events: Record<string, WorkenAppProcessEvent>
  transitions: readonly WorkenAppTransition[]
  ui: {
    surfaces: readonly WorkenAppUiSurface[]
    byRole?: Partial<Record<string, readonly WorkenAppUiSurface[]>>
  }
  bridge?: {
    domainId: string
    stateToViewId?: Partial<Record<string, string>>
    fallbackViewId?: string
  }
  /** Default data-binding plan for this process (optional). */
  bindings?: DataBindingPlan
}

/**
 * Single entry root: one workspace bundles named processes.
 * This is the only shape authors should hand-write (tsops-style single module).
 */
export type WorkenAppDefinition = {
  id: string
  title: string
  version?: string
  processes: Record<string, WorkenAppProcess>
}
