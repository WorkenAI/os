import { setByPath } from '@json-render/core'
import type { EvaluationContext } from '../semantic/types.js'
import { getSemanticValue } from '../semantic/paths.js'
import { seedSemanticState } from '../semantic/state.js'
import type { DataBindingPlan } from './types.js'

function assertJsonPointer(p: string): void {
  if (!p.startsWith('/')) {
    throw new Error(`Data binding target must be a JSON Pointer starting with "/": got "${p}"`)
  }
}

/**
 * Merge {@link seedSemanticState} with explicit bindings into one state tree
 * suitable for `Spec.state`.
 */
export function applyDataBindings(
  ctx: EvaluationContext,
  plan?: DataBindingPlan | undefined,
): Record<string, unknown> {
  const state = seedSemanticState(ctx) as Record<string, unknown>
  if (!plan?.rules.length) return state

  for (const rule of plan.rules) {
    assertJsonPointer(rule.to)
    const value = getSemanticValue(ctx, rule.from)
    const resolved = value === undefined ? rule.ifUndefined : value
    setByPath(state, rule.to, resolved)
  }
  return state
}
