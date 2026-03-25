/**
 * Evaluation context namespaces from Worken OS Semantic Protocol
 * (`docs/spec/semantic-protocol.md` — normative).
 *
 * - `actor` — subject attempting an action
 * - `object` — target instance
 * - `env` — runtime environment
 * - `time` — evaluation timestamp (ISO string or epoch ms)
 * - `input` — optional user-supplied action input
 */
export type EvaluationContext = {
  actor: Record<string, unknown>
  object: Record<string, unknown>
  env: Record<string, unknown>
  time: string | number
  input?: Record<string, unknown>
}

/** Semantic path like `object.status`, `actor.role`, `time`, `input.reason`. */
export type SemanticPath = string
