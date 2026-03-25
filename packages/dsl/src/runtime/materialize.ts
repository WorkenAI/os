import type { Spec } from '@json-render/core'
import type { EvaluationContext } from '../semantic/types.js'
import { getSemanticValue, semanticPathToStatePointer } from '../semantic/paths.js'
import { applyDataBindings } from '../binding/apply.js'
import type { DataBindingPlan } from '../binding/types.js'

export const SEMANTIC_DYNAMIC_KEY = '$semantic' as const

export type SemanticDynamic = {
  [SEMANTIC_DYNAMIC_KEY]: string
}

export function isSemanticDynamic(value: unknown): value is SemanticDynamic {
  return (
    typeof value === 'object' &&
    value !== null &&
    SEMANTIC_DYNAMIC_KEY in value &&
    typeof (value as SemanticDynamic)[SEMANTIC_DYNAMIC_KEY] === 'string'
  )
}

export type MaterializeMode = 'state-ref' | 'literal'

/**
 * Walks a JSON tree and resolves `{ $semantic: "object.status" }` markers:
 * - `state-ref` → `{ $state: "/semantic/object/status" }` (json-render dynamic)
 * - `literal` → concrete value from `EvaluationContext` (fully resolved IR)
 */
export function materializeSemanticDynamicValue(
  value: unknown,
  ctx: EvaluationContext,
  mode: MaterializeMode,
): unknown {
  if (Array.isArray(value)) {
    return value.map((v) => materializeSemanticDynamicValue(v, ctx, mode))
  }
  if (isSemanticDynamic(value)) {
    const path = value[SEMANTIC_DYNAMIC_KEY]
    if (mode === 'state-ref') {
      return { $state: semanticPathToStatePointer(path) }
    }
    return getSemanticValue(ctx, path)
  }
  if (isPlainObject(value)) {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value)) {
      out[k] = materializeSemanticDynamicValue(v, ctx, mode)
    }
    return out
  }
  return value
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function deepMapElementProps(
  props: Record<string, unknown>,
  ctx: EvaluationContext,
  mode: MaterializeMode,
): Record<string, unknown> {
  return materializeSemanticDynamicValue(props, ctx, mode) as Record<string, unknown>
}

/**
 * Produces a json-render {@link Spec}: merges semantic state, optional
 * extra bindings, then resolves `$semantic` in every element `props` tree.
 */
export function buildEnrichedSpec(
  template: Spec,
  ctx: EvaluationContext,
  options?: {
    bindings?: DataBindingPlan
    mode?: MaterializeMode
  },
): Spec {
  const mode = options?.mode ?? 'state-ref'
  const mergedState = applyDataBindings(ctx, options?.bindings)
  const baseState = (template.state ?? {}) as Record<string, unknown>
  const state: Record<string, unknown> = { ...baseState, ...mergedState }

  const elements: Spec['elements'] = {}
  for (const [key, el] of Object.entries(template.elements)) {
    elements[key] = {
      ...el,
      props: deepMapElementProps(el.props as Record<string, unknown>, ctx, mode),
    }
  }

  return {
    root: template.root,
    elements,
    state,
  }
}
