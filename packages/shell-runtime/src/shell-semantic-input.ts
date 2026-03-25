import type { DataBindingPlan } from '@worken/dsl'
import type { WorkenOsSession } from './contract.js'

/**
 * Minimal role snapshot for {@link buildShellEvaluationContext}.
 * Host apps may pass richer permission types if they are structurally compatible.
 */
export type ShellPermissionSnapshot = {
  id: string
  name: string
  description: string
  emoji: string
  color: string
  /** Opaque per host — evaluation uses id/name/emoji only today. */
  domains?: Record<string, unknown>
}

/**
 * Input for semantic enrichment: role snapshot + WorkSession + domain + optional object.
 */
export type ShellSemanticEnrichmentInput = {
  permissions: ShellPermissionSnapshot | null
  domainId: string
  domainTitle: string
  shellSession?: WorkenOsSession | null
  object?: Record<string, unknown>
  env?: Record<string, unknown>
  time?: string | number
  bindings?: DataBindingPlan
}
