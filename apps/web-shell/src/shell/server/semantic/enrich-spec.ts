import type { Spec } from '@json-render/core'
import { buildEnrichedSpec } from '@worken/dsl'
import { buildShellEvaluationContext } from './evaluation-context'
import type { ShellSemanticEnrichmentInput } from './shell-semantic-input'

/**
 * Server-only: merges WorkSession-backed semantic state into a json-render `Spec`.
 * Call only from API routes / server orchestration after `resolveShellSession`.
 */
export function enrichShellSpec(
  spec: Spec | null,
  input: ShellSemanticEnrichmentInput,
): Spec | null {
  if (!spec) return null
  const { bindings, ...rest } = input
  const ctx = buildShellEvaluationContext(rest)
  return buildEnrichedSpec(spec, ctx, {
    mode: 'state-ref',
    ...(bindings !== undefined ? { bindings } : {}),
  })
}
