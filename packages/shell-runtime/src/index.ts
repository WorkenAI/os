/**
 * Shared shell runtime: Worken OS session contracts + semantic Spec enrichment (`@worken/dsl`).
 */
export * from './contract.js'
export type { ShellPermissionSnapshot, ShellSemanticEnrichmentInput } from './shell-semantic-input.js'
export { buildShellEvaluationContext } from './evaluation-context.js'
export { enrichShellSpec } from './enrich-spec.js'
export {
  createLocalShellSession,
  defaultLocalShellIdentity,
  type LocalShellIdentity,
} from './local-session.js'
