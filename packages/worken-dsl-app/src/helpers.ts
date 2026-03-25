import type { SemanticPath } from '@worken/dsl'

/**
 * Semantic path under `object` for this process (dot notation).
 * Use in bindings and templates instead of string literals.
 */
export function objectPath(...segments: string[]): SemanticPath {
  if (segments.length === 0) return 'object'
  return `object.${segments.join('.')}`
}

/**
 * Semantic path under `actor`.
 */
export function actorPath(...segments: string[]): SemanticPath {
  if (segments.length === 0) return 'actor'
  return `actor.${segments.join('.')}`
}

/**
 * Semantic path under `env`.
 */
export function envPath(...segments: string[]): SemanticPath {
  if (segments.length === 0) return 'env'
  return `env.${segments.join('.')}`
}

/**
 * JSON Pointer target for Spec.state (must start with `/`).
 */
export function stateSlot(...segments: string[]): string {
  const tail = segments.map((s) => s.replace(/~/g, '~0').replace(/\//g, '~1')).join('/')
  return `/${tail}`
}
