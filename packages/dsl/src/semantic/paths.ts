import type { EvaluationContext, SemanticPath } from './types.js'

const ROOT = 'semantic' as const

function getNested(record: Record<string, unknown>, keys: string[]): unknown {
  let current: unknown = record
  for (const key of keys) {
    if (current == null || typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[key]
  }
  return current
}

/**
 * Read a value from the evaluation context using semantic path notation
 * (`object.field`, `actor.id`, `env.workspaceId`, `time`, `input.x`).
 */
export function getSemanticValue(ctx: EvaluationContext, path: SemanticPath): unknown {
  const segments = path.split('.').filter((s) => s.length > 0)
  if (segments.length === 0) return undefined
  const head = segments[0]
  const tail = segments.slice(1)

  if (head === 'actor') return tail.length === 0 ? ctx.actor : getNested(ctx.actor, tail)
  if (head === 'object') return tail.length === 0 ? ctx.object : getNested(ctx.object, tail)
  if (head === 'env') return tail.length === 0 ? ctx.env : getNested(ctx.env, tail)
  if (head === 'time') return tail.length === 0 ? ctx.time : undefined
  if (head === 'input') {
    const input = ctx.input ?? {}
    return tail.length === 0 ? input : getNested(input, tail)
  }
  return undefined
}

/**
 * JSON Pointer into {@link seedSemanticState} payload (`/semantic/...`).
 */
export function semanticPathToStatePointer(path: SemanticPath): string {
  const segments = path.split('.').filter((s) => s.length > 0)
  if (segments.length === 0) return `/${ROOT}`
  if (segments[0] === 'time' && segments.length === 1) {
    return `/${ROOT}/time`
  }
  return `/${ROOT}/${segments.join('/')}`
}
