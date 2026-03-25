import type { EvaluationContext } from './types.js'

const ROOT = 'semantic' as const

/**
 * Seeds json-render `Spec.state` with protocol namespaces under `semantic`
 * so components can bind via `{ $state: "/semantic/object/status" }`.
 */
export function seedSemanticState(ctx: EvaluationContext): Record<string, unknown> {
  return {
    [ROOT]: {
      actor: { ...ctx.actor },
      object: { ...ctx.object },
      env: { ...ctx.env },
      time: ctx.time,
      input: ctx.input ? { ...ctx.input } : {},
    },
  }
}
