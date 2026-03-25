import type { DataBindingPlan } from '@worken/dsl'
import type { WorkenOsSession } from '@/lib/worken-os-contract'
import type { PermissionSnapshot } from '@/shell/permissions/shared'

/**
 * Server-only input for semantic enrichment: role snapshot + **WorkSession**
 * (`WorkenOsSession` — actor, workspace, durable session id) plus domain and optional object.
 */
export type ShellSemanticEnrichmentInput = {
  permissions: PermissionSnapshot | null
  domainId: string
  domainTitle: string
  /**
   * Shell session from {@link resolveShellSession} (README: WorkSession hub).
   * Drives `actor.*` and `env.sessionId` / `env.workspace` in `EvaluationContext`.
   */
  shellSession?: WorkenOsSession | null
  object?: Record<string, unknown>
  env?: Record<string, unknown>
  time?: string | number
  bindings?: DataBindingPlan
}
