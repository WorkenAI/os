import type { Spec } from '@json-render/core'
import { buildEnrichedSpec } from '@worken/dsl'
import { buildShellEvaluationContext } from './evaluation-context.js'
import type { ShellSemanticEnrichmentInput } from './shell-semantic-input.js'

/**
 * Merges WorkSession-backed semantic state into a json-render `Spec`.
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
