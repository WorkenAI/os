import type { ProcessId, StateId } from '../process/types.js'

export type DomainId = string

/** View id in a shell domain manifest (`DomainDefinition.views`). */
export type DomainViewId = string

/**
 * Links a DSL process to an existing shell domain so hosts can route
 * `stateId` → `/shell/:domain/:view` without hardcoding in UI components.
 */
export type ProcessDomainBridge = {
  processId: ProcessId
  domainId: DomainId
  /** When set, overrides `ProcessUiDefinition` for view routing. */
  stateToViewId?: Partial<Record<StateId, DomainViewId>>
  /** Default domain view when state has no mapping. */
  fallbackViewId?: DomainViewId
}

export type WorkspaceDomainBridge = {
  /** Map process id → shell domain wiring. */
  processes: Record<ProcessId, ProcessDomainBridge>
}
