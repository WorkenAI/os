/**
 * Semantic Spec enrichment — **server only** (WorkSession + role → `@worken/dsl` → `Spec.state`).
 * Implementation lives in `@worken/shell-runtime`; this barrel preserves `@/shell/server/semantic` imports.
 */
export type { ShellSemanticEnrichmentInput } from '@worken/shell-runtime'
export { buildShellEvaluationContext, enrichShellSpec } from '@worken/shell-runtime'
