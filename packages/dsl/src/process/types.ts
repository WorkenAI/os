/** Stable identifier for a business process (slug). */
export type ProcessId = string

/** State / activity node inside a process graph. */
export type StateId = string

/** Named trigger users or systems emit to move the process. */
export type EventId = string

export type ActorId = string

export type ProcessNodeKind = 'task' | 'gateway' | 'wait' | 'terminal'

/**
 * One node in the process graph. Gateways can fan out; tasks are work units;
 * terminal nodes end the flow.
 */
export type ProcessNode = {
  id: StateId
  kind: ProcessNodeKind
  label: string
  description?: string
  /** Free-form tag for analytics, automation, or UI defaults. */
  tag?: string
  /** Optional swimlane / responsibility. */
  actor?: ActorId
}

export type ProcessTransition = {
  id: string
  from: StateId
  to: StateId
  /** Event that selects this edge when multiple edges leave `from`. */
  on?: EventId
  label?: string
}

export type ProcessEventDefinition = {
  id: EventId
  label: string
  description?: string
}

/**
 * Declarative BPMN-lite graph: nodes + transitions + event vocabulary.
 * Runtime engines map `EventId` → side effects; this package stays pure data.
 */
export type BusinessProcessDefinition = {
  id: ProcessId
  /** Semver or opaque version string for migrations. */
  version: string
  title: string
  description?: string
  /** Entry state — must exist in `nodes`. */
  initial: StateId
  nodes: Record<StateId, ProcessNode>
  transitions: readonly ProcessTransition[]
  events: Record<EventId, ProcessEventDefinition>
  /** Named actors for swimlanes / permissions overlays. */
  actors?: Record<ActorId, { label: string; description?: string }>
}
