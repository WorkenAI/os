import type { WorkenActorRef } from './contract.js'

/**
 * One unit of work surfaced by the **process manager** (web-shell + cli-shell).
 * Same logical item MUST reconcile with the same {@link workItemId} (idempotent list / upsert).
 */
export type WorkItem = {
  /** Stable id for this item — deterministic from process instance + step or explicit idempotency scope. */
  workItemId: string
  /**
   * Optional key when the id is internal but an external system supplies its own idempotency key
   * (imports, webhooks, agent retries).
   */
  idempotencyKey?: string
  processId: string
  processInstanceId: string
  stateId: string
  /** Human-readable title for lists (from definition or instance payload). */
  title: string
  /**
   * Who is responsible — human, AI, or system actor. Same shape as {@link WorkenActorRef}
   * so it aligns with session / semantic `actor`.
   */
  assignee: WorkenActorRef
  /** ISO 8601 — last mutation relevant to the manager view. */
  updatedAt: string
  /** ISO 8601 — when the instance was created. */
  createdAt: string
}

export type WorkItemListFilter = {
  /** Limit to one process definition id. */
  processId?: string
  /** Limit to assignee actor id (human, agent id, or system id). */
  assigneeActorId?: string
  /** Limit to current state id. */
  stateId?: string
}
